import json
import sys

import cvxpy as cp
import numpy as np
from scipy import sparse


def rotate_kernel_to_include(kernel: np.ndarray, direction: np.ndarray) -> np.ndarray:
    dimension = kernel.shape[1]
    direction = direction / np.linalg.norm(direction)
    if dimension == 1:
        return direction[:, None]
    residuals = kernel - np.outer(direction, direction @ kernel)
    left, singular_values, _ = np.linalg.svd(residuals, full_matrices=False)
    if np.sum(singular_values > 1e-10) < dimension - 1:
        raise RuntimeError("Observed kernel cannot be rotated around the exact Delta direction")
    result = np.column_stack([direction, left[:, : dimension - 1]])
    if np.max(abs(result.T @ result - np.eye(dimension))) > 1e-9:
        raise RuntimeError("Rotated kernel basis is not orthonormal")
    return result


def solve(
    metadata_path: str,
    seed_result_path: str,
    result_path: str,
    values_path: str,
    kernel_threshold: float = 1e-7,
) -> dict:
    with open(metadata_path, "r", encoding="utf-8") as stream:
        metadata = json.load(stream)
    with open(seed_result_path, "r", encoding="utf-8") as stream:
        seed = json.load(stream)
    coefficient_map = sparse.load_npz(metadata["coefficientMapPath"]).tocsr().astype(float)
    targets = np.load(metadata["targetPath"])
    delta = np.asarray(targets["delta"], dtype=float)
    delta_squared = np.asarray(targets["delta_squared"], dtype=float)
    pair_counts = np.asarray(targets["pair_orbit_entry_counts"], dtype=float)
    anchor_q = np.asarray(targets["feasible_anchor_q"], dtype=float)
    moment_map = sparse.diags(1 / pair_counts) @ coefficient_map.T
    seed_y = np.asarray(seed["coefficientDualBySupportOrbit"], dtype=float)
    seed_moment = moment_map @ seed_y

    functional = cp.Variable(metadata["supportOrbitCount"])
    moment = cp.Variable(metadata["pairOrbitCount"])
    margin = cp.Variable(nonneg=True)
    constraints = [
        moment == moment_map @ functional,
        delta @ functional == 1,
        delta_squared @ functional == 0,
    ]
    functional.value = seed_y
    moment.value = seed_moment
    block_expressions = []
    kernel_bases = []
    seed_summaries = []
    kernel_arrays = {}
    for block_index, item in enumerate(metadata["decomposition"]):
        size = item["multiplicity"]
        block_map = sparse.load_npz(item["blockMapPath"]).tocsr()
        seed_block = np.asarray(block_map @ seed_moment).reshape(size, size)
        seed_block = (seed_block + seed_block.T) / 2
        eigenvalues, eigenvectors = np.linalg.eigh(seed_block)
        nullity = int(np.sum(eigenvalues < kernel_threshold))
        if nullity == 0:
            kernel = np.zeros((size, 0))
        else:
            kernel = eigenvectors[:, :nullity]
        anchor_block = np.asarray(block_map @ anchor_q).reshape(size, size)
        anchor_block = (anchor_block + anchor_block.T) / 2
        anchor_values, anchor_vectors = np.linalg.eigh(anchor_block)
        if anchor_values[-1] > 1e-8:
            if nullity == 0:
                raise RuntimeError("Observed trivial block kernel omitted Delta")
            kernel = rotate_kernel_to_include(kernel, anchor_vectors[:, -1])
        complement = np.eye(size) - kernel @ kernel.T
        block = cp.reshape(block_map @ moment, (size, size), order="C")
        block = (block + block.T) / 2
        if nullity:
            constraints.append(block @ kernel == 0)
        constraints.append(block - margin * complement >> 0)
        block_expressions.append(block)
        kernel_bases.append(kernel)
        kernel_arrays[f"kernel_{block_index:02d}"] = kernel
        seed_summaries.append({
            "block": block_index,
            "size": size,
            "nullity": nullity,
            "largestKernelEigenvalue": float(eigenvalues[nullity - 1]) if nullity else None,
            "smallestRangeEigenvalue": float(eigenvalues[nullity]) if nullity < size else None,
        })

    problem = cp.Problem(cp.Maximize(margin), constraints)
    problem.solve(
        solver="SCS",
        eps=1e-6,
        max_iters=30000,
        acceleration_lookback=20,
        warm_start=True,
        verbose=True,
    )
    if functional.value is None or moment.value is None:
        raise RuntimeError(f"Observed-face solve failed with status {problem.status}")
    y_value = np.asarray(functional.value, dtype=float).ravel()
    moment_value = np.asarray(moment.value, dtype=float).ravel()
    margin_value = float(margin.value)
    block_summaries = []
    maximum_kernel_residual = 0.0
    minimum_range_eigenvalue = float("inf")
    minimum_adjusted_eigenvalue = float("inf")
    for block_index, (item, expression, kernel) in enumerate(
        zip(metadata["decomposition"], block_expressions, kernel_bases)
    ):
        block = np.asarray(expression.value, dtype=float)
        block = (block + block.T) / 2
        complement = np.eye(len(block)) - kernel @ kernel.T
        range_basis = np.linalg.eigh(complement)[1][
            :, -int(round(np.trace(complement))) :
        ] if np.trace(complement) > 0.5 else np.zeros((len(block), 0))
        if kernel.shape[1]:
            maximum_kernel_residual = max(
                maximum_kernel_residual, float(np.max(abs(block @ kernel)))
            )
        range_block = range_basis.T @ block @ range_basis
        range_values = np.linalg.eigvalsh((range_block + range_block.T) / 2)
        adjusted_values = np.linalg.eigvalsh(
            (range_block + range_block.T) / 2 - margin_value * np.eye(len(range_values))
        )
        minimum_range_eigenvalue = min(
            minimum_range_eigenvalue, float(range_values[0])
        )
        minimum_adjusted_eigenvalue = min(
            minimum_adjusted_eigenvalue, float(adjusted_values[0])
        )
        block_summaries.append({
            "block": block_index,
            "s3": item["s3"],
            "bitCharacter": item["bitCharacter"],
            "daggerCharacter": item["daggerCharacter"],
            "size": len(block),
            "kernelDimension": kernel.shape[1],
            "rangeDimension": len(range_values),
            "minimumRangeEigenvalue": float(range_values[0]),
            "maximumRangeEigenvalue": float(range_values[-1]),
            "minimumAdjustedRangeEigenvalue": float(adjusted_values[0]),
        })
    np.savez_compressed(
        values_path,
        functional=y_value,
        moment=moment_value,
        **kernel_arrays,
    )
    result = {
        "schema": "oasis.radius2-observed-face-margin.v1",
        "claimStatus": "numerical-observed-face-candidate-not-exact-certificate",
        "metadata": metadata_path,
        "seedResult": seed_result_path,
        "values": values_path,
        "kernelThreshold": kernel_threshold,
        "status": problem.status,
        "marginCandidate": margin_value,
        "deltaValue": float(delta @ y_value),
        "deltaSquaredValue": float(delta_squared @ y_value),
        "maximumMomentEquationResidual": float(
            np.max(abs(moment_value - moment_map @ y_value))
        ),
        "maximumKernelResidual": maximum_kernel_residual,
        "minimumRangeEigenvalue": minimum_range_eigenvalue,
        "minimumAdjustedRangeEigenvalue": minimum_adjusted_eigenvalue,
        "totalKernelDimensionAcrossMultiplicityBlocks": sum(
            kernel.shape[1] for kernel in kernel_bases
        ),
        "seedBlocks": seed_summaries,
        "blocks": block_summaries,
        "solverStats": {
            "solveTime": problem.solver_stats.solve_time,
            "setupTime": problem.solver_stats.setup_time,
            "iterations": problem.solver_stats.num_iters,
        },
    }
    with open(result_path, "w", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    return result


if __name__ == "__main__":
    if len(sys.argv) not in (5, 6):
        raise SystemExit(
            "Usage: find_radius2_observed_face_margin.py METADATA.json SEED.json "
            "RESULT.json VALUES.npz [KERNEL_THRESHOLD]"
        )
    answer = solve(
        sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4],
        float(sys.argv[5]) if len(sys.argv) == 6 else 1e-7,
    )
    print(json.dumps(answer, indent=2))
