import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Calendar, ChevronRight, Medal, Award, Flag, Trophy, ArrowRight, Star, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { trackEvent } from "@/hooks/use-analytics";

interface Achievement {
  event: {
    key: string;
    name: string;
    short_name?: string;
    startDate: string;
    endDate: string;
    eventType: number;
    eventTypeString: string;
    city?: string;
    stateProv?: string;
    country?: string;
  };
  performance?: {
    rank: number;
    totalTeams: number;
    record: string;
  } | null;
  status?: any;
  awards: any[];
  allianceStatusHtml: string;
  overallStatusHtml: string;
  error?: string;
}

interface TeamData {
  teamKey: string;
  teamNumber: number;
  teamName: string;
  teamNickname?: string;
  rookieYear?: number;
  year: number;
  achievements: Achievement[];
}

const TeamStoryboard: React.FC = () => {
  const [match, params] = useRoute("/team/:teamNumber/:year");
  const [, setLocation] = useLocation();
  const [teamNumber, setTeamNumber] = useState<string>(match ? params.teamNumber : "");
  const [year, setYear] = useState<string>(match ? params.year : new Date().getFullYear().toString());
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  
  // Fetch available years
  useEffect(() => {
    apiRequest("/api/years")
      .then((yearsData: number[]) => {
        setYears(yearsData);
        if (!match) {
          setYear(yearsData[0].toString());
        }
      })
      .catch(err => {
        console.error("Error fetching years:", err);
      });
  }, [match]);

  // Track if we've already loaded data to prevent infinite loops
  const [dataLoaded, setDataLoaded] = React.useState<boolean>(false);
  
  // Load team data if we have a team number and year in the URL
  useEffect(() => {
    if (match && params.teamNumber && params.year && !dataLoaded) {
      setDataLoaded(true);
      loadTeamData(params.teamNumber, params.year, false);
    }
  }, [match, params, dataLoaded]);

  const loadTeamData = async (teamNum: string, yearStr: string, updateURL: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const data: TeamData = await apiRequest(`/api/team/${teamNum}/achievements/${yearStr}`);
      setTeamData(data);
      
      // Only update URL if requested (for form submissions, not for URL-triggered loads)
      if (updateURL) {
        setLocation(`/team/${teamNum}/${yearStr}`, { replace: true });
      }
    } catch (err) {
      console.error("Error loading team data:", err);
      setError("Failed to load team data. Please check the team number and try again.");
      setTeamData(null);
      toast({
        title: "Error",
        description: "Failed to load team data. Please check the team number and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamNumber.trim() && year) {
      loadTeamData(teamNumber.trim(), year);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper to get a color based on ranking performance
  const getRankColor = (rank: number, totalTeams: number) => {
    const percentile = rank / totalTeams;
    if (percentile <= 0.25) return "bg-green-100 text-green-800 hover:bg-green-200"; // Top 25%
    if (percentile <= 0.5) return "bg-blue-100 text-blue-800 hover:bg-blue-200"; // Top 50%
    if (percentile <= 0.75) return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"; // Top 75%
    return "bg-red-100 text-red-800 hover:bg-red-200"; // Bottom 25%
  };
  
  // Helper to get background color for percentile bar
  const getPercentileColor = (rank: number, totalTeams: number) => {
    const percentile = rank / totalTeams;
    if (percentile <= 0.25) return "bg-green-500"; // Top 25%
    if (percentile <= 0.5) return "bg-blue-500"; // Top 50%
    if (percentile <= 0.75) return "bg-yellow-500"; // Top 75%
    return "bg-red-500"; // Bottom 25%
  };

  // Helper to get event type badge color
  const getEventTypeColor = (eventType: number) => {
    switch (eventType) {
      case 0: return "bg-blue-100 text-blue-800 hover:bg-blue-200"; // Regional
      case 1: return "bg-purple-100 text-purple-800 hover:bg-purple-200"; // District
      case 2: return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"; // District Championship
      case 3: return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"; // Championship Division
      case 4: return "bg-green-100 text-green-800 hover:bg-green-200"; // Championship Final
      case 5: return "bg-red-100 text-red-800 hover:bg-red-200"; // Festival of Champions
      case 6: return "bg-orange-100 text-orange-800 hover:bg-orange-200"; // Offseason
      case 99: return "bg-gray-100 text-gray-800 hover:bg-gray-200"; // Unlabeled
      case 100: return "bg-pink-100 text-pink-800 hover:bg-pink-200"; // Preseason
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-200"; // Default
    }
  };

  // Get a nice name for event type
  const getEventTypeName = (eventType: number) => {
    switch (eventType) {
      case 0: return "Regional";
      case 1: return "District";
      case 2: return "District Championship";
      case 3: return "Championship Division";
      case 4: return "Championship Finals";
      case 5: return "Festival of Champions";
      case 6: return "Offseason";
      case 99: return "Unlabeled";
      case 100: return "Preseason";
      default: return "Unknown";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Team Achievement Storyboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Search Team</CardTitle>
                <CardDescription>Enter a team number to view their season journey</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamNumber">Team Number</Label>
                    <Input 
                      id="teamNumber" 
                      type="text" 
                      placeholder="e.g. 254" 
                      value={teamNumber}
                      onChange={(e) => setTeamNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    View Storyboard
                  </Button>
                </form>
              </CardContent>
            </Card>

            {teamData && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Team {teamData.teamNumber}</CardTitle>
                  <CardDescription>{teamData.teamNickname || teamData.teamName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Season</span>
                      <span className="font-medium">{teamData.year}</span>
                    </div>
                    {teamData.rookieYear && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Rookie Year</span>
                        <span className="font-medium">{teamData.rookieYear}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Events</span>
                      <span className="font-medium">{teamData.achievements.length}</span>
                    </div>
                    
                    {/* Performance Trend */}
                    {teamData.achievements.some(a => a.performance) && (
                      <>
                        <div className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Performance Trend</span>
                          </div>
                          <ResponsiveContainer width="100%" height={60}>
                            <LineChart
                              data={teamData.achievements
                                .filter(a => a.performance)
                                .map((a, index) => ({
                                  name: a.event.short_name || a.event.name,
                                  rank: a.performance?.rank,
                                  percentile: a.performance ? 
                                    1 - (a.performance.rank / a.performance.totalTeams) : 0,
                                  index
                                }))}
                            >
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-background border border-border p-2 rounded-md shadow-sm text-xs">
                                        <p className="font-medium">{payload[0].payload.name}</p>
                                        <p>Rank: {payload[0].payload.rank}</p>
                                        <p>Percentile: {Math.round(payload[0].payload.percentile * 100)}%</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Line 
                                type="monotone"
                                dataKey="percentile"
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={true}
                                activeDot={{ r: 4 }}
                                isAnimationActive={true}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>First Event</span>
                            <span>Latest Event</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(`https://www.thebluealliance.com/team/${teamData.teamNumber}/${teamData.year}`, '_blank')}>
                    View on The Blue Alliance
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                </div>
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardHeader>
                  <CardTitle>Error Loading Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{error}</p>
                </CardContent>
              </Card>
            ) : teamData ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">
                  {teamData.teamNumber} - {teamData.teamNickname || teamData.teamName} ({teamData.year} Season)
                </h2>
                
                <div className="relative">
                  {/* Timeline connecting each event */}
                  <div className="absolute top-0 bottom-0 left-6 w-px bg-muted-foreground/20"></div>
                  
                  {/* Event achievements */}
                  <div className="space-y-8">
                    {teamData.achievements.map((achievement, index) => (
                      <div key={achievement.event.key} className="relative pl-16">
                        {/* Timeline dot */}
                        <div className="absolute left-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        
                        <Card className="relative">
                          {/* Arrow pointing to the card */}
                          <div className="absolute -left-4 top-4 w-4 h-4 transform rotate-45 bg-background border-l border-t border-muted-foreground/20"></div>
                          
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start mb-1">
                              <CardTitle>{achievement.event.name}</CardTitle>
                              <div className="flex flex-col gap-2 items-end">
                                <Badge variant="outline" className={getEventTypeColor(achievement.event.eventType)}>
                                  {getEventTypeName(achievement.event.eventType)}
                                </Badge>
                                {achievement.awards && achievement.awards.length > 0 && achievement.awards.some(a => a.name.toLowerCase().includes('winner')) && (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm">
                                    <Trophy className="h-3 w-3 mr-1" /> Winner
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <CardDescription>
                              <div className="flex items-center gap-2">
                                {achievement.event.city && (
                                  <span>{achievement.event.city}{achievement.event.stateProv ? `, ${achievement.event.stateProv}` : ''}</span>
                                )}
                                <span>•</span>
                                <span>{formatDate(achievement.event.startDate)} - {formatDate(achievement.event.endDate)}</span>
                              </div>
                            </CardDescription>
                          </CardHeader>
                          
                          <CardContent className="pb-4">
                            <div className="space-y-4">
                              {/* Performance Section */}
                              {achievement.performance && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-muted-foreground">Performance</h4>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge className={getRankColor(achievement.performance.rank, achievement.performance.totalTeams)}>
                                      Rank: {achievement.performance.rank} / {achievement.performance.totalTeams}
                                    </Badge>
                                    <Badge variant="outline">
                                      Record: {achievement.performance.record}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                              
                              {/* Status Section */}
                              {achievement.overallStatusHtml && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-muted-foreground">Event Performance</h4>
                                  <div 
                                    className="text-sm"
                                    dangerouslySetInnerHTML={{ __html: achievement.overallStatusHtml }}
                                  />
                                </div>
                              )}
                              
                              {/* Alliance Status */}
                              {achievement.allianceStatusHtml && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-muted-foreground">Alliance Selection</h4>
                                  <div 
                                    className="text-sm"
                                    dangerouslySetInnerHTML={{ __html: achievement.allianceStatusHtml }}
                                  />
                                </div>
                              )}
                              
                              {/* Awards Section */}
                              {achievement.awards && achievement.awards.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-muted-foreground">Awards</h4>
                                  <ul className="space-y-1">
                                    {achievement.awards.map((award, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">{award.name}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          
                          <CardFooter>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`https://www.thebluealliance.com/event/${achievement.event.key}`, '_blank')}
                            >
                              View Event
                            </Button>
                          </CardFooter>
                        </Card>
                        
                        {/* Connection shown below instead of a badge outside the card */}
                        
                        {/* Show connection to next event */}
                        {index < teamData.achievements.length - 1 && (
                          <div className="absolute left-6 -bottom-4 w-px h-8 bg-muted-foreground/20 flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-muted-foreground absolute -right-1.5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted p-8 rounded-lg text-center">
                <h3 className="text-xl font-medium mb-2">No Team Selected</h3>
                <p className="text-muted-foreground mb-6">Enter a team number and year to view their season journey and achievements.</p>
                <img 
                  src="https://www.thebluealliance.com/images/first_logo.svg" 
                  alt="FIRST Logo" 
                  className="max-w-[200px] mx-auto opacity-30"
                />
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TeamStoryboard;