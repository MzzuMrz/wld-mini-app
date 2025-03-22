// Firebase configuration for real-time data synchronization
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, get, remove, update, child } from 'firebase/database';
import { Poll, Vote, VerificationLevel, PollVisibility } from '@/types';

// Firebase configuration
// Using a public demo Firebase project for demonstration purposes
// Replace with your own Firebase project in production
const firebaseConfig = {
  apiKey: { process.env.FIREBASE_API_KEY} ,
  authDomain: "worldid-voting-demo.firebaseapp.com",
  databaseURL: "https://worldid-voting-demo-default-rtdb.firebaseio.com",
  projectId: "worldid-voting-demo",
  storageBucket: "worldid-voting-demo.appspot.com",
  messagingSenderId: "968225802849",
  appId: "1:968225802849:web:75eb30b5e96d8c2c6c9e75"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Firebase refs
const pollsRef = ref(database, 'polls');
const votesRef = ref(database, 'votes');

// Poll operations
export const createPoll = async (pollData: Omit<Poll, 'id' | 'createdAt'>): Promise<Poll> => {
  const newPollRef = push(pollsRef);
  const id = newPollRef.key || '';
  const newPoll: Poll = {
    ...pollData,
    id,
    createdAt: new Date().toISOString(),
  };
  
  await set(newPollRef, newPoll);
  return newPoll;
};

export const getPollById = async (id: string): Promise<Poll | null> => {
  const snapshot = await get(ref(database, `polls/${id}`));
  return snapshot.exists() ? snapshot.val() : null;
};

export const getAllPolls = async (): Promise<Poll[]> => {
  const snapshot = await get(pollsRef);
  if (!snapshot.exists()) return [];
  
  const pollsData = snapshot.val();
  return Object.values(pollsData) as Poll[];
};

export const getFilteredPolls = async (
  verificationLevel?: VerificationLevel,
  visibility: PollVisibility = 'public'
): Promise<Poll[]> => {
  const polls = await getAllPolls();
  
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

export const getPollByPasscode = async (passcode: string): Promise<Poll | null> => {
  const snapshot = await get(pollsRef);
  if (!snapshot.exists()) return null;
  
  const pollsData = snapshot.val();
  const polls = Object.values(pollsData) as Poll[];
  const poll = polls.find(p => p.passcode === passcode);
  
  return poll || null;
};

// Vote operations
export const createVote = async (voteData: Omit<Vote, 'id' | 'timestamp'>): Promise<Vote> => {
  // Check if user has already voted
  const existingVote = await getVoteByUserIdAndPollId(voteData.userId, voteData.pollId);
  if (existingVote) {
    throw new Error('You have already voted in this poll');
  }
  
  const newVoteRef = push(votesRef);
  const id = newVoteRef.key || '';
  const newVote: Vote = {
    ...voteData,
    id,
    timestamp: new Date().toISOString(),
  };
  
  await set(newVoteRef, newVote);
  return newVote;
};

export const getVotesByPollId = async (pollId: string): Promise<Vote[]> => {
  const snapshot = await get(votesRef);
  if (!snapshot.exists()) return [];
  
  const votesData = snapshot.val();
  const votes = Object.values(votesData) as Vote[];
  return votes.filter(vote => vote.pollId === pollId);
};

export const getVoteByUserIdAndPollId = async (userId: string, pollId: string): Promise<Vote | null> => {
  const snapshot = await get(votesRef);
  if (!snapshot.exists()) return null;
  
  const votesData = snapshot.val();
  const votes = Object.values(votesData) as Vote[];
  const vote = votes.find(v => v.pollId === pollId && v.userId === userId);
  
  return vote || null;
};

export const getPollResults = async (pollId: string): Promise<Array<{ option: string; count: number; voters?: string[] }>> => {
  const poll = await getPollById(pollId);
  if (!poll) return [];
  
  const votes = await getVotesByPollId(pollId);
  
  return poll.options.map((option, index) => {
    const votesForOption = votes.filter(vote => vote.choices.includes(index));
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

// Real-time subscriptions
export const subscribeToPollsChange = (callback: (polls: Poll[]) => void) => {
  onValue(pollsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const pollsData = snapshot.val();
    const polls = Object.values(pollsData) as Poll[];
    callback(polls);
  });
};

export const subscribeToVotesChange = (callback: (votes: Vote[]) => void) => {
  onValue(votesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const votesData = snapshot.val();
    const votes = Object.values(votesData) as Vote[];
    callback(votes);
  });
};

// Poll-specific subscriptions
export const subscribeToPollById = (pollId: string, callback: (poll: Poll | null) => void) => {
  const pollRef = ref(database, `polls/${pollId}`);
  
  onValue(pollRef, (snapshot) => {
    const poll = snapshot.exists() ? snapshot.val() : null;
    callback(poll);
  });
};

export const subscribeToPollVotes = (pollId: string, callback: (votes: Vote[]) => void) => {
  onValue(votesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const votesData = snapshot.val();
    const votes = Object.values(votesData) as Vote[];
    const pollVotes = votes.filter(vote => vote.pollId === pollId);
    callback(pollVotes);
  });
};

// Initialize with sample data if empty
export const initializeSampleData = async () => {
  // Check if data already exists
  const pollsSnapshot = await get(pollsRef);
  if (pollsSnapshot.exists()) {
    return; // Don't initialize if data already exists
  }
  
  // Sample polls
  const samplePolls = [
    {
      title: 'What feature should we build next?',
      options: ['Delegation voting', 'Multi-signature polls', 'Integration with DAOs', 'Anonymous voting'],
      verificationLevel: 'device' as VerificationLevel,
      visibility: 'public' as PollVisibility,
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      anonymous: false,
      choiceType: 'single',
      creatorId: '0x7890123456789012345678901234567890123456',
    },
    {
      title: 'When should we schedule the next community call?',
      options: ['Monday 3pm UTC', 'Wednesday 6pm UTC', 'Friday 9am UTC', 'Saturday 2pm UTC'],
      verificationLevel: 'none' as VerificationLevel,
      visibility: 'public' as PollVisibility,
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      anonymous: true,
      choiceType: 'single',
      creatorId: '0x7890123456789012345678901234567890123456',
    },
    {
      title: 'Should we add more verification levels?',
      options: ['Yes', 'No', 'Only for specific use cases'],
      verificationLevel: 'orb' as VerificationLevel,
      visibility: 'public' as PollVisibility,
      endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      anonymous: false,
      choiceType: 'single',
      creatorId: '0x7890123456789012345678901234567890123456',
    }
  ];
  
  // Create polls
  const createdPolls: Poll[] = [];
  for (const poll of samplePolls) {
    const newPoll = await createPoll(poll);
    createdPolls.push(newPoll);
  }
  
  // Add sample votes to the first poll
  if (createdPolls.length > 0) {
    try {
      await createVote({
        pollId: createdPolls[0].id,
        userId: '0x1234567890123456789012345678901234567890',
        choices: [0]
      });
      
      await createVote({
        pollId: createdPolls[0].id,
        userId: '0x2345678901234567890123456789012345678901',
        choices: [2]
      });
    } catch (error) {
      // Ignore errors during initialization
      console.log('Error adding sample votes:', error);
    }
  }
};