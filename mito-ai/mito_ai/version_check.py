# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Version check endpoint for Mito AI to compare local and PyPI versions.
"""
import json
import logging
import time
from functools import lru_cache
from typing import Tuple, Optional, Any
import requests
import tornado.web
from tornado.web import RequestHandler
from mito_ai._version import __version__

logger = logging.getLogger(__name__)

class VersionCheckHandler(RequestHandler):
    """Handler for checking the latest version of Mito AI on PyPI."""
    
    # Cache PyPI results for 1 hour (3600 seconds)
    @staticmethod
    @lru_cache(maxsize=1)
    def _get_latest_version() -> Tuple[Optional[str], float]:
        """Get the latest version from PyPI with caching."""
        cache_time = time.time()
        try:
            response = requests.get("https://pypi.org/pypi/mito-ai/json", timeout=3)
            response.raise_for_status()
            pypi_data = response.json()
            latest_version = pypi_data.get("info", {}).get("version", "")
            return latest_version, cache_time
        except (requests.RequestException, json.JSONDecodeError) as e:
            logger.warning(f"Failed to fetch latest version from PyPI: {str(e)}")
            return None, cache_time
    
    def get(self) -> None:
        """Get the current and latest Mito AI versions."""
        try:
            # Get current package version from _version.py
            current_version = __version__
            
            # Get latest version from PyPI with caching
            latest_version, cache_time = self._get_latest_version()
            cache_age = time.time() - cache_time
            
            # Include cache information in response
            self.set_header("Content-Type", "application/json")
            self.write(json.dumps({
                "current_version": current_version,
                "latest_version": latest_version,
                "cache_age_seconds": int(cache_age)
            }))
        except Exception as e:
            logger.error(f"Error in version check: {str(e)}")
            self.set_status(500)
            self.write(json.dumps({
                "error": "Failed to check versions"
            })) 