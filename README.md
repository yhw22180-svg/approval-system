# 📋 전자결재 시스템 설치 및 운영 가이드

> 프로그램을 처음 다루는 분도 이 가이드를 따라하시면 설치할 수 있습니다.

---

## 📦 사전 준비물 (설치 필요 프로그램)

### 1. Python 설치
1. 웹 브라우저에서 **https://www.python.org/downloads/** 접속
2. 노란색 "Download Python 3.x.x" 버튼 클릭
3. 다운로드된 파일 실행
4. ⭐ **중요**: 설치 화면에서 **"Add Python to PATH"** 체크박스를 반드시 체크!
5. "Install Now" 클릭

### 2. Node.js 설치
1. 웹 브라우저에서 **https://nodejs.org** 접속
2. "LTS" 버전 다운로드 클릭 (왼쪽 버튼)
3. 다운로드된 파일 실행 → 계속 "다음" 클릭

---

## 🚀 설치 방법 (단계별)

### 1단계: 폴더 압축 풀기
다운로드한 ZIP 파일을 원하는 위치에 압축 해제합니다.  
예: `C:\전자결재시스템\`

### 2단계: 자동 설치
`전자결재시스템` 폴더 안에서 **`install.bat`** 파일을 **더블클릭**합니다.

검은 창이 열리고 자동으로 설치가 진행됩니다. (5~10분 소요)

```
✅ 성공 메시지가 나오면 설치 완료
```

### 3단계: 서버 실행
**`start.bat`** 파일을 **더블클릭**합니다.

2개의 검은 창이 열리고, 브라우저가 자동으로 열립니다.

### 4단계: 첫 번째 계정 만들기
1. 브라우저에서 `http://localhost:3000` 접속
2. "회원가입" 클릭
3. 정보 입력 후 가입

> ⭐ **첫 번째로 가입한 계정이 자동으로 관리자(admin)가 됩니다!**

---

## 🖥️ 기본 사용법

### 문서 작성
1. 왼쪽 메뉴에서 "문서 작성" 클릭
2. 문서 유형, 제목, 내용 입력
3. 결재라인 설정 (결재자 선택)
4. "결재 요청" 버튼 클릭

### 결재 처리
1. 왼쪽 메뉴에서 "결재 대기함" 클릭
2. 결재할 문서 클릭
3. 내용 확인 후 "승인" 또는 "반려" 클릭

### 관리자 기능
- **회원 관리**: 전체 직원 목록 확인, 권한 변경, 비밀번호 초기화
- **결재라인 관리**: 회사 결재라인 템플릿 생성/수정
- **전체 문서**: 회사 전체 결재 문서 조회

---

## 🌐 외부에서 접속하는 방법 (재택근무 등)

집이나 외부에서도 접속하려면 아래 3가지를 설정해야 합니다.

### 방법 1: 포트 포워딩 (공유기 설정)

1. **내 PC IP 확인**
   - 시작 메뉴 → 검색창에 "cmd" 입력 → 엔터
   - 검은 창에 `ipconfig` 입력 → 엔터
   - "IPv4 주소" 항목의 숫자 확인 (예: 192.168.1.100)

2. **공유기 관리 페이지 접속**
   - 브라우저 주소창에 `192.168.0.1` 또는 `192.168.1.1` 입력
   - 공유기 관리자 페이지 로그인 (기본 ID/PW는 admin/admin)

3. **포트 포워딩 설정**
   - "포트 포워딩" 또는 "NAT" 메뉴 찾기
   - 아래 2개 규칙 추가:
   
   | 외부 포트 | 내부 IP | 내부 포트 |
   |---------|---------|---------|
   | 8000 | 192.168.1.100 | 8000 |
   | 3000 | 192.168.1.100 | 3000 |

4. **외부 IP 확인**
   - 브라우저에서 https://whatismyip.com 접속
   - 숫자로 된 IP 주소 확인 (예: 123.456.789.0)

5. **외부 접속 주소**
   - `http://123.456.789.0:3000` 으로 접속

---

### 방법 2: 무료 도메인 + SSL 설정 (권장)

외부 IP는 자주 바뀌므로, 고정 도메인을 사용하는 것이 편리합니다.

