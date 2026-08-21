import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const Q = Object.freeze([0, 1, 2, 3]);
const tupleCache = new Map();

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

function mod(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
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
  for (const row of spanBasis(basis).map((entry) => ({
    pivot: highestBit(entry), value: entry,
  }))) {
    if (((value >> BigInt(row.pivot)) & 1n) !== 0n) value ^= row.value;
  }
  return value === 0n;
}

function subspaceKey(basis) {
  const reduced = spanBasis(basis);
  let elements = [0n];
  for (const vector of reduced) elements = elements.concat(elements.map((entry) => entry ^ vector));
  return elements.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((entry) => entry.toString(16)).join(",");
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

function solveLinear(columns, target) {
  const pivots = [];
  columns.forEach((column, index) => {
    let image = BigInt(column);
    let source = 1n << BigInt(index);
    for (const row of pivots) {
      if (((image >> BigInt(row.pivot)) & 1n) !== 0n) {
        image ^= row.image;
        source ^= row.source;
      }
    }
    if (image !== 0n) {
      pivots.push({ pivot: highestBit(image), image, source });
      pivots.sort((left, right) => right.pivot - left.pivot);
    }
  });
  let remainder = BigInt(target);
  let solution = 0n;
  for (const row of pivots) {
    if (((remainder >> BigInt(row.pivot)) & 1n) !== 0n) {
      remainder ^= row.image;
      solution ^= row.source;
    }
  }
  return remainder === 0n ? solution : undefined;
}

function xorSelected(vectors, mask) {
  return vectors.reduce((result, vector, index) => (
    ((mask >> index) & 1) === 0 ? result : result ^ vector
  ), 0n);
}

function quotientBasis(cocycles, boundaries) {
  let accumulated = spanBasis(boundaries);
  const representatives = [];
  for (const cocycle of spanBasis(cocycles)) {
    if (inSpan(cocycle, accumulated)) continue;
    representatives.push(cocycle);
    accumulated = spanBasis([...accumulated, cocycle]);
  }
  return representatives;
}

function quotientCoordinates(vector, representatives, boundaries) {
  const matches = [];
  for (let mask = 0; mask < (1 << representatives.length); mask += 1) {
    if (inSpan(vector ^ xorSelected(representatives, mask), boundaries)) matches.push(mask);
  }
  assert.equal(matches.length, 1);
  return matches[0];
}

function normalizedTuples(degree) {
  if (tupleCache.has(degree)) return tupleCache.get(degree);
  let tuples = [[]];
  for (let position = 0; position < degree; position += 1) {
    tuples = tuples.flatMap((prefix) => [1, 2, 3].map((entry) => [...prefix, entry]));
  }
  tupleCache.set(degree, tuples);
  return tuples;
}

function tupleIndex(tuple) {
  if (tuple.some((entry) => entry === 0)) return -1;
  return tuple.reduce((index, entry) => index * 3 + (entry - 1), 0);
}

function actPair(q, pair, modulus) {
  let [x, y] = pair.map((entry) => mod(entry, modulus));
  for (let step = 0; step < mod(q, 4); step += 1) [x, y] = [mod(-y, modulus), x];
  return [x, y];
}

function actV(q, vector) {
  const pair = [vector & 1, (vector >> 1) & 1];
  const image = actPair(q, pair, 2);
  return image[0] | (image[1] << 1);
}

function addPairs(left, right, modulus) {
  return left.map((entry, index) => mod(entry + right[index], modulus));
}

function scalePair(coefficient, pair, modulus) {
  return pair.map((entry) => mod(coefficient * entry, modulus));
}

function vectorCochainValue(cochain, tuple) {
  const index = tupleIndex(tuple);
  if (index < 0) return 0;
  return Number((cochain >> BigInt(2 * index)) & 3n);
}

function cochainFromFunction(degree, fn) {
  let result = 0n;
  normalizedTuples(degree).forEach((tuple, index) => {
    result |= BigInt(fn(...tuple)) << BigInt(2 * index);
  });
  return result;
}

function actOnCochainOutputs(q, cochain, degree) {
  return cochainFromFunction(degree, (...tuple) => (
    actV(q, vectorCochainValue(cochain, tuple))
  ));
}

function f2Coboundary(cochain, degree) {
  let result = 0n;
  normalizedTuples(degree + 1).forEach((tuple, targetIndex) => {
    let value = actV(tuple[0], vectorCochainValue(cochain, tuple.slice(1)));
    for (let position = 0; position < degree; position += 1) {
      value ^= vectorCochainValue(cochain, [
        ...tuple.slice(0, position),
        mod(tuple[position] + tuple[position + 1], 4),
        ...tuple.slice(position + 2),
      ]);
    }
    value ^= vectorCochainValue(cochain, tuple.slice(0, -1));
    result |= BigInt(value) << BigInt(2 * targetIndex);
  });
  return result;
}

function coboundaryColumns(degree) {
  const dimension = 2 * (3 ** degree);
  return Array.from({ length: dimension }, (_, index) => (
    f2Coboundary(1n << BigInt(index), degree)
  ));
}

function cohomologyAudit(degree, previousColumns, outgoingColumns) {
  const boundaries = spanBasis(previousColumns);
  const cocycles = kernelOfColumns(outgoingColumns);
  assert(boundaries.every((boundary) => inSpan(boundary, cocycles)));
  const representatives = quotientBasis(cocycles, boundaries);
  return {
    degree,
    normalizedCochainDimension: 2 * (3 ** degree),
    boundaryBasis: boundaries,
    cocycleBasis: cocycles,
    representatives,
    boundaryDimension: boundaries.length,
    cocycleDimension: cocycles.length,
    cohomologyDimension: representatives.length,
  };
}

function binaryLiftTable(cochain, degree) {
  return normalizedTuples(degree).map((tuple) => {
    const value = vectorCochainValue(cochain, tuple);
    return [value & 1, (value >> 1) & 1];
  });
}

function pairCochainValue(table, tuple) {
  const index = tupleIndex(tuple);
  return index < 0 ? [0, 0] : table[index];
}

function mod4Coboundary(table, degree) {
  const values = [];
  normalizedTuples(degree + 1).forEach((tuple) => {
    let value = actPair(tuple[0], pairCochainValue(table, tuple.slice(1)), 4);
    for (let position = 0; position < degree; position += 1) {
      const merged = pairCochainValue(table, [
        ...tuple.slice(0, position),
        mod(tuple[position] + tuple[position + 1], 4),
        ...tuple.slice(position + 2),
      ]);
      value = addPairs(value, scalePair((position & 1) === 0 ? -1 : 1, merged, 4), 4);
    }
    const lastSign = ((degree + 1) & 1) === 0 ? 1 : -1;
    value = addPairs(value, scalePair(lastSign, pairCochainValue(table, tuple.slice(0, -1)), 4), 4);
    values.push(value);
  });
  return values;
}

function bocksteinOfCocycle(cochain, degree) {
  assert.equal(f2Coboundary(cochain, degree), 0n);
  const lift = binaryLiftTable(cochain, degree);
  const coboundary = mod4Coboundary(lift, degree);
  let result = 0n;
  coboundary.forEach((pair, index) => {
    pair.forEach((entry, coordinate) => {
      assert.equal(entry & 1, 0);
      if (((entry / 2) & 1) !== 0) result |= 1n << BigInt(2 * index + coordinate);
    });
  });
  assert.equal(f2Coboundary(result, degree + 1), 0n);
  return {
    cochain: result,
    binaryLiftDigest: digest(lift),
    mod4CoboundaryDigest: digest(coboundary),
    normalizedSourceTuples: 3 ** degree,
    normalizedTargetTuples: 3 ** (degree + 1),
  };
}

function auditBocksteinMap(domain, target) {
  const basisImages = domain.representatives.map((representative) => (
    bocksteinOfCocycle(representative, domain.degree)
  ));
  const basisTargetCoordinates = basisImages.map(({ cochain }) => (
    quotientCoordinates(cochain, target.representatives, target.boundaryBasis)
  ));
  const combinations = [];
  for (let mask = 0; mask < (1 << domain.representatives.length); mask += 1) {
    const input = xorSelected(domain.representatives, mask);
    const direct = bocksteinOfCocycle(input, domain.degree);
    const coordinates = quotientCoordinates(
      direct.cochain,
      target.representatives,
      target.boundaryBasis,
    );
    const predicted = basisTargetCoordinates.reduce((value, column, index) => (
      ((mask >> index) & 1) === 0 ? value : value ^ column
    ), 0);
    assert.equal(coordinates, predicted);
    combinations.push({
      inputMask: mask,
      targetCoordinates: coordinates,
      targetClassZero: coordinates === 0,
      bocksteinCochainDigest: digest(direct.cochain.toString(16)),
      binaryLiftDigest: direct.binaryLiftDigest,
      mod4CoboundaryDigest: direct.mod4CoboundaryDigest,
    });
  }
  return {
    sourceDegree: domain.degree,
    targetDegree: target.degree,
    basisTargetCoordinates,
    rank: spanBasis(basisTargetCoordinates.map(BigInt)).length,
    combinations,
  };
}

function constructMod4Lift(cochain, degree, bocksteinCochain, outgoingColumns) {
  const correction = solveLinear(outgoingColumns, bocksteinCochain);
  if (correction === undefined) return undefined;
  const binaryLift = binaryLiftTable(cochain, degree);
  const table = normalizedTuples(degree).map((_, tuplePosition) => (
    [0, 1].map((coordinate) => {
      const bitIndex = 2 * tuplePosition + coordinate;
      const correctionBit = Number((correction >> BigInt(bitIndex)) & 1n);
      return mod(binaryLift[tuplePosition][coordinate] - 2 * correctionBit, 4);
    })
  ));
  const reduction = cochainFromFunction(degree, (...tuple) => {
    const value = pairCochainValue(table, tuple);
    return (value[0] & 1) | ((value[1] & 1) << 1);
  });
  assert.equal(reduction, cochain);
  assert(mod4Coboundary(table, degree).every((pair) => pair[0] === 0 && pair[1] === 0));
  return {
    table,
    correction,
    tableDigest: digest(table),
    correctionDigest: digest(correction.toString(16)),
    exactMod4Cocycle: true,
  };
}

function encodeVExtension(vector, q) {
  return vector + 4 * q;
}

function decodeVExtension(element) {
  return { vector: element & 3, q: (element >> 2) & 3 };
}

function auditVExtension(cocycle) {
  const multiply = (left, right) => {
    const g = decodeVExtension(left);
    const h = decodeVExtension(right);
    const factor = vectorCochainValue(cocycle, [g.q, h.q]);
    return encodeVExtension(g.vector ^ actV(g.q, h.vector) ^ factor, mod(g.q + h.q, 4));
  };
  const inverse = (element) => {
    for (let candidate = 0; candidate < 16; candidate += 1) {
      if (multiply(element, candidate) === 0 && multiply(candidate, element) === 0) return candidate;
    }
    throw new Error("V-extension inverse not found");
  };
  let associativityChecks = 0;
  for (let left = 0; left < 16; left += 1) {
    assert.equal(multiply(0, left), left);
    assert.equal(multiply(left, 0), left);
    inverse(left);
    for (let right = 0; right < 16; right += 1) {
      for (let third = 0; third < 16; third += 1) {
        assert.equal(
          multiply(multiply(left, right), third),
          multiply(left, multiply(right, third)),
        );
        associativityChecks += 1;
      }
    }
  }
  let projectionChecks = 0;
  for (let left = 0; left < 16; left += 1) {
    for (let right = 0; right < 16; right += 1) {
      assert.equal(
        decodeVExtension(multiply(left, right)).q,
        mod(decodeVExtension(left).q + decodeVExtension(right).q, 4),
      );
      projectionChecks += 1;
    }
  }
  const kernel = Array.from({ length: 16 }, (_, element) => element)
    .filter((element) => decodeVExtension(element).q === 0);
  assert.deepEqual(kernel, [0, 1, 2, 3]);
  let actionChecks = 0;
  let sectionFactorChecks = 0;
  for (const q of Q) {
    const section = encodeVExtension(0, q);
    const sectionInverse = inverse(section);
    for (let vector = 0; vector < 4; vector += 1) {
      const conjugated = multiply(section, multiply(encodeVExtension(vector, 0), sectionInverse));
      assert.deepEqual(decodeVExtension(conjugated), { vector: actV(q, vector), q: 0 });
      actionChecks += 1;
    }
    for (const r of Q) {
      const product = decodeVExtension(multiply(section, encodeVExtension(0, r)));
      assert.equal(product.vector, vectorCochainValue(cocycle, [q, r]));
      assert.equal(product.q, mod(q + r, 4));
      sectionFactorChecks += 1;
    }
  }
  assert.equal(associativityChecks, 16 ** 3);
  assert.equal(projectionChecks, 16 ** 2);
  assert.equal(actionChecks, 16);
  assert.equal(sectionFactorChecks, 16);
  assert.notEqual(actV(1, 1), 1);
  return {
    multiply,
    inverse,
    audit: {
      order: 16,
      associativityChecks,
      projectionHomomorphismChecks: projectionChecks,
      exactKernel: ["00", "10", "01", "11"],
      kernelActionChecks: actionChecks,
      sectionFactorChecks,
      noncentralBecauseQuarterTurnActsNontrivially: true,
    },
  };
}

function encodeBExtension(pair, q) {
  return mod(pair[0], 4) + 4 * mod(pair[1], 4) + 16 * q;
}

function decodeBExtension(element) {
  return {
    pair: [element & 3, (element >> 2) & 3],
    q: (element >> 4) & 3,
  };
}

function auditBExtension(table, reducedExtension) {
  const multiply = (left, right) => {
    const g = decodeBExtension(left);
    const h = decodeBExtension(right);
    const factor = pairCochainValue(table, [g.q, h.q]);
    return encodeBExtension(
      addPairs(addPairs(g.pair, actPair(g.q, h.pair, 4), 4), factor, 4),
      mod(g.q + h.q, 4),
    );
  };
  const reduce = (element) => {
    const value = decodeBExtension(element);
    return encodeVExtension(
      (value.pair[0] & 1) | ((value.pair[1] & 1) << 1),
      value.q,
    );
  };
  let associativityChecks = 0;
  for (let left = 0; left < 64; left += 1) {
    for (let right = 0; right < 64; right += 1) {
      for (let third = 0; third < 64; third += 1) {
        assert.equal(
          multiply(multiply(left, right), third),
          multiply(left, multiply(right, third)),
        );
        associativityChecks += 1;
      }
    }
  }
  let reductionChecks = 0;
  for (let left = 0; left < 64; left += 1) {
    for (let right = 0; right < 64; right += 1) {
      assert.equal(
        reduce(multiply(left, right)),
        reducedExtension.multiply(reduce(left), reduce(right)),
      );
      reductionChecks += 1;
    }
  }
  const reductionKernel = Array.from({ length: 64 }, (_, element) => element)
    .filter((element) => reduce(element) === 0);
  assert.equal(reductionKernel.length, 4);
  assert.equal(associativityChecks, 64 ** 3);
  assert.equal(reductionChecks, 64 ** 2);
  return {
    order: 64,
    associativityChecks,
    reductionHomomorphismChecks: reductionChecks,
    reductionKernelSize: reductionKernel.length,
    noncentralBecauseQuarterTurnActsNontrivially: true,
  };
}

function auditFixedBaseConjugation(extension, cocycle, H1, betaH1) {
  const fullAffineRecords = [];
  const markedFiberPreserving = [];
  for (let conjugator = 0; conjugator < 16; conjugator += 1) {
    const base = decodeVExtension(conjugator).q;
    const conjugatorInverse = extension.inverse(conjugator);
    const discrepancy = cochainFromFunction(1, (q) => {
      const section = encodeVExtension(0, q);
      const conjugated = extension.multiply(
        conjugator,
        extension.multiply(section, conjugatorInverse),
      );
      const value = decodeVExtension(conjugated);
      assert.equal(value.q, q);
      return value.vector;
    });
    const linearPart = (base & 1) === 0 ? "I" : "S";
    const compatibilityDefect = actOnCochainOutputs(base, cocycle, 2) ^ cocycle;
    assert.equal(f2Coboundary(discrepancy, 1), compatibilityDefect);
    const record = {
      element: conjugator,
      conjugator: decodeVExtension(conjugator),
      linearPart,
      discrepancyValues: Q.map((q) => vectorCochainValue(discrepancy, [q])),
      discrepancyDigest: digest(discrepancy.toString(16)),
      affineCompatibilityDefectDigest: digest(compatibilityDefect.toString(16)),
      translationIsOrdinaryOneCocycle: compatibilityDefect === 0n,
      discrepancy,
    };
    fullAffineRecords.push(record);
    if (linearPart !== "I") continue;
    assert([0, 1, 2, 3].every((vector) => actV(base, vector) === vector));
    const H1Coordinates = quotientCoordinates(discrepancy, H1.representatives, H1.boundaryBasis);
    markedFiberPreserving.push({ ...record, H1Coordinates });
  }
  assert.equal(fullAffineRecords.length, 16);
  assert.equal(markedFiberPreserving.length, 8);

  let affineCompositionChecks = 0;
  for (const left of fullAffineRecords) {
    for (const right of fullAffineRecords) {
      const productElement = extension.multiply(left.element, right.element);
      const product = fullAffineRecords[productElement];
      const composedLinearExponent = mod(left.conjugator.q + right.conjugator.q, 4);
      assert.equal(product.linearPart, (composedLinearExponent & 1) === 0 ? "I" : "S");
      const composedDiscrepancy = actOnCochainOutputs(
        left.conjugator.q,
        right.discrepancy,
        1,
      ) ^ left.discrepancy;
      assert.equal(composedDiscrepancy, product.discrepancy);
      affineCompositionChecks += 1;
    }
  }
  assert.equal(affineCompositionChecks, 16 ** 2);

  const actualH1CoordinateBasis = spanBasis(markedFiberPreserving.map(({ H1Coordinates }) => (
    BigInt(H1Coordinates)
  )));
  const enactedCoordinates = markedFiberPreserving.map(({ H1Coordinates }) => (
    betaH1.basisTargetCoordinates.reduce((value, column, index) => (
      ((H1Coordinates >> index) & 1) === 0 ? value : value ^ column
    ), 0)
  ));
  const enactedCoordinateBasis = spanBasis(enactedCoordinates.map(BigInt));
  return {
    baseFixedAffineHolonomy: {
      reasonAllConjugationsFixBase: "Q=C4 is abelian",
      conjugatorsChecked: fullAffineRecords.length,
      linearPartsRetained: ["I", "S"],
      affineCompositionChecks,
      records: fullAffineRecords.map(({
        element,
        conjugator,
        linearPart,
        discrepancyValues,
        discrepancyDigest,
        affineCompatibilityDefectDigest,
        translationIsOrdinaryOneCocycle,
      }) => ({
        element,
        conjugator,
        linearPart,
        discrepancyValues,
        discrepancyDigest,
        affineCompatibilityDefectDigest,
        translationIsOrdinaryOneCocycle,
      })),
      nonidentityLinearPartsWereNotProjectedToH1: true,
    },
    cohomologicalTranslationGate: "linear part must be identity before the discrepancy defines an ordinary H1 class",
    admissibleBaseElements: [0, 2],
    arbitraryConjugationsAdmitted: false,
    conjugatorsChecked: markedFiberPreserving.length,
    records: markedFiberPreserving.map(({
      conjugator,
      discrepancyValues,
      discrepancyDigest,
      H1Coordinates,
    }) => ({
      conjugator,
      discrepancyValues,
      discrepancyDigest,
      H1Coordinates,
    })),
    actualH1CoordinateBasis: actualH1CoordinateBasis.map(Number),
    actualH1Dimension: actualH1CoordinateBasis.length,
    enactedH2CoordinateBasis: enactedCoordinateBasis.map(Number),
    enactedH2Dimension: enactedCoordinateBasis.length,
  };
}

function auditInvariantSubmodules(H2, dTwoColumns) {
  const invariantLines = [1, 2, 3].filter((generator) => (
    Q.every((q) => [0, generator].includes(actV(q, generator)))
  ));
  assert.deepEqual(invariantLines, [3]);
  const invariantComplements = [1, 2, 3].filter((generator) => (
    generator !== 3
    && [0, generator, 3, generator ^ 3].length === 4
    && Q.every((q) => [0, generator].includes(actV(q, generator)))
  ));
  assert.deepEqual(invariantComplements, []);

  const supportColumns = normalizedTuples(2).map((_, tuplePosition) => (
    3n << BigInt(2 * tuplePosition)
  ));
  const restrictedDifferentialColumns = supportColumns.map((column) => f2Coboundary(column, 2));
  const supportedKernel = kernelOfColumns(restrictedDifferentialColumns);
  const supportedCocycles = supportedKernel.map((coefficients) => (
    supportColumns.reduce((value, column, index) => (
      ((coefficients >> BigInt(index)) & 1n) === 0n ? value : value ^ column
    ), 0n)
  ));
  const supportedH2Coordinates = spanBasis(supportedCocycles.map((cocycle) => (
    BigInt(quotientCoordinates(cocycle, H2.representatives, H2.boundaryBasis))
  )));
  assert.deepEqual(supportedH2Coordinates, [1n]);
  return {
    invariantLines: [{ generator: "11", line: ["00", "11"] }],
    invariantComplementExists: false,
    moduleIndecomposable: true,
    directSummandSpectatorExists: false,
    nonzeroH2ClassSupportedOnInvariantFiltrationLine: true,
    supportedH2CoordinateBasis: supportedH2Coordinates.map(Number),
    restrictedCocycleDimension: supportedKernel.length,
    fullDegreeTwoDifferentialColumns: dTwoColumns.length,
  };
}

function auditIntegralPeriodicBockstein(H2) {
  const diagonalCarry = cochainFromFunction(2, (left, right) => (
    left + right >= 4 ? 3 : 0
  ));
  assert.equal(f2Coboundary(diagonalCarry, 2), 0n);
  const barH2Coordinates = quotientCoordinates(
    diagonalCarry,
    H2.representatives,
    H2.boundaryBasis,
  );
  assert.equal(barH2Coordinates, 1);

  const J = [[0, -1], [1, 0]];
  const transition = [[-1, -1], [1, -1]];
  const norm = [[0, 0], [0, 0]];
  const liftedInvariant = [1, 1];
  const transitionImage = [
    transition[0][0] * liftedInvariant[0] + transition[0][1] * liftedInvariant[1],
    transition[1][0] * liftedInvariant[0] + transition[1][1] * liftedInvariant[1],
  ];
  assert.deepEqual(transitionImage, [-2, 0]);
  const connectingRepresentative = transitionImage.map((entry) => entry / 2);
  assert.deepEqual(connectingRepresentative, [-1, 0]);
  const determinant = transition[0][0] * transition[1][1]
    - transition[0][1] * transition[1][0];
  assert.equal(determinant, 2);
  const twiceConnecting = connectingRepresentative.map((entry) => 2 * entry);
  assert.deepEqual(twiceConnecting, transitionImage);
  const inverseNumerators = [
    -connectingRepresentative[0] + connectingRepresentative[1],
    -connectingRepresentative[0] - connectingRepresentative[1],
  ];
  assert.deepEqual(inverseNumerators, [1, 1]);
  assert(inverseNumerators.some((entry) => entry % determinant !== 0));
  return {
    resolution: "two-periodic C4 resolution",
    generatorMatrixJ: J,
    evenToOddDifferential: "T=J-I",
    transitionMatrix: transition,
    oddToEvenDifferential: "N=I+J+J^2+J^3",
    normMatrix: norm,
    barCarryRepresentativeDigest: digest(diagonalCarry.toString(16)),
    barCarryH2Coordinates: barH2Coordinates,
    liftedInvariantVector: liftedInvariant,
    transitionOfLift: transitionImage,
    integralConnectingRepresentative: connectingRepresentative,
    H3Presentation: "L/(J-I)L is cyclic of order 2",
    smithInvariantFactorsOfTransition: [1, 2],
    connectingClassNonzero: true,
    twiceConnectingClassIsBoundary: true,
    integralBocksteinH2VToH3LIsIsomorphism: true,
  };
}

function buildLaboratory() {
  const columns = [0, 1, 2, 3].map(coboundaryColumns);
  for (let degree = 0; degree < 3; degree += 1) {
    assert(columns[degree].every((column) => f2Coboundary(column, degree + 1) === 0n));
  }
  const H1 = cohomologyAudit(1, columns[0], columns[1]);
  const H2 = cohomologyAudit(2, columns[1], columns[2]);
  const H3 = cohomologyAudit(3, columns[2], columns[3]);
  assert.deepEqual(
    [H1.cohomologyDimension, H2.cohomologyDimension, H3.cohomologyDimension],
    [1, 1, 1],
  );

  const betaH1 = auditBocksteinMap(H1, H2);
  const betaH2 = auditBocksteinMap(H2, H3);
  const persistentCoordinateBasis = kernelOfColumns(betaH2.basisTargetCoordinates.map(BigInt));
  const incomingCoordinateBasis = spanBasis(betaH1.basisTargetCoordinates.map(BigInt));
  assert(incomingCoordinateBasis.every((coordinate) => inSpan(coordinate, persistentCoordinateBasis)));
  const residualDimension = persistentCoordinateBasis.length - incomingCoordinateBasis.length;

  const invariantAudit = auditInvariantSubmodules(H2, columns[2]);
  const integralPeriodicAudit = auditIntegralPeriodicBockstein(H2);
  const classRecords = [];
  for (let classMask = 0; classMask < (1 << H2.representatives.length); classMask += 1) {
    const cocycle = xorSelected(H2.representatives, classMask);
    const bockstein = bocksteinOfCocycle(cocycle, 2);
    const targetCoordinates = quotientCoordinates(
      bockstein.cochain,
      H3.representatives,
      H3.boundaryBasis,
    );
    const liftable = targetCoordinates === 0;
    const mod4Lift = liftable
      ? constructMod4Lift(cocycle, 2, bockstein.cochain, columns[2])
      : undefined;
    assert.equal(liftable, mod4Lift !== undefined);
    const extension = auditVExtension(cocycle);
    const fixedBase = auditFixedBaseConjugation(extension, cocycle, H1, betaH1);
    const liftedExtension = mod4Lift === undefined
      ? undefined
      : auditBExtension(mod4Lift.table, extension);
    classRecords.push({
      H2Coordinates: classMask,
      cocycleDigest: digest(cocycle.toString(16)),
      bocksteinH3Coordinates: targetCoordinates,
      liftableToMod4MatrixLocalSystem: liftable,
      mod4Lift: mod4Lift === undefined ? null : {
        tableDigest: mod4Lift.tableDigest,
        correctionDigest: mod4Lift.correctionDigest,
        exactMod4Cocycle: mod4Lift.exactMod4Cocycle,
      },
      VExtension: extension.audit,
      BExtension: liftedExtension ?? null,
      fixedBaseLiftConjugation: fixedBase,
      coexistenceCandidate: fixedBase.enactedH2Dimension > 0 && residualDimension > 0,
    });
  }

  assert.deepEqual(classRecords.map(({ liftableToMod4MatrixLocalSystem }) => (
    liftableToMod4MatrixLocalSystem
  )), [true, false]);
  assert(classRecords.every(({ coexistenceCandidate }) => !coexistenceCandidate));
  return {
    columns,
    H1,
    H2,
    H3,
    betaH1,
    betaH2,
    persistentCoordinateBasis,
    incomingCoordinateBasis,
    residualDimension,
    invariantAudit,
    integralPeriodicAudit,
    classRecords,
  };
}

function summarizeCohomology(cohomology) {
  return {
    degree: cohomology.degree,
    normalizedCochainDimension: cohomology.normalizedCochainDimension,
    boundaryDimension: cohomology.boundaryDimension,
    cocycleDimension: cohomology.cocycleDimension,
    cohomologyDimension: cohomology.cohomologyDimension,
    representativeDigests: cohomology.representatives.map((representative) => (
      digest(representative.toString(16))
    )),
  };
}

function buildCertificate(lab) {
  const body = {
    schema: "oasis.genesis-matrix-local-system-escape.certificate.v1",
    model: {
      base: "Q=C4",
      lattice: "L=Z^2",
      generatorAction: "J(x,y)=(-y,x)",
      mod4Carrier: "B=L/4L=(Z/4)^2",
      mod2Carrier: "V=L/2L=F2^2",
      exactCoefficientSequence: "0 -> V --times2--> B --mod2--> V -> 0",
      normalizedBarConvention: true,
    },
    normalizedBarCohomology: {
      H1: summarizeCohomology(lab.H1),
      H2: summarizeCohomology(lab.H2),
      H3: summarizeCohomology(lab.H3),
      dimensions: [1, 1, 1],
    },
    normalizedBockstein: {
      construction: "0/1 coordinate lift to B, exact twisted mod4 coboundary, divide by 2, quotient by normalized V-boundaries",
      H1ToH2: lab.betaH1,
      H2ToH3: lab.betaH2,
      persistentCoordinateBasis: lab.persistentCoordinateBasis.map(Number),
      persistentDimension: lab.persistentCoordinateBasis.length,
      incomingCoordinateBasis: lab.incomingCoordinateBasis.map(Number),
      incomingDimension: lab.incomingCoordinateBasis.length,
      residualBocksteinHomologyDimension: lab.residualDimension,
      integralPeriodicCrossCheck: lab.integralPeriodicAudit,
    },
    moduleStructure: lab.invariantAudit,
    H2ClassCensus: {
      classesEnumerated: lab.classRecords.length,
      liftableClasses: lab.classRecords.filter((record) => (
        record.liftableToMod4MatrixLocalSystem
      )).length,
      records: lab.classRecords,
    },
    searchVerdict: {
      candidateFound: false,
      exactNoGo: [
        "beta:H2(Q,V)->H3(Q,V) is injective, so P=ker(beta)=0",
        "beta:H1(Q,V)->H2(Q,V) is zero, so actual lift-conjugation discrepancies enact no H2 direction",
        "the only mod4-liftable H2 class is the split class",
      ],
      directInvariantSpectatorAvoided: true,
      reason: "V is indecomposable and has no invariant complement, but persistence and enacted image still cannot coexist",
    },
    theoremBoundary: {
      finiteMatrixLocalSystemSearchExact: true,
      allNormalizedBarMapsThroughDegreeFourExecuted: true,
      allH2ClassesEnumerated: true,
      correspondingVExtensionsConstructedAndAssociativityChecked: true,
      liftableBExtensionConstructedAndReductionChecked: true,
      fixedBaseConjugationsDerivedFromExtensionMultiplication: true,
      arbitraryPathClassesUsedAsHolonomy: false,
      affineLinearPartsRetainedRatherThanCollapsedToTranslations: true,
      baseMovingPathCoherenceImplemented: false,
      matrixLocalSystemEscapeFound: false,
      autonomousAdmissionLawEstablished: false,
      noveltyOrNoPriorArtEstablished: false,
      nonSoficityOrMachineLearningArchitectureEstablished: false,
      hodgeOrNavierStokesConsequenceEstablished: false,
    },
  };
  return { ...body, certificateDigest: digest(body) };
}

function buildRun() {
  const lab = buildLaboratory();
  return {
    schema: "oasis.genesis-matrix-local-system-escape.v1",
    status: "PASS",
    result: {
      H1H2H3Dimensions: [1, 1, 1],
      liftableH2Classes: 1,
      nonzeroH2ClassLiftable: false,
      persistentDimension: lab.persistentCoordinateBasis.length,
      actualEnactedDimension: Math.max(...lab.classRecords.map((record) => (
        record.fixedBaseLiftConjugation.enactedH2Dimension
      ))),
      residualBocksteinHomologyDimension: lab.residualDimension,
      invariantDirectSummandSpectator: false,
      candidateFound: false,
    },
    certificate: buildCertificate(lab),
  };
}

let referenceCertificateCanonical;

export function replayGenesisMatrixLocalSystemEscapeCertificate(candidate) {
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
    ["action", (value) => { value.model.generatorAction = "identity"; }],
    ["H2 dimension", (value) => { value.normalizedBarCohomology.H2.cohomologyDimension = 2; }],
    ["Bockstein H1", (value) => { value.normalizedBockstein.H1ToH2.rank = 1; }],
    ["Bockstein H2", (value) => { value.normalizedBockstein.H2ToH3.rank = 0; }],
    ["integral Bockstein", (value) => {
      value.normalizedBockstein.integralPeriodicCrossCheck
        .integralBocksteinH2VToH3LIsIsomorphism = false;
    }],
    ["persistent", (value) => { value.normalizedBockstein.persistentDimension = 1; }],
    ["residual", (value) => { value.normalizedBockstein.residualBocksteinHomologyDimension = 1; }],
    ["indecomposable", (value) => { value.moduleStructure.moduleIndecomposable = false; }],
    ["spectator", (value) => { value.moduleStructure.directSummandSpectatorExists = true; }],
    ["class count", (value) => { value.H2ClassCensus.classesEnumerated = 1; }],
    ["liftability", (value) => { value.H2ClassCensus.records[1].liftableToMod4MatrixLocalSystem = true; }],
    ["V associativity", (value) => { value.H2ClassCensus.records[0].VExtension.associativityChecks -= 1; }],
    ["B associativity", (value) => { value.H2ClassCensus.records[0].BExtension.associativityChecks -= 1; }],
    ["fixed-base gate", (value) => {
      value.H2ClassCensus.records[0].fixedBaseLiftConjugation.arbitraryConjugationsAdmitted = true;
    }],
    ["affine composition", (value) => {
      value.H2ClassCensus.records[0].fixedBaseLiftConjugation
        .baseFixedAffineHolonomy.affineCompositionChecks -= 1;
    }],
    ["enacted image", (value) => {
      value.H2ClassCensus.records[0].fixedBaseLiftConjugation.enactedH2Dimension = 1;
    }],
    ["candidate", (value) => { value.searchVerdict.candidateFound = true; }],
    ["admission overclaim", (value) => { value.theoremBoundary.autonomousAdmissionLawEstablished = true; }],
    ["path coherence overclaim", (value) => { value.theoremBoundary.baseMovingPathCoherenceImplemented = true; }],
    ["novelty overclaim", (value) => { value.theoremBoundary.noveltyOrNoPriorArtEstablished = true; }],
    ["digest", (value) => { value.certificateDigest = "0".repeat(64); }],
    ["extra field", (value) => { value.extra = true; }],
  ];
  const cases = mutations.map(([name, mutate]) => {
    const candidate = clone(certificate);
    mutate(candidate);
    return { name, rejected: !replayGenesisMatrixLocalSystemEscapeCertificate(candidate).ok };
  });
  assert(cases.every(({ rejected }) => rejected));
  return {
    attempted: cases.length,
    rejected: cases.filter(({ rejected }) => rejected).length,
    cases,
  };
}

export function runGenesisMatrixLocalSystemEscape() {
  const run = buildRun();
  referenceCertificateCanonical = canonical(run.certificate);
  return { ...run, tamper: auditTamper(run.certificate) };
}

function printSummary(run) {
  console.log("PASS normalized bar cohomology: dim H1=dim H2=dim H3=1");
  console.log("PASS exact matrix Bockstein: beta1=0 and beta2 is injective");
  console.log("PASS extension census: both V-extensions exact; only the split class lifts to B");
  console.log("PASS actual transport: fixed-base marked lift conjugations derived from group multiplication");
  console.log("PASS spectator control: V is indecomposable with no invariant direct complement");
  console.log("NO-GO this model has P=0, enacted image=0, and residual Bockstein homology=0");
  console.log("PASS replay/tamper: " + String(run.tamper.rejected) + "/" + String(run.tamper.attempted));
  console.log("BOUNDARY no admission, novelty, non-soficity, ML, Hodge, or Navier-Stokes claim");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = runGenesisMatrixLocalSystemEscape();
  printSummary(run);
  console.log(JSON.stringify(run, null, 2));
}
