import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FilterSection } from "@/components/FilterSection";
import { ResourceCard } from "@/components/ResourceCard";
import { ResourcePreview } from "@/components/ResourcePreview";
import { Button } from "@/components/ui/button";
import { Upload, Filter, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";

// Mock data for demonstration
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

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<any[]>([]);
  const [filteredResources, setFilteredResources] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [resetSignal, setResetSignal] = useState(0);
  const [userStats, setUserStats] = useState({
    totalUploads: 0,
    totalLikes: 0,
    totalDownloads: 0
  });
  const [stats, setStats] = useState({
    totalResources: 15000,
    totalUsers: 5000,
    totalDepartments: 25
  });
  const [previewResource, setPreviewResource] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);
  const { toast } = useToast();

  // Filtering logic (copied from Resources)
  const applyFilters = (data: any[], filterOptions: any) => {
    let filtered = data;
    if (filterOptions.department && filterOptions.department !== "") {
      filtered = filtered.filter(r => r.department === filterOptions.department);
    }
    if (filterOptions.year && filterOptions.year !== "") {
      filtered = filtered.filter(r => r.year === filterOptions.year);
    }
    if (filterOptions.type && filterOptions.type !== "") {
      filtered = filtered.filter(r => r.type === filterOptions.type);
    }
    if (filterOptions.subject && filterOptions.subject !== "") {
      filtered = filtered.filter(r => r.subject && r.subject.toLowerCase().includes(filterOptions.subject.toLowerCase()));
    }
    if (filterOptions.search && filterOptions.search !== "") {
      filtered = filtered.filter(r => 
        (r.title && r.title.toLowerCase().includes(filterOptions.search.toLowerCase())) ||
        (r.description && r.description.toLowerCase().includes(filterOptions.search.toLowerCase()))
      );
    }
    setFilteredResources(filtered);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    const allEmpty = Object.values(filters).every(v => !v);
    if (allEmpty) {
      setFilteredResources(resources);
    } else {
      applyFilters(resources, filters);
    }
    setVisibleCount(6);
  }, [filters, resources]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchResources();
      fetchUserStats();
      fetchStats();
    }
  }, [user, loading, navigate]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author names and IDs
      const profileIds = data?.map(r => r.uploaded_by).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', profileIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Fetch total likes for each author (uploaded_by)
      let authorLikesMap = new Map();
      if (profileIds.length > 0) {
        const { data: likesAgg } = await supabase
          .from('resources')
          .select('uploaded_by, sum_likes:likes_count')
          .in('uploaded_by', profileIds);
        // Aggregate likes per author
        likesAgg?.forEach(row => {
          const prev = authorLikesMap.get(row.uploaded_by) || 0;
          authorLikesMap.set(row.uploaded_by, prev + (row.sum_likes || 0));
        });
      }

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
        liked: false,
        id: resource.id,
        file_url: resource.file_url,
        authorLikes: authorLikesMap.get(resource.uploaded_by) || 0,
      })) || [];

      setResources(transformedData);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      // Get user's uploads
      const { count: uploadsCount } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('uploaded_by', user.id);

      // Get total likes on user's resources
      const { data: likesData } = await supabase
        .from('resources')
        .select('likes_count')
        .eq('uploaded_by', user.id);
      
      const totalLikes = likesData?.reduce((sum, item) => sum + (item.likes_count || 0), 0) || 0;

      // Get total downloads on user's resources
      const { data: downloadsData } = await supabase
        .from('resources')
        .select('download_count')
        .eq('uploaded_by', user.id);
      
      const totalDownloads = downloadsData?.reduce((sum, item) => sum + (item.download_count || 0), 0) || 0;

      setUserStats({
        totalUploads: uploadsCount || 0,
        totalLikes,
        totalDownloads
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total resources count
      const { count: resourcesCount } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true });

      // Get total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get unique departments count
      const { data: deptData } = await supabase
        .from('profiles')
        .select('department')
        .not('department', 'is', null);
      const uniqueDepartments = new Set(deptData?.map(item => item.department)).size;

      setStats({
        totalResources: resourcesCount || 0,
        totalUsers: usersCount || 0,
        totalDepartments: uniqueDepartments || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection stats={stats} />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12">
        {/* Filters */}
        <div className="mb-8">
          <FilterSection onFiltersChange={handleFiltersChange} resetSignal={resetSignal} onClearAll={() => setFilters({})} />
        </div>

        {/* Resources Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Available Resources</h2>
            <p className="text-muted-foreground">
              Discover and download study materials shared by your fellow students
            </p>
          </div>
          <Button variant="hero" className="hidden md:flex">
            <Upload className="h-4 w-4 mr-2" />
            Upload Resource
          </Button>
        </div>

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.slice(0, visibleCount).map((resource, index) => (
                <div key={resource.id} className="animate-fade-in" style={{ animationDelay: `${(index % 6) * 0.07}s` }}>
                  <ResourceCard
                    {...resource}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onLike={handleLike}
                    authorLikes={resource.authorLikes}
                  />
                </div>
              ))}
            </div>
            {/* Load More */}
            {visibleCount < filteredResources.length && (
              <div className="text-center mt-10">
                <p className="text-sm text-muted-foreground mb-4">
                  Showing <span className="font-semibold text-foreground">{visibleCount}</span> of{' '}
                  <span className="font-semibold text-foreground">{filteredResources.length}</span> resources
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 border-primary/30 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 group"
                  disabled={loadingMore}
                  onClick={async () => {
                    setLoadingMore(true);
                    await new Promise(r => setTimeout(r, 400));
                    setVisibleCount(v => v + 6);
                    setLoadingMore(false);
                  }}
                >
                  {loadingMore
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
                    : <><ChevronDown className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />Load More Resources</>}
                </Button>
              </div>
            )}
            {visibleCount >= filteredResources.length && filteredResources.length > 6 && (
              <p className="text-center text-sm text-muted-foreground mt-8">✓ All {filteredResources.length} resources loaded</p>
            )}
          </>
        ) : (
          <EmptyState
            icon={Filter}
            title="No Resources Found"
            description="Try adjusting your filters or search terms to find resources. You can also upload your own resources to help the community!"
            actionLabel="Clear All Filters"
            onAction={() => { setFilters({}); setResetSignal(prev => prev + 1); }}
          />
        )}
      </div>
      
      <ResourcePreview
        resource={previewResource}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default Dashboard;