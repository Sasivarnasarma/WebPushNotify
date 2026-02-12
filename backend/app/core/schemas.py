from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl, field_serializer, field_validator


class SubscriptionKeys(BaseModel):
    p256dh: str = Field(min_length=1)
    auth: str = Field(min_length=1)


class SubscriptionIn(BaseModel):
    endpoint: HttpUrl
    keys: SubscriptionKeys


class AdminLoginIn(BaseModel):
    secret: str = Field(min_length=1)


class AdminHistoryIn(BaseModel):
    secret: str = Field(min_length=1)
    limit: int = Field(default=10, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    status: str | None = Field(default=None)


class AdminSendIn(BaseModel):
    secret: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=100)
    message: str = Field(min_length=1, max_length=600)
    image: HttpUrl | None = Field(default=None)
    send_date: datetime | None = Field(default=None)

    @field_validator("send_date")
    @classmethod
    def validate_send_date(cls, v: datetime | None) -> datetime | None:
        return v


class AdminImportKeysIn(BaseModel):
    secret: str = Field(min_length=1)
    publicKey: str = Field(min_length=1)
    privateKey: str = Field(min_length=1)


class SubscriberImportItem(BaseModel):
    endpoint: HttpUrl
    p256dh: str = Field(min_length=1)
    auth: str = Field(min_length=1)


class AdminImportSubscribersIn(BaseModel):
    secret: str = Field(min_length=1)
    subscribers: list[SubscriberImportItem]


class NotificationOut(BaseModel):
    id: int
    title: str
    body: str
    image_url: str | None
    send_date: datetime
    status: str
    successful_count: int
    failed_count: int
    views: int

    @field_serializer("send_date")
    def serialize_datetime(self, value: datetime) -> str:
        if value:
            return value.strftime("%Y-%m-%dT%H:%M:%SZ")
        return None

    class Config:
        from_attributes = True


class SubscriberOut(BaseModel):
    id: int
    endpoint: str
    p256dh: str
    auth: str
    created_at: datetime

    class Config:
        from_attributes = True
