
  # Site pour Amicale Pompiers

  This is a code bundle for Site pour Amicale Pompiers. The original project is available at https://www.figma.com/design/boshionRWakyAeFkIx1fMI/Site-pour-Amicale-Pompiers.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Installation locale (Windows) ⚙️

  Si `npm run vercel-build` sort avec une erreur `126` ou si PowerShell indique que `node` ou `npm` est introuvable :

  - Vérifiez Node.js : exécutez `node -v` et `npm -v`.
  - Si manquant, installez Node.js LTS depuis https://nodejs.org ou utilisez nvm-windows (https://github.com/coreybutler/nvm-windows).
  - Pour aider, exécutez le script intégré : `powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/check-node.ps1`. Il détecte l'absence de Node, lance `npm ci` si Node est présent et affiche des instructions utiles.
  - Si vous voulez que je télécharge l'installateur Node pour vous (script interactif), lancez : `powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/install-node.ps1` (le script vous demandera confirmation avant de télécharger et de lancer l'installateur).

  Après installation de Node, relancez :

  ```powershell
  npm ci
  npm run vercel-build
  ```

  ## Vercel: erreur "Permission denied" sur `node_modules/.bin/vite`

  Si la build Vercel échoue avec un message du type:

  ```
  sh: line 1: /vercel/path0/node_modules/.bin/vite: Permission denied
  Error: Command "npm run vercel-build" exited with 126
  ```

  Alors le runner n'arrive pas à exécuter le shim dans `node_modules/.bin`. Pour contourner cela, les scripts `build` et `vercel-build` ont été mis à jour pour invoquer directement le binaire Vite via Node (`node ./node_modules/vite/bin/vite.js ...`), ce qui évite le problème d'autorisation. Si l'erreur persiste, copiez-collez les lignes d'erreur complètes ici et je regarderai plus en détail.

  ## Limite d'inscriptions pour Sainte-Barbe

  Les inscriptions à la Sainte-Barbe sont désormais limitées **à 2 personnes par enregistrement** (champ "Nombre de personnes"). Cette limitation est appliquée côté client et côté serveur. Si vous administrez le site et souhaitez normaliser les inscriptions existantes qui dépasseraient cette limite, utilisez l'endpoint admin dédié:

  ```
  POST /make-server-3b9ea24b/admin/events/sainte-barbe/normalize-registrations
  ```

  Il faut être admin pour appeler cet endpoint ; il réduit le nombre de places par participant à 2 et met à jour les totaux de tables.
  