from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
sys.path.insert(0, BASE_DIR)

load_dotenv()

try:
    from database import engine, Base
    import models
    Base.metadata.create_all(bind=engine)
    print("DB 초기화 성공")
except Exception as e:
    print(f"DB 초기화 알림: {e}")

app = FastAPI(title="전자결재 시스템")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
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
    print("라우터 등록 성공")
except Exception as e:
    print(f"라우터 등록 실패: {e}")

@app.get("/health")
def health():
    return {"status": "ok"}

STATIC_PATH = os.path.join(BASE_DIR, "static")
ASSETS_PATH = os.path.join(STATIC_PATH, "assets")

if os.path.exists(STATIC_PATH):
    if os.path.exists(ASSETS_PATH):
        app.mount("/assets", StaticFiles(directory=ASSETS_PATH), name="assets")
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path in ["docs", "redoc", "openapi.json", "health"]:
            return None
        return FileResponse(os.path.join(STATIC_PATH, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "Backend is running, but Frontend build not found."}