# 1. 빌드 환경 설정
FROM python:3.11-slim
WORKDIR /app

# 필수 도구 설치 (Node.js는 프론트엔드 빌드에 필요합니다)
RUN apt-get update && apt-get install -y nodejs npm

# 2. 백엔드 패키지 설치
COPY backend/requirements.txt ./backend/
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r backend/requirements.txt

# 3. 프론트엔드 빌드
# 권한 문제를 방지하기 위해 npx를 사용하여 vite 빌드를 진행합니다.
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npx vite build

# 4. 파일 정리 및 복사
# 빌드된 프론트엔드 파일(dist)을 백엔드가 인식할 수 있는 static 폴더로 복사합니다.
COPY . .
RUN mkdir -p backend/static && \
    cp -r frontend/dist/* backend/static/ || cp -r frontend/build/* backend/static/ || true

# 5. 실행 설정
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app"
EXPOSE 8080

# 'cd' 명령어 없이 직접 모듈 경로로 서버를 실행합니다.
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]