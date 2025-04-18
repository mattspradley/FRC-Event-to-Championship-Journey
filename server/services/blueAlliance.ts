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
    event.event_type === 3 || event.event_type === 4 || event.event_type === 5 // Championship, Championship Division & Festival of Champions
  );
}

// Get championship divisions (for mapping teams to divisions)
export async function getChampionshipDivisions(year: number) {
  const championships = await getChampionshipEvents(year);
  return championships.filter((event: any) => event.event_type === 4);
}

// Get event results/status for a specific championship event
export async function getChampionshipEventStatus(eventKey: string) {
  try {
    // Get event details to determine if the event is finished
    const event = await getEvent(eventKey);
    const now = new Date();
    const endDate = event.end_date ? new Date(event.end_date) : null;
    const isFinished = endDate ? now > endDate : false;
    
    // Get rankings
    let rankings = [];
    try {
      const rankData = await getEventRankings(eventKey);
      if (rankData && rankData.rankings) {
        rankings = rankData.rankings;
      }
    } catch (error) {
      log(`Error fetching championship rankings for ${eventKey}: ${error}`, "blueAlliance");
    }
    
    // Get awards if event is finished
    let awards = [];
    if (isFinished) {
      try {
        awards = await fetchFromApi(`/event/${eventKey}/awards`);
      } catch (error) {
        log(`Error fetching awards for ${eventKey}: ${error}`, "blueAlliance");
      }
    }
    
    return {
      isFinished,
      rankings,
      awards,
      event
    };
  } catch (error) {
    log(`Error getting championship status for ${eventKey}: ${error}`, "blueAlliance");
    return {
      isFinished: false,
      rankings: [],
      awards: [],
      event: null
    };
  }
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
    const divRankingsMap: Record<string, any> = {};
    const divAwardsMap: Record<string, any[]> = {};
    
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
    
    // Get teams and data for each division
    log(`Prefetching teams and rankings for ${divisions.length} divisions`, "blueAlliance");
    for (const div of divisions) {
      try {
        // Get teams in this division
        divTeamsMap[div.key] = await getEventTeams(div.key);
        log(`Fetched ${divTeamsMap[div.key].length} teams for division ${div.key}`, "blueAlliance");
        
        // Get rankings for this division
        try {
          const divRankings = await getEventRankings(div.key);
          divRankingsMap[div.key] = divRankings;
          log(`Fetched rankings for division ${div.key}`, "blueAlliance");
        } catch (error) {
          log(`Error fetching rankings for division ${div.key}: ${error}`, "blueAlliance");
          divRankingsMap[div.key] = { rankings: [] };
        }
        
        // Get awards for this division
        try {
          const divAwards = await fetchFromApi(`/event/${div.key}/awards`);
          divAwardsMap[div.key] = divAwards;
          log(`Fetched awards for division ${div.key}`, "blueAlliance");
        } catch (error) {
          log(`Error fetching awards for division ${div.key}: ${error}`, "blueAlliance");
          divAwardsMap[div.key] = [];
        }
      } catch (error) {
        log(`Error fetching teams for division ${div.key}: ${error}`, "blueAlliance");
        divTeamsMap[div.key] = [];
        divRankingsMap[div.key] = { rankings: [] };
        divAwardsMap[div.key] = [];
      }
    }
    
    // For each team, check which championship they're in (now using pre-fetched data)
    const teamPromises = teams.map(async (team: any) => {
      const teamKey = team.key;
      
      // Check all championship events to see if this team is registered
      let isQualified = false;
      let championshipLocation = '';
      let division = '';
      let championshipEventKey = '';
      let divisionEventKey = '';
      
      // Check each championship event for this team using pre-fetched data
      for (const champEvent of championshipEvents) {
        const champTeams = champTeamsMap[champEvent.key] || [];
        const foundTeam = champTeams.find((t: any) => t.key === teamKey);
        
        if (foundTeam) {
          isQualified = true;
          championshipLocation = champEvent.city || champEvent.name;
          
          // Determine event type and store event key
          if (champEvent.event_type === 3) { // Main championship
            championshipEventKey = champEvent.key;
            
            // Check divisions for this team
            for (const div of divisions) {
              const divTeams = divTeamsMap[div.key] || [];
              if (divTeams.find((t: any) => t.key === teamKey)) {
                division = div.name;
                divisionEventKey = div.key;
                break;
              }
            }
          } else if (champEvent.event_type === 4) { // Division event
            divisionEventKey = champEvent.key;
            division = champEvent.name;
          }
          
          if (championshipEventKey || divisionEventKey) {
            break;
          }
        }
      }
      
      const rankInfo = rankings[teamKey] || {};
      
      // Get championship performance data
      let championshipRank = null;
      let championshipRecord = null;
      let championshipAwards = [];
      let divisionTotalTeams = 0;
      
      // If we have a division key, use our pre-fetched division data
      if (divisionEventKey) {
        // Get division rankings from pre-fetched data
        const divisionRankings = divRankingsMap[divisionEventKey];
        if (divisionRankings && divisionRankings.rankings) {
          divisionTotalTeams = divisionRankings.rankings.length;
          const teamRank = divisionRankings.rankings.find((r: any) => r.team_key === teamKey);
          if (teamRank) {
            championshipRank = teamRank.rank;
            championshipRecord = `${teamRank.record.wins}-${teamRank.record.losses}-${teamRank.record.ties}`;
          }
        }
        
        // Get awards for this team from pre-fetched data
        const divisionAwards = divAwardsMap[divisionEventKey] || [];
        if (divisionAwards.length > 0) {
          // Filter only this team's awards
          championshipAwards = divisionAwards.filter((award: any) => 
            award.recipient_list.some((recipient: any) => recipient.team_key === teamKey)
          );
        }
      }
      
      // For waitlist, set position to undefined if qualified
      // If we had API access to the real waitlist position, we would fetch it here
      // Currently TBA API doesn't provide waitlist position, so we leave it as undefined for now
      
      return {
        team,
        isQualified,
        waitlistPosition: isQualified ? undefined : undefined, // Real waitlist data would go here if available
        championshipLocation,
        division,
        divisionEventKey,
        championshipEventKey,
        championshipRank,
        championshipRecord,
        championshipAwards,
        divisionTotalTeams,
        rank: rankInfo.rank,
        record: rankInfo.record,
        totalTeams: rankInfo.totalTeams
      };
    });
    
    // Wait for all team promises to resolve
    const teamStatuses = await Promise.all(teamPromises);
    
    log(`Processed ${teamStatuses.length} team statuses for event ${eventKey}`, "blueAlliance");
    return teamStatuses;
  } catch (error) {
    log(`Error determining championship status: ${error}`, "blueAlliance");
    throw error;
  }
}
