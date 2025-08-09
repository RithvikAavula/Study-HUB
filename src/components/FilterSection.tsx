import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FilterSectionProps {
  onFiltersChange?: (filters: any) => void;
  resetSignal?: number; // increments to trigger external clear of internal state
  onClearAll?: () => void;
}

export const FilterSection = ({ onFiltersChange, resetSignal, onClearAll }: FilterSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(true);

  const departments = [
    "Computer Science (CSE)",
    "Electronics & Communication (ECE)",
    "Electrical Engineering (EEE)",
    "Mechanical Engineering (MECH)",
    "Civil Engineering (CIVIL)",
    "Information Technology (IT)",
    "AI & Data Science (AI&DS)",
    "Biotechnology (BT)",
    "Chemical Engineering (CHE)",
  ];

  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const resourceTypes = ["Notes", "PDF", "Previous Papers", "Assignments", "Images", "Lab Reports"];
  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Programming", "Data Structures",
    "Computer Networks", "Database Systems", "Operating Systems", "Machine Learning",
    "Digital Electronics", "Signals & Systems", "Control Systems", "Thermodynamics"
  ];

  // Mapping for department display to data value
  const departmentMap: Record<string, string> = {
    "Computer Science (CSE)": "CSE",
    "Electronics & Communication (ECE)": "ECE",
    "Electrical Engineering (EEE)": "EEE",
    "Mechanical Engineering (MECH)": "MECH",
    "Civil Engineering (CIVIL)": "CIVIL",
    "Information Technology (IT)": "IT",
    "AI & Data Science (AI&DS)": "AI&DS",
    "Biotechnology (BT)": "BT",
    "Chemical Engineering (CHE)": "CHE",
  };
  // Mapping for year display to data value
  const yearMap: Record<string, string> = {
    "1st Year": "1st",
    "2nd Year": "2nd",
    "3rd Year": "3rd",
    "4th Year": "4th",
  };
  // Mapping for resource type display to data value
  const typeMap: Record<string, string> = {
    "Notes": "Notes",
    "PDF": "PDF",
    "Previous Papers": "Question Paper",
    "Assignments": "Assignment",
    "Images": "Image",
    "Lab Reports": "Lab Report",
  };

  const activeFilters = [
    selectedDepartment && { label: selectedDepartment, key: "department" },
    selectedYear && { label: selectedYear, key: "year" },
    selectedType && { label: selectedType, key: "type" },
    selectedSubject && { label: selectedSubject, key: "subject" },
  ].filter(Boolean);

  const clearFilter = (key: string) => {
    switch (key) {
      case "department":
        setSelectedDepartment("");
        break;
      case "year":
        setSelectedYear("");
        break;
      case "type":
        setSelectedType("");
        break;
      case "subject":
        setSelectedSubject("");
        break;
    }
  };

  const clearAllFilters = () => {
    setSelectedDepartment("");
    setSelectedYear("");
    setSelectedType("");
    setSelectedSubject("");
    setSearchQuery("");
    onClearAll?.();
  };

  // Allow parent to trigger a full reset of internal state
  useEffect(() => {
    if (typeof resetSignal === "number") {
      // When resetSignal changes, clear internal filters
      setSelectedDepartment("");
      setSelectedYear("");
      setSelectedType("");
      setSelectedSubject("");
      setSearchQuery("");
    }
  }, [resetSignal]);

  // Apply filters whenever they change
  useEffect(() => {
    const filters = {
      search: searchQuery,
      department: departmentMap[selectedDepartment] || "",
      year: yearMap[selectedYear] || "",
      type: typeMap[selectedType] || "",
      subject: selectedSubject,
    };
    onFiltersChange?.(filters);
  }, [searchQuery, selectedDepartment, selectedYear, selectedType, selectedSubject, onFiltersChange]);

  return (
    <Card className="bg-gradient-card border-border/50">
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CardHeader className="pb-2 lg:pb-4">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
            >
              <CardTitle className="flex items-center text-base lg:text-lg">
                <Filter className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-primary" />
                Filter Resources
              </CardTitle>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform lg:hidden ${isCollapsed ? '' : 'transform rotate-180'}`} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* Search - Always visible */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border focus:bg-background transition-all duration-200"
            />
          </div>

          <CollapsibleContent className="space-y-4">
            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="bg-background/50 border-border hover:bg-background transition-colors">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-background/50 border-border hover:bg-background transition-colors">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-background/50 border-border hover:bg-background transition-colors">
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-background/50 border-border hover:bg-background transition-colors">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>

          {/* Active Filters */}
          {(activeFilters.length > 0 || searchQuery) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground flex items-center">
                Active filters:
              </span>
              {searchQuery && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
                >
                  Search: {searchQuery}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
              {activeFilters.map((filter, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
                >
                  {filter.label}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                    onClick={() => clearFilter(filter.key)}
                  />
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  );
};