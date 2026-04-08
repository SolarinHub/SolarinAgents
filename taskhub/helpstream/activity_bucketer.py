from typing import List, Tuple, Dict


def generate_activity_heatmap(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10,
    normalize: bool = True
) -> List[float]:
    """
    Bucket activity counts into 'buckets' time intervals,
    returning either raw counts or normalized [0.0–1.0].

    - timestamps: list of epoch ms timestamps.
    - counts: list of integer counts per timestamp.
    - buckets: number of time buckets to divide into.
    - normalize: scale values to [0,1].

    Returns list of bucket values.
    """
    if not timestamps or not counts or len(timestamps) != len(counts):
        return []

    t_min, t_max = min(timestamps), max(timestamps)
    span = t_max - t_min or 1
    bucket_size = span / buckets

    agg = [0] * buckets
    for t, c in zip(timestamps, counts):
        idx = min(buckets - 1, int((t - t_min) / bucket_size))
        agg[idx] += c

    if normalize:
        m = max(agg) or 1
        return [round(val / m, 4) for val in agg]
    return agg


def heatmap_with_intervals(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10,
    normalize: bool = True
) -> List[Tuple[Tuple[int, int], float]]:
    """
    Same as generate_activity_heatmap but returns intervals with values.
    Each entry is ((start_ms, end_ms), value).
    """
    if not timestamps or not counts or len(timestamps) != len(counts):
        return []

    t_min, t_max = min(timestamps), max(timestamps)
    span = t_max - t_min or 1
    bucket_size = span / buckets

    values = generate_activity_heatmap(timestamps, counts, buckets, normalize)

    intervals: List[Tuple[Tuple[int, int], float]] = []
    for i, v in enumerate(values):
        start = int(t_min + i * bucket_size)
        end = int(t_min + (i + 1) * bucket_size) if i < buckets - 1 else t_max
        intervals.append(((start, end), v))
    return intervals


def summarize_heatmap(values: List[float]) -> Dict[str, float]:
    """
    Compute summary statistics for a heatmap vector.
    Returns dict with min, max, avg, and nonzero ratio.
    """
    if not values:
        return {"min": 0.0, "max": 0.0, "avg": 0.0, "nonzero_ratio": 0.0}

    total = sum(values)
    n = len(values)
    nonzero = sum(1 for v in values if v > 0)

    return {
        "min": float(min(values)),
        "max": float(max(values)),
        "avg": round(total / n, 4),
        "nonzero_ratio": round(nonzero / n, 4),
    }
