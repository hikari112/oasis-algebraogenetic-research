import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

function bit(index) {
  assert(Number.isInteger(index) && index >= 0);
  return 1n << BigInt(index);
}

function parity(word) {
  let value = word;
  let answer = 0;
  while (value !== 0n) {
    answer ^= 1;
    value &= value - 1n;
  }
  return answer;
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
    vertexCount: graph.vertexCount,
    vertexData:
      graph.vertexData === null
        ? null
        : graph.vertexData.map((datum) => ({ ...datum })),
    edges: graph.edges.map((edge) => {
      const payload = {
        tail: edge.tail,
        head: edge.head,
        label: edge.label,
      };
      if (Object.hasOwn(edge, "baseEdgeId")) payload.baseEdgeId = edge.baseEdgeId;
      if (Object.hasOwn(edge, "deckStart")) payload.deckStart = edge.deckStart;
      return payload;
    }),
  };
}

function graphDigest(graph) {
  return digest(graphPayload(graph));
}

function bouquet(labels) {
  assert(Array.isArray(labels));
  return makeGraph(
    `bouquet-${labels.join("") || "tree"}`,
    1,
    labels.map((label) => ({ tail: 0, head: 0, label })),
  );
}

function edgeBoundaryWord(edge) {
  return edge.tail === edge.head ? 0n : bit(edge.tail) ^ bit(edge.head);
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

function homologyRank(graph) {
  const boundaryRank = rankBitVectors(graph.edges.map(edgeBoundaryWord));
  return graph.edges.length - boundaryRank;
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

function spanningTree(graph, edgeOrder = graph.edges.map((edge) => edge.id)) {
  assert.equal(connectedComponents(graph).count, 1);
  assert.equal(new Set(edgeOrder).size, graph.edges.length);
  assert(edgeOrder.every((id) => Number.isInteger(id) && graph.edges[id]));
  const priority = new Map(edgeOrder.map((id, index) => [id, index]));
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

function validateSpanningTree(graph, treeEdgeIds) {
  assert(Array.isArray(treeEdgeIds));
  assert.equal(new Set(treeEdgeIds).size, treeEdgeIds.length);
  assert.equal(treeEdgeIds.length, graph.vertexCount - 1);
  for (const id of treeEdgeIds) {
    assert(Number.isInteger(id) && id >= 0 && id < graph.edges.length);
    assert.notEqual(graph.edges[id].tail, graph.edges[id].head);
  }
  assert.equal(connectedComponents(graph, treeEdgeIds).count, 1);
}

function fundamentalCycle(graph, treeEdgeIds, chordId) {
  const tree = new Set(treeEdgeIds);
  assert(!tree.has(chordId));
  const chord = graph.edges[chordId];
  if (chord.tail === chord.head) return [chordId];
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
  const path = [];
  let vertex = chord.head;
  while (vertex !== chord.tail) {
    path.push(parent[vertex].edgeId);
    vertex = parent[vertex].vertex;
  }
  return [chordId, ...path];
}

function voltageFromTree(graph, treeEdgeIds) {
  validateSpanningTree(graph, treeEdgeIds);
  const tree = new Set(treeEdgeIds);
  const chords = graph.edges
    .map((edge) => edge.id)
    .filter((id) => !tree.has(id));
  const rank = homologyRank(graph);
  assert.equal(chords.length, rank);
  const voltage = Array(graph.edges.length).fill(0n);
  chords.forEach((edgeId, index) => {
    voltage[edgeId] = bit(index);
  });
  let cycleChecks = 0;
  chords.forEach((edgeId, index) => {
    const cycle = fundamentalCycle(graph, treeEdgeIds, edgeId);
    let boundary = 0n;
    let holonomy = 0n;
    for (const id of cycle) {
      boundary ^= edgeBoundaryWord(graph.edges[id]);
      holonomy ^= voltage[id];
    }
    assert.equal(boundary, 0n);
    assert.equal(holonomy, bit(index));
    cycleChecks += 2;
  });
  return { rank, treeEdgeIds: [...treeEdgeIds], chords, voltage, cycleChecks };
}

function liftVertexId(baseVertex, deck, deckSize) {
  return baseVertex * deckSize + deck;
}

function buildVoltageCover(graph, voltageData, suffix = "H2") {
  const { rank, voltage } = voltageData;
  assert(rank <= 20, "explicit cover exceeds the executable materialization limit");
  const deckSize = 2 ** rank;
  assert.equal(voltage.length, graph.edges.length);
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
        label: deckSize === 1 ? edge.label : `${edge.label}@${deck}`,
        baseEdgeId: edge.id,
        deckStart: deck,
      });
    }
  }
  const cover = makeGraph(
    `${graph.name}.${suffix}`,
    graph.vertexCount * deckSize,
    edges,
    vertexData,
  );
  return Object.freeze({ ...voltageData, graph: cover, deckSize });
}

