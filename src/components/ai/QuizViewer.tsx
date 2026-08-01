import { useState } from 'react';
import { X, CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/lib/aiApi';

interface QuizViewerProps {
  questions: QuizQuestion[];
  onClose: () => void;
}

const difficultyColor: Record<string, string> = {
  easy: 'bg-green-500/15 text-green-600 border-green-500/30',
  medium: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  hard: 'bg-red-500/15 text-red-600 border-red-500/30',
};

export function QuizViewer({ questions, onClose }: QuizViewerProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);

  const q = questions[current];
  const progress = ((current + (submitted ? 1 : 0)) / questions.length) * 100;

  const isOptionCorrect = (opt: string) => {
    const a = q.answer.toLowerCase();
    const o = opt.toLowerCase();
    return o === a || o.startsWith(a.charAt(0) + ')') || a.startsWith(o.charAt(0));
  };

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    if (isOptionCorrect(selected)) {
      setScore(s => s + 1);
    } else {
      setWrongAnswers(w => [...w, current]);
    }
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setSubmitted(false);
    }
  };

  const restart = () => {
    setCurrent(0); setSelected(null); setSubmitted(false);
    setScore(0); setFinished(false); setWrongAnswers([]);
  };

  // ── Score screen ──────────────────────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 80 ? { label: 'Excellent!', color: 'text-green-500', bg: 'from-green-500/20 to-emerald-500/10' }
      : pct >= 60 ? { label: 'Good Job!', color: 'text-yellow-500', bg: 'from-yellow-500/20 to-amber-500/10' }
      : { label: 'Keep Practicing', color: 'text-red-500', bg: 'from-red-500/20 to-rose-500/10' };

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
        <div className="bg-background w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl border border-border/60 overflow-hidden">
          <div className={`bg-gradient-to-br ${grade.bg} px-6 pt-8 pb-6 text-center`}>
            <div className="relative inline-block mb-4">
              <div className="h-20 w-20 rounded-full bg-background/80 flex items-center justify-center mx-auto shadow-lg">
                <Trophy className={`h-10 w-10 ${grade.color}`} />
              </div>
            </div>
            <h2 className={`text-2xl font-bold mb-1 ${grade.color}`}>{grade.label}</h2>
            <p className="text-muted-foreground text-sm">Quiz Complete</p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Score ring */}
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{score}<span className="text-xl text-muted-foreground">/{questions.length}</span></div>
                <div className="text-xs text-muted-foreground mt-0.5">Correct</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className={`text-4xl font-bold ${grade.color}`}>{pct}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">Score</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{questions.length - score}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Wrong</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 gap-2" onClick={restart}>
                <RotateCcw className="h-4 w-4" /> Retry
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────────────────────
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl border border-border/60 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-border/40 bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-purple-500" />
              </div>
              <span className="font-bold text-foreground">Quiz</span>
              <Badge variant="secondary" className="text-xs">{current + 1}/{questions.length}</Badge>
              {q.difficulty && (
                <Badge variant="outline" className={cn('text-xs capitalize', difficultyColor[q.difficulty] ?? '')}>
                  {q.difficulty}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
          {/* Dot indicators */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {questions.map((_, i) => (
              <div key={i} className={cn('h-1.5 rounded-full transition-all duration-300',
                i < current ? (wrongAnswers.includes(i) ? 'bg-red-400 w-3' : 'bg-green-500 w-3')
                : i === current ? 'bg-primary w-5'
                : 'bg-muted w-1.5'
              )} />
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Question */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/15 rounded-xl p-4">
            <p className="text-sm font-medium text-foreground leading-relaxed">{q.question}</p>
          </div>

          {/* Options */}
          {q.options ? (
            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                const correct = submitted && isOptionCorrect(opt);
                const wrong = submitted && selected === opt && !isOptionCorrect(opt);
                const neutral = submitted && !correct && selected !== opt;
                return (
                  <button
                    key={i}
                    disabled={submitted}
                    onClick={() => setSelected(opt)}
                    className={cn(
                      'w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-200',
                      !submitted && selected === opt && 'border-primary bg-primary/10 shadow-sm shadow-primary/20',
                      !submitted && selected !== opt && 'border-border hover:border-primary/40 hover:bg-muted/50',
                      correct && 'border-green-500 bg-green-500/10',
                      wrong && 'border-red-500 bg-red-500/10',
                      neutral && 'border-border opacity-40',
                    )}
                  >
                    <span className={cn(
                      'flex-shrink-0 h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors',
                      !submitted && selected === opt ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
                      correct && 'bg-green-500 text-white',
                      wrong && 'bg-red-500 text-white',
                    )}>
                      {optionLabels[i] ?? i + 1}
                    </span>
                    <span className={cn('flex-1 leading-snug',
                      correct && 'text-green-700 dark:text-green-400 font-medium',
                      wrong && 'text-red-700 dark:text-red-400',
                    )}>{opt}</span>
                    {correct && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                    {wrong && <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="Type your answer..."
              value={selected || ''}
              onChange={e => setSelected(e.target.value)}
              disabled={submitted}
            />
          )}

          {/* Explanation */}
          {submitted && (
            <div className={cn('rounded-xl px-4 py-3 text-sm border animate-fade-in',
              isOptionCorrect(selected ?? '') ? 'bg-green-500/8 border-green-500/25' : 'bg-red-500/8 border-red-500/25'
            )}>
              <div className="flex items-center gap-2 mb-1.5">
                {isOptionCorrect(selected ?? '')
                  ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                <span className={cn('font-semibold text-sm',
                  isOptionCorrect(selected ?? '') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {isOptionCorrect(selected ?? '') ? 'Correct!' : `Correct answer: ${q.answer}`}
                </span>
              </div>
              {q.explanation && <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-border/40 bg-card/50">
          {!submitted ? (
            <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0"
              onClick={handleSubmit} disabled={!selected}>
              Submit Answer
            </Button>
          ) : (
            <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 gap-2"
              onClick={handleNext}>
              {current + 1 >= questions.length ? 'See Results' : 'Next Question'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
