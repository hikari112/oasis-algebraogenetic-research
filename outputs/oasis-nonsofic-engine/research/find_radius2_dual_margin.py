import json
import sys

import cvxpy as cp
import numpy as np
from scipy import sparse


def solve(
    metadata_path: str,
    result_path: str,
    tolerance: float = 2e-7,
    max_iterations: int = 100000,
) -> dict:
    with open(metadata_path, "r", encoding="utf-8") as stream:
        metadata = json.load(stream)
    coefficient_map = sparse.load_npz(metadata["coefficientMapPath"]).tocsr().astype(float)
    targets = np.load(metadata["targetPath"])
    delta = np.asarray(targets["delta"], dtype=float)
    delta_squared = np.asarray(targets["delta_squared"], dtype=float)
    anchor_q = np.asarray(targets["feasible_anchor_q"], dtype=float)
    pair_counts = np.asarray(targets["pair_orbit_entry_counts"], dtype=float)

    functional = cp.Variable(metadata["supportOrbitCount"])
    moment = cp.Variable(metadata["pairOrbitCount"])
    margin = cp.Variable(nonneg=True)
    moment_equation = moment == sparse.diags(1 / pair_counts) @ coefficient_map.T @ functional
    constraints = [
        moment_equation,
        delta @ functional == 1,
        delta_squared @ functional == 0,
    ]
    block_expressions = []
    complements = []
    anchor_summaries = []
    for item in metadata["decomposition"]:
        size = item["multiplicity"]
        block_map = sparse.load_npz(item["blockMapPath"]).tocsr()
        block = cp.reshape(block_map @ moment, (size, size), order="C")
        block = (block + block.T) / 2
        anchor_block = np.asarray(block_map @ anchor_q).reshape(size, size)
        anchor_block = (anchor_block + anchor_block.T) / 2
        anchor_eigenvalues, anchor_eigenvectors = np.linalg.eigh(anchor_block)
        if anchor_eigenvalues[-1] > 1e-8:
            if np.sum(anchor_eigenvalues > 1e-8) != 1:
                raise RuntimeError("Delta-squared anchor was expected to have rank one")
            kernel_direction = anchor_eigenvectors[:, -1]
            projector = np.outer(kernel_direction, kernel_direction)
            # Facial reduction: Delta^2 evaluates to zero on a PSD moment
            # matrix exactly when the Delta direction is in its kernel.  The
            # explicit vector equation removes the otherwise ill-conditioned
            # zero diagonal/cross-term boundary from the conic solver.
            constraints.append(block @ kernel_direction == 0)
        else:
            projector = np.zeros((size, size))
        complement = np.eye(size) - projector
        constraints.append(block - margin * complement >> 0)
        block_expressions.append(block)
        complements.append(complement)
        anchor_summaries.append({
            "maximumEigenvalue": float(anchor_eigenvalues[-1]),
            "rankAt1e-8": int(np.sum(anchor_eigenvalues > 1e-8)),
        })

    problem = cp.Problem(cp.Maximize(margin), constraints)
    problem.solve(
        solver="SCS",
        eps=tolerance,
        max_iters=max_iterations,
        acceleration_lookback=20,
        verbose=True,
    )

    y_value = np.asarray(functional.value, dtype=float).ravel()
    moment_value = np.asarray(moment.value, dtype=float).ravel()
    margin_value = float(margin.value)
    exact_moment_from_y = (coefficient_map.T @ y_value) / pair_counts
    block_summaries = []
    for item, expression, complement in zip(
        metadata["decomposition"], block_expressions, complements
    ):
        value = np.asarray(expression.value, dtype=float)
        value = (value + value.T) / 2
        eigenvalues = np.linalg.eigvalsh(value)
        adjusted_eigenvalues = np.linalg.eigvalsh(
            value - margin_value * complement
        )
        block_summaries.append({
            "s3": item["s3"],
            "bitCharacter": item["bitCharacter"],
            "daggerCharacter": item["daggerCharacter"],
            "size": item["multiplicity"],
            "minimumEigenvalue": float(eigenvalues[0]),
            "maximumEigenvalue": float(eigenvalues[-1]),
            "minimumAdjustedEigenvalue": float(adjusted_eigenvalues[0]),
            "rankAt1e-7": int(np.sum(eigenvalues > 1e-7)),
        })
    result = {
        "schema": "oasis.radius2-dual-margin-result.v1",
        "claimStatus": "numerical-dual-candidate-not-exact-or-interval-certificate",
        "metadata": metadata_path,
        "status": problem.status,
        "objective": float(problem.value),
        "certifiedComplementMarginCandidate": margin_value,
        "deltaNormalization": float(delta @ y_value),
        "deltaSquaredValue": float(delta_squared @ y_value),
        "maximumMomentEquationResidual": float(
            np.max(abs(moment_value - exact_moment_from_y))
        ),
        "minimumRawBlockEigenvalue": min(
            item["minimumEigenvalue"] for item in block_summaries
        ),
        "minimumAdjustedBlockEigenvalue": min(
            item["minimumAdjustedEigenvalue"] for item in block_summaries
        ),
        "blockSummaries": block_summaries,
        "anchorBlockSummaries": anchor_summaries,
        "functionalBySupportOrbit": y_value.tolist(),
        "momentByPairOrbit": moment_value.tolist(),
        "solverStats": {
            "solveTime": problem.solver_stats.solve_time,
            "setupTime": problem.solver_stats.setup_time,
            "numIters": problem.solver_stats.num_iters,
        },
    }
    with open(result_path, "w", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    return result


if __name__ == "__main__":
    if len(sys.argv) not in (3, 4, 5):
        raise SystemExit(
            "Usage: find_radius2_dual_margin.py METADATA.json RESULT.json "
            "[TOLERANCE] [MAX_ITERATIONS]"
        )
    answer = solve(
        sys.argv[1],
        sys.argv[2],
        float(sys.argv[3]) if len(sys.argv) >= 4 else 2e-7,
        int(sys.argv[4]) if len(sys.argv) >= 5 else 100000,
    )
    print(json.dumps({
        key: value
        for key, value in answer.items()
        if key not in ("functionalBySupportOrbit", "momentByPairOrbit")
    }, indent=2))
