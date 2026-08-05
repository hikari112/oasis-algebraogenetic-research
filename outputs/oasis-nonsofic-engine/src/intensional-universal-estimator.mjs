import { BayesianObstructionField } from "./bayesian-obstruction-field.mjs";
import { exactFiniteDistributionReadout } from "./finite-universal-readout.mjs";

function assertIndex(index, size) {
  if (!Number.isInteger(index) || index < 0 || index >= size) {
    throw new Error(`Outcome index must be an integer in [0, ${size})`);
  }
}

function assertPositiveFinite(value, name) {
  if (!(Number.isFinite(value) && value > 0)) {
    throw new Error(`${name} must be finite and positive`);
  }
}

function integerSquareRoot(value) {
  if (value < 0n) throw new Error("Integer square root requires a nonnegative integer");
  if (value < 2n) return value;
  let estimate = 1n << BigInt(Math.ceil(value.toString(2).length / 2));
  while (true) {
    const next = (estimate + value / estimate) >> 1n;
    if (next >= estimate) return estimate;
    estimate = next;
  }
}

function normalizeMasses(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) throw new Error("Probability masses must have positive total");
  return values.map((value) => value / total);
}

// An irrational is retained as an evaluation program. Each call returns a
// certified rational interval; no floating-point value is treated as its state.
export class ComputableSquareRoot {
  constructor(radicand) {
    if (!Number.isSafeInteger(radicand) || radicand <= 0) {
      throw new Error("Radicand must be a positive safe integer");
    }
    const root = Math.trunc(Math.sqrt(radicand));
    if (root * root === radicand) throw new Error("Use a nonsquare radicand");
    this.radicand = BigInt(radicand);
  }

  interval(bits = 40) {
    if (!Number.isInteger(bits) || bits < 1 || bits > 52) {
      throw new Error("Precision must be an integer from 1 through 52 bits");
    }
    const denominator = 1n << BigInt(bits);
    const scaled = this.radicand * denominator * denominator;
    const lowerNumerator = integerSquareRoot(scaled);
    const upperNumerator = lowerNumerator + 1n;
    return {
      schema: "oasis.computable-real-interval.v1",
      program: `sqrt(${this.radicand})`,
      bits,
      lower: `${lowerNumerator}/${denominator}`,
      upper: `${upperNumerator}/${denominator}`,
      width: `1/${denominator}`,
      midpoint: Number(lowerNumerator + upperNumerator) / (2 * Number(denominator)),
    };
  }
}

// The memory contains a presentation trace, not a learned finite transition
// table. Canonical hashes are computed by the exact group oracle after every
// append, so algebraically equal histories share a context automatically.
export class ExactIntensionalMemory {
  constructor(groupOracle) {
    this.groupOracle = groupOracle;
    this.tokens = [];
    this.prefixes = [groupOracle.evaluate([])];
  }

  append(word) {
    const tokens = Array.isArray(word) ? word : [word];
    this.tokens.push(...tokens.map((token) => (
      typeof token === "string" ? { generator: token, inverse: false } : { ...token }
    )));
    const evaluated = this.groupOracle.evaluate(this.tokens);
    this.prefixes.push(evaluated);
    return this.current();
  }

  current() {
    const evaluated = this.prefixes.at(-1);
    return {
      wordLength: this.tokens.length,
      exactHash: evaluated.hash,
      isIdentity: evaluated.isIdentity,
      tokens: evaluated.tokens.map((token) => ({ ...token })),
    };
  }

  compose(left, right) {
    return this.groupOracle.evaluate([...left, ...right]);
  }

  verify() {
    const recomputed = this.groupOracle.evaluate(this.tokens);
    const committed = this.prefixes.at(-1);
    return {
      exact: recomputed.hash === committed.hash && recomputed.unit.equals(committed.unit),
      exactHash: recomputed.hash,
      prefixCommitments: this.prefixes.length,
    };
  }
}

