from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
import models

# 데이터베이스 테이블 생성 및 업로드 폴더 준비
Base.metadata.create_all(bind=engine)
os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)

app = FastAPI(
    title="전자결재 시스템 API",
    description="회사 내부 전자결재 시스템",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
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

# --- 이 부분이 화면을 띄워주는 핵심 수정 사항입니다 ---

# 현재 파일 위치를 기준으로 static 폴더 경로 설정
# Railway에서 빌드된 프론트엔드 파일들이 이 폴더로 복사됩니다.
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(STATIC_DIR):
    # static 폴더 내의 assets 등 정적 파일 연결
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    # 모든 경로로 접속했을 때 프론트엔드의 index.html을 보여줌
    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    # static 폴더가 없을 때만 API 안내 메시지 출력
    @app.get("/")
    def root():
        return {
            "message": "전자결재 시스템 API 서버 실행 중", 
            "docs": "/docs",
            "warning": "화면 파일(static)이 아직 준비되지 않았습니다."
        }