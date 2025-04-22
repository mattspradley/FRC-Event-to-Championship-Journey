import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { trackEvent } from "@/hooks/use-analytics";

interface TeamFilterProps {
  onStatusFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  sortBy: string;
  searchQuery: string;
}

const TeamFilter: React.FC<TeamFilterProps> = ({
  onStatusFilterChange,
  onSortChange,
  onSearchChange,
  statusFilter,
  sortBy,
  searchQuery,
}) => {
  // Define wrapped handlers for tracking
  const handleStatusFilterChange = (value: string) => {
    trackEvent('Filtering', 'filter_by_status', value);
    onStatusFilterChange(value);
  };
  
  const handleSortChange = (value: string) => {
    trackEvent('Filtering', 'sort_teams', value);
    onSortChange(value);
  };
  
  const handleSearchChange = (value: string) => {
    // Only track search when user has entered at least 3 characters
    if (value.length >= 3) {
      trackEvent('Filtering', 'search_teams', value);
    }
    onSearchChange(value);
  };
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 md:items-center">
          <div className="mr-4">
            <Label htmlFor="status-filter" className="block text-sm font-medium text-muted-foreground mb-1">
              Filter Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger id="status-filter" className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="not-qualified">Not Qualified</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sort-by" className="block text-sm font-medium text-muted-foreground mb-1">
              Sort By
            </Label>
            <Select
              value={sortBy}
              onValueChange={handleSortChange}
            >
              <SelectTrigger id="sort-by" className="w-[180px]">
                <SelectValue placeholder="Team Number" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team-number">Team Number</SelectItem>
                <SelectItem value="ranking">Ranking</SelectItem>
                <SelectItem value="qualification-status">Qualification Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="ml-auto">
            <Label htmlFor="search-teams" className="block text-sm font-medium text-muted-foreground mb-1">
              Search Teams
            </Label>
            <div className="relative">
              <Input
                id="search-teams"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 w-full md:w-64"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamFilter;
