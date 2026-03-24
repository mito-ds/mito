#!/usr/bin/env bash
# Install Mito (mito-ai + mitosheet) on macOS into ~/.mito/venv using uv (https://github.com/astral-sh/uv).
#
# One-liner (after this file is hosted):
#   curl -fsSL https://raw.githubusercontent.com/mito-ds/monorepo/main/scripts/install.sh | bash
#
# Custom install root (default ~/.mito):
#   MITO_HOME="$HOME/my-mito" curl -fsSL ... | bash

set -euo pipefail

MITO_HOME="${MITO_HOME:-$HOME/.mito}"
VENV_PATH="${MITO_HOME}/venv"
MITO_CLI_BIN="${MITO_HOME}/bin/mito"
PACKAGES=(mito-ai mitosheet)

die() {
  echo "mito-install: $*" >&2
  exit 1
}

is_macos() {
  [[ "$(uname -s)" == "Darwin" ]]
}

have_python3() {
  command -v python3 >/dev/null 2>&1
}

python_ok_version() {
  python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)'
}

# Ensure uv is on PATH (installs via Astral's script if missing).
ensure_uv() {
  if command -v uv >/dev/null 2>&1; then
    return 0
  fi
  echo "uv not found; installing from astral.sh ..."
  export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:${PATH}"
  # The official installer can exit non-zero after copying uv (e.g. receipt write fails with
  # "Permission denied" under ~/.config/uv). If `uv` is on PATH, we continue anyway.
  if ! curl -LsSf https://astral.sh/uv/install.sh | sh; then
    echo "mito-install: uv install script reported an error (often ~/.config permissions). Checking for uv ..." >&2
  fi
  command -v uv >/dev/null 2>&1 || die "uv is not on PATH after install. Fix permissions on ~/.config if needed, or add ~/.local/bin to PATH and run this script again."
}

venv_install() {
  echo "Creating virtual environment at ${VENV_PATH} ..."
  rm -rf "${VENV_PATH}"
  uv venv "${VENV_PATH}" --python python3 --no-project
  echo "Installing ${PACKAGES[*]} ..."
  uv pip install --no-config --python "${VENV_PATH}/bin/python" "${PACKAGES[@]}"
}

install_mito_cli() {
  mkdir -p "${MITO_HOME}/bin"
  cat > "${MITO_CLI_BIN}" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec "${VENV_PATH}/bin/jupyter" lab "\$@"
EOF
  chmod +x "${MITO_CLI_BIN}"
}

print_success() {
  local rc_file bold reset cyan
  case "$(basename "${SHELL:-/bin/zsh}")" in
    bash)
      rc_file="${HOME}/.bash_profile"
      ;;
    *)
      rc_file="${HOME}/.zprofile"
      ;;
  esac

  if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
    bold=$'\033[1m'
    reset=$'\033[0m'
    cyan=$'\033[36m'
    dim=$'\033[2m'
  else
    bold=''
    reset=''
    cyan=''
    dim=''
  fi

  # Visually distinct "next steps" block (colors disabled when NO_COLOR is set or stdout is not a TTY).
  printf '\n'
  printf '%s\n' "${cyan}${bold}  ────────────────────────────────────────────────────────────────${reset}"
  printf '\n'
  printf '%s    %sNext steps%s\n' "${cyan}" "${bold}" "${reset}"
  printf '\n'
  printf '%s\n' "${cyan}${bold}  ────────────────────────────────────────────────────────────────${reset}"
  printf '\n'
  printf '%s\n' "    Run JupyterLab:"
  printf '%s\n' "      ${MITO_CLI_BIN}"
  printf '\n'
  printf '%s\n' "    Add the mito command to your PATH (paste both lines):"
  printf "      echo 'export PATH=\"%s/bin:\$PATH\"' >> %s\n" "${MITO_HOME}" "${rc_file}"
  printf '      source %s\n' "${rc_file}"
  printf '\n'
  printf '%s\n' "${dim}  Installed at: ${VENV_PATH}${reset}"
  printf '\n'
}

main() {
  is_macos || die "This installer only supports macOS. On other systems, run: python3 -m pip install mito-ai mitosheet"

  have_python3 || die "Python 3 is required. Install it from https://www.python.org/downloads/macos/ or use Homebrew: brew install python"

  python_ok_version || die "Python 3.9 or newer is required."

  ensure_uv
  venv_install
  install_mito_cli
  print_success
}

main "$@"
