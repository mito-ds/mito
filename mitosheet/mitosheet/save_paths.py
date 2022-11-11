#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import os

MITO_CONFIG_KEY_HOME_FOLDER = 'MITO_CONFIG_HOME_FOLDER'
if MITO_CONFIG_KEY_HOME_FOLDER in os.environ:
    HOME_FOLDER = os.path.expanduser(os.environ[MITO_CONFIG_KEY_HOME_FOLDER])
else:
    HOME_FOLDER = os.path.expanduser('~')

# Where all global .mito files are stored
MITO_FOLDER = os.path.join(HOME_FOLDER, ".mito")
