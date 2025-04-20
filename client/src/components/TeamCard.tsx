import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, BarChart3 } from "lucide-react";
import { TeamWithStatus, getQualificationStatus, getStatusColor, getStatusText } from "@/lib/api";

interface TeamCardProps {
  team: TeamWithStatus;
  onShowDetails: () => void;
  eventYear?: number; // Optional event year for the team page link
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onShowDetails, eventYear }) => {
  const status = getQualificationStatus(team);
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status, team.waitlistPosition);
  
  // Define better colors based on status - only affect the border, not the background
  const statusColorClasses: Record<string, string> = {
    success: "border-green-500",
    warning: "border-yellow-500",
    destructive: "border-red-500",
    muted: "border-gray-300"
  };
  
  const badgeClasses: Record<string, string> = {
    success: "bg-green-100 text-green-800 hover:bg-green-200",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    destructive: "bg-red-100 text-red-800 hover:bg-red-200",
    muted: ""
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-t-4 ${
        statusColor === "success" ? statusColorClasses.success :
        statusColor === "warning" ? statusColorClasses.warning :
        statusColor === "destructive" ? statusColorClasses.destructive :
        statusColorClasses.muted
      }`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-mono text-xl font-medium">Team {team.team.team_number}</h3>
          <Badge 
            variant={statusColor === "muted" ? "secondary" : statusColor as any}
            className={
              statusColor === "success" ? badgeClasses.success :
              statusColor === "warning" ? badgeClasses.warning :
              statusColor === "destructive" ? badgeClasses.destructive :
              badgeClasses.muted
            }
          >
            {statusText}
          </Badge>
        </div>
        <p className="text-lg font-medium mb-1">{team.team.nickname || team.team.name}</p>
        <p className="text-sm text-muted-foreground mb-2">
          {[team.team.city, team.team.state_prov].filter(Boolean).join(", ")}
        </p>
        
        <div className="border-t border-neutral-100 mt-3 pt-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {/* Local event rankings */}
            <div>
              <span className="text-muted-foreground">Event Rank:</span>
              <span className="font-medium ml-1">
                {team.rank ? `${team.rank} of ${team.totalTeams}` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Event Record:</span>
              <span className="font-medium ml-1">{team.record || "N/A"}</span>
            </div>
            
            {/* Local event rankings */}
            {!team.isQualified && (
              <>
                <div>
                  <span className="text-muted-foreground">Championship:</span>
                  <span className="font-medium ml-1">
                    {status === "waitlist" ? "Pending" : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Division:</span>
                  <span className="font-medium ml-1">{status === "waitlist" ? "TBD" : "N/A"}</span>
                </div>
              </>
            )}
            
            {/* Championship qualification info - always show if qualified */}
            {team.isQualified && (
              <>
                <div>
                  <span className="text-muted-foreground">Championship:</span>
                  <span className="font-medium ml-1">
                    {team.championshipLocation || "Yes"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Division:</span>
                  <span className="font-medium ml-1">{team.division || "TBD"}</span>
                </div>
              </>
            )}
            
            {/* Always show all ranks for qualified teams */}
            {team.isQualified && (
              <>
                <div>
                  <span className="text-muted-foreground">Division Rank:</span>
                  <span className="font-medium ml-1">
                    {team.championshipRank ? `${team.championshipRank} of ${team.divisionTotalTeams || 'N/A'}` : "TBD"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Division Record:</span>
                  <span className="font-medium ml-1">{team.championshipRecord || "TBD"}</span>
                </div>
              </>
            )}
            
            {/* Finals info - only show if qualified and has finals data */}
            {team.isQualified && team.finalEventKey && (
              <>
                <div>
                  <span className="text-muted-foreground">Finals Rank:</span>
                  <span className="font-medium ml-1">
                    {team.finalRank || "Competing"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Finals Record:</span>
                  <span className="font-medium ml-1">{team.finalRecord || "TBD"}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="bg-muted p-3 flex justify-between">
        <button 
          className="text-primary hover:text-primary-dark text-sm font-medium focus:outline-none flex items-center"
          onClick={() => window.open(`https://www.thebluealliance.com/team/${team.team.team_number}/${eventYear || new Date().getFullYear()}`)}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Team Season
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
