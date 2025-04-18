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

// Helper function to get the proper division name from an event
function getDivisionName(eventKey: string, eventName: string): string {
  // First, try to extract the division code from the event key
  // Event keys typically follow the format YYYY + division code
  // e.g., "2025arc" for Archimedes division
  const divisionCode = eventKey.substring(4);
  
  // Common division name mappings
  const divisionNames: Record<string, string> = {
    'arc': 'Archimedes',
    'car': 'Carson',
    'cur': 'Curie',
    'dal': 'Daly',
    'gal': 'Galileo',
    'hop': 'Hopper',
    'joh': 'Johnson',
    'mil': 'Milstein',
    'new': 'Newton',
    'tur': 'Turing'
  };
  
  // If we have a known name for this code, use it
  if (divisionNames[divisionCode]) {
    return divisionNames[divisionCode];
  }
  
  // Fall back to the event name provided by the API if no mapping exists
  return eventName;
}

// Fetch team status for a specific event (division or championship)
async function getTeamEventStatus(teamKey: string, eventKey: string): Promise<any> {
  try {
    return await fetchFromApi(`/team/${teamKey}/event/${eventKey}/status`);
  } catch (error) {
    log(`Error fetching status for team ${teamKey} at event ${eventKey}: ${error}`, "blueAlliance");
    return null;
  }
}

