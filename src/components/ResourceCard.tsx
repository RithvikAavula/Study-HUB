import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Image, Download, Heart, Star, Eye, Calendar, Pencil, Trash } from "lucide-react";
import { useState } from "react";

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

const typeConfig: Record<ResourceCardProps["type"], {
  icon: any; gradient: string; badge: string; glow: string; accent: string;
}> = {
  "Notes":           { icon: FileText, gradient: "from-blue-500/25 to-cyan-500/15",    badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",    glow: "group-hover:shadow-blue-500/15",   accent: "bg-blue-500" },
  "PDFs":            { icon: FileText, gradient: "from-violet-500/25 to-purple-500/15", badge: "bg-violet-500/15 text-violet-400 border-violet-500/25", glow: "group-hover:shadow-violet-500/15", accent: "bg-violet-500" },
  "Images":          { icon: Image,    gradient: "from-emerald-500/25 to-teal-500/15",  badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", glow: "group-hover:shadow-emerald-500/15", accent: "bg-emerald-500" },
  "Previous Papers": { icon: FileText, gradient: "from-orange-500/25 to-amber-500/15", badge: "bg-orange-500/15 text-orange-400 border-orange-500/25", glow: "group-hover:shadow-orange-500/15",  accent: "bg-orange-500" },
  "Assignments":     { icon: FileText, gradient: "from-primary/25 to-accent/15",       badge: "bg-primary/15 text-primary border-primary/25",          glow: "group-hover:shadow-primary/15",    accent: "bg-primary" },
  "Others":          { icon: FileText, gradient: "from-muted/30 to-muted/10",          badge: "bg-muted/30 text-muted-foreground border-border/30",    glow: "",                                  accent: "bg-muted-foreground" },
};

export const ResourceCard = ({
  title, description, type, department, year, subject, author,
  likes, rating, userRating = 0, onRate, downloads, uploadDate,
  liked = false, id, file_url, onPreview, onDownload, onLike,
  authorLikes = 0, canEdit = false, onEdit, onDelete,
}: ResourceCardProps) => {
  const config = typeConfig[type] ?? typeConfig["Others"];
  const TypeIcon = config.icon;
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
    id && onLike?.(id);
  };

  return (
    <div className={`group relative rounded-2xl overflow-hidden transition-all duration-350 hover:-translate-y-2 cursor-pointer shine ${config.glow}`}
      style={{ boxShadow: '0 2px 12px hsl(0 0% 0% / 0.06)' }}
    >
      {/* Glow halo */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-350 -z-10 blur-xl bg-gradient-to-br from-primary/20 to-accent/20" />

      <div className="bg-card border border-border/50 group-hover:border-primary/30 rounded-2xl transition-all duration-350 overflow-hidden h-full flex flex-col"
        style={{ boxShadow: 'inset 0 1px 0 hsl(0 0% 100% / 0.05)' }}
      >
        {/* Colored top bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${config.gradient} opacity-70 group-hover:opacity-100 transition-opacity duration-300`} />

        {/* Inner glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/[0.03] group-hover:to-accent/[0.03] transition-all duration-350 pointer-events-none rounded-2xl" />

        <div className="p-5 flex flex-col flex-1 relative">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              <TypeIcon className="h-4 w-4 text-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 text-sm leading-snug mb-1">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge variant="outline" className={`${config.badge} text-xs px-2 py-0.5 font-semibold`}>
              {type}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/40 border-border/40 text-muted-foreground font-medium">
              {department}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/40 border-border/40 text-muted-foreground font-medium">
              {year}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/40 border-border/40 text-muted-foreground font-medium hidden sm:inline-flex">
              {subject}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Heart className={`h-3.5 w-3.5 transition-colors ${liked ? 'text-red-400 fill-red-400' : ''}`} />
              <span className="font-medium">{likes}</span>
            </div>
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(star => (
                <Star
                  key={star}
                  className={`h-3 w-3 cursor-pointer transition-all hover:scale-125 ${
                    userRating >= star ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 hover:text-amber-400/60'
                  }`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); id && onRate?.(id, star); }}
                />
              ))}
              <span className="ml-1 font-medium">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              <span className="font-medium">{downloads}</span>
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-6 w-6 flex-shrink-0 ring-1 ring-border/50">
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/30 to-accent/30 text-foreground font-bold">
                  {author.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate font-medium">{author}</span>
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground/50">
                <Heart className="h-2.5 w-2.5 text-red-400/50 fill-red-400/50" />
                {authorLikes}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground/50 flex-shrink-0">
              <Calendar className="h-3 w-3" />
              <span>{uploadDate}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 pt-3 border-t border-border/30 mt-auto">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs bg-muted/30 hover:bg-muted/60 border border-border/30 hover:border-border/60 transition-all duration-200 rounded-xl"
              onClick={() => onPreview?.({ id, title, file_url, type })}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 shadow-md shadow-primary/20 transition-all duration-200 rounded-xl hover:-translate-y-0.5"
              onClick={() => onDownload?.({ id, title, file_url, type })}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Download
            </Button>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${liked ? 'text-red-400 bg-red-400/10' : 'hover:bg-red-500/10 hover:text-red-400'}`}
                onClick={handleLike}
              >
                <Heart className={`h-3.5 w-3.5 transition-all duration-300 ${liked ? 'fill-red-400' : ''} ${likeAnim ? 'scale-150' : 'scale-100'}`} />
              </Button>
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    onClick={() => onEdit?.({ id, title, description, department, subject, file_url, type, year })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
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
    </div>
  );
};
