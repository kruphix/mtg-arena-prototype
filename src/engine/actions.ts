import { getCard } from './cards';
import { canBlock, findPermanent, resolveCombatDamage } from './combat';
import { applyEffect } from './effects';
import { drawCard, getOpponent, getPlayer } from './gameState';
import type { GameAction, GameState, ManaCost, Permanent, Phase, PlayerState, TargetKind, TargetRef } from './types';

const PHASE_ORDER: Phase[] = [
  'untap',
  'draw',
  'main1',
  'beginCombat',
  'declareAttackers',
  'declareBlockers',
  'combatDamage',
  'main2',
  'end',
  'cleanup',
];

const AUTO_PHASES = new Set<Phase>(['untap', 'draw', 'cleanup', 'combatDamage']);

function makePermanent(instanceId: string, defId: string, summoningSickness: boolean): Permanent {
  return {
    instanceId,
    defId,
    tapped: false,
    summoningSickness,
    damage: 0,
    frozen: false,
    tempPowerBonus: 0,
    tempToughnessBonus: 0,
  };
}

function selectLandsForCost(player: PlayerState, cost: ManaCost): Permanent[] | null {
  const untappedLands = player.battlefield.filter(
    (p) => !p.tapped && !p.frozen && getCard(p.defId).type === 'land',
  );
  const flameNeeded = cost.flame ?? 0;
  const tideNeeded = cost.tide ?? 0;

  const flameLands = untappedLands.filter((p) => getCard(p.defId).producesColor === 'flame');
  const tideLands = untappedLands.filter((p) => getCard(p.defId).producesColor === 'tide');

  if (flameLands.length < flameNeeded || tideLands.length < tideNeeded) return null;

  const chosenFlame = flameLands.slice(0, flameNeeded);
  const chosenTide = tideLands.slice(0, tideNeeded);
  const usedIds = new Set([...chosenFlame, ...chosenTide].map((p) => p.instanceId));
  const remaining = untappedLands.filter((p) => !usedIds.has(p.instanceId));

  if (remaining.length < cost.generic) return null;
  const chosenGeneric = remaining.slice(0, cost.generic);

  return [...chosenFlame, ...chosenTide, ...chosenGeneric];
}

function payManaCost(player: PlayerState, cost: ManaCost): boolean {
  const chosen = selectLandsForCost(player, cost);
  if (!chosen) return false;
  for (const land of chosen) land.tapped = true;
  return true;
}

export function canAffordCost(player: PlayerState, cost: ManaCost): boolean {
  return selectLandsForCost(player, cost) !== null;
}

function onEnterPhase(state: GameState): void {
  const player = getPlayer(state, state.activePlayerId);
  switch (state.phase) {
    case 'untap':
      for (const permanent of player.battlefield) {
        if (permanent.frozen) {
          permanent.frozen = false;
        } else {
          permanent.tapped = false;
        }
        permanent.summoningSickness = false;
      }
      player.landPlayedThisTurn = false;
      break;
    case 'draw':
      drawCard(state, player.id);
      break;
    case 'combatDamage':
      resolveCombatDamage(state);
      break;
    case 'cleanup':
      for (const p of state.players) {
        for (const permanent of p.battlefield) {
          permanent.damage = 0;
          permanent.tempPowerBonus = 0;
          permanent.tempToughnessBonus = 0;
        }
      }
      break;
    default:
      break;
  }
}

function stepOnce(state: GameState): void {
  const idx = PHASE_ORDER.indexOf(state.phase);
  const isLast = idx === PHASE_ORDER.length - 1;
  if (isLast) {
    const nextPlayer = getOpponent(state, state.activePlayerId).id;
    state.activePlayerId = nextPlayer;
    state.turn += 1;
    state.phase = 'untap';
  } else {
    state.phase = PHASE_ORDER[idx + 1];
  }
  onEnterPhase(state);
}

function advancePhase(state: GameState): void {
  do {
    stepOnce(state);
  } while (AUTO_PHASES.has(state.phase) && !state.winnerId);
}

