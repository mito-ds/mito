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
]
