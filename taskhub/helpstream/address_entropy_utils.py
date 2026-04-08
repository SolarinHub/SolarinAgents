import math
from typing import List, Dict, Any


def compute_shannon_entropy(addresses: List[str]) -> float:
    """
    Compute Shannon entropy (bits) of an address sequence.
    """
    if not addresses:
        return 0.0
    freq: Dict[str, int] = {}
    for a in addresses:
        freq[a] = freq.get(a, 0) + 1
    total = len(addresses)
    entropy = 0.0
    for count in freq.values():
        p = count / total
        entropy -= p * math.log2(p)
    return round(entropy, 4)


def entropy_distribution(addresses: List[str]) -> Dict[str, Any]:
    """
    Return frequency distribution and probabilities of addresses.
    Useful for debugging entropy calculations.
    """
    freq: Dict[str, int] = {}
    for a in addresses:
        freq[a] = freq.get(a, 0) + 1
    total = len(addresses) or 1
    return {
        "counts": freq,
        "probabilities": {a: c / total for a, c in freq.items()},
    }


def normalized_entropy(addresses: List[str]) -> float:
    """
    Shannon entropy normalized to [0,1], dividing by max entropy.
    """
    if not addresses:
        return 0.0
    unique_count = len(set(addresses))
    if unique_count <= 1:
        return 0.0
    entropy = compute_shannon_entropy(addresses)
    max_entropy = math.log2(unique_count)
    return round(entropy / max_entropy, 4)


def classify_entropy(value: float) -> str:
    """
    Classify entropy value into qualitative categories.
    """
    if value < 1.0:
        return "very low"
    elif value < 2.0:
        return "low"
    elif value < 3.0:
        return "medium"
    elif value < 4.0:
        return "high"
    return "very high"
