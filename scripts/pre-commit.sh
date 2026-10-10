#!/usr/bin/env bash
# pre-commit.sh — run the gates for the projects touched by the pending change.
#
# jj: no commit hooks, so run it directly before `jj commit`, `jj describe`
# (finalising) and `jj squash`. It checks the files changed in `@`.
#
# Git: install as a hook, it checks the files changed against HEAD:
#   ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit
#
# Documentation-only changes run no gates.

set -euo pipefail

readonly JS_PREFIX="Javascript/"
readonly CS_PREFIX="CSharp/"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly root
cd "${root}"

changed_files() {
    if [[ -z "${GIT_INDEX_FILE:-}" ]] && jj --ignore-working-copy root > /dev/null 2>&1; then
        jj diff --name-only -r @ --no-pager
    else
        git diff HEAD --name-only --diff-filter=ACMR
    fi
}

is_documentation() {
    [[ "$1" == *.md || "$1" == docs/* || "$1" == */docs/* || "$(basename "$1")" == README* ]]
}

files=()
while IFS= read -r file; do
    [[ -n "${file}" ]] && files+=("${file}")
done < <(changed_files)

if [[ ${#files[@]} -eq 0 ]]; then
    echo "No modified files found."
    exit 0
fi

targets=()
for file in "${files[@]}"; do
    is_documentation "${file}" && continue
    case "${file}" in
        "${JS_PREFIX}"*) [[ " ${targets[*]-} " == *" js "* ]] || targets+=(js) ;;
        "${CS_PREFIX}"*) [[ " ${targets[*]-} " == *" cs "* ]] || targets+=(cs) ;;
        # Shared tooling (scripts, workflows, root config) can affect every project.
        *) targets=(js cs); break ;;
    esac
done

if [[ ${#targets[@]} -eq 0 ]]; then
    echo "Documentation-only change. Skipping gates."
    exit 0
fi

echo "Running pre-commit gates: ${targets[*]}"
exec "${root}/scripts/checks.sh" "${targets[@]}"
