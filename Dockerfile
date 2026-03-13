# 1. 환경 설정
FROM python:3.11-slim
WORKDIR /app

# 필수 도구 설치
RUN apt-get update && apt-get install -y nodejs npm

# 2. 백엔드 패키지 미리 설치 (캐시 활용)
COPY backend/requirements.txt ./backend/
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r backend/requirements.txt

# 3. 프론트엔드 빌드
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
# 권한 부여 후 빌드
RUN chmod -R +x frontend/node_modules/.bin/ && \
    cd frontend && npm run build

# 4. 전체 파일 복사 및 정리
COPY . .
# 빌드 결과물을 backend/static으로 확실히 이동
RUN rm -rf backend/static && mkdir -p backend/static && \
    cp -r frontend/dist/* backend/static/ || true

# 5. 실행 설정
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app"
EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]