import {
  CylinderProgram,
  CylinderTreeDistribution,
  FiniteProbe,
  FiniteProcess,
  PrimitiveDistributionState,
  SeededRng,
  bitAt,
  fitIndependentBernoulli,
  klDivergence,
  makeStructuredTarget,
  observabilityMatrix,
  rotateStateProbabilities,
  sampleCategorical,
} from "./core.mjs";

const DEFAULT_BUDGETS = [1, 2, 4, 8, 16, 32, 64, 128];

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function validationLoss(counts, probabilities) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  return -counts.reduce(
    (sum, count, state) => sum + count * Math.log(Math.max(probabilities[state], 1e-300)),
    0,
  ) / total;
}

function xorPermute(probabilities, mask) {
  const result = Array(probabilities.length).fill(0);
  for (let state = 0; state < probabilities.length; state += 1) {
    result[state ^ mask] += probabilities[state];
  }
  return result;
}

export function makeTargetVariant(index, nBits = 8) {
  const base = makeStructuredTarget(nBits);
  const rotation = (index * 3) % nBits;
  const mask = ((0x5b * (index + 1)) ^ (index << 4)) & (2 ** nBits - 1);
  return xorPermute(rotateStateProbabilities(base, nBits, rotation), mask);
}

export function fitRandomCylinder(counts, nBits, maxLeaves, seed) {
  const model = new CylinderTreeDistribution(nBits, 0.25);
  model.setCounts(counts);
  model.reset();
  const rng = new SeededRng(seed);
  while (model.leaves.length < maxLeaves) {
    const candidates = [];
    for (let leafIndex = 0; leafIndex < model.leaves.length; leafIndex += 1) {
      const leaf = model.leaves[leafIndex];
      for (let bit = 0; bit < nBits; bit += 1) {
        if (!leaf.constraints.has(bit)) candidates.push({ leafIndex, bit });
      }
    }
    if (candidates.length === 0) break;
    const choice = candidates[Math.floor(rng.next() * candidates.length)];
    model.applySplit(choice.leafIndex, choice.bit);
  }
  return model;
}

function selectModel({ counts, validationCounts, target, nBits, budgets, kind, seed }) {
  let best = null;
  for (const budget of budgets) {
    const model = kind === "guided"
      ? new CylinderTreeDistribution(nBits, 0.25).fit(counts, budget)
      : fitRandomCylinder(counts, nBits, budget, seed ^ (budget * 0x9e3779b9));
    const probabilities = model.probabilities();
    const candidate = {
      kind,
      budget,
      leaves: model.leaves.length,
      validationLoss: validationLoss(validationCounts, probabilities),
      trueKl: klDivergence(target, probabilities),
      model,
      probabilities,
    };
    if (
      !best ||
      candidate.validationLoss < best.validationLoss - 1e-12 ||
      (Math.abs(candidate.validationLoss - best.validationLoss) < 1e-12 &&
        candidate.leaves < best.leaves)
    ) {
      best = candidate;
    }
  }
  return best;
}

function compactSelection(selection) {
  return {
    leaves: selection.leaves,
    validationLoss: selection.validationLoss,
    trueKl: selection.trueKl,
  };
}

export function runGeneralizationStage(options = {}) {
  const nBits = options.nBits ?? 8;
  const sampleSizes = options.sampleSizes ?? [250, 1000, 4000, 16000];
  const variants = options.variants ?? 6;
  const budgets = options.budgets ?? DEFAULT_BUDGETS;
  const rootSeed = options.seed ?? 0x20260803;
  const trials = [];

  for (const sampleCount of sampleSizes) {
    for (let variant = 0; variant < variants; variant += 1) {
      const trialSeed = (rootSeed ^ (sampleCount * 2654435761) ^ (variant * 2246822519)) >>> 0;
      const target = makeTargetVariant(variant, nBits);
      const counts = sampleCategorical(target, sampleCount, new SeededRng(trialSeed));
      const validationCount = Math.max(200, Math.floor(sampleCount * 0.25));
      const validationCounts = sampleCategorical(
        target,
        validationCount,
        new SeededRng(trialSeed ^ 0xa5a5a5a5),
      );
      const baseline = fitIndependentBernoulli(counts, nBits);
      const baselineKl = klDivergence(target, baseline);
      const guided = selectModel({
        counts,
        validationCounts,
        target,
        nBits,
        budgets,
        kind: "guided",
        seed: trialSeed,
      });
      const random = selectModel({
        counts,
        validationCounts,
        target,
        nBits,
        budgets,
        kind: "random",
        seed: trialSeed ^ 0x3c6ef372,
      });
      const replay = new CylinderTreeDistribution(nBits, 0.25).replay(
        guided.model.program,
        counts,
      );
      const replayDelta = Math.max(
        ...replay.probabilities().map((value, state) =>
          Math.abs(value - guided.probabilities[state])),
      );
      trials.push({
        sampleCount,
        variant,
        seed: trialSeed,
        baselineKl,
        guided: compactSelection(guided),
        random: compactSelection(random),
        replayDelta,
      });
    }
  }

  const bySampleSize = sampleSizes.map((sampleCount) => {
    const group = trials.filter((trial) => trial.sampleCount === sampleCount);
    return {
      sampleCount,
      meanBaselineKl: mean(group.map((trial) => trial.baselineKl)),
      meanGuidedKl: mean(group.map((trial) => trial.guided.trueKl)),
      meanRandomKl: mean(group.map((trial) => trial.random.trueKl)),
      meanSelectedLeaves: mean(group.map((trial) => trial.guided.leaves)),
    };
  });

  return {
    config: { nBits, sampleSizes, variants, budgets, rootSeed },
    trials,
    summary: {
      meanBaselineKl: mean(trials.map((trial) => trial.baselineKl)),
      meanGuidedKl: mean(trials.map((trial) => trial.guided.trueKl)),
      meanRandomKl: mean(trials.map((trial) => trial.random.trueKl)),
      baselineWinRate: mean(trials.map((trial) => trial.guided.trueKl < trial.baselineKl ? 1 : 0)),
      randomWinRate: mean(trials.map((trial) => trial.guided.trueKl < trial.random.trueKl ? 1 : 0)),
      maxReplayDelta: Math.max(...trials.map((trial) => trial.replayDelta)),
      bySampleSize,
    },
  };
}

