import assert from "node:assert/strict";

// Exact finite model for the first fossil-nonidentifiability theorem.
// A Boolean observable algebra on a finite carrier is represented by its atom
// partition. Blocks and partitions are canonically sorted arrays of integers.

function canonicalPartition(blocks) {
  const cleaned = blocks
    .map((block) => [...new Set(block)].sort((a, b) => a - b))
    .filter((block) => block.length > 0)
    .sort((a, b) => a[0] - b[0] || a.length - b.length);
  return cleaned;
}

function partitionKey(partition) {
  return canonicalPartition(partition)
    .map((block) => block.join(","))
    .join("|");
}

function blockIndex(partition, stateCount) {
  const index = Array(stateCount).fill(-1);
  partition.forEach((block, blockId) => {
    for (const state of block) index[state] = blockId;
  });
  assert(index.every((entry) => entry >= 0), "partition must cover the carrier");
  return index;
}

function refines(finer, coarser, stateCount) {
  const coarseIndex = blockIndex(coarser, stateCount);
  return finer.every((block) => {
    const target = coarseIndex[block[0]];
    return block.every((state) => coarseIndex[state] === target);
  });
}

function equalPartition(left, right) {
  return partitionKey(left) === partitionKey(right);
}

function joinPartitions(left, right, stateCount) {
  const leftIndex = blockIndex(left, stateCount);
  const rightIndex = blockIndex(right, stateCount);
  const groups = new Map();
  for (let state = 0; state < stateCount; state += 1) {
    const signature = `${leftIndex[state]}:${rightIndex[state]}`;
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(state);
  }
  return canonicalPartition([...groups.values()]);
}

function pullbackPartition(partition, action, stateCount) {
  const index = blockIndex(partition, stateCount);
  const groups = new Map();
  for (let state = 0; state < stateCount; state += 1) {
    const signature = index[action[state]];
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(state);
  }
  return canonicalPartition([...groups.values()]);
}

function atomicRepair(partition, action, stateCount) {
  return joinPartitions(
    partition,
    pullbackPartition(partition, action, stateCount),
    stateCount,
  );
}

function applyWord(initial, word, actions, stateCount) {
  let current = initial;
  for (const symbol of word) {
    current = atomicRepair(current, actions[symbol], stateCount);
  }
  return current;
}

function stable(partition, actions, stateCount) {
  return Object.values(actions).every((action) =>
    equalPartition(atomicRepair(partition, action, stateCount), partition),
  );
}

function saturation(initial, actions, stateCount) {
  let current = initial;
  while (!stable(current, actions, stateCount)) {
    for (const action of Object.values(actions)) {
      current = atomicRepair(current, action, stateCount);
    }
  }
  return current;
}

function reachableGraph(initial, actions, stateCount) {
  const startKey = partitionKey(initial);
  const nodes = new Map([[startKey, initial]]);
  const edges = [];
  const queue = [startKey];
  while (queue.length > 0) {
    const sourceKey = queue.shift();
    const source = nodes.get(sourceKey);
    for (const [symbol, action] of Object.entries(actions)) {
      const target = atomicRepair(source, action, stateCount);
      const targetKey = partitionKey(target);
      if (targetKey === sourceKey) continue;
      edges.push({ source: sourceKey, symbol, target: targetKey });
      if (!nodes.has(targetKey)) {
        nodes.set(targetKey, target);
        queue.push(targetKey);
      }
    }
  }
  return { startKey, nodes, edges };
}

function allMasks(partition) {
  const blocks = canonicalPartition(partition);
  const masks = [];
  for (let choice = 0; choice < 2 ** blocks.length; choice += 1) {
    let mask = 0;
    for (let blockId = 0; blockId < blocks.length; blockId += 1) {
      if ((choice >> blockId) & 1) {
        for (const state of blocks[blockId]) mask |= 1 << state;
      }
    }
    masks.push(mask);
  }
  return masks.sort((a, b) => a - b);
}

