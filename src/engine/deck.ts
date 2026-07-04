import type { CardInstance } from './types';

const DECKLIST: { defId: string; qty: number }[] = [
  { defId: 'ashcrag', qty: 9 },
  { defId: 'mistpool', qty: 8 },
  { defId: 'emberWhelp', qty: 1 },
  { defId: 'flameScout', qty: 1 },
  { defId: 'cinderHound', qty: 1 },
  { defId: 'ridgeWyvern', qty: 1 },
  { defId: 'magmaBrute', qty: 1 },
  { defId: 'firebrandAdept', qty: 1 },
  { defId: 'sparkBolt', qty: 1 },
  { defId: 'combust', qty: 1 },
  { defId: 'recklessCharge', qty: 1 },
  { defId: 'infernoWave', qty: 1 },
  { defId: 'tideSprite', qty: 1 },
  { defId: 'pearlDiver', qty: 1 },
  { defId: 'mistSerpent', qty: 1 },
  { defId: 'shoalGuardian', qty: 1 },
  { defId: 'tidalLeviathan', qty: 1 },
  { defId: 'coralElder', qty: 1 },
  { defId: 'insight', qty: 1 },
  { defId: 'recallWave', qty: 1 },
  { defId: 'healingTide', qty: 1 },
  { defId: 'frostLock', qty: 1 },
  { defId: 'growthSurge', qty: 1 },
  { defId: 'wanderingGolem', qty: 1 },
  { defId: 'scrapAutomaton', qty: 1 },
];

let instanceCounter = 0;

function nextInstanceId(): string {
  instanceCounter += 1;
  return `inst-${instanceCounter}`;
}

export function buildStandardDeck(): CardInstance[] {
  const deck: CardInstance[] = [];
  for (const { defId, qty } of DECKLIST) {
    for (let i = 0; i < qty; i += 1) {
      deck.push({ instanceId: nextInstanceId(), defId });
    }
  }
  return deck;
}

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
