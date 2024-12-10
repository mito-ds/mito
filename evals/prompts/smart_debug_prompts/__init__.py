
from evals.prompts.smart_debug_prompts.prod_prompt_v1 import prod_prompt_v1_generator
from evals.prompts.smart_debug_prompts.prod_prompt_v2 import prod_prompt_v2_generator

SMART_DEBUG_PROMPT_GENERATORS = [
    prod_prompt_v1_generator,
    prod_prompt_v2_generator
]
