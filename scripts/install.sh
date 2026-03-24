#!/usr/bin/env bash
# Install Mito (mito-ai + mitosheet) on macOS into ~/.mito/venv via pip.
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

venv_install() {
  local py="$1"
  echo "Creating virtual environment at ${VENV_PATH} ..."
  "${py}" -m venv --clear "${VENV_PATH}"
  "${VENV_PATH}/bin/python" -m pip install --upgrade pip --quiet
  echo "Installing ${PACKAGES[*]} ..."
  "${VENV_PATH}/bin/pip" install "${PACKAGES[@]}"
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
  local rc_file
  case "$(basename "${SHELL:-/bin/zsh}")" in
    bash)
      rc_file="${HOME}/.bash_profile"
      ;;
    *)
      rc_file="${HOME}/.zprofile"
      ;;
  esac

  cat <<EOF

Mito is installed in ${VENV_PATH}.

Run JupyterLab:
  ${MITO_CLI_BIN}

To use the mito command from your terminal, add it to your PATH (paste both lines):
  echo 'export PATH="${MITO_HOME}/bin:\$PATH"' >> ${rc_file}
  source ${rc_file}
EOF
}

main() {
  is_macos || die "This installer only supports macOS. On other systems, run: python3 -m pip install mito-ai mitosheet"

  have_python3 || die "Python 3 is required. Install it from https://www.python.org/downloads/macos/ or use Homebrew: brew install python"

  python_ok_version || die "Python 3.9 or newer is required."

  venv_install python3
  install_mito_cli
  print_success
}

main "$@"
