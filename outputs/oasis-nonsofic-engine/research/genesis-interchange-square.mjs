import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const LABELS = Object.freeze(["a", "b"]);

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeGraph(name, transitions, vertexData = undefined) {
  assert.deepEqual(Object.keys(transitions).sort(), [...LABELS].sort());
  const vertexCount = transitions.a.length;
  assert(vertexCount > 0);
  for (const label of LABELS) {
    assert.equal(transitions[label].length, vertexCount);
    for (const target of transitions[label]) {
      assert(Number.isInteger(target) && target >= 0 && target < vertexCount);
    }
  }
  if (vertexData !== undefined) assert.equal(vertexData.length, vertexCount);
  return Object.freeze({
    name,
    labels: LABELS,
    vertexCount,
    transitions: Object.freeze({
      a: Object.freeze([...transitions.a]),
      b: Object.freeze([...transitions.b]),
    }),
    vertexData: vertexData === undefined ? undefined : Object.freeze(vertexData.map(Object.freeze)),
  });
}

function graphPayload(graph) {
  return {
    labels: [...graph.labels],
    vertexCount: graph.vertexCount,
    transitions: {
      a: [...graph.transitions.a],
      b: [...graph.transitions.b],
    },
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

function cycleRank(graph) {
  assert(connected(graph));
  return edges(graph).length - graph.vertexCount + 1;
}

function edgeId(graph, tail, label) {
  return tail * graph.labels.length + graph.labels.indexOf(label);
}

function xorWords(...words) {
  assert(words.length > 0);
  return words[0].map((_, index) => words.reduce((bit, word) => bit ^ word[index], 0));
}

function binaryRowRank(rows, width) {
  const work = rows.map((row) => [...row]);
  let rank = 0;
  for (let column = 0; column < width && rank < work.length; column += 1) {
    const pivot = work.findIndex((row, index) => index >= rank && row[column] === 1);
    if (pivot === -1) continue;
    [work[rank], work[pivot]] = [work[pivot], work[rank]];
    for (let row = 0; row < work.length; row += 1) {
      if (row !== rank && work[row][column] === 1) {
        work[row] = work[row].map((bit, index) => bit ^ work[rank][index]);
      }
    }
    rank += 1;
  }
  return rank;
}

function coboundary(graph, potential) {
  assert.equal(potential.length, graph.vertexCount);
  return edges(graph).map((edge) => potential[edge.tail] ^ potential[edge.head]);
}

function tailLocalize(graph, predicate, cochain) {
  assert.equal(predicate.length, graph.vertexCount);
  assert.equal(cochain.length, edges(graph).length);
  return edges(graph).map((edge, index) => predicate[edge.tail] & cochain[index]);
}

function cohomologySpanDimension(graph, cochains) {
  const edgeCount = edges(graph).length;
  const exactGenerators = Array.from({ length: graph.vertexCount }, (_, vertex) => (
    coboundary(graph, Array.from({ length: graph.vertexCount }, (_, index) => Number(index === vertex)))
  ));
  return binaryRowRank([...exactGenerators, ...cochains], edgeCount)
    - binaryRowRank(exactGenerators, edgeCount);
}

function isExact(graph, cochain) {
  assert.equal(cochain.length, edges(graph).length);
  const possibilities = 2 ** graph.vertexCount;
  for (let mask = 0; mask < possibilities; mask += 1) {
    const potential = Array.from({ length: graph.vertexCount }, (_, vertex) => (mask >> vertex) & 1);
    if (coboundary(graph, potential).every((bit, index) => bit === cochain[index])) return true;
  }
  return false;
}

function independentModuloExact(graph, cochains) {
  for (let mask = 1; mask < 2 ** cochains.length; mask += 1) {
    const selected = cochains.filter((_, index) => (mask >> index) & 1);
    if (isExact(graph, xorWords(...selected))) return false;
  }
  return true;
}

function pullbackCochain(baseGraph, coverGraph, cochain) {
  assert.equal(cochain.length, edges(baseGraph).length);
  return edges(coverGraph).map((edge) => {
    const baseTail = coverGraph.vertexData[edge.tail].baseVertex;
    return cochain[edgeId(baseGraph, baseTail, edge.label)];
  });
}

function attachOrbit(baseGraph, cochains, name) {
  assert(cochains.length > 0);
  const edgeCount = edges(baseGraph).length;
  for (const cochain of cochains) assert.equal(cochain.length, edgeCount);
  assert.equal(cohomologySpanDimension(baseGraph, cochains), cochains.length);

  const deckSize = 2 ** cochains.length;
  const vertexCount = baseGraph.vertexCount * deckSize;
  const vertexData = Array.from({ length: vertexCount }, (_, vertex) => ({
    baseVertex: Math.floor(vertex / deckSize),
    deck: vertex % deckSize,
  }));
  const transitions = { a: [], b: [] };

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
    const pulledBack = pullbackCochain(baseGraph, graph, cochain);
    const deltaPrimitive = coboundary(graph, primitives[coordinate]);
    return {
      coordinate,
      exact: pulledBack.every((bit, index) => bit === deltaPrimitive[index]),
      pulledBack,
      primitive: primitives[coordinate],
    };
  });
  assert(exactnessChecks.every(({ exact }) => exact));

  return { baseGraph, graph, cochains, deckSize, primitives, exactnessChecks };
}

