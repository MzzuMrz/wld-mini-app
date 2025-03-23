"use client";

import { useVoting } from "@/context/VotingContext";
import { useRealtime } from "@/context/RealtimeContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MiniKit } from "@worldcoin/minikit-js";
import { Poll, Vote } from "@/types";

// Import collectible card component
import CollectibleCard from "@/components/collectibles/collectible-card";

export default function ProfilePage() {
  const { currentUser, collectibles } = useVoting();
  const { votes, polls } = useRealtime();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [userVotes, setUserVotes] = useState<{vote: Vote, poll: Poll}[]>([]);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Check auth status and redirect if needed
  useEffect(() => {
    // Only run on client-side
    if (!isClient) return;
    
    const checkAuth = () => {
      if (!currentUser || !MiniKit.isInstalled() || !MiniKit.user) {
        console.log("User not authenticated, redirecting to home");
        router.push("/");
      }
    };
    
    checkAuth();
  }, [currentUser, router, isClient]);
  
  // Get user's votes
  useEffect(() => {
    if (currentUser && votes.length > 0 && polls.length > 0) {
      // Get votes made by current user based on wallet or worldHumanId
      const userVoteItems = votes.filter(vote => 
        vote.userId === currentUser.walletAddress || 
        (vote.voterId && vote.voterId === currentUser.worldHumanId)
      );
      
      // Match votes with non-anonymous polls
      const votesWithPolls = userVoteItems
        .map(vote => {
          const poll = polls.find(p => p.id === vote.pollId);
          return poll && !poll.anonymous ? { vote, poll } : null;
        })
        .filter(item => item !== null) as {vote: Vote, poll: Poll}[];
      
      setUserVotes(votesWithPolls);
    }
  }, [currentUser, votes, polls]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (MiniKit && MiniKit.close) {
        MiniKit.close();
      }
      
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-medium text-blue-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    // Instead of immediately returning null, show a brief message before redirect happens
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg font-medium text-blue-400">Please log in to view your profile</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <main className="container mx-auto px-4 pt-6">
        <div className="flex items-center justify-between w-full max-w-4xl mx-auto mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => router.push('/')}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Home
          </Button>
          <h1 className="text-xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Your Profile</h1>
          <div className="w-24"></div> {/* Empty div for balance */}
        </div>
        
        <div className="flex flex-col items-center justify-center max-w-4xl mx-auto mt-4 space-y-6">
          {/* Profile card */}
          <Card className="w-full bg-gradient-to-b from-gray-900 to-black border border-gray-800 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-xl">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-700 w-full h-full flex items-center justify-center text-white text-xl font-bold">
                  {currentUser.username?.charAt(0) || currentUser.walletAddress.substring(0, 2)}
                </div>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tighter">
                  {currentUser.username || 'Anonymous User'}
                </h1>
                <p className="text-gray-400 text-sm mt-1 font-mono">
                  {currentUser.walletAddress.substring(0, 6)}...{currentUser.walletAddress.substring(currentUser.walletAddress.length - 4)}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge 
                    className={`${
                      currentUser.verificationLevel === 'orb' 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                    }`}
                  >
                    {currentUser.verificationLevel === 'orb' ? 'Orb Verified' : 'Device Verified'}
                  </Badge>
                  
                  {collectibles?.length > 0 && (
                    <Badge variant="outline" className="bg-black/30">
                      {collectibles.length} Collectible{collectibles.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-800 text-red-400 hover:bg-red-900/30"
              >
                Logout
              </Button>
            </div>
          </Card>
          
          {/* Collectibles section */}
          <div className="w-full mt-8">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2">
              Your Collectibles
            </h2>
            
            {collectibles?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {collectibles.map((collectible) => (
                  <CollectibleCard
                    key={collectible.id}
                    collectible={collectible}
                    showDate
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-900/50 rounded-lg border border-gray-800">
                <h3 className="text-lg font-medium text-gray-400">No collectibles yet</h3>
                <p className="text-gray-500 mt-2">
                  Vote on polls to earn unique collectibles!
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push('/')}
                >
                  Browse Polls
                </Button>
              </div>
            )}
          </div>
          
          {/* Voting History Section */}
          <div className="w-full mt-8">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2">
              Your Voting History
            </h2>
            
            {userVotes.length > 0 ? (
              <div className="space-y-4">
                {userVotes.map(({vote, poll}) => (
                  <Card 
                    key={vote.id} 
                    className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 overflow-hidden animated-bg"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{poll.title}</h3>
                          <p className="text-gray-400 text-sm">
                            Voted on {new Date(vote.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          onClick={() => router.push(`/poll/${poll.id}`)}
                        >
                          View Poll
                        </Button>
                      </div>
                      
                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-gray-300 font-medium">Your choice{vote.choices.length > 1 ? 's' : ''}:</p>
                        <div className="flex flex-wrap gap-2">
                          {vote.choices.map(choiceIndex => (
                            <Badge
                              key={choiceIndex}
                              className="bg-blue-900/30 text-blue-300 border border-blue-800/50"
                            >
                              {poll.options[choiceIndex]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-900/50 rounded-lg border border-gray-800">
                <h3 className="text-lg font-medium text-gray-400">No public votes yet</h3>
                <p className="text-gray-500 mt-2">
                  Only votes on non-anonymous polls are shown here.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push('/vote')}
                >
                  Browse Polls
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}