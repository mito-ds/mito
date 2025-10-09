# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.streamlit_conversion.agent_utils import fix_diff_headers


@pytest.mark.parametrize("input_diff,expected_output", [
    # Test case 1: Simple replacement with correct counts
    (
        """--- a/app.py
+++ b/app.py
@@ -11,1 +11,1 @@
-st.title("Simple Calculation")
+st.title("Math Examples")""",
        """--- a/app.py
+++ b/app.py
@@ -11,1 +11,1 @@
-st.title("Simple Calculation")
+st.title("Math Examples")"""
    ),
    
    # Test case 2: Simple replacement with incorrect counts (AI's typical mistake)
    (
        """--- a/app.py
+++ b/app.py
@@ -11,6 +11,6 @@
-st.title("Simple Calculation")
+st.title("Math Examples")""",
        """--- a/app.py
+++ b/app.py
@@ -11,1 +11,1 @@
-st.title("Simple Calculation")
+st.title("Math Examples")"""
    ),
        # Test case 3: Simple replacement with incorrect double digit counts (AI's typical mistake)
    (
        """--- a/app.py
+++ b/app.py
@@ -11,12 +11,16 @@
-st.title("Simple Calculation")
+st.title("Math Examples")""",
        """--- a/app.py
+++ b/app.py
@@ -11,1 +11,1 @@
-st.title("Simple Calculation")
+st.title("Math Examples")"""
    ),
    
    # Test case 4: Multiple context lines with replacement
    (
        """--- a/app.py
+++ b/app.py
@@ -10,3 +10,3 @@
 \"\"\", unsafe_allow_html=True)

-st.title("Simple Calculation")
+st.title("Math Examples")

 x = 5""",
        """--- a/app.py
+++ b/app.py
@@ -10,5 +10,5 @@
 \"\"\", unsafe_allow_html=True)
 
-st.title("Simple Calculation")
+st.title("Math Examples")
 
 x = 5"""
    ),
    
    # Test case 5: Add lines (only + lines)
    (
        """--- a/app.py
+++ b/app.py
@@ -5,1 +5,3 @@
 st.title("My App")
+st.header("Welcome")
+st.write("New content")""",
        """--- a/app.py
+++ b/app.py
@@ -5,1 +5,3 @@
 st.title("My App")
+st.header("Welcome")
+st.write("New content")"""
    ),
    
    # Test case 6: Remove lines (only - lines)
    (
        """--- a/app.py
+++ b/app.py
@@ -5,3 +5,1 @@
 st.title("My App")
-st.header("Welcome")
-st.write("Old content")""",
        """--- a/app.py
+++ b/app.py
@@ -5,3 +5,1 @@
 st.title("My App")
-st.header("Welcome")
-st.write("Old content")"""
    ),
    
    # Test case 7: Multiple hunks
    (
        """--- a/app.py
+++ b/app.py
@@ -1,2 +1,2 @@
 import streamlit as st
-st.title("Old Title")
+st.title("New Title")
@@ -5,2 +5,2 @@
 x = 5
-st.write("Old message")
+st.write("New message")""",
        """--- a/app.py
+++ b/app.py
@@ -1,2 +1,2 @@
 import streamlit as st
-st.title("Old Title")
+st.title("New Title")
@@ -5,2 +5,2 @@
 x = 5
-st.write("Old message")
+st.write("New message")"""
    ),
    
    # Test case 8: Complex hunk with mixed context, additions, and removals
    (
        """--- a/app.py
+++ b/app.py
@@ -8,5 +8,6 @@
 \"\"\", unsafe_allow_html=True)

-st.title("Simple Calculation")
+st.title("Math Examples")
+st.subheader("Basic Operations")

 x = 5
 y = 10""",
        """--- a/app.py
+++ b/app.py
@@ -8,6 +8,7 @@
 \"\"\", unsafe_allow_html=True)
 
-st.title("Simple Calculation")
+st.title("Math Examples")
+st.subheader("Basic Operations")
 
 x = 5
 y = 10"""
    ),
    
    # Test case 9: Empty diff
    (
        "",
        ""
    ),
    
    # Test case 10: No hunks (just file headers)
    (
        """--- a/app.py
+++ b/app.py""",
        """--- a/app.py
+++ b/app.py"""
    ),
    
    # Test case 11: Single line addition at end
    (
        """--- a/app.py
+++ b/app.py
@@ -3,0 +3,1 @@
 st.title("My App")
+st.write("Footer")""",
        """--- a/app.py
+++ b/app.py
@@ -3,1 +3,2 @@
 st.title("My App")
+st.write("Footer")"""
    ),
    
    # Test case 12: Single line removal
    (
        """--- a/app.py
+++ b/app.py
@@ -3,1 +3,0 @@
 st.title("My App")
-st.write("Footer")""",
        """--- a/app.py
+++ b/app.py
@@ -3,2 +3,1 @@
 st.title("My App")
-st.write("Footer")"""
    ),
    
    # Test case 13: Multiple consecutive additions
    (
        """--- a/app.py
+++ b/app.py
@@ -2,0 +2,3 @@
 import streamlit as st
+import pandas as pd
+import numpy as np
+import matplotlib.pyplot as plt

 st.title("My App")""",
        """--- a/app.py
+++ b/app.py
@@ -2,3 +2,6 @@
 import streamlit as st
+import pandas as pd
+import numpy as np
+import matplotlib.pyplot as plt
 
 st.title("My App")"""
    ),
    
    # Test case 14: Multiple consecutive removals
    (
        """--- a/app.py
+++ b/app.py
@@ -2,3 +2,0 @@
 import streamlit as st
-import pandas as pd
-import numpy as np
-import matplotlib.pyplot as plt
 
 st.title("My App")""",
        """--- a/app.py
+++ b/app.py
@@ -2,6 +2,3 @@
 import streamlit as st
-import pandas as pd
-import numpy as np
-import matplotlib.pyplot as plt
 
 st.title("My App")"""
    ),
    
    # Test case 15: Edge case - hunk at very end of file
    (
        """--- a/app.py
+++ b/app.py
@@ -5,2 +5,3 @@
 st.title("My App")
-st.write("Old")
+st.write("New")
+st.write("Extra")""",
        """--- a/app.py
+++ b/app.py
@@ -5,2 +5,3 @@
 st.title("My App")
-st.write("Old")
+st.write("New")
+st.write("Extra")"""
    ),
    
    # Test case 16: Edge case - hunk at very beginning of file
    (
        """--- a/app.py
+++ b/app.py
@@ -1,2 +1,3 @@
-import streamlit as st
+import streamlit as st
+import pandas as pd

 st.title("My App")""",
        """--- a/app.py
+++ b/app.py
@@ -1,3 +1,4 @@
-import streamlit as st
+import streamlit as st
+import pandas as pd
 
 st.title("My App")"""
    ),
    
    # Test case 17: Multiple hunks - real world example
    (
        """--- a/app.py
+++ b/app.py
@@ -28,10 +28,10 @@
 # Display initial dataframe
 st.subheader("Meta Stock Prices Dataset")
-st.dataframe(meta_stock_prices_df.head())

 # Create visualization
 st.subheader("Meta Stock Price and Major Acquisitions since 2012")

 # Matplotlib figure
 fig, ax = plt.subplots(figsize=(14,6))
 ax.plot(meta_stock_prices_df['date'], meta_stock_prices_df['close'], label='Meta Stock Price (Close)')
@@ -62,7 +62,10 @@
 ax.set_title("Meta Stock Price and Major Acquisitions since 2012", fontsize=16)
 ax.set_xlabel('Date')
 ax.set_ylabel('Closing Price ($)')
 ax.legend()
 plt.tight_layout()

 # Display the plot in Streamlit
 st.pyplot(fig)
+
+# Display initial dataframe
+st.dataframe(meta_stock_prices_df.head())""",
        """--- a/app.py
+++ b/app.py
@@ -28,10 +28,9 @@
 # Display initial dataframe
 st.subheader("Meta Stock Prices Dataset")
-st.dataframe(meta_stock_prices_df.head())
 
 # Create visualization
 st.subheader("Meta Stock Price and Major Acquisitions since 2012")
 
 # Matplotlib figure
 fig, ax = plt.subplots(figsize=(14,6))
 ax.plot(meta_stock_prices_df['date'], meta_stock_prices_df['close'], label='Meta Stock Price (Close)')
@@ -62,8 +62,11 @@
 ax.set_title("Meta Stock Price and Major Acquisitions since 2012", fontsize=16)
 ax.set_xlabel('Date')
 ax.set_ylabel('Closing Price ($)')
 ax.legend()
 plt.tight_layout()
 
 # Display the plot in Streamlit
 st.pyplot(fig)
+
+# Display initial dataframe
+st.dataframe(meta_stock_prices_df.head())"""
    ),
    
    # Test case 18: Simple multiple hunks - title change and add footer
    (
        """--- a/app.py
+++ b/app.py
@@ -1,2 +1,2 @@
 import streamlit as st
-st.title("Old App")
+st.title("New App")
@@ -3,1 +3,3 @@
 st.write("Hello World")
+
+st.write("Footer text")""",
        """--- a/app.py
+++ b/app.py
@@ -1,2 +1,2 @@
 import streamlit as st
-st.title("Old App")
+st.title("New App")
@@ -3,1 +3,3 @@
 st.write("Hello World")
+
+st.write("Footer text")"""
    ),
    
    # Test case 19: Simple multiple hunks - remove and add lines
    (
        """--- a/app.py
+++ b/app.py
@@ -1,3 +1,2 @@
 import streamlit as st
-st.write("Remove this")
 st.title("My App")
@@ -3,1 +3,2 @@
 st.title("My App")
+st.write("Add this")""",
        """--- a/app.py
+++ b/app.py
@@ -1,3 +1,2 @@
 import streamlit as st
-st.write("Remove this")
 st.title("My App")
@@ -3,1 +3,2 @@
 st.title("My App")
+st.write("Add this")"""
    ),
    
    # Test case 20: Multiple hunks with context lines
    (
        """--- a/app.py
+++ b/app.py
@@ -2,3 +2,3 @@
 import streamlit as st

-st.title("Old Title")
+st.title("New Title")
@@ -6,3 +6,3 @@
 st.write("Some content")

-st.write("Old message")
+st.write("New message")""",
        """--- a/app.py
+++ b/app.py
@@ -2,3 +2,3 @@
 import streamlit as st
 
-st.title("Old Title")
+st.title("New Title")
@@ -6,3 +6,3 @@
 st.write("Some content")
 
-st.write("Old message")
+st.write("New message")"""
    ),
    
    # Test case 21: Add emoji in newly added line
    (
        """--- a/app.py
+++ b/app.py
@@ -2,1 +2,1 @@
 import streamlit as st

+st.title("My App 🚀")
 st.write("Welcome to the app!")""",
        """--- a/app.py
+++ b/app.py
@@ -2,3 +2,4 @@
 import streamlit as st
 
+st.title("My App 🚀")
 st.write("Welcome to the app!")"""
    ),
    
    # Add missing file header component
    (
        """@@ -11,1 +11,1 @@
-st.title("Simple Calculation")
+st.title("Math Examples")""",
        """--- a/app.py
+++ b/app.py
@@ -11,1 +11,1 @@
-st.title("Simple Calculation")
+st.title("Math Examples")"""
    ),
    
    # Correct invalid (single line) file header component
    (
        """--- a/app.py +++ b/app.py
@@ -11,1 +11,1 @@
-st.title("Simple Calculation")
+st.title("Math Examples")""",
        """--- a/app.py
+++ b/app.py
@@ -11,1 +11,1 @@
-st.title("Simple Calculation")
+st.title("Math Examples")"""
    ),
])
def test_fix_diff_headers(input_diff, expected_output):
    """Test the fix_diff_headers function with various diff scenarios."""
    result = fix_diff_headers(input_diff)
    assert result == expected_output, f"""
Input:
{repr(input_diff)}

Expected:
{repr(expected_output)}

Got:
{repr(result)}
"""


