# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import subprocess

def deploy_current_version_to_pypi(on_dev: bool) -> None:
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
    
    print(f"Successfully deployed to {'Test' if on_dev else ''} PyPI!")

