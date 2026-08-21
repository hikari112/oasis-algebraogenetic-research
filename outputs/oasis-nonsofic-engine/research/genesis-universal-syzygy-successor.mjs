import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const MAX_EXPLICIT_INPUT_RANK = 12;

const ENGINE_BOUNDARIES = Object.freeze({
  essentialObstructionCausesSuccessor: false,
  cause:
    "the declared universal mod-2 homology-cover representer and its first syzygy space",
  essentialHierarchyRole:
    "a downstream question may be evaluated on the new elementary-abelian syzygy space, but it does not construct this cover",
  nonsoficityResult: false,
  limitBoundary:
    "iteration is an externally enumerable tower of finite graph covers; no inverse, direct, or genealogy-preserving limit is proved non-sofic",
  explicitMaterializationMaxInputRank: MAX_EXPLICIT_INPUT_RANK,
  unboundedTowerStatus:
    "mathematical recurrence only beyond the explicit materialization cap",
  completeDualPolicyMaterialized: false,
  fiveTermMapConstructed: false,
  fiveTermIdentificationStatus:
    "theorem-derived; the executable independently verifies the predicted coinvariant dimension",
  naturalNonzeroSyzygySelectorNoGoAudited: false,
});

function bit(index) {
  assert(Number.isInteger(index) && index >= 0);
  return 1n << BigInt(index);
}

function parity(word) {
  let value = word;
  let result = 0;
  while (value !== 0n) {
    result ^= 1;
    value &= value - 1n;
  }
  return result;
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertExactKeys(value, expected) {
  assert(value && typeof value === "object" && !Array.isArray(value));
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort());
}

function rankBitVectors(vectors) {
  const pivots = new Map();
  for (const original of vectors) {
    let value = original;
    while (value !== 0n) {
      const pivot = value.toString(2).length - 1;
      if (pivots.has(pivot)) value ^= pivots.get(pivot);
      else {
        pivots.set(pivot, value);
        break;
      }
    }
  }
  return pivots.size;
}

function makeGraph(name, vertexCount, edgeSpecs, vertexData = null) {
  assert.equal(typeof name, "string");
  assert(Number.isInteger(vertexCount) && vertexCount > 0);
  const edges = edgeSpecs.map((edge, id) => {
    assert(Number.isInteger(edge.tail) && edge.tail >= 0 && edge.tail < vertexCount);
    assert(Number.isInteger(edge.head) && edge.head >= 0 && edge.head < vertexCount);
    assert.equal(typeof edge.label, "string");
    return Object.freeze({ id, ...edge });
  });
  if (vertexData !== null) assert.equal(vertexData.length, vertexCount);
  return Object.freeze({
    name,
    vertexCount,
    edges: Object.freeze(edges),
    vertexData: vertexData === null ? null : Object.freeze(vertexData),
  });
}

function graphPayload(graph) {
  return {
    name: graph.name,
    vertexCount: graph.vertexCount,
    vertexData:
      graph.vertexData === null
        ? null
        : graph.vertexData.map((datum) => ({ ...datum })),
    edges: graph.edges.map((edge) => {
      const result = {
        tail: edge.tail,
        head: edge.head,
        label: edge.label,
      };
      if (Object.hasOwn(edge, "baseEdgeId")) result.baseEdgeId = edge.baseEdgeId;
      if (Object.hasOwn(edge, "deckStart")) result.deckStart = edge.deckStart;
      return result;
    }),
  };
}

function graphDigest(graph) {
  return digest(graphPayload(graph));
}

function bouquet(rank) {
  assert(Number.isInteger(rank) && rank >= 1);
  return makeGraph(
    `bouquet-r${rank}`,
    1,
    Array.from({ length: rank }, (_unused, generator) => ({
      tail: 0,
      head: 0,
      label: `x${generator}`,
    })),
  );
}

function adjacency(graph, edgeIds = graph.edges.map((edge) => edge.id)) {
  const allowed = new Set(edgeIds);
  const result = Array.from({ length: graph.vertexCount }, () => []);
  for (const edge of graph.edges) {
    if (!allowed.has(edge.id)) continue;
    result[edge.tail].push({ edgeId: edge.id, other: edge.head });
    if (edge.head !== edge.tail) {
      result[edge.head].push({ edgeId: edge.id, other: edge.tail });
    }
  }
  return result;
}

function connectedComponents(graph, edgeIds = graph.edges.map((edge) => edge.id)) {
  const links = adjacency(graph, edgeIds);
  const component = Array(graph.vertexCount).fill(-1);
  let count = 0;
  for (let root = 0; root < graph.vertexCount; root += 1) {
    if (component[root] !== -1) continue;
    component[root] = count;
    const queue = [root];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const vertex = queue[cursor];
      for (const { other } of links[vertex]) {
        if (component[other] === -1) {
          component[other] = count;
          queue.push(other);
        }
      }
    }
    count += 1;
  }
  return { count, component };
}

