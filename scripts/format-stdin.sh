#!/usr/bin/env bash
# format-stdin.sh <path> — `jj fix` tool: read a source file on stdin, write the
# formatted result to stdout. <path> is relative to the repository root.
#
# .ts and .css use the Prettier config in Javascript/. .cs uses `dotnet format
# whitespace` with the repo .editorconfig, via a scratch folder.

set -euo pipefail

export PATH="$HOME/.dotnet:/opt/homebrew/bin:/usr/local/bin:$PATH"

readonly PRETTIER="Javascript/node_modules/.bin/prettier"
readonly EDITORCONFIG=".editorconfig"

path="${1:?usage: format-stdin.sh <path>}"

case "${path}" in
    *.ts | *.css)
        if [[ -x "${PRETTIER}" ]]; then
            "${PRETTIER}" --stdin-filepath "${path}"
        else
            cat
        fi
        ;;
    *.cs)
        scratch="$(mktemp -d)"
        trap 'rm -rf "${scratch}"' EXIT
        for config in "${EDITORCONFIG}" "CSharp/${EDITORCONFIG}"; do
            [[ -f "${config}" ]] && cp "${config}" "${scratch}/"
        done
        target="${scratch}/$(basename "${path}")"
        cat > "${target}"
        dotnet format whitespace "${scratch}" --folder --include "$(basename "${path}")" > /dev/null 2>&1 || true
        cat "${target}"
        ;;
    *) cat ;;
esac
