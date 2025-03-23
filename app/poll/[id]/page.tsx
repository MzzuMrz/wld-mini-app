"use client";
import { useEffect, useState } from "react";
import { useVoting } from "@/context/VotingContext";
import { useRouter, useParams } from "next/navigation";
import { RealtimeStatus } from "@/components/RealtimeStatus";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import CollectibleEarnedDialog from "@/components/collectibles/collectible-earned-dialog";
import { v4 as uuidv4 } from 'uuid';

// Vote option component with futuristic styling
const VoteOption = ({ 
  option, 
  index, 
  isSelected, 
  isSingleChoice,
  onSelect 
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      className={`w-full text-left rounded-lg p-4 mb-3 transition-all focus:outline-none border 
        ${isSelected 
          ? "bg-primary/10 border-primary/40 hover:bg-primary/15" 
          : "border-gray-800 bg-black/20 hover:bg-gray-900/40 hover:border-gray-700"
        } animated-bg`}
    >
      <div className="flex items-center">
        <div className={`w-5 h-5 flex-shrink-0 ${isSingleChoice ? "rounded-full" : "rounded-md"} border 
          ${isSelected 
            ? "border-primary bg-primary text-white" 
            : "border-gray-600"
          } flex items-center justify-center`}
        >
          {isSelected && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          )}
        </div>
        <span className="ml-3">{option}</span>
      </div>
    </button>
  );
};

