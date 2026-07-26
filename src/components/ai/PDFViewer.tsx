import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Citation } from '@/lib/aiApi';

// Set worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  initialPage?: number;
  citation?: Citation | null;
  onClose: () => void;
}

export function PDFViewer({ fileUrl, fileName, initialPage = 1, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scale, setScale] = useState(1.2);
  const [pageInput, setPageInput] = useState(String(initialPage));

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, numPages));
    setCurrentPage(clamped);
    setPageInput(String(clamped));
  };

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const n = parseInt(pageInput);
      if (!isNaN(n)) goToPage(n);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-background border border-border rounded-xl shadow-2xl flex flex-col w-full max-w-3xl h-[90vh] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold truncate text-foreground">{fileName}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Zoom */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setScale(s => Math.min(3, s + 0.2))}>
              <ZoomIn className="h-4 w-4" />
            </Button>

            {/* Page nav */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <Input
                className="h-7 w-12 text-xs text-center px-1"
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onKeyDown={handlePageInput}
              />
              <span className="text-xs text-muted-foreground">/ {numPages}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= numPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto flex justify-center bg-muted/30 p-4">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground animate-pulse">Loading PDF...</div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-destructive">Failed to load PDF.</div>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
