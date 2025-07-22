import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FilterSection } from "@/components/FilterSection";
import { ResourceCard } from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Star, Upload } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: TrendingUp,
              title: "Trending Resources",
              description: "Most popular uploads this week",
              color: "text-academic-blue bg-academic-blue/10",
            },
            {
              icon: Clock,
              title: "Recent Uploads",
              description: "Latest additions to the library",
              color: "text-academic-green bg-academic-green/10",
            },
            {
              icon: Star,
              title: "Top Rated",
              description: "Highest quality resources",
              color: "text-academic-orange bg-academic-orange/10",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="p-6 bg-gradient-card rounded-lg border border-border/50 hover:shadow-card transition-all duration-300 group"
            >
              <div className={`inline-flex p-3 rounded-lg ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{stat.title}</h3>
              <p className="text-muted-foreground text-sm">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-8">
          <FilterSection />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockResources.map((resource, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <ResourceCard {...resource} />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="px-8">
            Load More Resources
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;