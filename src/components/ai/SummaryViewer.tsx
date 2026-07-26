import { X, Lightbulb, BookOpen, Target, Star } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <span className="font-semibold text-foreground text-lg">Document Summary</span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-5">
            {/* Overview */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">Overview</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{summary.overview}</p>
            </div>

            {/* Key Concepts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold text-sm text-foreground">Key Concepts</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.key_concepts.map((concept, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{concept}</Badge>
                ))}
              </div>
            </div>

            {/* Important Definitions */}
            {summary.important_definitions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="font-semibold text-sm text-foreground">Important Definitions</span>
                </div>
                <div className="space-y-2">
                  {summary.important_definitions.map((def, i) => (
                    <div key={i} className="border border-border rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold text-primary">{def.term}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{def.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam Tips */}
            {summary.exam_tips.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-sm text-foreground">Exam Tips</span>
                </div>
                <ul className="space-y-1.5">
                  {summary.exam_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-orange-500 font-bold flex-shrink-0">{i + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
