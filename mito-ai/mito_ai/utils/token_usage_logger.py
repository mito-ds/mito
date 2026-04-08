#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations

import csv
import os
from datetime import datetime, timezone
from threading import Lock
from typing import Optional

from mito_ai.utils.schema import MITO_FOLDER

TOKEN_USAGE_LOG_PATH = os.path.join(MITO_FOLDER, "token-usage-log.txt")
TOKEN_USAGE_LOG_HEADER = ["timestamp", "model", "input_tokens", "time_till_first_token_ms", "total_response_time_ms"]

_token_usage_log_lock = Lock()


def _utc_timestamp_iso8601() -> str:
    # Use UTC ISO-8601 with milliseconds and trailing Z.
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def log_token_usage_row(
    model: str,
    input_tokens: Optional[int],
    time_till_first_token_ms: Optional[int],
    total_response_time_ms: Optional[int] = None,
) -> None:
    """
    Append one token-usage row to ~/.mito/token-usage-log.txt.
    This logger is fail-open by design and never raises.
    """
    try:
        with _token_usage_log_lock:
            os.makedirs(MITO_FOLDER, exist_ok=True)
            file_exists = os.path.exists(TOKEN_USAGE_LOG_PATH)

            with open(TOKEN_USAGE_LOG_PATH, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(TOKEN_USAGE_LOG_HEADER)

                writer.writerow(
                    [
                        _utc_timestamp_iso8601(),
                        model,
                        "" if input_tokens is None else str(input_tokens),
                        "" if time_till_first_token_ms is None else str(time_till_first_token_ms),
                        "" if total_response_time_ms is None else str(total_response_time_ms),
                    ]
                )
    except Exception:
        # Logging should never block or fail user-facing requests.
        pass
