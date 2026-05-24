
import { ChallengeDef, ChallengeType, BadgeType } from './types';

export const APP_VERSION = "1.0.2-GRID-FIXED";

// LISTE DES 25 DÉFIS AVEC SAUTS DE LIGNE MANUELS POUR LE LAYOUT 66x66
export const CHALLENGES_FR: ChallengeDef[] = [
  { id: 1, text: "Publier un post Instagram en mentionnant @TheBingoCrawl", type: ChallengeType.MASTER },
  { id: 2, text: "Poster une story en taguant le bar", type: ChallengeType.MASTER },
  { id: 3, text: "Follow @TheBingoCrawl sur Instagram", type: ChallengeType.MASTER },
  { id: 4, text: "Suivre le bar dans lequel tu te trouves sur Instagram", type: ChallengeType.MASTER },
  { id: 5, text: "Scanner le QR code caché", type: ChallengeType.AUTO },
  { id: 6, text: "Trouver quelqu'un né le même mois que toi et trinquer ensemble", type: ChallengeType.WITNESS },
  { id: 7, text: "Prendre un shot d'une boisson portugaise traditionnelle", type: ChallengeType.WITNESS },
  { id: 8, text: "Utiliser un surnom pendant 10 min", type: ChallengeType.WITNESS },
  { id: 10, text: "Trouver quelqu'un seul et lui offrir un shot", type: ChallengeType.WITNESS },
  { id: 11, text: "Selfie avec un barman", type: ChallengeType.AUTO },
  { id: 12, text: "Apprendre 5 prénoms et les réciter au Master", type: ChallengeType.MASTER },
  { id: 13, text: "Dire 3 choses sur toi. 2 vraies 1 fausse", type: ChallengeType.WITNESS },
  { id: 14, text: "Imite tout ce que fait {JOUEUR} jusqu'au prochain bar change", type: ChallengeType.WITNESS },
  { id: 15, text: "Montrer un talent caché", type: ChallengeType.WITNESS },
  { id: 16, text: "Danser avec quelqu'un qui porte un chapeau", type: ChallengeType.WITNESS },
  { id: 17, text: "Lancer un concours de twerk", type: ChallengeType.WITNESS },
  { id: 18, text: "Déclarer ta flamme à quelqu'un", type: ChallengeType.WITNESS },
  { id: 19, text: "Lancer une ola géante", type: ChallengeType.WITNESS },
  { id: 20, text: "Concours de regards. Premier qui cligne perd", type: ChallengeType.WITNESS },
  { id: 21, text: "Échanger un vêtement avec {JOUEUR}", type: ChallengeType.WITNESS },
  { id: 22, text: "Lancer une battle de danse", type: ChallengeType.WITNESS },
  { id: 23, text: "Photo de groupe avec 7 joueurs", type: ChallengeType.AUTO },
  { id: 24, text: "Photo avec du street art de Lisbonne", type: ChallengeType.AUTO },
  { id: 25, text: "Selfie avec quelqu'un déguisé", type: ChallengeType.AUTO },
  { id: 26, text: "Selfie avec la personne la plus grande du bar", type: ChallengeType.AUTO },
  { id: 27, text: "Faire un câlin à un membre du staff", type: ChallengeType.WITNESS },
  { id: 28, text: "Trouver quelqu'un avec 8 tatouages ou plus", type: ChallengeType.WITNESS },
  { id: 29, text: "Inventer un nom de cocktail et le crier", type: ChallengeType.WITNESS },
  { id: 31, text: "Recréer une affiche de film célèbre", type: ChallengeType.AUTO },
  { id: 32, text: "Rejouer une scène de film", type: ChallengeType.WITNESS },
  { id: 33, text: "Commander une boisson en portugais", type: ChallengeType.WITNESS },
  { id: 34, text: "Enseigner une expression de ta langue au Master", type: ChallengeType.MASTER },
  { id: 35, text: "Inventer un faux mot portugais pour fête", type: ChallengeType.WITNESS },
  { id: 36, text: "Pierre-Feuille-Ciseaux avec {JOUEUR} — premier à 2 victoires", type: ChallengeType.PVP },
  { id: 37, text: "Défie {JOUEUR} — qui finit son verre d'eau en premier ?", type: ChallengeType.PVP },
  { id: 38, text: "Concours de regards contre {JOUEUR} — premier à ciller perd", type: ChallengeType.PVP },
  { id: 39, text: "Défie {JOUEUR} — pile ou face, annonce ta face avant le lancer", type: ChallengeType.PVP },
];

