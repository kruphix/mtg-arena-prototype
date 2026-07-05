// One-off generator for placeholder card art SVGs, keyed by card defId.
// Run with: node --experimental-strip-types scripts/generate-card-art.mjs
// Regenerate any time cards.ts changes; replace individual files under
// public/cards/ with real art whenever it's ready (keep the same filenames).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARDS } from '../src/engine/cards.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'cards');
mkdirSync(outDir, { recursive: true });

const PALETTE = {
  flame: { bg: '#3a2018', accent: '#d9633b' },
  tide: { bg: '#16283a', accent: '#3b8ed9' },
  colorless: { bg: '#23262e', accent: '#7a8090' },
};

function shape(type, accent) {
  switch (type) {
    case 'land':
      return `<polygon points="150,18 272,60 150,102 28,60" fill="none" stroke="${accent}" stroke-width="5"/>`;
    case 'creature':
      return `<circle cx="150" cy="60" r="38" fill="none" stroke="${accent}" stroke-width="5"/>`;
    case 'spell':
    default:
      return `<path d="M150 16 L166 48 L202 48 L174 70 L186 104 L150 82 L114 104 L126 70 L98 48 L134 48 Z" fill="none" stroke="${accent}" stroke-width="5" stroke-linejoin="round"/>`;
  }
}

function svgFor(card) {
  const colorKey = card.colors[0] ?? 'colorless';
  const { bg, accent } = PALETTE[colorKey];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120">
  <rect width="300" height="120" fill="${bg}"/>
  ${shape(card.type, accent)}
</svg>
`;
}

let count = 0;
for (const card of Object.values(CARDS)) {
  writeFileSync(join(outDir, `${card.id}.svg`), svgFor(card));
  count += 1;
}

console.log(`Wrote ${count} placeholder card art files to ${outDir}`);
