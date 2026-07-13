/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireSessionApi } from '@/lib/auth/api';

export async function GET() {
  const auth = await requireSessionApi();
  if (auth instanceof NextResponse) return auth;

  try {
    console.log('[User History API] Fetching user history...');

    const userEmail = auth.email;
    console.log('[User History API] User email from session:', userEmail);

    // Find the user's form response ID (UUID) - try email column
    const { data: userFormData, error: userError } = await supabase
      .from('form_responses')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !userFormData) {
      console.error('[User History API] User not found in form_responses:', userError);
      return NextResponse.json({ 
        error: "User not found in form responses. Please submit the form first.",
        userEmail: userEmail 
      }, { status: 404 });
    }

    const userUUID = userFormData.id;
    console.log('[User History API] User UUID from form_responses:', userUUID);

    // Get the user's previous matches
    const { data: previousMatches, error: matchesError } = await supabase
      .from('previous_matches')
      .select('*')
      .eq('id', userUUID)
      .single();

    if (matchesError) {
      if (matchesError.code === 'PGRST116') {
        // No previous matches found
        console.log('[User History API] No previous matches found for user');
        return NextResponse.json({ 
          matches: [],
          message: "No previous matches found"
        });
      }
      console.error('[User History API] Error fetching previous matches:', matchesError);
      return NextResponse.json({ error: "Failed to fetch previous matches" }, { status: 500 });
    }

    if (!previousMatches || !previousMatches.matched_with || previousMatches.matched_with.length === 0) {
      console.log('[User History API] No previous matches found');
      return NextResponse.json({ 
        matches: [],
        message: "No previous matches found"
      });
    }

    // Get details for all matched users
    const { data: matchedUsers, error: usersError } = await supabase
      .from('form_responses')
      .select('id, name, social_media_links, program, year')
      .in('id', previousMatches.matched_with);

    if (usersError) {
      console.error('[User History API] Error fetching matched users:', usersError);
      return NextResponse.json({ error: "Failed to fetch matched users" }, { status: 500 });
    }

    // Create a map of user details by ID for easy lookup
    const userDetailsMap = new Map();
    matchedUsers?.forEach(user => {
      userDetailsMap.set(user.id, user);
    });

    // Combine match data with user details
    const matchesWithDetails = previousMatches.matched_with.map((matchedUserId: string, index: number) => {
      const userDetails = userDetailsMap.get(matchedUserId);
      const similarityScore = previousMatches.similarity_scores?.[index] || 0;
      const emoji = previousMatches.emojis?.[index] || '🤝';

      return {
        matchedUserId,
        name: userDetails?.name || 'Unknown',
        social_media_links: userDetails?.social_media_links || '',
        program: userDetails?.program || 'Unknown',
        year: userDetails?.year || 'Unknown',
        similarity_score: similarityScore,
        emoji: emoji
      };
    });

    console.log('[User History API] Successfully fetched matches:', matchesWithDetails.length);

    return NextResponse.json({
      matches: matchesWithDetails,
      message: "Previous matches retrieved successfully"
    });

  } catch (error: any) {
    console.error('[User History API] Error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
} 