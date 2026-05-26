from .base import PromptSection


class ReminderSection(PromptSection):
    """Short reminder for the current turn only."""

    trim_after_messages: int = 1

