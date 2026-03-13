from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys
from dotenv import load_dotenv

# 1. 경로 설정: 현재 파일의 위치를 기준으로 폴더 정의
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # /app/backend
PROJECT_ROOT = os.path.dirname(BASE_DIR)              # /app
sys.path.append(BASE_DIR)

load_dotenv()

# DB 초기화
try:
    from database import engine, Base
    import models
    Base.metadata.create_all(bind=engine)
    print("DB 초기화 성공")
except Exception as e:
    print(f"DB 초기화 알림: {e}")

app = FastAPI(title="전자결재 시스템")

# 2. CORS 설정 (프론트-백엔드 통신 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. 라우터 등록 (prefix 확인)
try:
    from routers.auth_router import router as auth_router
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
except Exception as e:
    print(f"라우터 연결 알림: {e}")

@app.get("/health")
def health():
    return {"status": "ok"}

# 4. 정적 파일 및 프론트엔드 연결 (Vite 빌드 대응)
# 리액트 빌드 파일이 backend/static 안에 있다고 가정합니다.
STATIC_PATH = os.path.join(BASE_DIR, "static")
ASSETS_PATH = os.path.join(STATIC_PATH, "assets")

if os.path.exists(STATIC_PATH):
    # /assets 경로로 들어오는 JS/CSS 요청을 처리
    if os.path.exists(ASSETS_PATH):
        app.mount("/assets", StaticFiles(directory=ASSETS_PATH), name="assets")
    
    # 나머지 정적 파일 처리
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

    # 모든 경로에 대해 index.html을 반환 (SPA 설정)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # API나 시스템 경로는 제외
        if full_path.startswith("api") or full_path in ["docs", "redoc", "openapi.json", "health"]:
            return None
        return FileResponse(os.path.join(STATIC_PATH, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "Backend is running, but Frontend build not found."}