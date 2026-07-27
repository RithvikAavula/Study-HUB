import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, RotateCcw, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Flashcard } from '@/lib/aiApi';

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

export function FlashcardViewer({ flashcards, onClose }: FlashcardViewerProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Record<number, boolean | null>>({});
  const [animating, setAnimating] = useState(false);

  const current = flashcards[index];
  const knownCount = Object.values(known).filter(v => v === true).length;

  const goTo = useCallback((next: number) => {
    if (animating) return;
    setAnimating(true);
    setFlipped(false);
    setTimeout(() => { setIndex(next); setAnimating(false); }, 200);
  }, [animating]);

  const prev = () => index > 0 && goTo(index - 1);
  const next = () => index < flashcards.length - 1 && goTo(index + 1);

  const markKnown = (val: boolean) => {
    setKnown(k => ({ ...k, [index]: val }));
    if (index < flashcards.length - 1) setTimeout(() => goTo(index + 1), 400);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, animating]);

  const progress = ((index + 1) / flashcards.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-xl flex flex-col gap-4 p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold text-foreground">Flashcards</span>
            <Badge variant="secondary" className="text-xs">{index + 1} / {flashcards.length}</Badge>
            {knownCount > 0 && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-500/40">
                {knownCount} known
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <div
          className={`relative h-64 cursor-pointer select-none transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}
          style={{ perspective: '1200px' }}
          onClick={() => setFlipped(f => !f)}
        >
          <div
            className="w-full h-full transition-transform duration-500 relative"
            style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-purple-500/10 flex flex-col items-center justify-center p-8 text-center gap-3"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <Badge variant="outline" className="text-xs shrink-0">{current.topic}</Badge>
              <p className="text-xl font-semibold text-foreground leading-snug">{current.front}</p>
              <span className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <span className="inline-block w-4 h-px bg-muted-foreground/40" />
                click or press Space to flip
                <span className="inline-block w-4 h-px bg-muted-foreground/40" />
              </span>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 via-background to-emerald-500/10 flex flex-col items-center justify-center p-8 text-center gap-3"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <Badge variant="outline" className="text-xs border-green-500/40 text-green-600 shrink-0">Answer</Badge>
              <p className="text-base text-foreground leading-relaxed">{current.back}</p>
            </div>
          </div>

          {/* Known indicator */}
          {known[index] !== undefined && (
            <div className={`absolute top-3 right-3 rounded-full p-1 ${known[index] ? 'text-green-500' : 'text-red-400'}`}>
              {known[index] ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </div>
          )}
        </div>

        {/* Self-assessment (shown after flip) */}
        {flipped && (
          <div className="flex items-center justify-center gap-3 animate-fade-in">
            <span className="text-xs text-muted-foreground">Did you get it?</span>
            <Button
              size="sm"
              variant="outline"
              className="border-red-400/50 text-red-500 hover:bg-red-500/10 gap-1.5"
              onClick={(e) => { e.stopPropagation(); markKnown(false); }}
            >
              <XCircle className="h-3.5 w-3.5" /> Still learning
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-green-500/50 text-green-600 hover:bg-green-500/10 gap-1.5"
              onClick={(e) => { e.stopPropagation(); markKnown(true); }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Got it!
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={prev} disabled={index === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setFlipped(false)} className="gap-1 text-muted-foreground">
            <RotateCcw className="h-3 w-3" /> Flip back
          </Button>
          <Button variant="outline" size="sm" onClick={next} disabled={index === flashcards.length - 1} className="gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Dot navigation */}
        <div className="flex justify-center gap-1.5 flex-wrap">
          {flashcards.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-200 ${
                i === index
                  ? 'w-4 h-2 bg-primary'
                  : known[i] === true
                  ? 'w-2 h-2 bg-green-500'
                  : known[i] === false
                  ? 'w-2 h-2 bg-red-400'
                  : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">← → to navigate · Space to flip · Esc to close</p>
      </div>
    </div>
  );
}
