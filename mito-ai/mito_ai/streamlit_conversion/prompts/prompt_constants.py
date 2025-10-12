# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

MITO_TODO_PLACEHOLDER = "# MITO_TODO_PLACEHOLDER"

search_replace_instructions = f"""
RESPONSE FORMAT: Return the changes you want to make to the streamlit app using the **SEARCH_REPLACE format**:

The SEARCH_REPLACE format uses exact string matching to find and replace code blocks. It has the following structure:
```
>>>>>>> SEARCH
[exact code to find]
=======
[replacement code]
<<<<<<< REPLACE
```

**KEY COMPONENTS:**
- `>>>>>>> SEARCH` - Marks the beginning of the code to find
- `=======` - Separator between search and replace code
- `<<<<<<< REPLACE` - Marks the end of the replacement code
- No line numbers needed - uses exact string matching
- Include enough context to make the search unique

**FORMAT REQUIREMENTS:**
- Begin with a ```search_replace marker and end with ``` 
- Include the exact code you want to find (including proper indentation)
- Include the exact replacement code
- If there are **no changes**, return an empty string
- You can include multiple search/replace blocks in one response

**CRITICAL: EXACT MATCHING**
- The search text must match **exactly** including all whitespace, indentation, and line breaks
- Include enough surrounding context to make the match unique
- Preserve exact indentation in both search and replace text
- If the search text appears multiple times, include more context to make it unique

**MULTIPLE REPLACEMENTS:**
- You can include multiple search/replace blocks in one response
- Each block is independent and processed separately
- Use separate ```search_replace blocks for each change

<Example 1: Simple title change>

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

<Example 3: Multiple replacements in one response>

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
</Example 3>

<Example 4: Complex replacement with context>

```search_replace
>>>>>>> SEARCH
# This is a comment
st.title("Old Title")
# Another comment
=======
# This is a comment
st.title("New Title")
# Another comment
<<<<<<< REPLACE
```
</Example 4>

<Example 5: Adding multiple entries to a list>

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
</Example 5>

<Example 6: Tab structure changes>

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
</Example 6>

Your response must consist **only** of valid search_replace blocks.
"""