import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import { compileExpansionLefCertificate } from "../src/obstruction-certificate.mjs";
import {
  FiniteEmulatorCritic,
  composePermutations,
  identityPermutation,
  normalizedHamming,
} from "../src/emulator-critic.mjs";
import {
  EndogenousTransportAtlas,
  FiniteReversibleStreamEncoder,
} from "../src/endogenous-transport-atlas.mjs";
import { LeavittRegularState } from "../src/regular-probes.mjs";
import { sWord } from "../src/leavitt-f2.mjs";
import { NINE_LEAF_CODE_D } from "../src/unit-group.mjs";

function token(generator, inverse = false) {
  return { generator, inverse };
}

function translationPermutation(size, shift) {
  const normalized = ((shift % size) + size) % size;
  return Array.from({ length: size }, (_, point) => (point + normalized) % size);
}

function parity(value) {
  let bits = BigInt(value);
  let result = 0n;
  while (bits > 0n) {
    result ^= bits & 1n;
    bits >>= 1n;
  }
  return Number(result);
}

// For P,Q in Sym(Y), a uniformly random parity hash of the endpoint labels
// disagrees with probability d_H(P,Q)/2. This turns the global Hamming metric
// into a distribution of one-bit observable tasks whose individual evaluation
// cost is logarithmic in |Y|.
function recoverHammingFromParityObservables(left, right) {
  assert.equal(left.length, right.length);
  const seedBits = Math.ceil(Math.log2(left.length));
  const maskCount = 2 ** seedBits;
  let disagreements = 0;
  for (let anchor = 0; anchor < left.length; anchor += 1) {
    for (let mask = 0; mask < maskCount; mask += 1) {
      const bigMask = BigInt(mask);
      disagreements += parity(bigMask & BigInt(left[anchor])) !==
        parity(bigMask & BigInt(right[anchor])) ? 1 : 0;
    }
  }
  return {
    seedBits,
    anchorBits: seedBits,
    criticProbeBitsPerEpisode: 2 * seedBits,
    observableProgramCost: "O(log |Y|) after O(word length) transport",
    observableFamilySize: maskCount,
    exactEnumerationCost: "O(|Y| 2^ceil(log2 |Y|) log |Y|)",
    monteCarloFixedPairSampleComplexity:
      "independent of |Y| for fixed additive error and confidence",
    recoveredNormalizedHamming: 2 * disagreements / (left.length * maskCount),
  };
}

function streamFiniteWord(size, generators, word) {
  const encoder = new FiniteReversibleStreamEncoder({
    size,
    generatorPermutations: generators,
  });
  return encoder.consumeWord(word);
}

function streamExactWord(groupOracle, word) {
  const atlas = new EndogenousTransportAtlas(groupOracle);
  const replay = [];
  let prefixReplayChecks = 0;
  for (const item of word) {
    replay.push({ ...item });
    const incremental = atlas.consume(item);
    const equalInformationReplay = groupOracle.evaluate(replay);
    assert.equal(incremental.exactHash, equalInformationReplay.hash);
    assert.equal(incremental.isIdentity, equalInformationReplay.isIdentity);
    prefixReplayChecks += 1;
  }
  const verification = atlas.memory.verify();
  assert.equal(verification.exact, true);
  return {
    final: atlas.memory.current(),
    verification,
    prefixReplayChecks,
    rawHistoryBytes: Buffer.byteLength(JSON.stringify(replay)),
    serializedPublicStateBytes: Buffer.byteLength(JSON.stringify(atlas.memory.current())),
  };
}

function freeReduce(word) {
  const stack = [];
  for (const item of word) {
    const previous = stack.at(-1);
    if (previous && previous.generator === item.generator && previous.inverse !== item.inverse) {
      stack.pop();
    } else {
      stack.push({ ...item });
    }
  }
  return stack;
}

