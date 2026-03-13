from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

# 설정 로드
load_dotenv()

from database import engine, Base
import models

# DB 테이블 생성 및 업로드 폴더 준비
Base.metadata.create_all(bind=engine)
os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)

app = FastAPI(
    title="전자결재 시스템 API",
    description="회사 내부 전자결재 시스템",
    version="1.0.0"
)

# CORS 설정 (프론트엔드와 통신 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
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

# 현재 파일(main.py) 위치를 기준으로 static 폴더 경로 설정
# 빌드된 결과물들이 이 폴더 안으로 들어오게 됩니다.
STATIC_PATH = os.path.join(os.path.dirname(__file__), "static")

# static 폴더가 존재하는 경우에만 정적 파일 연결
if os.path.exists(STATIC_PATH):
    # CSS, JS 등 정적 자산 연결
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

    # 사용자가 주소로 접속하면 index.html을 보여줌
    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(STATIC_PATH, "index.html"))
else:
    # 폴더가 없을 경우 안내 메시지 (디버깅용)
    @app.get("/")
    def root():
        return {
            "message": "전자결재 시스템 API 서버 실행 중",
            "warning": "화면 파일(static) 폴더를 찾을 수 없습니다. 빌드 설정을 확인하세요.",
            "expected_path": STATIC_PATH
        }