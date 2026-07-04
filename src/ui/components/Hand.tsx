import { getCard } from '../../engine/cards';
import { canAffordCost } from '../../engine/actions';
import type { CardInstance, PlayerState } from '../../engine/types';
import { CardView } from './CardView';

interface HandProps {
  hand: CardInstance[];
  owner: PlayerState;
  faceDown?: boolean;
  canAct: boolean;
  selectedInstanceId?: string | null;
  onCardClick: (instanceId: string) => void;
}

export function Hand({ hand, owner, faceDown, canAct, selectedInstanceId, onCardClick }: HandProps) {
  if (faceDown) {
    return (
      <div className="hand hand--face-down">
        {hand.map((card) => (
          <div key={card.instanceId} className="card card--back" />
        ))}
      </div>
    );
  }

  return (
    <div className="hand">
      {hand.map((card) => {
        const def = getCard(card.defId);
        const affordable = def.type === 'land' ? !owner.landPlayedThisTurn : def.cost ? canAffordCost(owner, def.cost) : true;
        return (
          <CardView
            key={card.instanceId}
            def={def}
            affordable={!canAct || affordable}
            selected={selectedInstanceId === card.instanceId}
            onClick={canAct ? () => onCardClick(card.instanceId) : undefined}
          />
        );
      })}
    </div>
  );
}
