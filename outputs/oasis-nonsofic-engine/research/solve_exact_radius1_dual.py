import json
import sys
from collections import Counter
from fractions import Fraction


def fraction_text(value: Fraction) -> str:
    return str(value.numerator) if value.denominator == 1 else f"{value.numerator}/{value.denominator}"


def solve_linear_system(rows: list[tuple[dict[int, Fraction], Fraction]], variable_count: int):
    unique = {}
    for coefficients, rhs in rows:
        key = (tuple(sorted(coefficients.items())), rhs)
        unique[key] = (dict(coefficients), rhs)
    matrix = list(unique.values())
    pivot_for_column: dict[int, int] = {}
    pivot_row = 0
    for column in range(variable_count):
        selected = next(
            (index for index in range(pivot_row, len(matrix)) if matrix[index][0].get(column, 0)),
            None,
        )
        if selected is None:
            continue
        matrix[pivot_row], matrix[selected] = matrix[selected], matrix[pivot_row]
        coefficients, rhs = matrix[pivot_row]
        pivot = coefficients[column]
        coefficients = {key: value / pivot for key, value in coefficients.items()}
        rhs /= pivot
        matrix[pivot_row] = (coefficients, rhs)
        for index, (other, other_rhs) in enumerate(matrix):
            if index == pivot_row or not other.get(column, 0):
                continue
            factor = other[column]
            updated = dict(other)
            for key, value in coefficients.items():
                next_value = updated.get(key, Fraction(0)) - factor * value
                if next_value:
                    updated[key] = next_value
                else:
                    updated.pop(key, None)
            matrix[index] = (updated, other_rhs - factor * rhs)
        pivot_for_column[column] = pivot_row
        pivot_row += 1

    for coefficients, rhs in matrix:
        if not coefficients and rhs:
            raise RuntimeError("The exact regular-simplex moment system is inconsistent")

    solution = [Fraction(0) for _ in range(variable_count)]
    for column, row_index in reversed(list(pivot_for_column.items())):
        coefficients, rhs = matrix[row_index]
        solution[column] = rhs - sum(
            value * solution[key]
            for key, value in coefficients.items()
            if key != column
        )
    return solution, len(pivot_for_column), len(matrix)


def solve(problem_path: str, symmetry_path: str, output_path: str) -> dict:
    with open(problem_path, "r", encoding="utf-8") as stream:
        problem = json.load(stream)
    with open(symmetry_path, "r", encoding="utf-8") as stream:
        symmetry = json.load(stream)

    orbits = symmetry["radiusOne"]["orbits"]
    orbit_by_hash = {}
    for orbit_index, orbit in enumerate(orbits):
        for exact_hash in orbit["memberHashes"]:
            if exact_hash in orbit_by_hash:
                raise RuntimeError("A hash occurs in two symmetry orbits")
            orbit_by_hash[exact_hash] = orbit_index
    if len(orbit_by_hash) != symmetry["radiusOne"]["elementCount"]:
        raise RuntimeError("Orbit membership does not cover the radius-one universe")

    size = len(problem["basis"])
    equations: dict[tuple[int, int], dict[int, Fraction]] = {
        (left, right): {} for left in range(size) for right in range(size)
    }
    for contribution in problem["gramContributions"]:
        key = (contribution["left"], contribution["right"])
        orbit_index = orbit_by_hash[contribution["exactHash"]]
        value = equations[key].get(orbit_index, Fraction(0)) + Fraction(contribution["coefficient"])
        if value:
            equations[key][orbit_index] = value
        else:
            equations[key].pop(orbit_index, None)

    rows = []
    for (left, right), coefficients in equations.items():
        target = Fraction(29, 30) if left == right else Fraction(-1, 30)
        rows.append((coefficients, target))
    solution, rank, reduced_equation_count = solve_linear_system(rows, len(orbits))

    for coefficients, rhs in rows:
        actual = sum(value * solution[index] for index, value in coefficients.items())
        if actual != rhs:
            raise RuntimeError("Exact moment-system verification failed")

    def pairing(terms: dict[str, int]) -> Fraction:
        return sum(
            Fraction(coefficient) * solution[orbit_by_hash[exact_hash]]
            for exact_hash, coefficient in terms.items()
        )

    delta_pairing = pairing(problem["delta"])
    delta_squared_pairing = pairing(problem["deltaSquared"])
    if not delta_pairing > 0:
        raise RuntimeError("The exact dual does not separate positive lambda")
    if delta_squared_pairing != 0:
        raise RuntimeError("The exact dual does not annihilate Delta squared")

    value_counts = Counter(solution)
    exact_by_hash = {
        exact_hash: fraction_text(solution[orbit_index])
        for exact_hash, orbit_index in orbit_by_hash.items()
    }
    report = {
        "schema": "oasis.exact-radius1-sos-dual-certificate.v1",
        "status": "exact-rational-certificate",
        "claim": "no-positive-lambda-SOS-in-the-generator-minus-identity-radius1-cone",
        "claimBoundary": "does-not-rule-out-larger-radius-or-other-polynomial-bases",
        "basisSize": size,
        "symmetryOrbitVariableCount": len(orbits),
        "linearSystemRank": rank,
        "freeVariableCount": len(orbits) - rank,
        "reducedEquationCount": reduced_equation_count,
        "momentMatrix": {
            "exactForm": "I_30 - (1/30) * 1*1^T",
            "diagonal": "29/30",
            "offDiagonal": "-1/30",
            "rank": 29,
            "nullspace": "span(all-ones vector)",
            "positivityIdentity": "c^T M c = (1/30) * sum_{i<j} (c_i-c_j)^2 >= 0",
        },
        "deltaPairing": fraction_text(delta_pairing),
        "deltaSquaredPairing": fraction_text(delta_squared_pairing),
        "separation": (
            "For lambda>0, L(Delta^2-lambda*Delta)="
            f"-{fraction_text(delta_pairing)}*lambda<0, while L(sum xi*xi)>=0."
        ),
        "distinctOrbitValueCount": len(value_counts),
        "orbitValueDistribution": [
            {"value": fraction_text(value), "orbitCount": count}
            for value, count in sorted(value_counts.items(), key=lambda item: (item[0], item[1]))
        ],
        "orbits": [
            {
                "index": index,
                "size": orbit["size"],
                "representativeHash": orbit["representativeHash"],
                "representativeWord": orbit["representativeWord"],
                "value": fraction_text(solution[index]),
            }
            for index, orbit in enumerate(orbits)
        ],
        "dualByExactHash": exact_by_hash,
    }
    with open(output_path, "w", encoding="utf-8") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    return report


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("Usage: solve_exact_radius1_dual.py PROBLEM.json SYMMETRY.json OUTPUT.json")
    answer = solve(sys.argv[1], sys.argv[2], sys.argv[3])
    print(json.dumps({key: value for key, value in answer.items() if key not in ("orbits", "dualByExactHash")}, indent=2))
