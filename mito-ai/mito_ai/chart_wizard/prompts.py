def get_chart_wizard_prompt(source_code: str) -> str:
    return f"""
You are a Python visualization expert.

Your task is to analyze Matplotlib code and extract all user-customizable plotting inputs.

User-customizable inputs are parameters that affect:
- Presentation (titles, labels, legends, fonts)
- Appearance (colors, markers, line styles, alpha, colormaps)
- Layout (figure size, DPI, subplots, spacing)
- Axes configuration (limits, scales, ticks, grids)
- Annotations (text, arrows, labels)
- Data-to-visual mappings (x/y selection, grouping, hue-like encodings)

### Rules
1. Only extract parameters that appear explicitly in the code.
2. Do NOT invent or suggest new parameters.
3. Preserve the literal values exactly as written in the code.
4. If a value is computed or derived, note it as "computed".
5. If a parameter is hard-coded but could reasonably be user-controlled, include it.
6. Ignore internal or incidental variables unrelated to visualization.

CODE TO ANALYZE:

```python
{source_code}
```
"""
