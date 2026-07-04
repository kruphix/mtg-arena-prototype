export type Color = 'flame' | 'tide';

export type CardType = 'land' | 'creature' | 'spell';

export type Keyword = 'flying' | 'trample';

export type TargetKind = 'creature' | 'player' | 'any' | 'none';

export interface ManaCost {
  generic: number;
  flame?: number;
  tide?: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  text: string;
  cost?: ManaCost;
  colors: Color[];
  producesColor?: Color;
  power?: number;
  toughness?: number;
  keywords?: Keyword[];
  effectKey?: string;
  targetKind?: TargetKind;
}

export interface CardInstance {
  instanceId: string;
  defId: string;
}

export interface Permanent extends CardInstance {
  tapped: boolean;
  summoningSickness: boolean;
  damage: number;
  frozen: boolean;
  tempPowerBonus: number;
  tempToughnessBonus: number;
}

export type Phase =
  | 'untap'
  | 'draw'
  | 'main1'
  | 'beginCombat'
  | 'declareAttackers'
  | 'declareBlockers'
  | 'combatDamage'
  | 'main2'
  | 'end'
  | 'cleanup';

export interface PlayerState {
  id: string;
  life: number;
  library: CardInstance[];
  hand: CardInstance[];
  battlefield: Permanent[];
  graveyard: CardInstance[];
  landPlayedThisTurn: boolean;
}

export interface CombatAssignment {
  attackerId: string;
  blockerId?: string;
}

export interface GameState {
  players: [PlayerState, PlayerState];
  activePlayerId: string;
  turn: number;
  phase: Phase;
  attackers: string[];
  blockers: Record<string, string>;
  log: string[];
  winnerId?: string;
}

export type TargetRef =
  | { kind: 'permanent'; instanceId: string }
  | { kind: 'player'; playerId: string };

export type GameAction =
  | { type: 'PLAY_LAND'; instanceId: string }
  | { type: 'CAST_SPELL'; instanceId: string; target?: TargetRef }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'DECLARE_ATTACKERS'; attackerIds: string[] }
  | { type: 'DECLARE_BLOCKERS'; blocks: Record<string, string> };
