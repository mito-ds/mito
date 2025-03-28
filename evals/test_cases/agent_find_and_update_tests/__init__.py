# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from evals.eval_types import ChatTestCase

# Agent Tests
from evals.test_cases.agent_find_and_update_tests.simple import SIMPLE_TESTS, AgentFindAndUpdateTestCase

AGENT_TESTS: List[AgentFindAndUpdateTestCase] = [
    *SIMPLE_TESTS,
] 
