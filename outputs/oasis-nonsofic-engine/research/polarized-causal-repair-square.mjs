import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function rational(numerator, denominator = 1n) {
  const rawNumerator = typeof numerator === "bigint" ? numerator : BigInt(numerator);
  const rawDenominator = typeof denominator === "bigint" ? denominator : BigInt(denominator);
  assert(rawDenominator !== 0n);
  let n = rawNumerator;
  let d = rawDenominator;
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const divisor = gcd(n, d);
  return Object.freeze({ n: n / divisor, d: d / divisor });
}

const ZERO = rational(0n);
const ONE = rational(1n);
const TWO = rational(2n);
const HALF = rational(1n, 2n);
const QUARTER = rational(1n, 4n);

function asRational(value) {
  if (value && typeof value === "object" && typeof value.n === "bigint" && typeof value.d === "bigint") {
    return value;
  }
  assert(typeof value === "bigint" || Number.isSafeInteger(value));
  return rational(typeof value === "bigint" ? value : BigInt(value));
}

function add(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return rational(a.n * b.d + b.n * a.d, a.d * b.d);
}

function subtract(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return rational(a.n * b.d - b.n * a.d, a.d * b.d);
}

function multiply(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return rational(a.n * b.n, a.d * b.d);
}

function divide(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  assert(b.n !== 0n);
  return rational(a.n * b.d, a.d * b.n);
}

function negate(value) {
  const item = asRational(value);
  return rational(-item.n, item.d);
}

function equal(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return a.n === b.n && a.d === b.d;
}

function compare(left, right) {
  const difference = subtract(left, right);
  return difference.n < 0n ? -1 : difference.n > 0n ? 1 : 0;
}

function rationalString(value) {
  const item = asRational(value);
  return `${item.n}/${item.d}`;
}

function matrix(rows) {
  assert(Array.isArray(rows) && rows.length > 0);
  const width = rows[0].length;
  assert(width > 0 && rows.every((row) => Array.isArray(row) && row.length === width));
  return rows.map((row) => row.map(asRational));
}

function zeroMatrix(rows, columns) {
  assert(rows > 0 && columns > 0);
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => ZERO));
}

function identityMatrix(size) {
  return Array.from({ length: size }, (_, row) => (
    Array.from({ length: size }, (__, column) => (row === column ? ONE : ZERO))
  ));
}

function transpose(value) {
  return Array.from({ length: value[0].length }, (_, row) => (
    Array.from({ length: value.length }, (__, column) => value[column][row])
  ));
}

function addMatrices(left, right) {
  assert.equal(left.length, right.length);
  assert.equal(left[0].length, right[0].length);
  return left.map((row, i) => row.map((value, j) => add(value, right[i][j])));
}

function subtractMatrices(left, right) {
  assert.equal(left.length, right.length);
  assert.equal(left[0].length, right[0].length);
  return left.map((row, i) => row.map((value, j) => subtract(value, right[i][j])));
}

function scaleMatrix(scale, value) {
  return value.map((row) => row.map((entry) => multiply(scale, entry)));
}

function negateMatrix(value) {
  return scaleMatrix(rational(-1n), value);
}

function multiplyMatrices(left, right) {
  assert.equal(left[0].length, right.length);
  return Array.from({ length: left.length }, (_, row) => (
    Array.from({ length: right[0].length }, (__, column) => {
      let total = ZERO;
      for (let middle = 0; middle < right.length; middle += 1) {
        total = add(total, multiply(left[row][middle], right[middle][column]));
      }
      return total;
    })
  ));
}

function matrixEqual(left, right) {
  return left.length === right.length
    && left[0].length === right[0].length
    && left.every((row, i) => row.every((value, j) => equal(value, right[i][j])));
}

function serializeMatrix(value) {
  return value.map((row) => row.map(rationalString));
}

function matrixKey(value) {
  return serializeMatrix(value).map((row) => row.join(",")).join(";");
}

function determinant(value) {
  assert.equal(value.length, value[0].length);
  if (value.length === 1) return value[0][0];
  let total = ZERO;
  for (let column = 0; column < value.length; column += 1) {
    const minor = value.slice(1).map((row) => row.filter((_, index) => index !== column));
    const term = multiply(value[0][column], determinant(minor));
    total = column % 2 === 0 ? add(total, term) : subtract(total, term);
  }
  return total;
}

