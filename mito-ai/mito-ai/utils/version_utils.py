import os
from .schema import UJ_MITOSHEET_ENTERPRISE, UJ_MITOSHEET_PRO
from .db import get_user_field

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
    if os.environ.get('MITO_CONFIG_PRO') is not None:
        from mitosheet.enterprise.mito_config import is_env_variable_set_to_true
        return is_env_variable_set_to_true(os.environ.get('MITO_CONFIG_PRO', ''))

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
    
    # Check if the config is set
    mito_config_enterprise = os.environ.get('MITO_CONFIG_ENTERPRISE')
    mito_config_enterprise_temp_license = os.environ.get('MITO_CONFIG_ENTERPRISE_TEMP_LICENSE')
    from mitosheet.enterprise.mito_config import get_enterprise_from_config
    if get_enterprise_from_config(mito_config_enterprise, mito_config_enterprise_temp_license):
        return True

    return is_enterprise if is_enterprise is not None else False