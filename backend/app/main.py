from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import admin, public
from .core.config import ALLOWED_ORIGINS
from .core.database import Base, SessionLocal, engine
from .core.scheduler import scheduler
from .utils.logger import setup_logging
from .utils.notifications import perform_resilience_check

setup_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Application starting up...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        perform_resilience_check(db, scheduler)
    finally:
        db.close()
    scheduler.start()
    yield
    scheduler.shutdown()
    logger.info("Application shutting down...")


app = FastAPI(title="Web Push Notify", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "WebPushNotify API"}


app.include_router(admin.router)
app.include_router(public.router)
