from typing import List, Dict, Any


def detect_volume_bursts(
    volumes: List[float],
    threshold_ratio: float = 1.5,
    min_interval: int = 1
) -> List[Dict[str, Any]]:
    """
    Identify indices where volume jumps by threshold_ratio over previous.
    Returns list of dicts: {index, previous, current, ratio}.
    - volumes: sequence of volume values.
    - threshold_ratio: minimum ratio of current/previous to trigger an event.
    - min_interval: minimum gap (in indices) between detected events.
    """
    events: List[Dict[str, Any]] = []
    if not volumes or len(volumes) < 2:
        return events

    last_idx = -min_interval
    for i in range(1, len(volumes)):
        prev, curr = volumes[i - 1], volumes[i]
        if prev <= 0 and curr <= 0:
            continue

        ratio = (curr / prev) if prev > 0 else float("inf")
        if ratio >= threshold_ratio and (i - last_idx) >= min_interval:
            events.append({
                "index": i,
                "previous": round(prev, 4),
                "current": round(curr, 4),
                "ratio": round(ratio, 4),
            })
            last_idx = i
    return events


def summarize_bursts(events: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Compute summary statistics for detected bursts.
    Returns dict with count, max_ratio, avg_ratio.
    """
    if not events:
        return {"count": 0, "max_ratio": 0.0, "avg_ratio": 0.0}

    ratios = [e["ratio"] for e in events]
    return {
        "count": len(events),
        "max_ratio": max(ratios),
        "avg_ratio": round(sum(ratios) / len(ratios), 4),
    }


def label_burst_severity(event: Dict[str, Any]) -> str:
    """
    Label severity of a burst event based on ratio.
    """
    ratio = event.get("ratio", 0)
    if ratio >= 5:
        return "extreme"
    elif ratio >= 3:
        return "high"
    elif ratio >= 2:
        return "moderate"
    return "mild"
