import { Variable } from "../Extensions/VariableManager/VariableInspector";


export function createErrorPrompt(
    errorMessage: string, 
    activeCellCode: string | undefined, 
    variables: Variable[]
): string {
    return `You are debugging code in a JupyterLab 4 notebook. Analyze the error and provide a solution that maintains the original intent.

<Example 1>
Defined Variables:
{{
    'revenue_multiplier': 1.5,
    'sales_df': pd.DataFrame({{
        'transaction_date': ['2024-01-02', '2024-01-02', '2024-01-02', '2024-01-02', '2024-01-03'],
        'price_per_unit': [10, 9.99, 13.99, 21.00, 100],
        'units_sold': [1, 2, 1, 4, 5],
        'total_price': [10, 19.98, 13.99, 84.00, 500]
    }})
}}

Code in active cell:
\`\`\`python
sales_df['total_revenue'] = sales_df['price'] * revenue_multiplier
\`\`\`

Error Message:
KeyError: 'price'

ERROR ANALYSIS:
Runtime error: Attempted to access non-existent DataFrame column

INTENT ANALYSIS:
User is trying to calculate total revenue by applying a multiplier to transaction prices. Based on the defined variables, the column that the user is tring to access is likely \`total_price\` because that would allow them to calculate the total revenue for each transaction.

SOLUTION:
\`\`\`python
sales_df['total_revenue'] = sales_df['total_price'] * revenue_multiplier
\`\`\`

The DataFrame contains 'total_price' rather than 'price'. Updated column reference to match existing data structure.
</Example 1>

<Example 2>
Defined Variables:
{{
    'df': pd.DataFrame({{
        'order_id': [1, 2, 3, 4],
        'date': ['Mar 7, 2025', 'Sep 24, 2024', '25 June, 2024', 'June 29, 2024'],
        'amount': [100, 150, 299, 99]
    }})
}}

Code in active cell:
\`\`\`python
df['date'] = pd.to_datetime(df['date'])
\`\`\`

Error Message:
ValueError: time data "25 June, 2024" doesn't match format "%b %d, %Y", at position 2. You might want to try:
    - passing \`format\` if your strings have a consistent format;
    - passing \`format='ISO8601'\` if your strings are all ISO8601 but not necessarily in exactly the same format;
    - passing \`format='mixed'\`, and the format will be inferred for each element individually. You might want to use \`dayfirst\` alongside this.

ERROR ANALYSIS:
This is a ValueError caused by applying the wrong format to a specific date string. Because it was triggered at position 2, the first date string must have successfully converted. By looking at the defined variables, I can see that first date string is in the format "Mar 7, 2025", but the third date string is in the format "25 June, 2024". Those dates are not in the same format, so the conversion failed.

INTENT ANALYSIS:
User is trying to convert the date column to a datetime object even though the dates are not in the same starting format. 

SOLUTION:
\`\`\`python
def parse_date(date_str):
    formats = ['%b %d, %Y', '%d %B, %Y']
    
    for fmt in formats:
        try:
            return pd.to_datetime(date_str, format=fmt)
        except ValueError:
            # Try the next format
            continue
            
    # If no format worked, return Not a Time
    return pd.NaT

df['date'] = df['date'].apply(lambda x: parse_date(x))
\`\`\`

Since the dates are not in a consistent format, we need to first figure out which format to use for each date string and then use that format to convert the date.

The best way to do this is with a function. We can call this function \`parse_date\`.
</Example 2>


Guidelines for Solutions:

Error Analysis:

- Identify error type (Syntax, Runtime, Logic).
- Use the defined variables and code in the active cell to understand the error.
- Consider kernel state and execution order

Intent Preservation:

- Try to understand the user's intent using the defined variables and code in the active cell.

Solution Requirements:

- Return the full code cell with the error fixed and a short explanation of the error.
- Propose a solution that fixes the error and does not change the user's intent.
- Make the solution as simple as possible.
- Reuse as much of the existing code as possible.
- Do not add temporary comments like '# Fixed the typo here' or '# Added this line to fix the error'

Here is your task. 

Defined Variables:
${variables?.map(variable => `${JSON.stringify(variable, null, 2)}\n`).join('')}

Code in active cell:
\`\`\`python
${activeCellCode}
\`\`\`

Error Message:
${errorMessage}

ERROR ANALYSIS:

INTENT ANALYSIS:

SOLUTION:
`}

export function removeInnerThoughtsFromMessage(messageContent: string) {
    /* 
    The smart debug prompt thinks to itself before returning the solution. We don't need to save the inner thoughts. 
    We remove them before saving the message in the chat history
    */

    if (messageContent === null) {
        return ''
    }

    const SOLUTION_STRING = 'SOLUTION:'

    // Get the message after the SOLUTION section
    const solutionIndex = messageContent.indexOf(SOLUTION_STRING)
    if (solutionIndex === -1) {
        return messageContent
    }

    const solutionText = messageContent.split(SOLUTION_STRING)[1].trim()

    return solutionText
}