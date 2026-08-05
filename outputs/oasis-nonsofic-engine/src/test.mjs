import assert from "node:assert/strict";
import {
  LEAVITT_GENERATORS,
  LeavittF2Element,
  sWord,
} from "./leavitt-f2.mjs";
import {
  NINE_LEAF_CODE_D,
  makeNonSoficGenerators,
  prefixReplacementUnit,
  validateCompletePrefixCode,
} from "./unit-group.mjs";
import {
  ExactNonSoficGroupOracle,
  NONSOFIC_THEOREM_METADATA,
} from "./group-oracle.mjs";
import {
  ExactCoefficientProbe,
  LeavittRegularState,
} from "./regular-probes.mjs";
import {
  FiniteEmulatorCritic,
  NonSoficObstructionGate,
  identityPermutation,
} from "./emulator-critic.mjs";
import {
  NonSoficOasisEngine,
  klDivergence,
  makeSeedProbe,
} from "./oasis-nonsofic.mjs";
import { makeGammaGenerators, verifyProofConfiguration } from "./proof-configuration.mjs";
import { compileExpansionLefCertificate } from "./obstruction-certificate.mjs";
import { buildCertificateManifest } from "./certificate-manifest.mjs";
import { proofSpectralBounds } from "./kazhdan-bounds.mjs";
import {
  trivialLaplacianSquareCertificate,
  verifySosCertificate,
} from "./sos-verifier.mjs";
import { optimizeExpansionLefBudget } from "./proof-error-ledger.mjs";
import { BayesianObstructionField } from "./bayesian-obstruction-field.mjs";
import { exactFiniteDistributionReadout } from "./finite-universal-readout.mjs";
import { buildGammaSosProblem } from "./export-sos-problem.mjs";
import {
  regularSimplexRadiusOneDual,
  verifyRegularSimplexRadiusOneDual,
} from "./sos-dual-verifier.mjs";
import {
  evaluateGammaMatrixWord,
  gammaMatrixGeneratorsFromUnits,
} from "./gamma-matrix3.mjs";

const { one, s0, s1, t0, t1 } = LEAVITT_GENERATORS;

const universalReadout = exactFiniteDistributionReadout(
  NINE_LEAF_CODE_D,
  [1, 2, 3, 5, 8, 13, 21, 34, 55],
);
assert.equal(universalReadout.isKronecker, true);
assert.equal(universalReadout.supportSize, 9);
assert(universalReadout.maximumError < 1e-15);
const gammaRadiusOneProblem = buildGammaSosProblem();
const exactRadiusOneDual = regularSimplexRadiusOneDual(gammaRadiusOneProblem);
const exactRadiusOneDualAudit = verifyRegularSimplexRadiusOneDual(
  gammaRadiusOneProblem,
  exactRadiusOneDual,
);
assert.equal(exactRadiusOneDualAudit.exact, true);
assert.equal(exactRadiusOneDualAudit.rank, 29);
assert.equal(exactRadiusOneDualAudit.deltaPairing, "29/2");
assert.equal(exactRadiusOneDualAudit.deltaSquaredPairing, "0/1");
assert.equal(exactRadiusOneDualAudit.excludesEveryPositiveLambda, true);

// The faster 3-by-3 Leavitt matrix model has exactly the same equality classes
// as the embedded Gamma units on the complete radius-two ball.
const gammaMatrixUnits = makeGammaGenerators();
const gammaMatrixNames = gammaMatrixUnits.map((_, index) => `matrix:gamma:${index}`);
const gammaMatrixOracle = new ExactNonSoficGroupOracle(new Map());
gammaMatrixUnits.forEach((unit, index) => {
  gammaMatrixOracle.registerGenerator(gammaMatrixNames[index], unit);
});
const gammaMatrices = gammaMatrixGeneratorsFromUnits(gammaMatrixUnits);
const embeddedToMatrix = new Map();
const matrixToEmbedded = new Map();
const radiusTwoWords = [
  [],
  ...gammaMatrixNames.map((generator) => [{ generator, inverse: false }]),
  ...gammaMatrixNames.flatMap((left) => gammaMatrixNames.map((right) => [
    { generator: left, inverse: false },
    { generator: right, inverse: false },
  ])),
];
for (const radiusTwoWord of radiusTwoWords) {
  const embeddedHash = gammaMatrixOracle.evaluate(radiusTwoWord).hash;
  const matrixHash = evaluateGammaMatrixWord(
    radiusTwoWord,
    gammaMatrixNames,
    gammaMatrices,
  ).hash();
  if (embeddedToMatrix.has(embeddedHash)) {
    assert.equal(embeddedToMatrix.get(embeddedHash), matrixHash);
  }
  if (matrixToEmbedded.has(matrixHash)) {
    assert.equal(matrixToEmbedded.get(matrixHash), embeddedHash);
  }
  embeddedToMatrix.set(embeddedHash, matrixHash);
  matrixToEmbedded.set(matrixHash, embeddedHash);
}
assert.equal(embeddedToMatrix.size, 679);
assert.equal(matrixToEmbedded.size, 679);

