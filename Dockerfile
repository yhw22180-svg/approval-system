# 1. 빌드 환경
FROM python:3.11-slim
WORKDIR /app

# 필수 도구 설치
RUN apt-get update && apt-get install -y nodejs npm

# 2. 백엔드 설치
COPY backend/requirements.txt ./backend/
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r backend/requirements.txt

# 3. 프론트엔드 빌드 (권한 해결)
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npx vite build

# 4. 파일 정리 및 복사
COPY . .
RUN mkdir -p backend/static && \
    cp -r frontend/dist/* backend/static/ || cp -r frontend/build/* backend/static/ || true

# 5. 실행 환경 설정
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app"
EXPOSE 8080

# 직접 경로를 지정하여 uvicorn 실행
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]