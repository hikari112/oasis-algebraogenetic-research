import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import { CertifiedBoundedProgram } from "./presentation-transcendent-algebra.mjs";
import { trainLogisticStudent } from "./holonomy-chart-ablation.mjs";
import { enumerateExactGroupWindow } from "./query-local-universality.mjs";

function selectDisjointResidualPairs(candidates, residual, requestedCount) {
  const occupied = new Set();
  const pairs = [];
  for (const reference of candidates) {
    const alternateUnit = reference.unit.multiply(residual.unit);
    const referenceHash = reference.hash;
    const alternateHash = alternateUnit.hash();
    if (referenceHash === alternateHash) continue;
    if (occupied.has(referenceHash) || occupied.has(alternateHash)) continue;
    occupied.add(referenceHash);
    occupied.add(alternateHash);
    pairs.push({
      reference,
      alternateUnit,
      referenceHash,
      alternateHash,
    });
    if (pairs.length >= requestedCount) break;
  }
  return pairs;
}

function sigmoid(value) {
  if (value >= 0) {
    const exponential = Math.exp(-value);
    return 1 / (1 + exponential);
  }
  const exponential = Math.exp(value);
  return exponential / (1 + exponential);
}

function predictLogistic(weights, features) {
  return sigmoid(weights[0] + features.reduce(
    (sum, value, index) => sum + value * weights[index + 1],
    0,
  ));
}

export function runAtlasProbeScaling() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const generatorNames = [
    "x:0:1:s0",
    "x:1:0:s1",
    "x:2:3:s0",
    "x:3:2:s1",
  ];
  const identity = groupOracle.evaluate([]);
  const residual = groupOracle.evaluate([generatorNames[0]]);
  const commonContinuation = groupOracle.evaluate([
    generatorNames[2],
    generatorNames[3],
  ]);
  const candidates = enumerateExactGroupWindow(groupOracle, generatorNames, 5, 4096);
  const pairs = selectDisjointResidualPairs(candidates, residual, 24);
  assert.equal(pairs.length, 24);
  assert.equal(
    new Set(pairs.flatMap((pair) => [pair.referenceHash, pair.alternateHash])).size,
    2 * pairs.length,
  );

  const deltaIdentity = CertifiedBoundedProgram.pointMass(identity.unit);
  const chartExamples = [];
  for (const pair of pairs) {
    const continuedReferencePath = commonContinuation.unit.multiply(pair.reference.unit);
    const continuedAlternatePath = commonContinuation.unit.multiply(pair.alternateUnit);
    assert.equal(
      continuedReferencePath.inverse().multiply(continuedAlternatePath).equals(residual.unit),
      true,
    );

    const referenceEndpoint = deltaIdentity
      .translate(pair.reference.unit)
      .translate(commonContinuation.unit);
    const alternateEndpoint = deltaIdentity
      .translate(pair.alternateUnit)
      .translate(commonContinuation.unit);
    const chartPullback = continuedReferencePath.inverse();
    const referenceCoordinate = Number(
      referenceEndpoint.translate(chartPullback).evaluate(identity.unit),
    );
    const alternateCoordinate = Number(
      alternateEndpoint.translate(chartPullback).evaluate(identity.unit),
    );
    assert.equal(referenceCoordinate, 1);
    assert.equal(alternateCoordinate, 0);
    chartExamples.push(
      { baseHash: pair.referenceHash, feature: [referenceCoordinate], target: 0.1 },
      { baseHash: pair.referenceHash, feature: [alternateCoordinate], target: 0.9 },
    );
  }

  const trainingExamples = chartExamples.slice(0, 8);
  const heldOutExamples = chartExamples.slice(8);
  const frozenStudent = trainLogisticStudent(
    trainingExamples.map((example) => example.feature),
    trainingExamples.map((example) => example.target),
  );
  const heldOutPredictions = heldOutExamples.map((example) => ({
    baseHash: example.baseHash,
    target: example.target,
    prediction: predictLogistic(frozenStudent.weights, example.feature),
  }));
  const maximumHeldOutTotalVariationError = Math.max(
    ...heldOutPredictions.map((row) => Math.abs(row.target - row.prediction)),
  );
  assert(maximumHeldOutTotalVariationError < 1e-10);

  const scales = [2, 4, 8, 16, 24].map((pairCount) => ({
    pairCount,
    pairSupportsAreMutuallyDisjoint: true,
    minimumAbsolutePointProbes: pairCount,
    attainingAbsoluteProbeSet: pairs.slice(0, pairCount)
      .map((pair) => pair.referenceHash),
    chartNormalizedCoordinateCount: 1,
    exactCompressionRatio: pairCount,
  }));

  return {
    schema: "oasis.algebraogenetic-atlas-probe-scaling.v1",
    exactGroup: groupOracle.theorem.group,
    sampledCandidateCount: candidates.length,
    residualHolonomyHash: residual.hash,
    commonContinuationHash: commonContinuation.hash,
    disjointPathPairCount: pairs.length,
    theorem: {
      statement:
        "for-n-mutually-disjoint-support-pairs-(delta_ti,delta_tig)-any-absolute-point-evaluation-feature-set-that-separates-every-pair-has-size-at-least-n-and-n-suffices",
      lowerBoundReason:
        "a-point-evaluation-separates-pair-i-only-at-ti-or-ti*g-and-disjoint-supports-let-one-probe-hit-at-most-one-pair",
      chartUpperBoundReason:
        "pulling-each-pair-back-through-its-reference-path-maps-every-reference-to-delta_e-and-every-alternate-to-delta_g-so-one-identity-coordinate-separates-all-pairs",
      commonContinuationInvariant:
        "(u*ti)^-1*(u*ti*g)=g",
    },
    scales,
    asymptoticSeparation: {
      absolutePointProbeComplexity: "Theta(n)",
      transportedChartCoordinateComplexity: "Theta(1)",
    },
    frozenReadoutTransfer: {
      trainingBaseChartCount: 4,
      heldOutBaseChartCount: 20,
      readoutParameterCount: frozenStudent.parameterCount,
      trainingMaximumTotalVariationError: frozenStudent.maximumTotalVariationError,
      heldOutMaximumTotalVariationError: maximumHeldOutTotalVariationError,
      readoutWeightsFrozenBeforeHeldOutCharts: true,
      interpretation:
        "exact-chart-normalization-makes-unseen-base-paths-share-the-same-learned-residual-coordinate",
    },
    scope: {
      exactFiniteAudit: true,
      lowerBoundAppliesTo: "absolute-point-evaluation-features",
      lowerBoundDoesNotApplyTo:
        "arbitrary-global-program-features-designed-with-full-task-knowledge",
      nonSoficityNeededForFiniteLowerBound: false,
      nonSoficityRole:
        "prevents-the-complete-countable-state-action-from-having-a-sofic-global-finite-model",
    },
  };
}

if (
  typeof process !== "undefined"
  && process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runAtlasProbeScaling(), null, 2));
}
