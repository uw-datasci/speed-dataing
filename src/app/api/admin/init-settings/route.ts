/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/auth/api";

export async function POST() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    console.log('[Init Settings API] Initializing settings table...');

    // First, try to create the settings table if it doesn't exist
    const { error: createTableError } = await supabase.rpc('create_settings_table_if_not_exists');
    
    if (createTableError) {
      console.log('[Init Settings API] Table creation RPC not available, trying direct insert...');
    }

    // Check if session_state setting already exists
    const { data: existingSetting, error: checkError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'session_state')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Init Settings API] Error checking existing setting:', checkError);
      return NextResponse.json({ 
        error: "Failed to check existing settings",
        details: checkError.message 
      }, { status: 500 });
    }

    if (existingSetting) {
      console.log('[Init Settings API] Session state setting already exists:', existingSetting);
      return NextResponse.json({ 
        success: true, 
        message: "Settings already initialized",
        currentState: existingSetting.value
      });
    }

    // Insert default session state
    const { data: insertData, error: insertError } = await supabase
      .from('settings')
      .insert({
        key: 'session_state',
        value: 'idle'
      })
      .select();

    if (insertError) {
      console.error('[Init Settings API] Error inserting default setting:', insertError);
      return NextResponse.json({ 
        error: "Failed to initialize settings",
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('[Init Settings API] Settings initialized successfully:', insertData);

    return NextResponse.json({
      success: true,
      message: "Settings initialized successfully",
      setting: insertData?.[0]
    });

  } catch (error: any) {
    console.error('[Init Settings API] Unexpected error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
} 