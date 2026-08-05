export class SeededRng {
  constructor(seed = 0x9e3779b9) {
    this.state = seed >>> 0;
  }

  next() {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0x100000000;
  }
}

export function bitAt(state, bit, nBits) {
  return (state >>> (nBits - bit - 1)) & 1;
}

export function bitsOf(state, nBits) {
  return Array.from({ length: nBits }, (_, bit) => bitAt(state, bit, nBits));
}

export function normalize(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) throw new Error("Cannot normalize non-positive mass");
  return values.map((value) => value / total);
}

export function sampleCategorical(probabilities, count, rng) {
  const cdf = [];
  let running = 0;
  for (const probability of probabilities) {
    running += probability;
    cdf.push(running);
  }
  const counts = Array(probabilities.length).fill(0);
  for (let draw = 0; draw < count; draw += 1) {
    const u = rng.next();
    let lo = 0;
    let hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (u <= cdf[mid]) hi = mid;
      else lo = mid + 1;
    }
    counts[lo] += 1;
  }
  return counts;
}

export function klDivergence(p, q) {
  let result = 0;
  for (let i = 0; i < p.length; i += 1) {
    if (p[i] > 0) result += p[i] * Math.log(p[i] / Math.max(q[i], 1e-300));
  }
  return result;
}

export function totalVariation(p, q) {
  return 0.5 * p.reduce((sum, value, i) => sum + Math.abs(value - q[i]), 0);
}

export function crossEntropy(p, q) {
  return -p.reduce(
    (sum, value, i) => sum + value * Math.log(Math.max(q[i], 1e-300)),
    0,
  );
}

export function makeStructuredTarget(nBits) {
  const prefixEnergy = [1.35, -0.55, 0.75, -1.15, -0.35, 0.95, -0.85, 0.45];
  const masses = [];
  for (let state = 0; state < 2 ** nBits; state += 1) {
    const bits = bitsOf(state, nBits);
    const parity = bits[0] ^ bits[2] ^ bits[5] ^ bits[7];
    const longRelation = (bits[0] ^ bits[7]) === bits[3];
    const prefix = (bits[0] << 2) | (bits[1] << 1) | bits[2];
    let energy = prefixEnergy[prefix];
    energy += parity === 0 ? 2.15 : -0.75;
    energy += bits[1] === bits[4] ? 0.95 : -0.25;
    energy += longRelation ? 1.25 : -0.4;
    energy += bits[6] ? 0.15 : -0.05;
    masses.push(Math.exp(energy));
  }
  return normalize(masses);
}

function constraintsKey(constraints) {
  return [...constraints.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bit, value]) => `${bit}:${value}`)
    .join(",");
}

function statesForConstraints(nBits, constraints) {
  const result = [];
  for (let state = 0; state < 2 ** nBits; state += 1) {
    let matches = true;
    for (const [bit, value] of constraints.entries()) {
      if (bitAt(state, bit, nBits) !== value) {
        matches = false;
        break;
      }
    }
    if (matches) result.push(state);
  }
  return result;
}

function leafScore(count, stateCount) {
  if (count <= 0) return 0;
  return count * Math.log(count / stateCount);
}

export class CylinderProgram {
  constructor(nBits, operations = []) {
    this.nBits = nBits;
    this.operations = operations.map((operation) => ({ ...operation }));
  }

  appendSplit(constraints, bit) {
    this.operations.push({
      kind: "split",
      leaf: constraintsKey(constraints),
      constraints: [...constraints.entries()].sort(([a], [b]) => a - b),
      bit,
    });
  }

  compose(other) {
    if (other.nBits !== this.nBits) throw new Error("Program arity mismatch");
    return new CylinderProgram(this.nBits, [...this.operations, ...other.operations]);
  }

  toJSON() {
    return { nBits: this.nBits, operations: this.operations };
  }
}

export class PrimitiveDistributionState {
  constructor(representation, processHistory = []) {
    this.representation = representation;
    this.processHistory = [...processHistory];
  }

  act(process) {
    return process.apply(this);
  }

  probe(effect) {
    return effect.observe(this);
  }
}

export class CylinderTreeDistribution {
  constructor(nBits, alpha = 0.25) {
    this.nBits = nBits;
    this.alpha = alpha;
    this.counts = Array(2 ** nBits).fill(0);
    this.total = 0;
    this.leaves = [];
    this.program = new CylinderProgram(nBits);
    this.reset();
  }

  reset() {
    this.leaves = [{ constraints: new Map(), states: statesForConstraints(this.nBits, new Map()) }];
    this.program = new CylinderProgram(this.nBits);
  }

  setCounts(counts) {
    if (counts.length !== 2 ** this.nBits) throw new Error("Count vector has wrong size");
    this.counts = [...counts];
    this.total = counts.reduce((sum, count) => sum + count, 0);
    if (!(this.total > 0)) throw new Error("At least one observation is required");
  }

  leafCount(leaf) {
    return leaf.states.reduce((sum, state) => sum + this.counts[state], 0);
  }

