import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/auth/session";

async function getUserEmail() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }),
    };
  }
  if (!user.email) {
    return {
      response: NextResponse.json(
        { error: "Your account does not have an email address" },
        { status: 400 }
      ),
    };
  }

  return { email: user.email };
}

async function isMatchesReleased() {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "session_state")
    .single();

  if (error) {
    console.error("[Next Round Opt-In API] Failed to check round state:", error);
    return {
      error: NextResponse.json(
        { error: "Failed to check round state" },
        { status: 500 }
      ),
    };
  }

  if (data.value !== "matches_released") {
    return {
      error: NextResponse.json(
        { error: "Next-round opt-in is only available after matches are released" },
        { status: 409 }
      ),
    };
  }

  return {};
}

export async function GET() {
  const user = await getUserEmail();
  if ("response" in user) return user.response;

  const { error: stateError } = await isMatchesReleased();
  if (stateError) return stateError;

  const { data, error } = await supabase
    .from("form_responses")
    .select("stay_in_database")
    .eq("email", user.email)
    .single();

  if (error?.code === "PGRST116") {
    return NextResponse.json({ hasResponse: false, optedIn: false });
  }
  if (error) {
    console.error("[Next Round Opt-In API] Failed to fetch opt-in status:", error);
    return NextResponse.json(
      { error: "Failed to fetch opt-in status" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    hasResponse: true,
    optedIn: data.stay_in_database,
  });
}

export async function POST(request: Request) {
  const user = await getUserEmail();
  if ("response" in user) return user.response;

  const { error: stateError } = await isMatchesReleased();
  if (stateError) return stateError;

  let optedIn: unknown;
  try {
    ({ optedIn } = await request.json());
  } catch {
    return NextResponse.json({ error: "A boolean optedIn value is required" }, { status: 400 });
  }
  if (typeof optedIn !== "boolean") {
    return NextResponse.json({ error: "A boolean optedIn value is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("form_responses")
    .update({ stay_in_database: optedIn })
    .eq("email", user.email)
    .select("id")
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[Next Round Opt-In API] Failed to save opt-in preference:", error);
    return NextResponse.json(
      { error: "Failed to save next-round preference" },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "Submit a response before opting in" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, optedIn });
}
