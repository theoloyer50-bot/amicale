
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

  ## Firebase (forfait Spark)

  Le site est hébergé sur Firebase Hosting et utilise directement Firebase Authentication et Realtime Database depuis le navigateur. Les Cloud Functions ne sont plus requises pour les fonctionnalités du site. Les mots de passe ne sont jamais enregistrés dans Realtime Database.

  Les paramètres publics du SDK Web sont dans `src/utils/firebase/client.ts`. Les autorisations sont appliquées par `database.rules.json` : la base est privée par défaut, les inscriptions publiques au site ne peuvent créer qu'un profil en attente, et les écrans admin sont limités au rôle admin enregistré dans `kv/memberAccounts/<UID>`.

  Pour déployer avec Firebase CLI :

  ```powershell
  npm ci
  npm run build
  firebase deploy --only hosting,database,functions
  ```

  Les comptes sont créés dans Firebase Authentication. Leurs rôles et statuts sont dans `kv/memberAccounts`, et l'annuaire minimal approuvé dans `kv/memberDirectory`. Les contenus de site, inscriptions et données enfants sont stockés sous `kv/site_content:*`, `kv/noelRegistrations`, `kv/sainteBarbeTables` et `kv/children`.

  ## Limites de gestion sans backend

  - La réinitialisation de mot de passe envoie un e-mail Firebase ; le panneau ne peut pas définir directement le mot de passe d'un autre utilisateur.
  - « Désactiver » bloque l'accès au site, mais ne supprime pas le compte Firebase Authentication. La suppression d'un compte Auth nécessite un backend de confiance.
  - Sainte-Barbe utilise cinq emplacements de réservation par table, dans la limite de dix personnes au total par table. Une inscription comprend un ou deux adultes.
  - À Noël, les enfants qui participeront sont sélectionnés parmi ceux associés au compte ; le nombre d'enfants inscrit est calculé à partir de cette sélection.
  - Un enfant est rattaché au compte qui le déclare ; un second parent membre pompier approuvé peut également être associé.

  Les anciens comptes et données des anciennes versions ne sont pas migrés automatiquement. Les comptes doivent être créés dans Firebase Authentication et disposer d'un profil correspondant dans Realtime Database.
  