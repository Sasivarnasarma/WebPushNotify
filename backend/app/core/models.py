from sqlalchemy import Column, DateTime, Integer, String, Text, func

from .database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String, unique=True, nullable=False)
    p256dh = Column(String, nullable=False)
    auth = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class VapidKeys(Base):
    __tablename__ = "vapid_keys"

    id = Column(Integer, primary_key=True, index=True)
    public_key = Column(Text, nullable=False)
    private_key = Column(Text, nullable=False)
    subject = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    send_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(String, default="sent", nullable=False)
    successful_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    views = Column(Integer, default=0, nullable=False)
