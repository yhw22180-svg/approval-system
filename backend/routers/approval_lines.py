from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/approval-lines", tags=["결재라인"])

@router.get("/", response_model=List[schemas.TemplateResponse])
def get_templates(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    """결재라인 템플릿 목록"""
    return db.query(models.ApprovalLineTemplate).filter(
        models.ApprovalLineTemplate.is_active == True
    ).order_by(models.ApprovalLineTemplate.created_at.desc()).all()

@router.get("/all", response_model=List[schemas.TemplateResponse])
def get_all_templates(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_admin)):
    """전체 결재라인 템플릿 목록 (관리자)"""
    return db.query(models.ApprovalLineTemplate).order_by(models.ApprovalLineTemplate.created_at.desc()).all()

@router.post("/", response_model=schemas.TemplateResponse, status_code=201)
def create_template(template_data: schemas.TemplateCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin)):
    """결재라인 템플릿 생성 (관리자)"""
    template = models.ApprovalLineTemplate(
        name=template_data.name,
        description=template_data.description,
        doc_type=template_data.doc_type,
        created_by=current_user.id
    )
    db.add(template)
    db.flush()

    for step_data in template_data.steps:
        step = models.ApprovalLineTemplateStep(
            template_id=template.id,
            step_order=step_data.step_order,
            step_name=step_data.step_name,
            approver_id=step_data.approver_id
        )
        db.add(step)

    db.commit()
    db.refresh(template)
    return template

@router.get("/{template_id}", response_model=schemas.TemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    """특정 결재라인 템플릿 조회"""
    template = db.query(models.ApprovalLineTemplate).filter(models.ApprovalLineTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="결재라인 템플릿을 찾을 수 없습니다.")
    return template

@router.put("/{template_id}", response_model=schemas.TemplateResponse)
def update_template(template_id: int, update_data: schemas.TemplateUpdate, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_admin)):
    """결재라인 템플릿 수정 (관리자)"""
    template = db.query(models.ApprovalLineTemplate).filter(models.ApprovalLineTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="결재라인 템플릿을 찾을 수 없습니다.")

    for field, value in update_data.model_dump(exclude_none=True, exclude={"steps"}).items():
        setattr(template, field, value)

    if update_data.steps is not None:
        # 기존 스텝 삭제 후 재생성
        for step in template.steps:
            db.delete(step)
        db.flush()
        for step_data in update_data.steps:
            step = models.ApprovalLineTemplateStep(
                template_id=template.id,
                step_order=step_data.step_order,
                step_name=step_data.step_name,
                approver_id=step_data.approver_id
            )
            db.add(step)

    db.commit()
    db.refresh(template)
    return template

@router.delete("/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_admin)):
    """결재라인 템플릿 삭제 (관리자)"""
    template = db.query(models.ApprovalLineTemplate).filter(models.ApprovalLineTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="결재라인 템플릿을 찾을 수 없습니다.")
    template.is_active = False  # soft delete
    db.commit()
    return {"message": "결재라인 템플릿이 삭제되었습니다."}
