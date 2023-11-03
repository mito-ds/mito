# Generating Documentation

There are currently two places that Mito displays documentation of spreadsheet functions: in the cell editor suggestion box, and at docs.trymito.io.

To avoid duplicating documentation, we directly generate documentation from `mitosheet/sheet_functions.py` - where the functions are documented in their doc strings.

## Documentation Format

Each function has a single function documentation object in its docstring, which looks like:
```
{
    "function": "SUM",
    "description": "Returns the sum of a series of numbers and/or columns.",
    "examples": [
        "SUM(10, 11)",
        "SUM(A, B, D, F)",
        "SUM(A, B, D, F)"
    ],
    "category": "MATH",
    "syntax": "SUM(value1, [value2, ...])",
    "syntax_elements": [{
            "element": "value1",
            "description": "The first number or column to add together."
        },
        {
            "element": "value2, ... [OPTIONAL]",
            "description": "Additional numbers or columns to sum."
        }
    ]
}
```

As a TypeScript type:
```
interface FunctionDocumentationObject {
    function: string;
    description: string;
    category?: 'MATH' | 'LOGIC' | 'FINANCE' | 'DATE' | 'TEXT' | 'REFERENCE';
    examples?: (string)[] | null;
    syntax: string;
    syntax_elements?: (SyntaxElementsEntity)[] | null;
}

interface SyntaxElementsEntity {
    element: string;
    description: string;
}
```

## Updating Documentation

If you added a new function, and you want to update the documentation to include that function, first make sure you have written the function doc string correctly under the function. See `SUM` in `/mitosheet/sheet_functions.py` as an example. 

Updating the documentation requires updating the in-app documentation and updating documentation on gitbooks. 

Run the following commands in the  `mito` folder. 

To update the in-app documentation run the command:
```
python3 docs/make_function_docs.py update_frontend
```

To update the gitbooks documentation run the command:
```
python3 docs/make_function_docs.py generate_markdown
```

and then copy the generated markdown onto the gitbook page. 