function depthSpectrum(graph) {
  const nodeDepth = new Map([[graph.startKey, 0]]);
  const queue = [graph.startKey];
  while (queue.length > 0) {
    const source = queue.shift();
    const depth = nodeDepth.get(source);
    for (const edge of graph.edges.filter((candidate) => candidate.source === source)) {
      if (!nodeDepth.has(edge.target) || nodeDepth.get(edge.target) > depth + 1) {
        nodeDepth.set(edge.target, depth + 1);
        queue.push(edge.target);
      }
    }
  }

  const maskDepth = new Map();
  for (const [key, partition] of graph.nodes) {
    const depth = nodeDepth.get(key);
    for (const mask of allMasks(partition)) {
      if (!maskDepth.has(mask) || maskDepth.get(mask) > depth) {
        maskDepth.set(mask, depth);
      }
    }
  }
  const counts = {};
  for (const depth of maskDepth.values()) counts[depth] = (counts[depth] ?? 0) + 1;
  return {
    nodeDepth: Object.fromEntries([...nodeDepth.entries()].sort()),
    maskDepth,
    counts,
  };
}

function comparable(left, right, nodes, stateCount) {
  const a = nodes.get(left);
  const b = nodes.get(right);
  return refines(a, b, stateCount) || refines(b, a, stateCount);
}

function width(graph, stateCount) {
  const keys = [...graph.nodes.keys()];
  let best = 0;
  for (let subset = 0; subset < 2 ** keys.length; subset += 1) {
    const chosen = keys.filter((_, index) => (subset >> index) & 1);
    const isAntichain = chosen.every((left, i) =>
      chosen.slice(i + 1).every((right) => !comparable(left, right, graph.nodes, stateCount)),
    );
    if (isAntichain) best = Math.max(best, chosen.length);
  }
  return best;
}

function mobiusBottomTop(graph, bottomKey, topKey, stateCount) {
  const belowTop = [...graph.nodes.keys()].filter((key) => {
    const partition = graph.nodes.get(key);
    const bottom = graph.nodes.get(bottomKey);
    const top = graph.nodes.get(topKey);
    return refines(partition, bottom, stateCount) && refines(top, partition, stateCount);
  });
  belowTop.sort((left, right) =>
    graph.nodes.get(left).length - graph.nodes.get(right).length,
  );
  const mu = new Map([[bottomKey, 1]]);
  for (const key of belowTop) {
    if (key === bottomKey) continue;
    let sum = 0;
    for (const lower of belowTop) {
      if (lower === key || !mu.has(lower)) continue;
      if (refines(graph.nodes.get(key), graph.nodes.get(lower), stateCount)) {
        sum += mu.get(lower);
      }
    }
    mu.set(key, -sum);
  }
  const value = mu.get(topKey);
  return Object.is(value, -0) ? 0 : value;
}

function properIntervalReducedH0(graph, bottomKey, topKey, stateCount) {
  const keys = [...graph.nodes.keys()].filter((key) => key !== bottomKey && key !== topKey);
  if (keys.length === 0) return 0;
  const unseen = new Set(keys);
  let components = 0;
  while (unseen.size > 0) {
    components += 1;
    const seed = unseen.values().next().value;
    unseen.delete(seed);
    const queue = [seed];
    while (queue.length > 0) {
      const current = queue.shift();
      for (const candidate of [...unseen]) {
        if (comparable(current, candidate, graph.nodes, stateCount)) {
          unseen.delete(candidate);
          queue.push(candidate);
        }
      }
    }
  }
  return components - 1;
}

function separatedPairs(partition, stateCount) {
  const index = blockIndex(partition, stateCount);
  const pairs = new Set();
  for (let left = 0; left < stateCount; left += 1) {
    for (let right = left + 1; right < stateCount; right += 1) {
      if (index[left] !== index[right]) pairs.add(`${left},${right}`);
    }
  }
  return pairs;
}

