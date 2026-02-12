import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


ADMIN_SECRET = os.getenv("ADMIN_SECRET", "change-me")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "mailto:admin@example.com")
VAPID_TTL = int(os.getenv("VAPID_TTL", 259200))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
VERSION = "1.0.0"
