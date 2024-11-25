from evals.prompts.single_shot_prompt import single_shot_prompt_generator
from evals.prompts.multi_shot_prompt import multi_shot_prompt_generator
from evals.prompts.production_prompt_v1 import production_prompt_v1_generator

PROMPT_GENERATORS = [
    single_shot_prompt_generator,
    multi_shot_prompt_generator,
    production_prompt_v1_generator
]
