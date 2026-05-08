# pnpm Migration Plan

**Date:** 2026-05-08
**Status:** Proposed
**Goal:** Replace Yarn 4 with pnpm as the package manager for this project, with zero behavioural change to the application.

---

## Context

The project currently uses **Yarn 4.14.1** with `nodeLinker: node-modules` (i.e. modern Yarn Berry, not legacy 1.x). The Yarn binary is checked in at `.yarn/releases/yarn-4.14.1.cjs`. Lockfile is `yarn.lock`.

### Inventory of yarn references in the repo

- **Config / lockfile:** `.yarnrc.yml`, `.yarn/` (releases + `install-state.gz`), `yarn.lock`, `package.json` (`packageManager` field, `resolutions` block, `build` script invokes `yarn type-check`)
- **Docs:** `README.md` (Installation + Development sections), `CLAUDE.md` (commands + pre-commit checklist), `docs/IMPROVEMENTS.md` (`yarn audit`), `docs/CODE_REVIEW.md` (verification commands)
- **Editor / tooling:** `.vscode/tasks.json` (3 commands), `.claude/settings.local.json` (~20 yarn permission entries)
- **Gitignore:** `.gitignore` has a yarn-specific exception block
- **CI:** none — no `.github/workflows/`. Dependabot is configured at the GitHub-org level (no `.github/dependabot.yml` in the repo); pnpm is auto-detected from the lockfile
- **Historical:** `docs/plans/2025-12-04-testing-improvements.md` has ~25 `yarn test:run` mentions — historical record, leave untouched

---

## 0. Pre-flight checks

Before starting:

1. Working tree is clean (`git status`).
2. Current branch is `main` and up to date, OR a fresh feature branch is created: `git checkout -b chore/migrate-to-pnpm`.
3. Latest `yarn.lock` reflects current installed deps (run `yarn install` once if uncertain).
4. Snapshot the current install for sanity comparison:
   ```bash
   yarn test:run    # baseline pass
   yarn type-check
   yarn lint
   yarn build
   ```
   Record output to confirm the post-migration state matches.
5. Note the current Node version (`node --version`) — pnpm 10 requires Node ≥ 18.12. Keep using whatever Node version this project already runs on.

## 1. Install pnpm via Corepack

