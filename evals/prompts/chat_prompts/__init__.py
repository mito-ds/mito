from evals.prompts.chat_prompts.single_shot_prompt import single_shot_prompt_generator
from evals.prompts.chat_prompts.multi_shot_prompt import multi_shot_prompt_generator
from evals.prompts.chat_prompts.production_prompt_v1 import production_prompt_v1_generator
from evals.prompts.chat_prompts.production_prompt_v2 import production_prompt_v2_generator

CHAT_PROMPT_GENERATORS = [
    single_shot_prompt_generator,
    multi_shot_prompt_generator,
    production_prompt_v1_generator,
    production_prompt_v2_generator
]
