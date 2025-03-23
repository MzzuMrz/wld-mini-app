"use client";
import { useState, useEffect } from "react";
import { useVoting } from "@/context/VotingContext";
import { useRouter } from "next/navigation";
import { PollVisibility, VerificationLevel, PollChoice } from "@/types";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

export default function CreatePollPage() {
  const router = useRouter();
  const { currentUser, createNewPoll } = useVoting();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>("none");
  const [visibility, setVisibility] = useState<PollVisibility>("public");
  const [anonymous, setAnonymous] = useState(false);
  const [choiceType, setChoiceType] = useState<PollChoice>("single");
  const [duration, setDuration] = useState(24);
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdPollId, setCreatedPollId] = useState("");
  const [createdPollPasscode, setCreatedPollPasscode] = useState("");
  const [isPrivatePollCreated, setIsPrivatePollCreated] = useState(false);

  // Usar useEffect en lugar de redirección inmediata
  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim() === "") {
      setError("Please enter a poll title");
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      setError("Please enter at least 2 options");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + duration);

      const newPoll = await createNewPoll({
        title,
        options: validOptions,
        verificationLevel,
        visibility,
        anonymous,
        choiceType,
        endTime: endTime.toISOString(),
        passcode: visibility === "private" ? passcode : undefined
      });

      // Debugging logs
      console.log("Poll created:", newPoll);
      
      if (visibility === 'private') {
        console.log("Private poll created with passcode:", newPoll.passcode);
        
        // Save poll info
        setCreatedPollId(newPoll.id);
        setCreatedPollPasscode(newPoll.passcode || passcode || "");
        setIsPrivatePollCreated(true);
        setSuccessMessage("Private poll created successfully! Save the information below:");
      } else {
        setSuccessMessage("Poll created successfully!");
        setTimeout(() => {
          router.push("/vote");
        }, 2000);
      }
    } catch (err) {
      console.error("Error creating poll:", err);
      setError("Failed to create poll. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state if currentUser is null
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center p-4">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-blue-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-lg mx-auto pt-6">
          <div className="flex items-center mb-6">
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              size="sm"
              className="mr-2 text-gray-400 hover:text-white"
            >
              ← Back
            </Button>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
              Create Poll
            </h1>
          </div>

          {error && (
            <div className="bg-red-900/30 text-red-300 border border-red-800/50 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-900/30 text-green-300 border border-green-800/50 p-4 rounded-lg mb-6">
              <p className="font-medium">{successMessage}</p>
              
              {isPrivatePollCreated && (
                <div className="mt-2 bg-black/50 p-4 rounded border border-green-800/50">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Poll ID:</span>
                    <span className="font-mono text-gray-300">{createdPollId}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="font-medium">Passcode:</span>
                    <span className="font-mono text-gray-300">{createdPollPasscode}</span>
                  </div>
                  <Button
                    onClick={() => router.push(`/poll/${createdPollId}`)}
                    className="w-full futuristic-button"
                  >
                    Go to Poll
                  </Button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleCreatePoll} className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-6 shadow-lg animated-bg">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Poll Title/Question
                </label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What would you like to ask?"
                  className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  rows={2}
                  maxLength={100}
                />
                <p className="text-xs text-gray-400 mt-1">{title.length}/100 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Options
                </label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-grow p-3 bg-gray-800/80 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="ml-2 text-red-400 hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 10 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-3 text-blue-400 hover:text-blue-300 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Option
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Verification Level
                  </label>
                  <select
                    value={verificationLevel}
                    onChange={(e) => setVerificationLevel(e.target.value as VerificationLevel)}
                    className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  >
                    <option value="none">None (Anyone can vote)</option>
                    <option value="device">Device Verification</option>
                    <option value="orb">Orb Verification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Poll Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as PollVisibility)}
                    className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  >
                    <option value="public">Public (Visible to everyone)</option>
                    <option value="private">Private (Require passcode)</option>
                  </select>
                </div>
              </div>

              {visibility === "private" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Poll Passcode
                  </label>
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Set a passcode for your private poll"
                    className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Share this passcode with people you want to invite
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Poll Duration
                </label>
                <select
                  value={duration.toString()}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">3 days</option>
                  <option value="168">1 week</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Voting Type
                </label>
                <div className="flex space-x-4 py-2">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      checked={choiceType === "single"} 
                      onChange={() => setChoiceType("single")}
                      className="form-radio h-4 w-4 text-blue-500 bg-gray-800 border-gray-700"
                    />
                    <span className="ml-2 text-gray-300">Single Choice</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      checked={choiceType === "multi"} 
                      onChange={() => setChoiceType("multi")}
                      className="form-radio h-4 w-4 text-blue-500 bg-gray-800 border-gray-700"
                    />
                    <span className="ml-2 text-gray-300">Multiple Choices</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-b border-gray-800 my-2">
                <label className="text-sm font-medium text-gray-300">
                  Anonymous Voting
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={() => setAnonymous(!anonymous)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 futuristic-button"
              >
                {submitting ? "Creating Poll..." : "Create Poll"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}