import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  getEvents, 
  getEvent, 
  getEventTeams, 
  getTeamChampionshipStatus 
} from "./services/blueAlliance";
import { z } from "zod";
import { log } from "./vite";

// Define new endpoint for this route
const API_PREFIX = "/api";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Add API key to request
  apiRouter.use((req, res, next) => {
    // Check for API key in environment variables
    if (!process.env.TBA_API_KEY) {
      log("WARNING: TBA_API_KEY environment variable not set", "api");
    }
    next();
  });
  
  // Get all events for a specific year
  apiRouter.get("/events", async (req: Request, res: Response) => {
    try {
      const yearSchema = z.object({
        year: z.string().regex(/^\d{4}$/).transform(Number).optional()
      });
      
      const { year } = yearSchema.parse(req.query);
      const currentYear = new Date().getFullYear();
      const yearToUse = year || currentYear;
      
      const events = await getEvents(yearToUse);
      
      // Sort events by date and name
      const sortedEvents = events
        .filter((event: any) => event.name && event.start_date) // Filter out events with missing data
        .sort((a: any, b: any) => {
          // Sort by start date, then name
          const dateA = new Date(a.start_date);
          const dateB = new Date(b.start_date);
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }
          
          return a.name.localeCompare(b.name);
        });
      
      res.json(sortedEvents);
    } catch (error) {
      log(`Error in /events: ${error}`, "api");
      res.status(500).json({ 
        error: "Failed to fetch events",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get detailed information about a specific event
  apiRouter.get("/events/:eventKey", async (req: Request, res: Response) => {
    try {
      const eventKey = req.params.eventKey;
      const event = await getEvent(eventKey);
      res.json(event);
    } catch (error) {
      log(`Error in /events/${req.params.eventKey}: ${error}`, "api");
      res.status(500).json({ 
        error: "Failed to fetch event details",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get teams at a specific event with their championship qualification status
  apiRouter.get("/events/:eventKey/teams", async (req: Request, res: Response) => {
    try {
      const eventKey = req.params.eventKey;
      
      // Get the event first to determine the year
      const event = await getEvent(eventKey);
      
      // Get teams with championship status
      const teamsWithStatus = await getTeamChampionshipStatus(eventKey, event.year);
      
      res.json(teamsWithStatus);
    } catch (error) {
      log(`Error in /events/${req.params.eventKey}/teams: ${error}`, "api");
      res.status(500).json({ 
        error: "Failed to fetch teams with championship status",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Search/filter events
  apiRouter.get("/search/events", async (req: Request, res: Response) => {
    try {
      const querySchema = z.object({
        year: z.string().regex(/^\d{4}$/).transform(Number).optional(),
        query: z.string().optional(),
        eventType: z.string().optional()
      });
      
      const { year, query, eventType } = querySchema.parse(req.query);
      const currentYear = new Date().getFullYear();
      const yearToUse = year || currentYear;
      
      const events = await getEvents(yearToUse);
      
      let filteredEvents = events;
      
      // Filter by query (search term)
      if (query) {
        const normalizedQuery = query.toLowerCase();
        filteredEvents = filteredEvents.filter((event: any) => {
          return (
            (event.name && event.name.toLowerCase().includes(normalizedQuery)) ||
            (event.short_name && event.short_name.toLowerCase().includes(normalizedQuery)) ||
            (event.city && event.city.toLowerCase().includes(normalizedQuery)) ||
            (event.state_prov && event.state_prov.toLowerCase().includes(normalizedQuery))
          );
        });
      }
      
      // Filter by event type
      if (eventType && eventType !== 'all') {
        let eventTypeNumber: number | undefined;
        
        // Map from string types to numerical event_type values
        switch (eventType) {
          case 'regional':
            eventTypeNumber = 0; // Regional events
            break;
          case 'district':
            eventTypeNumber = 1; // District events
            break;
          case 'championship':
            eventTypeNumber = 3; // Championship events
            break;
        }
        
        if (eventTypeNumber !== undefined) {
          filteredEvents = filteredEvents.filter((event: any) => 
            event.event_type === eventTypeNumber
          );
        }
      }
      
      // Sort by date
      filteredEvents.sort((a: any, b: any) => {
        const dateA = new Date(a.start_date || '2099-01-01');
        const dateB = new Date(b.start_date || '2099-01-01');
        return dateA.getTime() - dateB.getTime();
      });
      
      res.json(filteredEvents);
    } catch (error) {
      log(`Error in /search/events: ${error}`, "api");
      res.status(500).json({ 
        error: "Failed to search events",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get years (current year and 4 previous years)
  apiRouter.get("/years", async (req: Request, res: Response) => {
    try {
      const currentYear = new Date().getFullYear();
      const years = [];
      
      // Add current year and 4 previous years
      for (let i = 0; i <= 4; i++) {
        years.push(currentYear - i);
      }
      
      res.json(years);
    } catch (error) {
      log(`Error in /years: ${error}`, "api");
      res.status(500).json({ 
        error: "Failed to generate years list",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Register the router with the API prefix
  app.use(API_PREFIX, apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
