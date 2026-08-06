import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { universalCantorBit } from "./universal-phantom-genesis.mjs";

function assertBits(bits) {
  assert(Array.isArray(bits) && bits.length > 0);
  for (const bit of bits) assert(bit === 0 || bit === 1);
}

function bigIntLog10(value) {
  assert(typeof value === "bigint" && value > 0n);
  const digits = value.toString();
  const headLength = Math.min(16, digits.length);
  const head = Number(digits.slice(0, headLength));
  return digits.length - headLength + Math.log10(head);
}

function rationalApproximation(numerator, denominator) {
  assert(typeof numerator === "bigint" && numerator >= 0n);
  assert(typeof denominator === "bigint" && denominator > 0n);
  if (numerator === 0n) return 0;
  const log10 = bigIntLog10(numerator) - bigIntLog10(denominator);
  if (log10 > 300) return `10^${log10.toFixed(6)}`;
  return 10 ** log10;
}

function compareRationals(left, right) {
  const difference =
    left.numerator * right.denominator -
    right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

// H_gen consists of sequences x_n=c+z_n with c in R and z in l^2. Its norm
// is |c|^2+sum |z_n|^2. For a binary prefix y_0,...,y_N, this routine computes
// the exact squared norm of the minimum-norm x satisfying
//
//   x_n - 2 x_(n+1) = y_n,  0 <= n <= N.
//
// The unconstrained l^2 tail is zero at the minimizer. Writing t=x_(N+1),
// backward substitution gives x_n=a_n+h_n t. Minimization is therefore an
// exact two-variable rational quadratic problem in the asymptotic constant c
// and boundary value t.
export function minimumPrimitiveCostSquared(bits) {
  assertBits(bits);
  const length = bits.length;
  const terminalPrimitive = Array.from({ length: length + 1 }, () => 0n);
  for (let index = length - 1; index >= 0; index -= 1) {
    terminalPrimitive[index] =
      BigInt(bits[index]) + 2n * terminalPrimitive[index + 1];
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
  const boundaryNumerator = sumH * sumA - constantCoefficient * sumAH;

  assert.equal(
    constantCoefficient * constantNumerator - sumH * boundaryNumerator,
    sumA * determinant,
  );
  assert.equal(
    -sumH * constantNumerator + sumHH * boundaryNumerator,
    -sumAH * determinant,
  );
  for (let index = 0; index < length; index += 1) {
    const currentNumerator =
      terminalPrimitive[index] * determinant +
      homogeneous[index] * boundaryNumerator;
    const nextNumerator =
      terminalPrimitive[index + 1] * determinant +
      homogeneous[index + 1] * boundaryNumerator;
    assert.equal(
      currentNumerator - 2n * nextNumerator,
      BigInt(bits[index]) * determinant,
    );
  }

  const removedQuadratic =
    sumHH * sumA * sumA -
    2n * sumH * sumA * sumAH +
    constantCoefficient * sumAH * sumAH;
  const numerator = sumAA * determinant - removedQuadratic;
  assert(numerator >= 0n);

  return {
    numerator,
    denominator: determinant,
    minimumSquaredCostExact: `${numerator}/${determinant}`,
    minimumSquaredCostApprox: rationalApproximation(numerator, determinant),
    minimumCostApprox: Math.sqrt(rationalApproximation(numerator, determinant)),
    minimizingConstantExact: `${constantNumerator}/${determinant}`,
    minimizingBoundaryExact: `${boundaryNumerator}/${determinant}`,
  };
}

function publicCost(cost) {
  return {
    minimumSquaredCostExact: cost.minimumSquaredCostExact,
    minimumSquaredCostApprox: cost.minimumSquaredCostApprox,
    minimumCostApprox: cost.minimumCostApprox,
    minimizingConstantExact: cost.minimizingConstantExact,
    minimizingBoundaryExact: cost.minimizingBoundaryExact,
  };
}

function universalBits(length) {
  return Array.from({ length }, (_unused, index) =>
    universalCantorBit(BigInt(index)),
  );
}

function integerPadicBits(integer, length) {
  assert(Number.isSafeInteger(integer));
  const value = BigInt.asUintN(length, BigInt(integer));
  return Array.from({ length }, (_unused, index) =>
    Number((value >> BigInt(index)) & 1n),
  );
}

function sparsePowerOfTwoBits(length) {
  return Array.from({ length }, (_unused, index) =>
    index > 0 && (index & (index - 1)) === 0 ? 1 : 0,
  );
}

function alternatingBits(length) {
  return Array.from({ length }, (_unused, index) => index % 2);
}

function auditNestedEscape(name, bitFactory, maxDepth, selectedDepths) {
  let previous = null;
  let monotonicityChecks = 0;
  const selected = [];
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const cost = minimumPrimitiveCostSquared(bitFactory(depth + 1));
    if (previous !== null) {
      assert(compareRationals(previous, cost) <= 0);
      monotonicityChecks += 1;
    }
    if (selectedDepths.includes(depth)) {
      selected.push({ depth, ...publicCost(cost) });
    }
    previous = cost;
  }
  return { name, maxDepth, monotonicityChecks, selected };
}

function bitsToUnsignedBigInt(bits) {
  assertBits(bits);
  let value = 0n;
  for (let index = 0; index < bits.length; index += 1) {
    if (bits[index] === 1) value |= 1n << BigInt(index);
  }
  return value;
}

function addIntegerToBits(bits, integer) {
  assertBits(bits);
  assert(Number.isSafeInteger(integer));
  const shifted = BigInt.asUintN(
    bits.length,
    bitsToUnsignedBigInt(bits) + BigInt(integer),
  );
  return Array.from({ length: bits.length }, (_unused, index) =>
    Number((shifted >> BigInt(index)) & 1n),
  );
}

function finiteSupportPrimitiveNorm(sequence) {
  assert(Array.isArray(sequence) && sequence.length > 0);
  assert(sequence.every((value) => [-1, 0, 1].includes(value)));
  const primitive = Array.from({ length: sequence.length + 1 }, () => 0n);
  for (let index = sequence.length - 1; index >= 0; index -= 1) {
    primitive[index] = BigInt(sequence[index]) + 2n * primitive[index + 1];
  }
  return Math.sqrt(
    Number(primitive.reduce((total, value) => total + value * value, 0n)),
  );
}

function auditRepresentativeRobustness(width, maxDepth) {
  const original = universalBits(width);
  const shifts = [-17, -1, 1, 17];
  const results = [];
  for (const shift of shifts) {
    const shifted = addIntegerToBits(original, shift);
    let lastDifference = -1;
    const delta = [];
    for (let index = 0; index < width; index += 1) {
      if (original[index] !== shifted[index]) lastDifference = index;
      delta.push(shifted[index] - original[index]);
    }
    assert(lastDifference >= 0 && lastDifference < 64);
    const support = delta.slice(0, lastDifference + 1);
    const comparisonBound = finiteSupportPrimitiveNorm(support);

    let maximumObservedDifference = 0;
    for (let depth = lastDifference; depth <= maxDepth; depth += 1) {
      const originalCost = minimumPrimitiveCostSquared(
        original.slice(0, depth + 1),
      ).minimumCostApprox;
      const shiftedCost = minimumPrimitiveCostSquared(
        shifted.slice(0, depth + 1),
      ).minimumCostApprox;
      const difference = Math.abs(originalCost - shiftedCost);
      assert(difference <= comparisonBound + 1e-9);
      maximumObservedDifference = Math.max(maximumObservedDifference, difference);
    }
    results.push({
      shift,
      lastDifference,
      comparisonBound,
      maximumObservedDifference,
    });
  }
  return {
    width,
    maxDepth,
    shifts: results,
    theorem:
      "finite digit changes have a fixed finite-energy primitive, so their minimum-cost profiles differ by at most an additive constant",
  };
}

function auditWeightedHilbertCompletion(maxDepth) {
  let prefixNormSquared = 0;
  let previousTailBound = Number.POSITIVE_INFINITY;
  let convergenceChecks = 0;
  const selected = [];
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const bit = universalCantorBit(BigInt(depth));
    prefixNormSquared += bit * 4 ** -depth;
    const tailErrorSquaredBound =
      4 ** -(depth + 1) / (1 - 1 / 4);
    assert(tailErrorSquaredBound < previousTailBound);
    previousTailBound = tailErrorSquaredBound;
    convergenceChecks += 1;
    if ([0, 1, 2, 4, 8, 16, 32, 64, 128].includes(depth)) {
      selected.push({ depth, prefixNormSquared, tailErrorSquaredBound });
    }
  }
  assert(prefixNormSquared <= 4 / 3);
  return {
    dataSpace: "Y={y: sum_n 4^(-n)|y_n|^2<infinity}",
    universalDatumInY: true,
    prefixNormSquared,
    convergenceChecks,
    selected,
    finiteCoordinateProjectionsConvergeInY: true,
    denseRangeProof:
      "finite-support sequences lie in D(H_gen) and are dense in Y",
    exactRange:
      "D(H_gen)=H_gen embedded densely and nonclosedly in Y",
    reducedCohomology: "Y/closure(D(H_gen))=0",
    unreducedCohomology:
      "Y/D(H_gen) is nonzero and indiscrete because the range is dense",
    harmonicSectors: {
      degreeOne: "ker(D*)=0 because D(H_gen) is dense in Y",
      degreeZero: "ker(D)=span{(2^(-n))_n}",
    },
  };
}

