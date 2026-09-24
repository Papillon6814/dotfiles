# ai-init-papillon6814

CLI that creates personal AGENTS.md and CLAUDE.md files in an existing repository.

## Run from npm

After this package is published:

    npx --yes ai-init-papillon6814
    npx --yes ai-init-papillon6814 /path/to/repository

The command previews the files and asks before creating them. Use --yes to skip the file creation prompt.

## Run from this checkout

    node npm/ai-init/bin/ai-init.js [path] [--yes]

Node.js 18 or newer is required. The CLI has no npm dependencies.
