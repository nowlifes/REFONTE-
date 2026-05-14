# Bingo Crawl — Design System

> **Direction:** Brutalist Arcade / Party Zine  
> Contraste maximal. Noir absolu. Energie street. Pas de ombres douces, pas de glassmorphism tiède.

---

## Couleurs

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#0A1629` | Fond global |
| `--color-surface` | `#1A1A2E` | Surfaces secondaires (grille bingo, modals) |
| `--color-yellow` | `#FFD700` | Primary / Score / Bouton principal |
| `--color-green` | `#00F5A0` | Success / Cellule SOLO / Connecté |
| `--color-pink` | `#FF2D6A` | Danger / Cellule WITNESS / Fever / Offline |
| `--color-orange` | `#FF8C00` | Warning / Cellule MASTER (secondaire) |
| `--color-black` | `#000000` | Borders, ombres — **toujours pur noir** |
| `--color-white` | `#FFFFFF` | Texte sur fonds sombres |

### Règles couleurs
- Les ombres sont **toujours noires pures** — jamais colorées, jamais `rgba()`
- Les borders sont **toujours noires** sur les composants élevés (cards, buttons, badges)
- Le fond `#0A1629` ne change jamais — pas de mode clair

---

## Typographie

### Familles

| Famille | Usage | Import |
|---------|-------|--------|
| **Impact** (system / fallback) | Titres, labels uppercase, scores, tout ce qui crie | system font |
| **DM Sans** | Corps de texte, descriptions, onboarding | Google Fonts |
| **JetBrains Mono** | Données chiffrées, scores, timers, codes | Google Fonts |

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

### Échelle

| Role | Font | Size | Weight | Letter-spacing |
|------|------|------|--------|----------------|
| `display-xl` | Impact | 48px | — | -1px |
| `display-lg` | Impact | 36px | — | -0.5px |
| `display-md` | Impact | 28px | — | -0.3px |
| `display-sm` | Impact | 20px | — | 0 |
| `heading` | Impact | 16px | — | 0.5px |
| `label` | Impact | 10px | — | 2px (widest) |
| `body-lg` | DM Sans | 15px | 400 | 0 |
| `body-sm` | DM Sans | 13px | 400 | 0 |
| `data-lg` | JetBrains Mono | 16px | 700 | 0 |
| `data-sm` | JetBrains Mono | 11px | 400 | 0.5px |

### Règles typo
- Tout ce qui est **uppercase + petit** → `font-impact tracking-widest`
- Les chiffres importants (score, timer, rank) → `JetBrains Mono`
- Le corps de texte lisible (descriptions, modals, onboarding) → `DM Sans`
- **Jamais** de font-weight sur Impact (il n'en a qu'un)

---

## Espacements

Grille **8pt stricte**.

| Token | px |
|-------|----|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |
| `--space-8` | 64px |

---

## Border Radius

Hiérarchie par taille de composant :

| Token | px | Usage |
|-------|----|-------|
| `--radius-sm` | 8px | Cellules bingo, petits badges |
| `--radius-md` | 12px | Boutons, inputs |
| `--radius-lg` | 16px | Cards moyennes |
| `--radius-xl` | 24px | Modals, grandes cards |
| `--radius-2xl` | 32px | Footer nav, onboarding cards |

---

## Ombres

**Hard shadows noir absolu uniquement.** Jamais de `box-shadow` colorée ou floue.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `3px 3px 0px #000` | Petits éléments (badges, tags) |
| `--shadow-md` | `5px 5px 0px #000` | Boutons, inputs |
| `--shadow-lg` | `8px 8px 0px #000` | Cards, footer nav |
| `--shadow-xl` | `10px 10px 0px #000` | Modals, éléments hero |

### Règles ombres
- `box-shadow: none` quand l'élément est pressé (active state) → donne le feedback "enfoncement"
- `translate(2px, 2px)` en `active` pour simuler le clic physique
- Les ombres glow (`0 0 Xpx color`) sont **réservées** aux animations de victoire et aux états fever

---

## Borders

- Composants élevés : **`border-[3px] border-black`** ou **`border-[4px] border-black`**
- Composants secondaires : **`border-2 border-white/10`** ou **`border-2 border-white/20`**
- Cellules bingo : **`border-0`** (le gap de la grille fait office de séparateur)
- États actifs/focus : **`ring-2 ring-[#FFD700]`**

---

## Composants

### Cellules Bingo

| Type | Background | Texte | Border |
|------|-----------|-------|--------|
| SOLO | `#00F5A0` | `text-black` | — |
| WITNESS | `#FF2D6A` | `text-white` | — |
| MASTER | `#FFD93D` | `text-black` | — |
| MYSTERY (locked) | `#0D1527` | `text-white/20` | `border-2 border-white/10 border-dashed` |
| VALIDATED | `#FFD93D` (back) | — | — |

