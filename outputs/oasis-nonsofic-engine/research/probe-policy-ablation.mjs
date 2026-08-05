import { pathToFileURL } from "node:url";

import { sWord } from "../src/leavitt-f2.mjs";
import { NINE_LEAF_CODE_D } from "../src/unit-group.mjs";
import {
  ExactNonSoficGroupOracle,
  NONSOFIC_THEOREM_METADATA,
} from "../src/group-oracle.mjs";
import { LeavittRegularState } from "../src/regular-probes.mjs";
import {
  FiniteEmulatorCritic,
  NonSoficObstructionGate,
  identityPermutation,
} from "../src/emulator-critic.mjs";
import { compileExpansionLefCertificate } from "../src/obstruction-certificate.mjs";
import { NonSoficOasisEngine, klDivergence, makeSeedProbe } from "../src/oasis-nonsofic.mjs";

function moment(probabilities, states, probe) {
  return probabilities.reduce(
    (sum, probability, index) => sum + probability * probe.evaluateSign(states[index]),
    0,
  );
}

function clampMoment(value) {
  return Math.max(-1 + 1e-12, Math.min(1 - 1e-12, value));
}

function tilt(probabilities, states, probe, delta) {
  const common = Math.max(...states.map((state) => delta * probe.evaluateSign(state)));
  const raw = probabilities.map((probability, index) => (
    probability * Math.exp(delta * probe.evaluateSign(states[index]) - common)
  ));
  const total = raw.reduce((sum, value) => sum + value, 0);
  return raw.map((value) => value / total);
}

function entropyBits(momentValue) {
  const probability = Math.max(1e-12, Math.min(1 - 1e-12, (1 + momentValue) / 2));
  return -probability * Math.log2(probability)
    - (1 - probability) * Math.log2(1 - probability);
}

function observableSignature(probe, states) {
  return states.map((state) => probe.evaluateSign(state)).join(",");
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function makeExperiment() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const obstructionGate = new NonSoficObstructionGate(NONSOFIC_THEOREM_METADATA);
  const certificate = compileExpansionLefCertificate(groupOracle);
  obstructionGate.installProofCertificate(certificate);
  const states = NINE_LEAF_CODE_D.map(
    (prefix) => new LeavittRegularState(sWord(prefix), `s_${prefix}`),
  );
  const generatorNames = [];
  for (let index = 1; index < NINE_LEAF_CODE_D.length; index += 1) {
    generatorNames.push(`x:0:${index}:1`, `x:${index}:0:1`);
  }
  const engine = new NonSoficOasisEngine({
    groupOracle,
    obstructionGate,
    seedProbes: [makeSeedProbe(NINE_LEAF_CODE_D[0])],
    generatorNames,
    wordDepth: 2,
    wordLimit: 64,
  });
  const energies = [1.2, -0.9, 0.35, 1.7, -1.1, 0.6, -0.4, 1.0, -0.2];
  const maximum = Math.max(...energies);
  const masses = energies.map((energy) => Math.exp(energy - maximum));
  const total = masses.reduce((sum, value) => sum + value, 0);
  const target = masses.map((value) => value / total);
  const counts = target.map((probability) => Math.max(1, Math.round(probability * 12000)));
  const countTotal = counts.reduce((sum, value) => sum + value, 0);
  const empirical = counts.map((count) => (count + 0.25) / (countTotal + 0.25 * counts.length));

  const critic = new FiniteEmulatorCritic(6);
  critic.assign(groupOracle.evaluate([]), identityPermutation(6), "identity");
  critic.assign(
    groupOracle.evaluate([{ generator: certificate.names.j[0], inverse: false }]),
    identityPermutation(6),
    "collapsed-j0",
  );
  const emulatorAudit = certificate.audit(critic);
  const challenge = obstructionGate.challenge({
    emulatorAudit,
    states,
    groupOracle,
  }, { requireGlobal: false });
  const frontier = engine.compileFrontier();
  const localCandidates = frontier.candidates;
  const expandedMap = new Map(localCandidates.map((probe) => [probe.hash(), probe]));
  for (const probe of challenge.generatedProbes) expandedMap.set(probe.hash(), probe);
  return {
    engine,
    states,
    target,
    counts,
    empirical,
    emulatorAudit,
    localCandidates,
    expandedCandidates: [...expandedMap.values()],
    preferredHashes: new Set(challenge.preferredProbeHashes),
    generatedProbeCount: challenge.generatedProbes.length,
    processWindowSize: frontier.processWindow.length,
  };
}

