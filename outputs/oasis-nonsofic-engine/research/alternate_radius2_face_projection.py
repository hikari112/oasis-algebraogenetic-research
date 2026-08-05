import json
import sys

import numpy as np
from scipy import sparse
from scipy.sparse import linalg as sparse_linalg


def build_fourier_coordinate_map(metadata: dict):
    maps = []
    slices = []
    cursor = 0
    for item in metadata["decomposition"]:
        size = item["multiplicity"]
        block_map = sparse.load_npz(item["blockMapPath"]).tocsr()
        upper_left, upper_right = np.triu_indices(size)
        rows = upper_left * size + upper_right
        selected = block_map[rows]
        maps.append(selected)
        next_cursor = cursor + len(rows)
        slices.append((cursor, next_cursor, upper_left, upper_right))
        cursor = next_cursor
    matrix = sparse.vstack(maps).tocsr()
    if matrix.shape != (
        metadata["pairOrbitCount"], metadata["pairOrbitCount"]
    ):
        raise RuntimeError(f"Unexpected Fourier coordinate map shape {matrix.shape}")
    return matrix, slices


def blocks_to_coordinates(blocks: list[np.ndarray], slices) -> np.ndarray:
    result = np.empty(slices[-1][1])
    for block, (start, end, left, right) in zip(blocks, slices):
        result[start:end] = block[left, right]
    return result


def coordinates_to_blocks(coordinates: np.ndarray, metadata: dict, slices):
    blocks = []
    for item, (start, end, left, right) in zip(metadata["decomposition"], slices):
        size = item["multiplicity"]
        block = np.zeros((size, size))
        block[left, right] = coordinates[start:end]
        block[right, left] = coordinates[start:end]
        blocks.append(block)
    return blocks


def project_blocks_psd(blocks, kernel_directions):
    projected = []
    minimum_before = float("inf")
    correction_squared = 0.0
    transverse_minimum = float("inf")
    for block, kernel in zip(blocks, kernel_directions):
        block = (block + block.T) / 2
        if kernel is not None:
            complement = np.eye(len(block)) - np.outer(kernel, kernel)
            block = complement @ block @ complement
        eigenvalues, eigenvectors = np.linalg.eigh(block)
        minimum_before = min(minimum_before, float(eigenvalues[0]))
        clipped = np.maximum(eigenvalues, 0)
        correction_squared += float(np.sum(np.minimum(eigenvalues, 0) ** 2))
        positive_candidates = clipped[clipped > 1e-12]
        if len(positive_candidates):
            transverse_minimum = min(
                transverse_minimum, float(positive_candidates[0])
            )
        projected.append((eigenvectors * clipped) @ eigenvectors.T)
    return projected, minimum_before, np.sqrt(correction_squared), transverse_minimum


def affine_metrics(moment, functional, moment_map, delta, delta_squared, metadata):
    block_minimum = float("inf")
    block_second_minimum = float("inf")
    block_ranks = []
    for item in metadata["decomposition"]:
        size = item["multiplicity"]
        block_map = sparse.load_npz(item["blockMapPath"]).tocsr()
        block = np.asarray(block_map @ moment).reshape(size, size)
        block = (block + block.T) / 2
        eigenvalues = np.linalg.eigvalsh(block)
        block_minimum = min(block_minimum, float(eigenvalues[0]))
        if len(eigenvalues) > 1:
            block_second_minimum = min(
                block_second_minimum, float(eigenvalues[1])
            )
        scale = max(float(eigenvalues[-1]), 1.0)
        block_ranks.append(int(np.sum(eigenvalues > 1e-8 * scale)))
    return {
        "deltaValue": float(delta @ functional),
        "deltaSquaredValue": float(delta_squared @ functional),
        "maximumMomentEquationResidual": float(
            np.max(abs(moment - moment_map @ functional))
        ),
        "minimumBlockEigenvalue": block_minimum,
        "minimumSecondBlockEigenvalue": block_second_minimum,
        "blockRanksAtRelative1e-8": block_ranks,
    }


