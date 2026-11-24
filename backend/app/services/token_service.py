def extract_reply_and_usage(response) -> tuple[str, int, int]:
    """Reads reply text + token usage from a litellm ModelResponse (live call)
    or the plain dict litellm's cache returns on a cache hit."""
    if isinstance(response, dict):
        content = response["choices"][0]["message"]["content"]
        usage = response.get("usage", {})
        input_tokens = usage.get("prompt_tokens", 0)
        output_tokens = usage.get("completion_tokens", 0)
    else:
        content = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
    return content, input_tokens, output_tokens
