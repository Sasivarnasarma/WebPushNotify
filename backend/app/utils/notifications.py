import base64
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict

from apscheduler.schedulers.background import BackgroundScheduler
from cryptography.hazmat.primitives import serialization
from py_vapid import Vapid, Vapid01
from pywebpush import WebPushException, webpush
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import VAPID_SUBJECT, VAPID_TTL
from ..core.database import SessionLocal
from ..core.models import Notification, Subscription, VapidKeys

logger = logging.getLogger(__name__)

_vapid_keys_cache = None


def get_cached_vapid_keys() -> Dict[str, str] | None:
    global _vapid_keys_cache
    if _vapid_keys_cache is None:
        _vapid_keys_cache = get_vapid_keys()
    return _vapid_keys_cache


def get_vapid_keys() -> Dict[str, str] | None:
    db = SessionLocal()
    try:
        vapid_keys = db.execute(select(VapidKeys)).scalar_one_or_none()
        if vapid_keys is None:
            return None
        return {
            "public_key": vapid_keys.public_key,
            "private_key": vapid_keys.private_key,
            "subject": vapid_keys.subject,
        }
    finally:
        db.close()


def generate_vapid_keys(db: Session) -> Dict[str, str]:
    db.query(VapidKeys).delete()
    db.query(Subscription).delete()

    vapid = Vapid01()
    vapid.generate_keys()

    public_key_bytes = vapid.public_key.public_bytes(
        encoding=serialization.Encoding.X962, format=serialization.PublicFormat.UncompressedPoint
    )
    public_key = base64.urlsafe_b64encode(public_key_bytes).decode("utf-8").rstrip("=")

    private_key = vapid.private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")

    vapid_keys = VapidKeys(public_key=public_key, private_key=private_key, subject=VAPID_SUBJECT)

    db.add(vapid_keys)
    db.commit()
    db.refresh(vapid_keys)

    global _vapid_keys_cache
    _vapid_keys_cache = {
        "public_key": vapid_keys.public_key,
        "private_key": vapid_keys.private_key,
        "subject": vapid_keys.subject,
    }

    logger.info("VAPID keys generated successfully.")
    return _vapid_keys_cache


def import_vapid_keys(db: Session, public_key: str, private_key: str) -> Dict[str, str]:
    db.query(VapidKeys).delete()
    db.query(Subscription).delete()

    vapid_keys = VapidKeys(public_key=public_key, private_key=private_key, subject=VAPID_SUBJECT)

    db.add(vapid_keys)
    db.commit()
    db.refresh(vapid_keys)

    global _vapid_keys_cache
    _vapid_keys_cache = {
        "public_key": vapid_keys.public_key,
        "private_key": vapid_keys.private_key,
        "subject": vapid_keys.subject,
    }

    logger.info("VAPID keys imported successfully.")
    return _vapid_keys_cache


def send_push_notification(notification_data: Dict[str, Any], db: Session) -> Dict[str, int]:
    subscriptions = db.execute(select(Subscription)).scalars().all()
    if not subscriptions:
        logger.info("No subscriptions found to send notification.")
        return {"sent": 0, "failed": 0}

    keys = get_cached_vapid_keys()
    vapid_obj = Vapid.from_pem(keys["private_key"].encode("utf-8"))

    sent = 0
    failed = 0
    message_data = json.dumps(notification_data)

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=message_data,
                vapid_private_key=vapid_obj,
                vapid_claims={"sub": keys["subject"]},
                ttl=VAPID_TTL,
            )
            sent += 1
        except WebPushException as exc:
            logger.error(f"WebPush Error for {sub.endpoint[:30]}...: {exc}")
            failed += 1
            resp_status = getattr(exc.response, "status_code", None)
            if resp_status in {403, 404, 410}:
                logger.info(f"Removing invalid subscription: {sub.endpoint[:30]}... (Status: {resp_status})")
                db.delete(sub)

    db.commit()
    logger.info(f"Notification sent: {sent} successful, {failed} failed.")
    return {"sent": sent, "failed": failed}


def perform_resilience_check(db: Session, scheduler: BackgroundScheduler):
    try:
        now_utc = datetime.now(timezone.utc)
        logger.info(f"Resilience Check: Checking for pending jobs after {now_utc}")

        pending_notifications = (
            db.query(Notification).filter(Notification.status == "pending", Notification.send_date > now_utc).all()
        )

        count = len(pending_notifications)
        logger.info(f"Resilience: Found {count} pending notifications to reschedule.")

        for n in pending_notifications:
            if not n.send_date:
                continue

            from ..api.admin import send_notification_job

            run_date = n.send_date.replace(tzinfo=timezone.utc)

            scheduler.add_job(
                send_notification_job, "date", run_date=run_date, args=[n.id], id=str(n.id), replace_existing=True
            )
            logger.info(f"Resilience: Rescheduled notification {n.id} for {run_date}")

    except Exception:
        logger.exception("Rescheduling Error")
