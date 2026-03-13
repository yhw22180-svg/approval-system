from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/notifications", tags=["알림"])

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """내 알림 목록"""
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()

@router.put("/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """알림 읽음 처리"""
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "읽음 처리되었습니다."}

@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """전체 알림 읽음 처리"""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "모든 알림을 읽음 처리했습니다."}

@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """읽지 않은 알림 수"""
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()
    return {"count": count}
