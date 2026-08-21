import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SCHEMA = "oasis.genesis-active-cohomology-atlas.v1";
const MAX_N = 4;

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

function validatePlainJsonTree(value, path = "$", seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return { ok: true };
  }
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? { ok: true }
      : { ok: false, reason: "non-json-number", path };
  }
  if (typeof value !== "object") return { ok: false, reason: "non-json-value", path };
  if (seen.has(value)) return { ok: false, reason: "aliased-or-cyclic-value", path };
  seen.add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      return { ok: false, reason: "non-plain-array", path };
    }
    const ownKeys = Reflect.ownKeys(value);
    for (const key of ownKeys) {
      if (key === "length") continue;
      if (typeof key !== "string" || !/^(0|[1-9][0-9]*)$/.test(key)) {
        return { ok: false, reason: "unknown-key", path: path + "." + String(key) };
      }
      const index = Number(key);
      if (!Number.isSafeInteger(index) || index < 0 || index >= value.length) {
        return { ok: false, reason: "unknown-key", path: path + "." + key };
      }
    }
    if (Object.keys(value).length !== value.length) {
      return { ok: false, reason: "sparse-or-hidden-array-entry", path };
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
        return { ok: false, reason: "non-data-property", path: path + "[" + String(index) + "]" };
      }
      const nested = validatePlainJsonTree(value[index], path + "[" + String(index) + "]", seen);
      if (!nested.ok) return nested;
    }
    return { ok: true };
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return { ok: false, reason: "non-plain-object", path };
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") {
      return { ok: false, reason: "unknown-key", path: path + "." + String(key) };
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      return { ok: false, reason: "non-data-property", path: path + "." + key };
    }
    const nested = validatePlainJsonTree(value[key], path + "." + key, seen);
    if (!nested.ok) return nested;
  }
  return { ok: true };
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) deepFreeze(value[key], seen);
  return Object.freeze(value);
}

function isDeepFrozen(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value)
    && Reflect.ownKeys(value).every((key) => isDeepFrozen(value[key], seen));
}

const PRIVATE_MODEL_DESCRIPTOR = deepFreeze({
  complexPattern: {
    verticesPerCell: ["a_i", "b_i", "c_i"],
    commonVertex: "o",
    filledTriangle: ["o", "a_i", "b_i"],
    unfilledHole: ["o", "b_i", "c_i"],
    sharedEdge: ["o", "b_i"],
  },
  coefficientField: "F2",
  coverDoctrine: {
    activeObject: "subspace S <= H^1(K_n;F2)",
    deckGroup: "S^*",
    morphisms: "pointed maps of connected covers over K_n",
  },
});

function range(size) {
  return Array.from({ length: size }, (_, index) => index);
}

