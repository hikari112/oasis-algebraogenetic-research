import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const P = 3;
const SCHEMA = "genesis.affine-nonorientable-surface.v1";

const PRIVATE_MODEL = deepFreeze({
  base: "N_g=#^g RP2 with one vertex, edges x_i, and face x_1^2...x_g^2",
  coefficients: "F3 for admission and Q for the later Betti/Hodge rank",
  activeDatum: "S<=H^1(N_g;F3)={a:sum a_i=0}",
  repair: "rooted evaluation cover with deck group S^* and universal affine primitive U(sheet)=sheet",
});

function range(length) {
  return Array.from({ length }, (_, index) => index);
}

function mod(value, prime = P) {
  const result = value % prime;
  return result < 0 ? result + prime : result;
}

function pow(base, exponent) {
  return base ** exponent;
}

function compareNumbers(left, right) {
  return left - right;
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function encodeVector(vector, prime = P) {
  let code = 0;
  let place = 1;
  for (const coordinate of vector) {
    code += mod(coordinate, prime) * place;
    place *= prime;
  }
  return code;
}

function decodeVector(code, dimension, prime = P) {
  const vector = [];
  let remaining = code;
  for (let index = 0; index < dimension; index += 1) {
    vector.push(remaining % prime);
    remaining = Math.floor(remaining / prime);
  }
  return vector;
}

function vectorAdd(left, right, prime = P) {
  return left.map((value, index) => mod(value + right[index], prime));
}

function vectorScale(scalar, vector, prime = P) {
  return vector.map((value) => mod(scalar * value, prime));
}

function vectorDot(left, right, prime = P) {
  return mod(left.reduce((sum, value, index) => sum + value * right[index], 0), prime);
}

function nonzeroVector(vector) {
  return vector.some((value) => value !== 0);
}

function inverseMod(value, prime = P) {
  for (let candidate = 1; candidate < prime; candidate += 1) {
    if (mod(value * candidate, prime) === 1) return candidate;
  }
  throw new Error("noninvertible-modular-value");
}

function rrefBasis(codes, dimension) {
  const unique = [...new Set(codes)].map((code) => decodeVector(code, dimension)).filter(nonzeroVector);
  let lead = 0;
  for (let pivot = dimension - 1; pivot >= 0; pivot -= 1) {
    const location = unique.findIndex((row, index) => index >= lead && row[pivot] !== 0);
    if (location < 0) continue;
    [unique[lead], unique[location]] = [unique[location], unique[lead]];
    unique[lead] = vectorScale(inverseMod(unique[lead][pivot]), unique[lead]);
    for (let index = 0; index < unique.length; index += 1) {
      if (index === lead || unique[index][pivot] === 0) continue;
      unique[index] = vectorAdd(
        unique[index],
        vectorScale(-unique[index][pivot], unique[lead]),
      );
    }
    lead += 1;
  }
  return unique.filter(nonzeroVector).map((row) => encodeVector(row)).sort((left, right) => {
    const leftVector = decodeVector(left, dimension);
    const rightVector = decodeVector(right, dimension);
    const leftPivot = leftVector.findLastIndex((value) => value !== 0);
    const rightPivot = rightVector.findLastIndex((value) => value !== 0);
    return rightPivot - leftPivot || left - right;
  });
}

function spanElements(basis, dimension) {
  const elements = [];
  for (let coefficientCode = 0; coefficientCode < pow(P, basis.length); coefficientCode += 1) {
    const coefficients = decodeVector(coefficientCode, basis.length);
    let vector = Array(dimension).fill(0);
    basis.forEach((rowCode, index) => {
      vector = vectorAdd(vector, vectorScale(coefficients[index], decodeVector(rowCode, dimension)));
    });
    elements.push(encodeVector(vector));
  }
  return [...new Set(elements)].sort(compareNumbers);
}

function subspaceKey(basis, dimension) {
  return spanElements(basis, dimension).join(",");
}

function coordinatesInBasis(vectorCode, basis, dimension) {
  for (let coefficientCode = 0; coefficientCode < pow(P, basis.length); coefficientCode += 1) {
    const coefficients = decodeVector(coefficientCode, basis.length);
    let vector = Array(dimension).fill(0);
    basis.forEach((rowCode, index) => {
      vector = vectorAdd(vector, vectorScale(coefficients[index], decodeVector(rowCode, dimension)));
    });
    if (encodeVector(vector) === vectorCode) return coefficientCode;
  }
  return null;
}

function enumerateCocycles(genus) {
  return range(pow(P, genus)).filter((code) => (
    mod(decodeVector(code, genus).reduce((sum, value) => sum + value, 0)) === 0
  ));
}

function enumerateSubspaces(genus) {
  const cocycles = enumerateCocycles(genus);
  const found = new Map([["0", []]]);
  for (const vector of cocycles.filter(Boolean)) {
    for (const basis of [...found.values()]) {
      const candidate = rrefBasis([...basis, vector], genus);
      found.set(subspaceKey(candidate, genus), candidate);
    }
  }
  return [...found.values()].map((basis) => ({
    basis,
    elements: spanElements(basis, genus),
    key: subspaceKey(basis, genus),
    rank: basis.length,
  })).sort((left, right) => left.rank - right.rank || compareStrings(left.key, right.key));
}

function enumerateOrderedBases(subspace, genus) {
  const nonzero = subspace.elements.filter(Boolean);
  const results = [];
  function visit(chosen) {
    if (chosen.length === subspace.rank) {
      results.push([...chosen]);
      return;
    }
    for (const vector of nonzero) {
      if (chosen.includes(vector)) continue;
      if (rrefBasis([...chosen, vector], genus).length !== chosen.length + 1) continue;
      visit([...chosen, vector]);
    }
  }
  visit([]);
  return results;
}

function applyBasis(basis, genus, edge) {
  return encodeVector(basis.map((rowCode) => decodeVector(rowCode, genus)[edge]));
}

function addDeck(leftCode, rightCode, rank) {
  return encodeVector(vectorAdd(decodeVector(leftCode, rank), decodeVector(rightCode, rank)));
}

function dualCoordinateMap(sourceBasis, targetBasis, sourceDeck, genus) {
  const sourceCoordinates = decodeVector(sourceDeck, sourceBasis.length);
  const targetCoordinates = targetBasis.map((targetRow) => {
    const coefficientCode = coordinatesInBasis(targetRow, sourceBasis, genus);
    assert.notEqual(coefficientCode, null);
    return vectorDot(decodeVector(coefficientCode, sourceBasis.length), sourceCoordinates);
  });
  return encodeVector(targetCoordinates);
}

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function fraction(numerator, denominator = 1n) {
  assert.notEqual(denominator, 0n);
  let n = BigInt(numerator);
  let d = BigInt(denominator);
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const divisor = gcd(n, d);
  return { n: n / divisor, d: d / divisor };
}

function fractionSub(left, right) {
  return fraction(left.n * right.d - right.n * left.d, left.d * right.d);
}

function fractionMul(left, right) {
  return fraction(left.n * right.n, left.d * right.d);
}

function fractionDiv(left, right) {
  assert.notEqual(right.n, 0n);
  return fraction(left.n * right.d, left.d * right.n);
}

function rationalRank(matrix) {
  if (matrix.length === 0 || matrix[0].length === 0) return 0;
  const rows = matrix.map((row) => row.map((value) => fraction(BigInt(value))));
  const rowCount = rows.length;
  const columnCount = rows[0].length;
  let rank = 0;
  for (let column = 0; column < columnCount && rank < rowCount; column += 1) {
    const pivot = rows.findIndex((row, index) => index >= rank && row[column].n !== 0n);
    if (pivot < 0) continue;
    [rows[rank], rows[pivot]] = [rows[pivot], rows[rank]];
    const pivotValue = rows[rank][column];
    for (let entry = column; entry < columnCount; entry += 1) {
      rows[rank][entry] = fractionDiv(rows[rank][entry], pivotValue);
    }
    for (let index = 0; index < rowCount; index += 1) {
      if (index === rank || rows[index][column].n === 0n) continue;
      const scale = rows[index][column];
      for (let entry = column; entry < columnCount; entry += 1) {
        rows[index][entry] = fractionSub(rows[index][entry], fractionMul(scale, rows[rank][entry]));
      }
    }
    rank += 1;
  }
  return rank;
}

function buildCover(genus, basis) {
  const rank = basis.length;
  const degree = pow(P, rank);
  const voltages = range(genus).map((edge) => applyBasis(basis, genus, edge));
  let faceVoltage = 0;
  for (const voltage of voltages) {
    faceVoltage = addDeck(faceVoltage, voltage, rank);
    faceVoltage = addDeck(faceVoltage, voltage, rank);
  }
  assert.equal(faceVoltage, 0);

  const edges = [];
  for (let sheet = 0; sheet < degree; sheet += 1) {
    for (let edge = 0; edge < genus; edge += 1) {
      edges.push({
        id: sheet * genus + edge,
        generator: edge,
        from: sheet,
        to: addDeck(sheet, voltages[edge], rank),
      });
    }
  }
  const boundary1 = range(degree).map(() => Array(edges.length).fill(0));
  for (const edge of edges) {
    boundary1[edge.from][edge.id] -= 1;
    boundary1[edge.to][edge.id] += 1;
  }
  const boundary2 = range(edges.length).map(() => Array(degree).fill(0));
  const faceWords = [];
  for (let faceSheet = 0; faceSheet < degree; faceSheet += 1) {
    let current = faceSheet;
    const liftedEdges = [];
    for (let generator = 0; generator < genus; generator += 1) {
      for (let copy = 0; copy < 2; copy += 1) {
        const edgeId = current * genus + generator;
        boundary2[edgeId][faceSheet] += 1;
        liftedEdges.push(edgeId);
        current = addDeck(current, voltages[generator], rank);
      }
    }
    assert.equal(current, faceSheet);
    faceWords.push(liftedEdges);
  }
  for (let vertex = 0; vertex < degree; vertex += 1) {
    for (let face = 0; face < degree; face += 1) {
      let value = 0;
      for (let edge = 0; edge < edges.length; edge += 1) {
        value += boundary1[vertex][edge] * boundary2[edge][face];
      }
      assert.equal(value, 0);
    }
  }
  const rankBoundary1 = rationalRank(boundary1);
  const rankBoundary2 = rationalRank(boundary2);
  const cells = { vertices: degree, edges: genus * degree, faces: degree };
  const betti = {
    b0: cells.vertices - rankBoundary1,
    b1: cells.edges - rankBoundary1 - rankBoundary2,
    b2: cells.faces - rankBoundary2,
  };
  return {
    genus,
    rank,
    basis,
    degree,
    voltages,
    edges,
    faceWords,
    boundary1,
    boundary2,
    rankBoundary1,
    rankBoundary2,
    cells,
    betti,
    graphShadowB1: cells.edges - rankBoundary1,
  };
}

function normalizedPotential(cover, characterCode) {
  const character = decodeVector(characterCode, cover.genus);
  const values = Array(cover.degree).fill(null);
  const adjacency = range(cover.degree).map(() => []);
  for (const edge of cover.edges) {
    const jump = character[edge.generator];
    adjacency[edge.from].push([edge.to, jump]);
    adjacency[edge.to].push([edge.from, mod(-jump)]);
  }
  values[0] = 0;
  const queue = [0];
  let consistent = true;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const from = queue[cursor];
    for (const [to, jump] of adjacency[from]) {
      const expected = mod(values[from] + jump);
      if (values[to] === null) {
        values[to] = expected;
        queue.push(to);
      } else if (values[to] !== expected) {
        consistent = false;
      }
    }
  }
  assert(values.every((value) => value !== null));
  return { exists: consistent, values: consistent ? values : null };
}