function auditExactStreams(groupOracle, obstruction) {
  const rows = obstruction.presentation.relators.map((relator) => {
    const streamed = streamExactWord(groupOracle, relator.operatorWord);
    assert.equal(streamed.final.isIdentity, true);
    return {
      id: relator.id,
      tokens: relator.operatorWord.length,
      prefixReplayChecks: streamed.prefixReplayChecks,
      exactIncrementalIdentity: streamed.final.isIdentity,
      equalInformationReplayIdentity: groupOracle.evaluate(relator.operatorWord).isIdentity,
      syntaxOnlyIdentity: freeReduce(relator.operatorWord).length === 0,
      rawHistoryBytes: streamed.rawHistoryBytes,
      serializedPublicStateBytes: streamed.serializedPublicStateBytes,
      exactStateCompositionCount: streamed.verification.stateCompositionCount,
      stateUpdateLeavittProductCount:
        streamed.verification.stateUpdateLeavittProductCount,
      replayVerificationLeavittProductCount:
        streamed.verification.replayVerificationLeavittProductCount,
    };
  });
  return {
    relationCount: rows.length,
    totalTokens: rows.reduce((sum, row) => sum + row.tokens, 0),
    totalPrefixReplayChecks: rows.reduce((sum, row) => sum + row.prefixReplayChecks, 0),
    exactIncrementalFailures: rows.filter((row) => !row.exactIncrementalIdentity).length,
    equalInformationReplayFailures: rows.filter(
      (row) => !row.equalInformationReplayIdentity,
    ).length,
    syntaxOnlyFailures: rows.filter((row) => !row.syntaxOnlyIdentity).length,
    maximumRawHistoryBytes: Math.max(...rows.map((row) => row.rawHistoryBytes)),
    maximumSerializedPublicStateBytes: Math.max(
      ...rows.map((row) => row.serializedPublicStateBytes),
    ),
    maximumStateUpdateLeavittProducts: Math.max(
      ...rows.map((row) => row.stateUpdateLeavittProductCount),
    ),
    maximumReplayVerificationLeavittProducts: Math.max(
      ...rows.map((row) => row.replayVerificationLeavittProductCount),
    ),
    externalSemanticAddressBits: 0,
    rows,
  };
}

function buildVConstraints(groupOracle, obstruction) {
  const byHash = new Map(
    obstruction.finiteSet.map((item, index) => [item.exactHash, index]),
  );
  const pairs = [];
  for (let left = 0; left < obstruction.finiteSet.length; left += 1) {
    for (let right = left + 1; right < obstruction.finiteSet.length; right += 1) {
      pairs.push([left, right]);
    }
  }
  const multiplication = [];
  for (let left = 0; left < obstruction.finiteSet.length; left += 1) {
    for (let right = 0; right < obstruction.finiteSet.length; right += 1) {
      const product = groupOracle.evaluate([
        ...obstruction.finiteSet[left].representativeWord,
        ...obstruction.finiteSet[right].representativeWord,
      ]);
      const productIndex = byHash.get(product.hash);
      if (productIndex !== undefined) multiplication.push([left, right, productIndex]);
    }
  }
  return { pairs, multiplication };
}

