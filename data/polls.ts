import { Poll, Vote, VerificationLevel, PollVisibility } from '@/types';
import { nanoid } from 'nanoid';

// Load initial data from localStorage if available
const loadInitialData = () => {
  if (typeof window === 'undefined') return { polls: [], votes: [] };
  
  try {
    const savedPolls = localStorage.getItem('polls');
    const savedVotes = localStorage.getItem('votes');
    
    return {
      polls: savedPolls ? JSON.parse(savedPolls) : [],
      votes: savedVotes ? JSON.parse(savedVotes) : []
    };
  } catch (e) {
    console.error('Error loading data from localStorage:', e);
    return { polls: [], votes: [] };
  }
};

// Storage for polls and votes
let polls: Poll[] = [];
let votes: Vote[] = [];

// Initialize with data from localStorage if available
if (typeof window !== 'undefined') {
  const initialData = loadInitialData();
  polls = initialData.polls;
  votes = initialData.votes;
}

// Helper function to persist data to localStorage
const persistData = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('polls', JSON.stringify(polls));
    localStorage.setItem('votes', JSON.stringify(votes));
  } catch (e) {
    console.error('Error saving data to localStorage:', e);
  }
};

// Initialize with some mock polls for demo purposes
export const initMockPolls = () => {
  console.log("Initializing mock polls, current count:", polls.length);
  
  // Only initialize if polls don't already exist
  if (polls.length === 0) {
    console.log("No existing polls found, creating mock data");
    
    const mockPolls: Omit<Poll, 'id' | 'createdAt'>[] = [
      {
        creatorId: '0x7890123456789012345678901234567890123456',
        title: 'What feature should we build next?',
        options: ['Delegation voting', 'Multi-signature polls', 'Integration with DAOs', 'Anonymous voting'],
        verificationLevel: 'device',
        visibility: 'public',
        endTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        anonymous: false,
        choiceType: 'single',
      },
      {
        creatorId: '0x7890123456789012345678901234567890123456',
        title: 'When should we schedule the next community call?',
        options: ['Monday 3pm UTC', 'Wednesday 6pm UTC', 'Friday 9am UTC', 'Saturday 2pm UTC'],
        verificationLevel: 'none',
        visibility: 'public',
        endTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        anonymous: true,
        choiceType: 'single',
      },
      {
        creatorId: '0x7890123456789012345678901234567890123456',
        title: 'Should we add more verification levels?',
        options: ['Yes', 'No', 'Only for specific use cases'],
        verificationLevel: 'orb',
        visibility: 'public',
        endTime: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        anonymous: false,
        choiceType: 'single',
      },
      {
        creatorId: '0x7890123456789012345678901234567890123456',
        title: 'Which blockchain should we add support for next?',
        options: ['Ethereum', 'Polygon', 'Solana', 'Avalanche', 'Optimism'],
        verificationLevel: 'device',
        visibility: 'private',
        passcode: 'abc123',
        endTime: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        anonymous: false,
        choiceType: 'multi',
      }
    ];

    // Add mock polls to the polls array without calling createPoll
    // to avoid triggering localStorage saves for each one
    const newPolls = mockPolls.map(mockPoll => ({
      ...mockPoll,
      id: nanoid(),
      createdAt: new Date().toISOString(),
    }));
    
    polls = [...newPolls];
    
    // Add some mock votes
    if (polls.length > 0) {
      // Add a couple of votes to the first poll
      const mockVotes = [
        {
          pollId: polls[0].id, 
          userId: '0x1234567890123456789012345678901234567890',
          choices: [0], // Voting for the first option
          id: nanoid(),
          timestamp: new Date().toISOString(),
        },
        {
          pollId: polls[0].id,
          userId: '0x2345678901234567890123456789012345678901',
          choices: [2], // Voting for the third option
          id: nanoid(),
          timestamp: new Date().toISOString(),
        }
      ];
      
      votes = [...mockVotes];
    }
    
    // Now persist all the mock data at once
    persistData();
    console.log("Mock data initialized with", polls.length, "polls and", votes.length, "votes");
  } else {
    console.log("Using existing polls from localStorage, count:", polls.length);
  }
};

// Poll CRUD operations
export const createPoll = (poll: Omit<Poll, 'id' | 'createdAt'>): Poll => {
  const newPoll: Poll = {
    ...poll,
    id: nanoid(),
    createdAt: new Date().toISOString(),
  };
  
  polls = [...polls, newPoll];
  
  // Persist to localStorage
  persistData();
  
  console.log("New poll created:", newPoll);
  console.log("Total polls after creation:", polls.length);
  
  // Log all polls for debugging
  polls.forEach((p, index) => {
    console.log(`Poll ${index + 1}: ${p.id} - ${p.title} - ${p.visibility} - ${p.verificationLevel}`);
  });
  
  return newPoll;
};

export const getPolls = (
  verificationLevel?: VerificationLevel, 
  visibility: PollVisibility = 'public'
): Poll[] => {
  console.log("Getting polls with verificationLevel:", verificationLevel, "and visibility:", visibility);
  console.log("Current polls in memory:", polls.length);
  
  return polls
    .filter(poll => {
      const isActive = new Date(poll.endTime) > new Date();
      const matchesVisibility = poll.visibility === visibility;
      
      // A user can see polls if:
      // 1. The poll has no verification requirement (none), OR
      // 2. The user's verification level is equal to or greater than the poll's requirement
      // Note: We consider 'orb' > 'device' > 'none' in terms of verification strength
      const canAccessWithVerification = 
        poll.verificationLevel === 'none' || 
        !verificationLevel || 
        verificationLevel === poll.verificationLevel ||
        (verificationLevel === 'orb' && ['device', 'none'].includes(poll.verificationLevel)) ||
        (verificationLevel === 'device' && poll.verificationLevel === 'none');
      
      const result = isActive && matchesVisibility && canAccessWithVerification;
      
      return result;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPollById = (id: string): Poll | undefined => {
  return polls.find(poll => poll.id === id);
};

export const getPollByPasscode = (passcode: string): Poll | undefined => {
  return polls.find(poll => poll.passcode === passcode);
};

// Vote CRUD operations
export const createVote = (vote: Omit<Vote, 'id' | 'timestamp'>): Vote => {
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
  
  votes = [...votes, newVote];
  
  // Persist to localStorage
  persistData();
  
  return newVote;
};

export const getVotesByPollId = (pollId: string): Vote[] => {
  return votes.filter(vote => vote.pollId === pollId);
};

export const getVoteByUserIdAndPollId = (userId: string, pollId: string): Vote | undefined => {
  return votes.find(vote => vote.pollId === pollId && vote.userId === userId);
};

export const getPollResults = (
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