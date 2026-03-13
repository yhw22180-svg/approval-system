FROM python:3.11-slim
WORKDIR /app

# Node.js 설치 (프론트엔드 빌드용)
RUN apt-get update && apt-get install -y nodejs npm

# 백엔드 설치
COPY backend/requirements.txt ./backend/
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r backend/requirements.txt

# 프론트엔드 설치 및 빌드
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 파일 정리 (프론트엔드 결과물을 백엔드로 복사)
COPY . .
RUN mkdir -p backend/static && \
    cp -r frontend/dist/* backend/static/ || cp -r frontend/build/* backend/static/ || true

ENV PATH="/opt/venv/bin:$PATH"
EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]