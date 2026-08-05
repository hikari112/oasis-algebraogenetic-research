export function normalize(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) throw new Error("Cannot normalize non-positive mass");
  return values.map((value) => value / total);
}

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

export function parity(value) {
  let x = value >>> 0;
  x ^= x >>> 16;
  x ^= x >>> 8;
  x ^= x >>> 4;
  x &= 15;
  return (0x6996 >>> x) & 1;
}

export function walshValue(state, mask) {
  return parity(state & mask) ? -1 : 1;
}

export function hadamard(values) {
  const result = [...values];
  for (let width = 1; width < result.length; width *= 2) {
    for (let start = 0; start < result.length; start += 2 * width) {
      for (let offset = 0; offset < width; offset += 1) {
        const left = result[start + offset];
        const right = result[start + offset + width];
        result[start + offset] = left + right;
        result[start + offset + width] = left - right;
      }
    }
  }
  return result;
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
    let low = 0;
    let high = cdf.length - 1;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (u <= cdf[middle]) high = middle;
      else low = middle + 1;
    }
    counts[low] += 1;
  }
  return counts;
}

export function klDivergence(target, predicted) {
  return target.reduce(
    (sum, probability, state) =>
      sum + (probability > 0
        ? probability * Math.log(probability / Math.max(predicted[state], 1e-300))
        : 0),
    0,
  );
}

export function validationLoss(counts, probabilities) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  return -counts.reduce(
    (sum, count, state) => sum + count * Math.log(Math.max(probabilities[state], 1e-300)),
    0,
  ) / total;
}

export class ExactLinearProcess {
  constructor(nBits, rows, word = []) {
    this.nBits = nBits;
    this.rows = [...rows];
    this.word = [...word];
    if (rows.length !== nBits) throw new Error("Process row count does not match arity");
  }

  static identity(nBits) {
    return new ExactLinearProcess(
      nBits,
      Array.from({ length: nBits }, (_, bit) => 1 << bit),
      [],
    );
  }

  key() {
    return this.rows.join(",");
  }

  applyState(state) {
    let result = 0;
    for (let bit = 0; bit < this.nBits; bit += 1) {
      if (parity(state & this.rows[bit])) result |= 1 << bit;
    }
    return result;
  }

  pullbackMask(mask) {
    let result = 0;
    for (let bit = 0; bit < this.nBits; bit += 1) {
      if ((mask >>> bit) & 1) result ^= this.rows[bit];
    }
    return result;
  }

  compose(right, appendedName = null) {
    if (right.nBits !== this.nBits) throw new Error("Process arity mismatch");
    const rows = this.rows.map((row) => right.pullbackMask(row));
    const suffix = appendedName === null ? this.word : [...right.word, appendedName];
    return new ExactLinearProcess(this.nBits, rows, suffix);
  }
}

export function makeProcessGenerators(nBits) {
  const rotateRows = Array.from({ length: nBits }, (_, bit) =>
    1 << ((bit + 1) % nBits));
  const shearRows = Array.from({ length: nBits }, (_, bit) => 1 << bit);
  shearRows[0] ^= 1 << 1;
  return [
    { name: "rotate", process: new ExactLinearProcess(nBits, rotateRows, ["rotate"]) },
    { name: "shear-0-by-1", process: new ExactLinearProcess(nBits, shearRows, ["shear-0-by-1"]) },
  ];
}

export function generateProbeOrbit(nBits, generators = makeProcessGenerators(nBits)) {
  const byMask = new Map();
  const queue = [];
  for (let bit = 0; bit < nBits; bit += 1) {
    const probe = { mask: 1 << bit, seedBit: bit, word: [] };
    byMask.set(probe.mask, probe);
    queue.push(probe);
  }
  while (queue.length > 0) {
    const probe = queue.shift();
    for (const generator of generators) {
      const mask = generator.process.pullbackMask(probe.mask);
      if (!byMask.has(mask)) {
        const next = {
          mask,
          seedBit: probe.seedBit,
          word: [...probe.word, generator.name],
        };
        byMask.set(mask, next);
        queue.push(next);
      }
    }
  }
  return [...byMask.values()].sort(
    (left, right) => left.word.length - right.word.length || left.mask - right.mask,
  );
}

export function generateProcessWindow(
  nBits,
  limit = 24,
  generators = makeProcessGenerators(nBits),
) {
  const identity = ExactLinearProcess.identity(nBits);
  const byKey = new Map([[identity.key(), identity]]);
  const queue = [identity];
  while (queue.length > 0 && byKey.size < limit) {
    const current = queue.shift();
    for (const generator of generators) {
      const next = generator.process.compose(current, generator.name);
      if (!byKey.has(next.key())) {
        byKey.set(next.key(), next);
        queue.push(next);
        if (byKey.size >= limit) break;
      }
    }
  }
  return [...byKey.values()];
}

function smoothedProbabilities(counts, alpha) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  return counts.map((count) => (count + alpha) / (total + alpha * counts.length));
}

function clampMoment(value) {
  return Math.max(-1 + 1e-12, Math.min(1 - 1e-12, value));
}

function aliasPairs(activeMasks, processWindow, targetMoments, tolerance) {
  const signatures = processWindow.map((process) =>
    activeMasks.map((mask) => targetMoments[process.pullbackMask(mask)]),
  );
  const pairs = [];
  for (let left = 0; left < signatures.length; left += 1) {
    for (let right = left + 1; right < signatures.length; right += 1) {
      const distinguishable = signatures[left].some(
        (value, index) => Math.abs(value - signatures[right][index]) > tolerance,
      );
      if (!distinguishable) pairs.push([left, right]);
    }
  }
  return pairs;
}