def alternate(
    metadata_path: str,
    aggregate_path: str,
    result_path: str,
    values_path: str,
    iterations: int = 30,
) -> dict:
    with open(metadata_path, "r", encoding="utf-8") as stream:
        metadata = json.load(stream)
    coefficient_map = sparse.load_npz(metadata["coefficientMapPath"]).tocsr().astype(float)
    targets = np.load(metadata["targetPath"])
    delta = np.asarray(targets["delta"], dtype=float)
    delta_squared = np.asarray(targets["delta_squared"], dtype=float)
    pair_counts = np.asarray(targets["pair_orbit_entry_counts"], dtype=float)
    anchor_q = np.asarray(targets["feasible_anchor_q"], dtype=float)
    moment_map = sparse.diags(1 / pair_counts) @ coefficient_map.T
    aggregate = np.load(aggregate_path)

    fourier_map, slices = build_fourier_coordinate_map(metadata)
    print(
        json.dumps({
            "phase": "fourier-map",
            "shape": list(fourier_map.shape),
            "nonzeros": int(fourier_map.nnz),
        }),
        flush=True,
    )
    try:
        fourier_solver = sparse_linalg.splu(fourier_map.tocsc())
        solve_fourier = fourier_solver.solve
        fourier_method = "sparse-LU"
    except RuntimeError:
        solve_fourier = lambda right: sparse_linalg.lsmr(
            fourier_map, right, atol=1e-11, btol=1e-11, maxiter=20000
        )[0]
        fourier_method = "LSMR"

    kernel_directions = []
    initial_blocks = []
    for block_index, item in enumerate(metadata["decomposition"]):
        initial_blocks.append(np.asarray(aggregate[f"block_{block_index:02d}"]))
        block_map = sparse.load_npz(item["blockMapPath"]).tocsr()
        size = item["multiplicity"]
        anchor_block = np.asarray(block_map @ anchor_q).reshape(size, size)
        anchor_block = (anchor_block + anchor_block.T) / 2
        eigenvalues, eigenvectors = np.linalg.eigh(anchor_block)
        kernel_directions.append(
            eigenvectors[:, -1] if eigenvalues[-1] > 1e-8 else None
        )
    initial_coordinates = blocks_to_coordinates(initial_blocks, slices)
    moment = solve_fourier(initial_coordinates)
    inverse_error = float(
        np.max(abs(fourier_map @ moment - initial_coordinates))
    )
    print(
        json.dumps({
            "phase": "fourier-inverse",
            "method": fourier_method,
            "maximumResidual": inverse_error,
        }),
        flush=True,
    )

    delta_norm = np.linalg.norm(delta)
    delta_squared_norm = np.linalg.norm(delta_squared)
    constraint_weight = 1e6
    affine_matrix = sparse.vstack([
        moment_map,
        sparse.csr_matrix((constraint_weight / delta_norm) * delta.reshape(1, -1)),
        sparse.csr_matrix(
            (constraint_weight / delta_squared_norm) * delta_squared.reshape(1, -1)
        ),
    ]).tocsr()
    affine_tail = np.asarray([
        constraint_weight / delta_norm,
        0.0,
    ])

    history = []
    functional = np.zeros(metadata["supportOrbitCount"])
    for iteration in range(iterations):
        affine_right = np.concatenate([moment, affine_tail])
        affine_solution = sparse_linalg.lsmr(
            affine_matrix,
            affine_right,
            atol=1e-10,
            btol=1e-10,
            maxiter=30000,
        )
        functional = affine_solution[0]
        affine_moment = moment_map @ functional
        affine_projection_distance = float(np.linalg.norm(affine_moment - moment))
        affine_coordinates = fourier_map @ affine_moment
        affine_blocks = coordinates_to_blocks(affine_coordinates, metadata, slices)
        projected_blocks, minimum_before, psd_distance, transverse_minimum = (
            project_blocks_psd(affine_blocks, kernel_directions)
        )
        projected_coordinates = blocks_to_coordinates(projected_blocks, slices)
        moment = solve_fourier(projected_coordinates)
        fourier_residual = float(
            np.max(abs(fourier_map @ moment - projected_coordinates))
        )
        metrics = affine_metrics(
            affine_moment,
            functional,
            moment_map,
            delta,
            delta_squared,
            metadata,
        )
        entry = {
            "iteration": iteration,
            "affineProjectionDistance": affine_projection_distance,
            "minimumEigenvalueBeforePsdProjection": minimum_before,
            "psdProjectionDistance": float(psd_distance),
            "projectedTransverseMinimum": float(transverse_minimum),
            "fourierInverseResidual": fourier_residual,
            "affineLsmrStop": int(affine_solution[1]),
            "affineLsmrIterations": int(affine_solution[2]),
            **metrics,
        }
        history.append(entry)
        print(json.dumps(entry), flush=True)
        if (
            psd_distance < 1e-8
            and abs(metrics["deltaValue"] - 1) < 1e-8
            and abs(metrics["deltaSquaredValue"]) < 1e-8
        ):
            break

    final_affine_right = np.concatenate([moment, affine_tail])
    final_solution = sparse_linalg.lsmr(
        affine_matrix,
        final_affine_right,
        atol=1e-12,
        btol=1e-12,
        maxiter=50000,
    )
    functional = final_solution[0]
    affine_moment = moment_map @ functional
    final_metrics = affine_metrics(
        affine_moment,
        functional,
        moment_map,
        delta,
        delta_squared,
        metadata,
    )
    np.savez_compressed(
        values_path,
        functional=functional,
        moment=affine_moment,
    )
    result = {
        "schema": "oasis.radius2-alternating-face-projection.v1",
        "claimStatus": "numerical-feasibility-construction-not-exact-certificate",
        "metadata": metadata_path,
        "sourceAggregate": aggregate_path,
        "values": values_path,
        "fourierCoordinateMethod": fourier_method,
        "fourierInitialInverseMaximumResidual": inverse_error,
        "iterationsRequested": iterations,
        "iterationsCompleted": len(history),
        "history": history,
        "final": final_metrics,
    }
    with open(result_path, "w", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    return result


if __name__ == "__main__":
    if len(sys.argv) not in (5, 6):
        raise SystemExit(
            "Usage: alternate_radius2_face_projection.py METADATA.json AGGREGATE.npz "
            "RESULT.json VALUES.npz [ITERATIONS]"
        )
    answer = alternate(
        sys.argv[1],
        sys.argv[2],
        sys.argv[3],
        sys.argv[4],
        int(sys.argv[5]) if len(sys.argv) == 6 else 30,
    )
    print(json.dumps({key: value for key, value in answer.items() if key != "history"}, indent=2))
