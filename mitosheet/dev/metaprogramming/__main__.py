
import argparse
import traceback

from metaprogramming.create_new_icon import create_new_icon
from metaprogramming.create_new_step import create_new_step
from metaprogramming.create_new_taskpane import create_new_taskpane


def execute_create_new_step(args: argparse.Namespace) -> None:
    create_new_step()

def execute_create_new_icon(args: argparse.Namespace) -> None:
    create_new_icon(args.name)


def execute_create_new_taskpane(args: argparse.Namespace) -> None:
    create_new_taskpane(
        args.name,
        dict(),
        args.editing,
        args.live_updating,
        args.remain_open_undo
    )


def main() -> None:
    """
    Responsible for running the meta programming commands
    """

    parser = argparse.ArgumentParser(description='Run a metaprogramming command')
    subparsers = parser.add_subparsers()

    parser_create_new_step = subparsers.add_parser('step', help='Create a new step.')
    parser_create_new_step.set_defaults(func=execute_create_new_step)

    parser_create_new_icon = subparsers.add_parser('icon', help='Create a new icon from the most recent item in the downloads folder.')
    parser_create_new_icon.add_argument('--name', required=True, help='The name of the icon to create. E.g. UpArrow, DownArrow')
    parser_create_new_icon.set_defaults(func=execute_create_new_icon)

    parser_create_new_taskpane = subparsers.add_parser('taskpane', help='Create a new taskpane.')
    parser_create_new_taskpane.add_argument('--name', required=True, help='The name of the taskpane to create. E.g. Download, Import')
    parser_create_new_taskpane.add_argument('--editing', help='If the taskpane edits the sheet and therefor should close on sheet edits.', action='store_true')
    parser_create_new_taskpane.add_argument('--live_updating', help='If the taskpane live updates the params.', action='store_true')
    parser_create_new_taskpane.add_argument('--remain_open_undo', help='If the taskpane should remain open when undo/redo are pressed.', action='store_true')
    parser_create_new_taskpane.set_defaults(func=execute_create_new_taskpane)
    args = parser.parse_args()

    try:
        args.func(args)
    except Exception as e:
        print(traceback.format_exc())
        parser.print_help()

if __name__ == "__main__":
    main()
