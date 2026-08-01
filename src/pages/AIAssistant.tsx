import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import {
  Send, Plus, Trash2, MessageSquare, FileText,
  Sparkles, BookOpen, Brain, HelpCircle, AlignLeft,
  ChevronRight, Loader2, Bot, PanelLeftClose, PanelLeftOpen, CheckCircle2, XCircle, History, Library,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { aiApi, type Citation, type ConversationSummary, type MessageOut } from '@/lib/aiApi';
import { ChatMessage } from '@/components/ai/ChatMessage';
import type { ToolData } from '@/components/ai/ChatMessage';
import { PDFViewer } from '@/components/ai/PDFViewer';
import { FlashcardViewer } from '@/components/ai/FlashcardViewer';
import { QuizViewer } from '@/components/ai/QuizViewer';
import { SummaryViewer } from '@/components/ai/SummaryViewer';
import type { FlashcardsResponse, QuizResponse, SummaryResponse } from '@/lib/aiApi';

interface Resource {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  subject: string;
  department: string;
  year: number;
}

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  toolData?: ToolData;
}

const SUGGESTED_DEFAULT = [
  'Explain the main concepts in this document',
  'Generate 10 MCQs from this material',
  'Summarize this PDF',
  'What are the important topics for exams?',
  'List all key definitions',
  'Generate 5-mark questions',
];

