import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function rational(numerator, denominator = 1n) {
  let n = BigInt(numerator);
  let d = BigInt(denominator);
  if (d === 0n) throw new Error("Rational denominator cannot be zero");
  if (d < 0n) [n, d] = [-n, -d];
  const divisor = gcd(n, d);
  return { numerator: n / divisor, denominator: d / divisor };
}

function add(left, right) {
  return rational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function subtract(left, right) {
  return rational(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function multiply(left, right) {
  return rational(left.numerator * right.numerator, left.denominator * right.denominator);
}

function divide(left, right) {
  if (right.numerator === 0n) throw new Error("Cannot divide by zero");
  return rational(left.numerator * right.denominator, left.denominator * right.numerator);
}

function lessThanOrEqual(left, right) {
  return left.numerator * right.denominator <= right.numerator * left.denominator;
}

function maximum(left, right) {
  return lessThanOrEqual(left, right) ? right : left;
}

function minimum(left, right) {
  return lessThanOrEqual(left, right) ? left : right;
}

function asString(value) {
  return value.denominator === 1n
    ? `${value.numerator}`
    : `${value.numerator}/${value.denominator}`;
}

function asNumber(value) {
  return Number(value.numerator) / Number(value.denominator);
}

function factorial(value) {
  let result = 1;
  for (let index = 2; index <= value; index += 1) result *= index;
  return result;
}

function power10(exponent) {
  return 10n ** BigInt(exponent);
}

function interval(lower, upper, metadata = {}) {
  if (!lessThanOrEqual(lower, upper)) throw new Error("Interval endpoints are reversed");
  const width = subtract(upper, lower);
  return {
    lower,
    upper,
    metadata,
    serialize() {
      const lowerApproximation = asNumber(lower);
      const upperApproximation = asNumber(upper);
      return {
        ...metadata,
        lower: asString(lower),
        upper: asString(upper),
        width: asString(width),
        decimal: {
          midpoint: (lowerApproximation + upperApproximation) / 2,
          width: asNumber(width),
          endpointsResolvedByDoublePrecision: lowerApproximation < upperApproximation,
        },
      };
    },
  };
}

// L = sum_{k>=1} 10^(-k!) is the classical Liouville constant. A finite
// program, rather than a finite decimal or algebraic expression, is its state.
class ComputableLiouvilleCoefficient {
  intervalAfterTerms(termCount) {
    if (!Number.isInteger(termCount) || termCount < 1 || termCount > 4) {
      throw new Error("This demonstrator accepts one through four Liouville terms");
    }
    let lower = rational(0n);
    for (let index = 1; index <= termCount; index += 1) {
      lower = add(lower, rational(1n, power10(factorial(index))));
    }
    const nextExponent = factorial(termCount + 1);
    // Every omitted exponent is at least nextExponent, and their rapidly
    // decreasing sum is strictly below 2*10^(-nextExponent).
    const upper = add(lower, rational(2n, power10(nextExponent)));
    return interval(lower, upper, {
      schema: "oasis.computable-real-cauchy-interval.v1",
      program: "sum(k=1..infinity, 10^(-k!))",
      retainedTerms: termCount,
      nextExponent,
      tailProof: "sum-of-omitted-terms-is-less-than-2-times-10-to-minus-next-factorial",
    });
  }
}

function involutionMoment(coefficient) {
  // m(lambda)=2 lambda/(1+lambda^2), increasing on 0<lambda<1.
  return divide(
    multiply(rational(2n), coefficient),
    add(rational(1n), multiply(coefficient, coefficient)),
  );
}

function plusProbability(coefficient) {
  // p+=(1+m)/2=(1+lambda)^2/(2(1+lambda^2)).
  const onePlus = add(rational(1n), coefficient);
  return divide(
    multiply(onePlus, onePlus),
    multiply(rational(2n), add(rational(1n), multiply(coefficient, coefficient))),
  );
}

function stateInterval(coefficientInterval) {
  const momentBounds = interval(
    involutionMoment(coefficientInterval.lower),
    involutionMoment(coefficientInterval.upper),
    { quantity: "omega_B(g)=2L/(1+L^2)" },
  );
  const plusBounds = interval(
    plusProbability(coefficientInterval.lower),
    plusProbability(coefficientInterval.upper),
    { quantity: "p_plus=(1+omega_B(g))/2" },
  );
  const minusBounds = interval(
    subtract(rational(1n), plusBounds.upper),
    subtract(rational(1n), plusBounds.lower),
    { quantity: "p_minus=1-p_plus" },
  );
  return { momentBounds, plusBounds, minusBounds };
}

function contains(outer, inner) {
  return lessThanOrEqual(outer.lower, inner.lower)
    && lessThanOrEqual(inner.upper, outer.upper);
}

function classifyContinuousRelation({
  algebraicallyEqual = false,
  exactKernelProof = false,
  squaredDistanceBounds,
  emulatorClaimsEqual,
}) {
  let memoryTruth;
  if (algebraicallyEqual) memoryTruth = "exact-algebraic-equality";
  else if (exactKernelProof) memoryTruth = "proof-certified-state-kernel-equivalence";
  else if (squaredDistanceBounds.lower.numerator > 0n) {
    memoryTruth = "interval-certified-state-distinction";
  } else {
    memoryTruth = "analytically-unresolved-near-kernel";
  }
  let emulatorVerdict;
  if (!emulatorClaimsEqual) emulatorVerdict = "emulator-separates-pair";
  else if (memoryTruth === "interval-certified-state-distinction") {
    emulatorVerdict = "emulator-alias-refuted-by-certified-interval";
  } else if (memoryTruth === "analytically-unresolved-near-kernel") {
    emulatorVerdict = "emulator-alias-not-yet-decidable";
  } else {
    emulatorVerdict = "emulator-alias-compatible-with-certified-equality-layer";
  }
  return {
    memoryTruth,
    emulatorVerdict,
    exactEqualityNeverInferredFromIntervalConvergence: true,
  };
}

class ComputableInfiniteSupportAmplitude {
  constructor(groupOracle, generatorNames) {
    this.groupOracle = groupOracle;
    this.generatorNames = [...generatorNames];
    this.cache = [];
    this.hashes = new Set();
  }

  ensureDistinctTerms(count) {
    let depth = 0;
    while (this.cache.length < count) {
      depth += 1;
      const window = this.groupOracle.enumerateWindow(
        this.generatorNames,
        depth,
        Math.max(64, count * 8),
      );
      for (const item of window) {
        if (this.hashes.has(item.hash)) continue;
        this.hashes.add(item.hash);
        this.cache.push(item);
        if (this.cache.length === count) break;
      }
      if (depth > count * 4 + 8) {
        throw new Error("Exact enumeration did not expose enough distinct support elements");
      }
    }
    return this.cache.slice(0, count);
  }

  momentInterval(word, retainedTerms) {
    if (!Number.isInteger(retainedTerms) || retainedTerms < 1 || retainedTerms > 20) {
      throw new Error("Retained Hilbert-amplitude terms must be an integer from one through twenty");
    }
    const support = this.ensureDistinctTerms(retainedTerms).map((item, index) => ({
      ...item,
      coefficient: rational(1n, 2n ** BigInt(index + 1)),
    }));
    const coefficientByHash = new Map(
      support.map((item) => [item.hash, item.coefficient]),
    );
    const process = this.groupOracle.evaluate(word);
    let truncatedInnerProduct = rational(0n);
    for (const item of support) {
      const translatedHash = process.unit.multiply(item.unit).hash();
      const matchingCoefficient = coefficientByHash.get(translatedHash);
      if (!matchingCoefficient) continue;
      truncatedInnerProduct = add(
        truncatedInnerProduct,
        multiply(item.coefficient, matchingCoefficient),
      );
    }
    // The infinite vector has exact norm squared sum 4^(-(n+1))=1/3.
    const normalizedCenter = multiply(rational(3n), truncatedInnerProduct);
    // If R is the omitted tail, ||R||=1/(sqrt(3)2^N). Therefore
    // |<B,gB>-<B_N,gB_N>| / ||B||^2 <= 2/2^N + 1/4^N.
    const error = add(
      rational(2n, 2n ** BigInt(retainedTerms)),
      rational(1n, 4n ** BigInt(retainedTerms)),
    );
    return interval(
      maximum(rational(-1n), subtract(normalizedCenter, error)),
      minimum(rational(1n), add(normalizedCenter, error)),
      {
        schema: "oasis.computable-hilbert-vector-moment-interval.v1",
        amplitudeProgram: "B=sum(n=0..infinity,2^(-(n+1))*delta(h_n))",
        retainedTerms,
        exactDistinctSupportTerms: support.length,
        normalizedTruncatedCenter: asString(normalizedCenter),
        normalizedTailErrorBound: asString(error),
        tailProof: "cauchy-schwarz-with-geometric-l2-tail",
      },
    );
  }
}

export function runComputableContinuousStateDemo() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const generator = "x:0:1:1";
  const evaluated = groupOracle.evaluate([generator]);
  const identity = groupOracle.evaluate([]).unit;
  const involutive = evaluated.unit.multiply(evaluated.unit).equals(identity);
  assert.equal(involutive, true);

  const coefficient = new ComputableLiouvilleCoefficient();
  const refinements = [2, 3, 4].map((termCount) => {
    const coefficientBounds = coefficient.intervalAfterTerms(termCount);
    const state = stateInterval(coefficientBounds);
    return {
      retainedTerms: termCount,
      coefficient: coefficientBounds.serialize(),
      moment: state.momentBounds.serialize(),
      plusProbability: state.plusBounds.serialize(),
      minusProbability: state.minusBounds.serialize(),
      normalizationCertificate: "p_minus-is-defined-as-one-minus-p_plus",
      probabilityBoundsValid:
        lessThanOrEqual(rational(0n), state.minusBounds.lower)
        && lessThanOrEqual(state.plusBounds.upper, rational(1n)),
      _intervals: { coefficientBounds, ...state },
    };
  });
  for (let index = 1; index < refinements.length; index += 1) {
    assert(contains(
      refinements[index - 1]._intervals.coefficientBounds,
      refinements[index]._intervals.coefficientBounds,
    ));
    assert(contains(
      refinements[index - 1]._intervals.momentBounds,
      refinements[index]._intervals.momentBounds,
    ));
    assert(contains(
      refinements[index - 1]._intervals.plusBounds,
      refinements[index]._intervals.plusBounds,
    ));
  }

  const infiniteAmplitude = new ComputableInfiniteSupportAmplitude(
    groupOracle,
    ["x:0:1:s0", "x:1:0:s1"],
  );
  const completionProbe = "x:0:1:s0";
  assert.equal(
    groupOracle.evaluate([completionProbe]).unit
      .multiply(groupOracle.evaluate([completionProbe]).unit)
      .equals(identity),
    true,
  );
  const infiniteSupportRefinements = [4, 8, 12].map((retainedTerms) => {
    const momentBounds = infiniteAmplitude.momentInterval([completionProbe], retainedTerms);
    const plusBounds = interval(
      divide(add(rational(1n), momentBounds.lower), rational(2n)),
      divide(add(rational(1n), momentBounds.upper), rational(2n)),
      { quantity: "p_plus=(1+omega_B(g))/2" },
    );
    return {
      retainedTerms,
      moment: momentBounds.serialize(),
      plusProbability: plusBounds.serialize(),
      _intervals: { momentBounds, plusBounds },
    };
  });
  for (let index = 1; index < infiniteSupportRefinements.length; index += 1) {
    assert(contains(
      infiniteSupportRefinements[index - 1]._intervals.momentBounds,
      infiniteSupportRefinements[index]._intervals.momentBounds,
    ));
  }

  return {
    schema: "oasis.computable-transcendental-involution-state.v1",
    exactDiscreteCore: {
      group: groupOracle.theorem.group,
      generator,
      exactProcessHash: evaluated.hash,
      involutive,
    },
    continuousState: {
      amplitudeProgram: "B = 1 + L g",
      coefficientProgram: "L = sum(k=1..infinity, 10^(-k!))",
      coefficientClass: "computable-transcendental-real",
      positivity: "omega_B(a)=tau(B* a B)/tau(B*B)",
      transcendenceTransfer:
        "if-2L/(1+L^2)-were-algebraic-then-L-would-satisfy-an-algebraic-quadratic",
      equalityPolicy:
        "interval-separation-certifies-inequality; exact-equality-needs-a-proof-object-and-is-not-inferred-from-floating-point",
    },
    refinements: refinements.map(({ _intervals, ...serialized }) => serialized),
    exactNestedRefinement: true,
    infiniteSupportHilbertState: {
      completion: "left-regular-Hilbert-space-l2(G)",
      observationProbe: completionProbe,
      amplitudeIsFiniteGroupPolynomial: false,
      amplitudeIsFiniteProgram: true,
      exactNormSquared: "1/3",
      positivity: "vector-state-Gram-positivity",
      refinements: infiniteSupportRefinements.map(({ _intervals, ...serialized }) => serialized),
      exactNestedMomentEnclosures: true,
    },
    continuousRelationCritic: {
      separatedExample: classifyContinuousRelation({
        squaredDistanceBounds: interval(rational(1n, 10n), rational(1n, 5n)),
        emulatorClaimsEqual: true,
      }),
      unresolvedExample: classifyContinuousRelation({
        squaredDistanceBounds: interval(rational(0n), rational(1n, 1000000n)),
        emulatorClaimsEqual: true,
      }),
      proofCertifiedKernelExample: classifyContinuousRelation({
        exactKernelProof: true,
        squaredDistanceBounds: interval(rational(0n), rational(1n, 1000000n)),
        emulatorClaimsEqual: true,
      }),
    },
    semanticConclusion:
      "a-finite-program-can-name-a-transcendental-state-and-answer-each-finite-probability-query-to-requested-certified-precision",
  };
}

if (
  typeof process !== "undefined"
  && process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runComputableContinuousStateDemo(), null, 2));
}
