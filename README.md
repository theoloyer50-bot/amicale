
  # Site pour Amicale Pompiers

  This is a code bundle for Site pour Amicale Pompiers. The original project is available at https://www.figma.com/design/boshionRWakyAeFkIx1fMI/Site-pour-Amicale-Pompiers.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Installation locale (Windows) ⚙️

  Si PowerShell indique que `node` ou `npm` est introuvable :

  - Vérifiez Node.js : exécutez `node -v` et `npm -v`.
  - Si manquant, installez Node.js LTS depuis https://nodejs.org ou utilisez nvm-windows (https://github.com/coreybutler/nvm-windows).
  - Pour aider, exécutez le script intégré : `powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/check-node.ps1`. Il détecte l'absence de Node, lance `npm ci` si Node est présent et affiche des instructions utiles.
  - Si vous voulez que je télécharge l'installateur Node pour vous (script interactif), lancez : `powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/install-node.ps1` (le script vous demandera confirmation avant de télécharger et de lancer l'installateur).

  Après installation de Node, relancez :

  ```powershell
  npm ci
  npm run build
  ```

  ## Firebase

  Le site et l'API sont déployés sur Firebase Hosting et Firebase Functions. Les données applicatives sont stockées dans Firebase Realtime Database (`https://amicale-tourlaville-default-rtdb.europe-west1.firebasedatabase.app`) et les comptes/mots de passe sont gérés par Firebase Authentication.

  Dans Firebase Console, activez Authentication > Sign-in method > Email/Password. Copiez `functions/.env.example` vers `functions/.env.amicale-tourlaville` et renseignez la clé API Web Firebase ainsi qu'un `ADMIN_SECRET_CODE` long et privé. Ce fichier local est ignoré par Git. Installez Firebase CLI, connectez-vous, puis lancez :

  ```powershell
  npm ci
  npm --prefix functions install
  npm run build
  firebase deploy --only functions,hosting,database
  ```

  La Realtime Database refuse les accès directs publics ; l'API utilise l'identité de service de Firebase Functions. Les mots de passe ne sont jamais écrits dans la base de données : Firebase Authentication les protège.

  Les anciens comptes et données ne sont pas importés automatiquement. Les comptes de l'ancien système doivent être recréés ou migrés par procédure dédiée dans Firebase Authentication ; les anciens identifiants d'utilisateur ne correspondent pas aux UID Firebase. Ne désactive pas l'ancien système avant d'avoir migré les données applicatives et vérifié les comptes.

  ## Limite d'inscriptions pour Sainte-Barbe

  Les inscriptions à la Sainte-Barbe sont désormais limitées **à 2 personnes par enregistrement** (champ "Nombre de personnes"). Cette limitation est appliquée côté client et côté serveur. Si vous administrez le site et souhaitez normaliser les inscriptions existantes qui dépasseraient cette limite, utilisez l'endpoint admin dédié:

  ```
  POST /make-server-3b9ea24b/admin/events/sainte-barbe/normalize-registrations
  ```

  Il faut être admin pour appeler cet endpoint ; il réduit le nombre de places par participant à 2 et met à jour les totaux de tables.
  