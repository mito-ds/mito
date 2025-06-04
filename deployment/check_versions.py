#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Utility script to check the current versions across all Mito packages.
"""

import json
from pathlib import Path


def get_centralized_version() -> str:
    """Get version from centralized version.json file."""
    version_file = Path(__file__).parent.parent / 'version.json'
    if version_file.exists():
        with open(version_file, 'r') as f:
            version_data = json.load(f)
            return version_data['version']
    else:
        return "NOT FOUND"


def get_mito_version() -> str:
    """Get version from mito package pyproject.toml."""
    pyproject_path = Path(__file__).parent.parent / 'mito' / 'pyproject.toml'
    if pyproject_path.exists():
        with open(pyproject_path, 'r') as f:
            content = f.read()
            import re
            match = re.search(r'version = "([^"]*)"', content)
            return match.group(1) if match else "NOT FOUND"
    else:
        return "FILE NOT FOUND"


def get_mitosheet_version() -> str:
    """Get version from mitosheet package.json."""
    package_json_path = Path(__file__).parent.parent / 'mitosheet' / 'package.json'
    if package_json_path.exists():
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
            return package_data.get('version', 'NOT FOUND')
    else:
        return "FILE NOT FOUND"


def get_mito_ai_version() -> str:
    """Get version from mito-ai package.json."""
    package_json_path = Path(__file__).parent.parent / 'mito-ai' / 'package.json'
    if package_json_path.exists():
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
            return package_data.get('version', 'NOT FOUND')
    else:
        return "FILE NOT FOUND"


def get_mito_dependencies() -> dict:
    """Get dependency versions from mito package."""
    pyproject_path = Path(__file__).parent.parent / 'mito' / 'pyproject.toml'
    if pyproject_path.exists():
        with open(pyproject_path, 'r') as f:
            content = f.read()
            import re
            mito_ai_match = re.search(r'"mito-ai==([^"]*)"', content)
            mitosheet_match = re.search(r'"mitosheet==([^"]*)"', content)
            return {
                'mito-ai': mito_ai_match.group(1) if mito_ai_match else "NOT FOUND",
                'mitosheet': mitosheet_match.group(1) if mitosheet_match else "NOT FOUND"
            }
    else:
        return {'mito-ai': 'FILE NOT FOUND', 'mitosheet': 'FILE NOT FOUND'}


def main():
    """Check and display all versions."""
    print("Mito Packages Version Check")
    print("=" * 40)
    
    centralized = get_centralized_version()
    mito = get_mito_version()
    mitosheet = get_mitosheet_version()
    mito_ai = get_mito_ai_version()
    dependencies = get_mito_dependencies()
    
    print(f"Centralized version (version.json): {centralized}")
    print(f"Mito package version:               {mito}")
    print(f"Mitosheet package version:          {mitosheet}")
    print(f"Mito-AI package version:            {mito_ai}")
    print()
    print("Mito package dependencies:")
    print(f"  mito-ai dependency:               {dependencies['mito-ai']}")
    print(f"  mitosheet dependency:             {dependencies['mitosheet']}")
    print()
    
    # Check for consistency
    all_versions = [centralized, mito, mitosheet, mito_ai, dependencies['mito-ai'], dependencies['mitosheet']]
    unique_versions = set(v for v in all_versions if v not in ['NOT FOUND', 'FILE NOT FOUND'])
    
    if len(unique_versions) == 1:
        print("✅ All versions are consistent!")
    else:
        print("❌ Version inconsistencies detected!")
        print(f"   Found versions: {sorted(unique_versions)}")
    
    return len(unique_versions) == 1


if __name__ == '__main__':
    import sys
    success = main()
    sys.exit(0 if success else 1) 