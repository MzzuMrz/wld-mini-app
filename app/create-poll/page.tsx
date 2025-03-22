"use client";
import { useState, FormEvent, useEffect } from "react";
import { Button, Input } from "@worldcoin/mini-apps-ui-kit-react";
import { useVoting } from "@/context/VotingContext";
import { useRouter } from "next/navigation";
import { VerificationLevel, PollVisibility, PollChoice } from "@/types";
import { nanoid } from "nanoid";

export default function CreatePoll() {
  const { createNewPoll, currentUser } = useVoting();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>("device");
  const [visibility, setVisibility] = useState<PollVisibility>("public");
  const [endTimeType, setEndTimeType] = useState<"date" | "duration">("duration");
  const [endTimeDate, setEndTimeDate] = useState("");
  const [endTimeDuration, setEndTimeDuration] = useState("24");
  const [anonymous, setAnonymous] = useState(false);
  const [choiceType, setChoiceType] = useState<PollChoice>("single");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  // Set default date for end time
  useEffect(() => {
    if (!endTimeDate) {
      const now = new Date();
      now.setDate(now.getDate() + 3); // Default to 3 days from now
      
      // Format to YYYY-MM-DDThh:mm
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      setEndTimeDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [endTimeDate]);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const calculateEndTime = (): string => {
    if (endTimeType === "date") {
      return new Date(endTimeDate).toISOString();
    } else {
      const hours = parseInt(endTimeDuration);
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + hours);
      return endTime.toISOString();
    }
  };

  const handleVerificationLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVerificationLevel(e.target.value as VerificationLevel);
  };

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVisibility(e.target.value as PollVisibility);
  };

  const handleChoiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChoiceType(e.target.value as PollChoice);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validation
      if (!title.trim()) {
        throw new Error("Title is required");
      }

      if (title.length > 100) {
        throw new Error("Title must be less than 100 characters");
      }

      const filteredOptions = options.filter(opt => opt.trim() !== "");
      if (filteredOptions.length < 2) {
        throw new Error("At least 2 options are required");
      }

      // Calculate end time
      const endTime = calculateEndTime();

      // Create poll
      const passcode = visibility === "private" ? nanoid(8) : undefined;
      
      const newPoll = await createNewPoll({
        title,
        options: filteredOptions,
        verificationLevel,
        visibility,
        endTime,
        passcode,
        anonymous,
        choiceType,
      });

      // Navigate to vote page to see the list of polls including the new one
      router.push('/vote');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create poll");
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-2xl font-bold text-gray-800">Create a Poll</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 shadow-sm border border-red-100 flex items-start">
          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poll Title/Question
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your question here"
              maxLength={100}
              required
              className="w-full border-gray-300 rounded-lg"
            />
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>{title.length}/100 characters</span>
              {title.length >= 100 && <span className="text-red-500">Maximum length reached</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options (2-5)
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                    className="w-full border-gray-300 rounded-lg"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="ml-2 text-red-500 hover:text-red-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Option
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Level
              </label>
              <select
                value={verificationLevel}
                onChange={handleVerificationLevelChange}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="orb">Orb (highest security)</option>
                <option value="device">Device (app-based)</option>
                <option value="none">None (testing)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poll Visibility
              </label>
              <select
                value={visibility}
                onChange={handleVisibilityChange}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="public">Public (visible to all)</option>
                <option value="private">Private (invited users only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <div className="flex items-center space-x-4 mb-3">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="endTimeType"
                  checked={endTimeType === "duration"}
                  onChange={() => setEndTimeType("duration")}
                  className="form-radio text-blue-600 h-4 w-4"
                />
                <span className="ml-2">Duration</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="endTimeType"
                  checked={endTimeType === "date"}
                  onChange={() => setEndTimeType("date")}
                  className="form-radio text-blue-600 h-4 w-4"
                />
                <span className="ml-2">Specific date</span>
              </label>
            </div>

            {endTimeType === "duration" ? (
              <div className="flex items-center">
                <Input
                  type="number"
                  value={endTimeDuration}
                  onChange={(e) => setEndTimeDuration(e.target.value)}
                  min="1"
                  max="720"
                  required
                  className="w-full border-gray-300 rounded-lg"
                />
                <span className="ml-2 whitespace-nowrap">hours</span>
              </div>
            ) : (
              <Input
                type="datetime-local"
                value={endTimeDate}
                onChange={(e) => setEndTimeDate(e.target.value)}
                required
                className="w-full border-gray-300 rounded-lg"
              />
            )}
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
            />
            <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
              Anonymous Voting (hide voter IDs)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Choice Type
            </label>
            <select
              value={choiceType}
              onChange={handleChoiceTypeChange}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="single">Single choice</option>
              <option value="multi">Multiple choices</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all py-3 text-white rounded-lg shadow-sm hover:shadow-md"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Poll...
              </div>
            ) : (
              "Create Poll"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}