// Defining Leavitt relations from the paper.
assert(t0.multiply(s0).equals(one));
assert(t1.multiply(s1).equals(one));
assert(t0.multiply(s1).isZero());
assert(t1.multiply(s0).isZero());
assert(s0.multiply(t0).add(s1.multiply(t1)).equals(one));

// Prefix refinement identity s_b t_a = s_b0 t_a0 + s_b1 t_a1.
for (const [a, b] of [["", ""], ["0", "10"], ["101", "01"]]) {
  assert(
    LeavittF2Element.basis(b, a).equals(
      LeavittF2Element.basis(`${b}0`, `${a}0`).add(
        LeavittF2Element.basis(`${b}1`, `${a}1`),
      ),
    ),
  );
}

// Associativity stress over exact normal forms.
const elements = [
  one, s0, s1, t0, t1,
  s0.add(t1),
  s1.multiply(t0).add(one),
  s0.multiply(t0),
  s1.multiply(t1),
];
for (const left of elements) {
  for (const middle of elements) {
    for (const right of elements) {
      assert(left.multiply(middle).multiply(right).equals(left.multiply(middle.multiply(right))));
    }
  }
}

// The paper's example exchanging [0] and [10] while fixing [11].
const exampleUnit = prefixReplacementUnit(
  ["0", "10", "11"],
  ["10", "0", "11"],
  "paper-example",
);
assert(exampleUnit.assertUnit());
assert(exampleUnit.element.multiply(sWord("001")).equals(sWord("1001")));
assert(exampleUnit.element.multiply(sWord("101")).equals(sWord("01")));
assert(exampleUnit.element.multiply(sWord("110")).equals(sWord("110")));
const refinedExample = prefixReplacementUnit(
  ["00", "01", "10", "11"],
  ["100", "101", "0", "11"],
  "paper-example-refined",
);
assert(exampleUnit.equals(refinedExample));

assert(validateCompletePrefixCode(NINE_LEAF_CODE_D));
const generators = makeNonSoficGenerators();
assert.equal(generators.size, 360);
for (const generator of generators.values()) {
  assert(generator.element.multiply(generator.element).equals(one));
}

const groupOracle = new ExactNonSoficGroupOracle(generators);
const generatorNames = [
  "x:0:1:1", "x:1:0:1", "x:0:2:s0", "x:2:0:t1",
];
const word = generatorNames.map((generator) => ({ generator, inverse: false }));
assert(groupOracle.equalWords(
  [...word, ...groupOracle.inverseWord(word)],
  [],
));

// Pullbacks compose through exact group multiplication.
const seedProbe = new ExactCoefficientProbe({ alpha: NINE_LEAF_CODE_D[0], beta: "" });
const first = groupOracle.evaluate([generatorNames[0]]);
const second = groupOracle.evaluate([generatorNames[1]]);
const sequentialProbe = seedProbe.pullback(first).pullback(second);
const composedProbe = seedProbe.pullback(groupOracle.evaluate([generatorNames[0], generatorNames[1]]));
assert.equal(sequentialProbe.hash(), composedProbe.hash());

// A deliberately bad finite emulator is exposed, not adopted as the group engine.
const window = groupOracle.enumerateWindow(generatorNames.slice(0, 2), 2, 7);
const critic = new FiniteEmulatorCritic(5);
for (let index = 0; index < window.length; index += 1) {
  const shift = index % 5;
  critic.assign(
    window[index],
    Array.from({ length: 5 }, (_, point) => (point + shift) % 5),
    `w${index}`,
  );
}
const audit = critic.audit(groupOracle);
assert(audit.maximumMultiplicationDefect > 0 || audit.aliases.length > 0);

const gate = new NonSoficObstructionGate(NONSOFIC_THEOREM_METADATA);
assert.equal(gate.status().theoremBackedGroup, true);
assert.equal(gate.status().operationalNonSoficChallenge, false);
assert.throws(() => gate.challenge(audit), /no effective finite obstruction witness/);

const proofConfiguration = verifyProofConfiguration();
assert.equal(proofConfiguration.uIsUnit, true);
assert.equal(proofConfiguration.vIsUnit, true);
assert.equal(proofConfiguration.contractionsAgreeOnAlpha, true);
assert.equal(proofConfiguration.gammaJCommute, true);
assert.equal(proofConfiguration.gamma.length, 30);
assert.equal(proofConfiguration.j.length, 2);

