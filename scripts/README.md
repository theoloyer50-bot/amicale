Scripts included for convenience:

- build-local.ps1: Installs dependencies, runs `npm run vercel-build` and checks `dist/` exists.
- check-dist.js: Node script that exits with non-zero if `dist/` doesn't exist (runs as `postbuild`).
- commit-and-push.ps1: Stages changed files and commits/pushes to the specified branch (requires git installed).
- deploy-vercel.ps1: Triggers a deploy using the Vercel CLI (`vercel`).

Usage examples (PowerShell):

1) Build locally and verify dist:
   ./scripts/build-local.ps1

2) Commit & push prepared changes:
   ./scripts/commit-and-push.ps1 -Message "chore: ensure dist output" -Branch "main"

3) Trigger a production deploy (requires vercel CLI and login):
   ./scripts/deploy-vercel.ps1 -Prod

If any command fails because a required tool is missing, install Node.js and Git or use the Vercel dashboard to change the output directory to `build` as a quick workaround.
