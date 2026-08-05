import assert from "node:assert/strict";

import { sWord } from "./leavitt-f2.mjs";
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
  ComputableSquareRoot,
  ExactIntensionalMemory,
  IntensionalNonSoficUniversalEstimator,
} from "./intensional-universal-estimator.mjs";

const irrational = new ComputableSquareRoot(2);
const interval16 = irrational.interval(16);
const interval48 = irrational.interval(48);
assert(interval48.midpoint > 1.4142 && interval48.midpoint < 1.4143);
assert(Number(interval48.width.split("/")[1]) > Number(interval16.width.split("/")[1]));

const oracle = new ExactNonSoficGroupOracle();
const gate = new NonSoficObstructionGate(NONSOFIC_THEOREM_METADATA);
const certificate = compileExpansionLefCertificate(oracle);
gate.installProofCertificate(certificate);
const states = NINE_LEAF_CODE_D.map(
  (prefix) => new LeavittRegularState(sWord(prefix), `s_${prefix}`),
);
const estimator = new IntensionalNonSoficUniversalEstimator({
  groupOracle: oracle,
  obstructionGate: gate,
  states,
  prefixes: NINE_LEAF_CODE_D,
  alpha: interval48.midpoint,
});

const j0 = { generator: certificate.names.j[0], inverse: false };
const j0Inverse = { generator: certificate.names.j[0], inverse: true };
const memory = new ExactIntensionalMemory(oracle);
memory.append(j0);
memory.append(j0Inverse);
assert.equal(memory.current().isIdentity, true);
assert.equal(memory.verify().exact, true);

const observations = [13, 1, 4, 9, 2, 7, 3, 11, 5];
for (let outcome = 0; outcome < observations.length; outcome += 1) {
  estimator.observe({ word: [j0], outcome, weight: observations[outcome] });
}
const prediction = estimator.predict([j0]);
assert(prediction.universalReadout.maximumError < 1e-15);
assert.equal(prediction.internalRepresentation, "exact-presentation-not-finite-emulator");

const identityPrediction = estimator.predict([]);
const cancelledPrediction = estimator.predict([j0, j0Inverse]);
assert.equal(identityPrediction.exactContextHash, cancelledPrediction.exactContextHash);

const irrationalChart = estimator.compileUniversalChart({
  word: [j0],
  targetMasses: [interval48.midpoint, 1, 2, 3, 5, 8, 13, 21, 34],
});
assert(irrationalChart.chart.maximumError < 1e-15);

const critic = new FiniteEmulatorCritic(6);
critic.assign(oracle.evaluate([]), identityPermutation(6), "identity");
critic.assign(oracle.evaluate([j0]), identityPermutation(6), "collapsed-j0");
const audit = certificate.audit(critic);
const face = estimator.confrontFiniteEmulator({ emulatorAudit: audit });
assert(face.newProbeHashes.length > 0);
assert.equal(face.emulatorAdoptedAsInternalState, false);
assert.equal(face.certifiedUniversalNonSoficity, false);

const snapshot = estimator.snapshot();
assert(snapshot.exactContextCount >= 2);
assert(snapshot.installedProbeCount > 0);
assert.equal(snapshot.globalEffectiveNonSoficWitnessInstalled, false);

console.log(JSON.stringify({
  irrationalInterval: interval48,
  exactReplay: memory.verify(),
  predictionError: prediction.universalReadout.maximumError,
  queryLocalUniversalityError: irrationalChart.chart.maximumError,
  obstructionOutcome: face.outcome,
  newProbeCount: face.newProbeHashes.length,
  emulatorAdoptedAsInternalState: face.emulatorAdoptedAsInternalState,
  snapshot,
}, null, 2));
