# Graph Report - /Users/futharkiens/Projects/the-bingo-crawl  (2026-05-04)

## Corpus Check
- 54 files · ~70,473 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 258 nodes · 311 edges · 51 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]

## God Nodes (most connected - your core abstractions)
1. `GameBackendService` - 95 edges
2. `update()` - 35 edges
3. `ErrorBoundary` - 5 edges
4. `useLanguage()` - 4 edges
5. `getOrSetUnlockStart()` - 4 edges
6. `getUnlockedCount()` - 3 edges
7. `getUnlockedTaunts()` - 3 edges
8. `readCooldowns()` - 3 edges
9. `writeCooldown()` - 3 edges
10. `handleLaunchGame()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `useLanguage()` --calls--> `ShieldLogo()`  [INFERRED]
  /Users/futharkiens/Projects/the-bingo-crawl/contexts/LanguageContext.tsx → /Users/futharkiens/Projects/the-bingo-crawl/components/ShieldLogo.tsx
- `useLanguage()` --calls--> `IceBlockOverlay()`  [INFERRED]
  /Users/futharkiens/Projects/the-bingo-crawl/contexts/LanguageContext.tsx → /Users/futharkiens/Projects/the-bingo-crawl/components/IceBlockOverlay.tsx
- `useLanguage()` --calls--> `useBingoGame()`  [INFERRED]
  /Users/futharkiens/Projects/the-bingo-crawl/contexts/LanguageContext.tsx → /Users/futharkiens/Projects/the-bingo-crawl/hooks/useBingoGame.ts
- `GameRoom()` --calls--> `useSessionGuard()`  [INFERRED]
  /Users/futharkiens/Projects/the-bingo-crawl/components/GameRoom.tsx → /Users/futharkiens/Projects/the-bingo-crawl/hooks/useSessionGuard.ts
- `useBingoGame()` --calls--> `useBadges()`  [INFERRED]
  /Users/futharkiens/Projects/the-bingo-crawl/hooks/useBingoGame.ts → /Users/futharkiens/Projects/the-bingo-crawl/hooks/useBadges.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (3): update(), GameBackendService, handleLaunchGame()

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (8): handleClearDeviceLock(), handleCreateNew(), handleKickPlayer(), handleRejectValidation(), handleReset(), handleSaveRename(), handleSendWitness(), handleTriggerTransition()

### Community 2 - "Community 2"
Cohesion: 0.21
Nodes (10): deriveUnlockOrder(), getCooldownLeft(), getNextUnlockMs(), getOrSetUnlockStart(), getUnlockAtForPosition(), getUnlockedCount(), getUnlockedTaunts(), handleSend() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (1): handleValidateCell()

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (2): handleVisibilityChange(), requestWakeLock()

### Community 5 - "Community 5"
Cohesion: 0.2
Nodes (5): IceBlockOverlay(), useLanguage(), ShieldLogo(), useBadges(), useBingoGame()

### Community 6 - "Community 6"
Cohesion: 0.2
Nodes (2): handleRecoverPlayer(), openRecovery()

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (3): handleTutorialNext(), shuffleArray(), handleSimulate()

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (3): handleApproveValidation(), handleConfirm(), handleReject()

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (1): handleSubmit()

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (1): fetchTop()

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (2): GameRoom(), useSessionGuard()

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (2): handleResize(), updateRect()

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (1): useEventSession()

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 23`** (2 nodes): `handleSave()`, `EditProfileSheet.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `GameOverPage()`, `GameOverPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `handlePress()`, `MasterRunePad.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `getEmoji()`, `LobbyPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `Avatar()`, `Avatar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `useAppUI()`, `useAppUI.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `useTutorial.ts`, `useTutorial()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `index.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `translations.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `FlashlightOverlay.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `ReverseOverlay.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `SessionStartOverlay.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `BadgeNotification.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `LegendsModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `TinyTargetOverlay.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `NFTBadgeModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `TutorialOverlay.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `BackgroundParticles.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `ChallengeRevealSheet.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `StyleSelection.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `BarTransitionOverlay.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `OnboardingCards.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `ActivityFeed.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `supabaseClient.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GameBackendService` connect `Community 0` to `Community 1`, `Community 3`, `Community 6`, `Community 9`, `Community 10`, `Community 12`, `Community 15`, `Community 22`?**
  _High betweenness centrality (0.283) - this node is a cross-community bridge._
- **Why does `update()` connect `Community 0` to `Community 1`, `Community 3`, `Community 6`, `Community 8`, `Community 9`, `Community 10`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `handleTutorialNext()` connect `Community 9` to `Community 4`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 34 inferred relationships involving `update()` (e.g. with `.triggerBarTransition()` and `.clearBarTransition()`) actually correct?**
  _`update()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `useLanguage()` (e.g. with `ShieldLogo()` and `IceBlockOverlay()`) actually correct?**
  _`useLanguage()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._