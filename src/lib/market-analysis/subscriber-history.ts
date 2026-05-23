const HISTORY_PATH = `${process.cwd()}/config/competitor-subscriber-history.json`;
const TREND_DAYS = 30;
const MAX_HISTORY_DAYS = 120;
const MIN_TREND_SPAN_DAYS = 7;

export interface SubscriberSnapshot {
  date: string;
  subscriberCount: number;
}

export interface ChannelSubscriberStats {
  subscriberCount: number | null;
  hidden: boolean;
  thumbnailUrl?: string | null;
  change30d: number | null;
  change30dPercent: number | null;
  trendAvailable: boolean;
  baselineDate: string | null;
}

type HistoryFile = Record<string, SubscriberSnapshot[]>;

async function readHistoryFile(): Promise<HistoryFile> {
  const fs = await import("fs/promises");
  const raw = await fs.readFile(HISTORY_PATH, "utf-8").catch(() => "{}");
  try {
    return JSON.parse(raw) as HistoryFile;
  } catch {
    return {};
  }
}

async function writeHistoryFile(data: HistoryFile): Promise<void> {
  const fs = await import("fs/promises");
  await fs.writeFile(HISTORY_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function pruneSnapshots(snapshots: SubscriberSnapshot[]): SubscriberSnapshot[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_HISTORY_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return snapshots
    .filter((s) => s.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function recordSubscriberSnapshots(
  entries: { channelId: string; subscriberCount: number }[],
): Promise<void> {
  if (entries.length === 0) return;
  const history = await readHistoryFile();
  const today = todayIsoDate();

  for (const { channelId, subscriberCount } of entries) {
    const list = pruneSnapshots(history[channelId] ?? []);
    const last = list[list.length - 1];
    if (last?.date === today) {
      last.subscriberCount = subscriberCount;
    } else {
      list.push({ date: today, subscriberCount });
    }
    history[channelId] = pruneSnapshots(list);
  }

  await writeHistoryFile(history);
}

export function computeSubscriberTrend(
  channelId: string,
  currentCount: number | null,
  history: HistoryFile,
): Pick<
  ChannelSubscriberStats,
  "change30d" | "change30dPercent" | "trendAvailable" | "baselineDate"
> {
  if (currentCount == null) {
    return {
      change30d: null,
      change30dPercent: null,
      trendAvailable: false,
      baselineDate: null,
    };
  }

  const snapshots = history[channelId] ?? [];
  if (snapshots.length < 2) {
    return {
      change30d: null,
      change30dPercent: null,
      trendAvailable: false,
      baselineDate: null,
    };
  }

  const today = todayIsoDate();
  const targetDaysAgo = TREND_DAYS;
  let baseline: SubscriberSnapshot | null = null;
  let bestDiff = Infinity;

  for (const snap of snapshots) {
    if (snap.date >= today) continue;
    const age = daysBetween(snap.date, today);
    const diff = Math.abs(age - targetDaysAgo);
    if (age >= MIN_TREND_SPAN_DAYS && diff < bestDiff) {
      bestDiff = diff;
      baseline = snap;
    }
  }

  if (!baseline) {
    return {
      change30d: null,
      change30dPercent: null,
      trendAvailable: false,
      baselineDate: null,
    };
  }

  const change30d = currentCount - baseline.subscriberCount;
  const change30dPercent =
    baseline.subscriberCount > 0
      ? Math.round((change30d / baseline.subscriberCount) * 1000) / 10
      : null;

  return {
    change30d,
    change30dPercent,
    trendAvailable: true,
    baselineDate: baseline.date,
  };
}

export async function readSubscriberHistory(): Promise<HistoryFile> {
  return readHistoryFile();
}
