"use server";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { actionUser } from "@/lib/auth/guard";

export async function markAllReadAction() {
  const me = await actionUser();
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)));
  revalidatePath("/notifications");
}

export async function markReadAction(id: string) {
  const me = await actionUser();
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, me.id)));
  revalidatePath("/notifications");
}
