# MedecinDASH - Tableau de bord pour médecins

## Configuration de l'ESP32-CAM pour la reconnaissance faciale

Le tableau de bord médecin peut utiliser un ESP32-CAM pour effectuer la reconnaissance faciale des patients et surveiller les chambres.

### Prérequis

- Un ESP32-CAM avec le firmware CameraWebServer installé
- Arduino IDE pour programmer l'ESP32-CAM
- Face-api.js (déjà intégré dans l'application)

### Étapes d'installation

1. **Programmer l'ESP32-CAM**

   - Ouvrez le fichier `CameraWebServer.ino` dans Arduino IDE
   - Modifiez les paramètres WiFi dans le code:
     ```cpp
     const char *ssid = "VOTRE_SSID_WIFI";
     const char *password = "VOTRE_MOT_DE_PASSE_WIFI";
     ```
   - Sélectionnez le modèle de caméra approprié (AI_THINKER ou autre selon votre modèle)
   - Téléversez le code sur l'ESP32-CAM

2. **Récupérer l'adresse IP de l'ESP32-CAM**

   - L'adresse IP sera affichée dans le moniteur série de l'IDE Arduino
   - Notez cette adresse IP pour la configuration de l'application

3. **Configurer l'application**

   - Créez un fichier `.env.local` à la racine du projet medecinDASH
   - Ajoutez la ligne suivante en remplaçant par l'adresse IP de votre ESP32-CAM:
     ```
     VITE_ESP32_CAM_IP=192.168.1.100
     ```
   - Redémarrez l'application pour prendre en compte les modifications

### Utilisation

- Dans la page des chambres, les caméras afficheront le flux en direct de l'ESP32-CAM
- Dans la page des patients, la fonctionnalité de vérification d'identité utilisera également l'ESP32-CAM

### Dépannage

- Si l'ESP32-CAM n'est pas détecté, l'application basculera automatiquement sur la webcam locale
- Assurez-vous que l'ESP32-CAM et l'ordinateur exécutant l'application sont sur le même réseau
- Vérifiez que le pare-feu n'empêche pas la connexion à l'ESP32-CAM

### Remarques sur la sécurité

- L'ESP32-CAM n'est pas sécurisé par défaut. En production, il est recommandé d'ajouter une authentification
- Les flux vidéo ne sont pas chiffrés. Pour une utilisation en production, configurez HTTPS 