function partitionPairDistance(left, right, stateCount) {
  const a = separatedPairs(left, stateCount);
  const b = separatedPairs(right, stateCount);
  const symmetricDifference = new Set([...a].filter((pair) => !b.has(pair)));
  for (const pair of b) if (!a.has(pair)) symmetricDifference.add(pair);
  const denominator = (stateCount * (stateCount - 1)) / 2;
  return {
    differingPairs: [...symmetricDifference].sort(),
    count: symmetricDifference.size,
    normalized: denominator === 0 ? 0 : symmetricDifference.size / denominator,
  };
}

function squareDiscrepancy(initial, first, second, actions, stateCount) {
  const firstThenSecond = applyWord(initial, [first, second], actions, stateCount);
  const secondThenFirst = applyWord(initial, [second, first], actions, stateCount);
  return {
    firstThenSecond: partitionKey(firstThenSecond),
    secondThenFirst: partitionKey(secondThenFirst),
    ...partitionPairDistance(firstThenSecond, secondThenFirst, stateCount),
  };
}

function enumeratePaths(graph, targetKey) {
  const paths = [];
  function visit(node, symbols, nodes) {
    if (node === targetKey) {
      paths.push({ symbols: [...symbols], nodes: [...nodes] });
      return;
    }
    for (const edge of graph.edges.filter((candidate) => candidate.source === node)) {
      visit(edge.target, [...symbols, edge.symbol], [...nodes, edge.target]);
    }
  }
  visit(graph.startKey, [], [graph.startKey]);
  return paths;
}

function transitionTable(graph, actions, stateCount) {
  const rows = {};
  for (const [key, partition] of graph.nodes) {
    rows[key] = {};
    for (const [symbol, action] of Object.entries(actions)) {
      rows[key][symbol] = partitionKey(atomicRepair(partition, action, stateCount));
    }
  }
  return rows;
}

function setPartitions(stateCount) {
  const result = [];
  function extend(state, blocks) {
    if (state === stateCount) {
      result.push(canonicalPartition(blocks));
      return;
    }
    for (let index = 0; index < blocks.length; index += 1) {
      const next = blocks.map((block) => [...block]);
      next[index].push(state);
      extend(state + 1, next);
    }
    extend(state + 1, [...blocks.map((block) => [...block]), [state]]);
  }
  if (stateCount === 0) return [[]];
  extend(1, [[0]]);
  const unique = new Map(result.map((partition) => [partitionKey(partition), partition]));
  return [...unique.values()];
}

function allActions(stateCount) {
  const result = [];
  const current = Array(stateCount).fill(0);
  function extend(index) {
    if (index === stateCount) {
      result.push([...current]);
      return;
    }
    for (let target = 0; target < stateCount; target += 1) {
      current[index] = target;
      extend(index + 1);
    }
  }
  extend(0);
  return result;
}

function permutations(size) {
  const result = [];
  const used = Array(size).fill(false);
  const current = [];
  function extend() {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let value = 0; value < size; value += 1) {
      if (used[value]) continue;
      used[value] = true;
      current.push(value);
      extend();
      current.pop();
      used[value] = false;
    }
  }
  extend();
  return result;
}

function composePermutations(left, right) {
  return right.map((value) => left[value]);
}

function inversePermutation(permutation) {
  const inverse = Array(permutation.length);
  permutation.forEach((value, index) => {
    inverse[value] = index;
  });
  return inverse;
}

function samePermutation(left, right) {
  return left.every((value, index) => value === right[index]);
}

function permutationCycleType(permutation) {
  const seen = Array(permutation.length).fill(false);
  const cycles = [];
  for (let start = 0; start < permutation.length; start += 1) {
    if (seen[start]) continue;
    let length = 0;
    let current = start;
    while (!seen[current]) {
      seen[current] = true;
      length += 1;
      current = permutation[current];
    }
    cycles.push(length);
  }
  return cycles.sort((a, b) => a - b);
}

