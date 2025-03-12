'''
This test will not run in CI, but you can run it locally with:
RUN_PERFORMANCE_TESTS=true python -m pytest mito_ai/tests/performance_test.py -v -s
'''

import time
import os
import pytest
import openai
from typing import List, Dict, Any, Tuple, Optional, cast

from openai.types.chat import ChatCompletionMessageParam
from mito_ai.providers import OpenAIProvider
from mito_ai.models import MessageType
from mito_ai.tests.data.prompt_sm import prompt_sm
from mito_ai.tests.data.prompt_lg import prompt_lg
from mito_ai.tests.data.prompt_xl import prompt_xl

TEST_MODEL = "o3-mini"
NUM_ITERATIONS = 10  # Number of requests to make for each test
MAX_ACCEPTABLE_LATENCY_SMALL_PROMPT = 10_000  # in ms
MAX_ACCEPTABLE_LATENCY_LARGE_PROMPT = 15_000
MAX_ACCEPTABLE_LATENCY_XL_PROMPT = 20_000

# Environment variable to control whether performance tests run in CI
RUN_PERFORMANCE_TESTS = os.environ.get("RUN_PERFORMANCE_TESTS", "false").lower() == "true"
IS_CI = os.environ.get("CI", "false").lower() == "true"

# Test messages for all performance tests
SMALL_TEST_MESSAGE: List[ChatCompletionMessageParam] = [
    {"role": "user", "content": prompt_sm}
]
LARGE_TEST_MESSAGE: List[ChatCompletionMessageParam] = [
    cast(
        ChatCompletionMessageParam,
        {"role": prompt_lg[i]["role"], "content": prompt_lg[i]["content"]},
    )
    for i in range(len(prompt_lg))
]
XL_TEST_MESSAGE: List[ChatCompletionMessageParam] = [
    cast(
        ChatCompletionMessageParam,
        {"role": prompt_xl[i]["role"], "content": prompt_xl[i]["content"]},
    )
    for i in range(len(prompt_xl))
]

# Dictionary to store performance metrics for all tests
ALL_METRICS: Dict[str, Dict[str, Any]] = {}


async def run_llm_requests(
    llm: OpenAIProvider,
    messages: List[ChatCompletionMessageParam],
    n: int = NUM_ITERATIONS,
) -> Tuple[List[Optional[str]], Dict[str, Any]]:
    """
    Run LLM requests n times and collect performance metrics.

    Args:
        llm: The OpenAIProvider instance to use
        messages: The messages to send to the LLM
        n: Number of requests to make (default: NUM_ITERATIONS)

    Returns:
        Tuple containing:
        - List of completion responses
        - Dictionary with performance metrics (min, max, avg latency)
    """
    completions: List[Optional[str]] = []
    latencies: List[int] = []
    errors: List[str] = []

    for i in range(n):
        try:
            start_time = time.time()
            completion = await llm.request_completions(
                message_type=MessageType.CHAT, messages=messages, model=TEST_MODEL
            )
            end_time = time.time()

            latency_ms = round((end_time - start_time) * 1000)
            latencies.append(latency_ms)
            completions.append(completion)

            print(f"Request {i+1}/{n} latency: {latency_ms} ms")
        except openai.APIError as e:
            error_msg = f"Request {i+1}/{n} failed: {str(e)}"
            errors.append(str(e))
            print(error_msg)
            completions.append(None)  # Add None for failed completions
        except Exception as e:
            error_msg = f"Request {i+1}/{n} failed: {str(e)}"
            errors.append(str(e))
            print(error_msg)
            completions.append(None)  # Add None for failed completions

    # Calculate stats on successful requests
    successful_requests = len(latencies)
    failed_requests = len(errors)

    metrics: Dict[str, Any] = {
        "total_requests": n,
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
    }

    if successful_requests > 0:
        avg_latency = sum(latencies) / successful_requests
        metrics["avg_latency_ms"] = round(avg_latency)
        metrics["min_latency_ms"] = min(latencies) if latencies else None
        metrics["max_latency_ms"] = max(latencies) if latencies else None
        metrics["all_latencies_ms"] = latencies
    else:
        metrics["avg_latency_ms"] = None
        metrics["min_latency_ms"] = None
        metrics["max_latency_ms"] = None
        metrics["all_latencies_ms"] = []

    return completions, metrics


