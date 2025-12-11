## Project description

This repository contains the code for mitosheet. The Mito spreadsheet is designed to help folks automate their repetitive reporting with Python. Reads README.md for more details.

## Code practices

- Keep It Simple, Stupid
- Don’t Repeat Yourself
  - Reduce complexity
  - Eliminate duplicated code
  - Reuse existing code
- Don't modify code not related to the on-going tasks

### Python

- Always add type hint
- Always document the code using Google doc string formatting
- Always format the code following ruff rules
- Always create unit tests using Pytest in the folder `tests`
- Always use `pathlib.Path` instead of `os.path`

### TypeScript

- Always document interfaces and types
- Always write tests for modified and new React components using `@testing-library/react` in the folder `src/tests`

## Tools

Always use context7 when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.