function connected(graph) {
  const adjacent = Array.from({ length: graph.vertexCount }, () => new Set());
  for (const edge of edges(graph)) {
    adjacent[edge.tail].add(edge.head);
    adjacent[edge.head].add(edge.tail);
  }
  const seen = new Set([0]);
  const queue = [0];
  while (queue.length > 0) {
    const vertex = queue.shift();
    for (const neighbour of adjacent[vertex]) {
      if (!seen.has(neighbour)) {
        seen.add(neighbour);
        queue.push(neighbour);
      }
    }
  }
  return seen.size === graph.vertexCount;
}

function isAutomorphism(graph, permutation) {
  if (new Set(permutation).size !== graph.vertexCount) return false;
  return LABELS.every((label) => permutation.every((image, vertex) => (
    permutation[graph.transitions[label][vertex]] === graph.transitions[label][image]
  )));
}

function translatedCochain(graph, cochain, permutation) {
  return edges(graph).map((edge) => cochain[edgeId(graph, permutation[edge.tail], edge.label)]);
}

function allPermutations(size, visit) {
  const permutation = Array.from({ length: size }, (_, index) => index);
  function generate(position) {
    if (position === size) {
      visit([...permutation]);
      return;
    }
    for (let index = position; index < size; index += 1) {
      [permutation[position], permutation[index]] = [permutation[index], permutation[position]];
      generate(position + 1);
      [permutation[position], permutation[index]] = [permutation[index], permutation[position]];
    }
  }
  generate(0);
}

function isLabelledIsomorphism(source, target, map) {
  return new Set(map).size === target.vertexCount && LABELS.every((label) => (
    map.every((image, vertex) => map[source.transitions[label][vertex]] === target.transitions[label][image])
  ));
}

function enumerateIsomorphisms(source, target) {
  assert.equal(source.vertexCount, target.vertexCount);
  const result = [];
  allPermutations(source.vertexCount, (map) => {
    if (isLabelledIsomorphism(source, target, map)) result.push(map);
  });
  return result;
}

function compose(left, right) {
  return right.map((image) => left[image]);
}

function identityPermutation(size) {
  return Array.from({ length: size }, (_, index) => index);
}

function inversePermutation(permutation) {
  const inverse = Array(permutation.length);
  permutation.forEach((image, vertex) => { inverse[image] = vertex; });
  return inverse;
}

function permutationCommutator(left, right) {
  return compose(left, compose(right, compose(inversePermutation(left), inversePermutation(right))));
}

function permutationKey(permutation) {
  return permutation.join(",");
}

function generatedGroup(generators) {
  const size = generators[0].length;
  const identity = Array.from({ length: size }, (_, index) => index);
  const group = new Map([[permutationKey(identity), identity]]);
  const queue = [identity];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const generator of generators) {
      const product = compose(generator, current);
      const key = permutationKey(product);
      if (!group.has(key)) {
        group.set(key, product);
        queue.push(product);
      }
    }
  }
  return [...group.values()];
}

function orderOf(permutation) {
  const identity = Array.from({ length: permutation.length }, (_, index) => index);
  let power = identity;
  for (let order = 1; order <= 2 * permutation.length; order += 1) {
    power = compose(permutation, power);
    if (permutationKey(power) === permutationKey(identity)) return order;
  }
  throw new Error("permutation order search failed");
}

function coordKey({ x, y, z }) {
  return `${x}${y}${z}`;
}

function addQuotient(left, right) {
  return { x: left.x ^ right.x, y: left.y ^ right.y };
}

function chartGauge({ x, y }) {
  return x & y;
}

function cocycleOP(left, right) {
  return left.x & right.y;
}

function cocyclePO(left, right) {
  return left.y & right.x;
}

function chartIndex(chart) {
  return new Map(chart.map((coordinates, vertex) => [coordKey(coordinates), vertex]));
}

function assertActionFormula(graph, chart, label, formula) {
  for (let vertex = 0; vertex < graph.vertexCount; vertex += 1) {
    assert.deepEqual(chart[graph.transitions[label][vertex]], formula(chart[vertex]));
  }
}

