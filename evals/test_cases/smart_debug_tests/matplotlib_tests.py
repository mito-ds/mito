from evals.eval_types import SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK, LOANS_DF_NOTEBOOK, MESSY_DATA_NOTEBOOK, STOCK_MARKET_DATA_NOTEBOOK, USED_CARS_DF_NOTEBOOK

'''
When writing tests for matplotlib, exclude `plt.show()` from the code.
Displaying the plot will cause the test to pause until the user closes the plot window.
'''

MATPLOTLIB_TESTS = [
    SmartDebugTestCase(
        name="axis_w_different_lengths",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
import matplotlib.pyplot as plt

x = [1, 2, 3, 4, 5]
y = [1, 2, 3, 4, 5, 6]

plt.plot(x, y)
""",
        correct_code="""
import matplotlib.pyplot as plt

x = [1, 2, 3, 4, 5]
y = [1, 2, 3, 4, 5]

plt.plot(x, y)
""",
        workflow_tags=['matplotlib'],
        type_tags=['ValueError']
    ),
    SmartDebugTestCase(
        name="bar_chart_missing_y_values",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
import matplotlib.pyplot as plt

categories = ['A', 'B', 'C']
values = [5, 7, 3]

plt.bar(categories)
plt.xlabel('Categories')
plt.ylabel('Values')
plt.title('Bar Chart')
""",
        correct_code="""
import matplotlib.pyplot as plt

categories = ['A', 'B', 'C']
values = [5, 7, 3]

plt.bar(categories, values)
plt.xlabel('Categories')
plt.ylabel('Values')
plt.title('Bar Chart')
""",
        workflow_tags=['matplotlib'],
        type_tags=['TypeError']
    ),
    SmartDebugTestCase(
        name="incorrectly_applied_log_scale",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
import matplotlib.pyplot as plt

x = [1, 10, 100, 1000, 10000]
y = [10, 100, 1000, 10000, 100000]

plt.plot(x, y)
plt.yscale('logarithmic')
plt.xlabel('X-axis')
plt.ylabel('Y-axis (log scale)')
""",
        correct_code="""
import matplotlib.pyplot as plt

x = [1, 10, 100, 1000, 10000]
y = [10, 100, 1000, 10000, 100000]

plt.plot(x, y)
plt.yscale('log')
plt.xlabel('X-axis')
plt.ylabel('Y-axis (log scale)')
""",
        workflow_tags=['matplotlib'],
        type_tags=['ValueError']
    ),
    SmartDebugTestCase(
        name="minor_tick_locator_type_error",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
import matplotlib.pyplot as plt

x = [0.1, 0.2, 0.3, 0.4, 0.5]
y = [1, 4, 9, 16, 25]

plt.plot(x, y)
plt.xticks([0.1, 0.2, 0.3], labels=[0.1, 0.2, 0.3])
plt.minorticks_on()
plt.gca().xaxis.set_minor_locator([0.15, 0.25, 0.35])
""",
        correct_code="""
import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator

x = [0.1, 0.2, 0.3, 0.4, 0.5]
y = [1, 4, 9, 16, 25]

plt.plot(x, y)
plt.xticks([0.1, 0.2, 0.3], labels=[0.1, 0.2, 0.3])
plt.minorticks_on()
plt.gca().xaxis.set_minor_locator(MultipleLocator(0.05))
""",
        workflow_tags=['matplotlib'],
        type_tags=['TypeError']
    ),
    SmartDebugTestCase(
        name="scatter_colors_length_mismatch",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
import matplotlib.pyplot as plt
import numpy as np

x = np.random.rand(10)
y = np.random.rand(10)
colors = ['red', 'blue', 'green']  # Only 3 colors for 10 points
colors_length = len(colors)

plt.scatter(x, y, c=colors)
plt.xlabel('X values')
plt.ylabel('Y values')
plt.title('Red Scatter Plot')
""",
        correct_code="""
import matplotlib.pyplot as plt
import numpy as np

x = np.random.rand(10)
y = np.random.rand(10)
colors = ['red'] * 10  # One color for each point
colors_length = len(colors)

plt.scatter(x, y, c=colors)
plt.xlabel('X values')
plt.ylabel('Y values')
plt.title('Red Scatter Plot')
""",
        variables_to_compare=['colors_length'],
        workflow_tags=['matplotlib'],
        type_tags=['ValueError']
    )
]