async def run_direct_openai_requests(
    client: openai.OpenAI,
    messages: List[ChatCompletionMessageParam],
    n: int = NUM_ITERATIONS,
) -> Tuple[List[Optional[str]], Dict[str, Any]]:
    """
    Run direct OpenAI requests n times and collect performance metrics.

    Args:
        client: The OpenAI client instance
        messages: The messages to send to the API
        n: Number of requests to make (default: NUM_ITERATIONS)

    Returns:
        Tuple containing:
        - List of completion responses
        - Dictionary with performance metrics (min, max, avg latency)
    """
    completions: List[Optional[str]] = []
    latencies: List[int] = []
    errors: List[str] = []

    for i in range(n):
        try:
            start_time = time.time()
            response = client.chat.completions.create(
                model=TEST_MODEL, messages=messages
            )
            completion = response.choices[0].message.content
            end_time = time.time()

            latency_ms = round((end_time - start_time) * 1000)
            latencies.append(latency_ms)
            completions.append(completion)

            print(f"Direct OpenAI request {i+1}/{n} latency: {latency_ms} ms")
        except openai.APIError as e:
            error_msg = f"Direct OpenAI request {i+1}/{n} failed: {str(e)}"
            errors.append(str(e))
            print(error_msg)
            completions.append(None)  # Add None for failed completions
        except Exception as e:
            error_msg = f"Direct OpenAI request {i+1}/{n} failed: {str(e)}"
            errors.append(str(e))
            print(error_msg)
            completions.append(None)  # Add None for failed completions

    # Calculate stats on successful requests
    successful_requests = len(latencies)
    failed_requests = len(errors)

    metrics: Dict[str, Any] = {
        "total_requests": n,
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
    }

    if successful_requests > 0:
        avg_latency = sum(latencies) / successful_requests
        metrics["avg_latency_ms"] = round(avg_latency)
        metrics["min_latency_ms"] = min(latencies) if latencies else None
        metrics["max_latency_ms"] = max(latencies) if latencies else None
        metrics["all_latencies_ms"] = latencies
    else:
        metrics["avg_latency_ms"] = None
        metrics["min_latency_ms"] = None
        metrics["max_latency_ms"] = None
        metrics["all_latencies_ms"] = []

    return completions, metrics


# This fixture runs after all tests and prints the metrics summary
@pytest.fixture(scope="session", autouse=True)
def print_metrics_summary(request):
    """Print a summary of all collected metrics after all tests have run."""
    yield  # This ensures the code below runs after all tests

    if ALL_METRICS:
        print("\n\n" + "=" * 100)
        print("PERFORMANCE TEST RESULTS SUMMARY")
        print("=" * 100)

        # Print in a table format
        headers = [
            "Test",
            "Success/Total",
            "Success %",
            "Avg Latency (ms)",
            "Min Latency (ms)",
            "Max Latency (ms)",
        ]
        row_format = "{:<25} {:<15} {:<10} {:<18} {:<18} {:<18}"

        print(row_format.format(*headers))
        print("-" * 100)

        for test_name, metrics in ALL_METRICS.items():
            success_rate = "N/A"
            if "total_requests" in metrics and metrics["total_requests"] > 0:
                success_rate = f"{(metrics.get('successful_requests', 0) / metrics['total_requests']) * 100:.1f}%"

            success_total = f"{metrics.get('successful_requests', 'N/A')}/{metrics.get('total_requests', 'N/A')}"

            row = [
                test_name,
                success_total,
                success_rate,
                metrics.get("avg_latency_ms", "N/A"),
                metrics.get("min_latency_ms", "N/A"),
                metrics.get("max_latency_ms", "N/A"),
            ]
            print(row_format.format(*row))

        print("=" * 100)


