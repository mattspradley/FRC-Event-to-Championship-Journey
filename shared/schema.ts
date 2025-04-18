import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schemas for users (kept from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Schema for FRC Events
export const events = pgTable("events", {
  id: text("id").primaryKey(), // event key from The Blue Alliance
  name: text("name").notNull(),
  year: integer("year").notNull(),
  week: integer("week"),
  eventType: integer("event_type"),
  eventTypeString: text("event_type_string"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  city: text("city"),
  stateProv: text("state_prov"),
  country: text("country"),
  shortName: text("short_name"),
  data: json("data").notNull(),
});

export const insertEventSchema = createInsertSchema(events);

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Schema for FRC Teams
export const teams = pgTable("teams", {
  id: text("id").primaryKey(), // team key from The Blue Alliance (e.g., "frc2451")
  teamNumber: integer("team_number").notNull(),
  name: text("name").notNull(),
  nickname: text("nickname"),
  city: text("city"),
  stateProv: text("state_prov"),
  country: text("country"),
  rookieYear: integer("rookie_year"),
  data: json("data").notNull(),
});

export const insertTeamSchema = createInsertSchema(teams);

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Schema for Event Teams (teams attending an event)
export const eventTeams = pgTable("event_teams", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  teamId: text("team_id").notNull().references(() => teams.id),
  isChampionshipQualified: boolean("is_championship_qualified").default(false),
  championshipLocation: text("championship_location"),
  qualificationRank: integer("qualification_rank"),
  waitlistPosition: integer("waitlist_position"),
  division: text("division"),
  record: text("record"), // win-loss-tie record
  data: json("data").notNull(),
});

export const insertEventTeamSchema = createInsertSchema(eventTeams);

export type InsertEventTeam = z.infer<typeof insertEventTeamSchema>;
export type EventTeam = typeof eventTeams.$inferSelect;

// Schema for API Cache
export const apiCache = pgTable("api_cache", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  data: json("data").notNull(),
  expires: timestamp("expires").notNull(),
});

export const insertApiCacheSchema = createInsertSchema(apiCache);

export type InsertApiCache = z.infer<typeof insertApiCacheSchema>;
export type ApiCache = typeof apiCache.$inferSelect;

// Define enumeration for team qualification status
export enum QualificationStatus {
  QUALIFIED = "QUALIFIED",
  WAITLIST = "WAITLIST",
  NOT_QUALIFIED = "NOT_QUALIFIED",
  UNKNOWN = "UNKNOWN"
}

// Type for filtered and processed event team data
export type EventTeamInfo = {
  id: string;
  teamNumber: number;
  name: string;
  nickname?: string;
  city?: string;
  stateProv?: string;
  country?: string;
  qualificationStatus: QualificationStatus;
  waitlistPosition?: number;
  championship?: string;
  division?: string;
  rank?: number;
  record?: string;
  totalTeams?: number;
};