export function runAdaptationStage(options = {}) {
  const nBits = options.nBits ?? 8;
  const seed = options.seed ?? 0x51f15e;
  const initialCount = options.initialCount ?? 4000;
  const batchSize = options.batchSize ?? 2000;
  const batches = options.batches ?? 4;
  const leaves = options.leaves ?? 128;
  const targetA = makeTargetVariant(0, nBits);
  const targetB = rotateStateProbabilities(makeTargetVariant(3, nBits), nBits, 1);
  const cumulative = sampleCategorical(targetA, initialCount, new SeededRng(seed));
  const initialModel = new CylinderTreeDistribution(nBits, 0.25).fit(cumulative, leaves);
  const initialShiftKl = klDivergence(targetB, initialModel.probabilities());
  const trajectory = [{ shiftedObservations: 0, klToShiftedTarget: initialShiftKl }];

  for (let batch = 1; batch <= batches; batch += 1) {
    const additions = sampleCategorical(
      targetB,
      batchSize,
      new SeededRng(seed ^ (batch * 0x9e3779b9)),
    );
    for (let state = 0; state < cumulative.length; state += 1) cumulative[state] += additions[state];
    const model = new CylinderTreeDistribution(nBits, 0.25).fit(cumulative, leaves);
    trajectory.push({
      shiftedObservations: batch * batchSize,
      klToShiftedTarget: klDivergence(targetB, model.probabilities()),
    });
  }
  const finalShiftKl = trajectory.at(-1).klToShiftedTarget;
  return {
    config: { nBits, seed, initialCount, batchSize, batches, leaves },
    trajectory,
    relativeReduction: (initialShiftKl - finalShiftKl) / initialShiftKl,
  };
}

export function runObservabilityStage() {
  const nBits = 8;
  const target = makeTargetVariant(2, nBits);
  const seedState = new PrimitiveDistributionState({ probabilities: target, hiddenTag: 0, nBits });
  const processes = [
    new FiniteProcess("identity", (representation) => ({ ...representation })),
    new FiniteProcess("rotate", (representation) => ({
      ...representation,
      probabilities: rotateStateProbabilities(representation.probabilities, nBits, 1),
    })),
    new FiniteProcess("hidden-tag", (representation) => ({
      ...representation,
      hiddenTag: representation.hiddenTag + 1,
    })),
  ];
  const distributionProbes = [0, 2, 5, 7].map((bit) =>
    new FiniteProbe(`P(bit-${bit}=1)`, (representation) =>
      representation.probabilities.reduce(
        (sum, probability, state) => sum + probability * bitAt(state, bit, nBits),
        0,
      )),
  );
  const restricted = observabilityMatrix(seedState, processes, distributionProbes);
  const expanded = observabilityMatrix(seedState, processes, [
    ...distributionProbes,
    new FiniteProbe("hidden-tag", (representation) => representation.hiddenTag),
  ]);
  return { restricted, expanded };
}

