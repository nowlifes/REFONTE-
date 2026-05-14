---
phase: code-review
reviewed: 2026-05-07T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - App.tsx
  - components/BingoCell.tsx
  - components/GamePage.tsx
  - components/MasterPage.tsx
  - components/NicknamePage.tsx
  - components/ValidationModal.tsx
  - constants.ts
  - hooks/useBingoGame.ts
  - hooks/useEventSession.ts
  - services/gameService.ts
findings:
  critical: 2
  warning: 6
  info: 3
  total: 11
status: issues_found
---

# Code Review Report

**Reviewed:** 2026-05-07
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This review covers the core game logic, master dashboard, session management, and Supabase service layer. The codebase is well-structured overall — the recent security fixes (server-side master auth via Edge Function) are good. Two critical issues remain: the master code and rune sequence are still exported as plaintext constants in the client bundle, bypassing the server-side protection. Six warnings cover missing user feedback on errors (violating the project rule), silent failures in game-critical paths, and one state-race in the kick/session-close logic.

---

## Critical Issues

### CR-01: Master password exported as plaintext in client bundle

**File:** `constants.ts:195-196`
**Issue:** `MASTER_VALID_CODE = "KING"` and `MASTER_RUNE_SEQUENCE = [0, 2, 3, 1]` are exported constants compiled into the JavaScript bundle. Any player who opens DevTools → Sources can read these values directly. The `verifyMasterCode` Edge Function provides server-side protection for the login form, but `MasterRunePad` likely uses `MASTER_RUNE_SEQUENCE` client-side to validate the rune sequence without a network call — meaning the rune bypass is entirely client-side and unprotected.

**Fix:** Move secret values to environment variables or validate the rune sequence server-side via a dedicated Edge Function. At minimum, remove the export and keep them as unexported module-private values used only inside `MasterRunePad`:

```typescript
// constants.ts — remove the export
// MASTER_VALID_CODE and MASTER_RUNE_SEQUENCE should NOT be exported

// MasterRunePad.tsx — keep the sequence internal
const MASTER_RUNE_SEQUENCE = [0, 2, 3, 1]; // private, not importable
```

For real security, validate the sequence server-side the same way `verifyMasterCode` validates the text code.

---

### CR-02: `startGame` silently swallows the game-abandonment error, risking duplicate ACTIVE games

**File:** `services/gameService.ts:504-511`
**Issue:** The block that marks old games as ABANDONED is inside a bare `try {} catch (e) {}` with no error handling and no rethrow. If this DB call fails (e.g., RLS policy blocks it, network error), the code continues and inserts a new ACTIVE game. The player ends up with two ACTIVE games, which corrupts leaderboard queries (both games appear), breaks `getActiveSession` ordering, and prevents proper score tracking.

```typescript
// Current — silent failure
try {
  await supabase
    .from('games')
    .update({ status: 'ABANDONED' })
    .eq('player_id', userId)
    .eq('status', 'ACTIVE')
    .select('id');
} catch (e) {}
```

**Fix:** Log the error and optionally throw if it fails (or at minimum alert the user):

```typescript
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
```

---

## Warnings

### WR-01: `validateCell` catch block has no user feedback when online (violates project rule)

**File:** `hooks/useBingoGame.ts:662-668`
**Issue:** When `validateCell` fails and the player is online, the code rolls back the optimistic UI update and logs `console.error`, but shows no feedback to the player. The project rule explicitly states "Supabase errors must have UI feedback in catch blocks". The player sees their cell flip back with no explanation.

```typescript
// Current
} catch (e: any) {
  if (!navigator.onLine) return;
  setCells(oldCells);
  console.error("Validation failed", e);
}
```

**Fix:**
```typescript
} catch (e: any) {
  if (!navigator.onLine) return;
  setCells(oldCells);
  console.error("Validation failed", e);
  alert('Erreur lors de la validation. Réessaie.');
}
```

---

### WR-02: `useJoker` catch block has no user feedback when online

**File:** `hooks/useBingoGame.ts:694-699`
**Issue:** Same pattern as WR-01. When the joker use fails and the player is online, cells and joker count roll back silently. Player sees a cell change back with no explanation.

```typescript
// Current
} catch (e: any) {
  if (!navigator.onLine) return;
  setCells(oldCells);
  setJokers(oldJokers);
}
```

**Fix:**
```typescript
} catch (e: any) {
  if (!navigator.onLine) return;
  setCells(oldCells);
  setJokers(oldJokers);
  alert('Erreur lors du swap. Réessaie.');
}
```

---

### WR-03: `resetSession` in `useEventSession` is not wrapped in try/catch

**File:** `hooks/useEventSession.ts:202-205`
**Issue:** `resetSession` calls `gameService.resetSession()` without error handling. If it throws, the error propagates uncaught to `MasterPage.handleReset`, which does have a catch, but `setIsSessionActive(false)` has already been called optimistically. On failure the master sees no error and the session state stays falsely as "closed". The caller's catch in `MasterPage` only does `console.error(e)` (line 258) — also no user alert.

```typescript
// Current
const resetSession = async () => {
  setIsSessionActive(false);
  await gameService.resetSession();
};
```

**Fix:**
```typescript
const resetSession = async () => {
  const previous = isSessionActive;
  try {
    setIsSessionActive(false);
    await gameService.resetSession();
  } catch (e) {
    setIsSessionActive(previous); // rollback
    throw e; // let caller show UI feedback
  }
};
```

And in `MasterPage.handleReset` (line 257-261):
```typescript
const handleReset = async () => {
  setIsResetting(true);
  try { await resetSession(); setShowResetConfirm(false); }
  catch (e) {
    console.error(e);
    alert('Erreur lors du reset. Vérifiez votre connexion.');
  }
  finally { setIsResetting(false); }
};
```