export const CHALLENGES_EN: ChallengeDef[] = [
  { id: 1, text: "Make an Instagram post mentioning @TheBingoCrawl", type: ChallengeType.MASTER },
  { id: 2, text: "Post a story tagging the bar", type: ChallengeType.MASTER },
  { id: 3, text: "Follow @TheBingoCrawl", type: ChallengeType.MASTER },
  { id: 4, text: "Follow the bar you are in on Instagram", type: ChallengeType.MASTER },
  { id: 5, text: "Scan the hidden QR code", type: ChallengeType.AUTO },
  { id: 6, text: "Find someone born in the same month as you and toast together", type: ChallengeType.WITNESS },
  { id: 7, text: "Take a shot of a traditional Portuguese drink", type: ChallengeType.WITNESS },
  { id: 8, text: "Use a nickname for 10 minutes", type: ChallengeType.WITNESS },
  { id: 10, text: "Find someone alone and offer them a shot", type: ChallengeType.WITNESS },
  { id: 11, text: "Selfie with a bartender", type: ChallengeType.AUTO },
  { id: 12, text: "Learn 5 names and recite them to the Master", type: ChallengeType.MASTER },
  { id: 13, text: "Say 3 things about yourself. 2 true 1 false", type: ChallengeType.WITNESS },
  { id: 14, text: "Copy everything {JOUEUR} does until the next bar change", type: ChallengeType.WITNESS },
  { id: 15, text: "Show a hidden talent", type: ChallengeType.WITNESS },
  { id: 16, text: "Dance with someone wearing a hat", type: ChallengeType.WITNESS },
  { id: 17, text: "Start a twerking contest", type: ChallengeType.WITNESS },
  { id: 18, text: "Declare your love to someone", type: ChallengeType.WITNESS },
  { id: 19, text: "Start a giant wave", type: ChallengeType.WITNESS },
  { id: 20, text: "Staring contest. First to blink loses", type: ChallengeType.WITNESS },
  { id: 21, text: "Swap an item of clothing with {JOUEUR}", type: ChallengeType.WITNESS },
  { id: 22, text: "Launch a dance battle", type: ChallengeType.WITNESS },
  { id: 23, text: "Group photo with 7 players", type: ChallengeType.AUTO },
  { id: 24, text: "Take a photo with Lisbon street art", type: ChallengeType.AUTO },
  { id: 25, text: "Selfie with someone in costume", type: ChallengeType.AUTO },
  { id: 26, text: "Selfie with the tallest person in the bar", type: ChallengeType.AUTO },
  { id: 27, text: "Hug a staff member", type: ChallengeType.WITNESS },
  { id: 28, text: "Find someone with 8 plus tattoos", type: ChallengeType.WITNESS },
  { id: 29, text: "Invent a cocktail name and shout it when ordering", type: ChallengeType.WITNESS },
  { id: 31, text: "Recreate a famous movie poster", type: ChallengeType.AUTO },
  { id: 32, text: "Re-enact a movie scene", type: ChallengeType.WITNESS },
  { id: 33, text: "Order a drink in Portuguese", type: ChallengeType.WITNESS },
  { id: 34, text: "Teach an expression from your language to the Master", type: ChallengeType.MASTER },
  { id: 35, text: "Invent a fake Portuguese word for party", type: ChallengeType.WITNESS },
  { id: 36, text: "Rock Paper Scissors vs {JOUEUR} — first to 2 wins", type: ChallengeType.PVP },
  { id: 37, text: "Challenge {JOUEUR} — who finishes their glass of water first?", type: ChallengeType.PVP },
  { id: 38, text: "Staring contest vs {JOUEUR} — first to blink loses", type: ChallengeType.PVP },
  { id: 39, text: "Challenge {JOUEUR} — heads or tails, call it before the flip", type: ChallengeType.PVP },
];

export const AVATAR_SEEDS = [
  // — Héros médiévaux (nouveau) —
  'Knight',    'Wizard',    'Archer',    'Viking',
  // — Créatures & légendes —
  'Dragon',    'Wolf',      'Eagle',     'Lion',
  // — Ombre & mystère (nouveau) —
  'Pirate',    'Vampire',   'Ninja',     'Rogue',
  // — Magie & savoir (nouveau) —
  'Oracle',    'Alchemist', 'Trickster', 'Bard',
  // — Icônes du jeu (original) —
  'PartyKing', 'Jester',    'Legend',    'Winner',
  'Bingo',     'Lucky',     'Ace',       'Target',
  // — Festif & bar (original) —
  'BeerQueen', 'Cheers',    'Cocktail',  'Martini',
  'Wine',      'HappyHour', 'Festive',   'Gentleman',
  // — Autres originaux —
  'Diamond',   'Star',      'Sparkle',   'Yolo',
  'EightBall',
  // — Feu & aventure (nouveau) —
  'Fire',      'Explorer',  'Sailor',    'Phoenix',
];

