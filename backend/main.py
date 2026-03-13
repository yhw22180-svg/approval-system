from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

load_dotenv()

# DB 및 모델 초기화 (에러 방지를 위해 try-except 권장되나 기존 구조 유지)
try:
    from database import engine, Base
    import models
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"DB 초기화 오류 (무시하고 진행): {e}")

os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)

app = FastAPI(title="전자결재 시스템 API")

# 1. Healthcheck (Railway 배포 확인용 - 최상단 배치)
@app.get("/health")
def health():
    return {"status": "ok", "message": "server is healthy"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
try:
    from routers.auth_router import router as auth_router
    from routers.users import router as users_router
    from routers.documents import router as documents_router
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(documents_router)
except ImportError as e:
    print(f"라우터 로드 오류: {e}")

# 2. 정적 파일 및 화면 서빙
STATIC_PATH = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(STATIC_PATH):
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # API 경로(/health, /docs 등)가 아닐 때만 index.html 반환
        return FileResponse(os.path.join(STATIC_PATH, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "API Server Running", "warning": "Static folder missing"}