function partitionAutomorphisms(partition, stateCount) {
  const blockSets = new Set(
    canonicalPartition(partition).map((block) => [...block].sort((a, b) => a - b).join(",")),
  );
  return permutations(stateCount).filter((permutation) =>
    partition.every((block) => {
      const image = block.map((state) => permutation[state]).sort((a, b) => a - b).join(",");
      return blockSets.has(image);
    }),
  );
}

function fixesPartitionObservablesPointwise(permutation, partition, stateCount) {
  const index = blockIndex(partition, stateCount);
  return permutation.every((target, state) => index[target] === index[state]);
}

function connectionHolonomy(connection) {
  const upper = composePermutations(connection.upperTerminal, connection.rootUpper);
  const lower = composePermutations(connection.lowerTerminal, connection.rootLower);
  return composePermutations(inversePermutation(lower), upper);
}

function connectionPathDisagreement(connection) {
  const upper = composePermutations(connection.upperTerminal, connection.rootUpper);
  const lower = composePermutations(connection.lowerTerminal, connection.rootLower);
  const differingStates = upper
    .map((value, state) => ({ state, differs: value !== lower[state] }))
    .filter((entry) => entry.differs)
    .map((entry) => entry.state);
  return {
    differingStates,
    count: differingStates.length,
    normalized: differingStates.length / upper.length,
  };
}

function transformConnection(connection, gauges) {
  function transform(edge, sourceGauge, targetGauge) {
    return composePermutations(
      targetGauge,
      composePermutations(edge, inversePermutation(sourceGauge)),
    );
  }
  return {
    rootUpper: transform(connection.rootUpper, gauges.root, gauges.upper),
    upperTerminal: transform(connection.upperTerminal, gauges.upper, gauges.terminal),
    rootLower: transform(connection.rootLower, gauges.root, gauges.lower),
    lowerTerminal: transform(connection.lowerTerminal, gauges.lower, gauges.terminal),
  };
}

function sameConnection(left, right) {
  return Object.keys(left).every((edge) => samePermutation(left[edge], right[edge]));
}

function gaugeEquivalent(left, right, contextPartitions, stateCount) {
  const gaugeGroups = Object.fromEntries(
    Object.entries(contextPartitions).map(([name, partition]) => [
      name,
      partitionAutomorphisms(partition, stateCount),
    ]),
  );
  let assignmentsChecked = 0;
  for (const root of gaugeGroups.root) {
    for (const upper of gaugeGroups.upper) {
      for (const lower of gaugeGroups.lower) {
        for (const terminal of gaugeGroups.terminal) {
          assignmentsChecked += 1;
          const transformed = transformConnection(left, { root, upper, lower, terminal });
          if (sameConnection(transformed, right)) {
            return { equivalent: true, assignmentsChecked };
          }
        }
      }
    }
  }
  return { equivalent: false, assignmentsChecked };
}

function exhaustiveSmallCarrierControl() {
  const bySize = [];
  for (let stateCount = 1; stateCount <= 3; stateCount += 1) {
    const partitions = setPartitions(stateCount);
    const actions = allActions(stateCount);
    let maximumReachableWidth = 1;
    let maximumSquarePairDifference = 0;
    let systemsChecked = 0;
    for (const initial of partitions) {
      for (const alpha of actions) {
        for (const beta of actions) {
          systemsChecked += 1;
          const systemActions = { alpha, beta };
          const graph = reachableGraph(initial, systemActions, stateCount);
          maximumReachableWidth = Math.max(maximumReachableWidth, width(graph, stateCount));
          maximumSquarePairDifference = Math.max(
            maximumSquarePairDifference,
            squareDiscrepancy(initial, "alpha", "beta", systemActions, stateCount).count,
          );
        }
      }
    }
    bySize.push({
      stateCount,
      partitions: partitions.length,
      actions: actions.length,
      orderedTwoActionSystemsChecked: systemsChecked,
      maximumReachableWidth,
      maximumSquarePairDifference,
    });
  }
  return bySize;
}

