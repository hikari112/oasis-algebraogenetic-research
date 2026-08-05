import json
import sys
from pathlib import Path

import numpy as np
from scipy import sparse


STANDARD_BASIS = np.asarray([
    [1 / np.sqrt(2), 1 / np.sqrt(6)],
    [-1 / np.sqrt(2), 1 / np.sqrt(6)],
    [0, -2 / np.sqrt(6)],
])


def parity(permutation: list[int]) -> int:
    inversions = sum(
        permutation[left] > permutation[right]
        for left in range(len(permutation))
        for right in range(left + 1, len(permutation))
    )
    return 1 if inversions % 2 == 0 else -1


def s3_matrix(kind: str, permutation: list[int]) -> np.ndarray:
    if kind == "trivial":
        return np.ones((1, 1))
    if kind == "sign":
        return np.asarray([[parity(permutation)]], dtype=float)
    permutation_matrix = np.zeros((3, 3), dtype=float)
    for source, target in enumerate(permutation):
        permutation_matrix[target, source] = 1
    return STANDARD_BASIS.T @ permutation_matrix @ STANDARD_BASIS


def irrep_matrix(irrep: dict, transformation: dict) -> np.ndarray:
    matrix = s3_matrix(irrep["s3"], transformation["indexPermutation"])
    scalar = (irrep["bitCharacter"] if transformation["bitFlip"] else 1) * (
        irrep["daggerCharacter"] if transformation["dagger"] else 1
    )
    return scalar * matrix


def set_orbits(actions: np.ndarray) -> list[np.ndarray]:
    unseen = set(range(actions.shape[1]))
    result = []
    while unseen:
        seed = next(iter(unseen))
        orbit = {int(action[seed]) for action in actions}
        changed = True
        while changed:
            changed = False
            for point in list(orbit):
                for action in actions:
                    target = int(action[point])
                    if target not in orbit:
                        orbit.add(target)
                        changed = True
        unseen.difference_update(orbit)
        result.append(np.asarray(sorted(orbit), dtype=np.int32))
    return sorted(result, key=lambda item: (-len(item), int(item[0])))


def pair_orbits(actions: np.ndarray, size: int):
    upper_left, upper_right = np.triu_indices(size)
    canonical = np.full(len(upper_left), size * size, dtype=np.int64)
    for action in actions:
        image_left = action[upper_left]
        image_right = action[upper_right]
        lower = np.minimum(image_left, image_right)
        upper = np.maximum(image_left, image_right)
        canonical = np.minimum(canonical, lower.astype(np.int64) * size + upper)
    representatives, inverse = np.unique(canonical, return_inverse=True)
    matrix = np.empty((size, size), dtype=np.int32)
    matrix[upper_left, upper_right] = inverse
    matrix[upper_right, upper_left] = inverse
    return matrix, representatives


def local_projector_basis(
    orbit: np.ndarray,
    transformations: list[dict],
    actions: np.ndarray,
    irrep: dict,
):
    dimension = irrep["dimension"]
    position = {int(point): index for index, point in enumerate(orbit)}
    representation_matrices = [irrep_matrix(irrep, item) for item in transformations]
    p11 = np.zeros((len(orbit), len(orbit)), dtype=float)
    pa1 = [np.zeros_like(p11) for _ in range(dimension)]
    for transformation_index, action in enumerate(actions):
        local_permutation = np.asarray(
            [position[int(action[point])] for point in orbit],
            dtype=np.int32,
        )
        group_matrix = np.zeros_like(p11)
        group_matrix[local_permutation, np.arange(len(orbit))] = 1
        rho_inverse = representation_matrices[transformation_index].T
        p11 += dimension / len(transformations) * rho_inverse[0, 0] * group_matrix
        for row in range(dimension):
            # Matrix-unit convention: e_{a1} uses rho(g^-1)_{1a}.
            pa1[row] += dimension / len(transformations) * rho_inverse[0, row] * group_matrix
    p11 = (p11 + p11.T) / 2
    eigenvalues, eigenvectors = np.linalg.eigh(p11)
    selected = eigenvalues > 0.5
    if np.max(np.minimum(abs(eigenvalues), abs(eigenvalues - 1))) > 2e-10:
        raise RuntimeError("Irrep projector is not numerically idempotent")
    w = eigenvectors[:, selected]
    for row in range(dimension):
        transformed = pa1[row] @ w
        if not np.allclose(transformed.T @ transformed, np.eye(w.shape[1]), atol=2e-9):
            raise RuntimeError("Matrix-unit image is not orthonormal")
    return w