function auditBasisGauge(subspace, genus) {
  const orderedBases = enumerateOrderedBases(subspace, genus);
  for (const basis of orderedBases) {
    assert.equal(subspaceKey(rrefBasis(basis, genus), genus), subspace.key);
    for (let edge = 0; edge < genus; edge += 1) {
      const sourceVoltage = applyBasis(basis, genus, edge);
      const targetVoltage = applyBasis(subspace.basis, genus, edge);
      assert.equal(
        dualCoordinateMap(basis, subspace.basis, sourceVoltage, genus),
        targetVoltage,
      );
    }
    const images = range(pow(P, subspace.rank)).map((deck) => (
      dualCoordinateMap(basis, subspace.basis, deck, genus)
    ));
    assert.equal(new Set(images).size, pow(P, subspace.rank));
  }
  return {
    orderedBasesChecked: orderedBases.length,
    dualMapsBijective: true,
    edgeVoltagesIntertwined: true,
  };
}

function auditSubspace(genus, subspace, cocycles) {
  const cover = buildCover(genus, subspace.basis);
  const expectedSurfaceGenus = 2 + cover.degree * (genus - 2);
  assert.equal(cover.rankBoundary1, cover.degree - 1);
  assert.equal(cover.rankBoundary2, cover.degree);
  assert.deepEqual(cover.betti, {
    b0: 1,
    b1: 1 + cover.degree * (genus - 2),
    b2: 0,
  });
  assert.equal(cover.graphShadowB1 - cover.betti.b1, cover.degree);
  const pullbackKernel = [];
  const scalarPrimitives = [];
  for (const character of cocycles) {
    const potential = normalizedPotential(cover, character);
    const expected = subspace.elements.includes(character);
    assert.equal(potential.exists, expected);
    if (!expected) continue;
    pullbackKernel.push(character);
    const coefficientCode = coordinatesInBasis(character, subspace.basis, genus);
    assert.notEqual(coefficientCode, null);
    const coefficients = decodeVector(coefficientCode, subspace.rank);
    for (let sheet = 0; sheet < cover.degree; sheet += 1) {
      assert.equal(potential.values[sheet], vectorDot(coefficients, decodeVector(sheet, subspace.rank)));
    }
    for (const edge of cover.edges) {
      assert.equal(
        mod(potential.values[edge.to] - potential.values[edge.from]),
        decodeVector(character, genus)[edge.generator],
      );
    }
    scalarPrimitives.push({
      character,
      rootValue: 0,
      coboundaryEqualsPulledBackCharacter: true,
      uniqueAfterRootNormalization: true,
    });
  }
  assert.deepEqual(pullbackKernel.sort(compareNumbers), subspace.elements);

  for (const edge of cover.edges) {
    const source = decodeVector(edge.from, subspace.rank);
    const target = decodeVector(edge.to, subspace.rank);
    const voltage = decodeVector(cover.voltages[edge.generator], subspace.rank);
    assert.deepEqual(vectorAdd(source, voltage), target);
  }
  const gauge = auditBasisGauge(subspace, genus);
  return {
    key: subspace.key,
    rank: subspace.rank,
    basis: subspace.basis,
    elements: subspace.elements,
    cover: {
      deckGroup: "S^* over F3",
      degree: cover.degree,
      nonorientableGenus: expectedSurfaceGenus,
      cells: cover.cells,
      boundaryRanksOverQ: { d1: cover.rankBoundary1, d2: cover.rankBoundary2 },
      bettiOverQ: cover.betti,
      connected: cover.betti.b0 === 1,
      rationalTopClassAbsent: cover.betti.b2 === 0,
    },
    faceDescent: {
      voltage: 0,
      everyLiftedFaceCloses: true,
      boundarySquaredZero: true,
    },
    pullbackKernel,
    universalAffinePrimitive: {
      valuesAreSheetCoordinates: true,
      coboundaryEqualsUniversalVoltage: true,
      rootValue: Array(subspace.rank).fill(0),
    },
    scalarPrimitives,
    faceAblation: {
      lowerSkeletonHeldFixed: true,
      historyAndVoltagesHeldFixed: true,
      filledB1: cover.betti.b1,
      graphShadowB1: cover.graphShadowB1,
      extraZeroModes: cover.graphShadowB1 - cover.betti.b1,
      equalsDegree: cover.graphShadowB1 - cover.betti.b1 === cover.degree,
    },
    gauge,
  };
}

