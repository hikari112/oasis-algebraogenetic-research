import json
import math
import sys
from pathlib import Path

import numpy as np
from scipy import linalg, sparse


def parity(permutation: list[int]) -> int:
    inversions = sum(
        permutation[left] > permutation[right]
        for left in range(len(permutation))
        for right in range(left + 1, len(permutation))
    )
    return 1 if inversions % 2 == 0 else -1


def s3_character(kind: str, permutation: list[int]) -> int:
    if kind == "trivial":
        return 1
    if kind == "sign":
        return parity(permutation)
    return sum(index == image for index, image in enumerate(permutation)) - 1


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


def exact_transpose_product(matrix: sparse.csr_matrix, vector: list[int]) -> list[int]:
    answer = [0] * matrix.shape[1]
    for row in range(matrix.shape[0]):
        multiplier = vector[row]
        if multiplier == 0:
            continue
        for index in range(matrix.indptr[row], matrix.indptr[row + 1]):
            answer[int(matrix.indices[index])] += int(matrix.data[index]) * multiplier
    return answer


def isotypic_projector_integer(
    quotient: dict, actions: np.ndarray, irrep: dict
) -> np.ndarray:
    size = quotient["basisSize"]
    dimension = irrep["dimension"]
    projector = np.zeros((size, size), dtype=np.int16)
    sources = np.arange(size)
    for transformation, action in zip(quotient["transformations"], actions):
        character = s3_character(irrep["s3"], transformation["indexPermutation"])
        if transformation["bitFlip"]:
            character *= irrep["bitCharacter"]
        if transformation["dagger"]:
            character *= irrep["daggerCharacter"]
        if character:
            projector[action, sources] += dimension * character
    if not np.array_equal(projector, projector.T):
        raise RuntimeError("A central character projector is not symmetric")
    return projector


def independent_projector_columns(
    projector: np.ndarray, rank: int, forced_kernel: np.ndarray | None = None
) -> np.ndarray:
    if forced_kernel is None:
        _, factor, pivots = linalg.qr(
            projector.astype(float), mode="economic", pivoting=True
        )
        if np.min(abs(np.diag(factor)[:rank])) < 1e-8:
            raise RuntimeError("Character projector column selection lost rank")
        return projector[:, pivots[:rank]].astype(np.int64)
    projected = projector.astype(float) - np.outer(
        forced_kernel,
        forced_kernel @ projector / (forced_kernel @ forced_kernel),
    )
    _, factor, pivots = linalg.qr(projected, mode="economic", pivoting=True)
    complement_rank = rank - 1
    if np.min(abs(np.diag(factor)[:complement_rank])) < 1e-8:
        raise RuntimeError("Could not select a complement to the forced kernel")
    basis = projector[:, pivots[:complement_rank]].astype(np.int64)
    augmented_rank = np.linalg.matrix_rank(
        np.column_stack([forced_kernel, basis]).astype(float), tol=1e-8
    )
    if augmented_rank != rank:
        raise RuntimeError("Selected trivial-isotypic basis misses the kernel complement")
    return basis


def congruence_block(
    basis: np.ndarray,
    moment_numerators: list[int],
    pair_orbit_matrix: np.ndarray,
) -> list[list[int]]:
    supports = []
    for column in range(basis.shape[1]):
        indices = np.flatnonzero(basis[:, column])
        supports.append([
            (int(index), int(basis[index, column])) for index in indices
        ])
    size = basis.shape[1]
    block = [[0] * size for _ in range(size)]
    for left in range(size):
        for right in range(left, size):
            value = 0
            for row, left_value in supports[left]:
                orbit_row = pair_orbit_matrix[row]
                for column, right_value in supports[right]:
                    value += (
                        left_value
                        * right_value
                        * moment_numerators[int(orbit_row[column])]
                    )
            block[left][right] = value
            block[right][left] = value
    return block


def bareiss_positive_definite(matrix: list[list[int]]) -> dict:
    size = len(matrix)
    work = [row[:] for row in matrix]
    previous = 1
    determinant_bit_lengths = []
    for pivot_index in range(size - 1):
        pivot = work[pivot_index][pivot_index]
        if pivot <= 0:
            return {
                "positiveDefinite": False,
                "failedLeadingMinor": pivot_index + 1,
                "failedPivot": str(pivot),
            }
        determinant_bit_lengths.append(pivot.bit_length())
        for row in range(pivot_index + 1, size):
            for column in range(row, size):
                numerator = (
                    work[row][column] * pivot
                    - work[row][pivot_index] * work[pivot_index][column]
                )
                quotient, remainder = divmod(numerator, previous)
                if remainder:
                    raise RuntimeError("Bareiss division was not exact")
                work[row][column] = quotient
                work[column][row] = quotient
        previous = pivot
    final_pivot = work[-1][-1]
    if final_pivot <= 0:
        return {
            "positiveDefinite": False,
            "failedLeadingMinor": size,
            "failedPivot": str(final_pivot),
        }
    determinant_bit_lengths.append(final_pivot.bit_length())
    return {
        "positiveDefinite": True,
        "leadingMinorCount": size,
        "firstLeadingMinorBits": determinant_bit_lengths[0],
        "finalDeterminantBits": determinant_bit_lengths[-1],
        "maximumLeadingMinorBits": max(determinant_bit_lengths),
    }


