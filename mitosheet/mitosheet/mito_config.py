#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, Optional

# These variables must match the variables defined in 
# mito_config.py of the mitosheet_helper_config package
MEC_VERSION = 'mec_version'
SUPPORT_EMAIL = 'support_email'

# When updating the MEC_VERSION, add a function here 
# to update the previous mec to the new version. 
# If mec_version=3, the following functions should exist:
# upgrade_mec_1_to_2, upgrade_mec_2_to_3.
mec_upgrade_functions = {}	

def upgrade_mito_enterprise_configuration(mec: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:

	if mec is None:
		return None

	while mec[MEC_VERSION] < len(mec_upgrade_functions) + 1:
		mec = mec_upgrade_functions[mec[MEC_VERSION]](mec)

	return mec

class MitoConfig:
    """
    The MitoConfig class is repsonsible for reading in the settings from the 
    mito_helper_configuration package if it is installed and returning the configuration variables
    to be used by the rest of the app. 

    If the mito_helper_configuration package does not exist or does not set every configuration option, 
    the MitoConfig class sets defaults. 
    """
    def __init__(self, mito_enterprise_configuration: Optional[Dict[str, Any]]):
        print(mito_enterprise_configuration)
        self.mec = upgrade_mito_enterprise_configuration(mito_enterprise_configuration)


    @property
    def support_email(self) -> str:
        if self.mec is None:
            return 'help@sagacollab.com'
        return self.mec[SUPPORT_EMAIL]

    @property 
    def mito_config(self) -> Dict[str, Any]:
        return {
                SUPPORT_EMAIL: self.support_email
            }