function homologyRank(graph) {
  const components = connectedComponents(graph).count;
  return graph.edges.length - graph.vertexCount + components;
}

function cycleBoundary(graph, edgeVector) {
  let boundary = 0n;
  for (const edge of graph.edges) {
    if ((edgeVector & bit(edge.id)) === 0n || edge.tail === edge.head) continue;
    boundary ^= bit(edge.tail) ^ bit(edge.head);
  }
  return boundary;
}

function spanningTree(graph, edgeOrder = graph.edges.map((edge) => edge.id)) {
  assert.equal(connectedComponents(graph).count, 1);
  assert.equal(new Set(edgeOrder).size, graph.edges.length);
  const priority = new Map(edgeOrder.map((edgeId, index) => [edgeId, index]));
  const links = adjacency(graph);
  for (const list of links) {
    list.sort((left, right) => priority.get(left.edgeId) - priority.get(right.edgeId));
  }
  const visited = Array(graph.vertexCount).fill(false);
  visited[0] = true;
  const queue = [0];
  const treeEdgeIds = [];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const vertex = queue[cursor];
    for (const { edgeId, other } of links[vertex]) {
      if (!visited[other]) {
        visited[other] = true;
        treeEdgeIds.push(edgeId);
        queue.push(other);
      }
    }
  }
  assert(visited.every(Boolean));
  assert.equal(treeEdgeIds.length, graph.vertexCount - 1);
  return treeEdgeIds;
}

function fundamentalCycle(graph, treeEdgeIds, chordId) {
  const tree = new Set(treeEdgeIds);
  assert(!tree.has(chordId));
  const chord = graph.edges[chordId];
  if (chord.tail === chord.head) return bit(chordId);
  const links = adjacency(graph, treeEdgeIds);
  const parent = Array(graph.vertexCount).fill(null);
  parent[chord.tail] = { vertex: -1, edgeId: -1 };
  const queue = [chord.tail];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const vertex = queue[cursor];
    if (vertex === chord.head) break;
    for (const link of links[vertex]) {
      if (parent[link.other] === null) {
        parent[link.other] = { vertex, edgeId: link.edgeId };
        queue.push(link.other);
      }
    }
  }
  assert(parent[chord.head] !== null);
  let cycle = bit(chordId);
  let vertex = chord.head;
  while (vertex !== chord.tail) {
    cycle ^= bit(parent[vertex].edgeId);
    vertex = parent[vertex].vertex;
  }
  return cycle;
}

function cycleBasis(graph, edgeOrder = graph.edges.map((edge) => edge.id)) {
  const treeEdgeIds = spanningTree(graph, edgeOrder);
  const tree = new Set(treeEdgeIds);
  const chordEdgeIds = graph.edges
    .map((edge) => edge.id)
    .filter((edgeId) => !tree.has(edgeId));
  const vectors = chordEdgeIds.map((edgeId) =>
    fundamentalCycle(graph, treeEdgeIds, edgeId),
  );
  assert.equal(vectors.length, homologyRank(graph));
  assert.equal(rankBitVectors(vectors), vectors.length);
  assert(vectors.every((vector) => cycleBoundary(graph, vector) === 0n));
  return { treeEdgeIds, chordEdgeIds, vectors };
}

function universalVoltage(graph, edgeOrder = graph.edges.map((edge) => edge.id)) {
  const basis = cycleBasis(graph, edgeOrder);
  const rank = basis.vectors.length;
  const voltage = Array(graph.edges.length).fill(0n);
  basis.chordEdgeIds.forEach((edgeId, coordinate) => {
    voltage[edgeId] = bit(coordinate);
  });
  basis.vectors.forEach((cycle, coordinate) => {
    let holonomy = 0n;
    for (const edge of graph.edges) {
      if ((cycle & bit(edge.id)) !== 0n) holonomy ^= voltage[edge.id];
    }
    assert.equal(holonomy, bit(coordinate));
  });
  return { ...basis, rank, voltage };
}

function liftVertexId(baseVertex, deck, deckSize) {
  return baseVertex * deckSize + deck;
}

