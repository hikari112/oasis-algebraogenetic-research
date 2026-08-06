import assert from "node:assert/strict";

// Genesis v0 executable audit.
//
// This file keeps four layers separate:
//   1. bare finite repair semantics and its causal reachability atlas;
//   2. the Heyting locale of persistent task availability;
//   3. one explicitly declared straight-line observation-cost enrichment;
//   4. optional connection/lift data, which are not recoverable from layer 1.

function canonicalPartition(blocks) {
  return blocks
    .map((block) => [...new Set(block)].sort((left, right) => left - right))
    .filter((block) => block.length > 0)
    .sort((left, right) => left[0] - right[0] || left.length - right.length);
}

function partitionKey(partition) {
  return canonicalPartition(partition)
    .map((block) => block.join(","))
    .join("|");
}

function blockIndex(partition, stateCount) {
  const result = Array(stateCount).fill(-1);
  partition.forEach((block, index) => {
    for (const state of block) result[state] = index;
  });
  assert(result.every((entry) => entry >= 0), "partition must cover the carrier");
  return result;
}

function refines(finer, coarser, stateCount) {
  const coarseIndex = blockIndex(coarser, stateCount);
  return finer.every((block) => {
    const target = coarseIndex[block[0]];
    return block.every((state) => coarseIndex[state] === target);
  });
}

function joinPartitions(left, right, stateCount) {
  const leftIndex = blockIndex(left, stateCount);
  const rightIndex = blockIndex(right, stateCount);
  const blocks = new Map();
  for (let state = 0; state < stateCount; state += 1) {
    const signature = `${leftIndex[state]}:${rightIndex[state]}`;
    if (!blocks.has(signature)) blocks.set(signature, []);
    blocks.get(signature).push(state);
  }
  return canonicalPartition([...blocks.values()]);
}

function pullbackPartition(partition, action, stateCount) {
  const index = blockIndex(partition, stateCount);
  const blocks = new Map();
  for (let state = 0; state < stateCount; state += 1) {
    const signature = index[action[state]];
    if (!blocks.has(signature)) blocks.set(signature, []);
    blocks.get(signature).push(state);
  }
  return canonicalPartition([...blocks.values()]);
}

function atomicRepair(partition, action, stateCount) {
  return joinPartitions(
    partition,
    pullbackPartition(partition, action, stateCount),
    stateCount,
  );
}

function allMasks(partition) {
  const masks = [];
  for (let choice = 0; choice < 2 ** partition.length; choice += 1) {
    let mask = 0;
    partition.forEach((block, index) => {
      if ((choice >> index) & 1) {
        for (const state of block) mask |= 1 << state;
      }
    });
    masks.push(mask);
  }
  return [...new Set(masks)].sort((left, right) => left - right);
}

function partitionFromMask(mask, stateCount) {
  const zero = [];
  const one = [];
  for (let state = 0; state < stateCount; state += 1) {
    if ((mask >> state) & 1) one.push(state);
    else zero.push(state);
  }
  return canonicalPartition([zero, one]);
}

function pullbackMask(mask, action) {
  let result = 0;
  action.forEach((target, state) => {
    if ((mask >> target) & 1) result |= 1 << state;
  });
  return result;
}

function refineWithMask(partition, mask, stateCount) {
  return joinPartitions(partition, partitionFromMask(mask, stateCount), stateCount);
}

function setPartitions(stateCount) {
  if (stateCount === 0) return [[]];
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
  extend(1, [[0]]);
  return [...new Map(result.map((partition) => [partitionKey(partition), partition])).values()];
}

function composeMaps(left, right) {
  return right.map((value) => left[value]);
}

function inversePermutation(permutation) {
  const inverse = Array(permutation.length);
  permutation.forEach((value, index) => {
    inverse[value] = index;
  });
  return inverse;
}