#### DDNS 서비스 사용 (무료)

1. **Duck DNS** (https://www.duckdns.org) 접속
2. 무료 도메인 생성 (예: `mycompany.duckdns.org`)
3. Windows에서 자동 IP 업데이트 설정

#### SSL 인증서 (HTTPS) - Cloudflare Tunnel 사용 (무료)

1. https://cloudflare.com 에서 무료 계정 생성
2. "Zero Trust" → "Tunnels" 메뉴
3. 새 터널 생성 → 컴퓨터에 프로그램 설치
4. 도메인 연결

이 방법을 사용하면 `https://결재.회사이름.com` 같은 주소로 접속 가능합니다.

---

### 방법 3: Nginx 리버스 프록시 (고급)

```nginx
# /etc/nginx/sites-available/approval
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

---

## 📧 이메일 알림 설정 방법

이메일 알림을 사용하려면 Gmail 앱 비밀번호가 필요합니다.

### Gmail 앱 비밀번호 발급 방법

1. **Google 계정** 접속 → https://myaccount.google.com
2. **보안** 탭 클릭
3. **2단계 인증** 활성화 (되어있지 않으면 먼저 설정)
4. **앱 비밀번호** 클릭
5. 앱 선택: "메일", 기기 선택: "Windows 컴퓨터"
6. **생성** 클릭 → 16자리 비밀번호 복사

### .env 파일 수정

`backend/.env` 파일을 메모장으로 열어서 수정:

```
MAIL_USERNAME=여러분의이메일@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx  ← 위에서 발급한 16자리
MAIL_FROM=여러분의이메일@gmail.com
```

파일 저장 후 서버 재시작하면 이메일 발송이 활성화됩니다.

---

## 🗄️ 데이터베이스 변경 (선택사항)

### 기본값: SQLite
별도 설치 없이 바로 사용 가능합니다. `backend/approval_system.db` 파일에 저장됩니다.

### MySQL 사용 시

1. MySQL 설치 (https://dev.mysql.com/downloads/)
2. 데이터베이스 생성:
   ```sql
   CREATE DATABASE approval_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. `backend/.env` 파일 수정:
   ```
   DATABASE_URL=mysql+pymysql://root:비밀번호@localhost:3306/approval_db
   ```
4. 서버 재시작

---

## 🔒 보안 설정 (중요!)

배포 전 반드시 아래 설정을 변경하세요.

`backend/.env` 파일:
```
# ⚠️ 반드시 변경! 복잡한 랜덤 문자열로 교체하세요
SECRET_KEY=여기에아주복잡한문자열을넣으세요1234!@#$ABCD...
```

Python으로 랜덤 키 생성:
```python
import secrets
print(secrets.token_hex(32))
```

---

## ❓ 자주 묻는 질문

**Q: 서버를 껐다가 다시 켜려면?**  
A: `start.bat` 을 다시 실행하면 됩니다.

**Q: 비밀번호를 잊었어요**  
A: 관리자가 회원 관리에서 "비밀번호 초기화"를 클릭하면 임시 비밀번호(`Change1234!`)로 초기화됩니다.

**Q: 첨부파일은 어디에 저장되나요?**  
A: `backend/uploads/` 폴더에 저장됩니다. 이 폴더는 백업 필수입니다.

**Q: 데이터 백업은 어떻게 하나요?**  
A: SQLite 사용 시 `backend/approval_system.db` 파일을 복사하면 됩니다.

**Q: 포트를 변경하고 싶어요**  
A: `start.bat`에서 `--port 8000` 부분을 원하는 포트로 변경하고, `frontend/vite.config.js`의 proxy target도 같이 변경하세요.

---

## 📞 시스템 정보

| 항목 | 값 |
|-----|---|
| 백엔드 서버 | http://localhost:8000 |
| 프론트엔드 | http://localhost:3000 |
| API 문서 | http://localhost:8000/docs |
| 기본 포트 | 8000 (백엔드), 3000 (프론트엔드) |
| 데이터베이스 | SQLite (기본) / MySQL / PostgreSQL |
| 파일 저장 위치 | backend/uploads/ |

---

*전자결재 시스템 v1.0 | Python FastAPI + React*
