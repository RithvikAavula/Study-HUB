import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  BookOpen, GraduationCap, Users, FileText, Star, TrendingUp,
  ArrowRight, Sparkles, Zap, Shield, Bot, Brain, Download,
  ChevronRight, Play, CheckCircle2, Layers, MessageSquare,
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (target === 0) return;
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        setCount(Math.floor(start));
        if (start >= target) clearInterval(timer);
      }, 16);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

const StatCard = ({ icon: Icon, value, label, color, bg, suffix = '+' }: any) => {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="premium-card shine p-6 text-center group cursor-default">
      <div className={`inline-flex p-3 rounded-2xl ${bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className={`text-3xl font-bold ${color} mb-1 tabular-nums`}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </div>
  );
};

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
    {
      icon: FileText, title: "Rich Resource Library",
      desc: "Notes, PDFs, previous papers, assignments — organized by department, year, and subject.",
      color: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-400", border: "hover:border-blue-500/30",
    },
    {
      icon: Brain, title: "AI Study Assistant",
      desc: "RAG-powered AI that reads your PDFs and answers questions, generates quizzes, flashcards & summaries.",
      color: "from-violet-500/20 to-purple-500/20", iconColor: "text-violet-400", border: "hover:border-violet-500/30",
    },
    {
      icon: Users, title: "Study Communities",
      desc: "Department-wise groups with real-time chat, shared resources, and private uploads.",
      color: "from-pink-500/20 to-rose-500/20", iconColor: "text-pink-400", border: "hover:border-pink-500/30",
    },
    {
      icon: Star, title: "Quality Ratings",
      desc: "Rate and review resources. The best content rises to the top automatically.",
      color: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-400", border: "hover:border-amber-500/30",
    },
    {
      icon: Zap, title: "Instant Preview",
      desc: "Preview PDFs and images in-app without downloading. One click, zero friction.",
      color: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-400", border: "hover:border-emerald-500/30",
    },
    {
      icon: Shield, title: "Secure & Private",
      desc: "Enterprise-grade Supabase auth with row-level security. Your data stays yours.",
      color: "from-red-500/20 to-rose-500/20", iconColor: "text-red-400", border: "hover:border-red-500/30",
    },
  ];

  const aiFeatures = [
    { icon: MessageSquare, label: "Chat with your PDFs" },
    { icon: Layers, label: "Auto-generate flashcards" },
    { icon: CheckCircle2, label: "Interactive quizzes" },
    { icon: FileText, label: "Exam-style questions" },
    { icon: BookOpen, label: "Smart summaries" },
    { icon: Sparkles, label: "Suggested questions" },
  ];

  return (
    <div className="min-h-screen bg-mesh smooth-scroll overflow-x-hidden">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border/40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-md" />
              <img
                src="https://res.cloudinary.com/dfnpgl0bb/image/upload/v1754714276/ChatGPT_Image_Aug_9_2025_10_06_49_AM_eo8uck.png"
                alt="StudyHub"
                className="relative h-10 w-10 rounded-full object-cover ring-2 ring-primary/40"
              />
            </div>
            <span className="text-xl font-bold gradient-text">StudyHub</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/auth")} className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </button>
            <Button
              onClick={() => navigate("/auth")}
              className="btn-neon px-5 py-2 rounded-xl text-sm font-semibold"
            >
              Get Started Free <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative container mx-auto px-4 pt-16 pb-8 sm:pt-28 sm:pb-16 text-center overflow-hidden">
        {/* Background orbs */}
        <div className="orb w-[500px] h-[500px] bg-primary/10 top-0 left-0 -translate-x-1/2 -translate-y-1/3" />
        <div className="orb w-[400px] h-[400px] bg-accent/10 bottom-0 right-0 translate-x-1/3 translate-y-1/3" style={{ animationDelay: '4s' }} />
        <div className="orb w-64 h-64 bg-pink-500/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '2s' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Pill badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/25 text-xs sm:text-sm font-semibold text-primary mb-8 shadow-lg shadow-primary/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            For B.Tech Students · Powered by AI
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up text-4xl sm:text-6xl md:text-8xl font-black mb-6 leading-[1.05] tracking-tight" style={{ animationDelay: '0.1s' }}>
            Study Smarter,
            <br />
            <span className="gradient-text">Together</span>
          </h1>

          <p className="animate-fade-in-up text-base sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Share notes, discover resources, and chat with an AI that actually reads your PDFs.
            Built for engineering students who want to ace every exam.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-in-up flex flex-col sm:flex-row gap-4 justify-center mb-16" style={{ animationDelay: '0.3s' }}>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="btn-neon text-base sm:text-lg px-8 py-6 rounded-2xl font-bold shadow-2xl shadow-primary/30"
            >
              <GraduationCap className="h-5 w-5 mr-2" />
              Join Free — No Credit Card
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-base sm:text-lg px-8 py-6 rounded-2xl glass border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group"
            >
              <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Browse Resources
            </Button>
          </div>

          {/* Social proof strip */}
          <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground" style={{ animationDelay: '0.4s' }}>
            {['Free forever', 'No ads', 'AI-powered', 'All departments'].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          <StatCard icon={Users} value={stats.totalUsers} label="Active Students" color="text-primary" bg="bg-primary/10" />
          <StatCard icon={FileText} value={stats.totalResources} label="Study Resources" color="text-violet-400" bg="bg-violet-400/10" />
          <StatCard icon={Download} value={stats.totalDownloads} label="Total Downloads" color="text-emerald-400" bg="bg-emerald-400/10" />
          <StatCard icon={GraduationCap} value={stats.totalDepartments} label="Departments" color="text-amber-400" bg="bg-amber-400/10" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="container mx-auto px-4 py-10 sm:py-20">
        <div className="text-center mb-14">
          <div className="pill-badge mb-4">
            <Sparkles className="h-3 w-3" /> Everything you need
          </div>
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            Built for students who{' '}
            <span className="gradient-text">mean business</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature designed to save you time and help you score higher.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {features.map((f, i) => (
            <div
              key={i}
              className={`premium-card shine p-6 border border-border/40 ${f.border} group`}
            >
              <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${f.color} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className={`h-6 w-6 ${f.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-200">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Learn more <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Feature Spotlight ── */}
      <section className="container mx-auto px-4 py-10 sm:py-20">
        <div className="relative rounded-3xl overflow-hidden animated-border">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-primary/5 to-pink-500/10" />
          <div className="absolute inset-0 glass" />
          <div className="orb w-80 h-80 bg-violet-500/15 top-0 right-0" style={{ animationDelay: '1s' }} />
          <div className="orb w-64 h-64 bg-primary/10 bottom-0 left-0" style={{ animationDelay: '5s' }} />

          <div className="relative z-10 p-8 sm:p-14 md:p-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="pill-badge mb-6" style={{ background: 'hsl(262 83% 68% / 0.15)', borderColor: 'hsl(262 83% 68% / 0.3)', color: 'hsl(262 83% 68%)' }}>
                  <Bot className="h-3 w-3" /> AI Study Assistant
                </div>
                <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight tracking-tight">
                  Your PDF just got{' '}
                  <span className="gradient-text">a brain</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Upload any study material and instantly chat with it, generate quizzes, create flashcards, and get exam-ready summaries — all powered by Gemini AI.
                </p>
                <Button
                  onClick={() => navigate("/auth")}
                  className="btn-neon px-8 py-5 rounded-2xl text-base font-bold"
                >
                  Try AI Assistant <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {aiFeatures.map((f, i) => (
                  <div
                    key={i}
                    className="premium-card p-4 flex items-center gap-3 group"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <f.icon className="h-4 w-4 text-violet-400" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container mx-auto px-4 py-10 sm:py-20">
        <div className="relative rounded-3xl overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-pink-500/10" />
          <div className="absolute inset-0 glass" />
          <div className="orb w-72 h-72 bg-primary/20 top-0 right-0" style={{ animationDelay: '2s' }} />
          <div className="orb w-56 h-56 bg-accent/15 bottom-0 left-0" style={{ animationDelay: '6s' }} />

          <div className="relative z-10 p-10 sm:p-16 md:p-24">
            <div className="pill-badge mb-6 mx-auto w-fit">
              <Sparkles className="h-3 w-3" /> Join thousands of students
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight">
              Ready to{' '}
              <span className="gradient-text">ace your exams?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join StudyHub today and get access to thousands of resources, AI tools, and a community that helps you succeed.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="btn-neon text-lg px-12 py-7 rounded-2xl font-bold shadow-2xl shadow-primary/30"
            >
              Start Learning Free <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">No credit card · No ads · Always free</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 mt-8">
        <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="https://res.cloudinary.com/dfnpgl0bb/image/upload/v1754714276/ChatGPT_Image_Aug_9_2025_10_06_49_AM_eo8uck.png" alt="" className="h-6 w-6 rounded-full" />
            <span className="font-semibold gradient-text">StudyHub</span>
          </div>
          <p>© 2025 StudyHub · Built for B.Tech students 🎓</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">Sign In</button>
            <button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">Get Started</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
