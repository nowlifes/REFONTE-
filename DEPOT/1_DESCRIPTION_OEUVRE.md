# Dossier de dépôt — The Bingo Crawl
## À copier/coller dans le formulaire INPI Enveloppe Soleau

---

## INTITULÉ DE L'ŒUVRE

**The Bingo Crawl**

---

## NATURE DE L'ŒUVRE

Logiciel — Application web progressive (PWA) multi-joueurs en temps réel.

---

## AUTEUR

- **Nom :** Leroux
- **Prénom :** Alexandre
- **Email :** nownotionlife@gmail.com
- **Nationalité :** Française
- **Date de création :** Printemps 2025 (avril–juin 2025)

---

## DESCRIPTION DE L'ŒUVRE

### Présentation générale

**The Bingo Crawl** est un jeu de bingo multijoueur en temps réel conçu pour les bar crawls et événements festifs. L'application fonctionne sur navigateur mobile sans installation, et permet à un groupe de joueurs de s'affronter en accomplissant des défis en conditions réelles lors d'une soirée.

Le concept central : chaque joueur dispose d'une grille de bingo de 25 cases, chacune contenant un défi à accomplir en soirée (exemple : "Commande un cocktail dans une langue étrangère", "Fais danser quelqu'un"). Le premier à compléter une ligne, colonne ou diagonale remporte le bingo.

Un **Bingo Master** (animateur de soirée) pilote l'événement en temps réel : il ouvre/ferme les sessions, orchestre les changements de bar, valide les actions des joueurs et déclenche des événements spéciaux.

---

### Architecture technique originale

L'application repose sur une architecture temps réel synchronisée entre tous les participants via WebSockets (Supabase Realtime). Voici les composants techniques originaux :

**1. Système de sessions sécurisées par QR code**
Chaque session de jeu génère un QR code unique avec un UUID sécurisé et une date d'expiration. Les joueurs rejoignent la session en scannant ce QR — aucun compte requis. La couleur du QR change à chaque nouvelle session pour éviter les confusions.

**2. Système de validation par témoin (Witness System)**
Innovation centrale : quand un joueur complète un défi, il désigne un autre joueur comme "témoin". Ce témoin reçoit une notification en temps réel sur son téléphone et doit confirmer ou rejeter la validation. Cela empêche la triche et crée une dynamique sociale.

**3. Queue offline avec réconciliation**
L'application maintient une queue d'actions locales quand le joueur perd sa connexion. À la reconnexion, les actions sont rejouées dans l'ordre contre le backend Supabase avec gestion des conflits.

**4. Transition de bars avec countdown synchronisé**
Le Bingo Master peut déclencher un "changement de bar" avec un délai configurable (2/5/10/15 minutes). Un overlay compte à rebours s'affiche sur tous les téléphones simultanément jusqu'à l'arrivée au prochain bar.

**5. Grille avec cellule mystère**
La case centrale (id=12) est verrouillée par défaut. Elle se déverrouille progressivement une fois que le joueur atteint un score seuil. Cela introduit un mécanisme de progression.

**6. Système de badges et classement live**
Les joueurs gagnent des badges selon leurs actions (premier bingo, plus de cases complétées, etc.). Un classement temps réel est mis à jour en direct sur tous les écrans.

**7. Score animé**
Le score de chaque joueur s'anime via `requestAnimationFrame` avec un effet de compteur qui monte progressivement, renforçant la satisfaction des accomplissements.

---

### Éléments visuels et créatifs originaux

**Design system** : Charte graphique originale dite "dark brutalism" —
- Fond global : bleu nuit profond (#0A1629)
- Cartes : fond blanc avec bordure noire épaisse (3-4px) et ombre portée noire dure (shadow offset)
- Palette : jaune doré (#FFD700), vert néon (#00F5A0), rose vif (#FF2D6A), orange (#FF8C00)
- Typographie : Impact/uppercase pour les titres, DM Sans pour le corps, JetBrains Mono pour les chiffres
- Boutons avec effet "press" physique (translation + suppression d'ombre au clic)
- Zéro soft shadow colorée — uniquement des ombres noires dures

**Animations CSS 3D originales** :
- Flip 3D des cases bingo (face défi / face validée avec checkmark vert sur fond jaune)
- Animation de victoire avec stagger delay (chaque cellule de la ligne gagnante s'anime à 80ms d'intervalle)
- Animation de déverrouillage de la cellule mystère

**Overlays contextuels** :
- IceBlockOverlay : joueur "gelé" par le master (overlay animé bloc de glace)
- FlashlightOverlay : mode lampe torche (la grille n'est visible que sous une tache de lumière)
- ReverseOverlay : grille en miroir horizontal
- TinyTargetOverlay : cases bingo réduites à 20% de leur taille

---

### Contenu original (défis)

L'application contient une base de défis originaux en deux langues (français et anglais), conçus spécifiquement pour l'univers des bar crawls. Ces défis sont la propriété intellectuelle de l'auteur.

---

### Fichiers composant l'œuvre

L'œuvre est composée des fichiers de code source suivants (inclus dans le zip joint) :

- `App.tsx` — Routeur principal et orchestrateur d'état global
- `components/` — 38 composants React (GamePage, MasterPage, BingoCell, ValidationModal, etc.)
- `hooks/` — 6 hooks custom (useBingoGame, useEventSession, useAppUI, useBadges, useTutorial, useSessionGuard)
- `services/gameService.ts` — Service backend Supabase (~1700 lignes)
- `contexts/LanguageContext.tsx` — Système i18n EN/FR
- `translations.ts` — Traductions originales des défis et de l'interface
- `constants.ts` — Configuration des défis et constantes de jeu
- `supabase/migrations/` — Schéma de base de données original (5 migrations)
- `index.css` — Design system Tailwind v4 avec animations CSS originales
- `types.ts` — Typage TypeScript original

---

## HISTORIQUE DE CRÉATION

| Période | Étape |
|---------|-------|
| Printemps 2025 | Conception initiale sur Google AI Studio — premières versions du concept |
| Automne 2025 | Développement des features principales (grille, validation, sessions) |
| Hiver 2025–2026 | Intégration Supabase, système témoin, sessions QR |
| Mars 2026 | Migration vers dépôt Git formalisé (GitHub) |
| Avril–Mai 2026 | Stabilisation, corrections bugs, préparation lancement |
| 13 juin 2026 | **Inauguration publique** |

---

## DÉCLARATION

Je soussigné **Alexandre Leroux**, déclare être l'auteur et le créateur unique de l'œuvre logicielle **The Bingo Crawl**, décrite ci-dessus, créée à compter du printemps 2025.

L'ensemble du code source, du design système, des contenus textuels (défis, traductions) et de l'architecture technique constituent une œuvre originale protégée par le droit d'auteur.
