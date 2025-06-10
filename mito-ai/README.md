# mito_ai

[![Github Actions Status](/workflows/Build/badge.svg)](/actions/workflows/build.yml)

AI chat for JupyterLab. This codebase contains two main components:
1. A Jupyter server extension that handles the backend logic for the chat.
2. Several JupyterLab extensions that handle the frontend logic for interacting with the AI, including the chat sidebar and the error message rendermime.

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install mito-ai
```

## Configuration

This extension has two AI providers; OpenAI and Mito (calling OpenAI).
Mito is the fallback but the number of request is limited for free tier.
To use OpenAI directly, you will to create an API key on https://platform.openai.com/docs/overview.
Then set the environment variable `OPENAI_API_KEY` with that key.

The OpenAI model can be configured with 1 parameters:
- `OpenAIProvider.model`: Name of the AI model; default _gpt-4o-mini_.

You can set those parameters through command line when starting JupyterLab; e.g.

```sh
jupyter lab --OpenAIProvider.max_completion_tokens 20 --OpenAIProvider.temperature 1.5
```

> If a value is incorrect, an error message will be displayed in the terminal logs.

## Uninstall

To remove the extension, execute:

```bash
pip uninstall mito-ai
```

## Contributing

### Development install

To ensure consistent package management, please use `jlpm` instead of `npm` for this project.

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. 

```bash
# Clone the repo to your local environment
# Change directory to the mito-ai directory

# Required to deal with Yarn 3 workspace rules
touch yarn.lock

# Install package in development mode
pip install -e ".[test]"

# Install the node modules
jlpm install

# Build the extension
jlpm build

# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite

# Start the jupyter server extension for development
jupyter server extension enable --py mito_ai

# Watch the source directory in one terminal, automatically rebuilding when needed
# In case of Error: If this command fails because the lib directory was not created (the error will say something like
# unable to find main entry point) then run `jlpm run clean:lib` first to get rid of the old buildcache 
# that might be preventing a new lib directory from getting created. 
jlpm watch
```

Then, in a new terminal, run:

```bash
# Run JupyterLab in another terminal
jupyter lab --autoreload
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. With the `--autoreload` flag, you don't need to refresh JupyterLab to load the change in your browser. It will launch a new window each time you save a change to the backend.

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall mito-ai
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `mito-ai` within that folder.

### Testing the extension

#### Integration tests

Integration tests for mito-ai are written using Playwright and Gelata in the mito/tests directory.

To run these tests, follow the directions in the tests/README.md file.

#### Backend Unit tests

Backend tests for mito-ai are written using pytest in the mito/mito-ai/mito_ai/tests directory.

To run the pytests, just run `pytest` in the mito-ai directory.

#### Backend Mypy tests

To run the mypy tests, just run `mypy mito_ai/ --ignore-missing-imports` in the mito-ai directory.

#### Frontend Unit tests 

Frontend unit tests for mito-ai are written using Jest in the mito/mito-ai/src/tests directory.

To run the Jest tests, just run `npm test` in the mito-ai directory.

#### Frontend Tests

Frontend tests for mito-ai are written using Playwright and Gelata in the mito/tests directory. See the [tests/README.md](tests/README.md) file for more information.

#### Frontend Linting

Frontend linting for mito-ai is done using ESLint in the mito-ai directory.

To run the ESLint tests, just run `jlpm eslint` in the mito-ai directory.

#### Performance Tests

Performance tests for mito-ai are written using pytest in the mito-ai/tests directory.

To run the performance tests, just run `python -m pytest mito_ai/tests/performance_test.py -v -s` in the mito-ai directory.

Note that you'll have to edit `open_ai_utils.py`, specifically the `is_running_test` condition.

#### Running Databases

To ensure reproducibility, databases, like Postgres, are created using Docker. To run:

```bash
docker-compose -f mito_ai/tests/docker/postgres.yml up
```

When you're done, stop and remove the container and its volumes with:

```bash
docker-compose -f mito_ai/tests/docker/postgres.yml down -v
```
