/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { exec } from "child_process";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  const role = (await cookies()).get("role")?.value;
  const adminVerified = (await cookies()).get("adminVerified")?.value;

  console.log('[Admin Settings API] Checking admin access for GET:', { token: token ? 'present' : 'not found', role, adminVerified });

  // Check admin authentication
  if (!token) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
  }

  if (adminVerified !== 'true') {
    return NextResponse.json({ error: "Admin verification required" }, { status: 403 });
  }

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
  const token = (await cookies()).get("token")?.value;
  const role = (await cookies()).get("role")?.value;
  const adminVerified = (await cookies()).get("adminVerified")?.value;

  console.log('[Admin Settings API] Checking admin access for PUT:', { token: token ? 'present' : 'not found', role, adminVerified });

  // Check admin authentication
  if (!token) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
  }

  if (adminVerified !== 'true') {
    return NextResponse.json({ error: "Admin verification required" }, { status: 403 });
  }

  try {
    const { action } = await request.json();
    
    console.log('[Admin Settings API] Processing action:', action);

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    let newState: string;
    let shouldRunMatching = false;

    // Define the state transitions
    switch (action) {
      case 'start_form':
        newState = 'form_active';
        break;
      case 'start_matching':
        newState = 'matching_in_progress';
        shouldRunMatching = true;
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

    // If we need to run the matching algorithm
    if (shouldRunMatching) {
      try {
        console.log('[Admin Settings API] Triggering matching algorithm...');
        // Import and run the matching algorithm
        
        exec('node src/lib/matchmaker/match.ts', { 
          cwd: process.cwd() 
        }, (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            console.error('[Admin Settings API] Matching algorithm error:', error);
          } else {
            console.log('[Admin Settings API] Matching algorithm completed:', stdout);
          }
        });
      } catch (matchingError) {
        console.error('[Admin Settings API] Error triggering matching:', matchingError);
        // Don't fail the request if matching fails
      }
    }

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