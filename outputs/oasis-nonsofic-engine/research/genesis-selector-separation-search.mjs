import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import { buildGenesisInterchangeTransductionInput } from "./genesis-interchange-square.mjs";

const VARIABLE_NAMES = Object.freeze(["u", "v", "w", "x"]);
const monomialCache = new Map();

function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((key) => (
      JSON.stringify(key) + ":" + canonical(value[key])
    )).join(",") + "}";
  }
  return JSON.stringify(value);
}

function digest(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parity(value) {
  let result = 0;
  let remaining = value;
  while (remaining !== 0) {
    result ^= remaining & 1;
    remaining >>>= 1;
  }
  return result;
}

function highestBit(value) {
  assert(value > 0n);
  let index = -1;
  let remaining = value;
  while (remaining > 0n) {
    remaining >>= 1n;
    index += 1;
  }
  return index;
}

function spanBasis(vectors) {
  const rows = [];
  for (const vector of vectors) {
    let value = BigInt(vector);
    for (const row of rows) {
      if (((value >> BigInt(row.pivot)) & 1n) !== 0n) value ^= row.value;
    }
    if (value === 0n) continue;
    const pivot = highestBit(value);
    for (const row of rows) {
      if (((row.value >> BigInt(pivot)) & 1n) !== 0n) row.value ^= value;
    }
    rows.push({ pivot, value });
    rows.sort((left, right) => right.pivot - left.pivot);
  }
  return rows.map(({ value }) => value);
}

function inSpan(vector, basis) {
  let value = BigInt(vector);
  const rows = spanBasis(basis).map((entry) => ({ pivot: highestBit(entry), value: entry }));
  for (const row of rows) {
    if (((value >> BigInt(row.pivot)) & 1n) !== 0n) value ^= row.value;
  }
  return value === 0n;
}

function subspaceKey(basis) {
  const reduced = spanBasis(basis);
  let values = [0n];
  for (const vector of reduced) values = values.concat(values.map((value) => value ^ vector));
  return values.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((value) => value.toString(16)).join(",");
}

function kernelOfColumns(columns) {
  const pivots = [];
  const kernel = [];
  columns.forEach((column, index) => {
    let image = BigInt(column);
    let source = 1n << BigInt(index);
    for (const row of pivots) {
      if (((image >> BigInt(row.pivot)) & 1n) !== 0n) {
        image ^= row.image;
        source ^= row.source;
      }
    }
    if (image === 0n) {
      kernel.push(source);
    } else {
      pivots.push({ pivot: highestBit(image), image, source });
      pivots.sort((left, right) => right.pivot - left.pivot);
    }
  });
  return spanBasis(kernel);
}

function compositions(total, length) {
  if (length === 1) return [[total]];
  const result = [];
  for (let head = total; head >= 0; head -= 1) {
    for (const tail of compositions(total - head, length - 1)) result.push([head, ...tail]);
  }
  return result;
}

function monomialBasis(rank, degree) {
  const key = String(rank) + ":" + String(degree);
  if (!monomialCache.has(key)) monomialCache.set(key, compositions(degree, rank));
  return monomialCache.get(key);
}

function monomialIndex(rank, degree) {
  return new Map(monomialBasis(rank, degree).map((exponents, index) => [
    exponents.join(","), index,
  ]));
}

function multiplyPolynomials(left, leftDegree, right, rightDegree, rank) {
  const leftBasis = monomialBasis(rank, leftDegree);
  const rightBasis = monomialBasis(rank, rightDegree);
  const targetIndex = monomialIndex(rank, leftDegree + rightDegree);
  let result = 0n;
  for (let i = 0; i < leftBasis.length; i += 1) {
    if (((left >> BigInt(i)) & 1n) === 0n) continue;
    for (let j = 0; j < rightBasis.length; j += 1) {
      if (((right >> BigInt(j)) & 1n) === 0n) continue;
      const product = leftBasis[i].map((entry, variable) => entry + rightBasis[j][variable]);
      result ^= 1n << BigInt(targetIndex.get(product.join(",")));
    }
  }
  return result;
}

function sqOne(polynomial, degree, rank) {
  const sourceBasis = monomialBasis(rank, degree);
  const targetIndex = monomialIndex(rank, degree + 1);
  let result = 0n;
  sourceBasis.forEach((exponents, index) => {
    if (((polynomial >> BigInt(index)) & 1n) === 0n) return;
    exponents.forEach((exponent, variable) => {
      if ((exponent & 1) === 0) return;
      const target = [...exponents];
      target[variable] += 1;
      result ^= 1n << BigInt(targetIndex.get(target.join(",")));
    });
  });
  return result;
}

function twistedDifferential(polynomial, degree, character, rank) {
  return sqOne(polynomial, degree, rank)
    ^ multiplyPolynomials(character, 1, polynomial, degree, rank);
}

function polynomialFromMonomials(rank, degree, monomials) {
  const index = monomialIndex(rank, degree);
  let result = 0n;
  for (const exponents of monomials) {
    const location = index.get(exponents.join(","));
    assert.notEqual(location, undefined);
    result ^= 1n << BigInt(location);
  }
  return result;
}

function polynomialName(polynomial, rank, degree) {
  if (polynomial === 0n) return "0";
  const terms = [];
  monomialBasis(rank, degree).forEach((exponents, index) => {
    if (((polynomial >> BigInt(index)) & 1n) === 0n) return;
    const factors = [];
    exponents.forEach((exponent, variable) => {
      if (exponent === 1) factors.push(VARIABLE_NAMES[variable]);
      if (exponent > 1) factors.push(VARIABLE_NAMES[variable] + "^" + String(exponent));
    });
    terms.push(factors.join(""));
  });
  return terms.join("+");
}

function characterValue(character, q) {
  return parity(Number(character) & q);
}

function evaluatePolynomial(polynomial, rank, degree, q) {
  let result = 0;
  monomialBasis(rank, degree).forEach((exponents, index) => {
    if (((polynomial >> BigInt(index)) & 1n) === 0n) return;
    let term = 1;
    for (let variable = 0; variable < rank; variable += 1) {
      if (exponents[variable] > 0 && ((q >> variable) & 1) === 0) term = 0;
    }
    result ^= term;
  });
  return result;
}

function commutatorRows(cocycleClass, rank) {
  const degreeTwoIndex = monomialIndex(rank, 2);
  return Array.from({ length: rank }, (_, left) => {
    let row = 0n;
    for (let right = 0; right < rank; right += 1) {
      if (left === right) continue;
      const exponents = Array(rank).fill(0);
      exponents[left] += 1;
      exponents[right] += 1;
      const coefficient = (cocycleClass >> BigInt(degreeTwoIndex.get(exponents.join(",")))) & 1n;
      if (coefficient !== 0n) row |= 1n << BigInt(right);
    }
    return row;
  });
}

function inertRadical(cocycleClass, character, rank) {
  const rows = commutatorRows(cocycleClass, rank);
  const elements = [];
  for (let q = 0; q < (1 << rank); q += 1) {
    if (characterValue(character, q) !== 0) continue;
    let commutatorCharacter = 0n;
    for (let variable = 0; variable < rank; variable += 1) {
      if (((q >> variable) & 1) !== 0) commutatorCharacter ^= rows[variable];
    }
    if (commutatorCharacter !== 0n) continue;
    if (evaluatePolynomial(cocycleClass, rank, 2, q) !== 0) continue;
    elements.push(q);
  }
  for (const left of elements) for (const right of elements) assert(elements.includes(left ^ right));
  assert.equal(elements.length & (elements.length - 1), 0);
  return {
    elements,
    dimension: Math.log2(elements.length),
  };
}

function analyzeMarkedFixture(rank, character, cocycleClass) {
  const degreeOneDimension = monomialBasis(rank, 1).length;
  const degreeTwoDimension = monomialBasis(rank, 2).length;
  const dOneColumns = Array.from({ length: degreeOneDimension }, (_, index) => (
    twistedDifferential(1n << BigInt(index), 1, character, rank)
  ));
  const dTwoColumns = Array.from({ length: degreeTwoDimension }, (_, index) => (
    twistedDifferential(1n << BigInt(index), 2, character, rank)
  ));
  const persistentBasis = kernelOfColumns(dTwoColumns);
  const incomingBasis = spanBasis(dOneColumns);
  assert(incomingBasis.every((value) => inSpan(value, persistentBasis)));

  const commutatorImage = spanBasis(commutatorRows(cocycleClass, rank));
  const holonomyBasis = spanBasis(commutatorImage.map((characterClass) => (
    twistedDifferential(characterClass, 1, character, rank)
  )));
  assert(holonomyBasis.every((value) => inSpan(value, persistentBasis)));
  const closed = twistedDifferential(cocycleClass, 2, character, rank) === 0n;
  const radical = inertRadical(cocycleClass, character, rank);
  return {
    rank,
    character,
    cocycleClass,
    closed,
    persistentBasis,
    incomingBasis,
    commutatorImage,
    holonomyBasis,
    persistentDimension: persistentBasis.length,
    incomingDimension: incomingBasis.length,
    twistedH2Dimension: persistentBasis.length - incomingBasis.length,
    commutatorImageDimension: commutatorImage.length,
    holonomyDimension: holonomyBasis.length,
    strict: closed && holonomyBasis.length > 0 && holonomyBasis.length < persistentBasis.length,
    inertRadical: radical,
    irreducibleFixture: radical.dimension === 0,
  };
}

function fixtureSummary(fixture) {
  return {
    rank: fixture.rank,
    character: polynomialName(fixture.character, fixture.rank, 1),
    cocycleClass: polynomialName(fixture.cocycleClass, fixture.rank, 2),
    closed: fixture.closed,
    persistentBasis: fixture.persistentBasis.map((value) => polynomialName(value, fixture.rank, 2)),
    persistentDimension: fixture.persistentDimension,
    incomingBasis: fixture.incomingBasis.map((value) => polynomialName(value, fixture.rank, 2)),
    twistedH2Dimension: fixture.twistedH2Dimension,
    commutatorImage: fixture.commutatorImage.map((value) => polynomialName(value, fixture.rank, 1)),
    holonomyBasis: fixture.holonomyBasis.map((value) => polynomialName(value, fixture.rank, 2)),
    holonomyDimension: fixture.holonomyDimension,
    strict: fixture.strict,
    inertRadical: {
      elements: fixture.inertRadical.elements.map((q) => q.toString(2).padStart(fixture.rank, "0")),
      dimension: fixture.inertRadical.dimension,
    },
    irreducibleFixture: fixture.irreducibleFixture,
  };
}

function enumerateElementaryCensus() {
  const expectedStrict = { 2: 0, 3: 21, 4: 105 };
  const records = [];
  for (let rank = 2; rank <= 4; rank += 1) {
    const degreeTwoDimension = monomialBasis(rank, 2).length;
    let examined = 0;
    let liftable = 0;
    let strict = 0;
    let irreducibleStrict = 0;
    const strictShapeCounts = new Map();
    for (let characterMask = 1; characterMask < (1 << rank); characterMask += 1) {
      const character = BigInt(characterMask);
      for (let cocycleMask = 0; cocycleMask < (1 << degreeTwoDimension); cocycleMask += 1) {
        examined += 1;
        const fixture = analyzeMarkedFixture(rank, character, BigInt(cocycleMask));
        assert.equal(fixture.twistedH2Dimension, 0);
        if (!fixture.closed) continue;
        liftable += 1;
        if (!fixture.strict) continue;
        strict += 1;
        if (fixture.irreducibleFixture) irreducibleStrict += 1;
        const shape = String(fixture.persistentDimension) + "/"
          + String(fixture.holonomyDimension) + "/"
          + String(fixture.inertRadical.dimension);
        strictShapeCounts.set(shape, (strictShapeCounts.get(shape) ?? 0) + 1);
      }
    }
    assert.equal(strict, expectedStrict[rank]);
    assert.equal(irreducibleStrict, 0);
    records.push({
      rank,
      markedTriplesExamined: examined,
      liftableMarkedTriples: liftable,
      strictProperRealizationFixtures: strict,
      strictShapeCounts: Object.fromEntries([...strictShapeCounts.entries()].sort()),
      irreducibleStrictFixtures: irreducibleStrict,
      twistedDegreeTwoComplexExactForEveryNonzeroCharacter: true,
    });
  }
  return records;
}

function identityPermutation(size) {
  return Array.from({ length: size }, (_, index) => index);
}

function compose(left, right) {
  return right.map((image) => left[image]);
}

function inversePermutation(permutation) {
  const inverse = Array(permutation.length);
  permutation.forEach((image, index) => { inverse[image] = index; });
  return inverse;
}

function permutationEqual(left, right) {
  return left.every((image, index) => image === right[index]);
}

function generatedPermutationGroup(generators) {
  const identity = identityPermutation(generators[0].length);
  const found = new Map([[identity.join(","), identity]]);
  const queue = [identity];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const generator of generators) {
      const product = compose(generator, current);
      const key = product.join(",");
      if (!found.has(key)) {
        found.set(key, product);
        queue.push(product);
      }
    }
  }
  return [...found.values()];
}

