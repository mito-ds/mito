# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.streamlit_conversion.agent_utils import apply_patch_to_text


@pytest.mark.parametrize("original_text,diff,expected_result", [
    # Test case 1: Simple line replacement
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
        """--- a/app.py
+++ b/app.py
@@ -10,4 +10,4 @@
 \"\"\", unsafe_allow_html=True)

-st.title("Simple Calculation")
+st.title("Math Examples")

 x = 5""",
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
    
    # Test case 2: Add new lines
    (
        """import streamlit as st

st.title("My App")""",
        """--- a/app.py
+++ b/app.py
@@ -1,3 +1,5 @@
 import streamlit as st

+st.header("Welcome")
 st.title("My App")
+st.write("This is a test app")""",
        """import streamlit as st

st.header("Welcome")
st.title("My App")
st.write("This is a test app")"""
    ),
    
    # Test case 3: Remove lines
    (
        """import streamlit as st

st.header("Welcome")
st.title("My App")
st.write("This is a test app")""",
        """--- a/app.py
+++ b/app.py
@@ -1,5 +1,3 @@
 import streamlit as st

-st.header("Welcome")
 st.title("My App")
-st.write("This is a test app")""",
        """import streamlit as st

st.title("My App")
"""
    ),
    
    # Test case 4: Single hunk with multiple changes
    (
        """import streamlit as st

st.title("Old Title")
x = 5
y = 10
st.write("Old message")""",
        """--- a/app.py
+++ b/app.py
@@ -1,6 +1,6 @@
 import streamlit as st

-st.title("Old Title")
+st.title("New Title")
 x = 5
 y = 10
-st.write("Old message")
+st.write("New message")""",
        """import streamlit as st

st.title("New Title")
x = 5
y = 10
st.write("New message")"""
    ),
    
    # Test case 5: Empty diff
    (
        """import streamlit as st

st.title("My App")""",
        "",
        """import streamlit as st

st.title("My App")"""
    ),
    
    # Test case 6: Whitespace-only changes
    (
        """import streamlit as st
st.title("My App")""",
        """--- a/app.py
+++ b/app.py
@@ -1,2 +1,2 @@
 import streamlit as st
-st.title("My App")
+st.title("My App")""",
        """import streamlit as st
st.title("My App")"""
    ),
    
    # Test case 7: Replace multiple consecutive lines
    (
        """import streamlit as st

st.title("My App")
st.write("Line 1")
st.write("Line 2")
st.write("Line 3")

x = 5""",
        """--- a/app.py
+++ b/app.py
@@ -3,4 +3,2 @@
 st.title("My App")
-st.write("Line 1")
-st.write("Line 2")
-st.write("Line 3")
+st.write("New content")

 x = 5""",
        """import streamlit as st

st.title("My App")
st.write("New content")

x = 5"""
    ),
    
    # Test case 8: Add lines at the beginning
    (
        """import streamlit as st

st.title("My App")""",
        """--- a/app.py
+++ b/app.py
@@ -1,2 +1,3 @@
+import pandas as pd
 import streamlit as st

 st.title("My App")""",
        """import pandas as pd
import streamlit as st

st.title("My App")"""
    ),
    
    # Test case 9: Add lines at the end
    (
        """import streamlit as st

st.title("My App")""",
        """--- a/app.py
+++ b/app.py
@@ -3,1 +3,4 @@
 st.title("My App")
+
+st.write("Footer content")
+st.write("More footer")""",
        """import streamlit as st

st.title("My App")

st.write("Footer content")
st.write("More footer")"""
    ),
    
    # Test case 10: Complex replacement with context
    (
        """import streamlit as st

# This is a comment
st.title("Old Title")
# Another comment
x = 5
y = 10
# Final comment""",
        """--- a/app.py
+++ b/app.py
@@ -2,4 +2,4 @@

 # This is a comment
-st.title("Old Title")
+st.title("New Title")
 # Another comment
 x = 5""",
        """import streamlit as st

# This is a comment
st.title("New Title")
# Another comment
x = 5
y = 10
# Final comment"""
    ),
    
    # Test case 11: Simple multiple hunks - title change and add footer
    (
        """import streamlit as st

st.title("Old App")
st.write("Hello World")""",
        """--- a/app.py
+++ b/app.py
@@ -3,1 +3,1 @@
-st.title("Old App")
+st.title("New App")
@@ -4,1 +4,3 @@
 st.write("Hello World")
+
+st.write("Footer text")""",
        """import streamlit as st

st.title("New App")
st.write("Hello World")

st.write("Footer text")"""
    ),
    
    # Test case 12: Simple multiple hunks - remove and add lines
    (
        """import streamlit as st
st.write("Remove this")
st.title("My App")""",
        """--- a/app.py
+++ b/app.py
@@ -2,1 +2,0 @@
-st.write("Remove this")
@@ -3,1 +3,2 @@
 st.title("My App")
+st.write("Add this")""",
        """import streamlit as st
st.title("My App")
st.write("Add this")"""
    ),
    
    # Test case 13: Multiple hunks with context lines
    (
        """import streamlit as st

st.title("Old Title")
st.write("Some content")

st.write("Old message")""",
        """--- a/app.py
+++ b/app.py
@@ -3,1 +3,1 @@
-st.title("Old Title")
+st.title("New Title")
@@ -6,1 +6,1 @@
-st.write("Old message")
+st.write("New message")""",
        """import streamlit as st

st.title("New Title")
st.write("Some content")

st.write("New message")"""
    ),
    
        # Test case 14: Multiple hunks - add imports and change content
        (
            """import streamlit as st

st.title("My App")
st.write("Hello")
st.write("World")""",
            """--- a/app.py
+++ b/app.py
@@ -1,1 +1,3 @@
 import streamlit as st
+import pandas as pd
+import numpy as np
@@ -4,2 +4,2 @@
 st.write("Hello")
-st.write("World")
+st.write("World!")""",
            """import streamlit as st
import pandas as pd
import numpy as np

st.title("My App")
st.write("Hello")
st.write("World!")"""
        ),
        
        # Test case 15: Add emoji to streamlit app title
        (
            """import streamlit as st

st.title("My App")
st.write("Welcome to my application")""",
            """--- a/app.py
+++ b/app.py
@@ -3,1 +3,1 @@
-st.title("My App")
+st.title("🚀 My App")
 
 st.write("Welcome to my application")""",
            """import streamlit as st

st.title("🚀 My App")
st.write("Welcome to my application")"""
        )
])
def test_apply_patch_to_text(original_text, diff, expected_result):
    """Test the apply_patch_to_text function with various diff scenarios."""
    result = apply_patch_to_text(original_text, diff)
    
    print(f"Original text: {repr(original_text)}")
    print(f"Diff: {repr(diff)}")
    print(f"Expected result: {repr(expected_result)}")
    print(f"Result: {repr(result)}")
    
    assert result == expected_result