// Compile the paper's expansion/LEF contradiction into an executable, honest
// proof-obligation certificate. Its finite audits run now; the universal
// constants remain explicitly open.
const certificate = compileExpansionLefCertificate(groupOracle);
assert.equal(groupOracle.generators.size, 394);
assert.equal(certificate.relations.length, 71);
assert.equal(certificate.finiteWords.length, 314);
const spectralBounds = proofSpectralBounds();
assert.equal(spectralBounds.gamma.generatorCount, 30);
assert.equal(spectralBounds.ambientG.generatorCount, 360);
assert(spectralBounds.gamma.decimalLowerBound > 0);
assert(spectralBounds.ambientG.decimalLowerBound > 0);
assert.equal(certificate.status().finiteAuditExecutable, true);
assert.equal(certificate.status().activeProbeSynthesis, true);
assert.equal(certificate.status().globallyEffective, false);
assert(certificate.status().openObligations.includes("effective-kun-locality-radius"));
assert(!certificate.status().openObligations.includes("gamma-kazhdan-spectral-bound"));
assert(!certificate.status().openObligations.includes("finite-thompson-v-lef-obstruction"));
assert(certificate.finiteLefObstruction.finiteSetSize > 0);
assert.equal(certificate.finiteLefObstruction.presentation.relators.length, 7);
const sosSmoke = verifySosCertificate(
  groupOracle,
  certificate.names.gamma,
  trivialLaplacianSquareCertificate(certificate.names.gamma),
);
assert.equal(sosSmoke.exactIdentity, true);
assert.equal(sosSmoke.positiveSpectralGap, false);
assert.equal(sosSmoke.sufficientLocalMultiplicationRadius, 4);
assert.throws(
  () => verifySosCertificate(groupOracle, certificate.names.gamma, {
    lambda: "1/1000000",
    squares: trivialLaplacianSquareCertificate(certificate.names.gamma).squares,
  }),
  /SOS identity failed/,
);
const optimizedLedger = optimizeExpansionLefBudget({
  gammaExpansion: 0.2,
  ambientExpansion: 0.15,
  transportBoundaryFractions: [1e-7, 1e-7],
  totalVariationFraction: 1e-7,
  selectedComponentBadFraction: 1e-7,
  gammaEditFraction: 1e-7,
  maximumWordLength: 8,
  clusterAlmostAutomorphismError: 1e-7,
});
assert.equal(optimizedLedger.schema, "oasis.expansion-lef-error-ledger.v1");
assert.equal(optimizedLedger.admissible, true);
assert(optimizedLedger.probePriority.length >= 6);
const obstructionField = new BayesianObstructionField()
  .observeOpenObligations(certificate.status().openObligations)
  .observeViolation({
    proofStep: "finite-thompson-v-lef-obstruction",
    severity: 1,
  })
  .observeLedger(optimizedLedger);
const fieldSnapshot = obstructionField.snapshot();
assert.equal(fieldSnapshot.semantics, "epistemic-probe-routing-not-theorem-probability");
assert.equal(fieldSnapshot.ranking[0].stage, "finiteLef");
assert(
  obstructionField.expectedInformationGain({
    proofStep: "finite-thompson-v-lef-obstruction",
    modelMoment: 0,
  }) > obstructionField.expectedInformationGain({
    proofStep: "finite-thompson-v-lef-obstruction",
    modelMoment: 0.999,
  }),
);
assert(certificate.toJSON().exactConfiguration.relations.length > 0);
const serializedManifest = JSON.parse(JSON.stringify(buildCertificateManifest()));
assert.equal(serializedManifest.schema, "oasis.expansion-lef.v1");
assert.equal(serializedManifest.status.globallyEffective, false);
gate.installProofCertificate(certificate);
assert.equal(gate.status().operationalProofObligationChallenge, true);
assert.equal(gate.status().operationalNonSoficChallenge, false);

