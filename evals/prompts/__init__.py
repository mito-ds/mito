from evals.prompts.single_shot_prompt import single_shot_prompt_generator
from evals.prompts.multi_shot_prompt import multi_shot_prompt_generator

PROMPT_GENERATORS = [
    single_shot_prompt_generator,
    multi_shot_prompt_generator
]