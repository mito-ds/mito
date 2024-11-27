import { Variable } from "../VariableManager/VariableInspector";

export function createBasicPrompt(
    variables: Variable[],
    activeCellCode: string,
    input: string
): string {
    const prompt = `You are an expert python programmer writing a script in a Jupyter notebook. You are given a set of variables, existing code, and a task.

Respond with the updated active code cell and a short explanation of the changes you made.

When responding:
- Do not use the word "I"
- Do not recreate variables that already exist
- Keep as much of the original code as possible

<Example>

Defined Variables:
{{
    'loan_multiplier': 1.5,
    'sales_df': pd.DataFrame({{
        'transaction_date': ['2024-01-02', '2024-01-02', '2024-01-02', '2024-01-02', '2024-01-03'],
        'price_per_unit': [10, 9.99, 13.99, 21.00, 100],
        'units_sold': [1, 2, 1, 4, 5],
        'total_price': [10, 19.98, 13.99, 84.00, 500]
    }})
}}

Code in the active code cell:
\`\`\`python
import pandas as pd
sales_df = pd.read_csv('./sales.csv')
\`\`\`

Your task: convert the transaction_date column to datetime and then multiply the total_price column by the sales_multiplier.

Output:

\`\`\`python
import pandas as pd
sales_df = pd.read_csv('./sales.csv')
sales_df['transaction_date'] = pd.to_datetime(sales_df['transaction_date'])
sales_df['total_price'] = sales_df['total_price'] * sales_multiplier
\`\`\`

Converted the \`transaction_date\` column to datetime using the built-in pd.to_datetime function and multiplied the \`total_price\` column by the \`sales_multiplier\` variable.

</Example>

Defined Variables:

${variables?.map(variable => `${JSON.stringify(variable, null, 2)}\n`).join('')}
Code in the active code cell:

\`\`\`python
${activeCellCode}
\`\`\`

Your task: ${input}`

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