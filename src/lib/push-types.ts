export interface PushPrefs {
  dailyReminder: boolean;
  streakRisk: boolean;
  weeklyLeague: boolean;
  raidBoss: boolean;
  restPush: boolean;
}

export const DEFAULT_PUSH_PREFS: PushPrefs = {
  dailyReminder: true,
  streakRisk: true,
  weeklyLeague: true,
  raidBoss: true,
  restPush: true,
};

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: PushSubscriptionKeys;
}

export interface PushSyncInput {
  subscription: PushSubscriptionPayload;
  prefs: PushPrefs;
  heroName: string;
  streak: number;
  lastDay: string | null;
  weeklyExp: number;
  timeZone?: string;
}

export interface StoredPushSubscriber {
  id: string;
  subscription: PushSubscriptionPayload;
  prefs: PushPrefs;
  heroName: string;
  streak: number;
  lastDay: string | null;
  weeklyExp: number;
  timeZone?: string;
  restToken?: string | null;
  restEndsAt?: number | null;
  lastDailySentDate?: string | null;
  lastLeagueWarnWeek?: string | null;
  lastBossAnnouncedWeek?: string | null;
  updatedAt: number;
}
