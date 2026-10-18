"""
Crop Recommendation Service
Replicates the KNN prediction algorithm and dataset from the original BhoomiBandhu frontend/backend.
Preserves identical feature encoding, normalisation, distance metric, voting, yield/risk heuristics, and advice.
"""

import math
from typing import Dict, Any, List, Optional

# 120-sample training dataset matching ml-crop-advisor.js
# [rainfall_mm, temp_c, soil, season, irrigation, crop, yield, risk]
TRAINING_DATA = [
    [200, 18, "loamy", "rabi", "irrigated", "Wheat 🌾", "High", "Low"],
    [180, 17, "loamy", "rabi", "irrigated", "Wheat 🌾", "High", "Low"],
    [220, 20, "loamy", "rabi", "irrigated", "Wheat 🌾", "High", "Low"],
    [160, 15, "loamy", "rabi", "partial", "Wheat 🌾", "Medium", "Low"],
    [250, 22, "loamy", "rabi", "irrigated", "Wheat 🌾", "High", "Low"],
    [170, 16, "loamy", "rabi", "rainfed", "Wheat 🌾", "Medium", "Medium"],
    [190, 19, "loamy", "rabi", "irrigated", "Wheat 🌾", "High", "Low"],
    [210, 21, "loamy", "rabi", "irrigated", "Wheat 🌾", "High", "Low"],
    [155, 14, "loamy", "rabi", "rainfed", "Wheat 🌾", "Low", "Medium"],
    [235, 23, "loamy", "rabi", "irrigated", "Wheat 🌾", "High", "Low"],
    [200, 18, "red", "rabi", "irrigated", "Wheat 🌾", "Medium", "Low"],
    [175, 16, "loamy", "rabi", "partial", "Wheat 🌾", "Medium", "Low"],
    [260, 24, "loamy", "rabi", "irrigated", "Wheat 🌾", "High", "Low"],
    [145, 13, "loamy", "rabi", "rainfed", "Wheat 🌾", "Low", "High"],
    [300, 28, "clay", "kharif", "rainfed", "Rice 🌾💧", "High", "Low"],
    [350, 30, "clay", "kharif", "rainfed", "Rice 🌾💧", "High", "Low"],
    [280, 27, "loamy", "kharif", "irrigated", "Rice 🌾💧", "High", "Low"],
    [320, 29, "clay", "kharif", "rainfed", "Rice 🌾💧", "High", "Low"],
    [270, 26, "clay", "kharif", "partial", "Rice 🌾💧", "Medium", "Low"],
    [380, 32, "clay", "kharif", "rainfed", "Rice 🌾💧", "High", "Low"],
    [260, 25, "loamy", "kharif", "irrigated", "Rice 🌾💧", "Medium", "Low"],
    [340, 31, "clay", "kharif", "rainfed", "Rice 🌾💧", "High", "Low"],
    [250, 24, "loamy", "kharif", "irrigated", "Rice 🌾💧", "Medium", "Medium"],
    [370, 33, "clay", "kharif", "rainfed", "Rice 🌾💧", "High", "Low"],
    [290, 28, "black", "kharif", "irrigated", "Rice 🌾💧", "High", "Low"],
    [310, 30, "loamy", "kharif", "irrigated", "Rice 🌾💧", "High", "Low"],
    [400, 34, "clay", "kharif", "rainfed", "Rice 🌾💧", "High", "Low"],
    [240, 23, "clay", "kharif", "partial", "Rice 🌾💧", "Low", "Medium"],
    [240, 24, "loamy", "kharif", "partial", "Maize 🌽", "High", "Medium"],
    [260, 26, "loamy", "kharif", "irrigated", "Maize 🌽", "High", "Low"],
    [220, 22, "loamy", "kharif", "partial", "Maize 🌽", "Medium", "Medium"],
    [280, 27, "loamy", "kharif", "irrigated", "Maize 🌽", "High", "Low"],
    [200, 20, "red", "kharif", "partial", "Maize 🌽", "Medium", "Medium"],
    [300, 29, "loamy", "kharif", "irrigated", "Maize 🌽", "High", "Low"],
    [210, 21, "loamy", "zaid", "irrigated", "Maize 🌽", "Medium", "Low"],
    [250, 25, "red", "kharif", "rainfed", "Maize 🌽", "Medium", "Medium"],
    [270, 28, "loamy", "kharif", "partial", "Maize 🌽", "High", "Medium"],
    [190, 19, "loamy", "zaid", "irrigated", "Maize 🌽", "Low", "Medium"],
    [310, 30, "loamy", "kharif", "irrigated", "Maize 🌽", "High", "Low"],
    [230, 23, "red", "kharif", "partial", "Maize 🌽", "Medium", "Medium"],
    [285, 27, "loamy", "kharif", "irrigated", "Maize 🌽", "High", "Low"],
    [220, 30, "black", "kharif", "rainfed", "Cotton 🌿", "High", "Medium"],
    [250, 32, "black", "kharif", "rainfed", "Cotton 🌿", "High", "Low"],
    [200, 28, "clay", "kharif", "rainfed", "Cotton 🌿", "Medium", "Medium"],
    [270, 34, "black", "kharif", "rainfed", "Cotton 🌿", "High", "Low"],
    [230, 31, "black", "kharif", "partial", "Cotton 🌿", "High", "Medium"],
    [210, 29, "clay", "kharif", "rainfed", "Cotton 🌿", "Medium", "Medium"],
    [260, 33, "black", "kharif", "rainfed", "Cotton 🌿", "High", "Low"],
    [180, 27, "clay", "kharif", "partial", "Cotton 🌿", "Low", "High"],
    [290, 35, "black", "kharif", "rainfed", "Cotton 🌿", "High", "Low"],
    [240, 32, "black", "kharif", "partial", "Cotton 🌿", "High", "Medium"],
    [195, 28, "red", "kharif", "rainfed", "Cotton 🌿", "Low", "High"],
    [275, 34, "black", "kharif", "rainfed", "Cotton 🌿", "High", "Low"],
    [255, 31, "clay", "kharif", "partial", "Cotton 🌿", "Medium", "Medium"],
    [350, 28, "loamy", "kharif", "irrigated", "Sugarcane 🎋", "High", "Medium"],
    [400, 30, "loamy", "kharif", "irrigated", "Sugarcane 🎋", "High", "Low"],
    [320, 26, "loamy", "kharif", "irrigated", "Sugarcane 🎋", "High", "Medium"],
    [450, 32, "black", "kharif", "irrigated", "Sugarcane 🎋", "High", "Low"],
    [380, 29, "loamy", "kharif", "irrigated", "Sugarcane 🎋", "High", "Low"],
    [300, 25, "loamy", "kharif", "partial", "Sugarcane 🎋", "Medium", "Medium"],
    [420, 31, "black", "kharif", "irrigated", "Sugarcane 🎋", "High", "Low"],
    [340, 27, "loamy", "kharif", "irrigated", "Sugarcane 🎋", "High", "Medium"],
    [480, 33, "black", "kharif", "irrigated", "Sugarcane 🎋", "High", "Low"],
    [360, 28, "clay", "kharif", "irrigated", "Sugarcane 🎋", "Medium", "Medium"],
    [500, 34, "loamy", "kharif", "irrigated", "Sugarcane 🎋", "High", "Low"],
    [310, 26, "black", "kharif", "partial", "Sugarcane 🎋", "Medium", "Medium"],
    [440, 30, "loamy", "kharif", "irrigated", "Sugarcane 🎋", "High", "Low"],
    [120, 30, "sandy", "kharif", "rainfed", "Millets 🌾", "Medium", "Low"],
    [150, 32, "sandy", "kharif", "rainfed", "Millets 🌾", "Medium", "Low"],
    [100, 28, "sandy", "kharif", "rainfed", "Millets 🌾", "Low", "Medium"],
    [180, 34, "sandy", "kharif", "rainfed", "Millets 🌾", "High", "Low"],
    [130, 31, "red", "kharif", "rainfed", "Millets 🌾", "Medium", "Low"],
    [110, 29, "sandy", "kharif", "rainfed", "Millets 🌾", "Low", "Low"],
    [160, 33, "sandy", "kharif", "rainfed", "Millets 🌾", "Medium", "Low"],
    [140, 30, "red", "kharif", "rainfed", "Millets 🌾", "Medium", "Low"],
    [200, 35, "sandy", "kharif", "rainfed", "Millets 🌾", "High", "Low"],
    [125, 31, "sandy", "kharif", "rainfed", "Millets 🌾", "Medium", "Low"],
    [170, 32, "red", "kharif", "rainfed", "Millets 🌾", "Medium", "Low"],
    [95, 28, "sandy", "kharif", "rainfed", "Millets 🌾", "Low", "Medium"],
    [185, 34, "sandy", "kharif", "partial", "Millets 🌾", "High", "Low"],
    [200, 28, "sandy", "kharif", "rainfed", "Groundnut 🥜", "Medium", "Medium"],
    [180, 26, "sandy", "kharif", "rainfed", "Groundnut 🥜", "Medium", "Medium"],
    [220, 30, "sandy", "kharif", "partial", "Groundnut 🥜", "High", "Low"],
    [170, 25, "red", "kharif", "rainfed", "Groundnut 🥜", "Low", "Medium"],
    [240, 32, "sandy", "kharif", "irrigated", "Groundnut 🥜", "High", "Low"],
    [190, 27, "sandy", "kharif", "rainfed", "Groundnut 🥜", "Medium", "Medium"],
    [210, 29, "red", "kharif", "partial", "Groundnut 🥜", "Medium", "Low"],
    [160, 24, "sandy", "kharif", "rainfed", "Groundnut 🥜", "Low", "Medium"],
    [250, 33, "sandy", "kharif", "irrigated", "Groundnut 🥜", "High", "Low"],
    [205, 28, "sandy", "kharif", "rainfed", "Groundnut 🥜", "Medium", "Medium"],
    [230, 31, "red", "kharif", "partial", "Groundnut 🥜", "Medium", "Low"],
    [155, 23, "sandy", "kharif", "rainfed", "Groundnut 🥜", "Low", "High"],
    [270, 34, "sandy", "kharif", "irrigated", "Groundnut 🥜", "High", "Low"],
    [150, 16, "loamy", "rabi", "rainfed", "Barley 🌾", "Medium", "Low"],
    [120, 14, "loamy", "rabi", "rainfed", "Barley 🌾", "Low", "Medium"],
    [180, 18, "loamy", "rabi", "irrigated", "Barley 🌾", "High", "Low"],
    [140, 15, "loamy", "rabi", "partial", "Barley 🌾", "Medium", "Low"],
    [200, 20, "loamy", "rabi", "irrigated", "Barley 🌾", "High", "Low"],
    [130, 13, "red", "rabi", "rainfed", "Barley 🌾", "Low", "Medium"],
    [160, 17, "loamy", "rabi", "partial", "Barley 🌾", "Medium", "Low"],
    [110, 12, "loamy", "rabi", "rainfed", "Barley 🌾", "Low", "Medium"],
    [190, 19, "loamy", "rabi", "irrigated", "Barley 🌾", "High", "Low"],
    [145, 15, "sandy", "rabi", "rainfed", "Barley 🌾", "Low", "Medium"],
    [170, 18, "loamy", "rabi", "partial", "Barley 🌾", "Medium", "Low"],
    [210, 21, "loamy", "rabi", "irrigated", "Barley 🌾", "High", "Low"],
    [135, 14, "loamy", "rabi", "rainfed", "Barley 🌾", "Low", "Medium"],
    [150, 24, "sandy", "kharif", "rainfed", "Pulses 🫘", "Medium", "Low"],
    [130, 22, "loamy", "rabi", "rainfed", "Pulses 🫘", "Medium", "Low"],
    [170, 26, "sandy", "kharif", "rainfed", "Pulses 🫘", "Medium", "Low"],
    [120, 21, "loamy", "rabi", "rainfed", "Pulses 🫘", "Low", "Low"],
    [190, 28, "red", "kharif", "rainfed", "Pulses 🫘", "Medium", "Low"],
    [140, 23, "sandy", "kharif", "rainfed", "Pulses 🫘", "Medium", "Low"],
    [160, 25, "loamy", "rabi", "partial", "Pulses 🫘", "Medium", "Low"],
    [110, 20, "sandy", "rabi", "rainfed", "Pulses 🫘", "Low", "Medium"],
    [180, 27, "red", "kharif", "rainfed", "Pulses 🫘", "Medium", "Low"],
    [155, 24, "loamy", "rabi", "partial", "Pulses 🫘", "Medium", "Low"],
    [145, 22, "sandy", "kharif", "rainfed", "Pulses 🫘", "Medium", "Low"],
    [200, 29, "red", "kharif", "partial", "Pulses 🫘", "High", "Low"],
]

