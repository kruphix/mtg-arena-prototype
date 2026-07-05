import type { Phase } from '../../engine/types';

const PHASE_LABELS: Record<Phase, string> = {
  untap: 'Untap',
  draw: 'Draw',
  main1: 'Main Phase 1',
  beginCombat: 'Begin Combat',
  declareAttackers: 'Declare Attackers',
  declareBlockers: 'Declare Blockers',
  combatDamage: 'Combat Damage',
  main2: 'Main Phase 2',
  end: 'End Step',
  cleanup: 'Cleanup',
};

interface PhaseBarProps {
  phase: Phase;
  activePlayerLabel: string;
  turn: number;
  onAdvance: () => void;
}

export function PhaseBar({ phase, activePlayerLabel, turn, onAdvance }: PhaseBarProps) {
  return (
    <div className="phase-bar">
      <div className="phase-bar__info">
        Turn {turn} · {activePlayerLabel} · {PHASE_LABELS[phase]}
      </div>
      <button type="button" className="phase-bar__button" onClick={onAdvance}>
        {phase === 'end' ? 'End Turn' : 'Next Phase'}
      </button>
    </div>
  );
}
