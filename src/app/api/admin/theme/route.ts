import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

/** Admin-only — sets the site theme for all users. */
export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const role = cookieStore.get("role")?.value;
  const adminVerified = cookieStore.get("adminVerified")?.value;

  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (adminVerified !== "true") return NextResponse.json({ error: "Admin verification required" }, { status: 403 });

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
