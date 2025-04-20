import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventSelector from "@/components/EventSelector";
import StatusDashboard from "@/components/StatusDashboard";
import TeamFilter from "@/components/TeamFilter";
import TeamsList from "@/components/TeamsList";
import { TeamWithStatus } from "@/lib/api";

const Home: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = React.useState<string | null>(null);
  const [eventName, setEventName] = React.useState<string | null>(null);
  const [teams, setTeams] = React.useState<TeamWithStatus[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<string>("team-number");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <EventSelector 
          onEventSelect={(eventKey, name) => {
            setSelectedEvent(eventKey);
            setEventName(name);
            setIsLoading(true);
          }}
          onTeamsLoaded={(eventTeams) => {
            setTeams(eventTeams);
            setIsLoading(false);
          }}
          selectedEvent={selectedEvent}
          selectedEventName={eventName}
        />
        
        {selectedEvent && (
          <>
            <StatusDashboard 
              teams={teams}
              isLoading={isLoading} 
            />
            
            <TeamFilter 
              onStatusFilterChange={setStatusFilter}
              onSortChange={setSortBy}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              sortBy={sortBy}
              searchQuery={searchQuery}
            />
            
            <TeamsList 
              teams={teams}
              isLoading={isLoading}
              statusFilter={statusFilter}
              sortBy={sortBy}
              searchQuery={searchQuery}
              eventYear={selectedEvent ? parseInt(selectedEvent.substring(0, 4)) : undefined}
              selectedEventName={eventName}
            />
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
