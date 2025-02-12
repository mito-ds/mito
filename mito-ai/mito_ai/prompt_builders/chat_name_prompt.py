def create_chat_name_prompt(user_message: str, assistant_message: str) -> str:
    prompt = f"""Create a short name for the chat thread based on the first user message
    and the first LLM response. Reply ONLY with the short title (max 40 chars). Don't add any extra text.

    User Message: {user_message}

    Assistant Message: {assistant_message}
    """
    
    return prompt