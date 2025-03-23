"use client";
import { useState, useEffect } from "react";
import { Button, Input, Switch, RadioGroup } from "@worldcoin/mini-apps-ui-kit-react";
import { useVoting } from "@/context/VotingContext";
import { useRouter } from "next/navigation";
import { PollVisibility, VerificationLevel, PollChoice } from "@/types";

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

  // Mostrar un estado de carga si currentUser es null
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto p-4 md:p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push("/vote")}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-gray-900 mr-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Create Poll</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 shadow-sm border border-red-100">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 shadow-sm border border-green-100">
          <p className="font-medium">{successMessage}</p>
          
          {isPrivatePollCreated && (
            <div className="mt-2 bg-white p-3 rounded border border-green-200">
              <div className="flex justify-between mb-1">
                <span className="font-medium">Poll ID:</span>
                <span className="font-mono">{createdPollId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Passcode:</span>
                <span className="font-mono">{createdPollPasscode}</span>
              </div>
              <Button
                onClick={() => router.push(`/poll/${createdPollId}`)}
                variant="primary"
                size="sm"
                className="mt-3 w-full"
              >
                Go to Poll
              </Button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleCreatePoll} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poll Title/Question
            </label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to ask?"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-grow"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
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
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Option
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Level
            </label>
            <select
              value={verificationLevel}
              onChange={(e) => setVerificationLevel(e.target.value as VerificationLevel)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="none">None (Anyone can vote)</option>
              <option value="device">Device Verification</option>
              <option value="orb">Orb Verification</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poll Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as PollVisibility)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="public">Public (Visible to everyone)</option>
              <option value="private">Private (Require passcode)</option>
            </select>
          </div>

          {visibility === "private" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poll Passcode
              </label>
              <Input
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Set a passcode for your private poll"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Share this passcode with people you want to invite
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poll Duration
            </label>
            <select
              value={duration.toString()}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voting Type
            </label>
            <RadioGroup
              value={choiceType}
              onChange={(value) => setChoiceType(value as PollChoice)}
              options={[
                { value: "single", label: "Single Choice" },
                { value: "multi", label: "Multiple Choices" }
              ]}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Anonymous Voting
            </label>
            <Switch
              checked={anonymous}
              onChange={setAnonymous}
              size="md"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting}
            className="mt-4"
          >
            {submitting ? "Creating Poll..." : "Create Poll"}
          </Button>
        </div>
      </form>
    </div>
  );
}