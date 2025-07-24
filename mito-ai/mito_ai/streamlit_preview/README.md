# Streamlit Preview Extension

This extension allows users to preview their Jupyter notebooks as Streamlit applications directly within JupyterLab.

## Features

- **One-click preview**: Convert any Jupyter notebook to a Streamlit app with a single command
- **Side-by-side view**: Preview opens in a new tab next to the notebook
- **Automatic cleanup**: Preview processes are automatically stopped when the tab is closed
- **Error handling**: Comprehensive error messages and notifications

## Usage

1. Open a Jupyter notebook in JupyterLab
2. Go to the Command Palette (Cmd/Ctrl + Shift + P)
3. Search for "Preview as Streamlit" and select it
4. The extension will:
   - Convert your notebook to Streamlit code using AI
   - Start a local Streamlit server
   - Open the preview in a new tab next to your notebook

## Architecture

### Backend Components

- **`manager.py`**: Manages Streamlit preview processes, port allocation, and lifecycle
- **`handlers.py`**: REST API handler for starting/stopping previews
- **`test_manager.py`**: Unit tests for the preview manager

### Frontend Components

- **`StreamlitPreviewPlugin.tsx`**: JupyterLab extension that adds the preview command
- **`IFrameWidget`**: Custom widget for displaying the Streamlit app in an iframe

## API Endpoints

- `POST /mito-ai/streamlit-preview`: Start a new preview
  - Body: `{"notebook_path": "path/to/notebook.ipynb"}`
  - Response: `{"id": "preview_id", "port": 8501, "url": "http://localhost:8501"}`

- `DELETE /mito-ai/streamlit-preview/{id}`: Stop a preview
  - Response: 204 No Content

## Security Considerations

- Streamlit servers run on localhost only
- XSRF protection is disabled for iframe embedding
- Temporary directories are automatically cleaned up
- Process cleanup happens on server shutdown

## TODOs

- [ ] Add refresh button to preview widget toolbar
- [ ] Implement proxy routing if cross-origin issues arise
- [ ] Add authentication headers to Streamlit
- [ ] Limit concurrent previews
- [ ] Add rate limiting
- [ ] Enable XSRF protection if needed

## Development

To run tests:
```bash
python -m pytest mito_ai/streamlit_preview/test_manager.py
```

## Dependencies

- `streamlit`: For running the preview apps
- `requests`: For checking if apps are ready
- `tempfile`: For temporary directory management
- `subprocess`: For process management 