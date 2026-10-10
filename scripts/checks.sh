#!/usr/bin/env bash
# checks.sh [js] [cs] — the full quality gates, one set per project.
#
# No arguments runs every project. Shared by pre-commit.sh and pre-push.sh.
# Paths are relative to the repository root, so it also works inside the
# per-revision checkouts made by `jj run`.

set -euo pipefail

# GUI and hook launches omit the user-local dotnet and Homebrew paths.
export PATH="$HOME/.dotnet:/opt/homebrew/bin:/usr/local/bin:$PATH"

readonly JS_DIR="Javascript"
readonly CS_DIR="CSharp"
readonly CS_SOLUTION="Relativity.sln"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly root

run_js() {
    echo "==> JavaScript gates"
    cd "${root}/${JS_DIR}"
    pnpm install --frozen-lockfile
    pnpm format:check
    pnpm lint
    pnpm type-check
    pnpm build
    pnpm test:run
}

run_cs() {
    echo "==> C# gates"
    cd "${root}/${CS_DIR}"
    dotnet restore "${CS_SOLUTION}"
    dotnet build "${CS_SOLUTION}" --configuration Debug --no-restore
    dotnet format "${CS_SOLUTION}" --verify-no-changes
}

targets=("$@")
[[ ${#targets[@]} -eq 0 ]] && targets=(js cs)

for target in "${targets[@]}"; do
    case "${target}" in
        js) (run_js) ;;
        cs) (run_cs) ;;
        *) echo "Error: unknown target '${target}' (expected js or cs)" >&2; exit 1 ;;
    esac
done
