
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
  private _validatingCells = new Set<string>(); // per-cell lock to prevent double-tap lost update
  private _isCreatingSession = false;           // guard against double-click createNewSession

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
      // Deduplicate: skip if an identical action is already pending
      if (action.type === 'VALIDATE' || action.type === 'JOKER') {
          const isDuplicate = queue.some(
              a => a.type === action.type &&
                   a.gameId === action.gameId &&
                   a.payload?.cellId === action.payload?.cellId
          );
          if (isDuplicate) return;
      } else if (action.type === 'BADGE') {
          const isDuplicate = queue.some(
              a => a.type === 'BADGE' &&
                   a.playerId === action.playerId &&
                   a.payload?.badgeType === action.payload?.badgeType
          );
          if (isDuplicate) return;
      }
      queue.push(action);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  private clearQueue() {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  // Returns true if the error is permanent (no point retrying).
  private isPermanentError(e: any): boolean {
      if (!e) return false;
      const code = e?.code ?? e?.error_code ?? '';
      const msg = (e?.message ?? '').toLowerCase();
      // Postgres unique violation (cell already validated), row not found, or explicit conflict
      return code === '23505' || code === 'PGRST116' || code === 'GAME_INACTIVE' ||
             msg.includes('already validated') || msg.includes('not found') ||
             msg.includes('duplicate') || msg.includes('violates unique') ||
             msg.includes('no longer active');
  }

  public async syncPendingActions() {
      if (this._isSyncing || !navigator.onLine) return;

      // Discard actions older than 24 h — the game has long moved on
      let queue = this.getQueue().filter(a => Date.now() - a.timestamp < EXPIRATION_TIME);
      if (queue.length === 0) { this.clearQueue(); return; }

      this.setSyncing(true);
      console.log(`[Sync] Processing ${queue.length} offline actions...`);

      const failedActions: OfflineAction[] = [];

      for (const action of queue) {
          try {
              if (action.type === 'VALIDATE') {
                  const { gameId, cellId, proof } = action.payload;
                  await this.validateCell(gameId, cellId, proof, true);
              } else if (action.type === 'JOKER') {
                  const { gameId, cellId, newChallenge } = action.payload;
                  await this.useJoker(gameId, cellId, newChallenge, true);
              } else if (action.type === 'BADGE') {
                  const { playerId, badgeType } = action.payload;
                  await this.unlockBadge(playerId, badgeType, true);
              }
          } catch (e) {
              console.error("[Sync] Action failed", action, e);
              // Drop permanent errors (conflict, already done, not found); retry network errors
              if (!this.isPermanentError(e)) {
                  failedActions.push(action);
              }
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

  async triggerBarTransitionAndAdvance(durationMinutes: number, newBar: number, barName?: string): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest) return;
    const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const updates: Record<string, unknown> = {
      transition_ends_at: endsAt,
      next_bar_name: barName || null,
      current_bar: newBar,
    };
    if (newBar >= 3) updates.chaos_mode = true;
    const [{ error }] = await Promise.all([
      supabase.from('event_session').update(updates).eq('id', latest.id),
      supabase.from('games').update({ validations_this_bar: 0, lines_this_bar: 0 }).eq('status', 'ACTIVE'),
    ]);
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
        is_partner: (fr.id ?? 0) >= 1 && (fr.id ?? 0) <= 4,
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
      ? (new URLSearchParams(window.location.search).get('s') || localStorage.getItem('bingo_session_token'))
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

    // Row 0 (bar 1 intro): exactly 1 MASTER + 4 non-MASTER, no "story" challenge
    // "Story" challenge (id=2) is reserved for bar 2 (rows 1+)
    const STORY_ID = 2;
    const masterPool = shuffleArray(challenges.filter((c: any) => c.is_partner && c.id !== STORY_ID));
    const storyChallenge = challenges.find((c: any) => c.id === STORY_ID);
    const nonMasterPool = shuffleArray(challenges.filter((c: any) => !c.is_partner && c.type !== 'MASTER'));
    const extraMasterPool = shuffleArray(challenges.filter((c: any) => !c.is_partner && c.type === 'MASTER'));

    // 1 MASTER for row 0 (prefer partner master, fallback to extra master)
    const row0Master = masterPool.length > 0 ? masterPool[0] : extraMasterPool[0];
    // 4 non-MASTER for row 0 (AUTO, WITNESS, PVP)
    const row0Others = nonMasterPool.slice(0, 4);
    const row0 = shuffleArray([row0Master, ...row0Others].filter(Boolean));

    // Fill row0 to 5 cells if not enough unique challenges (cycle through pool)
    if (row0.length < 5) {
      const fallback = shuffleArray([...masterPool, ...nonMasterPool, ...extraMasterPool]);
      while (row0.length < 5 && fallback.length > 0) row0.push(fallback.shift());
    }

    // Remaining challenges for rows 1-4 (20 cells), story forced in
    const usedIds = new Set(row0.map((c: any) => c.id));
    const rows1to4Pool = shuffleArray(
      challenges.filter((c: any) => !usedIds.has(c.id))
    );

    // Ensure story is included (it wasn't in usedIds, so it's already in the pool)
    // If somehow story is missing (no id=2 in DB), just proceed
    let rows1to4 = rows1to4Pool.slice(0, 20);

    // Fill with repeated challenges if pool is too small
    if (rows1to4.length < 20) {
      const cyclePool = shuffleArray([...challenges]);
      if (cyclePool.length > 0) {
        while (rows1to4.length < 20) rows1to4.push(cyclePool[rows1to4.length % cyclePool.length]);
      }
    }

    // Build final 25-cell grid
    const grid: any[] = [...row0, ...rows1to4];
    void storyChallenge; // story is already in rows1to4Pool via usedIds exclusion

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
        .eq('status', 'ACTIVE');
    } catch (e) {
      console.error('[startGame] Failed to abandon previous game', e);
      // Consider throwing here if data integrity is critical
    }

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

    // Per-cell lock: prevent double-tap from firing two concurrent writes on the same cell
    const cellKey = `${gameId}:${cellId}`;
    if (this._validatingCells.has(cellKey)) {
      const cached = localStorage.getItem('bingo_last_session');
      if (cached) return JSON.parse(cached) as GameSession;
      throw new Error("Validation already in progress");
    }
    this._validatingCells.add(cellKey);

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
        .select('id, validated_cells, status')
        .eq('id', gameId)
        .single();

        if (fetchError || !game) throw new Error("Game not found");
        if (game.status !== 'ACTIVE') throw Object.assign(new Error("Game is no longer active"), { code: 'GAME_INACTIVE' });

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
    } finally {
        this._validatingCells.delete(cellKey);
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

  async postActivity(playerId: string, pseudo: string, emoji: string, type: 'LINE_COMPLETED' | 'GRID_COMPLETED' | 'BOOST_WON'): Promise<void> {
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
      .channel(`activities-${Date.now()}`)
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
    if (this._isCreatingSession) return '';
    this._isCreatingSession = true;
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
    } finally {
      this._isCreatingSession = false;
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

  // ─── BOOST AUCTION ──────────────────────────────────────────────────────────

  async startBoostAuction(durationSecs: number = 30): Promise<void> {
    if (!supabase) return;
    const endsAt = new Date(Date.now() + durationSecs * 1000).toISOString();
    const { data: latest } = await supabase.from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    await supabase.from('boost_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('event_session').update({ boost_auction_ends_at: endsAt }).eq('id', latest.id);
  }

  async clearBoostAuction(): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase.from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (latest) await supabase.from('event_session').update({ boost_auction_ends_at: null }).eq('id', latest.id);
  }

  async castBoostVote(sessionId: string, voterId: string, candidateId: string): Promise<void> {
    if (!supabase) return;
    await supabase.from('boost_votes').upsert(
      { session_id: sessionId, voter_id: voterId, candidate_id: candidateId },
      { onConflict: 'session_id,voter_id' }
    );
  }

  async getBoostVoteCounts(sessionId: string): Promise<Record<string, number>> {
    if (!supabase) return {};
    const { data } = await supabase.from('boost_votes').select('candidate_id').eq('session_id', sessionId);
    if (!data) return {};
    const counts: Record<string, number> = {};
    data.forEach((v: any) => { counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1; });
    return counts;
  }

  subscribeBoostVotes(sessionId: string, onUpdate: (counts: Record<string, number>) => void): () => void {
    if (!supabase) return () => {};
    this.getBoostVoteCounts(sessionId).then(onUpdate);
    const ch = supabase.channel(`boost_votes_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boost_votes', filter: `session_id=eq.${sessionId}` },
        () => this.getBoostVoteCounts(sessionId).then(onUpdate))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }

  async closeBoostAuction(sessionId: string): Promise<{ winnerId: string; winnerName: string; winnerEmoji: string } | null> {
    if (!supabase) return null;
    const counts = await this.getBoostVoteCounts(sessionId);
    const entries = Object.entries(counts);
    if (entries.length === 0) { await this.clearBoostAuction(); return null; }
    const winnerId = entries.sort((a, b) => b[1] - a[1])[0][0];
    const activeSession = await this.getActiveSession(winnerId);
    if (activeSession) await this.awardBonusTaunt(activeSession.id);
    const { data: player } = await supabase.from('players').select('nickname, avatar_id').eq('id', winnerId).maybeSingle();
    if (player) await this.postActivity(winnerId, player.nickname, player.avatar_id, 'BOOST_WON');
    await supabase.from('boost_votes').delete().eq('session_id', sessionId);
    await this.clearBoostAuction();
    return { winnerId, winnerName: player?.nickname ?? '?', winnerEmoji: player?.avatar_id ?? '🎲' };
  }

  // Duration (ms) each taunt keeps the victim affected — minimum 1 minute
  static readonly TAUNT_DURATION_MS: Partial<Record<TauntType, number>> = {
    [TauntType.FREEZE]:      60_000,
    [TauntType.ICE_BLOCK]:   60_000,
    [TauntType.TINY_TARGET]: 60_000,
    [TauntType.BLOB]:        60_000,
    [TauntType.FLASHLIGHT]:  75_000,
  };

  async sendTaunt(senderGameId: string, targetPlayerId: string, tauntType: TauntType = TauntType.FREEZE, senderName?: string): Promise<void> {
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
    // Promise.resolve() converts PromiseLike to Promise so .catch() is available
    Promise.resolve(supabase.rpc('increment_taunts_sent', { game_id: senderGameId }))
      .then(({ error }: any) => { if (error) console.warn('[Taunt] increment_taunts_sent failed:', error.message); })
      .catch((e: any) => console.warn('[Taunt] increment_taunts_sent exception:', e));
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

  // ═══════════════════════════════════════════════════════════
  // PRE-GAME — PHASE CONTROL (Master)
  // ═══════════════════════════════════════════════════════════

  async setPregamePhase(phase: string | null, subjectId?: string | null): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    await supabase.from('event_session').update({
      pregame_phase: phase,
      pregame_subject_id: subjectId ?? null,
    }).eq('id', latest.id);
  }

  async triggerCountdown(seconds: number): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    const endsAt = new Date(Date.now() + seconds * 1000).toISOString();
    await supabase.from('event_session').update({ countdown_ends_at: endsAt }).eq('id', latest.id);
  }

  // ═══════════════════════════════════════════════════════════
  // PRE-GAME — TRUTH / LIE
  // ═══════════════════════════════════════════════════════════

  async submitTruthLie(
    playerId: string, nickname: string, avatarId: string,
    s1: string, s2: string, s3: string, lieIndex: number,
    sessionId: string
  ): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('pregame_tl_submissions').upsert({
      player_id: playerId,
      nickname,
      avatar_id: avatarId,
      statement_1: s1,
      statement_2: s2,
      statement_3: s3,
      lie_index: lieIndex,
      session_id: sessionId,
    }, { onConflict: 'player_id,session_id' });
    if (error) throw error;
  }

  async getTruthLieSubmissions(sessionId: string): Promise<any[]> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('pregame_tl_submissions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    return data ?? [];
  }

  async voteTruthLie(
    voterPlayerId: string, subjectPlayerId: string, votedIndex: number, sessionId: string
  ): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('pregame_tl_votes').upsert({
      voter_player_id: voterPlayerId,
      subject_player_id: subjectPlayerId,
      voted_index: votedIndex,
      session_id: sessionId,
    }, { onConflict: 'voter_player_id,subject_player_id,session_id' });
    if (error) throw error;
  }

  async getTruthLieVotes(subjectPlayerId: string, sessionId: string): Promise<any[]> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('pregame_tl_votes')
      .select('*')
      .eq('subject_player_id', subjectPlayerId)
      .eq('session_id', sessionId);
    return data ?? [];
  }

  subscribeTruthLieSubmissions(sessionId: string, callback: (submissions: any[]) => void) {
    if (!supabase) return () => {};
    // Initial fetch
    this.getTruthLieSubmissions(sessionId).then(callback);
    const ch = supabase
      .channel(`tl_subs_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pregame_tl_submissions',
        filter: `session_id=eq.${sessionId}` },
        () => this.getTruthLieSubmissions(sessionId).then(callback))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }

  subscribeTruthLieVotes(subjectPlayerId: string, sessionId: string, callback: (votes: any[]) => void) {
    if (!supabase) return () => {};
    this.getTruthLieVotes(subjectPlayerId, sessionId).then(callback);
    const ch = supabase
      .channel(`tl_votes_${subjectPlayerId}_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pregame_tl_votes',
        filter: `subject_player_id=eq.${subjectPlayerId}` },
        () => this.getTruthLieVotes(subjectPlayerId, sessionId).then(callback))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }

  // ═══════════════════════════════════════════════════════════
  // PRE-GAME — HOT TAKE
  // ═══════════════════════════════════════════════════════════

  async submitHotTake(
    playerId: string, nickname: string, avatarId: string, text: string, sessionId: string
  ): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('pregame_hot_takes').upsert({
      player_id: playerId,
      nickname,
      avatar_id: avatarId,
      text,
      session_id: sessionId,
    }, { onConflict: 'player_id,session_id' });
    if (error) throw error;
  }

  async getHotTakes(sessionId: string): Promise<any[]> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('pregame_hot_takes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    return data ?? [];
  }

  async voteHotTake(voterPlayerId: string, hotTakeId: string, vote: 'UP' | 'DOWN', sessionId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('pregame_ht_votes').upsert({
      voter_player_id: voterPlayerId,
      hot_take_id: hotTakeId,
      vote,
      session_id: sessionId,
    }, { onConflict: 'voter_player_id,hot_take_id' });
    if (error) throw error;
  }

  // ─── PLAYER MANAGEMENT ───────────────────────────────────────────────────────

  async getPlayersWithScores(sessionId: string): Promise<Array<{
    id: string; pseudo: string; emoji: string; score: number; status: string; joinedAt: string;
    deviceId: string | null; lastSeenAt: string | null; gameId: string | null;
  }>> {
    if (!supabase) return [];
    const { data: players } = await supabase
      .from('players')
      .select('id, pseudo, emoji, created_at, device_id, last_seen_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!players || players.length === 0) return [];
    const playerIds = players.map((p: any) => p.id);

    const { data: games } = await supabase
      .from('games')
      .select('id, player_id, score, status')
      .in('player_id', playerIds)
      .eq('status', 'ACTIVE');

    const gameMap = new Map((games || []).map((g: any) => [g.player_id, g]));

    return players.map((p: any) => {
      const game = gameMap.get(p.id);
      let pseudo = p.pseudo || 'Unknown';
      const match = pseudo.match(/^\[([A-Z]{2})\]\s*(.*)/);
      if (match) pseudo = match[2];
      return {
        id: p.id, pseudo, emoji: p.emoji || '🎲',
        score: game?.score ?? 0, status: game?.status ?? 'WAITING',
        joinedAt: p.created_at,
        deviceId: p.device_id ?? null,
        lastSeenAt: p.last_seen_at ?? null,
        gameId: game?.id ?? null,
      };
    });
  }

  subscribePlayersWithScores(sessionId: string, callback: (players: any[]) => void): () => void {
    if (!supabase) return () => {};

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const refetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.getPlayersWithScores(sessionId).then(callback);
      }, 300); // coalesce rapid game updates (many players validating at once)
    };

    this.getPlayersWithScores(sessionId).then(callback); // immediate initial fetch

    const ch = supabase
      .channel(`players_scores_live_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `session_id=eq.${sessionId}` }, refetch)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games' }, refetch)
      .subscribe((status) => {
        // Re-fetch on reconnect to catch any missed events while offline
        if (status === 'SUBSCRIBED') refetch();
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(ch);
    };
  }

  async kickPlayer(playerId: string): Promise<void> {
    if (!supabase) return;
    // Mark their game as ABANDONED — the session guard will redirect them to GAME_OVER
    await supabase.from('games').update({ status: 'ABANDONED' }).eq('player_id', playerId).eq('status', 'ACTIVE');
    await supabase.from('players').delete().eq('id', playerId);
  }

  // ─── MASTER VALIDATIONS ───────────────────────────────────────────────────────

  async requestMasterValidation(
    gameId: string, cellId: number, challengeText: string,
    playerNickname: string, playerEmoji: string, sessionId: string
  ): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('master_validations').upsert({
      game_id: gameId, cell_id: cellId, challenge_text: challengeText,
      player_nickname: playerNickname, player_emoji: playerEmoji,
      session_id: sessionId, status: 'PENDING',
    }, { onConflict: 'game_id,cell_id', ignoreDuplicates: false });
    if (error) throw error;
  }

  async getPendingMasterValidations(sessionId: string): Promise<any[]> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('master_validations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });
    return data || [];
  }

  async approveMasterValidation(validation: any): Promise<void> {
    if (!supabase) return;
    // Validate the cell in the player's game
    await this.validateCell(validation.game_id, validation.cell_id, { witnessName: 'Master', witnessSignature: 'approved' }, true);
    // Mark as approved
    await supabase.from('master_validations').update({ status: 'APPROVED', resolved_at: new Date().toISOString() }).eq('id', validation.id);
  }

  async rejectMasterValidation(validationId: string): Promise<void> {
    if (!supabase) return;
    await supabase.from('master_validations').update({ status: 'REJECTED', resolved_at: new Date().toISOString() }).eq('id', validationId);
  }

  subscribeMasterValidations(sessionId: string, callback: (validations: any[]) => void) {
    if (!supabase) return () => {};
    this.getPendingMasterValidations(sessionId).then(callback);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const refetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.getPendingMasterValidations(sessionId).then(callback);
      }, 300);
    };

    const ch = supabase
      .channel(`mv_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_validations',
        filter: `session_id=eq.${sessionId}` }, refetch)
      .subscribe();
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(ch);
    };
  }

  // ─── SPOTLIGHT CONTROL ────────────────────────────────────────────────────────

  async setSpotlightDisabled(disabled: boolean): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    await supabase.from('event_session').update({ spotlight_disabled: disabled }).eq('id', latest.id);
  }

  async setChallengeCooldown(secs: number): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    await supabase.from('event_session').update({ challenge_cooldown_secs: secs }).eq('id', latest.id);
  }

  // ─── PLAYER MANAGEMENT ───────────────────────────────────────────────────

  // ─── BAR CADENCE & CHAOS MODE (spec 5.x) ────────────────────────────────

  /** Increment current_bar counter and reset per-bar counters on all active games. */
  async advanceBar(): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session').select('id, current_bar').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    const newBar = (latest.current_bar ?? 1) + 1;
    await supabase.from('event_session').update({ current_bar: newBar }).eq('id', latest.id);
    // Reset per-bar counters on all active games so anti-spam resets per bar
    await supabase.from('games').update({ validations_this_bar: 0, lines_this_bar: 0 }).eq('status', 'ACTIVE');
  }

  async setCurrentBar(bar: number): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    await supabase.from('event_session').update({ current_bar: bar }).eq('id', latest.id);
  }

  async setBarCadence(cadence: string): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    await supabase.from('event_session').update({ bar_cadence: cadence }).eq('id', latest.id);
  }

  async setChaosMode(chaos: boolean): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    await supabase.from('event_session').update({ chaos_mode: chaos }).eq('id', latest.id);
  }

  async setMaxValidationsPerBar(max: number): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    await supabase.from('event_session').update({ max_validations_per_bar: max }).eq('id', latest.id);
  }

  // ─── PAUSE ────────────────────────────────────────────────────────────────

  async setPaused(paused: boolean): Promise<void> {
    if (!supabase) return;
    const { data: latest } = await supabase
      .from('event_session').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    if (!latest) return;
    await supabase.from('event_session').update({ is_paused: paused }).eq('id', latest.id);
  }

  // ─── SOFT RECONNECT (keeps player row, resets game only) ──────────────────

  async resetPlayerGame(playerId: string): Promise<void> {
    if (!supabase) return;
    // Abandon current active game — player stays in the session, can restart
    await supabase
      .from('games')
      .update({ status: 'ABANDONED' })
      .eq('player_id', playerId)
      .eq('status', 'ACTIVE');
    // Also clear device lock so player can reconnect from any device
    await supabase.from('players').update({ device_id: null }).eq('id', playerId);
  }

  // ─── DOUBLE CONNECTIONS ───────────────────────────────────────────────────

  async getPlayersWithSameDevice(sessionId: string): Promise<Array<{deviceId: string; players: any[]}>> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('players')
      .select('id, pseudo, emoji, device_id, last_seen_at')
      .eq('session_id', sessionId)
      .not('device_id', 'is', null);
    if (!data) return [];
    // Group by device_id to find duplicates
    const map = new Map<string, any[]>();
    for (const p of data) {
      if (!map.has(p.device_id)) map.set(p.device_id, []);
      map.get(p.device_id)!.push(p);
    }
    return Array.from(map.entries())
      .filter(([, players]) => players.length > 1)
      .map(([deviceId, players]) => ({ deviceId, players }));
  }

  async updatePlayerDeviceId(playerId: string, deviceId: string): Promise<void> {
    if (!supabase) return;
    await supabase
      .from('players')
      .update({ device_id: deviceId, last_seen_at: new Date().toISOString() })
      .eq('id', playerId);
  }

  async renamePlayer(playerId: string, newPseudo: string): Promise<void> {
    if (!supabase) return;
    // Preserve the [XX] country prefix stored in pseudo, only replace the display name
    const { data: player } = await supabase.from('players').select('pseudo').eq('id', playerId).maybeSingle();
    const prefix = player?.pseudo?.match(/^\[[A-Z]{2}\]\s*/)?.[0] ?? '';
    await supabase.from('players').update({ pseudo: prefix + newPseudo }).eq('id', playerId);
  }

  // ─── PLAYER WITNESS (player selects witness directly, no master needed) ──

  /** Create a master_validation row with witness already assigned — called by the player, not the master.
   *  The witness player will see it in WitnessRequestBanner and can confirm/reject from their phone. */
  async requestPlayerWitness(
    gameId: string, cellId: number, challengeText: string,
    playerNickname: string, playerEmoji: string, sessionId: string,
    witnessPlayerId: string
  ): Promise<string> {
    if (!supabase) throw new Error('No backend');
    const { data, error } = await supabase
      .from('master_validations')
      .upsert({
        game_id: gameId, cell_id: cellId, challenge_text: challengeText,
        player_nickname: playerNickname, player_emoji: playerEmoji,
        session_id: sessionId, status: 'PENDING',
        witness_player_id: witnessPlayerId, witness_status: 'PENDING',
      }, { onConflict: 'game_id,cell_id', ignoreDuplicates: false })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  /** Clear all active taunt/freeze effects for a session — master emergency reset. */
  async clearAllTaunts(sessionId: string): Promise<void> {
    if (!supabase) return;
    const { data: players } = await supabase
      .from('players').select('id').eq('session_id', sessionId);
    if (!players?.length) return;
    const playerIds = players.map((p: any) => p.id);
    await supabase
      .from('games')
      .update({ frozen_until: null, taunt_type: null, taunt_data: null })
      .in('player_id', playerIds)
      .eq('status', 'ACTIVE');
  }

  // ─── WITNESS MODE ─────────────────────────────────────────────────────────

  async requestWitnessConfirmation(validationId: string, witnessPlayerId: string): Promise<void> {
    if (!supabase) return;
    await supabase
      .from('master_validations')
      .update({ witness_player_id: witnessPlayerId, witness_status: 'PENDING' })
      .eq('id', validationId);
  }

  async getMyWitnessRequests(playerId: string): Promise<any[]> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('master_validations')
      .select('*')
      .eq('witness_player_id', playerId)
      .eq('witness_status', 'PENDING');
    return data ?? [];
  }

  async confirmWitness(validation: any): Promise<void> {
    if (!supabase) return;
    await this.approveMasterValidation(validation);
    await supabase
      .from('master_validations')
      .update({ witness_status: 'CONFIRMED', resolved_at: new Date().toISOString() })
      .eq('id', validation.id);
  }

  async rejectWitness(validationId: string): Promise<void> {
    if (!supabase) return;
    await supabase
      .from('master_validations')
      .update({ witness_status: 'REJECTED', resolved_at: new Date().toISOString() })
      .eq('id', validationId);
  }

  subscribeWitnessRequests(playerId: string, onRequests: (requests: any[]) => void): () => void {
    if (!supabase) return () => {};
    this.getMyWitnessRequests(playerId).then(onRequests);
    const ch = supabase
      .channel(`witness_${playerId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'master_validations',
        filter: `witness_player_id=eq.${playerId}`,
      }, () => { this.getMyWitnessRequests(playerId).then(onRequests); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }

  subscribeHotTakes(sessionId: string, callback: (takes: any[]) => void) {
    if (!supabase) return () => {};
    this.getHotTakes(sessionId).then(callback);
    const ch = supabase
      .channel(`ht_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pregame_hot_takes',
        filter: `session_id=eq.${sessionId}` },
        () => this.getHotTakes(sessionId).then(callback))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pregame_ht_votes',
        filter: `session_id=eq.${sessionId}` },
        () => this.getHotTakes(sessionId).then(callback))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }

  // ── 7.1 Double connection — device ownership ─────────────────────

  /** Get device_id for a player (used for conflict detection on init). */
  async getPlayerDeviceId(playerId: string): Promise<string | null> {
    if (!supabase) return null;
    const { data } = await supabase
      .from('players')
      .select('device_id')
      .eq('id', playerId)
      .maybeSingle();
    return data?.device_id ?? null;
  }

  /** Claim this device — sets device_id to the given UUID.
   *  Call after the user confirms "Oui, utiliser ce téléphone". */
  async claimDevice(playerId: string, deviceId: string): Promise<void> {
    if (!supabase) return;
    await supabase.from('players').update({ device_id: deviceId }).eq('id', playerId);
  }

  /** Master action: clear a player's device lock so they can reconnect from any device. */
  async clearDeviceLock(playerId: string): Promise<void> {
    if (!supabase) return;
    await supabase.from('players').update({ device_id: null }).eq('id', playerId);
  }

  /** Subscribe to a player row — fires when device_id changes.
   *  Used to evict old device when master or new device claims the session. */
  subscribePlayerDeviceChange(playerId: string, onDeviceChanged: (newDeviceId: string | null) => void): () => void {
    if (!supabase) return () => {};
    const ch = supabase
      .channel(`player_device_${playerId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `id=eq.${playerId}` },
        (payload: any) => { onDeviceChanged(payload.new?.device_id ?? null); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }

  /** Number of actions pending in the offline queue (for UI display). */
  getPendingQueueLength(): number {
    return this.getQueue().length;
  }

  // ── 4.3 Account Recovery ──────────────────────────────────────────

  /** Generate (or regenerate) a one-time recovery token for a player.
   *  Expires at the end of the event day (24 h from now).
   *  Returns the token string to embed in a QR code URL. */
  async generateRecoveryToken(playerId: string): Promise<string> {
    if (!supabase) throw new Error('No backend');
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('players')
      .update({ recovery_token: token, recovery_token_expires_at: expiresAt })
      .eq('id', playerId);
    if (error) throw error;
    return token;
  }

  /** Look up a player by recovery token. Returns null if not found or expired. */
  async recoverByToken(token: string): Promise<{ playerId: string; pseudo: string; emoji: string } | null> {
    if (!supabase) return null;
    const { data } = await supabase
      .from('players')
      .select('id, pseudo, emoji, recovery_token_expires_at')
      .eq('recovery_token', token)
      .maybeSingle();
    if (!data) return null;
    if (data.recovery_token_expires_at && new Date(data.recovery_token_expires_at) < new Date()) return null;
    return { playerId: data.id, pseudo: data.pseudo, emoji: data.emoji };
  }

  // ── 4.1 Profile editing ───────────────────────────────────────────

  /** Attach a player to the current secure session if they don't have one yet.
   *  Silently no-ops if session_id is already set — safe to call on every load. */
  async linkPlayerToSession(playerId: string, sessionId: string): Promise<void> {
    if (!supabase) return;
    await supabase.from('players').update({ session_id: sessionId })
      .eq('id', playerId).is('session_id', null);
  }

  /** Update pseudo (preserving [XX] country prefix) and emoji for a player. */
  async updatePlayerProfile(playerId: string, newNickname: string, newAvatarKey: string): Promise<void> {
    if (!supabase) throw new Error('No backend');
    const { data: player } = await supabase
      .from('players')
      .select('pseudo')
      .eq('id', playerId)
      .maybeSingle();
    const prefix = player?.pseudo?.match(/^\[[A-Z]{2}\]\s*/)?.[0] ?? '';
    const emojiChar = ADULT_EMOJI_MAP[newAvatarKey] || newAvatarKey || '🎲';
    const { error } = await supabase
      .from('players')
      .update({ pseudo: prefix + newNickname, emoji: emojiChar })
      .eq('id', playerId);
    if (error) throw error;
  }
}

export const gameService = new GameBackendService();
