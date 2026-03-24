#!/usr/bin/env bash
# Development-only: undo a local install.sh run so you can test again.
# Removes the venv, the mito CLI wrapper, and PATH lines that point at *mito/bin.
# Does NOT remove the ~/.mito directory itself (only selected contents).
#
#   MITO_HOME=~/.mito bash scripts/reset-mito-dev.sh

set -euo pipefail

MITO_HOME="${MITO_HOME:-$HOME/.mito}"
VENV_PATH="${MITO_HOME}/venv"
MITO_CLI_BIN="${MITO_HOME}/bin/mito"

strip_mito_path_lines() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  local tmp
  tmp="$(mktemp)"
  # Lines from install.sh look like: export PATH=".../mito.../bin:$PATH"
  awk '!/^[[:space:]]*export[[:space:]]+PATH=.*mito\/bin/' "${f}" > "${tmp}"
  mv "${tmp}" "${f}"
}

echo "MITO_HOME=${MITO_HOME}"

if [[ -d "${VENV_PATH}" ]]; then
  echo "Removing venv: ${VENV_PATH}"
  rm -rf "${VENV_PATH}"
fi

if [[ -f "${MITO_CLI_BIN}" ]]; then
  echo "Removing CLI: ${MITO_CLI_BIN}"
  rm -f "${MITO_CLI_BIN}"
fi

if [[ -d "${MITO_HOME}/bin" ]] && [[ -z "$(ls -A "${MITO_HOME}/bin" 2>/dev/null)" ]]; then
  rmdir "${MITO_HOME}/bin" 2>/dev/null || true
fi

for rc in "${HOME}/.zprofile" "${HOME}/.zshrc" "${HOME}/.bash_profile"; do
  if [[ -f "${rc}" ]] && grep -qE 'export[[:space:]]+PATH=.*mito/bin' "${rc}" 2>/dev/null; then
    echo "Stripping mito PATH lines from: ${rc}"
    strip_mito_path_lines "${rc}"
  fi
done

echo "Done. The ${MITO_HOME} directory was kept (only venv / bin/mito / PATH lines were cleared)."
