FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y nodejs npm

# 백엔드 설치
COPY backend/requirements.txt ./backend/
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r backend/requirements.txt

# 프론트엔드 빌드
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npx vite build

# 파일 정리 (프론트엔드 dist 폴더 내용을 backend/static으로 복사)
COPY . .
RUN mkdir -p backend/static && \
    cp -r frontend/dist/* backend/static/ || true

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app"
EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]