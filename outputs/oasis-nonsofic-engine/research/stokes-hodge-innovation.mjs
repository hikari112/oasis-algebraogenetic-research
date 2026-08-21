import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { universalCantorBit } from "./universal-phantom-genesis.mjs";

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function rational(numerator, denominator = 1n) {
  assert(typeof numerator === "bigint");
  assert(typeof denominator === "bigint" && denominator !== 0n);
  let n = numerator;
  let d = denominator;
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const divisor = gcd(n, d);
  return Object.freeze({ numerator: n / divisor, denominator: d / divisor });
}

const ZERO = rational(0n);
const ONE = rational(1n);

function asRational(value) {
  if (
    value &&
    typeof value === "object" &&
    typeof value.numerator === "bigint" &&
    typeof value.denominator === "bigint"
  ) {
    return value;
  }
  if (typeof value === "bigint") return rational(value);
  assert(Number.isSafeInteger(value));
  return rational(BigInt(value));
}

function add(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return rational(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

function subtract(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return rational(
    a.numerator * b.denominator - b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

function multiply(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return rational(
    a.numerator * b.numerator,
    a.denominator * b.denominator,
  );
}

function divide(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  assert(b.numerator !== 0n);
  return rational(
    a.numerator * b.denominator,
    a.denominator * b.numerator,
  );
}

function square(value) {
  return multiply(value, value);
}

function equal(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return (
    a.numerator === b.numerator && a.denominator === b.denominator
  );
}

function compare(left, right) {
  const difference = subtract(left, right);
  return difference.numerator < 0n
    ? -1
    : difference.numerator > 0n
      ? 1
      : 0;
}

function rationalString(value) {
  const item = asRational(value);
  return `${item.numerator}/${item.denominator}`;
}

function rationalApproximation(value) {
  const item = asRational(value);
  if (item.numerator === 0n) return 0;
  const sign = item.numerator < 0n ? -1 : 1;
  const numeratorDigits = (item.numerator < 0n
    ? -item.numerator
    : item.numerator
  ).toString();
  const denominatorDigits = item.denominator.toString();
  const numeratorHeadLength = Math.min(16, numeratorDigits.length);
  const denominatorHeadLength = Math.min(16, denominatorDigits.length);
  const numeratorLog10 =
    numeratorDigits.length -
    numeratorHeadLength +
    Math.log10(Number(numeratorDigits.slice(0, numeratorHeadLength)));
  const denominatorLog10 =
    denominatorDigits.length -
    denominatorHeadLength +
    Math.log10(Number(denominatorDigits.slice(0, denominatorHeadLength)));
  return sign * 10 ** (numeratorLog10 - denominatorLog10);
}

function publicRational(value) {
  return {
    exact: rationalString(value),
    approximate: rationalApproximation(value),
  };
}

function assertIntegerWord(values) {
  assert(Array.isArray(values) && values.length > 0);
  for (const value of values) {
    assert(typeof value === "bigint" || Number.isSafeInteger(value));
  }
}

function zeroPrimitive() {
  return Object.freeze({ constant: ZERO, z: Object.freeze([]) });
}

function primitiveCoordinate(primitive, index) {
  assert(Number.isInteger(index) && index >= 0);
  return add(primitive.constant, primitive.z[index] ?? ZERO);
}

function derivativeCoordinate(primitive, index) {
  return subtract(
    primitiveCoordinate(primitive, index),
    multiply(2n, primitiveCoordinate(primitive, index + 1)),
  );
}

function innerProduct(left, right) {
  let total = multiply(left.constant, right.constant);
  const length = Math.max(left.z.length, right.z.length);
  for (let index = 0; index < length; index += 1) {
    total = add(
      total,
      multiply(left.z[index] ?? ZERO, right.z[index] ?? ZERO),
    );
  }
  return total;
}

function primitiveNormSquared(primitive) {
  return innerProduct(primitive, primitive);
}

function combinePrimitives(left, right, rightScale = ONE) {
  const scale = asRational(rightScale);
  const length = Math.max(left.z.length, right.z.length);
  const z = [];
  for (let index = 0; index < length; index += 1) {
    z.push(
      add(
        left.z[index] ?? ZERO,
        multiply(scale, right.z[index] ?? ZERO),
      ),
    );
  }
  while (z.length > 0 && equal(z.at(-1), ZERO)) z.pop();
  return Object.freeze({
    constant: add(left.constant, multiply(scale, right.constant)),
    z: Object.freeze(z),
  });
}

function subtractPrimitives(left, right) {
  return combinePrimitives(left, right, -1n);
}

function scalePrimitive(primitive, scale) {
  return combinePrimitives(zeroPrimitive(), primitive, scale);
}

function primitivesEqual(left, right) {
  if (!equal(left.constant, right.constant)) return false;
  const length = Math.max(left.z.length, right.z.length);
  for (let index = 0; index < length; index += 1) {
    if (!equal(left.z[index] ?? ZERO, right.z[index] ?? ZERO)) {
      return false;
    }
  }
  return true;
}

// The Riesz representative of the raw derivative query
// D_n(x)=x_n-2x_(n+1) on H_gen is (-1,e_n-2e_(n+1)).  The exact
// Gram-Schmidt residual below therefore computes the query capacity without
// using the minimum-primitive solver.
function rawDerivativeRiesz(queryIndex) {
  assert(Number.isInteger(queryIndex) && queryIndex >= 0);
  const z = Array.from({ length: queryIndex + 2 }, () => ZERO);
  z[queryIndex] = ONE;
  z[queryIndex + 1] = rational(-2n);
  return Object.freeze({
    constant: rational(-1n),
    z: Object.freeze(z),
  });
}

const orthogonalRieszRows = [];
const orthogonalRieszNormsSquared = [];

function ensureOrthogonalRieszRows(maxQueryIndex) {
  assert(Number.isInteger(maxQueryIndex) && maxQueryIndex >= 0);
  while (orthogonalRieszRows.length <= maxQueryIndex) {
    const queryIndex = orthogonalRieszRows.length;
    let residual = rawDerivativeRiesz(queryIndex);
    for (let index = 0; index < orthogonalRieszRows.length; index += 1) {
      const row = orthogonalRieszRows[index];
      const projectionCoefficient = divide(
        innerProduct(residual, row),
        orthogonalRieszNormsSquared[index],
      );
      residual = combinePrimitives(
        residual,
        row,
        multiply(-1n, projectionCoefficient),
      );
    }
    const normSquared = primitiveNormSquared(residual);
    assert(compare(normSquared, ZERO) > 0);
    for (const earlierRow of orthogonalRieszRows) {
      assert(equal(innerProduct(residual, earlierRow), ZERO));
    }
    orthogonalRieszRows.push(residual);
    orthogonalRieszNormsSquared.push(normSquared);
  }
}

// Schur-complement capacity of the next raw query after queries 0,...,n-1.
function derivedNextQueryCapacity(queryIndex) {
  ensureOrthogonalRieszRows(queryIndex);
  return orthogonalRieszNormsSquared[queryIndex];
}

// Capacity of any raw derivative query after the finite block 0,...,oldMax.
// In particular, a duplicated row projects away exactly and has capacity zero.
function derivedRawQueryCapacity(oldMaxQueryIndex, queryIndex) {
  assert(Number.isInteger(oldMaxQueryIndex) && oldMaxQueryIndex >= 0);
  assert(Number.isInteger(queryIndex) && queryIndex >= 0);
  ensureOrthogonalRieszRows(oldMaxQueryIndex);
  let residual = rawDerivativeRiesz(queryIndex);
  for (let index = 0; index <= oldMaxQueryIndex; index += 1) {
    const row = orthogonalRieszRows[index];
    const projectionCoefficient = divide(
      innerProduct(residual, row),
      orthogonalRieszNormsSquared[index],
    );
    residual = combinePrimitives(
      residual,
      row,
      multiply(-1n, projectionCoefficient),
    );
  }
  return primitiveNormSquared(residual);
}

// Exact Moore-Penrose primitive for the finite observation map
// x |-> (Dx)_0,...,(Dx)_(length-1) on
// H_gen = {x_n=c+z_n : c in R, z in l2}.
function solveMinimumPrimitive(values) {
  assertIntegerWord(values);
  const length = values.length;
  const terminalPrimitive = Array.from({ length: length + 1 }, () => 0n);
  for (let index = length - 1; index >= 0; index -= 1) {
    terminalPrimitive[index] =
      BigInt(values[index]) + 2n * terminalPrimitive[index + 1];
  }
  const homogeneous = Array.from(
    { length: length + 1 },
    (_unused, index) => 1n << BigInt(length - index),
  );

  const coordinateCount = BigInt(length + 1);
  const constantCoefficient = coordinateCount + 1n;
  let sumA = 0n;
  let sumH = 0n;
  let sumAA = 0n;
  let sumAH = 0n;
  let sumHH = 0n;
  for (let index = 0; index <= length; index += 1) {
    const a = terminalPrimitive[index];
    const h = homogeneous[index];
    sumA += a;
    sumH += h;
    sumAA += a * a;
    sumAH += a * h;
    sumHH += h * h;
  }

  const determinant = constantCoefficient * sumHH - sumH * sumH;
  assert(determinant > 0n);
  const constantNumerator = sumA * sumHH - sumH * sumAH;
  const boundaryNumerator =
    sumH * sumA - constantCoefficient * sumAH;

  assert.equal(
    constantCoefficient * constantNumerator - sumH * boundaryNumerator,
    sumA * determinant,
  );
  assert.equal(
    -sumH * constantNumerator + sumHH * boundaryNumerator,
    -sumAH * determinant,
  );

  const removedQuadratic =
    sumHH * sumA * sumA -
    2n * sumH * sumA * sumAH +
    constantCoefficient * sumAH * sumAH;
  const costNumerator = sumAA * determinant - removedQuadratic;
  assert(costNumerator >= 0n);

  const constant = rational(constantNumerator, determinant);
  const z = [];
  for (let index = 0; index <= length; index += 1) {
    const coordinateNumerator =
      terminalPrimitive[index] * determinant +
      homogeneous[index] * boundaryNumerator;
    z.push(subtract(rational(coordinateNumerator, determinant), constant));
  }
  while (z.length > 0 && equal(z.at(-1), ZERO)) z.pop();
  const primitive = Object.freeze({ constant, z: Object.freeze(z) });
  const costSquared = rational(costNumerator, determinant);

  assert(equal(primitiveNormSquared(primitive), costSquared));
  for (let index = 0; index < length; index += 1) {
    assert(equal(derivativeCoordinate(primitive, index), values[index]));
  }

  return Object.freeze({ primitive, costSquared });
}

const unitInnovationCache = new Map();

// The unit innovation is the minimum primitive satisfying zero old queries and
// value one on the new coordinate. Its squared norm is later cross-checked
// against, but does not define, the independently derived Riesz-row capacity.
function unitInnovation(queryIndex) {
  assert(Number.isInteger(queryIndex) && queryIndex >= 0);
  if (!unitInnovationCache.has(queryIndex)) {
    const values = [...Array(queryIndex).fill(0), 1];
    const solution = solveMinimumPrimitive(values);
    assert(compare(solution.costSquared, ZERO) > 0);
    unitInnovationCache.set(
      queryIndex,
      Object.freeze(solution),
    );
  }
  return unitInnovationCache.get(queryIndex);
}

function queryBranch(capacity, residual) {
  const cap = asRational(capacity);
  const res = asRational(residual);
  if (equal(cap, ZERO)) {
    return Object.freeze({
      kind: equal(res, ZERO) ? "redundant" : "inconsistent",
      feasible: equal(res, ZERO),
      incrementSquared: equal(res, ZERO) ? ZERO : null,
    });
  }
  return Object.freeze({
    kind: "innovation",
    feasible: true,
    incrementSquared: divide(square(res), cap),
  });
}

function stepInnovation(previous, current, newValue, queryIndex) {
  const predicted = derivativeCoordinate(previous.primitive, queryIndex);
  const residual = subtract(newValue, predicted);
  const unit = unitInnovation(queryIndex);
  const capacity = derivedNextQueryCapacity(queryIndex);
  assert(equal(capacity, divide(ONE, unit.costSquared)));
  const branch = queryBranch(capacity, residual);
  assert.equal(branch.kind, "innovation");

  const increment = subtractPrimitives(current.primitive, previous.primitive);
  const expectedIncrement = scalePrimitive(unit.primitive, residual);
  assert(primitivesEqual(increment, expectedIncrement));

  const orthogonality = innerProduct(previous.primitive, increment);
  assert(equal(orthogonality, ZERO));
  const incrementSquared = primitiveNormSquared(increment);
  assert(equal(incrementSquared, branch.incrementSquared));
  assert(
    equal(
      current.costSquared,
      add(previous.costSquared, incrementSquared),
    ),
  );

  return Object.freeze({
    predicted,
    residual,
    capacity,
    increment,
    incrementSquared,
  });
}

function geometricEndpoints(maxDepth) {
  const endpoints = [-1, 0, 1, 2];
  for (let value = 4; value < maxDepth; value *= 2) endpoints.push(value);
  if (!endpoints.includes(maxDepth)) endpoints.push(maxDepth);
  return endpoints.filter((value, index, array) =>
    value <= maxDepth && array.indexOf(value) === index,
  );
}

function auditFiniteGeometricBlocks(solutions, increments, maxDepth) {
  const endpoints = geometricEndpoints(maxDepth);
  const zero = Object.freeze({ primitive: zeroPrimitive(), costSquared: ZERO });
  const solutionAt = (depth) => (depth < 0 ? zero : solutions[depth]);
  const blocks = [];
  let checks = 0;
  for (let block = 1; block < endpoints.length; block += 1) {
    const from = endpoints[block - 1];
    const to = endpoints[block];
    const difference = subtractPrimitives(
      solutionAt(to).primitive,
      solutionAt(from).primitive,
    );
    const blockNormSquared = primitiveNormSquared(difference);
    let incrementSum = ZERO;
    for (let index = from + 1; index <= to; index += 1) {
      incrementSum = add(incrementSum, increments[index].incrementSquared);
    }
    const telescopedCost = subtract(
      solutionAt(to).costSquared,
      solutionAt(from).costSquared,
    );
    assert(equal(blockNormSquared, incrementSum));
    assert(equal(incrementSum, telescopedCost));
    blocks.push({
      fromDepth: from,
      toDepth: to,
      blockEnergyExact: rationalString(blockNormSquared),
    });
    checks += 2;
  }
  return { endpoints, checks, blocks };
}

function auditTrajectory(name, valueFactory, maxDepth, selectedDepths) {
  const solutions = [];
  const increments = [];
  const zero = Object.freeze({ primitive: zeroPrimitive(), costSquared: ZERO });
  let previous = zero;
  let constraintChecks = 0;
  let pythagorasChecks = 0;
  let residualCapacityChecks = 0;
  const selected = [];

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const values = valueFactory(depth + 1);
    const current = solveMinimumPrimitive(values);
    for (let index = 0; index <= depth; index += 1) {
      assert(equal(derivativeCoordinate(current.primitive, index), values[index]));
      constraintChecks += 1;
    }
    assert(compare(current.costSquared, previous.costSquared) >= 0);
    const innovation = stepInnovation(
      previous,
      current,
      values[depth],
      depth,
    );
    increments.push(innovation);
    solutions.push(current);
    pythagorasChecks += 1;
    residualCapacityChecks += 1;

    if (selectedDepths.includes(depth)) {
      selected.push({
        depth,
        costSquaredExact: rationalString(current.costSquared),
        costApproximate: Math.sqrt(rationalApproximation(current.costSquared)),
        residualExact: rationalString(innovation.residual),
        capacityExact: rationalString(innovation.capacity),
        incrementSquaredExact: rationalString(innovation.incrementSquared),
      });
    }
    previous = current;
  }

  let pairwiseOrthogonalityChecks = 0;
  for (let left = 0; left < increments.length; left += 1) {
    for (let right = left + 1; right < increments.length; right += 1) {
      assert(
        equal(
          innerProduct(increments[left].increment, increments[right].increment),
          ZERO,
        ),
      );
      pairwiseOrthogonalityChecks += 1;
    }
  }

  const finiteGeometricBlocks = auditFiniteGeometricBlocks(
    solutions,
    increments,
    maxDepth,
  );
  return {
    name,
    maxDepth,
    exactChecks: {
      constraintChecks,
      pythagorasChecks,
      residualCapacityChecks,
      pairwiseOrthogonalityChecks,
      finiteGeometricBlockChecks: finiteGeometricBlocks.checks,
    },
    selected,
    finiteGeometricBlocks,
    terminalCostSquared: publicRational(solutions.at(-1).costSquared),
    _solutions: solutions,
    _increments: increments,
  };
}

function publicTrajectory(audit) {
  const { _solutions, _increments, ...result } = audit;
  return result;
}

function universalValues(length) {
  return Array.from({ length }, (_unused, index) =>
    universalCantorBit(BigInt(index)),
  );
}

function alternatingValues(length) {
  return Array.from({ length }, (_unused, index) => index % 2);
}

function sparseValues(length) {
  return Array.from({ length }, (_unused, index) =>
    index > 0 && (index & (index - 1)) === 0 ? 1 : 0,
  );
}

function integerPadicValues(integer, length) {
  assert(Number.isSafeInteger(integer));
  const value = BigInt.asUintN(length, BigInt(integer));
  return Array.from({ length }, (_unused, index) =>
    Number((value >> BigInt(index)) & 1n),
  );
}

function auditSignGauge(values) {
  assertIntegerWord(values);
  const negative = values.map((value) => -Number(value));
  const positiveSolution = solveMinimumPrimitive(values);
  const negativeSolution = solveMinimumPrimitive(negative);
  assert(equal(positiveSolution.costSquared, negativeSolution.costSquared));
  assert(
    primitivesEqual(
      negativeSolution.primitive,
      scalePrimitive(positiveSolution.primitive, -1n),
    ),
  );

  const previousPositive =
    values.length === 1
      ? Object.freeze({ primitive: zeroPrimitive(), costSquared: ZERO })
      : solveMinimumPrimitive(values.slice(0, -1));
  const previousNegative =
    values.length === 1
      ? Object.freeze({ primitive: zeroPrimitive(), costSquared: ZERO })
      : solveMinimumPrimitive(negative.slice(0, -1));
  const queryIndex = values.length - 1;
  const positiveResidual = subtract(
    values.at(-1),
    derivativeCoordinate(previousPositive.primitive, queryIndex),
  );
  const negativeResidual = subtract(
    negative.at(-1),
    derivativeCoordinate(previousNegative.primitive, queryIndex),
  );
  assert(equal(negativeResidual, multiply(-1n, positiveResidual)));
  const capacity = derivedNextQueryCapacity(queryIndex);
  assert(equal(capacity, divide(ONE, unitInnovation(queryIndex).costSquared)));

  return {
    gauge: "U=-I on H_gen and V=-I on the observed data coordinates",
    unitary: true,
    costPreserved: true,
    primitiveSignCovariant: true,
    residualSignCovariant: true,
    capacityPreserved: publicRational(capacity),
  };
}

function auditCapacityCrossChecks(depths) {
  return depths.map((depth) => {
    const rieszCapacity = derivedNextQueryCapacity(depth);
    const unitSolveCapacity = divide(
      ONE,
      unitInnovation(depth).costSquared,
    );
    assert(equal(rieszCapacity, unitSolveCapacity));
    return {
      depth,
      capacityExact: rationalString(rieszCapacity),
    };
  });
}

function auditDegenerateQueryBranches(values) {
  assertIntegerWord(values);
  const solution = solveMinimumPrimitive(values);
  const duplicateIndex = Math.floor(values.length / 2);
  const existingValue = asRational(values[duplicateIndex]);
  const observedValue = derivativeCoordinate(solution.primitive, duplicateIndex);
  assert(equal(existingValue, observedValue));

  // Independently project the duplicated Riesz row off the finite span of all
  // existing query rows. Exact Gram-Schmidt gives the zero residual norm.
  const duplicateCapacity = derivedRawQueryCapacity(
    values.length - 1,
    duplicateIndex,
  );
  assert(equal(duplicateCapacity, ZERO));
  const redundantResidual = subtract(existingValue, observedValue);
  const redundant = queryBranch(
    duplicateCapacity,
    redundantResidual,
  );
  assert.equal(redundant.kind, "redundant");
  assert.equal(redundant.feasible, true);
  assert(equal(redundant.incrementSquared, ZERO));

  const conflictingValue = add(existingValue, ONE);
  const inconsistentResidual = subtract(conflictingValue, observedValue);
  const inconsistent = queryBranch(
    duplicateCapacity,
    inconsistentResidual,
  );
  assert.equal(inconsistent.kind, "inconsistent");
  assert.equal(inconsistent.feasible, false);
  assert.equal(inconsistent.incrementSquared, null);

  return {
    duplicatedQuery: `D(x)_${duplicateIndex}`,
    capacity: publicRational(duplicateCapacity),
    redundantBranch: {
      requestedValue: rationalString(existingValue),
      residual: rationalString(redundantResidual),
      kind: redundant.kind,
      feasible: redundant.feasible,
      energyIncrement: "0/1",
    },
    inconsistentBranch: {
      requestedValue: rationalString(conflictingValue),
      residual: rationalString(inconsistentResidual),
      kind: inconsistent.kind,
      feasible: inconsistent.feasible,
      minimumPrimitiveExists: false,
    },
  };
}

export function runStokesHodgeInnovation() {
  const maxDepth = 64;
  const selectedDepths = [0, 1, 2, 4, 8, 16, 32, 64];
  const universal = auditTrajectory(
    "universal Cantor stream",
    universalValues,
    maxDepth,
    selectedDepths,
  );
  const alternating = auditTrajectory(
    "period-two alternating stream",
    alternatingValues,
    maxDepth,
    selectedDepths,
  );
  const sparse = auditTrajectory(
    "ones at positive powers of two",
    sparseValues,
    maxDepth,
    selectedDepths,
  );
  const positiveInteger = auditTrajectory(
    "2-adic digits of 17",
    (length) => integerPadicValues(17, length),
    maxDepth,
    selectedDepths,
  );
  const negativeInteger = auditTrajectory(
    "2-adic digits of -17",
    (length) => integerPadicValues(-17, length),
    maxDepth,
    selectedDepths,
  );

  assert(
    compare(
      universal._solutions.at(-1).costSquared,
      universal._solutions[32].costSquared,
    ) > 0,
  );
  assert(
    compare(
      alternating._solutions.at(-1).costSquared,
      alternating._solutions[32].costSquared,
    ) > 0,
  );
  assert(
    compare(
      sparse._solutions.at(-1).costSquared,
      sparse._solutions[32].costSquared,
    ) > 0,
  );

  const signGaugeControls = {
    universal: auditSignGauge(universalValues(33)),
    alternating: auditSignGauge(alternatingValues(33)),
    sparse: auditSignGauge(sparseValues(33)),
    positiveInteger: auditSignGauge(integerPadicValues(17, 33)),
    negativeInteger: auditSignGauge(integerPadicValues(-17, 33)),
  };
  const degenerateQueries = auditDegenerateQueryBranches(alternatingValues(17));
  const capacityCrossChecks = auditCapacityCrossChecks(selectedDepths);

  return {
    schema: "oasis.stokes-hodge-innovation.v2",
    status:
      "exact finite innovation calculus for nested minimum primitives in H_gen",
    theorem: {
      nestedMinimum:
        "p_N is the Moore-Penrose minimum primitive for the first N+1 exact derivative queries",
      orthogonalIncrement:
        "g_N=p_N-p_(N-1) is orthogonal to p_(N-1) and to every later innovation",
      pythagoras:
        "K_N^2=K_(N-1)^2+||q_N||^2, verified as an exact rational identity",
      residualOverCapacity:
        "||q_N||^2=r_N^2/C_N, where C_N is the squared norm of the new query restricted to the old homogeneous space",
      finiteGeometricBlockAdditivity:
        "the squared norm added across each geometric block is the exact sum of its orthogonal innovation energies",
      cofinalInterpretation:
        "every finite block cut from a cofinal schedule obeys the same identity; the finite checks do not establish invariance under arbitrary cofinal rates",
    },
    capacityDerivation: {
      method:
        "exact Gram-Schmidt projection of the raw derivative Riesz rows (-1,e_n-2e_(n+1))",
      independentCrossCheck:
        "each selected Riesz capacity equals the reciprocal squared norm of the independently solved unit innovation",
      selectedDepths: capacityCrossChecks,
    },
    queryBranches: {
      positiveCapacity: "innovation with energy r^2/C",
      zeroCapacityZeroResidual: "redundant query with zero increment",
      zeroCapacityNonzeroResidual: "inconsistent query with empty feasible set",
      executableControls: degenerateQueries,
    },
    gaugeControl: signGaugeControls,
    comparisons: {
      soficAlternating: {
        symbolicSystem: "period-two finite-state system, hence sofic",
        derivedClass: "nonzero because its canonical 2-adic digits are not eventually constant",
        conclusion:
          "primitive innovation and escape do not require non-soficity",
      },
      controlsThroughDepth64: {
        universal: publicTrajectory(universal),
        alternating: publicTrajectory(alternating),
        sparse: publicTrajectory(sparse),
        positiveInteger: publicTrajectory(positiveInteger),
        negativeInteger: publicTrajectory(negativeInteger),
      },
    },
    claimBoundary: {
      finiteChecksProveAsymptoticEscape: false,
      asymptoticClassificationSource:
        "the separate primitive-escape theorem: bounded iff the canonical digit stream is eventually zero or one",
      invariantUnderArbitraryGauge: false,
      testedGauge: "global sign unitary only",
      arbitraryCofinalRateInvariant: false,
      nonsoficityNecessary: false,
      endogenousQuestionGenesisEstablished: false,
    },
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runStokesHodgeInnovation(), null, 2));
}
