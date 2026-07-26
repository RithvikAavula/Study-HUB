from pydantic import BaseModel, Field
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime


# ─── Citation ─────────────────────────────────────────────────────────────────

class Citation(BaseModel):
    document_name: str
    page_number: int
    snippet: str
    resource_id: str
    document_id: str
    chunk_index: int


# ─── Chat ─────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    resource_ids: Optional[List[str]] = None  # filter to specific docs
    stream: bool = False


class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation]
    conversation_id: str
    message_id: str


# ─── Summary ──────────────────────────────────────────────────────────────────

class SummaryRequest(BaseModel):
    resource_id: str
    document_id: Optional[str] = None


class SummaryResponse(BaseModel):
    overview: str
    key_concepts: List[str]
    important_definitions: List[dict]
    exam_tips: List[str]
    resource_id: str


# ─── Quiz ─────────────────────────────────────────────────────────────────────

class QuizRequest(BaseModel):
    resource_id: str
    num_questions: int = Field(default=10, ge=1, le=30)
    difficulty: str = Field(default="medium")  # easy | medium | hard
    question_types: List[str] = Field(default=["mcq", "true_false"])


class QuizQuestion(BaseModel):
    question: str
    options: Optional[List[str]] = None
    answer: str
    explanation: str
    difficulty: str
    type: str  # mcq | true_false | fill_blank | short_answer


class QuizResponse(BaseModel):
    questions: List[QuizQuestion]
    resource_id: str
    total: int


# ─── Flashcards ───────────────────────────────────────────────────────────────

class FlashcardsRequest(BaseModel):
    resource_id: str
    num_cards: int = Field(default=15, ge=1, le=50)


class Flashcard(BaseModel):
    front: str
    back: str
    topic: str


class FlashcardsResponse(BaseModel):
    flashcards: List[Flashcard]
    resource_id: str
    total: int


# ─── Exam Questions ───────────────────────────────────────────────────────────

class ExamQuestionsRequest(BaseModel):
    resource_id: str
    marks: int = Field(default=5)  # 2, 5, 10, 16
    num_questions: int = Field(default=5, ge=1, le=20)


class ExamQuestion(BaseModel):
    question: str
    marks: int
    answer_hint: str
    topic: str


class ExamQuestionsResponse(BaseModel):
    questions: List[ExamQuestion]
    resource_id: str
    marks_per_question: int


# ─── Document Upload ──────────────────────────────────────────────────────────

class DocumentUploadRequest(BaseModel):
    resource_id: str
    file_url: str
    file_name: str
    department: str
    year: int
    subject: str
    title: str
    uploaded_by: str


class DocumentUploadResponse(BaseModel):
    document_id: str
    status: str
    message: str


class IndexingStatusResponse(BaseModel):
    document_id: str
    status: str
    pages: int
    chunks_indexed: int
    error: Optional[str] = None


# ─── Conversations ────────────────────────────────────────────────────────────

class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    citations: Optional[List[Citation]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationDetail(BaseModel):
    id: str
    title: str
    messages: List[MessageOut]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Suggested Questions ──────────────────────────────────────────────────────

class SuggestedQuestionsRequest(BaseModel):
    resource_id: str


class SuggestedQuestionsResponse(BaseModel):
    questions: List[str]
    resource_id: str
