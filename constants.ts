
import { ChallengeDef, ChallengeType, BadgeType } from './types';

export const APP_VERSION = "1.0.2-GRID-FIXED";

// LISTE DES 25 DÉFIS AVEC SAUTS DE LIGNE MANUELS POUR LE LAYOUT 66x66
export const CHALLENGES_FR: ChallengeDef[] = [
  { text: "PARLER / EN VIEUX / FRANÇOIS (1 MIN)", type: ChallengeType.AUTO },
  { text: "GAGNER / UN BRAS / DE FER", type: ChallengeType.WITNESS },
  { text: "FEINDRE / UN APPEL / DU ROY", type: ChallengeType.AUTO },
  { text: "BÂTIR / PYRAMIDE / DE 3 SOUS-BOCK", type: ChallengeType.WITNESS },
  { text: "CORROMPRE / LE MAÎTRE / D'UN SOURIRE", type: ChallengeType.MASTER },
  { text: "SALUER / UN / INCONNU", type: ChallengeType.WITNESS },
  { text: "DÉCLARER / SA FLAMME / À SON VERRE", type: ChallengeType.WITNESS },
  { text: "ÊTRE ADOUBÉ / CHEVALIER / DU BINGO", type: ChallengeType.MASTER },
  { text: "GAGNER / CONCOURS / DE GRIMACES", type: ChallengeType.WITNESS },
  { text: "MIMER / UNE BÊTE / À DEVINER", type: ChallengeType.WITNESS },
  { text: "FAIRE / RIRE / LE MAÎTRE", type: ChallengeType.MASTER },
  { text: "BOIRE / UNE GORGÉE / D'EAU", type: ChallengeType.AUTO },
  { text: "RECEVOIR / BÉNÉDICTION / DU MAÎTRE", type: ChallengeType.MASTER },
  { text: "RÉCITER / UN / POÈME", type: ChallengeType.AUTO },
  { text: "ÉCHANGER / SOULIER / AVEC AUTRUI", type: ChallengeType.WITNESS },
  { text: "CITER 3 / INGRÉDIENTS / DE POTION", type: ChallengeType.MASTER },
  { text: "GAGNER / DUEL / CHIFOUMI", type: ChallengeType.WITNESS },
  { text: "TENIR / SUR UNE JAMBE / 30 SEC", type: ChallengeType.WITNESS },
  { text: "GAGNER / DUEL / DE REGARD", type: ChallengeType.MASTER },
  { text: "TROUVER / PIÈCE D'OR / (CENTIME)", type: ChallengeType.AUTO },
  { text: "POIGNÉE / DE MAIN / SECRÈTE", type: ChallengeType.MASTER },
  { text: "CRIER / BINGO ! / SANS RAISON", type: ChallengeType.AUTO },
  { text: "IMITER / LE TAVERNIER / (TÉMOIN)", type: ChallengeType.WITNESS },
  { text: "CONTER / UNE FARCE / AU MAÎTRE", type: ChallengeType.MASTER },
  { text: "DANSER / SUR UNE / CHAISE (PRUDENCE)", type: ChallengeType.WITNESS },
];

