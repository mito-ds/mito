# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.completions.prompt_builders.prompt_section_registry import (
    get_max_trim_after_messages,
    get_all_section_classes,
    SectionRegistry
)

def test_get_max_trim_after_messages_returns_actual_max():
    """Test that get_max_trim_after_messages returns the correct maximum value from all sections."""
    # Get all section classes and their trim_after_messages values
    section_classes = get_all_section_classes()
    trim_values = []
    
    for section_class in section_classes:
        trim_value = getattr(section_class, 'trim_after_messages', None)
        if trim_value is not None:
            trim_values.append(trim_value)
    
    if trim_values:
        expected_max = max(trim_values)
        actual_max = get_max_trim_after_messages()
        assert actual_max == expected_max
    else:
        # If all are None, should return 0
        assert get_max_trim_after_messages() == 0


def test_get_all_section_classes():
    """Test that get_all_section_classes returns all section classes."""
    section_classes = get_all_section_classes()
    
    # Verify it returns a list
    assert isinstance(section_classes, list)
    assert len(section_classes) > 0
    
    # Verify all items are classes from SectionRegistry
    for section_class in section_classes:
        assert section_class in SectionRegistry.__dict__.values()
        # Verify they have trim_after_messages attribute
        assert hasattr(section_class, 'trim_after_messages')

