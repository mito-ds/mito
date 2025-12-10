# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

MITO_TODO_PLACEHOLDER = "# MITO_TODO_PLACEHOLDER"

search_replace_instructions = f"""
RESPONSE FORMAT: You can edit the existing code using the **SEARCH_REPLACE format** for exact string matching and replacement.

**STRUCTURE:**
```search_replace
>>>>>>> SEARCH
[exact code currently in the file]
=======
[new code to replace it with]
<<<<<<< REPLACE
```

**COMPONENTS:**
```search_replace - This is the start of the search/replace block
- `>>>>>>> SEARCH` - Exact text that EXISTS NOW in the file (7 chevrons)
- `=======` - Separator between the search and replace blocks (7 equals signs)  
- `<<<<<<< REPLACE` - Replacement text (7 chevrons)

---

**CRITICAL RULES - READ CAREFULLY:**

1. **SEARCH = CURRENT STATE ONLY**
   - The SEARCH block must contain ONLY code that currently exists in the file
   - NEVER include new code, future code, or code you wish existed in the SEARCH block
   - Copy exact text from the current file, character-for-character
   
2. **EXACT MATCHING REQUIRED**
   - Every space, tab, newline must match perfectly
   - Preserve exact indentation (spaces vs tabs)
   - Include trailing newlines if present
   - No approximations - even one character difference will fail

3. **SIZE LIMITS**
   - There are no size limits to each search/replace block, however, it is generally preferable to keep the SEARCH blocks small and focused on one change. 
   - For large changes, use multiple smaller search/replace blocks

4. **UNIQUENESS**
   - Include enough context to make the SEARCH block unique
   - If text appears multiple times, add surrounding lines
   - Ensure there's only ONE match in the file

5. **VERIFICATION CHECKLIST** (before generating each block):
   ✓ Is every line in my SEARCH block currently in the file?
   ✓ Did I copy the exact spacing and whitespace?
   ✓ Will this match exactly once?
   
6. **SEARCH REPLACE BLOCK STRUCTURE**
   - You must adhere to to the exact search_replace structure as shown in the examples.

---

**MULTIPLE REPLACEMENTS:**
- You can include multiple search/replace blocks in one response
- Each block is independent and processed separately
- Use separate ```search_replace blocks for each change

<Example 1: Updating existing content>

```search_replace
>>>>>>> SEARCH
st.title("Old Title")
=======
st.title("New Title")
<<<<<<< REPLACE
```
</Example 1>

<Example 2: Adding new content>

```search_replace
>>>>>>> SEARCH
st.title("My App")
=======
st.title("My App")
st.header("Welcome")
st.write("This is a test app")
<<<<<<< REPLACE
```
</Example 2>

<Example 3: Deleting existing content>

```search_replace
>>>>>>> SEARCH
st.write("Old message")
=======
<<<<<<< REPLACE
```
</Example 3>

<Example 4: Multiple replacements in one response>

```search_replace
>>>>>>> SEARCH
st.title("Old Title")
=======
st.title("New Title")
<<<<<<< REPLACE
```

```search_replace
>>>>>>> SEARCH
st.write("Old message")
=======
st.write("New message")
<<<<<<< REPLACE
```
</Example 4>

<Example 5: Using extra context to identify the correct code to replace>

In the below example, assume that the code st.write("Old message") appears multiple times in the file, so we use extra context lines to identify the correct code to replace.

```search_replace
>>>>>>> SEARCH
# This is a unique comment
st.write("Old message")
=======
# This is a unique comment
st.write("New message")
<<<<<<< REPLACE
```
</Example 5>

<Example 6: Search/replace while respecting whitespace and indentation>

```search_replace
>>>>>>> SEARCH
data_list = [
    {{'id': 1, 'name': 'Item A'}},
    {MITO_TODO_PLACEHOLDER}: Add remaining entries from notebook
]
=======
data_list = [
    {{'id': 1, 'name': 'Item A'}},
    {{'id': 2, 'name': 'Item B'}},
    {{'id': 3, 'name': 'Item C'}},
    {{'id': 4, 'name': 'Item D'}}
]
<<<<<<< REPLACE
```
</Example 6>

<Example 7: Tab structure changes>

```search_replace
>>>>>>> SEARCH
tab1, tab2 = st.tabs(["Cat", "Dog"])

with tab1:
    st.header("A cat")
    st.image("https://static.streamlit.io/examples/cat.jpg", width=200)
with tab2:
    st.header("A dog")
    st.image("https://static.streamlit.io/examples/dog.jpg", width=200)
=======
st.header("A cat")
st.image("https://static.streamlit.io/examples/cat.jpg", width=200)
st.header("A dog")
st.image("https://static.streamlit.io/examples/dog.jpg", width=200)
<<<<<<< REPLACE
```
</Example 7>

Your response must consist **only** of valid search_replace blocks.
"""