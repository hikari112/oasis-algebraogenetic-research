import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  LEAVITT_GENERATORS,
  LeavittF2Element,
} from "../src/leavitt-f2.mjs";
import {
  LeavittUnit,
  cylinderSwap,
  elementaryRoot,
} from "../src/unit-group.mjs";
import {
  ALPHA,
  BETA,
  D,
  NU,
  makeContractionUnits,
  makeGammaGenerators,
  makeThompsonVPresentationGenerators,
  registerProofConfiguration,
} from "../src/proof-configuration.mjs";
import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import {
  bleakQuickRelators,
  buildFiniteLefObstruction,
} from "../src/thompson-v-lef-obstruction.mjs";
import {
  ershovJaikinKazhdanBound,
  lazyMarkovSpectralGapBound,
  rationalValue,
} from "../src/kazhdan-bounds.mjs";

const RUN_SCHEMA = "oasis.genesis-quantitative-nonsofic-extraction.run.v1";
const CERTIFICATE_SCHEMA = "oasis.genesis-quantitative-nonsofic-extraction.certificate.v1";
const COMPILATION_CERTIFICATE_SCHEMA =
  "oasis.genesis-quantitative-nonsofic-obstruction-compilation.certificate.v1";
// Above this radius, exact expansion of the geometric word count itself is
// not an executable representation.  A future symbolic comparison engine may
// discharge such budgets; until then the theorem compiler fails closed.
const MAX_EXACT_GEOMETRIC_RADIUS = 4096;

const COEFFICIENT_ENTRIES = Object.freeze([
  Object.freeze(["1", LEAVITT_GENERATORS.one]),
  Object.freeze(["s0", LEAVITT_GENERATORS.s0]),
  Object.freeze(["s1", LEAVITT_GENERATORS.s1]),
  Object.freeze(["t0", LEAVITT_GENERATORS.t0]),
  Object.freeze(["t1", LEAVITT_GENERATORS.t1]),
]);

