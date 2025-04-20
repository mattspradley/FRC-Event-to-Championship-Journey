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
        // First create a map of playoff records if available
        const playoffRecords: Record<string, { wins: number, losses: number, ties: number }> = {};
        
        try {
          // Try to fetch team statuses for this event to get playoff records
          const eventTeamStatuses = await getEventTeamStatuses(eventKey);
          
          if (eventTeamStatuses) {
            // Extract playoff records for each team
            Object.entries(eventTeamStatuses).forEach(([teamKey, status]: [string, any]) => {
              if (status && status.playoff && status.playoff.record) {
                playoffRecords[teamKey] = {
                  wins: status.playoff.record.wins,
                  losses: status.playoff.record.losses,
                  ties: status.playoff.record.ties
                };
              }
            });
          }
        } catch (error) {
          log(`Error fetching playoff records for event ${eventKey}: ${error}`, "blueAlliance");
        }
        
        // Now combine qualification and playoff records for each team
        rankData.rankings.forEach((rank: any) => {
          // Start with qualification record
          let wins = rank.record.wins;
          let losses = rank.record.losses;
          let ties = rank.record.ties;
          
          // Add playoff record if available
          if (playoffRecords[rank.team_key]) {
            wins += playoffRecords[rank.team_key].wins;
            losses += playoffRecords[rank.team_key].losses;
            ties += playoffRecords[rank.team_key].ties;
          }
          
          // Store the combined record
          rankings[rank.team_key] = {
            rank: rank.rank,
            record: `${wins}-${losses}-${ties}`,
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
      
      // First check if the team is in any division - being in a division means they qualified
      let foundInDivision = false;
      
      // Scan all divisions first
      for (const divEvent of divisionEvents) {
        const divStatuses = divisionStatusesMap[divEvent.key] || {};
        
        // Check if team is in this division
        if (divStatuses[teamKey]) {
          // If team is in any division, they are qualified
          isQualified = true;
          divisionEventKey = divEvent.key;
          division = getDivisionName(divEvent.key, divEvent.name);
          
          log(`Team ${teamKey} is in division ${division} (${divisionEventKey})`, "blueAlliance");
          
          // Find the corresponding championship event for this division
          for (const champEvent of championshipEvents) {
            const champYearPrefix = champEvent.key.substring(0, 4);
            const divYearPrefix = divEvent.key.substring(0, 4);
            
            if (champYearPrefix === divYearPrefix) {
              championshipEventKey = champEvent.key;
              championshipLocation = champEvent.city || champEvent.name;
              break;
            }
          }
          
          // Get ranking info from the division
          const divStatus = divStatuses[teamKey];
          if (divStatus.qual && divStatus.qual.ranking) {
            const ranking = divStatus.qual.ranking;
            championshipRank = ranking.rank;
            
            // Initialize the combined record
            let wins = 0, losses = 0, ties = 0;
            
            // Add qualification record if available
            if (ranking.record) {
              wins += ranking.record.wins;
              losses += ranking.record.losses;
              ties += ranking.record.ties;
            }
            
            // Add playoff record if available
            if (divStatus.playoff && divStatus.playoff.record) {
              wins += divStatus.playoff.record.wins;
              losses += divStatus.playoff.record.losses;
              ties += divStatus.playoff.record.ties;
            }
            
            // Create combined record string
            championshipRecord = `${wins}-${losses}-${ties}`;
            
            if (divStatus.qual.num_teams) {
              divisionTotalTeams = divStatus.qual.num_teams;
            }
            
            log(`Team ${teamKey} is ranked ${championshipRank} with record ${championshipRecord} in division ${division}`, "blueAlliance");
          }
          
          // We found the division for this team, no need to check others
          break;
        }
      }
      
      // Now check if the team is in any championship finals
      for (const champEvent of championshipEvents) {
        const champKey = champEvent.key;
        const teamChampStatusMap = championshipStatusesMap[champKey] || {};
        
        // Check if this team has a status for this championship
        if (teamChampStatusMap[teamKey]) {
          log(`Found team ${teamKey} status for championship ${champKey}`, "blueAlliance");
          
          // Set the championship info if it's not already set from a division
          if (!championshipEventKey) {
            championshipEventKey = champKey;
            championshipLocation = champEvent.city || champEvent.name;
          }
          
          // If we haven't already marked this team as qualified (from a division check)
          if (!isQualified) {
            isQualified = true;
          }
          
          // Get championship status details
          const teamStatus = teamChampStatusMap[teamKey];
          
          // If team has alliance data, they're in the finals
          if (teamStatus.alliance) {
            finalEventKey = champKey;
            
            if (teamStatus.playoff && teamStatus.playoff.status) {
              finalRank = teamStatus.playoff.status;
            }
            
            // Initialize record totals
            let wins = 0, losses = 0, ties = 0;
            
            // Add qualification record if available
            if (teamStatus.qual && teamStatus.qual.ranking && teamStatus.qual.ranking.record) {
              wins += teamStatus.qual.ranking.record.wins;
              losses += teamStatus.qual.ranking.record.losses;
              ties += teamStatus.qual.ranking.record.ties;
            }
            
            // Add playoff record if available
            if (teamStatus.playoff && teamStatus.playoff.record) {
              wins += teamStatus.playoff.record.wins;
              losses += teamStatus.playoff.record.losses;
              ties += teamStatus.playoff.record.ties;
            }
            
            // Create combined record string
            finalRecord = `${wins}-${losses}-${ties}`;
          }
          
          // If the team has an alliance status in the championship, log it
          if (teamStatus.alliance_status_str) {
            log(`Team ${teamKey} alliance status: ${teamStatus.alliance_status_str}`, "blueAlliance");
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
      
      // Capture the status strings
      let overall_status_str = null;
      let alliance_status_str = null;
      
      // Check for division event status strings
      if (isQualified && division) {
        const divEventKey = divisionEventKey;
        const divStatusMap = divisionStatusesMap[divEventKey] || {};
        const divTeamStatus = divStatusMap[teamKey];
        
        if (divTeamStatus) {
          if (divTeamStatus.overall_status_str) {
            overall_status_str = divTeamStatus.overall_status_str;
            log(`Team ${teamKey} overall status: ${overall_status_str}`, "blueAlliance");
          }
          
          if (divTeamStatus.alliance_status_str) {
            alliance_status_str = divTeamStatus.alliance_status_str;
            log(`Team ${teamKey} alliance status (div): ${alliance_status_str}`, "blueAlliance");
          }
        }
      }
      
      // Check for finals event status strings (these should take precedence)
      if (finalEventKey) {
        const finalsStatusMap = championshipStatusesMap[finalEventKey] || {};
        const finalsTeamStatus = finalsStatusMap[teamKey];
        
        if (finalsTeamStatus) {
          if (finalsTeamStatus.overall_status_str) {
            overall_status_str = finalsTeamStatus.overall_status_str;
            log(`Team ${teamKey} finals overall status: ${overall_status_str}`, "blueAlliance");
          }
          
          if (finalsTeamStatus.alliance_status_str) {
            alliance_status_str = finalsTeamStatus.alliance_status_str;
            log(`Team ${teamKey} finals alliance status: ${alliance_status_str}`, "blueAlliance");
          }
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
        totalTeams: rankInfo.totalTeams,
        // Status strings
        overall_status_str,
        alliance_status_str
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