def block_map(
    pair_orbit_matrix: np.ndarray,
    basis_orbits: list[np.ndarray],
    local_bases: list[np.ndarray],
    multiplicity: int,
    pair_orbit_count: int,
) -> sparse.csr_matrix:
    offsets = []
    cursor = 0
    for local in local_bases:
        offsets.append(cursor)
        cursor += local.shape[1]
    if cursor != multiplicity:
        raise RuntimeError("Local multiplicities do not sum to the character multiplicity")
    row_parts = []
    column_parts = []
    value_parts = []
    for left_orbit_index, left_points in enumerate(basis_orbits):
        left_basis = local_bases[left_orbit_index]
        if left_basis.shape[1] == 0:
            continue
        for right_orbit_index, right_points in enumerate(basis_orbits):
            right_basis = local_bases[right_orbit_index]
            if right_basis.shape[1] == 0:
                continue
            quotient_indices = pair_orbit_matrix[np.ix_(left_points, right_points)].ravel()
            unique_indices, inverse = np.unique(quotient_indices, return_inverse=True)
            for left_local in range(left_basis.shape[1]):
                for right_local in range(right_basis.shape[1]):
                    weights = np.outer(
                        left_basis[:, left_local],
                        right_basis[:, right_local],
                    ).ravel()
                    sums = np.bincount(inverse, weights=weights, minlength=len(unique_indices))
                    nonzero = np.flatnonzero(abs(sums) > 1e-12)
                    global_left = offsets[left_orbit_index] + left_local
                    global_right = offsets[right_orbit_index] + right_local
                    row_parts.extend([global_left * multiplicity + global_right] * len(nonzero))
                    column_parts.extend(unique_indices[nonzero].tolist())
                    value_parts.extend(sums[nonzero].tolist())
    matrix = sparse.coo_matrix(
        (value_parts, (row_parts, column_parts)),
        shape=(multiplicity * multiplicity, pair_orbit_count),
    ).tocsr()
    matrix.sum_duplicates()
    return matrix


