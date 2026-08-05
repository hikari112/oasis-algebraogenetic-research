import json
import sys
from collections import Counter

import numpy as np


def clustered(values: np.ndarray, tolerance: float = 1e-7) -> list[dict]:
    groups: list[list[float]] = []
    for value in sorted(float(item) for item in values):
        if not groups or abs(value - np.mean(groups[-1])) > tolerance:
            groups.append([value])
        else:
            groups[-1].append(value)
    return [
        {
            "mean": float(np.mean(group)),
            "minimum": min(group),
            "maximum": max(group),
            "multiplicity": len(group),
        }
        for group in groups
    ]


def analyze(problem_path: str, result_path: str, output_path: str) -> dict:
    with open(problem_path, "r", encoding="utf-8") as stream:
        problem = json.load(stream)
    with open(result_path, "r", encoding="utf-8") as stream:
        result = json.load(stream)

    size = len(problem["basis"])
    dual = result["dualByExactHash"]
    moment = np.zeros((size, size), dtype=float)
    for contribution in problem["gramContributions"]:
        moment[contribution["left"], contribution["right"]] += (
            contribution["coefficient"] * dual[contribution["exactHash"]]
        )
    moment = (moment + moment.T) / 2
    eigenvalues = np.linalg.eigvalsh(moment)
    if eigenvalues[-1] <= 0 and -eigenvalues[0] > 0:
        moment = -moment
        eigenvalues = -eigenvalues[::-1]

    delta_pairing = sum(
        float(coefficient) * dual.get(exact_hash, 0.0)
        for exact_hash, coefficient in problem["delta"].items()
    )
    delta_squared_pairing = sum(
        float(coefficient) * dual.get(exact_hash, 0.0)
        for exact_hash, coefficient in problem["deltaSquared"].items()
    )
    diagonal = np.diag(moment)
    off_diagonal = moment[~np.eye(size, dtype=bool)]
    rounded_counts = Counter(round(float(value), 8) for value in moment.flat)

    report = {
        "schema": "oasis.sos-dual-moment-analysis.v1",
        "claimBoundary": "numerical-dual-structure-not-exact-infeasibility-certificate",
        "basisSize": size,
        "minimumEigenvalue": float(eigenvalues[0]),
        "maximumEigenvalue": float(eigenvalues[-1]),
        "numericalRank": {
            "1e-6": int(np.sum(eigenvalues > 1e-6)),
            "1e-8": int(np.sum(eigenvalues > 1e-8)),
            "1e-10": int(np.sum(eigenvalues > 1e-10)),
        },
        "eigenvalueClustersAt1e-7": clustered(eigenvalues, 1e-7),
        "deltaPairing": delta_pairing,
        "deltaSquaredPairing": delta_squared_pairing,
        "diagonalRange": [float(np.min(diagonal)), float(np.max(diagonal))],
        "offDiagonalRange": [float(np.min(off_diagonal)), float(np.max(off_diagonal))],
        "roundedMomentEntryClassesAt1e-8": [
            {"value": value, "count": count}
            for value, count in sorted(rounded_counts.items(), key=lambda item: (-item[1], item[0]))
        ],
        "momentMatrix": moment.tolist(),
    }
    with open(output_path, "w", encoding="utf-8") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    return report


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("Usage: analyze_sos_dual.py PROBLEM.json RESULT.json OUTPUT.json")
    answer = analyze(sys.argv[1], sys.argv[2], sys.argv[3])
    print(json.dumps({key: value for key, value in answer.items() if key != "momentMatrix"}, indent=2))
