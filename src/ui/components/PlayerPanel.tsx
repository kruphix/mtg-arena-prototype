import type { PlayerState } from '../../engine/types';

interface PlayerPanelProps {
  player: PlayerState;
  label: string;
  isActive: boolean;
  selectable?: boolean;
  onSelect?: () => void;
}

export function PlayerPanel({ player, label, isActive, selectable, onSelect }: PlayerPanelProps) {
  return (
    <button
      type="button"
      className={`player-panel${isActive ? ' player-panel--active' : ''}${selectable ? ' player-panel--selectable' : ''}`}
      onClick={selectable ? onSelect : undefined}
      disabled={!selectable}
    >
      <div className="player-panel__label">{label}</div>
      <div className="player-panel__life">{player.life} life</div>
      <div className="player-panel__stats">
        Hand {player.hand.length} · Library {player.library.length} · Graveyard {player.graveyard.length}
      </div>
    </button>
  );
}
