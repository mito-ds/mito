import uuid

def get_random_id() -> str:
    """
    Creates a new random ID for the user, which for any given user,
    should only happen once.
    """
    return str(uuid.uuid1())