// Determine championship qualification status for teams at an event
export async function getTeamChampionshipStatus(eventKey: string, year: number) {
  try {
    log(`Getting championship status for teams at event ${eventKey}`, "blueAlliance");
    
    // Get all the year's events to identify championships and divisions
    const allEvents = await fetchFromApi(`/events/${year}`);
    
    // Filter for Championship events (main) and division events
    const championshipEvents = allEvents.filter((event: any) => event.event_type === 3);
    const divisionEvents = allEvents.filter((event: any) => event.event_type === 4);
    
    log(`Found ${championshipEvents.length} championship events and ${divisionEvents.length} division events for ${year}`, "blueAlliance");
    
    // Get the teams at our current event
    const teams = await getEventTeams(eventKey);
    log(`Processing ${teams.length} teams from event ${eventKey}`, "blueAlliance");
    
    // Get rankings data for the current event
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
    }
    
    // Process each team
    const teamPromises = teams.map(async (team: any) => {
      const teamKey = team.key;
      log(`Processing team ${teamKey}`, "blueAlliance");
      
      // Default values if not qualified
      let isQualified = false;
      let waitlistPosition = 0; // Default to not qualified
      let championshipLocation = '';
      let division = '';
      let divisionEventKey = '';
      let championshipEventKey = '';
      let championshipRank = null;
      let championshipRecord = null;
      let divisionTotalTeams = 0;
      let championshipAwards = [];
      
      // For each championship, check if the team is participating
      for (const champEvent of championshipEvents) {
        championshipEventKey = champEvent.key; 
        
        // Use the direct team status API endpoint for this championship
        const teamChampStatus = await getTeamEventStatus(teamKey, championshipEventKey);
        
        if (teamChampStatus) {
          log(`Found team ${teamKey} status for championship ${championshipEventKey}`, "blueAlliance");
          
          // If the team has a status, they're qualified
          isQualified = true;
          championshipLocation = champEvent.city || champEvent.name;
          
          // Process status information
          if (teamChampStatus.alliance) {
            log(`Team ${teamKey} is in an alliance at ${championshipEventKey}`, "blueAlliance");
          }
          
          // Check which division this team is in
          for (const divEvent of divisionEvents) {
            // Only check divisions for this championship (they share year prefix)
            const divYearPrefix = divEvent.key.substring(0, 4);
            const champYearPrefix = champEvent.key.substring(0, 4);
            
            if (divYearPrefix === champYearPrefix) {
              // Check this division for the team
              const teamDivStatus = await getTeamEventStatus(teamKey, divEvent.key);
              
              if (teamDivStatus) {
                divisionEventKey = divEvent.key;
                division = getDivisionName(divEvent.key, divEvent.name);
                
                log(`Team ${teamKey} is in division ${division} (${divisionEventKey})`, "blueAlliance");
                
                // Get ranking info from the division
                if (teamDivStatus.qual && teamDivStatus.qual.ranking) {
                  const ranking = teamDivStatus.qual.ranking;
                  championshipRank = ranking.rank;
                  
                  if (ranking.record) {
                    championshipRecord = `${ranking.record.wins}-${ranking.record.losses}-${ranking.record.ties}`;
                  }
                  
                  if (ranking.num_teams) {
                    divisionTotalTeams = ranking.num_teams;
                  }
                  
                  log(`Team ${teamKey} is ranked ${championshipRank} with record ${championshipRecord} in division ${division}`, "blueAlliance");
                }
                
                // We found the right division, no need to check others
                break;
              }
            }
          }
          
          // We found a championship this team is in, no need to check others
          break;
        } else {
          // If status check failed, let's fallback to checking team lists
          // This is less accurate but provides a backup method
          try {
            // Check if the team is in this championship's team list
            const champTeams = await getEventTeams(championshipEventKey);
            if (champTeams.find((t: any) => t.key === teamKey)) {
              isQualified = true;
              championshipLocation = champEvent.city || champEvent.name;
              log(`Team ${teamKey} found in team list for ${championshipEventKey}`, "blueAlliance");
              
              // Check divisions for this championship
              for (const divEvent of divisionEvents) {
                // Only check divisions for this championship (they share year prefix)
                const divYearPrefix = divEvent.key.substring(0, 4);
                const champYearPrefix = champEvent.key.substring(0, 4);
                
                if (divYearPrefix === champYearPrefix) {
                  try {
                    const divTeams = await getEventTeams(divEvent.key);
                    if (divTeams.find((t: any) => t.key === teamKey)) {
                      divisionEventKey = divEvent.key;
                      division = getDivisionName(divEvent.key, divEvent.name);
                      log(`Team ${teamKey} found in team list for division ${division} (${divisionEventKey})`, "blueAlliance");
                      
                      // Get rankings for this division if available
                      try {
                        const divRankings = await getEventRankings(divEvent.key);
                        if (divRankings && divRankings.rankings) {
                          divisionTotalTeams = divRankings.rankings.length;
                          const teamRank = divRankings.rankings.find((r: any) => r.team_key === teamKey);
                          if (teamRank) {
                            championshipRank = teamRank.rank;
                            championshipRecord = `${teamRank.record.wins}-${teamRank.record.losses}-${teamRank.record.ties}`;
                          }
                        }
                      } catch (error) {
                        log(`Error fetching rankings for division ${divEvent.key}: ${error}`, "blueAlliance");
                      }
                      
                      break;
                    }
                  } catch (error) {
                    log(`Error checking division ${divEvent.key} for team ${teamKey}: ${error}`, "blueAlliance");
                  }
                }
              }
              
              // We found the championship, no need to check others
              break;
            }
          } catch (error) {
            log(`Error checking championship ${championshipEventKey} for team ${teamKey}: ${error}`, "blueAlliance");
          }
        }
      }
      
      // Get current event ranking info
      const rankInfo = rankings[teamKey] || {};
      
      // Determine waitlist status
      if (!isQualified) {
        // For non-qualified teams, estimate waitlist status
        // Teams with high rankings or rookie teams more likely to be waitlisted
        if (team.rookie_year && new Date().getFullYear() - team.rookie_year < 3) {
          waitlistPosition = 1; // Rookie teams
        } else if (rankInfo.rank && rankInfo.rank <= 8) {
          waitlistPosition = 1; // Top performing teams
        }
      }
      
      // Return the complete status object
      return {
        team,
        isQualified,
        waitlistPosition,
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
    
    // Wait for all team statuses to be processed
    const teamStatuses = await Promise.all(teamPromises);
    
    log(`Processed ${teamStatuses.length} team statuses for event ${eventKey}`, "blueAlliance");
    return teamStatuses;
  } catch (error) {
    log(`Error determining championship status: ${error}`, "blueAlliance");
    throw error;
  }
}
