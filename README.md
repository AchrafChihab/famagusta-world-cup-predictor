# Famagusta World Cup Predictor 🏆☕

Une application web moderne, épurée et responsive conçue pour le café **Famagusta**. Les clients scannent un QR code en salle et accèdent à un formulaire élégant pour pronostiquer le score exact des matchs de la Coupe du Monde 2026.

## Page Publique (Visiteurs)
- Accessible directement sans connexion via l'URL principale `/`.
- Choix des matchs ouverts aux pronostics.
- Formulaire de prédiction : Nom, Prénom, Téléphone, Score Équipe A et Score Équipe B.
- Système anti-doublon intelligent empêchant le même numéro de téléphone de pronostiquer deux fois le même match.
- Bouton optionnel de redirection pour laisser un avis 5 étoiles sur Google.
- Message de confirmation animé après soumission.

## Portail Administrateur (Gérant)
- Accessible via l'URL réservée `/admin`.
- Protection par authentification sécurisée par Email/Mot de passe (Firebase Auth).
- Ajout, modification, et suppression simplifiés des matchs (Équipes, Heure, Statut ouvert/fermé, Score final).
- Affichage de tous les participants et de leurs scores prédits pour chaque match.
- Détection automatique et mise en valeur des participants ayant trouvé le score exact.
- Bouton de **Tirage au sort** choisissant aléatoirement jusqu'à 5 gagnants parmi les pronostics parfaits.

---

## 🚀 Lancement Local

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)

### 1. Installation des dépendances
Dans le terminal, exécutez :
```bash
npm install
```

### 2. Configuration Firebase
L'application est pré-configurée avec votre projet de test. Pour connecter votre propre projet en production :
- Ouvrez le fichier `firebase-applet-config.json`.
- Remplacez les identifiants par ceux de votre application Web Firebase (disponibles dans la section *Paramètres généraux du projet* de la Console Firebase).

### 3. Exécution du serveur de développement
Lancez le projet localement :
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

---

## ⚡ Déploiement sur Netlify

L'application a été conçue pour un déploiement instantané et économique sur Netlify.

### Étape 1 : Créer un dépôt Git (facultatif)
Vous pouvez exporter le projet vers GitHub ou télécharger l'archive ZIP depuis l'interface Google AI Studio.

### Étape 2 : Déployer sur Netlify
1. Connectez-vous sur votre compte [Netlify](https://www.netlify.com/).
2. Cliquez sur **Add new site** > **Import an existing project** (ou par glisser-déposer de votre dossier de construction).
3. Utilisez les paramètres de configuration de build suivants :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
4. Cliquez sur **Deploy site**.

### Étape 3 : Gérer la Single Page Application (SPA) sur Netlify
Pour s'assurer que l'accès direct aux sous-pages comme `/admin` fonctionne parfaitement sans erreur 404 sur Netlify :
- Créez un fichier nommé `_redirects` dans votre dossier `public/` (ou directement à la racine du dossier publié `dist/`).
- Ajoutez la ligne suivante à l'intérieur :
  ```text
  /*    /index.html   200
  ```
L'application redirigera automatiquement les requêtes vers l'interface de routage React.

---

## 🔒 Sécurité & Règles Firestore
Les règles de sécurité de votre base de données sont définies et sécurisées dans `firestore.rules`. Elles empêchent toute modification des matches par des visiteurs non-authentifiés et bloquent la liste des prédictions à toute personne autre que l'administrateur.
