import { getCard } from './cards';
import { getOpponent, getPlayer } from './gameState';
import type { GameState, Permanent, PlayerState } from './types';

export function findPermanent(state: GameState, instanceId: string): { player: PlayerState; permanent: Permanent } | undefined {
  for (const player of state.players) {
    const permanent = player.battlefield.find((p) => p.instanceId === instanceId);
    if (permanent) return { player, permanent };
  }
  return undefined;
}

export function currentPower(permanent: Permanent): number {
  const def = getCard(permanent.defId);
  return (def.power ?? 0) + permanent.tempPowerBonus;
}

export function currentToughness(permanent: Permanent): number {
  const def = getCard(permanent.defId);
  return (def.toughness ?? 0) + permanent.tempToughnessBonus;
}

export function isLethal(permanent: Permanent): boolean {
  return permanent.damage >= currentToughness(permanent);
}

export function hasFlying(permanent: Permanent): boolean {
  return getCard(permanent.defId).keywords?.includes('flying') ?? false;
}

export function hasTrample(permanent: Permanent): boolean {
  return getCard(permanent.defId).keywords?.includes('trample') ?? false;
}

export function canBlock(blocker: Permanent, attacker: Permanent): boolean {
  if (hasFlying(attacker) && !hasFlying(blocker)) return false;
  return true;
}

function moveToGraveyard(player: PlayerState, instanceId: string): void {
  const idx = player.battlefield.findIndex((p) => p.instanceId === instanceId);
  if (idx === -1) return;
  const [permanent] = player.battlefield.splice(idx, 1);
  player.graveyard.push({ instanceId: permanent.instanceId, defId: permanent.defId });
}

export function resolveCombatDamage(state: GameState): void {
  const attackingPlayer = getPlayer(state, state.activePlayerId);
  const defendingPlayer = getOpponent(state, state.activePlayerId);

  const deaths: string[] = [];

  for (const attackerId of state.attackers) {
    const found = findPermanent(state, attackerId);
    if (!found) continue;
    const attacker = found.permanent;
    const blockerId = state.blockers[attackerId];
    const blockerFound = blockerId ? findPermanent(state, blockerId) : undefined;

    if (blockerFound) {
      const blocker = blockerFound.permanent;
      const attackerPower = currentPower(attacker);
      blocker.damage += attackerPower;
      attacker.damage += currentPower(blocker);

      if (hasTrample(attacker)) {
        const excess = attackerPower - currentToughness(blocker);
        if (excess > 0) defendingPlayer.life -= excess;
      }

      if (isLethal(blocker)) deaths.push(blocker.instanceId);
      if (isLethal(attacker)) deaths.push(attacker.instanceId);
    } else {
      defendingPlayer.life -= currentPower(attacker);
    }
  }

  for (const instanceId of deaths) {
    const found = findPermanent(state, instanceId);
    if (found) moveToGraveyard(found.player, instanceId);
  }

  state.attackers = [];
  state.blockers = {};

  if (defendingPlayer.life <= 0) {
    state.winnerId = attackingPlayer.id;
    state.log.push(`${defendingPlayer.id} has fallen to 0 life. ${attackingPlayer.id} wins.`);
  }
}
