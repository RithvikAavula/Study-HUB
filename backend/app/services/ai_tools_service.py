import asyncio
import json
from typing import List
from supabase import Client

from app.models.schemas import (
    SummaryResponse, QuizResponse, QuizQuestion,
    FlashcardsResponse, Flashcard,
    ExamQuestionsResponse, ExamQuestion,
    SuggestedQuestionsResponse,
)
from app.rag.llm_client import llm_service
from app.prompts.system_prompts import (
    SUMMARY_PROMPT, QUIZ_PROMPT, FLASHCARDS_PROMPT,
    EXAM_QUESTIONS_PROMPT, SUGGESTED_QUESTIONS_PROMPT,
)
from app.utils.logger import logger


class AIToolsService:

    async def _get_document_context(self, resource_id: str, db: Client, max_chunks: int = 30) -> tuple:
        doc_res = db.table("documents").select("id, file_name").eq("resource_id", resource_id).execute()
        if not doc_res.data:
            raise ValueError(f"No indexed document found for resource {resource_id}")
        doc = doc_res.data[0]

        chunks_res = (
            db.table("document_chunks")
            .select("chunk_text")
            .eq("document_id", doc["id"])
            .order("chunk_index")
            .limit(max_chunks)
            .execute()
        )
        if not chunks_res.data:
            raise ValueError("Document has no indexed chunks")

        context = "\n\n".join(c["chunk_text"] for c in chunks_res.data)
        return context, doc["file_name"]

    def _parse_json_response(self, raw: str) -> dict:
        raw = raw.strip()
        # Extract JSON from markdown code fences if present
        if '```' in raw:
            # Find content between first ``` and last ```
            start = raw.find('```')
            end = raw.rfind('```')
            if start != end:
                raw = raw[start+3:end].strip()
                if raw.startswith('json'):
                    raw = raw[4:].strip()
        # Find the outermost JSON object or array
        for start_char, end_char in [('{', '}'), ('[', ']')]:
            start = raw.find(start_char)
            end = raw.rfind(end_char)
            if start != -1 and end != -1 and end > start:
                candidate = raw[start:end+1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    pass
        return json.loads(raw)

    async def generate_summary(self, resource_id: str, db: Client) -> SummaryResponse:
        context, _ = await self._get_document_context(resource_id, db, max_chunks=40)
        raw = await llm_service.chat(system_prompt="", user_message=SUMMARY_PROMPT.format(context=context), temperature=0.2, max_tokens=4096)
        try:
            data = self._parse_json_response(raw)
            return SummaryResponse(
                overview=data.get("overview", ""),
                key_concepts=data.get("key_concepts", []),
                important_definitions=data.get("important_definitions", []),
                exam_tips=data.get("exam_tips", []),
                resource_id=resource_id,
            )
        except Exception as e:
            logger.error("Summary parse error", error=str(e))
            raise ValueError("Failed to parse summary response")

    async def generate_quiz(self, resource_id: str, num_questions: int, difficulty: str, question_types: List[str], db: Client) -> QuizResponse:
        context, _ = await self._get_document_context(resource_id, db, max_chunks=25)
        prompt = QUIZ_PROMPT.format(num_questions=num_questions, difficulty=difficulty, question_types=", ".join(question_types), context=context)
        raw = await llm_service.chat(system_prompt="", user_message=prompt, temperature=0.4, max_tokens=4096)
        try:
            data = self._parse_json_response(raw)
            questions = [QuizQuestion(**q) for q in data.get("questions", [])]
            return QuizResponse(questions=questions, resource_id=resource_id, total=len(questions))
        except Exception as e:
            logger.error("Quiz parse error", error=str(e))
            raise ValueError("Failed to parse quiz response")

    async def generate_flashcards(self, resource_id: str, num_cards: int, db: Client) -> FlashcardsResponse:
        context, _ = await self._get_document_context(resource_id, db, max_chunks=25)
        raw = await llm_service.chat(system_prompt="", user_message=FLASHCARDS_PROMPT.format(num_cards=num_cards, context=context), temperature=0.4, max_tokens=4096)
        try:
            data = self._parse_json_response(raw)
            cards = [Flashcard(**c) for c in data.get("flashcards", [])]
            return FlashcardsResponse(flashcards=cards, resource_id=resource_id, total=len(cards))
        except Exception as e:
            logger.error("Flashcards parse error", error=str(e))
            raise ValueError("Failed to parse flashcards response")

    async def generate_exam_questions(self, resource_id: str, marks: int, num_questions: int, db: Client) -> ExamQuestionsResponse:
        context, _ = await self._get_document_context(resource_id, db, max_chunks=25)
        prompt = EXAM_QUESTIONS_PROMPT.format(num_questions=num_questions, marks=marks, context=context)
        raw = await llm_service.chat(system_prompt="", user_message=prompt, temperature=0.4, max_tokens=4096)
        try:
            data = self._parse_json_response(raw)
            questions = [ExamQuestion(**q) for q in data.get("questions", [])]
            return ExamQuestionsResponse(questions=questions, resource_id=resource_id, marks_per_question=marks)
        except Exception as e:
            logger.error("Exam questions parse error", error=str(e), raw_response=raw[:500])
            raise ValueError("Failed to parse exam questions response")

    async def generate_suggested_questions(self, resource_id: str, db: Client) -> SuggestedQuestionsResponse:
        fallback = SuggestedQuestionsResponse(
            questions=[
                "Explain the main concepts in this document",
                "Generate 10 MCQs from this material",
                "Summarize this PDF",
                "What are the important topics for exams?",
                "List all key definitions",
                "Generate 5-mark questions",
                "Generate 10-mark questions",
                "Create a formula sheet",
            ],
            resource_id=resource_id,
        )
        try:
            context, _ = await self._get_document_context(resource_id, db, max_chunks=10)
        except ValueError:
            return fallback
        raw = await llm_service.chat(system_prompt="", user_message=SUGGESTED_QUESTIONS_PROMPT.format(context=context), temperature=0.5)
        try:
            data = self._parse_json_response(raw)
            return SuggestedQuestionsResponse(questions=data.get("questions", []), resource_id=resource_id)
        except Exception:
            return fallback


ai_tools_service = AIToolsService()
