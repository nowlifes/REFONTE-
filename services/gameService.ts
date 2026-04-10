
import { supabase } from '../lib/supabaseClient';
import { UserProfile, GameSession, BingoCellData, CellStatus, LeaderboardEntry, TauntType } from '../types';
import { ADULT_EMOJI_MAP, CHALLENGES_FR, CHALLENGES_EN } from '../constants';

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
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) { console.error("[GameService] Error fetching session status:", error); return false; }
      return data?.is_active ?? false;
    } catch (e) {
      console.error("[GameService] Exception in getSessionStatus:", e);
      return false;
    }
  }

  async getTransitionState(): Promise<{ endsAt: number | null; barName: string | null }> {
    if (!supabase) return { endsAt: null, barName: null };
    try {
      const { data } = await supabase
        .from('event_session')
        .select('transition_ends_at, next_bar_name')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      return {
        endsAt: data?.transition_ends_at ? new Date(data.transition_ends_at).getTime() : null,
        barName: data?.next_bar_name ?? null,
      };
    } catch { return { endsAt: null, barName: null }; }
  }

  async triggerBarTransition(durationMinutes: number, barName?: string): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest) return;
    const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('event_session')
      .update({ transition_ends_at: endsAt, next_bar_name: barName || null })
      .eq('id', latest.id);
    if (error) throw error;
  }

  async clearBarTransition(): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest) return;
    await supabase
      .from('event_session')
      .update({ transition_ends_at: null, next_bar_name: null })
      .eq('id', latest.id);
  }

  async setSessionStatus(isActive: boolean): Promise<void> {
    if (!supabase) return;
    try {
      // Get the latest record
      const { data: latest } = await supabase
        .from('event_session')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest) {
        const { error } = await supabase
          .from('event_session')
          .update({ is_active: isActive })
          .eq('id', latest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_session')
          .insert({ is_active: isActive });
        if (error) throw error;
      }
    } catch (e) {
      console.error("[GameService] Failed to set session status", e);
      throw e;
    }
  }

  // --- CHALLENGES ---

  /** Build fallback challenges from local constants when DB is unreachable */
  private buildFallbackChallenges(): any[] {
    const byId = new Map(CHALLENGES_EN.map(c => [c.id, c]));
    return CHALLENGES_FR.map(fr => {
      const en = byId.get(fr.id);
      return {
        id: fr.id,
        text: fr.text,
        text_fr: fr.text,
        text_en: en?.text ?? fr.text,
        type: fr.type,
        is_partner: fr.id >= 1 && fr.id <= 4,
        partner_handle: undefined,
      };
    });
  }

  async getChallenges(): Promise<any[]> {
    if (!supabase) {
      console.warn("[GameService] No Supabase — using local fallback challenges");
      return this.buildFallbackChallenges();
    }
    console.log("[GameService] Fetching challenges from public.challenges...");
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*');

      if (error) {
        console.error("[GameService] Error fetching challenges:", error);
        console.warn("[GameService] Falling back to local challenges");
        return this.buildFallbackChallenges();
      }

      if (!data || data.length === 0) {
        console.warn("[GameService] DB returned 0 challenges — using local fallback");
        return this.buildFallbackChallenges();
      }

      console.log("[GameService] Challenges fetched successfully:", data.length);
      return data;
    } catch (e) {
      console.error("[GameService] Exception in getChallenges:", e);
      console.warn("[GameService] Falling back to local challenges");
      return this.buildFallbackChallenges();
    }
  }

  // --- USER ROUTES ---

  // --- SECURE SESSION MANAGEMENT ---

  private readonly SECURE_SESSION_KEY = 'bingo_secure_session_id';

  async createSecureSession(): Promise<string> {
    if (!supabase) throw new Error("Backend not configured");
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // +6h
    const { data, error } = await supabase
      .from('sessions')
      .insert({ status: 'open', expires_at: expiresAt })
      .select('id')
      .single();
    if (error) throw error;
    localStorage.setItem(this.SECURE_SESSION_KEY, data.id);
    return data.id;
  }

  async closeSecureSession(sessionId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'closed' })
      .eq('id', sessionId);
    if (error) throw error;
    localStorage.removeItem(this.SECURE_SESSION_KEY);
  }

  async validateSecureSession(sessionId: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('status, expires_at')
        .eq('id', sessionId)
        .single();
      if (error || !data) return false;
      if (data.status !== 'open') return false;
      // Fix 4: auto-expiry check (6h)
      if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
      return true;
    } catch {
      return false;
    }
  }

  getCurrentSecureSessionId(): string | null {
    return localStorage.getItem(this.SECURE_SESSION_KEY);
  }

  /** Fix 1: recover the active session UUID from DB (survives page reload / cache clear) */
  async recoverSecureSessionId(): Promise<string | null> {
    if (!supabase) return null;
    try {
      const { data } = await supabase
        .from('sessions')
        .select('id')
        .eq('status', 'open')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.id) {
        localStorage.setItem(this.SECURE_SESSION_KEY, data.id);
        return data.id;
      }
      return null;
    } catch {
      return null;
    }
  }

  // --- PLAYER CREATION ---

  async createUser(nickname: string, avatarId: string, country: string): Promise<UserProfile> {
    if (!supabase) throw new Error("Backend not configured");
    const emojiChar = ADULT_EMOJI_MAP[avatarId] || '🎲';
    const prefixedNickname = `[${country}] ${nickname}`;

    // Layer 2 — guard before DB insert: re-validate session is still open
    const sessionUUID = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('s')
      : null;
    if (sessionUUID) {
      const valid = await this.validateSecureSession(sessionUUID);
      if (!valid) throw new Error("La session est fermée. Scanne un nouveau QR code pour rejoindre.");
    }

    const insertData: Record<string, string> = { pseudo: prefixedNickname, emoji: emojiChar };
    if (sessionUUID) insertData.session_id = sessionUUID;

    const { data, error } = await supabase
      .from('players')
      .insert(insertData)
      .select('id, pseudo, emoji')
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      nickname: nickname,
      avatarId: data.emoji,
      country: country,
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

    let nickname = data.pseudo || 'Unknown';
    let country = 'FR';
    const match = nickname.match(/^\[([A-Z]{2})\]\s*(.*)/);
    if (match) {
      country = match[1];
      nickname = match[2];
    }

    return {
      id: data.id,
      nickname: nickname,
      avatarId: data.emoji,
      country: country,
      gamesPlayed: 0,
      bingosWon: 0,
      createdAt: Date.now()
    };
  }

  // --- GAME ROUTES ---

  async startGame(userId: string, challenges: any[]): Promise<GameSession> {
    if (!supabase) throw new Error("Backend not configured");

    // Partner challenges (ids 1-4) always appear at the 4 corners (indices 0, 4, 20, 24)
    const CORNER_INDICES = [0, 4, 20, 24];
    const partnerPool = shuffleArray(challenges.filter((c: any) => c.is_partner));
    // Guarantee exactly 4 corner challenges without duplication
    const cornerChallenges = partnerPool.length >= 4
      ? partnerPool.slice(0, 4)
      : [...partnerPool, ...shuffleArray(challenges.filter((c: any) => !c.is_partner)).slice(0, 4 - partnerPool.length)];
    const regularChallenges = shuffleArray(challenges.filter((c: any) => !c.is_partner)).slice(0, 21);

    // Build the 25-cell grid: corners = partner/corner challenges, rest = regular challenges
    const grid: any[] = new Array(25).fill(null);
    CORNER_INDICES.forEach((pos, i) => { grid[pos] = cornerChallenges[i]; });
    let regularIdx = 0;
    for (let i = 0; i < 25; i++) {
      if (grid[i] === null) grid[i] = regularChallenges[regularIdx++];
    }

    const gridChallenges = grid.map((item: any, index: number) => ({
      id: index,
      text: item.text,
      type: item.type,
      isPartner: item.is_partner ?? false,
      partnerHandle: item.partner_handle ?? undefined,
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
      .select('id, player_id, grid_challenges, validated_cells, status, score, started_at, jokers_used, jokers_bonus, taunts_sent, taunts_bonus, taunt_type, taunt_data')
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
        .select('id, player_id, grid_challenges, validated_cells, status, score, started_at, jokers_used, jokers_bonus, taunts_sent, taunts_bonus, taunt_type, taunt_data')
        .eq('player_id', userId)
        .eq('status', 'ACTIVE')
        .order('started_at', { ascending: false }) 
        .limit(1)
        .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

        if (error) {
          console.error("[GameService] Error fetching active session:", error);
          // Only fallback to cache on real errors, not on "not found"
          throw error; 
        }

        if (data) {
            const startedAt = new Date(data.started_at).getTime();
            if (Date.now() - startedAt <= EXPIRATION_TIME) {
                 const session = this.mapDataToSession(data);
                 localStorage.setItem('bingo_last_session', JSON.stringify(session));
                 return session;
            }
        } else {
          // Explicitly not found in DB -> clear cache
          localStorage.removeItem('bingo_last_session');
          return null;
        }
    } catch (e) {
        console.warn("Network error or session not found, checking offline cache if applicable");
        // If it was a real network error, we might want to fallback, 
        // but if we are here and data was null, we already returned null.
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
        .select('id, player_id, grid_challenges, validated_cells, status, score, started_at, jokers_used, jokers_bonus, taunts_sent, taunts_bonus, taunt_type, taunt_data')
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
        .select('id, player_id, grid_challenges, validated_cells, status, score, started_at, jokers_used, jokers_bonus, taunts_sent, taunts_bonus, taunt_type, taunt_data')
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

    // Lazy cleanup: trigger cleanup of games older than 24h
    this.cleanupOldPlayers().catch(e => console.error("Cleanup error", e));

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('games')
      .select(`
        score, started_at, jokers_used, player_id, 
        players:player_id (pseudo, emoji)
      `)
      .eq('status', 'ACTIVE')
      .gt('started_at', last24h)
      .order('score', { ascending: false })
      .limit(100);

    if (error || !data) return [];

    const now = Date.now();
    const entries: LeaderboardEntry[] = data
      .filter((game: any) => game.players) // Filter out deleted players
      .map((game: any) => {
         const startedAt = new Date(game.started_at).getTime();
         // Extract country from pseudo if it exists (e.g. [FR] Pseudo)
         let pseudo = game.players.pseudo || 'Unknown';
         let country = 'FR';
         const match = pseudo.match(/^\[([A-Z]{2})\]\s*(.*)/);
         if (match) {
           country = match[1];
           pseudo = match[2];
         }

         return {
           userId: game.player_id,
           pseudo: pseudo,
           avatarId: game.players.emoji || '🎲',
           country: country,
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

  async getCountryLeaderboard(): Promise<any[]> {
    if (!supabase) return [];

    // Get all games from the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthIso = startOfMonth.toISOString();

    const { data, error } = await supabase
      .from('games')
      .select(`
        score, 
        players:player_id (pseudo)
      `)
      .gt('started_at', startOfMonthIso);

    if (error || !data) return [];

    const countryStats = new Map<string, { totalScore: number, playerCount: number }>();

    data.forEach((game: any) => {
      if (game.players && game.players.pseudo) {
        let country = 'FR';
        const match = game.players.pseudo.match(/^\[([A-Z]{2})\]/);
        if (match) {
          country = match[1];
        }

        const current = countryStats.get(country) || { totalScore: 0, playerCount: 0 };
        countryStats.set(country, {
          totalScore: current.totalScore + (game.score || 0),
          playerCount: current.playerCount + 1
        });
      }
    });

    const entries = Array.from(countryStats.entries()).map(([country, stats]) => ({
      country,
      totalScore: stats.totalScore,
      playerCount: stats.playerCount
    }));

    entries.sort((a, b) => b.totalScore - a.totalScore);
    return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  async cleanupOldPlayers(): Promise<void> {
    if (!supabase) return;
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Delete games older than 24h
      await supabase
        .from('games')
        .delete()
        .lt('started_at', yesterday);
        
    } catch (e) {
      console.error("Cleanup failed", e);
    }
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

  // --- ACTIVITY FEED ---

  async postActivity(playerId: string, pseudo: string, emoji: string, type: 'LINE_COMPLETED' | 'GRID_COMPLETED'): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('activities').insert({
        player_id: playerId,
        player_pseudo: pseudo,
        player_emoji: emoji,
        type: type
      });
    } catch (e) {
      console.error("Failed to post activity", e);
    }
  }

  subscribeToActivities(callback: (activity: any) => void) {
    if (!supabase) return () => {};

    const channel = supabase
      .channel('activities-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async closeAllOpenSessions(): Promise<void> {
    if (!supabase) return;
    try {
      // Close ALL open sessions — any saved QR code / bookmarked URL becomes dead instantly
      await supabase.from('sessions').update({ status: 'closed' }).eq('status', 'open');
      localStorage.removeItem(this.SECURE_SESSION_KEY);
    } catch (e) {
      // Table may not exist yet (migration not applied) — non-blocking
      console.warn("[GameService] closeAllOpenSessions skipped (sessions table may not exist):", e);
    }
  }

  async createNewSession(): Promise<string> {
    if (!supabase) return '';
    try {
      console.log("[GameService] Creating new session...");

      // 1. Kill all existing open sessions — triggers realtime kick for connected players.
      //    Non-blocking: runs silently if sessions table doesn't exist yet.
      await this.closeAllOpenSessions();

      // 2. Reset game data (players, scores, etc.)
      await this.resetSession();

      // 3. Small delay for DB consistency and Realtime propagation
      await new Promise(resolve => setTimeout(resolve, 800));

      // 4. Create the new secure session row → fresh UUID → new QR code.
      //    Non-blocking: if sessions table doesn't exist, session still opens normally.
      let secureSessionId = '';
      try {
        secureSessionId = await this.createSecureSession();
      } catch (e) {
        console.warn("[GameService] createSecureSession skipped (run SQL migration to enable QR security):", e);
      }

      // 5. Open the global event session (existing on/off switch) — always runs
      await this.setSessionStatus(true);
      console.log("[GameService] New session created. UUID:", secureSessionId || '(no secure session)');
      return secureSessionId;
    } catch (e) {
      console.error("[GameService] Failed to create new session", e);
      throw e;
    }
  }

async resetSession(): Promise<void> {
  if (!supabase) return;
  try {
    console.log("[GameService] Starting full session reset...");
    const { error } = await supabase.rpc('reset_all_data');
    if (error) throw error;
    localStorage.removeItem('bingo_last_session');
    localStorage.removeItem('bingo_user_id');
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log("[GameService] Reset complete!");
  } catch (e) {
    console.error("[GameService] Failed to reset session", e);
    throw e;
  }
}

  async simulatePlayers(challenges: any[]): Promise<void> {
    if (!supabase) return;
    
    const mockPlayers = [
      { name: 'Agent Alpha', avatar: 'PartyKing', country: 'FR', score: 18 },
      { name: 'Agent Bravo', avatar: 'DancingQueen', country: 'US', score: 12 },
      { name: 'Agent Charlie', avatar: 'BeerMaster', country: 'GB', score: 22 },
      { name: 'Agent Delta', avatar: 'CocktailDiva', country: 'ES', score: 8 },
      { name: 'Agent Echo', avatar: 'DiscoBall', country: 'DE', score: 15 }
    ];

    for (const p of mockPlayers) {
      try {
        const user = await this.createUser(p.name, p.avatar, p.country);
        const game = await this.startGame(user.id, challenges);
        
        // Validate random cells to reach the target score
        const cellIds = Array.from({length: 25}, (_, i) => i);
        const shuffled = shuffleArray(cellIds);
        const toValidate = shuffled.slice(0, p.score);
        
        for (const cellId of toValidate) {
          await this.validateCell(game.id, cellId, { witnessName: 'Test Witness', witnessSignature: 'Test Sig' }, true);
        }
      } catch (e) {
        console.error("Simulate error for", p.name, e);
      }
    }
  }

  async getRecentActivities(limit = 10): Promise<any[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  }

  async awardBonusJoker(gameId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc('award_bonus_joker', { game_id: gameId });
    if (error) console.warn('[Bonus] award_bonus_joker failed:', error.message);
  }

  async awardBonusTaunt(gameId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc('award_bonus_taunt', { game_id: gameId });
    if (error) console.warn('[Bonus] award_bonus_taunt failed:', error.message);
  }

  // Duration (ms) each taunt keeps the victim affected
  static readonly TAUNT_DURATION_MS: Partial<Record<TauntType, number>> = {
    [TauntType.FREEZE]:      35_000,
    [TauntType.ICE_BLOCK]:   35_000,
    [TauntType.TINY_TARGET]: 35_000,
    [TauntType.BLOB]:        35_000,
    [TauntType.FLASHLIGHT]:  45_000,
    [TauntType.REVERSE]:    120_000,
  };

  async sendTaunt(senderGameId: string, targetPlayerId: string, tauntType: TauntType = TauntType.FREEZE, senderName?: string, senderGameIdForReverse?: string): Promise<void> {
    if (!supabase) return;

    // Find target's active game
    const { data: targetGame, error } = await supabase
      .from('games')
      .select('id, frozen_until, taunt_type')
      .eq('player_id', targetPlayerId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (error || !targetGame) throw new Error('Target game not found');

    // Protection: can't taunt someone already being taunted
    const alreadyFrozen = targetGame.frozen_until && new Date(targetGame.frozen_until).getTime() > Date.now();
    if (alreadyFrozen) {
      throw new Error('ALREADY_TAUNTED');
    }

    const durationMs = GameBackendService.TAUNT_DURATION_MS[tauntType];
    const frozenUntil = durationMs ? new Date(Date.now() + durationMs).toISOString() : null;

    // Build taunt_data based on type
    let tauntData: Record<string, any> = {};
    if (senderName) tauntData.senderName = senderName;

    if (tauntType === TauntType.REVERSE && senderGameIdForReverse) {
      tauntData.senderGameId = senderGameIdForReverse;
    }

    // Apply taunt — update target's game row (realtime fires on any UPDATE)
    await supabase
      .from('games')
      .update({
        ...(frozenUntil ? { frozen_until: frozenUntil } : {}),
        taunt_type: tauntType,
        taunt_data: Object.keys(tauntData).length > 0 ? tauntData : null,
      })
      .eq('id', targetGame.id);

    // Increment sender's taunt count (non-blocking — taunts work even if RPC missing)
    const rpcPromise = supabase.rpc('increment_taunts_sent', { game_id: senderGameId });
    Promise.resolve(rpcPromise)
      .then(({ error }: any) => { if (error) console.warn('[Taunt] increment_taunts_sent failed:', error.message); })
      .catch((e: any) => console.warn('[Taunt] increment_taunts_sent exception:', e));
  }

  async reverseBonus(senderGameId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc('reverse_bonus', { sender_game_id: senderGameId });
    if (error) console.warn('[Taunt] reverse_bonus failed:', error.message);
  }

  async trapPenalty(victimGameId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc('trap_penalty', { victim_game_id: victimGameId });
    if (error) console.warn('[Taunt] trap_penalty failed:', error.message);
  }

  subscribeToGameUpdates(gameId: string, callback: (data: any) => void) {
    if (!supabase) return () => {};
    const channel = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => callback(payload.new)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  private mapDataToSession(data: any): GameSession {
    const validatedMap = new Map<number, any>((data.validated_cells || []).map((v: any) => [v.id, v]));
    
    const grid: BingoCellData[] = (data.grid_challenges || []).map((c: any) => {
      const validation = validatedMap.get(c.id);
      const base = {
        id: c.id,
        text: c.text,
        type: c.type,
        isPartner: c.isPartner ?? false,
        partnerHandle: c.partnerHandle ?? undefined,
      };
      if (validation) {
        return {
          ...base,
          status: CellStatus.VALIDATED,
          witnessName: validation.proof?.witnessName,
          witnessSignature: validation.proof?.witnessSignature,
          timestamp: validation.timestamp
        };
      }
      return { ...base, status: CellStatus.EMPTY };
    });

    return {
      id: data.id,
      userId: data.player_id,
      grid,
      status: data.status,
      score: data.score || 0,
      jokers: Math.max(0, 2 - (data.jokers_used || 0) + (data.jokers_bonus || 0)),
      tauntsSent: data.taunts_sent || 0,
      tauntsBonus: data.taunts_bonus || 0,
      frozenUntil: data.frozen_until ? new Date(data.frozen_until).getTime() : undefined,
      tauntType: (data.taunt_type as TauntType) || TauntType.FREEZE,
      startedAt: data.started_at ? new Date(data.started_at).getTime() : Date.now(),
      lastUpdated: Date.now()
    };
  }
}

export const gameService = new GameBackendService();
