# Mito

A convenience metapackage that installs both `mitosheet` and `mito-ai` packages.

## Installation

```bash
pip install mito
```

This automatically installs:

- **mitosheet** - Interactive spreadsheet for pandas DataFrames in Jupyter notebooks
- **mito-ai** - AI-powered data analysis and code generation tools

## Versioning

This metapackage uses [Calendar Versioning (CalVer)](https://calver.org/) with the `YYYY.MM[.PATCH]` scheme:

- **YYYY.MM** (e.g., `2025.06`) - First bundle in a month
- **YYYY.MM.PATCH** (e.g., `2025.06.1`) - Additional bundles or hot-fixes in the same month
- **Pre-releases** (e.g., `2025.06b1`) - Optional beta/RC versions
- **Post-releases** (e.g., `2025.06.post1`) - Re-uploads with packaging-only fixes

The version indicates when the package was bundled and what dependency versions were current at that time.