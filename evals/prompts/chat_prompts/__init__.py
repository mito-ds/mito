# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.prompts.chat_prompts.single_shot_prompt import single_shot_prompt_generator
from evals.prompts.chat_prompts.multi_shot_prompt import multi_shot_prompt_generator
from evals.prompts.chat_prompts.production_prompt_v1 import production_prompt_v1_generator
from evals.prompts.chat_prompts.production_prompt_v2 import production_prompt_v2_generator
from evals.prompts.chat_prompts.production_prompt_v3 import production_prompt_v3_generator
from evals.prompts.chat_prompts.production_prompt_schema import production_prompt_schema_generator

CHAT_PROMPT_GENERATORS = [
    single_shot_prompt_generator,
    multi_shot_prompt_generator,
    production_prompt_v1_generator,
    production_prompt_v2_generator,
    production_prompt_v3_generator,
    production_prompt_schema_generator
]
