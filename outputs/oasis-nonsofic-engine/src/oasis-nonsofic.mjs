import { LeavittF2Element } from "./leavitt-f2.mjs";
import { ExactCoefficientProbe } from "./regular-probes.mjs";
import { BayesianObstructionField } from "./bayesian-obstruction-field.mjs";

function normalize(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) throw new Error("Cannot normalize non-positive mass");
  return values.map((value) => value / total);
}

function clampMoment(value) {
  return Math.max(-1 + 1e-12, Math.min(1 - 1e-12, value));
}

function moment(probabilities, states, probe) {
  return probabilities.reduce(
    (sum, probability, index) => sum + probability * probe.evaluateSign(states[index]),
    0,
  );
}

function observableSignature(states, probe) {
  return states.map((state) => probe.evaluateSign(state)).join(",");
}

function tilt(probabilities, states, probe, delta) {
  const common = Math.abs(delta);
  return normalize(probabilities.map((probability, index) =>
    probability * Math.exp(delta * probe.evaluateSign(states[index]) - common),
  ));
}

function aliasPairs(activeProbes, processWindow, empirical, states, tolerance) {
  const signatures = processWindow.map((process) =>
    activeProbes.map((probe) => moment(empirical, states, probe.pullback(process))),
  );
  const pairs = [];
  for (let left = 0; left < signatures.length; left += 1) {
    for (let right = left + 1; right < signatures.length; right += 1) {
      const separated = signatures[left].some(
        (value, index) => Math.abs(value - signatures[right][index]) > tolerance,
      );
      if (!separated) pairs.push([left, right]);
    }
  }
  return pairs;
}

function processSeparation(activeProbes, processWindow, empirical, states, tolerance) {
  const total = processWindow.length * (processWindow.length - 1) / 2;
  if (total === 0) return 1;
  return 1 - aliasPairs(activeProbes, processWindow, empirical, states, tolerance).length / total;
}

function summarizeChallenge(challenge) {
  if (!challenge) return null;
  return {
    ...challenge,
    generatedProbes: (challenge.generatedProbes ?? []).map((probe) => probe.toProgramAtom()),
  };
}

export class NonSoficOasisEngine {
  constructor({
    groupOracle,
    obstructionGate,
    seedProbes,
    generatorNames,
    wordDepth = 2,
    wordLimit = 96,
    alpha = 0.25,
    localAliasWeight = 0.08,
    complexityWeight = 0.001,
    proofFieldWeight = 0.5,
    aliasTolerance = 1e-9,
  }) {
    this.groupOracle = groupOracle;
    this.obstructionGate = obstructionGate;
    this.seedProbes = [...seedProbes];
    this.generatorNames = [...generatorNames];
    this.wordDepth = wordDepth;
    this.wordLimit = wordLimit;
    this.alpha = alpha;
    this.localAliasWeight = localAliasWeight;
    this.complexityWeight = complexityWeight;
    this.proofFieldWeight = proofFieldWeight;
    this.aliasTolerance = aliasTolerance;
    this.committedPrograms = [];
  }

  compileFrontier() {
    const processWindow = this.groupOracle.enumerateWindow(
      this.generatorNames,
      this.wordDepth,
      this.wordLimit,
    );
    const candidates = new Map();
    for (const seed of this.seedProbes) {
      for (const process of processWindow) {
        const probe = seed.pullback(process);
        if (!candidates.has(probe.hash())) candidates.set(probe.hash(), probe);
      }
    }
    return { processWindow, candidates: [...candidates.values()] };
  }

