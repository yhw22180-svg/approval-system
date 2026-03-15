import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import threading
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", "")
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
COMPANY_NAME = os.getenv("COMPANY_NAME", "전자결재시스템")

def _send_email_thread(to_email: str, subject: str, body_html: str):
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{COMPANY_NAME} <{MAIL_FROM}>"
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html", "utf-8"))
        with smtplib.SMTP(MAIL_SERVER, MAIL_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.sendmail(MAIL_FROM, [to_email], msg.as_string())
        logger.info(f"이메일 발송 성공: {to_email}")
    except Exception as e:
        logger.error(f"이메일 발송 실패 ({to_email}): {e}")

def send_email(to_email: str, subject: str, body_html: str) -> bool:
    thread = threading.Thread(target=_send_email_thread, args=(to_email, subject, body_html), daemon=True)
    thread.start()
    return True

def send_approval_request_email(to_email: str, to_name: str, doc_title: str, doc_number: str, author_name: str, frontend_url: str = "http://localhost:3000"):
    subject = f"[{COMPANY_NAME}] 결재 요청 - {doc_title}"
    body = f"""
    <div style="font-family: 'Apple SD Gothic Neo', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align:center;">
            <h1 style="margin:0; font-size:20px;">📋 결재 요청</h1>
            <p style="margin:5px 0 0; opacity:0.8;">{COMPANY_NAME}</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="color:#374151; font-size:16px;"><strong>{to_name}</strong>님,</p>
            <p style="color:#6b7280;">결재를 요청하는 문서가 있습니다.</p>
            <table style="width:100%; border-collapse:collapse; margin:16px 0; background:white; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0;">
                <tr><td style="padding:12px 16px; background:#f1f5f9; color:#64748b; font-size:13px; width:120px;">문서 번호</td><td style="padding:12px 16px; color:#1e293b; font-weight:600;">{doc_number}</td></tr>
                <tr><td style="padding:12px 16px; background:#f1f5f9; color:#64748b; font-size:13px;">제목</td><td style="padding:12px 16px; color:#1e293b;">{doc_title}</td></tr>
                <tr><td style="padding:12px 16px; background:#f1f5f9; color:#64748b; font-size:13px;">작성자</td><td style="padding:12px 16px; color:#1e293b;">{author_name}</td></tr>
            </table>
            <div style="text-align:center; margin-top:24px;">
                <a href="{frontend_url}" style="background:#2563eb; color:white; padding:12px 32px; border-radius:6px; text-decoration:none; font-weight:600; display:inline-block;">결재하러 가기</a>
            </div>
        </div>
        <div style="padding:12px; text-align:center; color:#9ca3af; font-size:12px;">
            이 메일은 {COMPANY_NAME} 전자결재 시스템에서 자동 발송되었습니다.
        </div>
    </div>
    """
    return send_email(to_email, subject, body)

def send_approval_result_email(to_email: str, to_name: str, doc_title: str, doc_number: str, action: str, comment: str = "", approver_name: str = ""):
    action_text = "최종 승인" if action == "final_approved" else ("승인" if action == "approved" else "반려")
    color = "#16a34a" if action in ("approved", "final_approved") else "#dc2626"
    subject = f"[{COMPANY_NAME}] 결재 {action_text} - {doc_title}"
    body = f"""
    <div style="font-family: 'Apple SD Gothic Neo', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: {color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align:center;">
            <h1 style="margin:0; font-size:20px;">{"✅" if action in ("approved","final_approved") else "❌"} 결재 {action_text}</h1>
            <p style="margin:5px 0 0; opacity:0.8;">{COMPANY_NAME}</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="color:#374151; font-size:16px;"><strong>{to_name}</strong>님,</p>
            <p style="color:#6b7280;">작성하신 문서가 <strong style="color:{color};">{action_text}</strong>되었습니다.</p>
            <table style="width:100%; border-collapse:collapse; margin:16px 0; background:white; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0;">
                <tr><td style="padding:12px 16px; background:#f1f5f9; color:#64748b; font-size:13px; width:120px;">문서 번호</td><td style="padding:12px 16px; color:#1e293b; font-weight:600;">{doc_number}</td></tr>
                <tr><td style="padding:12px 16px; background:#f1f5f9; color:#64748b; font-size:13px;">제목</td><td style="padding:12px 16px; color:#1e293b;">{doc_title}</td></tr>
                <tr><td style="padding:12px 16px; background:#f1f5f9; color:#64748b; font-size:13px;">처리자</td><td style="padding:12px 16px; color:#1e293b;">{approver_name}</td></tr>
                {f'<tr><td style="padding:12px 16px; background:#f1f5f9; color:#64748b; font-size:13px;">의견</td><td style="padding:12px 16px; color:#1e293b;">{comment}</td></tr>' if comment else ""}
            </table>
        </div>
        <div style="padding:12px; text-align:center; color:#9ca3af; font-size:12px;">이 메일은 {COMPANY_NAME} 전자결재 시스템에서 자동 발송되었습니다.</div>
    </div>
    """
    return send_email(to_email, subject, body)