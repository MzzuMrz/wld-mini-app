"use client";

import { Poll, User, Vote, VerificationLevel, Collectible } from "@/types";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useRealtime } from "./RealtimeContext";
import { MiniKit } from "@worldcoin/minikit-js";

interface VotingContextType {
  // State
  currentUser: User | null;
  currentPoll: Poll | null;
  polls: Poll[];
  userVote: Vote | null;
  pollResults: Array<{ option: string; count: number; voters?: string[] }>;
  isLoading: boolean;
  collectibles: Collectible[];

  // Actions
  setCurrentUser: (user: User | null) => void;
  fetchPublicPolls: (verificationLevel?: VerificationLevel) => Promise<Poll[]>;
  fetchPrivatePoll: (passcode: string) => Promise<Poll | null>;
  createNewPoll: (
    poll: Omit<Poll, "id" | "creatorId" | "createdAt">
  ) => Promise<Poll>;
  submitVote: (pollId: string, choices: number[]) => Promise<Vote | null>;
  fetchPollResults: (
    pollId: string
  ) => Promise<Array<{ option: string; count: number; voters?: string[] }>>;
  selectPoll: (pollId: string) => Promise<Poll | null>;
  clearCurrentPoll: () => void;
  checkUserVoted: (pollId: string) => Promise<boolean>;
  addCollectible: (collectible: Collectible) => void;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export function VotingProvider({ children }: { children: ReactNode }) {
  // Use the real-time context for data
  const realtime = useRealtime();

  // Local state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [pollResults, setPollResults] = useState<
    Array<{ option: string; count: number; voters?: string[] }>
  >([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);

  // Load user from session if available
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("Checking authentication status...");
        // First, check if MiniKit is installed and has a user
        if (
          !MiniKit.isInstalled() ||
          !MiniKit.user?.username ||
          !MiniKit.user
        ) {
          console.log("MiniKit not installed or user not logged in");
          setCurrentUser(null);
          return;
        }

        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.authenticated) {
            console.log("User authenticated:", data.user);
            // Make sure to include the worldHumanId from MiniKit
            setCurrentUser({
              ...data.user,
              worldHumanId: MiniKit.user.username, // Always use MiniKit's ID
              verificationLevel: MiniKit, // Default to device, could be updated based on actual verification
            });
          } else {
            console.log("Authentication failed or no user data");
            setCurrentUser(null);
          }
        } else {
          console.log("Authentication API error");
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setCurrentUser(null);
      }
    };

    loadUser();
  }, []);

  // Load collectibles from localStorage when user changes
  useEffect(() => {
    if (currentUser?.worldHumanId) {
      try {
        const storedCollectibles = localStorage.getItem(
          `collectibles_${currentUser.worldHumanId}`
        );
        if (storedCollectibles) {
          setCollectibles(JSON.parse(storedCollectibles));
        }
      } catch (error) {
        console.error("Error loading collectibles from localStorage:", error);
      }
    } else {
      // Clear collectibles if no user
      setCollectibles([]);
    }
  }, [currentUser?.worldHumanId]);

  // Memoize these functions to prevent unnecessary re-renders
  const fetchPublicPolls = useCallback(
    async (verificationLevel?: VerificationLevel): Promise<Poll[]> => {
      const fetchedPolls = await realtime.getFilteredPolls(
        verificationLevel,
        "public"
      );
      setPolls(fetchedPolls);
      return fetchedPolls;
    },
    [realtime]
  );

  const fetchPrivatePoll = useCallback(
    async (passcode: string): Promise<Poll | null> => {
      const poll = await realtime.getPollByPasscode(passcode);
      if (poll) {
        setCurrentPoll(poll);
        return poll;
      }
      return null;
    },
    [realtime]
  );

  const createNewPoll = useCallback(
    async (
      pollData: Omit<Poll, "id" | "creatorId" | "createdAt">
    ): Promise<Poll> => {
      if (!currentUser) throw new Error("User not authenticated");

      // Prefer using worldHumanId if available, fallback to wallet address
      const creatorId = currentUser.worldHumanId || currentUser.walletAddress;
      const newPoll = await realtime.createPoll(pollData, creatorId);

      // Update local polls state
      setPolls((prev) => [newPoll, ...prev]);
      return newPoll;
    },
    [currentUser, realtime]
  );

  const submitVote = useCallback(
    async (pollId: string, choices: number[]): Promise<Vote | null> => {
      if (!currentUser) throw new Error("User not authenticated");

      try {
        const vote = await realtime.createVote({
          pollId,
          userId: currentUser.walletAddress,
          voterId: currentUser.worldHumanId, // Use World ID for vote tracking
          choices,
        });

        setUserVote(vote);

        // Update results after voting
        const results = await realtime.getPollResults(pollId);
        setPollResults(results);

        return vote;
      } catch (error) {
        console.error("Error submitting vote:", error);
        return null;
      }
    },
    [currentUser, realtime]
  );

  const fetchPollResults = useCallback(
    async (
      pollId: string
    ): Promise<Array<{ option: string; count: number; voters?: string[] }>> => {
      const results = await realtime.getPollResults(pollId);
      setPollResults(results);
      return results;
    },
    [realtime]
  );

  const selectPoll = useCallback(
    async (pollId: string): Promise<Poll | null> => {
      const poll = await realtime.getPollById(pollId);
      if (poll) {
        setCurrentPoll(poll);

        // Check if user has already voted
        if (currentUser) {
          const vote = await realtime.getVoteByUserIdAndPollId(
            currentUser.walletAddress,
            pollId,
            currentUser.worldHumanId // Use World ID for vote lookup
          );
          setUserVote(vote);
        }

        // Get poll results
        const results = await realtime.getPollResults(pollId);
        setPollResults(results);

        return poll;
      }

      return null;
    },
    [currentUser, realtime]
  );

  const clearCurrentPoll = useCallback(() => {
    setCurrentPoll(null);
    setUserVote(null);
    setPollResults([]);
  }, []);

  const checkUserVoted = useCallback(
    async (pollId: string): Promise<boolean> => {
      if (!currentUser) return false;

      const vote = await realtime.getVoteByUserIdAndPollId(
        currentUser.walletAddress,
        pollId,
        currentUser.worldHumanId // Use World ID for vote verification
      );
      return !!vote;
    },
    [currentUser, realtime]
  );

  // Add a new collectible to the user's collection
  const addCollectible = useCallback(
    (collectible: Collectible) => {
      if (!currentUser?.worldHumanId) return;

      setCollectibles((prev) => {
        // Check if collectible already exists to avoid duplicates
        const exists = prev.some((item) => item.id === collectible.id);
        if (exists) return prev;

        // Add new collectible to the array
        const updatedCollectibles = [...prev, collectible];

        // Save to localStorage for persistence
        try {
          localStorage.setItem(
            `collectibles_${currentUser.worldHumanId}`,
            JSON.stringify(updatedCollectibles)
          );
        } catch (error) {
          console.error("Error saving collectibles to localStorage:", error);
        }

        return updatedCollectibles;
      });
    },
    [currentUser?.worldHumanId]
  );

  // Value should be memoized to prevent unnecessary renders
  const value = {
    currentUser,
    currentPoll,
    polls,
    userVote,
    pollResults,
    isLoading: realtime.isLoading,
    collectibles,
    setCurrentUser,
    fetchPublicPolls,
    fetchPrivatePoll,
    createNewPoll,
    submitVote,
    fetchPollResults,
    selectPoll,
    clearCurrentPoll,
    checkUserVoted,
    addCollectible,
  };

  return (
    <VotingContext.Provider value={value}>{children}</VotingContext.Provider>
  );
}

export function useVoting() {
  const context = useContext(VotingContext);
  if (context === undefined) {
    throw new Error("useVoting must be used within a VotingProvider");
  }
  return context;
}
