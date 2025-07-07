# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mito-ai** is a JupyterLab extension providing AI-powered chat capabilities for Jupyter notebooks. It's a hybrid TypeScript/Python project implementing both frontend JupyterLab extensions and backend Jupyter server extensions with support for multiple AI providers (OpenAI, Anthropic Claude, Google Gemini, Mito API).

## Development Commands

### Setup Commands
```bash
# Required for Yarn 3 compatibility
touch yarn.lock

# Install Python package in development mode  
pip install -e ".[test]"

# Install frontend dependencies
jlpm install

# Build and link extension
jlpm build
jupyter labextension develop . --overwrite
jupyter server extension enable --py mito_ai

# Start development environment
jlpm watch  # Terminal 1: auto-rebuild frontend
jupyter lab --autoreload  # Terminal 2: run JupyterLab with backend hot reload
```

### Build Commands
```bash
jlpm build              # Development build with source maps
jlpm build:prod         # Production build
jlpm watch              # Watch mode for development
```

### Testing Commands
```bash
# Frontend tests
jlpm test               # Run Jest tests with coverage

# Backend tests  
pytest                  # Run Python unit tests
mypy mito_ai/ --ignore-missing-imports  # Type checking
python -m pytest mito_ai/tests/performance_test.py -v -s  # Performance tests

# Integration tests (see tests/README.md)
# Run from mito/tests directory using Playwright and Gelata
```

### Linting Commands
```bash
jlpm eslint             # Run ESLint (with --fix)
jlpm prettier           # Format code with Prettier  
jlpm stylelint          # Run CSS linting
```

### Database Testing
```bash
# Start test database
docker-compose -f mito_ai/tests/docker/postgres.yml up

# Stop and clean up
docker-compose -f mito_ai/tests/docker/postgres.yml down -v
```

## Architecture Overview

### Plugin-Based JupyterLab Architecture
The system consists of multiple JupyterLab plugins that work together:

- **AiChatPlugin**: Main chat interface with streaming WebSocket communication
- **ContextManagerPlugin**: Manages notebook variables and file context for AI
- **ErrorMimeRendererPlugin**: Enhanced error message display
- **AppBuilderPlugin**: Converts notebooks to Streamlit applications
- **SettingsManagerPlugin**: Configuration UI for databases, rules, and general settings
- **InlineCompleter**: AI-powered code completion integration
- **NotebookFooter**: Always-visible notebook footer UI

### Frontend Structure (`/src`)
- `Extensions/`: Core JupyterLab extension implementations
- `components/`: Reusable React components with TypeScript
- `hooks/`: Custom React hooks for common functionality  
- `websockets/`: WebSocket client implementations for real-time AI communication
- `utils/`: Utility functions and helper modules
- `icons/`: SVG icons and React icon components

### Backend Structure (`/mito_ai`)
- `completions/`: AI completion handling with provider abstractions
- `app_builder/`: Streamlit app generation from notebooks
- `db/`: Database connection management for multiple DB types
- `settings/`: Configuration management system
- `rules/`: Custom AI behavior rules engine
- `log/`: Logging functionality

### Key Architectural Patterns

**Multi-Provider AI Integration**: Unified interface supporting OpenAI, Anthropic Claude, Google Gemini, and Mito's API with provider-specific client implementations.

**Real-Time Communication**: WebSocket-based streaming for AI responses with message history management and connection resilience.

**Context-Aware AI**: System understands notebook variables, imported libraries, and file context to provide relevant assistance.

**Agent Mode**: AI can execute code directly in notebooks and interact with the environment.

## Development Guidelines

### TypeScript Configuration
- Strict TypeScript with comprehensive type checking enabled
- Interface naming convention: Must start with `I` (e.g., `IMyInterface`)
- Single quotes for strings, no trailing commas
- React JSX support with ES2018 target

### Python Configuration  
- Python 3.9+ required
- pytest 8.3.4 for testing with asyncio support
- mypy for static type checking with strict settings
- SQLAlchemy for database operations

### Code Style Rules
- ESLint with TypeScript rules enforced
- Prettier formatting with specific overrides
- CSS linting with Stylelint
- Interface naming: `^I[A-Z]` pattern required
- Prefer arrow functions and strict equality checks

### Testing Strategy
- Frontend: Jest with React Testing Library and coverage reporting
- Backend: pytest with asyncio support and performance testing
- Integration: Playwright with Gelata framework
- Database: Docker-based testing for multiple database types

## Configuration

### AI Provider Setup
Set environment variables for AI providers:
```bash
export OPENAI_API_KEY="your-key"
# Configure model via command line:
jupyter lab --OpenAIProvider.model gpt-4o-mini
```

### Performance Notes
- Run `jlpm run clean:lib` if build fails due to stale cache
- Use `jupyter lab build --minimize=False` for JupyterLab core source maps
- Performance tests require editing `open_ai_utils.py` test conditions

## Common Issues

### Build Problems
- Missing lib directory: Run `jlpm run clean:lib` to clear build cache
- Extension not loading: Ensure both frontend build and backend extension are enabled
- WebSocket connection issues: Check that backend server extension is properly enabled

### Development Workflow
- Always use `jlpm` instead of `npm` for package management
- Backend changes require `--autoreload` flag on JupyterLab
- Frontend changes are hot-reloaded with `jlpm watch`
- Test changes with both unit tests and integration tests before committing