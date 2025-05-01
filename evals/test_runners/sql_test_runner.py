import json
from typing import List, Optional
from evals.prompts.chat_prompts.production_prompt_w_sql import _ProductionPromptWithSQL
from evals.ai_api_calls.get_open_ai_completion import (
    get_open_ai_completion_code_block,
    get_sql_from_message,
)
from evals.test_cases.sql_tests import SQL_TESTS


def run_sql_tests(
    test_name: Optional[str],
    prompt_name: Optional[str],
    tags: Optional[List[str]],
    model: Optional[str],
):
    for test in SQL_TESTS:
        print(test)

        schema = json.load(open(f"evals/data/schemas/{test['schema']}"))

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
        user_prompt = prompt_generator.get_prompt(
            test["user_input"], test["notebook_state"]
        )

        ai_generated_code = get_open_ai_completion_code_block(
            user_prompt, "gpt-4.1", system_prompt
        )
        print(ai_generated_code)

        sql_details = get_sql_from_message(ai_generated_code, "gpt-4.1")
        print(sql_details)
