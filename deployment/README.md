# Deployment

This folder contains scripts and configuration files to manage versioning and deploy the package to PyPI or TestPyPI.

### Contents

- bump_version.py: A script to increment the version number of the package according to Semantic Versioning (SemVer)
- guidelines.deploy.py: A script to build and deploy the current version of the package to PyPI or TestPyPI.

## How to Use

### 1. Bump the Version
Use bump_version.py to update the package version. This script can increment the current version or set a specific version number.

`python bump_version.py <package_name> <deploy_location> [<new_version>]`

- <package_name>: The name of the package to bump (e.g., mitosheet, mitosheet2, mitosheet3, or mitoinstaller).
- <deploy_location>: Specify dev to bump the version for TestPyPI or main for PyPI.
- [<new_version>]: (Optional) A specific version to set, in the format x.y.z (e.g., 1.0.1).

**Examples**

Automatically bump the patch version of mitosheet for TestPyPI:

`python bump_version.py mitosheet dev`

Set a specific version for mitosheet2 for PyPI:

`python bump_version.py mitosheet2 main 1.1.0`

Bump the version of mitoinstaller for TestPyPI:

`python bump_version.py mitoinstaller dev`

### 2. Build and Deploy the Package

- Deploy to TestPyPI
Test your package deployment on TestPyPI.
`python deploy.py dev`

- Deploy to PyPI
Once the package has been tested successfully, deploy it to PyPI.
`python deploy.py main`

## Prerequisites

- Ensure you have the necessary permissions and API tokens configured for PyPI and TestPyPI.
- Python, pip, and twine must be installed on your system.The setup.py should be correctly configured for your package.
