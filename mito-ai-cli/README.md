# mito-ai-cli

Command-line runner for the Mito AI agent: it drives `mito-ai-core`’s `AgentRunner` with an in-process [`mito-ai-python-tool-executor`](../mito-ai-python-tool-executor/) kernel and writes a new `.ipynb` when the run finishes.

## Development setup (editable installs)

Use a virtual environment, then install **all three** local packages in **editable** mode from the **repository root** (`mito/`). That way edits to `mito-ai-core`, `mito-ai-python-tool-executor`, or `mito-ai-cli` are picked up immediately without reinstalling.

```bash
cd mito-ai-cli
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -e ../mito-ai-core -e ../mito-ai-python-tool-executor -e .
```

Confirm the CLI is on your PATH:

```bash
mito-ai --help
```

## Running

Run a task and write the notebook:

```bash
mito-ai run "Describe your task" -o out.ipynb
```

Optional model override (must be an allowed model):

```bash
mito-ai run "Your task" -o out.ipynb --model gpt-4.1
```

You can also invoke the package as a module (no console script required):

```bash
python -m mito_ai_cli run "Your task" -o out.ipynb
```
