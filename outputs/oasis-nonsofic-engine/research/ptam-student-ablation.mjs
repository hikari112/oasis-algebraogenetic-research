import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import {
  CertifiedBoundedProgram,
  delayedHaltMachine,
} from "./presentation-transcendent-algebra.mjs";
import {
  compileQueryLocalUniversalChart,
  enumerateExactGroupWindow,
} from "./query-local-universality.mjs";

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

function trainLogisticStudent(featureRows, targets, { steps = 20000, learningRate = 0.5 } = {}) {
  const augmented = featureRows.map((row) => [1, ...row]);
  const weights = Array(augmented[0].length).fill(0);
  for (let step = 0; step < steps; step += 1) {
    const gradient = Array(weights.length).fill(0);
    for (let rowIndex = 0; rowIndex < augmented.length; rowIndex += 1) {
      const row = augmented[rowIndex];
      const logit = row.reduce((sum, value, index) => sum + value * weights[index], 0);
      const error = sigmoid(logit) - targets[rowIndex];
      for (let index = 0; index < gradient.length; index += 1) {
        gradient[index] += error * row[index] / augmented.length;
      }
    }
    for (let index = 0; index < weights.length; index += 1) {
      weights[index] -= learningRate * gradient[index];
    }
  }

  const predictions = augmented.map((row) => sigmoid(
    row.reduce((sum, value, index) => sum + value * weights[index], 0),
  ));
  const totalVariationErrors = predictions.map(
    (prediction, index) => Math.abs(prediction - targets[index]),
  );
  const klErrors = predictions.map(
    (prediction, index) => binaryKl(targets[index], prediction),
  );
  return {
    parameterCount: weights.length,
    weights,
    predictions,
    maximumTotalVariationError: Math.max(...totalVariationErrors),
    meanKl: klErrors.reduce((sum, value) => sum + value, 0) / klErrors.length,
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
    for (const index of fiber) {
      gap += binaryKl(targets[index], mixture) / targets.length;
    }
  }
  return gap;
}

export function runPtamStudentAblation() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const generatorNames = ["x:0:1:s0", "x:1:0:s1"];
  const window = enumerateExactGroupWindow(groupOracle, generatorNames, 6, 256)
    .sort((left, right) => left.hash.length - right.hash.length);
  const shallowProbes = window.slice(0, 8);
  const shallowMaximumBudget = Math.max(...shallowProbes.map((probe) => probe.hash.length));
  const deeperBudgets = [...new Set(
    window.map((probe) => probe.hash.length).filter((value) => value > shallowMaximumBudget),
  )].sort((left, right) => left - right);
  assert(deeperBudgets.length >= 2);
  const delays = [deeperBudgets[0], deeperBudgets.at(-1)];
  const contexts = [
    {
      id: "semantic-zero",
      program: CertifiedBoundedProgram.constant(0),
      target: [0.9, 0.1],
    },
    {
      id: `clock-${delays[0]}`,
      program: CertifiedBoundedProgram.haltingClock(delayedHaltMachine(delays[0])),
      target: [0.1, 0.9],
    },
    {
      id: `clock-${delays[1]}`,
      program: CertifiedBoundedProgram.haltingClock(delayedHaltMachine(delays[1])),
      target: [0.3, 0.7],
    },
  ];

  const compilation = compileQueryLocalUniversalChart({
    contexts,
    initialProbes: shallowProbes,
    groupOracle,
    generatorNames,
    labelPrefixes: ["000", "001"],
    epsilon: 1e-12,
  });
  const byHash = new Map(window.map((probe) => [probe.hash, probe]));
  const witnessProbes = compilation.witnessTrace.map((witness) => {
    const probe = byHash.get(witness.witnessHash);
    assert(probe);
    return probe;
  });
  const targets = contexts.map((context) => context.target[1]);
  const shallowFeatures = contexts.map(() => []);
  const refinedFeatures = contexts.map((context) => witnessProbes.map(
    (probe) => Number(context.program.evaluate(probe.unit)),
  ));
  const shallowStudent = trainLogisticStudent(shallowFeatures, targets);
  const refinedStudent = trainLogisticStudent(refinedFeatures, targets);
  const shallowConditionalInformation = conditionalInformationGap(shallowFeatures, targets);
  const refinedConditionalInformation = conditionalInformationGap(refinedFeatures, targets);

  assert(
    shallowStudent.maximumTotalVariationError
      >= compilation.initialAudit.minimaxTotalVariationLowerBound - 1e-8,
  );
  assert(refinedStudent.maximumTotalVariationError < 1e-8);
  assert(refinedStudent.meanKl < shallowStudent.meanKl * 1e-8);
  assert(Math.abs(shallowStudent.meanKl - shallowConditionalInformation) < 1e-12);
  assert.equal(refinedConditionalInformation, 0);

  return {
    schema: "oasis.ptam-trained-student-ablation.v1",
    task: {
      contextCount: contexts.length,
      targetSecondOutcomeProbabilities: targets,
      initialObservationFiberCount: compilation.initialAudit.fiberCount,
      refinedObservationFiberCount: compilation.finalAudit.fiberCount,
      compiledWitnessCount: witnessProbes.length,
      maximumWitnessComplexity: Math.max(
        ...compilation.witnessTrace.map((witness) => witness.witnessComplexity),
      ),
    },
    fixedWindowLowerBound: compilation.initialAudit.minimaxTotalVariationLowerBound,
    bayesianObstruction: {
      interpretation: "I(Y;native-context | current-observation-signature)",
      unit: "nats",
      shallowConditionalInformation,
      refinedConditionalInformation,
      informationReleasedByCompiledWitnesses:
        shallowConditionalInformation - refinedConditionalInformation,
      optimalLogLossIdentityVerified:
        Math.abs(shallowStudent.meanKl - shallowConditionalInformation) < 1e-12,
      candidateProbeScore:
        "conditional-information-before-minus-conditional-information-after",
    },
    shallowStudent,
    refinedStudent,
    conclusion:
      "gradient-training-cannot-repair-an-observational-quotient-that-identifies-conflicting-targets-but-succeeds-after-native-witness-compilation",
  };
}

if (
  typeof process !== "undefined"
  && process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runPtamStudentAblation(), null, 2));
}
