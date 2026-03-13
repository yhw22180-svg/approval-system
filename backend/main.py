from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
import models

Base.metadata.create_all(bind=engine)
os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)

app = FastAPI(
    title="전자결재 시스템 API",
    description="회사 내부 전자결재 시스템",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.auth_router import router as auth_router
from routers.users import router as users_router
from routers.documents import router as documents_router
from routers.approval_lines import router as approval_lines_router
from routers.notifications import router as notifications_router

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(documents_router)
app.include_router(approval_lines_router)
app.include_router(notifications_router)

@app.get("/health")
def health():
    return {"status": "ok"}

# --- 화면(Frontend) 서빙 설정 ---
# 현재 위치의 'static' 폴더를 바라보게 합니다.
STATIC_PATH = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(STATIC_PATH):
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(STATIC_PATH, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "서버 실행 중",
            "warning": "화면 폴더(static) 없음",
            "path": STATIC_PATH
        }