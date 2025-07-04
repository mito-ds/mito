from typing import Union


def get_model_provider(model: str) -> Union[str, None]:
    """
    Determine the model type based on the model name prefix
    """
    if not model:
        return None

    model_lower = model.lower()

    if model_lower.startswith('claude'):
        return 'claude'
    elif model_lower.startswith('gemini'):
        return 'gemini'
    elif model_lower.startswith('ollama'):
        return 'ollama'
    elif model_lower.startswith('gpt'):
        return 'openai'

    return None