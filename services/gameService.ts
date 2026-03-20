
import { supabase } from '../lib/supabaseClient';
import { UserProfile, GameSession, BingoCellData, CellStatus, LeaderboardEntry } from '../types';
import { ADULT_EMOJI_MAP } from '../constants';

// Helper to shuffle array (Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const OFFLINE_QUEUE_KEY = 'bingo_offline_queue';

interface OfflineAction {
    type: 'VALIDATE' | 'JOKER' | 'BADGE';
    gameId?: string;
    playerId?: string;
    payload: any;
    timestamp: number;
}

class GameBackendService {
  
  // Singleton State
  private _isSyncing = false;
  private _syncListeners: ((isSyncing: boolean) => void)[] = [];

  constructor() {
      // Listen to window online event to trigger sync
      if (typeof window !== 'undefined') {
          window.addEventListener('online', () => {
              this.syncPendingActions();
          });
          // Attempt sync on load if online
          if (navigator.onLine) {
              setTimeout(() => this.syncPendingActions(), 2000);
          }
      }
  }

  // --- SYNC STATUS OBSERVABLE ---
  
  public get isSyncing() { return this._isSyncing; }
  
  private setSyncing(status: boolean) {
      this._isSyncing = status;
      this._syncListeners.forEach(l => l(status));
  }

  public subscribeToSyncStatus(callback: (isSyncing: boolean) => void) {
      this._syncListeners.push(callback);
      return () => {
          this._syncListeners = this._syncListeners.filter(l => l !== callback);
      };
  }

  // --- OFFLINE QUEUE MANAGEMENT ---

  private getQueue(): OfflineAction[] {
      try {
          const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
          return raw ? JSON.parse(raw) : [];
      } catch {
          return [];
      }
  }

  private addToQueue(action: OfflineAction) {
      const queue = this.getQueue();
      queue.push(action);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  private clearQueue() {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  public async syncPendingActions() {
      if (this._isSyncing || !navigator.onLine) return;
      
      const queue = this.getQueue();
      if (queue.length === 0) return;

      this.setSyncing(true);
      console.log(`[Sync] Processing ${queue.length} offline actions...`);

      const failedActions: OfflineAction[] = [];

      for (const action of queue) {
          try {
              if (action.type === 'VALIDATE') {
                  const { gameId, cellId, proof } = action.payload;
                  await this.validateCell(gameId, cellId, proof, true); // true = forceNetwork
              } else if (action.type === 'JOKER') {
                  const { gameId, cellId, newChallenge } = action.payload;
                  await this.useJoker(gameId, cellId, newChallenge, true); // true = forceNetwork
              } else if (action.type === 'BADGE') {
                  const { playerId, badgeType } = action.payload;
                  await this.unlockBadge(playerId, badgeType, true);
              }
          } catch (e) {
              console.error("[Sync] Action failed", action, e);
              // If it's a permanent error (e.g. game not found), we might drop it.
              // For network errors, we keep it.
              // For simplicity in this demo, we assume network error and keep it.
              failedActions.push(action);
          }
      }

      if (failedActions.length > 0) {
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedActions));
      } else {
          this.clearQueue();
      }

      // Minimum visual duration for the spinner
      setTimeout(() => this.setSyncing(false), 1000);
  }

  // --- UTILS ---

