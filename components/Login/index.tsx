"use client";
import { MiniKit, WalletAuthInput } from "@worldcoin/minikit-js";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useCallback, useEffect, useState } from "react";
import { useVoting } from "@/context/VotingContext";
import Image from "next/image";

const walletAuthInput = (nonce: string): WalletAuthInput => {
    return {
        nonce,
        requestId: "0",
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: "This is my statement and here is a link https://worldcoin.com/apps",
    };
};

type User = {
    walletAddress: string;
    username: string | null;
    profilePictureUrl: string | null;
};

export const Login = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const { setCurrentUser } = useVoting();
    
    const refreshUserData = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    setUser(data.user);
                    // Update VotingContext with the authenticated user
                    setCurrentUser({
                        ...data.user,
                        worldHumanId: MiniKit.user.id, // Use MiniKit user ID as World ID
                        verificationLevel: 'device' // Default to device verification
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }, [setCurrentUser]);
    
    useEffect(() => {
        refreshUserData();
    }, [refreshUserData]);
    
    const handleLogin = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/nonce`);
            const { nonce } = await res.json();

            const { finalPayload } = await MiniKit.commandsAsync.walletAuth(walletAuthInput(nonce));

            if (finalPayload.status === 'error') {
                setLoading(false);
                return;
            } else {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        payload: finalPayload,
                        nonce,
                    }),
                });

                if (response.status === 200) {
                    setUser(MiniKit.user);
                    // Update VotingContext with the authenticated user from MiniKit
                    setCurrentUser({
                        walletAddress: MiniKit.user.walletAddress,
                        username: MiniKit.user.username,
                        profilePictureUrl: MiniKit.user.profilePictureUrl,
                        worldHumanId: MiniKit.user.id, // Use MiniKit user ID as World ID
                        verificationLevel: 'device' // Default to device verification
                    });
                }
                setLoading(false);
            }
        } catch (error) {
            console.error("Login error:", error);
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
            
            setUser(null);
            // Clear user from VotingContext
            setCurrentUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div className="flex flex-col items-center">
            {!user ? (
                <Button 
                    onClick={handleLogin} 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                    {loading ? "Connecting..." : "Login with World ID"}
                </Button>
            ) : (
                <div className="flex flex-col items-center space-y-2 w-full">
                    <div className="text-green-600 font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        Connected
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-2 w-full justify-center">
                        {user?.profilePictureUrl ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                                {/* Replace with Image when using real data */}
                                <img
                                    src={user.profilePictureUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        )}
                        <span className="font-medium text-gray-800">
                            {user?.username || user?.walletAddress.slice(0, 6) + '...' + user?.walletAddress.slice(-4)}
                        </span>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="secondary"
                        size="md"
                        fullWidth
                        disabled={loading}
                        className="mt-2 border border-gray-300 hover:bg-gray-100 transition-all"
                    >
                        {loading ? "Signing Out..." : "Sign Out"}
                    </Button>
                </div>
            )}
        </div>
    )
};
