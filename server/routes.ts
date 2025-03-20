import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertVoterSchema, insertVoteSchema } from "@shared/schema";
import { verifyAadhaarMock } from "./aadhaar";
import { storeVoteOnChain, verifyVote } from "./blockchain";
import {insertElectionSchema} from "@shared/schema" // Assuming this schema is defined elsewhere

export async function registerRoutes(app: Express): Promise<Server> {
  // Get active election
  app.get("/api/elections/active", async (_req, res) => {
    try {
      const election = await storage.getActiveElection();
      if (!election) {
        return res.status(404).json({ message: "No active election found" });
      }
      res.json(election);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active election" });
    }
  });

  // Get election results for active election
  app.get("/api/elections/active/results", async (_req, res) => {
    try {
      const activeElection = await storage.getActiveElection();
      if (!activeElection) {
        return res.status(404).json({ message: "No active election found" });
      }

      const results = await storage.getElectionResults(activeElection.electionId);
      res.json({ 
        results: results.map(result => ({
          candidateId: result.candidateId,
          candidateName: `Candidate ${result.candidateId}`,
          voteCount: result.votes
        }))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  // Aadhaar verification endpoints
  app.post("/api/aadhaar/generate-otp", async (req, res) => {
    const schema = z.object({
      aadhaarNumber: z.string().length(12)
    });

    try {
      const { aadhaarNumber } = schema.parse(req.body);
      // In production, this would call actual Aadhaar API
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Invalid Aadhaar number" });
    }
  });

  app.post("/api/aadhaar/verify", async (req, res) => {
    const schema = z.object({
      aadhaarNumber: z.string().length(12),
      otp: z.string().length(6)
    });

    try {
      const data = schema.parse(req.body);
      const verified = await verifyAadhaarMock(data.aadhaarNumber, data.otp);
      res.json({ success: true, verified });
    } catch (error) {
      res.status(400).json({ message: "Invalid verification data" });
    }
  });

  // Voter registration
  app.post("/api/voters/register", async (req, res) => {
    try {
      const voter = insertVoterSchema.parse(req.body);
      const registered = await storage.createVoter(voter);
      res.json(registered);
    } catch (error) {
      res.status(400).json({ message: "Invalid voter data" });
    }
  });

  // Vote casting
  app.post("/api/votes/cast", async (req, res) => {
    try {
      const vote = insertVoteSchema.parse(req.body);

      // Store vote in blockchain
      const txHash = await storeVoteOnChain(vote);

      // Verify the transaction
      const verified = await verifyVote(txHash);

      if (!verified) {
        throw new Error("Vote verification failed");
      }

      // Store vote metadata
      const stored = await storage.createVote(vote);

      res.json({ 
        success: true, 
        vote: stored,
        transactionHash: txHash 
      });
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to cast vote",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get election results (original endpoint remains)
  app.get("/api/elections/:id/results", async (req, res) => {
    try {
      const results = await storage.getElectionResults(req.params.id);
      res.json(results);
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch results" });
    }
  });

  // Add this to the existing routes
  app.post("/api/elections/create", async (req, res) => {
    try {
      const election = insertElectionSchema.parse(req.body);
      const created = await storage.createElection(election);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid election data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}