import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileText, 
  Image, 
  Download, 
  Heart, 
  Star, 
  Eye,
  Calendar,
  User,
  Pencil,
  Trash
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
  rating: number; // average rating
  userRating?: number; // user's own rating
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

const typeIcons: Record<ResourceCardProps["type"], any> = {
  "Notes": FileText,
  "PDFs": FileText,
  "Images": Image,
  "Previous Papers": FileText,
  "Assignments": FileText,
  "Others": FileText,
};

const typeColors: Record<ResourceCardProps["type"], string> = {
  "Notes": "bg-academic-blue/10 text-academic-blue border-academic-blue/20",
  "PDFs": "bg-academic-purple/10 text-academic-purple border-academic-purple/20",
  "Images": "bg-academic-green/10 text-academic-green border-academic-green/20",
  "Previous Papers": "bg-academic-orange/10 text-academic-orange border-academic-orange/20",
  "Assignments": "bg-primary/10 text-primary border-primary/20",
  "Others": "bg-muted text-muted-foreground border-border/50",
};

export const ResourceCard = ({
  title,
  description,
  type,
  department,
  year,
  subject,
  author,
  likes,
  rating,
  userRating = 0,
  onRate,
  downloads,
  uploadDate,
  liked = false,
  id,
  file_url,
  onPreview,
  onDownload,
  onLike,
  authorLikes = 0,
  canEdit = false,
  onEdit,
  onDelete
}: ResourceCardProps) => {
  const TypeIcon = typeIcons[type] ?? FileText;

  // Star rating UI
  const stars = [1, 2, 3, 4, 5];

  return (
    <Card className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50 cursor-pointer active:scale-[0.98]">
      <CardContent className="p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3 lg:mb-4">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <TypeIcon className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm lg:text-base leading-tight">
              {title}
            </h3>
            <p className="text-xs lg:text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 lg:gap-2 mb-3 lg:mb-4">
          <Badge variant="outline" className={`${typeColors[type]} text-xs`}>
            {type}
          </Badge>
          <Badge variant="secondary" className="text-xs">{department}</Badge>
          <Badge variant="secondary" className="text-xs">{year}</Badge>
          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">{subject}</Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs lg:text-sm text-muted-foreground mb-3 lg:mb-4">
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-1">
              <Heart className={`h-3 w-3 lg:h-4 lg:w-4 ${liked ? 'text-red-500 fill-current' : ''}`} />
              <span>{likes}</span>
            </div>
            {/* Rating: average and user */}
            <div className="flex items-center gap-1">
              <span className="flex items-center">
                {stars.map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 lg:h-4 lg:w-4 cursor-pointer ${userRating >= star ? 'text-yellow-400' : 'text-muted-foreground'}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); id && onRate?.(id, star); }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    title={userRating ? `Your rating: ${userRating}` : `Rate ${star} star${star > 1 ? 's' : ''}`}
                    fill={userRating >= star ? '#facc15' : 'none'}
                    strokeWidth={userRating >= star ? 0 : 2}
                  />
                ))}
              </span>
              <span className="ml-1">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3 lg:h-4 lg:w-4" />
              <span>{downloads}</span>
            </div>
          </div>
        </div>

        {/* Author & Date */}
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {author.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs lg:text-sm text-muted-foreground truncate">{author}</span>
            <span className="flex items-center gap-1 text-xs text-academic-blue ml-2" title="Total likes on author's uploads">
              <Heart className="h-3 w-3 text-red-500" />
              {authorLikes}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline">{uploadDate}</span>
            <span className="sm:hidden">{uploadDate.split(' ')[0]}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs lg:text-sm h-8 lg:h-9"
            onClick={() => onPreview?.({ id, title, file_url, type })}
          >
            <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Preview</span>
            <span className="sm:hidden">View</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 text-xs lg:text-sm h-8 lg:h-9"
            onClick={() => onDownload?.({ id, title, file_url, type })}
          >
            <Download className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Download</span>
            <span className="sm:hidden">Get</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-2 lg:px-3 h-8 lg:h-9 active:scale-95 transition-transform"
            onClick={() => id && onLike?.(id)}
          >
            <Heart className={`h-3 w-3 lg:h-4 lg:w-4 ${liked ? 'text-red-500 fill-current' : ''}`} />
          </Button>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="px-2 lg:px-3 h-8 lg:h-9"
                onClick={() => onEdit?.({ id, title, description, department, subject, file_url, type, year })}
                title="Edit resource"
              >
                <Pencil className="h-3 w-3 lg:h-4 lg:w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="px-2 lg:px-3 h-8 lg:h-9"
                onClick={() => onDelete?.({ id, title, file_url })}
                title="Delete resource"
              >
                <Trash className="h-3 w-3 lg:h-4 lg:w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};