# Guide pas à pas — Dépôt INPI Enveloppe Soleau

## Qu'est-ce que l'Enveloppe Soleau ?

C'est un service officiel de l'INPI (Institut National de la Propriété Industrielle) qui **horodate ton œuvre** : il prouve que tu en es l'auteur à une date précise. En cas de litige, tu peux ouvrir l'enveloppe devant un juge comme preuve légale.

- **Coût** : 16,50 € (une fois)
- **Validité** : 5 ans (renouvelable)
- **Valeur légale** : forte — c'est une institution publique française

---

## Étapes du dépôt en ligne

### 1. Créer un compte INPI
👉 Va sur **https://www.inpi.fr**
- Clique sur "Créer un compte"
- Remplis avec ton identité réelle (prénom : Alexandre, nom : Leroux)

### 2. Accéder à l'Enveloppe Soleau numérique
- Dans ton espace, cherche **"Enveloppe Soleau"**
- Clique sur **"Déposer une enveloppe Soleau"**

### 3. Remplir le formulaire

**Intitulé de l'œuvre :**
```
The Bingo Crawl
```

**Nature de l'œuvre :**
```
Logiciel — Application web progressive multi-joueurs en temps réel
```

**Date de création :**
```
Printemps 2025
```

**Description de l'œuvre :**
→ Copie-colle le contenu du fichier `1_DESCRIPTION_OEUVRE.md` (la section "Description de l'œuvre" jusqu'à "Déclaration")

### 4. Téléverser les fichiers

Tu peux uploader jusqu'à **100 Mo** de fichiers.

Lance d'abord le script pour créer le zip :
```bash
bash DEPOT/generer_zip.sh
```

Cela crée `DEPOT/the-bingo-crawl-depot.zip`. Upload ce fichier.

**Fichiers à uploader (par ordre de priorité) :**
1. `the-bingo-crawl-depot.zip` — code source complet
2. `1_DESCRIPTION_OEUVRE.md` — description textuelle
3. Des captures d'écran de l'app (si tu en as)

### 5. Payer
- 16,50 € par carte bancaire
- Tu reçois immédiatement un **certificat de dépôt horodaté**

### 6. Conserver le certificat
- Sauvegarde le PDF du certificat
- Mets-le dans `DEPOT/CERTIFICAT_INPI.pdf` une fois reçu

---

## Ce que ça protège

✅ La date de création (printemps 2025)
✅ Le code source tel qu'il existe au moment du dépôt
✅ Le design system original
✅ Les défis/contenus originaux (translations.ts, constants.ts)
✅ L'architecture technique originale (système témoin, QR sessions, etc.)

---

## Ce que ça ne protège PAS

❌ Le concept de "bingo en bar crawl" (une idée n'est pas protégeable)
❌ Les éventuelles ressemblances avec d'autres apps futures (tu dois agir en justice toi-même)
❌ Les marques (pour protéger le nom "The Bingo Crawl" en tant que marque → dépôt de marque INPI séparé, ~200€)

---

## Calendrier recommandé

| Quand | Action |
|-------|--------|
| Dès maintenant | Faire le dépôt INPI (avant l'inauguration) |
| 13 juin 2026 | Inauguration — tu as déjà la protection |
| Dans 5 ans | Renouveler l'enveloppe Soleau |
