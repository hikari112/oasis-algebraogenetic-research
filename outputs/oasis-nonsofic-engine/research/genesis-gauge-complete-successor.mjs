import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const LABELS = Object.freeze(["H", "V", "W"]);

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

function makeGraph(name, transitions, vertexData = undefined) {
  assert.deepEqual(Object.keys(transitions).sort(), [...LABELS].sort());
  const vertexCount = transitions.H.length;
  assert(vertexCount > 0);
  for (const label of LABELS) {
    assert.equal(transitions[label].length, vertexCount);
    assert.equal(new Set(transitions[label]).size, vertexCount);
    for (const target of transitions[label]) {
      assert(Number.isInteger(target) && target >= 0 && target < vertexCount);
    }
  }
  if (vertexData !== undefined) assert.equal(vertexData.length, vertexCount);
  return {
    name,
    labels: [...LABELS],
    vertexCount,
    transitions: Object.fromEntries(LABELS.map((label) => [label, [...transitions[label]]])),
    vertexData: vertexData === undefined ? undefined : vertexData.map((value) => ({ ...value })),
  };
}

function graphPayload(graph) {
  return {
    labels: [...graph.labels],
    vertexCount: graph.vertexCount,
    transitions: Object.fromEntries(graph.labels.map((label) => [label, [...graph.transitions[label]]])),
  };
}

function edges(graph) {
  const result = [];
  for (let tail = 0; tail < graph.vertexCount; tail += 1) {
    for (let labelIndex = 0; labelIndex < graph.labels.length; labelIndex += 1) {
      const label = graph.labels[labelIndex];
      result.push({
        id: tail * graph.labels.length + labelIndex,
        tail,
        head: graph.transitions[label][tail],
        label,
        labelIndex,
      });
    }
  }
  return result;
}

function edgeId(graph, tail, label) {
  return tail * graph.labels.length + graph.labels.indexOf(label);
}

function xorWords(...words) {
  assert(words.length > 0);
  return words[0].map((_, index) => words.reduce((value, word) => value ^ word[index], 0));
}

function binaryRank(rows, width) {
  const work = rows.map((row) => [...row]);
  let rank = 0;
  for (let column = 0; column < width && rank < work.length; column += 1) {
    const pivot = work.findIndex((row, index) => index >= rank && row[column] === 1);
    if (pivot === -1) continue;
    [work[rank], work[pivot]] = [work[pivot], work[rank]];
    for (let row = 0; row < work.length; row += 1) {
      if (row !== rank && work[row][column] === 1) {
        work[row] = work[row].map((value, index) => value ^ work[rank][index]);
      }
    }
    rank += 1;
  }
  return rank;
}

function coboundary(graph, potential) {
  assert.equal(potential.length, graph.vertexCount);
  return edges(graph).map(({ tail, head }) => potential[tail] ^ potential[head]);
}

function exactPotential(graph, cochain) {
  assert.equal(cochain.length, edges(graph).length);
  const adjacency = Array.from({ length: graph.vertexCount }, () => []);
  for (const edge of edges(graph)) {
    const value = cochain[edge.id];
    adjacency[edge.tail].push([edge.head, value]);
    adjacency[edge.head].push([edge.tail, value]);
  }
  const potential = Array(graph.vertexCount).fill(undefined);
  for (let seed = 0; seed < graph.vertexCount; seed += 1) {
    if (potential[seed] !== undefined) continue;
    potential[seed] = 0;
    const queue = [seed];
    while (queue.length > 0) {
      const vertex = queue.shift();
      for (const [neighbour, value] of adjacency[vertex]) {
        const forced = potential[vertex] ^ value;
        if (potential[neighbour] === undefined) {
          potential[neighbour] = forced;
          queue.push(neighbour);
        } else if (potential[neighbour] !== forced) {
          return null;
        }
      }
    }
  }
  assert.deepEqual(coboundary(graph, potential), cochain);
  return potential;
}

function isExact(graph, cochain) {
  return exactPotential(graph, cochain) !== null;
}

function cohomologySpanDimension(graph, cochains) {
  const edgeCount = edges(graph).length;
  const exactGenerators = Array.from({ length: graph.vertexCount }, (_, vertex) => (
    coboundary(graph, Array.from({ length: graph.vertexCount }, (_, index) => Number(index === vertex)))
  ));
  return binaryRank([...exactGenerators, ...cochains], edgeCount) - binaryRank(exactGenerators, edgeCount);
}

function connectedComponents(graph) {
  const component = Array(graph.vertexCount).fill(-1);
  const members = [];
  for (let seed = 0; seed < graph.vertexCount; seed += 1) {
    if (component[seed] !== -1) continue;
    const index = members.length;
    const group = [];
    const queue = [seed];
    component[seed] = index;
    while (queue.length > 0) {
      const vertex = queue.shift();
      group.push(vertex);
      for (const label of graph.labels) {
        const neighbour = graph.transitions[label][vertex];
        if (component[neighbour] === -1) {
          component[neighbour] = index;
          queue.push(neighbour);
        }
      }
    }
    members.push(group);
  }
  return { component, members };
}