function auditSavedVEncoder({
  size,
  saved,
  names,
  obstruction,
  constraints,
}) {
  const generators = new Map([
    [names.j[0], saved.u],
    [names.j[1], saved.v],
  ]);
  const chart = obstruction.finiteSet.map((item) =>
    streamFiniteWord(size, generators, item.representativeWord).permutation);
  const identity = identityPermutation(size);
  const relatorPermutations = obstruction.presentation.relators.map((relator) =>
    streamFiniteWord(size, generators, relator.operatorWord).permutation);
  const relatorDefects = relatorPermutations.map((permutation) =>
    normalizedHamming(permutation, identity));

  let maximumCollisionFraction = -1;
  let exactPermutationAliases = 0;
  let closestPair = null;
  for (const [left, right] of constraints.pairs) {
    const collision = 1 - normalizedHamming(chart[left], chart[right]);
    if (collision > maximumCollisionFraction) {
      maximumCollisionFraction = collision;
      closestPair = [left, right];
    }
    if (collision === 1) exactPermutationAliases += 1;
  }
  if (!closestPair) throw new Error("V obstruction has no distinct chart pair");

  let maximumMultiplicationDefect = 0;
  for (const [left, right, product] of constraints.multiplication) {
    maximumMultiplicationDefect = Math.max(
      maximumMultiplicationDefect,
      normalizedHamming(
        composePermutations(chart[left], chart[right]),
        chart[product],
      ),
    );
  }

  const maximumRelatorDefect = Math.max(...relatorDefects);
  const worstRelatorIndex = relatorDefects.indexOf(maximumRelatorDefect);
  const relatorObservableRecovery = recoverHammingFromParityObservables(
    relatorPermutations[worstRelatorIndex],
    identity,
  );
  const closestPairObservableRecovery = recoverHammingFromParityObservables(
    chart[closestPair[0]],
    chart[closestPair[1]],
  );
  assert(
    Math.abs(
      relatorObservableRecovery.recoveredNormalizedHamming - maximumRelatorDefect
    ) < 1e-12,
  );
  assert(
    Math.abs(
      closestPairObservableRecovery.recoveredNormalizedHamming -
      (1 - maximumCollisionFraction)
    ) < 1e-12,
  );
  const uDistanceFromIdentity = normalizedHamming(saved.u, identity);
  const result = {
    size,
    maximumCollisionFraction,
    maximumMultiplicationDefect,
    maximumRelatorDefect,
    worstLoss: Math.max(
      maximumCollisionFraction,
      maximumMultiplicationDefect,
      maximumRelatorDefect,
    ),
    binaryRelatorFailures: relatorDefects.filter((defect) => defect > 0).length,
    exactPermutationAliases,
    uDistanceFromIdentity,
    uBinaryDistinctFromIdentity: uDistanceFromIdentity > 0,
    uFreenessCollisionFraction: 1 - uDistanceFromIdentity,
    evaluatedOverAllAnchors: true,
    externalSemanticAddressBits: 0,
    generatorTableEntries: 2 * size,
    actionDegree: size,
    generatorTableBitsUpperBound: 2 * size * Math.ceil(Math.log2(size)),
    boundedObservableRecovery: {
      identity: "d_H(P,Q)=2 Pr_{uniform anchor, parity seed}[h(P(anchor)) != h(Q(anchor))]",
      worstRelator: relatorObservableRecovery,
      closestDistinctPair: closestPairObservableRecovery,
    },
  };

  for (const key of [
    "maximumCollisionFraction",
    "maximumMultiplicationDefect",
    "maximumRelatorDefect",
    "worstLoss",
  ]) {
    assert(Math.abs(result[key] - saved[key]) < 1e-12, `${size}:${key} did not replay`);
  }
  return result;
}

function pairDefect(rows) {
  let maximumEqualityDefect = 0;
  let maximumDistinctnessCollision = 0;
  for (let left = 0; left < rows.length; left += 1) {
    for (let right = left + 1; right < rows.length; right += 1) {
      const distance = normalizedHamming(rows[left].permutation, rows[right].permutation);
      if (rows[left].exactKey === rows[right].exactKey) {
        maximumEqualityDefect = Math.max(maximumEqualityDefect, distance);
      } else {
        maximumDistinctnessCollision = Math.max(
          maximumDistinctnessCollision,
          1 - distance,
        );
      }
    }
  }
  return { maximumEqualityDefect, maximumDistinctnessCollision };
}