def verify(
    certificate_path: str,
    quotient_path: str,
    metadata_path: str,
    report_path: str,
) -> dict:
    with open(certificate_path, "r", encoding="utf-8") as stream:
        certificate = json.load(stream)
    with open(quotient_path, "r", encoding="utf-8") as stream:
        quotient = json.load(stream)
    with open(metadata_path, "r", encoding="utf-8") as stream:
        metadata = json.load(stream)
    coefficient_map = sparse.load_npz(metadata["coefficientMapPath"]).tocsr()
    targets = np.load(metadata["targetPath"])
    delta = np.asarray(targets["delta"], dtype=np.int64)
    pair_counts = np.asarray(targets["pair_orbit_entry_counts"], dtype=np.int64)
    actions = np.asarray(
        [item["basisPermutation"] for item in quotient["transformations"]],
        dtype=np.int32,
    )
    pair_orbit_matrix = pair_orbits(actions, quotient["basisSize"])

    repair_lcm = math.lcm(*certificate["repairDenominators"])
    functional_numerators = [
        int(value) * repair_lcm for value in certificate["baseRoundedNumerators"]
    ]
    for column, numerator, denominator in zip(
        certificate["repairColumns"],
        certificate["repairNumerators"],
        certificate["repairDenominators"],
    ):
        functional_numerators[int(column)] += int(numerator) * (
            repair_lcm // int(denominator)
        )
    functional_denominator = int(certificate["baseDenominator"]) * repair_lcm
    delta_numerator = sum(
        int(value) * functional_numerators[index]
        for index, value in enumerate(delta)
    )
    if delta_numerator != functional_denominator:
        raise RuntimeError("The exact functional no longer has L(Delta)=1")

    moment_raw = exact_transpose_product(coefficient_map, functional_numerators)
    count_lcm = math.lcm(*(int(value) for value in pair_counts))
    moment_numerators = [
        value * (count_lcm // int(count))
        for value, count in zip(moment_raw, pair_counts)
    ]
    moment_denominator = functional_denominator * count_lcm
    generator_indices = [
        index
        for index, item in enumerate(quotient["basis"])
        if len(item["representativeWord"]) == 1
    ]
    kernel_residuals = [
        sum(moment_numerators[int(pair_orbit_matrix[row, column])]
            for column in generator_indices)
        for row in range(quotient["basisSize"])
    ]
    if any(kernel_residuals):
        raise RuntimeError("The exact moment matrix does not annihilate Delta")

    generator_sum = np.zeros(quotient["basisSize"], dtype=np.int64)
    generator_sum[generator_indices] = 1
    component_reports = []
    reconstructed_dimension = 0
    for index, irrep in enumerate(metadata["decomposition"]):
        full_rank = irrep["dimension"] * irrep["multiplicity"]
        projector = isotypic_projector_integer(quotient, actions, irrep)
        numerical_rank = int(np.linalg.matrix_rank(projector.astype(float), tol=1e-8))
        if numerical_rank != full_rank:
            raise RuntimeError(
                f"Character projector rank mismatch in component {index}: "
                f"{numerical_rank} != {full_rank}"
            )
        is_kernel_component = (
            irrep["s3"] == "trivial"
            and irrep["bitCharacter"] == 1
            and irrep["daggerCharacter"] == 1
        )
        basis = independent_projector_columns(
            projector,
            full_rank,
            generator_sum if is_kernel_component else None,
        )
        print(
            f"component {index + 1}/12: building exact {basis.shape[1]}x{basis.shape[1]} block",
            flush=True,
        )
        block = congruence_block(basis, moment_numerators, pair_orbit_matrix)
        print(
            f"component {index + 1}/12: running fraction-free positivity check",
            flush=True,
        )
        positivity = bareiss_positive_definite(block)
        if not positivity["positiveDefinite"]:
            raise RuntimeError(
                f"Exact PSD verification failed in component {index}: {positivity}"
            )
        component_reports.append({
            "index": index,
            "s3": irrep["s3"],
            "bitCharacter": irrep["bitCharacter"],
            "daggerCharacter": irrep["daggerCharacter"],
            "isotypicDimension": full_rank,
            "verifiedComplementDimension": basis.shape[1],
            "forcedKernelRemoved": is_kernel_component,
            "integerBasisMaximumAbsoluteEntry": int(np.max(abs(basis))),
            "positivity": positivity,
        })
        reconstructed_dimension += basis.shape[1] + int(is_kernel_component)

    if reconstructed_dimension != quotient["basisSize"]:
        raise RuntimeError("Exact character components do not reconstruct the basis")
    report = {
        "schema": "oasis.radius2-exact-psd-verification.v1",
        "claimStatus": "exact-rational-dual-obstruction-verified",
        "certificate": certificate_path,
        "quotientProblem": quotient_path,
        "reductionMetadata": metadata_path,
        "theorem": (
            "The rational functional has L(Delta)=1, L(Delta^2)=0, and a "
            "positive-semidefinite radius-two moment matrix with kernel exactly span{Delta}. "
            "Therefore Delta^2-lambda Delta is not a radius-two sum of Hermitian squares "
            "for any lambda>0."
        ),
        "exactFunctionalDenominatorDigits": len(str(functional_denominator)),
        "exactMomentDenominatorDigits": len(str(moment_denominator)),
        "deltaValue": "1",
        "deltaSquaredValue": "0",
        "kernelDimension": 1,
        "momentRank": quotient["basisSize"] - 1,
        "symmetryOrder": len(quotient["transformations"]),
        "componentDimensionSum": reconstructed_dimension,
        "componentReports": component_reports,
        "verificationMethod": (
            "Exact integer central character projectors for S3 x C2 x C2, "
            "followed by fraction-free Bareiss verification that every leading "
            "principal minor is positive on all twelve isotypic components after "
            "removing the exact Delta kernel."
        ),
    }
    Path(report_path).parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    return report


if __name__ == "__main__":
    if len(sys.argv) != 5:
        raise SystemExit(
            "Usage: verify_radius2_rational_psd.py CERTIFICATE.json QUOTIENT.json "
            "METADATA.json REPORT.json"
        )
    result = verify(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
    print(json.dumps(result, indent=2))
