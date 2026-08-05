import json
import math
import sys
from fractions import Fraction

import numpy as np
from scipy import linalg, sparse


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


def pair_orbits(actions: np.ndarray, size: int) -> np.ndarray:
    left, right = np.triu_indices(size)
    canonical = np.full(len(left), size * size, dtype=np.int64)
    for action in actions:
        image_left = action[left]
        image_right = action[right]
        canonical = np.minimum(
            canonical,
            np.minimum(image_left, image_right).astype(np.int64) * size
            + np.maximum(image_left, image_right),
        )
    _, inverse = np.unique(canonical, return_inverse=True)
    matrix = np.empty((size, size), dtype=np.int32)
    matrix[left, right] = inverse
    matrix[right, left] = inverse
    return matrix


def exact_row_product(matrix: sparse.csr_matrix, vector: np.ndarray) -> list[int]:
    answer = []
    for row in range(matrix.shape[0]):
        start, end = matrix.indptr[row], matrix.indptr[row + 1]
        answer.append(sum(
            int(matrix.data[index]) * int(vector[matrix.indices[index]])
            for index in range(start, end)
        ))
    return answer


def exact_linear_solve(matrix: np.ndarray, right_hand_side: list[int]) -> list[Fraction]:
    size = matrix.shape[0]
    augmented = [
        [Fraction(int(value)) for value in matrix[row]]
        + [Fraction(int(right_hand_side[row]))]
        for row in range(size)
    ]
    for column in range(size):
        pivot = next(
            (row for row in range(column, size) if augmented[row][column]),
            None,
        )
        if pivot is None:
            raise RuntimeError("Selected exact repair minor is singular")
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        pivot_value = augmented[column][column]
        augmented[column] = [value / pivot_value for value in augmented[column]]
        for row in range(size):
            if row == column or not augmented[row][column]:
                continue
            multiplier = augmented[row][column]
            augmented[row] = [
                value - multiplier * pivot_entry
                for value, pivot_entry in zip(augmented[row], augmented[column])
            ]
    return [augmented[row][-1] for row in range(size)]


