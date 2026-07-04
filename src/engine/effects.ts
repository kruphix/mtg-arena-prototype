import { findPermanent, isLethal } from './combat';
import { drawCard, getOpponent, getPlayer } from './gameState';
import type { GameState, TargetRef } from './types';

function moveToGraveyardIfDead(state: GameState, instanceId: string): void {
  const found = findPermanent(state, instanceId);
  if (!found) return;
  if (!isLethal(found.permanent)) return;
  const idx = found.player.battlefield.findIndex((p) => p.instanceId === instanceId);
  if (idx === -1) return;
  const [permanent] = found.player.battlefield.splice(idx, 1);
  found.player.graveyard.push({ instanceId: permanent.instanceId, defId: permanent.defId });
}

function checkWinCondition(state: GameState): void {
  for (const player of state.players) {
    if (player.life <= 0 && !state.winnerId) {
      const opponent = getOpponent(state, player.id);
      state.winnerId = opponent.id;
      state.log.push(`${player.id} has fallen to 0 life. ${opponent.id} wins.`);
    }
  }
}

function dealDamageToTarget(state: GameState, target: TargetRef | undefined, amount: number): void {
  if (!target) return;
  if (target.kind === 'player') {
    const player = getPlayer(state, target.playerId);
    player.life -= amount;
    checkWinCondition(state);
    return;
  }
  const found = findPermanent(state, target.instanceId);
  if (!found) return;
  found.permanent.damage += amount;
  moveToGraveyardIfDead(state, target.instanceId);
}

type EffectFn = (state: GameState, casterId: string, target: TargetRef | undefined) => void;

export const EFFECTS: Record<string, EffectFn> = {
  firebrandAdeptEtb: (state, _casterId, target) => dealDamageToTarget(state, target, 1),
  dealDamage3: (state, _casterId, target) => dealDamageToTarget(state, target, 3),
  dealDamage5Creature: (state, _casterId, target) => dealDamageToTarget(state, target, 5),

  pumpPower3: (state, _casterId, target) => {
    if (!target || target.kind !== 'permanent') return;
    const found = findPermanent(state, target.instanceId);
    if (found) found.permanent.tempPowerBonus += 3;
  },

  pumpToughness3: (state, _casterId, target) => {
    if (!target || target.kind !== 'permanent') return;
    const found = findPermanent(state, target.instanceId);
    if (found) found.permanent.tempToughnessBonus += 3;
  },

  damageAllCreatures2: (state) => {
    for (const player of state.players) {
      for (const permanent of player.battlefield) {
        permanent.damage += 2;
      }
    }
    for (const player of state.players) {
      const deadIds = player.battlefield.filter((p) => isLethal(p)).map((p) => p.instanceId);
      for (const id of deadIds) {
        const idx = player.battlefield.findIndex((p) => p.instanceId === id);
        if (idx === -1) continue;
        const [permanent] = player.battlefield.splice(idx, 1);
        player.graveyard.push({ instanceId: permanent.instanceId, defId: permanent.defId });
      }
    }
  },

  drawCardEtb: (state, casterId) => drawCard(state, casterId),
  drawCards2: (state, casterId) => {
    drawCard(state, casterId);
    drawCard(state, casterId);
  },

  bounceCreature: (state, _casterId, target) => {
    if (!target || target.kind !== 'permanent') return;
    const found = findPermanent(state, target.instanceId);
    if (!found) return;
    const idx = found.player.battlefield.findIndex((p) => p.instanceId === target.instanceId);
    if (idx === -1) return;
    const [permanent] = found.player.battlefield.splice(idx, 1);
    found.player.hand.push({ instanceId: permanent.instanceId, defId: permanent.defId });
  },

  gainLife5: (state, casterId) => {
    getPlayer(state, casterId).life += 5;
  },

  tapAndFreeze: (state, _casterId, target) => {
    if (!target || target.kind !== 'permanent') return;
    const found = findPermanent(state, target.instanceId);
    if (!found) return;
    found.permanent.tapped = true;
    found.permanent.frozen = true;
  },
};

export function applyEffect(state: GameState, effectKey: string, casterId: string, target: TargetRef | undefined): void {
  const effect = EFFECTS[effectKey];
  if (!effect) return;
  effect(state, casterId, target);
}
