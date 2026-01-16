#!/bin/bash

# Script pour reconstruire l'application medecinDASH

echo "===== Reconstruction de l'application medecinDASH ====="

# Récupérer l'adresse IP du serveur
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
  SERVER_IP="10.0.0.2"  # IP par défaut si non détectée
  echo "IP non détectée, utilisation de l'IP par défaut: $SERVER_IP"
else
  echo "IP du serveur détectée: $SERVER_IP"
fi

# Créer le fichier .env.local avec les bonnes URL
echo "VITE_API_URL=http://$SERVER_IP:8000/api" > .env.local
echo "VITE_APP_BASE_URL=http://$SERVER_IP:8000" >> .env.local
echo "Fichier .env.local créé avec succès."

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ] || [ "$1" == "--reinstall" ]; then
  echo "Installation des dépendances npm..."
  npm ci
fi

# Nettoyer le dossier dist s'il existe
if [ -d "dist" ]; then
  echo "Nettoyage du dossier dist..."
  rm -rf dist
fi

# Construction de l'application
echo "Construction de l'application..."
npm run build

# Vérifier si la construction a réussi
if [ -d "dist" ]; then
  echo "Construction réussie!"
else
  echo "ERREUR: La construction a échoué!"
  exit 1
fi

echo "===== Reconstruction terminée ====="
echo "Pour démarrer l'application, utilisez: npx vite preview --host=$SERVER_IP --port=3001" 