const stateCount = 4;
const seed = canonicalPartition([
  [0, 1],
  [2, 3],
]);
const discrete = canonicalPartition([[0], [1], [2], [3]]);

// In one-based notation these are the maps from the accompanying proof:
// parallel alpha=(1,3,1,1), beta=(1,1,1,3);
// serial   alpha=(1,3,1,1), beta=(1,1,1,2).
const alpha = [0, 2, 0, 0];
const parallelActions = {
  alpha,
  beta: [0, 0, 0, 2],
};
const serialActions = {
  alpha,
  beta: [0, 0, 0, 1],
};

function analyze(name, actions) {
  const graph = reachableGraph(seed, actions, stateCount);
  const completion = saturation(seed, actions, stateCount);
  const completionKey = partitionKey(completion);
  const spectrum = depthSpectrum(graph);
  const paths = enumeratePaths(graph, completionKey);
  const table = transitionTable(graph, actions, stateCount);
  return {
    name,
    actions,
    seed: partitionKey(seed),
    completion: completionKey,
    completionDimension: completion.length,
    booleanTaskCount: allMasks(completion).length,
    reachablePartitions: [...graph.nodes.keys()].sort(),
    strictRepairEdges: graph.edges,
    reachableWidth: width(graph, stateCount),
    properIntervalReducedH0: properIntervalReducedH0(
      graph,
      graph.startKey,
      completionKey,
      stateCount,
    ),
    mobiusBottomTop: mobiusBottomTop(
      graph,
      graph.startKey,
      completionKey,
      stateCount,
    ),
    taskDepthSpectrum: spectrum.counts,
    completionPaths: paths,
    squareDiscrepancy: squareDiscrepancy(
      seed,
      "alpha",
      "beta",
      actions,
      stateCount,
    ),
    residualFlatteningTransitionTable: table,
  };
}

const parallel = analyze("parallel", parallelActions);
const serial = analyze("serial", serialActions);
const smallCarrierControl = exhaustiveSmallCarrierControl();

// Optional connection enrichment on the parallel repair diamond.  Both
// connections have exactly the same context algebras and full terminal task
// algebra.  The twisted upper repair changes only the unresolved {2,3} fiber,
// so it preserves every observable already available at the upper context.
const identity = [0, 1, 2, 3];
const swap23 = [0, 1, 3, 2];
const upperPartition = canonicalPartition([[0], [1], [2, 3]]);
const lowerPartition = canonicalPartition([[0, 1], [2], [3]]);
const contextPartitions = {
  root: seed,
  upper: upperPartition,
  lower: lowerPartition,
  terminal: discrete,
};
const flatConnection = {
  rootUpper: identity,
  upperTerminal: identity,
  rootLower: identity,
  lowerTerminal: identity,
};
const twistedConnection = {
  rootUpper: identity,
  upperTerminal: swap23,
  rootLower: identity,
  lowerTerminal: identity,
};
const flatHolonomy = connectionHolonomy(flatConnection);
const twistedHolonomy = connectionHolonomy(twistedConnection);
const connectionAudit = {
  sameContextAlgebras: true,
  sameTerminalAlgebra: partitionKey(discrete),
  terminalBooleanTaskCount: allMasks(discrete).length,
  upperTwistFixesExistingObservablesPointwise:
    fixesPartitionObservablesPointwise(swap23, upperPartition, stateCount),
  flat: {
    holonomy: flatHolonomy,
    holonomyCycleType: permutationCycleType(flatHolonomy),
    pathDisagreement: connectionPathDisagreement(flatConnection),
  },
  twisted: {
    holonomy: twistedHolonomy,
    holonomyCycleType: permutationCycleType(twistedHolonomy),
    pathDisagreement: connectionPathDisagreement(twistedConnection),
  },
  gaugeEquivalence: gaugeEquivalent(
    flatConnection,
    twistedConnection,
    contextPartitions,
    stateCount,
  ),
  claimBoundary:
    "gauge-invariant connection data are not recoverable from the static endpoint algebra, but this finite connection can be flattened by retaining route state and is not yet generated canonically by the bare repair rule",
};