// End-to-end learning on the exact regular action of the non-sofic group.
const states = NINE_LEAF_CODE_D.map(
  (prefix) => new LeavittRegularState(sWord(prefix), `s_${prefix}`),
);
const certificateCritic = new FiniteEmulatorCritic(6);
certificateCritic.assign(groupOracle.evaluate([]), identityPermutation(6), "identity");
certificateCritic.assign(
  groupOracle.evaluate([{ generator: certificate.names.j[0], inverse: false }]),
  identityPermutation(6),
  "collapsed-j0",
);
const certificateAudit = certificate.audit(certificateCritic);
assert.equal(
  certificateAudit.lefObstructionAudit.finiteSetSize,
  certificate.finiteLefObstruction.finiteSetSize,
);
assert.equal(certificateAudit.lefObstructionAudit.fullyCovered, false);
assert(certificateAudit.lefObstructionAudit.collisions.length > 0);
const distinctnessFailure = certificateAudit.relationChecks.find(
  (check) => check.id === "j-nonidentity-0",
);
assert.equal(distinctnessFailure.covered, true);
assert.equal(distinctnessFailure.collisionFraction, 1);
const relationCritic = new FiniteEmulatorCritic(6);
relationCritic.assign(
  groupOracle.evaluate([{ generator: certificate.names.j[0], inverse: false }]),
  [1, 2, 3, 4, 0, 5],
  "wrong-order-j-u",
);
const relationAudit = certificate.audit(relationCritic);
assert(
  relationAudit.relationChecks.find(
    (check) => check.id === "bleak-quick-relator-1",
  ).defect > 0,
);
const proofChallenge = gate.challenge({
  emulatorAudit: certificateAudit,
  states,
  groupOracle,
}, { requireGlobal: false });
assert.equal(proofChallenge.outcome, "finite-proof-obligation-violated");
assert.equal(proofChallenge.certifiedUniversalNonSoficity, false);
assert(proofChallenge.generatedProbes.length >= 2);
assert(proofChallenge.probeEvidence.some((item) => item.leftBit !== item.rightBit));

// The Step-5 boundary checker computes the exact finite Cheeger profile for
// small emulator components, including a concrete minimizing subset.
const expansionCritic = new FiniteEmulatorCritic(5);
const fiveCycle = [1, 2, 3, 4, 0];
for (const gammaName of certificate.names.gamma) {
  expansionCritic.assign(
    groupOracle.evaluate([{ generator: gammaName, inverse: false }]),
    fiveCycle,
    gammaName,
  );
}
const expansionAudit = expansionCritic.auditExpansion(groupOracle, certificate.gammaWords);
assert.equal(expansionAudit.covered, true);
assert.equal(expansionAudit.componentCount, 1);
assert(expansionAudit.minimumNonvacuousExpansion > 0);
assert(expansionAudit.components[0].witness.length > 0);
const learningGenerators = [];
for (let index = 1; index < NINE_LEAF_CODE_D.length; index += 1) {
  learningGenerators.push(`x:0:${index}:1`, `x:${index}:0:1`);
}
const engine = new NonSoficOasisEngine({
  groupOracle,
  obstructionGate: gate,
  seedProbes: [makeSeedProbe(NINE_LEAF_CODE_D[0])],
  generatorNames: learningGenerators,
  wordDepth: 2,
  wordLimit: 64,
});
const energies = [1.2, -0.9, 0.35, 1.7, -1.1, 0.6, -0.4, 1.0, -0.2];
const maximum = Math.max(...energies);
const masses = energies.map((energy) => Math.exp(energy - maximum));
const massTotal = masses.reduce((sum, value) => sum + value, 0);
const target = masses.map((value) => value / massTotal);
const counts = target.map((probability) => Math.max(1, Math.round(probability * 12000)));
const fit = engine.fit({ states, counts, maxSteps: 16 });
assert(fit.replayDelta < 1e-15);
assert(klDivergence(target, fit.probabilities) < 0.01);
assert.equal(fit.obstructionStatus.theoremBackedGroup, true);
assert.equal(fit.obstructionStatus.operationalNonSoficChallenge, false);

const proofDrivenFit = engine.fit({
  states,
  counts,
  maxSteps: 4,
  mode: "proof-obligation",
  emulatorAudit: certificateAudit,
});
assert.equal(
  proofDrivenFit.obstructionChallenge.outcome,
  "finite-proof-obligation-violated",
);
assert(proofDrivenFit.program.some((operation) => operation.certifiedBonus > 0));
assert(proofDrivenFit.program.some((operation) => operation.proofInformationGain > 0));
assert.equal(
  proofDrivenFit.proofObstructionField.semantics,
  "epistemic-probe-routing-not-theorem-probability",
);
assert(proofDrivenFit.candidateCount > fit.candidateCount);
assert(proofDrivenFit.replayDelta < 1e-15);

const corrupted = fit.program.map((operation) => ({
  ...operation,
  derivationWord: operation.derivationWord.map((token) => ({ ...token })),
}));
corrupted[0].derivationWord.push({ generator: learningGenerators[0], inverse: false });
assert.throws(() => engine.replay(states, corrupted), /does not match exact derivation word/);
assert.throws(
  () => engine.fit({ states, counts, maxSteps: 1, mode: "certified-nonsofic", emulatorAudit: audit }),
  /no effective finite obstruction witness/,
);

console.log("Exact non-sofic OASIS engine tests passed.");
