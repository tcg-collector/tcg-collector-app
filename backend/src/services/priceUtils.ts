import { Card } from '../models/Card';
import { PriceHistory } from '../models/PriceHistory';

export const ALLOWED_DAYS = [7, 30, 60] as const;
export type AllowedDays = typeof ALLOWED_DAYS[number];

interface CardPriceVariant {
  low: number | null;
  mid: number | null;
  high: number | null;
  market: number | null;
}

interface CardPrices {
  normal?: CardPriceVariant;
  holofoil?: CardPriceVariant;
  reverseHolofoil?: CardPriceVariant;
}

export function getBestMarket(prices: CardPrices | undefined): number | null {
  if (!prices) return null;
  return prices.holofoil?.market ?? prices.normal?.market ?? prices.reverseHolofoil?.market ?? null;
}

export function startOfDay(d: Date): Date {
  const dt = new Date(d);
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
}

export interface GainerResult {
  card: InstanceType<typeof Card>;
  marketNow: number;
  marketThen: number;
  deltaPct: number;
  deltaAbs: number;
}

export async function calcGainers(cardIds: string[], days: number, limit: number): Promise<GainerResult[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const dayStart = startOfDay(since);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const snapshots = await PriceHistory.find({
    cardId: { $in: cardIds },
    date: { $gte: dayStart, $lte: dayEnd },
  });

  if (!snapshots.length) return [];

  const snapshotMap = new Map(snapshots.map(s => [s.cardId, s.market]));
  const cards = await Card.find({ _id: { $in: [...snapshotMap.keys()] } });

  const results: GainerResult[] = [];
  for (const card of cards) {
    const marketNow = getBestMarket(card.prices as CardPrices);
    const marketThen = snapshotMap.get(card._id);
    if (!marketNow || !marketThen || marketThen === 0) continue;
    const deltaPct = ((marketNow - marketThen) / marketThen) * 100;
    if (deltaPct <= 0) continue;
    const deltaAbs = marketNow - marketThen;
    results.push({ card, marketNow, marketThen, deltaPct, deltaAbs });
  }

  return results
    .sort((a, b) => b.deltaPct - a.deltaPct)
    .slice(0, limit);
}