function centralCommutator(left, right) {
  return compose(left, compose(right, compose(inversePermutation(left), inversePermutation(right))));
}

function coordinateKey(coordinate) {
  return String(coordinate.x) + String(coordinate.y) + String(coordinate.z);
}

function quotientBits(q) {
  return { u: q & 1, v: (q >> 1) & 1 };
}

function deriveConcreteSection(group, chart, center) {
  const origin = chart.findIndex((coordinate) => coordinateKey(coordinate) === "000");
  assert(origin >= 0);
  return [0, 1, 2, 3].map((q) => {
    const target = quotientBits(q);
    const candidates = group.filter((element) => {
      const image = chart[element[origin]];
      return image.x === target.u && image.y === target.v && image.z === 0;
    });
    assert.equal(candidates.length, 1);
    return candidates[0];
  });
}

function concreteFactorSet(section, center) {
  return [0, 1, 2, 3].map((left) => [0, 1, 2, 3].map((right) => {
    const product = compose(section[right], section[left]);
    const target = section[left ^ right];
    if (permutationEqual(product, target)) return 0;
    assert(permutationEqual(product, compose(center, target)));
    return 1;
  }));
}

function concreteInnerCharacter(section, center, conjugatorIndex) {
  const conjugator = section[conjugatorIndex];
  return [0, 1, 2, 3].map((q) => {
    const conjugated = compose(conjugator, compose(section[q], inversePermutation(conjugator)));
    if (permutationEqual(conjugated, section[q])) return 0;
    assert(permutationEqual(conjugated, compose(center, section[q])));
    return 1;
  });
}

