
from typing import List


def create_agent_prompt(file_type: str, columnSamples: List[str], input: str) -> str:
    if file_type:
        file_sample_snippet = f"""You will be working with the following dataset (sample rows shown) from a {file_type} file:
{columnSamples}
"""

    return f"""You are an expert data science assistant working in a Jupyter notebook environment. Your task is to break a problem into the essential, actionable steps required to write Python code for solving it. 
You have access to the following Python packages:
- pandas (for data manipulation and analysis)
- matplotlib (for data visualization)
{file_sample_snippet if file_type else ''}
Given the dataset (if provided) and the question below:
1. Break the problem into the **smallest possible number of clear, high-level tasks** necessary to achieve the solution. 
2. **Do not include any code or specific implementation details.** Focus only on describing the high-level steps required to solve the problem.
3. Additionally, provide a list of python packages that are required to complete the actions. 
{input}
"""
