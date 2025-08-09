import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink } from "lucide-react";

interface ResourcePreviewProps {
  resource: {
    id: string;
    title: string;
    file_url: string;
    type: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (resource: any) => void;
}

export const ResourcePreview = ({ resource, isOpen, onClose, onDownload }: ResourcePreviewProps) => {
  const [loading, setLoading] = useState(false);

  if (!resource) return null;

  const isImage = resource.type === "Images" || resource.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = resource.type === "PDFs" || resource.file_url?.match(/\.pdf$/i);

  const handleDownload = () => {
    setLoading(true);
    onDownload(resource);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleOpenInNewTab = () => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate pr-4">
              {resource.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? "Downloading..." : "Download"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4 max-h-[70vh] overflow-auto">
          {isImage ? (
            <div className="flex justify-center">
              <img
                src={resource.file_url}
                alt={resource.title}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden text-center p-8 text-muted-foreground">
                <p>Unable to preview this image.</p>
                <Button variant="outline" onClick={handleDownload} className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download to view
                </Button>
              </div>
            </div>
          ) : isPDF ? (
            <div className="space-y-4">
              <div className="text-center p-8 bg-muted/50 rounded-lg">
                <div className="mb-4">
                  <p className="text-lg mb-2">PDF Preview</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Open in Tab" to view the PDF in a new browser tab, or download it to your device.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="default" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open PDF in New Tab
                  </Button>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground">
              <div className="mb-4">
                <p className="text-lg mb-2">Preview not available</p>
                <p className="text-sm">This file type cannot be previewed in the browser.</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="default" onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download to view
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};