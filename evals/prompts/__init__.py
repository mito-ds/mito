from evals.prompts.multi_shot_prompt import MultiShotPromptGenerator
from evals.prompts.single_shot_prompt import SingleShotPromptGenerator


PROMPT_GENERATORS = [
    MultiShotPromptGenerator(),
    SingleShotPromptGenerator()
]