# Contribution workflow

Before pushing any code:

1. Run `npm run typecheck` and fix every type error.
2. Pull the latest remote changes with `git pull --rebase origin main`.
3. If a conflict appears, resolve it intentionally, remove all conflict markers, and verify that both sets of changes are preserved where required.
4. Run `npm run typecheck` again after resolving conflicts.
5. Review `git diff` and `git status` before committing and pushing. Do not push generated files, local environment files, credentials, or unrelated changes.
