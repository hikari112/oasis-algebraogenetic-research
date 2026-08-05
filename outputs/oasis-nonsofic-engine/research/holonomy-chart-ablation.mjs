import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import { CertifiedBoundedProgram } from "./presentation-transcendent-algebra.mjs";
import { enumerateExactGroupWindow } from "./query-local-universality.mjs";

function sigmoid(value) {
  if (value >= 0) {
    const exponential = Math.exp(-value);
    return 1 / (1 + exponential);
  }
  const exponential = Math.exp(value);
  return exponential / (1 + exponential);
}

function binaryKl(target, prediction) {
  const clipped = Math.min(1 - 1e-15, Math.max(1e-15, prediction));
  return Math.max(
    0,
    target * Math.log(target / clipped)
      + (1 - target) * Math.log((1 - target) / (1 - clipped)),
  );
}

export function trainLogisticStudent(
  featureRows,
  targets,
  { steps = 20000, learningRate = 0.5 } = {},
) {
  const augmented = featureRows.map((row) => [1, ...row]);
  const weights = Array(augmented[0].length).fill(0);
  for (let step = 0; step < steps; step += 1) {
    const gradient = Array(weights.length).fill(0);
    for (let rowIndex = 0; rowIndex < augmented.length; rowIndex += 1) {
      const row = augmented[rowIndex];
      const prediction = sigmoid(row.reduce(
        (sum, value, index) => sum + value * weights[index],
        0,
      ));
      const error = prediction - targets[rowIndex];
      for (let index = 0; index < gradient.length; index += 1) {
        gradient[index] += error * row[index] / augmented.length;
      }
    }
    for (let index = 0; index < weights.length; index += 1) {
      weights[index] -= learningRate * gradient[index];
    }
  }

  const predictions = augmented.map((row) => sigmoid(row.reduce(
    (sum, value, index) => sum + value * weights[index],
    0,
  )));
  return {
    parameterCount: weights.length,
    weights,
    predictions,
    maximumTotalVariationError: Math.max(
      ...predictions.map((prediction, index) => Math.abs(prediction - targets[index])),
    ),
    meanKl: predictions.reduce(
      (sum, prediction, index) => sum + binaryKl(targets[index], prediction),
      0,
    ) / predictions.length,
    steps,
    learningRate,
  };
}

function conditionalInformationGap(featureRows, targets) {
  const fibers = new Map();
  for (let index = 0; index < featureRows.length; index += 1) {
    const key = JSON.stringify(featureRows[index]);
    const fiber = fibers.get(key) ?? [];
    fiber.push(index);
    fibers.set(key, fiber);
  }
  let gap = 0;
  for (const fiber of fibers.values()) {
    const mixture = fiber.reduce((sum, index) => sum + targets[index], 0) / fiber.length;
    for (const index of fiber) gap += binaryKl(targets[index], mixture) / targets.length;
  }
  return { fiberCount: fibers.size, gap };
}

function valuesOn(program, continuations) {
  return continuations.map((continuation) => Number(program.evaluate(continuation.unit)));
}

