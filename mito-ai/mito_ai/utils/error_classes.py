# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.app_deploy.models import AppDeployError

class MitoAppError(Exception):
    """Exception raised for custom error in the application."""

    def __init__(self, message: str, error_code: int) -> None:
        super().__init__(message)
        self.message = message
        self.error_code = error_code

class StreamlitPreviewError(MitoAppError):
    def __str__(self) -> str:
        return f"[PreviewError]: {self.message} (Error Code: {self.error_code})"

class StreamlitConversionError(MitoAppError):
    def __str__(self) -> str:
        return f"[ConversionError]: {self.message} (Error Code: {self.error_code})"


class StreamlitDeploymentError(MitoAppError):
    """Raised when a deployment operation fails."""

    def __init__(self, error: AppDeployError):
        self.error = error
        self.error_type = error.error_type
        self.message_id = getattr(error, "message_id", "ErrorMessageID")
        self.error_code = getattr(error, "error_code", 500)
        self.hint = getattr(error, "hint", "")
        self.traceback = getattr(error, "traceback", "")
        self.error_type = getattr(error, "error_type", "Error")
        self.message = error.message
        print(f"self_message: {self.message}")
        super().__init__(self.message, self.error_code)

    def __str__(self) -> str:
        base = f"[DeploymentError]: {self.message} (Error Code: {self.error_code})"
        if self.hint:
            base += f"\nHint: {self.hint}"
        return base