export const COUNTRIES = [
    { code: 'FR', flag: '🇫🇷', name: 'France' },
    { code: 'GB', flag: '🇬🇧', name: 'UK' },
    { code: 'US', flag: '🇺🇸', name: 'USA' },
    { code: 'BE', flag: '🇧🇪', name: 'Belgium' },
    { code: 'CH', flag: '🇨🇭', name: 'Swiss' },
    { code: 'DE', flag: '🇩🇪', name: 'Germany' },
    { code: 'ES', flag: '🇪🇸', name: 'Spain' },
    { code: 'IT', flag: '🇮🇹', name: 'Italy' },
    { code: 'CA', flag: '🇨🇦', name: 'Canada' },
    { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
    { code: 'JP', flag: '🇯🇵', name: 'Japan' },
    { code: 'AU', flag: '🇦🇺', name: 'Australia' },
    { code: 'WORLD', flag: '🌍', name: 'World' },
];

export const ADULT_EMOJI_MAP: Record<string, string> = {
  // — Héros médiévaux (nouveau) —
  'Knight':    '⚔️',    'Wizard':    '🧙',
  'Archer':    '🏹',    'Viking':    '🪖',
  // — Créatures & légendes —
  'Dragon':    '🐉',    'Wolf':      '🐺',
  'Eagle':     '🦅',    'Lion':      '🦁',
  // — Ombre & mystère (nouveau) —
  'Pirate':    '🏴‍☠️',  'Vampire':   '🧛',
  'Ninja':     '🥷',    'Rogue':     '🗡️',
  // — Magie & savoir (nouveau) —
  'Oracle':    '🔮',    'Alchemist': '⚗️',
  'Trickster': '🎭',    'Bard':      '🎵',
  // — Icônes du jeu (original) —
  'PartyKing': '👑',    'Jester':    '🃏',
  'Legend':    '🛡️',    'Winner':    '🏆',
  'Bingo':     '🎰',    'Lucky':     '🎲',
  'Ace':       '♠️',    'Target':    '🎯',
  // — Festif & bar (original) —
  'BeerQueen': '🥂',    'Cheers':    '🍻',
  'Cocktail':  '🍹',    'Martini':   '🍸',
  'Wine':      '🍷',    'HappyHour': '🥃',
  'Festive':   '🍾',    'Gentleman': '🎩',
  // — Autres originaux —
  'Diamond':   '💎',    'Star':      '🌟',
  'Sparkle':   '✨',    'Yolo':      '🕶️',
  'EightBall': '🎱',
  // — Feu & aventure (nouveau) —
  'Fire':      '🔥',    'Explorer':  '🗺️',
  'Sailor':    '⚓',    'Phoenix':   '🦚',
};

export const BADGE_CONFIG: Record<BadgeType, {
  emoji: string;
  color: string;
  name: string;
  gradient: [string, string];
}> = {
  FIRST_BLOOD: {
    emoji: '🎯',
    color: 'from-red-500 to-orange-600',
    name: 'First Blood',
    gradient: ['#EF4444', '#EA580C'],
  },
  SPEED_DEMON: {
    emoji: '⚡',
    color: 'from-yellow-400 to-orange-500',
    name: 'Speed Demon',
    gradient: ['#FACC15', '#F97316'],
  },
  BIG_BRAIN: {
    emoji: '🧠',
    color: 'from-blue-400 to-indigo-600',
    name: 'Big Brain',
    gradient: ['#60A5FA', '#4F46E5'],
  },
  PARTY_ANIMAL: {
    emoji: '🥳',
    color: 'from-pink-500 to-purple-600',
    name: 'Party Animal',
    gradient: ['#EC4899', '#9333EA'],
  },
  NIGHT_OWL: {
    emoji: '🦉',
    color: 'from-indigo-800 to-black',
    name: 'Night Owl',
    gradient: ['#3730A3', '#000000'],
  },
  EARLY_BIRD: {
    emoji: '🌅',
    color: 'from-orange-300 to-yellow-500',
    name: 'Early Bird',
    gradient: ['#FDBA74', '#EAB308'],
  },
  SOCIAL_BUTTERFLY: {
    emoji: '🦋',
    color: 'from-pink-300 to-rose-500',
    name: 'Papillon',
    gradient: ['#F9A8D4', '#F43F5E'],
  },
  PERFECTIONIST: {
    emoji: '👑',
    color: 'from-[#FFD700] to-[#FF8C00]',
    name: 'Perfectionist',
    gradient: ['#FFD700', '#FF8C00'],
  },
  DUEL_KING: {
    emoji: '⚔️',
    color: 'from-[#FF2D6A] to-[#FF8C00]',
    name: 'Duel King',
    gradient: ['#FF2D6A', '#FF8C00'],
  },
};

// Note: These values are intentionally not exported — consumers keep their own local copy.
// Do not re-export them; keeping them unexported limits accidental exposure in module graphs.
const MASTER_VALID_CODE = "KING";
const MASTER_RUNE_SEQUENCE = [0, 2, 3, 1];
// Suppress unused-variable warnings (values are kept here as single source of truth documentation)
void MASTER_VALID_CODE; void MASTER_RUNE_SEQUENCE;
export const INITIAL_JOKERS = 2;

export const SOUNDS = {
  CLICK:    '/sounds/click.mp3',
  VALIDATE: '/sounds/validate.mp3',
  WIN:      '/sounds/win.mp3',
  JOKER:    '/sounds/joker.mp3',
};
