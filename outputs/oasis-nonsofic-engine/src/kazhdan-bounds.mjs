const SQRT2_UPPER = Object.freeze({ numerator: 1414214n, denominator: 1000000n });
const SQRT3_UPPER = Object.freeze({ numerator: 1732051n, denominator: 1000000n });

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function rational(numerator, denominator) {
  if (denominator <= 0n) throw new Error("Rational denominator must be positive");
  const divisor = gcd(numerator, denominator);
  return {
    numerator: (numerator / divisor).toString(),
    denominator: (denominator / divisor).toString(),
  };
}

function multiply(left, right) {
  return rational(
    BigInt(left.numerator) * BigInt(right.numerator),
    BigInt(left.denominator) * BigInt(right.denominator),
  );
}

function divideByInteger(value, divisor) {
  return rational(BigInt(value.numerator), BigInt(value.denominator) * BigInt(divisor));
}

export function rationalValue(value) {
  return Number(BigInt(value.numerator)) / Number(BigInt(value.denominator));
}

function denominatorUpperBound(n) {
  // For the binary Leavitt ring, d=4 in Ershov-Jaikin-Zapirain Theorem 6.2:
  // 8(12 sqrt(8) + 2 sqrt(3n) + 36 sqrt(2)).
  // The two cases used by the proof are n=3 and n=9.
  const commonDenominator = SQRT2_UPPER.denominator;
  if (SQRT3_UPPER.denominator !== commonDenominator) {
    throw new Error("Radical upper bounds use different denominators");
  }
  const sixtySqrt2 = 60n * SQRT2_UPPER.numerator;
  let remaining;
  if (n === 3) {
    remaining = 6n * commonDenominator;
  } else if (n === 9) {
    remaining = 6n * SQRT3_UPPER.numerator;
  } else {
    throw new Error("Only the n=3 and n=9 proof groups are configured");
  }
  return rational(8n * (sixtySqrt2 + remaining), commonDenominator);
}

export function ershovJaikinKazhdanBound(n) {
  const denominatorBound = denominatorUpperBound(n);
  const lowerBound = rational(
    BigInt(denominatorBound.denominator),
    BigInt(denominatorBound.numerator),
  );
  return {
    theorem: "Ershov-Jaikin-Zapirain 2010, Theorem 6.2",
    quotientTransfer: "St_n(R) surjects onto EL_n(R), so the image generating set inherits the lower bound",
    ringGeneratorCount: 4,
    matrixRank: n,
    elementaryGeneratorCount: n * (n - 1) * 5,
    exactRadicalFormula: "1 / (8 * (12*sqrt(2*d) + 2*sqrt(3*n) + 36*sqrt(2))), d=4",
    rationalLowerBound: lowerBound,
    decimalLowerBound: rationalValue(lowerBound),
  };
}

export function lazyMarkovSpectralGapBound(n) {
  const kazhdan = ershovJaikinKazhdanBound(n);
  const generatorCount = kazhdan.elementaryGeneratorCount;
  const squared = multiply(kazhdan.rationalLowerBound, kazhdan.rationalLowerBound);
  const lowerBound = divideByInteger(squared, 2 * (generatorCount + 1));
  return {
    theorem: "Kazhdan displacement bound converted to the lazy Markov operator",
    matrixRank: n,
    generatorCount,
    lazyGeneratorMultisetSize: generatorCount + 1,
    derivation: "gap >= kappa^2 / (2*(|Sigma|+1))",
    rationalLowerBound: lowerBound,
    decimalLowerBound: rationalValue(lowerBound),
    kazhdan,
  };
}

export function proofSpectralBounds() {
  return {
    gamma: lazyMarkovSpectralGapBound(3),
    ambientG: lazyMarkovSpectralGapBound(9),
    radicalUpperBounds: {
      sqrt2: rational(SQRT2_UPPER.numerator, SQRT2_UPPER.denominator),
      sqrt3: rational(SQRT3_UPPER.numerator, SQRT3_UPPER.denominator),
    },
  };
}
