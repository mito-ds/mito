
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
    def __str__(self) -> str:
        return f"[DeploymentError]: {self.message} (Error Code: {self.error_code})"
