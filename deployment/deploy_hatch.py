#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
File that contains utilities for deploying a new version of a Hatchling-based
Mito project to PyPI, assuming the correct PyPI credentials are on the machine.
"""
import subprocess
import sys
import os

from utils import deploy_current_version_to_pypi

def build_package() -> None:
    """
    Build the package using hatchling.
    """
    cmd = ["python3", "-m", "hatchling", "build"]
    build_results = subprocess.run(
        cmd,
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    if build_results.returncode != 0:
        raise Exception("Failed to build package with output:", build_results.stdout, build_results.stderr)
    
    print("Package built successfully!")

def main() -> None:
    """
    Deploy to PyPI with `python3 deploy_hatch.py [dev | main]`.
    """
    # We either deploy to dev or main PyPI
    if len(sys.argv) > 1:
        deploy_location = sys.argv[1]
    else:
        raise Exception(f'Please choose a valid deploy location: dev | main')
        
    if deploy_location not in ['dev', 'main']:
        raise Exception(f'Invalid deploy location: {deploy_location}. Please choose from dev | main.')
    
    # First, build the package
    build_package()

    # Then, deploy to PyPI
    deploy_current_version_to_pypi(deploy_location == 'dev')

if __name__ == '__main__':
    main() 