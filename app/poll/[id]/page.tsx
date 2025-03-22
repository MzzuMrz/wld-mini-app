"use client";
import { useEffect, useState } from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useVoting } from "@/context/VotingContext";
import { useRouter, useParams } from "next/navigation";
import { RealtimeStatus } from "@/components/RealtimeStatus";

export default function PollDetail() {
  const { currentUser, selectPoll, submitVote, fetchPollResults, userVote, pollResults, currentPoll } = useVoting();
  const router = useRouter();
  const params = useParams();
  const pollId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [votedSuccessfully, setVotedSuccessfully] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  // Load the poll and set up periodic refresh for results
  useEffect(() => {
    const loadPoll = async () => {
      if (!pollId) return;
      
      try {
        const poll = await selectPoll(pollId);
        if (!poll) {
          setError("Poll not found");
          return;
        }
        
        // Always fetch results to ensure real-time updates
        await fetchPollResults(pollId);
      } catch (err) {
        console.error("Error loading poll:", err);
        setError("Failed to load poll");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadPoll();
      
      // Set up periodic refresh for results
      const intervalId = setInterval(() => {
        if (currentPoll) {
          fetchPollResults(pollId).catch(err => {
            console.error("Error refreshing poll results:", err);
          });
        }
      }, 5000); // Check for updates every 5 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [pollId, selectPoll, fetchPollResults, currentUser, currentPoll]);

  const handleOptionSelect = (index: number) => {
    if (currentPoll?.choiceType === "single") {
      setSelectedOptions([index]);
    } else {
      const isSelected = selectedOptions.includes(index);
      if (isSelected) {
        setSelectedOptions(selectedOptions.filter(i => i !== index));
      } else {
        setSelectedOptions([...selectedOptions, index]);
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
      const vote = await submitVote(pollId, selectedOptions);
      if (vote) {
        setVotedSuccessfully(true);
        await fetchPollResults(pollId);
      }
    } catch (err: unknown) {
      console.error("Error submitting vote:", err);
      setError(err instanceof Error ? err.message : "Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
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

  // For private polls, show passcode to creator
  const isCreator = currentUser?.walletAddress === currentPoll.creatorId;
  const showPasscode = isCreator && currentPoll.visibility === "private";

  return (
    <div className="max-w-md mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6 justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.push("/vote")}
            className="mr-2 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Poll</h1>
        </div>
        <RealtimeStatus />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-2">{currentPoll.title}</h2>
        
        <div className="flex justify-between text-sm text-gray-500 mb-4">
          <span>
            {isPollExpired ? (
              <span className="text-red-500">Ended {new Date(currentPoll.endTime).toLocaleString()}</span>
            ) : (
              <span>Ends {new Date(currentPoll.endTime).toLocaleString()}</span>
            )}
          </span>
          <div className="flex space-x-2">
            <span className={`px-2 py-0.5 rounded ${
              currentPoll.verificationLevel === "orb" 
                ? "bg-green-100 text-green-800" 
                : currentPoll.verificationLevel === "device" 
                ? "bg-blue-100 text-blue-800" 
                : "bg-gray-100 text-gray-800"
            }`}>
              {currentPoll.verificationLevel === "orb" ? "Orb" : 
              currentPoll.verificationLevel === "device" ? "Device" : "None"}
            </span>
            <span className={`px-2 py-0.5 rounded ${
              currentPoll.visibility === "public" 
                ? "bg-blue-100 text-blue-800" 
                : "bg-purple-100 text-purple-800"
            }`}>
              {currentPoll.visibility === "public" ? "Public" : "Private"}
            </span>
          </div>
        </div>

        {showPasscode && (
          <div className="bg-yellow-50 p-3 rounded-lg mb-4 text-sm">
            <p className="font-medium text-yellow-800">Private Poll Passcode:</p>
            <p className="mt-1 font-mono bg-white px-2 py-1 rounded border border-yellow-300">
              {currentPoll.passcode}
            </p>
            <p className="mt-1 text-yellow-700">Share this passcode with people you want to invite to this poll.</p>
          </div>
        )}

        {votedSuccessfully && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">
            Your vote has been recorded successfully!
          </div>
        )}

        {showResults ? (
          <div className="space-y-4 mt-6">
            <h3 className="font-medium text-lg">Results</h3>
            <p className="text-sm text-gray-500">{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</p>
            
            {pollResults.map((result, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{result.option}</span>
                  <span className="text-sm font-medium">{calculatePercentage(result.count)} ({result.count})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: calculatePercentage(result.count) }}
                  ></div>
                </div>

                {/* Show voters if the poll is not anonymous and there are votes */}
                {!currentPoll.anonymous && result.voters && result.voters.length > 0 && (
                  <div className="mt-1 ml-2">
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">
                        View voters ({result.voters.length})
                      </summary>
                      <ul className="mt-1 ml-2 space-y-1">
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
            <h3 className="font-medium text-lg">
              {currentPoll.choiceType === "single" ? "Select one option:" : "Select one or more options:"}
            </h3>
            
            {currentPoll.options.map((option, index) => (
              <div 
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedOptions.includes(index) 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 flex-shrink-0 rounded-full border ${
                    selectedOptions.includes(index) 
                      ? "border-blue-500 bg-blue-500" 
                      : "border-gray-300"
                  }`}>
                    {selectedOptions.includes(index) && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <span className="ml-3">{option}</span>
                </div>
              </div>
            ))}

            <Button
              onClick={handleVoteSubmit}
              variant="primary"
              size="lg"
              fullWidth
              disabled={submitting || selectedOptions.length === 0}
              className="mt-6"
            >
              {submitting ? "Submitting..." : "Submit Vote"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}