def rationalize(
    quotient_path: str,
    metadata_path: str,
    candidate_path: str,
    output_path: str,
    denominator: int = 10**12,
) -> dict:
    with open(quotient_path, "r", encoding="utf-8") as stream:
        quotient = json.load(stream)
    with open(metadata_path, "r", encoding="utf-8") as stream:
        metadata = json.load(stream)
    with open(candidate_path, "r", encoding="utf-8") as stream:
        candidate = json.load(stream)
    coefficient_map = sparse.load_npz(metadata["coefficientMapPath"]).tocsr().astype(np.int64)
    targets = np.load(metadata["targetPath"])
    delta = np.asarray(targets["delta"], dtype=np.int64)
    pair_counts = np.asarray(targets["pair_orbit_entry_counts"], dtype=np.int64)
    actions = np.asarray(
        [item["basisPermutation"] for item in quotient["transformations"]],
        dtype=np.int32,
    )
    size = quotient["basisSize"]
    pair_orbit_matrix = pair_orbits(actions, size)
    basis_orbits = set_orbits(actions)
    generator_indices = np.asarray([
        index
        for index, item in enumerate(quotient["basis"])
        if len(item["representativeWord"]) == 1
    ], dtype=np.int32)
    if len(generator_indices) != 30:
        raise RuntimeError("Expected thirty radius-one generators")

    count_lcm = math.lcm(*(int(value) for value in pair_counts))
    kernel_rows = sparse.lil_matrix(
        (len(basis_orbits), metadata["pairOrbitCount"]), dtype=np.int64
    )
    for row, orbit in enumerate(basis_orbits):
        representative = int(orbit[0])
        for generator in generator_indices:
            kernel_rows[row, pair_orbit_matrix[representative, generator]] += 1
    kernel_rows = kernel_rows.tocsr()
    scaled_inverse_counts = sparse.diags(count_lcm // pair_counts)
    kernel_functional_constraints = (
        kernel_rows @ scaled_inverse_counts @ coefficient_map.T
    ).tocsr().astype(np.int64)
    full_constraints = sparse.vstack([
        sparse.csr_matrix(delta.reshape(1, -1)),
        kernel_functional_constraints,
    ]).tocsr()
    targets_exact = np.zeros(full_constraints.shape[0], dtype=np.int64)
    targets_exact[0] = 1

    dense_constraints = full_constraints.toarray().astype(float)
    _, diagonal, row_pivots = linalg.qr(
        dense_constraints.T, mode="economic", pivoting=True
    )
    rank = int(np.sum(abs(np.diag(diagonal)) > 1e-9 * abs(diagonal[0, 0])))
    independent_rows = np.asarray(row_pivots[:rank], dtype=np.int32)
    independent = full_constraints[independent_rows].toarray().astype(np.int64)
    _, column_factor, column_pivots = linalg.qr(
        independent.astype(float), mode="economic", pivoting=True
    )
    if np.min(abs(np.diag(column_factor)[:rank])) < 1e-10:
        raise RuntimeError("Could not select an independent exact repair minor")
    repair_columns = np.asarray(column_pivots[:rank], dtype=np.int32)

    y_candidate = np.asarray(candidate["functionalBySupportOrbit"], dtype=float)
    rounded_numerators = np.rint(denominator * y_candidate).astype(np.int64)
    base_constraint_values = exact_row_product(full_constraints, rounded_numerators)
    residual_numerators = [
        int(denominator) * int(target) - value
        for target, value in zip(targets_exact, base_constraint_values)
    ]
    exact_minor = independent[:, repair_columns].astype(np.int64)
    exact_rhs = [
        residual_numerators[int(row)] for row in independent_rows
    ]
    repair = exact_linear_solve(exact_minor, exact_rhs)

    for row in range(full_constraints.shape[0]):
        start, end = full_constraints.indptr[row], full_constraints.indptr[row + 1]
        row_values = {
            int(full_constraints.indices[index]): int(full_constraints.data[index])
            for index in range(start, end)
        }
        repaired = sum(
            row_values.get(int(column), 0) * value
            for column, value in zip(repair_columns, repair)
        )
        if Fraction(residual_numerators[row]) - repaired != 0:
            raise RuntimeError("Exact affine repair failed a dependent constraint")

    rationalized_y = rounded_numerators.astype(float) / denominator
    for column, value in zip(repair_columns, repair):
        rationalized_y[column] += float(value) / denominator
    moment = (coefficient_map.T @ rationalized_y) / pair_counts
    full_moment = moment[pair_orbit_matrix]
    full_moment = (full_moment + full_moment.T) / 2
    generator_sum = np.zeros(size)
    generator_sum[generator_indices] = 1
    full_eigenvalues = np.linalg.eigvalsh(full_moment)
    block_summaries = []
    block_spectrum = []
    for item in metadata["decomposition"]:
        block_map = sparse.load_npz(item["blockMapPath"]).tocsr()
        block = np.asarray(block_map @ moment).reshape(
            item["multiplicity"], item["multiplicity"]
        )
        block = (block + block.T) / 2
        eigenvalues = np.linalg.eigvalsh(block)
        block_spectrum.extend(np.repeat(eigenvalues, item["dimension"]).tolist())
        block_summaries.append({
            "s3": item["s3"],
            "bitCharacter": item["bitCharacter"],
            "daggerCharacter": item["daggerCharacter"],
            "size": item["multiplicity"],
            "minimumEigenvalue": float(eigenvalues[0]),
            "secondEigenvalue": float(eigenvalues[1]) if len(eigenvalues) > 1 else None,
            "maximumEigenvalue": float(eigenvalues[-1]),
        })
    block_spectrum = np.sort(np.asarray(block_spectrum))

    answer = {
        "schema": "oasis.radius2-rational-dual-certificate.v1",
        "claimStatus": "exact-affine-functional-with-numerically-verified-PSD-margin",
        "claimBoundary": (
            "The functional normalization and Delta kernel constraints are exact rational "
            "identities. Positive semidefiniteness is presently a high-margin numerical "
            "verification, not yet an interval or exact LDL proof."
        ),
        "quotientProblem": quotient_path,
        "reductionMetadata": metadata_path,
        "sourceCandidate": candidate_path,
        "baseDenominator": denominator,
        "baseRoundedNumerators": rounded_numerators.tolist(),
        "repairColumns": repair_columns.tolist(),
        "repairNumerators": [int(value.numerator) for value in repair],
        "repairDenominators": [int(value.denominator) for value in repair],
        "constraintConstruction": {
            "pairOrbitEntryCountLcm": count_lcm,
            "generatorCount": len(generator_indices),
            "basisOrbitKernelRows": len(basis_orbits),
            "fullConstraintRows": full_constraints.shape[0],
            "exactConstraintRank": rank,
        },
        "exactValidation": {
            "deltaValue": "1",
            "deltaKernelRowsAllZero": True,
            "deltaSquaredValue": "0",
        },
        "numericalPsdValidation": {
            "fullMomentMinimumEigenvalue": float(full_eigenvalues[0]),
            "fullMomentSecondEigenvalue": float(full_eigenvalues[1]),
            "fullMomentMaximumEigenvalue": float(full_eigenvalues[-1]),
            "fullMomentRankAt1e-7": int(np.sum(full_eigenvalues > 1e-7)),
            "deltaKernelMaximumResidual": float(np.max(abs(full_moment @ generator_sum))),
            "blockVsFullSpectrumMaximumError": float(
                np.max(abs(full_eigenvalues - block_spectrum))
            ),
            "blockSummaries": block_summaries,
        },
    }
    with open(output_path, "w", encoding="utf-8") as stream:
        json.dump(answer, stream, indent=2)
        stream.write("\n")
    return answer


if __name__ == "__main__":
    if len(sys.argv) not in (5, 6):
        raise SystemExit(
            "Usage: rationalize_radius2_dual.py QUOTIENT.json METADATA.json "
            "CANDIDATE.json OUTPUT.json [DENOMINATOR]"
        )
    result = rationalize(
        sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4],
        int(sys.argv[5]) if len(sys.argv) == 6 else 10**12,
    )
    print(json.dumps({
        key: value for key, value in result.items() if key != "baseRoundedNumerators"
    }, indent=2))
