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

## Running the tests 

1. Navigate to the `mito` folder. 
2. To run the `chat` tests, run the command: 
```
python -m evals.main --test_type=chat
```
2. To run the `inline_code_completion` tests, run the command: 
```
python -m evals.main --test_type=inline_code_completion
```
3. To run the `smart-debugger` tests, run the command: 
```
python -m evals.main --test_type=smart_debug
```

## Running specific tests
To specify which tests to run, set some of the following flags: 

- `--test_type`
- `--test`
- `--prompt`
- `--tags`
- `--model`

For example, to run all tests for the `single_shot_prompt` prompt, run: 
```
python -m evals.main --test_type=chat --prompt=single_shot_prompt
```