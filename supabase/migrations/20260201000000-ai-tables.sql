-- AI Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  pages INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_indexed BOOLEAN NOT NULL DEFAULT FALSE,
  index_status TEXT NOT NULL DEFAULT 'pending',
  index_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_resource_id ON public.documents(resource_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);

-- Document chunks table
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  embedding_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);

-- AI Conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);

-- Conversation messages table
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);

-- RLS Policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Documents: readable by all authenticated users (public resources), writable by owner
CREATE POLICY "documents_select" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "documents_update" ON public.documents FOR UPDATE TO authenticated USING (uploaded_by = auth.uid());
CREATE POLICY "documents_delete" ON public.documents FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- Document chunks: readable by all authenticated users
CREATE POLICY "chunks_select" ON public.document_chunks FOR SELECT TO authenticated USING (true);
CREATE POLICY "chunks_insert" ON public.document_chunks FOR INSERT TO authenticated WITH CHECK (true);

-- AI Conversations: only owner
CREATE POLICY "conversations_select" ON public.ai_conversations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "conversations_insert" ON public.ai_conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "conversations_update" ON public.ai_conversations FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "conversations_delete" ON public.ai_conversations FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Conversation messages: only owner (via conversation)
CREATE POLICY "messages_select" ON public.conversation_messages FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()));
CREATE POLICY "messages_insert" ON public.conversation_messages FOR INSERT TO authenticated
  WITH CHECK (conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()));
CREATE POLICY "messages_delete" ON public.conversation_messages FOR DELETE TO authenticated
  USING (conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
