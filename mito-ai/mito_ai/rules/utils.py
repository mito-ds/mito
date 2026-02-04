# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, Final, List, Optional
import os
import json
from mito_ai.utils.schema import MITO_FOLDER

RULES_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, 'rules')
RULES_METADATA_FILENAME: Final[str] = '_metadata.json'


def _sanitize_rule_name(rule_name: str) -> str:
    """
    Sanitizes a rule name to prevent path traversal attacks.
    Raises ValueError if the rule name contains unsafe characters.
    
    Args:
        rule_name: The rule name to sanitize
        
    Returns:
        The sanitized rule name (with .md extension stripped if present)
        
    Raises:
        ValueError: If the rule name contains path traversal sequences or other unsafe characters
    """
    if not rule_name:
        raise ValueError("Rule name cannot be empty")
    
    # Strip .md extension if present
    if rule_name.endswith('.md'):
        rule_name = rule_name[:-3]
    
    # Check for path traversal sequences
    if '..' in rule_name or '/' in rule_name or '\\' in rule_name:
        raise ValueError(f"Rule name contains invalid characters: {rule_name}")
    
    # Check for absolute paths
    if os.path.isabs(rule_name):
        raise ValueError(f"Rule name cannot be an absolute path: {rule_name}")
    
    # Check for null bytes or other control characters
    if '\x00' in rule_name:
        raise ValueError("Rule name cannot contain null bytes")
    
    # Ensure it's a valid filename (no reserved characters on Windows)
    # Windows reserved: < > : " | ? * 
    invalid_chars = set('<>:|?*"')
    if any(c in rule_name for c in invalid_chars):
        raise ValueError(f"Rule name contains invalid filename characters: {rule_name}")
    
    return rule_name


def _validate_rule_path(file_path: str, rule_name: str) -> None:
    """
    Validates that a rule file path is within the rules directory.
    This provides defense-in-depth protection against path traversal attacks.
    
    Args:
        file_path: The file path to validate
        rule_name: The rule name (for error messages)
        
    Raises:
        ValueError: If the resolved path is outside RULES_DIR_PATH
    """
    resolved_path = os.path.abspath(file_path)
    rules_dir_abs = os.path.abspath(RULES_DIR_PATH)
    if not resolved_path.startswith(rules_dir_abs):
        raise ValueError(f"Invalid rule name: {rule_name}")


def _get_metadata_path() -> str:
    return os.path.join(RULES_DIR_PATH, RULES_METADATA_FILENAME)


def _load_metadata() -> dict:
    path = _get_metadata_path()
    if not os.path.exists(path):
        return {}
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save_metadata(metadata: dict) -> None:
    if not os.path.exists(RULES_DIR_PATH):
        os.makedirs(RULES_DIR_PATH)
    path = _get_metadata_path()
    with open(path, 'w') as f:
        json.dump(metadata, f, indent=2)


def get_rule_default(rule_name: str) -> bool:
    """Returns whether the rule is marked as a default (auto-applied) rule."""
    if rule_name.endswith('.md'):
        rule_name = rule_name[:-3]
    metadata = _load_metadata()
    entry = metadata.get(rule_name, {})
    return bool(entry.get('is_default', False))


def set_rule_default(rule_name: str, is_default: bool) -> None:
    """Sets whether the rule is a default (auto-applied) rule."""
    if rule_name.endswith('.md'):
        rule_name = rule_name[:-3]
    metadata = _load_metadata()
    metadata[rule_name] = {**metadata.get(rule_name, {}), 'is_default': is_default}
    _save_metadata(metadata)


def set_rules_file(rule_name: str, value: Any) -> None:
    """
    Updates the value of a specific rule file in the rules directory
    """
    # Sanitize rule name to prevent path traversal
    rule_name = _sanitize_rule_name(rule_name)
    
    # Ensure the directory exists
    if not os.path.exists(RULES_DIR_PATH):
        os.makedirs(RULES_DIR_PATH)

    # Create the file path to the rule name as a .md file
    file_path = os.path.join(RULES_DIR_PATH, f"{rule_name}.md")
    
    # Additional safety check: ensure the resolved path is still within RULES_DIR_PATH
    _validate_rule_path(file_path, rule_name)

    with open(file_path, 'w+') as f:
        f.write(value)


def delete_rule(rule_name: str) -> None:
    """
    Deletes a rule file from the rules directory. Normalizes rule_name (strips .md).
    Metadata for this rule is removed by cleanup_rules_metadata().
    """
    # Sanitize rule name to prevent path traversal
    rule_name = _sanitize_rule_name(rule_name)
    
    file_path = os.path.join(RULES_DIR_PATH, f"{rule_name}.md")
    
    # Additional safety check: ensure the resolved path is still within RULES_DIR_PATH
    _validate_rule_path(file_path, rule_name)
    
    if os.path.exists(file_path):
        os.remove(file_path)


def get_rule(rule_name: str) -> Optional[str]:
    """
    Retrieves the value of a specific rule file from the rules directory
    """
    # Sanitize rule name to prevent path traversal
    rule_name = _sanitize_rule_name(rule_name)
    
    file_path = os.path.join(RULES_DIR_PATH, f"{rule_name}.md")
    
    # Additional safety check: ensure the resolved path is still within RULES_DIR_PATH
    _validate_rule_path(file_path, rule_name)
    
    if not os.path.exists(file_path):
        return None
    
    with open(file_path, 'r') as f:
        return f.read()


def get_all_rules() -> List[str]:
    """
    Retrieves all rule files from the rules directory
    """
    # Ensure the directory exists
    if not os.path.exists(RULES_DIR_PATH):
        os.makedirs(RULES_DIR_PATH)
        return []  # Return empty list if directory didn't exist

    try:
        return [f for f in os.listdir(RULES_DIR_PATH) if f.endswith('.md')]
    except OSError as e:
        # Log the error if needed and return empty list
        print(f"Error reading rules directory: {e}")
        return []


def cleanup_rules_metadata() -> None:
    """
    Removes metadata entries for rules that no longer exist on disk (deleted or renamed).
    Call after rule create/update so metadata stays in sync with actual rule files.
    """
    current_files = get_all_rules()
    current_rule_names = {f[:-3] if f.endswith('.md') else f for f in current_files}
    metadata = _load_metadata()
    if not metadata:
        return
    keys_to_remove = [k for k in metadata if k not in current_rule_names]
    if not keys_to_remove:
        return
    for k in keys_to_remove:
        del metadata[k]
    _save_metadata(metadata)


def get_default_rules_content() -> str:
    """
    Returns the concatenated content of all rules marked as default (auto-applied).
    Each rule is included as "Rule name:\n\n{content}". Returns empty string if no default rules.
    """
    rule_files = get_all_rules()
    parts: List[str] = []
    for f in rule_files:
        rule_name = f[:-3] if f.endswith('.md') else f
        if not get_rule_default(rule_name):
            continue
        content = get_rule(rule_name)
        if content and content.strip():
            parts.append(f"{rule_name}:\n\n{content}")
    return '\n\n'.join(parts) if parts else ""
