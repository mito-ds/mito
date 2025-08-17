# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
from enum import Enum
from typing import List, Literal, Optional


class MessageType(str, Enum):
    """Types of app manager messages."""
    MANAGE_APP = "manage-app"


@dataclass(frozen=True)
class AppManagerError:
    """Error information for app manager operations."""

    # Error type.
    error_type: str

    # Error title.
    title: str

    # Error traceback.
    traceback: Optional[str] = None

    @classmethod
    def from_exception(cls, e: Exception) -> "AppManagerError":
        """Create an error from an exception.

        Args:
            e: The exception.

        Returns:
            The app manager error.
        """
        return cls(
            error_type=type(e).__name__,
            title=str(e),
            traceback=getattr(e, "__traceback__", None) and str(e.__traceback__),
        )


@dataclass(frozen=True)
class ErrorMessage(AppManagerError):
    """Error message."""

    # Message type.
    type: Literal["error"] = "error"


@dataclass(frozen=True)
class App:
    """Individual app information."""

    # Name of the app.
    app_name: str

    # Shareable URL link of the app.
    url: str

    # Status of the app - running, stopped, deploying.
    status: str

    # Date when the app was created (ISO format string).
    created_at: str


@dataclass(frozen=True)
class ManageAppRequest:
    """Request to manage apps."""

    # Request type.
    type: Literal["manage-app"]

    # JWT token for authorization.
    jwt_token: Optional[str] = None


@dataclass(frozen=True)
class ManageAppReply:
    """Reply to a manage app request."""

    # List of apps.
    apps: List[App]

    # Type of reply.
    type: Literal["manage-app"] = "manage-app"

    # Optional error information.
    error: Optional[AppManagerError] = None
