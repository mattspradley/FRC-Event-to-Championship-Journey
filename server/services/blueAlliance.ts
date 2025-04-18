import fetch from "node-fetch";
import { storage } from "../storage";
import { log } from "../vite";

// Set cache duration in seconds
const CACHE_DURATION = 3600; // 1 hour

// API rate limiting
const API_REQUESTS_PER_MINUTE = 30;
let requestsThisMinute = 0;
let lastRequestReset = Date.now();

// Handle rate limiting
const checkRateLimit = async () => {
  const now = Date.now();
  
  // Reset counter if a minute has passed
  if (now - lastRequestReset > 60000) {
    requestsThisMinute = 0;
    lastRequestReset = now;
  }
  
  // Check if we've exceeded our rate limit
  if (requestsThisMinute >= API_REQUESTS_PER_MINUTE) {
    const waitTime = 60000 - (now - lastRequestReset);
    log(`Rate limit reached. Waiting ${waitTime}ms before next request.`, "blueAlliance");
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestsThisMinute = 0;
    lastRequestReset = Date.now();
  }
  
  requestsThisMinute++;
};

// Helper to get data from API with caching
export async function fetchFromApi(endpoint: string): Promise<any> {
  if (!process.env.TBA_API_KEY) {
    throw new Error("The Blue Alliance API key not found in environment variables");
  }
  
  const cacheKey = `tba:${endpoint}`;
  
  // Try to get from cache first
  const cachedData = await storage.getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Respect rate limits
  await checkRateLimit();
  
  try {
    const response = await fetch(`https://www.thebluealliance.com/api/v3${endpoint}`, {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    await storage.setCachedData(cacheKey, data, CACHE_DURATION);
    
    return data;
  } catch (error) {
    log(`Error fetching from TBA API: ${error}`, "blueAlliance");
    throw error;
  }
}

// Get all events for a year
export async function getEvents(year: number) {
  return fetchFromApi(`/events/${year}`);
}

// Get specific event details
export async function getEvent(eventKey: string) {
  return fetchFromApi(`/event/${eventKey}`);
}

// Get teams at an event
export async function getEventTeams(eventKey: string) {
  return fetchFromApi(`/event/${eventKey}/teams`);
}

// Get event rankings
export async function getEventRankings(eventKey: string) {
  return fetchFromApi(`/event/${eventKey}/rankings`);
}

// Get championship events for a year
export async function getChampionshipEvents(year: number) {
  const events = await getEvents(year);
  return events.filter((event: any) => 
    event.event_type === 3 || event.event_type === 4 // Championship & Championship Division
  );
}

// Get championship divisions (for mapping teams to divisions)
export async function getChampionshipDivisions(year: number) {
  const championships = await getChampionshipEvents(year);
  return championships.filter((event: any) => event.event_type === 4);
}

// Determine championship qualification status for teams at an event
export async function getTeamChampionshipStatus(eventKey: string, year: number) {
  try {
    // Get world championship events for reference
    const championshipEvents = await getChampionshipEvents(year);
    
    // Get championship divisions
    const divisions = await getChampionshipDivisions(year);
    
    // Get teams at this event
    const teams = await getEventTeams(eventKey);
    
    // Get rankings data
    let rankings: any = {};
    try {
      const rankData = await getEventRankings(eventKey);
      if (rankData && rankData.rankings) {
        rankData.rankings.forEach((rank: any) => {
          rankings[rank.team_key] = {
            rank: rank.rank,
            record: `${rank.record.wins}-${rank.record.losses}-${rank.record.ties}`,
            totalTeams: rankData.rankings.length
          };
        });
      }
    } catch (error) {
      log(`Error fetching rankings for event ${eventKey}: ${error}`, "blueAlliance");
      // Continue without rankings data
    }
    
    // For each team, check which championship they're in
    const teamStatuses = await Promise.all(teams.map(async (team: any) => {
      const teamKey = team.key;
      
      // Check all championship events to see if this team is registered
      let isQualified = false;
      let championshipLocation = '';
      let division = '';
      
      // Check each championship event for this team
      for (const champEvent of championshipEvents) {
        try {
          const champTeams = await getEventTeams(champEvent.key);
          const foundTeam = champTeams.find((t: any) => t.key === teamKey);
          
          if (foundTeam) {
            isQualified = true;
            championshipLocation = champEvent.city || champEvent.name;
            
            // If this is a top-level championship, check divisions
            if (champEvent.event_type === 3) {
              for (const div of divisions) {
                const divTeams = await getEventTeams(div.key);
                if (divTeams.find((t: any) => t.key === teamKey)) {
                  division = div.name;
                  break;
                }
              }
            }
            
            break;
          }
        } catch (error) {
          log(`Error checking championship status for team ${teamKey}: ${error}`, "blueAlliance");
          // Continue with the next championship
        }
      }
      
      const rankInfo = rankings[teamKey] || {};
      
      return {
        team,
        isQualified,
        waitlistPosition: isQualified ? undefined : (Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : 0), // Mock waitlist for demo
        championshipLocation,
        division,
        rank: rankInfo.rank,
        record: rankInfo.record,
        totalTeams: rankInfo.totalTeams
      };
    }));
    
    return teamStatuses;
  } catch (error) {
    log(`Error determining championship status: ${error}`, "blueAlliance");
    throw error;
  }
}