def build(input_path: str, output_prefix: str):
    with open(input_path, "r", encoding="utf-8") as stream:
        problem = json.load(stream)
    prefix = Path(output_prefix)
    prefix.parent.mkdir(parents=True, exist_ok=True)

    size = problem["basisSize"]
    transformations = problem["transformations"]
    actions = np.asarray([item["basisPermutation"] for item in transformations], dtype=np.int32)
    basis_orbits = set_orbits(actions)
    pair_orbit_matrix, pair_representatives = pair_orbits(actions, size)
    pair_orbit_count = len(pair_representatives)
    if pair_orbit_count != 9865:
        raise RuntimeError(f"Unexpected unordered pair orbit count: {pair_orbit_count}")

    support_orbit = np.asarray([item["orbit"] for item in problem["support"]], dtype=np.int32)
    support_orbit_count = problem["supportOrbitCount"]
    left = np.repeat(np.arange(size, dtype=np.int32), size)
    right = np.tile(np.arange(size, dtype=np.int32), size)
    columns = pair_orbit_matrix.ravel()
    product = np.asarray(problem["productSupportIndex"], dtype=np.int32)
    inverse = np.asarray(problem["inverseSupportIndex"], dtype=np.int32)
    basis_support = np.asarray(problem["basisSupportIndex"], dtype=np.int32)
    support_actions = np.asarray(
        [item["supportPermutation"] for item in transformations], dtype=np.int32
    )
    product_matrix = product.reshape(size, size)
    for transformation_index, (basis_action, support_action) in enumerate(
        zip(actions, support_actions)
    ):
        if not np.array_equal(
            support_action[product_matrix],
            product_matrix[np.ix_(basis_action, basis_action)],
        ):
            raise RuntimeError(
                f"Symmetry {transformation_index} permutes equality classes but does not "
                "preserve Gram-basis products"
            )
        if not np.array_equal(
            support_action[inverse], inverse[basis_action]
        ) or not np.array_equal(
            support_action[basis_support], basis_support[basis_action]
        ):
            raise RuntimeError(
                f"Symmetry {transformation_index} does not preserve basis or involution terms"
            )
    identity_orbit = int(support_orbit[problem["identitySupportIndex"]])
    rows = np.concatenate([
        support_orbit[product],
        support_orbit[inverse[left]],
        support_orbit[basis_support[right]],
        np.full(size * size, identity_orbit, dtype=np.int32),
    ])
    coefficient_columns = np.tile(columns, 4)
    values = np.concatenate([
        np.ones(size * size, dtype=np.int16),
        -np.ones(size * size, dtype=np.int16),
        -np.ones(size * size, dtype=np.int16),
        np.ones(size * size, dtype=np.int16),
    ])
    coefficient_map = sparse.coo_matrix(
        (values, (rows, coefficient_columns)),
        shape=(support_orbit_count, pair_orbit_count),
        dtype=np.int32,
    ).tocsr()
    coefficient_map.sum_duplicates()
    coefficient_map.eliminate_zeros()

    delta = np.zeros(support_orbit_count, dtype=np.int64)
    delta_squared = np.zeros(support_orbit_count, dtype=np.int64)
    for item in problem["delta"]:
        delta[support_orbit[item["supportIndex"]]] += item["coefficient"]
    for item in problem["deltaSquared"]:
        delta_squared[support_orbit[item["supportIndex"]]] += item["coefficient"]

    # Exact feasibility anchor.  Delta^2 is the Gram square of the sum of the
    # thirty radius-one generator-minus-identity coordinates, so its invariant
    # Gram matrix is one on generator x generator and zero elsewhere.
    generator_indices = np.asarray([
        index
        for index, item in enumerate(problem["basis"])
        if len(item["representativeWord"]) == 1
    ], dtype=np.int32)
    if len(generator_indices) != 30:
        raise RuntimeError(f"Expected 30 radius-one generators, found {len(generator_indices)}")
    generator_mask = np.zeros(size, dtype=np.int8)
    generator_mask[generator_indices] = 1
    anchor_entries = np.outer(generator_mask, generator_mask).ravel()
    orbit_entry_counts = np.bincount(columns, minlength=pair_orbit_count)
    orbit_diagonal_counts = np.bincount(
        np.diag(pair_orbit_matrix), minlength=pair_orbit_count
    )
    orbit_anchor_counts = np.bincount(
        columns, weights=anchor_entries, minlength=pair_orbit_count
    ).astype(np.int64)
    mixed_anchor_orbits = (orbit_anchor_counts != 0) & (
        orbit_anchor_counts != orbit_entry_counts
    )
    if np.any(mixed_anchor_orbits):
        raise RuntimeError("A pair orbit mixes generator and non-generator anchor entries")
    feasible_anchor_q = (orbit_anchor_counts > 0).astype(np.int64)
    anchor_coefficient_residual = coefficient_map @ feasible_anchor_q - delta_squared
    if np.any(anchor_coefficient_residual):
        raise RuntimeError(
            "The exact radius-one Gram anchor does not expand to Delta^2"
        )

    decomposition = []
    block_matrices = []
    for s3 in ("trivial", "sign", "standard"):
        for bit_character in (1, -1):
            for dagger_character in (1, -1):
                irrep = {
                    "s3": s3,
                    "bitCharacter": bit_character,
                    "daggerCharacter": dagger_character,
                    "dimension": 2 if s3 == "standard" else 1,
                }
                local_bases = [
                    local_projector_basis(orbit, transformations, actions, irrep)
                    for orbit in basis_orbits
                ]
                multiplicity = sum(local.shape[1] for local in local_bases)
                irrep["multiplicity"] = multiplicity
                irrep["localMultiplicities"] = [local.shape[1] for local in local_bases]
                block = block_map(
                    pair_orbit_matrix,
                    basis_orbits,
                    local_bases,
                    multiplicity,
                    pair_orbit_count,
                )
                block_path = f"{output_prefix}-block-{len(decomposition):02d}.npz"
                sparse.save_npz(block_path, block)
                block_matrices.append(block)
                irrep["blockMapPath"] = block_path
                irrep["blockMapNonzeros"] = int(block.nnz)
                # Symmetry must make the extracted block symmetric for every q.
                transpose_rows = np.arange(multiplicity * multiplicity).reshape(
                    multiplicity, multiplicity
                ).T.ravel()
                asymmetry = block - block[transpose_rows]
                if asymmetry.nnz and np.max(abs(asymmetry.data)) > 2e-9:
                    raise RuntimeError("Invariant block map is not symmetric")
                decomposition.append(irrep)

    reconstructed_dimension = sum(
        item["dimension"] * item["multiplicity"] for item in decomposition
    )
    invariant_variables = sum(
        item["multiplicity"] * (item["multiplicity"] + 1) // 2
        for item in decomposition
    )
    if reconstructed_dimension != size or invariant_variables != pair_orbit_count:
        raise RuntimeError("Representation decomposition failed dimension checks")

    anchor_block_minimum_eigenvalue = float("inf")
    anchor_block_maximum_eigenvalue = float("-inf")
    for item, block_map_matrix in zip(decomposition, block_matrices):
        multiplicity = item["multiplicity"]
        block_value = (block_map_matrix @ feasible_anchor_q).reshape(
            multiplicity, multiplicity
        )
        block_value = (block_value + block_value.T) / 2
        eigenvalues = np.linalg.eigvalsh(block_value)
        anchor_block_minimum_eigenvalue = min(
            anchor_block_minimum_eigenvalue, float(eigenvalues[0])
        )
        anchor_block_maximum_eigenvalue = max(
            anchor_block_maximum_eigenvalue, float(eigenvalues[-1])
        )
    if anchor_block_minimum_eigenvalue < -2e-8:
        raise RuntimeError(
            "The exact Delta^2 feasibility anchor is not PSD in Fourier coordinates"
        )

    # Independent spectral reconstruction check: an invariant full Gram matrix
    # and its twelve Fourier blocks must have identical spectra, with each block
    # eigenvalue repeated by the corresponding irrep dimension.
    random = np.random.default_rng(20260804)
    sample_q = random.normal(size=pair_orbit_count)
    full_gram = sample_q[pair_orbit_matrix]
    full_spectrum = np.linalg.eigvalsh((full_gram + full_gram.T) / 2)
    block_spectrum = []
    for item, block_map_matrix in zip(decomposition, block_matrices):
        multiplicity = item["multiplicity"]
        block_value = (block_map_matrix @ sample_q).reshape(multiplicity, multiplicity)
        block_value = (block_value + block_value.T) / 2
        eigenvalues = np.linalg.eigvalsh(block_value)
        block_spectrum.extend(np.repeat(eigenvalues, item["dimension"]).tolist())
    block_spectrum = np.sort(np.asarray(block_spectrum))
    spectrum_reconstruction_error = float(np.max(abs(full_spectrum - block_spectrum)))
    if spectrum_reconstruction_error > 2e-8:
        raise RuntimeError(
            f"Fourier blocks do not reconstruct the full invariant spectrum: {spectrum_reconstruction_error}"
        )

    coefficient_path = f"{output_prefix}-coefficients.npz"
    target_path = f"{output_prefix}-targets.npz"
    sparse.save_npz(coefficient_path, coefficient_map)
    np.savez_compressed(
        target_path,
        delta=delta,
        delta_squared=delta_squared,
        feasible_anchor_q=feasible_anchor_q,
        pair_orbit_entry_counts=orbit_entry_counts,
        pair_orbit_diagonal_counts=orbit_diagonal_counts,
    )
    metadata = {
        "schema": "oasis.radius2-reduced-sdp.v1",
        "claimBoundary": "numerical-Fourier-coordinates-with-exact-integer-coefficient-map",
        "sourceProblem": input_path,
        "basisSize": size,
        "basisOrbitCount": len(basis_orbits),
        "supportSize": len(problem["support"]),
        "supportOrbitCount": support_orbit_count,
        "pairOrbitCount": pair_orbit_count,
        "coefficientMapPath": coefficient_path,
        "coefficientMapShape": list(coefficient_map.shape),
        "coefficientMapNonzeros": int(coefficient_map.nnz),
        "targetPath": target_path,
        "reconstructedDimension": reconstructed_dimension,
        "invariantSymmetricVariableCount": invariant_variables,
        "decomposition": decomposition,
        "validation": {
            "pairOrbitBurnsideCount": 9865,
            "integerCoefficientMap": True,
            "targetAggregationByExactSupportOrbit": True,
            "allSymmetriesPreserveGramBasisProducts": True,
            "allSymmetriesPreserveBasisAndInvolutionTerms": True,
            "exactDeltaSquaredAnchorCoefficientResidual": int(
                np.max(abs(anchor_coefficient_residual), initial=0)
            ),
            "exactDeltaSquaredAnchorBlockMinimumEigenvalue": anchor_block_minimum_eigenvalue,
            "exactDeltaSquaredAnchorBlockMaximumEigenvalue": anchor_block_maximum_eigenvalue,
            "allBlockMapsSymmetric": True,
            "randomSpectrumReconstructionMaximumError": spectrum_reconstruction_error,
        },
    }
    metadata_path = f"{output_prefix}-metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as stream:
        json.dump(metadata, stream, indent=2)
        stream.write("\n")
    return metadata


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: build_radius2_reduction.py INPUT.json OUTPUT_PREFIX")
    answer = build(sys.argv[1], sys.argv[2])
    print(json.dumps(answer, indent=2))