function auditHistories(subspaces, genus) {
  const byKey = new Map(subspaces.map((subspace) => [subspace.key, subspace]));
  const cocycles = enumerateCocycles(genus);
  const rows = [];
  for (const subspace of subspaces) {
    for (const character of cocycles) {
      const nextBasis = rrefBasis([...subspace.basis, character], genus);
      const next = byKey.get(subspaceKey(nextBasis, genus));
      assert(next);
      const independent = !subspace.elements.includes(character);
      assert.equal(next.rank, subspace.rank + (independent ? 1 : 0));
      const oldDegree = pow(P, subspace.rank);
      const newDegree = pow(P, next.rank);
      assert.equal(newDegree, oldDegree * (independent ? P : 1));
      rows.push({
        from: subspace.key,
        character,
        to: next.key,
        independent,
        degreeBefore: oldDegree,
        degreeAfter: newDegree,
        newFaceModes: independent ? (P - 1) * oldDegree : 0,
        outcome: independent ? "degree-triples" : "stutter",
      });
    }
  }
  return {
    transitions: rows.length,
    independent: rows.filter((row) => row.independent).length,
    dependent: rows.filter((row) => !row.independent).length,
    rows,
  };
}

function auditFactorizations(subspaces) {
  let pairs = 0;
  let factorizations = 0;
  for (const source of subspaces) {
    for (const target of subspaces) {
      pairs += 1;
      const contains = source.elements.every((value) => target.elements.includes(value));
      if (!contains) continue;
      factorizations += 1;
      assert.equal(pow(P, target.rank) % pow(P, source.rank), 0);
    }
  }
  return {
    orderedPairsChecked: pairs,
    factorizationPairs: factorizations,
    statement: "Y_T maps uniquely as a rooted cover to Y_S exactly when S<=T; Y_S is the coarsest connected rooted cover killing S.",
  };
}

