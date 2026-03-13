from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/users", tags=["사용자 관리"])

@router.get("/", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin)):
    """전체 사용자 목록 (관리자)"""
    return db.query(models.User).order_by(models.User.created_at).all()

@router.get("/list", response_model=List[schemas.UserSimple])
def get_users_simple(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    """사용자 간단 목록 (결재라인 설정용)"""
    return db.query(models.User).filter(models.User.is_active == True).order_by(models.User.name).all()

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_admin)):
    """특정 사용자 조회"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, update_data: schemas.UserUpdate, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_admin)):
    """사용자 정보 수정 (관리자)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    """사용자 삭제 (관리자)"""
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="자기 자신은 삭제할 수 없습니다.")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    db.delete(user)
    db.commit()
    return {"message": "사용자가 삭제되었습니다."}

@router.put("/{user_id}/reset-password")
def reset_user_password(user_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_admin)):
    """비밀번호 초기화 (관리자) - 임시 비밀번호: Change1234!"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    from auth import get_password_hash
    user.hashed_password = get_password_hash("Change1234!")
    db.commit()
    return {"message": "비밀번호가 'Change1234!'로 초기화되었습니다."}
