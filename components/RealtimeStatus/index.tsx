"use client";

import { useRealtime } from "@/context/RealtimeContext";
import { useEffect, useState } from "react";

export function RealtimeStatus() {
  const { polls, votes, isLoading } = useRealtime();
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Track online status
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setLastUpdated(new Date());
      }
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);
  
  // Update timestamp whenever data changes
  useEffect(() => {
    if (!isLoading && (polls.length > 0 || votes.length > 0)) {
      setLastUpdated(new Date());
    }
  }, [polls, votes, isLoading]);
  
  // Format time since last update
  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diffInSeconds < 10) return "just now";
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <div className="animate-pulse h-2 w-2 rounded-full bg-amber-500"></div>
        <span>Connecting to database...</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500">
      <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span>
        {isOnline 
          ? `Live data • Updated ${getTimeSinceUpdate()}`
          : "Offline • Reconnecting..."}
      </span>
    </div>
  );
}