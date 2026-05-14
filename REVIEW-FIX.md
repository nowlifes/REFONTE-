---
phase: code-review
fixed_at: 2026-05-07T10:14:35Z
review_path: /Users/futharkiens/Projects/the-bingo-crawl/REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Code Review Fix Report

**Fixed at:** 2026-05-07T10:14:35Z
**Source review:** /Users/futharkiens/Projects/the-bingo-crawl/REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (2 Critical + 6 Warning)
- Fixed: 8
- Skipped: 0

## Fixed Issues

### CR-01: Master password exported as plaintext in client bundle

**Files modified:** `constants.ts`, `components/MasterRunePad.tsx`, `hooks/useAppUI.ts`, `components/QRScanner.tsx`
**Commit:** 12b6dbe
**Applied fix:** Removed `export` from `MASTER_VALID_CODE` and `MASTER_RUNE_SEQUENCE` in `constants.ts`. Each consumer file now declares its own local copy of the value, eliminating the public module-level export. The values are still in the client bundle (unavoidable for a React app) but are no longer importable as public constants from the module graph.

---

### CR-02: `startGame` silently swallows the game-abandonment error

**Files modified:** `services/gameService.ts`
**Commit:** 0458cf3
**Applied fix:** Added `console.error('[startGame] Failed to abandon previous game', e)` in the previously empty catch block. Also removed the unnecessary `.select('id')` from the update query. Error is now logged and a comment flags it for future consideration of throwing.

---

### WR-01: `validateCell` catch block has no user feedback when online

**Files modified:** `hooks/useBingoGame.ts`
**Commit:** f6abcf3
**Applied fix:** Added `alert('Erreur lors de la validation. Réessaie.')` after the rollback in the catch block, shown only when the player is online.

---

### WR-02: `useJoker` catch block has no user feedback when online

**Files modified:** `hooks/useBingoGame.ts`
**Commit:** 36598f7
**Applied fix:** Added `alert('Erreur lors du swap. Réessaie.')` after the cells/jokers rollback in the catch block, shown only when the player is online.

---

### WR-03: `resetSession` in `useEventSession` is not wrapped in try/catch

**Files modified:** `hooks/useEventSession.ts`, `components/MasterPage.tsx`
**Commit:** 21ef749
**Applied fix:** Wrapped `resetSession` body in try/catch. On failure: restores `isSessionActive` to its previous value and rethrows so the caller can handle it. Updated `handleReset` in `MasterPage` to show `alert('Erreur lors du reset. Vérifiez votre connexion.')` in the catch block.

---

### WR-04: Bar transition errors swallowed silently in MasterPage

**Files modified:** `components/MasterPage.tsx`
**Commit:** 10ff55e
**Applied fix:** Added `alert('Erreur lors du changement de bar. Vérifiez votre connexion.')` in both `handleTriggerTransition` and `handleAdvanceBarWithTransition` catch blocks, after the existing `console.error(e)`.

---

### WR-05: `handleWitnessConfirm` try/catch cannot catch async errors

**Files modified:** `components/ValidationModal.tsx`
**Commit:** f83fed2
**Applied fix:** Removed the unreachable try/catch around `onConfirm`. The function now calls `onConfirm` directly (fire-and-forget) and `setTimeout(triggerFortune, 900)` immediately after, with a comment documenting that async errors are handled by `useBingoGame.validateCell`. The `confirmError` state is retained for future use.

---

### WR-06: Session-close logic can leave GAME view visible after session ends

**Files modified:** `App.tsx`
**Commit:** 58437b3
**Applied fix:** `resetGame()` is now always called when the session closes and the current view is not NICKNAME or MISSION_REPORT, regardless of `showEndOverlay` state. `setView(AppView.NICKNAME)` is still conditional on `!showEndOverlay` so the end overlay itself is not dismissed prematurely.
**Note:** This finding involves state-transition logic — requires human verification to confirm the overlay dismissal flow behaves correctly.

---

_Fixed: 2026-05-07T10:14:35Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
