import { apiRequest } from "./queryClient";

export interface Event {
  key: string;
  name: string;
  short_name?: string;
  event_type: number;
  event_type_string?: string;
  year: number;
  start_date?: string;
  end_date?: string;
  city?: string;
  state_prov?: string;
  country?: string;
}

export interface Team {
  key: string;
  team_number: number;
  name: string;
  nickname?: string;
  city?: string;
  state_prov?: string;
  country?: string;
  rookie_year?: number;
  data?: {
    opr?: number;
    dpr?: number;
    awards?: string[];
    [key: string]: any;
  };
}

export interface ChampionshipAward {
  name: string;
  award_type: number;
  event_key: string;
  recipient_list: {
    team_key?: string;
    awardee?: string;
  }[];
  year: number;
}

export interface TeamWithStatus {
  team: Team;
  isQualified: boolean;
  waitlistPosition?: number;
  championshipLocation?: string;
  division?: string;
  divisionEventKey?: string;
  championshipEventKey?: string;
  championshipRank?: number;
  championshipRecord?: string;
  championshipAwards?: ChampionshipAward[];
  divisionTotalTeams?: number;
  rank?: number;
  record?: string;
  totalTeams?: number;
}

export type QualificationStatus = "qualified" | "waitlist" | "not-qualified" | "unknown";

export function getQualificationStatus(teamStatus: TeamWithStatus): QualificationStatus {
  if (teamStatus.isQualified) {
    return "qualified";
  } else if (teamStatus.waitlistPosition && teamStatus.waitlistPosition > 0) {
    return "waitlist";
  } else if (teamStatus.waitlistPosition === 0) {
    return "not-qualified";
  } else {
    return "unknown";
  }
}

export function getStatusColor(status: QualificationStatus): string {
  switch (status) {
    case "qualified": return "success";
    case "waitlist": return "warning";
    case "not-qualified": return "destructive";
    case "unknown": return "muted";
  }
}

export function getStatusText(status: QualificationStatus, waitlistPosition?: number): string {
  switch (status) {
    case "qualified": return "Qualified";
    case "waitlist": return `Waitlist ${waitlistPosition ? `#${waitlistPosition}` : ""}`;
    case "not-qualified": return "Not Qualified";
    case "unknown": return "Unknown";
  }
}

export async function fetchYears(): Promise<number[]> {
  const response = await fetch("/api/years");
  if (!response.ok) {
    throw new Error("Failed to fetch years");
  }
  return response.json();
}

export interface EventSearchParams {
  year?: number;
  query?: string;
  eventType?: string;
}

export async function searchEvents(params: EventSearchParams): Promise<Event[]> {
  const { year, query, eventType } = params;
  
  const queryParams = new URLSearchParams();
  if (year) queryParams.append("year", year.toString());
  if (query) queryParams.append("query", query);
  if (eventType) queryParams.append("eventType", eventType);
  
  const response = await fetch(`/api/search/events?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to search events");
  }
  return response.json();
}

export async function fetchEventDetails(eventKey: string): Promise<Event> {
  const response = await fetch(`/api/events/${eventKey}`);
  if (!response.ok) {
    throw new Error("Failed to fetch event details");
  }
  return response.json();
}

export async function fetchEventTeams(eventKey: string): Promise<TeamWithStatus[]> {
  const response = await fetch(`/api/events/${eventKey}/teams`);
  if (!response.ok) {
    throw new Error("Failed to fetch teams");
  }
  return response.json();
}
