import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Sparkles, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroSectionProps {
  stats?: {
    totalResources: number;
    totalUsers: number;
    totalDepartments: number;
  };
}

export const HeroSection = ({ stats }: HeroSectionProps) => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[420px] sm:min-h-[580px] flex items-center justify-center overflow-hidden">
      {/* Animated background orbs */}
      <div className="orb w-96 h-96 bg-primary/20 top-[-100px] left-[-100px]" style={{ animationDelay: '0s' }} />
      <div className="orb w-80 h-80 bg-accent/15 bottom-[-80px] right-[-80px]" style={{ animationDelay: '3s' }} />
      <div className="orb w-64 h-64 bg-pink-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '6s' }} />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container mx-auto px-4 lg:px-8 z-10 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium text-primary mb-8" style={{ animationDelay: '0.1s' }}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {stats?.totalUsers
                ? `Trusted by ${stats.totalUsers.toLocaleString()}+ B.Tech Students`
                : 'The #1 Academic Resource Platform'}
            </span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up text-3xl sm:text-4xl md:text-7xl font-bold leading-tight mb-3 sm:mb-4 md:mb-6" style={{ animationDelay: '0.2s' }}>
            Share. Learn.{' '}
            <span className="gradient-text">Excel</span>
            <br />
            <span className="text-foreground/80">Together</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up text-sm sm:text-base md:text-xl text-muted-foreground mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: '0.3s' }}>
            The ultimate platform for B.Tech students to share notes, PDFs, previous year papers,
            and collaborate across all departments and years.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up flex flex-col sm:flex-row gap-3 justify-center mb-6 sm:mb-10 md:mb-16" style={{ animationDelay: '0.4s' }}>
            <Button
              size="lg"
              className="text-base px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:-translate-y-0.5"
              onClick={() => navigate('/resources')}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Start Exploring
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 glass border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:-translate-y-0.5"
              onClick={() => navigate('/communities')}
            >
              <Users className="h-5 w-5 mr-2" />
              Join Community
            </Button>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up grid grid-cols-3 gap-3 max-w-2xl mx-auto" style={{ animationDelay: '0.5s' }}>
            {[
              { icon: BookOpen, value: stats ? `${stats.totalResources.toLocaleString()}+` : '15,000+', label: 'Resources', color: 'text-primary', bg: 'bg-primary/10' },
              { icon: Users, value: stats ? `${stats.totalUsers.toLocaleString()}+` : '5,000+', label: 'Students', color: 'text-accent', bg: 'bg-accent/10' },
              { icon: TrendingUp, value: stats ? `${stats.totalDepartments}+` : '15+', label: 'Depts', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            ].map((stat, i) => (
              <div key={i} className="glass rounded-xl p-3 md:p-4 border border-border/40 hover:border-primary/30 transition-all duration-300 group" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <div className={`inline-flex p-1.5 md:p-2 rounded-xl ${stat.bg} mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${stat.color}`} />
                </div>
                <div className={`text-xl md:text-3xl font-bold ${stat.color} mb-0.5`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