function buildUniversalHomologyCover(
  graph,
  edgeOrder = graph.edges.map((edge) => edge.id),
  suffix = "universal-h1",
) {
  const voltageData = universalVoltage(graph, edgeOrder);
  const { rank, voltage } = voltageData;
  assert(rank <= MAX_EXPLICIT_INPUT_RANK, "explicit materialization limit exceeded");
  const deckSize = 2 ** rank;
  const vertexData = [];
  for (let baseVertex = 0; baseVertex < graph.vertexCount; baseVertex += 1) {
    for (let deck = 0; deck < deckSize; deck += 1) {
      vertexData.push(Object.freeze({ baseVertex, deck }));
    }
  }
  const edges = [];
  for (const edge of graph.edges) {
    const edgeVoltage = Number(voltage[edge.id]);
    assert(Number.isSafeInteger(edgeVoltage) && edgeVoltage >= 0 && edgeVoltage < deckSize);
    for (let deck = 0; deck < deckSize; deck += 1) {
      edges.push({
        tail: liftVertexId(edge.tail, deck, deckSize),
        head: liftVertexId(edge.head, deck ^ edgeVoltage, deckSize),
        label: `${edge.label}@${deck}`,
        baseEdgeId: edge.id,
        deckStart: deck,
      });
    }
  }
  const coverGraph = makeGraph(
    `${graph.name}.${suffix}`,
    graph.vertexCount * deckSize,
    edges,
    vertexData,
  );
  assert.equal(connectedComponents(coverGraph).count, 1);
  return Object.freeze({
    ...voltageData,
    deckSize,
    graph: coverGraph,
  });
}

// The public compiler deliberately accepts only the current semantic graph.
// Rank, stage, basis, spanning tree, and future-family data are not arguments.
export function compileGenesisUniversalSyzygySuccessor(currentGraph) {
  assert(currentGraph && typeof currentGraph === "object" && !Array.isArray(currentGraph));
  assert(Number.isInteger(currentGraph.vertexCount) && currentGraph.vertexCount > 0);
  assert(Array.isArray(currentGraph.edges));
  const attachment = buildUniversalHomologyCover(currentGraph);
  return Object.freeze({
    ...attachment,
    inputHomologyRank: attachment.rank,
    successorHomologyRank: homologyRank(attachment.graph),
  });
}

function expectedSuccessorRank(rank) {
  const r = BigInt(rank);
  return 1n + (1n << r) * (r - 1n);
}

function auditUniversalPrimitive(base, attachment) {
  let vectorEdgeChecks = 0;
  for (const edge of attachment.graph.edges) {
    const tailDeck = BigInt(attachment.graph.vertexData[edge.tail].deck);
    const headDeck = BigInt(attachment.graph.vertexData[edge.head].deck);
    assert.equal(tailDeck ^ headDeck, attachment.voltage[edge.baseEdgeId]);
    vectorEdgeChecks += 1;
  }
  let gaugeEdgeChecks = 0;
  for (let translation = 0; translation < attachment.deckSize; translation += 1) {
    for (const edge of attachment.graph.edges) {
      const tailDeck = BigInt(attachment.graph.vertexData[edge.tail].deck ^ translation);
      const headDeck = BigInt(attachment.graph.vertexData[edge.head].deck ^ translation);
      assert.equal(tailDeck ^ headDeck, attachment.voltage[edge.baseEdgeId]);
      gaugeEdgeChecks += 1;
    }
  }
  return {
    equation: "delta(q)=p^*(alpha), with q(baseVertex,deck)=deck",
    vectorEdgeChecks,
    primitiveGaugeTranslations: attachment.deckSize,
    gaugeEdgeChecks,
    basedPrimitiveCanonical: true,
    unbasedPrimitiveCanonical: false,
    unbasedPrimitiveType: "affine torsor under the full deck group",
  };
}

function scalarPrimitive(graph, edgeValues) {
  assert.equal(edgeValues.length, graph.edges.length);
  const potential = Array(graph.vertexCount).fill(null);
  potential[0] = 0;
  const links = adjacency(graph);
  const queue = [0];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const vertex = queue[cursor];
    for (const { edgeId, other } of links[vertex]) {
      const required = potential[vertex] ^ edgeValues[edgeId];
      if (potential[other] === null) {
        potential[other] = required;
        queue.push(other);
      } else if (potential[other] !== required) return null;
    }
  }
  return potential.every((value) => value !== null) ? potential : null;
}

function auditAllBaseClassesPullBackExact(base, attachment) {
  const characterCount = 2 ** attachment.rank;
  let nonzeroBaseClasses = 0;
  let liftedEdgeChecks = 0;
  for (let character = 0; character < characterCount; character += 1) {
    const characterWord = BigInt(character);
    const baseRepresentative = attachment.voltage.map((word) =>
      parity(characterWord & word),
    );
    const basePrimitive = scalarPrimitive(base, baseRepresentative);
    if (character === 0) assert(basePrimitive !== null);
    else {
      assert.equal(basePrimitive, null);
      nonzeroBaseClasses += 1;
    }
    const liftedPotential = attachment.graph.vertexData.map(({ deck }) =>
      parity(characterWord & BigInt(deck)),
    );
    for (const edge of attachment.graph.edges) {
      assert.equal(
        liftedPotential[edge.tail] ^ liftedPotential[edge.head],
        baseRepresentative[edge.baseEdgeId],
      );
      liftedEdgeChecks += 1;
    }
  }
  return {
    normalizedBaseH1ClassesExhausted: characterCount,
    nonzeroBaseClassesWithoutPrimitive: nonzeroBaseClasses,
    pullbacksWithExplicitPrimitive: characterCount,
    liftedEdgeChecks,
    inducedMapOnH1CohomologyIsZero: true,
    primitiveFormula: "lambda(q(baseVertex,deck))",
  };
}

