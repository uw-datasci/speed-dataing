import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth/api";
import { getProfileName } from "@/lib/auth/profile";

export async function GET() {
  const auth = await requireSessionApi();
  if (auth instanceof NextResponse) return auth;

  const name = (await getProfileName(auth.id)) ?? auth.email ?? "Member";

  return NextResponse.json(
    {
      id: auth.id,
      name,
      email: auth.email,
      role: auth.role,
      isAdmin: auth.isAdmin,
    },
    { status: 200 },
  );
}
