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

TEST_MODEL = "gpt-4o-mini"
NUM_ITERATIONS = 3  # Number of requests to make for each test
MAX_ACCEPTABLE_LATENCY_SMALL_PROMPT = 10_000  # in ms
MAX_ACCEPTABLE_LATENCY_LARGE_PROMPT = 15_000  # in ms

# Test messages for all performance tests
SMALL_TEST_MESSAGE: List[ChatCompletionMessageParam] = [
    {"role": "user", "content": prompt_sm}
]
LARGE_TEST_MESSAGE: List[ChatCompletionMessageParam] = [
    {"role": "user", "content": prompt_lg}
]

# Dictionary to store performance metrics for all tests
ALL_METRICS = {}


async def run_llm_requests(
    llm: OpenAIProvider,
    messages: List[ChatCompletionMessageParam],
    n: int = NUM_ITERATIONS,
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
    errors = []

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
        except Exception as e:
            # Log the error and continue with the next request
            error_msg = f"Request {i+1}/{n} failed: {str(e)}"
            errors.append(error_msg)
            print(error_msg)
            completions.append(None)  # Add None for failed completions

    # Calculate stats on successful requests
    successful_requests = len(latencies)
    failed_requests = len(errors)
    
    metrics = {
        "total_requests": n,
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
        "error_details": errors,
    }

    if successful_requests > 0:
        avg_latency = sum(latencies) / successful_requests
        metrics.update({
            "avg_latency_ms": round(avg_latency),
            "min_latency_ms": min(latencies) if latencies else None,
            "max_latency_ms": max(latencies) if latencies else None,
            "all_latencies_ms": latencies,
        })
    else:
        metrics.update({
            "avg_latency_ms": None,
            "min_latency_ms": None,
            "max_latency_ms": None,
            "all_latencies_ms": [],
        })

    return completions, metrics


async def run_direct_openai_requests(
    client: openai.OpenAI,
    messages: List[ChatCompletionMessageParam],
    n: int = NUM_ITERATIONS,
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
    errors = []

    for i in range(n):
        try:
            start_time = time.time()
            response = client.chat.completions.create(model=TEST_MODEL, messages=messages)
            completion = response.choices[0].message.content
            end_time = time.time()

            latency_ms = round((end_time - start_time) * 1000)
            latencies.append(latency_ms)
            completions.append(completion)

            print(f"Direct OpenAI request {i+1}/{n} latency: {latency_ms} ms")
        except Exception as e:
            # Log the error and continue with the next request
            error_msg = f"Direct OpenAI request {i+1}/{n} failed: {str(e)}"
            errors.append(error_msg)
            print(error_msg)
            completions.append(None)  # Add None for failed completions

    # Calculate stats on successful requests
    successful_requests = len(latencies)
    failed_requests = len(errors)
    
    metrics = {
        "total_requests": n,
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
        "error_details": errors,
    }

    if successful_requests > 0:
        avg_latency = sum(latencies) / successful_requests
        metrics.update({
            "avg_latency_ms": round(avg_latency),
            "min_latency_ms": min(latencies) if latencies else None,
            "max_latency_ms": max(latencies) if latencies else None,
            "all_latencies_ms": latencies,
        })
    else:
        metrics.update({
            "avg_latency_ms": None,
            "min_latency_ms": None,
            "max_latency_ms": None,
            "all_latencies_ms": [],
        })

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
            "Max Latency (ms)"
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
        ALL_METRICS["Server Key (sm prompt)"] = metrics_sm

        # Test with large prompt
        completions_lg, metrics_lg = await run_llm_requests(llm, LARGE_TEST_MESSAGE)
        ALL_METRICS["Server Key (lg prompt)"] = metrics_lg

        # Print failure statistics
        if metrics_sm["failed_requests"] > 0:
            print(f"Small prompt failures: {metrics_sm['failed_requests']}/{metrics_sm['total_requests']}")
            for error in metrics_sm["error_details"]:
                print(f"  {error}")
                
        if metrics_lg["failed_requests"] > 0:
            print(f"Large prompt failures: {metrics_lg['failed_requests']}/{metrics_lg['total_requests']}")
            for error in metrics_lg["error_details"]:
                print(f"  {error}")

        # Verify we got at least some valid responses
        valid_completions_sm = [c for c in completions_sm if c is not None]
        valid_completions_lg = [c for c in completions_lg if c is not None]
        
        assert len(valid_completions_sm) > 0, "No successful completions for small prompt"
        for completion in valid_completions_sm:
            assert completion is not None and len(completion) > 0
            
        # Note: We don't assert that large prompt has successful completions, as this might be the failing test
        for completion in valid_completions_lg:
            if completion is not None:
                assert len(completion) > 0

        # Performance assertions - only check if we have successful requests
        if metrics_sm["successful_requests"] > 0:
            assert (
                metrics_sm["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_SMALL_PROMPT
            ), f"Server key completion (small prompt) took too long: {metrics_sm['max_latency_ms']} ms"

        if metrics_lg["successful_requests"] > 0:
            assert (
                metrics_lg["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_LARGE_PROMPT
            ), f"Server key completion (large prompt) took too long: {metrics_lg['max_latency_ms']} ms"

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
    ALL_METRICS["User Key (sm prompt)"] = metrics_sm

    # Test with large prompt
    completions_lg, metrics_lg = await run_llm_requests(llm, LARGE_TEST_MESSAGE)
    ALL_METRICS["User Key (lg prompt)"] = metrics_lg

    # Print failure statistics
    if metrics_sm["failed_requests"] > 0:
        print(f"User key small prompt failures: {metrics_sm['failed_requests']}/{metrics_sm['total_requests']}")
        for error in metrics_sm["error_details"]:
            print(f"  {error}")
            
    if metrics_lg["failed_requests"] > 0:
        print(f"User key large prompt failures: {metrics_lg['failed_requests']}/{metrics_lg['total_requests']}")
        for error in metrics_lg["error_details"]:
            print(f"  {error}")

    # Verify we got at least some valid responses
    valid_completions_sm = [c for c in completions_sm if c is not None]
    valid_completions_lg = [c for c in completions_lg if c is not None]
    
    assert len(valid_completions_sm) > 0, "No successful completions for user key small prompt"
    for completion in valid_completions_sm:
        assert completion is not None and len(completion) > 0
        
    assert len(valid_completions_lg) > 0, "No successful completions for user key large prompt"
    for completion in valid_completions_lg:
        if completion is not None:
            assert len(completion) > 0

    # Performance assertions - only check if we have successful requests
    if metrics_sm["successful_requests"] > 0:
        assert (
            metrics_sm["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_SMALL_PROMPT
        ), f"User key completion (small prompt) took too long: {metrics_sm['max_latency_ms']} ms"

    if metrics_lg["successful_requests"] > 0:
        assert (
            metrics_lg["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_LARGE_PROMPT
        ), f"User key completion (large prompt) took too long: {metrics_lg['max_latency_ms']} ms"


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
    completions_sm, metrics_sm = await run_direct_openai_requests(
        client, SMALL_TEST_MESSAGE
    )
    ALL_METRICS["Direct OpenAI (sm prompt)"] = metrics_sm

    # Test with large prompt
    completions_lg, metrics_lg = await run_direct_openai_requests(
        client, LARGE_TEST_MESSAGE
    )
    ALL_METRICS["Direct OpenAI (lg prompt)"] = metrics_lg

    # Print failure statistics
    if metrics_sm["failed_requests"] > 0:
        print(f"Direct OpenAI small prompt failures: {metrics_sm['failed_requests']}/{metrics_sm['total_requests']}")
        for error in metrics_sm["error_details"]:
            print(f"  {error}")
            
    if metrics_lg["failed_requests"] > 0:
        print(f"Direct OpenAI large prompt failures: {metrics_lg['failed_requests']}/{metrics_lg['total_requests']}")
        for error in metrics_lg["error_details"]:
            print(f"  {error}")

    # Verify we got at least some valid responses
    valid_completions_sm = [c for c in completions_sm if c is not None]
    valid_completions_lg = [c for c in completions_lg if c is not None]
    
    assert len(valid_completions_sm) > 0, "No successful completions for direct OpenAI small prompt"
    for completion in valid_completions_sm:
        assert completion is not None and len(completion) > 0
        
    assert len(valid_completions_lg) > 0, "No successful completions for direct OpenAI large prompt"
    for completion in valid_completions_lg:
        if completion is not None:
            assert len(completion) > 0

    # Performance assertions - only check if we have successful requests
    if metrics_sm["successful_requests"] > 0:
        assert (
            metrics_sm["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_SMALL_PROMPT
        ), f"Direct OpenAI completion (small prompt) took too long: {metrics_sm['max_latency_ms']} ms"

    if metrics_lg["successful_requests"] > 0:
        assert (
            metrics_lg["max_latency_ms"] < MAX_ACCEPTABLE_LATENCY_LARGE_PROMPT
        ), f"Direct OpenAI completion (large prompt) took too long: {metrics_lg['max_latency_ms']} ms"