function directedOneComplexRank(graph, componentCount = 1) {
  return edges(graph).length - graph.vertexCount + componentCount;
}

function attachVoltages(baseGraph, cochains, name, requireIndependent = true) {
  assert(cochains.length > 0);
  const edgeCount = edges(baseGraph).length;
  for (const cochain of cochains) assert.equal(cochain.length, edgeCount);
  if (requireIndependent) assert.equal(cohomologySpanDimension(baseGraph, cochains), cochains.length);

  const deckSize = 2 ** cochains.length;
  const vertexCount = baseGraph.vertexCount * deckSize;
  const vertexData = Array.from({ length: vertexCount }, (_, vertex) => ({
    baseVertex: Math.floor(vertex / deckSize),
    deck: vertex % deckSize,
  }));
  const transitions = Object.fromEntries(LABELS.map((label) => [label, []]));
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const { baseVertex, deck } = vertexData[vertex];
    for (const label of LABELS) {
      const baseEdge = edgeId(baseGraph, baseVertex, label);
      let voltage = 0;
      for (let coordinate = 0; coordinate < cochains.length; coordinate += 1) {
        voltage |= cochains[coordinate][baseEdge] << coordinate;
      }
      const targetBase = baseGraph.transitions[label][baseVertex];
      transitions[label][vertex] = targetBase * deckSize + (deck ^ voltage);
    }
  }
  const graph = makeGraph(name, transitions, vertexData);
  const primitives = cochains.map((_, coordinate) => vertexData.map(({ deck }) => (deck >> coordinate) & 1));
  const exactnessChecks = cochains.map((cochain, coordinate) => {
    const pulledBack = edges(graph).map((edge) => {
      const baseTail = graph.vertexData[edge.tail].baseVertex;
      return cochain[edgeId(baseGraph, baseTail, edge.label)];
    });
    const deltaPrimitive = coboundary(graph, primitives[coordinate]);
    assert.deepEqual(deltaPrimitive, pulledBack);
    return { coordinate, primitive: primitives[coordinate], pulledBack };
  });
  return { baseGraph, graph, cochains, deckSize, primitives, exactnessChecks };
}

function identityPermutation(size) {
  return Array.from({ length: size }, (_, index) => index);
}

function compose(left, right) {
  assert.equal(left.length, right.length);
  return right.map((image) => left[image]);
}

function inverse(permutation) {
  const result = Array(permutation.length);
  permutation.forEach((image, vertex) => { result[image] = vertex; });
  return result;
}

function permutationKey(permutation) {
  return permutation.join(",");
}

function permutationEqual(left, right) {
  return permutationKey(left) === permutationKey(right);
}

function permutationOrder(permutation) {
  const identity = identityPermutation(permutation.length);
  let power = identity;
  for (let order = 1; order <= 4 * permutation.length; order += 1) {
    power = compose(permutation, power);
    if (permutationEqual(power, identity)) return order;
  }
  throw new Error("permutation order not found");
}

function commutator(left, right) {
  return compose(left, compose(right, compose(inverse(left), inverse(right))));
}

function generatedGroup(generators) {
  const identity = identityPermutation(generators[0].length);
  const found = new Map([[permutationKey(identity), identity]]);
  const queue = [identity];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const generator of generators) {
      const product = compose(generator, current);
      const key = permutationKey(product);
      if (!found.has(key)) {
        found.set(key, product);
        queue.push(product);
      }
    }
  }
  return [...found.values()];
}

function isLabelAutomorphism(graph, permutation) {
  if (permutation.length !== graph.vertexCount || new Set(permutation).size !== graph.vertexCount) return false;
  return graph.labels.every((label) => permutation.every((image, vertex) => (
    permutation[graph.transitions[label][vertex]] === graph.transitions[label][image]
  )));
}

function deckTranslation(attachment, mask) {
  return attachment.graph.vertexData.map(({ baseVertex, deck }) => baseVertex * attachment.deckSize + (deck ^ mask));
}

