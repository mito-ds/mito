from typing import List
from evals.eval_types import TestCase
from .variable_tests import VARIABLE_TESTS
from .dataframe_creation_tests import DATAFRAME_CREATION_TESTS
from .dataframe_transformation_tests import DATAFRAME_TRANSFORMATION_TESTS
from .function_tests import FUNCTION_TESTS
from .multistep_tests import MULTISTEP_TESTS

TESTS: List[TestCase] = [
    *VARIABLE_TESTS,
    *DATAFRAME_CREATION_TESTS,
    *DATAFRAME_TRANSFORMATION_TESTS,
    *FUNCTION_TESTS,
    *MULTISTEP_TESTS
] 