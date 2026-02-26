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

## Workflow

### Step 1: Explore the Excel File

Your first task is to understand what the Excel file does. Open the file twice using openpyxl:

- Once with `data_only=False` to read the formulas. The formulas are your source of truth for the logic.
- Once with `data_only=True` to read the computed values. These are your ground truth for testing.

In a Markdown cell, document what you find:

- What sheets exist and what each one appears to do
- Which cells contain formulas vs. hardcoded data
- Any cross-sheet references
- Any patterns you notice (lookup tables, running totals, conditional logic, etc.)
- Anything that may be tricky to convert (circular references, volatile functions like NOW() or RAND(), pivot tables, macros)

Keep both workbook objects available in the notebook for reference throughout your work.

### Step 2: Identify Outputs and Inputs

In a Markdown cell, clearly document:

- **Outputs:** What does this spreadsheet ultimately produce? Which cells, ranges, or sheets represent the final results?
- **Inputs:** There are two types of inputs: data and configurable inputs. 
    - For the data, ie: a big table of data that the workbook relies on, you should load the data into a Dataframe. You can use multiple dataframes. 
    - For configuration options, like beginning_date, interest_rate, number_of_periods, etc. these inputs should all go into the single configuration cell at the top so the user can change them to run different scenarios.

Be specific — reference sheet names, cell ranges, and describe what each represents.

### Step 3: Trace the Dependency Chain

Working backward from the outputs, trace how each output is computed. Follow the formula references to understand the chain of calculations from inputs to outputs.

In a Markdown cell, document the dependency chain. This gives you the order in which you must implement things — you always implement dependencies before the things that depend on them.

### Step 4: Create a Plan

Write a Markdown cell containing:

1. **A todo list** with one item per logical step you need to implement, ordered so that dependencies come first. Use checkbox syntax so you can mark items as complete. The first implementation step should be creating the configuration cell:

   - [ ] Create configuration cell at top (all inputs: e.g. beg_date, end_date, interest_rate, number_of_periods, etc.)
   - [ ] Load input data
   - [ ] Compute X from inputs
   - [ ] Compute Y from X
   - [ ] Compute final output from Y

2. **The Python structure** you intend to use — what will be a DataFrame, what will be a variable, what will be a function. Decide this up front so you're not restructuring mid-way, unless you decide you need to update your plan based on future learnings. Then, you can come back and update the plan in this markdown cell.

### Step 5: Capture Ground Truth as Assert Statements

Before writing any implementation code, extract the computed values from the Excel file (using your `data_only=True` workbook) and write assert statements.

- Write asserts for intermediate values, not just final outputs. These are your debugging checkpoints.
- Write asserts for final output values. These are your completion criteria.
- Each group of related asserts should be in its own code cell, labeled with a preceding Markdown cell explaining what it tests.
- For floating point comparisons, use an appropriate tolerance (e.g., `abs(result - expected) < 0.01` or `round()`).

Do not run these cells yet. They will fail because you haven't implemented anything. You will run them incrementally as you implement each piece.

### Step 6: Implement Iteratively

This is the core of your work. For each item on your todo list, follow this cycle:

1. Write a Markdown cell explaining what Excel logic you are about to convert and how you intend to implement it in Python. Reference the specific formulas from the Excel file.
2. Write a code cell that implements that logic.
3. Run the corresponding assert cell(s) for this step.
4. If the asserts pass: Check off the todo item and move to the next one.
5. If an assert fails: Debug and fix the code before moving on. Do not proceed to the next step with failing asserts. Compare your result to the expected value, re-examine the Excel formula, and correct your implementation.

Do not batch work. Implement one logical step, test it, confirm it works, then move to the next. Tight loops, not big batches.

### Step 7: Final Validation

Once every todo item is checked off, run all assert cells together as a final confirmation. Every assert must pass. If any fail, go back and fix them.

## Rules

- **One configuration cell at the top.** All user-changeable inputs (dates, rates, periods, and any other scenario inputs) must live in a single code cell at the top of the notebook. Downstream code uses these variables only — no magic numbers or repeated literals for inputs. This is so the user can try different scenarios by editing one place and re-running.
- **Formulas are the source of truth.** Always read the Excel formulas to understand logic. Do not guess the logic from data values alone.
- **Test constantly.** Every implementation step must be followed by running its asserts. Never write more than one logical step without testing.
- **Fix before proceeding.** If an assert fails, fix it before moving on. Do not accumulate broken steps.
- **Asserts define done.** You are not finished until all asserts pass. Do not stop to ask if things look right — the asserts tell you.
- **Keep working.** Your job is to work through the entire todo list until all asserts pass. Do not stop early.
- **Use the notebook well.** Markdown cells are your thinking tool. Use them to explain your understanding before writing code. This helps you catch mistakes in understanding before they become mistakes in code.
- **Be precise with the todo list.** Check off items only after their asserts pass. The todo list is your progress tracker — it should always reflect the true state of your work.
"""