function compareNumbers(left, right) {
  return left - right;
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function parity(value) {
  let remaining = value >>> 0;
  let result = 0;
  while (remaining !== 0) {
    result ^= remaining & 1;
    remaining >>>= 1;
  }
  return result;
}

function highestBitNumber(value) {
  assert(value > 0);
  return 31 - Math.clz32(value);
}

function highestBitBigInt(value) {
  assert(value > 0n);
  let index = -1;
  let remaining = value;
  while (remaining > 0n) {
    remaining >>= 1n;
    index += 1;
  }
  return index;
}

function gf2RankBigInt(vectors) {
  const rows = [];
  for (const input of vectors) {
    let value = BigInt(input);
    for (const row of rows) {
      if (((value >> BigInt(row.pivot)) & 1n) !== 0n) value ^= row.value;
    }
    if (value === 0n) continue;
    const pivot = highestBitBigInt(value);
    for (const row of rows) {
      if (((row.value >> BigInt(pivot)) & 1n) !== 0n) row.value ^= value;
    }
    rows.push({ pivot, value });
    rows.sort((left, right) => right.pivot - left.pivot);
  }
  return rows.length;
}

function rrefBasis(vectors, dimension) {
  const mask = (1 << dimension) - 1;
  const rows = [...new Set(vectors.map((value) => value & mask).filter((value) => value !== 0))];
  let lead = 0;
  for (let pivot = dimension - 1; pivot >= 0; pivot -= 1) {
    const location = rows.findIndex((row, index) => index >= lead && ((row >> pivot) & 1) !== 0);
    if (location < 0) continue;
    [rows[lead], rows[location]] = [rows[location], rows[lead]];
    for (let index = 0; index < rows.length; index += 1) {
      if (index !== lead && ((rows[index] >> pivot) & 1) !== 0) rows[index] ^= rows[lead];
    }
    lead += 1;
  }
  return rows.filter((value) => value !== 0).sort((left, right) => (
    highestBitNumber(right) - highestBitNumber(left) || right - left
  ));
}

function spanElements(basis) {
  const elements = [];
  for (let coefficients = 0; coefficients < (1 << basis.length); coefficients += 1) {
    let value = 0;
    basis.forEach((row, index) => {
      if (((coefficients >> index) & 1) !== 0) value ^= row;
    });
    elements.push(value);
  }
  return elements.sort(compareNumbers);
}

function subspaceKey(basis) {
  return spanElements(basis).join(",");
}

function coordinatesInBasis(vector, basis) {
  for (let coefficients = 0; coefficients < (1 << basis.length); coefficients += 1) {
    let value = 0;
    basis.forEach((row, index) => {
      if (((coefficients >> index) & 1) !== 0) value ^= row;
    });
    if (value === vector) return coefficients;
  }
  return null;
}

function applyRowMatrix(rows, vector) {
  let result = 0;
  rows.forEach((row, index) => {
    if (parity(row & vector) !== 0) result |= 1 << index;
  });
  return result;
}

function enumerateSubspaces(dimension) {
  const found = new Map([["0", []]]);
  for (let vector = 1; vector < (1 << dimension); vector += 1) {
    for (const basis of [...found.values()]) {
      const candidate = rrefBasis([...basis, vector], dimension);
      found.set(subspaceKey(candidate), candidate);
    }
  }
  return [...found.values()].map((basis) => ({
    basis,
    elements: spanElements(basis),
    key: subspaceKey(basis),
    rank: basis.length,
  })).sort((left, right) => left.rank - right.rank || compareStrings(left.key, right.key));
}

function buildKn(n) {
  assert(Number.isInteger(n) && n >= 1);
  const vertices = ["o"];
  const edges = [];
  const faces = [];
  const holes = [];
  for (let index = 0; index < n; index += 1) {
    const suffix = String(index + 1);
    const a = "a" + suffix;
    const b = "b" + suffix;
    const c = "c" + suffix;
    vertices.push(a, b, c);
    const start = edges.length;
    edges.push(
      { id: "oa" + suffix, from: "o", to: a, kind: "oa", holeIndex: index },
      { id: "ab" + suffix, from: a, to: b, kind: "ab", holeIndex: index },
      { id: "ob" + suffix, from: "o", to: b, kind: "ob", holeIndex: index },
      { id: "bc" + suffix, from: b, to: c, kind: "bc", holeIndex: index },
      { id: "oc" + suffix, from: "o", to: c, kind: "oc", holeIndex: index },
    );
    faces.push({
      id: "f" + suffix,
      vertices: ["o", a, b],
      edgeIndices: { ij: start, jk: start + 1, ik: start + 2 },
    });
    holes.push({
      id: "h" + suffix,
      edgeIndices: [start + 2, start + 3, start + 4],
    });
  }
  return { n, vertices, edges, faces, holes };
}

function auditKn(n) {
  const complex = buildKn(n);
  const vertexIndex = new Map(complex.vertices.map((vertex, index) => [vertex, index]));
  assert.equal(vertexIndex.size, complex.vertices.length);
  assert.equal(new Set(complex.edges.map((edge) => edge.id)).size, complex.edges.length);
  assert.equal(new Set(complex.faces.map((face) => face.id)).size, complex.faces.length);

  const edgeBoundaries = complex.edges.map((edge) => (
    (1n << BigInt(vertexIndex.get(edge.from))) ^ (1n << BigInt(vertexIndex.get(edge.to)))
  ));
  const faceBoundaries = complex.faces.map((face) => (
    (1n << BigInt(face.edgeIndices.ij))
      ^ (1n << BigInt(face.edgeIndices.jk))
      ^ (1n << BigInt(face.edgeIndices.ik))
  ));
  for (const face of complex.faces) {
    assert.equal(
      edgeBoundaries[face.edgeIndices.ij]
        ^ edgeBoundaries[face.edgeIndices.jk]
        ^ edgeBoundaries[face.edgeIndices.ik],
      0n,
    );
  }

  const vertexCoboundaries = complex.vertices.map((_, vertex) => {
    let cochain = 0n;
    complex.edges.forEach((edge, edgeIndex) => {
      if (vertexIndex.get(edge.from) === vertex || vertexIndex.get(edge.to) === vertex) {
        cochain |= 1n << BigInt(edgeIndex);
      }
    });
    return cochain;
  });
  const edgeCofaces = complex.edges.map((_, edgeIndex) => {
    let result = 0n;
    complex.faces.forEach((face, faceIndex) => {
      if (Object.values(face.edgeIndices).includes(edgeIndex)) result |= 1n << BigInt(faceIndex);
    });
    return result;
  });

  const rankBoundary1 = gf2RankBigInt(edgeBoundaries);
  const rankBoundary2 = gf2RankBigInt(faceBoundaries);
  const rankD0 = gf2RankBigInt(vertexCoboundaries);
  const rankD1 = gf2RankBigInt(edgeCofaces);
  const h0 = complex.vertices.length - rankBoundary1;
  const h1 = complex.edges.length - rankBoundary1 - rankBoundary2;
  const h2 = complex.faces.length - rankBoundary2;
  const hOneCohomology = (complex.edges.length - rankD1) - rankD0;

  const alphaCochains = complex.holes.map((_, index) => (
    1n << BigInt(5 * index + 3)
  ));
  const holeCycles = complex.holes.map((hole) => hole.edgeIndices.reduce((value, edgeIndex) => (
    value ^ (1n << BigInt(edgeIndex))
  ), 0n));
  const pairing = alphaCochains.map((alpha) => holeCycles.map((cycle) => {
    let bits = alpha & cycle;
    let value = 0;
    while (bits > 0n) {
      value ^= Number(bits & 1n);
      bits >>= 1n;
    }
    return value;
  }));
  assert.deepEqual(pairing, range(n).map((row) => range(n).map((column) => (
    row === column ? 1 : 0
  ))));
  for (const alpha of alphaCochains) {
    for (const faceBoundary of faceBoundaries) assert.equal(alpha & faceBoundary, 0n);
  }

  const freeFaceChecks = complex.faces.map((face, index) => {
    const freeEdge = face.edgeIndices.ij;
    const incidence = faceBoundaries.filter((boundary) => (
      ((boundary >> BigInt(freeEdge)) & 1n) !== 0n
    )).length;
    assert.equal(incidence, 1);
    assert.equal(complex.edges[freeEdge].kind, "oa");
    return { cell: index + 1, freeFaceEdge: complex.edges[freeEdge].id, incidence };
  });
  const collapsedVertexCount = 1 + 2 * n;
  const collapsedEdgeCount = 3 * n;
  const collapsedH1 = collapsedEdgeCount - collapsedVertexCount + 1;

  assert.equal(complex.vertices.length, 1 + 3 * n);
  assert.equal(complex.edges.length, 5 * n);
  assert.equal(complex.faces.length, n);
  assert.equal(rankBoundary1, 3 * n);
  assert.equal(rankBoundary2, n);
  assert.equal(rankD0, 3 * n);
  assert.equal(rankD1, n);
  assert.deepEqual([h0, h1, h2, hOneCohomology], [1, n, 0, n]);
  assert.equal(collapsedH1, n);

  return {
    n,
    cells: {
      vertices: complex.vertices.length,
      edges: complex.edges.length,
      filledFaces: complex.faces.length,
      expected: { vertices: 1 + 3 * n, edges: 5 * n, filledFaces: n },
    },
    chainAudit: {
      boundarySquaredZeroFaces: complex.faces.length,
      rankBoundary1,
      rankBoundary2,
      rankD0,
      rankD1,
      d1Nontrivial: rankD1 > 0,
    },
    homologyOverF2: { H0: h0, H1: h1, H2: h2 },
    cohomologyOverF2: { H1: hOneCohomology },
    holeBasisPairing: pairing,
    collapseAblation: {
      freeFaceChecks,
      firstCollapse: "remove each filled face f_i with its free edge oa_i",
      secondCollapse: "remove the resulting leaf vertex a_i with edge ab_i",
      remainder: "the graph with edges ob_i, bc_i, oc_i, a wedge of n circles at o",
      remainderCells: { vertices: collapsedVertexCount, edges: collapsedEdgeCount, faces: 0 },
      remainderH1: collapsedH1,
      cohomologyPreserved: collapsedH1 === hOneCohomology,
      d1LoadBearing: false,
      boundary: "The nonzero cellular d1 is executable but presentation-dependent: K_n collapses to a graph with the same H1. This fixture is not an intrinsically two-dimensional or native sheaf-theoretic success.",
    },
  };
}

function edgeVoltage(edge, basis) {
  if (edge.kind !== "bc") return 0;
  let voltage = 0;
  basis.forEach((character, index) => {
    if (((character >> edge.holeIndex) & 1) !== 0) voltage |= 1 << index;
  });
  return voltage;
}

function buildActiveCover(complex, inputBasis) {
  const basis = rrefBasis(inputBasis, complex.n);
  const rank = basis.length;
  const degree = 1 << rank;
  const baseVertexIndex = new Map(complex.vertices.map((vertex, index) => [vertex, index]));
  const liftVertex = (vertex, deck) => baseVertexIndex.get(vertex) * degree + deck;
  const voltages = complex.edges.map((edge) => edgeVoltage(edge, basis));
  assert.equal(rrefBasis(voltages, Math.max(1, rank)).length, rank);

  const liftedEdges = [];
  complex.edges.forEach((edge, baseEdgeIndex) => {
    for (let deck = 0; deck < degree; deck += 1) {
      liftedEdges.push({
        baseEdgeIndex,
        deck,
        from: liftVertex(edge.from, deck),
        to: liftVertex(edge.to, deck ^ voltages[baseEdgeIndex]),
      });
    }
  });
  const vertexCount = complex.vertices.length * degree;
  const adjacency = Array.from({ length: vertexCount }, () => []);
  liftedEdges.forEach((edge, liftEdgeIndex) => {
    adjacency[edge.from].push({ to: edge.to, liftEdgeIndex });
    adjacency[edge.to].push({ to: edge.from, liftEdgeIndex });
  });
  const reached = new Set([liftVertex("o", 0)]);
  const queue = [liftVertex("o", 0)];
  while (queue.length > 0) {
    const vertex = queue.shift();
    for (const step of adjacency[vertex]) {
      if (!reached.has(step.to)) {
        reached.add(step.to);
        queue.push(step.to);
      }
    }
  }
  assert.equal(reached.size, vertexCount);

  const liftedFaces = [];
  let coherentFaceLifts = 0;
  for (const face of complex.faces) {
    const voltageIJ = voltages[face.edgeIndices.ij];
    const voltageJK = voltages[face.edgeIndices.jk];
    const voltageIK = voltages[face.edgeIndices.ik];
    assert.equal(voltageIJ ^ voltageJK, voltageIK);
    for (let deck = 0; deck < degree; deck += 1) {
      const [i, j, k] = face.vertices;
      const vertexI = liftVertex(i, deck);
      const vertexJ = liftVertex(j, deck ^ voltageIJ);
      const vertexKViaJ = liftVertex(k, deck ^ voltageIJ ^ voltageJK);
      const vertexKDirect = liftVertex(k, deck ^ voltageIK);
      assert.equal(vertexKViaJ, vertexKDirect);
      liftedFaces.push({
        baseFaceId: face.id,
        deck,
        vertices: [vertexI, vertexJ, vertexKDirect],
        edgeIndices: face.edgeIndices,
      });
      coherentFaceLifts += 1;
    }
  }

  let deckFiberChecks = 0;
  let deckEdgeActionChecks = 0;
  let deckFaceActionChecks = 0;
  for (let translation = 0; translation < degree; translation += 1) {
    for (let left = 0; left < degree; left += 1) {
      const right = left ^ translation;
      assert.equal(left ^ right, translation);
      if (translation !== 0) assert.notEqual(left, right);
      deckFiberChecks += 1;
      for (let baseEdgeIndex = 0; baseEdgeIndex < complex.edges.length; baseEdgeIndex += 1) {
        const voltage = voltages[baseEdgeIndex];
        assert.equal((left ^ voltage) ^ translation, right ^ voltage);
        deckEdgeActionChecks += 1;
      }
      for (const face of complex.faces) {
        assert.equal(
          (left ^ voltages[face.edgeIndices.ij] ^ voltages[face.edgeIndices.jk]) ^ translation,
          right ^ voltages[face.edgeIndices.ik],
        );
        deckFaceActionChecks += 1;
      }
    }
  }

  const signature = {
    n: complex.n,
    basis,
    degree,
    voltages,
    liftedEdges: liftedEdges.map((edge) => [edge.baseEdgeIndex, edge.deck, edge.from, edge.to]),
    liftedFaces: liftedFaces.map((face) => [face.baseFaceId, face.deck, ...face.vertices]),
  };
  return {
    complex,
    basis,
    elements: spanElements(basis),
    rank,
    degree,
    voltages,
    vertexCount,
    edgeCount: liftedEdges.length,
    faceCount: liftedFaces.length,
    liftedEdges,
    liftedFaces,
    adjacency,
    root: liftVertex("o", 0),
    connected: reached.size === vertexCount,
    principalDeckAction: true,
    deckFiberChecks,
    deckEdgeActionChecks,
    deckFaceActionChecks,
    coherentFaceLifts,
    signatureDigest: digest(signature),
  };
}

function characterOnBaseEdge(alpha, edge) {
  return edge.kind === "bc" ? ((alpha >> edge.holeIndex) & 1) : 0;
}

function solveNormalizedParallelSection(cover, alpha) {
  const values = Array(cover.vertexCount).fill(0);
  values[cover.root] = 1;
  const queue = [cover.root];
  let inconsistency = null;
  while (queue.length > 0 && inconsistency === null) {
    const vertex = queue.shift();
    for (const step of cover.adjacency[vertex]) {
      const liftedEdge = cover.liftedEdges[step.liftEdgeIndex];
      const baseEdge = cover.complex.edges[liftedEdge.baseEdgeIndex];
      const transport = characterOnBaseEdge(alpha, baseEdge) === 0 ? 1 : -1;
      const expected = transport * values[vertex];
      if (values[step.to] === 0) {
        values[step.to] = expected;
        queue.push(step.to);
      } else if (values[step.to] !== expected) {
        inconsistency = {
          liftEdgeIndex: step.liftEdgeIndex,
          atVertex: step.to,
          retainedValue: values[step.to],
          forcedValue: expected,
        };
      }
    }
  }
  if (inconsistency !== null) {
    return { exists: false, inconsistency };
  }
  assert(values.every((value) => value === 1 || value === -1));
  assert.equal(values[cover.root], 1);

  let parallelEdgeChecks = 0;
  let degreeZeroUntwistingCoefficientChecks = 0;
  for (const liftedEdge of cover.liftedEdges) {
    const baseEdge = cover.complex.edges[liftedEdge.baseEdgeIndex];
    const transport = characterOnBaseEdge(alpha, baseEdge) === 0 ? 1 : -1;
    assert.equal(values[liftedEdge.to], transport * values[liftedEdge.from]);
    parallelEdgeChecks += 1;
    assert.deepEqual(
      [values[liftedEdge.to], -transport * values[liftedEdge.from]],
      [values[liftedEdge.to], -values[liftedEdge.to]],
    );
    degreeZeroUntwistingCoefficientChecks += 2;
  }

  let faceTransportChecks = 0;
  let degreeOneUntwistingCoefficientChecks = 0;
  for (const liftedFace of cover.liftedFaces) {
    const face = cover.complex.faces.find((candidate) => candidate.id === liftedFace.baseFaceId);
    const edgeIJ = cover.complex.edges[face.edgeIndices.ij];
    const edgeJK = cover.complex.edges[face.edgeIndices.jk];
    const edgeIK = cover.complex.edges[face.edgeIndices.ik];
    const transportIJ = characterOnBaseEdge(alpha, edgeIJ) === 0 ? 1 : -1;
    const transportJK = characterOnBaseEdge(alpha, edgeJK) === 0 ? 1 : -1;
    const transportIK = characterOnBaseEdge(alpha, edgeIK) === 0 ? 1 : -1;
    assert.equal(transportIK, transportJK * transportIJ);
    const [, vertexJ, vertexK] = liftedFace.vertices;
    assert.equal(transportJK * values[vertexJ], values[vertexK]);
    assert.deepEqual(
      [values[vertexK], -values[vertexK], transportJK * values[vertexJ]],
      [values[vertexK], -values[vertexK], values[vertexK]],
    );
    faceTransportChecks += 1;
    degreeOneUntwistingCoefficientChecks += 3;
  }

  return {
    exists: true,
    normalizedRootValue: values[cover.root],
    rationalValueSet: [...new Set(values)].sort(compareNumbers),
    negativeValueCount: values.filter((value) => value === -1).length,
    sectionDigest: digest(values),
    parallelEdgeChecks,
    faceTransportChecks,
    primitiveOverF2: {
      normalizedRootValue: 0,
      oneCount: values.filter((value) => value === -1).length,
      digest: digest(values.map((value) => value === -1 ? 1 : 0)),
    },
    untwistingChainIsomorphism: {
      formula: "U_q multiplies an ordinary q-cochain on an oriented simplex by the section value at its final vertex",
      degreeZeroCoefficientChecks: degreeZeroUntwistingCoefficientChecks,
      degreeOneCoefficientChecks: degreeOneUntwistingCoefficientChecks,
      identity: "d_alpha U = U d",
      pass: true,
    },
  };
}

function auditActiveCover(complex, subspace) {
  const cover = buildActiveCover(complex, subspace.basis);
  assert.equal(cover.degree, 1 << subspace.rank);
  assert.equal(cover.vertexCount, complex.vertices.length * cover.degree);
  assert.equal(cover.edgeCount, complex.edges.length * cover.degree);
  assert.equal(cover.faceCount, complex.faces.length * cover.degree);
  assert.equal(cover.coherentFaceLifts, cover.faceCount);
  const liftedFreeFaceEdges = cover.liftedEdges.filter((liftedEdge) => (
    complex.edges[liftedEdge.baseEdgeIndex].kind === "oa"
  )).length;
  assert.equal(liftedFreeFaceEdges, cover.faceCount);

  let flatFaceIdentityChecksAllCharacters = 0;
  for (let alpha = 0; alpha < (1 << complex.n); alpha += 1) {
    for (const liftedFace of cover.liftedFaces) {
      const face = complex.faces.find((candidate) => candidate.id === liftedFace.baseFaceId);
      const transportIJ = characterOnBaseEdge(alpha, complex.edges[face.edgeIndices.ij]) === 0 ? 1 : -1;
      const transportJK = characterOnBaseEdge(alpha, complex.edges[face.edgeIndices.jk]) === 0 ? 1 : -1;
      const transportIK = characterOnBaseEdge(alpha, complex.edges[face.edgeIndices.ik]) === 0 ? 1 : -1;
      assert.equal(transportIK, transportJK * transportIJ);
      flatFaceIdentityChecksAllCharacters += 1;
    }
  }

  const sections = [];
  const kernelCharacters = [];
  for (let alpha = 0; alpha < (1 << complex.n); alpha += 1) {
    const section = solveNormalizedParallelSection(cover, alpha);
    const expected = subspace.elements.includes(alpha);
    assert.equal(section.exists, expected);
    if (section.exists) kernelCharacters.push(alpha);
    sections.push({
      alpha,
      inActiveSubspace: expected,
      normalizedRationalParallelSectionExists: section.exists,
      ...(section.exists ? {
        normalizedRootValue: section.normalizedRootValue,
        rationalValueSet: section.rationalValueSet,
        negativeValueCount: section.negativeValueCount,
        sectionDigest: section.sectionDigest,
        parallelEdgeChecks: section.parallelEdgeChecks,
        faceTransportChecks: section.faceTransportChecks,
        primitiveOverF2: section.primitiveOverF2,
        untwistingChainIsomorphism: section.untwistingChainIsomorphism,
      } : { inconsistencyWitness: section.inconsistency }),
    });
  }
  assert.deepEqual(kernelCharacters, subspace.elements);

  return {
    subspace: { basis: subspace.basis, elements: subspace.elements, rank: subspace.rank, key: subspace.key },
    deckGroup: "F2^" + String(subspace.rank) + " = S^*",
    degree: cover.degree,
    expectedDegree: 1 << subspace.rank,
    connected: cover.connected,
    principalDeckAction: cover.principalDeckAction,
    principalActionChecks: {
      fibers: cover.deckFiberChecks,
      edges: cover.deckEdgeActionChecks,
      faces: cover.deckFaceActionChecks,
    },
    liftedCells: { vertices: cover.vertexCount, edges: cover.edgeCount, filledFaces: cover.faceCount },
    filledFacesLiftCoherently: cover.coherentFaceLifts === cover.faceCount,
    coherentFilledFaceLiftChecks: cover.coherentFaceLifts,
    flatFaceIdentityChecksAllCharacters,
    liftedCollapseAblation: {
      liftedFreeFaceEdges,
      liftedFilledFaces: cover.faceCount,
      everyLiftedFilledFaceStillCollapsible: liftedFreeFaceEdges === cover.faceCount,
    },
    monodromyRank: rrefBasis(cover.voltages, Math.max(1, subspace.rank)).length,
    coverSignatureDigest: cover.signatureDigest,
    pullbackKernel: kernelCharacters,
    pullbackKernelEqualsS: canonical(kernelCharacters) === canonical(subspace.elements),
    sections,
  };
}

function enumerateOrderedBases(subspace, dimension) {
  if (subspace.rank === 0) return [[]];
  const result = [];
  const nonzero = subspace.elements.filter((value) => value !== 0);
  function visit(chosen) {
    if (chosen.length === subspace.rank) {
      result.push([...chosen]);
      return;
    }
    for (const vector of nonzero) {
      if (rrefBasis([...chosen, vector], dimension).length === chosen.length + 1) {
        visit([...chosen, vector]);
      }
    }
  }
  visit([]);
  return result;
}

function auditHistoryAndBaseChange(complex, subspaces) {
  let transitions = 0;
  let independentTransitions = 0;
  let dependentTransitions = 0;
  let duplicateStutters = 0;
  let zeroPaddingStutters = 0;
  let orderChecks = 0;
  let orderedBasesChecked = 0;
  let voltageNaturalityChecks = 0;
  let deckNaturalityChecks = 0;

  for (const subspace of subspaces) {
    const canonicalBasis = subspace.basis;
    const canonicalKey = subspace.key;
    assert.equal(subspaceKey(rrefBasis([...canonicalBasis].reverse(), complex.n)), canonicalKey);
    orderChecks += 1;
    assert.equal(subspaceKey(rrefBasis([...canonicalBasis, 0], complex.n)), canonicalKey);
    zeroPaddingStutters += 1;
    if (canonicalBasis.length > 0) {
      assert.equal(
        subspaceKey(rrefBasis([...canonicalBasis, canonicalBasis[0]], complex.n)),
        canonicalKey,
      );
      duplicateStutters += 1;
    }

    for (let alpha = 0; alpha < (1 << complex.n); alpha += 1) {
      const successor = rrefBasis([...canonicalBasis, alpha], complex.n);
      const independent = !subspace.elements.includes(alpha);
      assert.equal(successor.length - subspace.rank, independent ? 1 : 0);
      assert.equal((1 << successor.length) / (1 << subspace.rank), independent ? 2 : 1);
      transitions += 1;
      if (independent) independentTransitions += 1;
      else dependentTransitions += 1;
    }

    for (const alternativeBasis of enumerateOrderedBases(subspace, complex.n)) {
      assert.equal(subspaceKey(rrefBasis(alternativeBasis, complex.n)), canonicalKey);
      const changeRows = alternativeBasis.map((vector) => {
        const coordinates = coordinatesInBasis(vector, canonicalBasis);
        assert.notEqual(coordinates, null);
        return coordinates;
      });
      assert.equal(rrefBasis(changeRows, Math.max(1, subspace.rank)).length, subspace.rank);
      for (let hole = 0; hole < complex.n; hole += 1) {
        let canonicalVoltage = 0;
        let alternativeVoltage = 0;
        canonicalBasis.forEach((character, index) => {
          if (((character >> hole) & 1) !== 0) canonicalVoltage |= 1 << index;
        });
        alternativeBasis.forEach((character, index) => {
          if (((character >> hole) & 1) !== 0) alternativeVoltage |= 1 << index;
        });
        assert.equal(applyRowMatrix(changeRows, canonicalVoltage), alternativeVoltage);
        voltageNaturalityChecks += 1;
        for (let deck = 0; deck < (1 << subspace.rank); deck += 1) {
          assert.equal(
            applyRowMatrix(changeRows, deck ^ canonicalVoltage),
            applyRowMatrix(changeRows, deck) ^ alternativeVoltage,
          );
          deckNaturalityChecks += 1;
        }
      }
      orderedBasesChecked += 1;
    }
  }

  return {
    transitions,
    independentTransitions,
    dependentOrZeroTransitions: dependentTransitions,
    rule: "adjoining alpha outside S raises rank by one and doubles the cover; adjoining alpha in S, including zero or a duplicate, leaves the canonical cover unchanged",
    duplicateStutters,
    zeroPaddingStutters,
    orderChecks,
    orderedBasesChecked,
    voltageNaturalityChecks,
    deckNaturalityChecks,
    invariances: {
      order: true,
      zeroPadding: true,
      dependentOrDuplicatePadding: true,
      basisChangeViaDeckLinearIsomorphism: true,
    },
  };
}

function factorDeckCoordinate(deck, smallerBasis, largerBasis) {
  let result = 0;
  smallerBasis.forEach((character, index) => {
    const coordinates = coordinatesInBasis(character, largerBasis);
    assert.notEqual(coordinates, null);
    if (parity(coordinates & deck) !== 0) result |= 1 << index;
  });
  return result;
}

function auditTerminalFactorizations(complex, subspaces) {
  let inclusions = 0;
  let edgeVoltageChecks = 0;
  let liftedEdgeFactorChecks = 0;
  for (const smaller of subspaces) {
    for (const larger of subspaces) {
      if (!smaller.elements.every((value) => larger.elements.includes(value))) continue;
      assert(larger.rank >= smaller.rank);
      assert((1 << larger.rank) % (1 << smaller.rank) === 0);
      for (const edge of complex.edges) {
        const voltageSmall = edgeVoltage(edge, smaller.basis);
        const voltageLarge = edgeVoltage(edge, larger.basis);
        assert.equal(
          factorDeckCoordinate(voltageLarge, smaller.basis, larger.basis),
          voltageSmall,
        );
        edgeVoltageChecks += 1;
        for (let deck = 0; deck < (1 << larger.rank); deck += 1) {
          assert.equal(
            factorDeckCoordinate(deck ^ voltageLarge, smaller.basis, larger.basis),
            factorDeckCoordinate(deck, smaller.basis, larger.basis) ^ voltageSmall,
          );
          liftedEdgeFactorChecks += 1;
        }
      }
      inclusions += 1;
    }
  }
  return {
    subspaceInclusionsChecked: inclusions,
    edgeVoltageChecks,
    liftedEdgeFactorChecks,
    pointedTerminalStatement: "If a connected pointed cover q trivializes every alpha in S, its subgroup lies in intersection_{alpha in S} ker(alpha), so q factors uniquely through p_S. Thus p_S is the coarsest, minimum-degree, terminal pointed trivializing cover.",
    unpointedBoundary: "Without a chosen lift of o, the factorization and deck coordinates are determined only up to deck translation; normalized sign sections also retain an overall plus/minus ambiguity until rooted.",
    pass: true,
  };
}

function auditCoverPortfolio(subspaces, dimension) {
  const characterCount = 1 << dimension;
  const universeMask = (1 << (characterCount - 1)) - 1;
  const candidates = subspaces.filter((subspace) => subspace.rank > 0).map((subspace) => ({
    key: subspace.key,
    rank: subspace.rank,
    degree: 1 << subspace.rank,
    coverage: subspace.elements.filter((alpha) => alpha !== 0).reduce((mask, alpha) => (
      mask | (1 << (alpha - 1))
    ), 0),
  }));
  let costs = Array(1 << (characterCount - 1)).fill(Infinity);
  costs[0] = 0;
  for (const candidate of candidates) {
    const next = [...costs];
    for (let mask = 0; mask < costs.length; mask += 1) {
      if (!Number.isFinite(costs[mask])) continue;
      const covered = mask | candidate.coverage;
      next[covered] = Math.min(next[covered], costs[mask] + candidate.degree);
    }
    costs = next;
  }
  const minimumSumDegree = costs[universeMask];
  assert.equal(minimumSumDegree, 1 << dimension);
  return {
    dimension,
    charactersToCover: characterCount,
    candidateNonzeroSubspaces: candidates.length,
    dynamicProgrammingStates: costs.length,
    minimumSumDegree,
    globalAllCharacterCoverDegree: 1 << dimension,
    unionBoundProof: "For any connected cover q_j, let T_j be its killed-character kernel. Factorization through p_{T_j} gives degree(q_j)>=|T_j|. If the portfolio trivializes every character, union_j T_j=H^1, hence sum_j degree(q_j)>=sum_j |T_j|>=|union_j T_j|=2^n. The dynamic program audits the sharp canonical p_S portfolio bound.",
    singleGlobalCoverAttainsBound: true,
  };
}

function setPartitions(length) {
  if (length === 0) return [[]];
  const result = [];
  const labels = Array(length).fill(0);
  function visit(index, maximum) {
    if (index === length) {
      result.push([...labels]);
      return;
    }
    for (let label = 0; label <= maximum + 1; label += 1) {
      labels[index] = label;
      visit(index + 1, Math.max(maximum, label));
    }
  }
  labels[0] = 0;
  if (length === 1) result.push([0]);
  else visit(1, 0);
  return result;
}

function auditEncoderSignatures(subspaces, dimension) {
  const subspaceCensus = subspaces.map((subspace) => {
    const signatures = new Map();
    for (let source = 0; source < (1 << dimension); source += 1) {
      let signature = 0;
      subspace.basis.forEach((period, index) => {
        if (parity(period & source) !== 0) signature |= 1 << index;
      });
      if (!signatures.has(signature)) signatures.set(signature, []);
      signatures.get(signature).push(source);
    }
    assert.equal(signatures.size, 1 << subspace.rank);
    assert([...signatures.values()].every((fiber) => fiber.length === (1 << (dimension - subspace.rank))));
    return {
      subspaceKey: subspace.key,
      rank: subspace.rank,
      exactDistinctSignatures: signatures.size,
      minimumEncoderStates: 1 << subspace.rank,
      minimumCapacityBits: subspace.rank,
      signatureFiberSize: 1 << (dimension - subspace.rank),
    };
  });

  const partitionCensus = range(Math.min(3, dimension) + 1).map((activeDimension) => {
    const signatureCount = 1 << activeDimension;
    const partitions = setPartitions(signatureCount);
    const decoderCompatible = partitions.filter((partition) => {
      for (let left = 0; left < signatureCount; left += 1) {
        for (let right = left + 1; right < signatureCount; right += 1) {
          if (partition[left] === partition[right]) return false;
        }
      }
      return true;
    });
    assert.equal(decoderCompatible.length, 1);
    return {
      activeDimension,
      quotientSignatureCount: signatureCount,
      arbitraryNonlinearEncoderPartitionsEnumerated: partitions.length,
      partitionsSupportingAllPeriodDecoders: decoderCompatible.length,
      minimumStates: signatureCount,
      capacityBits: activeDimension,
    };
  });

  return {
    sourceTyping: "The requested encoder is E:H^1(K_n;F2)->Q after the displayed alpha_i basis identifies H^1 with F2^n and equips those coordinates with the dot pairing alpha(x). In invariant dual language the same census encodes x in H_1 and lets alpha in H^1 evaluate x.",
    exactSubspaceSignatureCensus: subspaceCensus,
    arbitraryNonlinearPartitionCensusThroughDimension3: partitionCensus,
    theorem: "For a fixed history-blind encoder E:H^1->Q in the stated coordinates, made before the active period is known, if every alpha in a d-dimensional S has a decoder D_alpha with D_alpha(E(x))=alpha(x), then equal codes have equal S-signatures. There are exactly 2^d signatures, so |im E|>=2^d and capacity is at least d bits. No linearity of E or its decoders is assumed.",
    activeOnePeriodOutput: {
      nonzeroPeriodOutputStates: 2,
      outputBits: 1,
      statement: "Once one nonzero alpha is active, the requested output alpha(x) is one bit.",
    },
    collapseBoundaries: {
      earlyHistory: "If alpha is supplied before encoding, E_alpha(x)=alpha(x) uses only two states; the fixed history-blind lower bound disappears.",
      sourceRevisit: "If x can be revisited after alpha arrives, alpha(x) can be recomputed with one output bit and no reusable 2^d-state fossil.",
      simultaneousMemory: "The one-bit active output is bandwidth for one period, not an unconditional bound on the total state retained by the active architecture or its cover.",
      capacityMetric: "Capacity is log2 of the number of reachable exact code states, not Shannon entropy, expected description length, amortized storage, or approximate recovery.",
    },
  };
}

function auditAtlasDimension(n) {
  const complex = buildKn(n);
  const complexAudit = auditKn(n);
  const subspaces = enumerateSubspaces(n);
  const covers = subspaces.map((subspace) => auditActiveCover(complex, subspace));
  assert(covers.every((cover) => cover.connected));
  assert(covers.every((cover) => cover.principalDeckAction));
  assert(covers.every((cover) => cover.pullbackKernelEqualsS));
  assert(covers.every((cover) => cover.filledFacesLiftCoherently));
  const ranks = range(n + 1).map((rank) => ({
    rank,
    subspaceCount: subspaces.filter((subspace) => subspace.rank === rank).length,
    activeCoverDegree: 1 << rank,
    globalToActiveDegreeRatio: 1 << (n - rank),
  }));
  const full = covers.find((cover) => cover.subspace.rank === n);
  assert(full);
  assert.equal(full.degree, 1 << n);
  return {
    n,
    complex: complexAudit,
    subspaceCount: subspaces.length,
    ranks,
    globalAllCharacterCover: {
      activeSubspace: "H^1",
      rank: n,
      degree: full.degree,
      kernelSize: full.pullbackKernel.length,
      trivializesEveryCharacter: full.pullbackKernel.length === (1 << n),
    },
    covers,
    historyAndBaseChange: auditHistoryAndBaseChange(complex, subspaces),
    terminalFactorizations: auditTerminalFactorizations(complex, subspaces),
    portfolio: auditCoverPortfolio(subspaces, n),
    encoder: auditEncoderSignatures(subspaces, n),
  };
}

function buildPayload() {
  const atlas = range(MAX_N).map((index) => auditAtlasDimension(index + 1));
  const modelDescriptor = clone(PRIVATE_MODEL_DESCRIPTOR);
  assert(isDeepFrozen(PRIVATE_MODEL_DESCRIPTOR));
  assert.notStrictEqual(modelDescriptor, PRIVATE_MODEL_DESCRIPTOR);
  assert.notStrictEqual(modelDescriptor.complexPattern, PRIVATE_MODEL_DESCRIPTOR.complexPattern);
  return {
    title: "Genesis active cohomology atlas",
    status: "exact finite certificate with scoped general proofs",
    auditScope: {
      exhaustiveDimensions: [1, 2, 3, 4],
      generalFamilyBasis: "The formulas for arbitrary n follow cell-by-cell from the displayed construction, the n independent free-face collapses, and the evaluation-cover factorization argument; only n<=4 is exhaustively enumerated here.",
    },
    modelDescriptor,
    certificateIsolation: {
      privateModelRecursivelyFrozen: true,
      payloadModelDeepCloned: true,
      replayExpectedPayloadExposedToCaller: false,
    },
    familyTheorem: {
      complex: "K_n has one common vertex o and, for each i, a filled triangle (o,a_i,b_i) sharing ob_i with the boundary of an unfilled triangle (o,b_i,c_i).",
      cellCounts: "V=1+3n, E=5n, F=n",
      cohomology: "H_1(K_n;F2)=H^1(K_n;F2)=F2^n; the cellular cochain d1 is nonzero of rank n",
      collapseBoundary: "Every filled face has free edge oa_i; after collapsing it and the resulting leaf a_i--b_i, K_n is a wedge of n circles. Thus d1 is not load-bearing.",
    },
    activeCoverTheorem: {
      statement: "For S<=H^1(K_n;F2), the evaluation map pi_1(K_n)->S^* defines a connected principal S^*-cover p_S of degree 2^rank(S), and ker(p_S^*:H^1(K_n;F2)->H^1(Y_S;F2))=S.",
      coarsestTyping: "In the category of connected pointed covers over K_n that trivialize S, p_S is terminal: every such cover factors uniquely through p_S. Equivalently it is the coarsest and minimum-degree pointed trivializing cover.",
      sectionEquivalence: "For alpha in H^1, p_S^*L_alpha has a root-normalized rational parallel section exactly when alpha is in S; equivalently p_S^*alpha has a normalized F2 primitive.",
      twistedDifferentials: {
        d0: "(d0_alpha f)_ij = f_j - T_ij f_i",
        d1: "(d1_alpha eta)_ijk = eta_jk - eta_ik + T_jk eta_ij",
        faceIdentity: "T_ik = T_jk T_ij",
        untwisting: "A normalized parallel section s defines U_q by multiplication by s at the final vertex, and d_alpha U = U d.",
      },
      rootBoundary: "The root fixes the deck-coordinate origin and the sign of the normalized section. Unrooted statements retain deck-translation and overall sign ambiguity.",
      collapseCompatibility: "Every lifted filled face retains a lifted free oa_i edge, so the active covers also collapse to graph covers. The section and kernel result is not powered by irreducible two-dimensional cells.",
    },
    atlas,
    exactGlobalComparisons: atlas.map((entry) => ({
      n: entry.n,
      globalAllCharacterDegree: 1 << entry.n,
      activeDegreesByRank: entry.ranks.map((row) => ({ rank: row.rank, degree: row.activeCoverDegree })),
      portfolioMinimumSumDegree: entry.portfolio.minimumSumDegree,
    })),
    claimLedger: {
      standardFacts: [
        "Classification of F2 characters by double covers and of a finite character space S by the evaluation cover with deck group S^*.",
        "Pullback trivialization of sign local systems and normalized parallel sections on rooted connected covers.",
        "Finite-dimensional signature-counting and decoder lower bounds.",
      ],
      conditionalArchitecturalClaim: "The 2^d fixed-encoder lower bound versus one active output bit is Level B only under a history-blind, source-unavailable, all-period decoder requirement.",
      explicitlyNotClaimed: [
        "No Level C separation.",
        "No unconditional total-memory advantage.",
        "No AI architecture theorem.",
        "No nonsoficity theorem.",
        "No result on Hodge, Navier-Stokes, Collatz, Riemann, P versus NP, or any other open conjecture.",
        "No mathematical novelty claim; the cover and cohomology mechanisms are standard.",
        "No native sheaf-theoretic or intrinsically two-dimensional success: K_n collapses to a graph.",
      ],
      gapKillers: [
        "Giving the old observer the active history before encoding reduces one requested period to one bit.",
        "Allowing the old observer to revisit the source after each period arrives removes the reusable fixed-code requirement.",
      ],
      classification: "Standard cohomological/trivializing-cover mathematics plus a conditional Level B architecture calibration; not Level C.",
    },
  };
}

function findUnknownKey(candidate, expected, path = "$") {
  if (!candidate || typeof candidate !== "object") return null;
  if (!expected || typeof expected !== "object") return null;
  if (Array.isArray(candidate)) {
    if (!Array.isArray(expected)) return null;
    const length = Math.min(candidate.length, expected.length);
    for (let index = 0; index < length; index += 1) {
      const nested = findUnknownKey(candidate[index], expected[index], path + "[" + String(index) + "]");
      if (nested) return nested;
    }
    return null;
  }
  if (Array.isArray(expected)) return null;
  for (const key of Object.keys(candidate)) {
    if (!Object.hasOwn(expected, key)) return path + "." + key;
    const nested = findUnknownKey(candidate[key], expected[key], path + "." + key);
    if (nested) return nested;
  }
  return null;
}

function verifyPayloadEnvelope(envelope, expectedPayload) {
  if (!envelope || typeof envelope !== "object") return { ok: false, reason: "malformed-envelope" };
  if (!envelope.payload || typeof envelope.payload !== "object") {
    return { ok: false, reason: "missing-payload" };
  }
  const plainPayload = validatePlainJsonTree(envelope.payload, "$.payload");
  if (!plainPayload.ok) return plainPayload;
  const unknownKey = findUnknownKey(envelope.payload, expectedPayload, "$.payload");
  if (unknownKey) return { ok: false, reason: "unknown-key", path: unknownKey };
  if (envelope.payloadDigest !== digest(envelope.payload)) {
    return { ok: false, reason: "payload-digest-mismatch" };
  }
  if (canonical(envelope.payload) !== canonical(expectedPayload)) {
    return { ok: false, reason: "semantic-mismatch" };
  }
  return { ok: true, reason: "verified" };
}

function runTamperAudit(payload) {
  const mutations = [
    { name: "cell-count", mutate: (value) => { value.atlas[0].complex.cells.edges = 4; } },
    { name: "cohomology-dimension", mutate: (value) => { value.atlas[3].complex.cohomologyOverF2.H1 = 3; } },
    { name: "promote-d1", mutate: (value) => { value.atlas[1].complex.collapseAblation.d1LoadBearing = true; }, rehash: true },
    { name: "cover-degree", mutate: (value) => { value.atlas[2].covers.at(-1).degree = 7; } },
    { name: "kernel-character", mutate: (value) => { value.atlas[1].covers.at(-1).pullbackKernel.pop(); } },
    { name: "section-existence", mutate: (value) => { value.atlas[0].covers[0].sections[1].normalizedRationalParallelSectionExists = true; }, rehash: true },
    { name: "face-coherence", mutate: (value) => { value.atlas[2].covers[1].filledFacesLiftCoherently = false; } },
    { name: "history-double", mutate: (value) => { value.atlas[3].historyAndBaseChange.independentTransitions -= 1; } },
    { name: "base-change", mutate: (value) => { value.atlas[3].historyAndBaseChange.invariances.basisChangeViaDeckLinearIsomorphism = false; }, rehash: true },
    { name: "terminal-factorization", mutate: (value) => { value.atlas[2].terminalFactorizations.pass = false; } },
    { name: "portfolio-bound", mutate: (value) => { value.atlas[3].portfolio.minimumSumDegree = 15; }, rehash: true },
    { name: "encoder-capacity", mutate: (value) => { value.atlas[3].encoder.exactSubspaceSignatureCensus.at(-1).minimumCapacityBits = 3; } },
    { name: "erase-early-history-boundary", mutate: (value) => { delete value.atlas[0].encoder.collapseBoundaries.earlyHistory; }, rehash: true },
    { name: "forge-level-c", mutate: (value) => { value.claimLedger.conditionalArchitecturalClaim = "Level C"; }, rehash: true },
    { name: "forge-novelty", mutate: (value) => { value.claimLedger.classification = "novel theorem"; }, rehash: true },
    {
      name: "nested-model-alias-poison",
      mutate: (value) => { value.modelDescriptor.complexPattern.commonVertex = "poison"; },
      rehash: true,
      expectedReason: "semantic-mismatch",
    },
    {
      name: "nested-cover-alias-poison",
      mutate: (value) => { value.atlas[0].covers[0].sections[0].normalizedRootValue = -1; },
      rehash: true,
      expectedReason: "semantic-mismatch",
    },
    {
      name: "unknown-payload-key",
      mutate: (value) => { value.atlas[0].complex.__unknown = true; },
      rehash: true,
      expectedReason: "unknown-key",
    },
    {
      name: "named-array-property",
      mutate: (value) => { value.atlas.__poison = "x"; },
      rehash: false,
      expectedReason: "unknown-key",
    },
  ];
  const results = mutations.map((mutation) => {
    const candidatePayload = clone(payload);
    mutation.mutate(candidatePayload);
    const candidate = {
      payload: candidatePayload,
      payloadDigest: mutation.rehash ? digest(candidatePayload) : digest(payload),
    };
    const verification = verifyPayloadEnvelope(candidate, payload);
    assert.equal(verification.ok, false);
    if (mutation.expectedReason) assert.equal(verification.reason, mutation.expectedReason);
    return {
      name: mutation.name,
      rehashed: mutation.rehash === true,
      rejected: true,
      reason: verification.reason,
    };
  });
  return {
    tested: results.length,
    rejected: results.filter((result) => result.rejected).length,
    semanticForgeriesRejected: results.filter((result) => result.reason === "semantic-mismatch").length,
    unknownKeysRejected: results.filter((result) => result.reason === "unknown-key").length,
    pass: results.every((result) => result.rejected),
    results,
  };
}

function buildCertificate() {
  const payload = buildPayload();
  const payloadDigest = digest(payload);
  const tamperAudit = runTamperAudit(payload);
  const body = { schema: SCHEMA, payload, payloadDigest, tamperAudit };
  return { ...body, certificateDigest: digest(body) };
}

export function replayGenesisActiveCohomologyAtlasCertificate(certificate) {
  try {
    if (!certificate || typeof certificate !== "object") {
      return { ok: false, reason: "malformed-certificate" };
    }
    const plainCertificate = validatePlainJsonTree(certificate, "$");
    if (!plainCertificate.ok) return plainCertificate;
    const allowedTopLevelKeys = new Set([
      "schema", "payload", "payloadDigest", "tamperAudit", "certificateDigest",
    ]);
    const ownTopLevelKeys = Object.keys(certificate);
    const unknownTopLevelKey = ownTopLevelKeys.find((key) => !allowedTopLevelKeys.has(key));
    if (unknownTopLevelKey) {
      return { ok: false, reason: "unknown-key", path: "$." + unknownTopLevelKey };
    }
    const missingTopLevelKey = [...allowedTopLevelKeys].find((key) => !Object.hasOwn(certificate, key));
    if (missingTopLevelKey) {
      return { ok: false, reason: "missing-key", path: "$." + missingTopLevelKey };
    }
    if (certificate.schema !== SCHEMA) return { ok: false, reason: "schema-mismatch" };
    const body = clone(certificate);
    delete body.certificateDigest;
    if (certificate.certificateDigest !== digest(body)) {
      return { ok: false, reason: "certificate-digest-mismatch" };
    }
    const expectedPayload = buildPayload();
    const payloadVerification = verifyPayloadEnvelope(certificate, expectedPayload);
    if (!payloadVerification.ok) return payloadVerification;
    const expectedTamperAudit = runTamperAudit(expectedPayload);
    const unknownAuditKey = findUnknownKey(
      certificate.tamperAudit,
      expectedTamperAudit,
      "$.tamperAudit",
    );
    if (unknownAuditKey) return { ok: false, reason: "unknown-key", path: unknownAuditKey };
    if (canonical(certificate.tamperAudit) !== canonical(expectedTamperAudit)) {
      return { ok: false, reason: "tamper-audit-mismatch" };
    }
    return {
      ok: true,
      reason: "verified-by-semantic-recomputation",
      schema: certificate.schema,
      certificateDigest: certificate.certificateDigest,
      payloadDigest: certificate.payloadDigest,
      tamperRejected: certificate.tamperAudit.rejected,
    };
  } catch (error) {
    return { ok: false, reason: "exception", message: error.message };
  }
}

function rehashCertificateInPlace(certificate) {
  certificate.payloadDigest = digest(certificate.payload);
  const body = clone(certificate);
  delete body.certificateDigest;
  certificate.certificateDigest = digest(body);
}

function runSecurityRegressions(pristineCertificate) {
  const privateDigestBefore = digest(PRIVATE_MODEL_DESCRIPTOR);
  const aliasCandidate = buildCertificate();
  aliasCandidate.payload.modelDescriptor.complexPattern.commonVertex = "poison";
  aliasCandidate.payload.atlas[0].covers[0].sections[0].normalizedRootValue = -1;
  rehashCertificateInPlace(aliasCandidate);
  const aliasVerification = replayGenesisActiveCohomologyAtlasCertificate(aliasCandidate);
  assert.equal(aliasVerification.ok, false);
  assert.equal(aliasVerification.reason, "semantic-mismatch");
  assert.equal(digest(PRIVATE_MODEL_DESCRIPTOR), privateDigestBefore);

  const unknownCandidate = clone(pristineCertificate);
  unknownCandidate.__unknown = true;
  rehashCertificateInPlace(unknownCandidate);
  const unknownVerification = replayGenesisActiveCohomologyAtlasCertificate(unknownCandidate);
  assert.equal(unknownVerification.ok, false);
  assert.equal(unknownVerification.reason, "unknown-key");

  const arrayPropertyCandidate = clone(pristineCertificate);
  arrayPropertyCandidate.payload.atlas.__poison = "x";
  const {
    certificateDigest: arrayPropertyCertificateDigest,
    ...arrayPropertyBody
  } = arrayPropertyCandidate;
  const legacyArrayPropertyDigestUnchanged =
    digest(arrayPropertyBody) === arrayPropertyCertificateDigest;
  assert.equal(legacyArrayPropertyDigestUnchanged, true);
  const arrayPropertyVerification = replayGenesisActiveCohomologyAtlasCertificate(
    arrayPropertyCandidate,
  );
  assert.equal(arrayPropertyVerification.ok, false);
  assert.equal(arrayPropertyVerification.reason, "unknown-key");

  const inheritedPrototype = {
    ...pristineCertificate,
    certificateDigest: digest({}),
  };
  const inheritedCandidate = Object.create(inheritedPrototype);
  const inheritedVerification = replayGenesisActiveCohomologyAtlasCertificate(
    inheritedCandidate,
  );
  assert.equal(inheritedVerification.ok, false);
  assert.equal(inheritedVerification.reason, "non-plain-object");

  return {
    rehashedNestedAliasAttack: {
      payloadAndCertificateDigestsRehashed: true,
      privateModelUnchanged: digest(PRIVATE_MODEL_DESCRIPTOR) === privateDigestBefore,
      rejected: true,
      requiredReason: "semantic-mismatch",
      reason: aliasVerification.reason,
    },
    rehashedUnknownTopLevelKeyAttack: {
      payloadAndCertificateDigestsRehashed: true,
      rejected: true,
      requiredReason: "unknown-key",
      reason: unknownVerification.reason,
    },
    namedArrayPropertyAttack: {
      digestWasUnchangedByLegacyCanonicalizer: legacyArrayPropertyDigestUnchanged,
      rejected: true,
      requiredReason: "unknown-key",
      reason: arrayPropertyVerification.reason,
    },
    prototypeInheritedCertificateAttack: {
      zeroOwnKeys: Object.keys(inheritedCandidate).length === 0,
      rejected: true,
      requiredReason: "non-plain-object",
      reason: inheritedVerification.reason,
    },
    pass: true,
  };
}

export function runGenesisActiveCohomologyAtlas() {
  const certificate = buildCertificate();
  const replay = replayGenesisActiveCohomologyAtlasCertificate(certificate);
  assert.equal(replay.ok, true);
  const securityRegressions = runSecurityRegressions(certificate);
  const rerun = buildCertificate();
  const deterministicReplay = {
    identicalCertificate: canonical(certificate) === canonical(rerun),
    identicalDigest: certificate.certificateDigest === rerun.certificateDigest,
  };
  assert.equal(deterministicReplay.identicalCertificate, true);
  assert.equal(deterministicReplay.identicalDigest, true);
  return {
    ok: true,
    certificate,
    replay,
    securityRegressions,
    deterministicReplay,
  };
}

export {
  runGenesisActiveCohomologyAtlas as run,
  replayGenesisActiveCohomologyAtlasCertificate as replay,
};

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  const result = runGenesisActiveCohomologyAtlas();
  const payload = result.certificate.payload;
  console.log(JSON.stringify({
    ok: result.ok,
    certificateDigest: result.certificate.certificateDigest,
    payloadDigest: result.certificate.payloadDigest,
    dimensions: payload.atlas.map((entry) => ({
      n: entry.n,
      cells: entry.complex.cells,
      H1: entry.complex.homologyOverF2.H1,
      HOne: entry.complex.cohomologyOverF2.H1,
      rankD1: entry.complex.chainAudit.rankD1,
      collapsesToWedge: entry.complex.collapseAblation.cohomologyPreserved,
      subspaces: entry.subspaceCount,
      allCoversConnected: entry.covers.every((cover) => cover.connected),
      allKernelsExact: entry.covers.every((cover) => cover.pullbackKernelEqualsS),
      globalDegree: entry.globalAllCharacterCover.degree,
      portfolioMinimum: entry.portfolio.minimumSumDegree,
    })),
    history: payload.atlas.map((entry) => ({
      n: entry.n,
      transitions: entry.historyAndBaseChange.transitions,
      independentDouble: entry.historyAndBaseChange.independentTransitions,
      dependentStutter: entry.historyAndBaseChange.dependentOrZeroTransitions,
      orderedBasesChecked: entry.historyAndBaseChange.orderedBasesChecked,
    })),
    nonlinearEncoderPartitions: payload.atlas.at(-1).encoder
      .arbitraryNonlinearPartitionCensusThroughDimension3,
    tamper: {
      tested: result.certificate.tamperAudit.tested,
      rejected: result.certificate.tamperAudit.rejected,
    },
    securityRegressions: result.securityRegressions,
    deterministicReplay: result.deterministicReplay,
  }, null, 2));
}
