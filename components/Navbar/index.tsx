"use client";

import { useVoting } from "@/context/VotingContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MiniKit } from "@worldcoin/minikit-js";
import { useEffect, useState } from "react";

export function Navbar() {
  const { currentUser, collectibles } = useVoting();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleProfileClick = () => {
    router.push("/profile");
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  if (!isClient) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/60 border-b border-gray-800">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        {/* Logo/Home section */}
        <div onClick={handleHomeClick} className="cursor-pointer flex items-center space-x-2">
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
            WLD Poll
          </div>
        </div>

        {/* Profile section */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <>
              {collectibles?.length > 0 && (
                <Badge variant="outline" className="bg-black/30 text-xs">
                  {collectibles.length} Collectible{collectibles.length !== 1 ? 's' : ''}
                </Badge>
              )}
              
              {/* Verification status badge */}
              <Badge 
                className={`${
                  currentUser.verificationLevel === 'orb' 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                }`}
              >
                {currentUser.verificationLevel === 'orb' ? 'Orb Verified' : 'Device Verified'}
              </Badge>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="p-0 rounded-full overflow-hidden border border-gray-700"
                onClick={handleProfileClick}
              >
                <Avatar className="h-8 w-8">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-700 w-full h-full flex items-center justify-center text-white font-semibold">
                    {currentUser.username?.charAt(0) || currentUser.walletAddress.substring(0, 2)}
                  </div>
                </Avatar>
              </Button>
            </>
          )}
          
          {!currentUser && (
            <Button 
              size="sm" 
              variant="outline"
              className="bg-blue-600/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/50"
              onClick={() => MiniKit.open?.()}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}