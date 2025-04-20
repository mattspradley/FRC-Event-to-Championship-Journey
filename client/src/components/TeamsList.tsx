import React, { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import TeamCard from "./TeamCard";
import TeamDetailsModal from "./TeamDetailsModal";
import { TeamWithStatus, getQualificationStatus } from "@/lib/api";
import { SearchCode } from "lucide-react";

interface TeamsListProps {
  teams: TeamWithStatus[];
  isLoading: boolean;
  statusFilter: string;
  sortBy: string;
  searchQuery: string;
  eventYear?: number; // Add optional event year parameter
}

const TeamsList: React.FC<TeamsListProps> = ({
  teams,
  isLoading,
  statusFilter,
  sortBy,
  searchQuery,
  eventYear,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<TeamWithStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const filteredAndSortedTeams = useMemo(() => {
    // Filter teams based on status and search query
    let filtered = [...teams];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (team) => getQualificationStatus(team) === statusFilter
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (team) =>
          team.team.team_number.toString().includes(query) ||
          (team.team.nickname && team.team.nickname.toLowerCase().includes(query)) ||
          (team.team.name && team.team.name.toLowerCase().includes(query)) ||
          (team.team.city && team.team.city.toLowerCase().includes(query))
      );
    }
    
    // Sort teams based on selected sort method
    switch (sortBy) {
      case "team-number":
        filtered.sort((a, b) => a.team.team_number - b.team.team_number);
        break;
      case "ranking":
        filtered.sort((a, b) => {
          if (!a.rank) return 1;
          if (!b.rank) return -1;
          return a.rank - b.rank;
        });
        break;
      case "qualification-status":
        filtered.sort((a, b) => {
          const statusOrder = {
            qualified: 0,
            waitlist: 1,
            "not-qualified": 2,
            unknown: 3,
          };
          const statusA = getQualificationStatus(a);
          const statusB = getQualificationStatus(b);
          return statusOrder[statusA] - statusOrder[statusB];
        });
        break;
    }
    
    return filtered;
  }, [teams, statusFilter, sortBy, searchQuery]);

  const handleShowDetails = (team: TeamWithStatus) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4">
              <Skeleton className="h-6 bg-neutral-200 rounded mb-3 w-1/2" />
              <Skeleton className="h-4 bg-neutral-200 rounded mb-2" />
              <Skeleton className="h-4 bg-neutral-200 rounded mb-2 w-3/4" />
              <Skeleton className="h-4 bg-neutral-200 rounded mb-2 w-1/2" />
              <Skeleton className="h-8 bg-neutral-200 rounded mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedTeams.length > 0 ? (
          filteredAndSortedTeams.map((team) => (
            <TeamCard
              key={team.team.key}
              team={team}
              onShowDetails={() => handleShowDetails(team)}
              eventYear={eventYear}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <SearchCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No teams found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or selecting a different event.</p>
          </div>
        )}
      </div>
      
      {selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TeamsList;
