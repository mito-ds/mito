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

4. If you want to run the sql tests, create the env file by copying the sample file:

```
cp .env.sample .env
```

Then update the new `.env` file with your Snowflake credentials.

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
4. To run the `sql` tests, run the command: 
```
python -m evals.main --test_type=sql
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