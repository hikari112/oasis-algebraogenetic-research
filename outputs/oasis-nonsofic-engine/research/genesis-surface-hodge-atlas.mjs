import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SCHEMA = "genesis.surface-hodge-atlas.v1";
const MAX_GENUS = 2;

const PRIVATE_MODEL = deepFreeze({
  family: "closed orientable genus-g surface with one vertex, 2g loop cells, and one commutator-product face",
  activeDatum: "a subspace S of H^1(Sigma_g;F2)",
  repair: "the rooted evaluation cover with deck group S^*",
  laterOperator: "the rational sign-local-system cellular Hodge Laplacian",
});

function range(length) {
  return Array.from({ length }, (_, index) => index);
}

function compareNumbers(left, right) {
  return left - right;
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function parity(value) {
  let result = 0;
  let remaining = value >>> 0;
  while (remaining !== 0) {
    result ^= remaining & 1;
    remaining >>>= 1;
  }
  return result;
}

function popcount(value) {
  let count = 0;
  let remaining = value >>> 0;
  while (remaining !== 0) {
    count += remaining & 1;
    remaining >>>= 1;
  }
  return count;
}

function highestBitNumber(value) {
  assert(value > 0);
  return 31 - Math.clz32(value);
}

function highestBitBigInt(value) {
  assert(value > 0n);
  let pivot = -1;
  let remaining = value;
  while (remaining > 0n) {
    pivot += 1;
    remaining >>= 1n;
  }
  return pivot;
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
  const rows = [...new Set(vectors.map((value) => value & mask).filter(Boolean))];
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
  return rows.filter(Boolean).sort((left, right) => (
    highestBitNumber(right) - highestBitNumber(left) || right - left
  ));
}

function spanElements(basis) {
  const values = [];
  for (let coefficients = 0; coefficients < (1 << basis.length); coefficients += 1) {
    let value = 0;
    basis.forEach((row, index) => {
      if (((coefficients >> index) & 1) !== 0) value ^= row;
    });
    values.push(value);
  }
  return values.sort(compareNumbers);
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

function enumerateOrderedBases(subspace, dimension) {
  const nonzero = subspace.elements.filter(Boolean);
  const results = [];
  function visit(chosen) {
    if (chosen.length === subspace.rank) {
      results.push([...chosen]);
      return;
    }
    for (const vector of nonzero) {
      if (chosen.includes(vector)) continue;
      if (rrefBasis([...chosen, vector], dimension).length !== chosen.length + 1) continue;
      visit([...chosen, vector]);
    }
  }
  visit([]);
  return results;
}

function applyBasis(basis, vector) {
  let result = 0;
  basis.forEach((row, index) => {
    if (parity(row & vector) !== 0) result |= 1 << index;
  });
  return result;
}

function dualCoordinateMap(sourceBasis, targetBasis, sourceDeck) {
  let targetDeck = 0;
  targetBasis.forEach((targetRow, index) => {
    const coefficients = coordinatesInBasis(targetRow, sourceBasis);
    assert.notEqual(coefficients, null);
    if (parity(coefficients & sourceDeck) !== 0) targetDeck |= 1 << index;
  });
  return targetDeck;
}

function surfaceWord(genus) {
  const word = [];
  for (let handle = 0; handle < genus; handle += 1) {
    const a = 2 * handle;
    const b = a + 1;
    word.push([a, 1], [b, 1], [a, -1], [b, -1]);
  }
  return word;
}

function buildCover(genus, basis) {
  const dimension = 2 * genus;
  const deckSize = 1 << basis.length;
  const voltages = range(dimension).map((edge) => applyBasis(basis, 1 << edge));
  const edges = [];
  for (let sheet = 0; sheet < deckSize; sheet += 1) {
    for (let edge = 0; edge < dimension; edge += 1) {
      edges.push({
        id: sheet * dimension + edge,
        generator: edge,
        sheet,
        from: sheet,
        to: sheet ^ voltages[edge],
      });
    }
  }
  const edgeBoundaries = edges.map((edge) => (
    edge.from === edge.to ? 0n : (1n << BigInt(edge.from)) ^ (1n << BigInt(edge.to))
  ));
  const faceBoundaries = [];
  for (let faceSheet = 0; faceSheet < deckSize; faceSheet += 1) {
    let current = faceSheet;
    let boundary = 0n;
    for (const [generator, sign] of surfaceWord(genus)) {
      const liftSheet = sign > 0 ? current : current ^ voltages[generator];
      boundary ^= 1n << BigInt(liftSheet * dimension + generator);
      current ^= voltages[generator];
    }
    assert.equal(current, faceSheet);
    faceBoundaries.push(boundary);
  }
  for (const face of faceBoundaries) {
    let boundarySquared = 0n;
    for (let edge = 0; edge < edges.length; edge += 1) {
      if (((face >> BigInt(edge)) & 1n) !== 0n) boundarySquared ^= edgeBoundaries[edge];
    }
    assert.equal(boundarySquared, 0n);
  }
  const rankBoundary1 = gf2RankBigInt(edgeBoundaries);
  const rankBoundary2 = gf2RankBigInt(faceBoundaries);
  const cells = { vertices: deckSize, edges: dimension * deckSize, faces: deckSize };
  const betti = {
    b0: cells.vertices - rankBoundary1,
    b1: cells.edges - rankBoundary1 - rankBoundary2,
    b2: cells.faces - rankBoundary2,
  };
  const graphShadowB1 = cells.edges - rankBoundary1;
  return {
    genus,
    dimension,
    rank: basis.length,
    basis,
    deckSize,
    voltages,
    edges,
    edgeBoundaries,
    faceBoundaries,
    rankBoundary1,
    rankBoundary2,
    cells,
    betti,
    graphShadowB1,
  };
}

function normalizedPotential(cover, character) {
  const values = Array(cover.deckSize).fill(null);
  const adjacency = range(cover.deckSize).map(() => []);
  for (const edge of cover.edges) {
    const jump = (character >> edge.generator) & 1;
    adjacency[edge.from].push([edge.to, jump]);
    adjacency[edge.to].push([edge.from, jump]);
  }
  values[0] = 0;
  const queue = [0];
  let consistent = true;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const from = queue[cursor];
    for (const [to, jump] of adjacency[from]) {
      const expected = values[from] ^ jump;
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

function dot(left, right) {
  assert.equal(left.length, right.length);
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function twistedSurfaceAudit(genus, character) {
  const dimension = 2 * genus;
  const d0 = [];
  const d1 = [];
  for (let handle = 0; handle < genus; handle += 1) {
    const a = ((character >> (2 * handle)) & 1) !== 0 ? -1 : 1;
    const b = ((character >> (2 * handle + 1)) & 1) !== 0 ? -1 : 1;
    d0.push(a - 1, b - 1);
    d1.push(1 - b, a - 1);
  }
  const weight = popcount(character);
  const composition = dot(d1, d0);
  const normD0 = dot(d0, d0);
  const normD1 = dot(d1, d1);
  const orthogonality = dot(d0, d1);
  assert.equal(composition, 0);
  assert.equal(orthogonality, 0);
  assert.equal(normD0, 4 * weight);
  assert.equal(normD1, 4 * weight);
  const nontrivial = character !== 0;
  const ranks = { d0: nontrivial ? 1 : 0, d1: nontrivial ? 1 : 0 };
  const cohomology = {
    h0: 1 - ranks.d0,
    h1: dimension - ranks.d0 - ranks.d1,
    h2: 1 - ranks.d1,
  };
  assert.deepEqual(cohomology, nontrivial
    ? { h0: 0, h1: 2 * genus - 2, h2: 0 }
    : { h0: 1, h1: 2 * genus, h2: 1 });
  return {
    character,
    weight,
    d0,
    d1,
    composition,
    laplacian: {
      fullPositiveRank: nontrivial ? 2 : 0,
      graphShadowPositiveRank: nontrivial ? 1 : 0,
      faceModesLostOnAblation: nontrivial ? 1 : 0,
      twoImageDirectionsOrthogonal: orthogonality === 0,
      positiveEigenvalueInDisplayedCellMetric: nontrivial ? 4 * weight : 0,
      chartBoundary: "The numerical eigenvalue uses the displayed equal-cell metric. The two ranks and the one face-mode loss are invariant under chain isomorphism; arbitrary recoding need not be isometric.",
    },
    cohomology,
  };
}

function auditPresentationSymmetries(genus, twisted) {
  const dimension = 2 * genus;
  const actions = [];
  const permutations = genus === 1 ? [[0]] : [[0, 1], [1, 0]];
  for (const permutation of permutations) {
    for (let swaps = 0; swaps < (1 << genus); swaps += 1) {
      const edgeMap = Array(dimension).fill(0);
      for (let handle = 0; handle < genus; handle += 1) {
        const target = permutation[handle];
        const swap = ((swaps >> handle) & 1) !== 0;
        edgeMap[2 * handle] = 2 * target + (swap ? 1 : 0);
        edgeMap[2 * handle + 1] = 2 * target + (swap ? 0 : 1);
      }
      const mapped = twisted.map((audit) => {
        let character = 0;
        range(dimension).forEach((edge) => {
          if (((audit.character >> edge) & 1) !== 0) character |= 1 << edgeMap[edge];
        });
        const target = twisted[character];
        assert.equal(target.weight, audit.weight);
        assert.deepEqual(target.cohomology, audit.cohomology);
        assert.equal(
          target.laplacian.faceModesLostOnAblation,
          audit.laplacian.faceModesLostOnAblation,
        );
        return character;
      });
      assert.equal(new Set(mapped).size, 1 << dimension);
      actions.push({ permutation: [...permutation], swaps, bijective: true });
    }
  }
  return {
    actionsChecked: actions.length,
    coordinateControls: actions,
    scope: "The audited handle-coordinate permutations and a/b coordinate swaps preserve the displayed twisted ranks, eigenvalues, and face-mode counts. They are algebraic coordinate controls; not every independent swap is a literal cellular relabeling of the fixed one-face presentation. Full mapping-class recoding preserves cohomology ranks but not necessarily the displayed equal-cell metric and is theorem-level rather than exhaustively enumerated here.",
  };
}

function auditBasisGauge(subspace, dimension) {
  const orderedBases = enumerateOrderedBases(subspace, dimension);
  for (const basis of orderedBases) {
    assert.equal(subspaceKey(rrefBasis(basis, dimension)), subspace.key);
    for (let edge = 0; edge < dimension; edge += 1) {
      const sourceVoltage = applyBasis(basis, 1 << edge);
      const targetVoltage = applyBasis(subspace.basis, 1 << edge);
      assert.equal(dualCoordinateMap(basis, subspace.basis, sourceVoltage), targetVoltage);
    }
    const deckImages = range(1 << subspace.rank).map((deck) => (
      dualCoordinateMap(basis, subspace.basis, deck)
    ));
    assert.equal(new Set(deckImages).size, 1 << subspace.rank);
  }
  return {
    orderedBasesChecked: orderedBases.length,
    dualCoordinateMapsBijective: true,
    edgeVoltagesIntertwined: true,
  };
}

function auditSubspace(genus, subspace, twisted) {
  const dimension = 2 * genus;
  const cover = buildCover(genus, subspace.basis);
  const expectedGenus = 1 + cover.deckSize * (genus - 1);
  assert.equal(cover.rankBoundary1, cover.deckSize - 1);
  assert.equal(cover.rankBoundary2, cover.deckSize - 1);
  assert.deepEqual(cover.betti, {
    b0: 1,
    b1: 2 * expectedGenus,
    b2: 1,
  });
  assert.equal(cover.graphShadowB1 - cover.betti.b1, cover.deckSize - 1);

  let pullbackKernel = [];
  const sections = [];
  for (let character = 0; character < (1 << dimension); character += 1) {
    const potential = normalizedPotential(cover, character);
    if (potential.exists) pullbackKernel.push(character);
    const expected = subspace.elements.includes(character);
    assert.equal(potential.exists, expected);
    if (expected) {
      const coordinates = coordinatesInBasis(character, subspace.basis);
      assert.notEqual(coordinates, null);
      for (let sheet = 0; sheet < cover.deckSize; sheet += 1) {
        assert.equal(potential.values[sheet], parity(coordinates & sheet));
      }
      for (const edge of cover.edges) {
        const transport = ((character >> edge.generator) & 1) !== 0 ? -1 : 1;
        const sourceSign = potential.values[edge.from] === 0 ? 1 : -1;
        const targetSign = potential.values[edge.to] === 0 ? 1 : -1;
        assert.equal(targetSign, transport * sourceSign);
      }
      sections.push({
        character,
        rootValue: 1,
        parallelOnEveryLiftedEdge: true,
        uniqueAfterRootNormalization: true,
        zeroDirichletEnergy: true,
      });
    }
  }
  pullbackKernel = pullbackKernel.sort(compareNumbers);
  assert.deepEqual(pullbackKernel, subspace.elements);

  const characterCohomology = subspace.elements.map((character) => twisted[character]);
  const decomposedBetti = {
    b0: characterCohomology.reduce((sum, row) => sum + row.cohomology.h0, 0),
    b1: characterCohomology.reduce((sum, row) => sum + row.cohomology.h1, 0),
    b2: characterCohomology.reduce((sum, row) => sum + row.cohomology.h2, 0),
  };
  assert.deepEqual(decomposedBetti, cover.betti);
  const faceModes = characterCohomology.reduce((sum, row) => (
    sum + row.laplacian.faceModesLostOnAblation
  ), 0);
  assert.equal(faceModes, cover.deckSize - 1);

  const gauge = auditBasisGauge(subspace, dimension);
  return {
    key: subspace.key,
    rank: subspace.rank,
    basis: subspace.basis,
    elements: subspace.elements,
    cover: {
      deckGroup: "S^*",
      degree: cover.deckSize,
      genus: expectedGenus,
      cells: cover.cells,
      boundaryRanks: { d1: cover.rankBoundary1, d2: cover.rankBoundary2 },
      betti: cover.betti,
      connected: cover.betti.b0 === 1,
      topClassRetained: cover.betti.b2 === 1,
    },
    pullbackKernel,
    sections,
    regularCharacterDecomposition: {
      betti: decomposedBetti,
      characters: subspace.elements.length,
      nontrivialCharacters: cover.deckSize - 1,
      faceModes: faceModes,
    },
    faceAblation: {
      lowerSkeletonHeldFixed: true,
      graphShadowB1: cover.graphShadowB1,
      surfaceB1: cover.betti.b1,
      extraZeroModes: cover.graphShadowB1 - cover.betti.b1,
      equalsNontrivialDeckCharacters: cover.graphShadowB1 - cover.betti.b1 === cover.deckSize - 1,
    },
    gauge,
  };
}

function auditHistory(subspaces, dimension) {
  const byKey = new Map(subspaces.map((subspace) => [subspace.key, subspace]));
  const transitions = [];
  for (const subspace of subspaces) {
    for (let character = 0; character < (1 << dimension); character += 1) {
      const nextBasis = rrefBasis([...subspace.basis, character], dimension);
      const next = byKey.get(subspaceKey(nextBasis));
      assert(next);
      const independent = !subspace.elements.includes(character);
      assert.equal(next.rank, subspace.rank + (independent ? 1 : 0));
      assert.equal(1 << next.rank, (1 << subspace.rank) * (independent ? 2 : 1));
      transitions.push({
        from: subspace.key,
        character,
        to: next.key,
        independent,
        outcome: independent
          ? "degree-doubles-and-adds-" + String(1 << subspace.rank) + "-new-face-modes"
          : "stutter",
      });
    }
  }
  return {
    transitions: transitions.length,
    independent: transitions.filter((row) => row.independent).length,
    dependent: transitions.filter((row) => !row.independent).length,
    rows: transitions,
  };
}

function auditFactorizations(subspaces) {
  let pairs = 0;
  let factorizations = 0;
  for (const source of subspaces) {
    for (const target of subspaces) {
      pairs += 1;
      const targetContainsSource = source.elements.every((value) => target.elements.includes(value));
      if (targetContainsSource) {
        factorizations += 1;
        assert.equal((1 << target.rank) % (1 << source.rank), 0);
      }
    }
  }
  return {
    orderedPairsChecked: pairs,
    factorizationPairs: factorizations,
    statement: "Y_T factors uniquely through Y_S as a rooted regular cover exactly when S is a subspace of T. Hence Y_S is the coarsest connected rooted cover trivializing S.",
  };
}

function auditClosedEncoder(subspaces, dimension) {
  const rows = subspaces.map((subspace) => {
    const signatures = new Set();
    for (let source = 0; source < (1 << dimension); source += 1) {
      const signature = subspace.elements.map((character) => parity(character & source)).join("");
      signatures.add(signature);
    }
    assert.equal(signatures.size, 1 << subspace.rank);
    return { subspace: subspace.key, rank: subspace.rank, exactSignatures: signatures.size };
  });
  return {
    rows,
    theorem: "Any history-blind closed encoder from which arbitrary decoders recover every period in a rank-d active portfolio has at least 2^d reachable states, even when encoder and decoders are nonlinear.",
    timingBoundary: "The bound vanishes if the requested character is supplied before encoding or if the old observer may revisit the source. One born output bit is a marginal result, not a total-memory bound.",
  };
}

function auditGenus(genus) {
  const dimension = 2 * genus;
  const subspaces = enumerateSubspaces(dimension);
  const twisted = range(1 << dimension).map((character) => twistedSurfaceAudit(genus, character));
  const covers = subspaces.map((subspace) => auditSubspace(genus, subspace, twisted));
  return {
    genus,
    baseCells: { vertices: 1, edges: dimension, faces: 1 },
    baseEulerCharacteristic: 2 - 2 * genus,
    cohomologyDimension: dimension,
    subspaceCount: subspaces.length,
    twisted,
    covers,
    history: auditHistory(subspaces, dimension),
    factorization: auditFactorizations(subspaces),
    presentationSymmetry: auditPresentationSymmetries(genus, twisted),
    closedEncoder: auditClosedEncoder(subspaces, dimension),
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
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key === "symbol")) throw new Error("symbol-key:" + path);
    const names = keys.map(String);
    const permitted = new Set(["length", ...range(value.length).map(String)]);
    if (names.some((name) => !permitted.has(name))) throw new Error("unknown-array-key:" + path);
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
  const genera = range(MAX_GENUS).map((index) => auditGenus(index + 1));
  return {
    title: "Genesis surface Hodge atlas",
    status: "exact standard-mathematics two-dimensional family calibration",
    auditScope: {
      exhaustiveGenera: [1, 2],
      generalTheoremBoundary: "Surface-cover genus, twisted cohomology, regular-character decomposition, and 2^r-1 face-mode formulas are proved for arbitrary genus and active rank in the companion argument; only genus 1 and 2 are exhaustively materialized here.",
    },
    model,
    isolation: {
      privateModelRecursivelyFrozen: true,
      payloadModelDeepCloned: true,
      replayExpectedPayloadExposedToCaller: false,
    },
    genera,
    theorem: {
      universalRepair: "For S<=H^1(Sigma_g;F2), evaluation pi_1->S^* gives the coarsest connected rooted cover killing S, of degree 2^rank(S), with pullback kernel exactly S.",
      genuineTwoDimensionality: "The closed surface has no free 2-cell. Holding its 1-skeleton fixed and deleting the lifted faces raises beta_1 by exactly 2^rank(S)-1.",
      hodgeIdentity: "For every nonzero sign character, d0 and d1 have orthogonal one-dimensional images of equal squared norm 4*weight in the displayed cell metric. The 2-cell supplies exactly the d1 image direction.",
      laterEssentiality: "Every active character has a unique root-normalized rational parallel section on the repair cover. That section gives exact gauge untwisting; the face term remains visible through the regular-character decomposition of the cover complex.",
      closedObserverBound: "A rank-d history-blind exact period portfolio forces at least 2^d states for arbitrary nonlinear closed encoders, under the declared timing and source-access boundary.",
    },
    claimLedger: {
      classification: "standard finite surface-cover, local-system, Fox-derivative, and cellular-Hodge mathematics; a native two-dimensional calibration, not a new cohomology theory",
      conditionalArchitecture: "The causal active-versus-closed observer comparison is conditional Level B only under the frozen timing and cost interface.",
      explicitlyNotClaimed: [
        "No Level C or formation-doctrine escape.",
        "No mathematical novelty or priority claim.",
        "No Hodge Conjecture, Navier-Stokes, Collatz, Riemann Hypothesis, non-soficity, or AI-performance result.",
        "No chart-invariant numerical spectral gap under arbitrary nonisometric presentation changes.",
        "No total-memory advantage when source, address, compiler, and repair costs are all charged.",
      ],
      collapseBoundary: "If the old doctrine already contains finite covers, sign local systems, and cellular Hodge complexes, history selects standard parameters; the construction is Level A or a bounded Level-B macro, not endogenous metagrammar growth.",
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
    ["surface-genus", (value) => { value.genera[1].genus = 3; }],
    ["surface-face-count", (value) => { value.genera[1].baseCells.faces = 0; }],
    ["subspace-count", (value) => { value.genera[1].subspaceCount = 66; }],
    ["cover-degree", (value) => { value.genera[1].covers.at(-1).cover.degree = 8; }],
    ["cover-genus", (value) => { value.genera[1].covers.at(-1).cover.genus = 9; }],
    ["kernel", (value) => { value.genera[1].covers[1].pullbackKernel = [0]; }],
    ["top-class", (value) => { value.genera[1].covers[2].cover.topClassRetained = false; }],
    ["face-mode", (value) => { value.genera[1].covers.at(-1).faceAblation.extraZeroModes = 14; }],
    ["twisted-rank", (value) => { value.genera[1].twisted[1].cohomology.h1 = 3; }],
    ["twisted-composition", (value) => { value.genera[1].twisted[3].composition = 1; }],
    ["eigenvalue", (value) => { value.genera[1].twisted[1].laplacian.positiveEigenvalueInDisplayedCellMetric = 2; }],
    ["history", (value) => { value.genera[1].history.independent = 0; }],
    ["factorization", (value) => { value.genera[1].factorization.factorizationPairs = 0; }],
    ["closed-encoder", (value) => { value.genera[1].closedEncoder.rows.at(-1).exactSignatures = 8; }],
    ["forge-level-c", (value) => { value.claimLedger.classification = "Level C"; }],
    ["forge-hodge", (value) => { value.claimLedger.explicitlyNotClaimed = []; }],
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

export function replayGenesisSurfaceHodgeAtlasCertificate(certificate) {
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
  nested.payload.genera[1].covers[0].sections.push({ forged: true });
  nested.payloadDigest = digest(nested.payload);
  nested.certificateDigest = digest({
    schema: nested.schema,
    payload: nested.payload,
    payloadDigest: nested.payloadDigest,
    tamperAudit: nested.tamperAudit,
  });
  const nestedResult = replayGenesisSurfaceHodgeAtlasCertificate(nested);
  assert.equal(nestedResult.ok, false);

  const unknown = clone(certificate);
  unknown.payload.unknownClaim = true;
  unknown.payloadDigest = digest(unknown.payload);
  unknown.certificateDigest = digest({
    schema: unknown.schema,
    payload: unknown.payload,
    payloadDigest: unknown.payloadDigest,
    tamperAudit: unknown.tamperAudit,
  });
  const unknownResult = replayGenesisSurfaceHodgeAtlasCertificate(unknown);
  assert.equal(unknownResult.ok, false);

  const namedArray = clone(certificate);
  namedArray.payload.genera.extra = "forged";
  const namedArrayResult = replayGenesisSurfaceHodgeAtlasCertificate(namedArray);
  assert.equal(namedArrayResult.ok, false);

  const inherited = Object.create(certificate);
  const inheritedResult = replayGenesisSurfaceHodgeAtlasCertificate(inherited);
  assert.equal(inheritedResult.ok, false);

  const getter = clone(certificate);
  const originalGenus = getter.payload.genera[0];
  Object.defineProperty(getter.payload.genera, "0", {
    enumerable: true,
    configurable: true,
    get() { return originalGenus; },
  });
  const getterResult = replayGenesisSurfaceHodgeAtlasCertificate(getter);
  assert.equal(getterResult.ok, false);

  const hiddenPayload = clone(certificate);
  Object.defineProperty(hiddenPayload.payload, "hiddenPoison", { value: true, enumerable: false });
  const hiddenPayloadResult = replayGenesisSurfaceHodgeAtlasCertificate(hiddenPayload);
  assert.equal(hiddenPayloadResult.ok, false);

  const hiddenTop = clone(certificate);
  Object.defineProperty(hiddenTop, "hiddenTopLevel", { value: true, enumerable: false });
  const hiddenTopResult = replayGenesisSurfaceHodgeAtlasCertificate(hiddenTop);
  assert.equal(hiddenTopResult.ok, false);

  const symbolArray = clone(certificate);
  symbolArray.payload.genera[Symbol("poison")] = true;
  const symbolArrayResult = replayGenesisSurfaceHodgeAtlasCertificate(symbolArray);
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

export function runGenesisSurfaceHodgeAtlas() {
  const first = makeCertificate();
  const second = makeCertificate();
  assert.equal(canonical(first), canonical(second));
  const replay = replayGenesisSurfaceHodgeAtlasCertificate(first);
  assert.equal(replay.ok, true);
  return {
    ok: true,
    certificate: first,
    replay,
    deterministicReplay: true,
    securityRegressions: securityRegressions(first),
  };
}

export { runGenesisSurfaceHodgeAtlas as run, replayGenesisSurfaceHodgeAtlasCertificate as replay };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = runGenesisSurfaceHodgeAtlas();
  console.log(JSON.stringify({
    ok: result.ok,
    certificateDigest: result.certificate.certificateDigest,
    payloadDigest: result.certificate.payloadDigest,
    genera: result.certificate.payload.genera.map((entry) => ({
      genus: entry.genus,
      subspaces: entry.subspaceCount,
      covers: entry.covers.length,
      histories: entry.history.transitions,
      factorizationPairs: entry.factorization.factorizationPairs,
      presentationSymmetries: entry.presentationSymmetry.actionsChecked,
      maximumDegree: Math.max(...entry.covers.map((cover) => cover.cover.degree)),
      maximumFaceModes: Math.max(...entry.covers.map((cover) => cover.faceAblation.extraZeroModes)),
    })),
    tamper: {
      tested: result.certificate.tamperAudit.tested,
      rejected: result.certificate.tamperAudit.rejected,
    },
    securityRegressions: result.securityRegressions,
    deterministicReplay: result.deterministicReplay,
  }, null, 2));
}
