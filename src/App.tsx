import { useEffect, useReducer, useState } from 'react';
import { gameReducer } from './engine/actions';
import { getCard } from './engine/cards';
import { canBlock, findPermanent } from './engine/combat';
import { createInitialGameState, getOpponent, getPlayer, type HandOverrides } from './engine/gameState';
import type { Permanent, PlayerState, TargetRef } from './engine/types';
import { Board } from './ui/components/Board';
import { CombatOverlay } from './ui/components/CombatOverlay';
import { Hand } from './ui/components/Hand';
import { PhaseBar } from './ui/components/PhaseBar';
import { PlayerPanel } from './ui/components/PlayerPanel';

function eligibleAttackerIds(player: PlayerState): Set<string> {
  return new Set(
    player.battlefield
      .filter((p) => !p.tapped && !p.summoningSickness && !p.frozen && getCard(p.defId).type === 'creature')
      .map((p) => p.instanceId),
  );
}

function eligibleBlockerIds(defender: PlayerState, attacker: Permanent | undefined, used: Set<string>): Set<string> {
  if (!attacker) return new Set();
  return new Set(
    defender.battlefield
      .filter((p) => !p.tapped && !p.frozen && !used.has(p.instanceId) && canBlock(p, attacker))
      .map((p) => p.instanceId),
  );
}

