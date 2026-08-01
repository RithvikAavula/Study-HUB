import { X, BookOpen, Lightbulb, Target, Star, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SummaryResponse } from '@/lib/aiApi';

interface SummaryViewerProps {
  summary: SummaryResponse;
  onClose: () => void;
}

export function SummaryViewer({ summary, onClose }: SummaryViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden border border-border/60">

        {/* Header */}
        <div className="relative flex-shrink-0 px-5 pt-5 pb-4 bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base leading-tight">Document Summary</h2>
                <p className="text-xs text-muted-foreground mt-0.5">AI-generated overview</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0 -mt-1 -mr-1" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-5 space-y-5">

            {/* Overview */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <span className="font-semibold text-sm text-foreground">Overview</span>
              </div>
              <div className="bg-gradient-to-br from-blue-500/8 to-cyan-500/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-foreground leading-relaxed">{summary.overview}</p>
              </div>
            </section>

            {/* Key Concepts */}
            {summary.key_concepts?.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                    <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">Key Concepts</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{summary.key_concepts.length}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.key_concepts.map((concept, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/25 text-yellow-700 dark:text-yellow-400"
                    >
                      <Hash className="h-2.5 w-2.5" />
                      {concept}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Important Definitions */}
            {summary.important_definitions?.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Target className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">Important Definitions</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{summary.important_definitions.length}</Badge>
                </div>
                <div className="space-y-2.5">
                  {summary.important_definitions.map((def, i) => (
                    <div key={i} className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-violet-500/5 overflow-hidden">
                      <div className="px-4 py-2 bg-purple-500/10 border-b border-purple-500/15">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">{def.term}</span>
                      </div>
                      <p className="px-4 py-2.5 text-sm text-foreground leading-relaxed">{def.definition}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Exam Tips */}
            {summary.exam_tips?.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-lg bg-orange-500/15 flex items-center justify-center">
                    <Star className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">Exam Tips</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{summary.exam_tips.length}</Badge>
                </div>
                <div className="space-y-2">
                  {summary.exam_tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500/8 to-amber-500/5 border border-orange-500/20">
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* bottom breathing room */}
            <div className="h-2" />
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-border/40 bg-card/50">
          <Button onClick={onClose} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
