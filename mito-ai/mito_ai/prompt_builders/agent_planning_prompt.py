from typing import List


def create_agent_prompt(
    file_type: str, columnSamples: List[str], input: str, variables: List[str], files: List[str]
) -> str:
    variables_str = "\n".join([f"{variable}" for variable in variables])
    files_str = "\n".join([f"{file}" for file in files])

    return f"""You are an expert data science assistant working in a Jupyter notebook environment. Your task is to break a problem into the essential, actionable steps required to write Python code for solving it. 
You have access to the following Python packages:
- pandas (for data manipulation and analysis)
- matplotlib (for data visualization)

Files in the current directory:
{files_str}

Defined Variables:
{variables_str}

1. Break the problem into the **smallest possible number of clear, high-level tasks** necessary to achieve the solution. 
2. **Do not include any code or specific implementation details.** Focus only on describing the high-level steps required to solve the problem.
3. Additionally, provide a list of python packages that are required to complete the actions. 

Your task: {input}
"""
