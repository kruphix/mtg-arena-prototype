import type { Phase } from '../../engine/types';

interface CombatOverlayProps {
  phase: Phase;
  selectedAttackerCount: number;
  blockAssignmentCount: number;
  attackerCount: number;
  onConfirmAttackers: () => void;
  onConfirmBlockers: () => void;
}

export function CombatOverlay({
  phase,
  selectedAttackerCount,
  blockAssignmentCount,
  attackerCount,
  onConfirmAttackers,
  onConfirmBlockers,
}: CombatOverlayProps) {
  if (phase === 'declareAttackers') {
    return (
      <div className="combat-overlay">
        <span>Click your creatures to select attackers ({selectedAttackerCount} selected).</span>
        <button type="button" onClick={onConfirmAttackers}>
          Confirm Attackers
        </button>
      </div>
    );
  }

  if (phase === 'declareBlockers') {
    return (
      <div className="combat-overlay">
        <span>
          Click an attacker, then click one of your creatures to block it ({blockAssignmentCount}/{attackerCount}{' '}
          assigned).
        </span>
        <button type="button" onClick={onConfirmBlockers}>
          Confirm Blockers
        </button>
      </div>
    );
  }

  return null;
}
