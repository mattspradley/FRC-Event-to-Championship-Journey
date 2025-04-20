import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, Search } from "lucide-react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Event, TeamWithStatus, fetchYears, searchEvents, fetchEventTeams } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/hooks/use-analytics";

interface EventSelectorProps {
  onEventSelect: (eventKey: string, eventName: string) => void;
  onTeamsLoaded: (teams: TeamWithStatus[]) => void;
  selectedEvent: string | null;
  selectedEventName: string | null;
}

const EventSelector: React.FC<EventSelectorProps> = ({ 
  onEventSelect, 
  onTeamsLoaded,
  selectedEvent,
  selectedEventName
}) => {
  const { toast } = useToast();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [eventType, setEventType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  const { data: years = [] } = useQuery({
    queryKey: ["/api/years"],
    queryFn: () => fetchYears(),
  });

  const { data: events = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ["/api/search/events", year, eventType, searchQuery],
    queryFn: () => searchEvents({ year, eventType, query: searchQuery }),
    enabled: !!year,
  });

  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  const { data: teams = [], isLoading: isTeamsLoading, refetch: refetchTeams, error: teamsError } = useQuery({
    queryKey: ["/api/events", selectedEvent, "teams"],
    queryFn: () => fetchEventTeams(selectedEvent!),
    enabled: !!selectedEvent,
    retry: 1,
    retryDelay: 5000
  });
  
  // Handle success and error with useEffect instead of in the useQuery options
  useEffect(() => {
    if (teams.length > 0) {
      onTeamsLoaded(teams);
      // Clear any previous error toasts
      toast({
        title: "Teams Loaded Successfully",
        description: `Loaded ${teams.length} teams from event`,
        variant: "default",
      });
    }
  }, [teams, onTeamsLoaded, toast]);
  
  useEffect(() => {
    if (teamsError) {
      toast({
        title: "Error loading teams",
        description: "API rate limit may have been reached. Please wait a minute and try again.",
        variant: "destructive",
      });
    }
  }, [teamsError, toast]);

  useEffect(() => {
    // Close search results when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchRef.current && 
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchFocus = () => {
    setIsSearchOpen(true);
  };

  const handleEventSelect = (event: Event) => {
    // Track event selection in Google Analytics
    trackEvent('Event Selection', 'select_event', `${event.key} - ${event.name}`, event.year);
    onEventSelect(event.key, event.name);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleClearEvent = () => {
    // Track clearing selected event
    trackEvent('Event Selection', 'clear_event', selectedEventName || 'Unknown Event');
    onEventSelect("", "");
  };

  const handleLoadTeams = () => {
    if (selectedEvent) {
      // Track team loading
      trackEvent('Data Loading', 'load_teams', `${selectedEvent} - ${selectedEventName}`);
      refetchTeams();
    }
  };

  const formatEventDate = (event: Event) => {
    if (!event.start_date) return "";
    
    const startDate = new Date(event.start_date);
    let dateString = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    if (event.end_date) {
      const endDate = new Date(event.end_date);
      dateString += `-${endDate.toLocaleDateString("en-US", { day: "numeric" })}, ${endDate.getFullYear()}`;
    } else {
      dateString += `, ${startDate.getFullYear()}`;
    }
    
    return dateString;
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium mb-4">Select Event</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="year" className="text-sm font-medium text-muted-foreground mb-1">Year</Label>
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="eventType" className="text-sm font-medium text-muted-foreground mb-1">Event Type</Label>
            <Select
              value={eventType}
              onValueChange={setEventType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
                <SelectItem value="district">District</SelectItem>
                <SelectItem value="championship">Championship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="event" className="text-sm font-medium text-muted-foreground mb-1">Event</Label>
            <div className="relative">
              <Input
                ref={searchRef}
                id="event"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                className="pl-10"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              
              {isSearchOpen && (
                <div 
                  ref={searchResultsRef}
                  className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-border"
                >
                  {isEventsLoading ? (
                    <div className="cursor-default select-none relative py-2 pl-3 pr-9">
                      Loading events...
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="cursor-default select-none relative py-2 pl-3 pr-9">
                      No events found
                    </div>
                  ) : (
                    filteredEvents.map((event) => (
                      <div 
                        key={event.key}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-muted"
                        onClick={() => handleEventSelect(event)}
                      >
                        <div className="flex items-start">
                          <p className="font-normal">{event.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {[event.city, event.state_prov].filter(Boolean).join(", ")} - {formatEventDate(event)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {selectedEvent && selectedEventName && (
            <div className="flex items-center bg-primary/20 text-primary rounded-full px-4 py-1">
              <span className="text-sm font-medium">{selectedEventName}</span>
              <button 
                className="ml-2 text-primary focus:outline-none" 
                onClick={handleClearEvent}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <Button 
            variant="default" 
            className="ml-auto flex items-center gap-2"
            onClick={handleLoadTeams}
            disabled={!selectedEvent || isTeamsLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Load Teams
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventSelector;
