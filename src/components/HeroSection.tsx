import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Sparkles, TrendingUp, Upload, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface HeroSectionProps {
  stats?: {
    totalResources: number;
    totalUsers: number;
    totalDepartments: number;
  };
}

export const HeroSection = ({ stats }: HeroSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const statItems = [
    { icon: BookOpen, value: stats ? `${stats.totalResources.toLocaleString()}+` : '0+', label: 'Resources', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Users, value: stats ? `${stats.totalUsers.toLocaleString()}+` : '0+', label: 'Students', color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { icon: TrendingUp, value: stats ? `${stats.totalDepartments}+` : '0+', label: 'Departments', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="orb w-96 h-96 bg-primary/10 top-0 left-0 -translate-x-1/3 -translate-y-1/3" />
      <div className="orb w-80 h-80 bg-accent/8 bottom-0 right-0 translate-x-1/3 translate-y-1/3" style={{ animationDelay: '4s' }} />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/25 text-xs sm:text-sm font-semibold text-primary mb-6 shadow-lg shadow-primary/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            {stats?.totalUsers ? `${stats.totalUsers.toLocaleString()}+ students learning together` : 'The #1 Academic Resource Platform'}
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up text-3xl sm:text-5xl md:text-6xl font-black leading-tight mb-4 tracking-tight" style={{ animationDelay: '0.1s' }}>
            Share. Learn.{' '}
            <span className="gradient-text">Excel Together</span>
          </h1>

          <p className="animate-fade-in-up text-sm sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Access thousands of notes, PDFs, and previous papers. Chat with AI trained on your documents.
            Collaborate with your department community.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up flex flex-col sm:flex-row gap-3 justify-center mb-10" style={{ animationDelay: '0.3s' }}>
            <Button
              size="lg"
              className="btn-neon px-8 py-5 rounded-2xl text-base font-bold shadow-xl shadow-primary/25"
              onClick={() => navigate('/resources')}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Explore Resources
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-5 rounded-2xl glass border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              onClick={() => navigate('/ai')}
            >
              <Bot className="h-5 w-5 mr-2 text-violet-400" />
              Try AI Assistant
            </Button>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up grid grid-cols-3 gap-3 max-w-lg mx-auto" style={{ animationDelay: '0.4s' }}>
            {statItems.map((s, i) => (
              <div key={i} className="premium-card p-3 sm:p-4 group cursor-default">
                <div className={`inline-flex p-1.5 sm:p-2 rounded-xl ${s.bg} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                  <s.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${s.color}`} />
                </div>
                <div className={`text-xl sm:text-2xl font-black ${s.color} mb-0.5 tabular-nums`}>{s.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
