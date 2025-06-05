# Deployment

This folder contains files helpful in bumping the version of all Mito packages and deploying them to PyPI.

## SemVer Unified Versioning

All Mito packages (mitosheet, mito-ai, and mito) use unified SemVer versioning. This means all packages always have the same version number.

### Scripts

- **`bump_version.py`** - New unified version bumping script for SemVer
- **`check_versions.py`** - Utility to check version consistency across all packages
- **`bump_version.py`** - Legacy version bumping script (deprecated)
- **`deploy.py`** - Local deployment script for mitosheet
- **`deploy_hatch.py`** - Local deployment script for mito-ai

### Usage

```bash
# Check current versions
python deployment/check_versions.py

# Bump patch version (1.0.0 -> 1.0.1)
python deployment/bump_version.py patch

# Bump minor version (1.0.0 -> 1.1.0)
python deployment/bump_version.py minor

# Bump major version (1.0.0 -> 2.0.0)
python deployment/bump_version.py major

# Set specific version
python deployment/bump_version.py 1.2.3
```

### Automated Deployment

Use the GitHub workflow `.github/workflows/deploy-all-packages.yml` for automated deployment of all packages.