function buildLaboratory() {
  const base = makeGraph("A", { a: [0], b: [0] }, [{ point: "*" }]);
  const o = [1, 0];
  const p = [0, 1];
  assert(!isExact(base, o));
  assert(!isExact(base, p));
  assert(independentModuloExact(base, [o, p]));

  const firstO = attachOrbit(base, [o], "J_o(A)");
  const firstP = attachOrbit(base, [p], "J_p(A)");
  assert(connected(firstO.graph));
  assert(connected(firstP.graph));

  const firstOAtoms = [[1, 0], [0, 1]];
  const firstPAtoms = [[1, 0], [0, 1]];
  const pulledP = pullbackCochain(base, firstO.graph, p);
  const pulledO = pullbackCochain(base, firstP.graph, o);
  const [p0, p1] = firstOAtoms.map((atom) => tailLocalize(firstO.graph, atom, pulledP));
  const [o0, o1] = firstPAtoms.map((atom) => tailLocalize(firstP.graph, atom, pulledO));
  assert.deepEqual(xorWords(p0, p1), pulledP);
  assert.deepEqual(xorWords(o0, o1), pulledO);
  assert.equal(cohomologySpanDimension(firstO.graph, [p0, p1]), 2);
  assert.equal(cohomologySpanDimension(firstP.graph, [o0, o1]), 2);

  for (const [graph, orbit] of [[firstO.graph, [p0, p1]], [firstP.graph, [o0, o1]]]) {
    assert(orbit.every((cochain) => !isExact(graph, cochain)));
    assert(independentModuloExact(graph, orbit));
  }

  const firstODeck = [1, 0];
  const firstPDeck = [1, 0];
  assert(isAutomorphism(firstO.graph, firstODeck));
  assert(isAutomorphism(firstP.graph, firstPDeck));
  assert.deepEqual(translatedCochain(firstO.graph, p0, firstODeck), p1);
  assert.deepEqual(translatedCochain(firstO.graph, p1, firstODeck), p0);
  assert.deepEqual(translatedCochain(firstP.graph, o0, firstPDeck), o1);
  assert.deepEqual(translatedCochain(firstP.graph, o1, firstPDeck), o0);

  const routeOP = attachOrbit(firstO.graph, [p0, p1], "J_p J_o(A)");
  const routePO = attachOrbit(firstP.graph, [o0, o1], "J_o J_p(A)");
  const chartOP = routeOP.graph.vertexData.map(({ baseVertex: x, deck }) => {
    const u0 = deck & 1;
    const u1 = (deck >> 1) & 1;
    return { x, y: u0 ^ u1, z: u1 };
  });
  const chartPO = routePO.graph.vertexData.map(({ baseVertex: y, deck }) => {
    const v0 = deck & 1;
    const v1 = (deck >> 1) & 1;
    return { x: v0 ^ v1, y, z: v1 };
  });

  assert.equal(routeOP.graph.vertexCount, 8);
  assert.equal(routePO.graph.vertexCount, 8);
  assert.equal(edges(routeOP.graph).length, 16);
  assert.equal(edges(routePO.graph).length, 16);
  assert(connected(routeOP.graph));
  assert(connected(routePO.graph));
  assert.equal(cycleRank(firstO.graph), 3);
  assert.equal(cycleRank(firstP.graph), 3);
  assert.equal(cycleRank(routeOP.graph), 9);
  assert.equal(cycleRank(routePO.graph), 9);
  assertActionFormula(routeOP.graph, chartOP, "a", ({ x, y, z }) => ({ x: x ^ 1, y, z }));
  assertActionFormula(routeOP.graph, chartOP, "b", ({ x, y, z }) => ({ x, y: y ^ 1, z: z ^ x }));
  assertActionFormula(routePO.graph, chartPO, "a", ({ x, y, z }) => ({ x: x ^ 1, y, z: z ^ y }));
  assertActionFormula(routePO.graph, chartPO, "b", ({ x, y, z }) => ({ x, y: y ^ 1, z }));

  const allComparisons = enumerateIsomorphisms(routeOP.graph, routePO.graph);
  const coherentComparisons = allComparisons.filter((map) => map.every((image, vertex) => (
    chartOP[vertex].x === chartPO[image].x && chartOP[vertex].y === chartPO[image].y
  )));
  assert.equal(allComparisons.length, 8);
  assert.equal(coherentComparisons.length, 2);

  const sourceByCoordinate = chartIndex(chartOP);
  const targetByCoordinate = chartIndex(chartPO);
  const sourceBasepoint = sourceByCoordinate.get("000");
  const targetBasepoint = targetByCoordinate.get("000");
  const theta = [0, 1].map((epsilon) => chartOP.map(({ x, y, z }) => (
    targetByCoordinate.get(coordKey({ x, y, z: z ^ (x & y) ^ epsilon }))
  )));
  assert(theta.every((map) => isLabelledIsomorphism(routeOP.graph, routePO.graph, map)));
  assert(theta.every((map) => coherentComparisons.some((found) => permutationKey(found) === permutationKey(map))));
  assert(coherentComparisons.every((map) => theta.some((found) => permutationKey(found) === permutationKey(map))));
  const basedCoherentComparisons = coherentComparisons.filter((map) => map[sourceBasepoint] === targetBasepoint);
  assert.equal(basedCoherentComparisons.length, 1);
  assert.deepEqual(basedCoherentComparisons[0], theta[0]);

  const kappa = chartPO.map(({ x, y, z }) => targetByCoordinate.get(coordKey({ x, y, z: z ^ 1 })));
  assert(isAutomorphism(routePO.graph, kappa));
  assert(kappa.every((image, vertex) => chartPO[image].x === chartPO[vertex].x && chartPO[image].y === chartPO[vertex].y));
  assert.deepEqual(compose(kappa, theta[0]), theta[1]);
  assert.deepEqual(compose(kappa, theta[1]), theta[0]);
  assert(coherentComparisons.every((comparison) => permutationKey(compose(kappa, comparison)) !== permutationKey(comparison)));

  const actionA = [...routeOP.graph.transitions.a];
  const actionB = [...routeOP.graph.transitions.b];
  const central = chartOP.map(({ x, y, z }) => sourceByCoordinate.get(coordKey({ x, y, z: z ^ 1 })));
  const commutator = compose(actionA, compose(actionB, compose(actionA, actionB)));
  const monodromyGroup = generatedGroup([actionA, actionB]);
  const identity = identityPermutation(routeOP.graph.vertexCount);
  assert.equal(orderOf(actionA), 2);
  assert.equal(orderOf(actionB), 2);
  assert.equal(orderOf(compose(actionA, actionB)), 4);
  assert.deepEqual(commutator, central);
  assert.equal(orderOf(central), 2);
  assert.equal(monodromyGroup.length, 8);
  assert.notDeepEqual(compose(actionA, actionB), compose(actionB, actionA));
  assert.deepEqual(compose(actionA, actionB), compose(compose(actionB, actionA), central));
  assert(monodromyGroup.every((element) => permutationKey(compose(element, central)) === permutationKey(compose(central, element))));

  const projectedMonodromy = monodromyGroup.map((element) => {
    const baseImage = chartOP[element[sourceBasepoint]];
    const projection = { x: baseImage.x, y: baseImage.y };
    for (let vertex = 0; vertex < chartOP.length; vertex += 1) {
      const source = chartOP[vertex];
      const image = chartOP[element[vertex]];
      assert.equal(image.x, source.x ^ projection.x);
      assert.equal(image.y, source.y ^ projection.y);
    }
    return { element, projection };
  });
  for (const left of projectedMonodromy) {
    for (const right of projectedMonodromy) {
      const product = compose(left.element, right.element);
      const found = projectedMonodromy.find(({ element }) => permutationKey(element) === permutationKey(product));
      assert(found);
      assert.deepEqual(found.projection, addQuotient(left.projection, right.projection));
    }
  }
  const quotientKernel = projectedMonodromy.filter(({ projection }) => projection.x === 0 && projection.y === 0);
  assert.equal(quotientKernel.length, 2);
  assert.deepEqual(
    new Set(quotientKernel.map(({ element }) => permutationKey(element))),
    new Set([permutationKey(identity), permutationKey(central)]),
  );
  const xDirectionLifts = projectedMonodromy
    .filter(({ projection }) => projection.x === 1 && projection.y === 0)
    .map(({ element }) => element);
  const yDirectionLifts = projectedMonodromy
    .filter(({ projection }) => projection.x === 0 && projection.y === 1)
    .map(({ element }) => element);
  assert.equal(xDirectionLifts.length, 2);
  assert.equal(yDirectionLifts.length, 2);
  assert.deepEqual(
    new Set(xDirectionLifts.map(permutationKey)),
    new Set([permutationKey(actionA), permutationKey(compose(central, actionA))]),
  );
  assert.deepEqual(
    new Set(yDirectionLifts.map(permutationKey)),
    new Set([permutationKey(actionB), permutationKey(compose(central, actionB))]),
  );
  const commutingLiftPairs = xDirectionLifts.flatMap((xLift) => (
    yDirectionLifts.filter((yLift) => (
      permutationKey(compose(xLift, yLift)) === permutationKey(compose(yLift, xLift))
    )).map((yLift) => [xLift, yLift])
  ));
  assert.equal(commutingLiftPairs.length, 0);

  const quotientCoordinates = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ];
  const quotientVectors = quotientCoordinates.map(({ x, y }) => {
    const candidates = monodromyGroup.filter((element) => {
      const image = chartOP[element[sourceBasepoint]];
      return image.x === x && image.y === y && image.z === 0;
    });
    assert.equal(candidates.length, 1);
    return { x, y, lift: candidates[0] };
  });
  const commutatorPairing = quotientVectors.flatMap((left) => quotientVectors.map((right) => {
    const expectedPhase = (left.x & right.y) ^ (left.y & right.x);
    const actual = permutationCommutator(left.lift, right.lift);
    assert.deepEqual(actual, expectedPhase === 0 ? identity : central);
    return { left: [left.x, left.y], right: [right.x, right.y], phase: expectedPhase };
  }));

  for (const left of quotientVectors) {
    for (const middle of quotientVectors) {
      for (const right of quotientVectors) {
        const opCocycleBoundary = cocycleOP(left, middle)
          ^ cocycleOP(addQuotient(left, middle), right)
          ^ cocycleOP(middle, right)
          ^ cocycleOP(left, addQuotient(middle, right));
        const poCocycleBoundary = cocyclePO(left, middle)
          ^ cocyclePO(addQuotient(left, middle), right)
          ^ cocyclePO(middle, right)
          ^ cocyclePO(left, addQuotient(middle, right));
        assert.equal(opCocycleBoundary, 0);
        assert.equal(poCocycleBoundary, 0);
      }
    }
  }
  const cocycleGaugeChecks = quotientVectors.flatMap((left) => quotientVectors.map((right) => {
    const coboundary = chartGauge(left) ^ chartGauge(right) ^ chartGauge(addQuotient(left, right));
    assert.equal(cocycleOP(left, right) ^ cocyclePO(left, right), coboundary);
    return { left: [left.x, left.y], right: [right.x, right.y], coboundary };
  }));

  const actionAPO = [...routePO.graph.transitions.a];
  const actionBPO = [...routePO.graph.transitions.b];
  const monodromyGroupPO = generatedGroup([actionAPO, actionBPO]);
  assert.equal(monodromyGroupPO.length, 8);
  const quotientVectorsPO = quotientCoordinates.map(({ x, y }) => {
    const candidates = monodromyGroupPO.filter((element) => {
      const image = chartPO[element[targetBasepoint]];
      return image.x === x && image.y === y && image.z === 0;
    });
    assert.equal(candidates.length, 1);
    return { x, y, lift: candidates[0] };
  });

  function auditSectionProducts(section, center, cocycle) {
    return section.flatMap((left) => section.map((right) => {
      const sumCoordinates = addQuotient(left, right);
      const sum = section.find(({ x, y }) => x === sumCoordinates.x && y === sumCoordinates.y);
      assert(sum);
      const phase = cocycle(left, right);
      const product = compose(right.lift, left.lift);
      const predicted = phase === 0 ? sum.lift : compose(center, sum.lift);
      assert.deepEqual(product, predicted);
      return { left: [left.x, left.y], right: [right.x, right.y], phase };
    }));
  }

  const opSectionProductChecks = auditSectionProducts(quotientVectors, central, cocycleOP);
  const poSectionProductChecks = auditSectionProducts(quotientVectorsPO, kappa, cocyclePO);
  assert.equal(opSectionProductChecks.length, 16);
  assert.equal(poSectionProductChecks.length, 16);

  const affineWithoutBilinear = [0, 1].map((epsilon) => chartOP.map(({ x, y, z }) => (
    targetByCoordinate.get(coordKey({ x, y, z: z ^ epsilon }))
  )));
  assert(affineWithoutBilinear.every((map) => !isLabelledIsomorphism(routeOP.graph, routePO.graph, map)));

  const pInvariant = xorWords(p0, p1);
  const oInvariant = xorWords(o0, o1);
  assert.deepEqual(pInvariant, pullbackCochain(base, firstO.graph, p));
  assert.deepEqual(oInvariant, pullbackCochain(base, firstP.graph, o));
  const flatOP = attachOrbit(firstO.graph, [pInvariant], "flat J_p J_o(A)");
  const flatPO = attachOrbit(firstP.graph, [oInvariant], "flat J_o J_p(A)");
  const flatChartOP = flatOP.graph.vertexData.map(({ baseVertex: x, deck: y }) => ({ x, y, z: 0 }));
  const flatChartPO = flatPO.graph.vertexData.map(({ baseVertex: y, deck: x }) => ({ x, y, z: 0 }));
  for (const [graph, chart] of [[flatOP.graph, flatChartOP], [flatPO.graph, flatChartPO]]) {
    assert.equal(graph.vertexCount, 4);
    assert.equal(edges(graph).length, 8);
    assert(connected(graph));
    assert.equal(cycleRank(graph), 5);
    assertActionFormula(graph, chart, "a", ({ x, y }) => ({ x: x ^ 1, y, z: 0 }));
    assertActionFormula(graph, chart, "b", ({ x, y }) => ({ x, y: y ^ 1, z: 0 }));
    assert.deepEqual(compose(graph.transitions.a, graph.transitions.b), compose(graph.transitions.b, graph.transitions.a));
    assert.equal(generatedGroup([graph.transitions.a, graph.transitions.b]).length, 4);
  }
  const flatComparisons = enumerateIsomorphisms(flatOP.graph, flatPO.graph);
  const flatCoherent = flatComparisons.filter((map) => map.every((image, vertex) => (
    flatChartOP[vertex].x === flatChartPO[image].x && flatChartOP[vertex].y === flatChartPO[image].y
  )));
  assert.equal(flatComparisons.length, 4);
  assert.equal(flatCoherent.length, 1);

  const singletonOrbitInvariant = translatedCochain(firstO.graph, p0, firstODeck).every((bit, index) => bit === p0[index]);
  assert.equal(singletonOrbitInvariant, false);

  return {
    base,
    o,
    p,
    firstO,
    firstP,
    firstOAtoms,
    firstPAtoms,
    pulledP,
    pulledO,
    p0,
    p1,
    o0,
    o1,
    routeOP,
    routePO,
    chartOP,
    chartPO,
    allComparisons,
    coherentComparisons,
    basedCoherentComparisons,
    theta,
    kappa,
    monodromyGroup,
    central,
    quotientKernel,
    projectedMonodromy,
    commutingLiftPairs,
    commutatorPairing,
    cocycleGaugeChecks,
    opSectionProductChecks,
    poSectionProductChecks,
    affineWithoutBilinear,
    flatOP,
    flatPO,
    flatComparisons,
    flatCoherent,
    singletonOrbitInvariant,
  };
}

