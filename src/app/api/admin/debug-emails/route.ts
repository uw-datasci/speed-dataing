/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/auth/api";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    console.log("[Debug Emails API] Checking form_responses table structure...");

    // Get a sample of form responses to see the actual structure
    const { data: sampleResponses, error: sampleError } = await supabase
      .from("form_responses")
      .select("*")
      .limit(5);

    if (sampleError) {
      console.error("[Debug Emails API] Error fetching sample responses:", sampleError);
      return NextResponse.json({ error: "Failed to fetch sample responses" }, { status: 500 });
    }

    // Get column information (try RPC, fallback if not available)
    let columnInfo = null;
    let columnError = null;
    try {
      const { data, error } = await supabase.rpc("get_table_columns", {
        table_name: "form_responses",
      });
      columnInfo = data;
      columnError = error;
    } catch (rpcError) {
      console.error("[Debug Emails API] RPC not available:", rpcError);
      columnError = "RPC not available";
    }

    // Count total responses
    const { count: totalCount, error: countError } = await supabase
      .from("form_responses")
      .select("*", { count: "exact", head: true });

    const result = {
      sampleResponses: sampleResponses || [],
      columnInfo: columnInfo || "RPC not available",
      totalCount: totalCount || 0,
      sampleColumns:
        sampleResponses && sampleResponses.length > 0 ? Object.keys(sampleResponses[0]) : [],
      errors: {
        sampleError: sampleError ? String(sampleError) : null,
        columnError: columnError ? String(columnError) : null,
        countError: countError ? String(countError) : null,
      },
    };

    console.log("[Debug Emails API] Debug info:", result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Debug Emails API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
