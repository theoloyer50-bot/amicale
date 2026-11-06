Scripts included for convenience:

- build-local.ps1: Installs dependencies, runs `npm run build` and checks `dist/` exists.
- check-dist.js: Node script that exits with non-zero if `dist/` doesn't exist (runs as `postbuild`).
- commit-and-push.ps1: Stages changed files and commits/pushes to the specified branch (requires git installed).

Usage examples (PowerShell):

1) Build locally and verify dist:
   ./scripts/build-local.ps1

2) Commit & push prepared changes:
   ./scripts/commit-and-push.ps1 -Message "chore: ensure dist output" -Branch "main"

3) Build and deploy Firebase Hosting and database rules (requires Firebase CLI and login):
   npm run build
   firebase deploy --only hosting,database

If any command fails because a required tool is missing, install Node.js, Git, or Firebase CLI as appropriate.
