import time
import os
import pytest
import openai
from typing import List, Dict, Any, Tuple

from openai.types.chat import ChatCompletionMessageParam
from mito_ai.providers import OpenAIProvider
from mito_ai.models import MessageType
from mito_ai.tests.data.prompt_sm import prompt_sm
from mito_ai.tests.data.prompt_lg import prompt_lg

# Test messages for all performance tests
SMALL_TEST_MESSAGE: List[ChatCompletionMessageParam] = [
    {"role": "user", "content": prompt_sm}
]
LARGE_TEST_MESSAGE: List[ChatCompletionMessageParam] = [
    {"role": "user", "content": prompt_lg}
]
TEST_MODEL = "gpt-4o-mini"
NUM_ITERATIONS = 3  # Number of requests to make for each test

# Dictionary to store performance metrics for all tests
ALL_METRICS = {}


async def run_llm_requests(
    llm: OpenAIProvider, 
    messages: List[ChatCompletionMessageParam],
    n: int = NUM_ITERATIONS
) -> Tuple[List[str], Dict[str, Any]]:
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
    completions = []
    latencies = []

    for i in range(n):
        start_time = time.time()
        completion = await llm.request_completions(
            message_type=MessageType.CHAT, messages=messages, model=TEST_MODEL
        )
        end_time = time.time()

        latency_ms = round((end_time - start_time) * 1000)
        latencies.append(latency_ms)
        completions.append(completion)

        print(f"Request {i+1} latency: {latency_ms} ms")

    # Calculate stats
    avg_latency = sum(latencies) / len(latencies)
    min_latency = min(latencies)
    max_latency = max(latencies)

    metrics = {
        "avg_latency_ms": round(avg_latency),
        "min_latency_ms": min_latency,
        "max_latency_ms": max_latency,
        "all_latencies_ms": latencies,
    }

    return completions, metrics


async def run_direct_openai_requests(
    client: openai.OpenAI,
    messages: List[ChatCompletionMessageParam],
    n: int = NUM_ITERATIONS
) -> Tuple[List[str], Dict[str, Any]]:
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
    completions = []
    latencies = []

    for i in range(n):
        start_time = time.time()
        response = client.chat.completions.create(
            model=TEST_MODEL, messages=messages
        )
        completion = response.choices[0].message.content
        end_time = time.time()

        latency_ms = round((end_time - start_time) * 1000)
        latencies.append(latency_ms)
        completions.append(completion)

        print(f"Direct OpenAI request {i+1} latency: {latency_ms} ms")

    # Calculate stats
    avg_latency = sum(latencies) / len(latencies)
    min_latency = min(latencies)
    max_latency = max(latencies)

    metrics = {
        "avg_latency_ms": round(avg_latency),
        "min_latency_ms": min_latency,
        "max_latency_ms": max_latency,
        "all_latencies_ms": latencies,
    }

    return completions, metrics


# This fixture runs after all tests and prints the metrics summary
@pytest.fixture(scope="session", autouse=True)
def print_metrics_summary(request):
    """Print a summary of all collected metrics after all tests have run."""
    yield  # This ensures the code below runs after all tests

    if ALL_METRICS:
        print("\n\n" + "=" * 80)
        print("PERFORMANCE TEST RESULTS SUMMARY")
        print("=" * 80)

        # Print in a table format
        headers = ["Test", "Avg Latency (ms)", "Min Latency (ms)", "Max Latency (ms)"]
        row_format = "{:<25} {:<18} {:<18} {:<18}"

        print(row_format.format(*headers))
        print("-" * 80)

        for test_name, metrics in ALL_METRICS.items():
            row = [
                test_name,
                metrics["avg_latency_ms"],
                metrics["min_latency_ms"],
                metrics["max_latency_ms"],
            ]
            print(row_format.format(*row))

        print("\nDetailed latencies (ms):")
        for test_name, metrics in ALL_METRICS.items():
            print(f"{test_name}: {metrics['all_latencies_ms']}")

        print("=" * 80)


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

        # Test with small prompt
        completions_sm, metrics_sm = await run_llm_requests(llm, SMALL_TEST_MESSAGE)
        ALL_METRICS["Server Key (Small Prompt)"] = metrics_sm
        
        # Test with large prompt
        completions_lg, metrics_lg = await run_llm_requests(llm, LARGE_TEST_MESSAGE)
        ALL_METRICS["Server Key (Large Prompt)"] = metrics_lg

        # Verify we got valid responses
        for completion in completions_sm + completions_lg:
            assert completion is not None and len(completion) > 0

        # Performance assertions - adjust threshold as needed
        assert (
            metrics_sm["avg_latency_ms"] < 10000
        ), f"Server key completion (small prompt) took too long: {metrics_sm['avg_latency_ms']} ms"
        
        assert (
            metrics_lg["avg_latency_ms"] < 15000
        ), f"Server key completion (large prompt) took too long: {metrics_lg['avg_latency_ms']} ms"

    finally:
        # Restore the original API key
        os.environ["OPENAI_API_KEY"] = original_api_key


@pytest.mark.asyncio
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
    ALL_METRICS["User Key (Small Prompt)"] = metrics_sm
    
    # Test with large prompt
    completions_lg, metrics_lg = await run_llm_requests(llm, LARGE_TEST_MESSAGE)
    ALL_METRICS["User Key (Large Prompt)"] = metrics_lg

    # Verify we got valid responses
    for completion in completions_sm + completions_lg:
        assert completion is not None and len(completion) > 0

    # Performance assertions - adjust threshold as needed
    assert (
        metrics_sm["avg_latency_ms"] < 10000
    ), f"User key completion (small prompt) took too long: {metrics_sm['avg_latency_ms']} ms"
    
    assert (
        metrics_lg["avg_latency_ms"] < 15000
    ), f"User key completion (large prompt) took too long: {metrics_lg['avg_latency_ms']} ms"


@pytest.mark.asyncio
async def test_direct_openai_performance() -> None:
    """Test the performance of direct OpenAI API calls (control group)."""
    # Skip test if no API key is available
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        pytest.skip("No OpenAI API key available in environment variables")

    # Initialize the OpenAI client directly
    client = openai.OpenAI(api_key=api_key)

    # Test with small prompt
    completions_sm, metrics_sm = await run_direct_openai_requests(client, SMALL_TEST_MESSAGE)
    ALL_METRICS["Direct OpenAI (Small Prompt)"] = metrics_sm
    
    # Test with large prompt
    completions_lg, metrics_lg = await run_direct_openai_requests(client, LARGE_TEST_MESSAGE)
    ALL_METRICS["Direct OpenAI (Large Prompt)"] = metrics_lg

    # Verify we got valid responses
    for completion in completions_sm + completions_lg:
        assert completion is not None and len(completion) > 0

    # Performance assertions - adjust threshold as needed
    assert (
        metrics_sm["avg_latency_ms"] < 10000
    ), f"Direct OpenAI completion (small prompt) took too long: {metrics_sm['avg_latency_ms']} ms"
    
    assert (
        metrics_lg["avg_latency_ms"] < 15000
    ), f"Direct OpenAI completion (large prompt) took too long: {metrics_lg['avg_latency_ms']} ms"
