# mito_sql_cell

[![Github Actions Status](https://github.com/mito-ds/mito/workflows/Build/badge.svg)](https://github.com/mito-ds/mito/actions/workflows/build.yml)

JupyterLab extension adding support for SQL cells.

This extension is composed of a Python package named `mito_sql_cell`
for the server extension and a NPM package named `mito-sql-cell`
for the frontend extension.

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install mito_sql_cell
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall mito_sql_cell
```

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the mito_sql_cell directory
# Install package in development mode
pip install -e ".[test]"
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable mito_sql_cell
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable mito_sql_cell
pip uninstall mito_sql_cell
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `mito-sql-cell` within that folder.

### Extension architecture and limitations

#### Frontend

The extension is building on top of [jupysql](https://jupysql.ploomber.io/en/latest/). That tool provides
[Jupyter magics](https://ipython.readthedocs.io/en/stable/config/custommagics.html) to execute SQL queries
within Python code cell.

This extension uses only a subset of features provided by `jupysql`; namely:
- Cell magic `%%sql`: Allow to define code cell containing only a multilines SQL query
- SQL database connection in a configuration: This allows to not add connection details in the notebook; in particular user credentials.
- Save SQL query results in pandas.DataFrame: This is not the default type used by `jupysql` to store the SQL query results.

To use the cell magic and that subset of features, special magics must be executed for this extension to work.
Those magics are automatically inserted at the top of the notebook if not found using a `DocumentRegistry.WidgetExtension` for the notebook panel;
see `SQLToolbarFactory._checkConfiguration` in [./src/sqlextension.ts](./src/sqlextension.ts).

The same widget extension also adds a toolbar at the top of code cell if it is starting
with the SQL magics. The toolbar contains two elements; a datasource selector and a text
field to set the variable name to use to output the SQL query result in. The code for the
toolbar is defined in [./src/sqltoolbar.tsx](./src/sqltoolbar.tsx).

Additionally, a CodeMirror extension is added to replace the magic by a custom DOM element
to hide its complexity to the end user. That extension is defined in [./src/hidemagic.ts](./src/hidemagic.ts).
Of note, selecting that DOM element and copy-pasting it will actually copy-paste the
magic.

Finally on the notebook panel, a third feature is added that adds a new cell type selector
allowing to add a fake _SQL_ type. It is fake in the sense that the cell type is still
_code_ but we use the SQL magic to differentiate the _code_ cell and _SQL_ cell. The code
is defined in [./src/celltypeselector.tsx](./src/celltypeselector.tsx). And the configuration
to deactivate the default cell type selector and hook the new one can be found in [./schema/cell-type-selector.json](./schema/cell-type-selector.json).

The last part provided by the frontend extension is a model and a side panel to handle the SQL datasource. Its code can be found in [./src/sources.tsx](./src/sources.tsx).
Of note, a custom dialog for adding SQL datasources has been created in [./src/addsource.tsx](./src/addsource.tsx). It uses rjsf that create a form from a JSON schema as
the parameters for datasources depend on the type of datasource. Those schemas are defined in
[./src/databases/templates.json](./src/databases/templates.json).

#### Backend

On the server side, we define 2 endpoints:
- `mito-sql-cell/databases`; defined in `DatabasesHandler`
  - _GET_: Get all defined datasources and the SQL magic configuration filename
  - _POST_: Create a new datasource
- `mito-sql-cell/databases/<connection_name>`; defined in `DatabaseHandler`
  - _GET_: Get a single datasource details
  - _PATCH_: Update a datasource
  - _DELETE_: Delete a datasource

Those endpoints are called by the SQL datasources model from the frontend to save
them into the configuration file.

#### Known limitations

- The configuration file is handled by a server extension but it is also consumed by the
  magic that lives within the kernel. Hence if the kernel does not run on the same machine as the server, the configuration won't be found by the magic and the SQL cell
  won't work.
- All datasource types are not supported out of the box. They may require to install additional
  python library. `jupysql` does a good job at suggesting what to install in such cases.
- When a failure occurs `jupysql` does a good job to provide hints on how to fix or debug
  the error. Unfortunately it works against this extension as it often requires adding/changing
  magic options that is hidden by this extension.
- The need for the configuration cell is annoying - especially as you may forget to execute
  it prior to run SQL cells.
- There is an open question about where should the datasource connection details resides.
  There is a need for portability of the notebook. But at the same time, you don't
  want to store credentials in it.
- For datasources using local files (like sqlite), path is not absolute (but maybe it is possible). That may
  bring issue if multiple notebook want to use the same local files.
- Connection name must be unique but for now this is not enforce when adding a datasource.

### Testing the extension

#### Server tests

This extension is using [Pytest](https://docs.pytest.org/) for Python code testing.

Install test dependencies (needed only once):

```sh
pip install -e ".[test]"
# Each time you install the Python package, you need to restore the front-end extension link
jupyter labextension develop . --overwrite
```

To execute them, run:

```sh
pytest -vv -r ap --cov mito_sql_cell
```

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
