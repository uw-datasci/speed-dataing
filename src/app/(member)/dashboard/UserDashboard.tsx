/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useState, useEffect } from "react";
import CardButton from "@/app/components/CardButton";
import axios from "axios";
import { FaSync } from "react-icons/fa";
import MatchComponent from "./DefaultMatch";

export default function UserDashboard() {
  const router = useRouter();
  const fullName = useSelector((state: RootState) => state.user.data?.name);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sessionState, setSessionState] = useState<string>("idle");
  const [isrefreshing, setIsrefreshing] = useState(false);
  const [nextRoundStatus, setNextRoundStatus] = useState<{
    hasResponse: boolean;
    optedIn: boolean;
  } | null>(null);
  const [isOptingIn, setIsOptingIn] = useState(false);
  const [optInError, setOptInError] = useState("");

  const checkSessionState = async () => {
    try {
      setIsrefreshing(true);
      const response = await axios.get("/api/form-status");
      setSessionState(response.data.sessionState || "idle");
      console.log(
        "[User Dashboard] Session state:",
        response.data.sessionState
      );
    } catch (error) {
      console.error("[User Dashboard] Error checking session state:", error);
      setSessionState("idle");
    } finally {
      setIsrefreshing(false);
    }
  };

  useEffect(() => {
    checkSessionState();
  }, []);

  useEffect(() => {
    if (fullName) {
      const timer = setTimeout(() => {
        const processedName =
          fullName.split(" ")[0].toLowerCase().charAt(0).toUpperCase() +
          fullName.split(" ")[0].toLowerCase().slice(1);
        setUserName(processedName);
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [fullName]);

  useEffect(() => {
    if (sessionState !== "matches_released") {
      setNextRoundStatus(null);
      setOptInError("");
      return;
    }

    let cancelled = false;
    axios
      .get("/api/user/next-round-opt-in")
      .then(({ data }) => {
        if (!cancelled) setNextRoundStatus(data);
      })
      .catch((error) => {
        console.error("[User Dashboard] Failed to load next-round opt-in:", error);
        const message = axios.isAxiosError(error) &&
          typeof error.response?.data?.error === "string"
          ? error.response.data.error
          : "Could not load your next-round opt-in status.";
        if (!cancelled) setOptInError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionState]);

  const handleNextRoundOptInChange = async (optedIn: boolean) => {
    setIsOptingIn(true);
    setOptInError("");
    try {
      const { data } = await axios.post("/api/user/next-round-opt-in", { optedIn });
      setNextRoundStatus({ hasResponse: true, optedIn: data.optedIn });
    } catch (error) {
      console.error("[User Dashboard] Failed to opt in to next round:", error);
      const message = axios.isAxiosError(error) &&
        typeof error.response?.data?.error === "string"
        ? error.response.data.error
        : "Could not save your choice. Please try again.";
      setOptInError(message);
    } finally {
      setIsOptingIn(false);
    }
  };

  type ButtonType = "start" | "running" | "locked";
  const getButtonType = (): ButtonType => {
    if (sessionState === "form_active") return "running";
    if (sessionState === "matches_released") return "start";
    return "locked";
  };

  const buttonType: ButtonType = getButtonType();
  const isFormClickable = sessionState === "form_active";

  const handleFormClick = () => {
    if (isFormClickable) {
      router.push("/survey");
    } else {
      // Show alert or notification that form is not available
      alert(
        `Form is currently ${
          sessionState === "idle"
            ? "not started"
            : sessionState === "matching_in_progress"
            ? "locked while matching is in progress"
            : "locked"
        }. Please wait for the session to begin.`
      );
    }
  };

  const handleMatchClick = () => {
    if (sessionState === "matches_released") {
      router.push("/match");
    } else {
      alert(
        "Matches have not been released yet. Please wait for the matching process to complete."
      );
    }
  };

  return (
    <div className="w-screen p-6 lg:p-16 bg-valentine-light rounded-t-4xl">
      <header>
        <h1 className="text-xl text-center font-semibold py-5 lg:text-6xl mt-1 text-valentine-pink lg:pb-3 px-8">
          Ready to meet the <span className="text-valentine-red">match</span> of your
          life, <span className="font-bold animate-pulse">{userName}</span>?
        </h1>
        <button
          onClick={checkSessionState}
          disabled={isrefreshing}
          className="text-sm text-valentine-lightPink hover:text-valentine-red transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto mt-2"
        >
          <FaSync
            className={`inline-block mr-2 ${
              isrefreshing ? "animate-spin" : ""
            }`}
          />
          {isrefreshing ? "refreshing..." : "refresh"}
        </button>
      </header>

      <main className="mt-4 lg:mt-8 grid grid-cols-2 gap-4 lg:gap-8 max-w-4xl mx-auto">
        <div className="flex justify-center">
          <CardButton
            type={buttonType}
            onClick={handleFormClick}
            disabled={!isFormClickable}
          />
        </div>
        <div className="flex justify-center">
          <CardButton
            type="match"
            onClick={handleMatchClick}
            disabled={sessionState !== "matches_released"}
          />
        </div>
      </main>

      {sessionState === "matches_released" &&
        (nextRoundStatus?.hasResponse || optInError) && (
        <section className="mt-8 mx-auto max-w-4xl rounded-2xl bg-gradient-to-br from-white to-[#E6EFFD] p-6 shadow-lg sm:p-8">
          {nextRoundStatus?.hasResponse && (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <h2 className="mt-1 text-xl font-bold text-valentine-red sm:text-2xl">
                  Next round opt-in
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-valentine-red/80 sm:text-base">
                  Keep your response available for matching next round. You can
                  change your choice any time before this round resets.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={nextRoundStatus.optedIn}
                aria-label="Keep my response for the next matching round"
                onClick={() => handleNextRoundOptInChange(!nextRoundStatus.optedIn)}
                disabled={isOptingIn}
                className={`relative inline-flex h-12 w-24 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-valentine-red/30 disabled:cursor-not-allowed disabled:opacity-60 ${
                    nextRoundStatus.optedIn ? "bg-valentine-red" : "bg-gray-400"
                  }`}
                >
                  <span
                    className={`z-10 inline-block h-9 w-9 transform rounded-full bg-white shadow-md transition-transform ${
                      nextRoundStatus.optedIn ? "translate-x-[3.25rem]" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}
          {optInError && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {optInError}
            </p>
          )}
          {isOptingIn && (
            <p className="mt-3 text-sm text-valentine-red" role="status">
              Saving your choice...
            </p>
          )}
        </section>
      )}

      <div className="mt-8 lg:mt-12 flex flex-col items-center">
        <h2 className="text-lg lg:text-3xl font-semibold text-valentine-red mb-4">
          {sessionState === "matches_released"
            ? "your matches"
            : "Current session status"}
        </h2>

        <MatchComponent
          isViewMatch={sessionState === "matches_released" ? true : false}
        />
      </div>

      <button
        onClick={() => router.push("/history")}
        className="w-full my-8 h-20 sm:h-24 md:h-28 lg:h-32 rounded-2xl shadow-lg bg-valentine-light text-white hover:bg-valentine-lightPink transition-all duration-300 transform hover:scale-105 flex items-center justify-center border-2 border-white"
      >
        <span className="text-valentine-red text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-3">
          View Previous Matches
        </span>
      </button>
    </div>
  );
}
