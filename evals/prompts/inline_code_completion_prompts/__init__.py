
from evals.prompts.inline_code_completion_prompts.prod_prompt_v1 import prod_prompt_v1
from evals.prompts.inline_code_completion_prompts.prod_prompt_v2 import prod_prompt_v2


INLINE_CODE_COMPLETION_PROMPT_GENERATORS = [
    prod_prompt_v1,
    prod_prompt_v2,
]
