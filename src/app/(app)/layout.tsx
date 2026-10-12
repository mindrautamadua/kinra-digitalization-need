import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";
import { AppShell } from "@/components/layout/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/account/password");
  return <AppShell user={user}>{children}</AppShell>;
}