  bestSplit() {
    let best = null;
    for (let leafIndex = 0; leafIndex < this.leaves.length; leafIndex += 1) {
      const leaf = this.leaves[leafIndex];
      const parentCount = this.leafCount(leaf);
      const parentScore = leafScore(parentCount, leaf.states.length);
      for (let bit = 0; bit < this.nBits; bit += 1) {
        if (leaf.constraints.has(bit)) continue;
        const leftStates = leaf.states.filter((state) => bitAt(state, bit, this.nBits) === 0);
        const rightStates = leaf.states.filter((state) => bitAt(state, bit, this.nBits) === 1);
        const leftCount = leftStates.reduce((sum, state) => sum + this.counts[state], 0);
        const rightCount = parentCount - leftCount;
        const gain =
          leafScore(leftCount, leftStates.length) +
          leafScore(rightCount, rightStates.length) -
          parentScore;
        if (!best || gain > best.gain + 1e-12) {
          best = { leafIndex, bit, gain, leftStates, rightStates };
        }
      }
    }
    return best;
  }

  applySplit(leafIndex, bit) {
    const leaf = this.leaves[leafIndex];
    if (!leaf || leaf.constraints.has(bit)) throw new Error("Invalid split");
    this.program.appendSplit(leaf.constraints, bit);
    const leftConstraints = new Map(leaf.constraints);
    const rightConstraints = new Map(leaf.constraints);
    leftConstraints.set(bit, 0);
    rightConstraints.set(bit, 1);
    const replacement = [
      { constraints: leftConstraints, states: statesForConstraints(this.nBits, leftConstraints) },
      { constraints: rightConstraints, states: statesForConstraints(this.nBits, rightConstraints) },
    ];
    this.leaves.splice(leafIndex, 1, ...replacement);
  }

  fit(counts, maxLeaves) {
    this.setCounts(counts);
    this.reset();
    while (this.leaves.length < maxLeaves) {
      const split = this.bestSplit();
      if (!split) break;
      this.applySplit(split.leafIndex, split.bit);
    }
    return this;
  }

  replay(program, counts = this.counts) {
    this.setCounts(counts);
    this.reset();
    for (const operation of program.operations) {
      const index = this.leaves.findIndex(
        (leaf) => constraintsKey(leaf.constraints) === operation.leaf,
      );
      if (index < 0) throw new Error(`Replay could not find leaf ${operation.leaf}`);
      this.applySplit(index, operation.bit);
    }
    return this;
  }

  probabilities() {
    const probabilities = Array(2 ** this.nBits).fill(0);
    const denominator = this.total + this.alpha * this.leaves.length;
    for (const leaf of this.leaves) {
      const leafMass = (this.leafCount(leaf) + this.alpha) / denominator;
      const perState = leafMass / leaf.states.length;
      for (const state of leaf.states) probabilities[state] = perState;
    }
    return normalize(probabilities);
  }

  structure() {
    return this.leaves.map((leaf) => ({
      constraints: Object.fromEntries([...leaf.constraints.entries()].sort(([a], [b]) => a - b)),
      stateCount: leaf.states.length,
      observations: this.leafCount(leaf),
    }));
  }
}

export function fitIndependentBernoulli(counts, nBits, alpha = 0.5) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const probabilitiesOne = [];
  for (let bit = 0; bit < nBits; bit += 1) {
    let ones = 0;
    for (let state = 0; state < counts.length; state += 1) {
      if (bitAt(state, bit, nBits)) ones += counts[state];
    }
    probabilitiesOne.push((ones + alpha) / (total + 2 * alpha));
  }
  const result = [];
  for (let state = 0; state < 2 ** nBits; state += 1) {
    let probability = 1;
    for (let bit = 0; bit < nBits; bit += 1) {
      const pOne = probabilitiesOne[bit];
      probability *= bitAt(state, bit, nBits) ? pOne : 1 - pOne;
    }
    result.push(probability);
  }
  return normalize(result);
}

export class FiniteProbe {
  constructor(name, observe) {
    this.name = name;
    this.observeValue = observe;
  }

  observe(state) {
    return this.observeValue(state.representation);
  }
}

export class FiniteProcess {
  constructor(name, apply) {
    this.name = name;
    this.applyValue = apply;
  }

  apply(state) {
    return new PrimitiveDistributionState(
      this.applyValue(state.representation),
      [...state.processHistory, this.name],
    );
  }
}

export function observabilityMatrix(seedState, processes, probes) {
  const rows = processes.map((process) => {
    const next = seedState.act(process);
    return {
      process: process.name,
      signature: probes.map((probe) => next.probe(probe)),
    };
  });
  const collisions = [];
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const same = rows[i].signature.every(
        (value, k) => Math.abs(value - rows[j].signature[k]) < 1e-12,
      );
      if (same) collisions.push([rows[i].process, rows[j].process]);
    }
  }
  return { rows, collisions };
}

export function rotateStateProbabilities(probabilities, nBits, amount = 1) {
  const result = Array(probabilities.length).fill(0);
  for (let state = 0; state < probabilities.length; state += 1) {
    const bits = bitsOf(state, nBits);
    const shift = ((amount % nBits) + nBits) % nBits;
    const rotated = bits.slice(shift).concat(bits.slice(0, shift));
    const target = rotated.reduce((value, bit) => (value << 1) | bit, 0);
    result[target] += probabilities[state];
  }
  return result;
}

