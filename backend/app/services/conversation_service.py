import uuid
from typing import List, Optional
from supabase import Client

from app.models.schemas import ConversationSummary, ConversationDetail, MessageOut, Citation
from app.utils.logger import logger


class ConversationService:

    async def get_or_create_conversation(self, user_id: str, conversation_id: Optional[str], title: str, db: Client) -> str:
        if conversation_id:
            res = db.table("ai_conversations").select("id").eq("id", conversation_id).eq("user_id", user_id).execute()
            if res.data:
                return conversation_id

        conv_id = str(uuid.uuid4())
        db.table("ai_conversations").insert({
            "id": conv_id,
            "user_id": user_id,
            "title": title[:100],
        }).execute()
        return conv_id

    async def save_message(self, conversation_id: str, role: str, content: str, citations: Optional[List[Citation]], db: Client) -> str:
        msg_id = str(uuid.uuid4())
        db.table("conversation_messages").insert({
            "id": msg_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "citations": [c.model_dump() for c in citations] if citations else None,
        }).execute()
        return msg_id

    async def list_conversations(self, user_id: str, db: Client) -> List[ConversationSummary]:
        res = db.table("ai_conversations").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(50).execute()
        summaries = []
        for conv in (res.data or []):
            count_res = db.table("conversation_messages").select("id", count="exact").eq("conversation_id", conv["id"]).execute()
            summaries.append(ConversationSummary(
                id=conv["id"],
                title=conv["title"],
                created_at=conv["created_at"],
                updated_at=conv.get("updated_at", conv["created_at"]),
                message_count=count_res.count or 0,
            ))
        return summaries

    async def get_conversation(self, conversation_id: str, user_id: str, db: Client) -> Optional[ConversationDetail]:
        conv_res = db.table("ai_conversations").select("*").eq("id", conversation_id).eq("user_id", user_id).execute()
        if not conv_res.data:
            return None
        conv = conv_res.data[0]

        msgs_res = db.table("conversation_messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute()

        return ConversationDetail(
            id=conv["id"],
            title=conv["title"],
            created_at=conv["created_at"],
            messages=[
                MessageOut(
                    id=m["id"],
                    role=m["role"],
                    content=m["content"],
                    citations=[Citation(**c) for c in (m.get("citations") or [])],
                    created_at=m["created_at"],
                )
                for m in (msgs_res.data or [])
            ],
        )

    async def delete_conversation(self, conversation_id: str, user_id: str, db: Client) -> bool:
        res = db.table("ai_conversations").select("id").eq("id", conversation_id).eq("user_id", user_id).execute()
        if not res.data:
            return False
        db.table("ai_conversations").delete().eq("id", conversation_id).execute()
        return True


conversation_service = ConversationService()
