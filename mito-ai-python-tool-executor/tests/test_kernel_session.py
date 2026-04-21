from mito_ai_python_tool_executor.kernel_session import _strip_ansi_escape_sequences


def test_strip_ansi_escape_sequences_removes_terminal_color_codes() -> None:
    raw = (
        "\x1b[31mFileNotFoundError\x1b[39m: [Errno 2] No such file or directory: "
        "'transactions.csv'"
    )
    cleaned = _strip_ansi_escape_sequences(raw)
    assert cleaned == "FileNotFoundError: [Errno 2] No such file or directory: 'transactions.csv'"
