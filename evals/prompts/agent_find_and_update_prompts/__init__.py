
from typing import List
from evals.eval_types import AgentFindAndUpdatePromptGenerator
from evals.prompts.agent_find_and_update_prompts.simple_prompt import prod_prompt_v1

AGENT_PROMPTS: List[AgentFindAndUpdatePromptGenerator] = [
    prod_prompt_v1,
]
