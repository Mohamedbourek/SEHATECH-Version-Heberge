#!/bin/bash

# Script pour démarrer l'application médicale en production

# Récupérer l'adresse IP du serveur
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
  SERVER_IP="10.0.0.2"  # IP par défaut si non détectée
  echo "IP non détectée, utilisation de l'IP par défaut: $SERVER_IP"
else
  echo "IP du serveur détectée: $SERVER_IP"
fi

# Vérifier si le build existe
if [ ! -d "dist" ]; then
  echo "ERREUR: Le dossier 'dist' n'existe pas. Veuillez d'abord construire l'application."
  echo "Utilisez: ./rebuild.sh"
  exit 1
fi

# Tuer tout processus existant sur le port 3001
echo "Arrêt des processus existants sur le port 3001..."
fuser -k 3001/tcp 2>/dev/null || true

# Attendre que le port soit libéré
echo "Attente de la libération du port..."
sleep 2

# Démarrer le serveur en mode production
echo "Démarrage du serveur sur $SERVER_IP:3001..."
cd "$(dirname "$0")"

# Créer ou mettre à jour le fichier .env.local avec les bonnes URL
echo "VITE_API_URL=http://$SERVER_IP:8000/api" > .env.local
echo "VITE_APP_BASE_URL=http://$SERVER_IP:8000" >> .env.local

# Démarrer le serveur de prévisualisation pour servir les fichiers du dossier dist
npx vite preview --host=$SERVER_IP --port=3001 --base=/ > /dev/null 2>&1 &

# Sauvegarder le PID
echo $! > .medecin.pid
echo "Application démarrée avec PID: $(cat .medecin.pid)"
echo "Interface accessible à l'adresse: http://$SERVER_IP:3001" 