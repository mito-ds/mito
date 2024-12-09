from evals.eval_types import CodeGenTestCase, CodeGenTestCaseCore, SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK


SMART_DEBUG_TESTS = [
    SmartDebugTestCase(
        name="error_missing_quote_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="x='aaron",
        correct_code="x='aaron'",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name="missing_colon_in_function_definition_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code=""""
def my_sum(x, y)
    return x + y

sum_one = my_sum(1, 2)
sum_two = my_sum(3, 4)""",
        correct_code="""
def my_sum(x, y):
    return x + y

sum_one = my_sum(1, 2)
sum_two = my_sum(3, 4)""",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name="single_equals_sign_in_if_statement_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
x = 1
if x = 1:
    print("x is 1")
else:
    print("x is not 1")
""",
        correct_code="""
x = 1
if x == 1:
    print("x is 1")
else:
    print("x is not 1")
""",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name="output_comparison_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="print('hello world)",
        correct_code="print('hello world')",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name="missing_datetime_import_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
today = datetime.today().strftime('%Y-%m-%d')
""",
        correct_code="""
from datetime import datetime
today = datetime.today().strftime('%Y-%m-%d')
""",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name="variable_name_typo_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
aaron_age = 27
aaron_age = Aaron_age + 1
""",
        correct_code="""
aaron_age = 27
aaron_age = aaron_age + 1
""",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name='function_indentation_error_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
def my_sum(x, y):
return x + y

sum_one = my_sum(1, 2)
sum_two = my_sum(3, 4)
""",
        correct_code="""
def my_sum(x, y):
    return x + y

sum_one = my_sum(1, 2)
sum_two = my_sum(3, 4)
""",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name='string_integer_operations_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
y = '5'
x = y + 27
""",
        correct_code="""
y = 5
x = y + 27
""",
        tags=['simple'],
        variables_to_compare=['x']
    ),
    SmartDebugTestCase(
        name='incorrect_function_call_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
def my_sum(x, y):
    return x + y

x = my_sum 1, 2
""",
        correct_code="""
def my_sum(x, y):
    return x + y

x = my_sum(1, 2)
""",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name='missing_package_installation_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
import matplotlib.pyplot as plt
import numpy as np

plt.style.use('_mpl-gallery')

# make data
x = np.linspace(0, 10, 100)
y = 4 + 1 * np.sin(2 * x)
x2 = np.linspace(0, 10, 25)
y2 = 4 + 1 * np.sin(2 * x2)

# plot
fig, ax = plt.subplots()

ax.plot(x2, y2 + 2.5, 'x', markeredgewidth=2)
ax.plot(x, y, linewidth=2.0)
ax.plot(x2, y2 - 2.5, 'o-', linewidth=2)

ax.set(xlim=(0, 8), xticks=np.arange(1, 8),
       ylim=(0, 8), yticks=np.arange(1, 8))
""",
        correct_code="""
!pip install matplotlib
import matplotlib.pyplot as plt
import numpy as np

plt.style.use('_mpl-gallery')

# make data
x = np.linspace(0, 10, 100)
y = 4 + 1 * np.sin(2 * x)
x2 = np.linspace(0, 10, 25)
y2 = 4 + 1 * np.sin(2 * x2)

# plot
fig, ax = plt.subplots()

ax.plot(x2, y2 + 2.5, 'x', markeredgewidth=2)
ax.plot(x, y, linewidth=2.0)
ax.plot(x2, y2 - 2.5, 'o-', linewidth=2)

ax.set(xlim=(0, 8), xticks=np.arange(1, 8),
       ylim=(0, 8), yticks=np.arange(1, 8))
""",
        tags=['simple']
    )
]