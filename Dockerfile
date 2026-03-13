FROM python:3.11-slim
WORKDIR /app

# 시스템 의존성 설치 (Node.js 포함)
RUN apt-get update && apt-get install -y nodejs npm

# 1. 백엔드 설치
COPY backend/requirements.txt ./backend/
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r backend/requirements.txt

# 2. 프론트엔드 빌드
COPY frontend/ ./frontend/
RUN cd frontend && \
    rm -rf node_modules package-lock.json && \
    npm install && \
    npm run build

# 3. 프로젝트 파일 전체 복사 및 정적 파일 배치
COPY . .
RUN rm -rf backend/static && mkdir -p backend/static && \
    cp -r frontend/dist/* backend/static/ || true

# 4. 환경 변수 및 경로 설정
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app"
EXPOSE 8080

# 5. 실행 명령 (cd를 사용하지 않고 직접 uvicorn 실행)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]