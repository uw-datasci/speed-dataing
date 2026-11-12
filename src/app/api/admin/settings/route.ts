/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/auth/api";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    console.log('[Admin Settings API] Fetching session state...');
    
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'session_state')
      .single();

    if (error) {
      console.error('[Admin Settings API] Error fetching session state:', error);
      return NextResponse.json({ error: "Failed to fetch session state" }, { status: 500 });
    }

    console.log('[Admin Settings API] Session state fetched:', data);

    // Resetting from matches_released deletes these, so the admin page shows the count before confirming.
    let responsesToDelete: number | null = null;
    if (data?.value === 'matches_released') {
      const { count, error: countError } = await supabase
        .from('form_responses')
        .select('id', { count: 'exact', head: true })
        .eq('stay_in_database', false);

      if (countError) {
        console.error('[Admin Settings API] Error counting responses not retained for future rounds:', countError);
      } else {
        responsesToDelete = count ?? 0;
      }
    }

    return NextResponse.json({ success: true, setting: data, responsesToDelete });
  } catch (error) {
    console.error('[Admin Settings API] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const { action, confirmDelete } = await request.json();
    
    console.log('[Admin Settings API] Processing action:', action);

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    let newState: string;

    // Define the state transitions
    switch (action) {
      case 'start_form':
        newState = 'form_active';
        break;
      case 'start_matching':
        // Only lock the form / set state here. Matching runs via
        // POST /api/admin/run-matching (see admin "Run Matching Algorithm").
        // Spawning `node src/lib/matchmaker/match.ts` fails on Vercel — .ts
        // sources are not in the serverless bundle.
        newState = 'matching_in_progress';
        break;
      case 'release_matches':
        newState = 'matches_released';
        break;
      case 'reset':
        newState = 'idle';
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === 'reset') {
      const { data: currentSetting, error: currentSettingError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'session_state')
        .single();

      if (currentSettingError) {
        console.error('[Admin Settings API] Error checking round state before cleanup:', currentSettingError);
        return NextResponse.json({ error: "Failed to check round state" }, { status: 500 });
      }

      if (currentSetting.value === 'matches_released') {
        if (confirmDelete !== true) {
          return NextResponse.json(
            {
              error: "Resetting now deletes responses that did not opt in. Confirm the reset to continue.",
              requiresConfirmation: true,
            },
            { status: 409 }
          );
        }

        const { error: cleanupError, count } = await supabase
          .from('form_responses')
          .delete({ count: 'exact' })
          .eq('stay_in_database', false);

        if (cleanupError) {
          console.error('[Admin Settings API] Error removing responses not retained for future rounds:', cleanupError);
          return NextResponse.json({ error: "Failed to remove responses not retained for future rounds" }, { status: 500 });
        }

        console.log('[Admin Settings API] Removed responses not retained for future rounds:', count);

        const { error: preferenceResetError } = await supabase
          .from('form_responses')
          .update({ stay_in_database: false })
          .eq('stay_in_database', true);

        if (preferenceResetError) {
          console.error('[Admin Settings API] Error resetting next-round opt-ins:', preferenceResetError);
          return NextResponse.json({ error: "Failed to reset next-round opt-ins" }, { status: 500 });
        }
      }

      // Manual pairs only apply to one round, so a reset clears them.
      const { error: clearPairsError, count: clearedPairs } = await supabase
        .from('manual_match_pairs')
        .delete({ count: 'exact' })
        .not('id', 'is', null);

      if (clearPairsError) {
        console.error('[Admin Settings API] Error clearing manual pairs:', clearPairsError);
        return NextResponse.json({ error: "Failed to clear manual pairs" }, { status: 500 });
      }

      console.log('[Admin Settings API] Cleared manual pairs:', clearedPairs);
    }

    // Update the session state
    const { data, error } = await supabase
      .from('settings')
      .upsert({ 
        key: 'session_state', 
        value: newState 
      }, { 
        onConflict: 'key' 
      })
      .select();

    if (error) {
      console.error('[Admin Settings API] Error updating session state:', error);
      return NextResponse.json({ error: "Failed to update session state" }, { status: 500 });
    }

    console.log('[Admin Settings API] Session state updated successfully:', data);

    return NextResponse.json({ 
      success: true, 
      setting: data?.[0],
      action,
      newState 
    });
  } catch (error) {
    console.error('[Admin Settings API] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}