Taille fixe : **66×66px**. Grid : 5×5, gap 4px, container 350×350px.

Font des cellules : **Impact**, `font-bold uppercase`, taille dynamique par longueur de texte (8–12px).

### Boutons

Structure standard :
```tsx
<button className="
  bg-[#FFD93D] text-black font-impact uppercase tracking-widest
  px-6 py-3 rounded-[12px]
  border-[3px] border-black
  shadow-[5px_5px_0px_black]
  active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
  transition-all duration-150
">
```

Variantes :
- **Primary** : `bg-[#FFD93D] text-black`
- **Success** : `bg-[#00F5A0] text-black`
- **Danger** : `bg-[#FF2D6A] text-white`
- **Ghost** : `bg-transparent border-2 border-white/20 text-white`

### Footer Nav

```tsx
<div className="
  bg-[#FFD93D] border-[3px] border-black
  rounded-[32px] px-10 py-3.5
  shadow-[8px_8px_0px_black]
">
```

Bouton central (Crown) : `-mt-16` pour sortir du footer, `w-16 h-16`, `rounded-[16px]`, `shadow-[6px_6px_0px_black]`.

### Badges / Tags

```tsx
<span className="
  font-impact uppercase text-[10px] tracking-widest
  px-2 py-1 rounded-md
  bg-black text-[#FFD700]
  shadow-[2px_2px_0px_black]
">
```

### Modals / Overlays

Fond : `bg-[#0A1629]/90 backdrop-blur-md`  
Container : `bg-[surface] border-[4px] border-black rounded-[32px] shadow-[10px_10px_0px_black]`

---

## Animations

### États cellule

| Classe | Déclencheur | Durée |
|--------|-------------|-------|
| `cell-winning` | Ligne complétée (avec stagger `winningIndex * 80ms`) | 0.45s |
| `cell-mystery-unlock` | Score atteint 5 | 0.6s |

Easing standard pour les animations "pop" : `cubic-bezier(0.34, 1.56, 0.64, 1)` (légèrement overshoot)

### Transitions interactives

```css
transition: all 0.15s ease
```

Boutons pressés : `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`

### Feedback haptique

- Clic cellule : `navigator.vibrate(30)`
- Victoire ligne : `navigator.vibrate([100, 50, 200])`
- Mystery unlock : `navigator.vibrate([100, 50, 200])`
- Long press : `navigator.vibrate(20)` par tick

---

## États de jeu — mapping visuel

| État | Signal visuel |
|------|---------------|
| Normal | Fond `#0A1629`, avatar ring vert `#00F5A0/50` |
| Fever | Ring rouge `ring-[8px] ring-inset ring-[#FF2D6A]` sur tout l'écran, avatar ring `#FFD700` |
| Frozen | Overlay `bg-[#0A1629]/90`, avatar ring `#FF2E63`, countdown |
| Offline | Badge rouge fixe en bas |
| Syncing | Badge jaune avec spinner en bas |

---

## Règles générales

1. **Noir absolu partout** : borders, ombres, outline. Jamais de gris pour les contours des composants élevés.
2. **Pas d'ombres douces** : pas de `box-shadow: 0 4px 20px rgba(0,0,0,0.2)`. Uniquement hard shadows.
3. **Impact = cri** : toute info importante (score, statut, CTA) est en Impact uppercase.
4. **DM Sans = conversation** : onboarding, explications, descriptions longues.
5. **JetBrains Mono = données** : chiffres, codes, timers.
6. **Feedback physique** : chaque bouton a un état `active` qui simule un enfoncement physique.
7. **Couleurs sémantiques** : vert = success/solo, rose = danger/witness/fever, jaune = primary/score, orange = master.
8. **Pas de glassmorphism** : `bg-white/5` et `bg-black/40` sont OK pour les surfaces secondaires, mais jamais comme style principal.

---

## Décisions de design

| Décision | Raison |
|----------|--------|
| Grid fixe 350×350px | Cohérence absolue sur tous les téléphones, pas de cellules qui rétrécissent |
| Cellule mystère center (id=12) | Position symbolique, débloque à score≥5 pour créer un objectif intermédiaire |
| Footer nav jaune | Le seul élément entièrement clair sur fond sombre = attention maximale sur les actions principales |
| Hard shadows vs soft | Identité "zine/print" — soft shadows = app SaaS, pas bingo de rue |
| DM Sans pour le body | Impact seul devient illisible sur les longs textes — DM Sans complémente sans trahir l'identité |
| JetBrains Mono pour les chiffres | Les scores doivent sembler "système", pas décoratifs |
