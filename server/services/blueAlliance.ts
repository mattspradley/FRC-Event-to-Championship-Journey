import fetch from "node-fetch";
import { storage } from "../storage";
import { log } from "../vite";

// Set cache duration in seconds
const CACHE_DURATION = 300; // 5 minutes

// Helper to get data from API with caching
export async function fetchFromApi(endpoint: string): Promise<any> {
  if (!process.env.TBA_API_KEY) {
    throw new Error("The Blue Alliance API key not found in environment variables");
  }
  
  const cacheKey = `tba:${endpoint}`;
  const apiUrl = `https://www.thebluealliance.com/api/v3${endpoint}`;
  
  // Try to get from cache first
  const cachedData = await storage.getCachedData(cacheKey);
  if (cachedData) {
    log(`CACHE HIT: ${apiUrl}`, "blueAlliance");
    return cachedData;
  }
  
  log(`API CALL: ${apiUrl}`, "blueAlliance");
  
  try {
    const apiKey = process.env.TBA_API_KEY;
    if (!apiKey) {
      throw new Error("The Blue Alliance API key not found in environment variables");
    }
    
    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      headers: {
        "X-TBA-Auth-Key": apiKey
      }
    });
    const endTime = Date.now();
    
    log(`API RESPONSE: ${apiUrl} - ${response.status} in ${endTime - startTime}ms`, "blueAlliance");
    
    if (!response.ok) {
      // If we hit rate limit, throw specific error
      if (response.status === 429) {
        throw new Error(`API RATE LIMIT EXCEEDED: The Blue Alliance API rate limit reached. Please try again later.`);
      }
      throw new Error(`API ERROR: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    await storage.setCachedData(cacheKey, data, CACHE_DURATION);
    
    return data;
  } catch (error: any) {
    log(`API ERROR: ${apiUrl} - ${error}`, "blueAlliance");
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

// Get team statuses for an event
export async function getEventTeamStatuses(eventKey: string) {
  return fetchFromApi(`/event/${eventKey}/teams/statuses`);
}

// Get event rankings
export async function getEventRankings(eventKey: string) {
  return fetchFromApi(`/event/${eventKey}/rankings`);
}

// Get all championship-related events for a year
export async function getChampionshipEvents(year: number) {
  const events = await getEvents(year);
  return events.filter((event: any) => 
    event.event_type === 3 || event.event_type === 4 || event.event_type === 5 // Division (3), Championship (4) & Festival of Champions (5)
  );
}

// Get championship division events (event_type=3) - these are the division events
export async function getChampionshipDivisions(year: number) {
  const events = await getEvents(year);
  return events.filter((event: any) => event.event_type === 3);
}

// Get championship main events (event_type=4) - these are the main championship events
export async function getChampionshipFinals(year: number) {
  const events = await getEvents(year);
  return events.filter((event: any) => event.event_type === 4);
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
export async function getTeamEventStatus(teamKey: string, eventKey: string): Promise<any> {
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
    
    // CRITICAL: Division events are event_type=3, championship events are event_type=4
    // According to TBA documentation: Divisions=3, Championships=4
    // The qualification detection logic is correct with these event types
    const divisionEvents = allEvents.filter((event: any) => event.event_type === 3);
    const championshipEvents = allEvents.filter((event: any) => event.event_type === 4);
    
    // Add detailed logging of the events
    log(`Found ${championshipEvents.length} championship events and ${divisionEvents.length} division events for ${year}`, "blueAlliance");
    
    if (championshipEvents.length > 0) {
      log(`Championship events: ${championshipEvents.map((e: any) => `${e.key} (${e.name})`).join(', ')}`, "blueAlliance");
    }
    
    if (divisionEvents.length > 0) {
      log(`Division events: ${divisionEvents.map((e: any) => `${e.key} (${e.name})`).join(', ')}`, "blueAlliance");
    }
    
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
    
    // Create maps to quickly lookup division and championship statuses
    const divisionStatusesMap: Record<string, Record<string, any>> = {};
    const championshipStatusesMap: Record<string, Record<string, any>> = {};
    
    // Fetch all division and championship team statuses upfront
    for (const divEvent of divisionEvents) {
      try {
        log(`Fetching team statuses for division ${divEvent.key} (${divEvent.name})`, "blueAlliance");
        const divStatuses = await getEventTeamStatuses(divEvent.key);
        divisionStatusesMap[divEvent.key] = divStatuses || {};
        
        // Log how many teams we found in this division
        const teamCount = Object.keys(divStatuses || {}).length;
        log(`Found ${teamCount} teams in division ${divEvent.name} (${divEvent.key})`, "blueAlliance");
        
        // If we have teams in this division, log the first few
        if (teamCount > 0) {
          const teamSample = Object.keys(divStatuses).slice(0, 3);
          log(`Sample teams in ${divEvent.name}: ${teamSample.join(', ')}`, "blueAlliance");
        }
      } catch (error) {
        log(`Error fetching team statuses for division ${divEvent.key}: ${error}`, "blueAlliance");
        divisionStatusesMap[divEvent.key] = {};
      }
    }
    
    for (const champEvent of championshipEvents) {
      try {
        log(`Fetching team statuses for championship ${champEvent.key} (${champEvent.name})`, "blueAlliance");
        const champStatuses = await getEventTeamStatuses(champEvent.key);
        championshipStatusesMap[champEvent.key] = champStatuses || {};
        
        // Log how many teams we found in this championship
        const teamCount = Object.keys(champStatuses || {}).length;
        log(`Found ${teamCount} teams in championship ${champEvent.name} (${champEvent.key})`, "blueAlliance");
        
        // If we have teams in this championship, log the first few
        if (teamCount > 0) {
          const teamSample = Object.keys(champStatuses).slice(0, 3);
          log(`Sample teams in ${champEvent.name} championship: ${teamSample.join(', ')}`, "blueAlliance");
        }
      } catch (error) {
        log(`Error fetching team statuses for championship ${champEvent.key}: ${error}`, "blueAlliance");
        championshipStatusesMap[champEvent.key] = {};
      }
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
      let championshipAwards: any[] = [];
      
      // Final championship event data
      let finalEventKey = '';
      let finalRank = null;
      let finalRecord = null;
      
      // Check if team is in any championship
      for (const champEvent of championshipEvents) {
        championshipEventKey = champEvent.key;
        const teamChampStatusMap = championshipStatusesMap[championshipEventKey] || {};
        
        // Check if this team has a status for this championship
        if (teamChampStatusMap[teamKey]) {
          log(`Found team ${teamKey} status for championship ${championshipEventKey}`, "blueAlliance");
          
          // If the team has a status, they're qualified
          isQualified = true;
          championshipLocation = champEvent.city || champEvent.name;
          
          // Get championship status details
          const teamStatus = teamChampStatusMap[teamKey];
          
          // If team has alliance data, they're in the finals
          if (teamStatus.alliance) {
            finalEventKey = championshipEventKey;
            
            if (teamStatus.playoff && teamStatus.playoff.status) {
              finalRank = teamStatus.playoff.status;
            }
            
            if (teamStatus.playoff && teamStatus.playoff.record) {
              const record = teamStatus.playoff.record;
              finalRecord = `${record.wins}-${record.losses}-${record.ties}`;
            }
          }
          
          // Check team's division
          if (teamStatus.alliance_status_str) {
            log(`Team ${teamKey} alliance status: ${teamStatus.alliance_status_str}`, "blueAlliance");
          }
          
          // Find which division this team is in
          for (const divEvent of divisionEvents) {
            // Only check divisions for this championship
            const divYearPrefix = divEvent.key.substring(0, 4);
            const champYearPrefix = champEvent.key.substring(0, 4);
            
            if (divYearPrefix === champYearPrefix) {
              const divStatuses = divisionStatusesMap[divEvent.key] || {};
              
              // Check if team is in this division
              if (divStatuses[teamKey]) {
                divisionEventKey = divEvent.key;
                division = getDivisionName(divEvent.key, divEvent.name);
                
                log(`Team ${teamKey} is in division ${division} (${divisionEventKey})`, "blueAlliance");
                
                // Get ranking info from the division
                const divStatus = divStatuses[teamKey];
                if (divStatus.qual && divStatus.qual.ranking) {
                  const ranking = divStatus.qual.ranking;
                  championshipRank = ranking.rank;
                  
                  if (ranking.record) {
                    championshipRecord = `${ranking.record.wins}-${ranking.record.losses}-${ranking.record.ties}`;
                  }
                  
                  if (divStatus.qual.num_teams) {
                    divisionTotalTeams = divStatus.qual.num_teams;
                  }
                  
                  log(`Team ${teamKey} is ranked ${championshipRank} with record ${championshipRecord} in division ${division}`, "blueAlliance");
                }
                
                // We found the division for this team, no need to check others
                break;
              }
            }
          }
          
          // We found championship info for this team, no need to check others
          break;
        }
      }
      
      // Check if we have a qualified team without division info
      if (isQualified && !division) {
        log(`No division information found for qualified team ${teamKey}. This may result in incomplete data being displayed.`, "blueAlliance");
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
        championshipAwards: championshipAwards,
        divisionTotalTeams,
        // Add final event data
        finalEventKey,
        finalRank,
        finalRecord,
        // Current event data
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
