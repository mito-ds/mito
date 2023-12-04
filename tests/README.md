# Frontend Tests

To setup, run
```
bash dev-setup.sh
```

Then start the virtual enviornment by running:
```
source venv/bin/activate
```
## Running tests

### Streamlit Tests

The Streamlit tests contain most tests of basic functionality. 

Run
```
streamlit run streamlit-test.py
```

And then run
```
npm run test:streamlit
```

### Dash Specific Tests

Run
```
python dash-test.py
```

Then, run the tests with
```
npm run test:dash
```

### Jupyter Specific Tests

Run 
```
jupyter lab --config jupyter_server_test_config.py
```

And then in a separate terminal run 
```
npm run test:jupyterlab
```

Add a `--headed` flag to see the test run.

## Creating tests

See the Galata README.md here: https://github.com/jupyterlab/jupyterlab/tree/master/galata, where it fully documents how to create and record (!) tests.

## Writing Tests

### Writing Tests for Streamlit

Writing tests for Streamlit is actually a breeze, using VSCode's Playwright extension. To create new tests:

1. Install the Playwright extenstion for VSCode
2. Use the `Record New` test functionality from the Playwright extension to create a basic test
3. Copy this into the Streamlit test folder. Then, change the setup for the test to use the utilities from the other tests. 

Keep in mind that:
1. Setup is done in a standard function.
2. If you click a button that calls the backend (e.g. makes an edit) you need to use `clickButtonAndAwaitResponse`.

Note that you can also edit a test with the `Record at Cursor` functionality.