export default function PollDetail() {
  const { 
    currentUser, 
    selectPoll, 
    submitVote, 
    fetchPollResults, 
    userVote, 
    pollResults, 
    currentPoll, 
    checkUserVoted,
    addCollectible,
    collectibles 
  } = useVoting();
  const router = useRouter();
  const params = useParams();
  const pollId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [votedSuccessfully, setVotedSuccessfully] = useState(false);
  const [earnedCollectible, setEarnedCollectible] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  // Load the poll and results
  useEffect(() => {
    let isMounted = true;
    
    const loadPoll = async () => {
      if (!pollId) return;
      
      try {
        const poll = await selectPoll(pollId);
        if (!poll && isMounted) {
          setError("Poll not found");
          return;
        }
        
        if (isMounted) {
          await fetchPollResults(pollId);
          
          // Force check if user already voted by worldHumanId
          if (currentUser && currentUser.worldHumanId) {
            const hasVoted = await checkUserVoted(pollId);
            if (hasVoted && !userVote) {
              // Refresh poll to get latest user vote with World ID
              await selectPoll(pollId);
            }
          }
        }
      } catch (err) {
        console.error("Error loading poll:", err);
        if (isMounted) {
          setError("Failed to load poll");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (currentUser) {
      loadPoll();
    }
    
    return () => {
      isMounted = false;
    };
  }, [pollId, selectPoll, fetchPollResults, currentUser, checkUserVoted, userVote]);

  const handleOptionSelect = (index: number) => {
    console.log(`Option ${index} selected`);
    
    if (currentPoll?.choiceType === "single") {
      setSelectedOptions([index]);
    } else {
      const isSelected = selectedOptions.includes(index);
      if (isSelected) {
        setSelectedOptions(prev => prev.filter(i => i !== index));
      } else {
        setSelectedOptions(prev => [...prev, index]);
      }
    }
  };

  const handleVoteSubmit = async () => {
    if (selectedOptions.length === 0) {
      setError("Please select at least one option");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Add debug logs to track the issue
      console.log("Submitting vote for pollId:", pollId);
      console.log("Options selected:", selectedOptions);
      console.log("Current user:", currentUser);
      
      const vote = await submitVote(pollId, selectedOptions);
      console.log("Vote result:", vote);
      
      if (vote) {
        setVotedSuccessfully(true);
        await fetchPollResults(pollId);
        
        // Award a collectible for voting
        if (currentUser?.worldHumanId) {
          // Determine if this should be a special collectible
          // Chance of getting a golden collectible is 10% for orb-verified users, 5% for device-verified
          const isOrbVerified = currentUser.verificationLevel === 'orb';
          const specialChance = isOrbVerified ? 0.1 : 0.05;
          const isSpecialCollectible = Math.random() < specialChance;
          
          const newCollectible = {
            id: uuidv4(),
            name: `${currentPoll?.title || 'Poll'} Participation`,
            image: isSpecialCollectible ? "/collectibles/golden-duck.png" : "/collectibles/simple-duck.png",
            date: new Date().toISOString()
          };
          
          // Add to user's collection
          addCollectible(newCollectible);
          
          // Show the earned collectible dialog
          setEarnedCollectible(newCollectible);
        }
      } else {
        setError("Failed to record your vote. Please try again.");
      }
    } catch (err: unknown) {
      console.error("Error submitting vote:", err);
      setError(err instanceof Error ? err.message : "Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCloseCollectibleDialog = () => {
    setEarnedCollectible(null);
  };

  // Helper function to calculate percentages
  const calculatePercentage = (count: number): string => {
    const total = pollResults.reduce((sum, result) => sum + result.count, 0);
    if (total === 0) return "0%";
    return `${Math.round((count / total) * 100)}%`;
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 md:p-6 flex justify-center items-center min-h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error && !currentPoll) {
    return (
      <div className="max-w-md mx-auto p-4 md:p-6">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <Button 
            onClick={() => router.push("/vote")} 
            variant="secondary"
            size="md"
            className="mt-4"
          >
            Back to Polls
          </Button>
        </div>
      </div>
    );
  }

  if (!currentPoll) return null;

  const isPollExpired = new Date(currentPoll.endTime) < new Date();
  const showResults = userVote || isPollExpired || votedSuccessfully;
  const totalVotes = pollResults.reduce((sum, result) => sum + result.count, 0);
  const isSingleChoice = currentPoll.choiceType === "single";

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      
      {/* Collectible Earned Dialog */}
      <CollectibleEarnedDialog 
        collectible={earnedCollectible} 
        onClose={handleCloseCollectibleDialog} 
      />
      
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-lg mx-auto pt-6">
          <div className="flex items-center mb-6 justify-between">
            <div className="flex items-center">
              <Button
                onClick={() => router.push("/")}
                variant="ghost"
                size="sm"
                className="mr-2 text-gray-400 hover:text-white"
              >
                ← Back
              </Button>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
                Poll
              </h1>
            </div>
            <RealtimeStatus />
          </div>

          {error && (
            <div className="bg-red-900/30 text-red-300 border border-red-800/50 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-6 shadow-lg animated-bg">
            <h2 className="text-xl font-semibold mb-2">{currentPoll.title}</h2>
            
            <div className="flex justify-between text-sm text-gray-400 mb-4">
              <span>
                {isPollExpired ? (
                  <span className="text-red-400">Ended {new Date(currentPoll.endTime).toLocaleString()}</span>
                ) : (
                  <span>Ends {new Date(currentPoll.endTime).toLocaleString()}</span>
                )}
              </span>
              <div className="flex space-x-2">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  currentPoll.verificationLevel === "orb" 
                    ? "bg-green-900/40 text-green-300 border border-green-700/30" 
                    : currentPoll.verificationLevel === "device" 
                    ? "bg-blue-900/40 text-blue-300 border border-blue-700/30" 
                    : "bg-gray-800 text-gray-300 border border-gray-700"
                }`}>
                  {currentPoll.verificationLevel === "orb" ? "Orb Verified" : 
                  currentPoll.verificationLevel === "device" ? "Device Verified" : "No Verification"}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  currentPoll.visibility === "public" 
                    ? "bg-blue-900/40 text-blue-300 border border-blue-700/30" 
                    : "bg-purple-900/40 text-purple-300 border border-purple-700/30"
                }`}>
                  {currentPoll.visibility === "public" ? "Public" : "Private"}
                </span>
              </div>
            </div>

            {votedSuccessfully && (
              <div className="bg-green-900/30 text-green-300 border border-green-800/50 p-3 rounded-lg mb-4">
                Your vote has been recorded successfully!
              </div>
            )}

            {showResults ? (
              <div className="space-y-4 mt-6">
                <h3 className="font-medium text-lg">Results</h3>
                <p className="text-sm text-gray-400">{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</p>
                
                {pollResults.map((result, index) => (
                  <div key={index} className="mb-5">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{result.option}</span>
                      <span className="text-sm font-medium">{calculatePercentage(result.count)} ({result.count})</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full" 
                        style={{ width: calculatePercentage(result.count) }}
                      ></div>
                    </div>

                    {/* Show voters if the poll is not anonymous and there are votes */}
                    {!currentPoll.anonymous && result.voters && result.voters.length > 0 && (
                      <div className="mt-2 ml-1">
                        <details className="text-xs text-gray-400">
                          <summary className="cursor-pointer hover:text-gray-300">
                            View voters ({result.voters.length})
                          </summary>
                          <ul className="mt-2 ml-2 space-y-1 bg-black/30 p-2 rounded border border-gray-800">
                            {result.voters.map((voter, i) => (
                              <li key={i} className="font-mono">
                                {voter.slice(0, 6)}...{voter.slice(-4)}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                <h3 className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                  {isSingleChoice ? "Select one option:" : "Select one or more options:"}
                </h3>
                
                {currentPoll.options.map((option, index) => (
                  <VoteOption
                    key={index}
                    option={option}
                    index={index}
                    isSelected={selectedOptions.includes(index)}
                    isSingleChoice={isSingleChoice}
                    onSelect={handleOptionSelect}
                  />
                ))}

                <Button
                  onClick={handleVoteSubmit}
                  disabled={submitting || selectedOptions.length === 0}
                  className="w-full mt-6 futuristic-button"
                >
                  {submitting ? "Submitting..." : "Submit Vote"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}