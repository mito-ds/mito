# Streamlit App Screenshot & AI Editing Feature

## Overview

This feature enables users to select regions of a running Streamlit app via rectangle selection, add text descriptions, and send screenshots + descriptions to AI for code editing. It uses server-side Playwright to capture screenshots without cross-origin restrictions.

## Installation

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browsers (required for screenshot capture)
playwright install chromium
```

### 2. Build the Extension

```bash
cd mito-ai
npm install
npm run build
```

## Usage

### 1. Preview a Streamlit App

1. Open a Jupyter notebook
2. Click the "Preview as Streamlit" button or run the command from the command palette
3. Your notebook will be converted to a Streamlit app and displayed in a preview panel

### 2. Enable Edit Mode

1. Click the **"Edit Mode"** button in the preview panel toolbar
2. The preview border will turn magenta, indicating edit mode is active
3. Your cursor will change to a crosshair

### 3. Select a Region

1. Click and drag on the Streamlit app to draw a rectangle around the region you want to edit
2. Release the mouse button when you've selected the desired area
3. A comment input box will appear near your selection

### 4. Describe Your Change

1. Type a description of what you want to change (e.g., "Make the chart title bigger and bold")
2. Press **Cmd+Enter** (Mac) or **Ctrl+Enter** (Windows/Linux) to submit
3. Or click the **"Send to AI"** button

### 5. AI Processing

The system will:
- Capture a screenshot of the selected region
- Send it to the AI along with your comment
- Process the request and apply code changes (coming soon)

## Keyboard Shortcuts

- **Cmd/Ctrl + Enter**: Submit comment
- **Escape**: Cancel selection
- **Click "Exit Edit Mode"**: Disable selection mode

## Architecture

### Frontend Components

- **SelectionOverlay.ts**: Canvas overlay for drawing selection rectangles
- **CommentInput.ts**: Floating input box for user comments
- **ScreenshotCapture.ts**: API client for screenshot requests
- **StreamlitPreviewPlugin.tsx**: Main widget integration

### Backend Components

- **screenshot_service.py**: Playwright-based screenshot capture service (singleton)
- **screenshot_types.py**: Type definitions
- **handlers.py**: HTTP handlers for screenshot API
- **urls.py**: URL routing configuration

## API Endpoints

### POST /mito-ai/streamlit-screenshot

Captures a screenshot of a Streamlit app region.

**Request Body:**
```json
{
  "scrollX": 0,
  "scrollY": 100,
  "viewportWidth": 1200,
  "viewportHeight": 800,
  "selection": {
    "x": 100,
    "y": 50,
    "width": 400,
    "height": 300
  }
}
```

**Response:**
- Content-Type: `image/png`
- Body: PNG image bytes

### GET /mito-ai/streamlit-screenshot-health

Health check endpoint for the screenshot service.

**Response:**
```json
{
  "status": "healthy" | "restarted" | "unhealthy"
}
```

## Performance

- **First screenshot**: ~2 seconds (browser initialization)
- **Subsequent screenshots**: ~300-400ms (page load + capture)
- Browser instance is reused for optimal performance

## Troubleshooting

### Playwright Not Installed

If you see an error about Playwright not being available:

```bash
pip install playwright
playwright install chromium
```

### Screenshot Fails

1. Check that the Streamlit app is running on `localhost:8501`
2. Check the browser console for errors
3. Try the health check endpoint: `GET /mito-ai/streamlit-screenshot-health`

### Edit Mode Not Working

1. Ensure you've clicked the "Edit Mode" button
2. Check that the preview border turns magenta
3. Try refreshing the preview

## Development Notes

### Coordinate System

The system transforms viewport-relative coordinates to page-absolute coordinates:

```
absolute_y = selection.y + scrollY
absolute_x = selection.x + scrollX
```

This ensures the screenshot captures the correct region even when the user has scrolled.

### Browser Management

The `ScreenshotService` maintains a singleton Playwright browser instance that's shared across all screenshot requests. The browser is automatically restarted if it becomes unhealthy.

### Future Enhancements

- [ ] AI integration for code editing
- [ ] Support for multiple Streamlit ports
- [ ] Screenshot history
- [ ] Widget state synchronization
- [ ] Collaborative editing

## Testing Checklist

- [ ] Rectangle draws correctly with pink dashed border
- [ ] Comment box appears in correct position
- [ ] Screenshot captures correct region
- [ ] Works with scrolled content
- [ ] Works with different viewport sizes
- [ ] Cancel button works
- [ ] Keyboard shortcuts work (Cmd+Enter, Esc)
- [ ] Loading states display correctly
- [ ] Error messages are clear
- [ ] Multiple selections work in sequence
- [ ] Edit mode toggle works
- [ ] Works with Plotly charts
- [ ] Works with images
- [ ] Works with tables/dataframes

## License

Copyright (c) Saga Inc.
Distributed under the terms of the GNU Affero General Public License v3.0 License.
