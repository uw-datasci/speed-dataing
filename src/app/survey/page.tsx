/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Navbar from "../components/Navbar";
import Image from "next/image";
import Logo from "../../../public/images/logo.svg";
import {
  FaArrowUp,
  FaSync,
  FaHeart,
  FaUsers,
  FaVenusMars,
} from "react-icons/fa";
import axios from "axios";
import Footer from "../components/Footer";

const Page = () => {
  const userEmail = useSelector(
    (state: RootState) => state.user.data?.email || null
  );
  const [isFormActive, setIsFormActive] = useState<boolean | null>(null);
  const [sessionState, setSessionState] = useState<string>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(true);
  const [selectedPronouns, setSelectedPronouns] = useState<string>("Select from the following");
  const formRef = useRef<HTMLFormElement>(null);

  const checkFormStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/form-status");
      setIsFormActive(response.data.isActive);
      setSessionState(response.data.sessionState || "idle");
      console.log("[Survey Page] Form status:", response.data);
    } catch (error) {
      console.error("[Survey Page] Error checking form status:", error);
      setError("Failed to check form status");
      setIsFormActive(false);
      setSessionState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingSubmission = useCallback(async () => {
    if (!userEmail) {
      setIsCheckingSubmission(false);
      return;
    }

    try {
      setIsCheckingSubmission(true);
      console.log("[Survey Page] Checking for existing submission...");
      const response = await axios.get(
        `/api/form-submit/check?email=${encodeURIComponent(userEmail)}`
      );

      if (response.data.hasSubmitted) {
        console.log("[Survey Page] User has already submitted");
        setHasSubmitted(true);
      } else {
        console.log("[Survey Page] No existing submission found");
        setHasSubmitted(false);
      }
    } catch (error) {
      console.error("[Survey Page] Error checking existing submission:", error);
      // If there's an error, assume no submission exists
      setHasSubmitted(false);
    } finally {
      setIsCheckingSubmission(false);
    }
  }, [userEmail]);

  // Check submission status immediately when user email becomes available
  useEffect(() => {
    if (userEmail) {
      console.log(
        "[Survey Page] User email available, checking submission status..."
      );
      checkExistingSubmission();
    }
  }, [userEmail, checkExistingSubmission]);

  useEffect(() => {
    checkFormStatus();
  }, []);

  useEffect(() => {
    console.log("[Survey Page] Component mounted/updated");
    console.log("[Survey Page] Current session state:", sessionState);
    console.log("[Survey Page] Form ref:", formRef.current);
    console.log("[Survey Page] Has submitted:", hasSubmitted);
    console.log("[Survey Page] User email:", userEmail);
  }, [sessionState, hasSubmitted, userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Survey Page] Submit button clicked!");
    console.log("[Survey Page] Current session state:", sessionState);
    console.log("[Survey Page] Form event:", e);

    if (sessionState !== "form_active") {
      let message = "Form is currently locked.";
      if (sessionState === "matching_in_progress") {
        message = "Form is locked while matching algorithm is running.";
      } else if (sessionState === "matches_released") {
        message = "Form is locked. Matches have been released.";
      }
      console.log("[Survey Page] Form locked, showing alert:", message);
      alert(message);
      return;
    }

    console.log("[Survey Page] Form is active, proceeding with submission...");
    setIsSubmitting(true);
    setError(null);

    try {
      // Get form data
      const formElement = e.target as HTMLFormElement;
      console.log("[Survey Page] Form element:", formElement);

      // Try both FormData and direct element access
      const formData = new FormData(formElement);

      // Convert FormData to object
      const formDataObject: any = {};
      formData.forEach((value, key) => {
        formDataObject[key] = value;
        console.log(`[Survey Page] FormData - ${key}:`, value);
      });

      // Also try direct element access for textareas
      const textareaFields = [
        "career",
        "friend_traits",
        "self_desc",
        "goal",
        "fun",
        "music",
      ];
      textareaFields.forEach((fieldName) => {
        const textarea = formElement.querySelector(
          `[name="${fieldName}"]`
        ) as HTMLTextAreaElement;
        if (textarea) {
          const value = textarea.value;
          console.log(`[Survey Page] Direct access - ${fieldName}:`, value);
          if (value && value.trim() !== "") {
            formDataObject[fieldName] = value;
          }
        }
      });

      // Check radio button values
      const radioFields = [
        "class_seat",
        "evil_hobby",
        "most_likely_to",
        "caught_watching",
      ];
      radioFields.forEach((fieldName) => {
        const radio = formElement.querySelector(
          `input[name="${fieldName}"]:checked`
        ) as HTMLInputElement;
        if (radio) {
          formDataObject[fieldName] = radio.value;
          console.log(`[Survey Page] Radio - ${fieldName}:`, radio.value);
        }
      });

      console.log("[Survey Page] Final form data collected:", formDataObject);

      // Add the user email if not already present
      if (userEmail && !formDataObject.email) {
        formDataObject.email = userEmail;
      }

      // Client-side validation
      const requiredFields = ["name", "email", "program", "year"];
      const missingFields = requiredFields.filter(
        (field) =>
          !formDataObject[field] ||
          formDataObject[field].toString().trim() === ""
      );

      console.log("[Survey Page] Missing fields:", missingFields);

      if (missingFields.length > 0) {
        setError(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
        setIsSubmitting(false);
        return;
      }

      // Validate pronouns selection
      if (
        !formDataObject.pronouns ||
        formDataObject.pronouns === "Select from the following"
      ) {
        setError("Please select your pronouns");
        setIsSubmitting(false);
        return;
      }

      // Validate year length (max 2 characters as per database constraint)
      if (
        formDataObject.year &&
        formDataObject.year.toString().trim().length > 2
      ) {
        setError('Year must be 2 characters or less (e.g., "2A", "3B")');
        setIsSubmitting(false);
        return;
      }

      // Validate text field lengths (max 500 characters as per database constraints)
      const textFields = [
        "career",
        "friend_traits",
        "self_desc",
        "goal",
        "fun",
        "music",
      ];
      const longFields = textFields.filter(
        (field) =>
          formDataObject[field] &&
          formDataObject[field].toString().trim().length > 500
      );

      if (longFields.length > 0) {
        setError(
          `Please keep your responses under 500 characters: ${longFields.join(
            ", "
          )}`
        );
        setIsSubmitting(false);
        return;
      }

      console.log("[Survey Page] Validation passed, submitting to API...");

      // Submit to API
      const response = await axios.post("/api/form-submit", formDataObject);

      if (response.data.success) {
        console.log(
          "[Survey Page] Form submitted successfully:",
          response.data
        );
        setSubmitSuccess(true);
        setHasSubmitted(true);
        // Redirect to success page or show success message
        setTimeout(() => {
          window.location.href = "/form/success";
        }, 2000);
      }
    } catch (error: any) {
      console.error("[Survey Page] Error submitting form:", error);

      let errorMessage = "Failed to submit form. Please try again.";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        if (error.response.data.missingFields) {
          errorMessage += ` Missing: ${error.response.data.missingFields.join(
            ", "
          )}`;
        }
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#e1eaf8] min-h-screen w-screen">
        <Navbar />
        <div className="pt-12 max-w-4xl mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex space-x-2">
            <div
              className="w-3 h-3 bg-[#374995] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-[#374995] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-[#374995] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
          <p className="mt-4 text-[#374995] text-lg">Checking form status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#e1eaf8] min-h-screen w-screen">
      <Navbar />
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#374995] text-white shadow-md hover:bg-[#2c3d85] transition"
        aria-label="Back to top"
      >
        <FaArrowUp />
      </button>
      <main className="pt-12 max-w-4xl mx-auto px-4 flex flex-col gap-8">
        {/* Form Status Banner */}
        <div
          className={`p-4 rounded-lg border-2 ${
            hasSubmitted
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : sessionState === "form_active"
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : sessionState === "matching_in_progress"
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : sessionState === "matches_released"
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasSubmitted ? (
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              ) : isCheckingSubmission ? (
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              ) : sessionState === "form_active" ? (
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              ) : sessionState === "matching_in_progress" ? (
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              ) : sessionState === "matches_released" ? (
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              ) : (
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
              <span className="font-medium">
                {hasSubmitted
                  ? "Already Submitted"
                  : isCheckingSubmission
                  ? "Checking Submission Status"
                  : sessionState === "form_active"
                  ? "Form is active"
                  : sessionState === "matching_in_progress"
                  ? "Matching in Progress"
                  : sessionState === "matches_released"
                  ? "Matches Released"
                  : "Form is Locked"}
              </span>
            </div>
            <button
              onClick={checkFormStatus}
              disabled={isLoading}
              className="bg-[#374995] text-white px-3 py-1 rounded text-sm hover:bg-[#5989fc] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FaSync className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
          <p className="text-sm mt-1">
            {hasSubmitted
              ? "You have already submitted your survey response. Thank you for participating!"
              : isCheckingSubmission
              ? "Checking if you have already submitted a response..."
              : sessionState === "form_active"
              ? ""
              : sessionState === "matching_in_progress"
              ? "The matching algorithm is currently running. Please wait for matches to be released."
              : sessionState === "matches_released"
              ? "Matches have been released! Check your dashboard to see your matches."
              : "Please wait for the session to begin. The form will be unlocked by administrators."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          ref={formRef}
          className="flex flex-col gap-8"
        >
          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg border-2 border-red-300 bg-red-50 text-red-800">
              <div className="flex items-center gap-2">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success Display */}
          {submitSuccess && (
            <div className="p-4 rounded-lg border-2 border-green-300 bg-green-50 text-green-800">
              <div className="flex items-center gap-2">
                <span className="font-medium">Success!</span>
                <span>Form submitted successfully. Redirecting...</span>
              </div>
            </div>
          )}

          {/* Loading Display */}
          {isCheckingSubmission && (
            <div className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-800">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  Checking submission status...
                </span>
              </div>
            </div>
          )}

          {!hasSubmitted && !isCheckingSubmission && (
            <>
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <Image src={Logo} alt="Logo" className="w-2/5 h-auto" />
              </div>

              <div className="flex flex-col md:flex-row gap-6 justify-between">
                <div className="flex flex-col w-full">
                  <label className="mb-1 text-[#374995] font-jakarta">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="First and Last Name"
                    required
                    disabled={hasSubmitted}
                    className="p-3 rounded-full w-full bg-white text-[#374995] placeholder-[#aabbd7] outline-none font-jakarta disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col w-full">
                  <label className="mb-1 text-[#374995] font-jakarta">
                    Pronouns <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="pronouns"
                    required
                    disabled={hasSubmitted}
                    value={selectedPronouns}
                    onChange={(e) => setSelectedPronouns(e.target.value)}
                    className="px-4 py-3 rounded-full w-full bg-white text-[#374995] placeholder-white outline-none font-jakarta disabled:bg-gray-400 disabled:cursor-not-allowed appearance-none pr-12"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='blue' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 1rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.5em 1.5em",
                    }}
                  >
                    <option>Select from the following</option>
                    <option>She/Her</option>
                    <option>He/Him</option>
                    <option>They/Them</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <div className="flex flex-col w-full">
                  <label className="mb-1 text-[#374995] font-jakarta">
                    DSC Email
                  </label>
                  {userEmail ? (
                    <input
                      type="email"
                      name="email"
                      value={userEmail}
                      disabled
                      className="p-3 rounded-full w-full bg-gray-100 text-black placeholder-[#aabbd7] outline-none font-jakarta cursor-not-allowed"
                    />
                  ) : (
                    <input
                      type="email"
                      name="email"
                      placeholder="Loading your email..."
                      disabled
                      className="p-3 rounded-full w-full bg-gray-100 text-gray-400 placeholder-[#aabbd7] outline-none font-jakarta italic cursor-not-allowed"
                    />
                  )}
                </div>

                <div className="flex flex-col w-full bg-white p-6 rounded-2xl border-2 border-[#aabbd7]">
                  <label className="mb-3 text-[#374995] font-jakarta text-lg font-semibold flex items-center gap-2">
                    <FaHeart className="text-red-400" />
                    Matching Preference <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-[#374995] opacity-75 mb-4">
                    {selectedPronouns === "They/Them" || selectedPronouns === "Other"
                      ? "What gender would you like to be matched with?"
                      : "What is your sexuality?"}
                  </p>
                  <p className="text-xs italic text-[#374995] opacity-75 mb-3">
                    ***Note: We will prioritize your matching preference, however you might not be matched with someone of your selected preference, but you can always make a new friend!
                  </p>

                  <div className="flex flex-col gap-3">
                    {(selectedPronouns === "They/Them" || selectedPronouns === "Other"
                      ? [
                          {
                            value: "3",
                            icon: <FaUsers className="text-blue-500" />,
                            label: "Woman",
                            description: "Match me with women!",
                          },
                          {
                            value: "3",
                            icon: <FaUsers className="text-blue-500" />,
                            label: "Men",
                            description: "Match me with men!",
                          },
                          {
                            value: "3",
                            icon: <FaHeart className="text-pink-500" />,
                            label: "Any",
                            description: "I'm open to being matched with anyone",
                          },
                        ]
                      : [
                          {
                            value: "0",
                            icon: <FaUsers className="text-blue-500" />,
                            label: "Homosexual",
                            description:
                              "Match me with people who identify with the same gender",
                          },
                          {
                            value: "1",
                            icon: <FaVenusMars className="text-purple-500" />,
                            label: "Heterosexual",
                            description:
                              "Match me with people who identify with a different gender",
                          },
                          {
                            value: "2",
                            icon: <FaHeart className="text-pink-500" />,
                            label: "Bisexual/Pansexual",
                            description: "I'm open to being matched with anyone",
                          },
                        ]
                    ).map(({ value, icon, label, description }) => (
                      <label
                        key={label}
                        className="flex items-start gap-4 p-4 rounded-xl border-2 border-[#e1eaf8] hover:border-[#4b6cb7] hover:bg-[#f8fafc] cursor-pointer transition-all"
                      >
                        <input
                          type="radio"
                          name="intention"
                          value={value}
                          required
                          className="mt-1 accent-[#4b6cb7] w-5 h-5"
                        />
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-2xl mt-0.5">{icon}</div>
                          <div className="flex flex-col">
                            <span className="text-[#374995] font-semibold">
                              {label}
                            </span>
                            <span className="text-sm text-[#374995] opacity-60">
                              {description}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col w-full">
                  <label className="mb-1 text-[#374995] font-jakarta">
                    Program <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="program"
                    placeholder="Enter your program (e.g., Computer Science)"
                    required
                    disabled={hasSubmitted}
                    className="p-3 rounded-full w-full bg-white text-[#374995] placeholder-[#aabbd7] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col w-full">
                  <label className="mb-1 text-[#374995] font-jakarta">
                    Year <span className="text-red-500">*</span>{" "}
                    <span className="text-sm text-[#aabbd7]">
                      (max 2 chars)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="year"
                    placeholder="Enter your year (e.g., 2A)"
                    required
                    maxLength={2}
                    disabled={hasSubmitted}
                    className="p-3 rounded-full w-full bg-white text-[#374995] placeholder-[#aabbd7] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col w-full">
                  <label className="mb-1 text-[#374995] font-jakarta">
                    Social Media Links{" "}
                    <span className="text-sm text-[#aabbd7]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="social_media_links"
                    placeholder="Add your Instagram, Discord, etc."
                    disabled={hasSubmitted}
                    className="p-3 rounded-full w-full bg-white text-[#374995] placeholder-[#aabbd7] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Open-Ended Questions */}
              <div className="flex flex-col gap-6 mt-8">
                {[
                  {
                    name: "career",
                    label:
                      "What career are you aiming for? (e.g., data scientist, SWE, quant...)",
                  },
                  {
                    name: "friend_traits",
                    label:
                      "You will meet a new friend today. What personality traits do you hope this new friend possesses?",
                  },
                  {
                    name: "self_desc",
                    label: "What would your friends describe you as?",
                  },
                  {
                    name: "goal",
                    label: "What do you hope to gain out of this experience?",
                  },
                  { name: "fun", label: "What do you like to do for fun?" },
                  {
                    name: "music",
                    label:
                      "What genre of music do you listen to? List some of your favourite artists.",
                  },
                ].map((q, index) => (
                  <div key={index} className="flex flex-col">
                    <label
                      htmlFor={q.name}
                      className="mb-1 text-[#374995] font-jakarta"
                    >
                      {q.label}
                    </label>
                    <div className="relative">
                      <textarea
                        id={q.name}
                        name={q.name}
                        rows={4}
                        maxLength={500}
                        placeholder="Type your response here..."
                        disabled={hasSubmitted}
                        className="p-4 rounded-2xl w-full bg-white text-[#374995] placeholder-[#aabbd7] resize-none outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        onChange={(e) => {
                          const charCount = e.target.value.length;
                          const counter =
                            e.target.parentElement?.querySelector(
                              ".char-counter"
                            );
                          if (counter) {
                            counter.textContent = `${charCount}/500`;
                            if (charCount > 450) {
                              counter.className =
                                "char-counter text-red-500 text-xs absolute bottom-2 right-4";
                            } else {
                              counter.className =
                                "char-counter text-[#aabbd7] text-xs absolute bottom-2 right-4";
                            }
                          }
                        }}
                      />
                      <span className="char-counter text-[#aabbd7] text-xs absolute bottom-2 right-4">
                        0/500
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Multiple Choice Questions */}
              <div className="flex flex-col gap-8 mt-12">
                {/* Question 1 */}
                <div>
                  <p className="text-[#374995] font-jakarta mb-2">
                    In class, I...
                  </p>
                  {[
                    {
                      value: "a",
                      label:
                        "Sit in the front of class and try to absorb as much info as I can.",
                    },
                    {
                      value: "b",
                      label: "Sit in the back and play Clash Royale.",
                    },
                    {
                      value: "c",
                      label: "Sit somewhere in the middle, with my friends.",
                    },
                    { value: "d", label: "I do not go to class ;-;" },
                    { value: "e", label: "Lowkey I be the professor bro." },
                  ].map(({ value, label }, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 mb-2 text-[#374995]"
                    >
                      <input
                        type="radio"
                        name="class_seat"
                        value={value}
                        disabled={hasSubmitted}
                        className="accent-[#4b6cb7] disabled:opacity-50"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Question 2 */}
                <div>
                  <p className="text-[#374995] font-jakarta mb-2">
                    Pick your favourite evil hobby:
                  </p>
                  {[
                    { value: "a", label: "Gossiping the latest tea" },
                    {
                      value: "b",
                      label: "Splurging money on (useless?) items",
                    },
                    { value: "c", label: "Mukbanging food" },
                    {
                      value: "d",
                      label: "Entering a ranked match in Valorant",
                    },
                    { value: "e", label: "Going down Wikipedia rabbit holes" },
                  ].map(({ value, label }, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 mb-2 text-[#374995]"
                    >
                      <input
                        type="radio"
                        name="evil_hobby"
                        value={value}
                        disabled={hasSubmitted}
                        className="accent-[#4b6cb7] disabled:opacity-50"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Question 3 */}
                <div>
                  <p className="text-[#374995] font-jakarta mb-2">
                    I am most likely to...
                  </p>
                  {[
                    {
                      value: "a",
                      label: "Become a UW blogger on Instagram reels",
                    },
                    { value: "b", label: "Eat a Lazeeza (Lazeez pizza)" },
                    {
                      value: "c",
                      label: "Disappear from campus and not tell anyone",
                    },
                    { value: "d", label: "Sleep through a midterm" },
                    { value: "e", label: "Start a business" },
                  ].map(({ value, label }, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 mb-2 text-[#374995]"
                    >
                      <input
                        type="radio"
                        name="most_likely_to"
                        value={value}
                        disabled={hasSubmitted}
                        className="accent-[#4b6cb7] disabled:opacity-50"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Question 4 */}
                <div>
                  <p className="text-[#374995] font-jakarta mb-2">
                    You&apos;re most likely to catch me watching...
                  </p>
                  {[
                    { value: "a", label: "Wooden soup ASMR" },
                    {
                      value: "b",
                      label: "1-hour mock SWE interview + solutions LEAKED!!!!",
                    },
                    { value: "c", label: "How to recover from a bad exam" },
                    {
                      value: "d",
                      label:
                        "Can 100,000 Elephants defeat 1 MILLION Ostriches?",
                    },
                    {
                      value: "e",
                      label: "How to make a matcha strawberry latte",
                    },
                  ].map(({ value, label }, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 mb-2 text-[#374995]"
                    >
                      <input
                        type="radio"
                        name="caught_watching"
                        value={value}
                        disabled={hasSubmitted}
                        className="accent-[#4b6cb7] disabled:opacity-50"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  sessionState !== "form_active" || isSubmitting || hasSubmitted
                }
                onClick={() => {
                  console.log(
                    "[Survey Page] Submit button clicked via onClick!"
                  );
                  console.log("[Survey Page] Form ref:", formRef.current);
                  console.log("[Survey Page] Session state:", sessionState);
                  console.log("[Survey Page] Is submitting:", isSubmitting);
                  console.log("[Survey Page] Has submitted:", hasSubmitted);

                  // Test manual form submission if form submission doesn't work
                  if (
                    formRef.current &&
                    sessionState === "form_active" &&
                    !isSubmitting &&
                    !hasSubmitted
                  ) {
                    console.log(
                      "[Survey Page] Attempting manual form submission..."
                    );
                    // Trigger form submission manually
                    const submitEvent = new Event("submit", {
                      bubbles: true,
                      cancelable: true,
                    });
                    formRef.current.dispatchEvent(submitEvent);
                  }
                }}
                className={`py-3 px-6 rounded-full w-full text-lg font-jakarta transition-colors ${
                  sessionState === "form_active" &&
                  !isSubmitting &&
                  !hasSubmitted
                    ? "bg-[#4b6cb7] hover:bg-[#3f5cb1] text-white cursor-pointer"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed"
                }`}
              >
                {isSubmitting
                  ? "Submitting..."
                  : sessionState === "form_active"
                  ? "Submit Survey"
                  : sessionState === "matching_in_progress"
                  ? "Matching in Progress..."
                  : sessionState === "matches_released"
                  ? "Matches Released"
                  : "Form is Locked"}
              </button>
            </>
          )}

          {/* Show completion message when already submitted */}
          {hasSubmitted && !isCheckingSubmission && (
            <div className="flex flex-col items-center justify-center text-center gap-6 py-12">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#374995] mb-2">
                  Survey Completed!
                </h2>
                <p className="text-[#374995] opacity-75">
                  Thank you for participating in Speed Dataing!
                  <br />
                  Your responses have been recorded and will be used for
                  matching.
                </p>
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => (window.location.href = "/dashboard")}
                  className="bg-[#374995] text-white px-6 py-2 rounded-full hover:bg-[#5989fc] transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => (window.location.href = "/history")}
                  className="bg-[#A6C3EA] text-white px-6 py-2 rounded-full hover:bg-[#8bb3e8] transition-colors"
                >
                  View Previous Matches
                </button>
              </div>
            </div>
          )}

          <Footer />
        </form>
      </main>
    </div>
  );
};

export default Page;
