import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/auth/api";

/** Admin-only — sets the site theme for all users. */
export async function PUT(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { theme } = await request.json();
  if (theme !== "default" && theme !== "valentines") {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  }

  const { error } = await supabase
    .from("settings")
    .upsert({ key: "theme", value: theme }, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
  }

  return NextResponse.json({ success: true, theme });
}
