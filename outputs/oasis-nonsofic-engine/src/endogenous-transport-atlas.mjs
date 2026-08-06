import { ExactIntensionalMemory } from "./intensional-universal-estimator.mjs";
import {
  composePermutations,
  identityPermutation,
  inversePermutation,
  normalizedHamming,
} from "./emulator-critic.mjs";

function cloneToken(token) {
  if (typeof token === "string") {
    return { generator: token, inverse: false };
  }
  if (!token || typeof token.generator !== "string") {
    throw new Error("Invalid transport token");
  }
  return { generator: token.generator, inverse: Boolean(token.inverse) };
}

function wordKey(word) {
  return JSON.stringify(word.map(cloneToken));
}

function equationKey(leftWord, rightWord) {
  const keys = [wordKey(leftWord), wordKey(rightWord)].sort();
  return `${keys[0]}=${keys[1]}`;
}

function log2Factorial(size) {
  let bits = 0;
  for (let value = 2; value <= size; value += 1) bits += Math.log2(value);
  return bits;
}

// A finite reversible causal encoder receives generator events, not an
// externally supplied endpoint address. Its state is the induced action on
// every latent anchor; scoring one privileged trajectory would not test the
// normalized-Hamming contract used by sofic approximation. Token/composition
// counters are audit instrumentation and are never read by the transition.
export class FiniteReversibleStreamEncoder {
  constructor({ size, generatorPermutations }) {
    if (!Number.isInteger(size) || size < 1) {
      throw new Error("Finite transport size must be a positive integer");
    }
    this.size = size;
    const entries = generatorPermutations instanceof Map
      ? [...generatorPermutations]
      : Object.entries(generatorPermutations);
    this.generators = new Map();
    for (const [name, permutation] of entries) {
      if (typeof name !== "string" || name.length === 0) {
        throw new Error("Generator names must be nonempty strings");
      }
      // Composition validates both the permutation and its size.
      composePermutations(identityPermutation(size), permutation);
      this.generators.set(name, [...permutation]);
    }
    this.reset();
  }

  reset() {
    this.permutation = identityPermutation(this.size);
    this.compositionCount = 0;
    this.auditTokensConsumed = 0;
    return this.snapshot();
  }

  consume(rawToken) {
    const token = cloneToken(rawToken);
    const direct = this.generators.get(token.generator);
    if (!direct) throw new Error(`No finite transport for ${token.generator}`);
    const update = token.inverse ? inversePermutation(direct) : direct;
    this.permutation = composePermutations(this.permutation, update);
    this.compositionCount += 1;
    this.auditTokensConsumed += 1;
    return this.snapshot();
  }

  consumeWord(word) {
    for (const token of word) this.consume(token);
    return this.snapshot();
  }

  endpoint(anchor) {
    if (!Number.isInteger(anchor) || anchor < 0 || anchor >= this.size) {
      throw new Error("Anchor is outside the finite latent set");
    }
    return this.permutation[anchor];
  }

  distanceFrom(other) {
    if (!(other instanceof FiniteReversibleStreamEncoder)) {
      throw new Error("Can only compare finite reversible stream encoders");
    }
    return normalizedHamming(this.permutation, other.permutation);
  }

  snapshot() {
    return {
      schema: "oasis.finite-reversible-stream-state.v1",
      size: this.size,
      actionDegree: this.size,
      tokensConsumed: this.auditTokensConsumed,
      compositionCount: this.compositionCount,
      permutation: [...this.permutation],
      singleAnchorStateBitsLowerBound: Math.ceil(Math.log2(this.size)),
      fullSymmetricGroupIndexBits: Math.ceil(log2Factorial(this.size)),
      currentPermutationTableBitsUpperBound:
        this.size * Math.ceil(Math.log2(this.size)),
      generatorTableEntries: this.generators.size * this.size,
      evaluatedOverAllAnchors: true,
      externalSemanticAddressBits: 0,
      instrumentationExcludedFromPredictiveState: [
        "tokensConsumed",
        "compositionCount",
      ],
    };
  }
}

// The adaptive layer is deliberately bidirectional. Distinct paths that a
// critic collapsed add separating observables; equal paths that it tore apart
// add quotient constraints. Algebraogenesis therefore changes both the
// observable algebra and the congruence by which histories are identified.
export class EndogenousTransportAtlas {
  constructor(groupOracle) {
    this.groupOracle = groupOracle;
    this.memory = new ExactIntensionalMemory(groupOracle);
    this.separatingProbes = new Map();
    this.separationConstraints = new Map();
    this.gluingConstraints = new Map();
    this.revisions = [];
  }

  consume(token) {
    return this.memory.append(token);
  }

  compare(leftWord, rightWord) {
    const left = this.groupOracle.evaluate(leftWord);
    const right = this.groupOracle.evaluate(rightWord);
    return {
      schema: "oasis.endogenous-transport-comparison.v1",
      equal: left.hash === right.hash,
      leftHash: left.hash,
      rightHash: right.hash,
      input: {
        leftWord: leftWord.map(cloneToken),
        rightWord: rightWord.map(cloneToken),
        externalSemanticAddressBits: 0,
      },
    };
  }

