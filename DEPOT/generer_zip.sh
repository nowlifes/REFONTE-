#!/bin/bash
# Génère le zip du code source pour l'E-dépôt INPI
# Usage : bash DEPOT/generer_zip.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT="$SCRIPT_DIR/the-bingo-crawl-depot.zip"
TEMP_ZIP="$SCRIPT_DIR/temp_git_archive.zip"

echo "Génération du zip pour l'E-dépôt INPI..."
echo "Projet : $PROJECT_DIR"
echo "Sortie : $OUTPUT"

cd "$PROJECT_DIR"

# Supprimer les anciens zips
rm -f "$OUTPUT" "$TEMP_ZIP"

# git archive = respecte .gitignore + inclut uniquement les fichiers trackés
# On ajoute aussi le dossier DEPOT/ (non tracké) manuellement
git archive --format=zip --output="$TEMP_ZIP" HEAD

# Ajouter le dossier DEPOT/ (documents de dépôt, non trackés dans git)
zip -r "$TEMP_ZIP" DEPOT/ \
  --exclude "*/the-bingo-crawl-depot.zip" \
  --exclude "*/temp_git_archive.zip"

mv "$TEMP_ZIP" "$OUTPUT"

SIZE=$(du -sh "$OUTPUT" | cut -f1)
echo ""
echo "✅ Zip créé : $OUTPUT ($SIZE)"
echo ""
echo "Contenu inclus :"
echo "  - Code source (respecte .gitignore — pas de node_modules, pas de .env.local)"
echo "  - Dossier DEPOT/ (description + guide)"
echo ""
echo "Prochaine étape : uploader ce fichier sur https://www.inpi.fr (Enveloppe Soleau)"