function cyclicControl({ exactModulus = null, emulatorSize, radius }) {
  const rows = [];
  for (let exponent = -radius; exponent <= radius; exponent += 1) {
    rows.push({
      exponent,
      exactKey: exactModulus === null
        ? exponent
        : ((exponent % exactModulus) + exactModulus) % exactModulus,
      permutation: translationPermutation(emulatorSize, exponent),
    });
  }
  return {
    exactGroup: exactModulus === null ? "Z" : `C_${exactModulus}`,
    emulatorSize,
    radius,
    ...pairDefect(rows),
  };
}

function s3Control() {
  const identity3 = [0, 1, 2];
  const naturalGenerators = {
    r: [1, 2, 0],
    s: [1, 0, 2],
  };
  const key = (permutation) => permutation.join("");
  const elements = [{ permutation: identity3, word: [] }];
  const byKey = new Map([[key(identity3), 0]]);
  for (let cursor = 0; cursor < elements.length; cursor += 1) {
    for (const [name, generator] of Object.entries(naturalGenerators)) {
      const next = composePermutations(elements[cursor].permutation, generator);
      if (!byKey.has(key(next))) {
        byKey.set(key(next), elements.length);
        elements.push({
          permutation: next,
          word: [...elements[cursor].word, token(name)],
        });
      }
    }
  }
  assert.equal(elements.length, 6);

  const leftRegular = (groupElement) => elements.map((right) => {
    const product = composePermutations(groupElement, right.permutation);
    return byKey.get(key(product));
  });
  const generators = new Map([
    ["r", leftRegular(naturalGenerators.r)],
    ["s", leftRegular(naturalGenerators.s)],
  ]);
  const rows = elements.map((element, index) => ({
    exactKey: index,
    permutation: streamFiniteWord(6, generators, element.word).permutation,
  }));
  const pairAudit = pairDefect(rows);
  let maximumMultiplicationDefect = 0;
  for (let left = 0; left < elements.length; left += 1) {
    for (let right = 0; right < elements.length; right += 1) {
      const product = composePermutations(
        elements[left].permutation,
        elements[right].permutation,
      );
      const productIndex = byKey.get(key(product));
      maximumMultiplicationDefect = Math.max(
        maximumMultiplicationDefect,
        normalizedHamming(
          composePermutations(rows[left].permutation, rows[right].permutation),
          rows[productIndex].permutation,
        ),
      );
    }
  }
  const relationWords = [
    [token("r"), token("r"), token("r")],
    [token("s"), token("s")],
    [token("s"), token("r"), token("s"), token("r")],
  ];
  const maximumRelationDefect = Math.max(...relationWords.map((word) =>
    normalizedHamming(
      streamFiniteWord(6, generators, word).permutation,
      identityPermutation(6),
    )));
  const rs = streamFiniteWord(6, generators, [token("r"), token("s")]).permutation;
  const sr = streamFiniteWord(6, generators, [token("s"), token("r")]).permutation;
  return {
    exactGroup: "S_3 left-regular action",
    actionDegree: 6,
    ...pairAudit,
    maximumMultiplicationDefect,
    maximumRelationDefect,
    noncommutingWordDistance: normalizedHamming(rs, sr),
  };
}

function oneCoordinatePrecisionControl(lengths) {
  return lengths.map((length) => {
    let numerator = 0n;
    let denominator = 1n;
    for (let index = 0; index < length; index += 1) {
      numerator = numerator * 4n + BigInt(index % 2 === 0 ? 1 : 2);
      denominator *= 4n;
    }
    return {
      tokenLength: length,
      latentDimension: 1,
      possibleBinaryHistories: `2^${length}`,
      informationTheoreticBitsLowerBound: length,
      unitIntervalMinimumGapUpperBound: `1/(2^${length}-1)`,
      exactNumeratorBits: numerator.toString(2).length,
      exactDenominatorBits: denominator.toString(2).length,
    };
  });
}

