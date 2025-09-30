# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import TypedDict
from dataclasses import dataclass


class Rectangle(TypedDict):
    """Rectangle selection coordinates"""
    x: float
    y: float
    width: float
    height: float


class CaptureRequest(TypedDict):
    """Request body for screenshot capture"""
    scrollX: float
    scrollY: float
    viewportWidth: int
    viewportHeight: int
    selection: Rectangle


@dataclass
class StreamlitAppConfig:
    """Configuration for Streamlit app screenshot capture"""
    url: str = "http://localhost:8501"
    wait_timeout: int = 10000  # ms
    screenshot_quality: int = 90