function rationalRank(value) {
  const work = value.map((row) => [...row]);
  const rows = work.length;
  const columns = work[0].length;
  let rank = 0;
  for (let column = 0; column < columns && rank < rows; column += 1) {
    const pivot = work.findIndex((row, index) => index >= rank && row[column].n !== 0n);
    if (pivot === -1) continue;
    [work[rank], work[pivot]] = [work[pivot], work[rank]];
    const pivotValue = work[rank][column];
    work[rank] = work[rank].map((entry) => divide(entry, pivotValue));
    for (let row = 0; row < rows; row += 1) {
      if (row === rank || work[row][column].n === 0n) continue;
      const factor = work[row][column];
      work[row] = work[row].map((entry, index) => (
        subtract(entry, multiply(factor, work[rank][index]))
      ));
    }
    rank += 1;
  }
  return rank;
}

function isSymmetric(value) {
  return matrixEqual(value, transpose(value));
}

function principalSubmatrix(value, indices) {
  return indices.map((row) => indices.map((column) => value[row][column]));
}

function subsets(size) {
  const result = [];
  for (let mask = 1; mask < 2 ** size; mask += 1) {
    result.push(Array.from({ length: size }, (_, index) => index).filter((index) => (mask >> index) & 1));
  }
  return result;
}

function psdAudit(value) {
  assert(isSymmetric(value));
  const principalMinors = subsets(value.length).map((indices) => ({
    indices,
    determinant: determinant(principalSubmatrix(value, indices)),
  }));
  return {
    positiveSemidefinite: principalMinors.every(({ determinant: item }) => compare(item, ZERO) >= 0),
    principalMinors: principalMinors.map(({ indices, determinant: item }) => ({
      indices,
      determinant: rationalString(item),
    })),
  };
}

function gram(map, polarization) {
  return multiplyMatrices(transpose(map), multiplyMatrices(polarization, map));
}

