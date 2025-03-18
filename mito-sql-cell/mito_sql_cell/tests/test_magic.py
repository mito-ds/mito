import pandas


def test_basic_magic(ipython_shell):
    r = ipython_shell.run_cell_magic("sql", "db", "SELECT * FROM repositories")

    assert isinstance(r, pandas.DataFrame)
    assert len(r) == 5