assert.equal(parallel.completion, partitionKey(discrete));
assert.equal(serial.completion, partitionKey(discrete));
assert.equal(parallel.completionDimension, 4);
assert.equal(serial.completionDimension, 4);
assert.equal(parallel.booleanTaskCount, 16);
assert.equal(serial.booleanTaskCount, 16);

assert.deepEqual(parallel.taskDepthSpectrum, { 0: 4, 1: 8, 2: 4 });
assert.deepEqual(serial.taskDepthSpectrum, { 0: 4, 1: 4, 2: 8 });
assert.equal(parallel.reachableWidth, 2);
assert.equal(serial.reachableWidth, 1);
assert.equal(parallel.properIntervalReducedH0, 1);
assert.equal(serial.properIntervalReducedH0, 0);
assert.equal(parallel.mobiusBottomTop, 1);
assert.equal(serial.mobiusBottomTop, 0);
assert.equal(parallel.squareDiscrepancy.count, 0);
assert.deepEqual(serial.squareDiscrepancy.differingPairs, ["2,3"]);
assert.equal(serial.squareDiscrepancy.count, 1);
assert.equal(serial.squareDiscrepancy.normalized, 1 / 6);

assert.equal(parallel.completionPaths.length, 2);
assert.deepEqual(
  parallel.completionPaths.map((path) => path.symbols.join("")).sort(),
  ["alphabeta", "betaalpha"],
);
assert.equal(serial.completionPaths.length, 1);
assert.deepEqual(serial.completionPaths[0].symbols, ["alpha", "beta"]);

for (const control of smallCarrierControl) {
  assert.equal(control.maximumReachableWidth, 1);
  assert.equal(control.maximumSquarePairDifference, 0);
}

assert.equal(connectionAudit.upperTwistFixesExistingObservablesPointwise, true);
assert.deepEqual(connectionAudit.flat.holonomyCycleType, [1, 1, 1, 1]);
assert.deepEqual(connectionAudit.twisted.holonomyCycleType, [1, 1, 2]);
assert.equal(connectionAudit.flat.pathDisagreement.count, 0);
assert.equal(connectionAudit.twisted.pathDisagreement.count, 2);
assert.equal(connectionAudit.twisted.pathDisagreement.normalized, 1 / 2);
assert.equal(connectionAudit.gaugeEquivalence.equivalent, false);

// The residual tables are exact finite flattenings of each repair process.
// This deliberately falsifies any absolute claim that a finite genesis history
// cannot be encoded as an ordinary state machine.
for (const analysis of [parallel, serial]) {
  for (const [source, row] of Object.entries(analysis.residualFlatteningTransitionTable)) {
    for (const [symbol, target] of Object.entries(row)) {
      const replayed = atomicRepair(
        reachableGraph(seed, analysis.actions, stateCount).nodes.get(source),
        analysis.actions[symbol],
        stateCount,
      );
      assert.equal(partitionKey(replayed), target);
    }
  }
}

const report = {
  theorem:
    "same seed and terminal pointwise algebras after transport is forgotten; different repair kinetics",
  claimBoundary:
    "a static endpoint fossil discards transport and causal task availability; the structured dynamics differ and finite deterministic genesis still admits residual-state flattening",
  parallel,
  serial,
  connectionAudit,
  minimalityControl: smallCarrierControl,
};

console.log(JSON.stringify(report, null, 2));
