
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
}

export enum AppView {
  LANDING = 'LANDING',
  ONBOARDING_STYLES = 'ONBOARDING_STYLES', // Step 1
  NICKNAME = 'NICKNAME',                   // Step 2
  ONBOARDING_REWARDS = 'ONBOARDING_REWARDS', // Step 3
  GAME = 'GAME',                           // Step 4-6
  MASTER_DASHBOARD = 'MASTER_DASHBOARD',
  LEADERBOARD = 'LEADERBOARD'
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

export interface EventSession {
  id: number;
  is_active: boolean;
  updated_at?: string;
}
