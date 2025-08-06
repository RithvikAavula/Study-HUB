import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

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

  const isImage = resource.type === "Image" || resource.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = resource.type === "PDF" || resource.file_url?.match(/\.pdf$/i);

  const handleDownload = () => {
    setLoading(true);
    onDownload(resource);
    setTimeout(() => setLoading(false), 1000);
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
            <div className="w-full h-[70vh]">
              <iframe
                src={resource.file_url}
                title={resource.title}
                className="w-full h-full border rounded-lg"
                onError={() => {
                  console.log("PDF preview failed");
                }}
              />
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground">
              <div className="mb-4">
                <p className="text-lg mb-2">Preview not available</p>
                <p className="text-sm">This file type cannot be previewed in the browser.</p>
              </div>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download to view
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};