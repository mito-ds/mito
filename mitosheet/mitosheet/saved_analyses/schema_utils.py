#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Stores utilities for changing the schemas for a saved analysis file,
which requires a seperate upgrade process that upgrading specific
steps within the file. 
"""
from typing import Any, Dict, Optional
from mitosheet._version import __version__


def upgrade_saved_analysis_format_to_steps_data(saved_analysis: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Upgrades a saved analysis to the current format without upgrading
    the specific individual steps! The current format of the saved analysis 
    is:

    {
        "version": "0.1.197",
        "steps_data": [
            {
                "step_version": 1,
                "step_type": "filter",
                "params": {
                    ....
                }
            }
        ]
    }

    The old version of the saved analysis was (note: it was called
    steps, and the params were just inlined in the object):
    {
        "version": "0.1.197",
        "steps": {
            1: {
                "step_version": 1,
                "step_type": "filter",
                "sheet_index": 1,
                ...
            }
        }
    }
    """ 
    # If this saved analysis has the old format, we update it
    if saved_analysis is None:
        return None

    if 'steps' in saved_analysis:
        version = saved_analysis['version']
        steps_data = saved_analysis['steps']

        new_steps_data = []
        for step_data in steps_data.values():
            step_version = step_data['step_version']
            step_type = step_data['step_type']
            params = {
                key: value for key, value in step_data.items() if (key != 'step_version' and key != 'step_type')
            }

            new_steps_data.append({
                'step_version': step_version,
                'step_type': step_type,
                'params': params
            })
        
        return {
            'version': version,
            'steps_data': new_steps_data
        }
    else:
        return saved_analysis
