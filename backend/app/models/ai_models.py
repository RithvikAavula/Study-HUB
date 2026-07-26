import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, DateTime, ForeignKey,
    JSON, Boolean, Float
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    file_name = Column(String(500), nullable=False)
    pages = Column(Integer, nullable=False, default=0)
    uploaded_by = Column(UUID(as_uuid=True), nullable=False, index=True)
    is_indexed = Column(Boolean, default=False, nullable=False)
    index_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    index_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=False, default=1)
    chunk_index = Column(Integer, nullable=False, default=0)
    embedding_id = Column(String(255), nullable=True)  # Chroma vector ID
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="chunks")


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(500), nullable=False, default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user | assistant | system
    content = Column(Text, nullable=False)
    citations = Column(JSON, nullable=True)  # list of citation objects
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("AIConversation", back_populates="messages")
