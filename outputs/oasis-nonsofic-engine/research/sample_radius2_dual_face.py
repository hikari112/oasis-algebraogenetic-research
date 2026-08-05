import json
import sys

import cvxpy as cp
import numpy as np
from scipy import sparse


def sample_face(
    metadata_path: str,
    result_path: str,
    aggregate_path: str,
    sample_count: int = 8,
    trace_cap: float = 200.0,
    seed_candidate_path: str | None = None,
) -> dict:
    with open(metadata_path, "r", encoding="utf-8") as stream:
        metadata = json.load(stream)
    coefficient_map = sparse.load_npz(metadata["coefficientMapPath"]).tocsr().astype(float)
    targets = np.load(metadata["targetPath"])
    delta = np.asarray(targets["delta"], dtype=float)
    delta_squared = np.asarray(targets["delta_squared"], dtype=float)
    pair_counts = np.asarray(targets["pair_orbit_entry_counts"], dtype=float)
    diagonal_counts = np.asarray(targets["pair_orbit_diagonal_counts"], dtype=float)
    anchor_q = np.asarray(targets["feasible_anchor_q"], dtype=float)
    moment_map = sparse.diags(1 / pair_counts) @ coefficient_map.T

    functional = cp.Variable(metadata["supportOrbitCount"])
    moment = cp.Variable(metadata["pairOrbitCount"])
    objective_direction = cp.Parameter(metadata["pairOrbitCount"])
    constraints = [
        moment == moment_map @ functional,
        delta @ functional == 1,
        diagonal_counts @ moment <= trace_cap,
    ]
    block_expressions = []
    for item in metadata["decomposition"]:
        size = item["multiplicity"]
        block_map = sparse.load_npz(item["blockMapPath"]).tocsr()
        block = cp.reshape(block_map @ moment, (size, size), order="C")
        block = (block + block.T) / 2
        anchor_block = np.asarray(block_map @ anchor_q).reshape(size, size)
        anchor_block = (anchor_block + anchor_block.T) / 2
        anchor_values, anchor_vectors = np.linalg.eigh(anchor_block)
        if anchor_values[-1] > 1e-8:
            if np.sum(anchor_values > 1e-8) != 1:
                raise RuntimeError("Delta-squared anchor is not rank one")
            constraints.append(block @ anchor_vectors[:, -1] == 0)
        constraints.append(block >> 0)
        block_expressions.append(block)

    regularization = 1e-6 * cp.sum_squares(moment)
    problem = cp.Problem(
        cp.Maximize(objective_direction @ moment - regularization), constraints
    )
    random = np.random.default_rng(20260804)
    directions = []
    for _ in range((sample_count + 1) // 2):
        direction = random.normal(size=metadata["pairOrbitCount"])
        direction /= np.linalg.norm(direction)
        directions.extend([direction, -direction])
    directions = directions[:sample_count]

    if seed_candidate_path:
        with open(seed_candidate_path, "r", encoding="utf-8") as stream:
            seed_candidate = json.load(stream)
        seed_y = np.asarray(
            seed_candidate["coefficientDualBySupportOrbit"], dtype=float
        )
        functional.value = seed_y
        moment.value = moment_map @ seed_y

    aggregate_blocks = [
        np.zeros((item["multiplicity"], item["multiplicity"]))
        for item in metadata["decomposition"]
    ]
    sample_summaries = []
    saved_moments = []
    for sample_index, direction in enumerate(directions):
        objective_direction.value = direction
        problem.solve(
            solver="SCS",
            eps=1e-5,
            max_iters=7500,
            acceleration_lookback=20,
            warm_start=True,
            verbose=False,
        )
        if moment.value is None or functional.value is None:
            raise RuntimeError(
                f"Dual face sample {sample_index} failed with status {problem.status}"
            )
        y_value = np.asarray(functional.value, dtype=float).ravel()
        moment_value = np.asarray(moment.value, dtype=float).ravel()
        exact_moment = moment_map @ y_value
        saved_moments.append(moment_value)
        minimum_eigenvalue = float("inf")
        projection_correction_squared = 0.0
        block_ranks = []
        for block_index, expression in enumerate(block_expressions):
            block = np.asarray(expression.value, dtype=float)
            block = (block + block.T) / 2
            eigenvalues, eigenvectors = np.linalg.eigh(block)
            minimum_eigenvalue = min(minimum_eigenvalue, float(eigenvalues[0]))
            clipped = np.maximum(eigenvalues, 0)
            projection_correction_squared += float(
                np.sum(np.minimum(eigenvalues, 0) ** 2)
            )
            aggregate_blocks[block_index] += (
                eigenvectors * clipped
            ) @ eigenvectors.T
            scale = max(float(eigenvalues[-1]), 1.0)
            block_ranks.append(int(np.sum(eigenvalues > 1e-7 * scale)))
        summary = {
            "sample": sample_index,
            "status": problem.status,
            "objective": float(problem.value),
            "trace": float(diagonal_counts @ moment_value),
            "deltaValue": float(delta @ y_value),
            "deltaSquaredValue": float(delta_squared @ y_value),
            "maximumMomentEquationResidual": float(
                np.max(abs(moment_value - exact_moment))
            ),
            "minimumBlockEigenvalue": minimum_eigenvalue,
            "psdProjectionCorrectionFrobenius": float(
                np.sqrt(projection_correction_squared)
            ),
            "blockRanksAtRelative1e-7": block_ranks,
            "iterations": problem.solver_stats.num_iters,
            "solveTime": problem.solver_stats.solve_time,
        }
        sample_summaries.append(summary)
        print(json.dumps(summary), flush=True)

    aggregate_summaries = []
    aggregate_arrays = {}
    for block_index, (item, block) in enumerate(
        zip(metadata["decomposition"], aggregate_blocks)
    ):
        block /= len(directions)
        block = (block + block.T) / 2
        eigenvalues, eigenvectors = np.linalg.eigh(block)
        maximum = max(float(eigenvalues[-1]), 1.0)
        relative = eigenvalues / maximum
        gaps = np.diff(np.log10(np.maximum(abs(relative), 1e-18)))
        largest_gap_index = int(np.argmax(gaps)) if len(gaps) else 0
        aggregate_summaries.append({
            "block": block_index,
            "s3": item["s3"],
            "bitCharacter": item["bitCharacter"],
            "daggerCharacter": item["daggerCharacter"],
            "size": item["multiplicity"],
            "minimumEigenvalue": float(eigenvalues[0]),
            "maximumEigenvalue": float(eigenvalues[-1]),
            "nullityAtRelative1e-5": int(np.sum(relative < 1e-5)),
            "nullityAtRelative1e-7": int(np.sum(relative < 1e-7)),
            "nullityAtRelative1e-9": int(np.sum(relative < 1e-9)),
            "largestLogGapAfterIndex": largest_gap_index,
            "eigenvalues": eigenvalues.tolist(),
        })
        aggregate_arrays[f"block_{block_index:02d}"] = block
        aggregate_arrays[f"eigenvalues_{block_index:02d}"] = eigenvalues
        aggregate_arrays[f"eigenvectors_{block_index:02d}"] = eigenvectors
    aggregate_arrays["sample_moments"] = np.asarray(saved_moments)
    np.savez_compressed(aggregate_path, **aggregate_arrays)

    result = {
        "schema": "oasis.radius2-dual-face-samples.v1",
        "claimStatus": "numerical-common-kernel-discovery-not-exact-certificate",
        "metadata": metadata_path,
        "aggregateData": aggregate_path,
        "sampleCount": len(directions),
        "traceCap": trace_cap,
        "randomSeed": 20260804,
        "seedCandidate": seed_candidate_path,
        "method": (
            "Paired random linear objectives on a compact normalized PSD dual slice; "
            "negative solver eigenvalues are clipped only for common-kernel estimation."
        ),
        "samples": sample_summaries,
        "aggregateBlocks": aggregate_summaries,
    }
    with open(result_path, "w", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    return result


if __name__ == "__main__":
    if len(sys.argv) not in (4, 5, 6, 7):
        raise SystemExit(
            "Usage: sample_radius2_dual_face.py METADATA.json RESULT.json "
            "AGGREGATE.npz [SAMPLE_COUNT] [TRACE_CAP] [SEED_CANDIDATE.json]"
        )
    answer = sample_face(
        sys.argv[1],
        sys.argv[2],
        sys.argv[3],
        int(sys.argv[4]) if len(sys.argv) >= 5 else 8,
        float(sys.argv[5]) if len(sys.argv) >= 6 else 200.0,
        sys.argv[6] if len(sys.argv) >= 7 else None,
    )
    print(json.dumps({
        key: value for key, value in answer.items() if key != "samples"
    }, indent=2))
