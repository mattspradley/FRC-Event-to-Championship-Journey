import fetch from "node-fetch";
import { storage } from "../storage";
import { log } from "../vite";

// Set cache duration in seconds
const CACHE_DURATION = 86400; // 24 hours - Use longer cache for championship data which changes infrequently

// API rate limiting
const API_REQUESTS_PER_MINUTE = 25; // Set slightly below the limit to be safe
let requestsThisMinute = 0;
let lastRequestReset = Date.now();
let requestQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

// Process the queue of API requests
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    while (requestQueue.length > 0) {
      // Check if we need to wait for rate limit
      await checkRateLimit();
      
      // Execute the next request in the queue
      const nextRequest = requestQueue.shift();
      if (nextRequest) {
        await nextRequest();
      }
    }
  } finally {
    isProcessingQueue = false;
  }
};

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
    const waitTime = 60000 - (now - lastRequestReset) + 1000; // Add 1 second buffer
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
  
  // Create a promise that will be resolved when the API call completes
  return new Promise((resolve, reject) => {
    // Add this request to the queue
    const requestFunction = async () => {
      try {
        const apiKey = process.env.TBA_API_KEY;
        if (!apiKey) {
          throw new Error("The Blue Alliance API key not found in environment variables");
        }
        
        const response = await fetch(`https://www.thebluealliance.com/api/v3${endpoint}`, {
          headers: {
            "X-TBA-Auth-Key": apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache the result
        await storage.setCachedData(cacheKey, data, CACHE_DURATION);
        
        resolve(data);
      } catch (error) {
        log(`Error fetching from TBA API: ${error}`, "blueAlliance");
        reject(error);
      }
    };
    
    // Add to queue and start processing if not already
    requestQueue.push(requestFunction);
    processQueue().catch(error => {
      log(`Error processing request queue: ${error}`, "blueAlliance");
    });
  });
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
    log(`Getting championship status for teams at event ${eventKey}`, "blueAlliance");
    
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
    
    // Pre-fetch all championship teams to avoid multiple API calls
    const champTeamsMap: Record<string, any[]> = {};
    const divTeamsMap: Record<string, any[]> = {};
    
    // Get teams for each championship event (but limit concurrent requests)
    log(`Prefetching teams for ${championshipEvents.length} championship events`, "blueAlliance");
    for (const champEvent of championshipEvents) {
      try {
        champTeamsMap[champEvent.key] = await getEventTeams(champEvent.key);
        log(`Fetched ${champTeamsMap[champEvent.key].length} teams for championship ${champEvent.key}`, "blueAlliance");
      } catch (error) {
        log(`Error fetching teams for championship ${champEvent.key}: ${error}`, "blueAlliance");
        champTeamsMap[champEvent.key] = [];
      }
    }
    
    // Get teams for each division
    log(`Prefetching teams for ${divisions.length} divisions`, "blueAlliance");
    for (const div of divisions) {
      try {
        divTeamsMap[div.key] = await getEventTeams(div.key);
        log(`Fetched ${divTeamsMap[div.key].length} teams for division ${div.key}`, "blueAlliance");
      } catch (error) {
        log(`Error fetching teams for division ${div.key}: ${error}`, "blueAlliance");
        divTeamsMap[div.key] = [];
      }
    }
    
    // For each team, check which championship they're in (now using pre-fetched data)
    const teamStatuses = teams.map((team: any) => {
      const teamKey = team.key;
      
      // Check all championship events to see if this team is registered
      let isQualified = false;
      let championshipLocation = '';
      let division = '';
      
      // Check each championship event for this team using pre-fetched data
      for (const champEvent of championshipEvents) {
        const champTeams = champTeamsMap[champEvent.key] || [];
        const foundTeam = champTeams.find((t: any) => t.key === teamKey);
        
        if (foundTeam) {
          isQualified = true;
          championshipLocation = champEvent.city || champEvent.name;
          
          // If this is a top-level championship, check divisions
          if (champEvent.event_type === 3) {
            for (const div of divisions) {
              const divTeams = divTeamsMap[div.key] || [];
              if (divTeams.find((t: any) => t.key === teamKey)) {
                division = div.name;
                break;
              }
            }
          }
          
          break;
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
    });
    
    log(`Processed ${teamStatuses.length} team statuses for event ${eventKey}`, "blueAlliance");
    return teamStatuses;
  } catch (error) {
    log(`Error determining championship status: ${error}`, "blueAlliance");
    throw error;
  }
}