function translateEdgeVector(vector, attachment, translation) {
  let result = 0n;
  for (const edge of attachment.graph.edges) {
    if ((vector & bit(edge.id)) === 0n) continue;
    const translatedId = edge.baseEdgeId * attachment.deckSize + (edge.deckStart ^ translation);
    result ^= bit(translatedId);
  }
  return result;
}

function auditDeckActionAndCoinvariants(attachment) {
  const successorBasis = cycleBasis(attachment.graph);
  const successorRank = successorBasis.vectors.length;
  const expectedRank = Number(expectedSuccessorRank(attachment.rank));
  assert.equal(successorRank, expectedRank);
  const relations = [];
  let translatedBasisChecks = 0;
  for (let generator = 0; generator < attachment.rank; generator += 1) {
    const translation = 2 ** generator;
    for (const cycle of successorBasis.vectors) {
      const translated = translateEdgeVector(cycle, attachment, translation);
      assert.equal(cycleBoundary(attachment.graph, translated), 0n);
      relations.push(cycle ^ translated);
      translatedBasisChecks += 1;
    }
  }
  const relationRank = rankBitVectors(relations);
  const coinvariantDimension = successorRank - relationRank;
  const expectedCoinvariantDimension = (attachment.rank * (attachment.rank + 1)) / 2;
  assert.equal(coinvariantDimension, expectedCoinvariantDimension);
  assert(relationRank > 0);
  return {
    syzygyDefinition: "W=H1(U_G;F2), the cycle relations among universal lifted transitions",
    syzygyRank: successorRank,
    deckGeneratorsAudited: attachment.rank,
    translatedBasisChecks,
    actionRelationRank: relationRank,
    coinvariantDimension,
    expectedCoinvariantDimension,
    fiveTermIdentification: "W_V is isomorphic to H2(V;F2)",
    fiveTermIdentificationStatus:
      "theorem-derived from the homology five-term sequence; the executable verifies its predicted dimension but does not construct the transgression map",
    fiveTermMapConstructed: false,
    theoreticalDimension: "dim H2((C2)^r;F2)=r(r+1)/2",
    deckActionNontrivial: true,
    newSpaceIsDistinguishedVector: false,
    implementedOutput:
      "a chart-level cycle basis for W together with exact deck-translation relation ranks; no nonzero vector is selected",
    dualPolicy: {
      kind: "all-nonzero-linear-functionals",
      dimension: successorRank,
      cardinality: `2^${successorRank}-1`,
      materialized: false,
      status: "symbolic declared policy, not an enumerated list",
    },
  };
}

function permuteBits(word, permutation) {
  let result = 0;
  for (let source = 0; source < permutation.length; source += 1) {
    if ((word & (2 ** source)) !== 0) result |= 2 ** permutation[source];
  }
  return result;
}

function auditBouquetPresentationGauge(rank, attachment) {
  const permutation = Array.from({ length: rank }, (_unused, index) => rank - 1 - index);
  let vertexChecks = 0;
  for (const vertex of attachment.graph.vertexData) {
    const mapped = permuteBits(vertex.deck, permutation);
    assert.equal(permuteBits(mapped, permutation), vertex.deck);
    vertexChecks += 1;
  }
  let edgeChecks = 0;
  for (const edge of attachment.graph.edges) {
    const mappedGenerator = permutation[edge.baseEdgeId];
    const mappedStart = permuteBits(edge.deckStart, permutation);
    const mappedEdgeId = mappedGenerator * attachment.deckSize + mappedStart;
    const mappedEdge = attachment.graph.edges[mappedEdgeId];
    assert.equal(mappedEdge.baseEdgeId, mappedGenerator);
    assert.equal(
      attachment.graph.vertexData[mappedEdge.tail].deck,
      permuteBits(attachment.graph.vertexData[edge.tail].deck, permutation),
    );
    assert.equal(
      attachment.graph.vertexData[mappedEdge.head].deck,
      permuteBits(attachment.graph.vertexData[edge.head].deck, permutation),
    );
    edgeChecks += 1;
  }
  let fixedNonzeroOldDeckVectors = 0;
  for (let deckVector = 1; deckVector < attachment.deckSize; deckVector += 1) {
    let fixedByEveryGenerator = true;
    for (let source = 0; source < rank; source += 1) {
      const target = (source + 1) % rank;
      const shearColumns = Array.from({ length: rank }, (_unused, index) => {
        let column = 2 ** index;
        if (index === source) column ^= 2 ** target;
        return column;
      });
      let transformed = 0;
      for (let index = 0; index < rank; index += 1) {
        if ((deckVector & (2 ** index)) !== 0) transformed ^= shearColumns[index];
      }
      if (transformed !== deckVector) {
        fixedByEveryGenerator = false;
        break;
      }
    }
    if (fixedByEveryGenerator) fixedNonzeroOldDeckVectors += 1;
  }
  assert.equal(fixedNonzeroOldDeckVectors, 0);
  return {
    reversedLoopBasisPermutation: permutation,
    involutiveVertexChecks: vertexChecks,
    coverEdgeNaturalityChecks: edgeChecks,
    invariantCountsPreserved: true,
    fixedNonzeroOldDeckVectorsUnderDisplayedCoordinateTransvections:
      fixedNonzeroOldDeckVectors,
    syzygySelectorNoGoAudited: false,
    boundary:
      "the transvection check concerns the old deck-coordinate space, not W or W*; the implementation merely refrains from selecting a syzygy vector",
  };
}

