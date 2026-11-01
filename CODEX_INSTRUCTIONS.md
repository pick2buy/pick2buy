# Pick2Buy Agent Instructions

These instructions apply to every developer and coding agent working in this repository.

## Privacy and secrets

- Treat `.env` and `.env.local` as private local configuration files.
- Never commit, print, paste, or send API keys, App Secrets, passwords, tokens, database URLs, or other secret values.
- When checking whether a secret is configured, display only the variable name and a masked status such as `<configured>` or `<missing>`; never display the value.
- Do not store secret values in chat summaries, documentation, source code, logs, generated files, or agent memory.
- Do not delete `.env` or `.env.local` unless the user explicitly asks to delete the local files. Removing them can break local development.
- If a secret may have been exposed, recommend rotating it in the provider dashboard and updating the local/deployment environment.
- Keep production secrets in the deployment provider's environment settings and local development secrets in ignored local files.

## Safe implementation

- Use placeholders in examples, such as `your_app_id` and `your_app_secret`.
- Before committing, inspect staged files and confirm no environment files or secret material are included.
- Follow the Git synchronization, verification, and push rules in `AGENTS.md`.
