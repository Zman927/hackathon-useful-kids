from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.core.storage import STATIC_ROOT
from app.database import AsyncSessionLocal, Base, engine
from app.init_db import seed_initial_data
from app.routers import assistant, auth, student


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)

    yield


app = FastAPI(
    title="대학 기자재 대여 및 관리 서비스",
    description="학과별 기자재 대여/반납/승인 관리를 위한 백엔드 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory=STATIC_ROOT), name="static")

app.include_router(auth.router)
app.include_router(assistant.router)
app.include_router(student.router)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