function parseHandOverridesFromUrl(): HandOverrides | undefined {
  const params = new URLSearchParams(window.location.search);
  const p1 = params.get('p1');
  const p2 = params.get('p2');
  if (!p1 && !p2) return undefined;
  return {
    p1: p1 ? p1.split(',').filter(Boolean) : undefined,
    p2: p2 ? p2.split(',').filter(Boolean) : undefined,
  };
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createInitialGameState(Math.random, parseHandOverridesFromUrl()),
  );

  const [selectedHandInstanceId, setSelectedHandInstanceId] = useState<string | null>(null);
  const [selectedAttackerIds, setSelectedAttackerIds] = useState<Set<string>>(new Set());
  const [pendingBlockAttackerId, setPendingBlockAttackerId] = useState<string | null>(null);
  const [blockAssignments, setBlockAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelectedHandInstanceId(null);
    setSelectedAttackerIds(new Set());
    setPendingBlockAttackerId(null);
    setBlockAssignments({});
  }, [state.phase, state.turn]);

  const activePlayer = getPlayer(state, state.activePlayerId);
  const opponent = getOpponent(state, state.activePlayerId);
  const inMainPhase = state.phase === 'main1' || state.phase === 'main2';
  const selectedHandCard = selectedHandInstanceId
    ? activePlayer.hand.find((c) => c.instanceId === selectedHandInstanceId)
    : undefined;
  const targetingDef = selectedHandCard ? getCard(selectedHandCard.defId) : undefined;

  function handleHandCardClick(instanceId: string) {
    const card = activePlayer.hand.find((c) => c.instanceId === instanceId);
    if (!card || !inMainPhase) return;
    const def = getCard(card.defId);
    if (def.type === 'land') {
      dispatch({ type: 'PLAY_LAND', instanceId });
      return;
    }
    if (!def.targetKind || def.targetKind === 'none') {
      dispatch({ type: 'CAST_SPELL', instanceId });
      return;
    }
    setSelectedHandInstanceId((prev) => (prev === instanceId ? null : instanceId));
  }

  function castWithTarget(target: TargetRef) {
    if (!selectedHandInstanceId) return;
    dispatch({ type: 'CAST_SPELL', instanceId: selectedHandInstanceId, target });
    setSelectedHandInstanceId(null);
  }

  function handleAttackerBoardClick(instanceId: string) {
    if (state.phase === 'declareAttackers') {
      setSelectedAttackerIds((prev) => {
        const next = new Set(prev);
        if (next.has(instanceId)) next.delete(instanceId);
        else next.add(instanceId);
        return next;
      });
    } else if (state.phase === 'declareBlockers') {
      setPendingBlockAttackerId((prev) => (prev === instanceId ? null : instanceId));
    } else if (targetingDef && (targetingDef.targetKind === 'creature' || targetingDef.targetKind === 'any')) {
      castWithTarget({ kind: 'permanent', instanceId });
    }
  }

  function handleDefenderBoardClick(instanceId: string) {
    if (state.phase === 'declareBlockers' && pendingBlockAttackerId) {
      setBlockAssignments((prev) => ({ ...prev, [pendingBlockAttackerId]: instanceId }));
      setPendingBlockAttackerId(null);
    } else if (targetingDef && (targetingDef.targetKind === 'creature' || targetingDef.targetKind === 'any')) {
      castWithTarget({ kind: 'permanent', instanceId });
    }
  }

  function handlePlayerPanelClick(playerId: string) {
    if (targetingDef && (targetingDef.targetKind === 'player' || targetingDef.targetKind === 'any')) {
      castWithTarget({ kind: 'player', playerId });
    }
  }

  const usedBlockerIds = new Set(Object.values(blockAssignments));
  const pendingAttackerPermanent = pendingBlockAttackerId
    ? findPermanent(state, pendingBlockAttackerId)?.permanent
    : undefined;

  const bottomSelectedIds =
    state.phase === 'declareBlockers'
      ? new Set(pendingBlockAttackerId ? [pendingBlockAttackerId] : [])
      : selectedAttackerIds;

  const canTargetCreature = Boolean(targetingDef) && (targetingDef?.targetKind === 'creature' || targetingDef?.targetKind === 'any');
  const canTargetPlayer = Boolean(targetingDef) && (targetingDef?.targetKind === 'player' || targetingDef?.targetKind === 'any');

  const bottomClickable =
    state.phase === 'declareAttackers'
      ? eligibleAttackerIds(activePlayer)
      : state.phase === 'declareBlockers'
        ? new Set(state.attackers)
        : canTargetCreature
          ? new Set(activePlayer.battlefield.filter((p) => getCard(p.defId).type === 'creature').map((p) => p.instanceId))
          : new Set<string>();

  const topClickable =
    state.phase === 'declareBlockers'
      ? eligibleBlockerIds(opponent, pendingAttackerPermanent, usedBlockerIds)
      : canTargetCreature
        ? new Set(opponent.battlefield.filter((p) => getCard(p.defId).type === 'creature').map((p) => p.instanceId))
        : new Set<string>();

  if (state.winnerId) {
    return (
      <div className="app app--game-over">
        <h1>{state.winnerId} wins!</h1>
        <button type="button" onClick={() => window.location.reload()}>
          New Game
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <PlayerPanel
        player={opponent}
        label={`${opponent.id} (opponent)`}
        isActive={false}
        selectable={canTargetPlayer}
        onSelect={() => handlePlayerPanelClick(opponent.id)}
      />
      <Board player={opponent} label={opponent.id} onPermanentClick={handleDefenderBoardClick} clickableIds={topClickable} />

      <PhaseBar
        phase={state.phase}
        activePlayerLabel={`${activePlayer.id} (active)`}
        turn={state.turn}
        onAdvance={() => dispatch({ type: 'ADVANCE_PHASE' })}
      />
      <CombatOverlay
        phase={state.phase}
        selectedAttackerCount={selectedAttackerIds.size}
        blockAssignmentCount={Object.keys(blockAssignments).length}
        attackerCount={state.attackers.length}
        onConfirmAttackers={() =>
          dispatch({ type: 'DECLARE_ATTACKERS', attackerIds: Array.from(selectedAttackerIds) })
        }
        onConfirmBlockers={() => dispatch({ type: 'DECLARE_BLOCKERS', blocks: blockAssignments })}
      />

      <Board
        player={activePlayer}
        label={activePlayer.id}
        onPermanentClick={handleAttackerBoardClick}
        selectedIds={bottomSelectedIds}
        clickableIds={bottomClickable}
      />
      <Hand
        hand={activePlayer.hand}
        owner={activePlayer}
        canAct={inMainPhase}
        selectedInstanceId={selectedHandInstanceId}
        onCardClick={handleHandCardClick}
      />
      <PlayerPanel player={activePlayer} label={`${activePlayer.id} (you)`} isActive selectable={false} />

      <div className="log">
        {state.log.slice(-5).map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
      </div>
    </div>
  );
}
