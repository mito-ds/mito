# Streamlit Screenshot Feature - Installation Guide

## Quick Start

### 1. Install Python Dependencies

```bash
cd mito-ai
pip install -r requirements.txt
```

### 2. Install Playwright Browsers

This is **required** for the screenshot feature:

```bash
playwright install chromium
```

> **Note**: You only need to install chromium. The full command installs all browsers (~500MB), but we only use chromium (~100MB).

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Build the Extension

```bash
npm run build
```

### 5. Install the Extension in JupyterLab

```bash
# In development mode
jupyter labextension develop . --overwrite

# Or for production
pip install -e .
```

### 6. Restart JupyterLab

```bash
jupyter lab
```

## Verification

### Check that the extension is loaded:

```bash
jupyter labextension list
```

You should see `mito_ai` in the list.

### Check that Playwright is installed:

```bash
playwright --version
```

### Test the screenshot service:

1. Open JupyterLab
2. Create a new notebook
3. Click "Preview as Streamlit"
4. Click "Edit Mode"
5. Draw a rectangle on the preview
6. Check the browser console for any errors

## Troubleshooting

### "Playwright not found"

```bash
pip install playwright
playwright install chromium
```

### "Module not found" errors in browser

Clear the browser cache and rebuild:

```bash
npm run clean
npm run build
jupyter lab clean
jupyter lab build
```

### Screenshot endpoint returns 500

1. Check Jupyter server logs: `jupyter lab --log-level=DEBUG`
2. Verify Streamlit is running on port 8501
3. Check browser console for network errors

### TypeScript compilation errors

The project uses JupyterLab's TypeScript configuration. Make sure you have the correct versions:

```bash
npm install
jupyter labextension list
```

## Development Mode

For active development with hot reload:

```bash
# Terminal 1: Watch TypeScript files
npm run watch

# Terminal 2: Run JupyterLab
jupyter lab --watch
```

## Uninstallation

```bash
# Remove the extension
jupyter labextension uninstall mito_ai

# Remove Python package
pip uninstall mito_ai

# Clean up
npm run clean
```

## System Requirements

- **Python**: 3.8+
- **JupyterLab**: 4.0+
- **Node.js**: 16+
- **Playwright**: 1.40+
- **Streamlit**: 1.28+

## Platform-Specific Notes

### macOS

Playwright installation is straightforward on macOS. No additional dependencies needed.

### Linux

You may need to install additional system dependencies for Playwright:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2

# Or use Playwright's helper
playwright install-deps
```

### Windows

Playwright works on Windows with WSL2 or natively. No additional steps needed.

## Docker

If running in Docker, add this to your Dockerfile:

```dockerfile
# Install Playwright dependencies
RUN pip install playwright && \
    playwright install chromium && \
    playwright install-deps
```

## Next Steps

After installation, see [STREAMLIT_SCREENSHOT_FEATURE.md](./STREAMLIT_SCREENSHOT_FEATURE.md) for usage instructions.
