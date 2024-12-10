from evals.eval_types import SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK, LOANS_DF_NOTEBOOK, MESSY_DATA_NOTEBOOK, STOCK_MARKET_DATA_NOTEBOOK, USED_CARS_DF_NOTEBOOK

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
        tags=['simple', 'matplotlib']
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
        tags=['simple', 'matplotlib']
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
        tags=['matplotlib']
    )
]
