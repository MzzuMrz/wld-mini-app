"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Poll, Vote, VerificationLevel, PollVisibility } from '@/types';
import * as FirebaseService from '@/utils/firebase';

interface RealtimeContextType {
  // Data stores
  polls: Poll[];
  votes: Vote[];
  isLoading: boolean;
  
  // Poll operations
  createPoll: (pollData: Omit<Poll, 'id' | 'creatorId' | 'createdAt'>, creatorId: string) => Promise<Poll>;
  getPollById: (id: string) => Promise<Poll | null>;
  getFilteredPolls: (verificationLevel?: VerificationLevel, visibility?: PollVisibility) => Promise<Poll[]>;
  getPollByPasscode: (passcode: string) => Promise<Poll | null>;
  
  // Vote operations
  createVote: (voteData: Omit<Vote, 'id' | 'timestamp'> & { voterId?: string }) => Promise<Vote>;
  getVotesByPollId: (pollId: string) => Promise<Vote[]>;
  getVoteByUserIdAndPollId: (userId: string, pollId: string, voterId?: string) => Promise<Vote | null>;
  getPollResults: (pollId: string) => Promise<Array<{ option: string; count: number; voters?: string[] }>>;
  
  // Real-time cache
  cachedResults: Record<string, Array<{ option: string; count: number; voters?: string[] }>>;
  cachedUserVotes: Record<string, Vote | null>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedResults, setCachedResults] = useState<Record<string, Array<{ option: string; count: number; voters?: string[] }>>>({});
  const [cachedUserVotes, setCachedUserVotes] = useState<Record<string, Vote | null>>({});

  // Initialize Firebase and subscribe to real-time updates
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Initialize sample data if database is empty
        await FirebaseService.initializeSampleData();
        
        // Subscribe to real-time updates
        FirebaseService.subscribeToPollsChange((updatedPolls) => {
          console.log('Polls updated:', updatedPolls.length);
          setPolls(updatedPolls);
        });
        
        FirebaseService.subscribeToVotesChange((updatedVotes) => {
          console.log('Votes updated:', updatedVotes.length);
          setVotes(updatedVotes);
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing real-time data:', error);
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Update cached results whenever votes change
  useEffect(() => {
    const updateCachedResults = async () => {
      const newCachedResults: Record<string, Array<{ option: string; count: number; voters?: string[] }>> = {};
      
      // Get unique poll IDs from votes
      const pollIds = [...new Set(votes.map(vote => vote.pollId))];
      
      // Update results for each poll
      for (const pollId of pollIds) {
        try {
          const results = await FirebaseService.getPollResults(pollId);
          newCachedResults[pollId] = results;
        } catch (error) {
          console.error(`Error updating results for poll ${pollId}:`, error);
        }
      }
      
      setCachedResults(prev => ({ ...prev, ...newCachedResults }));
    };
    
    updateCachedResults();
  }, [votes]);

  // Poll operations
  const createPoll = async (
    pollData: Omit<Poll, 'id' | 'creatorId' | 'createdAt'>, 
    creatorId: string
  ): Promise<Poll> => {
    const newPoll = await FirebaseService.createPoll({
      ...pollData,
      creatorId
    });
    return newPoll;
  };

  const getPollById = async (id: string): Promise<Poll | null> => {
    return FirebaseService.getPollById(id);
  };

  const getFilteredPolls = async (
    verificationLevel?: VerificationLevel,
    visibility: PollVisibility = 'public'
  ): Promise<Poll[]> => {
    return FirebaseService.getFilteredPolls(verificationLevel, visibility);
  };

  const getPollByPasscode = async (passcode: string): Promise<Poll | null> => {
    return FirebaseService.getPollByPasscode(passcode);
  };

  // Vote operations
  const createVote = async (voteData: Omit<Vote, 'id' | 'timestamp'> & { voterId?: string }): Promise<Vote> => {
    const newVote = await FirebaseService.createVote(voteData);
    
    // Update cached user votes - cache key includes voterId if available
    const cacheKey = voteData.voterId ? 
      `${voteData.userId}-${voteData.pollId}-${voteData.voterId}` : 
      `${voteData.userId}-${voteData.pollId}`;
      
    setCachedUserVotes(prev => ({
      ...prev,
      [cacheKey]: newVote
    }));
    
    return newVote;
  };

  const getVotesByPollId = async (pollId: string): Promise<Vote[]> => {
    return FirebaseService.getVotesByPollId(pollId);
  };

  const getVoteByUserIdAndPollId = async (userId: string, pollId: string, voterId?: string): Promise<Vote | null> => {
    // Check cache first - include voterId in cache key if available
    const cacheKey = voterId ? 
      `${userId}-${pollId}-${voterId}` : 
      `${userId}-${pollId}`;
      
    if (cachedUserVotes[cacheKey] !== undefined) {
      return cachedUserVotes[cacheKey];
    }
    
    // If not in cache, fetch from Firebase
    const vote = await FirebaseService.getVoteByUserIdAndPollId(userId, pollId, voterId);
    
    // Update cache
    setCachedUserVotes(prev => ({
      ...prev,
      [cacheKey]: vote
    }));
    
    return vote;
  };

  const getPollResults = async (pollId: string): Promise<Array<{ option: string; count: number; voters?: string[] }>> => {
    // Check cache first
    if (cachedResults[pollId]) {
      return cachedResults[pollId];
    }
    
    // If not in cache, fetch from Firebase
    const results = await FirebaseService.getPollResults(pollId);
    
    // Update cache
    setCachedResults(prev => ({
      ...prev,
      [pollId]: results
    }));
    
    return results;
  };

  const value = {
    polls,
    votes,
    isLoading,
    createPoll,
    getPollById,
    getFilteredPolls,
    getPollByPasscode,
    createVote,
    getVotesByPollId,
    getVoteByUserIdAndPollId,
    getPollResults,
    cachedResults,
    cachedUserVotes
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}