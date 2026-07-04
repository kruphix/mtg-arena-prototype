import { describe, expect, it } from 'vitest';
import { applyEffect } from './effects';
import { makePermanent, makePlayer, makeState, handCard } from './testUtils';

describe('applyEffect', () => {
  it('dealDamage3 reduces a target player life and can trigger a win', () => {
    const state = makeState({
      players: [makePlayer('p1'), makePlayer('p2', { life: 3 })],
    });
    applyEffect(state, 'dealDamage3', 'p1', { kind: 'player', playerId: 'p2' });
    expect(state.players[1].life).toBe(0);
    expect(state.winnerId).toBe('p1');
  });

  it('dealDamage5Creature kills a creature and moves it to the graveyard', () => {
    const target = makePermanent('cinderHound');
    const state = makeState({
      players: [makePlayer('p1'), makePlayer('p2', { battlefield: [target] })],
    });
    applyEffect(state, 'dealDamage5Creature', 'p1', { kind: 'permanent', instanceId: target.instanceId });
    expect(state.players[1].battlefield).toHaveLength(0);
    expect(state.players[1].graveyard).toHaveLength(1);
  });

  it('drawCards2 draws two cards for the caster', () => {
    const state = makeState({
      players: [
        makePlayer('p1', { library: [handCard('emberWhelp'), handCard('flameScout')] }),
        makePlayer('p2'),
      ],
    });
    applyEffect(state, 'drawCards2', 'p1', undefined);
    expect(state.players[0].hand).toHaveLength(2);
    expect(state.players[0].library).toHaveLength(0);
  });

  it('gainLife5 increases the caster life total', () => {
    const state = makeState({ players: [makePlayer('p1', { life: 10 }), makePlayer('p2')] });
    applyEffect(state, 'gainLife5', 'p1', undefined);
    expect(state.players[0].life).toBe(15);
  });

  it('bounceCreature returns a permanent to its controller hand', () => {
    const target = makePermanent('shoalGuardian');
    const state = makeState({
      players: [makePlayer('p1'), makePlayer('p2', { battlefield: [target] })],
    });
    applyEffect(state, 'bounceCreature', 'p1', { kind: 'permanent', instanceId: target.instanceId });
    expect(state.players[1].battlefield).toHaveLength(0);
    expect(state.players[1].hand).toHaveLength(1);
  });

  it('damageAllCreatures2 damages creatures but leaves lands untouched', () => {
    const creature = makePermanent('firebrandAdept');
    const land = makePermanent('ashcrag');
    const state = makeState({
      players: [
        makePlayer('p1', { battlefield: [land] }),
        makePlayer('p2', { battlefield: [creature] }),
      ],
    });
    applyEffect(state, 'damageAllCreatures2', 'p1', undefined);
    expect(state.players[0].battlefield).toHaveLength(1);
    expect(state.players[0].battlefield[0].damage).toBe(0);
    expect(state.players[1].battlefield[0].damage).toBe(2);
  });

  it('pumpPower3 grants a temporary power bonus', () => {
    const target = makePermanent('emberWhelp');
    const state = makeState({
      players: [makePlayer('p1', { battlefield: [target] }), makePlayer('p2')],
    });
    applyEffect(state, 'pumpPower3', 'p1', { kind: 'permanent', instanceId: target.instanceId });
    expect(state.players[0].battlefield[0].tempPowerBonus).toBe(3);
  });
});
