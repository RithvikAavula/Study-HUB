import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Star } from "lucide-react";
import heroImage from "@/assets/hero-academic.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Students collaborating" 
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 lg:px-8 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              Trusted by 10,000+ B.Tech Students
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Share. Learn.{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Excel
              </span>
              <br />
              Together
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              The ultimate platform for B.Tech students to share notes, PDFs, previous year papers, 
              and collaborate on academic resources across all departments and years.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                <BookOpen className="h-5 w-5 mr-2" />
                Start Exploring
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-background/80 hover:bg-background">
                <Users className="h-5 w-5 mr-2" />
                Join Community
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {[
                { label: "Resources Shared", value: "50K+" },
                { label: "Active Students", value: "10K+" },
                { label: "Universities", value: "100+" },
                { label: "Departments", value: "15+" },
              ].map((stat, index) => (
                <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-academic-blue/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-academic-purple/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-academic-green/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: "2s" }} />
    </section>
  );
};