// Minimal structured input for downstream theorems that must use this exact
// eight-state interchange laboratory rather than reconstructing an abstract
// isomorphic D8.  Consumers are expected to derive the group, center,
// quotient, and factor sets from these actions and charts.
export function buildGenesisInterchangeTransductionInput() {
  const lab = buildLaboratory();
  const copyChart = (chart) => chart.map(({ x, y, z }) => ({ x, y, z }));
  const copyAction = (action) => [...action];
  return {
    schema: "oasis.genesis-interchange-transduction-input.v1",
    labels: [...LABELS],
    charts: {
      OP: {
        coordinates: copyChart(lab.chartOP),
        actions: {
          a: copyAction(lab.routeOP.graph.transitions.a),
          b: copyAction(lab.routeOP.graph.transitions.b),
        },
      },
      PO: {
        coordinates: copyChart(lab.chartPO),
        actions: {
          a: copyAction(lab.routePO.graph.transitions.a),
          b: copyAction(lab.routePO.graph.transitions.b),
        },
      },
    },
    coherentComparisonsOPtoPO: lab.theta.map(copyAction),
  };
}

function buildCertificate(lab) {
  const body = {
    schema: "genesis-interchange-square/v1",
    base: {
      graphDigest: digest(graphPayload(lab.base)),
      obstructionWords: { o: lab.o.join(""), p: lab.p.join("") },
    },
    localizedOrbits: {
      doctrine: {
        observableAlgebra: "full Boolean vertex algebra on each first attachment",
        action: "tail localization (e triangle c)(edge)=e(tail(edge))*c(edge)",
        compiler: "represent the cohomology span of all atomic localizations",
        representativeSensitive: true,
        directed: true,
      },
      afterO: {
        graphDigest: digest(graphPayload(lab.firstO.graph)),
        words: [lab.p0.join(""), lab.p1.join("")],
        nonexact: [!isExact(lab.firstO.graph, lab.p0), !isExact(lab.firstO.graph, lab.p1)],
        independentModuloExact: independentModuloExact(lab.firstO.graph, [lab.p0, lab.p1]),
        cohomologySpanDimension: cohomologySpanDimension(lab.firstO.graph, [lab.p0, lab.p1]),
        observableAtomCount: lab.firstOAtoms.length,
        localizedSumEqualsPulledResidual: xorWords(lab.p0, lab.p1).every((bit, index) => bit === lab.pulledP[index]),
        deckSwapped: true,
      },
      afterP: {
        graphDigest: digest(graphPayload(lab.firstP.graph)),
        words: [lab.o0.join(""), lab.o1.join("")],
        nonexact: [!isExact(lab.firstP.graph, lab.o0), !isExact(lab.firstP.graph, lab.o1)],
        independentModuloExact: independentModuloExact(lab.firstP.graph, [lab.o0, lab.o1]),
        cohomologySpanDimension: cohomologySpanDimension(lab.firstP.graph, [lab.o0, lab.o1]),
        observableAtomCount: lab.firstPAtoms.length,
        localizedSumEqualsPulledResidual: xorWords(lab.o0, lab.o1).every((bit, index) => bit === lab.pulledO[index]),
        deckSwapped: true,
      },
    },
    routes: {
      OP: {
        graphDigest: digest(graphPayload(lab.routeOP.graph)),
        chartDigest: digest(lab.chartOP),
        vertices: lab.routeOP.graph.vertexCount,
        directedEdges: edges(lab.routeOP.graph).length,
        directedOneComplexCycleRank: cycleRank(lab.routeOP.graph),
        connected: connected(lab.routeOP.graph),
        exactnessPrimitiveDigests: lab.routeOP.exactnessChecks.map(({ primitive }) => digest(primitive)),
      },
      PO: {
        graphDigest: digest(graphPayload(lab.routePO.graph)),
        chartDigest: digest(lab.chartPO),
        vertices: lab.routePO.graph.vertexCount,
        directedEdges: edges(lab.routePO.graph).length,
        directedOneComplexCycleRank: cycleRank(lab.routePO.graph),
        connected: connected(lab.routePO.graph),
        exactnessPrimitiveDigests: lab.routePO.exactnessChecks.map(({ primitive }) => digest(primitive)),
      },
    },
    comparisons: {
      overBaseCount: lab.allComparisons.length,
      coherentCount: lab.coherentComparisons.length,
      basedCoherentCount: lab.basedCoherentComparisons.length,
      thetaFormula: "theta_epsilon(x,y,z)=(x,y,z+x*y+epsilon) over F2",
      epsilonValues: [0, 1],
      thetaDigests: lab.theta.map(digest),
      centralGaugeDigest: digest(lab.kappa),
      gaugeAction: "free-transitive",
      fixedChoices: 0,
    },
    monodromy: {
      presentation: "<a,b | a^2=b^2=(ab)^4=1, [a,b]=(ab)^2 central>",
      group: "binary Heisenberg group over F2, isomorphic to D8",
      order: lab.monodromyGroup.length,
      commutatorDigest: digest(lab.central),
      commutatorOrder: orderOf(lab.central),
      quotient: "F2^2",
      quotientKernelOrder: lab.quotientKernel.length,
      quotientFibersAllSizeTwo: ["00", "10", "01", "11"].every((key) => (
        lab.projectedMonodromy.filter(({ projection }) => `${projection.x}${projection.y}` === key).length === 2
      )),
      extensionSplit: lab.commutingLiftPairs.length > 0,
      commutatorPairing: lab.commutatorPairing,
      chartCocycles: {
        OP: "kappa_OP((x,y),(x',y'))=x*y'",
        PO: "kappa_PO((x,y),(x',y'))=y*x'",
        gauge: "kappa_OP+kappa_PO=delta(phi), phi(x,y)=x*y",
        exhaustiveCocycleTriplesPerChart: 64,
        exhaustiveGaugePairs: lab.cocycleGaugeChecks.length,
        exhaustiveSectionProductPairsPerChart: lab.opSectionProductChecks.length,
        poSectionProductPairs: lab.poSectionProductChecks.length,
      },
    },
    flatControl: {
      rule: "attach only the deck-invariant orbit sum",
      verticesPerRoute: lab.flatOP.graph.vertexCount,
      directedEdgesPerRoute: edges(lab.flatOP.graph).length,
      directedOneComplexCycleRank: cycleRank(lab.flatOP.graph),
      overBaseComparisons: lab.flatComparisons.length,
      coherentComparisons: lab.flatCoherent.length,
      groupOrder: generatedGroup([lab.flatOP.graph.transitions.a, lab.flatOP.graph.transitions.b]).length,
      commutative: true,
    },
    falsifiers: {
      singletonLocalizedCochainDeckInvariant: lab.singletonOrbitInvariant,
      invariantSumRetainsEightStateCurvature: false,
      coherentComparisonCanonicalWithoutGaugeChoice: false,
      affineComparisonWithoutBilinearTerm: lab.affineWithoutBilinear.some((map) => (
        isLabelledIsomorphism(lab.routeOP.graph, lab.routePO.graph, map)
      )),
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

export function replayGenesisInterchangeCertificate(candidate) {
  const expected = buildCertificate(buildLaboratory());
  return validateCertificate(candidate, expected);
}

function runTamperSuite(certificate) {
  const cases = [];
  function reject(name, mutate, reseal = true) {
    const tampered = clone(certificate);
    mutate(tampered);
    if (reseal) {
      const { certificateDigest: ignored, ...body } = tampered;
      tampered.certificateDigest = digest(body);
    }
    const rejected = !validateCertificate(tampered, certificate);
    assert(rejected, `tamper was accepted: ${name}`);
    cases.push({ name, rejected });
  }
  reject("localized cochain bit", (value) => { value.localizedOrbits.afterO.words[0] = "0000"; });
  reject("locality span dimension", (value) => { value.localizedOrbits.afterO.cohomologySpanDimension = 1; });
  reject("deck-swap claim", (value) => { value.localizedOrbits.afterO.deckSwapped = false; });
  reject("route graph digest", (value) => { value.routes.OP.graphDigest = "0".repeat(64); });
  reject("over-base comparison count", (value) => { value.comparisons.overBaseCount = 7; });
  reject("theta formula", (value) => { value.comparisons.thetaFormula = "theta(x,y,z)=(x,y,z)"; });
  reject("theta epsilon set", (value) => { value.comparisons.epsilonValues = [0]; });
  reject("D8 group order", (value) => { value.monodromy.order = 4; });
  reject("central extension split claim", (value) => { value.monodromy.extensionSplit = true; });
  reject("commutator pairing", (value) => { value.monodromy.commutatorPairing[1].phase ^= 1; });
  reject("chart cocycle gauge", (value) => { value.monodromy.chartCocycles.gauge = "equal on the nose"; });
  reject("flat-control state count", (value) => { value.flatControl.verticesPerRoute = 8; });
  reject("swapped route records", (value) => {
    [value.routes.OP, value.routes.PO] = [value.routes.PO, value.routes.OP];
  });
  reject("certificate digest", (value) => { value.certificateDigest = "f".repeat(64); }, false);
  reject("undeclared field", (value) => { value.unearnedConclusion = "Hodge conjecture"; });
  return cases;
}

export function runGenesisInterchangeSquare() {
  const lab = buildLaboratory();
  const certificate = buildCertificate(lab);
  assert(validateCertificate(certificate, certificate));
  assert(replayGenesisInterchangeCertificate(certificate));
  const tamperCases = runTamperSuite(certificate);

  return {
    experiment: "genesis-interchange-square",
    status: "PASS",
    result: {
      localizedOrbitRule: {
        generatedByAtomicTailLocalization: true,
        orbitSize: 2,
        eachNonexact: true,
        independentModuloExact: true,
        deckSwapped: true,
      },
      fullOrbitRoutes: {
        verticesPerRoute: 8,
        directedEdgesPerRoute: 16,
        intermediateDirectedOneComplexCycleRank: 3,
        finalDirectedOneComplexCycleRank: 9,
        connected: true,
        adjoiningPrimitivesMakesOrbitExact: true,
      },
      interchange: {
        overBaseComparisons: lab.allComparisons.length,
        coherentComparisons: lab.coherentComparisons.length,
        basedCoherentComparisons: lab.basedCoherentComparisons.length,
        formulas: [
          "theta_0(x,y,z)=(x,y,z+x*y)",
          "theta_1(x,y,z)=(x,y,z+x*y+1)",
        ],
        coherentComparisonSpace: "free transitive F2-torsor",
        canonicalUnbasedChoice: false,
      },
      monodromy: {
        group: "D8",
        order: lab.monodromyGroup.length,
        commutator: "central z-toggle",
        quotient: "F2^2",
        centralExtensionSplit: false,
        commutatorPairing: "omega((x,y),(x',y'))=x*y'+y*x'",
        chartCocyclesDifferBy: "delta(phi), phi(x,y)=x*y",
      },
      invariantSumControl: {
        verticesPerRoute: lab.flatOP.graph.vertexCount,
        directedOneComplexCycleRank: cycleRank(lab.flatOP.graph),
        coherentComparisons: lab.flatCoherent.length,
        group: "F2^2",
        groupOrder: 4,
        commutative: true,
      },
    },
    theoremBoundary: {
      provedHere: [
        "the stated finite cochain attachment rule produces the two connected eight-state routes",
        "exhaustive enumeration gives exactly eight labelled over-base comparisons and two x,y-coherent comparisons",
        "the two coherent comparisons form a central F2 gauge torsor and neither is gauge-fixed",
        "the generated action group has the D8 permutation relations and order eight",
        "D8 is a non-split central extension of F2^2 with the displayed nonzero commutator pairing",
        "the bilinear x*y term is necessary for either affine coherent comparison",
        "the two order cocycles are exhaustive 2-cocycles representing the same class and differ by delta(x*y)",
        "replacing each localized orbit by its invariant sum collapses the effect to a flat four-state F2^2 control",
      ],
      notProvedHere: [
        "that semantics uniquely forces the locality-closed residual-obligation axiom",
        "representative-independent or orientation-independent locality closure",
        "that every genesis system has this interchange law",
        "non-soficity, a Hodge theorem, or any consequence for an open conjecture",
      ],
    },
    certificate,
    tamper: {
      attempted: tamperCases.length,
      rejected: tamperCases.filter(({ rejected }) => rejected).length,
      cases: tamperCases,
    },
  };
}

function printPassLines(result) {
  console.log("PASS localized obstruction orbits: nonexact, independent, deck-swapped");
  console.log("PASS routes: 8 vertices, 16 directed edges, connected, with exactness primitives");
  console.log("PASS comparisons: exactly 2 coherent and 8 over-base labelled bijections");
  console.log("PASS central gauge: coherent comparisons form a free transitive F2-torsor");
  console.log("PASS monodromy: D8 of order 8 with central nontrivial commutator");
  console.log("PASS flat control: invariant-sum routes have 4 states and commuting F2^2 action");
  console.log(`PASS replay/tamper: ${result.tamper.rejected}/${result.tamper.attempted} mutations rejected`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = runGenesisInterchangeSquare();
  printPassLines(result);
  console.log(JSON.stringify(result, null, 2));
}
