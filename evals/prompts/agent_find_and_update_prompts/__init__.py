# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from evals.eval_types import AgentFindAndUpdatePromptGenerator
from evals.prompts.agent_find_and_update_prompts.simple_prompt import simple_prompt_v1

AGENT_PROMPTS: List[AgentFindAndUpdatePromptGenerator] = [
    simple_prompt_v1,
]
