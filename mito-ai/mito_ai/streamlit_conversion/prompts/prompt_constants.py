# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

MITO_TODO_PLACEHOLDER = "# MITO_TODO_PLACEHOLDER"

unified_diff_instrucrions = f"""
RESPONSE FORMAT: Return the changes you want to make to the streamlit app as a **unified diff (git-style patch)**:

A unified diff looks is the following and tells the system which lines of code to add, remove, or modify:
--- a/app.py
+++ b/app.py
@@ -START_LINE,1 +START_LINE,1 @@
 x = 1
 -y = 2
 +y = 3
 
The components of the unified diff are the following:
- `--- a/app.py` -> The original file. We will always use the file app.py
- `+++ b/app.py` -> The modified file. We will always use the file app.py
- `@@ -START_LINE,1 +START_LINE,1 @@` -> The hunk header
- `x = 1` -> The original context line
- `-y = 2` -> The removed line
- `+y = 3` -> The added line

When you create a unified diff, you must follow the following format:
- Begin with a ```unified_diff marker and a ``` end marker.
- Always, include the standard header lines `--- a/app.py` and `+++ b/app.py`.
- Show only the modified hunks; each hunk must start with an `@@` header with line numbers.
- Within each hunk:
  * Unchanged context lines start with a single space ` `.
  * Removed lines start with `-`.
  * Added lines start with `+`.
- If there are **no changes**, return an empty string.
- Do not include the line numbers in your response.

**HUNK HEADER FORMAT:**
Use `@@ -START_LINE,1 +START_LINE,1 @@` where:
- START_LINE is the line number in the **original file** where this hunk begins
- Always use `1` for both count values (the system will calculate correct counts later)
- All line numbers must reference the **original file**, not the modified version
- For example, if the hunk begins on line 12, use `@@ -12,1 +12,1 @@`

**WRONG FORMATS (DO NOT USE):**
`@@ -12:` -> This is wrong because it is using a colon, doesn't have the count value, and doesn't have both sets of start_line numbers and lines counts.
`@@ -12,1` -> This is wrong because it doesn't have both sets of start_line numbers and lines counts.
`@@ 12,1 12,1 @@` -> This is wrong because it doesn't use - and + before the start_line 
`@@-12,1 +12,1@@` -> This is wrong because it doesn't have a space after the first @@ and doesn't have a space before the second @@.

**MULTIPLE HUNKS:**
- If changes are separated by 5+ unchanged lines, create separate hunks
- Each hunk needs its own `@@` header with the correct START_LINE for that section
- Hunks must be in ascending order by line number

<Example 1: Single change in middle of file>

Assume `data_list = [` is on line 57 of the original file:
```unified_diff
--- a/app.py 
+++ b/app.py
@@ -57,1 +57,1 @@
 data_list = [
-    {{'id': 1, 'name': 'Old'}},
+    {{'id': 1, 'name': 'New'}},
+    {{'id': 2, 'name': 'Also New'}},
</Example 1>

<Example 2: Multiple separate changes>
Assume the original file has:

Line 5: import os
Line 30: def process():

```unified_diff
--- a/app.py 
+++ b/app.py
@@ -5,1 +5,1 @@
 import os
+import sys
@@ -30,1 +30,1 @@
-def process():
+def process_data():
```
</Example 2>

<Example 3: Adding multiple entries to a list while respecting indentations>

In the example below, assume that the line of code `data_list = [` is on line 57 of the existing streamlit app.

```unified_diff
--- a/app.py 
+++ b/app.py
@@ -57,1 +57,1 @@
 data_list = [
     {{'id': 1, 'name': 'Item A', 'category': 'Type 1', 'value': 100}},
     {{'id': 2, 'name': 'Item B', 'category': 'Type 2', 'value': 200}},
-    {MITO_TODO_PLACEHOLDER}: Add remaining entries from notebook
+    {{'id': 3, 'name': 'Item C', 'category': 'Type 3', 'value': 300}},
+    {{'id': 4, 'name': 'Item D', 'category': 'Type 4', 'value': 400}},
+    {{'id': 5, 'name': 'Item E', 'category': 'Type 5', 'value': 500}},
+    {{'id': 6, 'name': 'Item F', 'category': 'Type 6', 'value': 600}},
+    {{'id': 7, 'name': 'Item G', 'category': 'Type 7', 'value': 700}},
+    {{'id': 8, 'name': 'Item H', 'category': 'Type 8', 'value': 800}},
+    {{'id': 9, 'name': 'Item I', 'category': 'Type 9', 'value': 900}},
+    {{'id': 10, 'name': 'Item J', 'category': 'Type 10', 'value': 1000}}
```
</Example Response>

Your response must consist **only** of valid unified-diff block.
"""