function exerciseBidirectionalRefinement(groupOracle, certificate) {
  const states = NINE_LEAF_CODE_D.map(
    (prefix) => new LeavittRegularState(sWord(prefix), `s_${prefix}`),
  );
  const size = 6;
  const identity = identityPermutation(size);
  const j0Word = [token(certificate.names.j[0])];

  const collapsed = new FiniteEmulatorCritic(size);
  collapsed.assign(groupOracle.evaluate([]), identity, "identity");
  collapsed.assign(groupOracle.evaluate(j0Word), identity, "collapsed-j0");
  const splitChallenge = certificate.challenge({
    emulatorAudit: certificate.audit(collapsed),
    states,
    groupOracle,
  });
  assert.equal(splitChallenge.refinementAction.kind, "split");
  assert(splitChallenge.generatedProbes.length > 0);

  const inconsistent = new FiniteEmulatorCritic(size);
  inconsistent.assign(
    groupOracle.evaluate(j0Word),
    [1, 2, 3, 4, 0, 5],
    "wrong-order-j0",
  );
  const glueChallenge = certificate.challenge({
    emulatorAudit: certificate.audit(inconsistent),
    states,
    groupOracle,
  });
  assert.equal(glueChallenge.refinementAction.kind, "glue");
  assert.equal(glueChallenge.generatedConstraints.length, 1);

  const atlas = new EndogenousTransportAtlas(groupOracle);
  const splitRevision = atlas.applyChallenge(splitChallenge);
  const falseGlue = structuredClone(glueChallenge);
  falseGlue.generatedConstraints[0].rightWord = j0Word;
  const atomicAtlas = new EndogenousTransportAtlas(groupOracle);
  falseGlue.generatedProbes = [{ hash: () => "must-not-be-installed" }];
  assert.throws(
    () => atomicAtlas.applyChallenge(falseGlue),
    /distinct exact paths/,
  );
  assert.equal(atomicAtlas.snapshot().separatingProbeCount, 0);
  assert.equal(atomicAtlas.snapshot().revisionCount, 0);
  const glueRevision = atlas.applyChallenge(glueChallenge);
  const sixCycle = [1, 2, 3, 4, 5, 0];
  const wrongOrder = [1, 2, 3, 4, 0, 5];
  const splitFailure = atlas.scoreTransport({
    leftWord: splitChallenge.violation.leftWord,
    rightWord: splitChallenge.violation.rightWord,
    leftPermutation: identity,
    rightPermutation: identity,
  });
  const splitSatisfied = atlas.scoreTransport({
    leftWord: splitChallenge.violation.leftWord,
    rightWord: splitChallenge.violation.rightWord,
    leftPermutation: identity,
    rightPermutation: sixCycle,
  });
  const glueFailure = atlas.scoreTransport({
    leftWord: glueChallenge.violation.leftWord,
    rightWord: glueChallenge.violation.rightWord,
    leftPermutation: wrongOrder,
    rightPermutation: identity,
  });
  const glueSatisfied = atlas.scoreTransport({
    leftWord: glueChallenge.violation.leftWord,
    rightWord: glueChallenge.violation.rightWord,
    leftPermutation: identity,
    rightPermutation: identity,
  });
  assert.equal(splitFailure.loss, 1);
  assert.equal(splitSatisfied.loss, 0);
  assert(glueFailure.loss > 0);
  assert.equal(glueSatisfied.loss, 0);
  const snapshot = atlas.snapshot();
  assert(snapshot.separatingProbeCount > 0);
  assert.equal(snapshot.separationConstraintCount, 1);
  assert.equal(snapshot.gluingConstraintCount, 1);
  return {
    split: {
      violationKind: splitChallenge.violation.kind,
      generatedProbeCount: splitChallenge.generatedProbes.length,
      revision: splitRevision,
      failingCandidateLoss: splitFailure.loss,
      satisfyingCandidateLoss: splitSatisfied.loss,
    },
    glue: {
      violationKind: glueChallenge.violation.kind,
      generatedConstraintCount: glueChallenge.generatedConstraints.length,
      revision: glueRevision,
      failingCandidateLoss: glueFailure.loss,
      satisfyingCandidateLoss: glueSatisfied.loss,
    },
    curriculum: atlas.curriculum(),
    atlas: snapshot,
  };
}

