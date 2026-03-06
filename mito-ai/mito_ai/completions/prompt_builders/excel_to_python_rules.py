# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Excel-to-Python conversion rules used when converting Excel spreadsheets
into Jupyter notebooks (e.g. in agent execution prompts).
"""

EXCEL_TO_PYTHON_RULES = """
If you've been asked to convert, translate, or replicate the logic of an Excel file into Python, then you should follow these rules.

**Purpose of converting to Python:** The main reason to convert an Excel model to Python is so the user can easily try different input values and run different scenarios. The user should be able to change a few parameters at the top of the notebook, re-run the notebook, and see new results — without hunting through the code. Your output must support this workflow.

Basically, you should do some test driven development and continue working until you have recreated the entire Excel file.

## Configuration cell at the top

**You must create one main code cell at the very top of the notebook** (after any setup/imports) that holds all configurable inputs in one place. Examples of what belongs there:

- Dates: e.g. `beg_date`, `end_date`
- Rates and numeric assumptions: e.g. `interest_rate`, `number_of_periods`, `growth_rate`, `inflation_rate`
- Any other hardcoded values from the Excel file that a user might want to change to run scenarios

In that cell, assign clear variable names and add brief comments if helpful. All downstream code should use these variables, not literal values. This way the user can adjust inputs in one place and re-run the notebook to try different scenarios.

## Check variables

Throughout this workflow you will create boolean check variables to validate your implementation against the Excel file's computed values. There are two kinds, each with a required naming convention:

1. **Intermediate checks (`mito_check_<description>`):** Validate that a single implementation step is correct. For example, `mito_check_interest_calculation`, `mito_check_monthly_totals`. These are your debugging checkpoints. You must create these as you implement each step. A failing `mito_check_*` variable means something is broken — fix it before proceeding to the next step.
2. **Final output checks (`mito_final_check_<description>`):** Validate that the final outputs of the entire conversion match the Excel file. For example, `mito_final_check_net_income`, `mito_final_check_balance_sheet`. These are your completion criteria. They will only pass once the entire conversion is finished — that is expected and they should NOT block you from moving to the next step.

Rules for check variables:
- Store each check result in a boolean variable using the naming convention above. For example: `mito_check_interest_calculation = abs(result - expected) < 0.01`
- Each group of related checks should be in its own code cell, labeled with a preceding Markdown cell explaining what it tests.
- For floating point comparisons, use an appropriate tolerance (e.g., `abs(result - expected) < 0.01` or `round()`).

## Workflow

### Step 1: Explore the Excel File

Your first task is to understand what the Excel file does. Open the file twice using openpyxl:

- Once with `data_only=False` to read the formulas. The formulas are your source of truth for the logic.
- Once with `data_only=True` to read the computed values. These are your ground truth for testing.

In a markdown cell at the top of the notebook, document your high level findings. Things like: 

- The purpose of the workbook
- What sheets exist and what each one appears to do
- Which cells contain formulas vs. hardcoded data
- Any cross-sheet references
- Any patterns you notice (lookup tables, running totals, conditional logic, etc.)

Keep both workbook objects available in the notebook for reference throughout your work.

### Step 2: Identify Outputs, Source Data, and Configuration Options

In a Markdown cell, clearly document:

- **Outputs:** What does this spreadsheet ultimately produce? Which cells, ranges, or sheets represent the final results?
- **Source Data:** What data does the workbook rely on? ie: a big table of data that the workbook relies on, you should load the data into a Dataframe. You can use multiple dataframes. 
- **Configuration Options:**  What are the inputs that the user can change to run different scenarios? ie: beginning_date, interest_rate, number_of_periods, etc. these inputs should all go into the single configuration cell at the top so the user can change them to run different scenarios.

Be specific — reference sheet names, cell ranges, and describe what each represents.

### Step 3: Trace the Dependency Chain

Working backward from the outputs, trace how each output is computed. Follow the formula references to understand the chain of calculations from inputs to outputs.

In a Markdown cell, document the dependency chain. This gives you the order in which you must implement things — you always implement dependencies before the things that depend on them.

It might take you several iterations to build the dependency chain. That is expected.

### Step 4: Create a Plan

Write a Markdown cell containing:

1. **A todo list** with one item per logical step you need to implement, ordered so that dependencies come first. Use checkbox syntax so you can mark items as complete. The first implementation step should be creating the configuration cell:

   - [ ] Create the `mito_final_check_<description>` variables at the bottom of the notebook, one per final output. Initialize each to `False` with a comment showing the comparison it will eventually perform. For example: `mito_final_check_net_income = False  # Will validate: abs(net_income - <expected>) < 0.01`. As you implement each output, come back and replace `False` with the actual validation expression.
   - [ ] Create configuration cell at top (all configuration options: e.g. beg_date, end_date, interest_rate, number_of_periods, etc.)
   - [ ] Load input data
   - [ ] Compute X from configuration options and input data
   - [ ] Compute Y from X
   - [ ] <add the rest of the steps here>
   - [ ] Compute final output from Z
   - [ ] Rerun notebook from top to bottom and confirm all `mito_check_*` and `mito_final_check_*` variables are `True`.
   
2. **The Python structure** you intend to use — what will be a DataFrame, what will be a variable, what will be a function. Decide this up front so you're not restructuring mid-way, unless you decide you need to update your plan based on future learnings. Then, you can come back and update the plan in this markdown cell.

### Step 5: Implement Iteratively

This is the core of your work. For each item on your todo list, follow this cycle:

1. Write a Markdown cell explaining what Excel logic you are about to convert and how you intend to implement it in Python. Reference the specific formulas from the Excel file.
2. Write a code cell that implements that logic.
3. In a new code cell after the implementation cell, create `mito_check_<description>` variables that compare your computed result to the expected value from the Excel file. For example: `mito_check_interest_calculation = abs(interest - 4500.0) < 0.01`.
4. If this step produces one of the final outputs, also update the corresponding `mito_final_check_*` line in the final checks cell at the bottom of the notebook — replace the `False` placeholder with the actual comparison.
5. **Rerun the entire notebook from top to bottom.** Do not just run the current cell. Rerun everything so you can catch regressions from earlier steps.
6. Check the kernel variables: every `mito_check_*` variable must be `True`. If any `mito_check_*` is `False`, you have a regression or a bug — fix it before proceeding. You can ignore `mito_final_check_*` variables that are `False` since those are only expected to pass once the entire conversion is complete.
7. If all `mito_check_*` variables are `True`: Check off the todo item and move to the next one.
8. If any `mito_check_*` variable is `False`: Debug and fix the code before moving on. Compare your result to the expected value, re-examine the Excel formula, and correct your implementation. Then rerun the notebook from top to bottom again.

Do not batch work. Implement one logical step, test it, confirm it works, then move to the next. Tight loops, not big batches.

### Step 6: Final Validation

Once every todo item is checked off, rerun the entire notebook from top to bottom one last time. Every `mito_check_*` and `mito_final_check_*` variable must be `True`. If any fail, go back and fix them. You are not done until all checks pass.

## Rules

- **One configuration cell at the top.** All user-changeable inputs (dates, rates, periods, and any other scenario inputs) must live in a single code cell at the top of the notebook. Downstream code uses these variables only — no magic numbers or repeated literals for inputs. This is so the user can try different scenarios by editing one place and re-running.
- **Formulas are the source of truth.** Always read the Excel formulas to understand logic. Do not guess the logic from data values alone.
- **Rerun from top after every step.** After each implementation step, rerun the entire notebook from top to bottom. Check that every `mito_check_*` variable is `True` before moving on. Never just run the current cell in isolation.
- **`mito_check_*` blocks progress; `mito_final_check_*` does not.** A failing `mito_check_*` variable means something is broken — fix it before proceeding. A failing `mito_final_check_*` variable is expected until the full conversion is complete and should not block you.
- **Fix before proceeding.** If any `mito_check_*` fails, fix it before moving on. Do not accumulate broken steps.
- **All checks define done.** You are not finished until every `mito_check_*` and `mito_final_check_*` variable is `True`. Do not stop to ask if things look right — the checks tell you.
- **Keep working.** Your job is to work through the entire todo list until all asserts pass. Do not stop early.
- **Use the notebook well.** Markdown cells are your thinking tool. Use them to explain your understanding before writing code. This helps you catch mistakes in understanding before they become mistakes in code.
- **Be precise with the todo list.** Check off items only after their asserts pass. The todo list is your progress tracker — it should always reflect the true state of your work.
"""
