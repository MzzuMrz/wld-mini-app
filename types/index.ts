export type VerificationLevel = 'orb' | 'device' | 'none';
export type PollVisibility = 'public' | 'private';
export type PollChoice = 'single' | 'multi';

export interface Poll {
  id: string;
  creatorId: string;
  title: string;
  options: string[];
  verificationLevel: VerificationLevel;
  visibility: PollVisibility;
  endTime: string; // ISO date string
  passcode?: string; // For private polls
  anonymous: boolean;
  choiceType: PollChoice;
  createdAt: string;
}

export interface Vote {
  id: string;
  pollId: string;
  userId: string;
  choices: number[]; // Indices of the selected options
  timestamp: string;
}

export interface User {
  walletAddress: string;
  username: string | null;
  profilePictureUrl: string | null;
  worldId?: string; // Will store nullifier hash or other ID
  verificationLevel?: VerificationLevel;
}