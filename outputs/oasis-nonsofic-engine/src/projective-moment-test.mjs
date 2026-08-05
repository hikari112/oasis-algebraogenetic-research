import assert from "node:assert/strict";

import { ExactNonSoficGroupOracle } from "./group-oracle.mjs";
import { ProjectiveMomentMemory } from "./projective-moment-memory.mjs";

const oracle = new ExactNonSoficGroupOracle();
const generators = ["x:0:1:1", "x:1:0:1"];
const window = oracle.enumerateWindow(generators, 3, 15);
const words = window.map((item) => item.tokens);
assert(window.length >= 6);

// The canonical trace view has an identity Gram matrix on every distinct exact
// group window. Its exact rank therefore grows with every strict refinement.
const memory = new ProjectiveMomentMemory({ groupOracle: oracle });
const coarse = memory.materialize(words.slice(0, 3));
const refined = memory.materialize(words);
assert.equal(coarse.exactRank, coarse.distinctExactElements);
assert.equal(refined.exactRank, refined.distinctExactElements);
assert(refined.exactRank > coarse.exactRank);
assert(refined.overlapConsistencyChecks >= 9);
assert(refined.matrix.every((row, rowIndex) => row.every(
  (value, columnIndex) => value === (rowIndex === columnIndex ? "1" : "0"),
)));

const growingGenerators = ["x:0:1:s0", "x:1:0:s1"];
const rankGrowth = [];
for (let depth = 1; depth <= 5; depth += 1) {
  const growingWindow = oracle.enumerateWindow(growingGenerators, depth, 100);
  const certificate = memory.certifyFiniteLatentDimension(
    growingWindow.map((item) => item.tokens),
    2,
  );
  rankGrowth.push({
    depth,
    windowSize: certificate.windowSize,
    rank: certificate.exactMomentRank,
    normalizedErrorLowerBound:
      certificate.quantitativeApproximationBound.minimumNormalizedFrobeniusError,
  });
  assert.equal(certificate.exactMomentRank, certificate.windowSize);
  assert.equal(certificate.exactRepresentationImpossible, certificate.windowSize > 2);
  assert.equal(certificate.quantitativeApproximationBound.minimumOperatorNormError, 1);
}
assert.deepEqual(rankGrowth.map((item) => item.rank), [3, 5, 7, 9, 11]);

// A noncommutative right consolidation creates a continuous-valued state while
// keeping every queried moment exactly rational and PSD.
const firstUpdate = memory.update({
  label: "consolidate-generator-0",
  terms: [
    { word: [], coefficient: "1" },
    { word: [generators[0]], coefficient: "1/2" },
  ],
});
assert.equal(firstUpdate.amplitudeSupportSize, 2);
assert.equal(memory.moment([generators[0]]), "4/5");
const updatedCoarse = memory.materialize(words.slice(0, 4));
const updatedRefined = memory.materialize(words);
assert.equal(updatedCoarse.normalized, true);
assert.equal(updatedCoarse.symmetric, true);
assert.equal(updatedCoarse.psdByExactGramFactorization, true);
assert(updatedRefined.overlapConsistencyChecks >= 16);

// Update order is part of the exact memory. Noncommuting filters produce
// different amplitude programs even when their scalar coefficients agree.
const forward = new ProjectiveMomentMemory({ groupOracle: oracle });
forward.update({ terms: [
  { word: [], coefficient: 1 },
  { word: [generators[0]], coefficient: "1/2" },
] });
forward.update({ terms: [
  { word: [], coefficient: 1 },
  { word: [generators[1]], coefficient: "1/3" },
] });
const reverse = new ProjectiveMomentMemory({ groupOracle: oracle });
reverse.update({ terms: [
  { word: [], coefficient: 1 },
  { word: [generators[1]], coefficient: "1/3" },
] });
reverse.update({ terms: [
  { word: [], coefficient: 1 },
  { word: [generators[0]], coefficient: "1/2" },
] });
assert.notDeepEqual(forward.snapshot().amplitude, reverse.snapshot().amplitude);

const forwardView = forward.materialize(words);
assert.equal(forwardView.normalized, true);
assert.equal(forwardView.symmetric, true);
assert.equal(forwardView.psdByExactGramFactorization, true);

