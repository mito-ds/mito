# Frontend Tests

To setup on Mac or Linux:
```
bash mac-setup.sh
source venv/bin/activate
```

To setup on Windows:
```
windows-setup.bat
venv\Scripts\activate.bat
```
## Running tests

### Streamlit Tests

The Streamlit tests contain most tests of basic functionality. 

Run
```
streamlit run streamlit_test.py --server.port 8555
```

And then run
```
npm run test:streamlit -- --project=chromium
```

### Jupyter Specific Tests

First, you need to run (from the mitosheet/ directory) in this same virtual environment::
```
jupyter labextension develop . --overwrite
```

For **JupyterLab**, run from the tests/ directory: 
```
jupyter lab --config jupyter_server_test_config.py
```

And then in a separate terminal run from the tests/ directory: 
```
npm run test:jupyterlab -- --project=chromium
```

For **Jupyter notebook**, run from the tests/ directory: : 
```
jupyter notebook --config jupyter_notebook_config.py
```

And then in a separate terminal run from the tests/ directory: 
```
npm run test:notebook -- --project=chromium
```

### Mito AI Specific Tests

First, you need to run (from the mito-ai/ directory) in this same virtual environment:

```
jupyter labextension develop . --overwrite
jupyter server extension enable --py mito_ai
```

Then, from the tests/directory, set your OPENAI_API_KEY environment variable:
```
export OPENAI_API_KEY=<your-openai-api-key>
```

From the same terminal, run:
```
jupyter lab --config jupyter_server_test_config.py
```

And then in a separate terminal run from the tests/ directory: 
```
npm run test:mitoai -- --project=chromium
```

### Mito SQL Cell Specific Tests

First, run the following command to install the dependencies from the mito-sql-cell directory:
```
jupyter labextension develop . --overwrite
jupyter server extension enable mito_sql_cell
```

Then, run the following command to start the JupyterLab server from the tests/ directory:
```
jupyter lab --config jupyter_server_test_config.py
```

And then in a separate terminal run from the tests/ directory: 
```
npm run test:mito-sql-cell -- --project=chromium
```

### Dash Specific Tests

Run
```
python dash-test.py
```

Then, run the tests with
```
npm run test:dash -- --project=chromium
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
