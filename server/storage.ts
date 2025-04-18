import { 
  users, type User, type InsertUser, 
  events, type Event, type InsertEvent,
  teams, type Team, type InsertTeam,
  eventTeams, type EventTeam, type InsertEventTeam,
  apiCache, type ApiCache, type InsertApiCache,
  type EventTeamInfo, QualificationStatus
} from "@shared/schema";

export interface IStorage {
  // User methods (kept from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Event methods
  getEvents(year?: number): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  upsertEvent(event: InsertEvent): Promise<Event>;

  // Team methods
  getTeamById(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  upsertTeam(team: InsertTeam): Promise<Team>;

  // Event Team methods
  getTeamsByEventId(eventId: string): Promise<EventTeamInfo[]>;
  getEventTeamInfo(eventId: string, teamId: string): Promise<EventTeamInfo | undefined>;
  createEventTeam(eventTeam: InsertEventTeam): Promise<EventTeam>;
  upsertEventTeam(eventTeam: InsertEventTeam): Promise<EventTeam>;

  // API Cache methods
  getCachedData(key: string): Promise<any | undefined>;
  setCachedData(key: string, data: any, expiresInSeconds: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<string, Event>;
  private teams: Map<string, Team>;
  private eventTeams: Map<string, EventTeam>;
  private cache: Map<string, { data: any; expires: Date }>;
  
  private userCurrentId: number;
  private eventTeamCurrentId: number;
  private apiCacheCurrentId: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.teams = new Map();
    this.eventTeams = new Map();
    this.cache = new Map();
    
    this.userCurrentId = 1;
    this.eventTeamCurrentId = 1;
    this.apiCacheCurrentId = 1;
  }

  // User methods (kept from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Event methods
  async getEvents(year?: number): Promise<Event[]> {
    const events = Array.from(this.events.values());
    return year ? events.filter(event => event.year === year) : events;
  }

  async getEventById(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    this.events.set(event.id, event as Event);
    return event as Event;
  }

  async upsertEvent(event: InsertEvent): Promise<Event> {
    return this.createEvent(event);
  }

  // Team methods
  async getTeamById(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    this.teams.set(team.id, team as Team);
    return team as Team;
  }

  async upsertTeam(team: InsertTeam): Promise<Team> {
    return this.createTeam(team);
  }

  // Event Team methods
  async getTeamsByEventId(eventId: string): Promise<EventTeamInfo[]> {
    const eventTeamsArray = Array.from(this.eventTeams.values())
      .filter(et => et.eventId === eventId);
    
    const result: EventTeamInfo[] = [];
    
    for (const eventTeam of eventTeamsArray) {
      const team = await this.getTeamById(eventTeam.teamId);
      
      if (team) {
        let qualificationStatus = QualificationStatus.UNKNOWN;
        
        if (eventTeam.isChampionshipQualified) {
          qualificationStatus = QualificationStatus.QUALIFIED;
        } else if (eventTeam.waitlistPosition) {
          qualificationStatus = QualificationStatus.WAITLIST;
        } else if (eventTeam.waitlistPosition === 0) {
          qualificationStatus = QualificationStatus.NOT_QUALIFIED;
        }
        
        result.push({
          id: team.id,
          teamNumber: team.teamNumber,
          name: team.name,
          nickname: team.nickname,
          city: team.city,
          stateProv: team.stateProv,
          country: team.country,
          qualificationStatus,
          waitlistPosition: eventTeam.waitlistPosition,
          championship: eventTeam.championshipLocation,
          division: eventTeam.division,
          rank: eventTeam.qualificationRank,
          record: eventTeam.record,
          totalTeams: eventTeamsArray.length
        });
      }
    }
    
    return result;
  }

  async getEventTeamInfo(eventId: string, teamId: string): Promise<EventTeamInfo | undefined> {
    const allTeams = await this.getTeamsByEventId(eventId);
    return allTeams.find(team => team.id === teamId);
  }

  async createEventTeam(eventTeam: InsertEventTeam): Promise<EventTeam> {
    const id = this.eventTeamCurrentId++;
    const finalEventTeam = { ...eventTeam, id };
    this.eventTeams.set(`${id}`, finalEventTeam as EventTeam);
    return finalEventTeam as EventTeam;
  }

  async upsertEventTeam(eventTeam: InsertEventTeam): Promise<EventTeam> {
    // Find existing eventTeam with the same eventId and teamId
    const existingEventTeam = Array.from(this.eventTeams.values())
      .find(et => et.eventId === eventTeam.eventId && et.teamId === eventTeam.teamId);
    
    if (existingEventTeam) {
      const updatedEventTeam = { ...existingEventTeam, ...eventTeam };
      this.eventTeams.set(`${existingEventTeam.id}`, updatedEventTeam);
      return updatedEventTeam;
    }
    
    return this.createEventTeam(eventTeam);
  }

  // API Cache methods
  async getCachedData(key: string): Promise<any | undefined> {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return undefined;
    }
    
    if (cached.expires < new Date()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return cached.data;
  }

  async setCachedData(key: string, data: any, expiresInSeconds: number): Promise<void> {
    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + expiresInSeconds);
    
    this.cache.set(key, {
      data,
      expires
    });
  }
}

export const storage = new MemStorage();
