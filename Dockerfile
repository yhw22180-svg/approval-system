# 1. 빌드 환경 설정
FROM python:3.11-slim
WORKDIR /app

# 필수 도구 설치
RUN apt-get update && apt-get install -y nodejs npm

# 2. 백엔드 패키지 설치
COPY backend/requirements.txt ./backend/
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r backend/requirements.txt

# 3. 프론트엔드 빌드 (충돌 해결의 핵심)
# 먼저 폴더를 모두 복사합니다.
COPY frontend/ ./frontend/

# 사용자 컴퓨터에서 넘어온 윈도우용 폴더를 삭제하고, 리눅스 환경에서 새롭게 설치 후 빌드합니다.
RUN cd frontend && \
    rm -rf node_modules package-lock.json && \
    npm install && \
    npm run build

# 4. 전체 파일 복사 및 화면 파일(static) 셋업
COPY . .
RUN rm -rf backend/static && mkdir -p backend/static && \
    cp -r frontend/dist/* backend/static/ || true

# 5. 실행 환경 설정
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app"
EXPOSE 8080

# uvicorn 실행
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]