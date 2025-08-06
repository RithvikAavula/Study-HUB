import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { FilterSection } from '@/components/FilterSection';
import { ResourceCard } from '@/components/ResourceCard';
import { ResourcePreview } from '@/components/ResourcePreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Filter, SortAsc, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonGrid } from '@/components/SkeletonCard';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration - same as Dashboard
const mockResources = [
  {
    title: "Data Structures Complete Notes",
    description: "Comprehensive notes covering all topics from arrays to advanced trees and graphs with examples.",
    type: "Notes" as const,
    department: "CSE",
    year: "2nd",
    subject: "Data Structures",
    author: "Ravi Kumar",
    likes: 234,
    rating: 4.8,
    downloads: 1205,
    uploadDate: "2 days ago",
    liked: true,
  },
  {
    title: "Digital Electronics Previous Papers",
    description: "Last 5 years question papers with solutions for Digital Electronics subject.",
    type: "Question Paper" as const,
    department: "ECE",
    year: "2nd",
    subject: "Digital Electronics",
    author: "Priya Sharma",
    likes: 189,
    rating: 4.6,
    downloads: 892,
    uploadDate: "1 week ago",
    liked: false,
  },
  {
    title: "Thermodynamics Lab Report",
    description: "Complete lab report with all experiments, observations, and analysis.",
    type: "Assignment" as const,
    department: "MECH",
    year: "3rd",
    subject: "Thermodynamics",
    author: "Amit Singh",
    likes: 67,
    rating: 4.3,
    downloads: 234,
    uploadDate: "3 days ago",
    liked: false,
  },
  {
    title: "Machine Learning Algorithms PDF",
    description: "Detailed explanation of ML algorithms with Python implementations and real-world examples.",
    type: "PDF" as const,
    department: "AI&DS",
    year: "4th",
    subject: "Machine Learning",
    author: "Sneha Patel",
    likes: 456,
    rating: 4.9,
    downloads: 2103,
    uploadDate: "5 days ago",
    liked: true,
  },
  {
    title: "Circuit Diagrams Collection",
    description: "High-quality circuit diagrams for various electronic components and systems.",
    type: "Image" as const,
    department: "EEE",
    year: "2nd",
    subject: "Circuit Analysis",
    author: "Rajesh Gupta",
    likes: 123,
    rating: 4.4,
    downloads: 567,
    uploadDate: "1 week ago",
    liked: false,
  },
  {
    title: "Operating Systems Concepts",
    description: "Complete notes on OS concepts including process management, memory management, and file systems.",
    type: "Notes" as const,
    department: "IT",
    year: "3rd",
    subject: "Operating Systems",
    author: "Anisha Roy",
    likes: 289,
    rating: 4.7,
    downloads: 934,
    uploadDate: "4 days ago",
    liked: true,
  },
];

