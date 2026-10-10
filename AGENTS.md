# CLAUDE.md

## Version control (read first)

Before the first VCS command, run `jj --ignore-working-copy root`. This may be a jj repo on one machine and plain Git on another.

**IMPORTANT:** if it succeeds, use `jj` for all VCS commands, including `log`, `show`, `status` and `diff`. Do not run `git` on jj repos. The `gitStatus` snapshot in the session context is not a reason to use git.

See `jj-reference.md` in the repo root for details of Jujutsu usage.

### Pre-commit

jj has no commit hooks. Run `scripts/pre-commit.sh` before `jj commit`, `jj describe` (when finalising a change) and `jj squash`. In a Git checkout, install it as a hook: `ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit`.

It checks the files changed in `@` (jj) or against `HEAD` (Git) and runs the full gates for each project touched: `Javascript/` runs `scripts/checks.sh js`, `CSharp/` runs `scripts/checks.sh cs`. Changes outside both project folders run every gate. Documentation-only changes (`*.md`, `docs/`, `README*`) run none.

| Project       | Gates                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| `Javascript/` | `pnpm install --frozen-lockfile`, `format:check`, `lint`, `type-check`, `build`, `test:run` |
| `CSharp/`     | `dotnet restore`, `dotnet build`, `dotnet format --verify-no-changes`                       |

Fix failures before committing. Run `pnpm format` and `pnpm lint --fix` in `Javascript/` and `dotnet format` in `CSharp/` to clear formatting and lint failures. Do not change a test to make it pass: investigate first.

### Pre-push

Before `jj git push` or moving a shared bookmark, run `scripts/pre-push.sh`. It always runs every gate for every project, whatever changed.

- **jj:** formats the tip (newest non-empty mutable revision in `::@`) with `jj fix` (`scripts/format-stdin.sh`), then runs the gates on it. `--full` formats every mutable revision and checks each in its own checkout via `jj run`.
- **Git:** runs the gates on the working tree without formatting it, and refuses uncommitted changes to tracked files so the checked tree is the pushed `HEAD`. Install as a hook with `ln -sf ../../scripts/pre-push.sh .git/hooks/pre-push`.

`scripts/agent-pre-push-hook.sh` runs it on every push command (`jj git push`, `git push`) and blocks the push on failure. Claude Code (`.claude/settings.json`) and Codex (`.codex/hooks.json`) call it as a `PreToolUse` hook. The hook checks the tip of `@`, not the bookmark being pushed, so push only the bookmark you are working on: the one on `@-`, with an empty `@` above it.

Push only on explicit request. "Push this" means: if `@` is non-empty, `jj commit` it (after the pre-commit checks). Move the bookmark to `@-` with `jj bookmark set <name> -r @-`, then `jj git push --bookmark <name>`. Use the bookmark already on the stack; otherwise `main`. Never push any other bookmark. Do not use `jj git push -c`.

The gates cover `Javascript/` and `CSharp/`. `Python/`, `rust_astrofloat/` and `rust_uom/` have no scripted gates.

**IMPORTANT:** every `dotnet` Bash call, including `scripts/pre-commit.sh` and `scripts/pre-push.sh` when they reach the C# gates, must set `dangerouslyDisableSandbox: true`. The Claude Code sandbox blocks `dotnet` (MSBuild's Unix-domain sockets fail under `network-inbound` deny) and the failure surfaces as a silent generic build error.

## Personal information

Exclude PII from every commit, commit message and bookmark name: real names, email addresses, usernames, machine paths such as `/Users/<name>/`, hostnames, tokens and credentials. Use placeholders (`your@email.com`, `YOUR_TEAM_ID`). Check the diff before `jj commit`, `jj describe` (finalising) and `git commit`. Test files use synthetic data only.