export default function AIAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Layout
  const [leftOpen, setLeftOpen] = useState(true);
  const [mobileConvsOpen, setMobileConvsOpen] = useState(false);
  const [mobileDocsOpen, setMobileDocsOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef(false);

  // Conversations
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | undefined>();
  const [convsLoading, setConvsLoading] = useState(false);

  // Documents
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(SUGGESTED_DEFAULT);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState<'idle' | 'indexing' | 'done' | 'failed'>('idle');
  const indexingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexingResourceRef = useRef<string | null>(null); // tracks which resource is being indexed

  // Tool modals
  const [pdfViewer, setPdfViewer] = useState<{ url: string; name: string; page: number } | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardsResponse | null>(null);
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [toolLoading, setToolLoading] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    setConvsLoading(true);
    aiApi.listConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setConvsLoading(false));
  }, [user]);

  // Load user's resources
  useEffect(() => {
    if (!user) return;
    supabase
      .from('resources')
      .select('id, title, file_url, file_type, subject, department, year')
      .eq('file_type', 'application/pdf')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setResources(data as Resource[]);
      });
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-index resource when selected — runs only when selectedResource changes
  useEffect(() => {
    // Clear any existing poll
    if (indexingPollRef.current) {
      clearInterval(indexingPollRef.current);
      indexingPollRef.current = null;
    }
    setIndexingStatus('idle');
    indexingResourceRef.current = null;

    if (!selectedResource || !user) return;
    const resourceId = selectedResource.id;
    indexingResourceRef.current = resourceId;

    const startPolling = (docId: string) => {
      indexingPollRef.current = setInterval(async () => {
        // Stop if user switched to a different resource
        if (indexingResourceRef.current !== resourceId) {
          clearInterval(indexingPollRef.current!);
          return;
        }
        try {
          const { data } = await supabase
            .from('documents')
            .select('index_status')
            .eq('id', docId)
            .single();
          if (data?.index_status === 'completed') {
            setIndexingStatus('done');
            clearInterval(indexingPollRef.current!);
          } else if (data?.index_status === 'failed') {
            setIndexingStatus('failed');
            clearInterval(indexingPollRef.current!);
          }
        } catch {
          clearInterval(indexingPollRef.current!);
        }
      }, 4000);
    };

    supabase
      .from('documents')
      .select('id, index_status')
      .eq('resource_id', resourceId)
      .maybeSingle()
      .then(async ({ data }) => {
        if (indexingResourceRef.current !== resourceId) return; // stale
        if (data?.index_status === 'completed') {
          setIndexingStatus('done');
          return;
        }
        if (data?.index_status === 'processing' && data?.id) {
          setIndexingStatus('indexing');
          startPolling(data.id);
          return;
        }
        // Not indexed yet — trigger indexing once
        setIndexingStatus('indexing');
        try {
          const res = await aiApi.uploadDocument({
            resource_id: resourceId,
            file_url: selectedResource.file_url,
            file_name: selectedResource.title,
            department: selectedResource.department,
            year: selectedResource.year,
            subject: selectedResource.subject,
            title: selectedResource.title,
            uploaded_by: user.id,
          });
          if (indexingResourceRef.current !== resourceId) return; // stale
          startPolling(res.document_id);
        } catch {
          if (indexingResourceRef.current === resourceId)
            setIndexingStatus('failed');
        }
      });

    return () => {
      if (indexingPollRef.current) clearInterval(indexingPollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResource?.id]);

  // Load suggested questions when resource changes
  useEffect(() => {
    if (!selectedResource) {
      setSuggestedQuestions(SUGGESTED_DEFAULT);
      return;
    }
    setSuggestionsLoading(true);
    aiApi.getSuggestedQuestions(selectedResource.id)
      .then(r => setSuggestedQuestions(r.questions))
      .catch(() => setSuggestedQuestions(SUGGESTED_DEFAULT))
      .finally(() => setSuggestionsLoading(false));
  }, [selectedResource]);

  const loadConversation = async (conv: ConversationSummary) => {
    try {
      const detail = await aiApi.getConversation(conv.id);
      setActiveConvId(conv.id);
      setMessages(detail.messages.map(m => {
        // Check if this message has a sentinel tool_data citation
        const sentinelCitation = m.citations?.find(c => c.document_name === '__tool_data__');
        let toolData: ToolData | undefined;
        if (sentinelCitation) {
          try {
            toolData = JSON.parse(sentinelCitation.snippet) as ToolData;
          } catch {}
        }
        const realCitations = m.citations?.filter(c => c.document_name !== '__tool_data__');
        return {
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          citations: realCitations?.length ? realCitations : undefined,
          toolData,
        };
      }));
    } catch {
      toast({ title: 'Failed to load conversation', variant: 'destructive' });
    }
  };

  const newChat = () => {
    setActiveConvId(undefined);
    setMessages([]);
    setInput('');
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await aiApi.deleteConversation(id);
    setConversations(c => c.filter(x => x.id !== id));
    if (activeConvId === id) newChat();
  };

  // ─── Intent detection ────────────────────────────────────────────────────
  const detectIntent = (q: string): string | null => {
    const t = q.toLowerCase().trim();
    if (/summar(ize|ise|y)|summarise|give.*summary|overview|tldr|tl;dr/.test(t)) return 'summary';
    if (/flashcard|flash card|make.*card|create.*card/.test(t)) return 'flashcards';
    if (/quiz|mcq|multiple.choice|test me|question.*test/.test(t)) return 'quiz';
    if (/5.?mark|five.?mark/.test(t)) return 'questions5';
    if (/10.?mark|ten.?mark/.test(t)) return 'questions10';
    return null;
  };

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;

    // Intent detection — auto-trigger tool if user types a tool request
    const intent = detectIntent(question);
    if (intent && selectedResource) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: question }]);
      setInput('');
      await runTool(intent, question);
      return;
    }
    if (intent && !selectedResource) {
      toast({ title: 'Select a PDF first 📄', description: 'Choose a document from the panel to use this feature.', variant: 'destructive' });
      return;
    }

    setInput('');
    abortRef.current = false;

    const userMsgId = crypto.randomUUID();
    const asstMsgId = crypto.randomUUID();

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: question },
      { id: asstMsgId, role: 'assistant', content: '', isStreaming: true },
    ]);
    setIsLoading(true);
    setStreamingId(asstMsgId);

    let fullText = '';
    let finalCitations: Citation[] = [];

    try {
      await aiApi.chatStream(
        question,
        (chunk) => {
          if (abortRef.current) return;
          fullText += chunk;
          setMessages(prev => prev.map(m =>
            m.id === asstMsgId ? { ...m, content: fullText } : m
          ));
        },
        (citations, convId) => {
          finalCitations = citations;
          setActiveConvId(convId);
        },
        () => {
          setMessages(prev => prev.map(m =>
            m.id === asstMsgId
              ? { ...m, content: fullText, citations: finalCitations, isStreaming: false }
              : m
          ));
          setIsLoading(false);
          setStreamingId(null);
          aiApi.listConversations().then(setConversations).catch(() => {});
        },
        activeConvId,
        selectedResource ? [selectedResource.id] : undefined,
      );
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === asstMsgId
          ? { ...m, content: 'Sorry, something went wrong. Please try again.', isStreaming: false }
          : m
      ));
      setIsLoading(false);
      setStreamingId(null);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }, [isLoading, activeConvId, selectedResource, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleCitationClick = (citation: Citation) => {
    const resource = resources.find(r => r.id === citation.resource_id);
    if (resource) {
      setPdfViewer({ url: resource.file_url, name: citation.document_name, page: citation.page_number });
    }
  };

  const handleToolOpen = (data: ToolData) => {
    if (data.type === 'flashcards' && data.flashcards) setFlashcards(data.flashcards);
    if (data.type === 'quiz' && data.quiz) setQuiz(data.quiz);
    if (data.type === 'summary' && data.summary) setSummary(data.summary);
  };

  // ─── AI Tools ───────────────────────────────────────────────────────────────

  const runTool = async (tool: string, userMessage?: string) => {
    if (!selectedResource) {
      toast({ title: 'Select a document first', description: 'Choose a PDF from the right panel.', variant: 'destructive' });
      return;
    }
    setToolLoading(tool);
    try {
      if (tool === 'summary') {
        const res = await aiApi.getSummary(selectedResource.id);
        setSummary(res);
        const content = `Here's a summary of **${selectedResource.title}** 📄\n\n${res.overview}\n\nI've opened the full summary viewer for you — it has key concepts, definitions, and exam tips! 👆`;
        const toolData: ToolData = { type: 'summary', summary: res };
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content, toolData }]);
        const saved = await aiApi.saveToolMessage({ conversation_id: activeConvId, title: `Summary: ${selectedResource.title}`, user_message: userMessage, assistant_message: content, tool_data: toolData });
        setActiveConvId(saved.conversation_id);
        aiApi.listConversations().then(setConversations).catch(() => {});
      } else if (tool === 'flashcards') {
        const res = await aiApi.getFlashcards(selectedResource.id, 15);
        setFlashcards(res);
        const content = `Done! I made **${res.flashcards.length} flashcards** from **${selectedResource.title}** 🃏\n\nThe flashcard viewer is open — flip through them and mark which ones you know. Good luck! 💪`;
        const toolData: ToolData = { type: 'flashcards', flashcards: res };
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content, toolData }]);
        const saved = await aiApi.saveToolMessage({ conversation_id: activeConvId, title: `Flashcards: ${selectedResource.title}`, user_message: userMessage, assistant_message: content, tool_data: toolData });
        setActiveConvId(saved.conversation_id);
        aiApi.listConversations().then(setConversations).catch(() => {});
      } else if (tool === 'quiz') {
        const res = await aiApi.getQuiz(selectedResource.id, 10, 'medium', ['mcq', 'true_false']);
        setQuiz(res);
        const content = `Your quiz is ready! **${res.questions.length} questions** from **${selectedResource.title}** 🎯\n\nThe quiz is open — take your time, read carefully, and let's see how well you know this! 🚀`;
        const toolData: ToolData = { type: 'quiz', quiz: res };
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content, toolData }]);
        const saved = await aiApi.saveToolMessage({ conversation_id: activeConvId, title: `Quiz: ${selectedResource.title}`, user_message: userMessage, assistant_message: content, tool_data: toolData });
        setActiveConvId(saved.conversation_id);
        aiApi.listConversations().then(setConversations).catch(() => {});
      } else if (tool === 'questions5') {
        const res = await aiApi.getExamQuestions(selectedResource.id, 5, 5);
        const text = res.questions.map((q, i) =>
          `**Q${i + 1}.** ${q.question}\n\n> 💡 *Key points to cover:* ${q.answer_hint}`
        ).join('\n\n---\n\n');
        const content = `Here are **5 exam-style 5-mark questions** from your document 📝\n\n${text}\n\n---\n*Pro tip: For 5-mark answers, aim for 3-4 clear points with a brief example each!*`;
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content }]);
        const saved = await aiApi.saveToolMessage({ conversation_id: activeConvId, title: `5-Mark Questions: ${selectedResource.title}`, user_message: userMessage, assistant_message: content });
        setActiveConvId(saved.conversation_id);
        aiApi.listConversations().then(setConversations).catch(() => {});
      } else if (tool === 'questions10') {
        const res = await aiApi.getExamQuestions(selectedResource.id, 10, 3);
        const text = res.questions.map((q, i) =>
          `**Q${i + 1}.** ${q.question}\n\n> 💡 *Key points to cover:* ${q.answer_hint}`
        ).join('\n\n---\n\n');
        const content = `Here are **3 exam-style 10-mark questions** from your document 📝\n\n${text}\n\n---\n*Pro tip: For 10-mark answers, use headings, cover all key points, and add diagrams or examples where possible!*`;
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content }]);
        const saved = await aiApi.saveToolMessage({ conversation_id: activeConvId, title: `10-Mark Questions: ${selectedResource.title}`, user_message: userMessage, assistant_message: content });
        setActiveConvId(saved.conversation_id);
        aiApi.listConversations().then(setConversations).catch(() => {});
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      const isNotIndexed = msg.toLowerCase().includes('no indexed') || msg.includes('404') || msg.toLowerCase().includes('not found');
      toast({
        title: isNotIndexed ? 'Still indexing ⏳' : 'Something went wrong',
        description: isNotIndexed
          ? 'Your PDF is still being processed. Wait for the "Ready to chat!" banner and try again.'
          : msg,
        variant: 'destructive',
      });
    } finally {
      setToolLoading(null);
    }
  };

  // ── Shared conversations panel content ──────────────────────────────────
  const ConversationsPanel = () => (
    <>
      <div className="p-3 border-b border-border flex-shrink-0">
        <Button className="w-full" size="sm" onClick={() => { newChat(); setMobileConvsOpen(false); }}>
          <Plus className="h-4 w-4 mr-2" /> New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {convsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No conversations yet</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => { loadConversation(conv); setMobileConvsOpen(false); }}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${activeConvId === conv.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate text-xs">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );

  // ── Shared documents + tools panel content ───────────────────────────────
  const DocsToolsPanel = () => (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-4">
        {/* Quick Actions */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Tools</p>
          <div className="space-y-1.5">
            {[
              { id: 'summary', label: 'Generate Summary', icon: AlignLeft, color: 'text-blue-500' },
              { id: 'flashcards', label: 'Flashcards', icon: BookOpen, color: 'text-green-500' },
              { id: 'quiz', label: 'Generate Quiz', icon: HelpCircle, color: 'text-purple-500' },
              { id: 'questions5', label: '5-Mark Questions', icon: Sparkles, color: 'text-orange-500' },
              { id: 'questions10', label: '10-Mark Questions', icon: Sparkles, color: 'text-red-500' },
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => { runTool(tool.id); setMobileDocsOpen(false); }}
                disabled={toolLoading === tool.id || indexingStatus === 'indexing'}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {toolLoading === tool.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground flex-shrink-0" />
                  : <tool.icon className={`h-3.5 w-3.5 flex-shrink-0 ${tool.color}`} />
                }
                <span className="text-xs text-foreground">{tool.label}</span>
                <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your PDFs</p>
          {selectedResource && indexingStatus !== 'idle' && (
            <div className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
              indexingStatus === 'done' ? 'border-green-500/30 bg-green-500/10 text-green-600' :
              indexingStatus === 'failed' ? 'border-red-500/30 bg-red-500/10 text-red-500' :
              'border-primary/30 bg-primary/10 text-primary'
            }`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                {indexingStatus === 'indexing' && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
                {indexingStatus === 'done' && <CheckCircle2 className="h-3 w-3 flex-shrink-0" />}
                {indexingStatus === 'failed' && <XCircle className="h-3 w-3 flex-shrink-0" />}
                <span className="font-medium">
                  {indexingStatus === 'indexing' && 'Indexing PDF...'}
                  {indexingStatus === 'done' && 'Ready to chat!'}
                  {indexingStatus === 'failed' && 'Indexing failed'}
                </span>
              </div>
              {indexingStatus === 'indexing' && (
                <>
                  <div className="w-full h-1 bg-primary/20 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-primary rounded-full" style={{width: '40%', animation: 'slide 1.5s ease-in-out infinite'}} />
                  </div>
                  <style>{`@keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }`}</style>
                  <p className="text-[10px] opacity-70">Extracting text & building embeddings…</p>
                </>
              )}
              {indexingStatus === 'done' && <p className="text-[10px] opacity-70">Document indexed — ask anything!</p>}
              {indexingStatus === 'failed' && <p className="text-[10px] opacity-70">Could not process this PDF. Try re-selecting it.</p>}
            </div>
          )}
          {resources.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              No PDFs uploaded yet.{' '}
              <button onClick={() => navigate('/upload')} className="text-primary hover:underline">Upload one</button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {resources.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedResource(prev => prev?.id === r.id ? null : r); setMobileDocsOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${selectedResource?.id === r.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
                >
                  <div className="flex items-start gap-2">
                    <FileText className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${selectedResource?.id === r.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.subject} · {r.department}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );

  if (!user) return null;

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden pb-14 md:pb-0">
      <Header />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left Sidebar: Conversations (desktop only) ───────────────────── */}
        <div className={`hidden md:flex ${leftOpen ? 'w-64' : 'w-0'} flex-shrink-0 border-r border-border bg-card transition-all duration-300 overflow-hidden flex-col`}>
          <ConversationsPanel />
        </div>

        {/* ── Center: Chat ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat toolbar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/50 flex-shrink-0">
            {/* Desktop: sidebar toggle */}
            <Button variant="ghost" size="sm" className="hidden md:flex h-8 w-8 p-0" onClick={() => setLeftOpen(o => !o)}>
              {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
            {/* Mobile: history button */}
            <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0" onClick={() => setMobileConvsOpen(true)}>
              <History className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">AI Study Assistant</span>
            </div>
            {selectedResource ? (
              <Badge variant="secondary" className="text-xs ml-auto max-w-[120px] sm:max-w-none truncate">
                <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{selectedResource.title.slice(0, 20)}{selectedResource.title.length > 20 ? '…' : ''}</span>
              </Badge>
            ) : (
              /* Mobile: docs/tools button */
              <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0 ml-auto" onClick={() => setMobileDocsOpen(true)}>
                <Library className="h-4 w-4" />
              </Button>
            )}
            {selectedResource && (
              <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0" onClick={() => setMobileDocsOpen(true)}>
                <Library className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center animate-fade-in px-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">AI Study Assistant</h2>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                  Ask questions from your uploaded study materials.{' '}
                  {!selectedResource && <button onClick={() => setMobileDocsOpen(true)} className="text-primary underline md:hidden">Select a PDF</button>}
                  {!selectedResource && <span className="hidden md:inline">Select a PDF from the right panel to get started.</span>}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {suggestionsLoading
                    ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)
                    : suggestedQuestions.slice(0, 6).map((q, i) => (
                      <button key={i} onClick={() => sendMessage(q)}
                        className="text-left text-xs px-3 py-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-foreground">
                        {q}
                      </button>
                    ))
                  }
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto pb-4">
                {messages.map(msg => (
                  <ChatMessage key={msg.id} role={msg.role} content={msg.content}
                    citations={msg.citations} isStreaming={msg.isStreaming}
                    toolData={msg.toolData}
                    onCitationClick={handleCitationClick}
                    onToolOpen={handleToolOpen} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Suggested questions strip */}
          {messages.length > 0 && suggestedQuestions.length > 0 && !isLoading && (
            <div className="px-3 py-2 border-t border-border flex gap-2 overflow-x-auto flex-shrink-0 bg-card/30 scrollbar-none">
              {suggestedQuestions.slice(0, 4).map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground whitespace-nowrap">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-border bg-card/50 flex-shrink-0">
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedResource ? `Ask about "${selectedResource.title.slice(0,25)}"...` : 'Ask a question...'}
                className="flex-1 min-h-[44px] max-h-28 resize-none text-sm" rows={1} disabled={isLoading} />
              {isLoading ? (
                <Button size="sm" variant="destructive" className="h-11 px-3 flex-shrink-0"
                  onClick={() => { abortRef.current = true; setIsLoading(false); setStreamingId(null); }}>
                  <span className="text-xs">Stop</span>
                </Button>
              ) : (
                <Button size="sm" className="h-11 px-3 flex-shrink-0"
                  onClick={() => sendMessage(input)} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1.5 hidden sm:block">
              Answers are grounded in your uploaded study materials only.
            </p>
          </div>
        </div>

        {/* ── Right Sidebar: desktop only ───────────────────────────────────── */}
        <div className="hidden md:flex w-64 flex-shrink-0 border-l border-border bg-card flex-col overflow-hidden">
          <DocsToolsPanel />
        </div>
      </div>

      {/* ── Mobile Sheets ──────────────────────────────────────────────────── */}
      <Sheet open={mobileConvsOpen} onOpenChange={setMobileConvsOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
            <SheetTitle className="text-sm">Conversations</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <ConversationsPanel />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={mobileDocsOpen} onOpenChange={setMobileDocsOpen}>
        <SheetContent side="right" className="w-80 p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
            <SheetTitle className="text-sm">Documents & Tools</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <DocsToolsPanel />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {pdfViewer && (
        <PDFViewer
          fileUrl={pdfViewer.url}
          fileName={pdfViewer.name}
          initialPage={pdfViewer.page}
          onClose={() => setPdfViewer(null)}
        />
      )}
      {flashcards && (
        <FlashcardViewer flashcards={flashcards.flashcards} onClose={() => setFlashcards(null)} />
      )}
      {quiz && (
        <QuizViewer questions={quiz.questions} onClose={() => setQuiz(null)} />
      )}
      {summary && (
        <SummaryViewer summary={summary} onClose={() => setSummary(null)} />
      )}
    </div>
  );
}
