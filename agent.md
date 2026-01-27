# Agent Guidelines

## Testing Best Practices

### Use Parameterized Tests When Appropriate

Use `@pytest.mark.parametrize` when you have multiple test cases that:
- Test the same function/method with different inputs
- Have the same expected output structure
- Follow the same test logic pattern
- Would otherwise require repetitive test code
