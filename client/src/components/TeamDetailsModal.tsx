import React, { useEffect } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamWithStatus, getQualificationStatus, getStatusColor, getStatusText } from "@/lib/api";
import { Award, ExternalLink } from "lucide-react";
import { trackEvent } from "@/hooks/use-analytics";

interface TeamDetailsModalProps {
  team: TeamWithStatus;
  isOpen: boolean;
  onClose: () => void;
  eventYear?: number; // Optional event year for the team page link
  selectedEventName?: string | null; // The name of the currently selected event
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  team,
  isOpen,
  onClose,
  eventYear,
  selectedEventName,
}) => {
  const status = getQualificationStatus(team);
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status, team.waitlistPosition);
  const [, setLocation] = useLocation();
  
  // Track when modal is opened
  useEffect(() => {
    if (isOpen) {
      trackEvent(
        'Team Details', 
        'view_team_details', 
        `Team ${team.team.team_number} (${team.team.nickname || team.team.name})`,
        team.team.team_number
      );
    }
  }, [isOpen, team]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Team {team.team.team_number}: {team.team.nickname || team.team.name}
          </DialogTitle>
          <DialogDescription>
            Championship status and performance details
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Team Information</h4>
            <p className="text-sm mb-2">{[team.team.city, team.team.state_prov, team.team.country].filter(Boolean).join(", ")}</p>
            <p className="text-sm">Founded: {team.team.rookie_year || "Unknown"}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Championship Status</h4>
            <div className="flex items-center mb-2">
              <Badge 
                variant={statusColor === "muted" ? "secondary" : statusColor as any} 
                className={`mr-2 ${
                  statusColor === "success" ? "bg-green-100 text-green-800" : 
                  statusColor === "warning" ? "bg-yellow-100 text-yellow-800" :
                  statusColor === "destructive" ? "bg-red-100 text-red-800" : ""
                }`}
              >
                {statusText}
              </Badge>
              <span className="text-sm">
                {team.isQualified 
                  ? `${team.championshipLocation || "Championship"} - ${team.division || "TBD"} Division` 
                  : (status === "waitlist" ? "Pending Waitlist" : "Not Qualified")}
              </span>
            </div>
            
            {team.isQualified && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                {/* Show division information if available */}
                {team.division && (
                  <>
                    <h5 className="text-sm font-medium text-green-800 mb-2">Championship Division Performance</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-green-800">Division:</span>
                        <span className="font-medium ml-1 text-green-900">
                          {team.division || "Not Yet Assigned"}
                        </span>
                      </div>

                      <div>
                        <span className="text-green-800">Division Rank:</span>
                        <span className="font-medium ml-1 text-green-900">
                          {team.championshipRank ? `${team.championshipRank} of ${team.divisionTotalTeams || "N/A"}` : "Not Yet Available"}
                        </span>
                      </div>
                      <div>
                        <span className="text-green-800">Division Record:</span>
                        <span className="font-medium ml-1 text-green-900">
                          {team.championshipRecord || "Not Yet Available"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-green-800">Overall Status:</span>
                        <span 
                          className="font-medium ml-1 text-green-900"
                          dangerouslySetInnerHTML={{
                            __html: team.overall_status_str || "Not available"
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {/* Show finals information */}
                <h5 className="text-sm font-medium text-green-800 mb-2 mt-3">Championship Finals Performance</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {team.finalEventKey && (
                    <>
                      <div>
                        <span className="text-green-800">Finals Status:</span>
                        <span className="font-medium ml-1 text-green-900">
                          {team.finalRank || "Competing"}
                        </span>
                      </div>
                      {team.finalRecord && (
                        <div>
                          <span className="text-green-800">Finals Record:</span>
                          <span className="font-medium ml-1 text-green-900">
                            {team.finalRecord}
                          </span>
                        </div>
                      )}

                    </>
                  )}
                  <div className="col-span-2">
                    <span className="text-green-800">Alliance Status:</span>
                    <span 
                      className="font-medium ml-1 text-green-900"
                      dangerouslySetInnerHTML={{
                        __html: team.alliance_status_str || "Not yet available"
                      }}
                    />
                  </div>
                </div>
                
                {/* Show championship awards if available */}
                {team.championshipAwards && team.championshipAwards.length > 0 && (
                  <div className="mt-3">
                    <h6 className="text-sm font-medium text-green-800 mb-1">Championship Awards</h6>
                    <ul className="list-disc list-inside text-sm text-green-900">
                      {team.championshipAwards.map((award, index) => (
                        <li key={index}>{award.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Performance at {selectedEventName || "Current Event"}</h4>
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
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="order-3 sm:order-1">
            Close
          </Button>
          <div className="flex flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button 
              variant="secondary"
              className="flex items-center gap-1 flex-1"
              onClick={() => {
                // Track storyboard view
                trackEvent(
                  'Navigation', 
                  'view_team_storyboard', 
                  `Team ${team.team.team_number}`,
                  team.team.team_number
                );
                onClose();
                const year = eventYear || new Date().getFullYear();
                setLocation(`/team/${team.team.team_number}/${year}`);
              }}
            >
              <Award className="h-4 w-4" />
              View Storyboard
            </Button>
            <Button 
              className="flex items-center gap-1 flex-1"
              onClick={() => {
                // Track external TBA link click
                trackEvent(
                  'External Link', 
                  'view_team_on_tba', 
                  `Team ${team.team.team_number}`,
                  team.team.team_number
                );
                window.open(`https://www.thebluealliance.com/team/${team.team.team_number}/${eventYear || new Date().getFullYear()}`, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
              View on TBA
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDetailsModal;
