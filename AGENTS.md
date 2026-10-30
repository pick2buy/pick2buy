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
git merge origin/main
```

Resolve conflicts locally by reading both versions carefully and preserving valid changes from other developers. After resolving conflicts, run the project verification checks.

At minimum run:

```bash
npm run typecheck
npm run build
```

When available, run `bash scripts/verify-changed.sh`; before pushing to `main`, run `bash scripts/verify-changed.sh --full`.

## Commit Rules

Keep commits focused. Review `git status`, `git diff`, and staged files before committing. Do not bypass hooks or commit secrets such as `.env`, credentials, API keys, or passwords.

## Push Rules

Never force-push to `main` or any shared branch. If a push is rejected because the remote is ahead, fetch and merge `origin/main`, resolve conflicts, verify again, and push normally.

Pushing to `main` deploys the application to production. Do not push directly to `main` unless explicitly asked to ship or deploy. Always synchronize, verify, and confirm the application is working first.

## General Git Safety Rules

- Always fetch `origin` before branching, merging, or pushing.
- Never work from a stale `main`.
- Never force-push shared branches.
- Preserve other developers' valid changes.
- Re-run checks after every merge.
- Keep commits small and focused.
