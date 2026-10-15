# GitHub / Git Instructions

This repository is worked on by multiple developers. Always synchronize with the remote repository before branching, merging, committing, or pushing.

## Before Starting Work

Always fetch the latest remote changes first:

```bash
git fetch origin
```

Check whether `origin/main` has commits that are not in your current base:

```bash
git log --oneline <your-base>..origin/main
```

Never create a new branch from a stale local `main`.

Create branches from the latest remote `main`:

```bash
git fetch origin
git checkout -b <branch-name> origin/main
```

## Before Merging or Pushing

Always fetch the latest changes again:

```bash
git fetch origin
```

Merge the latest `origin/main` into your working branch:

```bash
git merge origin/main
```

If conflicts occur:

1. Resolve them locally.
2. Read both versions carefully.
3. Preserve valid changes made by other developers.
4. Do not blindly choose one side of the conflict.

After resolving conflicts, verify the project again.

At minimum run:

```bash
npm run typecheck
npm run build
```

When available, run the repository verification script:

```bash
bash scripts/verify-changed.sh
```

Before pushing to `main`, run the full verification:

```bash
bash scripts/verify-changed.sh --full
```

## Commit Rules

Keep commits focused. One feature or logical change per commit.

Before committing:

- Review the changed files.
- Make sure unrelated changes are not included.
- Run the required checks.
- Do not bypass repository commit hooks or validation gates.

Useful commands:

```bash
git status
git diff
git diff --staged
```

## Push Rules

Never force-push to `main` or any shared branch.

Do not use `git push --force` or `git push -f`.

If Git rejects the push because the remote branch is ahead:

```bash
git fetch origin
git merge origin/main
```

Resolve any conflicts, run verification again, and then push normally.

## Pushing a Feature Branch

Push a new feature branch normally:

```bash
git push -u origin <branch-name>
```

For later pushes:

```bash
git push
```

## Main Branch / Production Warning

Pushing to `main` deploys the application to production. Do not push directly to `main` unless explicitly asked to ship or deploy.

Before a production push:

- Make sure the latest `origin/main` has been merged first.
- Run all required tests, type checks, and builds.
- Confirm the application is working.
- Never force-push `main`.

Recommended sequence:

```bash
git fetch origin
git merge origin/main

npm run typecheck
npm run build
bash scripts/verify-changed.sh --full

git status
git push origin main
```

## General Git Safety Rules

- Always `git fetch origin` before branching, merging, or pushing.
- Never work from a stale `main`.
- Never force-push shared branches.
- Resolve conflicts locally.
- Preserve other developers' valid changes.
- Re-run checks after every merge.
- Keep commits small and focused.
- Do not bypass Git hooks, commit gates, or push gates.
- Do not commit `.env`, `.env.local`, API keys, passwords, database credentials, or other secrets.
- Keep environment files gitignored.
- Review `git status` and `git diff` before every commit.
- Treat a push to `main` as a production deployment.