function auditClosedEncoder(subspaces, genus) {
  const sourceRepresentatives = range(pow(P, genus - 1)).map((code) => (
    [...decodeVector(code, genus - 1), 0]
  ));
  const rows = subspaces.map((subspace) => {
    const signatures = new Set();
    for (const source of sourceRepresentatives) {
      const signature = subspace.elements.map((character) => (
        vectorDot(decodeVector(character, genus), source)
      )).join("");
      signatures.add(signature);
    }
    assert.equal(signatures.size, pow(P, subspace.rank));
    return { subspace: subspace.key, rank: subspace.rank, exactSignatures: signatures.size };
  });
  return {
    sourceModel: "F3^g modulo the one-dimensional relation direction, represented by vectors with final coordinate zero",
    rows,
    theorem: "An arbitrary nonlinear history-blind closed encoder answering every period in a rank-r portfolio needs at least 3^r reachable states.",
    boundary: "Supplying the requested class before encoding, allowing source replay, or charging only marginal output removes any claimed total-memory advantage.",
  };
}

function auditCoordinatePermutations(genus, cocycles) {
  const permutations = genus === 2
    ? [[0, 1], [1, 0]]
    : [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  for (const permutation of permutations) {
    const mapped = cocycles.map((code) => {
      const source = decodeVector(code, genus);
      const target = Array(genus).fill(0);
      source.forEach((value, index) => { target[permutation[index]] = value; });
      assert.equal(mod(target.reduce((sum, value) => sum + value, 0)), 0);
      return encodeVector(target);
    });
    assert.equal(new Set(mapped).size, cocycles.length);
  }
  return {
    coordinatePermutationsChecked: permutations.length,
    cocycleHyperplanePreserved: true,
    scope: "Crosscap-coordinate permutations preserve the face equation, active ranks, cover degrees, and Betti gaps. General cellular recodings are theorem-level and not exhaustively enumerated.",
  };
}

function auditGenus(genus) {
  const cocycles = enumerateCocycles(genus);
  const subspaces = enumerateSubspaces(genus);
  assert.equal(cocycles.length, pow(P, genus - 1));
  const covers = subspaces.map((subspace) => auditSubspace(genus, subspace, cocycles));
  return {
    genus,
    baseCells: { vertices: 1, edges: genus, faces: 1 },
    cochainOverF3: {
      d0Rank: 0,
      d1Row: Array(genus).fill(2),
      d1Rank: 1,
      cocycleCount: cocycles.length,
      H1Dimension: genus - 1,
      faceDefinesAdmission: true,
    },
    cocycles,
    subspaceCount: subspaces.length,
    covers,
    histories: auditHistories(subspaces, genus),
    factorizations: auditFactorizations(subspaces),
    coordinateSymmetry: auditCoordinatePermutations(genus, cocycles),
    closedEncoder: auditClosedEncoder(subspaces, genus),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.freeze(value);
  for (const key of Object.keys(value)) deepFreeze(value[key], seen);
  return value;
}

function isDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return true;
  seen.add(value);
  if (!Object.isFrozen(value)) return false;
  return Object.keys(value).every((key) => isDeepFrozen(value[key], seen));
}

function canonical(value, seen = new WeakSet(), path = "$") {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non-json-number:" + path);
    return JSON.stringify(value);
  }
  if (typeof value !== "object") throw new Error("non-json-value:" + path);
  if (seen.has(value)) throw new Error("aliased-or-cyclic-value:" + path);
  seen.add(value);
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) throw new Error("non-plain-array:" + path);
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key === "symbol")) throw new Error("symbol-key:" + path);
    const permitted = new Set(["length", ...range(value.length).map(String)]);
    if (ownKeys.map(String).some((key) => !permitted.has(key))) throw new Error("unknown-array-key:" + path);
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !("value" in descriptor) || descriptor.enumerable !== true) {
        throw new Error("non-data-property:" + path + "[" + String(index) + "]");
      }
    }
    return "[" + value.map((item, index) => canonical(item, seen, path + "[" + index + "]")).join(",") + "]";
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error("non-plain-object:" + path);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key === "symbol")) throw new Error("symbol-key:" + path);
  const keys = ownKeys.map(String).sort(compareStrings);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor) || descriptor.enumerable !== true) {
      throw new Error("non-data-property:" + path + "." + key);
    }
  }
  return "{" + keys.map((key) => (
    JSON.stringify(key) + ":" + canonical(value[key], seen, path + "." + key)
  )).join(",") + "}";
}

