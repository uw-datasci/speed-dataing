/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const token = (await cookies()).get("token")?.value;
  const role = (await cookies()).get("role")?.value;
  const adminVerified = (await cookies()).get("adminVerified")?.value;

  console.log('[Admin Responses API] Checking admin access:', { token: token ? 'present' : 'not found', role, adminVerified });

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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('[Admin Responses API] Fetching form responses with params:', { page, limit, search, sortBy, sortOrder });

    let query = supabase
      .from('form_responses')
      .select('*', { count: 'exact' });

    // Add search filter if provided
    if (search) {
      console.log('[Admin Responses API] Applying search filter:', search);
      // Search in common fields that exist in form_responses table
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,program.ilike.%${search}%,year.ilike.%${search}%,career.ilike.%${search}%,pronouns.ilike.%${search}%`);
    }

    // Add sorting - try created_at first, fallback to id if created_at doesn't exist
    console.log('[Admin Responses API] Applying sorting:', { sortBy, sortOrder });
    try {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } catch (sortError) {
      console.log('[Admin Responses API] Sort column not available, using default sorting');
      query = query.order('id', { ascending: false });
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    console.log('[Admin Responses API] Executing query with pagination:', { from, to });

    const result = await query;
    let responses = result.data;
    const error = result.error;
    let count = result.count;

    if (error) {
      console.error('[Admin Responses API] Error fetching form responses:', error);
      
      // Try a simpler query without sorting if the original fails
      console.log('[Admin Responses API] Trying fallback query without sorting...');
      const { data: fallbackResponses, error: fallbackError, count: fallbackCount } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact' })
        .range(from, to);

      if (fallbackError) {
        console.error('[Admin Responses API] Fallback query also failed:', fallbackError);
        return NextResponse.json({ error: "Failed to fetch form responses" }, { status: 500 });
      }

      console.log('[Admin Responses API] Fallback query successful:', { count: fallbackResponses?.length });
      responses = fallbackResponses;
      count = fallbackCount;
    }

    const totalPages = Math.ceil((count || 0) / limit);

    const resultObj = {
      responses: responses || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count || 0,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search,
        sortBy,
        sortOrder
      }
    };

    console.log('[Admin Responses API] Form responses fetched successfully:', { 
      count: responses?.length, 
      totalPages, 
      totalCount: count,
      sampleResponse: responses && responses.length > 0 ? Object.keys(responses[0]) : []
    });

    return NextResponse.json(resultObj);
  } catch (error) {
    console.error('[Admin Responses API] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 