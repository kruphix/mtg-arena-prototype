import { describe, expect, it } from 'vitest';
import { gameReducer } from './actions';
import { createInitialGameState } from './gameState';
import { makePermanent, makePlayer, makeState, handCard } from './testUtils';

describe('PLAY_LAND', () => {
  it('moves a land from hand to battlefield and blocks a second land the same turn', () => {
    const land1 = handCard('ashcrag');
    const land2 = handCard('mistpool');
    let state = makeState({
      players: [makePlayer('p1', { hand: [land1, land2] }), makePlayer('p2')],
    });

    state = gameReducer(state, { type: 'PLAY_LAND', instanceId: land1.instanceId });
    expect(state.players[0].battlefield).toHaveLength(1);
    expect(state.players[0].hand).toHaveLength(1);
    expect(state.players[0].landPlayedThisTurn).toBe(true);

    state = gameReducer(state, { type: 'PLAY_LAND', instanceId: land2.instanceId });
    expect(state.players[0].battlefield).toHaveLength(1);
    expect(state.players[0].hand).toHaveLength(1);
  });
});

describe('CAST_SPELL', () => {
  it('fails without enough untapped lands of the right color', () => {
    const spell = handCard('sparkBolt');
    let state = makeState({
      players: [makePlayer('p1', { hand: [spell] }), makePlayer('p2')],
    });
    state = gameReducer(state, { type: 'CAST_SPELL', instanceId: spell.instanceId, target: { kind: 'player', playerId: 'p2' } });
    expect(state.players[0].hand).toHaveLength(1);
  });

  it('taps lands to pay cost and resolves the effect', () => {
    const spell = handCard('sparkBolt');
    const land = makePermanent('ashcrag');
    let state = makeState({
      players: [
        makePlayer('p1', { hand: [spell], battlefield: [land] }),
        makePlayer('p2', { life: 20 }),
      ],
    });
    state = gameReducer(state, {
      type: 'CAST_SPELL',
      instanceId: spell.instanceId,
      target: { kind: 'player', playerId: 'p2' },
    });
    expect(state.players[0].hand).toHaveLength(0);
    expect(state.players[0].graveyard).toHaveLength(1);
    expect(state.players[0].battlefield[0].tapped).toBe(true);
    expect(state.players[1].life).toBe(17);
  });

  it('a creature enters with summoning sickness', () => {
    const creature = handCard('cinderHound');
    const lands = [makePermanent('ashcrag'), makePermanent('ashcrag')];
    let state = makeState({
      players: [makePlayer('p1', { hand: [creature], battlefield: lands }), makePlayer('p2')],
    });
    state = gameReducer(state, { type: 'CAST_SPELL', instanceId: creature.instanceId });
    expect(state.players[0].battlefield).toHaveLength(3);
    const summoned = state.players[0].battlefield.find((p) => p.defId === 'cinderHound');
    expect(summoned?.summoningSickness).toBe(true);
  });
});

describe('ADVANCE_PHASE', () => {
  it('cascades through combat and auto-phases into the next player main1, drawing a card', () => {
    let state = createInitialGameState(() => 0.5);
    const p2HandBefore = state.players[1].hand.length;

    for (let i = 0; i < 6; i += 1) {
      state = gameReducer(state, { type: 'ADVANCE_PHASE' });
    }

    expect(state.phase).toBe('main1');
    expect(state.activePlayerId).toBe('p2');
    expect(state.turn).toBe(2);
    expect(state.players[1].hand.length).toBe(p2HandBefore + 1);
  });
});

describe('combat integration', () => {
  it('declares an attacker, blocks it, and resolves damage on entering combatDamage', () => {
    const attacker = makePermanent('cinderHound');
    const blocker = makePermanent('flameScout');
    let state = makeState({
      players: [
        makePlayer('p1', { battlefield: [attacker] }),
        makePlayer('p2', { battlefield: [blocker] }),
      ],
      phase: 'declareAttackers',
    });

    state = gameReducer(state, { type: 'DECLARE_ATTACKERS', attackerIds: [attacker.instanceId] });
    expect(state.attackers).toEqual([attacker.instanceId]);
    expect(state.players[0].battlefield[0].tapped).toBe(true);

    state = gameReducer(state, { type: 'ADVANCE_PHASE' });
    expect(state.phase).toBe('declareBlockers');

    state = gameReducer(state, {
      type: 'DECLARE_BLOCKERS',
      blocks: { [attacker.instanceId]: blocker.instanceId },
    });
    expect(state.blockers).toEqual({ [attacker.instanceId]: blocker.instanceId });

    state = gameReducer(state, { type: 'ADVANCE_PHASE' });
    expect(state.phase).toBe('main2');
    expect(state.players[0].battlefield).toHaveLength(0);
    expect(state.players[1].battlefield).toHaveLength(0);
  });

  it('rejects a block on a flying attacker by a non-flying creature', () => {
    const attacker = makePermanent('ridgeWyvern');
    const blocker = makePermanent('cinderHound');
    let state = makeState({
      players: [
        makePlayer('p1', { battlefield: [attacker] }),
        makePlayer('p2', { battlefield: [blocker] }),
      ],
      phase: 'declareBlockers',
      attackers: [attacker.instanceId],
    });

    state = gameReducer(state, {
      type: 'DECLARE_BLOCKERS',
      blocks: { [attacker.instanceId]: blocker.instanceId },
    });
    expect(state.blockers).toEqual({});
  });
});
