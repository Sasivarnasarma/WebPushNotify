from datetime import timezone
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler(timezone=timezone.utc)
