import React from "react";
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

interface TeamDetailsModalProps {
  team: TeamWithStatus;
  isOpen: boolean;
  onClose: () => void;
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  team,
  isOpen,
  onClose,
}) => {
  const status = getQualificationStatus(team);
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status, team.waitlistPosition);
  
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
                        <span className="text-green-800">Event Key:</span>
                        <span className="font-medium ml-1 text-green-900">
                          {team.divisionEventKey || "N/A"}
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
                    </div>
                  </>
                )}
                
                {/* Show finals information if available */}
                {team.finalEventKey && (
                  <>
                    <h5 className="text-sm font-medium text-green-800 mb-2 mt-3">Championship Finals Performance</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
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
                      <div>
                        <span className="text-green-800">Championship Key:</span>
                        <span className="font-medium ml-1 text-green-900">
                          {team.finalEventKey}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                
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
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Performance at Current Event</h4>
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
                <span className="text-muted-foreground">OPR:</span>
                <span className="font-medium ml-1">
                  {team.team.data && (team.team.data as any).opr ? 
                    (team.team.data as any).opr.toFixed(2) : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">DPR:</span>
                <span className="font-medium ml-1">
                  {team.team.data && (team.team.data as any).dpr ? 
                    (team.team.data as any).dpr.toFixed(2) : "N/A"}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Awards at Current Event</h4>
            <ul className="text-sm list-disc list-inside">
              {(team.team.data && (team.team.data as any).awards && (team.team.data as any).awards.length > 0) ?
                (team.team.data as any).awards.map((award: string, index: number) => (
                  <li key={index}>{award}</li>
                )) :
                <li>No awards data available</li>
              }
            </ul>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => window.open(`https://www.thebluealliance.com/team/${team.team.team_number}`, '_blank')}
          >
            View on The Blue Alliance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDetailsModal;