SOIL_ENC = {"loamy": 0, "clay": 1, "sandy": 2, "red": 3, "black": 4}
SEASON_ENC = {"kharif": 0, "rabi": 1, "zaid": 2}
IRR_ENC = {"irrigated": 0, "rainfed": 1, "partial": 2}
FEAT_MIN = [50, 5, 0, 0, 0]
FEAT_MAX = [600, 45, 4, 2, 2]

CROP_META = {
    "Wheat": {"emoji": "🌾", "advice": "Apply DAP at sowing. Irrigate at CRI and flowering. Watch for yellow rust."},
    "Rice": {"emoji": "🌾", "advice": "Transplant at 25-30 days. Keep 5cm standing water. Apply urea in 3 splits."},
    "Maize": {"emoji": "🌽", "advice": "Use hybrid seeds. Apply zinc sulphate as basal dose. Needs well-drained soil."},
    "Cotton": {"emoji": "🌿", "advice": "Sow 60×30cm spacing. Manage bollworm with Bt spray. Avoid waterlogging at boll stage."},
    "Sugarcane": {"emoji": "🎋", "advice": "Harvest at 10-12 months. Apply 250kg N/ha in splits. Drip irrigation saves 40% water."},
    "Millets": {"emoji": "🌾", "advice": "Drought-tolerant. No heavy fertiliser needed. Weed at 2-3 week stage."},
    "Groundnut": {"emoji": "🥜", "advice": "Apply gypsum at pegging stage. 3-week dry spell at harvest improves quality."},
    "Barley": {"emoji": "🌾", "advice": "Sow early November. Low water requirement. Good wheat alternative in drier zones."},
    "Pulses": {"emoji": "🫘", "advice": "Inoculate with Rhizobium. Fixes nitrogen — improves next crop soil. Short duration."},
}


