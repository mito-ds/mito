import { Variable } from "../VariableManager/VariableInspector";

export function createBasicPrompt(
    variables: Variable[],
    activeCellCode: string,
    input: string
): string {
    const prompt = `You have access to the following variables:

${variables?.map(variable => `${JSON.stringify(variable, null, 2)}\n`).join('')}

Complete the task below. Decide what variables to use and what changes you need to make to the active code cell. Only return the full new active code cell and a concise explanation of the changes you made.

<Reminders>

Do not: 
- Use the word "I"
- Include multiple approaches in your response
- Recreate variables that already exist

Do: 
- Use the variables that you have access to
- Keep as much of the original code as possible
- Ask for more context if you need it. 

</Reminders>

<Example>

Code in the active code cell:

\`\`\`python
import pandas as pd
loans_df = pd.read_csv('./loans.csv')
\`\`\`

Your task: convert the issue_date column to datetime.

Output:

\`\`\`python
import pandas as pd
loans_df = pd.read_csv('./loans.csv')
loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'])
\`\`\`

Use the pd.to_datetime function to convert the issue_date column to datetime.

</Example>

Code in the active code cell:

\`\`\`python
${activeCellCode}
\`\`\`

Your task: ${input}`;

    console.log(prompt);

    return prompt;
}

export function createErrorPrompt(activeCellCode: string, errorMessage: string): string {
    return `You just ran the active code cell and received an error. Return the full code cell with the error corrected and a short explanation of the error.
            
<Reminders>

Do not: 
- Use the word "I"
- Include multiple approaches in your response
- Recreate variables that already exist

Do: 
- Use the variables that you have access to
- Keep as much of the original code as possible
- Ask for more context if you need it. 

</Reminders>

<Important Jupyter Context>

Remember that you are executing code inside a Jupyter notebook. That means you will have persistent state issues where variables from previous cells or previous code executions might still affect current code. When those errors occur, here are a few possible solutions:
1. Restarting the kernel to reset the environment if a function or variable has been unintentionally overwritten.
2. Identify which cell might need to be rerun to properly initialize the function or variable that is causing the issue.
        
For example, if an error occurs because the built-in function 'print' is overwritten by an integer, you should return the code cell with the modification to the print function removed and also return an explanation that tell the user to restart their kernel. Do not add new comments to the code cell, just return the code cell with the modification removed.
        
When a user hits an error because of a persistent state issue, tell them how to resolve it.

</Important Jupyter Context>

<Example>

Code in the active code cell:

\`\`\`python
print(y)
\`\`\`

Error Message: 
NameError: name 'y' is not defined

Output:

\`\`\`python
y = 10
print(y)
\`\`\`

The variable y has not yet been created.Define the variable y before printing it.
</Example>
        
Code in the active code cell:

\`\`\`python
${activeCellCode}
\`\`\`

Error Message: 

${errorMessage}

Output:
`;
}

export function createExplainCodePrompt(activeCellCode: string): string {
    return `Explain the code in the active code cell to me like I have a basic understanding of Python. Don't explain each line, but instead explain the overall logic of the code.

<Example>

Code in the active code cell:

\`\`\`python
def multiply(x, y):
    return x * y
\`\`\`

Output:

This code creates a function called \`multiply\` that takes two arguments \`x\` and \`y\`, and returns the product of \`x\` and \`y\`.

</Example>

Code in the active code cell:

\`\`\`python
${activeCellCode}
\`\`\`

Output: 
`;
}