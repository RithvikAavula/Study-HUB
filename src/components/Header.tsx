import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, Upload, User } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SR</span>
            </div>
            <span className="font-bold text-xl text-foreground">StudyResource</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-foreground hover:text-primary transition-colors">Dashboard</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">Resources</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">Upload</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">Profile</a>
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search resources..." 
                className="pl-10 bg-muted/50 border-border focus:bg-background"
              />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="hero" size="sm">
              Login
            </Button>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search resources..." 
                  className="pl-10 bg-muted/50 border-border"
                />
              </div>
              <nav className="flex flex-col space-y-2">
                <a href="#" className="text-foreground hover:text-primary transition-colors py-2">Dashboard</a>
                <a href="#" className="text-foreground hover:text-primary transition-colors py-2">Resources</a>
                <a href="#" className="text-foreground hover:text-primary transition-colors py-2">Upload</a>
                <a href="#" className="text-foreground hover:text-primary transition-colors py-2">Profile</a>
              </nav>
              <div className="flex space-x-3 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button variant="hero" size="sm" className="flex-1">
                  Login
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};