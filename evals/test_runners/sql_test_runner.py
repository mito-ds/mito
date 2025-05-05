import json
import os
from typing import List, Optional
from evals.prompts.chat_prompts.production_prompt_w_sql import _ProductionPromptWithSQL
from evals.ai_api_calls.get_open_ai_completion import (
    get_open_ai_completion_code_block,
    get_sql_from_message,
)
from evals.test_cases.sql_tests import SQL_TESTS
from evals.funnels.sql.default import default_test_funnel

DEFAULT_MODEL = "gpt-4.1"
DEFAULT_MODEL_SQL_EXTRACTOR = "gpt-4.1"


def run_sql_tests(
    test_name: Optional[str],
    prompt_name: Optional[str],
    tags: Optional[List[str]],
    model: Optional[str],
):
    # Before running any tests, make sure the .env file is present
    if not os.path.exists("evals/.env"):
        raise FileNotFoundError(
            "The .env file is not present. Please create one based on the .env.sample file."
        )

    for test_case in SQL_TESTS:
        # Load the schema, to be included in the system prompt
        schema = json.load(open(f"evals/data/schemas/{test_case.schema}"))

        # Generate the prompts
        # Using dummy credentials for now, the funnel uses the actual credentials
        # from the .env file.
        prompt_generator = _ProductionPromptWithSQL(
            schemas=schema,
            connections=json.dumps(
                {
                    "snowflake": {
                        "username": "replace_me",
                        "password": "replace_me",
                        "account": "replace_me",
                        "warehouse": "replace_me",
                    }
                }
            ),
        )
        system_prompt = prompt_generator.system_prompt
        user_prompt = prompt_generator.get_prompt(test_case.user_input, test_case.notebook_state)

        # Get the SQL from the AI
        ai_generated_code = get_open_ai_completion_code_block(
            user_prompt,
            DEFAULT_MODEL if model is None else model,
            system_prompt,
        )

        # Extract the SQL from the AI's response
        parsed_sql_details = get_sql_from_message(
            ai_generated_code,
            DEFAULT_MODEL_SQL_EXTRACTOR,
        )

        # Run through the funnel
        default_test_funnel(test_case, parsed_sql_details, schema)