function bindActualD8Source() {
  const input = buildGenesisInterchangeTransductionInput();
  assert.equal(input.schema, "oasis.genesis-interchange-transduction-input.v1");
  assert.deepEqual(input.labels, ["a", "b"]);
  for (const chartName of ["OP", "PO"]) {
    const chart = input.charts[chartName];
    assert.equal(chart.coordinates.length, 8);
    assert.equal(new Set(chart.coordinates.map(coordinateKey)).size, 8);
    for (const label of input.labels) {
      assert.equal(chart.actions[label].length, 8);
      assert.equal(new Set(chart.actions[label]).size, 8);
    }
  }
  assert.equal(input.coherentComparisonsOPtoPO.length, 2);
  assert(input.coherentComparisonsOPtoPO.every((comparison) => (
    comparison.length === 8 && new Set(comparison).size === 8
  )));
  const op = input.charts.OP;
  const group = generatedPermutationGroup([op.actions.a, op.actions.b]);
  assert.equal(group.length, 8);
  const center = centralCommutator(op.actions.a, op.actions.b);
  assert(!permutationEqual(center, identityPermutation(8)));
  assert(permutationEqual(compose(center, center), identityPermutation(8)));
  assert(group.every((element) => permutationEqual(compose(element, center), compose(center, element))));
  const section = deriveConcreteSection(group, op.coordinates, center);
  const factor = concreteFactorSet(section, center);
  for (let left = 0; left < 4; left += 1) {
    for (let right = 0; right < 4; right += 1) {
      assert.equal(factor[left][right], quotientBits(left).u & quotientBits(right).v);
    }
  }
  const loops = [0, 1, 2, 3].map((q) => concreteInnerCharacter(section, center, q));
  assert.deepEqual(loops[1], [0, 0, 1, 1]);
  assert.deepEqual(loops[2], [0, 1, 0, 1]);
  assert.deepEqual(loops[3], [0, 1, 1, 0]);
  const loopMasks = loops.map((loop) => {
    const mask = loop[1] | (loop[2] << 1);
    for (let q = 0; q < 4; q += 1) assert.equal(loop[q], characterValue(BigInt(mask), q));
    return mask;
  });
  assert.deepEqual(loopMasks, [0, 2, 1, 3]);
  return {
    schema: input.schema,
    completeTransductionInputDigest: digest(input),
    groupOrder: group.length,
    centerOrder: 2,
    quotient: "(C2)^2=<u,v>",
    derivedFactorClass: "uv",
    opActionDigests: {
      a: digest(op.actions.a),
      b: digest(op.actions.b),
    },
    opChartDigest: digest(op.coordinates),
    factorTableDigest: digest(factor),
    concreteInnerLoopCharacters: ["0", "v", "u", "u+v"],
    concreteInnerLoopMasks: loopMasks,
    derivedDirectlyFromConcretePermutationInstance: true,
    notReconstructedFromAbstractD8Presentation: true,
  };
}

function matrixRank(matrix) {
  return spanBasis(matrix.map((row) => (
    row.reduce((mask, entry, column) => mask | (BigInt(entry) << BigInt(column)), 0n)
  ))).length;
}

function invertibleBinaryMatrices(rank) {
  const result = [];
  const entryCount = rank * rank;
  for (let mask = 0; mask < (1 << entryCount); mask += 1) {
    const matrix = Array.from({ length: rank }, (_, row) => (
      Array.from({ length: rank }, (_, column) => (mask >> (row * rank + column)) & 1)
    ));
    if (matrixRank(matrix) === rank) result.push(matrix);
  }
  return result;
}

function transformPolynomial(polynomial, degree, rank, matrix) {
  const linearForms = matrix.map((row) => row.reduce((mask, entry, column) => (
    entry === 0 ? mask : mask | (1n << BigInt(column))
  ), 0n));
  let transformed = 0n;
  monomialBasis(rank, degree).forEach((exponents, index) => {
    if (((polynomial >> BigInt(index)) & 1n) === 0n) return;
    let term = 1n;
    let termDegree = 0;
    exponents.forEach((exponent, variable) => {
      for (let copy = 0; copy < exponent; copy += 1) {
        term = multiplyPolynomials(term, termDegree, linearForms[variable], 1, rank);
        termDegree += 1;
      }
    });
    assert.equal(termDegree, degree);
    transformed ^= term;
  });
  return transformed;
}

function auditGL3Covariance(baseFixture) {
  const matrices = invertibleBinaryMatrices(3);
  assert.equal(matrices.length, 168);
  for (const matrix of matrices) {
    const character = transformPolynomial(baseFixture.character, 1, 3, matrix);
    const cocycleClass = transformPolynomial(baseFixture.cocycleClass, 2, 3, matrix);
    const transformed = analyzeMarkedFixture(3, character, cocycleClass);
    assert(transformed.closed);
    assert(transformed.strict);
    assert.equal(transformed.persistentDimension, baseFixture.persistentDimension);
    assert.equal(transformed.holonomyDimension, baseFixture.holonomyDimension);
    assert.equal(transformed.inertRadical.dimension, baseFixture.inertRadical.dimension);
    assert.equal(
      subspaceKey(transformed.persistentBasis),
      subspaceKey(baseFixture.persistentBasis.map((value) => transformPolynomial(value, 2, 3, matrix))),
    );
    assert.equal(
      subspaceKey(transformed.holonomyBasis),
      subspaceKey(baseFixture.holonomyBasis.map((value) => transformPolynomial(value, 2, 3, matrix))),
    );
  }
  return {
    group: "GL(3,2)",
    basisChangesChecked: matrices.length,
    characterAndCocycleTransported: true,
    persistentSubspaceCovariant: true,
    concreteHolonomySubspaceCovariant: true,
    inertRadicalDimensionInvariant: true,
  };
}

