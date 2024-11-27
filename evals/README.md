# AI Evals

## Setting up evals


1. Create a new virtual environment
```
python -m venv venv
```

2. Activate the virtual environment: 
```
source venv/bin/activate
```

3. Install the dependencies: 
```
pip install -r requirements.txt
```

## Running all tests 
From the `mito` folder, run the command: 
TODO: Improve the running so that we don't have to be in the `mito` folder.
```
python -m evals.main
```

## Running specific tests
To specify which tests to run, set some of the following flags: 

- `--test-name`
- `--prompt-name`
- `--tags`


For example, to run all tests for the `single_shot_prompt` prompt, run: 
```
python -m evals.main --prompt-name=single_shot_prompt
```