def clean_crop_name(name: str) -> str:
    """Removes emoji and pictographic symbols from crop name."""
    if not name:
        return ""
    # Strip emojis and common symbols
    cleaned = "".join(c for c in name if ord(c) < 127).strip()
    return cleaned if cleaned else name.split()[0]


def encode_features(row: List[Any]) -> List[float]:
    rainfall, temp, soil, season, irr = row[0], row[1], row[2], row[3], row[4]
    return [
        float(rainfall),
        float(temp),
        float(SOIL_ENC.get(soil.lower() if isinstance(soil, str) else "", 0)),
        float(SEASON_ENC.get(season.lower() if isinstance(season, str) else "", 0)),
        float(IRR_ENC.get(irr.lower() if isinstance(irr, str) else "", 0)),
    ]


def normalise(v: List[float]) -> List[float]:
    return [(v[i] - FEAT_MIN[i]) / (FEAT_MAX[i] - FEAT_MIN[i]) for i in range(len(v))]


def euclidean_dist(a: List[float], b: List[float]) -> float:
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(len(a))))


def majority_vote(values: List[str]) -> str:
    counts: Dict[str, int] = {}
    for val in values:
        counts[val] = counts.get(val, 0) + 1
    return max(counts.items(), key=lambda x: x[1])[0]


