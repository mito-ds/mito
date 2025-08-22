# Copyright (c) Saga Inc.

# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional

class MessageType(str, Enum):
    """Types of app manager messages."""
    MANAGE_APP = "manage-app"


@dataclass(frozen=True)
class ManageAppRequest:
    """Request to manage apps."""
    type: str = "manage-app"
    jwt_token: Optional[str] = None
    message_id: Optional[str] = None  

@dataclass(frozen=True)
class App:
    """App information."""
    app_name: str
    url: str
    status: str
    created_at: str

@dataclass(frozen=True)
class AppManagerError:
    """Error information for app manager operations."""
    error_type: str
    title: str
    traceback: Optional[str] = None

    @classmethod
    def from_exception(cls, exc: Exception) -> 'AppManagerError':
        return cls(
            error_type=type(exc).__name__,
            title=str(exc),
            traceback=str(exc)
        )

@dataclass(frozen=True)
class ManageAppReply:
    """Reply to a manage app request."""
    type: str = "manage-app"
    apps: List[App] = field(default_factory=list)
    error: Optional[AppManagerError] = None
    message_id: Optional[str] = None  

@dataclass(frozen=True)
class ErrorMessage:
    """Error message."""
    error_type: str
    title: str
    traceback: Optional[str] = None
    message_id: Optional[str] = None 