function runPolicy({
  experiment,
  policy,
  budget,
  seed = 1,
  obstructionBonus = 1,
}) {
  const candidates = policy.includes("obstruction")
    ? experiment.expandedCandidates
    : experiment.localCandidates;
  const random = mulberry32(seed);
  const remaining = new Map(candidates.map((probe) => [probe.hash(), probe]));
  let probabilities = Array(experiment.states.length).fill(1 / experiment.states.length);
  const selectedSignatures = new Set();
  const trace = [];
  for (let step = 1; step <= budget && remaining.size > 0; step += 1) {
    let chosen = null;
    let chosenScore = -Infinity;
    for (const probe of remaining.values()) {
      const modelMoment = moment(probabilities, experiment.states, probe);
      const entropy = entropyBits(modelMoment);
      const preferred = experiment.preferredHashes.has(probe.hash());
      const signature = observableSignature(probe, experiment.states);
      const signatureNovel = !selectedSignatures.has(signature);
      let score;
      if (policy === "random") score = random();
      else if (policy === "entropy") score = entropy;
      else if (policy === "novelty-gated-entropy") {
        score = signatureNovel ? entropy : -Infinity;
      }
      else if (policy === "obstruction-conditioned-entropy") {
        score = entropy + (preferred ? obstructionBonus : 0);
      } else if (policy === "gated-obstruction-entropy") {
        score = signatureNovel
          ? entropy * (1 + (preferred ? obstructionBonus : 0))
          : -Infinity;
      } else {
        throw new Error(`Unknown policy: ${policy}`);
      }
      if (
        score > chosenScore + 1e-15
        || (Math.abs(score - chosenScore) < 1e-15 && probe.hash() < chosen.probe.hash())
      ) {
        chosen = { probe, modelMoment, entropy, preferred, signature, signatureNovel };
        chosenScore = score;
      }
    }
    if (!chosen || chosenScore === -Infinity) break;
    remaining.delete(chosen.probe.hash());
    selectedSignatures.add(chosen.signature);
    const dataMoment = moment(experiment.empirical, experiment.states, chosen.probe);
    const delta = Math.atanh(clampMoment(dataMoment))
      - Math.atanh(clampMoment(chosen.modelMoment));
    probabilities = tilt(probabilities, experiment.states, chosen.probe, delta);
    trace.push({
      step,
      probeHash: chosen.probe.hash(),
      preferred: chosen.preferred,
      signatureNovel: chosen.signatureNovel,
      entropy: chosen.entropy,
      dataMoment,
      modelMoment: chosen.modelMoment,
      klToTarget: klDivergence(experiment.target, probabilities),
    });
  }
  return {
    policy,
    budget,
    seed,
    klToTarget: klDivergence(experiment.target, probabilities),
    selectedPreferredProbes: trace.filter((item) => item.preferred).length,
    selectedObservableSignatures: selectedSignatures.size,
    trace,
  };
}

function summarize(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return { mean, standardDeviation: Math.sqrt(variance), minimum: Math.min(...values) };
}

export function runProbePolicyAblation() {
  const experiment = makeExperiment();
  const budgets = [2, 4, 8, 12, 16];
  const deterministic = [];
  const random = [];
  const fullInformationFits = [];
  for (const budget of budgets) {
    deterministic.push(runPolicy({ experiment, policy: "entropy", budget }));
    deterministic.push(runPolicy({
      experiment,
      policy: "novelty-gated-entropy",
      budget,
    }));
    deterministic.push(runPolicy({
      experiment,
      policy: "obstruction-conditioned-entropy",
      budget,
    }));
    deterministic.push(runPolicy({
      experiment,
      policy: "gated-obstruction-entropy",
      budget,
    }));
    const trials = [];
    for (let seed = 1; seed <= 64; seed += 1) {
      trials.push(runPolicy({ experiment, policy: "random", budget, seed }).klToTarget);
    }
    random.push({ budget, trials: 64, klToTarget: summarize(trials) });
    for (const mode of ["local-alias", "proof-obligation"]) {
      const fit = experiment.engine.fit({
        states: experiment.states,
        counts: experiment.counts,
        maxSteps: budget,
        mode,
        emulatorAudit: mode === "proof-obligation" ? experiment.emulatorAudit : null,
      });
      fullInformationFits.push({
        mode,
        budget,
        candidateCount: fit.candidateCount,
        klToTarget: klDivergence(experiment.target, fit.probabilities),
        selectedProofPrioritySteps:
          fit.program.filter((operation) => operation.proofPriorityContribution > 0).length,
      });
    }
  }
  return {
    schema: "oasis.probe-policy-ablation.v1",
    semantics: "active-probe-selection-reveals-only-the-selected-target-moment",
    candidateCounts: {
      local: experiment.localCandidates.length,
      expanded: experiment.expandedCandidates.length,
      generatedByObstruction: experiment.generatedProbeCount,
    },
    processWindowSize: experiment.processWindowSize,
    deterministic: deterministic.map((result) => ({
      policy: result.policy,
      budget: result.budget,
      klToTarget: result.klToTarget,
      selectedPreferredProbes: result.selectedPreferredProbes,
      selectedObservableSignatures: result.selectedObservableSignatures,
    })),
    random,
    fullInformationFits,
    finalTraces: deterministic.filter((item) => (
      item.budget === budgets.at(-1)
      && ["obstruction-conditioned-entropy", "gated-obstruction-entropy"].includes(item.policy)
    )),
  };
}

if (
  typeof process !== "undefined"
  && process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runProbePolicyAblation(), null, 2));
}
