#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Utility for bumping the version in a Hatch/pyproject package.
"""

import re
import tomllib
from pathlib import Path
from typing import Optional

from bump_version import get_next_version


def read_project_metadata(pyproject_path: Path) -> tuple[str, str]:
    """
    Read package name and version from [project] in pyproject.toml.
    """
    with pyproject_path.open("rb") as f:
        data = tomllib.load(f)

    project_data = data.get("project")
    if not isinstance(project_data, dict):
        raise ValueError("Missing [project] section in pyproject.toml")

    project_name = project_data.get("name")
    project_version = project_data.get("version")

    if not isinstance(project_name, str) or not isinstance(project_version, str):
        raise ValueError("Missing project.name or project.version in pyproject.toml")

    return project_name, project_version


def update_project_version(pyproject_path: Path, new_version: str) -> None:
    """
    Update only project.version in pyproject.toml while preserving formatting.
    """
    lines = pyproject_path.read_text().splitlines(keepends=True)
    in_project_section = False
    replaced = False

    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("[") and stripped.endswith("]"):
            in_project_section = stripped == "[project]"
            continue

        if in_project_section:
            version_match = re.match(
                r'^(\s*version\s*=\s*)["\']([^"\']+)["\'](\s*(#.*)?)$',
                line.rstrip("\n"),
            )
            if version_match:
                prefix, _, suffix = version_match.group(1), version_match.group(2), version_match.group(3)
                lines[idx] = f'{prefix}"{new_version}"{suffix}\n'
                replaced = True
                break

    if not replaced:
        raise ValueError("Could not find project.version in [project] section of pyproject.toml")

    pyproject_path.write_text("".join(lines))


def bump_pyproject_version(
    package_name: str,
    deploy_location: str,
    new_version: Optional[str] = None,
    pyproject_path: str = "pyproject.toml",
) -> None:
    """
    Bump version in pyproject.toml for a Hatch package.

    If new_version is not provided, determine it from the latest published version:
    - dev  -> TestPyPI
    - main -> PyPI
    """
    if deploy_location not in ["dev", "main"]:
        raise ValueError(f"Invalid deploy location: {deploy_location}. Please choose from dev | main.")

    pyproject = Path(pyproject_path)
    project_name, current_version = read_project_metadata(pyproject)
    if project_name != package_name:
        raise ValueError(f"Package mismatch: expected {package_name}, found {project_name}")

    if new_version is None:
        next_version_tuple = get_next_version(package_name, deploy_location == "dev")
        new_version = ".".join(map(str, next_version_tuple))

    print("Current pyproject version", current_version)
    print("New version", new_version)
    update_project_version(pyproject, new_version)
    print(f"Bump {package_name} version to {new_version}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        raise ValueError(
            "Usage: python bump_pyproject_version.py <package_name> <deploy_location> [new_version]"
        )

    bump_pyproject_version(
        package_name=sys.argv[1],
        deploy_location=sys.argv[2],
        new_version=sys.argv[3] if len(sys.argv) >= 4 else None,
    )
