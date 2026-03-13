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

app = FastAPI(title="전자결재 시스템 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 생략 (기존대로 유지)
from routers.auth_router import router as auth_router
app.include_router(auth_router)
# ... 다른 라우터들도 여기에 포함 ...

# --- 화면 서빙 핵심 코드 ---
# Railway 빌드 시 생성되는 backend/static 폴더를 바라봅니다.
STATIC_PATH = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(STATIC_PATH):
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(STATIC_PATH, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "API Server Running", "static_path": STATIC_PATH}