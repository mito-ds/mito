from typing import List
from evals.eval_types import CodeGenTestCase

# Code Gen Tests
from evals.test_cases.code_gen_tests.variable_tests import VARIABLE_TESTS
from evals.test_cases.code_gen_tests.dataframe_creation_tests import DATAFRAME_CREATION_TESTS
from evals.test_cases.code_gen_tests.dataframe_transformation_tests import DATAFRAME_TRANSFORMATION_TESTS
from evals.test_cases.code_gen_tests.function_tests import FUNCTION_TESTS
from evals.test_cases.code_gen_tests.multistep_tests import MULTISTEP_TESTS

CODE_GEN_TESTS: List[CodeGenTestCase] = [
    *VARIABLE_TESTS,
    *DATAFRAME_CREATION_TESTS,
    *DATAFRAME_TRANSFORMATION_TESTS,
    *FUNCTION_TESTS,
    *MULTISTEP_TESTS
] 
