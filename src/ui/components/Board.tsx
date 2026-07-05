import { getCard } from '../../engine/cards';
import type { PlayerState } from '../../engine/types';
import { CardView } from './CardView';

interface BoardProps {
  player: PlayerState;
  label: string;
  onPermanentClick?: (instanceId: string) => void;
  selectedIds?: Set<string>;
  clickableIds?: Set<string>;
}

export function Board({ player, label, onPermanentClick, selectedIds, clickableIds }: BoardProps) {
  const nonLands = player.battlefield.filter((p) => getCard(p.defId).type !== 'land');
  const lands = player.battlefield.filter((p) => getCard(p.defId).type === 'land');

  function renderCard(permanent: (typeof player.battlefield)[number]) {
    const def = getCard(permanent.defId);
    const clickable = clickableIds ? clickableIds.has(permanent.instanceId) : false;
    return (
      <CardView
        key={permanent.instanceId}
        def={def}
        permanent={permanent}
        selected={selectedIds?.has(permanent.instanceId)}
        onClick={clickable && onPermanentClick ? () => onPermanentClick(permanent.instanceId) : undefined}
      />
    );
  }

  return (
    <div className="board-row">
      <div className="board-row__label">{label}</div>
      <div className="board-row__rows">
        <div className="board-row__cards">
          {player.battlefield.length === 0 && <div className="board-row__empty">no permanents</div>}
          {nonLands.map(renderCard)}
        </div>
        {lands.length > 0 && <div className="board-row__cards">{lands.map(renderCard)}</div>}
      </div>
    </div>
  );
}
