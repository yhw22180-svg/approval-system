from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/auth", tags=["인증"])

@router.post("/register", response_model=schemas.UserResponse, status_code=201)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """회원가입"""
    # 이메일 중복 체크
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")

    # 첫 번째 사용자는 자동으로 admin
    is_first_user = db.query(models.User).count() == 0

    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=auth.get_password_hash(user_data.password),
        department=user_data.department,
        position=user_data.position,
        phone=user_data.phone,
        role=models.UserRole.admin if is_first_user else models.UserRole.user
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    """로그인"""
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="비활성화된 계정입니다. 관리자에게 문의하세요.")

    access_token = auth.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    """내 정보 조회"""
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_me(update_data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """내 정보 수정"""
    for field, value in update_data.model_dump(exclude_none=True, exclude={"role", "is_active"}).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password")
def change_password(password_data: schemas.UserPasswordChange, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """비밀번호 변경"""
    if not auth.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")
    current_user.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "비밀번호가 변경되었습니다."}
