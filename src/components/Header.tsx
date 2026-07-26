import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, Upload, User, LogOut, Bot, Sparkles, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed Out", description: "See you soon! 👋" });
      navigate('/auth');
      setIsMenuOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/resources?search=${encodeURIComponent(searchQuery)}`);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/resources', label: 'Resources' },
    { path: '/upload', label: 'Upload' },
    { path: '/communities', label: 'Communities' },
    { path: '/profile', label: 'Profile' },
  ];

  const ThemeToggle = ({ className = "" }: { className?: string }) => (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200 ${className}`}
    >
      {theme === 'dark'
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />}
    </button>
  );

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'glass-strong shadow-lg shadow-black/20'
        : 'bg-background/80 backdrop-blur-md border-b border-border/40'
    }`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => navigate(user ? '/dashboard' : '/')} className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-md group-hover:blur-lg transition-all duration-300" />
              <img
                src="https://res.cloudinary.com/dfnpgl0bb/image/upload/v1754714276/ChatGPT_Image_Aug_9_2025_10_06_49_AM_eo8uck.png"
                alt="StudyHub Logo"
                className="relative h-10 w-10 rounded-full object-cover ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all duration-300"
              />
            </div>
            <span className="font-bold text-xl gradient-text hidden sm:block">StudyHub</span>
          </button>

          {/* Desktop Nav */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map(({ path, label }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {label}
                  {isActive(path) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              ))}
              <button
                onClick={() => navigate('/ai')}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive('/ai')
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI
                {isActive('/ai') && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            </nav>
          )}

          {/* Search + Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user && (
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                <Input
                  placeholder="Search resources..."
                  className="pl-9 w-52 h-9 bg-white/5 border-border/50 focus:border-primary/50 text-sm transition-all duration-200 focus:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  size="sm"
                  onClick={() => navigate('/upload')}
                  className="h-9 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all duration-200"
                  variant="ghost"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/ai')}
                  className="h-9 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/25 transition-all duration-200"
                >
                  <Bot className="h-3.5 w-3.5 mr-1.5" />
                  AI
                </Button>
                <button
                  onClick={() => navigate('/profile')}
                  className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-all duration-200 ring-2 ring-primary/20 hover:ring-primary/40"
                >
                  <User className="h-4 w-4" />
                </button>
                <Button size="sm" variant="ghost" onClick={handleSignOut} className="h-9 text-muted-foreground hover:text-foreground">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/25"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40 animate-fade-in-up">
            <div className="flex flex-col gap-2">
              {user && (
                <>
                  <form onSubmit={handleSearch} className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search resources..."
                      className="pl-10 bg-white/5 border-border/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                  {[...navLinks, { path: '/ai', label: '✨ AI Assistant' }].map(({ path, label }) => (
                    <button
                      key={path}
                      onClick={() => { navigate(path); setIsMenuOpen(false); }}
                      className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive(path) ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <div className="flex gap-2 pt-2 border-t border-border/40">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { navigate('/upload'); setIsMenuOpen(false); }}>
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                  </div>
                </>
              )}
              {!user && (
                <Button onClick={() => { navigate('/auth'); setIsMenuOpen(false); }} className="bg-gradient-to-r from-primary to-accent text-white">
                  Get Started
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
