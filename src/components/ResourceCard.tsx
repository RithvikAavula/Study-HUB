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
    <Card className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TypeIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={typeColors[type]}>
            {type}
          </Badge>
          <Badge variant="secondary">{department}</Badge>
          <Badge variant="secondary">{year} Year</Badge>
          <Badge variant="secondary">{subject}</Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Heart className={`h-4 w-4 ${liked ? 'text-red-500 fill-current' : ''}`} />
              <span>{likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="h-4 w-4" />
              <span>{downloads}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </div>
          </div>
        </div>

        {/* Author & Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {author.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{author}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{uploadDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mt-4 pt-4 border-t border-border/50">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="default" size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="ghost" size="sm" className="px-3">
            <Heart className={`h-4 w-4 ${liked ? 'text-red-500 fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};