#!/bin/bash

# Script pour arrêter l'application médicale

echo "Arrêt de l'application médicale..."

# Vérifier si le fichier PID existe
if [ -f ".medecin.pid" ]; then
  PID=$(cat .medecin.pid)
  
  # Vérifier si le processus existe
  if ps -p $PID > /dev/null; then
    echo "Arrêt du processus avec PID: $PID"
    kill $PID
    sleep 1
    
    # Vérifier si le processus est toujours en cours d'exécution
    if ps -p $PID > /dev/null; then
      echo "Forçage de l'arrêt du processus..."
      kill -9 $PID
    fi
  else
    echo "Le processus avec PID $PID n'est pas en cours d'exécution."
  fi
  
  # Supprimer le fichier PID
  rm .medecin.pid
else
  # Si le fichier PID n'existe pas, essayer de trouver et tuer les processus par le port
  echo "Fichier PID non trouvé, recherche des processus sur le port 3001..."
  fuser -k 3001/tcp 2>/dev/null
fi

echo "Application médicale arrêtée." 