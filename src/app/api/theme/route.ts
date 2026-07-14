import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/** Public — returns the current site theme so all users see the same one. */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "theme")
      .single();

    if (error || !data) {
      // Row doesn't exist yet — fall back to default
      return NextResponse.json({ theme: "default" });
    }

    return NextResponse.json({ theme: data.value });
  } catch {
    return NextResponse.json({ theme: "default" });
  }
}