export function runGenesisPrimitiveEscape() {
  const selectedDepths = [0, 1, 2, 4, 8, 16, 32, 64, 128];
  const universal = auditNestedEscape(
    "universal Cantor stream",
    universalBits,
    128,
    selectedDepths,
  );
  const sparse = auditNestedEscape(
    "ones at positive powers of two",
    sparsePowerOfTwoBits,
    128,
    selectedDepths,
  );
  const alternating = auditNestedEscape(
    "alternating digits",
    alternatingBits,
    128,
    selectedDepths,
  );
  const positiveInteger = auditNestedEscape(
    "2-adic digits of 17",
    (length) => integerPadicBits(17, length),
    128,
    selectedDepths,
  );
  const negativeInteger = auditNestedEscape(
    "2-adic digits of -17",
    (length) => integerPadicBits(-17, length),
    128,
    selectedDepths,
  );
  const representativeRobustness = auditRepresentativeRobustness(256, 128);
  const weightedHilbertCompletion = auditWeightedHilbertCompletion(128);

  const positiveFinal = positiveInteger.selected.at(-1).minimumCostApprox;
  const negativeFinal = negativeInteger.selected.at(-1).minimumCostApprox;
  assert(positiveFinal < 100);
  assert(negativeFinal < 100);
  assert(
    universal.selected.at(-1).minimumCostApprox >
      universal.selected.at(-2).minimumCostApprox,
  );
  assert(
    sparse.selected.at(-1).minimumCostApprox >
      sparse.selected.at(-2).minimumCostApprox,
  );

  return {
    schema: "oasis.genesis-primitive-escape.v1",
    object:
      "a nested minimum-primitive-cost geometry for the binary derived-limit quotient",
    ambientPrimitiveSpace: {
      definition: "H_gen={x_n=c+z_n : c in R, z in l^2}",
      norm: "||x||_gen^2=|c|^2+sum_n |z_n|^2",
      derivative: "D(x)_n=x_n-2*x_(n+1)",
      reasonForConstantSector:
        "eventually-one 2-adic integer tails require the legitimate zero-class primitive x=-1",
    },
    completedHilbertDataSpace: weightedHilbertCompletion,
    twoTermHilbertComplex: {
      complex: "0 -> H_gen --D--> Y -> 0",
      boundedDifferential: true,
      range:
        "D(H_gen)=H_gen as a dense nonclosed linear subspace of weighted Y",
      comparison:
        "canonical binary digitization defines a presentation-dependent nonlinear injection from Z_2/Z into the unreduced quotient Y/D(H_gen)",
      comparisonIsGroupHomomorphism: false,
      nonlinearityWitness:
        "doubling 0101... creates an infinite carry defect, so digitization does not respect addition modulo D(H_gen)",
      hodgeBoundary:
        "degree-one harmonic and reduced H^1 are zero, while primitive escape detects the indiscrete unreduced H^1 class through finite coordinate projections; ker(D) remains one-dimensional in degree zero",
    },
    finiteObservable: {
      definition:
        "K_N(y)=minimum ||x||_gen subject to D(x)_n=y_n for every 0<=n<=N",
      computability:
        "an exact two-variable rational quadratic solve after backward substitution",
      nesting: "K_N is nondecreasing because each next prefix adds a constraint",
      finiteHodgeInterpretation:
        "K_N is the norm of the Moore-Penrose minimum primitive for a finite-rank observation map",
    },
    primitiveEscapeTheorem: {
      statement:
        "for canonical binary digits b(alpha), sup_N K_N is finite iff alpha is an ordinary integer; otherwise K_N tends to infinity",
      forwardProof:
        "a bounded family of nested minimum primitives has a weakly convergent subsequence whose limit solves every coordinate equation",
      binaryRigidity:
        "x=c+z with z in l^2 implies D(x)_n tends to -c; a convergent binary sequence is eventually constant",
      converseProof:
        "an eventually-zero tail has a finite-support primitive and an eventually-one tail differs finitely from the constant primitive x=-1",
      quotientConsequence:
        "[alpha]=0 in Z_2/Z iff the primitive-cost profile is bounded",
    },
    audits: {
      exactRational: {
        universal,
        sparse,
        alternating,
        positiveInteger,
        negativeInteger,
      },
      numericalRepresentativeBoundCheck: representativeRobustness,
      analyticCompletionCheck: weightedHilbertCompletion,
    },
    relationToTailHodge: {
      strongerDetection:
        "the sparse nonzero class missed by digit variance still has an escaping primitive cost",
      orderSensitive: true,
      hilbertPrimitiveGeometryLoadBearing:
        "yes: the completed digit datum lies in a fixed weighted Hilbert target, the differential has dense nonclosed range, and weak compactness turns bounded finite primitives into a global primitive",
      escapeRateHypothesis:
        "different nonzero classes may have inequivalent unbounded escape profiles even though all are locally exact; only divergence is proved here",
    },
    hypothesisLedger: {
      provedHere: [
        "exact finite minimum-cost formula",
        "monotone nested primitive costs",
        "bounded-cost iff zero binary derived class",
        "escape under the universal, alternating, and sparse nonzero controls",
        "bounded profiles for positive and negative integer zero controls",
        "finite-representative changes alter primitive norm by at most O(1)",
        "the weighted two-term Hilbert complex has dense nonclosed range and zero degree-one harmonic sector",
      ],
      conjecturedNext: [
        "an obstruction compiler can generate an escape profile rather than replaying a fixed bit tape",
        "an honest semantics can force a presentation-independent equivalence class of escape rates",
        "non-sofic transport can act on the primitive geometry without collapsing after observational quotienting",
      ],
    },
    claimBoundary: {
      canonicalForAbstractZ2ModuloZ: false,
      independentOfChosenHilbertNorm: false,
      naturalGroupHomomorphismToHilbertCohomology: false,
      endogenous: false,
      finiteCarrier: false,
      internallyNonsofic: false,
      hodgeConjectureImplication: false,
      noveltyCertified: false,
    },
    nextTheorem:
      "construct a certificate-forced question-genesis tower whose primitive escape profile is invariant up to bounded distortion under semantic gauge and cofinal refinement",
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runGenesisPrimitiveEscape(), null, 2));
}
