# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.prompts.inline_code_completion_prompts.prod_prompt_v1 import prod_prompt_v1
from evals.prompts.inline_code_completion_prompts.prod_prompt_v2 import prod_prompt_v2
from evals.prompts.inline_code_completion_prompts.prod_prompt_v3 import prod_prompt_v3
from evals.prompts.inline_code_completion_prompts.prod_prompt_v4 import prod_prompt_v4


INLINE_CODE_COMPLETION_PROMPT_GENERATORS = [
    prod_prompt_v1,
    prod_prompt_v2,
    prod_prompt_v3,
    prod_prompt_v4,
]