  async checkConnection(): Promise<boolean> {
    if (!supabase) return false;
    try {
      // Simple ping: check players table
      const { error } = await supabase.from('players').select('id', { count: 'exact', head: true });
      if (error) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- SECURITY ---
  
  async verifyMasterCode(code: string): Promise<boolean> {
      if (!supabase) return false;
      try {
          const { data, error } = await supabase.functions.invoke('verify-master-code', {
              body: { code }
          });
          if (error) return false;
          return data?.valid === true;
      } catch (e) {
          return false;
      }
  }

  // --- SESSION CONTROL (MASTER) ---

  async getSessionStatus(): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { data, error } = await supabase
        .from('event_session')
        .select('is_active')
        .eq('id', 1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
             await supabase.from('event_session').insert({ id: 1, is_active: false }); 
             return false;
        }
        return false;
      }
      return data?.is_active ?? false;
    } catch (e) {
      return false;
    }
  }

  async setSessionStatus(isActive: boolean): Promise<void> {
    if (!supabase) return;
    try {
      const { error, data } = await supabase
        .from('event_session')
        .update({ is_active: isActive })
        .eq('id', 1)
        .select();

      if (!error && (!data || data.length === 0)) {
         await supabase.from('event_session').insert({ id: 1, is_active: isActive });
      }
    } catch (e) {
      console.error("Failed to set session status", e);
      throw e;
    }
  }

  // --- USER ROUTES ---

  async createUser(nickname: string, avatarId: string, country: string): Promise<UserProfile> {
    if (!supabase) throw new Error("Backend not configured");
    const emojiChar = ADULT_EMOJI_MAP[avatarId] || '🎲';

    const { data, error } = await supabase
      .from('players')
      .insert({
        pseudo: nickname,
        emoji: emojiChar
      })
      .select('id, pseudo, emoji')
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      nickname: data.pseudo,
      avatarId: data.emoji,
      country: country, // Keep local
      gamesPlayed: 0,
      bingosWon: 0,
      createdAt: Date.now() 
    };
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('players')
      .select('id, pseudo, emoji')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      nickname: data.pseudo,
      avatarId: data.emoji,
      country: 'FR',
      gamesPlayed: 0,
      bingosWon: 0,
      createdAt: Date.now()
    };
  }

  // --- GAME ROUTES ---

  async startGame(userId: string, challenges: any[]): Promise<GameSession> {
    if (!supabase) throw new Error("Backend not configured");

    const shuffledChallenges = shuffleArray(challenges);
    const gridChallenges = shuffledChallenges.slice(0, 25).map((item, index) => ({
      id: index,
      text: item.text,
      type: item.type,
    }));

    try {
      await supabase
        .from('games')
        .update({ status: 'ABANDONED' })
        .eq('player_id', userId)
        .eq('status', 'ACTIVE')
        .select('id');
    } catch (e) {}

    const { data, error } = await supabase
      .from('games')
      .insert({
        player_id: userId,
        grid_challenges: gridChallenges,
        validated_cells: [],
        status: 'ACTIVE',
        score: 0,
        started_at: new Date().toISOString(),
        jokers_used: 0
      })
      .select('id, player_id, grid_challenges, validated_cells, status, score, started_at, jokers_used')
      .single();

    if (error) throw error;
    
    // Cache the active game in localstorage for fallback
    localStorage.setItem('bingo_last_session', JSON.stringify(this.mapDataToSession(data)));

    return this.mapDataToSession(data);
  }

  async getActiveSession(userId: string): Promise<GameSession | null> {
    if (!supabase) return null;

    // Try network first
    try {
        const { data, error } = await supabase
        .from('games')
        .select('id, player_id, grid_challenges, validated_cells, status, score, started_at, jokers_used')
        .eq('player_id', userId)
        .eq('status', 'ACTIVE')
        .order('started_at', { ascending: false }) 
        .limit(1)
        .single();

        if (!error && data) {
            const startedAt = new Date(data.started_at).getTime();
            if (Date.now() - startedAt <= EXPIRATION_TIME) {
                 const session = this.mapDataToSession(data);
                 localStorage.setItem('bingo_last_session', JSON.stringify(session));
                 return session;
            }
        }
    } catch (e) {
        console.warn("Network error getting session, trying offline cache");
    }

    // Fallback to offline cache
    const cached = localStorage.getItem('bingo_last_session');
    if (cached) {
        const session = JSON.parse(cached) as GameSession;
        if (session.userId === userId && Date.now() - session.startedAt <= EXPIRATION_TIME) {
            return session;
        }
    }

    return null;
  }

  // Modified to handle Offline Queue
  async validateCell(gameId: string, cellId: number, proofData?: any, forceNetwork = false): Promise<GameSession> {
    if (!supabase) throw new Error("Backend not configured");

    // Helper to return optimistic result based on current cache
    const returnOptimistic = () => {
        const cached = localStorage.getItem('bingo_last_session');
        if (!cached) throw new Error("No local session to update");
        const session = JSON.parse(cached) as GameSession;
        
        // Apply update locally
        const cell = session.grid.find(c => c.id === cellId);
        if (cell && cell.status !== CellStatus.VALIDATED) {
            cell.status = CellStatus.VALIDATED;
            cell.witnessName = proofData?.witnessName;
            cell.witnessSignature = proofData?.witnessSignature;
            cell.timestamp = Date.now();
            session.score += 1;
            session.lastUpdated = Date.now();
        }
        localStorage.setItem('bingo_last_session', JSON.stringify(session));
        return session;
    };

    // If we are offline and not forcing network, queue it immediately
    if (!forceNetwork && !navigator.onLine) {
        this.addToQueue({
            type: 'VALIDATE',
            gameId,
            payload: { gameId, cellId, proof: proofData },
            timestamp: Date.now()
        });
        return returnOptimistic();
    }

    try {
        const { data: game, error: fetchError } = await supabase
        .from('games')
        .select('id, validated_cells')
        .eq('id', gameId)
        .single();
        
        if (fetchError || !game) throw new Error("Game not found");

        const currentValidated = game.validated_cells || [];
        if (currentValidated.find((v: any) => v.id === cellId)) {
            const { data: fullGame } = await supabase.from('games').select('*').eq('id', gameId).single();
            const session = this.mapDataToSession(fullGame);
            localStorage.setItem('bingo_last_session', JSON.stringify(session)); // Update cache
            return session;
        }

        const newValidation = {
            id: cellId,
            timestamp: Date.now(),
            proof: proofData || null
        };

        const newValidatedList = [...currentValidated, newValidation];
        const newScore = newValidatedList.length;

        const { data: updatedData, error: updateError } = await supabase
        .from('games')
        .update({
            validated_cells: newValidatedList,
            score: newScore
        })
        .eq('id', gameId)
        .select('id, player_id, grid_challenges, validated_cells, status, score, started_at, jokers_used')
        .single();

        if (updateError) throw updateError;
        
        const finalSession = this.mapDataToSession(updatedData);
        localStorage.setItem('bingo_last_session', JSON.stringify(finalSession));
        return finalSession;

    } catch (e) {
        // If it was a network error and we aren't in a force loop, queue it
        if (!forceNetwork) {
             console.warn("Validation network fail, queuing offline");
             this.addToQueue({
                type: 'VALIDATE',
                gameId,
                payload: { gameId, cellId, proof: proofData },
                timestamp: Date.now()
            });
            return returnOptimistic();
        }
        throw e;
    }
  }

  async useJoker(gameId: string, cellId: number, newChallenge: any, forceNetwork = false): Promise<GameSession> {
    if (!supabase) throw new Error("Backend not configured");

    const returnOptimistic = () => {
        const cached = localStorage.getItem('bingo_last_session');
        if (!cached) throw new Error("No local session");
        const session = JSON.parse(cached) as GameSession;
        
        if (session.jokers > 0) {
            const cell = session.grid.find(c => c.id === cellId);
            if (cell) {
                cell.text = newChallenge.text;
                cell.type = newChallenge.type;
                cell.status = CellStatus.EMPTY;
                session.jokers -= 1;
                session.lastUpdated = Date.now();
            }
        }
        localStorage.setItem('bingo_last_session', JSON.stringify(session));
        return session;
    };

    if (!forceNetwork && !navigator.onLine) {
        this.addToQueue({
            type: 'JOKER',
            gameId,
            payload: { gameId, cellId, newChallenge },
            timestamp: Date.now()
        });
        return returnOptimistic();
    }

    try {
        const { data: game, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

        if (fetchError || !game) throw new Error("Game not found");
        
        const jokersUsed = game.jokers_used || 0;
        if (jokersUsed >= 2) throw new Error("No jokers left");

        const newGrid = (game.grid_challenges || []).map((c: any) => c.id === cellId ? {
        ...c,
        text: newChallenge.text,
        type: newChallenge.type
        } : c);

        const newValidated = (game.validated_cells || []).filter((v: any) => v.id !== cellId);
        
        const { data: updatedData, error: updateError } = await supabase
        .from('games')
        .update({
            grid_challenges: newGrid,
            validated_cells: newValidated,
            score: newValidated.length,
            jokers_used: jokersUsed + 1
        })
        .eq('id', gameId)
        .select('id, player_id, grid_challenges, validated_cells, status, score, started_at, jokers_used')
        .single();

        if (updateError) throw updateError;
        
        const finalSession = this.mapDataToSession(updatedData);
        localStorage.setItem('bingo_last_session', JSON.stringify(finalSession));
        return finalSession;

    } catch (e) {
        if (!forceNetwork) {
             console.warn("Joker network fail, queuing offline");
             this.addToQueue({
                type: 'JOKER',
                gameId,
                payload: { gameId, cellId, newChallenge },
                timestamp: Date.now()
            });
            return returnOptimistic();
        }
        throw e;
    }
  }

  async getLeaderboard(currentUserId?: string): Promise<LeaderboardEntry[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('games')
      .select(`
        score, started_at, jokers_used, player_id, 
        players:player_id (pseudo, emoji)
      `)
      .eq('status', 'ACTIVE')
      .order('score', { ascending: false })
      .limit(100);

    if (error || !data) return [];

    const now = Date.now();
    const entries: LeaderboardEntry[] = data
      .filter((game: any) => game.players) // Filter out deleted players
      .map((game: any) => {
         const startedAt = new Date(game.started_at).getTime();
         return {
           userId: game.player_id,
           pseudo: game.players.pseudo || 'Unknown',
           avatarId: game.players.emoji || '🎲',
           country: 'FR',
           score: game.score || 0,
           durationSeconds: Math.floor((now - startedAt) / 1000),
           jokersUsed: game.jokers_used || 0,
           isCurrentUser: game.player_id === currentUserId,
           rank: 0 
         };
      });

    entries.sort((a, b) => b.score - a.score || a.durationSeconds - b.durationSeconds);
    return entries.map((entry, index) => ({ ...entry, rank: index + 1 })).slice(0, 50);
  }

  async unlockBadge(playerId: string, badgeType: string, forceNetwork = false): Promise<void> {
    if (!supabase) return;

    if (!forceNetwork && !navigator.onLine) {
        this.addToQueue({
            type: 'BADGE',
            playerId,
            payload: { playerId, badgeType },
            timestamp: Date.now()
        });
        return;
    }

    try {
        await supabase.from('player_badges').insert({
            player_id: playerId,
            badge_type: badgeType,
            unlocked_at: new Date().toISOString()
        });
    } catch (e) {
        if (!forceNetwork) {
            this.addToQueue({
                type: 'BADGE',
                playerId,
                payload: { playerId, badgeType },
                timestamp: Date.now()
            });
        }
    }
  }

  private mapDataToSession(data: any): GameSession {
    const validatedMap = new Map<number, any>((data.validated_cells || []).map((v: any) => [v.id, v]));
    
    const grid: BingoCellData[] = (data.grid_challenges || []).map((c: any) => {
      const validation = validatedMap.get(c.id);
      if (validation) {
        return {
          id: c.id,
          text: c.text,
          type: c.type,
          status: CellStatus.VALIDATED,
          witnessName: validation.proof?.witnessName,
          witnessSignature: validation.proof?.witnessSignature,
          timestamp: validation.timestamp
        };
      }
      return {
        id: c.id,
        text: c.text,
        type: c.type,
        status: CellStatus.EMPTY
      };
    });

    return {
      id: data.id,
      userId: data.player_id,
      grid,
      status: data.status,
      score: data.score || 0,
      jokers: Math.max(0, 2 - (data.jokers_used || 0)), 
      startedAt: data.started_at ? new Date(data.started_at).getTime() : Date.now(),
      lastUpdated: Date.now()
    };
  }
}

export const gameService = new GameBackendService();