function playLand(state: GameState, instanceId: string): void {
  if (state.phase !== 'main1' && state.phase !== 'main2') return;
  const player = getPlayer(state, state.activePlayerId);
  if (player.landPlayedThisTurn) return;

  const idx = player.hand.findIndex((c) => c.instanceId === instanceId);
  if (idx === -1) return;
  const card = player.hand[idx];
  const def = getCard(card.defId);
  if (def.type !== 'land') return;

  player.hand.splice(idx, 1);
  player.battlefield.push(makePermanent(card.instanceId, card.defId, false));
  player.landPlayedThisTurn = true;
  state.log.push(`${player.id} played ${def.name}.`);
}

function isValidTarget(state: GameState, targetKind: TargetKind | undefined, target: TargetRef | undefined): boolean {
  const kind = targetKind ?? 'none';
  if (kind === 'none') return true;
  if (!target) return false;

  if (target.kind === 'permanent') {
    if (kind === 'player') return false;
    const found = findPermanent(state, target.instanceId);
    return found !== undefined && getCard(found.permanent.defId).type === 'creature';
  }

  if (kind === 'creature') return false;
  return state.players.some((p) => p.id === target.playerId);
}

function castSpell(state: GameState, instanceId: string, target: TargetRef | undefined): void {
  if (state.phase !== 'main1' && state.phase !== 'main2') return;
  const player = getPlayer(state, state.activePlayerId);

  const idx = player.hand.findIndex((c) => c.instanceId === instanceId);
  if (idx === -1) return;
  const card = player.hand[idx];
  const def = getCard(card.defId);
  if (def.type === 'land' || !def.cost) return;
  if (!isValidTarget(state, def.targetKind, target)) return;

  if (!payManaCost(player, def.cost)) return;
  player.hand.splice(idx, 1);

  if (def.type === 'creature') {
    player.battlefield.push(makePermanent(card.instanceId, card.defId, true));
    if (def.effectKey) applyEffect(state, def.effectKey, player.id, target);
  } else {
    if (def.effectKey) applyEffect(state, def.effectKey, player.id, target);
    player.graveyard.push({ instanceId: card.instanceId, defId: card.defId });
  }
  state.log.push(`${player.id} cast ${def.name}.`);
}

function declareAttackers(state: GameState, attackerIds: string[]): void {
  if (state.phase !== 'declareAttackers') return;
  const player = getPlayer(state, state.activePlayerId);

  const validIds = attackerIds.filter((id) => {
    const permanent = player.battlefield.find((p) => p.instanceId === id);
    if (!permanent) return false;
    if (permanent.tapped || permanent.summoningSickness || permanent.frozen) return false;
    return getCard(permanent.defId).type === 'creature';
  });

  for (const id of validIds) {
    const permanent = player.battlefield.find((p) => p.instanceId === id);
    if (permanent) permanent.tapped = true;
  }
  state.attackers = validIds;
}

function declareBlockers(state: GameState, blocks: Record<string, string>): void {
  if (state.phase !== 'declareBlockers') return;
  const defender = getOpponent(state, state.activePlayerId);

  const validBlocks: Record<string, string> = {};
  const usedBlockers = new Set<string>();

  for (const [attackerId, blockerId] of Object.entries(blocks)) {
    if (!state.attackers.includes(attackerId)) continue;
    if (usedBlockers.has(blockerId)) continue;

    const blockerPermanent = defender.battlefield.find((p) => p.instanceId === blockerId);
    if (!blockerPermanent || blockerPermanent.tapped || blockerPermanent.frozen) continue;

    const attackerFound = findPermanent(state, attackerId);
    if (!attackerFound) continue;
    if (!canBlock(blockerPermanent, attackerFound.permanent)) continue;

    validBlocks[attackerId] = blockerId;
    usedBlockers.add(blockerId);
  }
  state.blockers = validBlocks;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const next = structuredClone(state);
  switch (action.type) {
    case 'PLAY_LAND':
      playLand(next, action.instanceId);
      break;
    case 'CAST_SPELL':
      castSpell(next, action.instanceId, action.target);
      break;
    case 'ADVANCE_PHASE':
      advancePhase(next);
      break;
    case 'DECLARE_ATTACKERS':
      declareAttackers(next, action.attackerIds);
      break;
    case 'DECLARE_BLOCKERS':
      declareBlockers(next, action.blocks);
      break;
    default:
      break;
  }
  return next;
}
