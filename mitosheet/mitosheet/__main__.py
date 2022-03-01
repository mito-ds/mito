#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
The main entry point for the mitosheet package, this command
line interface allows you to set some toggles in the user.json
"""
import sys

from mitosheet.user.db import set_user_field
from mitosheet.user import initialize_user
from mitosheet.user.schemas import UJ_MITOSHEET_PRO, UJ_MITOSHEET_TELEMETRY, UJ_USER_EMAIL
from mitosheet.startup.startup_utils import create_startup_file, remove_startup_file

def main() -> None:
    """
    Currently, the main usage of this function is:
    python -m mitosheet turnofflogging
    python -m mitosheet turnonlogging
    python -m mitosheet turnoffpro
    python -m mitosheet turnoffdataframebutton
    python -m mitosheet turnondataframebutton

    We also have 
    python -m mitosheet clearemail
    """
    # Make sure the user is initalized first, but do not identify
    # then, in case they are turning off logging
    initialize_user(call_identify=False)

    # Then, if we are being told to turn off logging, turn off logging
    if len(sys.argv) > 1:
        if sys.argv[-1] == 'turnofflogging':
            print("Turning off all logging")
            set_user_field(UJ_MITOSHEET_TELEMETRY, False)
            print("Logging turned off!")
        if sys.argv[-1] == 'turnonlogging':
            print("Turning on all logging")
            set_user_field(UJ_MITOSHEET_TELEMETRY, True)
            print("Logging turned on!")
        if sys.argv[-1] == 'turnoffpro':
            print("Turning on Mitosheet pro")
            set_user_field(UJ_MITOSHEET_PRO, False)
            print("Mitosheet Pro is false!")
        if sys.argv[-1] == 'clearemail':
            print("Clearing email")
            set_user_field(UJ_USER_EMAIL, '')
            print("Email cleared")
        if sys.argv[-1] == 'turnoffdataframebutton':
            print("Turning off the 'View in Mito' dataframe button")
            remove_startup_file()
            print("Turned off the 'View in Mito' dataframe button\nThe next time you launch Jupyter Lab, the button will no longer be visible")
        if sys.argv[-1] == 'turnondataframebutton':
            print("Turning on the 'View in Mito' dataframe button")
            create_startup_file()
            print("Turned on the 'View in Mito' dataframe button\nThe next time you launch Jupyter Lab, the button will be visible")


if __name__ == '__main__':
    main()