import { supabase } from '@/integrations/supabase/client';

const AI_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AI_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AI_BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

async function del(path: string): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch(`${AI_BASE_URL}${path}`, { method: 'DELETE', headers });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Citation {
  document_name: string;
  page_number: number;
  snippet: string;
  resource_id: string;
  document_id: string;
  chunk_index: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  conversation_id: string;
  message_id: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface MessageOut {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: MessageOut[];
  created_at: string;
}

export interface SummaryResponse {
  overview: string;
  key_concepts: string[];
  important_definitions: { term: string; definition: string }[];
  exam_tips: string[];
  resource_id: string;
}

export interface QuizQuestion {
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: string;
  type: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  resource_id: string;
  total: number;
}

export interface Flashcard {
  front: string;
  back: string;
  topic: string;
}

export interface FlashcardsResponse {
  flashcards: Flashcard[];
  resource_id: string;
  total: number;
}

export interface ExamQuestion {
  question: string;
  marks: number;
  answer_hint: string;
  topic: string;
}

export interface ExamQuestionsResponse {
  questions: ExamQuestion[];
  resource_id: string;
  marks_per_question: number;
}

export interface DocumentUploadResponse {
  document_id: string;
  status: string;
  message: string;
}

export interface IndexingStatus {
  document_id: string;
  status: string;
  pages: number;
  chunks_indexed: number;
  error?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const aiApi = {
  chat: (question: string, conversationId?: string, resourceIds?: string[]) =>
    post<ChatResponse>('/api/ai/chat', {
      question,
      conversation_id: conversationId,
      resource_ids: resourceIds,
      stream: false,
    }),

  chatStream: async (
    question: string,
    onChunk: (text: string) => void,
    onCitations: (citations: Citation[], conversationId: string) => void,
    onDone: () => void,
    conversationId?: string,
    resourceIds?: string[],
  ) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${AI_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
        conversation_id: conversationId,
        resource_ids: resourceIds,
        stream: true,
      }),
    });
    if (!res.ok) throw new Error('Stream request failed');
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') { onDone(); continue; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'chunk') onChunk(parsed.text);
          if (parsed.type === 'citations') onCitations(parsed.data, parsed.conversation_id);
          if (parsed.type === 'error') throw new Error(parsed.message);
        } catch {}
      }
    }
  },

  getSummary: (resourceId: string) =>
    post<SummaryResponse>('/api/ai/summary', { resource_id: resourceId }),

  getQuiz: (resourceId: string, numQuestions = 10, difficulty = 'medium', types = ['mcq']) =>
    post<QuizResponse>('/api/ai/quiz', {
      resource_id: resourceId,
      num_questions: numQuestions,
      difficulty,
      question_types: types,
    }),

  getFlashcards: (resourceId: string, numCards = 15) =>
    post<FlashcardsResponse>('/api/ai/flashcards', {
      resource_id: resourceId,
      num_cards: numCards,
    }),

  getExamQuestions: (resourceId: string, marks = 5, numQuestions = 5) =>
    post<ExamQuestionsResponse>('/api/ai/questions', {
      resource_id: resourceId,
      marks,
      num_questions: numQuestions,
    }),

  getSuggestedQuestions: (resourceId: string) =>
    post<{ questions: string[]; resource_id: string }>('/api/ai/suggested-questions', {
      resource_id: resourceId,
    }),

  uploadDocument: (payload: {
    resource_id: string;
    file_url: string;
    file_name: string;
    department: string;
    year: number;
    subject: string;
    title: string;
    uploaded_by: string;
  }) => post<DocumentUploadResponse>('/api/ai/upload-document', payload),

  getDocumentStatus: (documentId: string) =>
    get<IndexingStatus>(`/api/ai/document-status/${documentId}`),

  listConversations: () => get<ConversationSummary[]>('/api/ai/conversations'),

  getConversation: (id: string) => get<ConversationDetail>(`/api/ai/conversation/${id}`),

  deleteConversation: (id: string) => del(`/api/ai/conversation/${id}`),
};
