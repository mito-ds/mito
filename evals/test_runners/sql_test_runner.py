# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import subprocess
import sys
from tqdm import tqdm
from datetime import datetime
from typing import List, Optional
from dataclasses import asdict
from evals.prompts.chat_prompts.production_prompt_w_sql import _ProductionPromptWithSQL
from evals.ai_api_calls.get_open_ai_completion import (
    get_open_ai_completion_code_block,
    get_sql_from_message,
)
from evals.test_cases.sql_tests import SQL_TESTS
from evals.funnels.sql.default import default_test_funnel
from evals.funnels.sql.steps import FunnelStepResult

DEFAULT_MODEL = "gpt-4.1"
DEFAULT_MODEL_SQL_EXTRACTOR = "gpt-4.1"


class FunnelStepResultEncoder(json.JSONEncoder):
    # This is a custom JSON encoder for FunnelStepResult objects.
    # It converts the FunnelStepResult objects to dictionaries
    # so that they can be serialized to JSON.
    def default(self, obj):
        if isinstance(obj, FunnelStepResult):
            return asdict(obj)
        return super().default(obj)


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

    # Create the reports directory if it doesn't exist
    os.makedirs("evals/reports", exist_ok=True)

    # Save the results
    final_results = []

    for test_case in tqdm(SQL_TESTS):
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
        user_prompt = prompt_generator.get_prompt(
            test_case.user_input, test_case.notebook_state
        )

        # Get the SQL from the AI
        ai_generated_code = get_open_ai_completion_code_block(
            user_prompt,
            DEFAULT_MODEL if model is None else model,
            system_prompt,
        )

        # Extract the SQL from the AI's response
        parsed_actual_sql = get_sql_from_message(
            ai_generated_code,
            DEFAULT_MODEL_SQL_EXTRACTOR,
        )

        # Extract SQL details from the expected output
        parsed_expected_sql = get_sql_from_message(
            test_case.expected_output or "",
            DEFAULT_MODEL_SQL_EXTRACTOR,
        )

        # Run through the funnel
        results = default_test_funnel(
            test_case, parsed_actual_sql, parsed_expected_sql, schema
        )
        
        # Get test type by finding which array contains the test case
        # For example, if test_case is in JOIN_TESTS, the test_type will be "join_tests"
        test_type = next(
            (name for name, array in globals().items() 
             if isinstance(array, list) and name != "SQL_TESTS" and test_case in array),
            None
        )
        results["test_type"] = test_type
        results["schema"] = test_case.schema
        final_results.append(results)

    # Write the results to a file
    with open(
        f"evals/reports/sql_test_results_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.json",
        "w",
    ) as f:
        json.dump(final_results, f, cls=FunnelStepResultEncoder)

    # Launch the streamlit dashboard
    dashboard_path = os.path.join(
        os.path.dirname(__file__), "..", "reporting", "sql_dashboard.py"
    )
    subprocess.run([sys.executable, "-m", "streamlit", "run", dashboard_path])
