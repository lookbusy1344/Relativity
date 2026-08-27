# CLAUDE.md

## Version control

Run `jj st` at the start of each session — this may be a jj repo on one machine
and plain Git on another.

**IMPORTANT:** if this is a jj repo, manage it with jj, not Git.

**jj repo (`jj st` succeeds):** use jj commands only. Do not run state-modifying
`git` commands (`commit`, `push`, `rebase`, `reset`, `branch`, …) without explicit
permission for that command. Read-only `git log`/`git status` are fine, but prefer
`jj log`/`jj st`. Push with `jj git push` — it forces with lease natively, so no
`git push --force`.

**Plain Git (`jj st` fails):** use normal `git` commands.

Confirm `jj --version` matches the version the book documents in
`src/hello-world/how-to-install.md` (currently 0.44.0). Flag any mismatch —
behaviour and prose may diverge.

See `jj-reference.md` in the repo root for details of Jujutsu usage