const Resources = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<any>({});
  const [sortBy, setSortBy] = useState('recent');
  const [resources, setResources] = useState<any[]>([]);
  const [filteredResources, setFilteredResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [previewResource, setPreviewResource] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
    fetchResources();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    setUserProfile(data);
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author names separately
      const profileIds = data?.map(r => r.uploaded_by).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', profileIds);

      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      // Transform data to match expected format
      const transformedData = data?.map(resource => ({
        title: resource.title,
        description: resource.description,
        type: resource.resource_type,
        department: resource.department,
        year: `${resource.year}${getOrdinalSuffix(resource.year)}`,
        subject: resource.subject,
        author: profileMap.get(resource.uploaded_by) || 'Anonymous',
        likes: resource.likes_count || 0,
        rating: Number(resource.average_rating) || 0,
        downloads: resource.download_count || 0,
        uploadDate: formatDate(resource.created_at),
        liked: false, // TODO: Check if current user liked this
        id: resource.id,
        file_url: resource.file_url,
        resource_type: resource.resource_type
      })) || [];

      setResources(transformedData);
      
      // Apply default filters based on user profile
      if (userProfile) {
        const defaultFilters = {
          department: userProfile.department,
          year: `${userProfile.year}${getOrdinalSuffix(userProfile.year)}`
        };
        applyFilters(transformedData, defaultFilters);
        setFilters(defaultFilters);
      } else {
        setFilteredResources(transformedData);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setFilteredResources([]);
    } finally {
      setLoading(false);
    }
  };

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10, k = num % 100;
    if (j == 1 && k != 11) return "st";
    if (j == 2 && k != 12) return "nd";
    if (j == 3 && k != 13) return "rd";
    return "th";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  };

  const applyFilters = (data: any[], filterOptions: any) => {
    let filtered = data;
    
    if (filterOptions.department) {
      filtered = filtered.filter(r => r.department === filterOptions.department);
    }
    if (filterOptions.year) {
      filtered = filtered.filter(r => r.year === filterOptions.year);
    }
    if (filterOptions.type) {
      filtered = filtered.filter(r => r.type === filterOptions.type);
    }
    if (filterOptions.subject) {
      filtered = filtered.filter(r => r.subject.toLowerCase().includes(filterOptions.subject.toLowerCase()));
    }
    if (filterOptions.search) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(filterOptions.search.toLowerCase()) ||
        r.description.toLowerCase().includes(filterOptions.search.toLowerCase())
      );
    }
    
    setFilteredResources(filtered);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    applyFilters(resources, newFilters);
  };

  const handleSort = (sortType: string) => {
    setSortBy(sortType);
    let sorted = [...filteredResources];
    
    switch (sortType) {
      case 'likes':
        sorted = sorted.sort((a, b) => b.likes - a.likes);
        break;
      case 'rating':
        sorted = sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'downloads':
        sorted = sorted.sort((a, b) => b.downloads - a.downloads);
        break;
      default: // recent
        sorted = sorted.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    }
    
    setFilteredResources(sorted);
  };

  const handlePreview = (resource: any) => {
    setPreviewResource(resource);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (resource: any) => {
    try {
      if (resource.file_url) {
        // Create a link element and trigger download
        const link = document.createElement('a');
        link.href = resource.file_url;
        link.download = resource.title || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Update download count
        await supabase
          .from('resources')
          .update({ download_count: (resource.downloads || 0) + 1 })
          .eq('id', resource.id);

        toast({
          title: "Download started",
          description: `Downloading ${resource.title}`,
        });

        // Refresh resources to update download count
        fetchResources();
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (resourceId: string) => {
    if (!user) return;

    try {
      // Check if user already liked this resource
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('resource_id', resourceId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('resource_id', resourceId)
          .eq('user_id', user.id);
        
        toast({
          title: "Removed like",
          description: "You unliked this resource",
        });
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            resource_id: resourceId,
            user_id: user.id
          });
        
        toast({
          title: "Liked!",
          description: "You liked this resource",
        });
      }

      // Refresh resources to update like count
      fetchResources();
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <PullToRefresh onRefresh={fetchResources}>
        <div className="container mx-auto px-4 py-4 lg:py-8 touch-manipulation">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Academic Resources</h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Discover and download study materials shared by your fellow students
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" size="sm" onClick={fetchResources} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/upload')} size="sm" className="lg:size-default">
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Upload Resource</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <Card className="mb-4 lg:mb-6">
          <CardContent className="py-3 lg:py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="grid grid-cols-3 gap-4 lg:gap-6">
                <div className="text-center">
                  <div className="text-lg lg:text-2xl font-bold text-foreground">{filteredResources.length}</div>
                  <div className="text-xs lg:text-sm text-muted-foreground">Resources Found</div>
                </div>
                <div className="text-center">
                  <div className="text-lg lg:text-2xl font-bold text-foreground">
                    {filteredResources.reduce((acc, r) => acc + r.downloads, 0).toLocaleString()}
                  </div>
                  <div className="text-xs lg:text-sm text-muted-foreground">Total Downloads</div>
                </div>
                <div className="text-center">
                  <div className="text-lg lg:text-2xl font-bold text-foreground">
                    {filteredResources.length > 0 ? (filteredResources.reduce((acc, r) => acc + r.rating, 0) / filteredResources.length).toFixed(1) : '0.0'}
                  </div>
                  <div className="text-xs lg:text-sm text-muted-foreground">Average Rating</div>
                </div>
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <SortAsc className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
                <div className="flex gap-1">
                  {[
                    { key: 'recent', label: 'Recent' },
                    { key: 'likes', label: 'Likes' },
                    { key: 'rating', label: 'Rating' },
                    { key: 'downloads', label: 'Downloads' }
                  ].map((sort) => (
                    <Badge
                      key={sort.key}
                      variant={sortBy === sort.key ? "default" : "outline"}
                      className="cursor-pointer whitespace-nowrap hover:scale-105 transition-transform"
                      onClick={() => handleSort(sort.key)}
                    >
                      {sort.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="mb-6 lg:mb-8">
          <FilterSection onFiltersChange={handleFiltersChange} />
        </div>

        {/* Active Filters Display */}
        {Object.keys(filters).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => 
                value && (
                  <Badge key={key} variant="secondary">
                    {key}: {String(value)}
                  </Badge>
                )
              )}
            </div>
          </div>
        )}

        {/* Resources Grid */}
        {loading ? (
          <SkeletonGrid count={6} />
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredResources.map((resource, index) => (
              <div key={resource.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <ResourceCard 
                  {...resource} 
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onLike={handleLike}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Filter}
            title="No Resources Found"
            description="Try adjusting your filters or search terms to find resources. You can also upload your own resources to help the community!"
            actionLabel="Clear All Filters"
            onAction={() => handleFiltersChange({})}
          />
        )}

        {/* Load More */}
        {filteredResources.length > 0 && filteredResources.length >= 6 && (
          <div className="text-center mt-8 lg:mt-12">
            <Button variant="outline" size="lg" className="px-6 lg:px-8">
              Load More Resources
            </Button>
          </div>
        )}
        </div>
      </PullToRefresh>
      
      <ResourcePreview
        resource={previewResource}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default Resources;