import { buildStandardDeck, shuffle, type Rng } from './deck';
import type { CardInstance, GameState, PlayerState } from './types';

const OPENING_HAND_SIZE = 7;

function drawN(library: CardInstance[], hand: CardInstance[], n: number): void {
  for (let i = 0; i < n && library.length > 0; i += 1) {
    const card = library.shift();
    if (card) hand.push(card);
  }
}

function createPlayer(id: string, rng: Rng): PlayerState {
  const library = shuffle(buildStandardDeck(), rng);
  const hand: CardInstance[] = [];
  drawN(library, hand, OPENING_HAND_SIZE);
  return {
    id,
    life: 20,
    library,
    hand,
    battlefield: [],
    graveyard: [],
    landPlayedThisTurn: false,
  };
}

export function createInitialGameState(rng: Rng = Math.random): GameState {
  return {
    players: [createPlayer('p1', rng), createPlayer('p2', rng)],
    activePlayerId: 'p1',
    turn: 1,
    phase: 'main1',
    attackers: [],
    blockers: {},
    log: ['Game started. Player 1 goes first (skips first draw).'],
  };
}

export function getPlayer(state: GameState, playerId: string): PlayerState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error(`Unknown player id: ${playerId}`);
  return player;
}

export function getOpponent(state: GameState, playerId: string): PlayerState {
  const opponent = state.players.find((p) => p.id !== playerId);
  if (!opponent) throw new Error(`No opponent for player id: ${playerId}`);
  return opponent;
}

export function drawCard(state: GameState, playerId: string): void {
  const player = getPlayer(state, playerId);
  if (player.library.length === 0) {
    state.winnerId = getOpponent(state, playerId).id;
    state.log.push(`${playerId} has no cards left to draw and loses.`);
    return;
  }
  const card = player.library.shift();
  if (card) player.hand.push(card);
}