function quadraticValue(form, vector) {
  const column = vector.map((value) => [asRational(value)]);
  return multiplyMatrices(transpose(column), multiplyMatrices(form, column))[0][0];
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function rankF2(value) {
  if (value.length === 0 || value[0].length === 0) return 0;
  const work = value.map((row) => row.map((entry) => entry & 1));
  let rank = 0;
  for (let column = 0; column < work[0].length && rank < work.length; column += 1) {
    const pivot = work.findIndex((row, index) => index >= rank && row[column] === 1);
    if (pivot === -1) continue;
    [work[rank], work[pivot]] = [work[pivot], work[rank]];
    for (let row = 0; row < work.length; row += 1) {
      if (row !== rank && work[row][column] === 1) {
        work[row] = work[row].map((entry, index) => entry ^ work[rank][index]);
      }
    }
    rank += 1;
  }
  return rank;
}

function multiplyF2(left, right) {
  assert.equal(left[0].length, right.length);
  if (right[0].length === 0) return left.map(() => []);
  return Array.from({ length: left.length }, (_, row) => (
    Array.from({ length: right[0].length }, (__, column) => {
      let total = 0;
      for (let middle = 0; middle < right.length; middle += 1) {
        total ^= left[row][middle] & right[middle][column];
      }
      return total;
    })
  ));
}

const ORIENTED_SQUARE_BOUNDARY = Object.freeze([
  Object.freeze({ edge: "q", coefficient: 1 }),
  Object.freeze({ edge: "r|q", coefficient: 1 }),
  Object.freeze({ edge: "q|r", coefficient: -1 }),
  Object.freeze({ edge: "r", coefficient: -1 }),
]);

function serializeInterchangeWitness(witness) {
  if (witness === null) return null;
  return {
    id: witness.id,
    endpointGauge: serializeMatrix(witness.endpointGauge),
    orientedBoundary: witness.orientedBoundary.map(({ edge, coefficient }) => ({ edge, coefficient })),
  };
}

function validateInterchangeWitness(witness, routeT, routeS) {
  if (witness === null) {
    return {
      present: false,
      compatible: null,
      attachesTwoCell: false,
      reason: "commutation alone does not create a coherence witness",
    };
  }
  assert.equal(typeof witness.id, "string");
  assert(witness.id.length > 0);
  assert(matrixEqual(witness.endpointGauge, identityMatrix(2)));
  assert(isOrthogonal(witness.endpointGauge));
  assert.deepEqual(witness.orientedBoundary, ORIENTED_SQUARE_BOUNDARY);
  assert(matrixEqual(multiplyMatrices(witness.endpointGauge, routeT), routeS));
  return {
    present: true,
    id: witness.id,
    endpointGaugeIsIdentity: true,
    orientedBoundaryValidated: true,
    compatible: true,
    attachesTwoCell: true,
  };
}

function buildSquareComplex(interchangeWitness) {
  const vertices = ["X", "qX", "rX", "qrX"];
  const edges = [
    { id: "q", tail: 0, head: 1 },
    { id: "r|q", tail: 1, head: 3 },
    { id: "r", tail: 0, head: 2 },
    { id: "q|r", tail: 2, head: 3 },
  ];
  const boundary1 = vertices.map((_, vertex) => edges.map(({ tail, head }) => Number(tail === vertex || head === vertex)));
  const witnessPresent = interchangeWitness !== null;
  const boundaryCoefficient = new Map(
    witnessPresent
      ? interchangeWitness.orientedBoundary.map(({ edge, coefficient }) => [edge, Math.abs(coefficient) & 1])
      : [],
  );
  const boundary2 = edges.map(({ id }) => (witnessPresent ? [boundaryCoefficient.get(id) ?? 0] : []));
  const rankD1 = rankF2(boundary1);
  const rankD2 = rankF2(boundary2);
  const squareZero = multiplyF2(boundary1, boundary2).every((row) => row.every((entry) => entry === 0));
  assert(squareZero);
  const h0 = vertices.length - rankD1;
  const h1 = edges.length - rankD1 - rankD2;
  const h2 = (witnessPresent ? 1 : 0) - rankD2;
  assert.equal(rankD1, 3);
  assert.equal(rankD2, witnessPresent ? 1 : 0);
  assert.equal(h0, 1);
  assert.equal(h1, witnessPresent ? 0 : 1);
  assert.equal(h2, 0);
  return {
    cells: { c0: vertices.length, c1: edges.length, c2: witnessPresent ? 1 : 0 },
    vertices,
    edges,
    interchangeWitness: serializeInterchangeWitness(interchangeWitness),
    boundaryMatrices: { d1: boundary1, d2: boundary2 },
    boundaryRanks: { d1: rankD1, d2: rankD2 },
    homologyDimensionsF2: { h0, h1, h2 },
    squareZero,
    reconstructedFromSerializedCells: true,
  };
}

function makeFixtures() {
  const I = identityMatrix(2);
  const Z = zeroMatrix(2, 2);
  const A = matrix([[1, 0], [0, 0]]);
  const C = matrix([[0, 0], [0, 1]]);
  const B = matrix([[HALF, HALF], [HALF, HALF]]);
  const R = matrix([[1, 0], [0, -1]]);
  const J = matrix([[0, 1], [1, 0]]);
  const witnessA = {
    id: "theta-A-commuting-square",
    endpointGauge: I,
    orientedBoundary: ORIENTED_SQUARE_BOUNDARY,
  };
  return [
    {
      id: "A",
      description: "commuting orthogonal-coordinate projections with a certified filler",
      first: A,
      second: C,
      firstDissipation: matrix([[0, 0], [0, 1]]),
      secondDissipation: matrix([[1, 0], [0, 0]]),
      firstFlux: Z,
      secondFlux: Z,
      polarization: I,
      interchangeWitness: witnessA,
      expectedClass: "commuting-filled",
    },
    {
      id: "B",
      description: "noncommuting dissipative orthogonal projections",
      first: A,
      second: B,
      firstDissipation: matrix([[0, 0], [0, 1]]),
      secondDissipation: matrix([[HALF, negate(HALF)], [negate(HALF), HALF]]),
      firstFlux: Z,
      secondFlux: Z,
      polarization: I,
      interchangeWitness: null,
      expectedClass: "noncommuting-dissipative",
    },
    {
      id: "C",
      description: "noncommuting orthogonal repairs with zero edge dissipation",
      first: R,
      second: J,
      firstDissipation: Z,
      secondDissipation: Z,
      firstFlux: Z,
      secondFlux: Z,
      polarization: I,
      interchangeWitness: null,
      expectedClass: "noncommuting-zero-dissipation",
    },
    {
      id: "D",
      description: "the same commuting maps as A without a serialized interchange witness",
      first: A,
      second: C,
      firstDissipation: matrix([[0, 0], [0, 1]]),
      secondDissipation: matrix([[1, 0], [0, 0]]),
      firstFlux: Z,
      secondFlux: Z,
      polarization: I,
      interchangeWitness: null,
      expectedClass: "commuting-unfilled-no-witness",
    },
  ];
}

function edgeBalance(map, polarization, dissipation, flux) {
  const left = subtractMatrices(gram(map, polarization), polarization);
  const right = addMatrices(negateMatrix(dissipation), flux);
  return matrixEqual(left, right);
}

function fixtureCore(definition) {
  const { first, second, polarization: P } = definition;
  const T = multiplyMatrices(second, first);
  const S = multiplyMatrices(first, second);
  const kappa = subtractMatrices(T, S);
  const midpoint = scaleMatrix(HALF, addMatrices(T, S));
  const curvatureGram = gram(kappa, P);
  const routeTGram = gram(T, P);
  const routeSGram = gram(S, P);
  const midpointGram = gram(midpoint, P);
  const parallelogramLeft = scaleMatrix(HALF, addMatrices(routeTGram, routeSGram));
  const parallelogramRight = addMatrices(midpointGram, scaleMatrix(QUARTER, curvatureGram));
  const signedEndpoint = subtractMatrices(routeTGram, routeSGram);
  const signedPairing = addMatrices(
    multiplyMatrices(transpose(midpoint), multiplyMatrices(P, kappa)),
    multiplyMatrices(transpose(kappa), multiplyMatrices(P, midpoint)),
  );

  const pathDissipationT = addMatrices(
    definition.firstDissipation,
    multiplyMatrices(transpose(first), multiplyMatrices(definition.secondDissipation, first)),
  );
  const pathDissipationS = addMatrices(
    definition.secondDissipation,
    multiplyMatrices(transpose(second), multiplyMatrices(definition.firstDissipation, second)),
  );
  const pathFluxT = addMatrices(
    definition.firstFlux,
    multiplyMatrices(transpose(first), multiplyMatrices(definition.secondFlux, first)),
  );
  const pathFluxS = addMatrices(
    definition.secondFlux,
    multiplyMatrices(transpose(second), multiplyMatrices(definition.firstFlux, second)),
  );
  const deltaDissipation = subtractMatrices(pathDissipationT, pathDissipationS);
  const deltaFlux = subtractMatrices(pathFluxT, pathFluxS);
  const signedBalance = subtractMatrices(deltaFlux, deltaDissipation);
  const routeBalanceT = matrixEqual(
    subtractMatrices(routeTGram, P),
    addMatrices(negateMatrix(pathDissipationT), pathFluxT),
  );
  const routeBalanceS = matrixEqual(
    subtractMatrices(routeSGram, P),
    addMatrices(negateMatrix(pathDissipationS), pathFluxS),
  );
  const witnessAudit = validateInterchangeWitness(definition.interchangeWitness, T, S);
  const topology = buildSquareComplex(definition.interchangeWitness);

  const firstPsd = psdAudit(definition.firstDissipation);
  const secondPsd = psdAudit(definition.secondDissipation);
  const pathTPsd = psdAudit(pathDissipationT);
  const pathSPsd = psdAudit(pathDissipationS);
  const commute = matrixEqual(T, S);
  if (definition.interchangeWitness !== null) assert(commute);
  assert(edgeBalance(first, P, definition.firstDissipation, definition.firstFlux));
  assert(edgeBalance(second, P, definition.secondDissipation, definition.secondFlux));
  assert(routeBalanceT && routeBalanceS);
  assert(matrixEqual(parallelogramLeft, parallelogramRight));
  assert(matrixEqual(signedEndpoint, signedPairing));
  assert(matrixEqual(signedBalance, signedEndpoint));
  assert(firstPsd.positiveSemidefinite && secondPsd.positiveSemidefinite);
  assert(pathTPsd.positiveSemidefinite && pathSPsd.positiveSemidefinite);

  return {
    definition,
    T,
    S,
    kappa,
    midpoint,
    curvatureGram,
    routeTGram,
    routeSGram,
    signedEndpoint,
    signedPairing,
    pathDissipationT,
    pathDissipationS,
    pathFluxT,
    pathFluxS,
    deltaDissipation,
    deltaFlux,
    signedBalance,
    topology,
    witnessAudit,
    commute,
    kappaRank: rationalRank(kappa),
    identities: {
      firstEdgeBalance: true,
      secondEdgeBalance: true,
      routeTBalance: routeBalanceT,
      routeSBalance: routeBalanceS,
      parallelogram: true,
      signedEndpointPairing: true,
      signedPathBalance: true,
    },
    psd: {
      first: firstPsd,
      second: secondPsd,
      pathT: pathTPsd,
      pathS: pathSPsd,
    },
  };
}

function conjugate(value, gauge) {
  return multiplyMatrices(gauge, multiplyMatrices(value, transpose(gauge)));
}

function conjugateFixture(definition, gauge) {
  return {
    ...definition,
    id: `${definition.id}-conjugated`,
    first: conjugate(definition.first, gauge),
    second: conjugate(definition.second, gauge),
    firstDissipation: conjugate(definition.firstDissipation, gauge),
    secondDissipation: conjugate(definition.secondDissipation, gauge),
    firstFlux: conjugate(definition.firstFlux, gauge),
    secondFlux: conjugate(definition.secondFlux, gauge),
    polarization: conjugate(definition.polarization, gauge),
    interchangeWitness: definition.interchangeWitness === null ? null : {
      ...definition.interchangeWitness,
      endpointGauge: conjugate(definition.interchangeWitness.endpointGauge, gauge),
      orientedBoundary: definition.interchangeWitness.orientedBoundary,
    },
  };
}

function auditConjugacy(definition, original) {
  const Q = matrix([[rational(3n, 5n), rational(-4n, 5n)], [rational(4n, 5n), rational(3n, 5n)]]);
  assert(matrixEqual(multiplyMatrices(transpose(Q), Q), identityMatrix(2)));
  const transformed = fixtureCore(conjugateFixture(definition, Q));
  const covariantFields = [
    "T",
    "S",
    "kappa",
    "midpoint",
    "curvatureGram",
    "routeTGram",
    "routeSGram",
    "signedEndpoint",
    "pathDissipationT",
    "pathDissipationS",
    "signedBalance",
  ];
  for (const field of covariantFields) {
    assert(matrixEqual(transformed[field], conjugate(original[field], Q)), `${definition.id} conjugacy failed for ${field}`);
  }
  assert.equal(transformed.kappaRank, original.kappaRank);
  assert.deepEqual(transformed.topology.boundaryRanks, original.topology.boundaryRanks);
  assert.deepEqual(transformed.topology.homologyDimensionsF2, original.topology.homologyDimensionsF2);
  return {
    gauge: serializeMatrix(Q),
    rationalOrthogonal: true,
    exactCovarianceFields: covariantFields,
    rankPreserved: true,
    topologyPreserved: true,
  };
}

function auditRouteSwap(definition, original) {
  const swappedDefinition = {
    ...definition,
    id: `${definition.id}-route-swapped`,
    first: definition.second,
    second: definition.first,
    firstDissipation: definition.secondDissipation,
    secondDissipation: definition.firstDissipation,
    firstFlux: definition.secondFlux,
    secondFlux: definition.firstFlux,
  };
  const swapped = fixtureCore(swappedDefinition);
  assert(matrixEqual(swapped.T, original.S));
  assert(matrixEqual(swapped.S, original.T));
  assert(matrixEqual(swapped.kappa, negateMatrix(original.kappa)));
  assert(matrixEqual(swapped.midpoint, original.midpoint));
  assert(matrixEqual(swapped.curvatureGram, original.curvatureGram));
  assert(matrixEqual(swapped.signedEndpoint, negateMatrix(original.signedEndpoint)));
  assert(matrixEqual(swapped.deltaDissipation, negateMatrix(original.deltaDissipation)));
  assert(matrixEqual(swapped.signedBalance, negateMatrix(original.signedBalance)));
  return {
    routesExchanged: true,
    kappaNegated: true,
    midpointFixed: true,
    curvatureActionFixed: true,
    signedEndpointNegated: true,
    signedBalanceNegated: true,
  };
}

function deduplicateRepairs(repairs) {
  const bySemanticMap = new Map();
  for (const repair of repairs) {
    const key = matrixKey(repair.map);
    if (!bySemanticMap.has(key)) bySemanticMap.set(key, repair.map);
  }
  return [...bySemanticMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([semanticKey, map]) => ({ semanticKey, map }));
}

function auditSemanticDeduplication(definition) {
  const original = deduplicateRepairs([
    { presentation: "first", map: definition.first },
    { presentation: "second", map: definition.second },
  ]);
  const duplicatedAndReordered = deduplicateRepairs([
    { presentation: "first-alias", map: definition.first.map((row) => [...row]) },
    { presentation: "second", map: definition.second },
    { presentation: "first", map: definition.first },
  ]);
  assert.equal(original.length, 2);
  assert.equal(duplicatedAndReordered.length, 2);
  assert.deepEqual(original.map(({ semanticKey }) => semanticKey), duplicatedAndReordered.map(({ semanticKey }) => semanticKey));
  return {
    presentationsBefore: 3,
    semanticRepairsAfter: 2,
    unorderedRepairPairsAfter: 1,
    duplicateCreatesNewCell: false,
    canonicalSemanticKeysPreserved: true,
  };
}

function isOrthogonal(value, polarization = identityMatrix(value.length)) {
  return matrixEqual(gram(value, polarization), polarization);
}

function authorizedGauge(value, registry) {
  return registry.some((candidate) => matrixEqual(candidate, value));
}

function auditUnauthorizedGauge(fixtureC) {
  const minusIdentity = negateMatrix(identityMatrix(2));
  const registry = [identityMatrix(2)];
  assert(isOrthogonal(minusIdentity));
  assert(matrixEqual(multiplyMatrices(minusIdentity, fixtureC.T), fixtureC.S));
  assert(!authorizedGauge(minusIdentity, registry));
  assert(authorizedGauge(identityMatrix(2), registry));
  return {
    registry: registry.map(serializeMatrix),
    attemptedGauge: serializeMatrix(minusIdentity),
    attemptedGaugeRationalOrthogonal: true,
    attemptedGaugeWouldTrivializeFixtureCComparison: true,
    authorized: false,
    rejected: true,
    policy: "only serialized semantic endpoint gauges are admissible; algebraic isometry alone is insufficient",
  };
}

function summarizeFixture(core, conjugacy, routeSwap, deduplication) {
  const sample = [ONE, ZERO];
  return {
    id: core.definition.id,
    description: core.definition.description,
    expectedClass: core.definition.expectedClass,
    polarization: serializeMatrix(core.definition.polarization),
    atomicRepairs: {
      first: serializeMatrix(core.definition.first),
      second: serializeMatrix(core.definition.second),
    },
    declaredEdgeData: {
      firstDissipation: serializeMatrix(core.definition.firstDissipation),
      secondDissipation: serializeMatrix(core.definition.secondDissipation),
      firstFlux: serializeMatrix(core.definition.firstFlux),
      secondFlux: serializeMatrix(core.definition.secondFlux),
    },
    routes: {
      TSecondAfterFirst: serializeMatrix(core.T),
      SFirstAfterSecond: serializeMatrix(core.S),
      commute: core.commute,
      kappa: serializeMatrix(core.kappa),
      kappaRank: core.kappaRank,
      midpoint: serializeMatrix(core.midpoint),
      curvatureGram: serializeMatrix(core.curvatureGram),
      sampleVector: sample.map(rationalString),
      sampleTAction: rationalString(quadraticValue(core.routeTGram, sample)),
      sampleSAction: rationalString(quadraticValue(core.routeSGram, sample)),
      sampleCurvatureAction: rationalString(quadraticValue(core.curvatureGram, sample)),
    },
    pathBalance: {
      pathDissipationT: serializeMatrix(core.pathDissipationT),
      pathDissipationS: serializeMatrix(core.pathDissipationS),
      deltaDissipationTMinusS: serializeMatrix(core.deltaDissipation),
      deltaFluxTMinusS: serializeMatrix(core.deltaFlux),
      signedEndpointTMinusS: serializeMatrix(core.signedEndpoint),
      signedBalanceDeltaFluxMinusDeltaDissipation: serializeMatrix(core.signedBalance),
    },
    identities: core.identities,
    psdAudits: core.psd,
    interchangeWitness: serializeInterchangeWitness(core.definition.interchangeWitness),
    interchangeWitnessAudit: core.witnessAudit,
    causalComplex: core.topology,
    conjugacy,
    routeSwap,
    semanticDeduplication: deduplication,
  };
}

function buildCertificate() {
  const definitions = makeFixtures();
  const cores = definitions.map(fixtureCore);
  const summaries = definitions.map((definition, index) => summarizeFixture(
    cores[index],
    auditConjugacy(definition, cores[index]),
    auditRouteSwap(definition, cores[index]),
    auditSemanticDeduplication(definition),
  ));

  const [fixtureA, fixtureB, fixtureC, fixtureD] = cores;
  assert.equal(fixtureA.topology.homologyDimensionsF2.h1, 0);
  assert.equal(fixtureB.topology.homologyDimensionsF2.h1, 1);
  assert.equal(fixtureC.topology.homologyDimensionsF2.h1, 1);
  assert.equal(fixtureD.topology.homologyDimensionsF2.h1, 1);
  assert.deepEqual(fixtureB.topology, fixtureC.topology);
  assert(matrixEqual(fixtureA.definition.first, fixtureD.definition.first));
  assert(matrixEqual(fixtureA.definition.second, fixtureD.definition.second));
  assert(fixtureA.commute && fixtureD.commute);
  assert.equal(fixtureA.witnessAudit.present, true);
  assert.equal(fixtureD.witnessAudit.present, false);
  assert.equal(fixtureB.kappaRank, 2);
  assert.equal(fixtureC.kappaRank, 2);
  assert(!matrixEqual(fixtureB.pathDissipationT, zeroMatrix(2, 2)));
  assert(matrixEqual(fixtureC.pathDissipationT, zeroMatrix(2, 2)));
  assert(matrixEqual(fixtureC.pathDissipationS, zeroMatrix(2, 2)));
  const unauthorizedGaugeAudit = auditUnauthorizedGauge(fixtureC);

  const body = {
    schema: "oasis.polarized-causal-repair-square.certificate.v2",
    experiment: "polarized-causal-repair-square",
    arithmetic: {
      coefficientField: "Q",
      representation: "normalized BigInt numerator/denominator",
      stochasticChoices: 0,
      tolerance: 0,
    },
    cellularPolicy: {
      coefficients: "F2",
      vertices: ["X", "qX", "rX", "qrX"],
      edgeOrder: ["q", "r|q", "r", "q|r"],
      fillerPolicy: "attach the square 2-cell only with a serialized semantic interchange witness",
      witnessCompatibilityPolicy: "a witness must have the declared oriented boundary, identity endpoint gauge, and compatible routes; commuting routes without a witness remain unfilled",
      endpointGaugePolicy: "identity only in these fixtures; unregistered orthogonal comparisons are rejected",
      boundaryMatricesReconstructedFromCells: true,
    },
    theorem: {
      parallelogram: "(T^TPT+S^TPS)/2=M^TPM+(T-S)^TP(T-S)/4",
      signedEndpoint: "T^TPT-S^TPS=M^TP(T-S)+(T-S)^TPM",
      edgeBalance: "R^TPR-P=-D_R+F_R",
      signedPathBalance: "DeltaF-DeltaD=T^TPT-S^TPS",
    },
    fixtures: summaries,
    crossFixtureAudit: {
      fixtureAFilledH1: fixtureA.topology.homologyDimensionsF2.h1,
      fixtureDUnfilledH1: fixtureD.topology.homologyDimensionsF2.h1,
      fixturesAAndDHaveIdenticalCommutingRepairMaps: true,
      fixtureAHasSerializedWitness: true,
      fixtureDHasNoSerializedWitness: true,
      commutationDoesNotCreateFiller: true,
      fixturesBAndCUnfilledH1: fixtureB.topology.homologyDimensionsF2.h1,
      fixturesBAndCIdenticalUnpolarizedCausalComplex: true,
      fixturesBAndCSameKappaRank: true,
      fixtureBHasNonzeroDissipation: true,
      fixtureCHasZeroEdgeAndPathDissipation: true,
      witnessConclusion: "A and D commute identically, but only A has a serialized witness and attached 2-cell",
      conclusion: "polarized path data distinguishes B from C while their serialized unpolarized square complexes agree",
    },
    unauthorizedGaugeAudit,
    replayPolicy: "rebuild all rational matrices, cellular boundaries, identities, and audits; compare canonical payload and SHA-256 digest",
    theoremBoundary: {
      finiteLinearTheoremOnly: true,
      exactRationalArithmeticOnly: true,
      compactnessResult: false,
      infiniteAssemblyResult: false,
      interchangeWitnessDerivedFromCommutation: false,
      primitiveNerveDegreeLowering: false,
      frontierRealization: false,
      navierStokesResult: false,
      hodgeResult: false,
      collatzResult: false,
      riemannHypothesisResult: false,
      nonSoficityResult: false,
      noveltyClaim: false,
    },
  };
  return { ...body, certificateDigest: digest(body) };
}

function validateCertificate(candidate, expected) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  const { certificateDigest, ...body } = candidate;
  if (certificateDigest !== digest(body)) return false;
  return canonical(candidate) === canonical(expected);
}