@pytest.mark.skipif(IS_CI, reason="Performance tests are skipped in CI environments")
@pytest.mark.asyncio
async def test_server_key_performance() -> None:
    """Test the performance of the OpenAI provider when using the server key."""
    # Save the original API key if it exists
    original_api_key = os.environ.get("OPENAI_API_KEY", "")

    try:
        # Ensure we're using the server key by clearing the API key in environment
        os.environ["OPENAI_API_KEY"] = ""

        # Initialize the provider
        llm = OpenAIProvider()

        # print("\nRunning small prompt")
        # completions_sm, metrics_sm = await run_llm_requests(llm, SMALL_TEST_MESSAGE)
        # ALL_METRICS["Server Key (sm prompt)"] = metrics_sm

        # print("\nRunning large prompt")
        # completions_lg, metrics_lg = await run_llm_requests(llm, LARGE_TEST_MESSAGE)
        # ALL_METRICS["Server Key (lg prompt)"] = metrics_lg

        print("\nRunning xl prompt")
        completions_xl, metrics_xl = await run_llm_requests(llm, XL_TEST_MESSAGE)
        ALL_METRICS["Server Key (xl prompt)"] = metrics_xl


        # if metrics_sm["successful_requests"] > 0:
        #     assert (
        #         metrics_sm["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_SMALL_PROMPT
        #     ), f"Server key completion (small prompt) took too long: {metrics_sm['max_latency_ms']} ms"

        # if metrics_lg["successful_requests"] > 0:
        #     assert (
        #         metrics_lg["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_LARGE_PROMPT
        #     ), f"Server key completion (large prompt) took too long: {metrics_lg['max_latency_ms']} ms"

        # if metrics_xl["successful_requests"] > 0:
        #     assert (
        #         metrics_xl["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_XL_PROMPT
        #     ), f"Server key completion (xl prompt) took too long: {metrics_xl['max_latency_ms']} ms"

    finally:
        # Restore the original API key
        os.environ["OPENAI_API_KEY"] = original_api_key


@pytest.mark.skipif(IS_CI, reason="Performance tests are skipped in CI environments")
@pytest.mark.asyncio
@pytest.mark.skip(reason="")
async def test_user_key_performance() -> None:
    """Test the performance of the OpenAI provider when using a user key."""
    # Skip test if no API key is available
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        pytest.skip("No OpenAI API key available in environment variables")

    # Initialize the provider (will use the API key from environment)
    llm = OpenAIProvider()

    # Test with small prompt
    completions_sm, metrics_sm = await run_llm_requests(llm, SMALL_TEST_MESSAGE)
    ALL_METRICS["User Key (sm prompt)"] = metrics_sm

    # Test with large prompt
    completions_lg, metrics_lg = await run_llm_requests(llm, LARGE_TEST_MESSAGE)
    ALL_METRICS["User Key (lg prompt)"] = metrics_lg

    # Verify we got at least some valid responses
    valid_completions_sm = [c for c in completions_sm if c is not None]
    valid_completions_lg = [c for c in completions_lg if c is not None]

    if metrics_sm["successful_requests"] > 0:
        assert (
            metrics_sm["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_SMALL_PROMPT
        ), f"User key completion (small prompt) took too long: {metrics_sm['max_latency_ms']} ms"

    if metrics_lg["successful_requests"] > 0:
        assert (
            metrics_lg["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_LARGE_PROMPT
        ), f"User key completion (large prompt) took too long: {metrics_lg['max_latency_ms']} ms"


@pytest.mark.skipif(IS_CI, reason="Performance tests are skipped in CI environments")
@pytest.mark.asyncio
@pytest.mark.skip(reason="")
async def test_direct_openai_performance() -> None:
    """Test the performance of direct OpenAI API calls (control group)."""
    # Skip test if no API key is available
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        pytest.skip("No OpenAI API key available in environment variables")

    # Initialize the OpenAI client directly
    client = openai.OpenAI(api_key=api_key)

    # Test with small prompt
    completions_sm, metrics_sm = await run_direct_openai_requests(
        client, SMALL_TEST_MESSAGE
    )
    ALL_METRICS["Direct OpenAI (sm prompt)"] = metrics_sm

    # Test with large prompt
    completions_lg, metrics_lg = await run_direct_openai_requests(
        client, LARGE_TEST_MESSAGE
    )
    ALL_METRICS["Direct OpenAI (lg prompt)"] = metrics_lg

    if metrics_sm["successful_requests"] > 0:
        assert (
            metrics_sm["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_SMALL_PROMPT
        ), f"Direct OpenAI completion (small prompt) took too long: {metrics_sm['max_latency_ms']} ms"

    if metrics_lg["successful_requests"] > 0:
        assert (
            metrics_lg["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_LARGE_PROMPT
        ), f"Direct OpenAI completion (large prompt) took too long: {metrics_lg['max_latency_ms']} ms"
