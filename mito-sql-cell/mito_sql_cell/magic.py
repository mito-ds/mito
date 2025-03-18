from __future__ import annotations

import argparse
import itertools
import re
import shlex

import pandas
from IPython.core.magic import (
    Magics,
    cell_magic,
    magics_class,
    no_var_expand,
)
from IPython.core.magic_arguments import MagicArgumentParser, argument, magic_arguments

from .connections import MitoConnectorManager, SqlConnections

MAGIC_OPTION_PREFIX = re.compile(r"-{1,2}\w+")
"""Prefix for magic command options."""


def _option_strings_from_parser(parser: MagicArgumentParser) -> set[str]:
    """Extracts the expected option strings (-x, --xyz, etc) from argparse parser

    Thanks Martijn Pieters
    https://stackoverflow.com/questions/28881456/how-can-i-list-all-registered-arguments-from-an-argumentparser-instance

    Args:
        parser: The parser to extract the option strings from
    Returns:
        A set of option strings
    """
    opts = [a.option_strings for a in parser._actions]
    return set(itertools.chain.from_iterable(opts))


def _run_statements(conn, sql: str) -> pandas.DataFrame:
    """
    Run a SQL query with the given connection.

    This is the function that's called when executing SQL magic.

    Args:
        conn: The connection to use
        sql: SQL query to execution

    Returns:
        The result of the query
    """
    if not sql.strip():
        return "Connected: %s" % conn.name

    return pandas.read_sql(sql, conn)


@magics_class
class SqlMagic(Magics):
    """Runs SQL statement on a database, specified by SQLAlchemy connect string.

    Provides the %%sql magic."""

    def __init__(self, shell=None, **kwargs):
        super().__init__(shell, **kwargs)
        self._connections = SqlConnections()

    @no_var_expand
    @cell_magic("sql")
    @magic_arguments()
    @argument(
        "-c",
        "--configfile",
        default=None,
        type=str,
        help="Configuration file for connections",
    )
    @argument(
        "-o",
        "--out",
        default="sql_out",
        type=str,
        help="Name of the variable to store the result into.",
    )
    @argument(
        "section",
        type=str,
        help="Section of the configuration file to be used for generating a connection.",
    )
    def execute(self, line="", cell=""):
        """
        Runs SQL statement against a database, specified by
        SQLAlchemy connect string.

        If no database connection has been established, first word
        should be a SQLAlchemy connection string, or the user@db name
        of an established connection.

        Examples::

          %%sql
          SELECT * FROM mytable

          %%sql
          DELETE FROM mytable

          %%sql
          DROP TABLE mytable

        """
        # line is the text after the magic, cell is the cell's body

        # Examples

        # %%sql {line}
        # {cell}

        if cell.strip() == "":
            # Nothing to do
            return pandas.DataFrame()

        args = self._parse_args(line)

        config_file = args.configfile if args.configfile else None
        databases = MitoConnectorManager(config_file)

        if not args.section or args.section not in databases:
            raise ValueError(f"Unknown database connection selected: {args.section}.")

        connect_arguments = databases[args.section]

        with self._connections.get(args.section, connect_arguments) as conn:
            try:
                result = _run_statements(conn, cell)

                self.shell.user_ns.update({args.out: result})

                # Return results into the default ipython _ variable
                return result
            except BaseException:
                # FIXME handle nicely exceptions
                raise

    def _parse_args(self, line: str = "") -> argparse.Namespace:
        """Parse the arguments passed to the magic command.

        Args:
            line (optional): The line after the magic command. Defaults to "".

        Returns:
            The parsed arguments

        Raises:
            ValueError: If an argument is not recognized
        """
        tokens = shlex.split(line, posix=False)
        arguments = set()

        # Iterate through the tokens to separate arguments and SQL code
        for token in tokens:
            if MAGIC_OPTION_PREFIX.match(token) is not None:
                arguments.add(token)

        declared_argument = _option_strings_from_parser(SqlMagic.execute.parser)
        unknown_arguments = arguments - declared_argument
        if unknown_arguments:
            raise ValueError("Unrecognized argument(s): {}".format(unknown_arguments))

        return SqlMagic.execute.parser.parse_args(tokens)
