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
  User
} from "lucide-react";

interface ResourceCardProps {
  title: string;
  description: string;
  type: "Notes" | "PDF" | "Image" | "Question Paper" | "Assignment";
  department: string;
  year: string;
  subject: string;
  author: string;
  likes: number;
  rating: number;
  downloads: number;
  uploadDate: string;
  liked?: boolean;
}

const typeIcons = {
  "Notes": FileText,
  "PDF": FileText,
  "Image": Image,
  "Question Paper": FileText,
  "Assignment": FileText,
};

const typeColors = {
  "Notes": "bg-academic-blue/10 text-academic-blue border-academic-blue/20",
  "PDF": "bg-academic-purple/10 text-academic-purple border-academic-purple/20",
  "Image": "bg-academic-green/10 text-academic-green border-academic-green/20",
  "Question Paper": "bg-academic-orange/10 text-academic-orange border-academic-orange/20",
  "Assignment": "bg-primary/10 text-primary border-primary/20",
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
  downloads,
  uploadDate,
  liked = false
}: ResourceCardProps) => {
  const TypeIcon = typeIcons[type];

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
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-500" />
              <span>{rating.toFixed(1)}</span>
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
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline">{uploadDate}</span>
            <span className="sm:hidden">{uploadDate.split(' ')[0]}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-border/50">
          <Button variant="outline" size="sm" className="flex-1 text-xs lg:text-sm h-8 lg:h-9">
            <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Preview</span>
            <span className="sm:hidden">View</span>
          </Button>
          <Button variant="default" size="sm" className="flex-1 text-xs lg:text-sm h-8 lg:h-9">
            <Download className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Download</span>
            <span className="sm:hidden">Get</span>
          </Button>
          <Button variant="ghost" size="sm" className="px-2 lg:px-3 h-8 lg:h-9 active:scale-95 transition-transform">
            <Heart className={`h-3 w-3 lg:h-4 lg:w-4 ${liked ? 'text-red-500 fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};