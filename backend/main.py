from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

load_dotenv()

# DB 초기화
try:
    from database import engine, Base
    import models
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"DB 연결 알림: {e}")

os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)

app = FastAPI(title="전자결재 시스템 API")

# Railway 헬스체크용
@app.get("/health")
def health():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 로드 (기존 라우터들을 모두 포함하세요)
from routers.auth_router import router as auth_router
app.include_router(auth_router)

# --- [핵심] 화면 파일 연결 설정 ---
# 1. 현재 파일의 위치를 기준으로 static 폴더의 절대 경로를 계산합니다.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_PATH = os.path.join(BASE_DIR, "static")

# 2. static 폴더가 실제로 존재하는지 로그에 출력 (Railway 로그에서 확인 가능)
print(f"Checking static files at: {STATIC_PATH}")
print(f"Directory exists: {os.path.exists(STATIC_PATH)}")

if os.path.exists(STATIC_PATH):
    # JS, CSS 파일을 위한 설정
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

    # 나머지 모든 경로는 index.html을 보여줍니다.
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # API 경로(/docs, /health 등)가 아닌 경우에만 index.html 반환
        if full_path.startswith("api") or full_path in ["docs", "openapi.json", "health"]:
            return None 
        return FileResponse(os.path.join(STATIC_PATH, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "error": "Static folder missing",
            "looked_at": STATIC_PATH,
            "message": "프론트엔드 빌드 파일이 backend/static 폴더에 없습니다."
        }