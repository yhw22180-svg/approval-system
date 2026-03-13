@echo off
chcp 65001 >nul
echo.
echo [프론트엔드] 배포용 빌드 생성 중...
cd frontend
call npm run build
echo [완료] frontend/dist 폴더에 빌드 파일이 생성되었습니다.
cd ..

echo.
echo [안내] 이제 backend/main.py에 정적 파일 서빙을 추가하면
echo        백엔드 서버 하나로 모든 것을 서비스할 수 있습니다.
echo.
pause