function processSeparation(activeMasks, processWindow, targetMoments, tolerance) {
  const totalPairs = processWindow.length * (processWindow.length - 1) / 2;
  if (totalPairs === 0) return 1;
  return 1 - aliasPairs(activeMasks, processWindow, targetMoments, tolerance).length / totalPairs;
}

function applyTilt(probabilities, mask, delta) {
  const maximum = Math.abs(delta);
  return normalize(probabilities.map((probability, state) =>
    probability * Math.exp(delta * walshValue(state, mask) - maximum),
  ));
}

export function replayOasisProgram(dimension, program) {
  const nBits = Math.log2(dimension);
  if (!Number.isInteger(nBits)) throw new Error("Replay dimension must be a power of two");
  const generators = new Map(
    makeProcessGenerators(nBits).map((generator) => [generator.name, generator.process]),
  );
  let probabilities = Array(dimension).fill(1 / dimension);
  for (const operation of program) {
    let derivedMask = 1 << operation.seedBit;
    for (const name of operation.derivationWord) {
      const generator = generators.get(name);
      if (!generator) throw new Error(`Unknown process generator: ${name}`);
      derivedMask = generator.pullbackMask(derivedMask);
    }
    if (derivedMask !== operation.mask) {
      throw new Error("Stored probe mask does not match its exact derivation word");
    }
    probabilities = applyTilt(probabilities, operation.mask, operation.delta);
  }
  return probabilities;
}

export class OasisProbeSynthesizer {
  constructor(nBits, options = {}) {
    this.nBits = nBits;
    this.dimension = 2 ** nBits;
    this.alpha = options.alpha ?? 0.25;
    this.obstructionWeight = options.obstructionWeight ?? 0.08;
    this.complexityWeight = options.complexityWeight ?? 0.001;
    this.aliasTolerance = options.aliasTolerance ?? 1e-5;
    this.processWindowSize = options.processWindowSize ?? 24;
    this.generators = makeProcessGenerators(nBits);
    this.candidates = generateProbeOrbit(nBits, this.generators);
    this.processWindow = generateProcessWindow(
      nBits,
      this.processWindowSize,
      this.generators,
    );
  }

  fit(counts, options = {}) {
    if (counts.length !== this.dimension) throw new Error("Count vector has wrong dimension");
    const maxSteps = options.maxSteps ?? 96;
    const snapshotSteps = new Set(options.snapshotSteps ?? [4, 8, 12, 16, 24, 32, 48, 64, 96]);
    const target = smoothedProbabilities(counts, this.alpha);
    const targetMoments = hadamard(target);
    let probabilities = Array(this.dimension).fill(1 / this.dimension);
    const activeMasks = [];
    const activeSet = new Set();
    const program = [];
    const snapshots = new Map();
    const diagnostics = [];

    for (let step = 1; step <= maxSteps; step += 1) {
      const modelMoments = hadamard(probabilities);
      const aliases = aliasPairs(
        activeMasks,
        this.processWindow,
        targetMoments,
        this.aliasTolerance,
      );
      let best = null;
      for (const candidate of this.candidates) {
        const dataMoment = targetMoments[candidate.mask];
        const modelMoment = modelMoments[candidate.mask];
        const residual = Math.abs(dataMoment - modelMoment) /
          Math.sqrt(Math.max(1e-9, 1 - modelMoment * modelMoment));
        let obstructionGain = 0;
        if (!activeSet.has(candidate.mask) && aliases.length > 0) {
          for (const [left, right] of aliases) {
            const leftMoment = targetMoments[
              this.processWindow[left].pullbackMask(candidate.mask)
            ];
            const rightMoment = targetMoments[
              this.processWindow[right].pullbackMask(candidate.mask)
            ];
            obstructionGain += Math.min(1, Math.abs(leftMoment - rightMoment));
          }
          obstructionGain /= aliases.length;
        }
        const score = residual + this.obstructionWeight * obstructionGain -
          this.complexityWeight * candidate.word.length;
        if (
          !best ||
          score > best.score + 1e-15 ||
          (Math.abs(score - best.score) < 1e-15 &&
            candidate.word.length < best.candidate.word.length) ||
          (Math.abs(score - best.score) < 1e-15 &&
            candidate.word.length === best.candidate.word.length &&
            candidate.mask < best.candidate.mask)
        ) {
          best = { candidate, score, residual, obstructionGain, dataMoment, modelMoment };
        }
      }

      const delta = Math.atanh(clampMoment(best.dataMoment)) -
        Math.atanh(clampMoment(best.modelMoment));
      probabilities = applyTilt(probabilities, best.candidate.mask, delta);
      if (!activeSet.has(best.candidate.mask)) {
        activeSet.add(best.candidate.mask);
        activeMasks.push(best.candidate.mask);
      }
      program.push({
        mask: best.candidate.mask,
        seedBit: best.candidate.seedBit,
        derivationWord: [...best.candidate.word],
        delta,
        residual: best.residual,
        obstructionGain: best.obstructionGain,
      });
      const separation = processSeparation(
        activeMasks,
        this.processWindow,
        targetMoments,
        this.aliasTolerance,
      );
      diagnostics.push({
        step,
        selectedMask: best.candidate.mask,
        derivationLength: best.candidate.word.length,
        residual: best.residual,
        obstructionGain: best.obstructionGain,
        activeProbes: activeMasks.length,
        processSeparation: separation,
      });
      if (snapshotSteps.has(step)) snapshots.set(step, [...probabilities]);
    }

    return {
      probabilities,
      program,
      snapshots,
      diagnostics,
      activeMasks,
      candidateCount: this.candidates.length,
      processWindowSize: this.processWindow.length,
      finalProcessSeparation: diagnostics.at(-1)?.processSeparation ?? 0,
    };
  }
}
