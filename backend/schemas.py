from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from models import UserRole, DocumentStatus, StepStatus, NotificationType

# ─── User Schemas ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: str
    position: str
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    department: str
    position: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserSimple(BaseModel):
    id: int
    name: str
    department: str
    position: str
    email: str

    class Config:
        from_attributes = True

# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ─── Approval Line Template Schemas ───────────────────────────────────────────

class TemplateStepCreate(BaseModel):
    step_order: int
    step_name: str
    approver_id: Optional[int] = None

class TemplateStepResponse(BaseModel):
    id: int
    step_order: int
    step_name: str
    approver_id: Optional[int]
    approver: Optional[UserSimple]

    class Config:
        from_attributes = True

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    doc_type: Optional[str] = None
    steps: List[TemplateStepCreate]

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    doc_type: Optional[str] = None
    is_active: Optional[bool] = None
    steps: Optional[List[TemplateStepCreate]] = None

class TemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    doc_type: Optional[str]
    is_active: bool
    created_at: datetime
    creator: Optional[UserSimple]
    steps: List[TemplateStepResponse]

    class Config:
        from_attributes = True

# ─── Document Detail Schema (구매의뢰/지출품의 상세항목) ──────────────────────────

class DocumentDetailBase(BaseModel):
    content: Optional[str] = None
    spec: Optional[str] = None
    unit: Optional[str] = "EA"
    qty: Optional[int] = 1
    amount: Optional[int] = 0
    note: Optional[str] = None

    class Config:
        from_attributes = True

# ─── Document & Approval Step Schemas ─────────────────────────────────────────

class ApprovalStepCreate(BaseModel):
    step_order: int
    step_name: str
    approver_id: int

class ApprovalStepResponse(BaseModel):
    id: int
    step_order: int
    step_name: str
    approver_id: int
    approver: UserSimple
    status: StepStatus
    comment: Optional[str]
    acted_at: Optional[datetime]

    class Config:
        from_attributes = True

class AttachmentResponse(BaseModel):
    id: int
    original_filename: str
    file_size: int
    mime_type: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    id: int
    action: str
    comment: Optional[str]
    step_name: Optional[str]
    step_order: Optional[int]
    created_at: datetime
    actor: UserSimple

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    title: str
    content: str
    doc_type: str = "일반"
    template_id: Optional[int] = None
    details: Optional[List[DocumentDetailBase]] = [] # 상세 항목 리스트 추가
    steps: List[ApprovalStepCreate]

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    doc_type: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    doc_number: str
    title: str
    content: str
    doc_type: str
    status: DocumentStatus
    current_step: int
    total_steps: int
    created_at: datetime
    submitted_at: Optional[datetime]
    completed_at: Optional[datetime]
    author: UserSimple
    approval_steps: List[ApprovalStepResponse]
    details: List[DocumentDetailBase] # 상세 내역 포함
    attachments: List[AttachmentResponse]
    history: List[HistoryResponse]

    class Config:
        from_attributes = True

class DocumentListResponse(BaseModel):
    id: int
    doc_number: str
    title: str
    doc_type: str
    status: DocumentStatus
    current_step: int
    total_steps: int
    created_at: datetime
    submitted_at: Optional[datetime]
    author: UserSimple

    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    action: str  # "approve" or "reject"
    comment: Optional[str] = None

# ─── Notification & Dashboard ─────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime
    document_id: Optional[int]

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    my_drafts: int
    my_waiting: int
    my_approved: int
    my_rejected: int
    pending_approval: int
    unread_notifications: int