import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
import mimetypes

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".txt", ".hwp", ".png", ".jpg", ".jpeg", ".gif", ".zip"
}

def get_upload_dir() -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    return UPLOAD_DIR

async def save_upload_file(file: UploadFile, document_id: int) -> dict:
    """파일을 저장하고 파일 정보를 반환합니다."""
    # 파일 확장자 검사
    original_filename = file.filename or "unknown"
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"허용되지 않는 파일 형식입니다. 허용 형식: {', '.join(ALLOWED_EXTENSIONS)}")

    # 저장 경로 생성
    upload_dir = get_upload_dir()
    doc_dir = os.path.join(upload_dir, str(document_id))
    os.makedirs(doc_dir, exist_ok=True)

    stored_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(doc_dir, stored_filename)

    # 파일 크기 검사 및 저장
    file_size = 0
    async with aiofiles.open(filepath, "wb") as f:
        while chunk := await file.read(1024 * 64):
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE:
                await f.close()
                os.remove(filepath)
                raise HTTPException(status_code=413, detail=f"파일 크기가 너무 큽니다. 최대 {MAX_FILE_SIZE // 1048576}MB까지 허용됩니다.")
            await f.write(chunk)

    mime_type, _ = mimetypes.guess_type(original_filename)

    return {
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "filepath": filepath,
        "file_size": file_size,
        "mime_type": mime_type or "application/octet-stream"
    }

def delete_file(filepath: str) -> bool:
    """파일을 삭제합니다."""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
        return True
    except Exception:
        return False
