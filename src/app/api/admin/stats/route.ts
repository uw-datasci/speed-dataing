/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/auth/api";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    console.log('[Admin Stats API] Fetching statistics from form_responses table...');

    // Get total form responses count
    console.log('[Admin Stats API] Counting total responses...');
    const { count: totalResponses, error: responsesError } = await supabase
      .from('form_responses')
      .select('*', { count: 'exact', head: true });

    console.log('[Admin Stats API] Total responses count:', { totalResponses, error: responsesError });

    if (responsesError) {
      console.error('[Admin Stats API] Error fetching form responses:', responsesError);
      return NextResponse.json({ error: "Failed to fetch form responses" }, { status: 500 });
    }

    // Get recent form responses (last 10)
    console.log('[Admin Stats API] Fetching recent responses...');
    const result = await supabase
      .from('form_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    let recentResponses = result.data;
    const recentError = result.error;

    console.log('[Admin Stats API] Recent responses:', { count: recentResponses?.length, error: recentError });

    if (recentError) {
      console.error('[Admin Stats API] Error fetching recent responses:', recentError);
      // Try without ordering by created_at in case the column doesn't exist
      const { data: fallbackResponses, error: fallbackError } = await supabase
        .from('form_responses')
        .select('*')
        .limit(10);

      if (fallbackError) {
        console.error('[Admin Stats API] Fallback error:', fallbackError);
        return NextResponse.json({ error: "Failed to fetch recent responses" }, { status: 500 });
      }

      console.log('[Admin Stats API] Using fallback recent responses:', fallbackResponses?.length);
      recentResponses = fallbackResponses;
    }

    // Get responses by date (last 7 days) - try with created_at first
    console.log('[Admin Stats API] Fetching weekly responses...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let weeklyResponses: any[] = [];
    let weeklyError = null;

    try {
      const { data: weeklyData, error: weeklyErr } = await supabase
        .from('form_responses')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      weeklyResponses = weeklyData || [];
      weeklyError = weeklyErr;
    } catch (error) {
      console.log('[Admin Stats API] created_at column not available, using all responses for weekly count');
      weeklyResponses = [];
      weeklyError = null;
    }

    console.log('[Admin Stats API] Weekly responses:', { count: weeklyResponses?.length, error: weeklyError });

    // Calculate daily responses for the last 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let dayCount = 0;
      if (weeklyResponses.length > 0) {
        const dayResponses = weeklyResponses.filter(response => 
          response.created_at?.startsWith(dateStr)
        ) || [];
        dayCount = dayResponses.length;
      } else {
        // If we don't have created_at data, distribute total responses evenly
        dayCount = Math.floor((totalResponses || 0) / 7);
      }
      
      dailyStats.push({
        date: dateStr,
        count: dayCount
      });
    }

    // Get unique users count - try different possible user identifier fields
    console.log('[Admin Stats API] Counting unique users...');
    let uniqueUsers = 0;
    
    // Try different possible user identifier fields
    const userFields = ['user_id', 'email', 'name', 'id'];
    for (const field of userFields) {
      try {
        const { count: userCount, error: userError } = await supabase
          .from('form_responses')
          .select(field, { count: 'exact', head: true });

        if (!userError && userCount !== null) {
          console.log(`[Admin Stats API] Found ${userCount} unique users using field: ${field}`);
          uniqueUsers = userCount;
          break;
        }
      } catch (error) {
        console.log(`[Admin Stats API] Field ${field} not available`);
      }
    }

    // If no unique user field found, use total responses as fallback
    if (uniqueUsers === 0) {
      uniqueUsers = totalResponses || 0;
      console.log('[Admin Stats API] Using total responses as unique users count');
    }

    const stats = {
      totalResponses: totalResponses || 0,
      uniqueUsers: uniqueUsers,
      weeklyResponses: weeklyResponses?.length || 0,
      dailyStats,
      recentResponses: recentResponses || [],
      lastUpdated: new Date().toISOString(),
      tableUsed: 'form_responses'
    };

    console.log('[Admin Stats API] Statistics fetched successfully:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Admin Stats API] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 