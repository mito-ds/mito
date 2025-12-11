# Feature pandas.Dataframe viewer

The goal of this feature is to display a nice interactive datatable for pandas.DataFrame object.

## Remaining tasks

## Current task

## Tasks done

- [x] Add tests for the React component `MitoViewer` using `@testing-library/react` in `src/tests`
  - Test for empty dataframe
  - Test sorting
  - Test filtering
  - Test truncation message
- [x] Display the dataframe index as the first column
- [x] Use pandas.DataFrame.to_json instead of custom serialization in `format_dataframe_mimetype`
- [x] Create the truncation message in `MitoViewer` and not in `format_dataframe_mimetype`
- [x] Detect that the DataFrame results of a call to `dataframe.describe()`. In that case skip the custom formatter.
- [x] Add a JupyterLabPlugin in src/plugin.tsx that send the following code snippet `from mitosheet.formatter import register_ipython_formatter\n\nregister_ipython_formatter()` for silent execution in Python kernel when opening a new notebook.
- [x] Support pandas `MultiIndex` use `rowspan` attributes in `td` elements to display the multi index nicely. Test that searching and sorting still work with `MultiIndex`.
