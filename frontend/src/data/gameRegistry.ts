export type CognitiveDomain = 'memory' | 'attention' | 'logic' | 'processing_speed' | 'comprehension';

export interface GameInfo {
  id: string;
  name: string;
  emoji: string;
  domain: CognitiveDomain;
  order: number;
  route: string;
  description: string;
  color: string;
  instructions: string;
}

export const DOMAIN_COLORS: Record<CognitiveDomain, string> = {
  memory: '#7C4DFF',
  attention: '#FF6D00',
  logic: '#00BFA5',
  processing_speed: '#FF1744',
  comprehension: '#2979FF',
};

export const DOMAIN_LABELS: Record<CognitiveDomain, string> = {
  memory: 'Memory',
  attention: 'Attention',
  logic: 'Logic',
  processing_speed: 'Speed',
  comprehension: 'Comprehension',
};

export const DOMAIN_EMOJI: Record<CognitiveDomain, string> = {
  memory: '🧠',
  attention: '👁️',
  logic: '🧩',
  processing_speed: '⚡',
  comprehension: '📖',
};

export const GAMES: GameInfo[] = [
  {
    id: 'color-recall',
    name: 'Color Recall',
    emoji: '🎨',
    domain: 'memory',
    order: 1,
    route: '/games/color-recall',
    description: 'Remember and repeat the color sequence!',
    color: '#7C4DFF',
    instructions: 'Watch the tiles flash, then tap them in the same order.',
  },
  {
    id: 'speed-tap',
    name: 'Speed Tap',
    emoji: '⚡',
    domain: 'processing_speed',
    order: 2,
    route: '/games/speed-tap',
    description: 'Tap the target as fast as you can!',
    color: '#FF1744',
    instructions: 'When a circle appears, tap it as quickly as possible!',
  },
  {
    id: 'balloon-pop',
    name: 'Balloon Pop',
    emoji: '🎈',
    domain: 'attention',
    order: 3,
    route: '/games/balloon-pop',
    description: 'Pop the right balloons, skip the wrong ones!',
    color: '#FF6D00',
    instructions: 'Tap the orange balloons. Don\'t tap the red ones!',
  },
  {
    id: 'card-match',
    name: 'Card Match',
    emoji: '🃏',
    domain: 'memory',
    order: 4,
    route: '/games/card-match',
    description: 'Find all the matching pairs!',
    color: '#7C4DFF',
    instructions: 'Flip two cards at a time. Find all matching pairs!',
  },
  {
    id: 'odd-one-out',
    name: 'Odd One Out',
    emoji: '🔍',
    domain: 'attention',
    order: 5,
    route: '/games/odd-one-out',
    description: 'Spot the one that doesn\'t belong!',
    color: '#FF6D00',
    instructions: 'Find and tap the shape that is different from the others.',
  },
  {
    id: 'pattern-puzzle',
    name: 'Pattern Puzzle',
    emoji: '🧩',
    domain: 'logic',
    order: 6,
    route: '/games/pattern-puzzle',
    description: 'Complete the pattern!',
    color: '#00BFA5',
    instructions: 'Look at the pattern and pick the missing piece.',
  },
  {
    id: 'sequence-builder',
    name: 'Sequence Builder',
    emoji: '🔢',
    domain: 'logic',
    order: 7,
    route: '/games/sequence-builder',
    description: 'What comes next in the sequence?',
    color: '#00BFA5',
    instructions: 'Figure out the rule and pick the next item.',
  },
  {
    id: 'follow-steps',
    name: 'Follow Steps',
    emoji: '📋',
    domain: 'comprehension',
    order: 8,
    route: '/games/follow-steps',
    description: 'Listen carefully and follow instructions!',
    color: '#2979FF',
    instructions: 'Read the instruction and tap the correct shapes in order.',
  },
  {
    id: 'story-builder',
    name: 'Story Builder',
    emoji: '📖',
    domain: 'comprehension',
    order: 9,
    route: '/games/story-builder',
    description: 'Build stories by putting events in order!',
    color: '#2979FF',
    instructions: 'Tap the cards in the correct sequence to build a story.',
  },
  {
    id: 'color-mixer',
    name: 'Color Mixer Lab',
    emoji: '🧪',
    domain: 'logic',
    order: 10,
    route: '/games/color-mixer',
    description: 'Mix primary colors to discover new ones!',
    color: '#00BFA5',
    instructions: 'Combine different colors to see what new colors you can create.',
  },
];

export function getGameById(id: string): GameInfo | undefined {
  return GAMES.find(g => g.id === id);
}

export function getGamesByDomain(domain: CognitiveDomain): GameInfo[] {
  return GAMES.filter(g => g.domain === domain);
}
