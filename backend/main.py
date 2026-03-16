from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys
from dotenv import load_dotenv

# 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

load_dotenv()

# DB 초기화
try:
    from database import engine, Base
    import models
    Base.metadata.create_all(bind=engine)
    print("DB 초기화 성공")
except Exception as e:
    print(f"DB 초기화 실패: {e}")

app = FastAPI(title="전자결재 시스템")

# CORS 설정 (모든 도메인 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  # 로그인 기능을 위해 True로 권장하지만, 환경에 맞게 조절하세요.
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
try:
    from routers.auth_router import router as auth_router
    from routers.users import router as users_router
    from routers.documents import router as documents_router
    from routers.approval_lines import router as approval_lines_router
    from routers.notifications import router as notifications_router

    # 각 라우터 등록
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

# 정적 파일 서빙 설정
STATIC_PATH = os.path.join(BASE_DIR, "static")
ASSETS_PATH = os.path.join(STATIC_PATH, "assets")

if os.path.exists(STATIC_PATH):
    # /assets 경로 우선 마운트
    if os.path.exists(ASSETS_PATH):
        app.mount("/assets", StaticFiles(directory=ASSETS_PATH), name="assets")
    
    # 그 외 정적 파일 폴더 마운트
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

    # 모든 GET 요청을 처리하여 React/Vite 라우팅 지원
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # 1. API 관련 경로인지 확인
        # routers/auth_router.py 등에서 설정한 prefix 기반으로 필터링합니다.
        # 만약 prefix가 없다면 실제 호출되는 API 주소의 첫 단어를 여기에 넣으세요.
        api_prefixes = ["auth", "users", "documents", "approval-lines", "notifications"]
        
        # 2. API 경로이거나 FastAPI 기본 경로라면 이 함수가 가로채지 않고 패스함
        if any(full_path.startswith(prefix) for prefix in api_prefixes) or \
           full_path in ["docs", "redoc", "openapi.json", "health"]:
            # 이 요청은 아래의 FileResponse를 타지 않고 실제 라우터로 가야 함
            # GET 요청임에도 불구하고 경로가 중복될 경우를 대비해 404를 던져 FastAPI가 다음 매칭을 찾게 함
            raise HTTPException(status_code=404)

        # 3. 그 외의 모든 GET 요청은 프론트엔드 index.html 반환 (SPA 라우팅)
        return FileResponse(os.path.join(STATIC_PATH, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "Backend is running, but Frontend build not found."}