const started = performance.now();
const groupOracle = new ExactNonSoficGroupOracle();
const certificate = compileExpansionLefCertificate(groupOracle);
const obstruction = certificate.finiteLefObstruction;
const exactStreams = auditExactStreams(groupOracle, obstruction);
const constraints = buildVConstraints(groupOracle, obstruction);
const savedStatus = JSON.parse(readFileSync(
  new URL("./runs/countermodel-20260804-live/status.json", import.meta.url),
  "utf8",
));
const savedVEncoders = Object.entries(savedStatus.bestBySize).map(([size, saved]) =>
  auditSavedVEncoder({
    size: Number(size),
    saved,
    names: certificate.names,
    obstruction,
    constraints,
  }));

assert.deepEqual(
  savedVEncoders.map((row) => row.binaryRelatorFailures),
  [1, 3, 3, 3, 5, 5],
);
assert(savedVEncoders.every((row) => row.uBinaryDistinctFromIdentity));

const controls = {
  finiteNoncommutativeS3: s3Control(),
  finiteCyclic: cyclicControl({ exactModulus: 7, emulatorSize: 7, radius: 10 }),
  soficZNoWrap: cyclicControl({ emulatorSize: 17, radius: 8 }),
  soficZIntentionalWrap: cyclicControl({ emulatorSize: 16, radius: 8 }),
  oneCoordinatePrecision: oneCoordinatePrecisionControl([8, 16, 32, 64, 128]),
};
assert.equal(controls.finiteNoncommutativeS3.maximumEqualityDefect, 0);
assert.equal(controls.finiteNoncommutativeS3.maximumDistinctnessCollision, 0);
assert.equal(controls.finiteNoncommutativeS3.maximumMultiplicationDefect, 0);
assert.equal(controls.finiteNoncommutativeS3.maximumRelationDefect, 0);
assert.equal(controls.finiteNoncommutativeS3.noncommutingWordDistance, 1);
assert.equal(controls.finiteCyclic.maximumEqualityDefect, 0);
assert.equal(controls.finiteCyclic.maximumDistinctnessCollision, 0);
assert.equal(controls.soficZNoWrap.maximumDistinctnessCollision, 0);
assert.equal(controls.soficZIntentionalWrap.maximumDistinctnessCollision, 1);
assert(
  controls.oneCoordinatePrecision.every((row, index, rows) =>
    index === 0 || row.exactDenominatorBits > rows[index - 1].exactDenominatorBits),
);

