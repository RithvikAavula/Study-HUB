import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Send, Plus, Trash2, MessageSquare, FileText,
  Sparkles, BookOpen, Brain, HelpCircle, AlignLeft,
  ChevronRight, Loader2, Bot, PanelLeftClose, PanelLeftOpen, CheckCircle2, XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { aiApi, type Citation, type ConversationSummary, type MessageOut } from '@/lib/aiApi';
import { ChatMessage } from '@/components/ai/ChatMessage';
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
      setMessages(detail.messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        citations: m.citations,
      })));
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

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;
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

  // ─── AI Tools ───────────────────────────────────────────────────────────────

  const runTool = async (tool: string) => {
    if (!selectedResource) {
      toast({ title: 'Select a document first', description: 'Choose a PDF from the right panel.', variant: 'destructive' });
      return;
    }
    setToolLoading(tool);
    try {
      if (tool === 'summary') {
        const res = await aiApi.getSummary(selectedResource.id);
        setSummary(res);
        const text = [
          `## Summary: ${selectedResource.title}`,
          `**Overview:** ${res.overview}`,
          res.key_concepts.length ? `**Key Concepts:** ${res.key_concepts.join(', ')}` : '',
          res.exam_tips.length ? `**Exam Tips:**\n${res.exam_tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}` : '',
        ].filter(Boolean).join('\n\n');
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: text }]);
      } else if (tool === 'flashcards') {
        const res = await aiApi.getFlashcards(selectedResource.id, 15);
        setFlashcards(res);
        const text = `## Flashcards: ${selectedResource.title}\n\n` +
          res.flashcards.map((f, i) => `**${i + 1}. ${f.front}**\n${f.back}`).join('\n\n---\n\n');
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: text }]);
      } else if (tool === 'quiz') {
        const res = await aiApi.getQuiz(selectedResource.id, 10, 'medium', ['mcq', 'true_false']);
        setQuiz(res);
        const text = `## Quiz: ${selectedResource.title}\n\n` +
          res.questions.map((q, i) =>
            `**Q${i + 1}.** ${q.question}${q.options ? '\n' + q.options.map((o, j) => `  ${String.fromCharCode(65 + j)}) ${o}`).join('\n') : ''}\n✅ **Answer:** ${q.answer}`
          ).join('\n\n---\n\n');
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: text }]);
      } else if (tool === 'questions5') {
        const res = await aiApi.getExamQuestions(selectedResource.id, 5, 5);
        const text = res.questions.map((q, i) => `**Q${i + 1} (${q.marks}M):** ${q.question}\n\n*Hint:* ${q.answer_hint}`).join('\n\n---\n\n');
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `## 5-Mark Questions\n\n${text}` }]);
      } else if (tool === 'questions10') {
        const res = await aiApi.getExamQuestions(selectedResource.id, 10, 5);
        const text = res.questions.map((q, i) => `**Q${i + 1} (${q.marks}M):** ${q.question}\n\n*Hint:* ${q.answer_hint}`).join('\n\n---\n\n');
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `## 10-Mark Questions\n\n${text}` }]);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      const isNotIndexed = msg.includes('No indexed document') || msg.includes('404') || msg.includes('not found');
      toast({
        title: isNotIndexed ? 'Document not indexed yet' : 'Tool failed',
        description: isNotIndexed
          ? 'This PDF is still being processed. Please wait a moment and try again.'
          : msg,
        variant: 'destructive',
      });
      console.error('[runTool] error:', msg);
    } finally {
      setToolLoading(null);
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left Sidebar: Conversations ─────────────────────────────────── */}
        <div className={`${leftOpen ? 'w-64' : 'w-0'} flex-shrink-0 border-r border-border bg-card transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="p-3 border-b border-border flex-shrink-0">
            <Button className="w-full" size="sm" onClick={newChat}>
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
                    onClick={() => loadConversation(conv)}
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
        </div>

        {/* ── Center: Chat ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50 flex-shrink-0">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setLeftOpen(o => !o)}>
              {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">AI Study Assistant</span>
            </div>
            {selectedResource && (
              <Badge variant="secondary" className="text-xs ml-auto">
                <FileText className="h-3 w-3 mr-1" />
                {selectedResource.title.slice(0, 30)}{selectedResource.title.length > 30 ? '…' : ''}
              </Badge>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">AI Study Assistant</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Ask questions from your uploaded study materials. Select a PDF from the right panel to get started.
                </p>

                {/* Suggested questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {suggestionsLoading
                    ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)
                    : suggestedQuestions.slice(0, 6).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="text-left text-xs px-3 py-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-foreground"
                      >
                        {q}
                      </button>
                    ))
                  }
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto pb-4">
                {messages.map(msg => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    citations={msg.citations}
                    isStreaming={msg.isStreaming}
                    onCitationClick={handleCitationClick}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Suggested questions strip (when messages exist) */}
          {messages.length > 0 && suggestedQuestions.length > 0 && !isLoading && (
            <div className="px-4 py-2 border-t border-border flex gap-2 overflow-x-auto flex-shrink-0 bg-card/30">
              {suggestedQuestions.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-border bg-card/50 flex-shrink-0">
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedResource ? `Ask about "${selectedResource.title}"...` : 'Ask a question from your study materials...'}
                className="flex-1 min-h-[44px] max-h-32 resize-none text-sm"
                rows={1}
                disabled={isLoading}
              />
              {isLoading ? (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-11 px-3 flex-shrink-0"
                  onClick={() => { abortRef.current = true; setIsLoading(false); setStreamingId(null); }}
                >
                  <span className="text-xs">Stop</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-11 px-3 flex-shrink-0"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1.5 max-w-3xl mx-auto">
              Answers are grounded in your uploaded study materials only.
            </p>
          </div>
        </div>

        {/* ── Right Sidebar: Documents + Tools ─────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
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
                      onClick={() => runTool(tool.id)}
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

                {/* Indexing status banner */}
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
                          <div className="h-full bg-primary rounded-full animate-[indexing_1.5s_ease-in-out_infinite]" style={{width: '40%', animation: 'slide 1.5s ease-in-out infinite'}} />
                        </div>
                        <style>{`@keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }`}</style>
                        <p className="text-[10px] opacity-70">Extracting text & building embeddings…</p>
                      </>
                    )}
                    {indexingStatus === 'done' && (
                      <p className="text-[10px] opacity-70">Document indexed — ask anything!</p>
                    )}
                    {indexingStatus === 'failed' && (
                      <p className="text-[10px] opacity-70">Could not process this PDF. Try re-selecting it.</p>
                    )}
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
                        onClick={() => setSelectedResource(prev => prev?.id === r.id ? null : r)}
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
        </div>
      </div>

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
