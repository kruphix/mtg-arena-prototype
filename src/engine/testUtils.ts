import type { GameState, Permanent, PlayerState } from './types';

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function makePermanent(defId: string, overrides: Partial<Permanent> = {}): Permanent {
  return {
    instanceId: nextId('perm'),
    defId,
    tapped: false,
    summoningSickness: false,
    damage: 0,
    frozen: false,
    tempPowerBonus: 0,
    tempToughnessBonus: 0,
    ...overrides,
  };
}

export function makePlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    life: 20,
    library: [],
    hand: [],
    battlefield: [],
    graveyard: [],
    landPlayedThisTurn: false,
    ...overrides,
  };
}

export function makeState(overrides: Partial<GameState> = {}): GameState {
  const p1 = makePlayer('p1');
  const p2 = makePlayer('p2');
  return {
    players: [p1, p2],
    activePlayerId: 'p1',
    turn: 1,
    phase: 'main1',
    attackers: [],
    blockers: {},
    log: [],
    ...overrides,
  };
}

export function handCard(defId: string) {
  return { instanceId: nextId('card'), defId };
}
