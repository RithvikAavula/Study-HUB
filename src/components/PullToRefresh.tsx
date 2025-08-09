import React from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = ''
}) => {
  const { containerRef, isRefreshing, pullDistance, isPulling } = usePullToRefresh({
    onRefresh,
    threshold: 80
  });

  const refreshProgress = Math.min(pullDistance / 80, 1);
  const showIndicator = isPulling || isRefreshing;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto pull-to-refresh smooth-scroll ${className}`}
      style={{
        transform: isPulling ? `translateY(${Math.min(pullDistance * 0.5, 40)}px)` : 'translateY(0)',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      {showIndicator && (
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center py-4 transition-all duration-300"
          style={{
            transform: `translateX(-50%) translateY(${isPulling ? '0' : '-100%'})`,
            opacity: isPulling ? refreshProgress : (isRefreshing ? 1 : 0)
          }}
        >
          <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-lg border border-border/50">
            <RefreshCw 
              className={`h-5 w-5 text-primary transition-transform duration-200 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: `rotate(${refreshProgress * 180}deg)`
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            {isRefreshing ? 'Refreshing...' : refreshProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </p>
        </div>
      )}
      
      {children}
    </div>
  );
};