function propagateLift(attachment, basePermutation, seedImage) {
  const { graph } = attachment;
  const map = Array(graph.vertexCount).fill(undefined);
  map[0] = seedImage;
  const queue = [0];
  while (queue.length > 0) {
    const source = queue.shift();
    for (const label of graph.labels) {
      const nextSource = graph.transitions[label][source];
      const nextImage = graph.transitions[label][map[source]];
      if (map[nextSource] === undefined) {
        map[nextSource] = nextImage;
        queue.push(nextSource);
      } else if (map[nextSource] !== nextImage) {
        return null;
      }
    }
  }
  if (map.some((value) => value === undefined) || new Set(map).size !== graph.vertexCount) return null;
  for (let vertex = 0; vertex < graph.vertexCount; vertex += 1) {
    const sourceBase = graph.vertexData[vertex].baseVertex;
    const imageBase = graph.vertexData[map[vertex]].baseVertex;
    if (imageBase !== basePermutation[sourceBase]) return null;
  }
  if (!isLabelAutomorphism(graph, map)) return null;
  return map;
}

function enumerateLifts(attachment, basePermutation) {
  const targetBase = basePermutation[attachment.graph.vertexData[0].baseVertex];
  return attachment.graph.vertexData.flatMap((data, candidate) => {
    if (data.baseVertex !== targetBase) return [];
    const lift = propagateLift(attachment, basePermutation, candidate);
    return lift === null ? [] : [lift];
  });
}

function quotientByDeckInvolution(attachment, deckMap, name) {
  assert(isLabelAutomorphism(attachment.graph, deckMap));
  assert.equal(permutationOrder(deckMap), 2);
  assert.equal(deckMap.filter((image, vertex) => image === vertex).length, 0);
  const quotientMap = Array(attachment.graph.vertexCount);
  const representatives = [];
  for (let vertex = 0; vertex < attachment.graph.vertexCount; vertex += 1) {
    if (quotientMap[vertex] !== undefined) continue;
    const image = deckMap[vertex];
    const index = representatives.length;
    representatives.push(Math.min(vertex, image));
    quotientMap[vertex] = index;
    quotientMap[image] = index;
  }
  const transitions = Object.fromEntries(LABELS.map((label) => [label, []]));
  const vertexData = representatives.map((representative) => ({
    baseVertex: attachment.graph.vertexData[representative].baseVertex,
    representative,
  }));
  for (let vertex = 0; vertex < representatives.length; vertex += 1) {
    for (const label of LABELS) {
      transitions[label][vertex] = quotientMap[attachment.graph.transitions[label][representatives[vertex]]];
    }
  }
  return { graph: makeGraph(name, transitions, vertexData), quotientMap, representatives, deckMap };
}

function inducedQuotientMap(source, target, lift) {
  const result = source.representatives.map((representative) => target.quotientMap[lift[representative]]);
  assert.equal(new Set(result).size, target.graph.vertexCount);
  assert(source.graph.labels.every((label) => result.every((image, vertex) => (
    result[source.graph.transitions[label][vertex]] === target.graph.transitions[label][image]
  ))));
  return result;
}

function pullbackToQuotient(baseGraph, quotient, cochain) {
  return edges(quotient.graph).map((edge) => {
    const baseTail = quotient.graph.vertexData[edge.tail].baseVertex;
    return cochain[edgeId(baseGraph, baseTail, edge.label)];
  });
}

function wordPermutation(actions, word) {
  assert(word.length > 0);
  return word.slice(0, -1).reduceRight(
    (result, name) => compose(actions[name], result),
    actions[word.at(-1)],
  );
}

function matrixIdentity() {
  return Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => Number(row === column)));
}

function elementaryMatrix(row, column) {
  const matrix = matrixIdentity();
  matrix[row][column] = 1;
  return matrix;
}

function matrixMultiply(left, right) {
  return Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => (
    [0, 1, 2, 3].reduce((value, index) => value ^ (left[row][index] & right[index][column]), 0)
  )));
}

function matrixKey(matrix) {
  return matrix.flat().join("");
}

function auditUT4Isomorphism(permutationGenerators) {
  const matrixGenerators = [elementaryMatrix(0, 1), elementaryMatrix(1, 2), elementaryMatrix(2, 3)];
  const identityPermutationValue = identityPermutation(permutationGenerators[0].length);
  const identityMatrix = matrixIdentity();
  const paired = new Map([[permutationKey(identityPermutationValue), identityMatrix]]);
  const queue = [[identityPermutationValue, identityMatrix]];
  while (queue.length > 0) {
    const [permutation, matrix] = queue.shift();
    for (let index = 0; index < permutationGenerators.length; index += 1) {
      const nextPermutation = compose(permutationGenerators[index], permutation);
      const nextMatrix = matrixMultiply(matrixGenerators[index], matrix);
      const key = permutationKey(nextPermutation);
      if (paired.has(key)) {
        assert.equal(matrixKey(paired.get(key)), matrixKey(nextMatrix));
      } else {
        paired.set(key, nextMatrix);
        queue.push([nextPermutation, nextMatrix]);
      }
    }
  }
  assert.equal(paired.size, 64);
  assert.equal(new Set([...paired.values()].map(matrixKey)).size, 64);
  return { permutationElements: paired.size, matrixElements: 64, faithfulGeneratorIsomorphism: true };
}

