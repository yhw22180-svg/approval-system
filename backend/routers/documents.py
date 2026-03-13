from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime
import json, os

from database import get_db
import models, schemas, auth
from utils.email_utils import send_approval_request_email, send_approval_result_email
from utils.file_utils import save_upload_file, delete_file

router = APIRouter(prefix="/api/documents", tags=["결재 문서"])

def generate_doc_number(db: Session) -> str:
    year = datetime.now().year
    prefix = f"DOC-{year}-"
    last = db.query(models.ApprovalDocument).filter(
        models.ApprovalDocument.doc_number.like(f"{prefix}%")
    ).order_by(models.ApprovalDocument.id.desc()).first()
    if last:
        try:
            seq = int(last.doc_number.split("-")[-1]) + 1
        except:
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"

def create_notification(db: Session, user_id: int, doc_id: int, title: str, message: str, ntype: models.NotificationType):
    notif = models.Notification(user_id=user_id, document_id=doc_id, title=title, message=message, type=ntype)
    db.add(notif)

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """대시보드 통계"""
    my_docs = db.query(models.ApprovalDocument).filter(models.ApprovalDocument.author_id == current_user.id)
    pending_steps = db.query(models.ApprovalStep).join(models.ApprovalDocument).filter(
        models.ApprovalStep.approver_id == current_user.id,
        models.ApprovalStep.status == models.StepStatus.pending,
        models.ApprovalDocument.status == models.DocumentStatus.waiting
    )
    # 내가 현재 결재해야 하는 문서만
    pending_my_turn = []
    for step in pending_steps.all():
        doc = step.document
        if doc.current_step == step.step_order:
            pending_my_turn.append(step)

    unread = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()

    return {
        "my_drafts": my_docs.filter(models.ApprovalDocument.status == "draft").count(),
        "my_waiting": my_docs.filter(models.ApprovalDocument.status == "waiting").count(),
        "my_approved": my_docs.filter(models.ApprovalDocument.status == "approved").count(),
        "my_rejected": my_docs.filter(models.ApprovalDocument.status == "rejected").count(),
        "pending_approval": len(pending_my_turn),
        "unread_notifications": unread
    }

