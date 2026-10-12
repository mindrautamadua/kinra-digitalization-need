import { db } from "./db";
import { appSettings } from "./db/schema";
import { DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, type ScoreThresholds, type ScoreWeights } from "./scoring";
import { eq } from "drizzle-orm";

export type AppSettingsMap = {
  score_weights: ScoreWeights;
  score_thresholds: ScoreThresholds;
  allow_respondent_export: boolean;
  management_can_view_details: boolean;
  allow_resubmit_after_submit: boolean;
};

export const SETTINGS_DEFAULTS: AppSettingsMap = {
  score_weights: DEFAULT_WEIGHTS,
  score_thresholds: DEFAULT_THRESHOLDS,
  allow_respondent_export: true,
  management_can_view_details: true,
  allow_resubmit_after_submit: false,
};

export async function getSetting<K extends keyof AppSettingsMap>(key: K): Promise<AppSettingsMap[K]> {
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.key, key) });
  if (!row) return SETTINGS_DEFAULTS[key];
  return { ...(SETTINGS_DEFAULTS[key] as object), ...(row.valueJson as object) } as AppSettingsMap[K];
}

export async function getAllSettings(): Promise<AppSettingsMap> {
  const rows = await db.select().from(appSettings);
  const out: AppSettingsMap = structuredClone(SETTINGS_DEFAULTS);
  for (const r of rows) {
    const k = r.key as keyof AppSettingsMap;
    if (k in out) {
      const def = out[k];
      // @ts-expect-error merge per key
      out[k] = typeof def === "object" ? { ...def, ...(r.valueJson as object) } : r.valueJson;
    }
  }
  return out;
}

export async function setSetting<K extends keyof AppSettingsMap>(key: K, value: AppSettingsMap[K], userId: string) {
  await db
    .insert(appSettings)
    .values({ key, valueJson: value, updatedBy: userId, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { valueJson: value, updatedBy: userId, updatedAt: new Date() } });
}
