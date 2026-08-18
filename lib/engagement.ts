import 'server-only';

export type Engagement = {
  copiesToday: number;
  copiesMonth: number;
  votesToday: number;
  votesMonth: number;
};

type EngagementStore = {
  metrics: Map<number, Engagement>;
  votes: Set<string>;
  recentCopies: Map<string, number>;
};

const initialMetrics: Record<number, Engagement> = {
  1: { copiesToday: 184, copiesMonth: 4268, votesToday: 92, votesMonth: 1460 },
  2: { copiesToday: 136, copiesMonth: 3714, votesToday: 116, votesMonth: 1894 },
  3: { copiesToday: 97, copiesMonth: 2981, votesToday: 74, votesMonth: 1218 },
  4: { copiesToday: 68, copiesMonth: 1842, votesToday: 88, votesMonth: 1376 },
  5: { copiesToday: 41, copiesMonth: 1267, votesToday: 53, votesMonth: 864 },
};

const globalStore = globalThis as typeof globalThis & { minecraftEngagement?: EngagementStore };

function getStore(): EngagementStore {
  if (!globalStore.minecraftEngagement) {
    globalStore.minecraftEngagement = {
      metrics: new Map(Object.entries(initialMetrics).map(([id, value]) => [Number(id), { ...value }])),
      votes: new Set(),
      recentCopies: new Map(),
    };
  }
  return globalStore.minecraftEngagement;
}

function emptyMetrics(): Engagement {
  return { copiesToday: 0, copiesMonth: 0, votesToday: 0, votesMonth: 0 };
}

export function getEngagement(serverId: number): Engagement {
  return { ...(getStore().metrics.get(serverId) ?? emptyMetrics()) };
}

export function calculateScore(baseRating: number, engagement: Engagement): number {
  return Math.round(baseRating + engagement.votesMonth * 4 + engagement.votesToday * 18 + engagement.copiesMonth * 0.08);
}

export function recordCopy(serverId: number, clientId: string): Engagement {
  const store = getStore();
  const key = `${serverId}:${clientId}`;
  const now = Date.now();
  const lastCopy = store.recentCopies.get(key) ?? 0;
  const current = store.metrics.get(serverId) ?? emptyMetrics();
  if (now - lastCopy >= 10 * 60 * 1000) {
    current.copiesToday += 1;
    current.copiesMonth += 1;
    store.metrics.set(serverId, current);
    store.recentCopies.set(key, now);
  }
  return { ...current };
}

export function recordVote(serverId: number, clientId: string): { metrics: Engagement; accepted: boolean } {
  const store = getStore();
  const day = new Date().toISOString().slice(0, 10);
  const key = `${day}:${serverId}:${clientId}`;
  const current = store.metrics.get(serverId) ?? emptyMetrics();
  if (store.votes.has(key)) return { metrics: { ...current }, accepted: false };
  store.votes.add(key);
  current.votesToday += 1;
  current.votesMonth += 1;
  store.metrics.set(serverId, current);
  return { metrics: { ...current }, accepted: true };
}
