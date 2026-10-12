import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";

export default async function Home() {
  const u = await requireUser();
  if (u.mustChangePassword) redirect("/account/password");
  if (u.role === "respondent") redirect("/respond");
  redirect("/dashboard");
}