def knn_predict(
    rainfall_mm: float,
    temperature_c: float,
    soil_type: str = "loamy",
    season: str = "kharif",
    irrigation: str = "irrigated",
    k: int = 5,
) -> Dict[str, Any]:
    """Runs kNN classification against the 120-sample dataset."""
    q_vec = normalise(encode_features([rainfall_mm, temperature_c, soil_type, season, irrigation]))

    distances = []
    for idx, sample in enumerate(TRAINING_DATA):
        sample_vec = normalise(encode_features(sample))
        dist = euclidean_dist(q_vec, sample_vec)
        distances.append((dist, idx))

    distances.sort(key=lambda x: x[0])
    top_k = distances[:k]

    votes: Dict[str, int] = {}
    for _, idx in top_k:
        crop = TRAINING_DATA[idx][5]
        votes[crop] = votes.get(crop, 0) + 1

    winner_raw = max(votes.items(), key=lambda x: x[1])[0]
    confidence = (votes[winner_raw] / k) * 100.0

    winner_clean = clean_crop_name(winner_raw)

    winner_rows = [TRAINING_DATA[idx] for _, idx in top_k if TRAINING_DATA[idx][5] == winner_raw]
    yield_level = majority_vote([r[6] for r in winner_rows])
    risk_level = majority_vote([r[7] for r in winner_rows])

    meta = CROP_META.get(winner_clean, {"emoji": "🌾", "advice": "Follow standard agronomic practices."})

    neighbours = [
        {
            "crop": clean_crop_name(TRAINING_DATA[idx][5]),
            "dist": round(dist, 3),
            "yield": TRAINING_DATA[idx][6],
            "risk": TRAINING_DATA[idx][7],
        }
        for dist, idx in top_k
    ]

    return {
        "recommended_crop": winner_clean,
        "recommended_crop_display": winner_raw,
        "confidence_percent": round(confidence),
        "yield_level": yield_level,
        "risk_level": risk_level,
        "ai_advice": meta["advice"],
        "emoji": meta.get("emoji", "🌾"),
        "neighbours": neighbours,
    }
