import json
import sys

import cvxpy as cp
import numpy as np
from scipy import sparse


def row_maximum(matrix: sparse.csr_matrix) -> np.ndarray:
    absolute = abs(matrix)
    maximum = absolute.max(axis=1)
    if sparse.issparse(maximum):
        maximum = maximum.toarray()
    return np.asarray(maximum).ravel()


def solve(
    metadata_path: str,
    result_path: str,
    solver: str = "SCS",
    tolerance: float = 2e-6,
    max_iterations: int = 100000,
) -> dict:
    with open(metadata_path, "r", encoding="utf-8") as stream:
        metadata = json.load(stream)
    coefficient_map = sparse.load_npz(metadata["coefficientMapPath"]).tocsr().astype(float)
    targets = np.load(metadata["targetPath"])
    delta = np.asarray(targets["delta"], dtype=float)
    delta_squared = np.asarray(targets["delta_squared"], dtype=float)
    variable_count = metadata["pairOrbitCount"]

    scales = np.maximum.reduce([
        row_maximum(coefficient_map),
        abs(delta),
        abs(delta_squared),
        np.ones_like(delta),
    ])
    inverse_scales = 1 / scales
    scaled_map = sparse.diags(inverse_scales) @ coefficient_map
    scaled_delta = inverse_scales * delta
    scaled_delta_squared = inverse_scales * delta_squared

    q = cp.Variable(variable_count)
    spectral_gap = cp.Variable(nonneg=True)
    coefficient_constraint = scaled_map @ q == scaled_delta_squared - spectral_gap * scaled_delta
    constraints = [coefficient_constraint]
    block_expressions = []
    for item in metadata["decomposition"]:
        multiplicity = item["multiplicity"]
        block_map = sparse.load_npz(item["blockMapPath"]).tocsr()
        block = cp.reshape(block_map @ q, (multiplicity, multiplicity), order="C")
        symmetric_block = (block + block.T) / 2
        constraints.append(symmetric_block >> 0)
        block_expressions.append(symmetric_block)

    optimization = cp.Problem(cp.Maximize(spectral_gap), constraints)
    if solver.upper() == "SCS":
        optimization.solve(
            solver="SCS",
            eps=tolerance,
            max_iters=max_iterations,
            acceleration_lookback=20,
            verbose=True,
        )
    else:
        optimization.solve(solver=solver.upper(), verbose=True)

    q_value = np.asarray(q.value, dtype=float).ravel()
    lambda_value = float(spectral_gap.value)
    residual = coefficient_map @ q_value - (delta_squared - lambda_value * delta)
    block_summaries = []
    block_values = []
    for item, expression in zip(metadata["decomposition"], block_expressions):
        value = np.asarray(expression.value, dtype=float)
        value = (value + value.T) / 2
        eigenvalues = np.linalg.eigvalsh(value)
        block_values.append(value.tolist())
        block_summaries.append({
            "s3": item["s3"],
            "bitCharacter": item["bitCharacter"],
            "daggerCharacter": item["daggerCharacter"],
            "size": item["multiplicity"],
            "minimumEigenvalue": float(eigenvalues[0]),
            "maximumEigenvalue": float(eigenvalues[-1]),
            "numericalRankAt1e-7": int(np.sum(eigenvalues > 1e-7)),
        })

    scaled_dual = np.asarray(coefficient_constraint.dual_value, dtype=float).ravel()
    coefficient_dual = inverse_scales * scaled_dual
    dual_block_values = []
    dual_block_summaries = []
    for item, constraint in zip(metadata["decomposition"], constraints[1:]):
        value = np.asarray(constraint.dual_value, dtype=float)
        value = (value + value.T) / 2
        eigenvalues = np.linalg.eigvalsh(value)
        dual_block_values.append(value.tolist())
        dual_block_summaries.append({
            "s3": item["s3"],
            "bitCharacter": item["bitCharacter"],
            "daggerCharacter": item["daggerCharacter"],
            "size": item["multiplicity"],
            "minimumEigenvalue": float(eigenvalues[0]),
            "maximumEigenvalue": float(eigenvalues[-1]),
            "numericalRankAt1e-7": int(np.sum(eigenvalues > 1e-7)),
        })
    result = {
        "schema": "oasis.radius2-reduced-sdp-result.v1",
        "claimStatus": "numerical-candidate-not-exact-or-interval-certificate",
        "metadata": metadata_path,
        "solver": solver.upper(),
        "status": optimization.status,
        "objective": float(optimization.value),
        "spectralGapCandidate": lambda_value,
        "maximumCoefficientResidual": float(np.max(abs(residual))),
        "l2CoefficientResidual": float(np.linalg.norm(residual)),
        "minimumBlockEigenvalue": min(item["minimumEigenvalue"] for item in block_summaries),
        "blockSummaries": block_summaries,
        "q": q_value.tolist(),
        "coefficientDualBySupportOrbit": coefficient_dual.tolist(),
        "blockValues": block_values,
        "dualBlockSummaries": dual_block_summaries,
        "dualBlockValues": dual_block_values,
        "solverStats": {
            "solveTime": optimization.solver_stats.solve_time,
            "setupTime": optimization.solver_stats.setup_time,
            "numIters": optimization.solver_stats.num_iters,
        },
    }
    with open(result_path, "w", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    return result


if __name__ == "__main__":
    if len(sys.argv) not in (3, 4, 5, 6):
        raise SystemExit(
            "Usage: solve_radius2_reduced.py METADATA.json RESULT.json "
            "[SOLVER] [TOLERANCE] [MAX_ITERATIONS]"
        )
    answer = solve(
        sys.argv[1],
        sys.argv[2],
        sys.argv[3] if len(sys.argv) >= 4 else "SCS",
        float(sys.argv[4]) if len(sys.argv) >= 5 else 2e-6,
        int(sys.argv[5]) if len(sys.argv) >= 6 else 100000,
    )
    print(json.dumps({key: value for key, value in answer.items() if key not in (
        "q", "coefficientDualBySupportOrbit", "blockValues", "dualBlockValues"
    )}, indent=2))
