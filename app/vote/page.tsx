"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { Button, Input } from "@worldcoin/mini-apps-ui-kit-react";
import { useVoting } from "@/context/VotingContext";
import { useRouter } from "next/navigation";
import { Poll } from "@/types";
import { RealtimeStatus } from "@/components/RealtimeStatus";
import { retryOperation } from "@/utils/firebase";

// Componente memo para mejorar rendimiento
const PollCard = memo(({ poll, router }: { poll: Poll, router: any }) => {
  const isExpired = new Date(poll.endTime) < new Date();
  
  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    // If less than 0, it's expired
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m remaining`;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 transition-all hover:shadow-md border border-gray-100">
      <h3 className="font-semibold text-lg mb-2 text-gray-800">{poll.title}</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          poll.verificationLevel === "orb" 
            ? "bg-green-100 text-green-800" 
            : poll.verificationLevel === "device" 
            ? "bg-blue-100 text-blue-800" 
            : "bg-gray-100 text-gray-800"
        }`}>
          {poll.verificationLevel === "orb" ? "Orb Verified" : 
           poll.verificationLevel === "device" ? "Device Verified" : "No Verification"}
        </span>
        
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          poll.choiceType === "single" 
            ? "bg-purple-100 text-purple-800"
            : "bg-indigo-100 text-indigo-800"
        }`}>
          {poll.choiceType === "single" ? "Single Choice" : "Multiple Choice"}
        </span>
        
        {poll.anonymous && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
            Anonymous
          </span>
        )}
      </div>
      
      <div className="text-sm text-gray-500 mb-4">
        {isExpired ? (
          <span className="text-red-500 font-medium">Poll has ended</span>
        ) : (
          <span className="font-medium">{formatTimeRemaining(poll.endTime)}</span>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {poll.options.length} options
        </div>
        <Button
          onClick={() => router.push(`/poll/${poll.id}`)}
          variant="primary"
          size="sm"
          disabled={isExpired}
          className={isExpired 
            ? "bg-gray-400 hover:bg-gray-500" 
            : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          }
        >
          {isExpired ? "View Results" : "Vote Now"}
        </Button>
      </div>
    </div>
  );
});

PollCard.displayName = 'PollCard';

export default function Vote() {
  const { currentUser, fetchPublicPolls, fetchPrivatePoll } = useVoting();
  const router = useRouter();

  const [publicPolls, setPublicPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  // Función memoizada para cargar encuestas
  const loadPublicPolls = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      console.log("Fetching polls for user with verification level:", currentUser?.verificationLevel);
      // Usar retryOperation para manejar fallos de conexión
      const polls = await retryOperation(() => fetchPublicPolls(currentUser?.verificationLevel));
      console.log("Fetched polls:", polls.length);
      setPublicPolls(polls);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error loading polls:", err);
      setError("Failed to load polls");
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchPublicPolls]);

  // Load public polls when component mounts or when verification level changes
  useEffect(() => {
    if (currentUser) {
      loadPublicPolls();
    }
  }, [currentUser, loadPublicPolls]);
  
  // Refresh polls when page gets focus, con límite de frecuencia
  useEffect(() => {
    let lastRefreshTime = Date.now();
    const REFRESH_INTERVAL = 10000; // Mínimo 10 segundos entre actualizaciones
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        const now = Date.now();
        if (now - lastRefreshTime > REFRESH_INTERVAL) {
          lastRefreshTime = now;
          loadPublicPolls().catch(err => {
            console.error("Error refreshing polls:", err);
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, loadPublicPolls]);

  const handleJoinPrivatePoll = async () => {
    if (!passcode.trim()) {
      setError("Please enter a valid passcode");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Usar retryOperation para manejar fallos de conexión
      const poll = await retryOperation(() => fetchPrivatePoll(passcode));
      if (poll) {
        router.push(`/poll/${poll.id}`);
      } else {
        setError("Invalid passcode or poll not found");
      }
    } catch (err) {
      console.error("Error joining private poll:", err);
      setError("Failed to join poll");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null; // Early return if not logged in (redirect happens in useEffect)
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-gray-900 mr-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-800">Vote on Polls</h1>
          <RealtimeStatus />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-center space-x-2 mb-6 bg-white rounded-lg shadow-sm p-1 border border-gray-100">
          <button
            onClick={() => setPrivateMode(false)}
            className={`px-4 py-2 rounded-md transition-all flex-1 ${
              !privateMode
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Public Polls
          </button>
          <button
            onClick={() => setPrivateMode(true)}
            className={`px-4 py-2 rounded-md transition-all flex-1 ${
              privateMode
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Private Poll
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 shadow-sm border border-red-100 flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            {error}
          </div>
        )}

        {privateMode ? (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Poll Passcode
                </label>
                <Input
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full border-gray-300 rounded-lg"
                />
                <p className="mt-1 text-xs text-gray-500">Enter the passcode shared by the poll creator</p>
              </div>
              <Button
                onClick={handleJoinPrivatePoll}
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </div>
                ) : (
                  "Join Poll"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!loading && !error && (
              <div className="text-xs text-gray-500 mb-2">
                Last refreshed: {lastRefreshed.toLocaleTimeString()}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-sm border border-gray-100">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-3 text-gray-700">Loading polls...</span>
              </div>
            ) : publicPolls.length > 0 ? (
              <div className="space-y-4">
                {publicPolls.map(poll => (
                  <PollCard key={poll.id} poll={poll} router={router} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p className="text-gray-500">No public polls available for your verification level</p>
                <p className="text-sm text-gray-400 mt-1">Try creating your own poll!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}