export class IntensionalNonSoficUniversalEstimator {
  constructor({
    groupOracle,
    obstructionGate,
    states,
    prefixes,
    alpha = 0.5,
  }) {
    if (states.length === 0 || states.length !== prefixes.length) {
      throw new Error("States and distinct readout prefixes must have equal nonzero length");
    }
    if (new Set(prefixes).size !== prefixes.length) {
      throw new Error("Readout prefixes must be distinct");
    }
    assertPositiveFinite(alpha, "Dirichlet concentration alpha");
    this.groupOracle = groupOracle;
    this.obstructionGate = obstructionGate;
    this.states = [...states];
    this.prefixes = [...prefixes];
    this.alpha = alpha;
    this.contexts = new Map();
    this.probes = new Map();
    this.obstructionFaces = [];
    this.memory = new ExactIntensionalMemory(groupOracle);
  }

  exactContext(word) {
    return this.groupOracle.evaluate(word);
  }

  contextRecord(word) {
    const evaluated = this.exactContext(word);
    let record = this.contexts.get(evaluated.hash);
    if (!record) {
      record = {
        exactHash: evaluated.hash,
        representativeWord: evaluated.tokens.map((token) => ({ ...token })),
        counts: Array(this.states.length).fill(0),
        observationMass: 0,
      };
      this.contexts.set(evaluated.hash, record);
    }
    return record;
  }

  observe({ word = [], outcome, weight = 1 }) {
    assertIndex(outcome, this.states.length);
    assertPositiveFinite(weight, "Observation weight");
    const record = this.contextRecord(word);
    record.counts[outcome] += weight;
    record.observationMass += weight;
    return {
      exactContextHash: record.exactHash,
      observationMass: record.observationMass,
    };
  }

  posterior(word = []) {
    const record = this.contextRecord(word);
    const denominator = record.observationMass + this.alpha * this.states.length;
    return record.counts.map((count) => (count + this.alpha) / denominator);
  }

  predict(word = []) {
    const evaluated = this.exactContext(word);
    const probabilities = this.posterior(word);
    const readout = exactFiniteDistributionReadout(this.prefixes, probabilities);
    return {
      schema: "oasis.intensional-query-prediction.v1",
      exactContextHash: evaluated.hash,
      representativeWord: evaluated.tokens.map((token) => ({ ...token })),
      probabilities,
      universalReadout: readout,
      internalRepresentation: "exact-presentation-not-finite-emulator",
    };
  }

  compileUniversalChart({ word = [], targetMasses }) {
    const evaluated = this.exactContext(word);
    const normalized = normalizeMasses(targetMasses);
    return {
      schema: "oasis.query-local-universal-chart.v1",
      exactContextHash: evaluated.hash,
      scope: "exact-on-requested-finite-positive-distribution",
      chart: exactFiniteDistributionReadout(this.prefixes, normalized),
    };
  }

  confrontFiniteEmulator({ emulatorAudit, proofLedger = null }) {
    const challenge = this.obstructionGate.challenge({
      emulatorAudit,
      states: this.states,
      groupOracle: this.groupOracle,
    }, { requireGlobal: false });
    const field = new BayesianObstructionField()
      .observeOpenObligations(challenge.openUniversalObligations)
      .observeViolation(challenge.violation)
      .observeLedger(proofLedger);
    const newProbeHashes = [];
    for (const probe of challenge.generatedProbes ?? []) {
      if (!this.probes.has(probe.hash())) {
        this.probes.set(probe.hash(), probe);
        newProbeHashes.push(probe.hash());
      }
    }
    const face = {
      index: this.obstructionFaces.length,
      outcome: challenge.outcome,
      violation: challenge.violation ?? null,
      newProbeHashes,
      posteriorRouting: field.snapshot(),
      emulatorAdoptedAsInternalState: false,
      certifiedUniversalNonSoficity: challenge.certifiedUniversalNonSoficity,
    };
    this.obstructionFaces.push(face);
    return face;
  }

  snapshot() {
    return {
      schema: "oasis.intensional-nonsofic-universal-estimator.v1",
      group: this.groupOracle.theorem.group,
      semantics: {
        internal: "exact-computable-presentation",
        external: "query-local-Bayesian-distributions",
        refinement: "counterexample-guided-obstruction-probes",
      },
      exactContextCount: this.contexts.size,
      installedProbeCount: this.probes.size,
      obstructionFaceCount: this.obstructionFaces.length,
      globalEffectiveNonSoficWitnessInstalled:
        this.obstructionGate.status().operationalNonSoficChallenge,
      memory: this.memory.verify(),
    };
  }
}
