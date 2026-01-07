#!/usr/bin/env python3
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Setup script to configure Jupyter Lab with a fixed token for Cursor agent testing.

This script:
1. Creates a development-only Jupyter config file with a fixed token
2. Writes the token to a file for Cursor agent to read

The config file uses conditional logic to only apply the token when running in
development mode, so it's safe to run this script anytime.

Note: The .cursorrules file is maintained in git and contains instructions for
the Cursor agent on how to use the token.
"""

import sys
from pathlib import Path

# Fixed token for development testing
DEV_TOKEN = "dev-token-for-cursor-testing-12345"

# Paths relative to repo root
REPO_ROOT = Path(__file__).parent.parent
JUPYTER_CONFIG_DIR = REPO_ROOT / "jupyter-config" / "jupyter_server_config.d"
DEV_CONFIG_FILE = JUPYTER_CONFIG_DIR / "mito_ai_dev.py"
CURSOR_TOKEN_FILE = REPO_ROOT / ".cursor-jupyter-token"


def main():
    """Main setup function."""
    print("Setting up Jupyter development token for Cursor agent...")
    print()
    
    # Ensure jupyter config directory exists
    JUPYTER_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✓ Config directory ready: {JUPYTER_CONFIG_DIR}")
    
    # Create dev config file with conditional logic
    # This Python config file will only apply the token when in dev mode
    dev_config_content = f'''# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Development-only Jupyter Server configuration.

This config file sets a fixed token for Cursor agent testing, but only when
running in development mode. In production, this config file has no effect.

This file is gitignored and should not be committed to the repository.
"""

try:
    from mito_ai.utils.telemetry_utils import is_dev_mode
    
    # Only set the token if we're in development mode
    if is_dev_mode():
        c.ServerApp.token = "{DEV_TOKEN}"
except ImportError:
    # If mito_ai is not available, don't set anything
    # This ensures the config file doesn't break if mito_ai isn't installed
    pass
except Exception:
    # Silently fail if there's any error checking dev mode
    # This ensures the config file is safe to use in any environment
    pass
'''
    
    with open(DEV_CONFIG_FILE, 'w') as f:
        f.write(dev_config_content)
    
    print(f"✓ Created dev config: {DEV_CONFIG_FILE}")
    print("  (Token will only be applied when running in development mode)")
    
    # Write token to file for Cursor
    with open(CURSOR_TOKEN_FILE, 'w') as f:
        f.write(DEV_TOKEN)
    
    print(f"✓ Created token file: {CURSOR_TOKEN_FILE}")
    print()
    print("Setup complete!")
    print()
    print("Next steps:")
    print("  1. Restart Jupyter Lab to apply the new token configuration")
    print("  2. In dev mode, access Jupyter at: http://localhost:8888/lab?token=" + DEV_TOKEN)
    print("  3. Cursor agent can now automatically test changes using this token")
    print()
    print("Note: The dev config file is gitignored and will not be committed.")
    print("      The token will only be active when running in development mode.")


if __name__ == "__main__":
    main()
