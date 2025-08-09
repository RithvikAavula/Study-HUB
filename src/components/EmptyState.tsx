import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <Card className={`p-12 text-center ${className || ''}`}>
      <CardContent>
        <div className="text-muted-foreground mb-4">
          <Icon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">{title}</h3>
          <p className="text-base leading-relaxed max-w-md mx-auto">{description}</p>
        </div>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-4">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};