function canonical(value, active = new Set(), path = "$") {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new TypeError(`Non-JSON number at ${path}`);
    }
    return JSON.stringify(value);
  }
  if (typeof value !== "object") throw new TypeError(`Non-JSON value at ${path}`);
  if (active.has(value)) throw new TypeError(`Cyclic JSON value at ${path}`);
  if (Object.getOwnPropertySymbols(value).length !== 0) {
    throw new TypeError(`Symbol-keyed JSON value at ${path}`);
  }

  active.add(value);
  try {
    if (Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.length !== value.length
        || keys.some((key, index) => key !== String(index))
        || Object.getOwnPropertyNames(value).length !== value.length + 1) {
        throw new TypeError(`Sparse or extended JSON array at ${path}`);
      }
      return `[${value.map((item, index) => canonical(item, active, `${path}[${index}]`)).join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`Non-plain JSON object at ${path}`);
    }
    const keys = Object.keys(value).sort();
    if (Object.getOwnPropertyNames(value).length !== keys.length) {
      throw new TypeError(`Hidden JSON property at ${path}`);
    }
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !("value" in descriptor)) {
        throw new TypeError(`Accessor or hidden JSON property at ${path}.${key}`);
      }
    }
    return `{${keys.map((key) => (
      `${JSON.stringify(key)}:${canonical(value[key], active, `${path}.${key}`)}`
    )).join(",")}}`;
  } finally {
    active.delete(value);
  }
}

function digest(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function clone(value) {
  return JSON.parse(canonical(value));
}

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function rational(numerator, denominator = 1n) {
  if (denominator <= 0n) throw new Error("Rational denominator must be positive");
  const divisor = gcd(numerator, denominator);
  return {
    numerator: (numerator / divisor).toString(),
    denominator: (denominator / divisor).toString(),
  };
}

function multiplyRational(left, right) {
  return rational(
    BigInt(left.numerator) * BigInt(right.numerator),
    BigInt(left.denominator) * BigInt(right.denominator),
  );
}

function divideRationalByInteger(value, divisor) {
  if (!Number.isSafeInteger(divisor) || divisor <= 0) {
    throw new Error("Rational divisor must be a positive safe integer");
  }
  return rational(BigInt(value.numerator), BigInt(value.denominator) * BigInt(divisor));
}

function addRational(left, right) {
  return rational(
    BigInt(left.numerator) * BigInt(right.denominator)
      + BigInt(right.numerator) * BigInt(left.denominator),
    BigInt(left.denominator) * BigInt(right.denominator),
  );
}

function subtractRational(left, right) {
  return rational(
    BigInt(left.numerator) * BigInt(right.denominator)
      - BigInt(right.numerator) * BigInt(left.denominator),
    BigInt(left.denominator) * BigInt(right.denominator),
  );
}

function divideRational(left, right) {
  if (BigInt(right.numerator) === 0n) throw new Error("Division by zero rational");
  const sign = BigInt(right.numerator) < 0n ? -1n : 1n;
  return rational(
    sign * BigInt(left.numerator) * BigInt(right.denominator),
    sign * BigInt(left.denominator) * BigInt(right.numerator),
  );
}

function scaleRational(value, scalar) {
  if (!Number.isSafeInteger(scalar)) throw new Error("Rational scale must be a safe integer");
  return rational(BigInt(value.numerator) * BigInt(scalar), BigInt(value.denominator));
}

function compareRational(left, right) {
  const difference = BigInt(left.numerator) * BigInt(right.denominator)
    - BigInt(right.numerator) * BigInt(left.denominator);
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function floorNonnegativeRational(value) {
  const numerator = BigInt(value.numerator);
  const denominator = BigInt(value.denominator);
  if (numerator < 0n || denominator <= 0n) {
    throw new Error("Expected a nonnegative rational for floor");
  }
  return numerator / denominator;
}

function ceilReciprocalPositiveRational(value) {
  if (!isPositiveRational(value)) {
    throw new Error("Expected a positive rational reciprocal ceiling input");
  }
  const numerator = BigInt(value.numerator);
  const denominator = BigInt(value.denominator);
  return (denominator + numerator - 1n) / numerator;
}

function minimalDyadicExponentAtMost(target) {
  if (!isPositiveRational(target)) {
    throw new Error("Expected a positive rational dyadic threshold");
  }
  let exponent = 0n;
  let denominator = 1n;
  while (compareRational(rational(1n, denominator), target) > 0) {
    exponent += 1n;
    denominator *= 2n;
  }
  const value = rational(1n, denominator);
  const previousValue = exponent === 0n ? null : rational(2n, denominator);
  assert.equal(compareRational(value, target) <= 0, true);
  if (previousValue) assert.equal(compareRational(previousValue, target) > 0, true);
  return { exponent, value, previousValue };
}

function postCutComponentSizeLowerBound(preCutLowerBound, cutFraction) {
  if (!Number.isSafeInteger(preCutLowerBound) || preCutLowerBound < 0) {
    throw new Error("Component-size lower bound must be a nonnegative safe integer");
  }
  const count = BigInt(preCutLowerBound);
  const maximumRemoved = compareRational(cutFraction, ONE_RATIONAL) < 0
    ? floorNonnegativeRational(multiplyRational(rational(count), cutFraction))
    : count;
  return { maximumRemoved, survivors: count - maximumRemoved };
}

function minRational(values) {
  if (!Array.isArray(values) || values.length === 0) throw new Error("Empty rational minimum");
  return values.reduce((minimum, value) => (
    compareRational(value, minimum) < 0 ? value : minimum
  ));
}

function isPositiveRational(value) {
  return value
    && /^-?\d+$/.test(value.numerator)
    && /^\d+$/.test(value.denominator)
    && BigInt(value.numerator) > 0n
    && BigInt(value.denominator) > 0n;
}

function squareRational(value) {
  return multiplyRational(value, value);
}

const ZERO_RATIONAL = Object.freeze(rational(0n));
const ONE_RATIONAL = Object.freeze(rational(1n));

function rationalPower(value, exponent) {
  if (!Number.isSafeInteger(exponent) || exponent < 0) {
    throw new Error("Rational exponent must be a nonnegative safe integer");
  }
  let result = ONE_RATIONAL;
  for (let index = 0; index < exponent; index += 1) result = multiplyRational(result, value);
  return result;
}

function normalizePolynomial(coefficients) {
  const result = coefficients.map((coefficient) => rational(
    BigInt(coefficient.numerator),
    BigInt(coefficient.denominator),
  ));
  while (result.length > 1 && compareRational(result.at(-1), ZERO_RATIONAL) === 0) {
    result.pop();
  }
  return result;
}

function addPolynomials(left, right) {
  return normalizePolynomial(Array.from(
    { length: Math.max(left.length, right.length) },
    (_, index) => addRational(left[index] ?? ZERO_RATIONAL, right[index] ?? ZERO_RATIONAL),
  ));
}

function scalePolynomial(polynomial, scalar) {
  return normalizePolynomial(polynomial.map((coefficient) => multiplyRational(coefficient, scalar)));
}

function multiplyPolynomials(left, right) {
  const result = Array.from(
    { length: left.length + right.length - 1 },
    () => ZERO_RATIONAL,
  );
  for (let i = 0; i < left.length; i += 1) {
    for (let j = 0; j < right.length; j += 1) {
      result[i + j] = addRational(result[i + j], multiplyRational(left[i], right[j]));
    }
  }
  return normalizePolynomial(result);
}

function polynomialPower(polynomial, exponent) {
  if (!Number.isSafeInteger(exponent) || exponent < 0) {
    throw new Error("Polynomial exponent must be a nonnegative safe integer");
  }
  let result = [ONE_RATIONAL];
  let factor = normalizePolynomial(polynomial);
  let power = exponent;
  while (power > 0) {
    if (power % 2 === 1) result = multiplyPolynomials(result, factor);
    power = Math.floor(power / 2);
    if (power > 0) factor = multiplyPolynomials(factor, factor);
  }
  return result;
}

function polynomialEqual(left, right) {
  return canonical(normalizePolynomial(left)) === canonical(normalizePolynomial(right));
}

function gammaName(row, column, coefficientName) {
  return `gamma:${row}:${column}:${coefficientName}`;
}

function token(name, inverse = false) {
  return { name, inverse };
}

function normalizeToken(item) {
  if (item.name.startsWith("gamma:")) return { name: item.name, inverse: false };
  return { name: item.name, inverse: Boolean(item.inverse) };
}

function inverseWord(word) {
  return [...word].reverse().map((item) => normalizeToken({
    name: item.name,
    inverse: !item.inverse,
  }));
}

function freeReduce(word) {
  const stack = [];
  for (const raw of word) {
    const item = normalizeToken(raw);
    const last = stack.at(-1);
    const cancels = last && last.name === item.name && (
      item.name.startsWith("gamma:") || last.inverse !== item.inverse
    );
    if (cancels) stack.pop();
    else stack.push(item);
  }
  return stack;
}

function concatenate(...words) {
  return freeReduce(words.flat());
}

function commutator(left, right) {
  return concatenate(left, right, inverseWord(left), inverseWord(right));
}

function buildExactWordAudit() {
  const coefficientByName = new Map(COEFFICIENT_ENTRIES);
  const gammaUnits = new Map(makeGammaGenerators().map((unit) => [unit.label, unit]));
  const contractions = makeContractionUnits();

  function unitForToken(item) {
    let unit;
    if (item.name === "u") unit = contractions.u;
    else if (item.name === "v") unit = contractions.v;
    else unit = gammaUnits.get(item.name);
    if (!unit) throw new Error(`Unknown special-generator token ${item.name}`);
    return item.inverse ? unit.inverse() : unit;
  }

  function evaluate(word) {
    return word.reduce(
      (product, item) => product.multiply(unitForToken(item)),
      LeavittUnit.identity(),
    );
  }

  function productRootWord(row, column, names) {
    const factors = names.filter((name) => name !== "1");
    if (factors.length === 0) return [token(gammaName(row, column, "1"))];
    if (factors.length === 1) return [token(gammaName(row, column, factors[0]))];
    const split = Math.floor(factors.length / 2);
    const middle = [0, 1, 2].find((index) => index !== row && index !== column);
    return commutator(
      productRootWord(row, middle, factors.slice(0, split)),
      productRootWord(middle, column, factors.slice(split)),
    );
  }

  function assertWordEquals(word, expected, label) {
    if (!evaluate(word).equals(expected)) throw new Error(`Word verification failed: ${label}`);
  }

  function codeRoot(code, row, column, coefficientName, label) {
    return elementaryRoot(code, row, column, coefficientByName.get(coefficientName), label);
  }

  function conjugatedCrossBlockWord(
    kind,
    blockRow,
    bitRow,
    blockColumn,
    bitColumn,
    coefficientName,
  ) {
    if (blockRow === blockColumn) throw new Error("Cross-block recipe needs distinct blocks");
    const shift = kind === "ab" ? "u" : "v";
    const leftS = bitRow === 0 ? "s0" : "s1";
    const rightT = bitColumn === 0 ? "t0" : "t1";
    const inner = productRootWord(
      blockRow,
      blockColumn,
      [leftS, coefficientName, rightT],
    );
    return concatenate([token(shift, true)], inner, [token(shift)]);
  }

  function sixLeafRootWord(
    kind,
    blockRow,
    bitRow,
    blockColumn,
    bitColumn,
    coefficientName,
  ) {
    if (blockRow !== blockColumn) {
      return conjugatedCrossBlockWord(
        kind,
        blockRow,
        bitRow,
        blockColumn,
        bitColumn,
        coefficientName,
      );
    }
    if (bitRow === bitColumn) throw new Error("Root endpoints coincide");
    const auxiliaryBlock = (blockRow + 1) % 3;
    return commutator(
      conjugatedCrossBlockWord(
        kind,
        blockRow,
        bitRow,
        auxiliaryBlock,
        0,
        coefficientName,
      ),
      conjugatedCrossBlockWord(
        kind,
        auxiliaryBlock,
        0,
        blockColumn,
        bitColumn,
        "1",
      ),
    );
  }

  function locateDLeaf(index) {
    if (index < 3) return { family: "alpha", block: index, bit: 0 };
    if (index < 6) return { family: "beta", block: index - 3, bit: 1 };
    return { family: "nu", block: index - 6, bit: 1 };
  }

  function dRootWord(row, column, coefficientName) {
    const left = locateDLeaf(row);
    const right = locateDLeaf(column);
    if (left.family === "alpha" && right.family === "alpha") {
      return [token(gammaName(left.block, right.block, coefficientName))];
    }
    if (left.family !== "nu" && right.family !== "nu") {
      return sixLeafRootWord(
        "ab",
        left.block,
        left.bit,
        right.block,
        right.bit,
        coefficientName,
      );
    }
    if (left.family !== "beta" && right.family !== "beta") {
      return sixLeafRootWord(
        "an",
        left.block,
        left.bit,
        right.block,
        right.bit,
        coefficientName,
      );
    }

    const forbidden = new Set([left.block, right.block]);
    const auxiliaryBlock = [0, 1, 2].find((index) => !forbidden.has(index))
      ?? [0, 1, 2].find((index) => index !== left.block);
    if (left.family === "beta") {
      return commutator(
        sixLeafRootWord("ab", left.block, 1, auxiliaryBlock, 0, coefficientName),
        sixLeafRootWord("an", auxiliaryBlock, 0, right.block, 1, "1"),
      );
    }
    return commutator(
      sixLeafRootWord("an", left.block, 1, auxiliaryBlock, 0, coefficientName),
      sixLeafRootWord("ab", auxiliaryBlock, 0, right.block, 1, "1"),
    );
  }

  function suffixSNames(suffix) {
    return [...suffix].map((bit) => `s${bit}`);
  }

  function suffixTNames(suffix) {
    return [...suffix].reverse().map((bit) => `t${bit}`);
  }

  function crossCylinderSwapWord(suffix, auxiliaryBlock) {
    const forward = productRootWord(0, auxiliaryBlock, suffixSNames(suffix));
    const backward = productRootWord(auxiliaryBlock, 0, suffixTNames(suffix));
    return concatenate(forward, backward, forward);
  }

  function sameAlphaCylinderSwapWord(leftSuffix, rightSuffix, auxiliaryBlock = 1) {
    const left = crossCylinderSwapWord(leftSuffix, auxiliaryBlock);
    const right = crossCylinderSwapWord(rightSuffix, auxiliaryBlock);
    const first = left.length <= right.length ? left : right;
    const second = left.length <= right.length ? right : left;
    return concatenate(first, second, first);
  }

  const transferRows = [];
  for (let row = 0; row < D.length; row += 1) {
    for (let column = 0; column < D.length; column += 1) {
      if (row === column) continue;
      for (const [coefficientName] of COEFFICIENT_ENTRIES) {
        const word = dRootWord(row, column, coefficientName);
        const expected = codeRoot(D, row, column, coefficientName, "expected-D-root");
        assertWordEquals(word, expected, `D root ${row}:${column}:${coefficientName}`);
        transferRows.push({ row, column, coefficient: coefficientName, word });
      }
    }
  }

  const contractionRows = [];
  for (const shift of ["u", "v"]) {
    const shiftUnit = shift === "u" ? contractions.u : contractions.v;
    for (let row = 0; row < ALPHA.length; row += 1) {
      for (let column = 0; column < ALPHA.length; column += 1) {
        if (row === column) continue;
        for (const [coefficientName, coefficient] of COEFFICIENT_ENTRIES) {
          const gamma = elementaryRoot(ALPHA, row, column, coefficient);
          const expected = shiftUnit.multiply(gamma).multiply(shiftUnit.inverse());
          const word = productRootWord(row, column, ["s0", coefficientName, "t0"]);
          assertWordEquals(word, expected, `${shift}*gamma*${shift}^-1`);
          contractionRows.push({ shift, row, column, coefficient: coefficientName, word });
        }
      }
    }
  }

  const swapRecipes = new Map();
  function getSwap(leftSuffix, rightSuffix) {
    const key = `${leftSuffix}:${rightSuffix}`;
    if (!swapRecipes.has(key)) {
      const word = sameAlphaCylinderSwapWord(leftSuffix, rightSuffix);
      const expected = cylinderSwap(`${ALPHA[0]}${leftSuffix}`, `${ALPHA[0]}${rightSuffix}`);
      assertWordEquals(word, expected, `alpha swap ${key}`);
      swapRecipes.set(key, word);
    }
    return swapRecipes.get(key);
  }

  // The contraction u sends 1000*w to 0001*w. Relative to alpha_1=000,
  // the conjugated support therefore begins with the suffix 1.
  const j1Word = concatenate(
    getSwap("110", "1111"),
    getSwap("110", "1110"),
    getSwap("100", "101"),
  );
  const j2Word = concatenate(
    getSwap("101", "110"),
    getSwap("110", "111"),
  );
  const [j1, j2] = makeThompsonVPresentationGenerators("1000");
  assertWordEquals(
    j1Word,
    contractions.u.multiply(j1).multiply(contractions.u.inverse()),
    "u*j1*u^-1",
  );
  assertWordEquals(
    j2Word,
    contractions.u.multiply(j2).multiply(contractions.u.inverse()),
    "u*j2*u^-1",
  );

  const semanticGeneratorUnits = new Map([
    ["identity", LeavittUnit.identity()],
    ...gammaUnits.entries(),
    ["u", contractions.u],
    ["v", contractions.v],
    ["j1", j1],
    ["j2", j2],
  ]);
  const semanticGeneratorBindings = [...semanticGeneratorUnits.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, unit]) => ({ name, exactLeavittUnitHash: unit.hash() }));

  const rowsForDigest = transferRows.map((item) => ({
    row: item.row,
    column: item.column,
    coefficient: item.coefficient,
    word: item.word,
  }));
  const lengths = transferRows.map((item) => item.word.length);
  const contractionLengths = contractionRows.map((item) => item.word.length);
  const contractionLengthSums = Object.fromEntries(
    ["u", "v"].map((shift) => [
      shift,
      contractionRows
        .filter((item) => item.shift === shift)
        .reduce((sum, item) => sum + item.word.length, 0),
    ]),
  );
  const histogram = Object.fromEntries(
    [...Map.groupBy(lengths, (length) => length)]
      .sort(([left], [right]) => left - right)
      .map(([length, items]) => [length, items.length]),
  );

  assert.equal(transferRows.length, 360);
  assert.equal(Math.max(...lengths), 36);
  assert.deepEqual(histogram, {
    1: 30,
    6: 36,
    12: 144,
    18: 12,
    24: 18,
    28: 12,
    30: 36,
    36: 72,
  });
  assert.equal(contractionRows.length, 60);
  assert.equal(Math.max(...contractionLengths), 10);
  assert.equal(j1Word.length, 300);
  assert.equal(j2Word.length, 180);

  const gammaAlphabet = [...gammaUnits.keys()]
    .sort()
    .map((name) => token(name));
  // Proposition 2.3 uses two different lazy 35-label systems.  Step 1 uses
  // Gamma together with the compressors u,v; Step 4 uses Gamma together with
  // the two Thompson-V generators and their inverses.  The formal word ball
  // below is the latter, not the ambient Step-1 generator set.
  const step1AmbientAlphabetId = "gamma-plus-compressors-u-v-lazy-35-v1";
  const step4GammaJAlphabetId = "gamma-plus-thompson-j1-j2-lazy-35-v1";
  const step1AmbientAlphabet = [
    token("identity"),
    ...gammaAlphabet,
    token("u"),
    token("u", true),
    token("v"),
    token("v", true),
  ];
  const step4GammaJAlphabet = [
    token("identity"),
    ...gammaAlphabet,
    token("j1"),
    token("j1", true),
    token("j2"),
    token("j2", true),
  ];
  const contractionComparisonWords = contractionRows.map((item) => concatenate(
    [token(item.shift), token(gammaName(item.row, item.column, item.coefficient)), token(item.shift, true)],
    inverseWord(item.word),
  ));
  const jComparisonWords = [
    concatenate([token("u"), token("j1"), token("u", true)], inverseWord(j1Word)),
    concatenate([token("u"), token("j2"), token("u", true)], inverseWord(j2Word)),
  ];
  const inverseAndInvolutionWords = [
    ...gammaAlphabet.map((item) => [item, item]),
    [token("u"), token("u", true)],
    [token("v"), token("v", true)],
    [token("j1"), token("j1", true)],
    [token("j2"), token("j2", true)],
  ];
  const presentationWords = bleakQuickRelators("j1", "j2").map((item) => (
    item.operatorWord.map((entry) => token(entry.generator, entry.inverse))
  ));
  const publicAudit = {
    specialGeneratorAlphabet: {
      gammaRootCount: gammaUnits.size,
      nonidentitySymmetricSize: gammaUnits.size + 4,
      lazySizeIncludingIdentity: gammaUnits.size + 5,
      step1Ambient: {
        alphabetId: step1AmbientAlphabetId,
        alphabetSize: step1AmbientAlphabet.length,
        alphabetDigest: digest(step1AmbientAlphabet),
      },
      step4GammaJ: {
        alphabetId: step4GammaJAlphabetId,
        alphabetSize: step4GammaJAlphabet.length,
        alphabetDigest: digest(step4GammaJAlphabet),
      },
      alphabetDigestsDistinct:
        digest(step1AmbientAlphabet) !== digest(step4GammaJAlphabet),
    },
    naturalAmbientRootDictionary: {
      verifiedRootCount: transferRows.length,
      maximumFreelyReducedLength: Math.max(...lengths),
      lengthHistogram: histogram,
      dictionaryDigest: digest(rowsForDigest),
    },
    contractionConjugateDictionary: {
      verifiedConjugateCount: contractionRows.length,
      maximumGammaWordLength: Math.max(...contractionLengths),
      perContractionLengthSums: contractionLengthSums,
      dictionaryDigest: digest(contractionRows),
    },
    conjugatedThompsonVGenerators: [
      {
        id: "u_contraction * V:u * u_contraction^-1",
        gammaWordLength: j1Word.length,
        factorSwapLengths: [
          getSwap("110", "1111").length,
          getSwap("110", "1110").length,
          getSwap("100", "101").length,
        ],
        wordDigest: digest(j1Word),
      },
      {
        id: "u_contraction * V:v * u_contraction^-1",
        gammaWordLength: j2Word.length,
        factorSwapLengths: [
          getSwap("101", "110").length,
          getSwap("110", "111").length,
        ],
        wordDigest: digest(j2Word),
      },
    ],
  };
  const compilerFixture = {
      gammaPositiveGeneratorCount: 30,
      gammaLazyGeneratorSetSize: 31,
      compressorCount: 2,
      contractionLengthSums: Object.values(contractionLengthSums),
      jWordLengths: [j1Word.length, j1Word.length, j2Word.length, j2Word.length],
      step1AmbientAlphabetId,
      step1AmbientAlphabetSize: step1AmbientAlphabet.length,
      step1AmbientAlphabet,
      step4GammaJAlphabetId,
      step4GammaJAlphabetSize: step4GammaJAlphabet.length,
      step4GammaJAlphabet,
      gammaWitnessAlphabetNames: gammaAlphabet.map((item) => item.name),
      gammaGraphDegree: 31,
      completedDegreeBound: 31,
      relationWords: [
        ...contractionComparisonWords,
        ...jComparisonWords,
        ...inverseAndInvolutionWords,
        ...presentationWords,
      ],
      normalizationWords: inverseAndInvolutionWords,
      semanticTargetGroupId: "G=EL_D(L_F2(1,2))",
      semanticEvaluationMapId: "exact-leavitt-unit-word-evaluation-v1",
      semanticEqualityOracleId: "exact-leavitt-f2-normal-form-equality-v1",
      semanticGeneratorBindings,
    };
  assert.equal(compilerFixture.step1AmbientAlphabetSize, 35);
  assert.equal(compilerFixture.step4GammaJAlphabetSize, 35);
  assert.notEqual(
    digest(compilerFixture.step1AmbientAlphabet),
    digest(compilerFixture.step4GammaJAlphabet),
  );
  assert.equal(
    new Set(semanticGeneratorBindings.map((item) => item.name)).size,
    semanticGeneratorBindings.length,
  );
  return { publicAudit, compilerFixture };
}

function buildSpectralAudit(transferLength, specialLazySize) {
  const gammaNatural = ershovJaikinKazhdanBound(3);
  const ambientNatural = ershovJaikinKazhdanBound(9);
  const gammaLazy = lazyMarkovSpectralGapBound(3);
  const ambientTransferredKappa = divideRationalByInteger(
    ambientNatural.rationalLowerBound,
    transferLength,
  );
  const ambientTransferredGap = divideRationalByInteger(
    multiplyRational(ambientTransferredKappa, ambientTransferredKappa),
    2 * specialLazySize,
  );
  const gammaLazyNegativeEndpointGap = rational(2n, BigInt(gammaLazy.lazyGeneratorMultisetSize));
  const ambientLazyNegativeEndpointGap = rational(2n, BigInt(specialLazySize));
  assert(compareRational(gammaLazy.rationalLowerBound, gammaLazyNegativeEndpointGap) <= 0);
  assert(compareRational(ambientTransferredGap, ambientLazyNegativeEndpointGap) <= 0);
  return {
    gamma: {
      naturalGeneratorCount: gammaNatural.elementaryGeneratorCount,
      lazyGeneratorMultisetSize: gammaLazy.lazyGeneratorMultisetSize,
      kazhdanLowerBound: gammaNatural.rationalLowerBound,
      lazyMarkovGapLowerBound: gammaLazy.rationalLowerBound,
      lazyMarkovGapDecimal: gammaLazy.decimalLowerBound,
      negativeEndpointGapFromIdentityLaziness: gammaLazyNegativeEndpointGap,
      absoluteMarkovContractionGap: gammaLazy.rationalLowerBound,
    },
    ambientSpecial: {
      naturalGeneratorCount: ambientNatural.elementaryGeneratorCount,
      naturalKazhdanLowerBound: ambientNatural.rationalLowerBound,
      exactNaturalToSpecialWordBound: transferLength,
      transferredKazhdanLowerBound: ambientTransferredKappa,
      specialLazyGeneratorMultisetSize: specialLazySize,
      lazyMarkovGapLowerBound: ambientTransferredGap,
      lazyMarkovGapDecimal: rationalValue(ambientTransferredGap),
      negativeEndpointGapFromIdentityLaziness: ambientLazyNegativeEndpointGap,
      absoluteMarkovContractionGap: ambientTransferredGap,
      derivation: "kappa_special >= kappa_natural/L; gap >= kappa_special^2/(2*|S_special_with_identity|)",
    },
  };
}

function exactKunHorizonAndSlack({ id, degree, provedAbsoluteGap, partitionBoundaryScale }) {
  if (!Number.isSafeInteger(degree) || degree < 1) {
    throw new Error("Kun horizon degree must be a positive safe integer");
  }
  if (!isPositiveRational(provedAbsoluteGap)
    || compareRational(provedAbsoluteGap, ONE_RATIONAL) > 0
    || !isPositiveRational(partitionBoundaryScale)) {
    throw new Error("Kun horizon inputs must be positive exact rationals");
  }

  const mu = rational(1n, 100n);
  const lowEnergySizeFraction = rational(8191n, 100000n);
  const effectiveKunGap = divideRationalByInteger(provedAbsoluteGap, 2);
  const proposition11BoundaryScale = divideRationalByInteger(
    partitionBoundaryScale,
    degree + 3,
  );
  const theta = divideRationalByInteger(
    multiplyRational(
      squareRational(proposition11BoundaryScale),
      squareRational(lowEnergySizeFraction),
    ),
    432 * degree * degree,
  );
  const thetaHalf = divideRationalByInteger(theta, 2);
  const nKappa = ceilReciprocalPositiveRational(effectiveKunGap);
  const dyadic = minimalDyadicExponentAtMost(thetaHalf);
  const horizon = dyadic.exponent * nKappa < 1n ? 1n : dyadic.exponent * nKappa;
  const accumulationSlackBound = divideRational(
    mu,
    multiplyRational(effectiveKunGap, rational(horizon)),
  );
  const commonLemma10Slack = minRational([thetaHalf, accumulationSlackBound]);
  const proposition11EnergyCoefficientUpper = divideRational(
    scaleRational(squareRational(addRational(ONE_RATIONAL, mu)), 9),
    squareRational(effectiveKunGap),
  );
  const condition2CheegerThreshold = divideRationalByInteger(
    scaleRational(squareRational(effectiveKunGap), degree),
    10,
  );

  assert.equal(compareRational(commonLemma10Slack, ZERO_RATIONAL) > 0, true);
  assert.equal(compareRational(commonLemma10Slack, thetaHalf) <= 0, true);
  assert.equal(compareRational(commonLemma10Slack, accumulationSlackBound) <= 0, true);
  assert.equal(horizon >= 1n, true);

  return {
    id,
    degree,
    provedAbsoluteGap,
    effectiveKunGap,
    partitionBoundaryScale,
    proposition11BoundaryScale,
    constants: {
      mu,
      lowEnergySizeFraction,
      thetaDenominatorConstant: 432,
    },
    theta,
    thetaHalf,
    reciprocalGapCeiling: nKappa.toString(),
    minimalDyadicExponent: dyadic.exponent.toString(),
    dyadicUpperBound: dyadic.value,
    previousDyadicValue: dyadic.previousValue,
    horizon: horizon.toString(),
    commonLemma10Slack,
    accumulationSlackBound,
    activeSlackBranch: compareRational(thetaHalf, accumulationSlackBound) <= 0
      ? "theta/2"
      : "mu/(kappa*K)",
    proposition11EnergyCoefficientUpper,
    condition2CheegerThreshold,
    exactChecks: {
      dyadicUpperBoundAtMostThetaHalf: true,
      previousDyadicValueAboveThetaHalf: dyadic.previousValue !== null,
      commonSlackAtMostThetaHalf: true,
      commonSlackAtMostAccumulationBound: true,
      blockDecayCertificate:
        "n=ceil(1/kappa), (1-kappa)^n<=1/2, K=m*n, hence (1-kappa)^K<=2^-m<=theta/2",
    },
  };
}

function buildKunHorizonSlackAudit(spectral) {
  const partitionBoundaryScale = rational(1n, 100n);
  const results = [
    exactKunHorizonAndSlack({
      id: "gamma-lazy-31",
      degree: 31,
      provedAbsoluteGap: spectral.gamma.absoluteMarkovContractionGap,
      partitionBoundaryScale,
    }),
    exactKunHorizonAndSlack({
      id: "ambient-special-lazy-35",
      degree: 35,
      provedAbsoluteGap: spectral.ambientSpecial.absoluteMarkovContractionGap,
      partitionBoundaryScale,
    }),
  ];
  assert.equal(results[0].horizon, "3340787538");
  assert.equal(results[1].horizon, "5477748121092");
  assert.equal(results.every((result) => result.activeSlackBranch === "theta/2"), true);
  return {
    schema: "oasis.kun-proposition-11-horizon-slack.audit.v1",
    algorithm: "exact-rational-safe-block-decay-v1",
    formula: {
      mu: "1/100",
      c: "8191/100000",
      theta: "a^2*c^2/(432*d^2)",
      a: "a_part/(d+3)",
      nKappa: "ceil(1/kappa)",
      minimalDyadicExponent: "min{m>=0:2^-m<=theta/2}",
      horizon: "max(1,m*nKappa)",
      commonLemma10Slack: "min(theta/2,mu/(kappa*K))",
    },
    partitionBoundaryScale,
    results,
    expectedControlHorizons: {
      gamma: "3340787538",
      ambientSpecial: "5477748121092",
    },
    allExactChecksPassed: true,
    baseSosSearchDependsOnHorizonOrSlack: false,
    baseSosRowsProduced: false,
    fullKunModulesProduced: false,
    theoremBoundary: [
      "The horizon/slack formula is exact and executable at any supplied rational internal scale.",
      "The a_part=1/100 control is instantiated here; the base SOS rows and the complete",
      "defect-to-edit module remain separate missing objects.",
    ].join(" "),
  };
}

function buildSosFamilyCompilerAudit(spectral) {
  // k=1..4 and zeta=1/1024 are executable controls only.  The effective
  // Kun gap and the standard property-(T) SOS searched for below do not
  // depend on either control parameter.
  const horizon = 4;
  const zeta = rational(1n, 1024n);
  const variableA = [ZERO_RATIONAL, ONE_RATIONAL];
  const deltaPolynomial = [ONE_RATIONAL, rational(-1n)];
  const fixtures = [
    {
      id: "gamma-lazy-31",
      identityWeight: rational(1n, 31n),
      provedAbsoluteGap: spectral.gamma.absoluteMarkovContractionGap,
    },
    {
      id: "ambient-special-lazy-35",
      identityWeight: rational(1n, 35n),
      provedAbsoluteGap: spectral.ambientSpecial.absoluteMarkovContractionGap,
    },
  ];

  const results = fixtures.map((fixture) => {
    const kappa0 = fixture.provedAbsoluteGap;
    const lambda = divideRationalByInteger(kappa0, 2);
    const p = fixture.identityWeight;
    const u = subtractRational(ONE_RATIONAL, lambda);
    const b = subtractRational(ONE_RATIONAL, scaleRational(p, 2));
    const x = [u, rational(-1n)];
    const y = [b, ONE_RATIONAL];
    const L = addRational(u, b);
    const d = subtractRational(u, b);
    const deltaSquared = polynomialPower(deltaPolynomial, 2);
    const baseGapPolynomial = addPolynomials(
      deltaSquared,
      scalePolynomial(deltaPolynomial, scaleRational(lambda, -1)),
    );
    const leftC = multiplyPolynomials(
      deltaSquared,
      addPolynomials([squareRational(u)], scalePolynomial(polynomialPower(variableA, 2), rational(-1n))),
    );
    const xy = multiplyPolynomials(x, y);
    const deltaX = multiplyPolynomials(deltaPolynomial, x);
    const bracket = addPolynomials(
      addPolynomials(
        multiplyPolynomials(polynomialPower(xy, 2), deltaPolynomial),
        scalePolynomial(
          multiplyPolynomials(polynomialPower(y, 2), baseGapPolynomial),
          lambda,
        ),
      ),
      multiplyPolynomials(polynomialPower(deltaX, 2), y),
    );
    const rightC = addPolynomials(
      addPolynomials(
        scalePolynomial(multiplyPolynomials(polynomialPower(x, 2), deltaPolynomial), d),
        scalePolynomial(baseGapPolynomial, multiplyRational(d, lambda)),
      ),
      scalePolynomial(bracket, divideRational(ONE_RATIONAL, L)),
    );
    assert.equal(polynomialEqual(leftC, rightC), true);
    assert.equal(compareRational(lambda, ZERO_RATIONAL) > 0, true);
    assert.equal(compareRational(lambda, kappa0) < 0, true);
    assert.equal(compareRational(lambda, scaleRational(p, 2)) <= 0, true);
    assert.equal(compareRational(d, ZERO_RATIONAL) >= 0, true);
    assert.equal(compareRational(L, ZERO_RATIONAL) > 0, true);

    const family = [];
    for (let k = 1; k <= horizon; k += 1) {
      let Hk = [ZERO_RATIONAL];
      for (let j = 0; j < k; j += 1) {
        Hk = addPolynomials(Hk, scalePolynomial(
          polynomialPower(variableA, 2 * j),
          rationalPower(u, 2 * (k - 1 - j)),
        ));
      }
      const boundaryP = multiplyPolynomials(
        deltaSquared,
        addPolynomials(
          [rationalPower(u, 2 * k)],
          scalePolynomial(polynomialPower(variableA, 2 * k), rational(-1n)),
        ),
      );
      const compiledBoundaryP = multiplyPolynomials(leftC, Hk);
      assert.equal(polynomialEqual(boundaryP, compiledBoundaryP), true);

      const optionalZetaCoefficient = addRational(rationalPower(u, k), zeta);
      const positiveDeltaSquaredCoefficient = subtractRational(
        squareRational(optionalZetaCoefficient),
        rationalPower(u, 2 * k),
      );
      assert.equal(compareRational(positiveDeltaSquaredCoefficient, ZERO_RATIONAL) > 0, true);
      const optionalZetaQ = multiplyPolynomials(
        deltaSquared,
        addPolynomials(
          [squareRational(optionalZetaCoefficient)],
          scalePolynomial(polynomialPower(variableA, 2 * k), rational(-1n)),
        ),
      );
      const compiledOptionalZetaQ = addPolynomials(
        compiledBoundaryP,
        scalePolynomial(deltaSquared, positiveDeltaSquaredCoefficient),
      );
      assert.equal(polynomialEqual(optionalZetaQ, compiledOptionalZetaQ), true);
      family.push({
        k,
        boundaryPolynomialDigest: digest(boundaryP),
        boundaryIdentityVerified: true,
        optionalZeta: zeta,
        optionalTargetCoefficient: optionalZetaCoefficient,
        positiveDeltaSquaredCoefficient,
        optionalZetaPolynomialDigest: digest(optionalZetaQ),
        supportRadiusDependsOnZeta: false,
      });
    }
    return {
      id: fixture.id,
      identityWeight: p,
      provedAbsoluteGap: kappa0,
      effectiveKunGap: lambda,
      controlHorizon: horizon,
      optionalControlZeta: zeta,
      intervalIdentityVerified: true,
      boundaryFamilyVerified: family.length,
      optionalZetaFamilyVerified: family.length,
      controlFamily: family,
      baseGapPolynomialName: "B_lambda=Delta^2-lambda*Delta",
      baseGapPolynomialDigest: digest(baseGapPolynomial),
      intervalCompilerPolynomialDigest: digest(leftC),
      conditionalCommonRadius:
        "2*(max(baseGapSosRowRadius+1,3)+K-1), independent of zeta",
      baseSosSearchDependsOnHorizonOrZeta: false,
    };
  });

  return {
    schema: "oasis.one-property-t-sos-to-kun-family.compiler-audit.v2",
    effectiveGapRule: "lambda=kappa_0/2 independently for each fixed generating set",
    exactIdentity: [
      "C=Delta^2*(u^2-A^2)",
      "B_lambda=Delta^2-lambda*Delta",
      "C=d*x^2*Delta+d*lambda*B_lambda+((x*y)^2*Delta+lambda*y^2*B_lambda+(Delta*x)^2*y)/L",
      "P_k=C*sum_{j<k}u^(2(k-1-j))*A^(2j)",
      "Q_k(zeta)=P_k+(((u^k+zeta)^2-u^(2k))*Delta^2)",
    ],
    resultCount: results.length,
    results,
    baseSosRowsProduced: false,
    theoremBoundary:
      "The exact polynomial compiler is verified; one finite rational B_lambda SOS per fixed generating set remains unmaterialized.",
  };
}

function buildFiniteEndpointAudit() {
  const oracle = new ExactNonSoficGroupOracle();
  const { names } = registerProofConfiguration(oracle);
  const obstruction = buildFiniteLefObstruction(oracle, names.j[0], names.j[1]);
  const relatorLengths = obstruction.presentation.relators.map((item) => item.operatorWord.length);
  const representativeLengths = obstruction.finiteSet.map((item) => item.representativeWord.length);
  const maxRepresentativeLength = Math.max(...representativeLengths);
  const maxFormalPrefixLength = Math.max(...relatorLengths);
  assert.equal(obstruction.finiteSetSize, 155);
  assert.equal(maxRepresentativeLength, 67);
  assert.equal(maxFormalPrefixLength, 69);
  return {
    chartId: obstruction.id,
    finiteSetSize: obstruction.finiteSetSize,
    relatorCount: obstruction.presentation.relators.length,
    relatorLengths,
    maximumRepresentativeWordLength: maxRepresentativeLength,
    maximumFormalRelatorPrefixLength: maxFormalPrefixLength,
    safeProductWordLength: 2 * maxFormalPrefixLength,
    chosenSeparatorWordLength: obstruction.chosenNonidentityWord.length,
    chartDigest: digest({
      presentation: obstruction.presentation,
      chosenNonidentityWord: obstruction.chosenNonidentityWord,
      finiteSet: obstruction.finiteSet,
    }),
  };
}

function sealCompilerFixture(baseFixture, metadata) {
  const fixture = {
    ...clone(baseFixture),
    ...clone(metadata),
    relationWordsDigest: digest(baseFixture.relationWords),
    normalizationWordsDigest: digest(baseFixture.normalizationWords),
    step1AmbientAlphabetDigest: digest(baseFixture.step1AmbientAlphabet),
    step4GammaJAlphabetDigest: digest(baseFixture.step4GammaJAlphabet),
    semanticGeneratorBindingsDigest: digest(baseFixture.semanticGeneratorBindings),
  };
  return { ...fixture, fixtureDigest: digest(fixture) };
}

function buildTheoremFixture(
  exactBundle = buildExactWordAudit(),
  endpoint = buildFiniteEndpointAudit(),
) {
  const maximumComparisonWordLength = Math.max(
    ...exactBundle.compilerFixture.relationWords.map((word) => word.length),
  );
  return sealCompilerFixture(exactBundle.compilerFixture, {
    fixtureId: "openai-chapter-3-el9-thompson-v-v1",
    proofInstanceDigest: digest({ exactWords: exactBundle.publicAudit, endpoint }),
    endpointChartId: endpoint.chartId,
    endpointChartDigest: endpoint.chartDigest,
    endpointSafeProductWordLength: endpoint.safeProductWordLength,
    maximumComparisonWordLength,
    minimumKtWordRadius: Math.ceil(Math.max(
      endpoint.safeProductWordLength,
      maximumComparisonWordLength,
    ) / 2),
    endpointFiniteSetSize: endpoint.finiteSetSize,
  });
}

const MODULE_SCHEMA = "oasis.quantitative-proof-module.v1";

const MODULE_SPECS = Object.freeze({
  kunGamma: Object.freeze({
    moduleId: "kun-gamma-single-scale",
    role: "single-scale expander decomposition for Gamma",
    generatorSetId: "gamma-natural-lazy-31-v1",
    conventionId: "kun-labelled-regular-lazy-markov-v1",
    sourceId: "kun-property-t-arxiv-1606.04471-v2",
    sourceDigest: "450b67d5c866c6791d04d313774d754067046a9bed1338f19e5d57b5fbac0c75",
    statement: [
      "For the requested rational edit fraction r, return a finite locality radius,",
      "a positive chart tolerance, a positive component-expansion lower bound,",
      "a degree bound, a size threshold, and the complete finite word portfolio",
      "whose verified tests force the declared edit decomposition.",
    ].join(" "),
  }),
  kunG: Object.freeze({
    moduleId: "kun-g-single-scale",
    role: "single-scale expander decomposition for the special ambient graph",
    generatorSetId: "ambient-special-lazy-35-v1",
    conventionId: "kun-labelled-regular-lazy-markov-v1",
    sourceId: "kun-property-t-arxiv-1606.04471-v2",
    sourceDigest: "450b67d5c866c6791d04d313774d754067046a9bed1338f19e5d57b5fbac0c75",
    statement: [
      "For the requested rational edit fraction r, return a finite locality radius,",
      "a positive chart tolerance, a positive component-expansion lower bound,",
      "a degree bound, a size threshold, and the complete finite word portfolio",
      "for the exact 35-label special generator graph.",
    ].join(" "),
  }),
  es: Object.freeze({
    moduleId: "elek-szabo-normalization",
    role: "finite inverse and involution normalization",
    generatorSetId: "proof-labels-gamma-u-v-j-v1",
    conventionId: "normalized-hamming-permutation-v1",
    sourceId: "exact-cycle-normalization-project-proof-v1",
    sourceDigest: digest("Elek-Szabo-2006-Lemma-2.1-plus-exact-cycle-count"),
    statement: [
      "Return a positive primitive chart tolerance which makes every declared",
      "identity, inverse, and involution label exact while charging at most the",
      "requested rational repair fraction.",
    ].join(" "),
  }),
  kt: Object.freeze({
    moduleId: "kun-thom-finite-thompson-chart",
    role: "finite expanding-chart to local-embedding extraction",
    generatorSetId: "gamma-times-thompson-v-two-generator-v1",
    conventionId: "kun-thom-almost-automorphism-clusters-v1",
    sourceId: "kun-thom-arxiv-1901.03963-v2",
    sourceDigest: "191814240dc76552e8d8e515f2d29e94ff429d7d6c26174a7ba25155bd23cd23",
    statement: [
      "For the exact 155-element Thompson-V chart and requested expansion, return",
      "a finite portfolio, a Gamma-witness radius r, positive tolerance, and",
      "minimum component size which force an exact local embedding of that chart;",
      "the charged comparison radius is ell=2r and must cover the frozen endpoint",
      "product radius and every declared comparison and portfolio word; the module",
      "must prove that its Gamma-ball witness words denote pairwise distinct elements.",
    ].join(" "),
  }),
});

function moduleSpecWithDigest(spec) {
  return { ...spec, statementDigest: digest(spec.statement) };
}

function compilerContractDigest() {
  return digest({
    moduleSchema: MODULE_SCHEMA,
    compilationSchema: COMPILATION_CERTIFICATE_SCHEMA,
    moduleSpecifications: Object.fromEntries(
      Object.entries(MODULE_SPECS).map(([key, spec]) => [key, moduleSpecWithDigest(spec)]),
    ),
    finitePortfolioEncoding:
      "semantic-image-of-explicit-prefix-closure-plus-shortlex-formal-ball-v2",
    budgetConvention: "openai-proposition-2.3-step-1-through-5-v1",
  });
}

function moduleProofClaim(module, marker) {
  const fields = [
    "schema",
    "moduleId",
    "kind",
    "generatorSetId",
    "conventionId",
    "statementDigest",
    "sourceId",
    "sourceDigest",
    "verifierId",
    "fixtureId",
    "fixtureDigest",
    "proofInstanceDigest",
    "compilerContractDigest",
    "compilerSourceDigest",
  ];
  return {
    ...Object.fromEntries(fields
      .filter((field) => module[field] !== undefined)
      .map((field) => [field, module[field]])),
    output: module.output,
    totalityCertificate: module.totalityCertificate,
    marker,
  };
}

function sourceFileDigest(relativeUrl) {
  return createHash("sha256").update(readFileSync(new URL(relativeUrl, import.meta.url))).digest("hex");
}

function buildSourceBindings() {
  const files = [
    "./genesis-quantitative-nonsofic-extraction.mjs",
    "../src/leavitt-f2.mjs",
    "../src/unit-group.mjs",
    "../src/proof-configuration.mjs",
    "../src/group-oracle.mjs",
    "../src/thompson-v-lef-obstruction.mjs",
    "../src/kazhdan-bounds.mjs",
  ];
  return {
    executableDependencies: Object.fromEntries(files.map((file) => [file, sourceFileDigest(file)])),
    theoremStatements: Object.fromEntries(
      Object.entries(MODULE_SPECS).map(([key, spec]) => [key, moduleSpecWithDigest(spec)]),
    ),
    primarySources: [
      {
        id: "openai-chapter-3-proposition-2.3",
        url: "https://cdn.openai.com/pdf/ten-proofs-oai.pdf",
      },
      {
        id: "kun-lemma-10",
        url: "https://arxiv.org/abs/1606.04471",
      },
      {
        id: "kun-thom-theorem-1.1",
        url: "https://arxiv.org/abs/1901.03963",
      },
      {
        id: "ershov-jaikin-theorem-6.2",
        url: "https://arxiv.org/abs/0809.4095",
      },
      {
        id: "bleak-quick-theorem-1.3",
        url: "https://arxiv.org/abs/1511.02123",
      },
      {
        id: "ozawa-property-t-sos",
        url: "https://arxiv.org/abs/1312.5431",
      },
      {
        id: "kaluba-nowak-ozawa-support-search",
        url: "https://doi.org/10.1007/s00208-019-01874-9",
      },
    ],
  };
}

function isHexDigest(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function validateWord(word) {
  return Array.isArray(word) && word.every((item) => (
    item
    && typeof item.name === "string"
    && item.name.length > 0
    && typeof item.inverse === "boolean"
  ));
}

function validateWordFamily(words) {
  return Array.isArray(words) && words.every(validateWord);
}

function maximumWordLength(words) {
  return words.length === 0 ? 0 : Math.max(...words.map((word) => word.length));
}

function hasUniqueFormalWords(words) {
  return new Set(words.map(formalWordKey)).size === words.length;
}

function validateModuleShape(key, module, mode, fixture) {
  const spec = moduleSpecWithDigest(MODULE_SPECS[key]);
  if (!module) return { ok: false, reason: "missing-module" };
  if (module.schema !== MODULE_SCHEMA) return { ok: false, reason: "module-schema" };
  if (module.moduleId !== spec.moduleId) return { ok: false, reason: "module-id" };
  if (module.generatorSetId !== spec.generatorSetId) return { ok: false, reason: "generator-set" };
  if (module.conventionId !== spec.conventionId) return { ok: false, reason: "convention" };
  if (module.statementDigest !== spec.statementDigest) return { ok: false, reason: "statement-digest" };
  if (!isHexDigest(module.sourceDigest)) return { ok: false, reason: "source-digest" };
  if (!module.proofCertificate || !isHexDigest(module.proofCertificate.digest)) {
    return { ok: false, reason: "proof-certificate" };
  }
  if (!module.totalityCertificate
    || module.totalityCertificate.type !== "finite-total-single-scale"
    || module.totalityCertificate.outputDigest !== digest(module.output)) {
    return { ok: false, reason: "totality-certificate" };
  }
  const theoremMode = mode === "theorem";
  if (theoremMode) {
    if (!fixture || module.fixtureId !== fixture.fixtureId
      || module.fixtureDigest !== fixture.fixtureDigest
      || module.proofInstanceDigest !== fixture.proofInstanceDigest) {
      return { ok: false, reason: "fixture-binding" };
    }
    if (module.compilerContractDigest !== compilerContractDigest()
      || module.compilerSourceDigest !== sourceFileDigest("./genesis-quantitative-nonsofic-extraction.mjs")) {
      return { ok: false, reason: "compiler-binding" };
    }
    if (module.sourceId !== spec.sourceId || module.sourceDigest !== spec.sourceDigest) {
      return { ok: false, reason: "source-binding" };
    }
  } else if (mode !== "synthetic" || module.kind !== "synthetic-calibration") {
    return { ok: false, reason: "qualitative-or-metastable-module-rejected" };
  } else if (module.verifierId !== "synthetic-calibration-verifier-v1") {
    return { ok: false, reason: "untrusted-verifier" };
  } else if (module.proofCertificate.digest !== digest(
    moduleProofClaim(module, "synthetic-calibration-only"),
  )) {
    return { ok: false, reason: "synthetic-proof-digest" };
  }

  const output = module.output;
  if (!output || !isPositiveRational(output.tolerance)) {
    return { ok: false, reason: "positive-tolerance" };
  }
  if (key === "kunGamma" || key === "kunG") {
    if (!isPositiveRational(output.requestedEditFraction)) {
      return { ok: false, reason: "positive-edit-fraction" };
    }
    if (!isPositiveRational(output.expansion)) return { ok: false, reason: "positive-expansion" };
    if (!Number.isSafeInteger(output.localityRadius) || output.localityRadius < 0) {
      return { ok: false, reason: "locality-radius" };
    }
    if (!Number.isSafeInteger(output.degreeBound) || output.degreeBound < 1) {
      return { ok: false, reason: "degree-bound" };
    }
    if (!Number.isSafeInteger(output.minimumSize) || output.minimumSize < 1) {
      return { ok: false, reason: "minimum-size" };
    }
    if (!validateWordFamily(output.requiredWords) || output.requiredWords.length === 0) {
      return { ok: false, reason: "required-words" };
    }
  }
  if (key === "es") {
    if (!isPositiveRational(output.requestedRepairFraction)) {
      return { ok: false, reason: "positive-repair-fraction" };
    }
    if (!validateWordFamily(output.requiredWords) || output.requiredWords.length === 0) {
      return { ok: false, reason: "required-words" };
    }
  }
  if (key === "kt") {
    if (!isPositiveRational(output.requestedExpansion)) {
      return { ok: false, reason: "positive-requested-expansion" };
    }
    if (!Number.isSafeInteger(output.wordRadius) || output.wordRadius < 1
      || output.wordRadius > Math.floor(Number.MAX_SAFE_INTEGER / 4)) {
      return { ok: false, reason: "word-radius" };
    }
    if (!Number.isSafeInteger(output.minimumComponentSize) || output.minimumComponentSize < 1) {
      return { ok: false, reason: "minimum-component-size" };
    }
    if (!validateWordFamily(output.portfolioWords) || output.portfolioWords.length === 0) {
      return { ok: false, reason: "portfolio-words" };
    }
    if (!validateWordFamily(output.distinctGammaBallWitness)
      || output.distinctGammaBallWitness.length < output.minimumComponentSize) {
      return { ok: false, reason: "distinct-gamma-ball-witness" };
    }
    if (mode === "theorem" && (
      output.endpointChartId !== fixture.endpointChartId
      || output.endpointChartDigest !== fixture.endpointChartDigest
      || output.wordRadius < fixture.minimumKtWordRadius
      || !output.semanticDistinctnessCertificate
      || !isHexDigest(output.semanticDistinctnessCertificate.digest)
    )) {
      return { ok: false, reason: "endpoint-binding" };
    }
  }
  if (theoremMode) {
    if (key === "es"
      && module.kind === "built-in-exact-normalization"
      && module.verifierId === "exact-cycle-normalization-verifier-v1"
      && compareRational(
        module.output.tolerance,
        divideRationalByInteger(module.output.requestedRepairFraction, 2),
      ) === 0
      && digest(module.output.requiredWords) === fixture.normalizationWordsDigest
      && module.proofCertificate.digest === digest(
        moduleProofClaim(module, "exact-permutation-cycle-normalization"),
      )) {
      return { ok: true, reason: "verified-built-in-cycle-normalization" };
    }
    return { ok: false, reason: "no-installed-theorem-module-verifier" };
  }
  return { ok: true, reason: "verified-synthetic-shape-and-proof-digest" };
}

function addRationals(values) {
  return values.reduce(addRational, ZERO_RATIONAL);
}

function formalWordKey(word) {
  return word.map((item) => `${item.name}${item.inverse ? "^-1" : ""}`).join(" ");
}

function materializeFormalBall(alphabet, radius, cap = 100000) {
  if (!Array.isArray(alphabet) || alphabet.length === 0 || !alphabet.every((item) => (
    item && typeof item.name === "string" && typeof item.inverse === "boolean"
  ))) {
    throw new Error("Formal-ball alphabet is invalid");
  }
  if (!Number.isSafeInteger(radius) || radius < 0) throw new Error("Formal-ball radius is invalid");
  const byKey = new Map([["", []]]);
  let frontier = [[]];
  for (let depth = 1; depth <= radius; depth += 1) {
    const next = [];
    for (const word of frontier) {
      for (const symbol of alphabet) {
        const extended = [...word, { ...symbol }];
        const key = formalWordKey(extended);
        if (!byKey.has(key)) {
          byKey.set(key, extended);
          next.push(extended);
          if (byKey.size > cap) throw new Error("Formal portfolio exceeds materialization cap");
        }
      }
    }
    frontier = next;
  }
  return [...byKey.values()];
}

function testClosure(wordFamilies) {
  const byKey = new Map([["", []]]);
  for (const words of wordFamilies) {
    if (!validateWordFamily(words)) throw new Error("Test closure received an invalid word family");
    for (const word of words) {
      for (let length = 0; length <= word.length; length += 1) {
        const prefix = word.slice(0, length).map((item) => ({ ...item }));
        byKey.set(formalWordKey(prefix), prefix);
      }
    }
  }
  return [...byKey.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, word]) => word);
}

function isPrefixClosed(words) {
  const keys = new Set(words.map(formalWordKey));
  return words.every((word) => (
    Array.from({ length: word.length + 1 }, (_, length) => (
      keys.has(formalWordKey(word.slice(0, length)))
    )).every(Boolean)
  ));
}

function geometricWordCount(alphabetSize, radius) {
  if (!Number.isSafeInteger(alphabetSize) || alphabetSize < 1) {
    throw new Error("Alphabet size must be positive");
  }
  if (!Number.isSafeInteger(radius) || radius < 0) throw new Error("Word radius is invalid");
  if (radius > MAX_EXACT_GEOMETRIC_RADIUS) {
    throw new Error("symbolic-count-engine-missing");
  }
  let total = 1n;
  let power = 1n;
  for (let index = 1; index <= radius; index += 1) {
    power *= BigInt(alphabetSize);
    total += power;
  }
  return total;
}

function formalBallDescriptor(alphabet, radius) {
  if (!Array.isArray(alphabet) || alphabet.length === 0 || !alphabet.every((item) => (
    item && typeof item.name === "string" && typeof item.inverse === "boolean"
  ))) {
    throw new Error("Formal-ball alphabet is invalid");
  }
  if (!Number.isSafeInteger(radius) || radius < 0) throw new Error("Formal-ball radius is invalid");
  const formalWordCountExpression = {
    schema: "oasis.geometric-word-count-expression.v1",
    operation: "sum-of-powers",
    base: alphabet.length,
    firstExponent: 0,
    lastExponent: radius,
  };
  const exactFormalWordCountAvailable = radius <= MAX_EXACT_GEOMETRIC_RADIUS;
  return {
    schema: "oasis.shortlex-formal-word-ball.v2",
    enumeratorId: "breadth-first-cartesian-shortlex-v1",
    alphabet: clone(alphabet),
    alphabetDigest: digest(alphabet),
    alphabetSize: alphabet.length,
    radius,
    formalWordCountExpression,
    formalWordCountExpressionDigest: digest(formalWordCountExpression),
    exactFormalWordCountAvailable,
    formalWordCount: exactFormalWordCountAvailable
      ? geometricWordCount(alphabet.length, radius).toString()
      : null,
    prefixClosed: true,
  };
}

function wordBelongsToFormalBall(word, descriptor) {
  const alphabetKeys = new Set(descriptor.alphabet.map((item) => formalWordKey([item])));
  return word.length <= descriptor.radius
    && word.every((item) => alphabetKeys.has(formalWordKey([item])));
}

function primitiveHammingEventLedger(maximumWordLength) {
  if (!Number.isSafeInteger(maximumWordLength) || maximumWordLength < 0) {
    throw new Error("Maximum word length must be a nonnegative safe integer");
  }
  const eventFamilies = {
    leftWordPrefixTelescopes: maximumWordLength,
    rightWordPrefixTelescopes: maximumWordLength,
    inverseProductComparisonAndSeparation: 2 * maximumWordLength + 2,
    sourceInverseInvolutionAndEndpointTrace: 4 * maximumWordLength + 6,
  };
  const totalCoefficient = Object.values(eventFamilies)
    .reduce((sum, count) => sum + count, 0);
  assert.equal(totalCoefficient, 8 * maximumWordLength + 8);
  return {
    schema: "oasis.primitive-hamming-event-ledger.v1",
    conventionId: "normalized-hamming-union-bound-v1",
    normalizedSoficChartConvention: [
      "For x,y,xy in F, d_N(phi(x)phi(y),phi(xy))<epsilon;",
      "phi(1)=id after the declared normalization; and for distinct x,y in F,",
      "d_N(phi(x),phi(y))>1-epsilon.",
    ].join(" "),
    maximumWordLength,
    eventFamilies,
    eventFamilyMeaning: {
      leftWordPrefixTelescopes:
        "evaluate every prefix of the first representative word",
      rightWordPrefixTelescopes:
        "evaluate every prefix of the second representative word",
      inverseProductComparisonAndSeparation:
        "form the inverse-product comparison and retain its equality or separation test",
      sourceInverseInvolutionAndEndpointTrace: [
        "repeat the two-sided prefix trace after source-level inverse/involution",
        "normalization and retain the endpoint equality or separation event",
      ].join(" "),
    },
    totalCoefficient,
    proofTraceBound: [
      "For each source-level derived comparison, the four displayed families give",
      "a padded trace of at most 8L+8 primitive multiplication or separation events.",
      "Every event is a prefix of a declared word or inverse-product comparison",
      "retained by TestCl_word and is evaluated before any graph repair.",
    ].join(" "),
    excludedFromThisCharge: [
      "Kun edge edits, ES vertex changes, and both Step-5 repairs are r-controlled",
      "later operations already charged in b_ell and q_cut; they are not counted",
      "again as epsilon-controlled primitive chart events.",
    ].join(" "),
  };
}

function semanticFiniteSubsetDescriptor(formalRepresentativeFamily, fixture) {
  const requiredStrings = [
    "semanticTargetGroupId",
    "semanticEvaluationMapId",
    "semanticEqualityOracleId",
  ];
  if (!requiredStrings.every((key) => typeof fixture?.[key] === "string")
    || !Array.isArray(fixture?.semanticGeneratorBindings)) {
    throw new Error("Semantic finite-subset fixture is incomplete");
  }
  const boundNames = new Set(fixture.semanticGeneratorBindings.map((item) => item.name));
  const representativeNames = new Set([
    ...formalRepresentativeFamily.exceptionalWordsOutsideBall
      .flatMap((word) => word.map((item) => item.name)),
    ...formalRepresentativeFamily.generatedFamilies
      .flatMap((family) => family.alphabet.map((item) => item.name)),
  ]);
  if ([...representativeNames].some((name) => !boundNames.has(name))) {
    throw new Error("Semantic finite-subset descriptor has an unbound generator");
  }
  return {
    schema: "oasis.semantic-finite-subset.v1",
    targetGroupId: fixture.semanticTargetGroupId,
    definition: "F={eval_G(w):w belongs to the finite formal representative family}",
    evaluationMapId: fixture.semanticEvaluationMapId,
    equalityOracleId: fixture.semanticEqualityOracleId,
    generatorBindingsDigest:
      fixture.semanticGeneratorBindingsDigest ?? digest(fixture.semanticGeneratorBindings),
    formalRepresentativeFamilyDigest: digest(formalRepresentativeFamily),
    formalRepresentativeCount:
      formalRepresentativeFamily.formalWordRepresentativeCount,
    semanticCardinalityRelation: "|F| is at most the formal representative count",
    allRepresentativeSymbolsBound: true,
    quotientByExactTargetGroupEquality: true,
    hammingTestsAreInterpretedAfterEvaluationInTargetGroup: true,
    equalityAndDistinctnessClassification: [
      "Enumerate the finite representative family, evaluate each word, and classify",
      "pairs with the frozen exact equality oracle. The descriptor binds this finite",
      "algorithm; it does not claim the exponentially large pair table is materialized.",
    ].join(" "),
  };
}

function evaluateDownstreamBudget({ modules, fixture, eta, delta }) {
  const r = modules.kunGamma.output.requestedEditFraction;
  if (compareRational(r, modules.kunG.output.requestedEditFraction) !== 0
    || compareRational(r, modules.es.output.requestedRepairFraction) !== 0) {
    return { ok: false, reason: "inconsistent-requested-scale" };
  }
  if (!isPositiveRational(eta) || compareRational(eta, ONE_RATIONAL) >= 0) {
    return { ok: false, reason: "eta-out-of-range" };
  }
  if (!isPositiveRational(delta)
    || compareRational(scaleRational(delta, 2), ONE_RATIONAL) >= 0) {
    return { ok: false, reason: "delta-out-of-range" };
  }

  const gammaGamma = modules.kunGamma.output.expansion;
  const gammaG = modules.kunG.output.expansion;
  const lambdaCleanup = divideRationalByInteger(gammaGamma, 2);
  if (compareRational(modules.kt.output.requestedExpansion, lambdaCleanup) !== 0) {
    return { ok: false, reason: "kt-expansion-not-cleanup-half" };
  }

  const ell = 2 * modules.kt.output.wordRadius;
  if (modules.kt.output.wordRadius < (fixture.minimumKtWordRadius ?? 1)) {
    return { ok: false, reason: "kt-word-radius-below-fixture-minimum" };
  }
  if (maximumWordLength(fixture.relationWords) > ell
    || maximumWordLength(modules.kt.output.portfolioWords) > ell) {
    return { ok: false, reason: "portfolio-word-exceeds-charged-radius" };
  }
  if (maximumWordLength(modules.kunGamma.output.requiredWords)
      > modules.kunGamma.output.localityRadius
    || maximumWordLength(modules.kunG.output.requiredWords)
      > modules.kunG.output.localityRadius) {
    return { ok: false, reason: "kun-word-exceeds-locality-radius" };
  }
  const gammaWitnessNames = new Set(fixture.gammaWitnessAlphabetNames ?? []);
  if (maximumWordLength(modules.kt.output.distinctGammaBallWitness) > Math.floor(ell / 2)
    || !hasUniqueFormalWords(modules.kt.output.distinctGammaBallWitness)
    || modules.kt.output.distinctGammaBallWitness.some((word) => (
      word.some((item) => !gammaWitnessNames.has(item.name))
    ))) {
    return { ok: false, reason: "gamma-ball-witness-radius-or-uniqueness" };
  }
  if (2 * ell > MAX_EXACT_GEOMETRIC_RADIUS) {
    return {
      ok: false,
      reason: "symbolic-count-engine-missing",
      parameters: {
        ell,
        generatedFormalBallRadius: 2 * ell,
        lambdaCleanup,
        exactGeometricRadiusLimit: MAX_EXACT_GEOMETRIC_RADIUS,
      },
      symbolicCounts: {
        atEll: {
          operation: "sum-of-powers",
          base: fixture.step4GammaJAlphabetSize,
          firstExponent: 0,
          lastExponent: ell,
        },
        atPrevious: {
          operation: "sum-of-powers",
          base: fixture.step4GammaJAlphabetSize,
          firstExponent: 0,
          lastExponent: Math.max(0, ell - 1),
        },
      },
    };
  }

  const maximumContractionLengthSum = Math.max(...fixture.contractionLengthSums);
  const A = 1 + fixture.gammaPositiveGeneratorCount + 2 * maximumContractionLengthSum;
  const cU = divideRational(rational(BigInt(2 * A)), gammaGamma);
  const rOverEta = divideRational(r, eta);
  const compressorTerm = addRationals([
    scaleRational(eta, 2),
    scaleRational(multiplyRational(cU, rOverEta), 2),
    scaleRational(r, 2),
  ]);
  const variation = addRationals([
    r,
    scaleRational(r, 8 * fixture.gammaPositiveGeneratorCount),
    scaleRational(compressorTerm, 2 * fixture.compressorCount),
  ]);
  const medianExceptional = divideRational(variation, multiplyRational(gammaG, delta));
  const oneMinusEta = subtractRational(ONE_RATIONAL, eta);
  const matchedComplement = addRationals([
    multiplyRational(cU, rOverEta),
    divideRational(addRationals([scaleRational(r, 2), scaleRational(medianExceptional, 2)]), oneMinusEta),
    eta,
  ]);

  const onePlusTwoDelta = addRational(ONE_RATIONAL, scaleRational(delta, 2));
  const oneMinusTwoDelta = subtractRational(ONE_RATIONAL, scaleRational(delta, 2));
  const rho = squareRational(divideRational(onePlusTwoDelta, oneMinusTwoDelta));
  const matchingLeft = scaleRational(oneMinusEta, 2);
  const matchingPass = compareRational(matchingLeft, rho) > 0;

  const exitTerms = fixture.jWordLengths.map((length) => addRationals([
    scaleRational(matchedComplement, 2),
    scaleRational(r, 2 * length),
    r,
  ]));
  const generatorExit = addRationals([
    scaleRational(r, 2 * fixture.gammaLazyGeneratorSetSize),
    ...exitTerms,
  ]);

  const wEll = geometricWordCount(fixture.step4GammaJAlphabetSize, ell);
  const wPrevious = geometricWordCount(
    fixture.step4GammaJAlphabetSize,
    Math.max(0, ell - 1),
  );
  const beta = scaleRational(r, 4 * ell - 1);
  const badFraction = addRationals([
    scaleRational(r, 2),
    multiplyRational(rational(wEll * wEll), beta),
    multiplyRational(rational(wPrevious), generatorExit),
  ]);
  const graphConstant = fixture.gammaGraphDegree
    + modules.kunGamma.output.degreeBound
    + fixture.gammaPositiveGeneratorCount;
  const graphEdit = scaleRational(badFraction, graphConstant);
  const cutFraction = divideRational(scaleRational(graphEdit, 2), gammaGamma);
  const cleanupRight = divideRational(
    squareRational(gammaGamma),
    scaleRational(
      addRational(gammaGamma, rational(BigInt(fixture.completedDegreeBound))),
      8,
    ),
  );
  const cleanupPass = compareRational(graphEdit, cleanupRight) <= 0;
  const cutPass = compareRational(cutFraction, rational(1n, 2n)) < 0;
  const preCutComponentSizeLowerBound = BigInt(
    modules.kt.output.distinctGammaBallWitness.length,
  );
  const postCutSize = postCutComponentSizeLowerBound(
    modules.kt.output.distinctGammaBallWitness.length,
    cutFraction,
  );
  const maximumRemovedFromMinimumComponent = postCutSize.maximumRemoved;
  const postCutComponentLowerBound = postCutSize.survivors;
  const postCutSizePass = postCutComponentLowerBound
    >= BigInt(modules.kt.output.minimumComponentSize);
  let finalPortfolioError = null;
  let clusterPass = false;
  if (compareRational(cutFraction, ONE_RATIONAL) < 0) {
    finalPortfolioError = divideRational(
      addRational(badFraction, scaleRational(cutFraction, 2 * ell)),
      subtractRational(ONE_RATIONAL, cutFraction),
    );
    clusterPass = compareRational(finalPortfolioError, modules.kt.output.tolerance) < 0;
  }

  const conditions = {
    matching: matchingPass,
    cleanup: cleanupPass,
    cutBelowHalf: cutPass,
    clusterMargin: clusterPass,
    postCutComponentSize: postCutSizePass,
  };
  return {
    ok: Object.values(conditions).every(Boolean),
    reason: Object.values(conditions).every(Boolean) ? "all-finite-inequalities-pass" : "finite-inequality-failed",
    parameters: {
      r,
      eta,
      delta,
      ell,
      A,
      cU,
      graphConstant,
      lambdaCleanup,
      minimumKtWordRadius: fixture.minimumKtWordRadius ?? 1,
    },
    derived: {
      variation,
      medianExceptional,
      matchedComplement,
      rho,
      matchingLeft,
      generatorExit,
      formalWordCountAtEll: wEll.toString(),
      badFraction,
      graphEdit,
      cutFraction,
      cleanupRight,
      finalPortfolioError,
      preCutComponentSizeLowerBound: preCutComponentSizeLowerBound.toString(),
      maximumRemovedFromMinimumComponent:
        maximumRemovedFromMinimumComponent.toString(),
      postCutComponentLowerBound: postCutComponentLowerBound.toString(),
    },
    conditions,
  };
}

function compileWithModules({ modules = {}, mode = "theorem", fixture, eta, delta }) {
  const effectiveModules = { ...modules };
  if (mode === "theorem") {
    delete effectiveModules.es;
    if (effectiveModules.kunGamma?.output && fixture) {
      effectiveModules.es = makeExactEsModule(
        effectiveModules.kunGamma.output.requestedEditFraction,
        fixture,
      );
    }
  }
  const validation = Object.fromEntries(
    Object.keys(MODULE_SPECS).map((key) => [
      key,
      validateModuleShape(key, effectiveModules[key], mode, fixture),
    ]),
  );
  const invalid = Object.entries(validation).find(([, result]) => !result.ok);
  if (invalid) {
    return {
      status: "BLOCKED",
      firstUnsatisfiedModule: invalid[0],
      reason: invalid[1].reason,
      validation,
      finiteObstructionEmitted: false,
    };
  }

  const budget = evaluateDownstreamBudget({ modules: effectiveModules, fixture, eta, delta });
  if (!budget.ok) {
    return {
      status: "BLOCKED",
      firstUnsatisfiedModule: "step-1-through-5-budget",
      reason: budget.reason,
      validation,
      budget,
      finiteObstructionEmitted: false,
    };
  }

  const minimumSize = Math.max(
    effectiveModules.kunGamma.output.minimumSize,
    effectiveModules.kunG.output.minimumSize,
    effectiveModules.kt.output.minimumComponentSize,
  );
  if (effectiveModules.kt.output.distinctGammaBallWitness.length < minimumSize) {
    return {
      status: "BLOCKED",
      firstUnsatisfiedModule: "distinct-gamma-ball-size",
      reason: "component-size-witness-too-small",
      validation,
      budget,
      finiteObstructionEmitted: false,
    };
  }

  const formalBall = formalBallDescriptor(
    fixture.step4GammaJAlphabet,
    2 * budget.parameters.ell,
  );
  const explicitPortfolio = testClosure([
    effectiveModules.kunGamma.output.requiredWords,
    effectiveModules.kunG.output.requiredWords,
    effectiveModules.es.output.requiredWords,
    effectiveModules.kt.output.portfolioWords,
    effectiveModules.kt.output.distinctGammaBallWitness,
    fixture.relationWords,
  ]);
  assert.equal(isPrefixClosed(explicitPortfolio), true);
  const formalWordCount = BigInt(formalBall.formalWordCount);
  const exceptionalWordsOutsideBall = explicitPortfolio.filter((word) => (
    !wordBelongsToFormalBall(word, formalBall)
  ));
  const canMaterialize = formalWordCount <= 100000n;
  const materializedFormalBall = canMaterialize
    ? materializeFormalBall(fixture.step4GammaJAlphabet, formalBall.radius)
    : null;
  const materializedFormalRepresentatives = materializedFormalBall
    ? testClosure([exceptionalWordsOutsideBall, materializedFormalBall])
    : null;
  if (materializedFormalRepresentatives) {
    assert.equal(isPrefixClosed(materializedFormalRepresentatives), true);
  }
  const maxWordLength = Math.max(
    maximumWordLength(explicitPortfolio),
    formalBall.radius,
  );
  const compactPortfolio = {
    schema: "oasis.compact-finite-word-representative-family.v2",
    wordModel: "finite-unreduced-formal-token-representatives",
    exceptionalWordsOutsideBall,
    generatedFamilies: [formalBall],
    formalWordRepresentativeCount: (
      formalWordCount + BigInt(exceptionalWordsOutsideBall.length)
    ).toString(),
    prefixClosed: true,
    semanticInterpretation:
      "take the image under the frozen target-group evaluation map and quotient duplicate representatives by exact target-group equality",
  };
  const semanticFiniteSubset = semanticFiniteSubsetDescriptor(compactPortfolio, fixture);
  const primitiveEventLedger = primitiveHammingEventLedger(maxWordLength);
  const wordUnionCoefficient = primitiveEventLedger.totalCoefficient;
  const epsilon = divideRationalByInteger(minRational([
    effectiveModules.kunGamma.output.tolerance,
    effectiveModules.kunG.output.tolerance,
    effectiveModules.es.output.tolerance,
    divideRationalByInteger(effectiveModules.kunGamma.output.requestedEditFraction, wordUnionCoefficient),
  ]), 2);
  const wordUnionBoundAtEpsilon = scaleRational(epsilon, wordUnionCoefficient);
  const reservedHalfOfRequestedScale = divideRationalByInteger(
    effectiveModules.kunGamma.output.requestedEditFraction,
    2,
  );
  assert.equal(
    compareRational(wordUnionBoundAtEpsilon, reservedHalfOfRequestedScale) <= 0,
    true,
  );
  const wordEventLedger = {
    ...primitiveEventLedger,
    requestedPrimitiveEnvelope:
      effectiveModules.kunGamma.output.requestedEditFraction,
    chosenTolerance: epsilon,
    maximumWordUnionBound: wordUnionBoundAtEpsilon,
    reservedWordHalf: reservedHalfOfRequestedScale,
    outerSafetySplit: [
      "C_word*epsilon is at most r/2 for word telescoping and comparison.",
      "The simultaneous epsilon<=sigma_H/2 bounds retain the other half of",
      "each declared normalization and module margin.",
    ].join(" "),
  };

  return {
    status: mode === "synthetic" ? "PASS-SYNTHETIC-COMPILER-CONTROL" : "PASS-THEOREM-MODULES",
    firstUnsatisfiedModule: null,
    reason: "typed modules, size witness, finite inequalities, and exact compact closure all pass",
    validation,
    budget,
    acceptedModules: clone(effectiveModules),
    acceptedModulesDigest: digest(effectiveModules),
    fixtureBinding: {
      fixtureId: fixture.fixtureId,
      fixtureDigest: fixture.fixtureDigest,
      proofInstanceDigest: fixture.proofInstanceDigest,
    },
    finiteObstructionEmitted: mode === "theorem",
    syntheticOnly: mode === "synthetic",
    output: {
      compactFormalRepresentativeFamily: compactPortfolio,
      semanticFiniteSubset,
      materializedFormalRepresentatives,
      finitePortfolioMaterialized: Boolean(materializedFormalRepresentatives),
      finitePortfolioSize: materializedFormalRepresentatives?.length ?? null,
      formalWordPortfolioCardinality: compactPortfolio.formalWordRepresentativeCount,
      finitePortfolioDigest: digest(semanticFiniteSubset),
      prefixClosed: true,
      maximumWordLength: maxWordLength,
      wordEventLedger,
      wordUnionCoefficient,
      epsilon,
      epsilonDecimal: rationalValue(epsilon),
    },
  };
}

function makeExactEsModule(requestedRepairFraction, fixture) {
  if (!isPositiveRational(requestedRepairFraction)) {
    throw new Error("Exact ES normalization needs a positive repair fraction");
  }
  if (!fixture || !validateWordFamily(fixture.normalizationWords)
    || fixture.normalizationWords.length === 0) {
    throw new Error("Exact ES normalization needs its finite relation-word family");
  }
  const spec = moduleSpecWithDigest(MODULE_SPECS.es);
  const output = {
    requestedRepairFraction,
    tolerance: divideRationalByInteger(requestedRepairFraction, 2),
    requiredWords: clone(fixture.normalizationWords),
    exactBound: [
      "d(p(1),id)=d(p(1)^2,p(1))",
      "inverse relabeling costs at most the inverse-law defect plus the identity repair",
      "replacing cycles longer than two by fixed points costs at most d(p(s)^2,id)",
    ],
  };
  const module = {
    schema: MODULE_SCHEMA,
    moduleId: spec.moduleId,
    kind: "built-in-exact-normalization",
    generatorSetId: spec.generatorSetId,
    conventionId: spec.conventionId,
    statementDigest: spec.statementDigest,
    sourceId: spec.sourceId,
    sourceDigest: spec.sourceDigest,
    fixtureId: fixture.fixtureId,
    fixtureDigest: fixture.fixtureDigest,
    proofInstanceDigest: fixture.proofInstanceDigest,
    compilerContractDigest: compilerContractDigest(),
    compilerSourceDigest: sourceFileDigest("./genesis-quantitative-nonsofic-extraction.mjs"),
    verifierId: "exact-cycle-normalization-verifier-v1",
    output,
    totalityCertificate: {
      type: "finite-total-single-scale",
      outputDigest: digest(output),
    },
  };
  module.proofCertificate = {
    digest: digest(moduleProofClaim(module, "exact-permutation-cycle-normalization")),
  };
  return module;
}

function makeSyntheticModule(key, output) {
  const spec = moduleSpecWithDigest(MODULE_SPECS[key]);
  const module = {
    schema: MODULE_SCHEMA,
    moduleId: spec.moduleId,
    kind: "synthetic-calibration",
    generatorSetId: spec.generatorSetId,
    conventionId: spec.conventionId,
    statementDigest: spec.statementDigest,
    sourceId: `synthetic-source:${key}`,
    sourceDigest: digest(`synthetic-source:${key}`),
    verifierId: "synthetic-calibration-verifier-v1",
    output,
    totalityCertificate: {
      type: "finite-total-single-scale",
      outputDigest: digest(output),
    },
  };
  module.proofCertificate = {
    digest: digest(moduleProofClaim(module, "synthetic-calibration-only")),
  };
  return module;
}

function syntheticCalibrationPackage() {
  const r = rational(1n, 10n ** 40n);
  const wordA = [token("a")];
  const wordJ = [token("j")];
  const gammaWitness = [
    [],
    wordA,
    wordJ,
    [token("a"), token("a")],
    [token("a"), token("j")],
  ];
  return {
    modules: {
      kunGamma: makeSyntheticModule("kunGamma", {
        requestedEditFraction: r,
        localityRadius: 2,
        tolerance: rational(1n, 1000n),
        expansion: ONE_RATIONAL,
        degreeBound: 2,
        minimumSize: 4,
        requiredWords: [wordA],
      }),
      kunG: makeSyntheticModule("kunG", {
        requestedEditFraction: r,
        localityRadius: 2,
        tolerance: rational(1n, 2000n),
        expansion: ONE_RATIONAL,
        degreeBound: 2,
        minimumSize: 4,
        requiredWords: [wordA, wordJ],
      }),
      es: makeSyntheticModule("es", {
        requestedRepairFraction: r,
        tolerance: rational(1n, 3000n),
        requiredWords: [wordA, wordJ],
      }),
      kt: makeSyntheticModule("kt", {
        requestedExpansion: rational(1n, 2n),
        tolerance: rational(1n, 10n),
        wordRadius: 2,
        minimumComponentSize: 4,
        portfolioWords: [wordA, wordJ],
        distinctGammaBallWitness: gammaWitness,
      }),
    },
    mode: "synthetic",
    fixture: {
      gammaPositiveGeneratorCount: 1,
      gammaLazyGeneratorSetSize: 2,
      compressorCount: 1,
      contractionLengthSums: [0],
      jWordLengths: [1],
      step1AmbientAlphabetId: "synthetic-gamma-plus-compressor-lazy-2-v1",
      step1AmbientAlphabetSize: 2,
      step1AmbientAlphabet: [token("a"), token("u")],
      step4GammaJAlphabetId: "synthetic-gamma-plus-j-lazy-2-v1",
      step4GammaJAlphabetSize: 2,
      step4GammaJAlphabet: [token("a"), token("j")],
      gammaWitnessAlphabetNames: ["a", "j"],
      gammaGraphDegree: 2,
      completedDegreeBound: 2,
      relationWords: [[token("a"), token("j"), token("a", true), token("j", true)]],
      normalizationWords: [[token("a"), token("a", true)]],
      semanticTargetGroupId: "synthetic-calibration-formal-group",
      semanticEvaluationMapId: "synthetic-formal-word-evaluation-v1",
      semanticEqualityOracleId: "synthetic-formal-word-equality-v1",
      semanticGeneratorBindings: [
        { name: "a", exactLeavittUnitHash: "synthetic:a" },
        { name: "j", exactLeavittUnitHash: "synthetic:j" },
        { name: "u", exactLeavittUnitHash: "synthetic:u" },
      ],
      fixtureId: "synthetic-calibration-fixture-v1",
      fixtureDigest: digest("synthetic-calibration-fixture-v1"),
      proofInstanceDigest: digest("synthetic-calibration-proof-instance-v1"),
      minimumKtWordRadius: 2,
      endpointSafeProductWordLength: 1,
      maximumComparisonWordLength: 4,
    },
    eta: rational(1n, 10n ** 8n),
    delta: rational(1n, 64n),
  };
}

function buildTypedDag(exactWords, kunHorizonSlackAudit) {
  const moduleCompilation = compileWithModules({
    modules: {},
    mode: "theorem",
    fixture: null,
    eta: rational(1n, 1024n),
    delta: rational(1n, 64n),
  });
  const nodes = [
    { id: "exact-proof-instance", dependsOn: [], status: "satisfied-executably" },
    {
      id: "natural-to-special-generator-transfer",
      dependsOn: ["exact-proof-instance"],
      status: "satisfied-executably",
      output: {
        rootCount: exactWords.naturalAmbientRootDictionary.verifiedRootCount,
        maximumWordLength: exactWords.naturalAmbientRootDictionary.maximumFreelyReducedLength,
      },
    },
    {
      id: "special-set-spectral-bound",
      dependsOn: ["natural-to-special-generator-transfer"],
      status: "satisfied-theorem-plus-exact-normalization",
    },
    {
      id: "all-k-boundary-sos-compiler",
      dependsOn: ["special-set-spectral-bound"],
      status: "satisfied-exact-symbolic",
      output: "fixed lambda=kappa_0/2; P_k=C H_k and optional-zeta Q_k identities",
    },
    {
      id: "standard-property-t-sos-certificates",
      dependsOn: ["special-set-spectral-bound", "all-k-boundary-sos-compiler"],
      status: "missing-verified-row-certificates",
      output: "one B_lambda SOS row certificate for each fixed generating set",
    },
    {
      id: "kun-finite-horizon-and-common-slack",
      dependsOn: ["special-set-spectral-bound", "all-k-boundary-sos-compiler"],
      status: "satisfied-exact-bigint-algorithm",
      output: {
        controlPartitionBoundaryScale: kunHorizonSlackAudit.partitionBoundaryScale,
        gammaHorizon: kunHorizonSlackAudit.expectedControlHorizons.gamma,
        ambientSpecialHorizon: kunHorizonSlackAudit.expectedControlHorizons.ambientSpecial,
      },
    },
    {
      id: "bounded-geometric-expansion-guard",
      dependsOn: ["exact-proof-instance"],
      status: "satisfied-fail-closed",
      output: `exact expansion cap ${MAX_EXACT_GEOMETRIC_RADIUS}; larger radii remain symbolic`,
    },
    {
      id: "theorem-scale-symbolic-budget-engine",
      dependsOn: [
        "kun-finite-horizon-and-common-slack",
        "bounded-geometric-expansion-guard",
      ],
      status: "missing-symbolic-monotone-comparison-engine",
      output: "power-circuit/geometric-count and exact dyadic-rational budget comparisons",
    },
    {
      id: "finite-non-lef-endpoint",
      dependsOn: ["exact-proof-instance"],
      status: "satisfied-theorem-plus-exact-chart",
    },
    {
      id: "gamma-times-j-binding",
      dependsOn: ["exact-proof-instance", "finite-non-lef-endpoint"],
      status: "satisfied-theorem-plus-exact-corner-audit",
      output: "orthogonal support corners imply commutation and trivial intersection",
    },
    {
      id: "kun-gamma-module",
      dependsOn: [
        "standard-property-t-sos-certificates",
        "kun-finite-horizon-and-common-slack",
      ],
      status: "missing-verified-module",
    },
    {
      id: "kun-g-module",
      dependsOn: [
        "standard-property-t-sos-certificates",
        "kun-finite-horizon-and-common-slack",
      ],
      status: "missing-verified-module",
    },
    {
      id: "es-normalization-module",
      dependsOn: ["exact-proof-instance"],
      status: "satisfied-parametric-exact-bound",
      output: "built from the requested scale after a Kun module is installed",
    },
    {
      id: "semantic-finite-subset-and-hamming-trace",
      dependsOn: ["exact-proof-instance"],
      status: "satisfied-theorem-plus-exact-schema",
      output: [
        "F is the exact semantic image of the finite representative family;",
        "the padded primitive trace has C_word=8L+8 and stops before graph repair",
      ].join(" "),
    },
    {
      id: "kun-thom-module",
      dependsOn: ["gamma-times-j-binding", "kun-gamma-module"],
      status: "missing-verified-module",
    },
    {
      id: "step-1-through-5-budget",
      dependsOn: [
        "kun-gamma-module",
        "kun-g-module",
        "es-normalization-module",
        "kun-thom-module",
        "theorem-scale-symbolic-budget-engine",
      ],
      status: "blocked-by-dependencies",
    },
    {
      id: "distinct-gamma-ball-size",
      dependsOn: ["kun-thom-module", "step-1-through-5-budget"],
      status: "blocked-by-dependencies",
    },
    {
      id: "finite-test-closure",
      dependsOn: [
        "step-1-through-5-budget",
        "distinct-gamma-ball-size",
        "semantic-finite-subset-and-hamming-trace",
      ],
      status: "blocked-by-dependencies",
    },
    {
      id: "terminal-contradiction",
      dependsOn: ["finite-test-closure", "gamma-times-j-binding", "finite-non-lef-endpoint"],
      status: "blocked-by-dependencies",
    },
  ];
  return {
    nodes,
    edgeCount: nodes.reduce((sum, node) => sum + node.dependsOn.length, 0),
    firstUnsatisfiedNode: "standard-property-t-sos-certificates",
    theoremCompilation: moduleCompilation,
  };
}

function buildGateLedger(typedDag, sosFamilyCompiler, kunHorizonSlackAudit) {
  const gates = [
    {
      id: "exact-proof-instance",
      status: "satisfied-executably",
      output: "EL_3/EL_9 Leavitt units, contractions, and commuting Thompson-V copy",
    },
    {
      id: "natural-to-special-generator-transfer",
      status: "satisfied-executably",
      output: "360 exact words with maximum freely reduced length 36",
    },
    {
      id: "numerical-property-t-input",
      status: "satisfied-theorem-plus-exact-normalization",
      output: "rational lower bounds for both lazy Markov gaps",
    },
    {
      id: "finite-non-lef-endpoint",
      status: "satisfied-theorem-plus-exact-chart",
      output: "155-element Thompson-V chart with safe product-word radius 138",
    },
    {
      id: "es-normalization-bound",
      status: "satisfied-explicit-finite-cycle-repair",
      output: "sigma_ES(r)=r/2 under the frozen normalized-Hamming convention",
    },
    {
      id: "semantic-finite-subset-and-hamming-trace",
      status: "satisfied-theorem-plus-exact-schema",
      output: [
        "F=eval_G(Fhat) through the frozen exact equality oracle;",
        "C_word=8L+8 is the padded pre-repair primitive-event trace",
      ].join(" "),
    },
    {
      id: "one-base-sos-to-kun-family-compiler",
      status: "satisfied-exact-symbolic",
      output: [
        `verified for ${sosFamilyCompiler.resultCount} fixed generating sets`,
        "at lambda=kappa_0/2 with four exact boundary/optional-zeta controls per set",
        "and a conditional common-radius formula independent of zeta",
      ].join(" "),
    },
    {
      id: "standard-property-t-sos-certificates",
      status: "conditional-computable-search-unmaterialized",
      output: null,
      exactGap: [
        "One exact rational finite-propagation SOS for B_lambda=Delta^2-lambda*Delta",
        "for each of the two fixed generating sets, including verified row support radii",
        "with the fixed effective gap lambda=kappa_0/2 independent of K and zeta",
      ].join(" "),
    },
    {
      id: "kun-finite-horizon-and-optional-slack",
      status: "satisfied-exact-bigint-algorithm",
      output: [
        "exact rational constructor for every rational internal partition scale",
        `a_part=1/100 controls: K_Gamma=${kunHorizonSlackAudit.expectedControlHorizons.gamma}`,
        `and K_G=${kunHorizonSlackAudit.expectedControlHorizons.ambientSpecial}`,
        "with zeta=theta/2 in both controls",
      ].join(" "),
    },
    {
      id: "bounded-geometric-expansion-guard",
      status: "satisfied-bounded-fail-closed",
      output: [
        `exact BigInt geometric arithmetic is capped at radius ${MAX_EXACT_GEOMETRIC_RADIUS}`,
        "larger radii retain a symbolic power-sum descriptor but theorem compilation",
        "returns symbolic-count-engine-missing before any expansion loop",
      ].join(" "),
    },
    {
      id: "theorem-scale-symbolic-budget-engine",
      status: "missing-symbolic-monotone-comparison-engine",
      output: null,
      exactGap: [
        "The illustrative Kun horizons are far beyond the exact expansion cap.",
        "A verifier must compare geometric power-sums and dyadic/rational budget",
        "expressions symbolically without materializing their expanded integers.",
      ].join(" "),
    },
    {
      id: "kun-decomposition-modulus",
      status: "conditional-on-earlier-missing-gate",
      output: null,
      exactGap: "A finite defect-to-edit threshold after the locality radius is supplied",
    },
    {
      id: "kun-thom-finite-table-modulus",
      status: "conditional-on-earlier-missing-gate",
      output: null,
      exactGap: "A finite portfolio and tolerance specialized to the 155-element chart",
    },
  ];
  return {
    gates,
    firstUnsatisfiedGate: gates.find((gate) => !gate.status.startsWith("satisfied"))?.id ?? null,
    typedDagFirstUnsatisfiedNode: typedDag.firstUnsatisfiedNode,
    numericalFiniteObstructionEmitted: false,
    reason: "The all-k compiler and exact BigInt horizon/slack constructor are closed. The first missing objects are the two terminating but still unrun standard B_lambda SOS row searches; theorem-scale symbolic budget comparison is a distinct later missing gate.",
  };
}

function buildSymbolicExtractor() {
  return {
    target: "one numerical finite (F, epsilon) obstruction for the fixed OpenAI group",
    conditionalFormalRepresentatives:
      "Fhat*=TestCl_word(K_Gamma(r*) union K_G(r*) union B_T(2 ell) union Pref(R_comparison) union P_KT)",
    conditionalPortfolio:
      "F*=eval_G(Fhat*) with duplicate representatives quotiented by the exact Leavitt equality oracle",
    conditionalTolerance:
      "epsilon*=1/2 min(sigma_Gamma(r*), sigma_G(r*), sigma_ES(r*), r*/C_word(F*))",
    finiteChoices: {
      eta: "bounded configurable dyadic search (default maxEtaExponent=96), or one supplied exact witness",
      delta: "1/64",
      rho: "(33/31)^2",
      lambdaCleanup: "gamma_Gamma/2",
      matchingCondition: "2(1-eta) > (33/31)^2",
      cleanupCondition:
        "C_gr*b_ell(r) <= gamma_Gamma^2/(8*(gamma_Gamma+d_0))",
    },
    semanticContractsNeeded: [
      "One verified rational B_lambda=Delta^2-lambda*Delta SOS at lambda=kappa_0/2 per fixed generating set supplies a finite row-support radius",
      "The exact interval-polynomial compiler turns each fixed-gap base SOS into every Kun boundary certificate P_k through the requested finite horizon",
      "Optional zeta adds only a positive scalar Delta^2 summand and never changes the support radius",
      "A symbolic inequality engine is still needed if a theorem module requests a generated-word radius above the exact BigInt cap",
      "A verified Kun_Gamma(a) module returns a radius, tolerance, expansion, degree, size threshold, and complete word portfolio",
      "A verified Kun_G(a) module returns the analogous data for the exact special generator graph",
      "A verified KT(E_V,lambda) module returns a finite portfolio, word radius, size threshold, and positive tolerance",
      "Each module is locked to a statement digest, generator/convention ID, source digest, and installed proof verifier",
    ],
    currentEvaluation: "blocked-at-two-fixed-gap-standard-property-t-sos-row-materializations",
  };
}

function buildPayload() {
  const exactBundle = buildExactWordAudit();
  const exactWords = exactBundle.publicAudit;
  const spectral = buildSpectralAudit(
    exactWords.naturalAmbientRootDictionary.maximumFreelyReducedLength,
    exactWords.specialGeneratorAlphabet.lazySizeIncludingIdentity,
  );
  const kunHorizonSlackAudit = buildKunHorizonSlackAudit(spectral);
  const sosFamilyCompiler = buildSosFamilyCompilerAudit(spectral);
  const endpoint = buildFiniteEndpointAudit();
  const typedDependencyDag = buildTypedDag(exactWords, kunHorizonSlackAudit);
  const gateLedger = buildGateLedger(
    typedDependencyDag,
    sosFamilyCompiler,
    kunHorizonSlackAudit,
  );
  const syntheticCompilerControl = compileWithModules(syntheticCalibrationPackage());
  const sourceBindings = buildSourceBindings();

  assert.equal(exactWords.specialGeneratorAlphabet.gammaRootCount, 30);
  assert.equal(exactWords.specialGeneratorAlphabet.lazySizeIncludingIdentity, 35);
  assert.equal(kunHorizonSlackAudit.expectedControlHorizons.gamma, "3340787538");
  assert.equal(kunHorizonSlackAudit.expectedControlHorizons.ambientSpecial, "5477748121092");
  assert.equal(gateLedger.firstUnsatisfiedGate, "standard-property-t-sos-certificates");
  assert.equal(gateLedger.numericalFiniteObstructionEmitted, false);
  assert.equal(typedDependencyDag.theoremCompilation.status, "BLOCKED");
  assert.equal(syntheticCompilerControl.status, "PASS-SYNTHETIC-COMPILER-CONTROL");
  assert.equal(syntheticCompilerControl.syntheticOnly, true);
  assert.equal(syntheticCompilerControl.finiteObstructionEmitted, false);

  return {
    schema: RUN_SCHEMA,
    status: "PASS-WITH-HONEST-BLOCKER",
    theoremTarget: {
      group: "G=EL_D(L_F2(1,2))",
      desiredOutput: "one explicit finite (F, epsilon) permutation obstruction",
      outputProduced: false,
    },
    exactWords,
    spectral,
    kunHorizonSlackAudit,
    sosFamilyCompiler,
    finiteNonLefEndpoint: endpoint,
    sourceBindings,
    symbolicExtractor: buildSymbolicExtractor(),
    typedDependencyDag,
    syntheticCompilerControl,
    gateLedger,
    claimLedger: {
      establishedByExecutable: [
        "All 360 natural EL_9 root generators have exact words over the proof's special generator set.",
        "The maximum freely reduced natural-to-special word length is 36.",
        "All 60 contraction conjugates of Gamma generators have Gamma words of length at most 10.",
        "The two required conjugated Thompson-V presentation generators have Gamma-word lengths 300 and 180.",
        "The exact Thompson-V chart has 155 elements and safe product-word length 138.",
        "At the fixed gap lambda=kappa_0/2, exact interval-polynomial identities compile each standard property-(T) SOS into every Kun boundary certificate; k=1..4 and optional-zeta controls pass for both generating sets.",
        "Kun's finite horizon and common Lemma-10 slack are constructed by exact rational/BigInt arithmetic; at a_part=1/100 the safe horizons are K_Gamma=3,340,787,538 and K_G=5,477,748,121,092.",
        "A typed synthetic control traverses the whole compiler, materializes a prefix-closed finite portfolio, checks every rational inequality, and remains explicitly non-theorem evidence.",
      ],
      theoremDerived: [
        "Ershov-Jaikin-Zapirain supplies explicit natural-generator Kazhdan lower bounds.",
        "The exact length-36 dictionary transfers the EL_9 displacement bound to the special generators.",
        "Kun's and Kun-Thom's qualitative theorems establish existence of the required asymptotic modules.",
        "Bleak-Quick, infinite simplicity of V, and finitely-presented-LEF-implies-residually-finite make the exact chart a non-LEF endpoint.",
        "Ozawa's strict-gap sum-of-squares characterization makes each fixed B_lambda row search terminate; the exact polynomial compiler then supplies the whole finite Kun family without changing lambda.",
      ],
      notEstablished: [
        "No verified rational rows or support radius for either standard base SOS are produced.",
        "The exact horizon/slack constructor is executed at the control scale a_part=1/100, but the complete requested defect-to-edit scale ledger is not closed by a verified Kun module.",
        `No symbolic comparison engine is implemented for geometric word-count radii above ${MAX_EXACT_GEOMETRIC_RADIUS}; those modules fail closed instead of expanding huge integers.`,
        "No numerical defect-to-expander-edit modulus is produced.",
        "No numerical finite Kun-Thom tolerance for the 155-element chart is produced.",
        "No finite (F, epsilon) nonsoficity certificate is claimed yet.",
        "No uncomputability claim is made about the missing radius.",
        "No endogenous selector, architectural lower bound, or major-conjecture consequence is claimed.",
      ],
    },
  };
}

function buildCertificate() {
  const payload = buildPayload();
  const payloadDigest = digest(payload);
  const unsigned = {
    schema: CERTIFICATE_SCHEMA,
    payload,
    payloadDigest,
  };
  return {
    ...unsigned,
    certificateDigest: digest(unsigned),
  };
}

export function replayQuantitativeNonsoficExtraction(certificate) {
  try {
    if (!certificate || certificate.schema !== CERTIFICATE_SCHEMA) {
      return { ok: false, reason: "schema-mismatch" };
    }
    if (digest(certificate.payload) !== certificate.payloadDigest) {
      return { ok: false, reason: "payload-digest-mismatch" };
    }
    const unsigned = {
      schema: certificate.schema,
      payload: certificate.payload,
      payloadDigest: certificate.payloadDigest,
    };
    if (digest(unsigned) !== certificate.certificateDigest) {
      return { ok: false, reason: "certificate-digest-mismatch" };
    }
    const expected = buildCertificate();
    if (canonical(certificate) !== canonical(expected)) {
      return { ok: false, reason: "semantic-mismatch" };
    }
    return { ok: true, reason: "verified" };
  } catch (error) {
    return { ok: false, reason: "replay-error", message: error.message };
  }
}

export function quantitativeModuleSpecifications() {
  const fixture = buildTheoremFixture();
  return clone({
    schema: "oasis.quantitative-proof-module-specifications.v1",
    modules: Object.fromEntries(
      Object.entries(MODULE_SPECS).map(([key, spec]) => [key, moduleSpecWithDigest(spec)]),
    ),
    compilerContractDigest: compilerContractDigest(),
    compilerSourceDigest: sourceFileDigest("./genesis-quantitative-nonsofic-extraction.mjs"),
    fixtureBinding: {
      fixtureId: fixture.fixtureId,
      fixtureDigest: fixture.fixtureDigest,
      proofInstanceDigest: fixture.proofInstanceDigest,
      endpointChartId: fixture.endpointChartId,
      endpointChartDigest: fixture.endpointChartDigest,
      minimumKtWordRadius: fixture.minimumKtWordRadius,
    },
  });
}

function normalizedCompilationOptions(options = {}) {
  const maxEtaExponent = options.maxEtaExponent ?? 96;
  if (!Number.isSafeInteger(maxEtaExponent) || maxEtaExponent < 1 || maxEtaExponent > 4096) {
    throw new Error("maxEtaExponent must be a safe integer in [1,4096]");
  }
  if (options.eta !== undefined && !isPositiveRational(options.eta)) {
    throw new Error("eta must be a positive exact rational");
  }
  if (options.delta !== undefined && !isPositiveRational(options.delta)) {
    throw new Error("delta must be a positive exact rational");
  }
  return clone({
    maxEtaExponent,
    ...(options.eta === undefined ? {} : { eta: options.eta }),
    delta: options.delta ?? rational(1n, 64n),
  });
}

function rawTheoremCompilation(modules = {}, normalizedOptions = normalizedCompilationOptions()) {
  const exactBundle = buildExactWordAudit();
  const endpoint = buildFiniteEndpointAudit();
  const fixture = buildTheoremFixture(exactBundle, endpoint);
  const delta = normalizedOptions.delta;
  const etaCandidates = normalizedOptions.eta
    ? [normalizedOptions.eta]
    : Array.from(
      { length: normalizedOptions.maxEtaExponent },
      (_, index) => rational(1n, 2n ** BigInt(index + 2)),
    );
  let last = null;
  for (const eta of etaCandidates) {
    const result = compileWithModules({
      modules,
      mode: "theorem",
      fixture,
      eta,
      delta,
    });
    last = result;
    if (result.status === "PASS-THEOREM-MODULES") {
      return {
        ...result,
        etaSearch: {
          mode: normalizedOptions.eta ? "supplied-exact-witness" : "bounded-dyadic-search",
          candidatesTried: etaCandidates.indexOf(eta) + 1,
          selectedEta: eta,
          delta,
          exhaustiveForArbitraryModules: Boolean(normalizedOptions.eta),
        },
      };
    }
    if (result.firstUnsatisfiedModule !== "step-1-through-5-budget") break;
  }
  return {
    ...last,
    etaSearch: {
      mode: normalizedOptions.eta ? "supplied-exact-witness" : "bounded-dyadic-search",
      candidatesTried: last?.firstUnsatisfiedModule === "step-1-through-5-budget"
        ? etaCandidates.length
        : 1,
      selectedEta: null,
      delta,
      exhaustiveForArbitraryModules: Boolean(normalizedOptions.eta),
    },
  };
}

function sealCompilationResult(modules, options, result) {
  const fixture = buildTheoremFixture();
  const payload = {
    schema: COMPILATION_CERTIFICATE_SCHEMA,
    inputs: {
      modules: clone(modules ?? {}),
      options: clone(options),
    },
    fixtureBinding: {
      fixtureId: fixture.fixtureId,
      fixtureDigest: fixture.fixtureDigest,
      proofInstanceDigest: fixture.proofInstanceDigest,
    },
    sourceBindings: buildSourceBindings(),
    result: clone(result),
  };
  const payloadDigest = digest(payload);
  const unsigned = {
    schema: COMPILATION_CERTIFICATE_SCHEMA,
    payload,
    payloadDigest,
  };
  return {
    ...unsigned,
    certificateDigest: digest(unsigned),
  };
}

export function compileQuantitativeNonsoficObstruction(modules = {}, options = {}) {
  const normalizedModules = clone(modules ?? {});
  const normalizedOptions = normalizedCompilationOptions(options);
  const result = rawTheoremCompilation(normalizedModules, normalizedOptions);
  return {
    ...result,
    sourceBindings: buildSourceBindings(),
    compilationCertificate: sealCompilationResult(
      normalizedModules,
      normalizedOptions,
      result,
    ),
  };
}

export function replayQuantitativeNonsoficObstruction(value) {
  try {
    const normalized = clone(value);
    const certificate = normalized.compilationCertificate ?? normalized;
    if (!certificate || certificate.schema !== COMPILATION_CERTIFICATE_SCHEMA) {
      return { ok: false, reason: "schema-mismatch" };
    }
    if (digest(certificate.payload) !== certificate.payloadDigest) {
      return { ok: false, reason: "payload-digest-mismatch" };
    }
    const unsigned = {
      schema: certificate.schema,
      payload: certificate.payload,
      payloadDigest: certificate.payloadDigest,
    };
    if (digest(unsigned) !== certificate.certificateDigest) {
      return { ok: false, reason: "certificate-digest-mismatch" };
    }
    const fixture = buildTheoremFixture();
    const expectedBinding = {
      fixtureId: fixture.fixtureId,
      fixtureDigest: fixture.fixtureDigest,
      proofInstanceDigest: fixture.proofInstanceDigest,
    };
    if (canonical(certificate.payload.fixtureBinding) !== canonical(expectedBinding)) {
      return { ok: false, reason: "fixture-mismatch" };
    }
    if (canonical(certificate.payload.sourceBindings) !== canonical(buildSourceBindings())) {
      return { ok: false, reason: "source-mismatch" };
    }
    const rebuilt = rawTheoremCompilation(
      certificate.payload.inputs.modules,
      normalizedCompilationOptions(certificate.payload.inputs.options),
    );
    if (canonical(rebuilt) !== canonical(certificate.payload.result)) {
      return { ok: false, reason: "semantic-mismatch" };
    }
    if (normalized.compilationCertificate) {
      const outerResult = clone(normalized);
      delete outerResult.compilationCertificate;
      delete outerResult.sourceBindings;
      if (canonical(outerResult) !== canonical(rebuilt)) {
        return { ok: false, reason: "outer-result-mismatch" };
      }
    }
    return { ok: true, reason: "verified" };
  } catch (error) {
    return { ok: false, reason: "replay-error", message: error.message };
  }
}

function rehash(certificate) {
  certificate.payloadDigest = digest(certificate.payload);
  certificate.certificateDigest = digest({
    schema: certificate.schema,
    payload: certificate.payload,
    payloadDigest: certificate.payloadDigest,
  });
  return certificate;
}

function runTamperAudit(certificate) {
  const mutations = [
    (item) => { item.payload.status = "PASS"; },
    (item) => { item.payload.theoremTarget.outputProduced = true; },
    (item) => { item.payload.gateLedger.numericalFiniteObstructionEmitted = true; },
    (item) => { item.payload.gateLedger.firstUnsatisfiedGate = null; },
    (item) => { item.payload.gateLedger.gates[4].status = "satisfied"; },
    (item) => { item.payload.exactWords.naturalAmbientRootDictionary.verifiedRootCount = 359; },
    (item) => { item.payload.exactWords.naturalAmbientRootDictionary.maximumFreelyReducedLength = 35; },
    (item) => { item.payload.exactWords.contractionConjugateDictionary.maximumGammaWordLength = 9; },
    (item) => { item.payload.exactWords.conjugatedThompsonVGenerators[0].gammaWordLength = 299; },
    (item) => { item.payload.spectral.ambientSpecial.exactNaturalToSpecialWordBound = 1; },
    (item) => { item.payload.finiteNonLefEndpoint.finiteSetSize = 154; },
    (item) => { item.payload.finiteNonLefEndpoint.safeProductWordLength = 137; },
    (item) => { item.payload.claimLedger.notEstablished = []; },
    (item) => { item.payload.symbolicExtractor.currentEvaluation = "numerical"; },
    (item) => { item.payload.sourceBindings.executableDependencies["../src/group-oracle.mjs"] = "0".repeat(64); },
    (item) => { item.payload.typedDependencyDag.nodes[5].status = "satisfied"; },
    (item) => { item.payload.syntheticCompilerControl.finiteObstructionEmitted = true; },
    (item) => { item.payload.syntheticCompilerControl.output.wordUnionCoefficient = 1; },
    (item) => { item.payload.syntheticCompilerControl.output.prefixClosed = false; },
    (item) => { item.payload.spectral.ambientSpecial.absoluteMarkovContractionGap.numerator = "1"; },
    (item) => { item.payload.kunHorizonSlackAudit.results[0].horizon = "3340787537"; },
    (item) => {
      item.payload.kunHorizonSlackAudit.results[1].commonLemma10Slack.numerator = "1";
    },
    (item) => { item.payload.typedDependencyDag.nodes[0].dependsOn = [undefined]; },
    (item) => { item.payload.finiteNonLefEndpoint.finiteSetSize = Number.NaN; },
  ];
  let rejected = 0;
  for (const mutate of mutations) {
    try {
      const item = clone(certificate);
      mutate(item);
      rehash(item);
      if (!replayQuantitativeNonsoficExtraction(item).ok) rejected += 1;
    } catch {
      rejected += 1;
    }
  }
  return { attempted: mutations.length, rejected, allRejected: rejected === mutations.length };
}

function refreshSyntheticProof(module) {
  module.totalityCertificate = {
    type: "finite-total-single-scale",
    outputDigest: digest(module.output),
  };
  module.proofCertificate = {
    digest: digest(moduleProofClaim(module, "synthetic-calibration-only")),
  };
}

function runHostileModuleAudit() {
  const attacks = [
    (item) => { item.modules.kunGamma.kind = "qualitative-existence"; },
    (item) => { item.modules.kunGamma.kind = "metastable-only"; },
    (item) => { item.modules.kunG.generatorSetId = "ambient-natural-lazy-361-wrong"; },
    (item) => { item.modules.kunG.conventionId = "unnormalized-adjacency-wrong"; },
    (item) => { item.modules.kt.statementDigest = digest("different theorem"); },
    (item) => { delete item.modules.kunGamma.proofCertificate; },
    (item) => { delete item.modules.kunGamma.totalityCertificate; },
    (item) => {
      item.modules.kunGamma.output.tolerance = ZERO_RATIONAL;
      refreshSyntheticProof(item.modules.kunGamma);
    },
    (item) => {
      item.modules.kunG.output.requestedEditFraction = rational(1n, 10n ** 30n);
      refreshSyntheticProof(item.modules.kunG);
    },
    (item) => {
      item.modules.kt.output.minimumComponentSize = 6;
      refreshSyntheticProof(item.modules.kt);
    },
    (item) => { item.eta = rational(3n, 4n); },
    (item) => {
      const large = rational(1n, 10n);
      item.modules.kunGamma.output.requestedEditFraction = large;
      item.modules.kunG.output.requestedEditFraction = large;
      item.modules.es.output.requestedRepairFraction = large;
      refreshSyntheticProof(item.modules.kunGamma);
      refreshSyntheticProof(item.modules.kunG);
      refreshSyntheticProof(item.modules.es);
    },
    (item) => {
      item.modules.kt.output.requestedExpansion = rational(2n);
      refreshSyntheticProof(item.modules.kt);
    },
    (item) => {
      item.modules.kt.output.requestedExpansion = rational(1n, 4n);
      refreshSyntheticProof(item.modules.kt);
    },
    (item) => {
      item.modules.kt.output.portfolioWords = [];
      refreshSyntheticProof(item.modules.kt);
    },
    (item) => {
      item.modules.kt.output.wordRadius = MAX_EXACT_GEOMETRIC_RADIUS;
      refreshSyntheticProof(item.modules.kt);
    },
    (item) => {
      item.modules.es.output.requiredWords = [];
      refreshSyntheticProof(item.modules.es);
    },
  ];
  let rejected = 0;
  const reasons = [];
  for (const attack of attacks) {
    const item = clone(syntheticCalibrationPackage());
    attack(item);
    const result = compileWithModules(item);
    if (result.status === "BLOCKED" && !result.finiteObstructionEmitted) rejected += 1;
    reasons.push(result.reason);
  }
  return {
    attempted: attacks.length,
    rejected,
    allRejected: rejected === attacks.length,
    reasons,
    hostileClasses: [
      "qualitative-for-modulus substitution",
      "metastability-for-pointwise-modulus substitution",
      "wrong generator set or graph convention",
      "statement/proof evidence drift",
      "zero tolerance or inconsistent scale",
      "insufficient component-size witness",
      "failed matching, cleanup, or cluster inequalities",
      "missing finite portfolio or normalization words",
      "theorem-scale geometric count without a symbolic comparison engine",
    ],
  };
}

function rehashCompilationCertificate(certificate) {
  certificate.payloadDigest = digest(certificate.payload);
  certificate.certificateDigest = digest({
    schema: certificate.schema,
    payload: certificate.payload,
    payloadDigest: certificate.payloadDigest,
  });
  return certificate;
}

function publicCompilationResultOnly(compilation) {
  const result = clone(compilation);
  delete result.compilationCertificate;
  delete result.sourceBindings;
  return result;
}

function runCompilationReplayAudit() {
  const sparse = [];
  sparse.length = 1;
  const accessor = {};
  Object.defineProperty(accessor, "x", { enumerable: true, get: () => 1 });
  const hidden = {};
  Object.defineProperty(hidden, "x", { enumerable: false, value: 1 });
  const cyclic = {};
  cyclic.self = cyclic;
  const invalidJsonValues = [
    [undefined],
    sparse,
    { x: Number.NaN },
    { x: Number.POSITIVE_INFINITY },
    { x: -0 },
    accessor,
    hidden,
    cyclic,
  ];
  let strictJsonRejected = 0;
  for (const value of invalidJsonValues) {
    try {
      digest(value);
    } catch {
      strictJsonRejected += 1;
    }
  }
  assert.equal(strictJsonRejected, invalidJsonValues.length);
  assert.equal(digest({ b: 2, a: 1 }), digest({ a: 1, b: 2 }));
  const quarter = rational(1n, 4n);
  const fourAtQuarter = postCutComponentSizeLowerBound(4, quarter);
  const fiveAtQuarter = postCutComponentSizeLowerBound(5, quarter);
  assert.deepEqual(fourAtQuarter, { maximumRemoved: 1n, survivors: 3n });
  assert.deepEqual(fiveAtQuarter, { maximumRemoved: 1n, survivors: 4n });
  const baseline = compileQuantitativeNonsoficObstruction({});
  const replayResult = replayQuantitativeNonsoficObstruction(baseline);
  assert.deepEqual(replayResult, { ok: true, reason: "verified" });

  const suppliedEs = {
    schema: MODULE_SCHEMA,
    moduleId: MODULE_SPECS.es.moduleId,
    kind: "built-in-exact-normalization",
    attackerControlled: true,
  };
  const poisoned = compileQuantitativeNonsoficObstruction({ es: suppliedEs });
  assert.equal(
    canonical(publicCompilationResultOnly(poisoned)),
    canonical(publicCompilationResultOnly(baseline)),
  );
  assert.deepEqual(replayQuantitativeNonsoficObstruction(poisoned), {
    ok: true,
    reason: "verified",
  });
  const syntheticSuccess = compileWithModules(syntheticCalibrationPackage());
  const successSchemaRetainsAcceptedModuleBodies = Boolean(
    syntheticSuccess.acceptedModules
    && syntheticSuccess.acceptedModulesDigest === digest(syntheticSuccess.acceptedModules),
  );
  assert.equal(successSchemaRetainsAcceptedModuleBodies, true);
  assert.equal(
    syntheticSuccess.output.semanticFiniteSubset.quotientByExactTargetGroupEquality,
    true,
  );
  assert.equal(
    syntheticSuccess.output.wordEventLedger.totalCoefficient,
    8 * syntheticSuccess.output.maximumWordLength + 8,
  );
  assert.equal(
    compareRational(
      syntheticSuccess.output.wordEventLedger.maximumWordUnionBound,
      syntheticSuccess.output.wordEventLedger.reservedWordHalf,
    ) <= 0,
    true,
  );
  const largeAlphabetPackage = syntheticCalibrationPackage();
  largeAlphabetPackage.fixture.step4GammaJAlphabet = Array.from(
    { length: 35 },
    (_, index) => token(index === 0 ? "a" : index === 1 ? "j" : `s${index}`),
  );
  largeAlphabetPackage.fixture.step4GammaJAlphabetSize = 35;
  largeAlphabetPackage.fixture.semanticGeneratorBindings = [
    ...largeAlphabetPackage.fixture.step4GammaJAlphabet,
    token("u"),
  ].map((item) => ({
    name: item.name,
    exactLeavittUnitHash: `synthetic:${item.name}`,
  }));
  const largeAlphabetScale = rational(1n, 10n ** 300n);
  largeAlphabetPackage.modules.kunGamma.output.requestedEditFraction = largeAlphabetScale;
  largeAlphabetPackage.modules.kunG.output.requestedEditFraction = largeAlphabetScale;
  largeAlphabetPackage.modules.es.output.requestedRepairFraction = largeAlphabetScale;
  largeAlphabetPackage.eta = rational(1n, 10n ** 30n);
  refreshSyntheticProof(largeAlphabetPackage.modules.kunGamma);
  refreshSyntheticProof(largeAlphabetPackage.modules.kunG);
  refreshSyntheticProof(largeAlphabetPackage.modules.es);
  const largeAlphabetControl = compileWithModules(largeAlphabetPackage);
  assert.equal(
    largeAlphabetControl.status,
    "PASS-SYNTHETIC-COMPILER-CONTROL",
    `${largeAlphabetControl.reason}:${largeAlphabetControl.budget ? rationalValue(largeAlphabetControl.budget.derived.badFraction) : "no-budget"}`,
  );
  assert.equal(largeAlphabetControl.output.finitePortfolioMaterialized, false);
  assert.equal(
    BigInt(largeAlphabetControl.output.formalWordPortfolioCardinality) > 100000n,
    true,
  );
  const theoremFixture = buildTheoremFixture();
  const theoremFormalBall = formalBallDescriptor(
    theoremFixture.step4GammaJAlphabet,
    4 * theoremFixture.minimumKtWordRadius,
  );
  assert.equal(theoremFormalBall.exactFormalWordCountAvailable, true);
  assert.equal(BigInt(theoremFormalBall.formalWordCount) > 100000n, true);
  const symbolicFormalBall = formalBallDescriptor(
    theoremFixture.step4GammaJAlphabet,
    MAX_EXACT_GEOMETRIC_RADIUS + 1,
  );
  assert.equal(symbolicFormalBall.exactFormalWordCountAvailable, false);
  assert.equal(symbolicFormalBall.formalWordCount, null);
  assert.equal(
    symbolicFormalBall.formalWordCountExpression.lastExponent,
    MAX_EXACT_GEOMETRIC_RADIUS + 1,
  );
  let guardedExactExpansion = false;
  try {
    geometricWordCount(35, MAX_EXACT_GEOMETRIC_RADIUS + 1);
  } catch (error) {
    guardedExactExpansion = error.message === "symbolic-count-engine-missing";
  }
  assert.equal(guardedExactExpansion, true);
  const theoremScalePackage = syntheticCalibrationPackage();
  theoremScalePackage.modules.kt.output.wordRadius =
    Math.floor(MAX_EXACT_GEOMETRIC_RADIUS / 4) + 1;
  refreshSyntheticProof(theoremScalePackage.modules.kt);
  const theoremScaleGuard = compileWithModules(theoremScalePackage);
  assert.equal(theoremScaleGuard.status, "BLOCKED");
  assert.equal(theoremScaleGuard.reason, "symbolic-count-engine-missing");
  assert.equal(theoremScaleGuard.finiteObstructionEmitted, false);

  const attacks = [
    (item) => {
      item.compilationCertificate.payload.result.status = "PASS-THEOREM-MODULES";
      rehashCompilationCertificate(item.compilationCertificate);
    },
    (item) => { item.status = "PASS-THEOREM-MODULES"; },
    (item) => {
      item.compilationCertificate.payload.inputs.modules.bad = [undefined];
      rehashCompilationCertificate(item.compilationCertificate);
    },
    (item) => {
      item.compilationCertificate.payload.sourceBindings.executableDependencies[
        "./genesis-quantitative-nonsofic-extraction.mjs"
      ] = "0".repeat(64);
      rehashCompilationCertificate(item.compilationCertificate);
    },
  ];
  let rejected = 0;
  for (const attack of attacks) {
    try {
      const item = clone(baseline);
      attack(item);
      if (!replayQuantitativeNonsoficObstruction(item).ok) rejected += 1;
    } catch {
      rejected += 1;
    }
  }
  return {
    replay: replayResult,
    strictJsonAudit: {
      attempted: invalidJsonValues.length,
      rejected: strictJsonRejected,
      insertionOrderInvariant: true,
    },
    callerSuppliedEsIgnored: true,
    successSchemaRetainsAcceptedModuleBodies,
    postCutArithmeticControl: {
      fourAtQuarter: fourAtQuarter.survivors.toString(),
      fiveAtQuarter: fiveAtQuarter.survivors.toString(),
    },
    largeAlphabetCompactControl: {
      alphabetSize: 35,
      radius: largeAlphabetControl.output.maximumWordLength,
      formalWordPortfolioCardinality:
        largeAlphabetControl.output.formalWordPortfolioCardinality,
      materialized: largeAlphabetControl.output.finitePortfolioMaterialized,
    },
    theoremFormalBallControl: {
      alphabetSize: theoremFormalBall.alphabetSize,
      minimumKtWordRadius: theoremFixture.minimumKtWordRadius,
      generatedBallRadius: theoremFormalBall.radius,
      formalWordCountDigits: theoremFormalBall.formalWordCount.length,
      descriptorDigest: digest(theoremFormalBall),
      materializationRequired: false,
    },
    theoremScaleSymbolicGuard: {
      exactExpansionRadiusLimit: MAX_EXACT_GEOMETRIC_RADIUS,
      requestedWordRadius: theoremScalePackage.modules.kt.output.wordRadius,
      generatedBallRadius: theoremScaleGuard.budget.parameters.generatedFormalBallRadius,
      reason: theoremScaleGuard.reason,
      descriptorRetained: symbolicFormalBall.formalWordCountExpressionDigest,
      exactCountExpanded: false,
    },
    attempted: attacks.length,
    rejected,
    allRejected: rejected === attacks.length,
  };
}

export function runQuantitativeNonsoficExtraction() {
  const certificate = buildCertificate();
  const replay = replayQuantitativeNonsoficExtraction(clone(certificate));
  assert.deepEqual(replay, { ok: true, reason: "verified" });
  const tamperAudit = runTamperAudit(certificate);
  assert.equal(tamperAudit.allRejected, true);
  const hostileModuleAudit = runHostileModuleAudit();
  assert.equal(hostileModuleAudit.allRejected, true);
  const compilationReplayAudit = runCompilationReplayAudit();
  assert.equal(compilationReplayAudit.allRejected, true);

  const second = buildCertificate();
  assert.equal(second.certificateDigest, certificate.certificateDigest);
  assert.equal(second.payloadDigest, certificate.payloadDigest);

  return {
    schema: RUN_SCHEMA,
    status: "PASS-WITH-HONEST-BLOCKER",
    certificate: clone(certificate),
    replay,
    deterministicReplay: true,
    tamperAudit,
    hostileModuleAudit,
    compilationReplayAudit,
  };
}

export const run = runQuantitativeNonsoficExtraction;
export const replay = replayQuantitativeNonsoficExtraction;

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  process.stdout.write(`${JSON.stringify(runQuantitativeNonsoficExtraction(), null, 2)}\n`);
}
