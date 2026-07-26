import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
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

  const current = flashcards[index];

  const next = () => { setFlipped(false); setTimeout(() => setIndex(i => Math.min(i + 1, flashcards.length - 1)), 150); };
  const prev = () => { setFlipped(false); setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 150); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Flashcards</span>
            <Badge variant="secondary">{index + 1} / {flashcards.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Card */}
        <div
          className="relative h-56 cursor-pointer select-none"
          style={{ perspective: '1000px' }}
          onClick={() => setFlipped(f => !f)}
        >
          <div
            className="w-full h-full transition-transform duration-500 relative"
            style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 border border-border rounded-xl flex flex-col items-center justify-center p-6 text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <Badge variant="outline" className="mb-3 text-xs">{current.topic}</Badge>
              <p className="text-lg font-semibold text-foreground">{current.front}</p>
              <p className="text-xs text-muted-foreground mt-4">Click to reveal answer</p>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-border rounded-xl flex flex-col items-center justify-center p-6 text-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <Badge variant="outline" className="mb-3 text-xs">{current.topic}</Badge>
              <p className="text-base text-foreground leading-relaxed">{current.back}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" size="sm" onClick={prev} disabled={index === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setFlipped(false)}>
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={next} disabled={index === flashcards.length - 1}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-3">
          {flashcards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFlipped(false); setIndex(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
