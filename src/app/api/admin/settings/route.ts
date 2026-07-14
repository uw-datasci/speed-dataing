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
    return NextResponse.json({ success: true, setting: data });
  } catch (error) {
    console.error('[Admin Settings API] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const { action } = await request.json();
    
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