# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


def create_verified_snippet_context_prompt(
    code: str,
    comment: str,
    cell_code: str,
) -> str:
    return f"""You are helping document a verified code snippet for a data analysis team.

The user selected this code snippet from their notebook:
```
{code}
```

The user's comment explaining the best practice:
{comment}

The full cell the snippet came from (for surrounding context):
```
{cell_code}
```

Write a short context note (2-4 sentences) explaining:
- What variables or data the snippet depends on
- Any assumptions or setup needed to reuse this snippet
- What the snippet accomplishes

Return only the context note, no preamble."""
