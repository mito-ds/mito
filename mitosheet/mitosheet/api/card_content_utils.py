#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Helpers for at-a-glance vs full card rendering.
"""

from __future__ import annotations

from typing import Any, Dict, List

_GLANCE_METRIC_LIMIT = 3


def filter_blocks_for_glance(blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Keep a compact subset of blocks for the floating at-a-glance card."""
    out: List[Dict[str, Any]] = []
    metric_count = 0
    has_insight = False

    for block in blocks:
        block_type = block.get("type")
        if block_type in ("header", "caption"):
            out.append(block)
        elif block_type == "metric":
            if metric_count < _GLANCE_METRIC_LIMIT:
                out.append(block)
                metric_count += 1
        elif block_type == "alert" and not has_insight:
            out.append(block)
            has_insight = True

    return out
