from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys
from dotenv import load_dotenv

# 1. DB 인식 오류 해결: 현재 backend 폴더를 파이썬 경로에 강제로 추가합니다.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

load_dotenv()

# DB 초기화 (이제 database.py를 정상적으로 찾습니다)
try:
    from database import engine, Base
    import models
    Base.metadata.create_all(bind=engine)
    print("DB 초기화 성공")
except Exception as e:
    print(f"DB 초기화 알림: {e}")

app = FastAPI(title="전자결재 시스템")

@app.get("/health")
def health():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
try:
    from routers.auth_router import router as auth_router
    app.include_router(auth_router)
    # 필요시 다른 라우터들도 여기에 추가하세요.
except Exception as e:
    print(f"라우터 연결 알림: {e}")

# --- 2. 하얀 화면(백지) 오류 해결 ---
STATIC_PATH = os.path.join(BASE_DIR, "static")
ASSETS_PATH = os.path.join(STATIC_PATH, "assets") # 리액트가 뱉어내는 핵심 파일 폴더

if os.path.exists(STATIC_PATH):
    # 브라우저가 /assets/... 경로로 JS/CSS를 요청할 때 정상적으로 파일을 내어주도록 허용합니다.
    if os.path.exists(ASSETS_PATH):
        app.mount("/assets", StaticFiles(directory=ASSETS_PATH), name="assets")

    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # API 요청이 아닐 때만 무조건 index.html을 반환합니다.
        if full_path.startswith("api") or full_path in ["docs", "redoc", "openapi.json", "health"]:
            return None
        return FileResponse(os.path.join(STATIC_PATH, "index.html"))
else:
    @app.get("/")
    def root():
        return {"error": "Frontend build files not found"}