@router.get("/my", response_model=List[schemas.DocumentListResponse])
def get_my_documents(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """내가 작성한 문서 목록"""
    query = db.query(models.ApprovalDocument).filter(models.ApprovalDocument.author_id == current_user.id)
    if status:
        query = query.filter(models.ApprovalDocument.status == status)
    return query.order_by(models.ApprovalDocument.created_at.desc()).all()

@router.get("/pending", response_model=List[schemas.DocumentListResponse])
def get_pending_documents(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """내가 결재해야 할 문서 목록"""
    steps = db.query(models.ApprovalStep).join(models.ApprovalDocument).filter(
        models.ApprovalStep.approver_id == current_user.id,
        models.ApprovalStep.status == models.StepStatus.pending,
        models.ApprovalDocument.status == models.DocumentStatus.waiting
    ).all()
    docs = []
    for step in steps:
        doc = step.document
        if doc.current_step == step.step_order:
            docs.append(doc)
    return docs

@router.get("/all", response_model=List[schemas.DocumentListResponse])
def get_all_documents(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_admin)
):
    """전체 문서 목록 (관리자)"""
    query = db.query(models.ApprovalDocument)
    if status:
        query = query.filter(models.ApprovalDocument.status == status)
    if search:
        query = query.filter(or_(
            models.ApprovalDocument.title.contains(search),
            models.ApprovalDocument.doc_number.contains(search)
        ))
    return query.order_by(models.ApprovalDocument.created_at.desc()).all()

@router.post("/", response_model=schemas.DocumentResponse, status_code=201)
def create_document(
    title: str = Form(...),
    content: str = Form(...),
    doc_type: str = Form("일반"),
    template_id: Optional[int] = Form(None),
    steps_json: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """결재 문서 작성"""
    try:
        steps_data = json.loads(steps_json)
    except:
        raise HTTPException(status_code=400, detail="결재라인 데이터 형식 오류")

    doc_number = generate_doc_number(db)
    doc = models.ApprovalDocument(
        doc_number=doc_number,
        title=title,
        content=content,
        doc_type=doc_type,
        author_id=current_user.id,
        template_id=template_id,
        status=models.DocumentStatus.draft,
        current_step=0,
        total_steps=len(steps_data)
    )
    db.add(doc)
    db.flush()

    # 결재 스텝 생성
    for step_data in steps_data:
        step = models.ApprovalStep(
            document_id=doc.id,
            step_order=step_data["step_order"],
            step_name=step_data["step_name"],
            approver_id=step_data["approver_id"],
            status=models.StepStatus.pending
        )
        db.add(step)

    db.commit()
    db.refresh(doc)
    return doc

@router.get("/{doc_id}", response_model=schemas.DocumentResponse)
def get_document(doc_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """문서 상세 조회"""
    doc = db.query(models.ApprovalDocument).filter(models.ApprovalDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    # 권한 체크: 작성자, 결재자, 관리자만 열람 가능
    is_approver = any(s.approver_id == current_user.id for s in doc.approval_steps)
    if doc.author_id != current_user.id and not is_approver and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    return doc

@router.put("/{doc_id}", response_model=schemas.DocumentResponse)
def update_document(doc_id: int, update_data: schemas.DocumentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """문서 수정 (draft 상태만)"""
    doc = db.query(models.ApprovalDocument).filter(models.ApprovalDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    if doc.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    if doc.status != models.DocumentStatus.draft:
        raise HTTPException(status_code=400, detail="임시저장 상태의 문서만 수정할 수 있습니다.")

    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(doc, field, value)
    db.commit()
    db.refresh(doc)
    return doc

@router.post("/{doc_id}/submit")
def submit_document(doc_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """문서 제출 (결재 요청)"""
    doc = db.query(models.ApprovalDocument).filter(models.ApprovalDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    if doc.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    if doc.status != models.DocumentStatus.draft:
        raise HTTPException(status_code=400, detail="이미 제출된 문서입니다.")
    if not doc.approval_steps:
        raise HTTPException(status_code=400, detail="결재라인이 없습니다.")

    doc.status = models.DocumentStatus.waiting
    doc.current_step = 1
    doc.submitted_at = datetime.utcnow()

    # 이력 기록
    history = models.ApprovalHistory(document_id=doc.id, actor_id=current_user.id, action="submitted", comment="결재 요청")
    db.add(history)

    # 첫 번째 결재자에게 알림
    first_step = next((s for s in doc.approval_steps if s.step_order == 1), None)
    if first_step:
        approver = first_step.approver
        create_notification(db, approver.id, doc.id, "결재 요청", f"[{doc.doc_number}] {doc.title} - 결재를 요청합니다.", models.NotificationType.approval_request)
        # 이메일 발송 (백그라운드)
        try:
            send_approval_request_email(approver.email, approver.name, doc.title, doc.doc_number, current_user.name)
        except:
            pass

    db.commit()
    return {"message": "결재가 요청되었습니다.", "doc_number": doc.doc_number}

@router.post("/{doc_id}/approve")
def approve_document(doc_id: int, action_data: schemas.ApprovalAction, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """결재 승인 또는 반려"""
    doc = db.query(models.ApprovalDocument).filter(models.ApprovalDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    if doc.status != models.DocumentStatus.waiting:
        raise HTTPException(status_code=400, detail="결재 진행 중인 문서가 아닙니다.")

    current_step = next((s for s in doc.approval_steps if s.step_order == doc.current_step), None)
    if not current_step:
        raise HTTPException(status_code=400, detail="현재 결재 단계를 찾을 수 없습니다.")
    if current_step.approver_id != current_user.id:
        raise HTTPException(status_code=403, detail="현재 결재 차례가 아닙니다.")

    if action_data.action == "approve":
        current_step.status = models.StepStatus.approved
        current_step.comment = action_data.comment
        current_step.acted_at = datetime.utcnow()

        history = models.ApprovalHistory(document_id=doc.id, actor_id=current_user.id, action="approved", comment=action_data.comment, step_order=current_step.step_order, step_name=current_step.step_name)
        db.add(history)

        next_step_order = doc.current_step + 1
        next_step = next((s for s in doc.approval_steps if s.step_order == next_step_order), None)

        if next_step:
            # 다음 결재자에게 알림
            doc.current_step = next_step_order
            approver = next_step.approver
            create_notification(db, approver.id, doc.id, "결재 요청", f"[{doc.doc_number}] {doc.title} - 결재를 요청합니다.", models.NotificationType.approval_request)
            try:
                send_approval_request_email(approver.email, approver.name, doc.title, doc.doc_number, current_user.name)
            except:
                pass
        else:
            # 최종 승인
            doc.status = models.DocumentStatus.approved
            doc.completed_at = datetime.utcnow()
            create_notification(db, doc.author_id, doc.id, "결재 완료", f"[{doc.doc_number}] {doc.title} - 최종 승인되었습니다.", models.NotificationType.final_approved)
            try:
                send_approval_result_email(doc.author.email, doc.author.name, doc.title, doc.doc_number, "final_approved", action_data.comment or "", current_user.name)
            except:
                pass

        db.commit()
        return {"message": "승인되었습니다."}

    elif action_data.action == "reject":
        current_step.status = models.StepStatus.rejected
        current_step.comment = action_data.comment
        current_step.acted_at = datetime.utcnow()

        doc.status = models.DocumentStatus.rejected
        doc.completed_at = datetime.utcnow()

        history = models.ApprovalHistory(document_id=doc.id, actor_id=current_user.id, action="rejected", comment=action_data.comment, step_order=current_step.step_order, step_name=current_step.step_name)
        db.add(history)

        create_notification(db, doc.author_id, doc.id, "결재 반려", f"[{doc.doc_number}] {doc.title} - 반려되었습니다.", models.NotificationType.rejected)
        try:
            send_approval_result_email(doc.author.email, doc.author.name, doc.title, doc.doc_number, "rejected", action_data.comment or "", current_user.name)
        except:
            pass

        db.commit()
        return {"message": "반려되었습니다."}
    else:
        raise HTTPException(status_code=400, detail="action은 'approve' 또는 'reject'여야 합니다.")

@router.post("/{doc_id}/recall")
def recall_document(doc_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """문서 회수 (첫 결재 전에만)"""
    doc = db.query(models.ApprovalDocument).filter(models.ApprovalDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    if doc.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    if doc.status != models.DocumentStatus.waiting:
        raise HTTPException(status_code=400, detail="결재 진행 중인 문서만 회수할 수 있습니다.")

    # 아직 아무도 승인하지 않은 경우만 회수 허용
    any_approved = any(s.status == models.StepStatus.approved for s in doc.approval_steps)
    if any_approved:
        raise HTTPException(status_code=400, detail="이미 결재가 진행된 문서는 회수할 수 없습니다.")

    doc.status = models.DocumentStatus.draft
    doc.current_step = 0
    doc.submitted_at = None
    for step in doc.approval_steps:
        step.status = models.StepStatus.pending
        step.comment = None
        step.acted_at = None

    history = models.ApprovalHistory(document_id=doc.id, actor_id=current_user.id, action="recalled", comment="문서 회수")
    db.add(history)
    db.commit()
    return {"message": "문서가 회수되었습니다."}

@router.post("/{doc_id}/attachments")
async def upload_attachment(doc_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """파일 첨부"""
    doc = db.query(models.ApprovalDocument).filter(models.ApprovalDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    if doc.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    uploaded = []
    for file in files:
        file_info = await save_upload_file(file, doc_id)
        attachment = models.Attachment(document_id=doc_id, **file_info)
        db.add(attachment)
        uploaded.append(file_info["original_filename"])

    db.commit()
    return {"message": f"{len(uploaded)}개 파일이 업로드되었습니다.", "files": uploaded}

@router.get("/{doc_id}/attachments/{att_id}/download")
def download_attachment(doc_id: int, att_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """첨부파일 다운로드"""
    att = db.query(models.Attachment).filter(models.Attachment.id == att_id, models.Attachment.document_id == doc_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    if not os.path.exists(att.filepath):
        raise HTTPException(status_code=404, detail="파일이 서버에 없습니다.")
    return FileResponse(att.filepath, filename=att.original_filename, media_type=att.mime_type or "application/octet-stream")

@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """문서 삭제 (draft 상태만)"""
    doc = db.query(models.ApprovalDocument).filter(models.ApprovalDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    if doc.author_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    if doc.status == models.DocumentStatus.waiting:
        raise HTTPException(status_code=400, detail="결재 진행 중인 문서는 삭제할 수 없습니다.")

    for att in doc.attachments:
        delete_file(att.filepath)
    db.delete(doc)
    db.commit()
    return {"message": "문서가 삭제되었습니다."}
