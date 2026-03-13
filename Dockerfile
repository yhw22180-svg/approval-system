FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y nodejs npm

# 1. 백엔드 설치 (변경된 requirements.txt 반영)
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

# 3. 파일 정리 및 실행
COPY . .
RUN rm -rf backend/static && mkdir -p backend/static && \
    cp -r frontend/dist/* backend/static/ || true

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app"
EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]