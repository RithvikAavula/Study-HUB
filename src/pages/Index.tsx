import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Users, FileText, Star, TrendingUp, ArrowRight, Sparkles, Zap, Shield, Bot } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalResources: 0, totalUsers: 0, totalDownloads: 0, totalDepartments: 0 });

  useEffect(() => {
    if (user) { navigate("/dashboard"); return; }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const [{ count: rc }, { count: uc }, { data: dd }, { data: deptD }] = await Promise.all([
        supabase.from('resources').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('resources').select('download_count'),
        supabase.from('profiles').select('department').not('department', 'is', null),
      ]);
      setStats({
        totalResources: rc || 0,
        totalUsers: uc || 0,
        totalDownloads: dd?.reduce((s, i) => s + (i.download_count || 0), 0) || 0,
        totalDepartments: new Set(deptD?.map(i => i.department)).size || 0,
      });
    } catch {}
  };

  const features = [
    { icon: FileText, title: "Comprehensive Resources", desc: "Notes, PDFs, previous papers, assignments from all engineering departments.", color: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-400" },
    { icon: Star, title: "Quality Assured", desc: "Rate and review resources. Quality content rises to the top automatically.", color: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-400" },
    { icon: Users, title: "Community Driven", desc: "Connect with students from your department. Share knowledge together.", color: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-400" },
    { icon: Bot, title: "AI Study Assistant", desc: "Chat with AI trained on your uploaded documents for instant answers.", color: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-400" },
    { icon: Zap, title: "Instant Access", desc: "Preview and download resources instantly. No waiting, no barriers.", color: "from-yellow-500/20 to-amber-500/20", iconColor: "text-yellow-400" },
    { icon: Shield, title: "Secure & Reliable", desc: "Your data is safe with enterprise-grade Supabase infrastructure.", color: "from-red-500/20 to-rose-500/20", iconColor: "text-red-400" },
  ];

  const statCards = [
    { icon: Users, value: `${stats.totalUsers.toLocaleString()}+`, label: "Active Students", color: "text-primary", bg: "bg-primary/10" },
    { icon: FileText, value: `${stats.totalResources.toLocaleString()}+`, label: "Study Resources", color: "text-accent", bg: "bg-accent/10" },
    { icon: TrendingUp, value: `${stats.totalDownloads.toLocaleString()}+`, label: "Total Downloads", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { icon: GraduationCap, value: `${stats.totalDepartments}+`, label: "Departments", color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  return (
    <div className="min-h-screen bg-mesh smooth-scroll">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border/40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-md" />
              <img
                src="https://res.cloudinary.com/dfnpgl0bb/image/upload/v1754714276/ChatGPT_Image_Aug_9_2025_10_06_49_AM_eo8uck.png"
                alt="StudyHub"
                className="relative h-10 w-10 rounded-full object-cover ring-2 ring-primary/30"
              />
            </div>
            <span className="text-xl font-bold gradient-text">StudyHub</span>
          </div>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/25"
          >
            Get Started <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative container mx-auto px-4 py-24 text-center overflow-hidden">
        <div className="orb w-96 h-96 bg-primary/15 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
        <div className="orb w-80 h-80 bg-accent/10 bottom-0 right-0 translate-x-1/2 translate-y-1/2" style={{ animationDelay: '4s' }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium text-primary mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            For B.Tech Students, By Students
          </div>

          <h1 className="animate-fade-in-up text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ animationDelay: '0.1s' }}>
            Share & Access
            <br />
            <span className="gradient-text">Academic Resources</span>
          </h1>

          <p className="animate-fade-in-up text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Connect with peers and access thousands of notes, previous papers, and study materials
            from students across all departments and years.
          </p>

          <div className="animate-fade-in-up flex flex-col sm:flex-row gap-4 justify-center" style={{ animationDelay: '0.3s' }}>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-10 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-2xl shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              Join StudyHub — It's Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-10 py-6 glass border-border/60 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Browse Resources
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div
              key={i}
              className="animate-fade-in-up glass rounded-2xl p-6 text-center border border-border/40 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`inline-flex p-3 rounded-xl ${s.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access resources from all departments, years, and subjects. Rate, like, and discover
            the best study materials shared by your fellow students.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="animate-fade-in-up glass rounded-2xl p-6 border border-border/40 hover:border-primary/30 hover:-translate-y-1.5 transition-all duration-300 group"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${f.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className={`h-6 w-6 ${f.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-200">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-pink-500/10" />
          <div className="absolute inset-0 glass" />
          <div className="orb w-64 h-64 bg-primary/20 top-0 right-0" style={{ animationDelay: '2s' }} />
          <div className="relative z-10 p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to Start{' '}
              <span className="gradient-text">Learning?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of B.Tech students already sharing and accessing the best academic resources.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-12 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-2xl shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              Join Now — It's Free <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-8">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          <p>© 2024 StudyHub. Built for B.Tech students, by students. 🎓</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