---

### WR-04: Bar transition and bar advance errors swallowed silently in MasterPage

**File:** `components/MasterPage.tsx:206-210` and `212-222`
**Issue:** Both `handleTriggerTransition` and `handleAdvanceBarWithTransition` catch errors with only `console.error(e)`. The master gets no UI feedback if the bar transition fails to write to Supabase. The countdown appears to start (optimistic update in `useEventSession.triggerBarTransition`) but players won't see it.

```typescript
// Current
catch (e) { console.error(e); }
```

**Fix:**
```typescript
catch (e) {
  console.error(e);
  alert('Erreur lors du changement de bar. Vérifiez votre connexion.');
}
```

---

### WR-05: `handleWitnessConfirm` try/catch cannot catch async errors — error path is dead code

**File:** `components/ValidationModal.tsx:201-213`
**Issue:** `handleWitnessConfirm` sets `step` to `'SUCCESS'` before calling `onConfirm`, then has a `try/catch` that sets `step` back to `'INFO'` on failure. However `onConfirm` is synchronous from the modal's perspective — it triggers async operations in the parent (`useBingoGame.validateCell`) via a fire-and-forget pattern. The `catch` block will never execute for Supabase failures. The `step = 'SUCCESS'` transition is irreversible from within this function, meaning any actual backend failure is never shown.

```typescript
// Current — catch is unreachable for real async failures
const handleWitnessConfirm = () => {
  setStep('SUCCESS');
  try {
    onConfirm({ witnessName, witnessSignature: signatureData });
  } catch {
    setStep('INFO'); // never fires for async failures
    setConfirmError('Erreur lors de la validation. Réessaie.');
    return;
  }
  setTimeout(triggerFortune, 900);
};
```

**Fix:** Since `onConfirm` is intentionally fire-and-forget (parent manages errors), document this explicitly and remove the misleading try/catch, or convert `onConfirm` to return a Promise and await it:

```typescript
const handleWitnessConfirm = () => {
  if (!witnessName.trim() || !signatureData) return;
  setConfirmError(null);
  setStep('SUCCESS');
  onConfirm({ witnessName, witnessSignature: signatureData });
  // Parent (useBingoGame.validateCell) handles async errors with its own rollback + alert
  setTimeout(triggerFortune, 900);
};
```

---

### WR-06: Session-close logic can leave GAME view visible after session ends

**File:** `App.tsx:383-393`
**Issue:** The kick logic when `!isSessionActive` only calls `setView(AppView.NICKNAME)` and `resetGame()` when `!showEndOverlay`. If `showEndOverlay` is `true` at the moment the session closes (e.g., it was set by the `prevSessionActive` check in a previous render), the kick branch is skipped entirely. This means a player who is on the end-of-session overlay can dismiss it and be sent back to a running GAME view even though the session is closed, because `resetGame()` never ran.

```typescript
// Current — resetGame() is skipped when showEndOverlay is true
if (!showEndOverlay && s.view !== AppView.NICKNAME && s.view !== AppView.MISSION_REPORT) {
  aRef.current.setView(AppView.NICKNAME);
  aRef.current.resetGame();
}
```

**Fix:** Always call `resetGame()` when the session closes, regardless of overlay state:

```typescript
if (!isSessionActive) {
  setVipBypass(false);
  // Always reset game state on session close
  if (!prevSessionActive.current && !isFirstLoad.current) {
    // (transition to end overlay only if actively playing)
  }
  if (prevSessionActive.current && !isFirstLoad.current &&
      (s.view === AppView.GAME || s.view === AppView.LEADERBOARD)) {
    setShowEndOverlay(true);
  }
  // Reset regardless of overlay state, unless showing mission report
  if (s.view !== AppView.NICKNAME && s.view !== AppView.MISSION_REPORT) {
    if (!showEndOverlay) {
      aRef.current.setView(AppView.NICKNAME);
    }
    aRef.current.resetGame();
  }
}
```

---

## Info

### IN-01: `state`, `actions`, `ui`, `uiActions` props typed as `any` in GamePage and NicknamePage

**File:** `components/GamePage.tsx:26-41`, `components/NicknamePage.tsx:13-20`
**Issue:** Core component props are `any`-typed, eliminating all TypeScript protection at a major component boundary. Refactoring the hook return types or extracting interfaces would catch prop mismatches at compile time.

**Fix:** Extract types from the hooks' return values:
```typescript
type GameState = ReturnType<typeof useBingoGame>['state'];
type GameActions = ReturnType<typeof useBingoGame>['actions'];
```

---

### IN-02: `console.log` debug statements left in production paths

**File:** `services/gameService.ts:303`, `316`, `319`, `530`, `571`, `959`, `975`, `982`; `hooks/useBingoGame.ts:556-558`
**Issue:** Multiple `console.log` calls with diagnostic content (challenge counts, session UUIDs, game start confirmations) are present in production paths. These appear in end users' browser consoles.

**Fix:** Gate behind `import.meta.env.DEV` checks or replace with structured logging that strips in production.

---

### IN-03: Magic number `0.1` for fortune probability with no named constant

**File:** `components/ValidationModal.tsx:57`
**Issue:** `Math.random() < 0.1` (10% fortune win chance) is an unexplained magic number. If the probability needs tuning, the value is hard to find.

```typescript
// Current
const won = Math.random() < 0.1;
```

**Fix:**
```typescript
const FORTUNE_WIN_PROBABILITY = 0.1; // 10% chance
const won = Math.random() < FORTUNE_WIN_PROBABILITY;
```

---

_Reviewed: 2026-05-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
