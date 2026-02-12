import pytz
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler(timezone=pytz.UTC)
