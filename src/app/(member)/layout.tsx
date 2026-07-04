import { requireSession } from "@/lib/auth/session";
import { buildCurrentUrl } from "@/lib/auth/login-href";

export default async function MemberLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireSession(await buildCurrentUrl("/dashboard"));
  return <>{children}</>;
}
