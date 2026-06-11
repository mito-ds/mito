# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai_core.verified_reports.utils import get_all_verified_reports


def format_available_verified_reports() -> str:
    reports = get_all_verified_reports()
    if not reports:
        return "No verified reports are currently available."
    return "\n".join(
        f"- {report['name']}: {report['description']}"
        for report in reports
    )
