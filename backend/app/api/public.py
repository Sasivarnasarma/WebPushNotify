from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.models import Notification, Subscription
from ..core.schemas import NotificationOut, SubscriptionIn
from ..utils.notifications import get_cached_vapid_keys

router = APIRouter(tags=["public"])


@router.get("/vapid-public-key")
def vapid_public_key() -> dict[str, str | None]:
    keys = get_cached_vapid_keys()
    if not keys:
        return {"publicKey": None}
    return {"publicKey": keys["public_key"]}


@router.get("/version")
def version() -> dict[str, str]:
    from ..core.config import VERSION

    return {"version": VERSION}


@router.get("/notifications/{id}", response_model=NotificationOut)
def get_notification(id: int, db: Session = Depends(get_db)):
    notif = db.get(Notification, id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif


@router.post("/notifications/{id}/view")
def track_notification_view(id: int, db: Session = Depends(get_db)):
    notif = db.get(Notification, id)
    if notif:
        notif.views += 1
        db.commit()
    return {"status": "ok"}


@router.post("/subscribe")
def subscribe(payload: SubscriptionIn, db: Session = Depends(get_db)) -> dict[str, str]:
    existing = db.execute(select(Subscription).where(Subscription.endpoint == payload.endpoint)).scalar_one_or_none()
    if existing:
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
    else:
        db.add(
            Subscription(
                endpoint=payload.endpoint,
                p256dh=payload.keys.p256dh,
                auth=payload.keys.auth,
            )
        )
    db.commit()
    return {"status": "saved"}
