
export enum TauntType {
  FREEZE      = 'FREEZE',       // Figé 35s — ne peut pas valider
  ICE_BLOCK   = 'ICE_BLOCK',    // Cases recouvertes de glace à tapoter
  TINY_TARGET = 'TINY_TARGET',  // Bouton minuscule qui fuit
  BLOB        = 'BLOB',         // Splash à nettoyer avant de valider
  FLASHLIGHT  = 'FLASHLIGHT',   // Écran noir + spotlight radial 45s
  REVERSE     = 'REVERSE',      // 2min : prochaine validation donne +1 à l'envoyeur
  TRAP        = 'TRAP',         // Case piégée : valider = -1 point
}

export enum ChallengeType {
  AUTO = 'AUTO',       // User clicks "I Did It"
  WITNESS = 'WITNESS', // User hands phone to a friend/stranger to confirm
  MASTER = 'MASTER'    // User uses Rune Pad with Master
}

export enum CellStatus {
  EMPTY = 'EMPTY',
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED'
}

export interface ChallengeDef {
  id?: number;
  text: string;
  type: ChallengeType;
  icon?: string;
}

export interface BingoCellData {
  id: number;
  text: string;
  type: ChallengeType;
  status: CellStatus;
  proofUrl?: string;
  witnessName?: string;
  witnessSignature?: string;
  timestamp?: number;
  isPartner?: boolean;
  partnerHandle?: string;
}

export enum AppView {
  LANDING = 'LANDING',
  ONBOARDING_STYLES = 'ONBOARDING_STYLES', // Step 1
  NICKNAME = 'NICKNAME',                   // Step 2
  ONBOARDING_REWARDS = 'ONBOARDING_REWARDS', // Step 3
  GAME = 'GAME',                           // Step 4-6
  MASTER_DASHBOARD = 'MASTER_DASHBOARD',
  LEADERBOARD = 'LEADERBOARD',
  MISSION_REPORT = 'MISSION_REPORT',
  GAME_OVER = 'GAME_OVER'                  // Session closed / stale QR
}

export enum TutorialStep {
  NONE = 'NONE',
  STYLES = 'STYLES',
  REWARDS = 'REWARDS',
  GRID = 'GRID',
  CHALLENGE_MODAL = 'CHALLENGE_MODAL',
  SCORE = 'SCORE'
}

// --- BADGE TYPES ---
export type BadgeType = 
  | 'FIRST_BLOOD'
  | 'SPEED_DEMON' 
  | 'BIG_BRAIN'
  | 'PARTY_ANIMAL'
  | 'NIGHT_OWL'
  | 'EARLY_BIRD'
  | 'SOCIAL_BUTTERFLY'
  | 'PERFECTIONIST';

export interface Badge {
  id: string;
  player_id: string;
  badge_type: BadgeType;
  unlocked_at: string;
}

// --- BACKEND TYPES ---

export interface UserProfile {
  id: string;
  nickname: string;
  avatarId: string;
  country: string; // New field for Nation Wars
  gamesPlayed: number;
  bingosWon: number;
  createdAt: number;
}

export interface GameSession {
  id: string;
  userId: string;
  grid: BingoCellData[];
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  score: number;
  startedAt: number;
  lastUpdated: number;
  jokers: number;
  tauntsSent: number;
  tauntsBonus: number;
  frozenUntil?: number;
  tauntType?: TauntType;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  pseudo: string;
  avatarId: string;
  country?: string; // Optional for display
  score: number;
  durationSeconds: number;
  jokersUsed: number;
  isCurrentUser: boolean;
}

export interface NationLeaderboardEntry {
  rank: number;
  country: string;
  totalScore: number;
  playerCount: number;
}

export interface EventSession {
  id: number;
  is_active: boolean;
  updated_at?: string;
}

export interface Activity {
  id: string;
  player_id: string;
  player_pseudo: string;
  player_emoji: string;
  type: 'LINE_COMPLETED' | 'GRID_COMPLETED';
  created_at: string;
}
