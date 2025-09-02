# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from datetime import datetime, timezone

def convert_utc_to_local_time(time_str: str) -> str:
    """Convert UTC time to a user's local time"""
    try:
        # Remove the 'Z' suffix and parse the UTC datetime
        utc_time_str = time_str.rstrip('Z')
        utc_time = datetime.fromisoformat(utc_time_str)

        # Set timezone to UTC
        utc_time = utc_time.replace(tzinfo=timezone.utc)

        # Convert to local timezone (system timezone)
        local_time = utc_time.astimezone()

        # Format as 'MMM DD HH:MM'
        return local_time.strftime('%m-%d-%Y %H:%M')

    except (ValueError, AttributeError) as e:
        # Return original string if parsing fails
        return time_str