function applyLinearMap(word, columns) {
  let result = 0n;
  for (let index = 0; index < columns.length; index += 1) {
    if ((word & bit(index)) !== 0n) result ^= columns[index];
  }
  return result;
}

function vectorCoboundaryPrimitive(graph, edgeWords) {
  assert.equal(edgeWords.length, graph.edges.length);
  const potential = Array(graph.vertexCount).fill(null);
  potential[0] = 0n;
  const links = adjacency(graph);
  const queue = [0];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const vertex = queue[cursor];
    for (const { edgeId, other } of links[vertex]) {
      const required = potential[vertex] ^ edgeWords[edgeId];
      if (potential[other] === null) {
        potential[other] = required;
        queue.push(other);
      } else if (potential[other] !== required) return null;
    }
  }
  return potential.every((value) => value !== null) ? potential : null;
}

function auditSpanningTreeGauge(graph) {
  const ascending = graph.edges.map((edge) => edge.id);
  const descending = [...ascending].reverse();
  const primary = buildUniversalHomologyCover(graph, ascending, "primary-tree");
  const alternate = buildUniversalHomologyCover(graph, descending, "alternate-tree");
  assert.notDeepEqual(primary.treeEdgeIds, alternate.treeEdgeIds);
  assert.equal(primary.rank, alternate.rank);
  const columns = primary.chordEdgeIds.map((chordId) => {
    const cycle = fundamentalCycle(graph, primary.treeEdgeIds, chordId);
    let result = 0n;
    for (const edge of graph.edges) {
      if ((cycle & bit(edge.id)) !== 0n) result ^= alternate.voltage[edge.id];
    }
    return result;
  });
  assert.equal(rankBitVectors(columns), primary.rank);
  const difference = graph.edges.map(
    (edge) =>
      alternate.voltage[edge.id] ^ applyLinearMap(primary.voltage[edge.id], columns),
  );
  const vertexGauge = vectorCoboundaryPrimitive(graph, difference);
  assert(vertexGauge !== null);
  const alternateEdges = new Map(
    alternate.graph.edges.map((edge) => [`${edge.baseEdgeId}:${edge.deckStart}`, edge]),
  );
  const vertexImages = new Set();
  let vertexChecks = 0;
  for (const vertex of primary.graph.vertexData) {
    const imageDeck = Number(
      applyLinearMap(BigInt(vertex.deck), columns) ^ vertexGauge[vertex.baseVertex],
    );
    vertexImages.add(liftVertexId(vertex.baseVertex, imageDeck, alternate.deckSize));
    vertexChecks += 1;
  }
  assert.equal(vertexImages.size, primary.graph.vertexCount);
  let edgeChecks = 0;
  for (const edge of primary.graph.edges) {
    const baseEdge = graph.edges[edge.baseEdgeId];
    const imageStart = Number(
      applyLinearMap(BigInt(edge.deckStart), columns) ^ vertexGauge[baseEdge.tail],
    );
    const target = alternateEdges.get(`${edge.baseEdgeId}:${imageStart}`);
    assert(target);
    const expectedTail = liftVertexId(baseEdge.tail, imageStart, alternate.deckSize);
    const primaryHead = primary.graph.vertexData[edge.head];
    const expectedHeadDeck = Number(
      applyLinearMap(BigInt(primaryHead.deck), columns) ^
        vertexGauge[primaryHead.baseVertex],
    );
    const expectedHead = liftVertexId(baseEdge.head, expectedHeadDeck, alternate.deckSize);
    assert.equal(target.tail, expectedTail);
    assert.equal(target.head, expectedHead);
    edgeChecks += 1;
  }
  return {
    graphRank: primary.rank,
    firstTreeEdgeIds: primary.treeEdgeIds,
    secondTreeEdgeIds: alternate.treeEdgeIds,
    deckLinearMapColumnsHex: columns.map((column) => column.toString(16)),
    vertexGaugeHex: vertexGauge.map((value) => value.toString(16)),
    invertibleDeckCoordinateMap: true,
    explicitVertexBijectionChecks: vertexChecks,
    explicitEdgeIncidenceChecks: edgeChecks,
    sameRepresentingCoverUpToBasisAndVertexGauge: true,
  };
}

