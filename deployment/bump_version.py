#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


"""
Contains utilities for bumping the SemVer version of all Mito packages (mitosheet, mito-ai, and mito)
simultaneously. All packages will always have the same version.
"""

import json
import os
import sys
from typing import Tuple, Union
from pathlib import Path


def version_string_to_tuple(version_string: str) -> Tuple[int, int, int]:
    """Convert version string to tuple."""
    parts = list(map(int, version_string.split('.')))
    if len(parts) != 3:
        raise ValueError(f"Version string must have exactly 3 parts, got {len(parts)}")
    return (parts[0], parts[1], parts[2])


def tuple_to_version_string(version_tuple: Tuple[int, int, int]) -> str:
    """Convert version tuple to string."""
    return '.'.join(map(str, version_tuple))


def get_current_version() -> str:
    """Get current version from the centralized version.json file."""
    version_file = Path(__file__).parent.parent / 'version.json'
    if version_file.exists():
        with open(version_file, 'r') as f:
            version_data = json.load(f)
            return version_data['version']
    else:
        return '1.0.0'  # Default starting version


def update_centralized_version(new_version: str) -> None:
    """Update the centralized version.json file."""
    version_file = Path(__file__).parent.parent / 'version.json'
    version_data = {
        "version": new_version,
        "description": "Centralized SemVer version for all Mito packages (mitosheet, mito-ai, mito)"
    }
    with open(version_file, 'w') as f:
        json.dump(version_data, f, indent=2)


def bump_version_type(version_tuple: Tuple[int, int, int], bump_type: str) -> Tuple[int, int, int]:
    """Bump version based on type (major, minor, patch)."""
    major, minor, patch = version_tuple
    
    if bump_type == 'major':
        return (major + 1, 0, 0)
    elif bump_type == 'minor':
        return (major, minor + 1, 0)
    elif bump_type == 'patch':
        return (major, minor, patch + 1)
    else:
        raise ValueError(f"Invalid bump type: {bump_type}. Must be 'major', 'minor', or 'patch'")


def update_mito_package_version(new_version: str) -> None:
    """Update mito package version in pyproject.toml."""
    pyproject_path = Path(__file__).parent.parent / 'mito' / 'pyproject.toml'
    
    with open(pyproject_path, 'r') as f:
        content = f.read()
    
    # Update version - use regex to be more robust
    import re
    content = re.sub(r'version = "[^"]*"', f'version = "{new_version}"', content)
    
    # Update dependencies to use exact versions
    content = re.sub(r'"mito-ai==[^"]*"', f'"mito-ai=={new_version}"', content)
    content = re.sub(r'"mitosheet==[^"]*"', f'"mitosheet=={new_version}"', content)
    
    with open(pyproject_path, 'w') as f:
        f.write(content)


def update_mitosheet_version(new_version: str) -> None:
    """Update mitosheet package version in package.json."""
    package_json_path = Path(__file__).parent.parent / 'mitosheet' / 'package.json'
    
    with open(package_json_path, 'r') as f:
        package_data = json.load(f)
    
    package_data['version'] = new_version
    
    with open(package_json_path, 'w') as f:
        json.dump(package_data, f, indent=2)


def update_mito_ai_version(new_version: str) -> None:
    """Update mito-ai package version in package.json."""
    package_json_path = Path(__file__).parent.parent / 'mito-ai' / 'package.json'
    
    with open(package_json_path, 'r') as f:
        package_data = json.load(f)
    
    package_data['version'] = new_version
    
    with open(package_json_path, 'w') as f:
        json.dump(package_data, f, indent=2)


def bump_all_versions(bump_type: str = 'patch', specific_version: Union[str, None] = None) -> str:
    """
    Bump the version of all Mito packages (mitosheet, mito-ai, mito) to the same new version.
    
    Args:
        bump_type: Type of version bump ('major', 'minor', 'patch')
        specific_version: If provided, use this specific version instead of bumping
    
    Returns:
        The new version string
    """
    if specific_version:
        new_version = specific_version
    else:
        current_version = get_current_version()
        current_tuple = version_string_to_tuple(current_version)
        new_tuple = bump_version_type(current_tuple, bump_type)
        new_version = tuple_to_version_string(new_tuple)
    
    print(f"Updating all packages from {get_current_version()} to {new_version}")
    
    # Update centralized version file
    update_centralized_version(new_version)
    
    # Update all package versions
    update_mito_package_version(new_version)
    update_mitosheet_version(new_version)
    update_mito_ai_version(new_version)
    
    print(f"Successfully updated all packages to version {new_version}")
    return new_version


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] in ['-h', '--help', 'help']:
        print("Usage: python bump_version.py <bump_type|version>")
        print("  bump_type: major, minor, or patch")
        print("  version: specific version string (e.g., 1.2.3)")
        print("")
        print("Examples:")
        print("  python bump_version.py patch    # 1.0.0 -> 1.0.1")
        print("  python bump_version.py minor    # 1.0.0 -> 1.1.0")
        print("  python bump_version.py major    # 1.0.0 -> 2.0.0")
        print("  python bump_version.py 1.2.3    # Set to specific version")
        sys.exit(0 if len(sys.argv) >= 2 else 1)
    
    arg = sys.argv[1]
    
    # Check if it's a version string or bump type
    if arg in ['major', 'minor', 'patch']:
        bump_all_versions(bump_type=arg)
    else:
        # Assume it's a specific version
        try:
            version_string_to_tuple(arg)  # Validate format
            bump_all_versions(specific_version=arg)
        except ValueError:
            print(f"Invalid version format: {arg}")
            print("Version must be in format x.y.z (e.g., 1.2.3)")
            sys.exit(1) 