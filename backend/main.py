from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

load_dotenv()

try:
    from database import engine, Base
    import models
    Base.metadata.create_all(bind=engine)
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

# 라우터 등록 (기존 라우터 경로에 맞춰 수정 필요할 수 있음)
try:
    from routers.auth_router import router as auth_router
    app.include_router(auth_router)
except ImportError:
    pass

# --- 정적 파일 연결 ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_PATH = os.path.join(BASE_DIR, "static")

if os.path.exists(STATIC_PATH) and os.path.exists(os.path.join(STATIC_PATH, "index.html")):
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # API 및 문서 경로는 제외
        if full_path.startswith("api") or full_path in ["docs", "redoc", "openapi.json", "health"]:
            return None
        return FileResponse(os.path.join(STATIC_PATH, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "status": "Running", 
            "error": "Frontend files not found", 
            "path": STATIC_PATH,
            "contents": os.listdir(STATIC_PATH) if os.path.exists(STATIC_PATH) else "None"
        }