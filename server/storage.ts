import { voters, type Voter, type InsertVoter, elections, type Election, type InsertElection, votes, type Vote, type InsertVote } from "@shared/schema";

export interface IStorage {
  // Voter operations
  getVoter(id: number): Promise<Voter | undefined>;
  getVoterByAadhaar(aadhaarId: string): Promise<Voter | undefined>;
  createVoter(voter: InsertVoter): Promise<Voter>;

  // Election operations
  getActiveElection(): Promise<Election | undefined>;
  createElection(election: InsertElection): Promise<Election>;

  // Vote operations
  createVote(vote: InsertVote): Promise<Vote>;
  getElectionResults(electionId: string): Promise<{ candidateId: string, votes: number }[]>;
}

export class MemStorage implements IStorage {
  private voters: Map<number, Voter>;
  private elections: Map<number, Election>;
  private votes: Map<number, Vote>;
  private currentId: { voter: number; election: number; vote: number };

  constructor() {
    this.voters = new Map();
    this.elections = new Map();
    this.votes = new Map();
    this.currentId = { voter: 1, election: 1, vote: 1 };
  }

  async getVoter(id: number): Promise<Voter | undefined> {
    return this.voters.get(id);
  }

  async getVoterByAadhaar(aadhaarId: string): Promise<Voter | undefined> {
    return Array.from(this.voters.values()).find(
      (voter) => voter.aadhaarId === aadhaarId
    );
  }

  async createVoter(insertVoter: InsertVoter): Promise<Voter> {
    const id = this.currentId.voter++;
    const voter: Voter = { 
      ...insertVoter, 
      id,
      createdAt: new Date()
    };
    this.voters.set(id, voter);
    return voter;
  }

  async getActiveElection(): Promise<Election | undefined> {
    return Array.from(this.elections.values()).find(
      (election) => election.isActive
    );
  }

  async createElection(insertElection: InsertElection): Promise<Election> {
    const id = this.currentId.election++;
    const election: Election = {
      ...insertElection,
      id,
      startTime: new Date(insertElection.startTime),
      endTime: new Date(insertElection.endTime),
      isActive: true
    };
    this.elections.set(id, election);
    return election;
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const id = this.currentId.vote++;
    const vote: Vote = { 
      ...insertVote, 
      id,
      timestamp: new Date()
    };
    this.votes.set(id, vote);
    return vote;
  }

  async getElectionResults(electionId: string): Promise<{ candidateId: string, votes: number }[]> {
    const voteCounts = new Map<string, number>();

    // Count votes for each candidate
    Array.from(this.votes.values())
      .filter(vote => vote.electionId === electionId)
      .forEach(vote => {
        const candidateId = vote.voteHash.split('-')[0]; // Extract candidate ID from vote hash
        voteCounts.set(candidateId, (voteCounts.get(candidateId) || 0) + 1);
      });

    return Array.from(voteCounts.entries()).map(([candidateId, votes]) => ({
      candidateId,
      votes
    }));
  }
}

export const storage = new MemStorage();