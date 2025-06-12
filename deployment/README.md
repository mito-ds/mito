# Deployment

This folder contains files helpful in bumping the version of all Mito packages and deploying them to PyPI.

## SemVer Unified Versioning

All Mito packages (mitosheet, mito-ai, and mito) use unified SemVer versioning. This means all packages always have the same version number.

### Scripts

- **`bump_version.py`** - New unified version bumping script for SemVer
- **`check_versions.py`** - Utility to check version consistency across all packages
- **`deploy.py`** - Local deployment script for mitosheet


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

### Version Bumping Strategies

#### For Patch Releases (Bug fixes)
- Simply merge your changes to `main` branch
- Workflow will automatically bump patch version and deploy

#### For Minor/Major Releases (New features/Breaking changes)
**Option 1**: Manual version bump in PR
```bash
python deployment/bump_version.py minor  # or major
git add version.json mito/pyproject.toml mitosheet/package.json mito-ai/package.json
git commit -m "Bump version for release"
```
Then merge to `main` - workflow will detect the manual bump and skip auto-bump.

**Option 2**: Use workflow dispatch
- Go to GitHub Actions → "Deploy All Packages" → "Run workflow"
- Select `main` branch and choose `minor` or `major` version type

### Automated Deployment

Use the GitHub workflow `.github/workflows/deploy.yml` for automated deployment of all packages.

#### Production Deployment (PyPI)
- **Trigger**: Push to `main` branch or manual workflow dispatch
- **Target**: PyPI (production)
- **Behavior**: 
  - **Smart version bumping**: Automatically bumps patch version UNLESS version was already manually bumped in the push
  - Deploys to production PyPI
  - Commits version changes to main branch (if auto-bumped)
  - Creates Git tag and GitHub release

#### Test Deployment (TestPyPI)
- **Trigger**: Push to `dev` branch
- **Target**: TestPyPI (testing)
- **Behavior**:
  - Creates dev version with timestamp suffix (e.g., `1.2.3.dev20241201123045`)
  - Deploys to TestPyPI for testing
  - Does NOT commit version changes or create releases

#### Installing from TestPyPI

After a successful dev deployment, you can install the test packages:

```bash
# Install individual packages
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ mitosheet==<dev-version>
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ mito-ai==<dev-version>
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ mito==<dev-version>
```

