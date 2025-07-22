import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";

interface FilterSectionProps {
  onFiltersChange?: (filters: any) => void;
}

export const FilterSection = ({ onFiltersChange }: FilterSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

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
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Filter className="h-5 w-5 mr-2 text-primary" />
          Filter Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by title, description, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border-border focus:bg-background"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="bg-background/50 border-border">
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
            <SelectTrigger className="bg-background/50 border-border">
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
            <SelectTrigger className="bg-background/50 border-border">
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
            <SelectTrigger className="bg-background/50 border-border">
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

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground flex items-center">
              Active filters:
            </span>
            {activeFilters.map((filter, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
              >
                {filter.label}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => clearFilter(filter.key)}
                />
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};