export function runHolonomyChartAblation() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const generatorNames = ["x:0:1:s0", "x:1:0:s1"];
  const identity = groupOracle.evaluate([]);
  const g = groupOracle.evaluate([generatorNames[0]]);
  const h = groupOracle.evaluate([generatorNames[1]]);
  const window = enumerateExactGroupWindow(groupOracle, generatorNames, 7, 512);
  const bases = window.slice(0, 4);
  assert.equal(new Set(bases.map((base) => base.hash)).size, 4);
  const commonContinuation = g.unit.multiply(h.unit);
  const deltaIdentity = CertifiedBoundedProgram.pointMass(identity.unit);

  const rows = [];
  const exactSupports = new Set();
  for (const base of bases) {
    const referencePath = base.unit;
    const alternatePath = base.unit.multiply(g.unit);
    const continuedReferencePath = commonContinuation.multiply(referencePath);
    const continuedAlternatePath = commonContinuation.multiply(alternatePath);

    // A shared left continuation preserves the right residual holonomy:
    // (u t)^-1 (u t g) = g.
    assert.equal(
      continuedReferencePath.inverse().multiply(continuedAlternatePath).equals(g.unit),
      true,
    );

    for (const branch of ["reference", "alternate"]) {
      const path = branch === "reference" ? referencePath : alternatePath;
      const endpoint = deltaIdentity.translate(path);
      const continuedEndpoint = endpoint.translate(commonContinuation);
      const expectedSupport = branch === "reference"
        ? continuedReferencePath
        : continuedAlternatePath;
      assert.equal(continuedEndpoint.evaluate(expectedSupport), 1n);

      // Pull the continued endpoint back through the reference chart. The same
      // identity coordinate now detects the residual g in every base chart.
      const chartNormalizedEndpoint = continuedEndpoint.translate(
        continuedReferencePath.inverse(),
      );
      const holonomyCoordinate = Number(chartNormalizedEndpoint.evaluate(identity.unit));
      assert.equal(holonomyCoordinate, branch === "reference" ? 1 : 0);

      exactSupports.add(path.hash());
      rows.push({
        baseHash: base.hash,
        branch,
        endpoint,
        target: branch === "reference" ? 0.1 : 0.9,
        pathHash: path.hash(),
        continuedPathHash: expectedSupport.hash(),
        residualHolonomyHash: g.hash,
        holonomyCoordinate,
      });
    }
  }

  const coarseProbes = window
    .filter((candidate) => !exactSupports.has(candidate.hash))
    .slice(0, 8);
  assert.equal(coarseProbes.length, 8);
  const endpointFeatures = rows.map((row) => valuesOn(row.endpoint, coarseProbes));
  assert(endpointFeatures.every((row) => row.every((value) => value === 0)));
  const holonomyFeatures = rows.map((row) => [row.holonomyCoordinate]);
  const targets = rows.map((row) => row.target);

  const endpointInformation = conditionalInformationGap(endpointFeatures, targets);
  const holonomyInformation = conditionalInformationGap(holonomyFeatures, targets);
  const endpointStudent = trainLogisticStudent(endpointFeatures, targets);
  const holonomyStudent = trainLogisticStudent(holonomyFeatures, targets);

  assert.equal(endpointInformation.fiberCount, 1);
  assert(Math.abs(endpointStudent.maximumTotalVariationError - 0.4) < 1e-12);
  assert(Math.abs(endpointStudent.meanKl - endpointInformation.gap) < 1e-12);
  assert.equal(holonomyInformation.gap, 0);
  assert(holonomyStudent.maximumTotalVariationError < 1e-10);
  assert(holonomyStudent.meanKl < 1e-14);

  return {
    schema: "oasis.holonomy-chart-learning-ablation.v1",
    task: {
      exampleCount: rows.length,
      baseChartCount: bases.length,
      commonContinuationHash: commonContinuation.hash(),
      targetSecondOutcomeProbabilities: targets,
      meaning:
        "predict-a-future-continuation-sensitive-target-from-two-exact-paths-that-a-coarse-endpoint-observer-identifies",
    },
    exactCompositionalMemory: {
      referencePaths: rows.filter((row) => row.branch === "reference")
        .map((row) => row.pathHash),
      alternatePaths: rows.filter((row) => row.branch === "alternate")
        .map((row) => row.pathHash),
      commonLeftContinuationPreservesResidualHolonomy: true,
      residualHolonomyHash: g.hash,
      identityChartCoordinateSeparatesEveryPair: true,
    },
    endpointOnlyObserver: {
      probeCount: coarseProbes.length,
      observationFiberCount: endpointInformation.fiberCount,
      allExamplesAliased: true,
      irreducibleMinimaxTotalVariationError: 0.4,
      conditionalInformationGapNats: endpointInformation.gap,
      student: endpointStudent,
    },
    algebraogeneticObserver: {
      chartRule:
        "pull-back-through-the-reference-path-after-common-continuation-then-evaluate-at-identity",
      rawWitnessesNeededWithoutCharts: bases.length,
      sharedChartCoordinateCount: 1,
      observationFiberCount: holonomyInformation.fiberCount,
      conditionalInformationGapNats: holonomyInformation.gap,
      student: holonomyStudent,
    },
    conclusion:
      "obstruction-triggered-chart-growth-converts-path-relative-exact-memory-into-a-reusable-learnable-coordinate-while-fixed-endpoint-features-remain-information-theoretically-aliased",
    scope:
      "finite-constructive-ablation-not-evidence-that-nonsoficity-alone-improves-general-machine-learning",
  };
}

if (
  typeof process !== "undefined"
  && process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runHolonomyChartAblation(), null, 2));
}
