"use client";
import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { Login } from "@/components/Login";
import { useVoting } from "@/context/VotingContext";
import { useRealtime } from "@/context/RealtimeContext";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { Poll } from "@/types";
import { RealtimeStatus } from "@/components/RealtimeStatus";

// Live poll stats component
function PollStats() {
  const { polls, votes, isLoading } = useRealtime();
  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  
  // Update stats whenever polls or votes change
  useEffect(() => {
    if (isLoading) return;
    
    // Get 3 most recent polls
    const recent = [...polls]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    setRecentPolls(recent);
  }, [polls, votes, isLoading]);
  
  return (
    <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Live Platform Stats</h2>
        <RealtimeStatus />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm text-blue-700 mb-1">Total Polls</p>
          <p className="text-2xl font-bold text-blue-800">{isLoading ? "..." : polls.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm text-green-700 mb-1">Total Votes</p>
          <p className="text-2xl font-bold text-green-800">{isLoading ? "..." : votes.length}</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="py-6 text-center">
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : recentPolls.length > 0 ? (
        <>
          <h3 className="text-sm font-medium mb-2 text-gray-700">Recent Polls</h3>
          <div className="space-y-2">
            {recentPolls.map(poll => (
              <div key={poll.id} className="text-xs p-3 bg-gray-50 rounded border border-gray-100">
                <p className="font-medium text-gray-800 truncate">{poll.title}</p>
                <p className="text-gray-500 flex justify-between items-center mt-1">
                  <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {poll.options.length} options
                  </span>
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="py-6 text-center text-gray-500">
          No polls available yet
        </div>
      )}
      
      <div className="flex items-center justify-center mt-4 gap-1 text-xs text-gray-500">
        <span>🔄</span>
        <span>Data automatically syncs between all devices</span>
      </div>
    </section>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useVoting();
  const router = useRouter();

  // Log the current user state whenever it changes (for debugging)
  useEffect(() => {
    console.log("Current user in Home:", currentUser);
  }, [currentUser]);

  useEffect(() => {
    const checkMiniKit = async () => {
      const isInstalled = MiniKit.isInstalled();
      if (isInstalled) {
        setIsLoading(false);
      } else {
        setTimeout(checkMiniKit, 500);
      }
    };

    checkMiniKit();
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-gray-50">
        <div className="flex flex-col items-center justify-center text-center">
          <svg className="animate-spin h-10 w-10 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-900">Loading MiniKit...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-12 bg-gray-50">
      <div className="w-full max-w-md mx-auto space-y-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">World ID Voting</h1>
          <p className="text-sm text-gray-600 mb-8">Create and vote on polls securely with World ID verification</p>
        </div>

        {/* Stats component shows before or after login */}
        <PollStats />

        {!currentUser ? (
          <section className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Login with World ID</h2>
            <Login />
          </section>
        ) : (
          <section className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md border border-gray-100 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Main Menu</h2>
            <div className="flex flex-col space-y-4">
              <Button 
                onClick={() => router.push('/create-poll')}
                variant="primary"
                size="lg"
                fullWidth
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Create a Poll
                </div>
              </Button>
              <Button 
                onClick={() => router.push('/vote')}
                variant="primary"
                size="lg"
                fullWidth
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Vote on a Poll
                </div>
              </Button>
            </div>
          </section>
        )}
        
        <div className="text-center mt-8">
          <RealtimeStatus />
          <p className="text-xs text-gray-500 mt-2">Secured by World ID • {new Date().getFullYear()}</p>
        </div>
      </div>
      
      {/* Add animation styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </main>
  );
}