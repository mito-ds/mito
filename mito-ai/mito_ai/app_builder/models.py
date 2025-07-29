# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
from enum import Enum
from typing import Literal, Optional


class MessageType(str, Enum):
    """Types of app builder messages."""
    BUILD_APP = "build-app"


@dataclass(frozen=True)
class AppBuilderError:
    """Error information for app builder operations."""
    
    # Error type.
    error_type: str
    
    # Error title.
    title: str
    
    # Error traceback.
    traceback: Optional[str] = None
    
    # Hint to fix the error.
    hint: Optional[str] = None
    
    @classmethod
    def from_exception(cls, e: Exception, hint: Optional[str] = None) -> "AppBuilderError":
        """Create an error from an exception.

        Args:
            e: The exception.
            hint: Optional hint to fix the error.

        Returns:
            The app builder error.
        """
        return cls(
            error_type=type(e).__name__,
            title=str(e),
            traceback=getattr(e, "__traceback__", None) and str(e.__traceback__),
            hint=hint,
        )


@dataclass(frozen=True)
class ErrorMessage(AppBuilderError):
    """Error message."""
    
    # Message type.
    type: Literal["error"] = "error"


@dataclass(frozen=True)
class BuildAppRequest:
    """Request to build an app."""
    
    # Request type.
    type: Literal["build-app"]
    
    # Message ID.
    message_id: str
    
    # Path to the app file.
    notebook_path: str
    
    # JWT token for authorization.
    jwt_token: Optional[str] = None


@dataclass(frozen=True)
class BuildAppReply:
    """Reply to a build app request."""
    
    # ID of the request message this is replying to.
    parent_id: str
    
    # URL of the deployed app.
    url: str
    
    # Optional error information.
    error: Optional[AppBuilderError] = None
    
    # Type of reply.
    type: Literal["build-app"] = "build-app" 