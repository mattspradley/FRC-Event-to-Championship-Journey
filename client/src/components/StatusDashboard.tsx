import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamWithStatus, getQualificationStatus } from "@/lib/api";

interface StatusDashboardProps {
  teams: TeamWithStatus[];
  isLoading: boolean;
}

const StatusDashboard: React.FC<StatusDashboardProps> = ({ teams, isLoading }) => {
  const stats = useMemo(() => {
    const qualified = teams.filter(team => getQualificationStatus(team) === "qualified").length;
    const waitlist = teams.filter(team => getQualificationStatus(team) === "waitlist").length;
    
    // Find championship date from the first qualified team
    const qualifiedTeam = teams.find(team => 
      team.isQualified && team.championshipLocation
    );
    
    let championshipDate = "TBD";
    if (qualifiedTeam) {
      // Mock championship date - in a real app, we'd get this from the championship event data
      championshipDate = "April 19-22, 2023";
    }
    
    return {
      qualified,
      waitlist,
      total: teams.length,
      championshipDate
    };
  }, [teams]);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-5 w-36" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Championship Qualification Status</h2>
          <div className="text-sm text-muted-foreground">
            <span>{stats.qualified}</span> of <span>{stats.total}</span> teams qualified
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-100 rounded-lg p-3 border-l-4 border-green-600">
            <h3 className="text-sm text-muted-foreground">Qualified Teams</h3>
            <p className="text-2xl font-medium">{stats.qualified}</p>
          </div>
          <div className="bg-yellow-100 rounded-lg p-3 border-l-4 border-yellow-500">
            <h3 className="text-sm text-muted-foreground">Waiting List</h3>
            <p className="text-2xl font-medium">{stats.waitlist}</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-3 border-l-4 border-blue-600">
            <h3 className="text-sm text-muted-foreground">Championship Date</h3>
            <p className="text-xl font-medium">{stats.championshipDate}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            <span>Qualified</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 rounded-full bg-amber-500 mr-1"></span>
            <span>Waitlist</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            <span>Not Qualified</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 rounded-full bg-neutral-400 mr-1"></span>
            <span>Unknown</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusDashboard;
