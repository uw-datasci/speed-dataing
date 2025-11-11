/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  clearCurrMatchesTable,
  updateFormResponsesTableWithVectorEmbeddings,
  handleOddParticipant,
  matchParticipants,
  updateCurrMatches,
  updatePreviousMatches,
} from "@/lib/matchmaker/embeddings";

// Pool of unique emojis for matches (exactly 100 emojis)
const EMOJI_POOL = [
  "💖",
  "💕",
  "💙",
  "💚",
  "💛",
  "💜",
  "🧡",
  "❤️",
  "🩷",
  "🩵",
  "💗",
  "💓",
  "💞",
  "💝",
  "💘",
  "💌",
  "❣️",
  "💟",
  "♥️",
  "🫶",
  "🤝",
  "👥",
  "🤗",
  "✨",
  "⭐",
  "🌟",
  "💫",
  "🌠",
  "🎯",
  "🎪",
  "🎨",
  "🎭",
  "🎬",
  "🎮",
  "🎲",
  "🎰",
  "🎳",
  "🎹",
  "🎺",
  "🎸",
  "🌈",
  "🌸",
  "🌺",
  "🌻",
  "🌼",
  "🌷",
  "🌹",
  "🥀",
  "🏵️",
  "💐",
  "🍀",
  "🍃",
  "🍂",
  "🍁",
  "🌿",
  "🪴",
  "🌱",
  "🌾",
  "🌵",
  "🎄",
  "🦋",
  "🐝",
  "🐞",
  "🦗",
  "🐢",
  "🐠",
  "🐟",
  "🐡",
  "🐙",
  "🦀",
  "🦞",
  "🦐",
  "🦑",
  "🦪",
  "🐚",
  "🪸",
  "🐌",
  "🦎",
  "🐸",
  "🦆",
  "🍕",
  "🍔",
  "🌮",
  "🌯",
  "🥙",
  "🥗",
  "🍝",
  "🍜",
  "🍲",
  "🍛",
  "🍣",
  "🍱",
  "🍙",
  "🍘",
  "🥟",
  "🥠",
  "🥡",
  "🍦",
  "🍧",
  "🧋",
];

// Shuffle function to randomize emoji order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate unique emojis for all matches
function generateUniqueEmojis(matchCount: number): string[] {
  // Shuffle the emoji pool to ensure random distribution
  const shuffledEmojis = shuffleArray(EMOJI_POOL);

  // If we need more emojis than available, cycle through the pool
  const emojis: string[] = [];
  for (let i = 0; i < matchCount; i++) {
    emojis.push(shuffledEmojis[i % shuffledEmojis.length]);
  }

  return emojis;
}

export async function POST(request: NextRequest) {
  try {
    console.log("[Run Matching API] Starting matching process...");

    // Check if session state is 'matching_in_progress'
    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("value")
      .single();

    if (settingsError) {
      console.error(
        "[Run Matching API] Error fetching settings:",
        settingsError
      );
      return NextResponse.json(
        { error: "Failed to fetch session state" },
        { status: 500 }
      );
    }

    if (settings.value !== "matching_in_progress") {
      console.log(
        "[Run Matching API] Session state is not matching_in_progress:",
        settings.value
      );
      return NextResponse.json(
        {
          error:
            "Matching can only be run when session state is matching_in_progress",
          currentState: settings.value,
        },
        { status: 400 }
      );
    }

    // Check if there are enough participants
    const { data: participants, error: participantsError } = await supabase
      .from("form_responses")
      .select("id")
      .order("id", { ascending: true });

    if (participantsError) {
      console.error(
        "[Run Matching API] Error fetching participants:",
        participantsError
      );
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    if (!participants || participants.length < 2) {
      console.log(
        "[Run Matching API] Not enough participants:",
        participants?.length || 0
      );
      return NextResponse.json(
        {
          error: "Need at least 2 participants to run matching",
          participantCount: participants?.length || 0,
        },
        { status: 400 }
      );
    }

    console.log(
      `[Run Matching API] Found ${participants.length} participants, starting matching...`
    );

    // Step 1: Generate vector embeddings for each participant
    console.log("[Run Matching API] Step 1: Generating vector embeddings...");
    await updateFormResponsesTableWithVectorEmbeddings();

    // Step 2: Handle odd number of participants
    console.log("[Run Matching API] Step 2: Handling odd participant count...");
    await handleOddParticipant(participants);

    // Step 3: Clear the curr_matches table
    console.log("[Run Matching API] Step 3: Clearing curr_matches table...");
    await clearCurrMatchesTable();

    // Step 4: Match participants
    console.log("[Run Matching API] Step 4: Running matching algorithm...");
    const matches = await matchParticipants();

    if (matches.length === 0) {
      console.log("[Run Matching API] No matches generated");
      return NextResponse.json({
        message:
          "No matches generated - all participants may have already been matched",
        matchCount: 0,
      });
    }

    // Step 5: Generate unique emojis for all matches
    console.log(
      "[Run Matching API] Step 5: Generating unique emojis for matches..."
    );
    const uniqueEmojis = generateUniqueEmojis(matches.length);

    const matchesWithEmojis = matches.map((match, index) => ({
      ...match,
      emoji: uniqueEmojis[index],
    }));

    // Step 6: Update curr_matches table
    console.log("[Run Matching API] Step 6: Updating curr_matches table...");
    const updatedMatches = await updateCurrMatches(matchesWithEmojis);

    // Step 7: Update previous_matches table
    console.log(
      "[Run Matching API] Step 7: Updating previous_matches table..."
    );
    await updatePreviousMatches(matchesWithEmojis);

    console.log(
      `[Run Matching API] Matching completed successfully! Generated ${matches.length} matches.`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${matches.length} matches`,
      matchCount: matches.length,
      matches: updatedMatches,
    });
  } catch (error) {
    console.error("[Run Matching API] Error during matching process:", error);
    return NextResponse.json(
      {
        error: "Failed to run matching algorithm",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
