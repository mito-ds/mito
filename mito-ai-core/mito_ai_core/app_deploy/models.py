# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
import traceback
from typing import Literal, Optional, List


@dataclass(frozen=True)
class AppDeployError:
    """Error information for app deploy operations."""
    
    # Error type.
    error_type: str
    
    # Error title.
    message: str

    #ID of parent to resolve response
    message_id: Optional[str] = "InvalidMessageID"

    # Error code
    error_code: Optional[int] = 500
    
    # Error traceback.
    traceback: Optional[str] = None
    
    # Hint to fix the error.
    hint: Optional[str] = None
    
    @classmethod
    def from_exception(cls, e: Exception, hint: Optional[str] = None, error_code: Optional[int] = 500) -> "AppDeployError":
        """Create an error from an exception.

        Args:
            e: The exception.
            hint: Optional hint to fix the error.
            error_code: Optional error code which defaults to 500

        Returns:
            The app builder error.
        """
        tb_str = "".join(traceback.format_exception(type(e), e, e.__traceback__))
        return cls(
            error_type=type(e).__name__,
            message=str(e),
            traceback=tb_str,
            hint=hint,
            error_code=error_code
        )


@dataclass(frozen=True)
class ErrorMessage(AppDeployError):
    """Error message."""
    
    # Message type.
    type: Literal["error"] = "error"


@dataclass(frozen=True)
class DeployAppRequest:
    """Request to deploy an app."""
    
    # Request type.
    type: Literal["deploy_app"]
    
    # Message ID.
    message_id: str
    
    # Path to the app file.
    notebook_path: str
    
    # Notebook ID
    notebook_id: str

    # Files to be uploaded for the app to run
    selected_files: List[str]
    
    # JWT token for authorization.
    jwt_token: Optional[str] = None


@dataclass(frozen=True)
class DeployAppReply:
    """Reply to a deplpy app request."""
    
    # ID of the request message this is replying to.
    parent_id: str
    
    # URL of the deployed app.
    url: str
    
    # Optional error information.
    error: Optional[AppDeployError] = None
    
    # Type of reply.
    type: Literal["deploy_app"] = "deploy_app"