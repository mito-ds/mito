#!/usr/bin/env bash
# Install Mito (mito-ai + mitosheet) into ~/.mito/venv using uv.

set -euo pipefail

MITO_HOME="${MITO_HOME:-$HOME/.mito}"
VENV_PATH="${MITO_HOME}/venv"
MITO_CLI_BIN="${MITO_HOME}/bin/mito"
MITO_PYTHON_VERSION="${MITO_PYTHON_VERSION:-3.11}"
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
  if [[ -n "${SYSTEM_PYTHON_BIN:-}" ]]; then
    uv venv "${VENV_PATH}" --python "${SYSTEM_PYTHON_BIN}" --no-project
  else
    echo "System python3 not available (or <3.9); downloading Python ${MITO_PYTHON_VERSION} via uv ..."
    uv venv "${VENV_PATH}" --python "${MITO_PYTHON_VERSION}" --no-project
  fi
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

# Login-shell rc file for PATH (bash vs zsh), same as print_success / docs.
shell_rc_file() {
  case "$(basename "${SHELL:-/bin/zsh}")" in
    bash)
      echo "${HOME}/.bash_profile"
      ;;
    *)
      echo "${HOME}/.zprofile"
      ;;
  esac
}

# Append Mito bin to PATH in the rc file and try to source it in this bash process.
# Returns 0 if PATH is configured (already or just written), 1 if we could not write the file.
apply_path_to_rc() {
  local rc_file
  rc_file="$(shell_rc_file)"

  if [[ -f "${rc_file}" ]] && grep -qF "${MITO_HOME}/bin" "${rc_file}" 2>/dev/null; then
    export PATH="${MITO_HOME}/bin:${PATH}"
    return 0
  fi

  if ! printf '\nexport PATH="%s/bin:$PATH"\n' "${MITO_HOME}" >> "${rc_file}" 2>/dev/null; then
    return 1
  fi

  set +e
  # shellcheck disable=1090
  source "${rc_file}" 2>/dev/null
  local src=$?
  set -e
  if [[ "${src}" -ne 0 ]]; then
    echo "mito-install: could not source ${rc_file} from bash (often fine for zsh-only files). Run: source ${rc_file}" >&2
  fi
  export PATH="${MITO_HOME}/bin:${PATH}"
  return 0
}

print_success() {
  local rc_file path_ok
  rc_file="$(shell_rc_file)"
  path_ok=1
  apply_path_to_rc || path_ok=0

  local green cyan bold reset
  if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
    bold=$'\033[1m'
    reset=$'\033[0m'
    green=$'\033[32m'
    cyan=$'\033[36m'
  else
    bold=''
    reset=''
    green=''
    cyan=''
  fi

  printf '\n'
  printf 'Installed at: %s\n' "${VENV_PATH}"
  if [[ "${path_ok}" -eq 1 ]]; then
    printf 'PATH was updated in %s.\n' "${rc_file}"
  fi
  printf '\n'

  printf '%sNEXT STEPS%s\n' "${green}" "${reset}"
  printf '\n'

  printf 'Congratulations! Mito is installed. One last thing:\n'
  printf '\n'

  printf '1) Copy-and-paste this command to complete installation:\n'
  printf '   %ssource %s%s\n' "${cyan}" "${rc_file}" "${reset}"
  printf '\n'

  printf '2) You can now launch Mito at any time by running:\n'
  printf '   %smito%s\n' "${bold}${cyan}" "${reset}"
  printf '\n'

  if [[ "${path_ok}" -ne 1 ]]; then
    printf 'If `mito` is not found, add it to your PATH (one-time):\n'
    printf "  echo 'export PATH=\"%s/bin:\\$PATH\"' >> %s\n" "${MITO_HOME}" "${rc_file}"
    printf "  source %s\n" "${rc_file}"
    printf '\n'
  fi
}

main() {
  is_macos || die "This installer only supports macOS. On other systems, run: python3 -m pip install mito-ai mitosheet"
  # Prefer an existing system python3 >= 3.9, but fall back to a uv-managed Python
  # download if the system checks fail (so we don't hard-require python3).
  if have_python3 && python_ok_version; then
    SYSTEM_PYTHON_BIN="python3"
  else
    unset SYSTEM_PYTHON_BIN
  fi

  ensure_uv
  venv_install
  install_mito_cli
  print_success
}

main "$@"
