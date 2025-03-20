import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const voters = pgTable("voters", {
  id: serial("id").primaryKey(),
  aadhaarId: text("aadhaar_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  registrationCert: text("registration_cert").notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  electionId: text("election_id").notNull().unique(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  candidates: text("candidate_name").array().notNull(),
  isActive: boolean("is_active").default(true)
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  electionId: text("election_id").notNull(),
  voteHash: text("vote_hash").notNull(),
  lsagSignature: text("lsag_signature").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertVoterSchema = createInsertSchema(voters).omit({
  id: true,
  createdAt: true
});

export const insertElectionSchema = createInsertSchema(elections).omit({
  id: true
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  timestamp: true
});

export type InsertVoter = z.infer<typeof insertVoterSchema>;
export type InsertElection = z.infer<typeof insertElectionSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Voter = typeof voters.$inferSelect;
export type Election = typeof elections.$inferSelect;
export type Vote = typeof votes.$inferSelect;