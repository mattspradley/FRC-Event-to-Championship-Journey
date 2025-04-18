import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, BarChart3 } from "lucide-react";
import { TeamWithStatus, getQualificationStatus, getStatusColor, getStatusText } from "@/lib/api";

interface TeamCardProps {
  team: TeamWithStatus;
  onShowDetails: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onShowDetails }) => {
  const status = getQualificationStatus(team);
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status, team.waitlistPosition);
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-${statusColor}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-mono text-xl font-medium">Team {team.team.team_number}</h3>
          <Badge variant={statusColor === "muted" ? "secondary" : statusColor as any}>
            {statusText}
          </Badge>
        </div>
        <p className="text-lg font-medium mb-1">{team.team.nickname || team.team.name}</p>
        <p className="text-sm text-muted-foreground mb-2">
          {[team.team.city, team.team.state_prov].filter(Boolean).join(", ")}
        </p>
        
        <div className="border-t border-neutral-100 mt-3 pt-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Ranking:</span>
              <span className="font-medium ml-1">
                {team.rank ? `${team.rank} of ${team.totalTeams}` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">W-L-T:</span>
              <span className="font-medium ml-1">{team.record || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Championship:</span>
              <span className="font-medium ml-1">
                {team.isQualified ? team.championshipLocation || "Yes" : (status === "waitlist" ? "Pending" : "N/A")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Division:</span>
              <span className="font-medium ml-1">{team.division || (status === "waitlist" ? "TBD" : "N/A")}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted p-3 flex justify-between">
        <button 
          className="text-primary hover:text-primary-dark text-sm font-medium focus:outline-none flex items-center"
          onClick={() => window.open(`https://www.thebluealliance.com/team/${team.team.team_number}`)}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Match Schedule
        </button>
        <button 
          className="text-primary hover:text-primary-dark text-sm font-medium focus:outline-none flex items-center"
          onClick={onShowDetails}
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Team Details
        </button>
      </div>
    </div>
  );
};

export default TeamCard;
