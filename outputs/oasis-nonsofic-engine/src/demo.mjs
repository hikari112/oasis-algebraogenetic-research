import { sWord } from "./leavitt-f2.mjs";
import { pathToFileURL } from "node:url";
import { NINE_LEAF_CODE_D } from "./unit-group.mjs";
import {
  ExactNonSoficGroupOracle,
  NONSOFIC_THEOREM_METADATA,
} from "./group-oracle.mjs";
import { LeavittRegularState } from "./regular-probes.mjs";
import {
  FiniteEmulatorCritic,
  NonSoficObstructionGate,
  identityPermutation,
} from "./emulator-critic.mjs";
import { compileExpansionLefCertificate } from "./obstruction-certificate.mjs";
import {
  NonSoficOasisEngine,
  klDivergence,
  makeSeedProbe,
} from "./oasis-nonsofic.mjs";
import { exactFiniteDistributionReadout } from "./finite-universal-readout.mjs";

export function runDemo() {
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
  const universalReadout = exactFiniteDistributionReadout(NINE_LEAF_CODE_D, target);
  const critic = new FiniteEmulatorCritic(6);
  critic.assign(groupOracle.evaluate([]), identityPermutation(6), "identity");
  critic.assign(
    groupOracle.evaluate([{ generator: certificate.names.j[0], inverse: false }]),
    identityPermutation(6),
    "collapsed-j0",
  );
  const emulatorAudit = certificate.audit(critic);
  const fit = engine.fit({
    states,
    counts,
    maxSteps: 16,
    mode: "proof-obligation",
    emulatorAudit,
  });
  return {
    group: groupOracle.theorem.group,
    exactElementaryGeneratorCount: 360,
    registeredExactGeneratorCount: groupOracle.generators.size,
    candidateCount: fit.candidateCount,
    processWindowSize: fit.processWindowSize,
    programSteps: fit.program.length,
    kl: klDivergence(target, fit.probabilities),
    replayDelta: fit.replayDelta,
    finalProcessSeparation: fit.diagnostics.at(-1).processSeparation,
    exactFiniteUniversalReadoutError: universalReadout.maximumError,
    obstructionStatus: fit.obstructionStatus,
    obstructionChallenge: {
      outcome: fit.obstructionChallenge.outcome,
      violation: fit.obstructionChallenge.violation,
      generatedProbeCount: fit.obstructionChallenge.generatedProbes.length,
      openUniversalObligations: fit.obstructionChallenge.openUniversalObligations,
    },
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runDemo(), null, 2));
}
