from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum as SAEnum, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

# ─── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"

class DocumentStatus(str, enum.Enum):
    draft = "draft"
    waiting = "waiting"
    approved = "approved"
    rejected = "rejected"

class StepStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    skipped = "skipped"

class NotificationType(str, enum.Enum):
    approval_request = "approval_request"
    approved = "approved"
    rejected = "rejected"
    final_approved = "final_approved"
    system = "system"

# ─── Models ──────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    department = Column(String(50), nullable=False)
    position = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(SAEnum(UserRole), default=UserRole.user, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    documents = relationship("ApprovalDocument", back_populates="author", foreign_keys="ApprovalDocument.author_id")
    approval_steps = relationship("ApprovalStep", back_populates="approver")
    notifications = relationship("Notification", back_populates="user")
    history_actions = relationship("ApprovalHistory", back_populates="actor")


class ApprovalLineTemplate(Base):
    __tablename__ = "approval_line_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    doc_type = Column(String(50), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    steps = relationship("ApprovalLineTemplateStep", back_populates="template", cascade="all, delete-orphan", order_by="ApprovalLineTemplateStep.step_order")
    creator = relationship("User", foreign_keys=[created_by])


class ApprovalLineTemplateStep(Base):
    __tablename__ = "approval_line_template_steps"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("approval_line_templates.id"), nullable=False)
    step_order = Column(Integer, nullable=False)
    step_name = Column(String(50), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    template = relationship("ApprovalLineTemplate", back_populates="steps")
    approver = relationship("User", foreign_keys=[approver_id])


class ApprovalDocument(Base):
    __tablename__ = "approval_documents"

    id = Column(Integer, primary_key=True, index=True)
    doc_number = Column(String(30), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    doc_type = Column(String(50), nullable=False, default="일반")
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("approval_line_templates.id"), nullable=True)
    status = Column(SAEnum(DocumentStatus), default=DocumentStatus.draft, nullable=False)
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    author = relationship("User", back_populates="documents", foreign_keys=[author_id])
    template = relationship("ApprovalLineTemplate", foreign_keys=[template_id])
    approval_steps = relationship("ApprovalStep", back_populates="document", cascade="all, delete-orphan", order_by="ApprovalStep.step_order")
    attachments = relationship("Attachment", back_populates="document", cascade="all, delete-orphan")
    history = relationship("ApprovalHistory", back_populates="document", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="document", cascade="all, delete-orphan")
    # 아래 줄이 추가되었습니다. (상세 내역 연결)
    details = relationship("DocumentDetail", back_populates="document", cascade="all, delete-orphan")


class DocumentDetail(Base):
    __tablename__ = "document_details"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("approval_documents.id"), nullable=False)
    
    # 구매의뢰서, 지출품의서에서 쓰이는 상세 항목들
    content = Column(String(255), nullable=True) # 품명/내용
    spec = Column(String(255), nullable=True)    # 규격
    unit = Column(String(50), nullable=True)     # 단위
    qty = Column(Integer, nullable=True)         # 수량
    amount = Column(BigInteger, nullable=True)   # 금액/단가
    note = Column(Text, nullable=True)           # 비고

    document = relationship("ApprovalDocument", back_populates="details")


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("approval_documents.id"), nullable=False)
    step_order = Column(Integer, nullable=False)
    step_name = Column(String(50), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SAEnum(StepStatus), default=StepStatus.pending, nullable=False)
    comment = Column(Text, nullable=True)
    acted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    document = relationship("ApprovalDocument", back_populates="approval_steps")
    approver = relationship("User", back_populates="approval_steps")


class ApprovalHistory(Base):
    __tablename__ = "approval_history"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("approval_documents.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)
    step_order = Column(Integer, nullable=True)
    step_name = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    document = relationship("ApprovalDocument", back_populates="history")
    actor = relationship("User", back_populates="history_actions")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("approval_documents.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    document = relationship("ApprovalDocument", back_populates="attachments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("approval_documents.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SAEnum(NotificationType), default=NotificationType.system, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")
    document = relationship("ApprovalDocument", back_populates="notifications")