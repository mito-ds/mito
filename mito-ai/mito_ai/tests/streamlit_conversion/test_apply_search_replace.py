# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.utils.error_classes import StreamlitConversionError
import pytest
from mito_ai.streamlit_conversion.search_replace_utils import apply_search_replace


@pytest.mark.parametrize("original_text,search_replace_pairs,expected_result", [
    # Test case 1: Simple title change
    (
        """import streamlit as st

st.markdown(\"\"\"
    <style>
        #MainMenu {visibility: hidden;}
        .stAppDeployButton {display:none;}
        footer {visibility: hidden;}
        .stMainBlockContainer {padding: 2rem 1rem 2rem 1rem;}
    </style>
\"\"\", unsafe_allow_html=True)

st.title("Simple Calculation")

x = 5
y = 10
result = x + y

st.write(f"x = {x}")
st.write(f"y = {y}")
st.write(f"x + y = {result}")""",
        [("st.title(\"Simple Calculation\")", "st.title(\"Math Examples\")")],
        """import streamlit as st

st.markdown(\"\"\"
    <style>
        #MainMenu {visibility: hidden;}
        .stAppDeployButton {display:none;}
        footer {visibility: hidden;}
        .stMainBlockContainer {padding: 2rem 1rem 2rem 1rem;}
    </style>
\"\"\", unsafe_allow_html=True)

st.title("Math Examples")

x = 5
y = 10
result = x + y

st.write(f"x = {x}")
st.write(f"y = {y}")
st.write(f"x + y = {result}")"""
    ),
    
    # Test case 2: Add new content
    (
        """import streamlit as st

st.title("My App")""",
        [("st.title(\"My App\")", """st.title("My App")
st.header("Welcome")
st.write("This is a test app")""")],
        """import streamlit as st

st.title("My App")
st.header("Welcome")
st.write("This is a test app")"""
    ),
    
    # Test case 3: Remove lines
    (
        """import streamlit as st

st.header("Welcome")
st.title("My App")
st.write("This is a test app")""",
        [("""st.header("Welcome")
st.title("My App")
st.write("This is a test app")""", "st.title(\"My App\")")],
        """import streamlit as st

st.title("My App")"""
    ),
    
    # Test case 4: Multiple replacements
    (
        """import streamlit as st

st.title("Old Title")
x = 5
y = 10
st.write("Old message")""",
        [
            ("st.title(\"Old Title\")", "st.title(\"New Title\")"),
            ("st.write(\"Old message\")", "st.write(\"New message\")")
        ],
        """import streamlit as st

st.title("New Title")
x = 5
y = 10
st.write("New message")"""
    ),
    
    # Test case 5: Empty search/replace pairs
    (
        """import streamlit as st

st.title("My App")""",
        [],
        """import streamlit as st

st.title("My App")"""
    ),
    
    # Test case 6: Complex replacement with context
    (
        """import streamlit as st

# This is a comment
st.title("Old Title")
# Another comment
x = 5
y = 10
# Final comment""",
        [("""# This is a comment
st.title("Old Title")
# Another comment""", """# This is a comment
st.title("New Title")
# Another comment""")],
        """import streamlit as st

# This is a comment
st.title("New Title")
# Another comment
x = 5
y = 10
# Final comment"""
    ),
    
    # Test case 7: Replace multiple consecutive lines
    (
        """import streamlit as st

st.title("My App")
st.write("Line 1")
st.write("Line 2")
st.write("Line 3")

x = 5""",
        [("""st.write("Line 1")
st.write("Line 2")
st.write("Line 3")""", "st.write(\"New content\")")],
        """import streamlit as st

st.title("My App")
st.write("New content")

x = 5"""
    ),
    
    # Test case 8: Add lines at the beginning
    (
        """import streamlit as st

st.title("My App")""",
        [("import streamlit as st", """import pandas as pd
import streamlit as st""")],
        """import pandas as pd
import streamlit as st

st.title("My App")"""
    ),
    
    # Test case 9: Add lines at the end
    (
        """import streamlit as st

st.title("My App")""",
        [("st.title(\"My App\")", """st.title("My App")

st.write("Footer content")
st.write("More footer")""")],
        """import streamlit as st

st.title("My App")

st.write("Footer content")
st.write("More footer")"""
    ),
    
    # Test case 10: Add emoji to streamlit app title
    (
        """import streamlit as st

st.title("My App")
st.write("Welcome to my application")""",
        [("st.title(\"My App\")", "st.title(\"🚀 My App\")")],
        """import streamlit as st

st.title("🚀 My App")
st.write("Welcome to my application")"""
    ),
    
    # Test case 11: Only replace first occurrence when search text exists multiple times
    (
        """import streamlit as st

st.write("Hello World")
st.title("My App")
st.write("Hello World")
st.write("Another message")""",
        [("st.write(\"Hello World\")", "st.write(\"Hi There\")")],
        """import streamlit as st

st.write("Hi There")
st.title("My App")
st.write("Hello World")
st.write("Another message")"""
    )
])
def test_apply_search_replace(original_text, search_replace_pairs, expected_result):
    """Test the apply_search_replace function with various search/replace scenarios."""
    result = apply_search_replace(original_text, search_replace_pairs)
    
    print(f"Original text: {repr(original_text)}")
    print(f"Search/replace pairs: {search_replace_pairs}")
    print(f"Expected result: {repr(expected_result)}")
    print(f"Result: {repr(result)}")
    
    assert result == expected_result


def test_apply_search_replace_search_not_found():
    """Test that ValueError is raised when search text is not found."""
    with pytest.raises(StreamlitConversionError, match="Search text not found"):
        apply_search_replace("st.title(\"My App\")", [("st.title(\"Not Found\")", "st.title(\"New Title\")")])



