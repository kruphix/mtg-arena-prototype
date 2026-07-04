import { describe, expect, it } from 'vitest';
import { createInitialGameState, drawCard } from './gameState';
import { makeState, makePlayer, handCard } from './testUtils';

describe('createInitialGameState', () => {
  it('deals opening hands and starts p1 on main1 turn 1', () => {
    const state = createInitialGameState(() => 0.5);
    expect(state.turn).toBe(1);
    expect(state.phase).toBe('main1');
    expect(state.activePlayerId).toBe('p1');
    for (const player of state.players) {
      expect(player.hand).toHaveLength(7);
      expect(player.library).toHaveLength(33);
      expect(player.life).toBe(20);
    }
  });
});

describe('drawCard', () => {
  it('moves a card from library to hand', () => {
    const state = makeState({
      players: [
        makePlayer('p1', { library: [handCard('emberWhelp')] }),
        makePlayer('p2'),
      ],
    });
    drawCard(state, 'p1');
    expect(state.players[0].library).toHaveLength(0);
    expect(state.players[0].hand).toHaveLength(1);
  });

  it('declares the opponent the winner when library is empty', () => {
    const state = makeState({
      players: [makePlayer('p1', { library: [] }), makePlayer('p2')],
    });
    drawCard(state, 'p1');
    expect(state.winnerId).toBe('p2');
  });
});