// A memory-state kernel is not a group identity. The exact words e and g0
// remain distinct, while the state B=(1+g0) makes (1-g0)B exactly zero. This
// null relation survives every later right consolidation update.
const quotientMemory = new ProjectiveMomentMemory({ groupOracle: oracle });
quotientMemory.update({
  label: "make-g0-invariant",
  terms: [
    { word: [], coefficient: 1 },
    { word: [generators[0]], coefficient: 1 },
  ],
});
const nullRelation = quotientMemory.rememberNullRelation({
  label: "state-identifies-g0-with-identity",
  terms: [
    { word: [], coefficient: 1 },
    { word: [generators[0]], coefficient: -1 },
  ],
});
assert.equal(nullRelation.exactSquaredNorm, "0");
assert.notEqual(oracle.evaluate([]).hash, oracle.evaluate([generators[0]]).hash);
const quotientView = quotientMemory.materialize([[], [generators[0]]]);
assert.equal(quotientView.exactRank, 1);
quotientMemory.update({
  label: "later-right-update",
  terms: [
    { word: [], coefficient: 1 },
    { word: [generators[1]], coefficient: "1/3" },
  ],
});
assert.equal(quotientMemory.relationNormSquared([
  { word: [], coefficient: 1 },
  { word: [generators[0]], coefficient: -1 },
]).numerator, 0n);

// A binary observation is an exact projection-valued branch. The parent is
// unchanged and continues to denote both counterfactual futures.
const causalRoot = new ProjectiveMomentMemory({ groupOracle: oracle });
const rootComparison = causalRoot.compareWords([], [generators[0]]);
assert.equal(rootComparison.classification, "state-distinguishable-exact-elements");
assert.equal(rootComparison.exactSquaredDistance, "2");
const branches = causalRoot.branchOnInvolution([generators[0]], "g0");
assert.equal(branches.forecast.plusProbability, "1/2");
assert.equal(branches.forecast.minusProbability, "1/2");
assert.equal(branches.forecast.probabilitySum, "1");
assert.equal(causalRoot.moment([generators[0]]), "0");
assert.equal(causalRoot.snapshot().version, 0);
assert.equal(branches.plus.memory.moment([generators[0]]), "1");
assert.equal(branches.minus.memory.moment([generators[0]]), "-1");
assert.equal(
  branches.plus.memory.compareWords([], [generators[0]]).classification,
  "state-kernel-equivalence",
);
assert.equal(
  branches.minus.memory.relationNormSquared([
    { word: [], coefficient: 1 },
    { word: [generators[0]], coefficient: 1 },
  ]).numerator,
  0n,
);
const rootAliasAudit = causalRoot.auditEmulatorPair({
  leftWord: [],
  rightWord: [generators[0]],
  emulatorClaimsEqual: true,
});
const plusAliasAudit = branches.plus.memory.auditEmulatorPair({
  leftWord: [],
  rightWord: [generators[0]],
  emulatorClaimsEqual: true,
});
assert.equal(rootAliasAudit.verdict, "emulator-alias-refuted-by-current-memory");
assert.equal(
  plusAliasAudit.verdict,
  "emulator-alias-agrees-with-current-memory-but-not-algebra",
);

// Counterfactual observation order remains visible in separate causal paths.
const pathGThenH = causalRoot.fork("g-then-h");
pathGThenH.postselectInvolution({ word: [generators[0]], outcome: 1, label: "g+" });
pathGThenH.postselectInvolution({ word: [generators[1]], outcome: 1, label: "h+" });
const pathHThenG = causalRoot.fork("h-then-g");
pathHThenG.postselectInvolution({ word: [generators[1]], outcome: 1, label: "h+" });
pathHThenG.postselectInvolution({ word: [generators[0]], outcome: 1, label: "g+" });
assert.notDeepEqual(pathGThenH.snapshot().amplitude, pathHThenG.snapshot().amplitude);

