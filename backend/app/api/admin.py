import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import ADMIN_SECRET
from ..core.database import SessionLocal, get_db
from ..core.models import Notification, Subscription
from ..core.scheduler import scheduler
from ..core.schemas import (
    AdminHistoryIn,
    AdminImportKeysIn,
    AdminImportSubscribersIn,
    AdminLoginIn,
    AdminSendIn,
    NotificationOut,
    SubscriberOut,
)
from ..utils.notifications import generate_vapid_keys, get_cached_vapid_keys
from ..utils.notifications import import_vapid_keys as service_import_vapid_keys
from ..utils.notifications import send_push_notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login")
def admin_login(payload: AdminLoginIn) -> dict[str, str]:
    if payload.secret != ADMIN_SECRET:
        logger.warning("Admin login failed: Invalid secret")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")
    logger.info("Admin login successful")
    return {"status": "ok"}


@router.post("/keys")
def admin_get_keys(payload: AdminLoginIn) -> dict[str, str | None]:
    if payload.secret != ADMIN_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")

    keys = get_cached_vapid_keys()
    if not keys:
        return {"publicKey": None, "privateKey": None}

    return {"publicKey": keys["public_key"], "privateKey": keys["private_key"]}


@router.post("/keys/generate")
def admin_generate_keys(payload: AdminLoginIn, db: Session = Depends(get_db)) -> dict[str, str]:
    if payload.secret != ADMIN_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")

    logger.info("Admin generating new VAPID keys")
    keys = generate_vapid_keys(db)
    return {"publicKey": keys["public_key"], "privateKey": keys["private_key"]}


@router.post("/keys/upload")
def admin_upload_keys(payload: AdminImportKeysIn, db: Session = Depends(get_db)) -> dict[str, str]:
    if payload.secret != ADMIN_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")

    logger.info("Admin uploading VAPID keys")
    keys = service_import_vapid_keys(db, payload.publicKey, payload.privateKey)
    return {"publicKey": keys["public_key"], "privateKey": keys["private_key"]}


@router.post("/stats")
def admin_stats(payload: AdminLoginIn, db: Session = Depends(get_db)) -> dict[str, int]:
    if payload.secret != ADMIN_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")

    count = db.execute(select(Subscription)).scalars().all()
    return {"devices": len(count)}


@router.post("/send")
def admin_send(payload: AdminSendIn, db: Session = Depends(get_db)) -> dict[str, int]:
    if payload.secret != ADMIN_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")

    effective_date = payload.send_date or datetime.now(timezone.utc)

    notification = Notification(
        title=payload.title,
        body=payload.message,
        image_url=payload.image,
        send_date=effective_date,
        status="pending" if payload.send_date else "sent",
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    if payload.send_date:
        logger.info(f"Scheduling notification {notification.id} for {effective_date}")
        scheduler.add_job(
            send_notification_job, "date", run_date=effective_date, args=[notification.id], id=str(notification.id)
        )
        return {"sent": 0, "failed": 0}

    notification_data = {
        "title": payload.title,
        "body": payload.message,
        "image": payload.image,
        "url": f"/notification?id={notification.id}",
    }

    result = send_push_notification(notification_data, db)

    notification.successful_count = result["sent"]
    notification.failed_count = result["failed"]
    notification.status = "sent" if result["sent"] > 0 else "failed"
    db.commit()

    return result


@router.post("/notifications/{id}/send-now")
def admin_send_now(id: int, payload: AdminLoginIn, db: Session = Depends(get_db)):
    if payload.secret != ADMIN_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")

    notification = db.get(Notification, id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.status != "pending":
        return {"status": "ignored", "detail": "Notification is not pending"}

    logger.info(f"Force sending notification {id}")
    try:
        scheduler.remove_job(str(id))
    except Exception:
        pass
    send_notification_job(id)
    db.refresh(notification)

    return {
        "status": notification.status,
        "successful_count": notification.successful_count,
        "failed_count": notification.failed_count,
    }


@router.post("/notifications")
def admin_history(payload: AdminHistoryIn, db: Session = Depends(get_db)):
    if payload.secret != ADMIN_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")

    query = select(Notification)
    if payload.status and payload.status != "all":
        query = query.where(Notification.status == payload.status)

    total_count = len(db.execute(query).scalars().all())

    notifications = (
        db.execute(query.order_by(Notification.id.desc()).offset(payload.offset).limit(payload.limit)).scalars().all()
    )

    return {
        "notifications": [NotificationOut.model_validate(n) for n in notifications],
        "has_more": payload.offset + len(notifications) < total_count,
        "total": total_count,
    }


@router.post("/subscribers", response_model=list[SubscriberOut])
def admin_subscribers(payload: AdminLoginIn, db: Session = Depends(get_db)):
    if payload.secret != ADMIN_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")

    subscribers = db.execute(select(Subscription).order_by(Subscription.created_at.desc())).scalars().all()

    return subscribers


@router.post("/subscribers/import")
def admin_import_subscribers(payload: AdminImportSubscribersIn, db: Session = Depends(get_db)):
    if payload.secret != ADMIN_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")

    logger.info(f"Admin importing subscribers. Count: {len(payload.subscribers)}")
    count = 0
    for sub_data in payload.subscribers:
        exists = db.execute(select(Subscription).where(Subscription.endpoint == sub_data.endpoint)).scalar_one_or_none()

        if not exists:
            new_sub = Subscription(endpoint=sub_data.endpoint, p256dh=sub_data.p256dh, auth=sub_data.auth)
            db.add(new_sub)
            count += 1

    db.commit()
    logger.info(f"Imported {count} new subscribers")
    return {"message": f"Imported {count} new subscribers"}


def send_notification_job(notification_id: int):
    db: Session = SessionLocal()
    try:
        notification = db.get(Notification, notification_id)
        if not notification or notification.status != "pending":
            return

        logger.info(f"Job: Sending scheduled notification {notification_id}")
        notification_data = {
            "title": notification.title,
            "body": notification.body,
            "image": notification.image_url,
            "url": f"/notification?id={notification.id}",
        }

        result = send_push_notification(notification_data, db)

        notification.status = "sent" if result["sent"] > 0 else "failed"
        notification.successful_count = result["sent"]
        notification.failed_count = result["failed"]
        db.commit()
    except Exception:
        logger.exception(f"Error sending scheduled notification {notification_id}")
    finally:
        db.close()
