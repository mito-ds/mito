# Adding a new update event

1. To create a new step named `name`, first create a new file with the name of the step.
2. Within the file, export an object with the following structure

```
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
TODO
"""

UPDATE_NAME_UPDATE_EVENT = 'update_name_update'
UPDATE_NAME_UPDATE_PARAMS = []

def execute_update_name_update(
        steps_manager,
        # TODO: add the params
    ):
    """
    TODO
    """

    # TODO


UPDATE_NAME_UPDATE = {
    'event_type': UPDATE_NAME_UPDATE_EVENT,
    'params': UPDATE_NAME_UPDATE_PARAMS,
    'execute': execute_update_name_update
}
```

Then, find and replace `UPDATE_NAME` and `update_name` with the upper and lower case versions of the update respectively. 

Then, import this object into the `__init__.py` file in this folder.