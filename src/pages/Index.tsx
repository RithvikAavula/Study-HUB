import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Users, FileText, Star, TrendingUp } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalResources: 15000,
    totalUsers: 5000,
    totalDownloads: 0,
    totalDepartments: 25
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    } else {
      fetchStats();
    }
  }, [user, navigate]);

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

      // Get total downloads
      const { data: downloadData } = await supabase
        .from('resources')
        .select('download_count');
      
      const totalDownloads = downloadData?.reduce((sum, item) => sum + (item.download_count || 0), 0) || 0;

      // Get unique departments count
      const { data: deptData } = await supabase
        .from('profiles')
        .select('department')
        .not('department', 'is', null);
      
      const uniqueDepartments = new Set(deptData?.map(item => item.department)).size;

      setStats({
        totalResources: resourcesCount || 0,
        totalUsers: usersCount || 0,
        totalDownloads: totalDownloads,
        totalDepartments: uniqueDepartments || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-animated smooth-scroll">
      {/* Header */}
      <header className="border-b bg-card/60 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/dfnpgl0bb/image/upload/v1754714276/ChatGPT_Image_Aug_9_2025_10_06_49_AM_eo8uck.png"
              alt="StudyHub Logo"
              className="h-12 w-12 md:h-16 md:w-16 rounded-full object-cover hover-lift shadow-md"
            />
            <span className="text-xl md:text-2xl font-bold text-foreground">StudyHub</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="default" className="hover-lift">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center animate-fade-in-up">
        <div className="max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="h-3 w-3 mr-1" />
            For B.Tech Students
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Share & Access
            <span className="text-primary block">Academic Resources</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Connect with your peers and access thousands of notes, previous papers, 
            and study materials from students across all departments and years.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 hover-lift">
              Join StudyHub
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8 hover-lift">
              Browse Resources
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 animate-fade-in">
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="text-center border-0 shadow-lg bg-card/60 backdrop-blur-md hover-lift">
            <CardHeader className="pb-2">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}+</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Active Students</CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-lg bg-card/60 backdrop-blur-md hover-lift">
            <CardHeader className="pb-2">
              <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold">{stats.totalResources.toLocaleString()}+</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Study Resources</CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-lg bg-card/60 backdrop-blur-md hover-lift">
            <CardHeader className="pb-2">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold">{stats.totalDownloads.toLocaleString()}+</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Total Downloads</CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-lg bg-card/60 backdrop-blur-md hover-lift">
            <CardHeader className="pb-2">
              <Star className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold">{stats.totalDepartments}+</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Departments</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 animate-fade-in">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access resources from all departments, years, and subjects. Rate, like, and discover 
            the best study materials shared by your fellow students.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg bg-card/60 backdrop-blur-md hover-lift">
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Comprehensive Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access notes, PDFs, previous year papers, assignments, and more from all engineering departments.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-card/60 backdrop-blur-md hover-lift">
            <CardHeader>
              <Star className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Quality Assured</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Rate and review resources to help others find the best study materials. Quality content rises to the top.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-card/60 backdrop-blur-md hover-lift">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Community Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect with students from your department and year. Share knowledge and help each other succeed.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 animate-scale-in">
        <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm hover-lift">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of B.Tech students who are already sharing and accessing 
              the best academic resources on StudyHub.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 hover-lift">
              Join Now - It's Free
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/60 backdrop-blur-md mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 StudyHub. Built for B.Tech students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
