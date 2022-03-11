"""
The Mito Installer package contains utils for installing
Mito within your Python enviornment.

Long term, we aim to meet:
1. This package has minimal dependencies, both for speed of download and the ultimate portability.
2. The installation attempts to fail as early as possible, and to give the user as much help
   help as possible while doing so.
"""
from colorama import init
from termcolor import colored  # type: ignore

from mitoinstaller.install import do_install


def main() -> None:
    """
    The main function of the Mito installer, this function is responsible
    for installing and upgrading the `mitosheet` package.

    To install Mito:
    python -m mitoinstaller install

    To upgrade Mito:
    python -m mitoinstaller upgrade

    To install Mito from TestPyPi
    python -m mitoinstaller install --test-pypi
    """
    import sys
    init()

    if len(sys.argv) > 1:
        command = sys.argv[1]
    else:
        command = ''

    if command == 'install' or command == 'upgrade':
        do_install()
    elif command == 'uninstall':
        print('To uninstall, run,', colored('`pip uninstall mitosheet`', 'green'))
    else:
        # NOTE: we don't add upgrade_to_jupyterlab_3 to the help.
        # We only send this command to the users who need to know this (namely, those that need to upgrade)
        print('\nProper usage is', colored('`python -m mitoinstaller install`', 'green'), 'or', colored('`python -m mitoinstaller upgrade`', 'green'), '\n\nTry running the command ', colored('`python -m mitoinstaller install`', 'green'), '\n')
 

if __name__ == '__main__':
    main()
