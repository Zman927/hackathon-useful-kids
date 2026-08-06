from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.storage import STATIC_ROOT
from app.core.database import AsyncSessionLocal, Base, engine
from app.init_db import seed_initial_data
from app.api import auth, departments, equipment, rentals


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

# 개발 단계 — 배포하지 않고 Tailscale로만 연결하므로 origin을 전부 허용한다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_ROOT), name="static")

app.include_router(auth.router)
app.include_router(equipment.router)
app.include_router(rentals.router)
app.include_router(departments.router)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