def test_fix_diff_headers_preserves_structure():
    """Test that fix_diff_headers preserves the overall structure of the diff."""
    input_diff = """--- a/app.py
+++ b/app.py
@@ -11,6 +11,6 @@
 \"\"\", unsafe_allow_html=True)

-st.title("Simple Calculation")
+st.title("Math Examples")

 x = 5
 y = 10"""
    
    result = fix_diff_headers(input_diff)
    
    # Should preserve file headers
    assert "--- a/app.py" in result
    assert "+++ b/app.py" in result
    
    # Should preserve the hunk content
    assert "-st.title(\"Simple Calculation\")" in result
    assert "+st.title(\"Math Examples\")" in result
    
    # Should have exactly one hunk header
    hunk_headers = [line for line in result.split('\n') if line.startswith('@@')]
    assert len(hunk_headers) == 1
    
    # The hunk header should have correct format
    hunk_header = hunk_headers[0]
    assert hunk_header.startswith('@@ -')
    assert hunk_header.endswith(' @@')
    assert ',' in hunk_header  # Should have count numbers


def test_fix_diff_headers_line_counting():
    """Test that the line counting logic is correct."""
    # Test case with known line counts
    input_diff = """--- a/app.py
+++ b/app.py
@@ -10,999 +10,999 @@
 context line 1
-context line 2
+modified line 2
 context line 3"""
    
    result = fix_diff_headers(input_diff)
    
    # Should fix the counts to be correct
    hunk_headers = [line for line in result.split('\n') if line.startswith('@@')]
    assert len(hunk_headers) == 1
    
    hunk_header = hunk_headers[0]
    # Should be @@ -10,3 +10,3 @@ (3 lines: context, -line, +line, context)
    assert "@@ -10,3 +10,3 @@" in result or "@@ -10,3 +10,3@@" in result


@pytest.mark.parametrize("input_diff", [
    # Test various malformed inputs that should be handled gracefully
    "",
    "not a diff",
    "--- a/app.py\n+++ b/app.py",
    "--- a/app.py\n+++ b/app.py\n@@ -1,1 +1,1 @@\n",
    "--- a/app.py\n+++ b/app.py\n@@ -1,1 +1,1 @@\n+added line",
    "--- a/app.py\n+++ b/app.py\n@@ -1,1 +1,1 @@\n-removed line",
])
def test_fix_diff_headers_edge_cases(input_diff):
    """Test that fix_diff_headers handles edge cases gracefully."""
    # Should not raise an exception
    result = fix_diff_headers(input_diff)
    assert isinstance(result, str)