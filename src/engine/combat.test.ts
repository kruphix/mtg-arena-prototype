import { describe, expect, it } from 'vitest';
import { canBlock, resolveCombatDamage } from './combat';
import { makePermanent, makePlayer, makeState } from './testUtils';

describe('canBlock', () => {
  it('a flying attacker cannot be blocked by a non-flying creature', () => {
    const attacker = makePermanent('ridgeWyvern');
    const blocker = makePermanent('cinderHound');
    expect(canBlock(blocker, attacker)).toBe(false);
  });

  it('a flying attacker can be blocked by a flying creature', () => {
    const attacker = makePermanent('ridgeWyvern');
    const blocker = makePermanent('tideSprite');
    expect(canBlock(blocker, attacker)).toBe(true);
  });

  it('a non-flying attacker can be blocked by anything', () => {
    const attacker = makePermanent('cinderHound');
    const blocker = makePermanent('pearlDiver');
    expect(canBlock(blocker, attacker)).toBe(true);
  });
});

describe('resolveCombatDamage', () => {
  it('deals damage to the defending player when unblocked', () => {
    const attacker = makePermanent('flameScout');
    const state = makeState({
      players: [
        makePlayer('p1', { battlefield: [attacker] }),
        makePlayer('p2', { life: 20 }),
      ],
      attackers: [attacker.instanceId],
    });
    resolveCombatDamage(state);
    expect(state.players[1].life).toBe(18);
  });

  it('trades lethal damage between attacker and blocker', () => {
    const attacker = makePermanent('cinderHound');
    const blocker = makePermanent('flameScout');
    const state = makeState({
      players: [
        makePlayer('p1', { battlefield: [attacker] }),
        makePlayer('p2', { battlefield: [blocker] }),
      ],
      attackers: [attacker.instanceId],
      blockers: { [attacker.instanceId]: blocker.instanceId },
    });
    resolveCombatDamage(state);
    expect(state.players[0].battlefield).toHaveLength(0);
    expect(state.players[1].battlefield).toHaveLength(0);
    expect(state.players[0].graveyard).toHaveLength(1);
    expect(state.players[1].graveyard).toHaveLength(1);
  });

  it('tramples excess damage over a smaller blocker', () => {
    const attacker = makePermanent('magmaBrute');
    const blocker = makePermanent('emberWhelp');
    const state = makeState({
      players: [
        makePlayer('p1', { battlefield: [attacker] }),
        makePlayer('p2', { battlefield: [blocker], life: 20 }),
      ],
      attackers: [attacker.instanceId],
      blockers: { [attacker.instanceId]: blocker.instanceId },
    });
    resolveCombatDamage(state);
    expect(state.players[1].life).toBe(16);
    expect(state.players[1].battlefield).toHaveLength(0);
  });

  it('sets winnerId when defending player drops to 0 life', () => {
    const attacker = makePermanent('tidalLeviathan');
    const state = makeState({
      players: [
        makePlayer('p1', { battlefield: [attacker] }),
        makePlayer('p2', { life: 5 }),
      ],
      attackers: [attacker.instanceId],
    });
    resolveCombatDamage(state);
    expect(state.winnerId).toBe('p1');
  });
});