export const CHALLENGES_EN: ChallengeDef[] = [
  { text: "SPEAK / IN OLD / ENGLISH (1 MIN)", type: ChallengeType.AUTO },
  { text: "WIN / AN ARM / WRESTLING MATCH", type: ChallengeType.WITNESS },
  { text: "PRETEND / TO GET A / CALL FROM KING", type: ChallengeType.AUTO },
  { text: "BUILD / PYRAMID / OF 3 COASTERS", type: ChallengeType.WITNESS },
  { text: "BRIBE / THE MASTER / WITH A SMILE", type: ChallengeType.MASTER },
  { text: "FIST BUMP / A / STRANGER", type: ChallengeType.WITNESS },
  { text: "DECLARE / LOVE TO / YOUR GLASS", type: ChallengeType.WITNESS },
  { text: "BE KNIGHTED / AS / SIR BINGO", type: ChallengeType.MASTER },
  { text: "WIN A / FUNNY FACE / CONTEST", type: ChallengeType.WITNESS },
  { text: "MIME / AN ANIMAL / MAKE THEM GUESS", type: ChallengeType.WITNESS },
  { text: "MAKE / THE MASTER / LAUGH", type: ChallengeType.MASTER },
  { text: "DRINK / A SIP / OF WATER", type: ChallengeType.AUTO },
  { text: "RECEIVE / THE MASTER’S / BLESSING", type: ChallengeType.MASTER },
  { text: "RECITE / A / POEM", type: ChallengeType.AUTO },
  { text: "SWAP A / SHOE WITH / SOMEONE", type: ChallengeType.WITNESS },
  { text: "NAME 3 / INGREDIENTS / OF A POTION", type: ChallengeType.MASTER },
  { text: "WIN A / ROCK-PAPER- / SCISSORS DUEL", type: ChallengeType.WITNESS },
  { text: "BALANCE / ON ONE LEG / 30 SECONDS", type: ChallengeType.WITNESS },
  { text: "WIN A / STARING / CONTEST VS MASTER", type: ChallengeType.MASTER },
  { text: "FIND A / GOLD COIN / (PENNY)", type: ChallengeType.AUTO },
  { text: "SECRET / HANDSHAKE / WITH MASTER", type: ChallengeType.MASTER },
  { text: "YELL “BINGO!” / FOR / NO REASON", type: ChallengeType.AUTO },
  { text: "IMITATE / THE BARTENDER / WITH WITNESS", type: ChallengeType.WITNESS },
  { text: "TELL A / JOKE TO / THE MASTER", type: ChallengeType.MASTER },
  { text: "DANCE A JIG / ON A / CHAIR (CAREFUL)", type: ChallengeType.WITNESS },
];
export const INITIAL_CHALLENGES = CHALLENGES_FR;

export const AVATAR_SEEDS = [
  'PartyKing', 'BeerQueen', 'Jester', 'HappyHour', 
  'Sparkle', 'Ace', 'Cheers', 'Martini', 
  'Gentleman', 'Target', 'Yolo', 'Festive', 
  'Wolf', 'Eagle', 'Dragon', 'Lion', 
  'Cocktail', 'Wine', 'EightBall', 'Lucky',
  'Bingo', 'Winner', 'Star', 'Legend'
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
  'PartyKing': '👑',    'BeerQueen': '🥂', 
  'HappyHour': '🥃',    'Cheers': '🍻', 
  'Martini': '🍸',      'Festive': '🍾',
  'Cocktail': '🍹',     'Wine': '🍷',
  'Jester': '🃏',       'Lucky': '🎲', 
  'Bingo': '🎰',        'Winner': '🏆', 
  'Ace': '♠️',          'EightBall': '🎱',
  'Target': '🎯',       'Diamond': '💎',
  'Yolo': '🕶️',         'Sparkle': '✨',
  'Gentleman': '🎩',    'Star': '🌟',
  'Fire': '🔥',         'Legend': '🛡️',
  'Wolf': '🐺',         'Eagle': '🦅', 
  'Dragon': '🐉',       'Lion': '🦁', 
};

export const BADGE_CONFIG: Record<BadgeType, {
  emoji: string;
  color: string;
}> = {
  FIRST_BLOOD: {
    emoji: '🎯',
    color: 'from-red-500 to-orange-600'
  },
  SPEED_DEMON: {
    emoji: '⚡',
    color: 'from-yellow-400 to-orange-500'
  },
  BIG_BRAIN: {
    emoji: '🧠',
    color: 'from-blue-400 to-indigo-600'
  },
  PARTY_ANIMAL: {
    emoji: '🥳',
    color: 'from-pink-500 to-purple-600'
  },
  NIGHT_OWL: {
    emoji: '🦉',
    color: 'from-indigo-800 to-black'
  },
  EARLY_BIRD: {
    emoji: '🌅',
    color: 'from-orange-300 to-yellow-500'
  },
  SOCIAL_BUTTERFLY: {
    emoji: '🦋',
    color: 'from-pink-300 to-rose-500'
  },
  PERFECTIONIST: {
    emoji: '👑',
    color: 'from-gold-400 to-gold-600'
  }
};

export const EVENT_ENTRY_CODE = "EVENT_START_2025";
export const MASTER_VALID_CODE = "MASTER_VALID_CODE_2025";
export const MASTER_RUNE_SEQUENCE = [0, 2, 3, 1]; 
export const INITIAL_JOKERS = 2;

export const SOUNDS = {
  CLICK: 'https://cdn.freesound.org/previews/256/256116_4486188-lq.mp3',
  VALIDATE: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3',
  WIN: 'https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3',
  JOKER: 'https://cdn.freesound.org/previews/368/368739_4948831-lq.mp3',
};