function mod(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

function d8Element(i, j) {
  return mod(i, 4) + 4 * mod(j, 2);
}

function d8Coordinates(element) {
  return { i: element & 3, j: (element >> 2) & 1 };
}

function d8Multiply(left, right) {
  const g = d8Coordinates(left);
  const h = d8Coordinates(right);
  return d8Element(g.i + (g.j === 0 ? h.i : -h.i), g.j + h.j);
}

function d8Inverse(element) {
  for (let candidate = 0; candidate < 8; candidate += 1) {
    if (d8Multiply(element, candidate) === 0 && d8Multiply(candidate, element) === 0) return candidate;
  }
  throw new Error("D8 inverse not found");
}

function normalizedTupleIndex(tuple) {
  if (tuple.some((entry) => entry === 0)) return -1;
  return tuple.reduce((index, entry) => index * 7 + (entry - 1), 0);
}

function normalizedCochainValue(vector, tuple) {
  const index = normalizedTupleIndex(tuple);
  if (index < 0) return 0;
  return Number((vector >> BigInt(index)) & 1n);
}

function normalizedTuples(degree) {
  let tuples = [[]];
  for (let position = 0; position < degree; position += 1) {
    tuples = tuples.flatMap((prefix) => Array.from({ length: 7 }, (_, offset) => [
      ...prefix, offset + 1,
    ]));
  }
  return tuples;
}

function trivialCoboundaryColumns(degree) {
  const sourceTuples = normalizedTuples(degree);
  const targetTuples = normalizedTuples(degree + 1);
  return sourceTuples.map((sourceTuple) => {
    const sourceIndex = normalizedTupleIndex(sourceTuple);
    let result = 0n;
    targetTuples.forEach((tuple, targetIndex) => {
      const terms = [tuple.slice(1), tuple.slice(0, -1)];
      for (let position = 0; position < degree; position += 1) {
        terms.push([
          ...tuple.slice(0, position),
          d8Multiply(tuple[position], tuple[position + 1]),
          ...tuple.slice(position + 2),
        ]);
      }
      let value = 0;
      for (const term of terms) {
        if (normalizedTupleIndex(term) === sourceIndex) value ^= 1;
      }
      if (value !== 0) result |= 1n << BigInt(targetIndex);
    });
    return result;
  });
}

function applyLinearMap(vector, columns) {
  let result = 0n;
  columns.forEach((column, index) => {
    if (((vector >> BigInt(index)) & 1n) !== 0n) result ^= column;
  });
  return result;
}

function trivialCoboundaryVector(vector, degree) {
  let result = 0n;
  const targets = normalizedTuples(degree + 1);
  targets.forEach((tuple, targetIndex) => {
    let value = normalizedCochainValue(vector, tuple.slice(1))
      ^ normalizedCochainValue(vector, tuple.slice(0, -1));
    for (let position = 0; position < degree; position += 1) {
      value ^= normalizedCochainValue(vector, [
        ...tuple.slice(0, position),
        d8Multiply(tuple[position], tuple[position + 1]),
        ...tuple.slice(position + 2),
      ]);
    }
    if (value !== 0) result |= 1n << BigInt(targetIndex);
  });
  return result;
}

function twistedBocksteinOfBinaryCocycle(vector, degree) {
  let result = 0n;
  let equationsChecked = 0;
  let maximumAbsoluteCoboundary = 0;
  normalizedTuples(degree + 1).forEach((tuple, targetIndex) => {
    const signAction = d8Coordinates(tuple[0]).j === 0 ? 1 : -1;
    let value = signAction * normalizedCochainValue(vector, tuple.slice(1));
    for (let position = 0; position < degree; position += 1) {
      const merged = [
        ...tuple.slice(0, position),
        d8Multiply(tuple[position], tuple[position + 1]),
        ...tuple.slice(position + 2),
      ];
      value += (position & 1) === 0
        ? -normalizedCochainValue(vector, merged)
        : normalizedCochainValue(vector, merged);
    }
    value += ((degree + 1) & 1) === 0
      ? normalizedCochainValue(vector, tuple.slice(0, -1))
      : -normalizedCochainValue(vector, tuple.slice(0, -1));
    assert.equal(mod(value, 2), 0);
    maximumAbsoluteCoboundary = Math.max(maximumAbsoluteCoboundary, Math.abs(value));
    if (mod(value / 2, 2) !== 0) result |= 1n << BigInt(targetIndex);
    equationsChecked += 1;
  });
  return { cochain: result, equationsChecked, maximumAbsoluteCoboundary };
}

function xorSelected(vectors, mask) {
  return vectors.reduce((value, vector, index) => (
    ((mask >> index) & 1) === 0 ? value : value ^ vector
  ), 0n);
}

function quotientCoordinates(vector, quotientBasis, boundaryBasis) {
  const matches = [];
  for (let mask = 0; mask < (1 << quotientBasis.length); mask += 1) {
    if (inSpan(vector ^ xorSelected(quotientBasis, mask), boundaryBasis)) matches.push(mask);
  }
  assert.equal(matches.length, 1);
  return matches[0];
}

function auditTwistedBocksteinMap(domainBasis, degree, targetBoundaries) {
  const basisImages = domainBasis.map((vector) => twistedBocksteinOfBinaryCocycle(vector, degree));
  const combinations = [];
  for (let mask = 0; mask < (1 << domainBasis.length); mask += 1) {
    const input = xorSelected(domainBasis, mask);
    const direct = twistedBocksteinOfBinaryCocycle(input, degree);
    const linearPrediction = xorSelected(basisImages.map(({ cochain }) => cochain), mask);
    assert(inSpan(direct.cochain ^ linearPrediction, targetBoundaries));
    assert.equal(trivialCoboundaryVector(direct.cochain, degree + 1), 0n);
    combinations.push({
      inputMask: mask,
      outputClassZero: inSpan(direct.cochain, targetBoundaries),
      outputDigest: digest(direct.cochain.toString(16)),
      normalizedTuplesChecked: direct.equationsChecked,
      outputCocycleTuplesChecked: 7 ** (degree + 2),
    });
  }
  return {
    basisImages: basisImages.map(({ cochain }) => cochain),
    basisLiftEquationCounts: basisImages.map(({ equationsChecked }) => equationsChecked),
    basisLiftMaximumAbsoluteCoboundaries: basisImages.map(({ maximumAbsoluteCoboundary }) => (
      maximumAbsoluteCoboundary
    )),
    combinations,
  };
}

function cochainFromFunction(degree, fn) {
  let result = 0n;
  normalizedTuples(degree).forEach((tuple, index) => {
    if ((fn(...tuple) & 1) !== 0) result |= 1n << BigInt(index);
  });
  return result;
}

function cupProduct(left, leftDegree, right, rightDegree) {
  return cochainFromFunction(leftDegree + rightDegree, (...tuple) => (
    normalizedCochainValue(left, tuple.slice(0, leftDegree))
      & normalizedCochainValue(right, tuple.slice(leftDegree))
  ));
}

function pullbackTwoCochain(cochain, map) {
  return cochainFromFunction(2, (g, h) => normalizedCochainValue(cochain, [map(g), map(h)]));
}

function signedCarry(left, right) {
  const g = d8Coordinates(left);
  const h = d8Coordinates(right);
  const raw = g.i + (g.j === 0 ? h.i : -h.i);
  const residue = mod(raw, 4);
  return (raw - residue) / 4;
}

function d32Element(i, j) {
  return mod(i, 16) + 16 * mod(j, 2);
}

function d32Coordinates(element) {
  return { i: element & 15, j: (element >> 4) & 1 };
}

function d32Multiply(left, right) {
  const g = d32Coordinates(left);
  const h = d32Coordinates(right);
  return d32Element(g.i + (g.j === 0 ? h.i : -h.i), g.j + h.j);
}

function d32Inverse(element) {
  for (let candidate = 0; candidate < 32; candidate += 1) {
    if (d32Multiply(element, candidate) === 0 && d32Multiply(candidate, element) === 0) {
      return candidate;
    }
  }
  throw new Error("D32 inverse not found");
}

function d32Projection(element) {
  const value = d32Coordinates(element);
  return d8Element(value.i, value.j);
}

function d32Section(element) {
  const value = d8Coordinates(element);
  return d32Element(value.i, value.j);
}

function auditD32GroupAndProjection() {
  let associativityChecks = 0;
  for (let left = 0; left < 32; left += 1) {
    assert.equal(d32Multiply(0, left), left);
    assert.equal(d32Multiply(left, 0), left);
    for (let right = 0; right < 32; right += 1) {
      for (let third = 0; third < 32; third += 1) {
        assert.equal(
          d32Multiply(d32Multiply(left, right), third),
          d32Multiply(left, d32Multiply(right, third)),
        );
        associativityChecks += 1;
      }
    }
  }
  assert.equal(associativityChecks, 32 ** 3);
  let projectionHomomorphismChecks = 0;
  for (let left = 0; left < 32; left += 1) {
    for (let right = 0; right < 32; right += 1) {
      assert.equal(
        d32Projection(d32Multiply(left, right)),
        d8Multiply(d32Projection(left), d32Projection(right)),
      );
      projectionHomomorphismChecks += 1;
    }
  }
  assert.equal(projectionHomomorphismChecks, 32 ** 2);
  const kernel = Array.from({ length: 32 }, (_, element) => element)
    .filter((element) => d32Projection(element) === 0);
  const generatedByR4 = [0, 1, 2, 3].map((power) => d32Element(4 * power, 0));
  assert.deepEqual(kernel, generatedByR4);
  return {
    associativityChecks,
    projectionHomomorphismChecks,
    kernelElements: kernel.map((element) => d32Coordinates(element)),
    exactKernelEqualsCyclicSubgroupGeneratedByR4: true,
  };
}

function d16Element(i, j) {
  return mod(i, 8) + 8 * mod(j, 2);
}

function d16Coordinates(element) {
  return { i: element & 7, j: (element >> 3) & 1 };
}

function d16Multiply(left, right) {
  const g = d16Coordinates(left);
  const h = d16Coordinates(right);
  return d16Element(g.i + (g.j === 0 ? h.i : -h.i), g.j + h.j);
}

function d16Projection(element) {
  const value = d16Coordinates(element);
  return d8Element(value.i, value.j);
}

function d16Section(element) {
  const value = d8Coordinates(element);
  return d16Element(value.i, value.j);
}

function auditD16Reduction() {
  let associativityChecks = 0;
  for (let left = 0; left < 16; left += 1) {
    for (let right = 0; right < 16; right += 1) {
      for (let third = 0; third < 16; third += 1) {
        assert.equal(
          d16Multiply(d16Multiply(left, right), third),
          d16Multiply(left, d16Multiply(right, third)),
        );
        associativityChecks += 1;
      }
    }
  }
  assert.equal(associativityChecks, 16 ** 3);
  let projectionChecks = 0;
  for (let left = 0; left < 16; left += 1) {
    for (let right = 0; right < 16; right += 1) {
      assert.equal(
        d16Projection(d16Multiply(left, right)),
        d8Multiply(d16Projection(left), d16Projection(right)),
      );
      projectionChecks += 1;
    }
  }
  assert.equal(projectionChecks, 16 ** 2);
  const kernel = Array.from({ length: 16 }, (_, element) => element)
    .filter((element) => d16Projection(element) === 0);
  assert.deepEqual(kernel, [d16Element(0, 0), d16Element(4, 0)]);
  let sectionFactorChecks = 0;
  for (let left = 0; left < 8; left += 1) {
    for (let right = 0; right < 8; right += 1) {
      const product = d16Multiply(d16Section(left), d16Section(right));
      const target = d16Section(d8Multiply(left, right));
      const productCoordinates = d16Coordinates(product);
      const targetCoordinates = d16Coordinates(target);
      assert.equal(productCoordinates.j, targetCoordinates.j);
      const kernelCoordinate = mod(productCoordinates.i - targetCoordinates.i, 8) / 4;
      assert.equal(kernelCoordinate, mod(signedCarry(left, right), 2));
      sectionFactorChecks += 1;
    }
  }
  assert.equal(sectionFactorChecks, 64);
  return {
    group: "D16={(i,j):i mod 8,j mod 2}",
    associativityChecks,
    projectionHomomorphismChecks: projectionChecks,
    exactKernel: ["1", "R^4"],
    sectionFactorChecks,
    sectionFactorEqualsSignedCarryModTwo: true,
  };
}

function auditFixedBaseD8Loops(bCochain) {
  const D32Structure = auditD32GroupAndProjection();
  let sectionFactorChecks = 0;
  for (let left = 0; left < 8; left += 1) {
    for (let right = 0; right < 8; right += 1) {
      const product = d32Multiply(d32Section(left), d32Section(right));
      const target = d32Section(d8Multiply(left, right));
      const productCoordinates = d32Coordinates(product);
      const targetCoordinates = d32Coordinates(target);
      assert.equal(productCoordinates.j, targetCoordinates.j);
      const kernelCoordinate = mod(productCoordinates.i - targetCoordinates.i, 16) / 4;
      assert.equal(kernelCoordinate, mod(signedCarry(left, right), 4));
      sectionFactorChecks += 1;
    }
  }
  assert.equal(sectionFactorChecks, 64);

  let kernelActionChecks = 0;
  for (let base = 0; base < 8; base += 1) {
    const lift = d32Section(base);
    const inverse = d32Inverse(lift);
    const sign = d8Coordinates(base).j === 0 ? 1 : -1;
    for (let kernelCoordinate = 0; kernelCoordinate < 4; kernelCoordinate += 1) {
      const kernelElement = d32Element(4 * kernelCoordinate, 0);
      const conjugated = d32Multiply(lift, d32Multiply(kernelElement, inverse));
      assert.deepEqual(
        d32Coordinates(conjugated),
        d32Coordinates(d32Element(4 * sign * kernelCoordinate, 0)),
      );
      kernelActionChecks += 1;
    }
  }
  assert.equal(kernelActionChecks, 32);

  const centralBaseElements = [d8Element(0, 0), d8Element(2, 0)];
  const bValues = Array.from({ length: 8 }, (_, g) => d8Coordinates(g).j);
  const c4Key = (values) => values.join(",");
  const c4Coboundaries = Array.from({ length: 4 }, (_, value) => (
    Array.from({ length: 8 }, (_, g) => {
      const sign = d8Coordinates(g).j === 0 ? 1 : -1;
      return mod(sign * value - value, 4);
    })
  ));
  const distinctC4Coboundaries = [...new Map(c4Coboundaries.map((value) => [c4Key(value), value])).values()];
  assert.equal(distinctC4Coboundaries.length, 2);
  assert.deepEqual(
    new Set(distinctC4Coboundaries.map(c4Key)),
    new Set([
      c4Key(Array(8).fill(0)),
      c4Key(bValues.map((value) => 2 * value)),
    ]),
  );
  const reduceC4Cochain = (values) => {
    let result = 0n;
    for (let g = 1; g < 8; g += 1) {
      if ((values[g] & 1) !== 0) result |= 1n << BigInt(g - 1);
    }
    return result;
  };
  const auditC4Cocycle = (values) => {
    let equations = 0;
    for (let g = 0; g < 8; g += 1) {
      for (let h = 0; h < 8; h += 1) {
        const sign = d8Coordinates(g).j === 0 ? 1 : -1;
        assert.equal(mod(sign * values[h] - values[d8Multiply(g, h)] + values[g], 4), 0);
        equations += 1;
      }
    }
    return equations;
  };
  const c4ClassKey = (values) => distinctC4Coboundaries.map((boundary) => (
    c4Key(values.map((entry, index) => mod(entry + boundary[index], 4)))
  )).sort()[0];
  const verticalConjugators = [];
  for (let conjugator = 0; conjugator < 32; conjugator += 1) {
    if (!centralBaseElements.includes(d32Projection(conjugator))) continue;
    const inverse = d32Inverse(conjugator);
    const discrepancyC4 = Array.from({ length: 8 }, (_, g) => {
      const lifted = d32Section(g);
      const conjugated = d32Multiply(conjugator, d32Multiply(lifted, inverse));
      assert.equal(d32Projection(conjugated), g);
      const target = d32Coordinates(d32Section(g));
      const image = d32Coordinates(conjugated);
      assert.equal(image.j, target.j);
      const difference = mod(image.i - target.i, 16);
      assert.equal(difference % 4, 0);
      return difference / 4;
    });
    const cocycleEquationChecks = auditC4Cocycle(discrepancyC4);
    assert.equal(cocycleEquationChecks, 64);
    const discrepancyModTwo = reduceC4Cochain(discrepancyC4);
    assert(
      subspaceKey([discrepancyModTwo]) === subspaceKey([])
      || subspaceKey([discrepancyModTwo]) === subspaceKey([bCochain]),
    );
    verticalConjugators.push({
      element: d32Coordinates(conjugator),
      base: d8Coordinates(d32Projection(conjugator)),
      discrepancyC4,
      discrepancyC4Label: ["0", "b", "2b", "3b"].find((_, coefficient) => (
        c4Key(discrepancyC4) === c4Key(bValues.map((value) => coefficient * value))
      )),
      discrepancyClassModuloC4Coboundary: c4ClassKey(discrepancyC4),
      discrepancyModTwo: discrepancyModTwo === 0n ? "0" : "b",
      twistedC4CocycleEquationsChecked: cocycleEquationChecks,
    });
  }
  assert.equal(verticalConjugators.length, 8);
  assert(verticalConjugators.every(({ discrepancyC4Label }) => discrepancyC4Label !== undefined));
  assert.deepEqual(
    new Set(verticalConjugators.map(({ discrepancyC4Label }) => discrepancyC4Label)),
    new Set(["0", "b", "2b", "3b"]),
  );
  const discrepancyClasses = new Set(verticalConjugators.map(({
    discrepancyClassModuloC4Coboundary,
  }) => discrepancyClassModuloC4Coboundary));
  assert.equal(discrepancyClasses.size, 2);
  assert.deepEqual(
    new Set(verticalConjugators.map(({ discrepancyModTwo }) => discrepancyModTwo)),
    new Set(["0", "b"]),
  );

  const liftedR2 = d32Element(2, 0);
  const liftedR2Record = verticalConjugators.find(({ element }) => (
    element.i === d32Coordinates(liftedR2).i && element.j === 0
  ));
  assert(liftedR2Record);
  assert.equal(liftedR2Record.discrepancyC4Label, "b");
  assert.deepEqual(liftedR2Record.discrepancyC4, bValues);
  assert.equal(liftedR2Record.twistedC4CocycleEquationsChecked, 64);
  const reducedDiscrepancyClassRepresentatives = [0n, bCochain];
  const reducedDiscrepancyBocksteins = reducedDiscrepancyClassRepresentatives.map((representative) => (
    twistedBocksteinOfBinaryCocycle(representative, 1)
  ));
  assert(reducedDiscrepancyBocksteins.every(({ cochain }) => cochain === 0n));
  const normalizedBocksteinImageBasis = spanBasis(
    reducedDiscrepancyBocksteins.map(({ cochain }) => cochain),
  );
  assert.equal(normalizedBocksteinImageBasis.length, 0);
  return {
    extension: "D32 -> D8 with kernel <R^4> isomorphic to C4_b",
    D32Structure,
    sectionFactorChecks,
    signedKernelActionChecks: kernelActionChecks,
    fixedBaseCondition: "only lifts of Z(D8)={1,r^2} are admitted as vertical conjugation loops",
    verticalConjugatorsChecked: verticalConjugators.length,
    fullC4DiscrepancyRecords: verticalConjugators,
    distinctFullC4Discrepancies: ["0", "b", "2b", "3b"],
    C4Coboundaries: ["0", "2b"],
    discrepancyClassesModuloC4Coboundaries: discrepancyClasses.size,
    discrepancyClassesModTwo: ["0", "b"],
    validNontrivialLoop: {
      base: "r^2",
      lift: "R^2",
      fullC4Discrepancy: "lambda(i,j)=j=b",
      exactValueTable: liftedR2Record.discrepancyC4,
      twistedC4Coboundary: "0",
      twistedC4CocycleEquationsChecked: liftedR2Record.twistedC4CocycleEquationsChecked,
    },
    verticalDiscrepancySpan: "<b>",
    normalizedBocksteinDomainClassesDerivedFromFullC4Quotient: ["0", "b"],
    normalizedBocksteinClassChecks: reducedDiscrepancyBocksteins.map(({
      cochain, equationsChecked,
    }, index) => ({
      input: ["0", "b"][index],
      outputClass: cochain === 0n ? "0" : "nonzero",
      normalizedTuplesChecked: equationsChecked,
    })),
    normalizedBocksteinImageDerivedFromModTwoReductions: [],
    normalizedBocksteinImageDimension: normalizedBocksteinImageBasis.length,
    noncentralConjugationsExcludedFromFixedBaseHolonomy: true,
  };
}

function auditNonElementaryD8Stutter() {
  for (let left = 0; left < 8; left += 1) {
    assert.equal(d8Multiply(0, left), left);
    assert.equal(d8Multiply(left, 0), left);
    for (let right = 0; right < 8; right += 1) {
      for (let third = 0; third < 8; third += 1) {
        assert.equal(
          d8Multiply(d8Multiply(left, right), third),
          d8Multiply(left, d8Multiply(right, third)),
        );
      }
    }
  }

  let signedCarryEquations = 0;
  for (let g = 0; g < 8; g += 1) {
    for (let h = 0; h < 8; h += 1) {
      for (let k = 0; k < 8; k += 1) {
        const sign = d8Coordinates(g).j === 0 ? 1 : -1;
        const equation = sign * signedCarry(h, k)
          - signedCarry(d8Multiply(g, h), k)
          + signedCarry(g, d8Multiply(h, k))
          - signedCarry(g, h);
        assert.equal(equation, 0);
        signedCarryEquations += 1;
      }
    }
  }
  assert.equal(signedCarryEquations, 512);

  const dOneColumns = trivialCoboundaryColumns(1);
  const dTwoColumns = trivialCoboundaryColumns(2);
  const boundariesTwo = spanBasis(dOneColumns);
  const cocyclesTwo = kernelOfColumns(dTwoColumns);
  const a = cochainFromFunction(1, (g) => d8Coordinates(g).i & 1);
  const b = cochainFromFunction(1, (g) => d8Coordinates(g).j);
  assert.equal(applyLinearMap(a, dOneColumns), 0n);
  assert.equal(applyLinearMap(b, dOneColumns), 0n);
  const a2 = cupProduct(a, 1, a, 1);
  const ab = cupProduct(a, 1, b, 1);
  const b2 = cupProduct(b, 1, b, 1);
  const w = cochainFromFunction(2, (g, h) => mod(signedCarry(g, h), 2));
  for (const cocycle of [a2, ab, b2, w]) assert.equal(applyLinearMap(cocycle, dTwoColumns), 0n);
  assert(inSpan(a2 ^ ab, boundariesTwo));
  assert.equal(spanBasis([...boundariesTwo, a2, b2, w]).length - boundariesTwo.length, 3);
  assert.equal(cocyclesTwo.length - boundariesTwo.length, 3);

  const boundariesThree = spanBasis(dTwoColumns);
  const a2b = cupProduct(a2, 2, b, 1);
  const b3 = cupProduct(b2, 2, b, 1);
  assert.equal(trivialCoboundaryVector(a2b, 3), 0n);
  assert.equal(trivialCoboundaryVector(b3, 3), 0n);
  assert(!inSpan(a2b, boundariesThree));
  assert(!inSpan(b3, boundariesThree));
  assert.equal(spanBasis([...boundariesThree, a2b, b3]).length - boundariesThree.length, 2);

  const H1Basis = [a, b];
  const H2Basis = [a2, b2, w];
  const H1Bockstein = auditTwistedBocksteinMap(H1Basis, 1, boundariesTwo);
  assert(H1Bockstein.basisImages.every((image) => inSpan(image, boundariesTwo)));
  const incomingCoordinates = H1Bockstein.combinations.map(({ inputMask }) => (
    quotientCoordinates(
      xorSelected(H1Bockstein.basisImages, inputMask),
      H2Basis,
      boundariesTwo,
    )
  ));
  assert.deepEqual(incomingCoordinates, [0, 0, 0, 0]);
  const incomingCoordinateBasis = spanBasis(incomingCoordinates.map(BigInt));
  assert.equal(incomingCoordinateBasis.length, 0);

  const H2Bockstein = auditTwistedBocksteinMap(H2Basis, 2, boundariesThree);
  assert(inSpan(H2Bockstein.basisImages[0] ^ a2b, boundariesThree));
  assert(inSpan(H2Bockstein.basisImages[1] ^ b3, boundariesThree));
  assert(inSpan(H2Bockstein.basisImages[2], boundariesThree));
  const persistentMasks = H2Bockstein.combinations
    .filter(({ outputClassZero }) => outputClassZero)
    .map(({ inputMask }) => inputMask);
  assert.deepEqual(persistentMasks, [0, 4]);
  const persistentCoordinateBasis = spanBasis(persistentMasks.map(BigInt));
  assert.deepEqual(persistentCoordinateBasis, [4n]);

  let innerPullbacksChecked = 0;
  for (let conjugator = 0; conjugator < 8; conjugator += 1) {
    const inverse = d8Inverse(conjugator);
    const inner = (g) => d8Multiply(conjugator, d8Multiply(g, inverse));
    for (const cohomologyBasis of [a2, b2, w]) {
      const difference = pullbackTwoCochain(cohomologyBasis, inner) ^ cohomologyBasis;
      assert(inSpan(difference, boundariesTwo));
      innerPullbacksChecked += 1;
    }
  }
  assert.equal(innerPullbacksChecked, 24);
  const fixedBaseLoops = auditFixedBaseD8Loops(b);
  const D16Reduction = auditD16Reduction();

  return {
    group: "D8={(i,j): i mod 4, j mod 2}",
    multiplication: "(i,j)(k,l)=(i+(-1)^j k mod 4,j+l mod 2)",
    twist: "b(i,j)=j",
    symbolicCohomology: {
      presentation: "H*(D8,F2)=F2[a,b,w]/(a^2+ab)",
      fullRingPresentationProvedByThisExecutable: false,
      normalizedCochainAuditCoversDegreesOneThroughThreeUsedBySelector: true,
      degrees: { a: 1, b: 1, w: 2 },
      degreeTwoDimensionByNormalizedCochainAudit: cocyclesTwo.length - boundariesTwo.length,
      degreeTwoBasis: ["a^2=ab", "b^2", "w"],
      normalizedTwistedBocksteinAudit: {
        construction: "entrywise 0/1 lift, signed Z/4_b coboundary, divide by 2 mod 2, quotient by normalized bar boundaries",
        H1Basis: ["a", "b"],
        H1CombinationsEnumerated: H1Bockstein.combinations.length,
        H1CombinationRecords: H1Bockstein.combinations,
        H1BasisImageClassesDerivedModuloBoundaries: ["0", "0"],
        H2Basis: ["a^2", "b^2", "w"],
        H2CombinationsEnumerated: H2Bockstein.combinations.length,
        H2CombinationRecords: H2Bockstein.combinations,
        H2BasisImageClassesDerivedModuloBoundaries: ["a^2b", "b^3", "0"],
        degreeTwoBoundaryRank: boundariesTwo.length,
        degreeThreeBoundaryRank: boundariesThree.length,
      },
      twistedDifferential: {
        "d_b(a)": "0",
        "d_b(b)": "0",
        "d_b(a^2)": "a^2b",
        "d_b(b^2)": "b^3",
        "d_b(w)": "0",
      },
      nonzeroIndependentDegreeThreeImagesChecked: ["a^2b", "b^3"],
      degreeThreeCocycleEquationsChecked: 2 * (7 ** 4),
      persistentBasisDerivedByCombinationKernel: ["w"],
      persistentCombinationMasks: persistentMasks,
      persistentDimension: persistentCoordinateBasis.length,
      incomingImageDerivedFromAllH1Combinations: [],
      incomingCombinationCoordinates: incomingCoordinates,
      incomingDimension: incomingCoordinateBasis.length,
    },
    signedCarryAudit: {
      formula: "F_inf(g,h)=(i+(-1)^j k-r)/4, r in {0,1,2,3}",
      normalized: true,
      exactTwistedCocycleEquationsChecked: signedCarryEquations,
      reductionModTwoRepresentsW: true,
      provesTwistedBocksteinOfWZero: true,
      equationCountIsGroupTriplesNotCandidateCochains: true,
      D16Reduction,
    },
    cohomologicalInnerNaturalityAudit: {
      D8ConjugatorsChecked: 8,
      H2BasisPullbacksCheckedModuloCoboundary: innerPullbacksChecked,
      everyInnerAutomorphismActsTriviallyOnH2: true,
    },
    actualFixedBaseInnerTransport: {
      ...fixedBaseLoops,
      holonomyBasis: [],
      holonomyDimension: 0,
    },
    selectorOutcome: {
      persistentButNotInnerEnacted: true,
      strictProperRealization: false,
      stutter: true,
    },
    coefficientInversionAffineCoreSwapEstablished: false,
  };
}

function buildLaboratory() {
  const source = bindActualD8Source();
  const activeCharacter = polynomialFromMonomials(2, 1, [[1, 0], [0, 1]]);
  const activeClass = polynomialFromMonomials(2, 2, [[1, 1]]);
  const active = analyzeMarkedFixture(2, activeCharacter, activeClass);
  assert(active.closed);
  assert.equal(active.persistentDimension, 1);
  assert.equal(active.holonomyDimension, 1);
  assert.equal(subspaceKey(active.persistentBasis), subspaceKey(active.holonomyBasis));
  const sourceLoopPreimage = spanBasis(source.concreteInnerLoopMasks.map(BigInt));
  const sourceLoopImage = spanBasis(sourceLoopPreimage.map((loop) => (
    twistedDifferential(loop, 1, activeCharacter, 2)
  )));
  assert.equal(subspaceKey(sourceLoopPreimage), subspaceKey(active.commutatorImage));
  assert.equal(subspaceKey(sourceLoopImage), subspaceKey(active.holonomyBasis));

  const character = polynomialFromMonomials(3, 1, [[1, 0, 0], [0, 1, 0]]);
  const cocycleClass = polynomialFromMonomials(3, 2, [[1, 1, 0]]);
  const minimal = analyzeMarkedFixture(3, character, cocycleClass);
  assert(minimal.closed);
  assert(minimal.strict);
  assert.deepEqual(
    new Set(minimal.persistentBasis.map((value) => polynomialName(value, 3, 2))),
    new Set(["uv", "uw+vw+w^2"]),
  );
  assert.deepEqual(minimal.holonomyBasis.map((value) => polynomialName(value, 3, 2)), ["uv"]);
  assert.equal(minimal.inertRadical.dimension, 1);
  assert.deepEqual(minimal.inertRadical.elements, [0, 4]);
  assert.equal(minimal.irreducibleFixture, false);

  return {
    source,
    active,
    activeSourceCrossBinding: {
      permutationDerivedLoopMasks: source.concreteInnerLoopMasks,
      preimageSpan: sourceLoopPreimage.map((value) => polynomialName(value, 2, 1)),
      imageUnderDChi: sourceLoopImage.map((value) => polynomialName(value, 2, 2)),
      preimageEqualsCommutatorImage: true,
      imageEqualsActiveHolonomy: true,
    },
    minimal,
    census: enumerateElementaryCensus(),
    covariance: auditGL3Covariance(minimal),
    nonElementary: auditNonElementaryD8Stutter(),
  };
}

function buildCertificate(lab) {
  const split = analyzeMarkedFixture(2, lab.active.character, 0n);
  const nonliftable = analyzeMarkedFixture(
    2,
    polynomialFromMonomials(2, 1, [[1, 0]]),
    lab.active.cocycleClass,
  );
  assert.equal(split.holonomyDimension, 0);
  assert.equal(nonliftable.closed, false);
  const body = {
    schema: "oasis.genesis-selector-separation-search.certificate.v1",
    sourceInstance: lab.source,
    selectorDefinition: {
      markedInput: "(Q=(C2)^r, chi in H^1(Q,F2) nonzero, c in H^2(Q,F2))",
      liftability: "d_chi(c)=0",
      twistedDifferential: "d_chi=Sq^1+chi cup -",
      persistentSpace: "P=ker(d_chi:H^2->H^3)",
      concreteInnerCharacters: "L_c=im(B_c:Q->H^1), B_c(q,x)=c(q,x)+c(x,q)",
      realizedHolonomy: "H=d_chi(L_c)",
      strictCalibrationCriterion: "0<dim(H)<dim(P)",
    },
    activePlaneSourceControl: {
      fixture: fixtureSummary(lab.active),
      sourceDerivedConcreteLoopCharacters: lab.source.concreteInnerLoopCharacters,
      executableCrossBinding: lab.activeSourceCrossBinding,
      persistentEqualsConcreteHolonomy: true,
    },
    elementaryCensus: {
      exhaustiveRanks: [2, 3, 4],
      records: lab.census,
      strictCounts: [0, 21, 105],
      allStrictFixturesHaveNonzeroInertRadical: true,
      irreducibleStrictFixtureFound: false,
    },
    minimalProperContainment: {
      fixture: fixtureSummary(lab.minimal),
      concreteGroupType: "D8 x C2",
      interpretation: {
        enactedDirection: "uv",
        persistentPathInertDirection: "w^2+(u+v)w",
        properContainment: "H=<uv> is a proper subspace of P=<uv,w^2+(u+v)w>",
        reducibleByPathInertFactor: true,
        decisiveAdmissionFixture: false,
      },
    },
    covariance: lab.covariance,
    controls: {
      splitClass: {
        fixture: fixtureSummary(split),
        expectedHolonomyZero: true,
      },
      outerLoopSaturation: {
        status: "DECLARED_ABLATION",
        independentlyExecuted: false,
        persistentBasis: fixtureSummary(lab.minimal).persistentBasis,
        declaredOuterHolonomyBasis: fixtureSummary(lab.minimal).persistentBasis,
        holonomyEqualsPersistent: true,
        strictSelectorWouldDisappear: true,
      },
      retainedLoopsTreatedAsGauge: {
        status: "DECLARED_ABLATION",
        independentlyExecuted: false,
        preGaugeHolonomyBasis: fixtureSummary(lab.minimal).holonomyBasis,
        postGaugeHolonomyBasis: [],
        postGaugeHolonomyDimension: 0,
        concreteDirectionErased: true,
      },
      thinCollapse: {
        status: "DECLARED_ABLATION",
        independentlyExecuted: false,
        retainedDegreeTwoSpaceDimension: 0,
        persistentDimension: 0,
        selectorStutters: true,
      },
      nonliftableClass: {
        character: polynomialName(nonliftable.character, 2, 1),
        cocycleClass: polynomialName(nonliftable.cocycleClass, 2, 2),
        differential: polynomialName(
          twistedDifferential(nonliftable.cocycleClass, 2, nonliftable.character, 2),
          2,
          3,
        ),
        rejected: true,
      },
    },
    nonElementaryD8Stutter: lab.nonElementary,
    theoremBoundary: {
      actualEightStateD8SourceBound: true,
      finiteElementaryMarkedTripleCensusExact: true,
      properPersistentVersusInnerHolonomyContainmentConstructed: true,
      firstFixtureIrreducible: false,
      irreducibleNonexactSelectorFound: false,
      nonElementaryD8PersistentButUnenactedStutterConstructed: true,
      outerSaturationGaugeAndThinAreDeclaredNotExecutedAblations: true,
      coefficientInversionAffineCoreSwapEstablished: false,
      autonomousSemanticAdmissionLawEstablished: false,
      conservativeOrInitialSignatureExtensionEstablished: false,
      BethDefinabilityEscapeEstablished: false,
      noveltyOrNoPriorArtEstablished: false,
      nonSoficityOrMachineLearningArchitectureEstablished: false,
    },
  };
  return { ...body, certificateDigest: digest(body) };
}

function buildRun() {
  const lab = buildLaboratory();
  return {
    schema: "oasis.genesis-selector-separation-search.v1",
    status: "PASS",
    result: {
      elementaryStrictCountsByRank: { 2: 0, 3: 21, 4: 105 },
      minimalProperContainment: "D8 x C2: H=<uv> proper in P=<uv,w^2+(u+v)w>",
      minimalFixtureIrreducible: false,
      elementaryIrreducibleStrictFixtureFound: false,
      nonElementaryD8Stutter: "P=<w>, H=0",
      admissionTheoremStillOpen: true,
    },
    certificate: buildCertificate(lab),
  };
}

let referenceCertificateCanonical;

export function replayGenesisSelectorSeparationCertificate(candidate) {
  try {
    const expected = referenceCertificateCanonical ??= canonical(buildRun().certificate);
    assert.equal(canonical(candidate), expected);
    const body = Object.fromEntries(Object.entries(candidate).filter(([key]) => key !== "certificateDigest"));
    assert.equal(candidate.certificateDigest, digest(body));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function auditTamper(certificate) {
  const mutations = [
    ["source action", (value) => { value.sourceInstance.opActionDigests.a = "0".repeat(64); }],
    ["source binding", (value) => { value.sourceInstance.derivedDirectlyFromConcretePermutationInstance = false; }],
    ["active equality", (value) => { value.activePlaneSourceControl.persistentEqualsConcreteHolonomy = false; }],
    ["active source cross-binding", (value) => {
      value.activePlaneSourceControl.executableCrossBinding.imageEqualsActiveHolonomy = false;
    }],
    ["rank three count", (value) => { value.elementaryCensus.strictCounts[1] = 20; }],
    ["rank four record", (value) => { value.elementaryCensus.records[2].strictProperRealizationFixtures = 104; }],
    ["irreducible overclaim", (value) => { value.elementaryCensus.irreducibleStrictFixtureFound = true; }],
    ["minimal persistent basis", (value) => { value.minimalProperContainment.fixture.persistentBasis.pop(); }],
    ["minimal holonomy", (value) => { value.minimalProperContainment.fixture.holonomyBasis = []; }],
    ["inert radical", (value) => { value.minimalProperContainment.fixture.inertRadical.dimension = 0; }],
    ["covariance", (value) => { value.covariance.basisChangesChecked = 167; }],
    ["split", (value) => { value.controls.splitClass.expectedHolonomyZero = false; }],
    ["outer saturation boundary", (value) => { value.controls.outerLoopSaturation.independentlyExecuted = true; }],
    ["gauge boundary", (value) => {
      value.controls.retainedLoopsTreatedAsGauge.independentlyExecuted = true;
    }],
    ["thin boundary", (value) => { value.controls.thinCollapse.independentlyExecuted = true; }],
    ["nonliftable", (value) => { value.controls.nonliftableClass.rejected = false; }],
    ["D8 carry count", (value) => { value.nonElementaryD8Stutter.signedCarryAudit.exactTwistedCocycleEquationsChecked = 511; }],
    ["D8 Bockstein combinations", (value) => {
      value.nonElementaryD8Stutter.symbolicCohomology
        .normalizedTwistedBocksteinAudit.H2CombinationsEnumerated = 7;
    }],
    ["D8 persistent", (value) => {
      value.nonElementaryD8Stutter.symbolicCohomology
        .persistentBasisDerivedByCombinationKernel = [];
    }],
    ["degree three cocycles", (value) => {
      value.nonElementaryD8Stutter.symbolicCohomology.degreeThreeCocycleEquationsChecked -= 1;
    }],
    ["D32 associativity", (value) => {
      value.nonElementaryD8Stutter.actualFixedBaseInnerTransport
        .D32Structure.associativityChecks -= 1;
    }],
    ["D32 factor audit", (value) => {
      value.nonElementaryD8Stutter.actualFixedBaseInnerTransport.sectionFactorChecks = 63;
    }],
    ["D32 action audit", (value) => {
      value.nonElementaryD8Stutter.actualFixedBaseInnerTransport.signedKernelActionChecks = 31;
    }],
    ["full C4 discrepancy", (value) => {
      value.nonElementaryD8Stutter.actualFixedBaseInnerTransport
        .validNontrivialLoop.exactValueTable[4] = 0;
    }],
    ["C4 quotient classes", (value) => {
      value.nonElementaryD8Stutter.actualFixedBaseInnerTransport
        .discrepancyClassesModuloC4Coboundaries = 1;
    }],
    ["D16 reduction", (value) => {
      value.nonElementaryD8Stutter.signedCarryAudit.D16Reduction.sectionFactorChecks = 63;
    }],
    ["D8 loop typing", (value) => {
      value.nonElementaryD8Stutter.actualFixedBaseInnerTransport
        .noncentralConjugationsExcludedFromFixedBaseHolonomy = false;
    }],
    ["D8 holonomy", (value) => {
      value.nonElementaryD8Stutter.actualFixedBaseInnerTransport.holonomyDimension = 1;
    }],
    ["admission overclaim", (value) => { value.theoremBoundary.autonomousSemanticAdmissionLawEstablished = true; }],
    ["Beth overclaim", (value) => { value.theoremBoundary.BethDefinabilityEscapeEstablished = true; }],
    ["novelty overclaim", (value) => { value.theoremBoundary.noveltyOrNoPriorArtEstablished = true; }],
    ["digest", (value) => { value.certificateDigest = "0".repeat(64); }],
    ["extra field", (value) => { value.extra = true; }],
  ];
  const cases = mutations.map(([name, mutate]) => {
    const candidate = clone(certificate);
    mutate(candidate);
    return { name, rejected: !replayGenesisSelectorSeparationCertificate(candidate).ok };
  });
  assert(cases.every(({ rejected }) => rejected));
  return {
    attempted: cases.length,
    rejected: cases.filter(({ rejected }) => rejected).length,
    cases,
  };
}

export function runGenesisSelectorSeparationSearch() {
  const run = buildRun();
  referenceCertificateCanonical = canonical(run.certificate);
  return { ...run, tamper: auditTamper(run.certificate) };
}

function printSummary(run) {
  console.log("PASS source binding: actual eight-state D8 interchange instance");
  console.log("PASS elementary census: strict counts r=2,3,4 are 0,21,105");
  console.log("PASS proper calibration: D8 x C2 has H=<uv> properly contained in P=<uv,w^2+(u+v)w>");
  console.log("PASS negative classification: every elementary strict fixture found has an inert radical");
  console.log("PASS covariance: all 168 elements of GL(3,2); split and nonliftable controls executed");
  console.log("DECLARED ABLATIONS only: outer saturation, retained-loop gauge erasure, and thin collapse");
  console.log("PASS non-elementary stutter: normalized Bockstein gives P=<w>, H=0; 512 signed-carry equations checked");
  console.log("PASS replay/tamper: " + String(run.tamper.rejected) + "/" + String(run.tamper.attempted) + " mutations rejected");
  console.log("BOUNDARY no admission theorem, Beth escape, novelty theorem, or AI architecture is claimed");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = runGenesisSelectorSeparationSearch();
  printSummary(run);
  console.log(JSON.stringify(run, null, 2));
}