export function replayPolarizedCausalRepairSquareCertificate(candidate) {
  return validateCertificate(candidate, buildCertificate());
}

function tamperSuite(certificate) {
  const cases = [];
  function reject(name, mutate, reseal = true) {
    const tampered = cloneJson(certificate);
    mutate(tampered);
    if (reseal) {
      const { certificateDigest: ignored, ...body } = tampered;
      tampered.certificateDigest = digest(body);
    }
    const rejected = !validateCertificate(tampered, certificate);
    assert(rejected, `tamper accepted: ${name}`);
    cases.push({ name, rejected });
  }
  reject("schema", (value) => { value.schema = "oasis.polarized-causal-repair-square.certificate.v1"; });
  reject("arithmetic tolerance", (value) => { value.arithmetic.tolerance = 1e-12; });
  reject("cell edge order", (value) => { value.cellularPolicy.edgeOrder.reverse(); });
  reject("fixture A filler count", (value) => { value.fixtures[0].causalComplex.cells.c2 = 0; });
  reject("fixture A H1", (value) => { value.fixtures[0].causalComplex.homologyDimensionsF2.h1 = 1; });
  reject("fixture A boundary bit", (value) => { value.fixtures[0].causalComplex.boundaryMatrices.d2[0][0] = 0; });
  reject("fixture A witness id", (value) => { value.fixtures[0].interchangeWitness.id = "forged-theta"; });
  reject("fixture A witness boundary", (value) => { value.fixtures[0].interchangeWitness.orientedBoundary[0].coefficient = -1; });
  reject("fixture A witness gauge", (value) => { value.fixtures[0].interchangeWitness.endpointGauge[0][0] = "-1/1"; });
  reject("fixture B repair matrix", (value) => { value.fixtures[1].atomicRepairs.second[0][0] = "3/5"; });
  reject("fixture B commutation", (value) => { value.fixtures[1].routes.commute = true; });
  reject("fixture B kappa rank", (value) => { value.fixtures[1].routes.kappaRank = 1; });
  reject("fixture B signed balance", (value) => { value.fixtures[1].identities.signedPathBalance = false; });
  reject("fixture B PSD", (value) => { value.fixtures[1].psdAudits.second.positiveSemidefinite = false; });
  reject("fixture C dissipation", (value) => { value.fixtures[2].pathBalance.pathDissipationT[0][0] = "1/1"; });
  reject("fixture D invented witness", (value) => { value.fixtures[3].interchangeWitness = cloneJson(value.fixtures[0].interchangeWitness); });
  reject("fixture D H1", (value) => { value.fixtures[3].causalComplex.homologyDimensionsF2.h1 = 0; });
  reject("parallelogram theorem", (value) => { value.theorem.parallelogram = "false"; });
  reject("rational conjugacy", (value) => { value.fixtures[1].conjugacy.rankPreserved = false; });
  reject("route swap", (value) => { value.fixtures[2].routeSwap.kappaNegated = false; });
  reject("semantic duplicate", (value) => { value.fixtures[1].semanticDeduplication.semanticRepairsAfter = 3; });
  reject("cross-fixture topology", (value) => { value.crossFixtureAudit.fixturesBAndCIdenticalUnpolarizedCausalComplex = false; });
  reject("unauthorized gauge", (value) => { value.unauthorizedGaugeAudit.authorized = true; });
  reject("compactness overclaim", (value) => { value.theoremBoundary.compactnessResult = true; });
  reject("witness derivation overclaim", (value) => { value.theoremBoundary.interchangeWitnessDerivedFromCommutation = true; });
  reject("frontier overclaim", (value) => { value.theoremBoundary.riemannHypothesisResult = true; });
  reject("novelty overclaim", (value) => { value.theoremBoundary.noveltyClaim = true; });
  reject("certificate digest", (value) => { value.certificateDigest = "f".repeat(64); }, false);
  return cases;
}