  applyChallenge(challenge) {
    if (!challenge || !challenge.refinementAction) {
      throw new Error("Challenge has no atlas-refinement action");
    }
    // Stage and exact-validate the entire revision before mutating atlas state.
    // A malformed late constraint must not leave probes or half a curriculum
    // installed without a corresponding revision record.
    const stagedProbes = [];
    const installedProbeHashes = [];
    for (const probe of challenge.generatedProbes ?? []) {
      const hash = probe.hash();
      stagedProbes.push([hash, probe]);
      installedProbeHashes.push(hash);
    }
    const installedSeparationKeys = [];
    let stagedSeparation = null;
    if (challenge.refinementAction.kind === "split") {
      const { leftWord, rightWord } = challenge.violation ?? {};
      if (!Array.isArray(leftWord) || !Array.isArray(rightWord)) {
        throw new Error("Split revision has no exact word pair");
      }
      if (this.groupOracle.equalWords(leftWord, rightWord)) {
        throw new Error("Refusing to split paths that are exactly equal");
      }
      const key = equationKey(leftWord, rightWord);
      if (this.gluingConstraints.has(key)) {
        throw new Error("Refusing a split that contradicts an installed glue constraint");
      }
      stagedSeparation = [key, {
        schema: "oasis.path-separation-constraint.v1",
        kind: "path-separation",
        leftWord: leftWord.map(cloneToken),
        rightWord: rightWord.map(cloneToken),
        targetCollisionFraction: 0,
        probeHashes: [...installedProbeHashes],
      }];
      installedSeparationKeys.push(key);
    }
    const installedConstraintKeys = [];
    const stagedGluing = [];
    for (const constraint of challenge.generatedConstraints ?? []) {
      if (!this.groupOracle.equalWords(constraint.leftWord, constraint.rightWord)) {
        throw new Error("Refusing to install a gluing constraint for distinct exact paths");
      }
      const key = equationKey(constraint.leftWord, constraint.rightWord);
      if (
        this.separationConstraints.has(key) ||
        stagedSeparation?.[0] === key
      ) {
        throw new Error("Refusing a glue that contradicts an installed split constraint");
      }
      stagedGluing.push([key, structuredClone(constraint)]);
      installedConstraintKeys.push(key);
    }
    const refinementKind = challenge.refinementAction.kind;
    if (refinementKind === "split") {
      if (
        challenge.violation?.expect !== "distinct" ||
        stagedProbes.length === 0 ||
        stagedGluing.length !== 0 ||
        challenge.refinementAction.generatedProbeCount !== stagedProbes.length
      ) {
        throw new Error("A split revision must contain a coherent nonempty probe bundle");
      }
    } else if (refinementKind === "glue") {
      if (
        challenge.violation?.expect !== "equal" ||
        stagedProbes.length !== 0 ||
        stagedGluing.length === 0 ||
        challenge.refinementAction.generatedConstraintCount !== stagedGluing.length
      ) {
        throw new Error("A glue revision must contain a coherent nonempty constraint bundle");
      }
    } else {
      throw new Error("The atlas accepts only split or glue revisions");
    }
    for (const [hash, probe] of stagedProbes) this.separatingProbes.set(hash, probe);
    if (stagedSeparation) this.separationConstraints.set(...stagedSeparation);
    for (const [key, constraint] of stagedGluing) {
      this.gluingConstraints.set(key, constraint);
    }
    const revision = {
      index: this.revisions.length,
      kind: challenge.refinementAction.kind,
      violationKind: challenge.violation?.kind ?? null,
      installedProbeHashes,
      installedSeparationKeys,
      installedConstraintKeys,
    };
    this.revisions.push(revision);
    return revision;
  }

  scoreTransport({ leftWord, rightWord, leftPermutation, rightPermutation }) {
    const key = equationKey(leftWord, rightWord);
    const gluing = this.gluingConstraints.get(key) ?? null;
    const separation = this.separationConstraints.get(key) ?? null;
    if (gluing && separation) {
      throw new Error("Transport curriculum contains contradictory constraints");
    }
    if (!gluing && !separation) {
      return {
        schema: "oasis.transport-curriculum-score.v1",
        covered: false,
        key,
        loss: null,
      };
    }
    const distance = normalizedHamming(leftPermutation, rightPermutation);
    const expect = gluing ? "equal" : "distinct";
    return {
      schema: "oasis.transport-curriculum-score.v1",
      covered: true,
      key,
      expect,
      normalizedHammingDistance: distance,
      loss: expect === "equal" ? distance : 1 - distance,
      satisfied: expect === "equal" ? distance === 0 : distance === 1,
    };
  }

  curriculum() {
    return {
      schema: "oasis.bidirectional-transport-curriculum.v1",
      gluing: [...this.gluingConstraints.values()].map((item) => structuredClone(item)),
      separation: [...this.separationConstraints.values()].map(
        (item) => structuredClone(item),
      ),
      role: "operational-loss-interface-not-an-optimizer-or-congruence-closure",
    };
  }

  snapshot() {
    return {
      schema: "oasis.endogenous-transport-atlas.v1",
      exactMemory: this.memory.verify(),
      separatingProbeCount: this.separatingProbes.size,
      separationConstraintCount: this.separationConstraints.size,
      gluingConstraintCount: this.gluingConstraints.size,
      revisionCount: this.revisions.length,
      revisions: this.revisions.map((revision) => structuredClone(revision)),
      representation: "open-ended-exact-carrier-with-bidirectional-refinement",
      operationalRefinement:
        "registered constraints compile into candidate transport losses",
      externalSemanticAddressBits: 0,
    };
  }
}
