from typing import List


def extract_todo_placeholders(agent_response: str) -> List[str]:
    """Extract TODO placeholders from the agent's response"""
    return [line.strip() for line in agent_response.split('\n') if line.startswith('# MITO_TODO_PLACEHOLDER')]