function sameMap(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function permutations(size) {
  const result = [];
  const current = [];
  const used = Array(size).fill(false);
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

function permutationCycleType(permutation) {
  const seen = Array(permutation.length).fill(false);
  const cycles = [];
  for (let start = 0; start < permutation.length; start += 1) {
    if (seen[start]) continue;
    let current = start;
    let length = 0;
    while (!seen[current]) {
      seen[current] = true;
      length += 1;
      current = permutation[current];
    }
    cycles.push(length);
  }
  return cycles.sort((left, right) => left - right);
}

function buildRepairMachine(name, seed, actions, costs, stateCount) {
  const start = partitionKey(seed);
  const nodes = new Map([[start, canonicalPartition(seed)]]);
  const transitions = {};
  const strictEdges = [];
  const queue = [start];
  while (queue.length > 0) {
    const source = queue.shift();
    const partition = nodes.get(source);
    transitions[source] = {};
    for (const [symbol, action] of Object.entries(actions)) {
      const repaired = atomicRepair(partition, action, stateCount);
      const target = partitionKey(repaired);
      transitions[source][symbol] = target;
      if (!nodes.has(target)) {
        nodes.set(target, repaired);
        queue.push(target);
      }
      if (target !== source) {
        strictEdges.push({ source, target, symbol, cost: costs[symbol] });
      }
    }
  }
  return {
    name,
    stateCount,
    alphabet: Object.keys(actions),
    actions,
    costs,
    start,
    nodes,
    transitions,
    strictEdges,
  };
}

function runWord(machine, word, start = machine.start) {
  return word.reduce((state, symbol) => machine.transitions[state][symbol], start);
}

function localRepairDefect(machine, state) {
  return Object.fromEntries(
    machine.alphabet.map((symbol) => [
      symbol,
      machine.transitions[state][symbol] === state ? 0 : 1,
    ]),
  );
}

function reachable(machine, source, target) {
  const seen = new Set([source]);
  const queue = [source];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === target) return true;
    for (const next of Object.values(machine.transitions[current])) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

function powerset(values) {
  const result = [];
  for (let mask = 0; mask < 2 ** values.length; mask += 1) {
    result.push(new Set(values.filter((_, index) => (mask >> index) & 1)));
  }
  return result;
}

function setKey(values) {
  return [...values].sort().join(";");
}

function subset(left, right) {
  return [...left].every((value) => right.has(value));
}

function sameSet(left, right) {
  return left.size === right.size && subset(left, right);
}

function setUnion(left, right) {
  return new Set([...left, ...right]);
}

function setIntersection(left, right) {
  return new Set([...left].filter((value) => right.has(value)));
}

function allUpsets(machine) {
  const states = [...machine.nodes.keys()];
  return powerset(states).filter((candidate) =>
    [...candidate].every((source) =>
      states.every((target) => !reachable(machine, source, target) || candidate.has(target)),
    ),
  );
}

function heytingImplication(machine, left, right) {
  const result = new Set();
  for (const source of machine.nodes.keys()) {
    const futureLeft = [...machine.nodes.keys()].filter(
      (target) => reachable(machine, source, target) && left.has(target),
    );
    if (futureLeft.every((target) => right.has(target))) result.add(source);
  }
  return result;
}

function taskOpen(machine, taskPartition) {
  return new Set(
    [...machine.nodes.entries()]
      .filter(([, context]) => refines(context, taskPartition, machine.stateCount))
      .map(([key]) => key),
  );
}

function verifyHeytingAdjunction(machine) {
  const opens = allUpsets(machine);
  const openKeys = new Set(opens.map(setKey));
  for (const left of opens) {
    for (const right of opens) {
      const meet = setIntersection(left, right);
      const join = setUnion(left, right);
      const implication = heytingImplication(machine, left, right);
      assert(openKeys.has(setKey(meet)), "upsets must be closed under meet");
      assert(openKeys.has(setKey(join)), "upsets must be closed under join");
      assert(openKeys.has(setKey(implication)), "Heyting implication must be an upset");
      for (const test of opens) {
        assert.equal(
          subset(setIntersection(test, left), right),
          subset(test, implication),
          "Heyting implication must satisfy its adjunction",
        );
      }
    }
  }
  return opens;
}

function firstEntryPrerequisite(machine, prerequisiteOpen, targetOpen) {
  const entries = machine.strictEdges.filter(
    (edge) => !targetOpen.has(edge.source) && targetOpen.has(edge.target),
  );
  return {
    entries,
    holds: entries.length > 0 && entries.every((edge) => prerequisiteOpen.has(edge.source)),
  };
}

function shortestRepairDistances(machine, start = machine.start) {
  const distances = new Map([...machine.nodes.keys()].map((key) => [key, Infinity]));
  const visited = new Set();
  distances.set(start, 0);
  while (visited.size < machine.nodes.size) {
    const candidates = [...machine.nodes.keys()].filter((key) => !visited.has(key));
    candidates.sort((left, right) => distances.get(left) - distances.get(right));
    const source = candidates[0];
    if (source === undefined || !Number.isFinite(distances.get(source))) break;
    visited.add(source);
    for (const edge of machine.strictEdges.filter((candidate) => candidate.source === source)) {
      const candidate = distances.get(source) + edge.cost;
      if (candidate < distances.get(edge.target)) distances.set(edge.target, candidate);
    }
  }
  return distances;
}

function taskRepairCost(machine, taskPartition, start = machine.start) {
  const distances = shortestRepairDistances(machine, start);
  const open = taskOpen(machine, taskPartition);
  return Math.min(...[...open].map((state) => distances.get(state)));
}

function minimizeMoore(machine) {
  const byOutput = new Map();
  for (const state of machine.states) {
    const output = machine.output[state];
    if (!byOutput.has(output)) byOutput.set(output, []);
    byOutput.get(output).push(state);
  }
  let blocks = [...byOutput.values()];
  while (true) {
    const blockOf = new Map();
    blocks.forEach((block, index) => block.forEach((state) => blockOf.set(state, index)));
    const refined = [];
    for (const block of blocks) {
      const groups = new Map();
      for (const state of block) {
        const signature = machine.alphabet
          .map((symbol) => blockOf.get(machine.transitions[state][symbol]))
          .join(",");
        if (!groups.has(signature)) groups.set(signature, []);
        groups.get(signature).push(state);
      }
      refined.push(...groups.values());
    }
    if (refined.length === blocks.length) return refined;
    blocks = refined;
  }
}

function circuitDistances(system, startPartition, stateCount) {
  const partitions = setPartitions(stateCount);
  const byKey = new Map(partitions.map((partition) => [partitionKey(partition), partition]));
  const distances = new Map([...byKey.keys()].map((key) => [key, Infinity]));
  const visited = new Set();
  const startKey = partitionKey(startPartition);
  distances.set(startKey, 0);
  while (visited.size < byKey.size) {
    const candidates = [...byKey.keys()].filter((key) => !visited.has(key));
    candidates.sort((left, right) => distances.get(left) - distances.get(right));
    const source = candidates[0];
    if (source === undefined || !Number.isFinite(distances.get(source))) break;
    visited.add(source);
    const partition = byKey.get(source);
    for (const [symbol, action] of Object.entries(system.actions)) {
      for (const observable of allMasks(partition)) {
        const transported = pullbackMask(observable, action);
        const nextPartition = refineWithMask(partition, transported, stateCount);
        const target = partitionKey(nextPartition);
        const candidate = distances.get(source) + system.costs[symbol];
        if (candidate < distances.get(target)) distances.set(target, candidate);
      }
    }
  }
  return { distances, byKey };
}

function buildCircuitKernel(system, stateCount) {
  const partitions = setPartitions(stateCount);
  const raw = new Map();
  const kernel = new Map();
  for (const start of partitions) {
    const startKey = partitionKey(start);
    const audit = circuitDistances(system, start, stateCount);
    raw.set(startKey, audit);
    const row = new Map();
    for (const target of partitions) {
      const cost = Math.min(
        ...[...audit.byKey.entries()]
          .filter(([, reached]) => refines(reached, target, stateCount))
          .map(([key]) => audit.distances.get(key)),
      );
      row.set(partitionKey(target), cost);
    }
    kernel.set(startKey, row);
  }
  return { partitions, raw, kernel };
}

function circuitCost(circuitKernel, target, given) {
  return circuitKernel.kernel.get(partitionKey(given)).get(partitionKey(target));
}

function verifyCircuitKernelLaws(circuitKernel, stateCount) {
  const { partitions } = circuitKernel;
  for (const given of partitions) {
    assert.equal(circuitCost(circuitKernel, given, given), 0);
    for (const richer of partitions) {
      if (!refines(richer, given, stateCount)) continue;
      for (const target of partitions) {
        assert(
          circuitCost(circuitKernel, target, richer)
            <= circuitCost(circuitKernel, target, given),
          "conditioning on a richer free algebra cannot increase circuit cost",
        );
      }
    }
    for (const left of partitions) {
      for (const right of partitions) {
        const joint = joinPartitions(left, right, stateCount);
        assert(
          circuitCost(circuitKernel, joint, given)
            <= circuitCost(circuitKernel, left, given)
              + circuitCost(circuitKernel, right, given),
          "joint generation must be subadditive",
        );
        const enrichedGiven = joinPartitions(given, left, stateCount);
        assert(
          circuitCost(circuitKernel, right, given)
            <= circuitCost(circuitKernel, left, given)
              + circuitCost(circuitKernel, right, enrichedGiven),
          "conditional circuit cost must satisfy sequential composition",
        );
      }
    }
  }
}

function pairSeparationDepths(circuitKernel, startPartition, stateCount) {
  const audit = circuitKernel.raw.get(partitionKey(startPartition));
  const result = {};
  for (let left = 0; left < stateCount; left += 1) {
    for (let right = left + 1; right < stateCount; right += 1) {
      let best = Infinity;
      for (const [key, partition] of audit.byKey) {
        const index = blockIndex(partition, stateCount);
        if (index[left] !== index[right]) best = Math.min(best, audit.distances.get(key));
      }
      result[`${left},${right}`] = best;
    }
  }
  return result;
}

function distinctionProfile(depths, stateCount) {
  const finiteDepths = [...new Set([0, ...Object.values(depths).filter(Number.isFinite)])].sort(
    (left, right) => left - right,
  );
  const profile = {};
  for (const threshold of finiteDepths) {
    const parent = Array.from({ length: stateCount }, (_, index) => index);
    function find(value) {
      if (parent[value] !== value) parent[value] = find(parent[value]);
      return parent[value];
    }
    function union(left, right) {
      const rootLeft = find(left);
      const rootRight = find(right);
      if (rootLeft !== rootRight) parent[rootRight] = rootLeft;
    }
    for (let left = 0; left < stateCount; left += 1) {
      for (let right = left + 1; right < stateCount; right += 1) {
        if (depths[`${left},${right}`] > threshold) union(left, right);
      }
    }
    const classes = new Set(Array.from({ length: stateCount }, (_, state) => find(state)));
    profile[threshold] = classes.size;
  }
  return profile;
}

function verifyUltrametricDepths(depths, stateCount) {
  function depth(left, right) {
    if (left === right) return Infinity;
    return depths[left < right ? `${left},${right}` : `${right},${left}`];
  }
  for (let left = 0; left < stateCount; left += 1) {
    for (let middle = 0; middle < stateCount; middle += 1) {
      for (let right = 0; right < stateCount; right += 1) {
        assert(
          depth(left, right) >= Math.min(depth(left, middle), depth(middle, right)),
          "first-separation depth must induce an extended ultrametric",
        );
      }
    }
  }
}

function inducedBlockPermutation(partition, permutation) {
  const canonical = canonicalPartition(partition);
  const indexByBlock = new Map(canonical.map((block, index) => [block.join(","), index]));
  return canonical.map((block) => {
    const image = block.map((state) => permutation[state]).sort((left, right) => left - right);
    assert(indexByBlock.has(image.join(",")), "permutation must preserve the partition");
    return indexByBlock.get(image.join(","));
  });
}

function quotientMap(finer, coarser, stateCount) {
  assert(refines(finer, coarser, stateCount), "quotient map requires a refinement");
  const coarseIndex = blockIndex(coarser, stateCount);
  return canonicalPartition(finer).map((block) => coarseIndex[block[0]]);
}

function enumerateSections(quotient, coarseSize) {
  const fibers = Array.from({ length: coarseSize }, () => []);
  quotient.forEach((coarse, fine) => fibers[coarse].push(fine));
  const result = [];
  function extend(index, current) {
    if (index === coarseSize) {
      result.push([...current]);
      return;
    }
    for (const choice of fibers[index]) {
      current.push(choice);
      extend(index + 1, current);
      current.pop();
    }
  }
  extend(0, []);
  return result;
}

function uniformFiberKernel(surjection, targetSize) {
  const fibers = Array.from({ length: targetSize }, () => []);
  surjection.forEach((target, source) => fibers[target].push(source));
  return fibers.map((fiber) =>
    surjection.map((target, source) =>
      fiber.includes(source) ? 1 / fiber.length : 0,
    ),
  );
}

function composeMarkovKernels(coarseToMiddle, middleToFine) {
  return coarseToMiddle.map((middleRow) =>
    middleToFine[0].map((_, fine) =>
      middleRow.reduce(
        (total, middleWeight, middle) =>
          total + middleWeight * middleToFine[middle][fine],
        0,
      ),
    ),
  );
}

function connectionHolonomy(connection) {
  const upper = composeMaps(connection.upperTerminal, connection.rootUpper);
  const lower = composeMaps(connection.lowerTerminal, connection.rootLower);
  return composeMaps(inversePermutation(lower), upper);
}

function connectionKey(connection) {
  return [
    connection.rootUpper,
    connection.upperTerminal,
    connection.rootLower,
    connection.lowerTerminal,
  ].map((permutation) => permutation.join("")).join("/");
}

function gaugeEdge(edge, sourceGauge, targetGauge) {
  return composeMaps(
    targetGauge,
    composeMaps(edge, inversePermutation(sourceGauge)),
  );
}

function gaugeConnection(connection, gauge) {
  return {
    rootUpper: gaugeEdge(connection.rootUpper, gauge.root, gauge.upper),
    upperTerminal: gaugeEdge(
      connection.upperTerminal,
      gauge.upper,
      gauge.terminal,
    ),
    rootLower: gaugeEdge(connection.rootLower, gauge.root, gauge.lower),
    lowerTerminal: gaugeEdge(
      connection.lowerTerminal,
      gauge.lower,
      gauge.terminal,
    ),
  };
}

function connectionModuliAudit() {
  const group = permutations(3);
  const counts = new Map();
  const connections = [];
  const connectionByKey = new Map();
  let total = 0;
  let flatFilledSquareCount = 0;
  for (const rootUpper of group) {
    for (const upperTerminal of group) {
      for (const rootLower of group) {
        for (const lowerTerminal of group) {
          total += 1;
          const connection = {
            rootUpper,
            upperTerminal,
            rootLower,
            lowerTerminal,
          };
          connections.push(connection);
          connectionByKey.set(connectionKey(connection), connection);
          const holonomy = connectionHolonomy(connection);
          const type = permutationCycleType(holonomy).join(",");
          counts.set(type, (counts.get(type) ?? 0) + 1);
          if (type === "1,1,1") flatFilledSquareCount += 1;
        }
      }
    }
  }
  assert.equal(total, 6 ** 4);
  assert.deepEqual(Object.fromEntries([...counts.entries()].sort()), {
    "1,1,1": 216,
    "1,2": 648,
    "3": 432,
  });
  assert.equal(flatFilledSquareCount, 216);

  const orbitKeys = new Set();
  for (const connection of connections) {
    let canonical = null;
    for (const root of group) {
      for (const upper of group) {
        for (const lower of group) {
          for (const terminal of group) {
            const key = connectionKey(gaugeConnection(connection, {
              root,
              upper,
              lower,
              terminal,
            }));
            if (canonical === null || key < canonical) canonical = key;
          }
        }
      }
    }
    orbitKeys.add(canonical);
  }
  assert.equal(orbitKeys.size, 3);
  const gaugeClassesByHolonomyConjugacyType = [...orbitKeys]
    .map((key) => permutationCycleType(connectionHolonomy(connectionByKey.get(key))).join(","))
    .sort();
  assert.deepEqual(gaugeClassesByHolonomyConjugacyType, ["1,1,1", "1,2", "3"]);

  return {
    group: "S3",
    edgeLabelings: total,
    gaugeOrbitCount: orbitKeys.size,
    gaugeClassesByHolonomyConjugacyType,
    edgeLabelingsByHolonomyCycleType: Object.fromEntries([...counts.entries()].sort()),
    filledCommutingSquareFlatLabelings: flatFilledSquareCount,
    theoremChecked:
      "exact gauge-orbit enumeration verifies that unfilled-diamond connection classes are the three S3 cycle-holonomy conjugacy classes; filling the square and imposing flatness retains only identity holonomy",
  };
}

const stateCount = 4;
const seed = canonicalPartition([
  [0, 1],
  [2, 3],
]);
const bp = canonicalPartition([[0], [1], [2, 3]]);
const bq = canonicalPartition([[0, 1], [2], [3]]);
const discrete = canonicalPartition([[0], [1], [2], [3]]);
const alpha = [0, 2, 0, 0];
const parallelActions = { alpha, beta: [0, 0, 0, 2] };
const serialActions = { alpha, beta: [0, 0, 0, 1] };
const unitCosts = { alpha: 1, beta: 1 };

const parallel = buildRepairMachine(
  "parallel",
  seed,
  parallelActions,
  unitCosts,
  stateCount,
);
const serial = buildRepairMachine("serial", seed, serialActions, unitCosts, stateCount);

assert.equal(parallel.nodes.size, 4);
assert.equal(serial.nodes.size, 3);
assert.equal(runWord(parallel, ["alpha", "beta"]), partitionKey(discrete));
assert.equal(runWord(parallel, ["beta", "alpha"]), partitionKey(discrete));
assert.equal(runWord(serial, ["alpha", "beta"]), partitionKey(discrete));

const serialAfterAlpha = runWord(serial, ["alpha"]);
const serialTerminal = runWord(serial, ["alpha", "beta"]);
const serialDefectTrace = [
  localRepairDefect(serial, serial.start),
  localRepairDefect(serial, serialAfterAlpha),
  localRepairDefect(serial, serialTerminal),
];
assert.deepEqual(serialDefectTrace, [
  { alpha: 1, beta: 0 },
  { alpha: 0, beta: 1 },
  { alpha: 0, beta: 0 },
]);

function availabilityAudit(machine) {
  const opens = verifyHeytingAdjunction(machine);
  const top = new Set(machine.nodes.keys());
  const bottom = new Set();
  const pOpen = taskOpen(machine, bp);
  const qOpen = taskOpen(machine, bq);
  const jointOpen = taskOpen(machine, discrete);
  const notQ = heytingImplication(machine, qOpen, bottom);
  assert(sameSet(jointOpen, setIntersection(pOpen, qOpen)));
  assert.equal(sameSet(setUnion(qOpen, notQ), top), false);
  return {
    contextCount: machine.nodes.size,
    localeCardinality: opens.length,
    pOpen: [...pOpen].sort(),
    qOpen: [...qOpen].sort(),
    jointOpen: [...jointOpen].sort(),
    weakPPrerequisiteForQ: subset(qOpen, pOpen),
    strictPPrerequisiteForQ: firstEntryPrerequisite(machine, pOpen, qOpen),
    qImpliesPGlobally: sameSet(heytingImplication(machine, qOpen, pOpen), top),
    excludedMiddleForQ: sameSet(setUnion(qOpen, notQ), top),
    repairCostsFromRoot: {
      p: taskRepairCost(machine, bp),
      q: taskRepairCost(machine, bq),
      joint: taskRepairCost(machine, discrete),
    },
  };
}

const parallelAvailability = availabilityAudit(parallel);
const serialAvailability = availabilityAudit(serial);
assert.equal(parallelAvailability.localeCardinality, 6);
assert.equal(serialAvailability.localeCardinality, 4);
assert.equal(parallelAvailability.weakPPrerequisiteForQ, false);
assert.equal(serialAvailability.weakPPrerequisiteForQ, true);
assert.equal(parallelAvailability.strictPPrerequisiteForQ.holds, false);
assert.equal(serialAvailability.strictPPrerequisiteForQ.holds, true);
assert.deepEqual(parallelAvailability.repairCostsFromRoot, { p: 1, q: 1, joint: 2 });
assert.deepEqual(serialAvailability.repairCostsFromRoot, { p: 1, q: 2, joint: 2 });

const historySplitParallel = {
  states: ["root", "p", "q", "top-ab", "top-ba"],
  alphabet: ["alpha", "beta"],
  output: {
    root: partitionKey(seed),
    p: partitionKey(bp),
    q: partitionKey(bq),
    "top-ab": partitionKey(discrete),
    "top-ba": partitionKey(discrete),
  },
  transitions: {
    root: { alpha: "p", beta: "q" },
    p: { alpha: "p", beta: "top-ab" },
    q: { alpha: "top-ba", beta: "q" },
    "top-ab": { alpha: "top-ab", beta: "top-ab" },
    "top-ba": { alpha: "top-ba", beta: "top-ba" },
  },
};
const mooreBlocks = minimizeMoore(historySplitParallel);
assert.equal(mooreBlocks.length, 4);
assert(
  mooreBlocks.some(
    (block) => block.length === 2 && block.includes("top-ab") && block.includes("top-ba"),
  ),
);

// Reachability is strictly stronger than ambient algebra inclusion in general.
const seed5 = canonicalPartition([
  [0, 1, 2],
  [3, 4],
]);
const actionA5 = [0, 3, 0, 0, 0];
const actionB5 = [1, 3, 0, 3, 0];
const q5 = atomicRepair(seed5, actionA5, 5);
const p5 = atomicRepair(seed5, actionB5, 5);
assert(refines(p5, q5, 5));
assert.equal(partitionKey(atomicRepair(p5, actionA5, 5)), partitionKey(p5));
const root5 = buildRepairMachine("biorder-witness", seed5, {
  alpha: actionA5,
  beta: actionB5,
}, unitCosts, 5);
assert.equal(root5.transitions[root5.start].beta, partitionKey(p5));
const fromQ5 = buildRepairMachine("inclusion-not-reachability", q5, {
  alpha: actionA5,
  beta: actionB5,
}, unitCosts, 5);
assert.equal(fromQ5.nodes.has(partitionKey(p5)), false);

// Atomic repair is inflationary and monotone, but need not be idempotent.
const nonIdempotentSeed = canonicalPartition([[0], [1, 2, 3]]);
const nonIdempotentAction = [0, 0, 1, 2];
const once = atomicRepair(nonIdempotentSeed, nonIdempotentAction, 4);
const twice = atomicRepair(once, nonIdempotentAction, 4);
assert.equal(partitionKey(once), partitionKey(canonicalPartition([[0], [1], [2, 3]])));
assert.equal(partitionKey(twice), partitionKey(discrete));

// Circuit enrichment: Boolean operations/decoders are free, while transporting
// one currently available Boolean observable through one primitive costs one.
const parallelCircuitKernel = buildCircuitKernel(
  { actions: parallelActions, costs: unitCosts },
  stateCount,
);
const serialCircuitKernel = buildCircuitKernel(
  { actions: serialActions, costs: unitCosts },
  stateCount,
);
verifyCircuitKernelLaws(parallelCircuitKernel, stateCount);
verifyCircuitKernelLaws(serialCircuitKernel, stateCount);

function circuitSummary(kernel) {
  const pCost = circuitCost(kernel, bp, seed);
  const qCost = circuitCost(kernel, bq, seed);
  const jointCost = circuitCost(kernel, discrete, seed);
  const qGivenP = circuitCost(kernel, bq, bp);
  return {
    kPFromSeed: pCost,
    kQFromSeed: qCost,
    kJointFromSeed: jointCost,
    kQGivenP: qGivenP,
    pToQLeverage: qCost - qGivenP,
    jointGenerationSynergy: pCost + qCost - jointCost,
  };
}

const parallelCircuit = circuitSummary(parallelCircuitKernel);
const serialCircuit = circuitSummary(serialCircuitKernel);
assert.deepEqual(parallelCircuit, {
  kPFromSeed: 1,
  kQFromSeed: 1,
  kJointFromSeed: 2,
  kQGivenP: 1,
  pToQLeverage: 0,
  jointGenerationSynergy: 0,
});
assert.deepEqual(serialCircuit, {
  kPFromSeed: 1,
  kQFromSeed: 2,
  kJointFromSeed: 2,
  kQGivenP: 1,
  pToQLeverage: 1,
  jointGenerationSynergy: 1,
});

// Full repair is a batch operation, while the declared circuit model charges
// per transported Boolean observable.  This five-point witness makes the
// general kappa <= K comparison strict.
const batchGapSeed = canonicalPartition([[0, 1, 2], [3], [4]]);
const batchGapDiscrete = canonicalPartition([[0], [1], [2], [3], [4]]);
const batchGapAction = [0, 3, 4, 3, 4];
assert.equal(
  partitionKey(atomicRepair(batchGapSeed, batchGapAction, 5)),
  partitionKey(batchGapDiscrete),
);
const batchGapMachine = buildRepairMachine(
  "batch-gap",
  batchGapSeed,
  { delta: batchGapAction },
  { delta: 1 },
  5,
);
const batchGapRepairCost = taskRepairCost(
  batchGapMachine,
  batchGapDiscrete,
);
const batchGapCircuitKernel = buildCircuitKernel(
  { actions: { delta: batchGapAction }, costs: { delta: 1 } },
  5,
);
const batchGapCircuitCost = circuitCost(
  batchGapCircuitKernel,
  batchGapDiscrete,
  batchGapSeed,
);
assert.equal(batchGapRepairCost, 1);
assert.equal(batchGapCircuitCost, 2);
assert(batchGapRepairCost < batchGapCircuitCost);

const parallelPairDepths = pairSeparationDepths(
  parallelCircuitKernel,
  seed,
  stateCount,
);
const serialPairDepths = pairSeparationDepths(serialCircuitKernel, seed, stateCount);
verifyUltrametricDepths(parallelPairDepths, stateCount);
verifyUltrametricDepths(serialPairDepths, stateCount);
assert.deepEqual(distinctionProfile(parallelPairDepths, stateCount), { 0: 2, 1: 4 });
assert.deepEqual(distinctionProfile(serialPairDepths, stateCount), { 0: 2, 1: 3, 2: 4 });

const gamma = composeMaps(alpha, serialActions.beta);
assert.deepEqual(gamma, parallelActions.beta);
const unitMacroKernel = buildCircuitKernel(
  {
    actions: { ...serialActions, gamma },
    costs: { ...unitCosts, gamma: 1 },
  },
  stateCount,
);
const inheritedMacroKernel = buildCircuitKernel(
  {
    actions: { ...serialActions, gamma },
    costs: { ...unitCosts, gamma: 2 },
  },
  stateCount,
);
assert.equal(circuitCost(unitMacroKernel, bq, seed), 1);
assert.equal(circuitCost(inheritedMacroKernel, bq, seed), 2);

// A canonical quotient chart exists on every strict refinement, but a natural
// section/lift need not.  This four-state symmetry exchanges both possible
// lifts of the unresolved coarse atom.
const liftSeed = canonicalPartition([[0, 1], [2], [3]]);
const liftAction = [2, 3, 2, 3];
const liftRefined = atomicRepair(liftSeed, liftAction, 4);
const liftSymmetry = [1, 0, 3, 2];
assert.equal(partitionKey(liftRefined), partitionKey(discrete));
assert(sameMap(composeMaps(liftSymmetry, liftAction), composeMaps(liftAction, liftSymmetry)));
const quotient = quotientMap(liftRefined, liftSeed, 4);
const coarseSymmetry = inducedBlockPermutation(liftSeed, liftSymmetry);
const fineSymmetry = inducedBlockPermutation(liftRefined, liftSymmetry);
const sections = enumerateSections(quotient, liftSeed.length);
const equivariantSections = sections.filter((section) =>
  section.every(
    (fineChoice, coarseBlock) =>
      fineSymmetry[fineChoice] === section[coarseSymmetry[coarseBlock]],
  ),
);
assert.equal(sections.length, 2);
assert.equal(equivariantSections.length, 0);

const liftKernel = uniformFiberKernel(quotient, liftSeed.length);
for (let coarse = 0; coarse < liftSeed.length; coarse += 1) {
  assert.equal(
    quotient.reduce(
      (mass, target, fine) => mass + (target === coarse ? liftKernel[coarse][fine] : 0),
      0,
    ),
    1,
  );
  for (let fine = 0; fine < liftRefined.length; fine += 1) {
    assert.equal(
      liftKernel[coarseSymmetry[coarse]][fineSymmetry[fine]],
      liftKernel[coarse][fine],
      "uniform fiber lift must respect the witness symmetry",
    );
  }
}

const nestedFineToMiddle = [0, 1, 1];
const nestedMiddleToCoarse = [0, 0];
const sequentialUniformKernel = composeMarkovKernels(
  uniformFiberKernel(nestedMiddleToCoarse, 1),
  uniformFiberKernel(nestedFineToMiddle, 2),
);
const directUniformKernel = uniformFiberKernel([0, 0, 0], 1);
assert.deepEqual(sequentialUniformKernel, [[1 / 2, 1 / 4, 1 / 4]]);
assert.deepEqual(directUniformKernel, [[1 / 3, 1 / 3, 1 / 3]]);
assert.notDeepEqual(
  sequentialUniformKernel,
  directUniformKernel,
  "uniform fiber kernels need not compose along nested quotients",
);

const connectionModuli = connectionModuliAudit();

const report = {
  object:
    "finite primitive-costed repair presentation -> biordered context atlas -> observable diagram -> availability locale",
  semanticNucleus: {
    parallelContexts: parallel.nodes.size,
    serialContexts: serial.nodes.size,
    historySplitPresentationStates: historySplitParallel.states.length,
    minimizedMooreStates: mooreBlocks.length,
    commutingRootToTopWordsIdentified:
      runWord(parallel, ["alpha", "beta"])
      === runWord(parallel, ["beta", "alpha"]),
  },
  availabilityLocale: {
    parallel: parallelAvailability,
    serial: serialAvailability,
    interpretation:
      "not-yet-available is not the Heyting negation of available; the terminal Boolean task algebra and the causal availability logic are different objects",
  },
  nonpersistentSuccessorInterface: {
    output: "o_def(B)[a] = 1 iff Phi_a(B) differs from B",
    serialTraceAlongAlphaBeta: serialDefectTrace,
    betaTrace: serialDefectTrace.map((entry) => entry.beta),
    claimBoundary:
      "the 0-to-1-to-0 defect trace escapes the persistent-availability regularity proof, but this finite witness does not prove nonsoficity",
  },
  causalGuards: {
    inclusionWithoutReachability: {
      coarse: partitionKey(q5),
      finerButUnreachable: partitionKey(p5),
      informationOrderComparable: refines(p5, q5, 5),
      causalOrderComparable: fromQ5.nodes.has(partitionKey(p5)),
    },
    repairIsNotCausallyMonotone: {
      rootIsCausallyBelowP: reachable(root5, root5.start, partitionKey(p5)),
      alphaAtRoot: partitionKey(q5),
      alphaAtP: partitionKey(atomicRepair(p5, actionA5, 5)),
      alphaOutputsCausallyComparable: fromQ5.nodes.has(partitionKey(p5)),
    },
    nonIdempotentRepair: {
      seed: partitionKey(nonIdempotentSeed),
      once: partitionKey(once),
      twice: partitionKey(twice),
    },
  },
  declaredCircuitEnrichment: {
    model:
      "free Boolean algebra operations and reuse; each unary primitive transport gate has declared cost",
    parallel: parallelCircuit,
    serial: serialCircuit,
    strictBatchGap: {
      repairCost: batchGapRepairCost,
      unaryCircuitCost: batchGapCircuitCost,
    },
    parallelPairSeparationDepths: parallelPairDepths,
    serialPairSeparationDepths: serialPairDepths,
    parallelDistinctionProfile: distinctionProfile(parallelPairDepths, stateCount),
    serialDistinctionProfile: distinctionProfile(serialPairDepths, stateCount),
    retokenizationControl: {
      compositeAction: gamma,
      unitCostQ: circuitCost(unitMacroKernel, bq, seed),
      inheritedExpansionCostQ: circuitCost(inheritedMacroKernel, bq, seed),
    },
    boundary:
      "this K-profile is canonical only after the generator, gate, sharing, decoder, and cost model are declared",
  },
  connectionBoundary: {
    canonicalRefinementQuotient: quotient,
    possibleDeterministicSetSections: sections.length,
    symmetryEquivariantDeterministicSetSections: equivariantSections.length,
    uniformFiberKernel: liftKernel,
    uniformFiberKernelIsSymmetryEquivariant: true,
    uniformKernelCompositionControl: {
      sequential: sequentialUniformKernel,
      direct: directUniformKernel,
      equal: false,
    },
    moduli: connectionModuli,
    conclusion:
      "bare genesis canonically supplies irreversible quotient maps, relational converses, and symmetry-equivariant uniform fiber kernels, but no natural deterministic Set-section or nontrivial bijective connection class",
  },
  claimBoundary:
    "v0 is finite, deterministic, commutative, primitive-costed, and residually flattenable; it proves neither nonsoficity, absolute nonflattenability, canonical circuit complexity, nor a canonical nontrivial connection",
};

console.log(JSON.stringify(report, null, 2));
