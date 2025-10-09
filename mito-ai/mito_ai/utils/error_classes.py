
class MitoAppError(Exception):
    """Exception raised for custom error in the application."""

    def __init__(self, message, error_code):
        super().__init__(message)
        self.message = message
        self.error_code = error_code

class StreamlitPreviewError(MitoAppError):
    def __str__(self):
        return f"[StreamlitPreviewError]: {self.message} (Error Code: {self.error_code})"

class StreamlitConversionError(MitoAppError):
    def __str__(self):
        return f"[StreamlitConversionError]: {self.message} (Error Code: {self.error_code})"
