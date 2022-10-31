#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.
import pandas as pd
import pytest
import json

from mitosheet.mito_config import MEC_CONFIG_KEY_SUPPORT_EMAIL, MEC_CONFIG_KEY_VERSION, MitoConfig


def test_none_works():
    mito_config = MitoConfig(None)
    assert mito_config.get_mito_config() == {
        MEC_CONFIG_KEY_VERSION: 1,
        MEC_CONFIG_KEY_SUPPORT_EMAIL: 'founders@sagacollab.com'
    }

def test_version_1_works():
    mito_config = MitoConfig({
        MEC_CONFIG_KEY_VERSION: 1,
        MEC_CONFIG_KEY_SUPPORT_EMAIL: 'nate@sagacollab.com'
    })
    assert mito_config.get_mito_config() == {
        MEC_CONFIG_KEY_VERSION: 1,
        MEC_CONFIG_KEY_SUPPORT_EMAIL: 'nate@sagacollab.com'
    }