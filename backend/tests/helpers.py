import re
import time

import litellm


def fake_call_provider(model: str, messages: list[dict], api_key: str):
    """Deterministic stand-in for litellm.completion so tests need no real credentials.

    Answers "what is my name" from an earlier "my name is X" message to exercise
    multi-turn memory, otherwise echoes a canned reply. Sleeps briefly to stand in
    for real network latency, so cache hits are measurably faster in tests too.
    """
    time.sleep(0.05)
    user_messages = [m["content"] for m in messages if m["role"] == "user"]
    last = user_messages[-1] if user_messages else ""

    name = None
    for m in user_messages:
        match = re.search(r"my name is (\w+)", m, re.IGNORECASE)
        if match:
            name = match.group(1)

    if "what is my name" in last.lower() and name:
        content = f"Your name is {name}."
    elif "capital of france" in last.lower():
        content = "The capital of France is Paris."
    else:
        content = f"Echo: {last}"

    return litellm.ModelResponse(
        model=model,
        choices=[
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }
        ],
        usage={
            "prompt_tokens": sum(len(m["content"].split()) for m in messages),
            "completion_tokens": len(content.split()),
            "total_tokens": 0,
        },
    )
