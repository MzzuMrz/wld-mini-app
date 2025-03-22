"use client";

import { Poll, User, Vote, VerificationLevel } from '@/types';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { nanoid } from 'nanoid';

// Initial mock data
const INITIAL_MOCK_POLLS: Poll[] = [
  {
    id: nanoid(),
    creatorId: '0x7890123456789012345678901234567890123456',
    title: 'What feature should we build next?',
    options: ['Delegation voting', 'Multi-signature polls', 'Integration with DAOs', 'Anonymous voting'],
    verificationLevel: 'device',
    visibility: 'public',
    endTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    anonymous: false,
    choiceType: 'single',
    createdAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: nanoid(),
    creatorId: '0x7890123456789012345678901234567890123456',
    title: 'When should we schedule the next community call?',
    options: ['Monday 3pm UTC', 'Wednesday 6pm UTC', 'Friday 9am UTC', 'Saturday 2pm UTC'],
    verificationLevel: 'none',
    visibility: 'public',
    endTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    anonymous: true,
    choiceType: 'single',
    createdAt: new Date(new Date().getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: nanoid(),
    creatorId: '0x7890123456789012345678901234567890123456',
    title: 'Should we add more verification levels?',
    options: ['Yes', 'No', 'Only for specific use cases'],
    verificationLevel: 'orb',
    visibility: 'public',
    endTime: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    anonymous: false,
    choiceType: 'single',
    createdAt: new Date(new Date().getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: nanoid(),
    creatorId: '0x7890123456789012345678901234567890123456',
    title: 'Which blockchain should we add support for next?',
    options: ['Ethereum', 'Polygon', 'Solana', 'Avalanche', 'Optimism'],
    verificationLevel: 'device',
    visibility: 'private',
    passcode: 'abc123',
    endTime: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    anonymous: false,
    choiceType: 'multi',
    createdAt: new Date(new Date().getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Initial mock votes
const INITIAL_MOCK_VOTES: Vote[] = [
  {
    id: nanoid(),
    pollId: INITIAL_MOCK_POLLS[0].id,
    userId: '0x1234567890123456789012345678901234567890',
    choices: [0],
    timestamp: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: nanoid(),
    pollId: INITIAL_MOCK_POLLS[0].id,
    userId: '0x2345678901234567890123456789012345678901',
    choices: [2],
    timestamp: new Date(new Date().getTime() - 12 * 60 * 60 * 1000).toISOString(),
  }
];

interface DataContextType {
  // Data collections
  polls: Poll[];
  votes: Vote[];
  // CRUD operations for polls
  createPoll: (poll: Omit<Poll, 'id' | 'createdAt'>) => Poll;
  getPollById: (id: string) => Poll | undefined;
  getPollByPasscode: (passcode: string) => Poll | undefined;
  getFilteredPolls: (verificationLevel?: VerificationLevel, visibility?: 'public' | 'private') => Poll[];
  // CRUD operations for votes
  createVote: (vote: Omit<Vote, 'id' | 'timestamp'>) => Vote;
  getVotesByPollId: (pollId: string) => Vote[];
  getVoteByUserIdAndPollId: (userId: string, pollId: string) => Vote | undefined;
  getPollResults: (pollId: string) => Array<{ option: string; count: number; voters?: string[] }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // In-memory data stores
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize with mock data
  useEffect(() => {
    if (!initialized) {
      console.log("Initializing global data store with mock data");
      setPolls(INITIAL_MOCK_POLLS);
      setVotes(INITIAL_MOCK_VOTES);
      setInitialized(true);
    }
  }, [initialized]);

  // CRUD operations for polls
  const createPoll = (poll: Omit<Poll, 'id' | 'createdAt'>): Poll => {
    const newPoll: Poll = {
      ...poll,
      id: nanoid(),
      createdAt: new Date().toISOString(),
    };
    
    setPolls(prevPolls => [newPoll, ...prevPolls]);
    console.log(`Poll created: ${newPoll.id} - ${newPoll.title}`);
    return newPoll;
  };

  const getPollById = (id: string): Poll | undefined => {
    return polls.find(poll => poll.id === id);
  };

  const getPollByPasscode = (passcode: string): Poll | undefined => {
    return polls.find(poll => poll.passcode === passcode);
  };

  const getFilteredPolls = (
    verificationLevel?: VerificationLevel,
    visibility: 'public' | 'private' = 'public'
  ): Poll[] => {
    return polls
      .filter(poll => {
        const isActive = new Date(poll.endTime) > new Date();
        const matchesVisibility = poll.visibility === visibility;
        
        // A user can see polls if:
        // 1. The poll has no verification requirement (none), OR
        // 2. The user's verification level is equal to or greater than the poll's requirement
        const canAccessWithVerification = 
          poll.verificationLevel === 'none' || 
          !verificationLevel || 
          verificationLevel === poll.verificationLevel ||
          (verificationLevel === 'orb' && ['device', 'none'].includes(poll.verificationLevel)) ||
          (verificationLevel === 'device' && poll.verificationLevel === 'none');
        
        return isActive && matchesVisibility && canAccessWithVerification;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // CRUD operations for votes
  const createVote = (vote: Omit<Vote, 'id' | 'timestamp'>): Vote => {
    // Check if user has already voted in this poll
    const existingVote = votes.find(v => v.pollId === vote.pollId && v.userId === vote.userId);
    if (existingVote) {
      throw new Error('You have already voted in this poll');
    }
    
    const newVote: Vote = {
      ...vote,
      id: nanoid(),
      timestamp: new Date().toISOString(),
    };
    
    setVotes(prevVotes => [...prevVotes, newVote]);
    return newVote;
  };

  const getVotesByPollId = (pollId: string): Vote[] => {
    return votes.filter(vote => vote.pollId === pollId);
  };

  const getVoteByUserIdAndPollId = (userId: string, pollId: string): Vote | undefined => {
    return votes.find(vote => vote.pollId === pollId && vote.userId === userId);
  };

  const getPollResults = (
    pollId: string
  ): { option: string; count: number; voters?: string[] }[] => {
    const poll = getPollById(pollId);
    if (!poll) return [];
    
    const pollVotes = getVotesByPollId(pollId);
    
    return poll.options.map((option, index) => {
      const votesForOption = pollVotes.filter(vote => vote.choices.includes(index));
      return {
        option,
        count: votesForOption.length,
        // Only include voters list if poll is not anonymous
        ...(poll.anonymous ? {} : { 
          voters: votesForOption.map(vote => vote.userId) 
        })
      };
    });
  };

  const value = {
    polls,
    votes,
    createPoll,
    getPollById,
    getPollByPasscode,
    getFilteredPolls,
    createVote,
    getVotesByPollId,
    getVoteByUserIdAndPollId,
    getPollResults,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}