function auditOneBouquetRank(rank) {
  const base = bouquet(rank);
  const attachment = compileGenesisUniversalSyzygySuccessor(base);
  const expectedVertices = 2 ** rank;
  const expectedEdges = rank * expectedVertices;
  const expectedRank = Number(expectedSuccessorRank(rank));
  assert.equal(attachment.graph.vertexCount, expectedVertices);
  assert.equal(attachment.graph.edges.length, expectedEdges);
  assert.equal(homologyRank(attachment.graph), expectedRank);
  const primitive = auditUniversalPrimitive(base, attachment);
  const exactness = auditAllBaseClassesPullBackExact(base, attachment);
  const deckAction = auditDeckActionAndCoinvariants(attachment);
  const presentation = auditBouquetPresentationGauge(rank, attachment);
  return {
    base,
    attachment,
    result: {
      input: {
        kind: "bouquet",
        rank,
        vertices: base.vertexCount,
        edges: base.edges.length,
        graphDigest: graphDigest(base),
      },
      cover: {
        degree: attachment.deckSize,
        vertices: attachment.graph.vertexCount,
        edges: attachment.graph.edges.length,
        cycleRank: homologyRank(attachment.graph),
        expectedCycleRank: expectedRank,
        graphDigest: graphDigest(attachment.graph),
      },
      universalPrimitive: primitive,
      pullbackExactness: exactness,
      deckAction,
      presentation,
    },
  };
}

function auditRankRecurrence(rankTwoAudit) {
  const first = rankTwoAudit.attachment;
  assert.equal(homologyRank(first.graph), 5);
  const second = compileGenesisUniversalSyzygySuccessor(first.graph);
  assert.equal(second.rank, 5);
  assert.equal(second.deckSize, 32);
  assert.equal(second.graph.vertexCount, 128);
  assert.equal(second.graph.edges.length, 256);
  assert.equal(homologyRank(second.graph), 129);
  const primitive = auditUniversalPrimitive(first.graph, second);
  const exactness = auditAllBaseClassesPullBackExact(first.graph, second);
  const deckAction = auditDeckActionAndCoinvariants(second);
  assert.equal(deckAction.coinvariantDimension, 15);
  return {
    ranks: [2, 5, 129],
    formula: "r'=1+2^r(r-1)",
    firstStepMaterializedByBouquetRankTwoFixture: true,
    secondStep: {
      inputGraphDigest: graphDigest(first.graph),
      inputVertices: first.graph.vertexCount,
      inputEdges: first.graph.edges.length,
      inputRank: second.rank,
      degree: second.deckSize,
      outputVertices: second.graph.vertexCount,
      outputEdges: second.graph.edges.length,
      outputRank: homologyRank(second.graph),
      outputGraphDigest: graphDigest(second.graph),
      universalPrimitive: primitive,
      pullbackExactness: exactness,
      deckAction,
    },
    compilerSignature: "compileGenesisUniversalSyzygySuccessor(currentConnectedGraph)",
    compilerFunctionArity: compileGenesisUniversalSyzygySuccessor.length,
    explicitMaterializationMaxInputRank: MAX_EXPLICIT_INPUT_RANK,
    externalStageCounterInput: false,
    externalEnumerationStillPossible: true,
  };
}

function fixtureCertificatePayload(audit) {
  return {
    schema: "oasis.genesis-universal-syzygy-fixture.v1",
    input: audit.result.input,
    cover: audit.result.cover,
    primitiveDigest: digest(audit.result.universalPrimitive),
    exactnessDigest: digest(audit.result.pullbackExactness),
    deckActionDigest: digest(audit.result.deckAction),
    presentationDigest: digest(audit.result.presentation),
    boundaries: ENGINE_BOUNDARIES,
  };
}

function compilerInterfaceAudit() {
  return {
    exportedFunction: "compileGenesisUniversalSyzygySuccessor",
    functionArity: compileGenesisUniversalSyzygySuccessor.length,
    semanticInput: "current connected graph only",
    externalStageCounterInput: false,
    externalRankInput: false,
    externalBasisInput: false,
    explicitMaterializationMaxInputRank: MAX_EXPLICIT_INPUT_RANK,
  };
}