function buildLaboratory() {
  const baseVertexData = Array.from({ length: 8 }, (_, vertex) => ({
    x: vertex & 1,
    y: (vertex >> 1) & 1,
    z: (vertex >> 2) & 1,
  }));
  const baseLookup = new Map(baseVertexData.map(({ x, y, z }, vertex) => [`${x}${y}${z}`, vertex]));
  const base = makeGraph("W-extended OP route", {
    H: baseVertexData.map(({ x, y, z }) => baseLookup.get(`${x ^ 1}${y}${z}`)),
    V: baseVertexData.map(({ x, y, z }) => baseLookup.get(`${x}${y ^ 1}${z ^ x}`)),
    W: baseVertexData.map((_, vertex) => vertex),
  }, baseVertexData);
  assert.equal(connectedComponents(base).members.length, 1);

  const alpha0 = edges(base).map(({ tail, label }) => Number(label === "W") * base.vertexData[tail].z);
  const alpha1 = edges(base).map(({ tail, label }) => Number(label === "W") * (base.vertexData[tail].z ^ 1));
  const alphaSum = xorWords(alpha0, alpha1);
  assert(!isExact(base, alpha0));
  assert(!isExact(base, alpha1));
  assert(!isExact(base, alphaSum));
  assert.equal(cohomologySpanDimension(base, [alpha0, alpha1]), 2);
  assert.equal(cohomologySpanDimension(base, [alpha0, alpha1, alphaSum]), 2);

  const baseGauge = base.vertexData.map(({ x, y, z }) => baseLookup.get(`${x}${y}${z ^ 1}`));
  assert(isLabelAutomorphism(base, baseGauge));
  const translatedAlpha0 = edges(base).map(({ tail, label }) => alpha0[edgeId(base, baseGauge[tail], label)]);
  const translatedAlpha1 = edges(base).map(({ tail, label }) => alpha1[edgeId(base, baseGauge[tail], label)]);
  assert.deepEqual(translatedAlpha0, alpha1);
  assert.deepEqual(translatedAlpha1, alpha0);

  const attachment = attachVoltages(base, [alpha0, alpha1], "gauge-complete successor");
  const { graph } = attachment;
  assert.equal(graph.vertexCount, 32);
  assert.equal(edges(graph).length, 96);
  assert.equal(connectedComponents(graph).members.length, 1);
  assert.equal(directedOneComplexRank(graph), 65);

  const deckMaps = [0, 1, 2, 3].map((mask) => deckTranslation(attachment, mask));
  assert(deckMaps.every((map) => isLabelAutomorphism(graph, map)));
  assert(deckMaps.slice(1).every((map) => map.every((image, vertex) => image !== vertex)));
  for (let baseVertex = 0; baseVertex < base.vertexCount; baseVertex += 1) {
    const fiber = graph.vertexData.flatMap((data, vertex) => data.baseVertex === baseVertex ? [vertex] : []);
    const images = new Set(deckMaps.map((map) => map[fiber[0]]));
    assert.equal(images.size, 4);
    assert(fiber.every((vertex) => images.has(vertex)));
  }

  const lifts = enumerateLifts(attachment, baseGauge);
  assert.equal(lifts.length, 4);
  const naturalGaugeFormula = graph.vertexData.map(({ baseVertex, deck }) => {
    const { x, y, z } = base.vertexData[baseVertex];
    const targetBase = baseLookup.get(`${x}${y}${z ^ 1}`);
    const u0 = deck & 1;
    const u1 = (deck >> 1) & 1;
    return targetBase * 4 + (u1 | (u0 << 1));
  });
  const naturalGauge = lifts.find((lift) => permutationEqual(lift, naturalGaugeFormula));
  assert(naturalGauge);
  const classifiedLifts = [0, 1, 2, 3].map((mask) => {
    const formula = compose(deckMaps[mask], naturalGauge);
    const propagated = lifts.find((lift) => permutationEqual(lift, formula));
    assert(propagated);
    return { mask, map: propagated, order: permutationOrder(propagated) };
  });
  assert.deepEqual(classifiedLifts.map(({ order }) => order), [2, 4, 4, 2]);

  const conjugatedDeckMasks = deckMaps.map((deckMap) => {
    const conjugate = compose(naturalGauge, compose(deckMap, inverse(naturalGauge)));
    const mask = deckMaps.findIndex((candidate) => permutationEqual(candidate, conjugate));
    assert(mask >= 0);
    return mask;
  });
  assert.deepEqual(conjugatedDeckMasks, [0, 2, 1, 3]);
  const deckLines = [1, 2, 3].map((mask) => ({ mask, image: conjugatedDeckMasks[mask] }));
  const invariantLines = deckLines.filter(({ mask, image }) => mask === image).map(({ mask }) => mask);
  assert.deepEqual(invariantLines, [3]);
  const invariantComplementExists = deckLines.some(({ mask, image }) => mask !== 3 && mask === image);
  assert.equal(invariantComplementExists, false);

  const quotients = Object.fromEntries([1, 2, 3].map((mask) => [mask, quotientByDeckInvolution(
    attachment,
    deckMaps[mask],
    `16-state quotient by deck line ${mask.toString(2).padStart(2, "0")}`,
  )]));
  const quotientAudits = [1, 2, 3].map((mask) => {
    const quotient = quotients[mask];
    assert.equal(quotient.graph.vertexCount, 16);
    assert.equal(edges(quotient.graph).length, 48);
    assert.equal(connectedComponents(quotient.graph).members.length, 1);
    const exact = {
      alpha0: isExact(quotient.graph, pullbackToQuotient(base, quotient, alpha0)),
      alpha1: isExact(quotient.graph, pullbackToQuotient(base, quotient, alpha1)),
      alphaSum: isExact(quotient.graph, pullbackToQuotient(base, quotient, alphaSum)),
    };
    const targetMask = conjugatedDeckMasks[mask];
    const gaugeMap = inducedQuotientMap(quotient, quotients[targetMask], naturalGauge);
    return { mask, targetMask, exact, gaugeMapDigest: digest(gaugeMap) };
  });
  assert.deepEqual(quotientAudits.map(({ mask, targetMask, exact }) => ({ mask, targetMask, exact })), [
    { mask: 1, targetMask: 2, exact: { alpha0: false, alpha1: true, alphaSum: false } },
    { mask: 2, targetMask: 1, exact: { alpha0: true, alpha1: false, alphaSum: false } },
    { mask: 3, targetMask: 3, exact: { alpha0: false, alpha1: false, alphaSum: true } },
  ]);

  const chart = graph.vertexData.map(({ baseVertex, deck }) => {
    const { x, y, z } = base.vertexData[baseVertex];
    const u0 = deck & 1;
    const u1 = (deck >> 1) & 1;
    return { x, y, z, s: u0 ^ u1, t: u0 };
  });
  const chartLookup = new Map(chart.map(({ x, y, z, s, t }, vertex) => [`${x}${y}${z}${s}${t}`, vertex]));
  const formulaPermutation = (formula) => chart.map((coordinates) => {
    const { x, y, z, s, t } = formula(coordinates);
    return chartLookup.get(`${x}${y}${z}${s}${t}`);
  });
  const H = [...graph.transitions.H];
  const V = [...graph.transitions.V];
  const W = [...graph.transitions.W];
  assert.deepEqual(H, formulaPermutation(({ x, y, z, s, t }) => ({ x: x ^ 1, y, z, s, t })));
  assert.deepEqual(V, formulaPermutation(({ x, y, z, s, t }) => ({ x, y: y ^ 1, z: z ^ x, s, t })));
  assert.deepEqual(W, formulaPermutation(({ x, y, z, s, t }) => ({ x, y, z, s: s ^ 1, t: t ^ z })));
  assert.deepEqual(naturalGauge, formulaPermutation(({ x, y, z, s, t }) => ({ x, y, z: z ^ 1, s, t: t ^ s })));

  const R = commutator(V, H);
  const Q = commutator(W, V);
  const T = commutator(W, R);
  assert.deepEqual(R, formulaPermutation(({ x, y, z, s, t }) => ({ x, y, z: z ^ 1, s, t })));
  assert.deepEqual(Q, formulaPermutation(({ x, y, z, s, t }) => ({ x, y, z, s, t: t ^ x })));
  assert.deepEqual(T, formulaPermutation(({ x, y, z, s, t }) => ({ x, y, z, s, t: t ^ 1 })));
  assert.deepEqual(T, deckMaps[3]);
  assert.deepEqual(commutator(Q, H), T);
  assert(permutationEqual(compose(naturalGauge, T), compose(T, naturalGauge)));
  assert(permutationEqual(compose(naturalGauge, W), compose(W, naturalGauge)));
  assert(!permutationEqual(compose(R, W), compose(W, R)));
  assert.equal(isLabelAutomorphism(graph, R), false);
  assert(lifts.every((lift) => !permutationEqual(lift, R)));

  const actions = { H, V, W, R, Q, T };
  assert.deepEqual(compose(V, H), compose(R, compose(H, V)));
  assert.deepEqual(compose(W, V), compose(Q, compose(V, W)));
  assert.deepEqual(compose(W, R), compose(T, compose(R, W)));
  assert.deepEqual(compose(Q, H), compose(T, compose(H, Q)));
  assert.deepEqual(compose(H, W), compose(W, H));

  const transitionGroup = generatedGroup([H, V, W]);
  assert.equal(transitionGroup.length, 64);
  const center = transitionGroup.filter((left) => transitionGroup.every((right) => (
    permutationEqual(compose(left, right), compose(right, left))
  )));
  assert.equal(center.length, 2);
  assert.deepEqual(new Set(center.map(permutationKey)), new Set([permutationKey(identityPermutation(32)), permutationKey(T)]));
  const orderProfile = Object.fromEntries([...new Set(transitionGroup.map(permutationOrder))].sort().map((order) => [
    order,
    transitionGroup.filter((element) => permutationOrder(element) === order).length,
  ]));
  assert.deepEqual(orderProfile, { 1: 1, 2: 27, 4: 36 });
  const stabilizer = transitionGroup.filter((element) => element[0] === 0);
  assert.equal(stabilizer.length, 2);
  assert.deepEqual(new Set(stabilizer.map(permutationKey)), new Set([permutationKey(identityPermutation(32)), permutationKey(Q)]));
  const ut4Audit = auditUT4Isomorphism([H, V, W]);

  assert(!transitionGroup.some((element) => permutationEqual(element, naturalGauge)));
  assert(transitionGroup.every((element) => permutationEqual(
    compose(naturalGauge, element), compose(element, naturalGauge),
  )));
  const extendedGroup = generatedGroup([H, V, W, naturalGauge]);
  assert.equal(extendedGroup.length, 128);
  const directProductWords = transitionGroup.flatMap((element) => [
    permutationKey(element),
    permutationKey(compose(naturalGauge, element)),
  ]);
  assert.equal(new Set(directProductWords).size, 128);

  const normalTarget = wordPermutation(actions, ["H", "V", "W"]);
  const corrections = {
    I: identityPermutation(32),
    R,
    Q,
    T,
    TQ: compose(T, Q),
    RQ: compose(R, Q),
  };
  const orderWords = ["HVW", "HWV", "VHW", "VWH", "WHV", "WVH"];
  const expectedCorrection = { HVW: "I", HWV: "TQ", VHW: "R", VWH: "R", WHV: "TQ", WVH: "RQ" };
  const orderCorrectionAudit = orderWords.map((word) => {
    const permutation = wordPermutation(actions, [...word]);
    const correction = compose(permutation, inverse(normalTarget));
    const name = Object.keys(corrections).find((key) => permutationEqual(corrections[key], correction));
    assert.equal(name, expectedCorrection[word]);
    return { word, correction: name, digest: digest(permutation) };
  });
  const pathA = [
    ["W", "V", "H"],
    ["W", "R", "H", "V"],
    ["T", "R", "W", "H", "V"],
    ["T", "R", "H", "W", "V"],
    ["T", "R", "H", "Q", "V", "W"],
    ["R", "Q", "H", "V", "W"],
  ];
  const pathB = [
    ["W", "V", "H"],
    ["Q", "V", "W", "H"],
    ["Q", "V", "H", "W"],
    ["Q", "R", "H", "V", "W"],
    ["R", "Q", "H", "V", "W"],
  ];
  const auditPath = (path) => {
    const permutations = path.map((word) => wordPermutation(actions, word));
    assert(permutations.every((permutation) => permutationEqual(permutation, permutations[0])));
    return path.map((word, index) => ({ word: word.join(" "), digest: digest(permutations[index]) }));
  };
  const auditedPathA = auditPath(pathA);
  const auditedPathB = auditPath(pathB);
  assert.equal(auditedPathA[0].digest, auditedPathB[0].digest);
  assert(transitionGroup.every((element) => permutationEqual(
    compose(naturalGauge, element), compose(element, naturalGauge),
  )));

  const rawRedundant = attachVoltages(base, [alpha0, alpha1, alphaSum], "redundant three-coordinate cover", false);
  const rawComponents = connectedComponents(rawRedundant.graph);
  assert.equal(rawRedundant.graph.vertexCount, 64);
  assert.equal(edges(rawRedundant.graph).length, 192);
  assert.equal(rawComponents.members.length, 2);
  assert.deepEqual(rawComponents.members.map((members) => members.length), [32, 32]);
  const rawRelationValues = rawRedundant.graph.vertexData.map(({ deck }) => (
    (deck & 1) ^ ((deck >> 1) & 1) ^ ((deck >> 2) & 1)
  ));
  for (const label of LABELS) {
    assert(rawRelationValues.every((value, vertex) => value === rawRelationValues[rawRedundant.graph.transitions[label][vertex]]));
  }
  assert.equal(new Set(rawRelationValues).size, 2);
  assert.equal(directedOneComplexRank(rawRedundant.graph, 2), 130);

  return {
    base,
    alpha0,
    alpha1,
    alphaSum,
    baseGauge,
    attachment,
    deckMaps,
    lifts,
    classifiedLifts,
    naturalGauge,
    conjugatedDeckMasks,
    invariantLines,
    invariantComplementExists,
    quotientAudits,
    chart,
    H,
    V,
    W,
    R,
    Q,
    T,
    transitionGroup,
    center,
    orderProfile,
    stabilizer,
    ut4Audit,
    extendedGroup,
    orderCorrectionAudit,
    auditedPathA,
    auditedPathB,
    rawRedundant,
    rawComponents,
  };
}

