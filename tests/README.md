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

Run 
```
jupyter lab --config jupyter_server_test_config.py
```

And then in a separate terminal run 
```
jlpm playwright test
```

Add a `--headed` flag to see the test run.

## Creating tests

See the Galata README.md here: https://github.com/jupyterlab/jupyterlab/tree/master/galata, where it fully documents how to create and record (!) tests.