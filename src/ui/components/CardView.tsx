import type { CardDefinition, Permanent } from '../../engine/types';
import { currentPower, currentToughness } from '../../engine/combat';
import { CARD_ART } from '../cardArt';

function formatCost(def: CardDefinition): string {
  if (!def.cost) return '';
  const { generic, flame = 0, tide = 0 } = def.cost;
  const cost = `${generic > 0 ? generic : ''}${'F'.repeat(flame)}${'T'.repeat(tide)}`;
  return cost || '0';
}

const TYPE_LABELS: Record<CardDefinition['type'], string> = {
  land: 'Land',
  creature: 'Creature',
  spell: 'Sorcery',
};

interface CardViewProps {
  def: CardDefinition;
  permanent?: Permanent;
  affordable?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  wide?: boolean;
  onClick?: () => void;
}

export function CardView({ def, permanent, affordable = true, selected, highlighted, wide, onClick }: CardViewProps) {
  const classNames = [
    'card',
    `card--${def.colors[0] ?? 'colorless'}`,
    def.type === 'land' ? 'card--land' : '',
    permanent?.tapped ? 'card--tapped' : '',
    selected ? 'card--selected' : '',
    highlighted ? 'card--highlighted' : '',
    !affordable ? 'card--unaffordable' : '',
    wide ? 'card--wide' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const isCreature = def.type === 'creature';
  const power = isCreature ? (permanent ? currentPower(permanent) : def.power) : undefined;
  const toughness = isCreature ? (permanent ? currentToughness(permanent) : def.toughness) : undefined;

  function statClass(current: number | undefined, base: number | undefined): string {
    if (current === undefined || base === undefined) return '';
    if (current > base) return 'card__pt-value--buffed';
    if (current < base) return 'card__pt-value--debuffed';
    return '';
  }

  const powerClass = statClass(power, def.power);
  const toughnessClass = statClass(toughness, def.toughness);

  return (
    <button type="button" className={classNames} onClick={onClick} disabled={!onClick}>
      <div className="card__header">
        <span className="card__name">{def.name}</span>
        {def.cost && <span className="card__cost">{formatCost(def)}</span>}
      </div>
      <div className="card__type">{TYPE_LABELS[def.type]}</div>
      <img className="card__art" src={CARD_ART[def.id]} alt="" />
      {def.text && <div className="card__text">{def.text}</div>}
      {def.flavor && <div className="card__flavor">{def.flavor}</div>}
      {permanent && permanent.damage > 0 && (
        <div className="card__damage">{permanent.damage} dmg</div>
      )}
      {power !== undefined && toughness !== undefined && (
        <div className="card__pt">
          <span className={powerClass}>{power}</span>/<span className={toughnessClass}>{toughness}</span>
        </div>
      )}
      {permanent?.summoningSickness && <div className="card__badge">sick</div>}
      {permanent?.frozen && <div className="card__badge">frozen</div>}
    </button>
  );
}
