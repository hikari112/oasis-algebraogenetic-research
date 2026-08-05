import json
import sys
from collections import defaultdict

import cvxpy as cp
import numpy as np


def solve(problem_path: str, result_path: str, solver: str = "CLARABEL") -> dict:
    with open(problem_path, "r", encoding="utf-8") as stream:
        data = json.load(stream)

    basis_size = len(data["basis"])
    by_hash: dict[str, list[tuple[int, int, float]]] = defaultdict(list)
    for contribution in data["gramContributions"]:
        by_hash[contribution["exactHash"]].append(
            (contribution["left"], contribution["right"], contribution["coefficient"])
        )

    delta = data["delta"]
    delta_squared = data["deltaSquared"]
    hashes = sorted(set(by_hash) | set(delta) | set(delta_squared))

    gram = cp.Variable((basis_size, basis_size), symmetric=True)
    spectral_gap = cp.Variable(nonneg=True)
    constraints = [gram >> 0]
    for exact_hash in hashes:
        entries = by_hash.get(exact_hash, [])
        lhs = cp.sum([
            coefficient * gram[left, right]
            for left, right, coefficient in entries
        ]) if entries else 0
        rhs = delta_squared.get(exact_hash, 0) - spectral_gap * delta.get(exact_hash, 0)
        constraints.append(lhs == rhs)

    optimization = cp.Problem(cp.Maximize(spectral_gap), constraints)
    if solver == "SCS":
        optimization.solve(solver="SCS", eps=1e-8, max_iters=100000, verbose=False)
    else:
        optimization.solve(solver=solver, verbose=False)

    gram_value = np.asarray(gram.value, dtype=float)
    eigenvalues = np.linalg.eigvalsh(gram_value)
    coefficient_residual = 0.0
    for exact_hash in hashes:
        lhs = sum(
            coefficient * gram_value[left, right]
            for left, right, coefficient in by_hash.get(exact_hash, [])
        )
        rhs = delta_squared.get(exact_hash, 0) - float(spectral_gap.value) * delta.get(exact_hash, 0)
        coefficient_residual = max(coefficient_residual, abs(lhs - rhs))

    result = {
        "schema": "oasis.kazhdan-sos-search-result.v1",
        "problem": problem_path,
        "status": optimization.status,
        "solver": solver,
        "basisSize": basis_size,
        "spectralGapCandidate": float(spectral_gap.value),
        "minimumGramEigenvalue": float(eigenvalues[0]),
        "maximumCoefficientResidual": coefficient_residual,
        "claimStatus": "numerical-candidate-not-an-exact-certificate",
        "dualMomentMatrixMinimumEigenvalue": float(
            np.linalg.eigvalsh(np.asarray(constraints[0].dual_value, dtype=float))[0]
        ),
        "dualByExactHash": {
            exact_hash: float(constraints[index + 1].dual_value)
            for index, exact_hash in enumerate(hashes)
        },
        "gram": gram_value.tolist(),
    }
    with open(result_path, "w", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    return result


if __name__ == "__main__":
    if len(sys.argv) not in (3, 4):
        raise SystemExit("Usage: search_sos.py PROBLEM.json RESULT.json [SOLVER]")
    answer = solve(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) == 4 else "CLARABEL")
    print(json.dumps({key: value for key, value in answer.items() if key != "gram"}, indent=2))
