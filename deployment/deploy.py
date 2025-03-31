#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
File that contains utilities for deploying a new version of Mito to PyPi,
assuming the correct PyPi credentials are on the machine.
"""
import subprocess
import sys

def generate_sdist_and_bdist_wheel() -> None:
    """
    Generates the sdist and bdist_wheel for the current version of Mito.
    """
    cmd = ["python3", "setup.py", "sdist", "bdist_wheel"]
    build_results = subprocess.run(
        cmd,
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    if build_results.returncode != 0:
        raise Exception("Failed to build sdist and bdist_wheel with output:", build_results.stdout, build_results.stderr)


def deploy_current_mito_version_to_pypi(on_dev: bool) -> None:
    """
    Deploys the current local version of Mito to PyPi.
    """
    cmd = []
    if on_dev:
        cmd = ["twine", "upload", "--repository", "testpypi", "dist/*"]
    else:
        cmd = ["twine", "upload", "dist/*"]

    deploy_results = subprocess.run(
        cmd,
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    if deploy_results.returncode != 0:
        raise Exception("Failed to deploy to PyPi with output:", deploy_results.stdout, deploy_results.stderr)


def main() -> None:
    """
    Deploy to PyPi with `python3 deploy.py [dev | main]`.

    Note that it will deploy whatever package is currently the defined package
    in the package.json, which could either be any mitosheet package, or the 
    mitoinstaller. 

    Note that this should be run in the folder of the package that is being
    deployed (e.g. the folder where the setup.py is).
    """

    # We either deploy app or staging, default staging
    if len(sys.argv) > 1:
        deploy_location = sys.argv[1]
    else:
        raise Exception(f'Please choose a valid deploy location: dev | main')
        
    if deploy_location not in ['dev', 'main']:
        raise Exception(f'Invalid deploy location: {deploy_location}. Please choose from dev | main.')
    
    # First, we generate the sdist and bdist_wheel
    generate_sdist_and_bdist_wheel()

    # Then, we actually deploy Mito to PyPi, if it has not been deployed yet
    deploy_current_mito_version_to_pypi(deploy_location == 'dev')

if __name__ == '__main__':
    main()