import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, Upload, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/resources?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SR</span>
            </div>
            <span className="font-bold text-xl text-foreground">StudyHub</span>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => navigate('/dashboard')}
                className={`transition-colors ${isActive('/dashboard') ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/resources')}
                className={`transition-colors ${isActive('/resources') ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
              >
                Resources
              </button>
              <button
                onClick={() => navigate('/upload')}
                className={`transition-colors ${isActive('/upload') ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
              >
                Upload
              </button>
              <button
                onClick={() => navigate('/profile')}
                className={`transition-colors ${isActive('/profile') ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
              >
                Profile
              </button>
            </nav>
          )}

          {/* Desktop Search */}
          {user && (
            <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search resources..." 
                  className="pl-10 bg-muted/50 border-border focus:bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate('/upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="default" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-4">
              {user && (
                <>
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      placeholder="Search resources..." 
                      className="pl-10 bg-muted/50 border-border"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                  <nav className="flex flex-col space-y-2">
                    <button
                      onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }}
                      className={`text-left py-2 transition-colors ${isActive('/dashboard') ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => { navigate('/resources'); setIsMenuOpen(false); }}
                      className={`text-left py-2 transition-colors ${isActive('/resources') ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
                    >
                      Resources
                    </button>
                    <button
                      onClick={() => { navigate('/upload'); setIsMenuOpen(false); }}
                      className={`text-left py-2 transition-colors ${isActive('/upload') ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                      className={`text-left py-2 transition-colors ${isActive('/profile') ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
                    >
                      Profile
                    </button>
                  </nav>
                  <div className="flex space-x-3 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { navigate('/upload'); setIsMenuOpen(false); }}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </>
              )}
              {!user && (
                <Button variant="default" onClick={() => { navigate('/auth'); setIsMenuOpen(false); }}>
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