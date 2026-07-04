import type { CardDefinition, Permanent } from '../../engine/types';
import { currentPower, currentToughness } from '../../engine/combat';

function formatCost(def: CardDefinition): string {
  if (!def.cost) return '';
  const { generic, flame = 0, tide = 0 } = def.cost;
  const cost = `${generic > 0 ? generic : ''}${'F'.repeat(flame)}${'T'.repeat(tide)}`;
  return cost || '0';
}

interface CardViewProps {
  def: CardDefinition;
  permanent?: Permanent;
  affordable?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
}

export function CardView({ def, permanent, affordable = true, selected, highlighted, onClick }: CardViewProps) {
  const classNames = [
    'card',
    `card--${def.colors[0] ?? 'colorless'}`,
    def.type === 'land' ? 'card--land' : '',
    permanent?.tapped ? 'card--tapped' : '',
    selected ? 'card--selected' : '',
    highlighted ? 'card--highlighted' : '',
    !affordable ? 'card--unaffordable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const isCreature = def.type === 'creature';
  const power = isCreature ? (permanent ? currentPower(permanent) : def.power) : undefined;
  const toughness = isCreature ? (permanent ? currentToughness(permanent) : def.toughness) : undefined;

  return (
    <button type="button" className={classNames} onClick={onClick} disabled={!onClick}>
      <div className="card__header">
        <span className="card__name">{def.name}</span>
        {def.cost && <span className="card__cost">{formatCost(def)}</span>}
      </div>
      {def.text && <div className="card__text">{def.text}</div>}
      {def.flavor && <div className="card__flavor">{def.flavor}</div>}
      {permanent && permanent.damage > 0 && (
        <div className="card__damage">{permanent.damage} dmg</div>
      )}
      {power !== undefined && toughness !== undefined && (
        <div className="card__pt">
          {power}/{toughness}
        </div>
      )}
      {permanent?.summoningSickness && <div className="card__badge">sick</div>}
      {permanent?.frozen && <div className="card__badge">frozen</div>}
    </button>
  );
}
