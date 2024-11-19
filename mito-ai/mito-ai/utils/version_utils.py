import os
from .schema import UJ_MITOSHEET_ENTERPRISE, UJ_MITOSHEET_PRO
from .db import get_user_field

# Check if helper packages are installed
try:
    import mitosheet_helper_pro
    MITOSHEET_HELPER_PRO = True
except ImportError:
    MITOSHEET_HELPER_PRO = False
try:
    import mitosheet_helper_enterprise
    MITOSHEET_HELPER_ENTERPRISE = True
except ImportError:
    MITOSHEET_HELPER_ENTERPRISE = False

try:
    import mitosheet_private
    MITOSHEET_PRIVATE = True
except ImportError:
    MITOSHEET_PRIVATE = False

# This is a legacy helper that we don't use anymore, however, we're keeping it for now
# for backwards compatibility, since I'm not 100% confident that nobody is currently using it.
try:
    import mitosheet_helper_private
    MITOSHEET_HELPER_PRIVATE = True
except ImportError:
    MITOSHEET_HELPER_PRIVATE = False


def is_pro() -> bool:
    """
    Helper function for returning if this is a
    pro deployment of mito
    """

    # This package overides the user.json
    if MITOSHEET_HELPER_PRO:
        return MITOSHEET_HELPER_PRO

    # This package overides the user.json
    if MITOSHEET_PRIVATE:
        return MITOSHEET_PRIVATE

    # Check if the config is set
    # TODO: Check if the mito config pro is set to true.
    # I don't think that any user is on pro via this method

    # If you're on Mito Enterprise, then you get all Mito Pro features
    if is_enterprise():
        return True

    pro = get_user_field(UJ_MITOSHEET_PRO)

    return pro if pro is not None else False

def is_enterprise() -> bool:
    """
    Helper function for returning if this is a Mito Enterprise
    users
    """
    is_enterprise = get_user_field(UJ_MITOSHEET_ENTERPRISE)

    # This package overides the user.json
    if MITOSHEET_HELPER_ENTERPRISE:
        return MITOSHEET_HELPER_ENTERPRISE
    
    # TODO: Check if the mito config enterprise is set to true. 
    # I don't think that any user is on enterprise via this method

    # TODO: heck if someone has a temp enterprise license set

    return is_enterprise if is_enterprise is not None else False