function buildHomologyCover(graph, edgeOrder = graph.edges.map((edge) => edge.id)) {
  const treeEdgeIds = spanningTree(graph, edgeOrder);
  return buildVoltageCover(graph, voltageFromTree(graph, treeEdgeIds));
}

function auditTautologicalExactness(base, attachment) {
  let vectorEdgeChecks = 0;
  let scalarCoordinateChecks = 0;
  for (const edge of attachment.graph.edges) {
    const tailDeck = BigInt(attachment.graph.vertexData[edge.tail].deck);
    const headDeck = BigInt(attachment.graph.vertexData[edge.head].deck);
    const expected = attachment.voltage[edge.baseEdgeId];
    assert.equal(tailDeck ^ headDeck, expected);
    vectorEdgeChecks += 1;
    for (let coordinate = 0; coordinate < attachment.rank; coordinate += 1) {
      assert.equal(
        Number((tailDeck ^ headDeck) & bit(coordinate)),
        Number(expected & bit(coordinate)),
      );
      scalarCoordinateChecks += 1;
    }
  }
  return {
    basedPrimitive: "deck coordinate d(v,g)=g with the chosen base lift at deck zero",
    primitiveGauge:
      "all vector primitives are d+c for a constant deck vector c; without a base lift they form an affine deck torsor",
    identity: "delta(d)=pullback(voltage)",
    vectorEdgeChecks,
    scalarCoordinateChecks,
  };
}

function scalarBit(word, edgeId) {
  return Number((word >> BigInt(edgeId)) & 1n);
}

function scalarCochainDecomposition(base, attachment, cochainWord) {
  const tree = new Set(attachment.treeEdgeIds);
  const links = adjacency(base, attachment.treeEdgeIds);
  const potential = Array(base.vertexCount).fill(null);
  potential[0] = 0;
  const queue = [0];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const vertex = queue[cursor];
    for (const { edgeId, other } of links[vertex]) {
      if (potential[other] === null) {
        potential[other] = potential[vertex] ^ scalarBit(cochainWord, edgeId);
        queue.push(other);
      }
    }
  }
  assert(potential.every((value) => value !== null));
  let character = 0n;
  attachment.chords.forEach((edgeId, coordinate) => {
    const edge = base.edges[edgeId];
    const residual =
      scalarBit(cochainWord, edgeId) ^ potential[edge.tail] ^ potential[edge.head];
    if (residual === 1) character |= bit(coordinate);
  });
  for (const edge of base.edges) {
    const reconstructed =
      potential[edge.tail] ^
      potential[edge.head] ^
      parity(character & attachment.voltage[edge.id]);
    assert.equal(reconstructed, scalarBit(cochainWord, edge.id));
    if (tree.has(edge.id)) assert.equal(attachment.voltage[edge.id], 0n);
  }
  return { potential, character };
}

function auditAllScalarPullbacksExact(base, attachment) {
  assert(base.edges.length <= 16);
  const cochainCount = 2 ** base.edges.length;
  let decompositions = 0;
  let liftedEdgeChecks = 0;
  for (let wordNumber = 0; wordNumber < cochainCount; wordNumber += 1) {
    const word = BigInt(wordNumber);
    const { potential, character } = scalarCochainDecomposition(base, attachment, word);
    const liftedPotential = attachment.graph.vertexData.map(
      ({ baseVertex, deck }) => potential[baseVertex] ^ parity(BigInt(deck) & character),
    );
    for (const edge of attachment.graph.edges) {
      assert.equal(
        liftedPotential[edge.tail] ^ liftedPotential[edge.head],
        scalarBit(word, edge.baseEdgeId),
      );
      liftedEdgeChecks += 1;
    }
    decompositions += 1;
  }
  return {
    graphHasNoTwoCellsSoEveryScalarOneCochainIsACocycle: true,
    scalarCochainsExhausted: cochainCount,
    exactDecompositions: decompositions,
    liftedEdgeChecks,
    formula: "alpha=delta(phi)+character(voltage), pullback primitive=phi+character(deck)",
  };
}

function scalarPrimitive(base, cochainWord) {
  const potential = Array(base.vertexCount).fill(null);
  for (let root = 0; root < base.vertexCount; root += 1) {
    if (potential[root] !== null) continue;
    potential[root] = 0;
    const queue = [root];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const vertex = queue[cursor];
      for (const edge of base.edges) {
        let other = null;
        if (edge.tail === vertex) other = edge.head;
        else if (edge.head === vertex) other = edge.tail;
        else continue;
        const required = potential[vertex] ^ scalarBit(cochainWord, edge.id);
        if (potential[other] === null) {
          potential[other] = required;
          queue.push(other);
        } else if (potential[other] !== required) return null;
      }
    }
  }
  return potential;
}

function verifyDeckCharacterPrimitive(attachment, character) {
  assert(character > 0n && character < bit(attachment.rank));
  let checks = 0;
  for (const edge of attachment.graph.edges) {
    const tail = attachment.graph.vertexData[edge.tail];
    const head = attachment.graph.vertexData[edge.head];
    const delta = parity(BigInt(tail.deck) & character) ^ parity(BigInt(head.deck) & character);
    assert.equal(delta, parity(character & attachment.voltage[edge.baseEdgeId]));
    checks += 1;
  }
  return checks;
}

