from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="기자재 대여 플랫폼 API")

# 개발 단계 — 배포하지 않고 Tailscale로만 연결하므로 origin을 전부 허용한다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


# 라우터는 여기에 등록한다. api/ 아래에 라우터 파일을 추가하면서 함께 추가할 것.
# from app.api import equipment, rental
# app.include_router(equipment.router)
# app.include_router(rental.router)
