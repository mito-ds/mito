#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
This folder contains all of the functions that upgrade
specific steps when the format changes.

Each upgrade function takes two inputs: the step to update,
and all steps that come after it. Each function returns a 
list of steps, which represent the now upgraded step and the
steps that come after it (that may have been changed in some
way, per the upgrade).

Thus, the upgrade function can transform the step whose format
changed, but also modify the steps that come later, if they
need to changed to make them consistent with the upgrade.
"""