  fit({
    states,
    counts,
    maxSteps = 24,
    mode = "local-alias",
    emulatorAudit = null,
    proofLedger = null,
  }) {
    if (states.length !== counts.length || states.length === 0) {
      throw new Error("States and counts must have the same nonzero length");
    }
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (!(total > 0)) throw new Error("At least one observation is required");
    const empirical = counts.map(
      (count) => (count + this.alpha) / (total + this.alpha * counts.length),
    );
    const frontier = this.compileFrontier();
    const candidateMap = new Map(
      frontier.candidates.map((candidate) => [candidate.hash(), candidate]),
    );
    let certifiedChallenge = null;
    if (mode === "certified-nonsofic") {
      certifiedChallenge = this.obstructionGate.challenge({
        emulatorAudit,
        states,
        groupOracle: this.groupOracle,
      });
    } else if (mode === "proof-obligation") {
      certifiedChallenge = this.obstructionGate.challenge({
        emulatorAudit,
        states,
        groupOracle: this.groupOracle,
      }, { requireGlobal: false });
    } else if (mode !== "local-alias") {
      throw new Error(`Unknown obstruction mode: ${mode}`);
    }
    // A proof certificate may generate several algebraically distinct probes
    // that are observationally identical on the current finite task. Preserve
    // them in the certificate, but install only one representative per exact
    // finite signature in the predictive frontier.
    const candidateSignatures = new Set(
      [...candidateMap.values()].map((candidate) => observableSignature(states, candidate)),
    );
    for (const generated of certifiedChallenge?.generatedProbes ?? []) {
      const signature = observableSignature(states, generated);
      if (candidateSignatures.has(signature)) continue;
      candidateMap.set(generated.hash(), generated);
      candidateSignatures.add(signature);
    }
    const proofField = certifiedChallenge
      ? new BayesianObstructionField()
        .observeOpenObligations(certifiedChallenge.openUniversalObligations)
        .observeViolation(certifiedChallenge.violation)
        .observeLedger(proofLedger)
      : null;
    const processWindow = frontier.processWindow;
    const candidates = [...candidateMap.values()];
    let probabilities = Array(states.length).fill(1 / states.length);
    const activeProbes = [];
    const activeHashes = new Set();
    const program = [];
    const diagnostics = [];

    for (let step = 1; step <= maxSteps; step += 1) {
      const aliases = aliasPairs(
        activeProbes,
        processWindow,
        empirical,
        states,
        this.aliasTolerance,
      );
      let best = null;
      for (const candidate of candidates) {
        const dataMoment = moment(empirical, states, candidate);
        const modelMoment = moment(probabilities, states, candidate);
        const residual = Math.abs(dataMoment - modelMoment) /
          Math.sqrt(Math.max(1e-9, 1 - modelMoment * modelMoment));
        let aliasGain = 0;
        if (!activeHashes.has(candidate.hash()) && aliases.length > 0) {
          for (const [left, right] of aliases) {
            const leftMoment = moment(
              empirical,
              states,
              candidate.pullback(processWindow[left]),
            );
            const rightMoment = moment(
              empirical,
              states,
              candidate.pullback(processWindow[right]),
            );
            aliasGain += Math.min(1, Math.abs(leftMoment - rightMoment));
          }
          aliasGain /= aliases.length;
        }
        const certifiedBonus = !activeHashes.has(candidate.hash()) &&
          certifiedChallenge?.preferredProbeHashes?.includes(candidate.hash())
          ? certifiedChallenge.weight ?? 1
          : 0;
        const proofInformationGain = certifiedBonus > 0 && proofField
          ? proofField.expectedInformationGain({
            proofStep: certifiedChallenge.violation?.proofStep ?? "finiteWords",
            modelMoment,
          })
          : 0;
        const proofPriorityContribution = certifiedBonus * proofInformationGain;
        const complexity = candidate.derivationWord.length;
        const score = residual + this.localAliasWeight * aliasGain +
          this.proofFieldWeight * proofPriorityContribution -
          this.complexityWeight * complexity;
        if (
          !best ||
          score > best.score + 1e-15 ||
          (Math.abs(score - best.score) < 1e-15 && complexity < best.complexity) ||
          (Math.abs(score - best.score) < 1e-15 &&
            complexity === best.complexity && candidate.hash() < best.candidate.hash())
        ) {
          best = {
            candidate,
            score,
            residual,
            aliasGain,
            certifiedBonus,
            proofInformationGain,
            proofPriorityContribution,
            complexity,
            dataMoment,
            modelMoment,
          };
        }
      }

      const delta = Math.atanh(clampMoment(best.dataMoment)) -
        Math.atanh(clampMoment(best.modelMoment));
      probabilities = tilt(probabilities, states, best.candidate, delta);
      if (!activeHashes.has(best.candidate.hash())) {
        activeHashes.add(best.candidate.hash());
        activeProbes.push(best.candidate);
      }
      program.push({
        ...best.candidate.toProgramAtom(),
        delta,
        residual: best.residual,
        aliasGain: best.aliasGain,
        certifiedBonus: best.certifiedBonus,
        proofInformationGain: best.proofInformationGain,
        proofPriorityContribution: best.proofPriorityContribution,
      });
      diagnostics.push({
        step,
        probeHash: best.candidate.hash(),
        residual: best.residual,
        aliasGain: best.aliasGain,
        proofInformationGain: best.proofInformationGain,
        proofPriorityContribution: best.proofPriorityContribution,
        activeProbeCount: activeProbes.length,
        processSeparation: processSeparation(
          activeProbes,
          processWindow,
          empirical,
          states,
          this.aliasTolerance,
        ),
      });
    }

    const replayed = this.replay(states, program);
    const replayDelta = Math.max(
      ...replayed.map((value, index) => Math.abs(value - probabilities[index])),
    );
    if (replayDelta >= 1e-15) throw new Error("Transaction replay verification failed");
    const committed = {
      group: this.groupOracle.theorem.group,
      mode,
      probabilities,
      empirical,
      program,
      diagnostics,
      replayDelta,
      candidateCount: candidates.length,
      processWindowSize: processWindow.length,
      obstructionStatus: this.obstructionGate.status(),
      obstructionChallenge: summarizeChallenge(certifiedChallenge),
      proofObstructionField: proofField?.snapshot() ?? null,
    };
    this.committedPrograms.push(committed);
    return committed;
  }

  replay(states, program) {
    let probabilities = Array(states.length).fill(1 / states.length);
    for (const operation of program) {
      const seed = new ExactCoefficientProbe({
        alpha: operation.alpha,
        beta: operation.beta,
      });
      const evaluatedWord = this.groupOracle.evaluate(operation.derivationWord);
      if (evaluatedWord.unit.element.hash() !== operation.processHash) {
        throw new Error("Probe process hash does not match exact derivation word");
      }
      const probe = seed.pullback(evaluatedWord);
      if (probe.hash() !== operation.probeHash) {
        throw new Error("Probe hash does not match exact pullback derivation");
      }
      probabilities = tilt(probabilities, states, probe, operation.delta);
    }
    return probabilities;
  }
}

export function klDivergence(target, predicted) {
  return target.reduce(
    (sum, probability, index) =>
      sum + (probability > 0
        ? probability * Math.log(probability / Math.max(predicted[index], 1e-300))
        : 0),
    0,
  );
}

export function makeSeedProbe(alpha, beta = "") {
  return new ExactCoefficientProbe({
    alpha,
    beta,
    leftMultiplier: LeavittF2Element.one(),
  });
}
