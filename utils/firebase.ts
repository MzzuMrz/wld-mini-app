// Firebase configuration for real-time data synchronization
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, get, remove, update, child } from 'firebase/database';
import { Poll, Vote, VerificationLevel, PollVisibility, PollChoice } from '@/types';

// Firebase configuration
// Using a public demo Firebase project for demonstration purposes
// Replace with your own Firebase project in production
const firebaseConfig = {
  apiKey: "AIzaSyBy74XWfcAG3QU_lDL8LOMe3n_ueaUQMyA",
  authDomain: "wld-mini-app.firebaseapp.com",
  projectId: "wld-mini-app",
  storageBucket: "wld-mini-app.firebasestorage.app",
  messagingSenderId: "294249669432",
  appId: "1:294249669432:web:c576afaa3b841aea3517cd",
  measurementId: "G-X0XSHFBG24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Firebase refs
const pollsRef = ref(database, 'polls');
const votesRef = ref(database, 'votes');
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Intento ${attempt + 1} fallido: ${error.message}`);
      lastError = error;
      
      // Esperar antes del siguiente intento (con backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError;
};
// Poll operations
export const createPoll = async (pollData: Omit<Poll, 'id' | 'createdAt'>): Promise<Poll> => {
  const newPollRef = push(pollsRef);
  const id = newPollRef.key || '';

  // Crear un objeto limpio sin valores undefined
  const cleanedPollData = { ...pollData };

  // Si passcode es undefined, asignar null o una cadena vacía
  if (cleanedPollData.passcode === undefined) {
    cleanedPollData.passcode = null; // O usar '' si prefieres una cadena vacía
  }

  // Crear el objeto final de la encuesta
  const newPoll: Poll = {
    ...cleanedPollData,
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

      // Solución: Mejorar las comprobaciones para evitar comparaciones incompatibles de tipos
      const canAccessWithVerification =
        !verificationLevel || // Si no hay nivel de verificación requerido
        poll.verificationLevel === 'none' || // O si el poll no requiere verificación
        verificationLevel === poll.verificationLevel || // O si los niveles coinciden exactamente
        (verificationLevel === 'orb' &&
          (poll.verificationLevel === 'device' || poll.verificationLevel === 'none')) || // Orb puede acceder a device o none
        (verificationLevel === 'device' &&
          poll.verificationLevel === 'none' as VerificationLevel); // Device puede acceder a none

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
export const createVote = async (voteData: Omit<Vote, 'id' | 'timestamp'> & { voterId?: string }): Promise<Vote> => {
  try {
    console.log("Creating vote with data:", voteData);
    
    // Check if user has already voted
    const existingVote = await getVoteByUserIdAndPollId(voteData.userId, voteData.pollId, voteData.voterId);
    if (existingVote) {
      console.log("User already voted:", existingVote);
      throw new Error('You have already voted in this poll');
    }

    // Create a clean vote object that includes voterId
    const voteWithVoterId: Partial<Vote> = {
      pollId: voteData.pollId,
      userId: voteData.userId,
      choices: voteData.choices,
    };
    
    // Only add voterId if it exists
    if (voteData.voterId) {
      voteWithVoterId.voterId = voteData.voterId;
    }
    
    const newVoteRef = push(votesRef);
    const id = newVoteRef.key || '';
    const newVote: Vote = {
      ...voteWithVoterId as Omit<Vote, 'id' | 'timestamp'>,
      id,
      timestamp: new Date().toISOString(),
    };

    // Use retryOperation to make sure the vote is saved
    await retryOperation(() => set(newVoteRef, newVote));
    console.log("Vote created successfully:", newVote);
    return newVote;
  } catch (error) {
    console.error("Error creating vote:", error);
    throw error;
  }
};

export const getVotesByPollId = async (pollId: string): Promise<Vote[]> => {
  const snapshot = await get(votesRef);
  if (!snapshot.exists()) return [];

  const votesData = snapshot.val();
  const votes = Object.values(votesData) as Vote[];
  return votes.filter(vote => vote.pollId === pollId);
};

export const getVoteByUserIdAndPollId = async (userId: string, pollId: string, voterId?: string): Promise<Vote | null> => {
  const snapshot = await get(votesRef);
  if (!snapshot.exists()) return null;

  const votesData = snapshot.val();
  const votes = Object.values(votesData) as Vote[];
  
  let vote = null;
  if (voterId) {
    // First try to find by voterId (worldHumanId)
    vote = votes.find(v => v.pollId === pollId && v.voterId === voterId);
  }
  
  // If not found by voterId or no voterId provided, try by userId
  if (!vote) {
    vote = votes.find(v => v.pollId === pollId && v.userId === userId);
  }

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
      choiceType: 'single' as PollChoice,
      creatorId: '0x7890123456789012345678901234567890123456',
    },
    {
      title: 'When should we schedule the next community call?',
      options: ['Monday 3pm UTC', 'Wednesday 6pm UTC', 'Friday 9am UTC', 'Saturday 2pm UTC'],
      verificationLevel: 'none' as VerificationLevel,
      visibility: 'public' as PollVisibility,
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      anonymous: true,
      choiceType: 'single' as PollChoice,
      creatorId: '0x7890123456789012345678901234567890123456',
    },
    {
      title: 'Should we add more verification levels?',
      options: ['Yes', 'No', 'Only for specific use cases'],
      verificationLevel: 'orb' as VerificationLevel,
      visibility: 'public' as PollVisibility,
      endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      anonymous: false,
      choiceType: 'single' as PollChoice,
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