export function runIntegrityStage() {
  const target = makeTargetVariant(1, 8);
  const counts = sampleCategorical(target, 6000, new SeededRng(991));
  const model = new CylinderTreeDistribution(8, 0.25).fit(counts, 128);
  const midpoint = Math.floor(model.program.operations.length / 2);
  const first = new CylinderProgram(8, model.program.operations.slice(0, midpoint));
  const second = new CylinderProgram(8, model.program.operations.slice(midpoint));
  const composed = first.compose(second);
  const replay = new CylinderTreeDistribution(8, 0.25).replay(composed, counts);
  const replayDelta = Math.max(
    ...replay.probabilities().map((value, state) =>
      Math.abs(value - model.probabilities()[state])),
  );
  const corrupted = new CylinderProgram(8, composed.operations);
  corrupted.operations[Math.floor(corrupted.operations.length / 3)] = {
    ...corrupted.operations[Math.floor(corrupted.operations.length / 3)],
    leaf: "not:a:valid:leaf",
  };
  let corruptRejected = false;
  try {
    new CylinderTreeDistribution(8, 0.25).replay(corrupted, counts);
  } catch {
    corruptRejected = true;
  }
  return {
    operations: model.program.operations.length,
    compositionExact: JSON.stringify(composed.toJSON()) === JSON.stringify(model.program.toJSON()),
    replayDelta,
    corruptRejected,
  };
}

function hasCollision(matrix, left, right) {
  return matrix.collisions.some(
    ([a, b]) => (a === left && b === right) || (a === right && b === left),
  );
}

export function evaluateGates(report) {
  const sizeRows = report.generalization.summary.bySampleSize;
  const smallKl = sizeRows.find((row) => row.sampleCount === 250).meanGuidedKl;
  const largeKl = sizeRows.find((row) => row.sampleCount === 16000).meanGuidedKl;
  const gates = {
    exactness:
      report.generalization.summary.maxReplayDelta < 1e-15 &&
      report.integrity.replayDelta < 1e-15 &&
      report.integrity.compositionExact &&
      report.integrity.corruptRejected,
    generalization:
      report.generalization.summary.baselineWinRate >= 0.75 &&
      report.generalization.summary.meanGuidedKl < report.generalization.summary.meanBaselineKl,
    structuralContribution:
      report.generalization.summary.randomWinRate >= 0.60 &&
      report.generalization.summary.meanGuidedKl < report.generalization.summary.meanRandomKl,
    dataEfficiency: largeKl <= smallKl * 0.65,
    bayesianAdaptation: report.adaptation.relativeReduction >= 0.30,
    observability:
      hasCollision(report.observability.restricted, "identity", "hidden-tag") &&
      !hasCollision(report.observability.expanded, "identity", "hidden-tag") &&
      !hasCollision(report.observability.restricted, "identity", "rotate") &&
      !hasCollision(report.observability.expanded, "identity", "rotate"),
  };
  return {
    ...gates,
    passed: Object.values(gates).filter(Boolean).length,
    total: Object.keys(gates).length,
    allPassed: Object.values(gates).every(Boolean),
  };
}

export function runMultiStepBenchmark(options = {}) {
  const report = {
    generalization: runGeneralizationStage(options.generalization),
    adaptation: runAdaptationStage(options.adaptation),
    observability: runObservabilityStage(),
    integrity: runIntegrityStage(),
  };
  report.gates = evaluateGates(report);
  return report;
}

export function formatMultiStepReport(report) {
  const summary = report.generalization.summary;
  const lines = [
    "NOVA multi-step falsification benchmark",
    "",
    `mean KL: baseline=${summary.meanBaselineKl.toFixed(6)} guided=${summary.meanGuidedKl.toFixed(6)} random=${summary.meanRandomKl.toFixed(6)}`,
    `win rate vs baseline: ${(100 * summary.baselineWinRate).toFixed(1)}%`,
    `win rate vs random:   ${(100 * summary.randomWinRate).toFixed(1)}%`,
    `maximum replay delta: ${summary.maxReplayDelta}`,
    "",
    "data scaling:",
  ];
  for (const row of summary.bySampleSize) {
    lines.push(
      `  n=${String(row.sampleCount).padStart(5)} guided KL=${row.meanGuidedKl.toFixed(6)} selected leaves=${row.meanSelectedLeaves.toFixed(1)}`,
    );
  }
  lines.push("");
  lines.push("adaptation trajectory:");
  for (const row of report.adaptation.trajectory) {
    lines.push(
      `  shifted observations=${String(row.shiftedObservations).padStart(5)} KL=${row.klToShiftedTarget.toFixed(6)}`,
    );
  }
  lines.push(`  relative reduction=${(100 * report.adaptation.relativeReduction).toFixed(1)}%`);
  lines.push("");
  lines.push("gates:");
  for (const [name, passed] of Object.entries(report.gates)) {
    if (["passed", "total", "allPassed"].includes(name)) continue;
    lines.push(`  ${passed ? "PASS" : "FAIL"} ${name}`);
  }
  lines.push(`overall: ${report.gates.passed}/${report.gates.total} gates passed`);
  return lines.join("\n");
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`
) {
  console.log(formatMultiStepReport(runMultiStepBenchmark()));
}

