import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, BookOpen, ChevronDown, ChevronUp, Layers, HelpCircle, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Citation, FlashcardsResponse, QuizResponse, SummaryResponse } from '@/lib/aiApi';

export interface ToolData {
  type: 'flashcards' | 'quiz' | 'summary';
  flashcards?: FlashcardsResponse;
  quiz?: QuizResponse;
  summary?: SummaryResponse;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  toolData?: ToolData;
  onCitationClick?: (citation: Citation) => void;
  onToolOpen?: (data: ToolData) => void;
}

export function ChatMessage({ role, content, citations, isStreaming, toolData, onCitationClick, onToolOpen }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="max-w-[88%] w-full">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
            <span className="text-white text-xs font-bold">AI</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
              {isStreaming && !content ? (
                <div className="flex items-center gap-1 py-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-foreground leading-relaxed ai-message-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold text-foreground mt-5 mb-2 first:mt-0 pb-1.5 border-b border-border">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-semibold text-foreground mt-4 mb-2 first:mt-0 flex items-center gap-2">
                          <span className="w-1 h-[1em] bg-primary rounded-full inline-block flex-shrink-0" />
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm leading-7 text-foreground mb-3 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="my-2 ml-1 space-y-1.5">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="my-2 ml-1 space-y-1.5 list-decimal list-inside">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm leading-6 text-foreground flex items-start gap-2.5 list-none">
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2.5" />
                          <span className="flex-1 min-w-0">{children}</span>
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-muted-foreground">{children}</em>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-3 bg-primary/5 rounded-r-xl text-muted-foreground text-sm">
                          {children}
                        </blockquote>
                      ),
                      hr: () => <hr className="my-4 border-border" />,
                      code({ className, children, ...props }: any) {
                        const isBlock = className?.includes('language-');
                        if (isBlock) {
                          return (
                            <pre className="bg-muted/80 border border-border rounded-xl p-4 overflow-x-auto text-xs my-3 font-mono">
                              <code className={className} {...props}>{children}</code>
                            </pre>
                          );
                        }
                        return (
                          <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-xl border border-border">
                          <table className="min-w-full text-xs">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-muted/60">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-2.5 text-left font-semibold text-foreground border-b border-border">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-2.5 text-foreground border-b border-border/40">
                          {children}
                        </td>
                      ),
                      tr: ({ children }) => (
                        <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                  {isStreaming && (
                    <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              )}
            </div>

            {/* Action bar */}
            {!isStreaming && content && (
              <div className="flex items-center gap-1 mt-1.5 px-1 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleCopy}
                >
                  {copied
                    ? <Check className="h-3 w-3 mr-1 text-green-500" />
                    : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                {toolData && onToolOpen && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => onToolOpen(toolData)}
                  >
                    {toolData.type === 'flashcards' && <><Layers className="h-3 w-3" /> Open Flashcards</>}
                    {toolData.type === 'quiz' && <><HelpCircle className="h-3 w-3" /> Open Quiz</>}
                    {toolData.type === 'summary' && <><AlignLeft className="h-3 w-3" /> Open Summary</>}
                  </Button>
                )}
                {citations && citations.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCitations(s => !s)}
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    {citations.length} source{citations.length > 1 ? 's' : ''}
                    {showCitations
                      ? <ChevronUp className="h-3 w-3 ml-1" />
                      : <ChevronDown className="h-3 w-3 ml-1" />}
                  </Button>
                )}
              </div>
            )}

            {/* Citations panel */}
            {showCitations && citations && citations.length > 0 && (
              <div className="mt-2 space-y-1.5 animate-fade-in">
                {citations.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => onCitationClick?.(c)}
                    className="w-full text-left bg-muted/40 hover:bg-muted border border-border rounded-xl px-3 py-2.5 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-foreground truncate">{c.document_name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                          p.{c.page_number}
                        </Badge>
                      </div>
                      <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        Open →
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 pl-7">{c.snippet}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