Corepack (bundled with Node ≥ 16.10) is the recommended way — it pins the version in `package.json` so all contributors get the same pnpm.

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version    # confirm
```

Record the exact resolved version and use it for the `packageManager` field in step 3.

## 2. Import the lockfile

Generate `pnpm-lock.yaml` from `yarn.lock` to preserve exact resolved versions on the first install:

```bash
pnpm import
```

This reads `yarn.lock` and emits `pnpm-lock.yaml` matching today's resolved tree. Do **not** delete `yarn.lock` yet — `pnpm import` needs it.

## 3. Translate `package.json`

Three changes, in this order:

**a. Replace `packageManager` field:**
```jsonc
// before
"packageManager": "yarn@4.14.1"
// after
"packageManager": "pnpm@<version-from-step-1>"
```

**b. Translate `resolutions` → `pnpm.overrides`:**
```jsonc
// remove
"resolutions": {
  "glob": "^11.1.0"
}
// add
"pnpm": {
  "overrides": {
    "glob": "^11.1.0"
  }
}
```
Yarn's `resolutions` is ignored by pnpm; `pnpm.overrides` is the equivalent.

**c. Make the `build` script package-manager-agnostic:**
```jsonc
// before — invokes yarn explicitly
"build": "yarn type-check && vite build"
// after — no PM dependency
"build": "tsc --noEmit && vite build"
```
Rationale: scripts shouldn't hardcode a package manager. This avoids future breakage if the PM ever changes again, and removes a layer of subprocess overhead.

## 4. Add a minimal `.npmrc`

Create `.npmrc` at repo root:
```ini
# Strict by default — match Yarn's behaviour where peers must be installed.
strict-peer-dependencies=false
# Use a content-addressable store with hardlinks (default), but isolate via symlinks.
# Leave node-linker default (isolated). If a tool breaks on symlinked node_modules,
# uncomment the next line to fall back to a flat layout.
# node-linker=hoisted
auto-install-peers=true
```

Reasoning:
- `strict-peer-dependencies=false` matches the laxness Yarn 4 has by default — switching this on can be a follow-up clean-up.
- `auto-install-peers=true` is the modern pnpm default (set explicitly so it's clear).
- The `node-linker` knob is documented as a one-line escape hatch in case Vite/D3 surprises us.

## 5. Remove yarn artefacts

After `pnpm import` succeeded:

```bash
rm -rf node_modules
rm yarn.lock
rm -rf .yarn
rm .yarnrc.yml
rm .eslintcache    # paths under node_modules will differ; force a fresh cache
```

## 6. Update `.gitignore`

Replace the yarn-specific exception block. Remove these lines:

```gitignore
# /.yarn
.yarn/*
!.yarn/patches/
!.yarn/plugins/
!.yarn/releases/
!.yarn/sdks/
!.yarn/versions/
.yarn/cache/
.yarn/unplugged/
```

Add (pnpm doesn't need much, but be explicit):

```gitignore
# pnpm
.pnpm-store/
```

The default global store lives outside the repo, so usually nothing needs ignoring — but include this in case a developer ever sets `store-dir=.pnpm-store`.

## 7. Clean install with pnpm

```bash
pnpm install --frozen-lockfile
```

`--frozen-lockfile` ensures we install exactly what `pnpm import` produced. If this fails, the lockfile import is suspect — investigate before proceeding.

## 8. Run the full pre-commit verification suite

In this exact order, all must pass:

```bash
pnpm test:run        # 1. tests
pnpm type-check      # 2. tsc
pnpm format:check    # 3. prettier
pnpm lint            # 4. eslint
pnpm build           # 5. production build
```

Compare results to the step-0 baseline. **Any divergence is a stop-the-line event** — pnpm's stricter resolution can surface phantom dependencies (a package imported but not declared in `package.json`). If that happens, the fix is `pnpm add <missing-pkg>` (or `-D` for dev), not silencing the error.

Specifically watch for:
- ESLint plugin resolution errors (rare, but eslint sometimes can't find plugins under pnpm's symlinked layout). Fix: declare the plugin as a direct devDep, or set `node-linker=hoisted`.
- Vite plugin resolution — same story.
- `vitest` workers can occasionally need `--pool=forks` under pnpm; not expected here but flag it if test failures look process-spawning related.

## 9. Update `CLAUDE.md`

Replace every `yarn` invocation with its `pnpm` equivalent. Mapping table:

| Old | New |
|---|---|
| `yarn` (bare install) | `pnpm install` |
| `yarn dev` | `pnpm dev` |
| `yarn build` | `pnpm build` |
| `yarn type-check` | `pnpm type-check` |
| `yarn lint` | `pnpm lint` |
| `yarn lint --fix` | `pnpm lint --fix` |
| `yarn format` | `pnpm format` |
| `yarn format:check` | `pnpm format:check` |
| `yarn test` | `pnpm test` |
| `yarn test:ui` | `pnpm test:ui` |
| `yarn test:run` | `pnpm test:run` |
| `yarn vitest run -t "pattern"` | `pnpm vitest run -t "pattern"` |
| `yarn vitest run src/ui/eventHandlers.test.ts -t "pattern"` | `pnpm vitest run src/ui/eventHandlers.test.ts -t "pattern"` |
| `yarn set version stable` | `corepack prepare pnpm@latest --activate` (then update `packageManager` field) |
| `yarn upgrade-interactive` | `pnpm update --interactive --latest` |

Pre-commit checklist block (CLAUDE.md lines 168–181) becomes:
```
pnpm format
pnpm lint --fix

1. pnpm test:run
2. pnpm type-check
3. pnpm format:check
4. pnpm lint
5. pnpm build
```

The `yarn test:run` reference at line 133 also gets swapped.

## 10. Update `README.md`

Replace the **Installation** section (lines 123–131):
```bash
# Install pnpm via corepack (one-time)
corepack enable
corepack prepare pnpm@latest --activate

# Install dependencies
pnpm install
```

Replace the **Development** section (lines 133–159) using the same mapping table from step 9.

Update the inline reference at line 223:
```
- **Run Tests:** `pnpm test` (watch mode), `pnpm test:ui` (with UI), `pnpm test:run` (CI mode)
```

## 11. Update `.vscode/tasks.json`

Three commands to swap:
- line 7: `"command": "yarn lint"` → `"command": "pnpm lint"`
- line 17: `"command": "yarn dev"` → `"command": "pnpm dev"`
- line 50: `"command": "yarn build"` → `"command": "pnpm build"`

## 12. Update `.claude/settings.local.json`

Find/replace all `Bash(yarn ...)` permission entries with their `Bash(pnpm ...)` equivalents:

- `Bash(yarn dev)` → `Bash(pnpm dev)`
- `Bash(yarn type-check:*)` → `Bash(pnpm type-check:*)`
- `Bash(yarn build)` → `Bash(pnpm build)`
- `Bash(yarn why:*)` → `Bash(pnpm why:*)`
- `Bash(yarn install)` → `Bash(pnpm install)`
- `Bash(timeout 10s yarn dev:*)` → `Bash(timeout 10s pnpm dev:*)`
- `Bash(yarn add:*)` → `Bash(pnpm add:*)`
- `Bash(yarn test:run:*)` → `Bash(pnpm test:run:*)`
- `Bash(yarn vitest run:*)` → `Bash(pnpm vitest run:*)`
- `Bash(yarn --version:*)` → `Bash(pnpm --version:*)`
- `Bash(yarn test:*)` → `Bash(pnpm test:*)`
- `Bash(yarn run env)` → `Bash(pnpm run env)`
- `Bash(yarn exec vitest:*)` → `Bash(pnpm exec vitest:*)`
- `Bash(yarn bin)` → `Bash(pnpm bin)`
- `Bash(yarn node:*)` → `Bash(pnpm node:*)`
- `Bash(yarn format:*)` → `Bash(pnpm format:*)`
- `Bash(yarn format:check:*)` → `Bash(pnpm format:check:*)`
- `Bash(yarn lint:*)` → `Bash(pnpm lint:*)`
- `Bash(time yarn lint:*)` → `Bash(time pnpm lint:*)`

Also delete the two suspicious-looking permission entries on lines 60–61 — they look like commit-message fragments mistakenly captured as permissions; flag for the user before deleting.

## 13. Update `docs/IMPROVEMENTS.md` and `docs/CODE_REVIEW.md`

- `docs/IMPROVEMENTS.md:468`: `yarn audit` → `pnpm audit`
- `docs/CODE_REVIEW.md` lines 269, 282, 330, 338: replace `yarn test:run`, `yarn type-check`, `yarn build` with their pnpm equivalents.

## 14. `docs/plans/2025-12-04-testing-improvements.md`

This is a historical implementation log (~25 `yarn` mentions). **Leave it alone** — rewriting historical docs is churn. The single relevant line is 1038:
```
git add package.json yarn.lock vitest.config.ts src/dom-setup.test.ts
```
That's a past instruction that already happened; don't touch it.

## 15. Sanity sweep

```bash
# Confirm no yarn references remain in active config/docs
grep -rn "yarn" \
  --include="*.md" --include="*.json" --include="*.yml" --include="*.yaml" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs/plans \
  .
```

Expect zero hits in source-of-truth files. Hits inside `docs/plans/` are acceptable historical noise.

## 16. Re-run full verification

```bash
pnpm test:run && pnpm type-check && pnpm format:check && pnpm lint && pnpm build
```

Then manually smoke-test the dev server:

```bash
pnpm dev
# open http://localhost:5173, exercise one calculator (e.g. Lorentz factor),
# confirm a Minkowski diagram renders (D3 paths can be sensitive to module resolution)
```

## 17. Commit strategy

Two commits, in this order, on a feature branch:

**Commit 1** — `chore: migrate from yarn to pnpm`
- `package.json`, `pnpm-lock.yaml` (new), `.npmrc` (new)
- Removes: `yarn.lock`, `.yarnrc.yml`, `.yarn/`
- `.gitignore` updates

**Commit 2** — `docs: update yarn references to pnpm`
- `README.md`, `CLAUDE.md`, `.vscode/tasks.json`, `.claude/settings.local.json`, `docs/IMPROVEMENTS.md`, `docs/CODE_REVIEW.md`

Splitting like this means if anything goes wrong, the package-manager change is bisectable independently of the doc churn.

## 18. Rollback plan

If post-commit something breaks badly:

```bash
git revert <commit-2> <commit-1>
rm -rf node_modules .npmrc pnpm-lock.yaml
corepack prepare yarn@4.14.1 --activate
yarn install
```

The Yarn 4 binary is recoverable from git history (it was tracked in `.yarn/releases/`). No data loss is possible — `pnpm-lock.yaml` and `yarn.lock` are both in version control across the transition.

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Phantom dep surfaces under pnpm strict resolution | Medium | `pnpm add <missing>`; do not silence |
| ESLint plugin can't resolve | Low | Set `node-linker=hoisted` in `.npmrc` |
| Vite/D3 ESM resolution edge case | Low | Same — fallback to hoisted linker |
| Dependabot starts opening PRs against `pnpm-lock.yaml` immediately | Expected | This is correct behaviour; first PR after merge will be against new lockfile |
| Contributor on old Node without Corepack | Low (solo project) | `npm i -g pnpm` is a documented fallback in README |
