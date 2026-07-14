/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireSessionApi } from '@/lib/auth/api';

export async function GET() {
  const auth = await requireSessionApi();
  if (auth instanceof NextResponse) return auth;

  try {
    console.log('[User Match API] Fetching user match...');

    const userEmail = auth.email;
    console.log('[User Match API] User email from session:', userEmail);

    // Find the user's form response ID (UUID)
    const { data: userFormData, error: userError } = await supabase
      .from('form_responses')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !userFormData) {
      console.error('[User Match API] User not found in form_responses:', userError);
      return NextResponse.json({ 
        error: "User not found in form responses. Please submit the form first.",
        userEmail: userEmail 
      }, { status: 404 });
    }

    const userUUID = userFormData.id;
    console.log('[User Match API] User UUID from form_responses:', userUUID);

    // Find the user's match using UUIDs
    const { data: match, error: matchError } = await supabase
      .from('curr_matches')
      .select('*')
      .or(`person1_id.eq.${userUUID},person2_id.eq.${userUUID}`)
      .single();

    if (matchError) {
      if (matchError.code === 'PGRST116') {
        // No match found
        console.log('[User Match API] No match found for user');
        return NextResponse.json({ 
          error: "No match found. Please wait for the matching process to complete.",
          userEmail: userEmail 
        }, { status: 404 });
      }
      console.error('[User Match API] Error fetching match:', matchError);
      return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
    }

    // Determine which person the user is (person1 or person2)
    const isPerson1 = match.person1_id === userUUID;
    const matchedPersonId = isPerson1 ? match.person2_id : match.person1_id;

    // Get the matched person's details
    const { data: matchedPerson, error: personError } = await supabase
      .from('form_responses')
      .select('id, name, email, pronouns, program, year, social_media_links')
      .eq('id', matchedPersonId)
      .single();

    if (personError || !matchedPerson) {
      console.error('[User Match API] Error fetching matched person:', personError);
      return NextResponse.json({ error: "Failed to fetch matched person details" }, { status: 500 });
    }

    console.log('[User Match API] Successfully fetched match:', {
      matchId: match.id,
      similarityScore: match.similarity_score,
      emoji: match.emoji,
      matchedPerson: matchedPerson.name
    });

    return NextResponse.json({
      success: true,
      match: {
        id: match.id,
        similarity_score: match.similarity_score,
        emoji: match.emoji,
        matched_person: {
          name: matchedPerson.name,
          email: matchedPerson.email,
          pronouns: matchedPerson.pronouns,
          program: matchedPerson.program,
          year: matchedPerson.year,
          social_media_links: matchedPerson.social_media_links
        }
      }
    });

  } catch (error: any) {
    console.error('[User Match API] Error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
} 