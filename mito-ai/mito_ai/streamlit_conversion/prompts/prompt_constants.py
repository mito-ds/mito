# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

MITO_TODO_PLACEHOLDER = "# MITO_TODO_PLACEHOLDER"

unified_diff_instrucrions = f"""
RESPONSE FORMAT: Return the changes you want to make to the streamlit app as a **unified diff (git-style patch)**:
- Begin with a ````unified_diff` header and a ```` end header.
- Then, include the standard header lines `--- a/app.py` and `+++ b/app.py`.
- Show only the modified hunks; each hunk must start with an `@@` header with line numbers.
- Within each hunk:
  * Unchanged context lines start with a single space.
  * Removed lines start with `-`.
  * Added lines start with `+`.
- If there are **no changes**, return an empty string.
- Do not include the line numbers in your response.

**IMPORTANT: For the hunk header, use `@@ -START_LINE,1 +START_LINE,1 @@` where we always use 1 as the count value. In a later step, the system will automatically calculate the correct counts.**

<Example Response>

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
+    {{'id': 10, 'name': 'Item J', 'category': 'Type 10', 'value': 1000}},
+    {{'id': 11, 'name': 'Item K', 'category': 'Type 11', 'value': 1100}},
+    {{'id': 12, 'name': 'Item L', 'category': 'Type 12', 'value': 1200}},
+    {{'id': 13, 'name': 'Item M', 'category': 'Type 13', 'value': 1300}},
+    {{'id': 14, 'name': 'Item N', 'category': 'Type 14', 'value': 1400}},
+    {{'id': 15, 'name': 'Item O', 'category': 'Type 15', 'value': 1500}},
+    {{'id': 16, 'name': 'Item P', 'category': 'Type 16', 'value': 1600}},
+    {{'id': 17, 'name': 'Item Q', 'category': 'Type 17', 'value': 1700}},
+    {{'id': 18, 'name': 'Item R', 'category': 'Type 18', 'value': 1800}},
+    {{'id': 19, 'name': 'Item S', 'category': 'Type 19', 'value': 1900}},
+    {{'id': 20, 'name': 'Item T', 'category': 'Type 20', 'value': 2000}},
+    {{'id': 21, 'name': 'Item U', 'category': 'Type 21', 'value': 2100}},
+    {{'id': 22, 'name': 'Item V', 'category': 'Type 22', 'value': 2200}},
+    {{'id': 23, 'name': 'Item W', 'category': 'Type 23', 'value': 2300}},
+    {{'id': 24, 'name': 'Item X', 'category': 'Type 24', 'value': 2400}},
+    {{'id': 25, 'name': 'Item Y', 'category': 'Type 25', 'value': 2500}}
```
</Example Response>

Your response must consist **only** of valid unified-diff block.
"""