function digest(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function buildPayload() {
  const model = clone(PRIVATE_MODEL);
  assert(isDeepFrozen(PRIVATE_MODEL));
  assert.notStrictEqual(model, PRIVATE_MODEL);
  const genera = [2, 3].map(auditGenus);
  return {
    title: "Genesis affine nonorientable surface",
    status: "exact standard-mathematics face-forced affine-admission and rational-Hodge calibration",
    auditScope: {
      exhaustiveGenera: [2, 3],
      theoremBoundary: "The formulas extend to N_g and any odd prime p. This executable exhausts every active F3 subspace only for g=2,3.",
    },
    model,
    isolation: {
      privateModelRecursivelyFrozen: true,
      payloadModelDeepCloned: true,
      replayExpectedPayloadExposedToCaller: false,
    },
    characteristicTwoAblation: {
      coefficient: "F2",
      cellularD1Row: [0],
      generalD1Rank: 0,
      allEdgeTablesAreCocycles: true,
      conclusion: "Characteristic two erases the face equation 2*sum(a_i)=0, so the two-cell does not define the admission space.",
    },
    genera,
    theorem: {
      faceForcedAdmission: "Over F3, H^1(N_g)=ker(2*sum), so the face decides which edge tables are legal cocycles and makes every evaluation-cover face close.",
      universalRepair: "For S<=H^1 of rank r, the evaluation cover has deck S^*, degree 3^r, pullback kernel exactly S, and the coarsest connected rooted universal property.",
      affinePrimitive: "The sheet-coordinate map U:S^*->S^* is the unique root-normalized universal primitive; evaluation gives every scalar primitive for alpha in S.",
      laterHodgeRank: "Over Q the lifted boundary ranks are 3^r-1 and 3^r. Holding the one-skeleton fixed and deleting faces creates exactly 3^r degree-one modes.",
      independentBirth: "Rank r to r+1 triples the cover and creates exactly 2*3^r additional face-controlled directions; dependent birth stutters.",
      closedObserver: "Every nonlinear history-blind exact encoder for a rank-r F3 period portfolio has at least 3^r reachable states under the declared timing interface.",
    },
    claimLedger: {
      classification: "standard nonorientable-surface covering, finite-field cohomology, affine primitive, and rational cellular-Hodge mathematics",
      explicitlyNotClaimed: [
        "No Level C or formation-doctrine escape.",
        "No mathematical novelty or priority claim.",
        "No non-soficity, AI architecture, Hodge Conjecture, Navier-Stokes, Collatz, or Riemann Hypothesis result.",
        "No total-memory or unrestricted-program lower bound.",
      ],
      collapseBoundary: "If the old doctrine contains cohomology, finite covers, and sheet-coordinate primitives, history merely selects S. The face is load-bearing, but the constructor remains standard.",
    },
  };
}

let expectedPayloadCache;
let expectedCanonicalCache;

function getExpectedPayload() {
  if (expectedPayloadCache === undefined) {
    const payload = buildPayload();
    expectedCanonicalCache = canonical(payload);
    expectedPayloadCache = deepFreeze(payload);
  }
  return expectedPayloadCache;
}

function semanticPayloadCheck(candidate) {
  try {
    const candidateCanonical = canonical(candidate);
    getExpectedPayload();
    const ok = candidateCanonical === expectedCanonicalCache;
    return { ok, reason: ok ? "verified" : "semantic-mismatch" };
  } catch (error) {
    return { ok: false, reason: String(error.message || error) };
  }
}

function runTamperAudit(payload) {
  const attacks = [
    ["cochain-rank", (value) => { value.genera[1].cochainOverF3.d1Rank = 0; }],
    ["cocycle-count", (value) => { value.genera[1].cochainOverF3.cocycleCount = 8; }],
    ["subspace-count", (value) => { value.genera[1].subspaceCount = 5; }],
    ["cover-degree", (value) => { value.genera[1].covers.at(-1).cover.degree = 8; }],
    ["surface-genus", (value) => { value.genera[1].covers.at(-1).cover.nonorientableGenus = 12; }],
    ["boundary-rank", (value) => { value.genera[1].covers.at(-1).cover.boundaryRanksOverQ.d2 = 8; }],
    ["kernel", (value) => { value.genera[1].covers[1].pullbackKernel = [0]; }],
    ["primitive", (value) => { value.genera[1].covers[1].universalAffinePrimitive.rootValue = [1]; }],
    ["face-descent", (value) => { value.genera[1].covers[2].faceDescent.everyLiftedFaceCloses = false; }],
    ["face-gap", (value) => { value.genera[1].covers.at(-1).faceAblation.extraZeroModes = 8; }],
    ["history", (value) => { value.genera[1].histories.independent = 0; }],
    ["new-modes", (value) => { value.genera[1].histories.rows.find((row) => row.independent).newFaceModes = 1; }],
    ["factorization", (value) => { value.genera[1].factorizations.factorizationPairs = 0; }],
    ["encoder", (value) => { value.genera[1].closedEncoder.rows.at(-1).exactSignatures = 8; }],
    ["erase-p2-control", (value) => { value.characteristicTwoAblation.generalD1Rank = 1; }],
    ["forge-level-c", (value) => { value.claimLedger.classification = "Level C"; }],
    ["forge-novelty", (value) => { value.claimLedger.explicitlyNotClaimed = []; }],
  ];
  let rejected = 0;
  const outcomes = attacks.map(([name, mutate]) => {
    const candidate = clone(payload);
    mutate(candidate);
    const verification = semanticPayloadCheck(candidate);
    if (!verification.ok) rejected += 1;
    return { name, rejected: !verification.ok, reason: verification.reason };
  });
  assert.equal(rejected, attacks.length);
  return { tested: attacks.length, rejected, outcomes };
}

function makeCertificate() {
  const payload = clone(getExpectedPayload());
  const payloadDigest = digest(payload);
  const tamperAudit = runTamperAudit(payload);
  const body = { schema: SCHEMA, payload, payloadDigest, tamperAudit };
  return { ...body, certificateDigest: digest(body) };
}

export function replayGenesisAffineNonorientableSurfaceCertificate(certificate) {
  try {
    canonical(certificate);
    const allowed = ["schema", "payload", "payloadDigest", "tamperAudit", "certificateDigest"].sort();
    assert.deepEqual(Object.keys(certificate).sort(), allowed);
    if (certificate.schema !== SCHEMA) return { ok: false, reason: "schema-mismatch" };
    if (digest(certificate.payload) !== certificate.payloadDigest) return { ok: false, reason: "payload-digest-mismatch" };
    const semantic = semanticPayloadCheck(certificate.payload);
    if (!semantic.ok) return semantic;
    const expectedTamper = runTamperAudit(clone(getExpectedPayload()));
    if (canonical(certificate.tamperAudit) !== canonical(expectedTamper)) {
      return { ok: false, reason: "tamper-audit-mismatch" };
    }
    const body = {
      schema: certificate.schema,
      payload: certificate.payload,
      payloadDigest: certificate.payloadDigest,
      tamperAudit: certificate.tamperAudit,
    };
    if (digest(body) !== certificate.certificateDigest) return { ok: false, reason: "certificate-digest-mismatch" };
    return { ok: true, reason: "verified" };
  } catch (error) {
    return { ok: false, reason: String(error.message || error) };
  }
}

function securityRegressions(certificate) {
  const nested = clone(certificate);
  nested.payload.genera[1].covers[0].scalarPrimitives.push({ forged: true });
  nested.payloadDigest = digest(nested.payload);
  nested.certificateDigest = digest({ schema: nested.schema, payload: nested.payload, payloadDigest: nested.payloadDigest, tamperAudit: nested.tamperAudit });
  const nestedResult = replayGenesisAffineNonorientableSurfaceCertificate(nested);
  assert.equal(nestedResult.ok, false);

  const unknown = clone(certificate);
  unknown.payload.unknownClaim = true;
  unknown.payloadDigest = digest(unknown.payload);
  unknown.certificateDigest = digest({ schema: unknown.schema, payload: unknown.payload, payloadDigest: unknown.payloadDigest, tamperAudit: unknown.tamperAudit });
  const unknownResult = replayGenesisAffineNonorientableSurfaceCertificate(unknown);
  assert.equal(unknownResult.ok, false);

  const namedArray = clone(certificate);
  namedArray.payload.genera.extra = true;
  const namedArrayResult = replayGenesisAffineNonorientableSurfaceCertificate(namedArray);
  assert.equal(namedArrayResult.ok, false);

  const inherited = Object.create(certificate);
  const inheritedResult = replayGenesisAffineNonorientableSurfaceCertificate(inherited);
  assert.equal(inheritedResult.ok, false);

  const getter = clone(certificate);
  const original = getter.payload.genera[0];
  Object.defineProperty(getter.payload.genera, "0", { enumerable: true, configurable: true, get() { return original; } });
  const getterResult = replayGenesisAffineNonorientableSurfaceCertificate(getter);
  assert.equal(getterResult.ok, false);

  const hiddenPayload = clone(certificate);
  Object.defineProperty(hiddenPayload.payload, "hiddenPoison", { value: true, enumerable: false });
  const hiddenPayloadResult = replayGenesisAffineNonorientableSurfaceCertificate(hiddenPayload);
  assert.equal(hiddenPayloadResult.ok, false);

  const hiddenTop = clone(certificate);
  Object.defineProperty(hiddenTop, "hiddenTop", { value: true, enumerable: false });
  const hiddenTopResult = replayGenesisAffineNonorientableSurfaceCertificate(hiddenTop);
  assert.equal(hiddenTopResult.ok, false);

  const symbolArray = clone(certificate);
  symbolArray.payload.genera[Symbol("poison")] = true;
  const symbolArrayResult = replayGenesisAffineNonorientableSurfaceCertificate(symbolArray);
  assert.equal(symbolArrayResult.ok, false);

  return {
    rehashedNestedMutation: { rejected: true, reason: nestedResult.reason },
    rehashedUnknownKey: { rejected: true, reason: unknownResult.reason },
    namedArrayProperty: { rejected: true, reason: namedArrayResult.reason },
    inheritedPrototype: { rejected: true, reason: inheritedResult.reason },
    enumerableGetter: { rejected: true, reason: getterResult.reason },
    nonEnumerablePayloadProperty: { rejected: true, reason: hiddenPayloadResult.reason },
    nonEnumerableTopLevelProperty: { rejected: true, reason: hiddenTopResult.reason },
    symbolArrayProperty: { rejected: true, reason: symbolArrayResult.reason },
    pass: true,
  };
}

export function runGenesisAffineNonorientableSurface() {
  const first = makeCertificate();
  const second = makeCertificate();
  assert.equal(canonical(first), canonical(second));
  const replay = replayGenesisAffineNonorientableSurfaceCertificate(first);
  assert.equal(replay.ok, true);
  return {
    ok: true,
    certificate: first,
    replay,
    deterministicReplay: true,
    securityRegressions: securityRegressions(first),
  };
}

export { runGenesisAffineNonorientableSurface as run, replayGenesisAffineNonorientableSurfaceCertificate as replay };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = runGenesisAffineNonorientableSurface();
  console.log(JSON.stringify({
    ok: result.ok,
    certificateDigest: result.certificate.certificateDigest,
    payloadDigest: result.certificate.payloadDigest,
    genera: result.certificate.payload.genera.map((entry) => ({
      genus: entry.genus,
      cocycles: entry.cochainOverF3.cocycleCount,
      subspaces: entry.subspaceCount,
      histories: entry.histories.transitions,
      factorizationPairs: entry.factorizations.factorizationPairs,
      coordinatePermutations: entry.coordinateSymmetry.coordinatePermutationsChecked,
      maximumDegree: Math.max(...entry.covers.map((cover) => cover.cover.degree)),
      maximumFaceGap: Math.max(...entry.covers.map((cover) => cover.faceAblation.extraZeroModes)),
    })),
    characteristicTwoAblation: result.certificate.payload.characteristicTwoAblation,
    tamper: {
      tested: result.certificate.tamperAudit.tested,
      rejected: result.certificate.tamperAudit.rejected,
    },
    securityRegressions: result.securityRegressions,
    deterministicReplay: result.deterministicReplay,
  }, null, 2));
}