// Non-finite rank is not confined to the initial canonical trace. After two
// genuine left observations, greedily selected translates of the current
// finite-support amplitude still produce an exact identity moment view.
const intervenedCandidates = oracle.enumerateWindow(growingGenerators, 7, 500);
const intervenedRankObstruction = pathGThenH.certifyDisjointTranslateObstruction(
  intervenedCandidates.map((item) => item.tokens),
  3,
  6,
);
assert.equal(intervenedRankObstruction.foundRequestedWindow, true);
assert.equal(intervenedRankObstruction.pairwiseDisjointTranslatedSupports, true);
assert.equal(intervenedRankObstruction.latentCertificate.identityMomentView, true);
assert.equal(intervenedRankObstruction.latentCertificate.exactMomentRank, 6);
assert.equal(intervenedRankObstruction.latentCertificate.exactRepresentationImpossible, true);
const pathGThenHSnapshot = pathGThenH.snapshot();
const revisedGRelation = pathGThenHSnapshot.nullRelations.find(
  (relation) => relation.label === "g+-eigenrelation",
);
const activeHRelation = pathGThenHSnapshot.nullRelations.find(
  (relation) => relation.label === "h+-eigenrelation",
);
assert.equal(revisedGRelation.active, false);
assert.equal(revisedGRelation.invalidatedBy, "h+");
assert.equal(activeHRelation.active, true);
const causalTree = causalRoot.materializeCausalTree(
  [[generators[0]], [generators[1]]],
  "g-then-h-tree",
);
assert.equal(causalTree.depth, 2);
assert.equal(causalTree.leafCount, 4);
assert.equal(causalTree.totalProbability, "1");

console.log(JSON.stringify({
  canonicalTrace: {
    coarseWindowSize: coarse.windowSize,
    coarseRank: coarse.exactRank,
    refinedWindowSize: refined.windowSize,
    refinedRank: refined.exactRank,
    overlapConsistencyChecks: refined.overlapConsistencyChecks,
    fixedTwoDimensionalLatentObstruction: rankGrowth,
  },
  continuousMomentAfterUpdate: memory.moment([generators[0]]),
  firstUpdate,
  updatedView: {
    windowSize: updatedRefined.windowSize,
    exactRank: updatedRefined.exactRank,
    overlapConsistencyChecks: updatedRefined.overlapConsistencyChecks,
    psdByExactGramFactorization: updatedRefined.psdByExactGramFactorization,
  },
  noncommutativeOrderRemembered:
    JSON.stringify(forward.snapshot().amplitude) !== JSON.stringify(reverse.snapshot().amplitude),
  stateSpecificKernel: {
    exactGroupElementsRemainDistinct: true,
    momentViewRank: quotientView.exactRank,
    relation: nullRelation,
    persistedAfterLaterUpdate: true,
  },
  causalBranching: {
    forecast: branches.forecast,
    parentUnchanged: causalRoot.snapshot().version === 0,
    plusMoment: branches.plus.memory.moment([generators[0]]),
    minusMoment: branches.minus.memory.moment([generators[0]]),
    parentComparison: rootComparison,
    plusComparison: branches.plus.memory.compareWords([], [generators[0]]),
    observationOrderRemembered:
      JSON.stringify(pathGThenH.snapshot().amplitude) !==
      JSON.stringify(pathHThenG.snapshot().amplitude),
    intervenedStateRankObstruction: {
      amplitudeSupportSize: pathGThenHSnapshot.amplitudeSupportSize,
      inspectedCandidateCount: intervenedRankObstruction.inspectedCandidateCount,
      selectedTranslateCount: intervenedRankObstruction.selected.length,
      exactMomentRank: intervenedRankObstruction.latentCertificate.exactMomentRank,
      rejectedLatentDimension:
        intervenedRankObstruction.latentCertificate.maximumLatentDimension,
      normalizedErrorLowerBound:
        intervenedRankObstruction.latentCertificate.quantitativeApproximationBound
          .minimumNormalizedFrobeniusError,
    },
    revisedEarlierRelation: {
      label: revisedGRelation.label,
      active: revisedGRelation.active,
      invalidatedBy: revisedGRelation.invalidatedBy,
    },
    currentRelation: {
      label: activeHRelation.label,
      active: activeHRelation.active,
    },
    threeWayCritic: {
      parentVerdict: rootAliasAudit.verdict,
      selectedChildVerdict: plusAliasAudit.verdict,
      selectedChildLayers: plusAliasAudit.layers,
    },
    finiteCausalTree: {
      depth: causalTree.depth,
      leafCount: causalTree.leafCount,
      totalProbability: causalTree.totalProbability,
      leaves: causalTree.leaves.map((leaf) => ({
        outcomes: leaf.outcomes,
        probability: leaf.probability,
        branch: leaf.branch,
      })),
    },
  },
  forwardSnapshot: forward.snapshot(),
}, null, 2));
