# ai-init-papillon6814

CLI that creates personal AGENTS.md and CLAUDE.md files in an existing repository.

On an interactive terminal, it asks eight emoji-labeled questions about the project summary, stack, commands, response language, AI priorities, testing, Git workflow, and extra rules. Detected stack and commands are offered as defaults. It previews the generated files and never overwrites existing files.

## Run from npm

After this package is published:

    npx --yes ai-init-papillon6814
    npx --yes ai-init-papillon6814 /path/to/repository

## Run from this checkout

    node npm/ai-init/bin/ai-init.js [path] [--yes]

The --yes option skips the questions and final confirmation, using detected defaults. Node.js 18 or newer is required. The CLI has no npm dependencies.
