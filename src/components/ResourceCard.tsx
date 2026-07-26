import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FileText, Image, Download, Heart, Star, Eye, Calendar, Pencil, Trash
} from "lucide-react";

interface ResourceCardProps {
  title: string;
  description: string;
  type: "Notes" | "PDFs" | "Images" | "Previous Papers" | "Assignments" | "Others";
  department: string;
  year: string;
  subject: string;
  author: string;
  likes: number;
  rating: number;
  userRating?: number;
  onRate?: (resourceId: string, rating: number) => void;
  downloads: number;
  uploadDate: string;
  liked?: boolean;
  id?: string;
  file_url?: string;
  onPreview?: (resource: any) => void;
  onDownload?: (resource: any) => void;
  onLike?: (resourceId: string) => void;
  authorLikes?: number;
  canEdit?: boolean;
  onEdit?: (resource: any) => void;
  onDelete?: (resource: any) => void;
}

const typeConfig: Record<ResourceCardProps["type"], { icon: any; gradient: string; badge: string }> = {
  "Notes":           { icon: FileText, gradient: "from-blue-500/20 to-cyan-500/20",   badge: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  "PDFs":            { icon: FileText, gradient: "from-purple-500/20 to-pink-500/20", badge: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  "Images":          { icon: Image,    gradient: "from-green-500/20 to-emerald-500/20", badge: "bg-green-500/15 text-green-400 border-green-500/20" },
  "Previous Papers": { icon: FileText, gradient: "from-orange-500/20 to-amber-500/20", badge: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  "Assignments":     { icon: FileText, gradient: "from-primary/20 to-accent/20",      badge: "bg-primary/15 text-primary border-primary/20" },
  "Others":          { icon: FileText, gradient: "from-muted/20 to-muted/10",         badge: "bg-muted/30 text-muted-foreground border-border/30" },
};

export const ResourceCard = ({
  title, description, type, department, year, subject, author,
  likes, rating, userRating = 0, onRate, downloads, uploadDate,
  liked = false, id, file_url, onPreview, onDownload, onLike,
  authorLikes = 0, canEdit = false, onEdit, onDelete,
}: ResourceCardProps) => {
  const config = typeConfig[type] ?? typeConfig["Others"];
  const TypeIcon = config.icon;

  return (
    <div className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer">
      {/* Gradient border glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300 -z-10 blur-sm" />

      <div className="glass rounded-2xl border border-border/40 group-hover:border-primary/30 transition-all duration-300 overflow-hidden">
        {/* Top gradient strip */}
        <div className={`h-1 w-full bg-gradient-to-r ${config.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
              <TypeIcon className="h-4 w-4 text-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 text-sm leading-snug mb-1">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge variant="outline" className={`${config.badge} text-xs px-2 py-0.5 font-medium`}>
              {type}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/40 border-border/40 text-muted-foreground">
              {department}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/40 border-border/40 text-muted-foreground">
              {year}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/40 border-border/40 text-muted-foreground hidden sm:inline-flex">
              {subject}
            </Badge>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Heart className={`h-3.5 w-3.5 ${liked ? 'text-red-400 fill-red-400' : ''}`} />
              <span>{likes}</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(star => (
                <Star
                  key={star}
                  className={`h-3 w-3 cursor-pointer transition-transform hover:scale-125 ${userRating >= star ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/40'}`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); id && onRate?.(id, star); }}
                />
              ))}
              <span className="ml-0.5">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              <span>{downloads}</span>
            </div>
          </div>

          {/* Author & Date */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/30 to-accent/30 text-foreground font-semibold">
                  {author.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">{author}</span>
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground/60">
                <Heart className="h-2.5 w-2.5 text-red-400/60" />
                {authorLikes}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground/60 flex-shrink-0">
              <Calendar className="h-3 w-3" />
              <span>{uploadDate}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs bg-muted/30 hover:bg-muted/60 border border-border/30 hover:border-border/60 transition-all duration-200"
              onClick={() => onPreview?.({ id, title, file_url, type })}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Preview
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent text-white border-0 shadow-md shadow-primary/20 transition-all duration-200"
              onClick={() => onDownload?.({ id, title, file_url, type })}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
              onClick={() => id && onLike?.(id)}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? 'text-red-400 fill-red-400' : ''}`} />
            </Button>
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  onClick={() => onEdit?.({ id, title, description, department, subject, file_url, type, year })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                  onClick={() => onDelete?.({ id, title, file_url })}
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