function makeCertificate(fixtures, recurrence, treeGauge) {
  const records = fixtures.map((audit) => {
    const payload = fixtureCertificatePayload(audit);
    return { ...payload, recordDigest: digest(payload) };
  });
  const payload = {
    schema: "oasis.genesis-universal-syzygy-certificate.v1",
    records,
    recurrenceDigest: digest(recurrence),
    recurrenceSummary: {
      ranks: recurrence.ranks,
      secondOutputGraphDigest: recurrence.secondStep.outputGraphDigest,
      secondOutputRank: recurrence.secondStep.outputRank,
    },
    compilerInterface: compilerInterfaceAudit(),
    treeGaugeDigest: digest(treeGauge),
    boundaries: ENGINE_BOUNDARIES,
  };
  return { ...payload, certificateDigest: digest(payload) };
}

function replayCertificate(certificate) {
  assertExactKeys(certificate, [
    "schema",
    "records",
    "recurrenceDigest",
    "recurrenceSummary",
    "compilerInterface",
    "treeGaugeDigest",
    "boundaries",
    "certificateDigest",
  ]);
  assert.equal(certificate.schema, "oasis.genesis-universal-syzygy-certificate.v1");
  assert.deepEqual(certificate.boundaries, ENGINE_BOUNDARIES);
  assert.deepEqual(certificate.compilerInterface, compilerInterfaceAudit());
  assert.equal(certificate.records.length, 4);
  const rebuiltFixtures = [2, 3, 4, 5].map(auditOneBouquetRank);
  for (let index = 0; index < rebuiltFixtures.length; index += 1) {
    const record = certificate.records[index];
    assertExactKeys(record, [
      "schema",
      "input",
      "cover",
      "primitiveDigest",
      "exactnessDigest",
      "deckActionDigest",
      "presentationDigest",
      "boundaries",
      "recordDigest",
    ]);
    const payload = fixtureCertificatePayload(rebuiltFixtures[index]);
    assert.deepEqual(
      Object.fromEntries(Object.keys(payload).map((key) => [key, record[key]])),
      payload,
    );
    assert.equal(record.recordDigest, digest(payload));
  }
  const recurrence = auditRankRecurrence(rebuiltFixtures[0]);
  assert.equal(certificate.recurrenceDigest, digest(recurrence));
  assert.deepEqual(certificate.recurrenceSummary, {
    ranks: recurrence.ranks,
    secondOutputGraphDigest: recurrence.secondStep.outputGraphDigest,
    secondOutputRank: recurrence.secondStep.outputRank,
  });
  const treeGauge = auditSpanningTreeGauge(rebuiltFixtures[0].attachment.graph);
  assert.equal(certificate.treeGaugeDigest, digest(treeGauge));
  const payload = { ...certificate };
  delete payload.certificateDigest;
  assert.equal(certificate.certificateDigest, digest(payload));
  return { rebuiltFixtures, recurrence, treeGauge };
}

function rejectsReplay(certificate) {
  try {
    replayCertificate(certificate);
    return false;
  } catch (error) {
    assert(error instanceof Error);
    return true;
  }
}

function auditTampering(certificate) {
  const cases = {
    inputRank: (copy) => { copy.records[0].input.rank = 3; },
    inputGraphDigest: (copy) => { copy.records[1].input.graphDigest = "0".repeat(64); },
    deckDegree: (copy) => { copy.records[2].cover.degree = 2; },
    coverVertices: (copy) => { copy.records[0].cover.vertices += 1; },
    coverEdges: (copy) => { copy.records[3].cover.edges -= 1; },
    cycleRank: (copy) => { copy.records[1].cover.cycleRank += 1; },
    coverGraphDigest: (copy) => { copy.records[2].cover.graphDigest = "f".repeat(64); },
    primitiveDigest: (copy) => { copy.records[0].primitiveDigest = "0".repeat(64); },
    exactnessDigest: (copy) => { copy.records[1].exactnessDigest = "0".repeat(64); },
    deckActionDigest: (copy) => { copy.records[2].deckActionDigest = "0".repeat(64); },
    presentationDigest: (copy) => { copy.records[3].presentationDigest = "0".repeat(64); },
    essentialCauseBoundary: (copy) => {
      copy.records[0].boundaries.essentialObstructionCausesSuccessor = true;
    },
    nonsoficBoundary: (copy) => { copy.boundaries.nonsoficityResult = true; },
    recordDigest: (copy) => { copy.records[0].recordDigest = "0".repeat(64); },
    recordOrder: (copy) => {
      [copy.records[0], copy.records[1]] = [copy.records[1], copy.records[0]];
    },
    recurrenceDigest: (copy) => { copy.recurrenceDigest = "0".repeat(64); },
    recurrenceRank: (copy) => { copy.recurrenceSummary.ranks[2] = 128; },
    recurrenceGraphDigest: (copy) => {
      copy.recurrenceSummary.secondOutputGraphDigest = "0".repeat(64);
    },
    compilerArity: (copy) => { copy.compilerInterface.functionArity = 2; },
    materializationCap: (copy) => {
      copy.compilerInterface.explicitMaterializationMaxInputRank = 129;
    },
    treeGaugeDigest: (copy) => { copy.treeGaugeDigest = "0".repeat(64); },
    dualPolicyMaterialization: (copy) => {
      copy.records[3].boundaries.completeDualPolicyMaterialized = true;
    },
    fiveTermMapOverclaim: (copy) => {
      copy.records[0].boundaries.fiveTermMapConstructed = true;
    },
    extraField: (copy) => { copy.records[0].undeclared = true; },
    certificateDigest: (copy) => { copy.certificateDigest = "0".repeat(64); },
  };
  const rejected = {};
  for (const [name, mutate] of Object.entries(cases)) {
    const copy = cloneJson(certificate);
    mutate(copy);
    rejected[name] = rejectsReplay(copy);
    assert(rejected[name]);
  }
  return {
    attempted: Object.keys(cases).length,
    rejected: Object.values(rejected).filter(Boolean).length,
    allRejected: true,
    cases: rejected,
  };
}

