import { useState } from 'react';
import { X, CheckCircle, XCircle, ChevronRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/lib/aiApi';

interface QuizViewerProps {
  questions: QuizQuestion[];
  onClose: () => void;
}

export function QuizViewer({ questions, onClose }: QuizViewerProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const q = questions[current];
  const isCorrect = submitted && selected?.toLowerCase().startsWith(q.answer.toLowerCase().charAt(0).toLowerCase()) ||
    submitted && selected?.toLowerCase() === q.answer.toLowerCase();

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    const correct = selected.toLowerCase().includes(q.answer.toLowerCase().charAt(0).toLowerCase()) ||
      selected.toLowerCase() === q.answer.toLowerCase() ||
      q.answer.toLowerCase().startsWith(selected.toLowerCase());
    if (correct) setScore(s => s + 1);
    setAnswers(a => ({ ...a, [current]: selected }));
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

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Quiz Complete!</h2>
          <p className="text-muted-foreground mb-6">You scored {score} out of {questions.length}</p>
          <div className="w-full bg-muted rounded-full h-3 mb-2">
            <div className="bg-primary h-3 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-3xl font-bold text-primary mb-6">{pct}%</p>
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Quiz</span>
            <Badge variant="secondary">{current + 1} / {questions.length}</Badge>
            <Badge variant="outline" className="text-xs capitalize">{q.difficulty}</Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="w-full bg-muted rounded-full h-1.5 mb-5">
          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>

        <p className="text-base font-medium text-foreground mb-4 leading-relaxed">{q.question}</p>

        {/* Options */}
        {q.options ? (
          <div className="space-y-2 mb-4">
            {q.options.map((opt, i) => {
              const isSelected = selected === opt;
              const isAnswerOpt = submitted && opt.toLowerCase().startsWith(q.answer.toLowerCase().charAt(0).toLowerCase());
              return (
                <button
                  key={i}
                  disabled={submitted}
                  onClick={() => setSelected(opt)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all',
                    !submitted && isSelected && 'border-primary bg-primary/10',
                    !submitted && !isSelected && 'border-border hover:border-primary/50 hover:bg-muted/50',
                    submitted && isAnswerOpt && 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400',
                    submitted && isSelected && !isAnswerOpt && 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400',
                    submitted && !isSelected && !isAnswerOpt && 'border-border opacity-50',
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type your answer..."
            value={selected || ''}
            onChange={e => setSelected(e.target.value)}
            disabled={submitted}
          />
        )}

        {/* Explanation */}
        {submitted && (
          <div className={cn('rounded-lg px-4 py-3 mb-4 text-sm', isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30')}>
            <div className="flex items-center gap-2 mb-1">
              {isCorrect ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
              <span className="font-medium">{isCorrect ? 'Correct!' : `Answer: ${q.answer}`}</span>
            </div>
            <p className="text-muted-foreground">{q.explanation}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!submitted ? (
            <Button className="flex-1" onClick={handleSubmit} disabled={!selected}>Submit</Button>
          ) : (
            <Button className="flex-1" onClick={handleNext}>
              {current + 1 >= questions.length ? 'Finish' : 'Next'} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
