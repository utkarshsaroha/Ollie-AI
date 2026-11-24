from app.config import settings

ELIGIBLE_FAILOVER_STATUSES = {429, 500, 502, 503}


def ordered_keys() -> list[tuple[str, str]]:
    """Returns [(key_id, key_value), ...] in configured order, e.g. ('key_1', 'sk-...')."""
    return [(f"key_{i + 1}", value) for i, value in enumerate(settings.api_keys)]


def parse_simulate_failure(header_value: str | None) -> dict[str, int]:
    """Parses 'key_1=429,key_2=500' or '*=429' into {'key_1': 429, ...}."""
    if not header_value:
        return {}
    result: dict[str, int] = {}
    for part in header_value.split(","):
        part = part.strip()
        if "=" not in part:
            continue
        key_id, _, status_str = part.partition("=")
        key_id = key_id.strip()
        try:
            status = int(status_str.strip())
        except ValueError:
            continue
        if status in ELIGIBLE_FAILOVER_STATUSES:
            result[key_id] = status
    return result


def simulated_status_for(key_id: str, sim_map: dict[str, int]) -> int | None:
    if key_id in sim_map:
        return sim_map[key_id]
    if "*" in sim_map:
        return sim_map["*"]
    return None
