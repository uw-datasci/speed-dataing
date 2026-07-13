import { requireAdmin } from "@/lib/auth/session";
import { buildCurrentUrl } from "@/lib/auth/login-href";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin(await buildCurrentUrl("/admin"));
  return <>{children}</>;
}