export function runGenesisUniversalSyzygySuccessor() {
  const fixtureAudits = [2, 3, 4, 5].map(auditOneBouquetRank);
  const recurrence = auditRankRecurrence(fixtureAudits[0]);
  const treeGauge = auditSpanningTreeGauge(fixtureAudits[0].attachment.graph);
  const certificate = makeCertificate(fixtureAudits, recurrence, treeGauge);
  const replayed = replayCertificate(certificate);
  assert.deepEqual(replayed.recurrence.ranks, [2, 5, 129]);
  const tamper = auditTampering(certificate);

  return {
    schema: "oasis.genesis-universal-syzygy-successor.v1",
    status: "PASS",
    scope:
      "unconditional universal-homology-cover successor with exact finite syzygy and deck-action audits",
    theorem: {
      input:
        "a finite connected based graph G with r=dim H1(G;F2)>=2",
      currentDirectionObject: "V_G=H1(G;F2)",
      universalElement:
        "q_G on the principal V_G-cover U_G, satisfying delta(q_G)=p_G^*(identity voltage)",
      successorDirectionObject:
        "W_G=H1(U_G;F2), retained with the induced old-deck V_G action",
      rank: "dim W_G=1+2^r(r-1)",
      oldClassMap: "p_G^*:H1(G;F2)^* -> H1(U_G;F2)^* is zero",
      coinvariants:
        "(W_G)_{V_G} is isomorphic to H2(V_G;F2), of dimension r(r+1)/2",
      functorialScope:
        "canonical up to deck-linear coordinate change and vertex gauge; the executable audits loop reversal and one spanning-tree change, not general categorical functoriality",
    },
    fixtures: fixtureAudits.map((audit) => audit.result),
    recurrence,
    gaugeBoundaries: {
      primitiveTranslationsAuditedAtEveryBouquetRank: true,
      loopBasisPresentationAuditedAtEveryBouquetRank: true,
      alternateSpanningTreeOnFirstSuccessor: treeGauge,
      distinguishedNewVectorSelected: false,
      reason:
        "the mathematical output is the whole syzygy deck module; the executable selects no nonzero vector and keeps the complete dual policy symbolic rather than enumerating it",
    },
    interfaceAudit: compilerInterfaceAudit(),
    constructionBoundary: ENGINE_BOUNDARIES,
    certificate: {
      replayedExactly: true,
      fixtureRecords: certificate.records.length,
      certificateDigest: certificate.certificateDigest,
      recurrenceDigest: certificate.recurrenceDigest,
      tamper,
    },
    claimLedger: [
      {
        claim: "the compiler takes an external stage counter",
        status: "false; its only semantic input is the current connected graph",
      },
      {
        claim: "the deterministic orbit cannot be externally enumerated or stage-decoded",
        status: "false; no-counter is a causal API statement, not uncomputability",
      },
      {
        claim: "all old scalar H1 classes pull back exact",
        status:
          "exact theorem; all 4, 8, 16, and 32 bouquet classes and all 32 second-step classes explicitly audited",
      },
      {
        claim: "the successor is merely a larger trivial vector space",
        status:
          "false in the retained semantics; the old deck group acts nontrivially on the complete new syzygy module",
      },
      {
        claim: "one canonical nonzero syzygy vector is selected",
        status:
          "false for this implementation; it computes chart-level cycle and deck-action evidence but keeps the all-nonzero dual policy symbolic",
      },
      {
        claim: "the essential Dickson/Bockstein obstruction causes this successor",
        status:
          "false; it is a possible downstream question on W_G, while the cover is caused by the declared universal degree-one homology obstruction",
      },
      {
        claim: "iteration proves a non-sofic limit or group",
        status:
          "false; every materialized object is finite, the tower is computably enumerable, and no chosen limit has a non-soficity theorem",
      },
    ],
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runGenesisUniversalSyzygySuccessor(), null, 2));
}
