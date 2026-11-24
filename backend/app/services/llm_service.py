import litellm


def call_provider(model: str, messages: list[dict], api_key: str):
    """Thin wrapper around litellm.completion so tests can monkeypatch the network call."""
    return litellm.completion(model=model, messages=messages, api_key=api_key)