function buildCertificate(lab) {
  const body = {
    schema: "oasis.genesis-gauge-complete-successor.certificate.v1",
    construction: {
      baseGraphDigest: digest(graphPayload(lab.base)),
      baseVertices: lab.base.vertexCount,
      baseDirectedEdges: edges(lab.base).length,
      declaredNewLabel: "W",
      cochainWords: {
        alpha0: lab.alpha0.join(""),
        alpha1: lab.alpha1.join(""),
        sum: lab.alphaSum.join(""),
      },
      cohomologySpanDimension: cohomologySpanDimension(lab.base, [lab.alpha0, lab.alpha1]),
      gaugeSwapsOrbit: true,
    },
    minimalCover: {
      graphDigest: digest(graphPayload(lab.attachment.graph)),
      vertices: lab.attachment.graph.vertexCount,
      directedEdges: edges(lab.attachment.graph).length,
      directedOneComplexRank: directedOneComplexRank(lab.attachment.graph),
      components: connectedComponents(lab.attachment.graph).members.length,
      deckGroup: "F2^2",
      deckOrder: lab.deckMaps.length,
      primitiveDigests: lab.attachment.exactnessChecks.map(({ primitive }) => digest(primitive)),
    },
    gauge: {
      propagatedLiftCount: lab.lifts.length,
      liftOrdersByDeckOffset: lab.classifiedLifts.map(({ mask, order }) => ({ mask, order })),
      conjugationOnDeckMasks: lab.conjugatedDeckMasks,
      invariantLines: lab.invariantLines,
      invariantComplementExists: lab.invariantComplementExists,
      module: "indecomposable two-dimensional F2[C2] permutation module",
      naturalLiftDigest: digest(lab.naturalGauge),
    },
    quotients: lab.quotientAudits.map(({ mask, targetMask, exact, gaugeMapDigest }) => ({
      deckLine: mask,
      gaugeTargetLine: targetMask,
      exact,
      gaugeMapDigest,
      vertices: 16,
    })),
    transport: {
      GCommutesWithW: permutationEqual(compose(lab.naturalGauge, lab.W), compose(lab.W, lab.naturalGauge)),
      RCommutesWithW: permutationEqual(compose(lab.R, lab.W), compose(lab.W, lab.R)),
      RIsGaugeLift: lab.lifts.some((lift) => permutationEqual(lift, lab.R)),
      TEqualsDiagonalDeck: permutationEqual(lab.T, lab.deckMaps[3]),
      TGaugeConjugationFixed: permutationEqual(compose(lab.naturalGauge, lab.T), compose(lab.T, lab.naturalGauge)),
      transitionGroup: "UT4(F2)",
      transitionGroupOrder: lab.transitionGroup.length,
      centerOrder: lab.center.length,
      orderProfile: lab.orderProfile,
      originStabilizerOrder: lab.stabilizer.length,
      ut4Audit: lab.ut4Audit,
      extendedGroup: "UT4(F2) x C2",
      extendedGroupOrder: lab.extendedGroup.length,
    },
    reorder: {
      orderCorrections: lab.orderCorrectionAudit.map(({ word, correction }) => ({ word, correction })),
      pathASteps: lab.auditedPathA,
      pathBSteps: lab.auditedPathB,
      completeMismatchIdentity: true,
      gaugeEquivariant: true,
    },
    redundantControl: {
      rawCoordinates: 3,
      cohomologyRank: cohomologySpanDimension(lab.base, [lab.alpha0, lab.alpha1, lab.alphaSum]),
      vertices: lab.rawRedundant.graph.vertexCount,
      directedEdges: edges(lab.rawRedundant.graph).length,
      components: lab.rawComponents.members.length,
      componentSizes: lab.rawComponents.members.map((members) => members.length),
      relation: "u0+u1+uSum is constant on components",
    },
    theoremBoundary: {
      WContinuationDeclaredNotGenerated: true,
      fullVoltageOrbitRepresented: true,
      literalAssociatorGenerated: false,
      H3ClassGenerated: false,
      higherFillerAttached: false,
      nonSoficityEstablished: false,
      hodgeTheoryEstablished: false,
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

export function replayGenesisGaugeCompleteCertificate(candidate) {
  const expected = buildCertificate(buildLaboratory());
  return validateCertificate(candidate, expected);
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
  reject("cochain word", (value) => { value.construction.cochainWords.alpha0 = "0".repeat(24); });
  reject("cohomology rank", (value) => { value.construction.cohomologySpanDimension = 1; });
  reject("minimal state count", (value) => { value.minimalCover.vertices = 16; });
  reject("directed rank", (value) => { value.minimalCover.directedOneComplexRank = 33; });
  reject("deck order", (value) => { value.minimalCover.deckOrder = 2; });
  reject("gauge lift count", (value) => { value.gauge.propagatedLiftCount = 2; });
  reject("gauge lift order", (value) => { value.gauge.liftOrdersByDeckOffset[1].order = 2; });
  reject("invariant complement", (value) => { value.gauge.invariantComplementExists = true; });
  reject("quotient gauge target", (value) => { value.quotients[0].gaugeTargetLine = 1; });
  reject("R conflated with G", (value) => { value.transport.RIsGaugeLift = true; });
  reject("T gauge-conjugation fixedness", (value) => { value.transport.TGaugeConjugationFixed = false; });
  reject("transition group order", (value) => { value.transport.transitionGroupOrder = 32; });
  reject("extended group order", (value) => { value.transport.extendedGroupOrder = 64; });
  reject("reorder correction", (value) => { value.reorder.orderCorrections[5].correction = "T"; });
  reject("raw component count", (value) => { value.redundantControl.components = 1; });
  reject("associator overclaim", (value) => { value.theoremBoundary.literalAssociatorGenerated = true; });
  reject("certificate digest", (value) => { value.certificateDigest = "f".repeat(64); }, false);
  reject("undeclared field", (value) => { value.theoremBoundary.openConjectureSolved = true; });
  return cases;
}

export function runGenesisGaugeCompleteSuccessor() {
  const lab = buildLaboratory();
  const certificate = buildCertificate(lab);
  assert(validateCertificate(certificate, certificate));
  assert(replayGenesisGaugeCompleteCertificate(certificate));
  const tamperCases = tamperSuite(certificate);
  return {
    schema: "oasis.genesis-gauge-complete-successor.v1",
    status: "PASS",
    result: {
      construction: {
        cohomologyRank: 2,
        vertices: lab.attachment.graph.vertexCount,
        directedEdges: edges(lab.attachment.graph).length,
        directedOneComplexRank: directedOneComplexRank(lab.attachment.graph),
        connected: true,
        deckGroup: "F2^2",
      },
      gauge: {
        lifts: lab.lifts.length,
        liftOrderProfile: { order2: 2, order4: 2 },
        deckModuleIndecomposable: true,
        invariantComplementExists: false,
      },
      quotients: lab.quotientAudits.map(({ mask, targetMask, exact }) => ({ deckLine: mask, gaugeTargetLine: targetMask, exact })),
      transport: {
        monodromy: "UT4(F2)",
        order: lab.transitionGroup.length,
        centerOrder: lab.center.length,
        orderProfile: lab.orderProfile,
        originStabilizerOrder: lab.stabilizer.length,
        extendedGaugeGroup: "UT4(F2) x C2",
        extendedOrder: lab.extendedGroup.length,
        GCommutesWithW: true,
        RCommutesWithW: false,
        nestedDefect: "T=[W,R]=[Q,H] is diagonal deck isotropy fixed by gauge conjugation",
      },
      reorder: {
        corrections: lab.orderCorrectionAudit.map(({ word, correction }) => ({ word, correction })),
        completeMismatchIdentity: true,
        gaugeEquivariant: true,
      },
      redundantControl: {
        rawVertices: lab.rawRedundant.graph.vertexCount,
        components: lab.rawComponents.members.length,
        componentSizes: lab.rawComponents.members.map((members) => members.length),
      },
    },
    theoremBoundary: certificate.theoremBoundary,
    certificate,
    tamper: {
      attempted: tamperCases.length,
      rejected: tamperCases.filter(({ rejected }) => rejected).length,
      cases: tamperCases,
    },
  };
}

function printPassLines(result) {
  console.log("PASS voltage orbit: rank 2, connected 32-state minimal cover, directed rank 65");
  console.log("PASS gauge propagation: 4 lifts, orders 2/4/4/2, indecomposable deck module");
  console.log("PASS quotients: two gauge-swapped atomic repairs and one invariant-sum repair");
  console.log("PASS transport: UT4(F2) order 64, center order 2, gauge extension order 128");
  console.log("PASS nested defect: G commutes with W while gauge-conjugation-fixed T=[W,R]=[Q,H] survives");
  console.log("PASS reorder: all six corrections and both complete paths agree exactly");
  console.log("PASS redundant control: 64 raw states split into two 32-state components");
  console.log(`PASS replay/tamper: ${result.tamper.rejected}/${result.tamper.attempted} mutations rejected`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = runGenesisGaugeCompleteSuccessor();
  printPassLines(result);
  console.log(JSON.stringify(result, null, 2));
}