export function runPolarizedCausalRepairSquare() {
  const firstCertificate = buildCertificate();
  const secondCertificate = buildCertificate();
  assert.equal(canonical(firstCertificate), canonical(secondCertificate));
  assert.equal(firstCertificate.certificateDigest, secondCertificate.certificateDigest);
  assert(validateCertificate(firstCertificate, secondCertificate));
  assert(replayPolarizedCausalRepairSquareCertificate(firstCertificate));
  const tamperCases = tamperSuite(firstCertificate);
  return {
    schema: "oasis.polarized-causal-repair-square.result.v2",
    experiment: "polarized-causal-repair-square",
    status: "PASS",
    result: {
      fixtures: firstCertificate.fixtures.map(({ id, routes, causalComplex, expectedClass }) => ({
        id,
        expectedClass,
        commute: routes.commute,
        kappaRank: routes.kappaRank,
        h1F2: causalComplex.homologyDimensionsF2.h1,
        sampleTAction: routes.sampleTAction,
        sampleSAction: routes.sampleSAction,
      })),
      allMatrixIdentitiesExact: firstCertificate.fixtures.every(({ identities }) => Object.values(identities).every(Boolean)),
      allDissipationFormsPsd: firstCertificate.fixtures.every(({ psdAudits }) => (
        Object.values(psdAudits).every(({ positiveSemidefinite }) => positiveSemidefinite)
      )),
      cellularBoundaryRanksReconstructed: true,
      rationalOrthogonalConjugacy: true,
      routeSwapCovariance: true,
      semanticDuplicateDeduplication: true,
      unauthorizedGaugeRejected: firstCertificate.unauthorizedGaugeAudit.rejected,
      polarizedDistinctionBeyondUnpolarizedSquare: firstCertificate.crossFixtureAudit,
    },
    deterministicReplay: {
      independentlyRebuiltTwice: true,
      canonicalEquality: true,
      certificateDigest: firstCertificate.certificateDigest,
    },
    theoremBoundary: firstCertificate.theoremBoundary,
    certificate: firstCertificate,
    tamper: {
      attempted: tamperCases.length,
      rejected: tamperCases.filter(({ rejected }) => rejected).length,
      cases: tamperCases,
    },
  };
}

function printPassLines(result) {
  console.log("PASS exact Q-matrices: parallelogram, signed endpoint, edge, and path-balance identities");
  console.log("PASS witness discipline: A is filled; identical commuting Fixture D stays unfilled without a witness");
  console.log("PASS cellular reconstruction: A has H1=0; B, C, and D have unfilled H1=1 complexes");
  console.log("PASS polarization: B is dissipative while C has zero edge/path dissipation despite noncommutation");
  console.log("PASS invariance: rational orthogonal conjugacy, route swap, and semantic duplicate deduplication");
  console.log("PASS gauge policy: an unregistered orthogonal comparison that trivializes C is rejected");
  console.log(`PASS deterministic replay: ${result.deterministicReplay.certificateDigest}`);
  console.log(`PASS replay/tamper: ${result.tamper.rejected}/${result.tamper.attempted} mutations rejected`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = runPolarizedCausalRepairSquare();
  printPassLines(result);
  console.log(JSON.stringify(result, null, 2));
}