const bidirectionalRefinement = exerciseBidirectionalRefinement(groupOracle, certificate);
const report = {
  schema: "oasis.endogenous-transport-benchmark.v1",
  architecture: "endogenous-obstruction-triggered-transport-atlas",
  claimBoundary: {
    executable: [
      "equal-input exact causal prefix replay parity",
      "finite and sofic controls",
      "exact Thompson-V relation-versus-separation obstruction",
      "replay of six stored finite permutation adversaries",
      "certificate-driven split and glue refinement",
      "exact recovery of transport Hamming defects from logarithmic-cost one-bit observables",
    ],
    theoremBackedNonconstructive: [
      "some finite radius and positive defect floor defeat every finite reversible transport encoder for the non-sofic group",
    ],
    notClaimed: [
      "an effective numerical universal (F, epsilon) witness",
      "a lower bound for arbitrary neural predictors",
      "a memory or parameter-efficiency advantage",
      "a universal downstream prediction-loss advantage",
      "a reduction from unrestricted sequence predictors to reversible finite transports",
    ],
  },
  fairnessContract: {
    suppliedEndpointAddress: false,
    externalSemanticAddressBits: 0,
    parityCriticProbeBits: "2 ceil(log2 |Y|): one anchor and one mask",
    inputs: "raw generator tokens only",
    finiteRiskMeasure: "normalized Hamming over every latent anchor",
    finiteEncoderSizeMayGrow: true,
    exactCarrierResourceMatched: false,
  },
  exactStreams,
  thompsonVExactObstruction: {
    scope: "exact finite action and LEF-level obstruction, not itself a non-sofic certificate",
    finiteSetSize: obstruction.finiteSetSize,
    pairConstraintCount: constraints.pairs.length,
    multiplicationConstraintCount: constraints.multiplication.length,
    savedSearchIterations: savedStatus.totalIterations,
    savedVEncoders,
  },
  controls,
  bidirectionalRefinement,
  nonSoficTransportTheorem: {
    status: "proved-by-reduction-to-definition; effective witness still open",
    profile: "A_G(R,N)=inf over finite reversible encoders of radius-R relation-or-collapse defect",
    soficScaling: "for every fixed R, A_G(R,N) can tend to zero as N grows",
    nonSoficScaling: "for some R*, inf_N A_G(R*,N) >= eta* > 0",
    loadBearingAssumptions: [
      "finite latent set",
      "bijective generator updates",
      "whole-latent-space normalized Hamming scoring",
      "relation consistency",
      "distinct-element freeness",
      "growing radii and vanishing error in the negated hypothesis",
    ],
    observableBridge: "random parity endpoint probes recover normalized Hamming defect in expectation",
    globallyEffectiveCertificateInstalled: certificate.status().globallyEffective,
    openUniversalObligations: certificate.status().openObligations,
  },
  elapsedMilliseconds: performance.now() - started,
};

const { rows: _exactRows, ...exactStreamSummary } = report.exactStreams;
const compactReport = {
  schema: report.schema,
  architecture: report.architecture,
  claimBoundary: report.claimBoundary,
  fairnessContract: report.fairnessContract,
  exactStreams: exactStreamSummary,
  thompsonVExactObstruction: {
    ...report.thompsonVExactObstruction,
    savedVEncoders: report.thompsonVExactObstruction.savedVEncoders.map((row) => ({
      size: row.size,
      worstLoss: row.worstLoss,
      maximumCollisionFraction: row.maximumCollisionFraction,
      maximumMultiplicationDefect: row.maximumMultiplicationDefect,
      maximumRelatorDefect: row.maximumRelatorDefect,
      binaryRelatorFailures: row.binaryRelatorFailures,
      uBinaryDistinctFromIdentity: row.uBinaryDistinctFromIdentity,
      boundedObservableRecoveryVerified: true,
    })),
  },
  controls: report.controls,
  bidirectionalRefinement: {
    splitViolationKind: report.bidirectionalRefinement.split.violationKind,
    generatedProbeCount: report.bidirectionalRefinement.split.generatedProbeCount,
    glueViolationKind: report.bidirectionalRefinement.glue.violationKind,
    generatedConstraintCount: report.bidirectionalRefinement.glue.generatedConstraintCount,
    atlasProbeCount: report.bidirectionalRefinement.atlas.separatingProbeCount,
    atlasSeparationConstraintCount:
      report.bidirectionalRefinement.atlas.separationConstraintCount,
    atlasConstraintCount: report.bidirectionalRefinement.atlas.gluingConstraintCount,
    splitFailingCandidateLoss: report.bidirectionalRefinement.split.failingCandidateLoss,
    splitSatisfyingCandidateLoss:
      report.bidirectionalRefinement.split.satisfyingCandidateLoss,
    glueFailingCandidateLoss: report.bidirectionalRefinement.glue.failingCandidateLoss,
    glueSatisfyingCandidateLoss:
      report.bidirectionalRefinement.glue.satisfyingCandidateLoss,
  },
  nonSoficTransportTheorem: report.nonSoficTransportTheorem,
};
console.log(JSON.stringify(
  process.argv.includes("--full") ? report : compactReport,
  null,
  2,
));