function auditConnectedAndTrivial(base, attachment) {
  const connected = connectedComponents(attachment.graph).count;
  assert.equal(connected, 1);
  const zeroVoltage = {
    ...attachment,
    voltage: Array(base.edges.length).fill(0n),
  };
  const trivial = buildVoltageCover(base, zeroVoltage, "trivial");
  const trivialComponents = connectedComponents(trivial.graph).count;
  assert.equal(trivialComponents, attachment.deckSize);
  return {
    homologyCoverComponents: connected,
    trivialFreeProductCoverComponents: trivialComponents,
    expectedTrivialComponents: `2^${attachment.rank}`,
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
  const primary = buildHomologyCover(graph, ascending);
  const alternate = buildHomologyCover(graph, descending);
  assert.notDeepEqual(primary.treeEdgeIds, alternate.treeEdgeIds);
  assert.equal(primary.rank, alternate.rank);
  const columns = primary.chords.map((chordId) => {
    let value = 0n;
    for (const edgeId of fundamentalCycle(graph, primary.treeEdgeIds, chordId)) {
      value ^= alternate.voltage[edgeId];
    }
    return value;
  });
  assert.equal(rankBitVectors(columns), primary.rank);
  const difference = graph.edges.map(
    (edge) => alternate.voltage[edge.id] ^ applyLinearMap(primary.voltage[edge.id], columns),
  );
  const gauge = vectorCoboundaryPrimitive(graph, difference);
  assert(gauge !== null);
  const alternateEdge = new Map(
    alternate.graph.edges.map((edge) => [`${edge.baseEdgeId}:${edge.deckStart}`, edge]),
  );
  const vertexImages = new Set();
  let vertexChecks = 0;
  for (const vertex of primary.graph.vertexData) {
    const imageDeck = Number(applyLinearMap(BigInt(vertex.deck), columns) ^ gauge[vertex.baseVertex]);
    const image = liftVertexId(vertex.baseVertex, imageDeck, alternate.deckSize);
    vertexImages.add(image);
    vertexChecks += 1;
  }
  assert.equal(vertexImages.size, primary.graph.vertexCount);
  let edgeChecks = 0;
  for (const edge of primary.graph.edges) {
    const baseEdge = graph.edges[edge.baseEdgeId];
    const imageStart = Number(
      applyLinearMap(BigInt(edge.deckStart), columns) ^ gauge[baseEdge.tail],
    );
    const imageEdge = alternateEdge.get(`${edge.baseEdgeId}:${imageStart}`);
    assert(imageEdge);
    const mappedTail = liftVertexId(baseEdge.tail, imageStart, alternate.deckSize);
    const primaryHead = primary.graph.vertexData[edge.head];
    const mappedHeadDeck = Number(
      applyLinearMap(BigInt(primaryHead.deck), columns) ^ gauge[primaryHead.baseVertex],
    );
    const mappedHead = liftVertexId(baseEdge.head, mappedHeadDeck, alternate.deckSize);
    assert.equal(imageEdge.tail, mappedTail);
    assert.equal(imageEdge.head, mappedHead);
    edgeChecks += 1;
  }
  return {
    firstTreeEdgeIds: primary.treeEdgeIds,
    secondTreeEdgeIds: alternate.treeEdgeIds,
    deckLinearMapColumnsHex: columns.map((column) => column.toString(16)),
    vertexGaugeHex: gauge.map((value) => value.toString(16)),
    invertibleDeckMap: true,
    explicitVertexBijectionChecks: vertexChecks,
    explicitEdgeIncidenceChecks: edgeChecks,
    sameCoverUpToDeckBasisAndVertexGauge: true,
  };
}

function swapTwoBits(value) {
  assert(Number.isInteger(value) && value >= 0 && value < 4);
  return ((value & 1) << 1) | ((value & 2) >> 1);
}

function auditLoopSwapNaturality(base, attachment) {
  assert.equal(base.vertexCount, 1);
  assert.deepEqual(base.edges.map((edge) => edge.label), ["a", "b"]);
  assert.equal(attachment.rank, 2);
  const edgeLookup = new Map(
    attachment.graph.edges.map((edge) => [`${edge.baseEdgeId}:${edge.deckStart}`, edge]),
  );
  let vertexChecks = 0;
  for (const vertex of attachment.graph.vertexData) {
    const twice = swapTwoBits(swapTwoBits(vertex.deck));
    assert.equal(twice, vertex.deck);
    vertexChecks += 1;
  }
  let edgeChecks = 0;
  for (const edge of attachment.graph.edges) {
    const swappedBaseEdge = edge.baseEdgeId === 0 ? 1 : 0;
    const swappedDeck = swapTwoBits(edge.deckStart);
    const image = edgeLookup.get(`${swappedBaseEdge}:${swappedDeck}`);
    assert(image);
    assert.equal(image.tail, swapTwoBits(attachment.graph.vertexData[edge.tail].deck));
    assert.equal(image.head, swapTwoBits(attachment.graph.vertexData[edge.head].deck));
    edgeChecks += 1;
  }
  return {
    symmetry: "S2 swaps loop labels a,b and the two deck coordinates",
    involutiveVertexChecks: vertexChecks,
    naturalLiftEdgeChecks: edgeChecks,
    coverCommutesExactlyInTheDeclaredBouquetGauge: true,
    generalNaturality:
      "a base automorphism lifts after its induced deck-basis map and, for an unbased cover, a possible constant deck translation",
  };
}

function expectedCoverRank(rank) {
  const r = BigInt(rank);
  return 1n + (1n << r) * (r - 1n);
}

function auditRankRecurrence(base, attachment) {
  const actual = homologyRank(attachment.graph);
  const expected = expectedCoverRank(attachment.rank);
  assert.equal(BigInt(actual), expected);
  assert.equal(attachment.graph.vertexCount, base.vertexCount * attachment.deckSize);
  assert.equal(attachment.graph.edges.length, base.edges.length * attachment.deckSize);
  return {
    inputRank: attachment.rank,
    deckSize: attachment.deckSize,
    inputVertices: base.vertexCount,
    inputEdges: base.edges.length,
    outputVertices: attachment.graph.vertexCount,
    outputEdges: attachment.graph.edges.length,
    outputRank: actual,
    formula: "r'=1+2^r(r-1)",
  };
}

function auditTreeAndRankOneControls() {
  const tree = makeGraph("one-edge-tree", 2, [{ tail: 0, head: 1, label: "t" }]);
  const treeCover = buildHomologyCover(tree);
  assert.equal(treeCover.rank, 0);
  assert.equal(treeCover.deckSize, 1);
  assert.equal(treeCover.graph.vertexCount, tree.vertexCount);
  assert.deepEqual(
    treeCover.graph.edges.map(({ tail, head, label }) => ({ tail, head, label })),
    tree.edges.map(({ tail, head, label }) => ({ tail, head, label })),
  );

  const circle = bouquet(["a"]);
  const circleCover1 = buildHomologyCover(circle);
  const circleCover2 = buildHomologyCover(circleCover1.graph);
  assert.equal(circleCover1.rank, 1);
  assert.equal(homologyRank(circleCover1.graph), 1);
  assert.equal(circleCover2.rank, 1);
  assert.equal(homologyRank(circleCover2.graph), 1);
  assert.equal(connectedComponents(circleCover1.graph).count, 1);
  assert.equal(connectedComponents(circleCover2.graph).count, 1);

  const rankTwo = bouquet(["a", "b"]);
  const rankTwoCover = buildHomologyCover(rankTwo);
  const rankThree = bouquet(["a", "b", "c"]);
  const rankThreeCover = buildHomologyCover(rankThree);
  const boundaryRanks = [
    [homologyRank(tree), homologyRank(treeCover.graph)],
    [homologyRank(circle), homologyRank(circleCover1.graph)],
    [homologyRank(rankTwo), homologyRank(rankTwoCover.graph)],
    [homologyRank(rankThree), homologyRank(rankThreeCover.graph)],
  ];
  assert.deepEqual(boundaryRanks, [[0, 0], [1, 1], [2, 5], [3, 17]]);
  return {
    tree: {
      inputRank: 0,
      deckSize: 1,
      identityOnUnderlyingGraph: true,
    },
    rankOne: {
      ranks: [1, 1, 1],
      vertices: [1, circleCover1.graph.vertexCount, circleCover2.graph.vertexCount],
      edges: [1, circleCover1.graph.edges.length, circleCover2.graph.edges.length],
      nonGrowthVerified: true,
    },
    boundaryRecurrence: {
      inputToOutputRanks: boundaryRanks,
      expectedByFormula: ["0->0", "1->1", "2->5", "3->17"],
      rankThreeCover: {
        vertices: rankThreeCover.graph.vertexCount,
        edges: rankThreeCover.graph.edges.length,
        connected: connectedComponents(rankThreeCover.graph).count === 1,
      },
    },
  };
}

function auditMonodromyAndNoSection(base, attachment) {
  const cycleHolonomies = attachment.chords.map((chordId) => {
    let holonomy = 0n;
    for (const edgeId of fundamentalCycle(base, attachment.treeEdgeIds, chordId)) {
      holonomy ^= attachment.voltage[edgeId];
    }
    return holonomy;
  });
  assert.deepEqual(
    cycleHolonomies,
    attachment.chords.map((_edgeId, coordinate) => bit(coordinate)),
  );
  const sectionPotential = vectorCoboundaryPrimitive(base, attachment.voltage);
  assert.equal(sectionPotential, null);
  return {
    fundamentalCycleHolonomiesHex: cycleHolonomies.map((word) => word.toString(16)),
    monodromySpansFullDeckGroup: rankBitVectors(cycleHolonomies) === attachment.rank,
    vectorVoltageHasBasePrimitive: false,
    graphCoverHasSection: false,
    reason:
      "a section would supply a vertex deck potential whose coboundary is the voltage, contradicting nonzero cycle holonomy",
  };
}

function auditBasedTerminalFactorization(base, first, second) {
  assert.equal(base.vertexCount, 1);
  assert.equal(graphDigest(base), graphDigest(bouquet(["a", "b"])));
  const pulledBaseVoltage = second.graph.edges.map((edge) => {
    const firstEdge = first.graph.edges[edge.baseEdgeId];
    return first.voltage[firstEdge.baseEdgeId];
  });
  const basedPrimitive = vectorCoboundaryPrimitive(second.graph, pulledBaseVoltage);
  assert(basedPrimitive !== null);
  let vertexChecks = 0;
  for (let vertexId = 0; vertexId < second.graph.vertexCount; vertexId += 1) {
    const firstVertexId = second.graph.vertexData[vertexId].baseVertex;
    const expectedDeck = BigInt(first.graph.vertexData[firstVertexId].deck);
    assert.equal(basedPrimitive[vertexId], expectedDeck);
    vertexChecks += 1;
  }
  let edgeChecks = 0;
  for (const edge of second.graph.edges) {
    const firstEdge = first.graph.edges[edge.baseEdgeId];
    assert.equal(second.graph.vertexData[edge.tail].baseVertex, firstEdge.tail);
    assert.equal(second.graph.vertexData[edge.head].baseVertex, firstEdge.head);
    assert.equal(
      basedPrimitive[edge.tail] ^ basedPrimitive[edge.head],
      first.voltage[firstEdge.baseEdgeId],
    );
    edgeChecks += 1;
  }
  const unbasedMaps = [];
  for (let translation = 0; translation < first.deckSize; translation += 1) {
    const translated = basedPrimitive.map((value) => value ^ BigInt(translation));
    for (let edgeId = 0; edgeId < second.graph.edges.length; edgeId += 1) {
      const edge = second.graph.edges[edgeId];
      assert.equal(
        translated[edge.tail] ^ translated[edge.head],
        pulledBaseVoltage[edgeId],
      );
    }
    unbasedMaps.push(digest(translated.map((value) => value.toString(16))));
  }
  assert.equal(new Set(unbasedMaps).size, first.deckSize);
  return {
    witnessFinerCover: "the second homology cover composed down to the bouquet",
    factorMap: "forget the second deck coordinate and retain the first-cover vertex",
    basedVertexChecks: vertexChecks,
    basedEdgeChecks: edgeChecks,
    uniqueWhenBaseLiftFixed: true,
    unbasedFactorMapCount: unbasedMaps.length,
    unbasedMapsFormDeckTorsor: true,
    theorem:
      "the homology cover is terminal among connected based covers on which every F2 scalar cocycle pulls back exact; without base lifts, factor maps form a deck torsor",
    constructiveRule:
      "assemble the normalized primitives of the pulled-back coordinate cocycles into one deck-valued potential; connectedness makes it unique",
  };
}

function auditHeldOutCharacterAndProbeOrder(base, attachment) {
  const coordinateA = 1n;
  const coordinateB = 2n;
  const heldOut = coordinateA ^ coordinateB;
  const firstOrder = [coordinateA, coordinateB];
  const secondOrder = [coordinateB, coordinateA];
  const before = graphDigest(attachment.graph);
  const firstChecks = firstOrder.map((character) => verifyDeckCharacterPrimitive(attachment, character));
  const secondChecks = secondOrder.map((character) => verifyDeckCharacterPrimitive(attachment, character));
  const heldOutChecks = verifyDeckCharacterPrimitive(attachment, heldOut);
  const after = graphDigest(attachment.graph);
  assert.equal(before, after);
  const heldOutBaseWord = attachment.voltage.reduce(
    (word, voltage, edgeId) =>
      parity(heldOut & voltage) === 1 ? word | bit(edgeId) : word,
    0n,
  );
  assert.equal(scalarPrimitive(base, heldOutBaseWord), null);
  return {
    probeOrders: [["a", "b"], ["b", "a"]],
    constructionHasNoPredictorParameter: true,
    coverConstructedFromFullCycleSpaceBeforeAuditOrder: true,
    coverDigestStableAcrossProbeOrder: before,
    coordinateCharacterChecks: [firstChecks, secondChecks],
    heldOutCharacter: "a+b",
    heldOutCharacterWasCoordinateGenerator: false,
    heldOutPullbackEdgeChecks: heldOutChecks,
    heldOutHasBasePrimitive: false,
  };
}

function auditCharacterFiberContinuation(first, second) {
  const character = 3n;
  const firstCounts = [0, 0];
  for (const vertex of first.graph.vertexData) {
    firstCounts[parity(BigInt(vertex.deck) & character)] += 1;
  }
  assert.deepEqual(firstCounts, [2, 2]);
  const secondCounts = [0, 0];
  for (const vertex of second.graph.vertexData) {
    const firstVertex = first.graph.vertexData[vertex.baseVertex];
    secondCounts[parity(BigInt(firstVertex.deck) & character)] += 1;
  }
  assert.deepEqual(secondCounts, [64, 64]);
  const thirdDeckSize = 1n << BigInt(homologyRank(second.graph));
  const thirdRank = expectedCoverRank(homologyRank(second.graph));
  return {
    character: "a+b on the first deck group",
    firstFiberVertexCounts: firstCounts,
    secondPreimageFiberVertexCounts: secondCounts,
    explicitBranchFactors: [first.deckSize, second.deckSize],
    nextSymbolicBranchFactor: thirdDeckSize.toString(),
    nextSymbolicRank: thirdRank.toString(),
    induction:
      "for r>=2, r'=1+2^r(r-1)>=2, so every vertex has at least four lifts at every later stage",
    bothCharacterValuesHaveArbitrarilyDeepRefinement: true,
    infiniteDepthFiniteBranching: true,
    infinitelyManyChildrenAtOneFiniteStage: false,
  };
}

function auditHorizontalActionContinuation(base, first, second) {
  assert.deepEqual(base.edges.map((edge) => edge.label), ["a", "b"]);
  const expectedRootEdges = [0, 1];

  function auditLevel(graph, rootEdgeId) {
    let vertexChecks = 0;
    let outgoingEdgeChecks = 0;
    for (let vertex = 0; vertex < graph.vertexCount; vertex += 1) {
      const roots = graph.edges
        .filter((edge) => edge.tail === vertex)
        .map(rootEdgeId)
        .sort((left, right) => left - right);
      assert.deepEqual(roots, expectedRootEdges);
      vertexChecks += 1;
      outgoingEdgeChecks += roots.length;
    }
    return { vertexChecks, outgoingEdgeChecks };
  }

  const firstAudit = auditLevel(first.graph, (edge) => edge.baseEdgeId);
  const secondAudit = auditLevel(
    second.graph,
    (edge) => first.graph.edges[edge.baseEdgeId].baseEdgeId,
  );
  return {
    projectedActionAlphabet: ["a", "b"],
    everyMaterializedVertexHasOneOutgoingLiftOfEachAction: true,
    materializedLevelChecks: [firstAudit, secondAudit],
    infiniteWordTheorem:
      "unique path lifting gives one native infinite path from every state for every word in {a,b}^N",
  };
}

function certificatePayload(parent, attachment, stage, priorCertificateDigest) {
  return {
    schema: "oasis.homology-cover-step.v1",
    stage,
    parentGraphDigest: graphDigest(parent),
    priorCertificateDigest,
    homologyRank: attachment.rank,
    treeEdgeIds: attachment.treeEdgeIds,
    voltageHex: attachment.voltage.map((value) => value.toString(16)),
    deckSize: attachment.deckSize,
    coverVertices: attachment.graph.vertexCount,
    coverEdges: attachment.graph.edges.length,
    coverGraphDigest: graphDigest(attachment.graph),
  };
}

function makeCertificate(parent, attachment, stage, priorCertificateDigest) {
  const payload = certificatePayload(parent, attachment, stage, priorCertificateDigest);
  return { ...payload, certificateDigest: digest(payload) };
}

function makeCertificateChain(base, attachments) {
  let parent = base;
  let priorCertificateDigest = "GENESIS";
  const certificates = [];
  for (let stage = 0; stage < attachments.length; stage += 1) {
    const certificate = makeCertificate(
      parent,
      attachments[stage],
      stage,
      priorCertificateDigest,
    );
    certificates.push(certificate);
    priorCertificateDigest = certificate.certificateDigest;
    parent = attachments[stage].graph;
  }
  const chain = {
    schema: "oasis.homology-cover-chain.v1",
    genesisGraphDigest: graphDigest(base),
    certificates,
    terminalGraphDigest: graphDigest(parent),
  };
  chain.chainDigest = digest(chain);
  return chain;
}

function replayCertificateChain(chain) {
  assertExactKeys(chain, [
    "schema",
    "genesisGraphDigest",
    "certificates",
    "terminalGraphDigest",
    "chainDigest",
  ]);
  assert.equal(chain.schema, "oasis.homology-cover-chain.v1");
  const expectedChainDigest = chain.chainDigest;
  const withoutDigest = { ...chain };
  delete withoutDigest.chainDigest;
  assert.equal(expectedChainDigest, digest(withoutDigest));
  let parent = bouquet(["a", "b"]);
  assert.equal(chain.genesisGraphDigest, graphDigest(parent));
  let priorCertificateDigest = "GENESIS";
  for (let stage = 0; stage < chain.certificates.length; stage += 1) {
    const certificate = chain.certificates[stage];
    assertExactKeys(certificate, [
      "schema",
      "stage",
      "parentGraphDigest",
      "priorCertificateDigest",
      "homologyRank",
      "treeEdgeIds",
      "voltageHex",
      "deckSize",
      "coverVertices",
      "coverEdges",
      "coverGraphDigest",
      "certificateDigest",
    ]);
    assert.equal(certificate.schema, "oasis.homology-cover-step.v1");
    assert.equal(certificate.stage, stage);
    assert.equal(certificate.parentGraphDigest, graphDigest(parent));
    assert.equal(certificate.priorCertificateDigest, priorCertificateDigest);
    const voltageData = voltageFromTree(parent, certificate.treeEdgeIds);
    assert.equal(certificate.homologyRank, voltageData.rank);
    assert.deepEqual(
      certificate.voltageHex,
      voltageData.voltage.map((value) => value.toString(16)),
    );
    const attachment = buildVoltageCover(parent, voltageData);
    const expectedPayload = certificatePayload(
      parent,
      attachment,
      stage,
      priorCertificateDigest,
    );
    assert.deepEqual(
      Object.fromEntries(Object.keys(expectedPayload).map((key) => [key, certificate[key]])),
      expectedPayload,
    );
    assert.equal(certificate.certificateDigest, digest(expectedPayload));
    priorCertificateDigest = certificate.certificateDigest;
    parent = attachment.graph;
  }
  assert.equal(chain.terminalGraphDigest, graphDigest(parent));
  return parent;
}

function rejectsReplay(chain) {
  try {
    replayCertificateChain(chain);
    return false;
  } catch (error) {
    assert(error instanceof Error);
    return true;
  }
}

function auditTampering(chain) {
  const cases = {
    stage: (copy) => { copy.certificates[0].stage = 1; },
    rank: (copy) => { copy.certificates[0].homologyRank = 1; },
    tree: (copy) => { copy.certificates[1].treeEdgeIds[0] = 99; },
    voltage: (copy) => { copy.certificates[0].voltageHex[0] = "0"; },
    deckSize: (copy) => { copy.certificates[0].deckSize = 2; },
    coverVertices: (copy) => { copy.certificates[0].coverVertices += 1; },
    coverDigest: (copy) => { copy.certificates[0].coverGraphDigest = "0".repeat(64); },
    parentLink: (copy) => { copy.certificates[1].parentGraphDigest = "0".repeat(64); },
    certificateLink: (copy) => { copy.certificates[1].priorCertificateDigest = "0".repeat(64); },
    certificateDigest: (copy) => { copy.certificates[0].certificateDigest = "0".repeat(64); },
    recordSwap: (copy) => {
      [copy.certificates[0], copy.certificates[1]] =
        [copy.certificates[1], copy.certificates[0]];
    },
    extraField: (copy) => { copy.certificates[0].undeclared = true; },
    chainDigest: (copy) => { copy.chainDigest = "0".repeat(64); },
  };
  const rejected = {};
  for (const [name, mutate] of Object.entries(cases)) {
    const copy = cloneJson(chain);
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

export function runHomologyCoverAlgebraogenesis() {
  const base = bouquet(["a", "b"]);
  assert.equal(homologyRank(base), 2);
  const first = buildHomologyCover(base);
  const second = buildHomologyCover(first.graph);
  assert.deepEqual(
    [
      [base.vertexCount, base.edges.length, homologyRank(base)],
      [first.graph.vertexCount, first.graph.edges.length, homologyRank(first.graph)],
      [second.graph.vertexCount, second.graph.edges.length, homologyRank(second.graph)],
    ],
    [[1, 2, 2], [4, 8, 5], [128, 256, 129]],
  );

  const firstRankAudit = auditRankRecurrence(base, first);
  const secondRankAudit = auditRankRecurrence(first.graph, second);
  const firstTautological = auditTautologicalExactness(base, first);
  const secondTautological = auditTautologicalExactness(first.graph, second);
  const firstScalar = auditAllScalarPullbacksExact(base, first);
  const secondScalar = auditAllScalarPullbacksExact(first.graph, second);
  const firstConnectivity = auditConnectedAndTrivial(base, first);
  const secondConnectivity = auditConnectedAndTrivial(first.graph, second);
  const firstAttachmentObstruction = auditMonodromyAndNoSection(base, first);
  const secondAttachmentObstruction = auditMonodromyAndNoSection(first.graph, second);
  const terminalFactorization = auditBasedTerminalFactorization(base, first, second);
  const noBasePrimitive = [1n, 2n, 3n].map((word) => scalarPrimitive(base, word) === null);
  assert(noBasePrimitive.every(Boolean));
  const symmetry = auditLoopSwapNaturality(base, first);
  const gauge = auditSpanningTreeGauge(first.graph);
  const controls = auditTreeAndRankOneControls();
  const probeOrderAndHeldOut = auditHeldOutCharacterAndProbeOrder(base, first);
  const continuation = auditCharacterFiberContinuation(first, second);
  const horizontalActionContinuation = auditHorizontalActionContinuation(base, first, second);
  const chain = makeCertificateChain(base, [first, second]);
  const replayed = replayCertificateChain(chain);
  assert.equal(graphDigest(replayed), graphDigest(second.graph));
  const tamper = auditTampering(chain);

  return {
    schema: "oasis.homology-cover-algebraogenesis.v1",
    status:
      "exact F2 full-cycle-space voltage attachment with two explicit homology-cover iterations",
    fixture: {
      base: "one-vertex bouquet with loop labels a,b",
      field: "F2",
      explicitStages: [
        { stage: 0, vertices: 1, edges: 2, h1Rank: 2 },
        { stage: 1, vertices: 4, edges: 8, h1Rank: 5 },
        { stage: 2, vertices: 128, edges: 256, h1Rank: 129 },
      ],
    },
    universalProperty: {
      voltage:
        "tree edges map to zero and cotree edges to the full standard basis of H1",
      scalarFactorization:
        "after normalizing the base-vertex potential to zero, every F2 edge cocycle is uniquely a tree coboundary plus a character of the universal voltage",
      pullbackPrimitive:
        "phi(base vertex)+character(deck coordinate)",
      orbitAttachment:
        "the full H1 dual is killed simultaneously; no predictor-selected scalar character defines the cover",
      basedTerminalProperty:
        "coarsest connected based cover killing all scalar F2 cocycles; unbased factor maps form a deck torsor",
      terminalFactorizationRule:
        "assemble the based scalar primitives into a deck-valued potential and map each lifted vertex to (base vertex,potential)",
    },
    recurrence: {
      formula: "r'=1+2^r(r-1)",
      derivation:
        "connected cover has V'=2^r V and E'=2^r E, hence E'-V'+1=1+2^r(r-1)",
      stages: [firstRankAudit, secondRankAudit],
      ranks: [2, 5, 129],
    },
    exactness: {
      tautologicalDeckPrimitives: [firstTautological, secondTautological],
      allScalarCocycles: [firstScalar, secondScalar],
      nonzeroBouquetCharactersHaveBasePrimitive: noBasePrimitive.map((value) => !value),
    },
    connectivity: [firstConnectivity, secondConnectivity],
    attachmentObstruction: {
      stages: [firstAttachmentObstruction, secondAttachmentObstruction],
      terminalFactorization,
      connectednessAloneUsedAsObstruction: false,
    },
    naturality: {
      loopSwapS2: symmetry,
      spanningTreeAndBasisGauge: gauge,
    },
    probeOrderAndHeldOutCharacter: probeOrderAndHeldOut,
    continuation: {
      horizontalActions: horizontalActionContinuation,
      verticalRefinement: continuation,
    },
    controls,
    certificate: {
      replayedExactly: true,
      chainSummary: {
        schema: chain.schema,
        steps: chain.certificates.length,
        genesisGraphDigest: chain.genesisGraphDigest,
        terminalGraphDigest: chain.terminalGraphDigest,
        chainDigest: chain.chainDigest,
      },
      tamper,
    },
    claimLedger: [
      {
        claim: "the full universal F2 voltage cocycle becomes exact on its cover",
        status: "exact theorem and two-stage exhaustive edge audit",
      },
      {
        claim: "every scalar graph cocycle pulls back exact",
        status: "exact decomposition theorem; all 4 and 256 scalar cochains exhausted",
      },
      {
        claim: "the homology covers are connected while zero-voltage products split",
        status: "exact component audit at both explicit stages",
      },
      {
        claim: "connectedness by itself distinguishes the semantic attachment",
        status:
          "false; the certified distinction is full nonzero monodromy, absence of a section, and based terminal factorization",
      },
      {
        claim: "the universal primitive is a canonical vector",
        status:
          "false; a chosen base lift selects d(v,g)=g, while all unbased primitives form an affine deck torsor",
      },
      {
        claim: "the coarsest-cover factorization is unique without choosing base lifts",
        status:
          "false; uniqueness is based, while the four explicit unbased factor maps form the first deck-group torsor",
      },
      {
        claim: "probe evaluation order cannot alter the attachment",
        status:
          "exact API fact and digest audit: construction has no predictor input and attaches full H1 before probes are evaluated",
      },
      {
        claim: "both character values have arbitrarily deep refinement and every a/b word has native horizontal continuation",
        status:
          "exact cover and recurrence theorems; horizontal actions and two vertical stages materialized, later refinements symbolic",
      },
      {
        claim: "a single finite stage has infinitely many immediate children",
        status: "false; branching is finite at every stage",
      },
      {
        claim: "the spanning-tree basis is canonical",
        status: "false; alternate gauges are explicitly isomorphic",
      },
      {
        claim: "the attachment rule is selected endogenously by an obstruction",
        status: "not established; full homology attachment is declared",
      },
      {
        claim: "the process is non-sofic or establishes new Hodge theory",
        status: "not claimed or implied",
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
  console.log(JSON.stringify(runHomologyCoverAlgebraogenesis(), null, 2));
}
