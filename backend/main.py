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

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "../frontend/dist")

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "전자결재 시스템 API 서버 실행 중", "docs": "/docs"}