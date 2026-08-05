import {
  OasisProbeSynthesizer,
  SeededRng,
  generateProbeOrbit,
  klDivergence,
  makeProcessGenerators,
  replayOasisProgram,
  sampleCategorical,
  validationLoss,
} from "./oasis-core.mjs";
import { TARGET_FAMILIES } from "./targets.mjs";
import {
  CylinderTreeDistribution,
  fitIndependentBernoulli,
} from "../../nova-architecture/src/core.mjs";
import { selectWalshPolynomial } from "../../nova-architecture/src/spectral-alternative.mjs";

const TREE_BUDGETS = [1, 2, 4, 8, 16, 32, 64, 128];
const OASIS_STEPS = [4, 8, 12, 16, 24, 32, 48, 64, 96];

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function selectCylinder(counts, validationCounts, target) {
  let best = null;
  for (const budget of TREE_BUDGETS) {
    const model = new CylinderTreeDistribution(8, 0.25).fit(counts, budget);
    const probabilities = model.probabilities();
    const candidate = {
      complexity: model.leaves.length,
      validationLoss: validationLoss(validationCounts, probabilities),
      trueKl: klDivergence(target, probabilities),
    };
    if (!best || candidate.validationLoss < best.validationLoss - 1e-12) best = candidate;
  }
  return best;
}

function selectOasis(counts, validationCounts, target, options = {}) {
  const synthesizer = new OasisProbeSynthesizer(8, {
    obstructionWeight: options.obstructionWeight ?? 0.08,
    complexityWeight: options.complexityWeight ?? 0.0002,
    processWindowSize: options.processWindowSize ?? 16,
  });
  const fit = synthesizer.fit(counts, {
    maxSteps: Math.max(...OASIS_STEPS),
    snapshotSteps: OASIS_STEPS,
  });
  let best = null;
  for (const step of OASIS_STEPS) {
    const probabilities = fit.snapshots.get(step);
    const candidate = {
      step,
      validationLoss: validationLoss(validationCounts, probabilities),
      trueKl: klDivergence(target, probabilities),
      probabilities,
      processSeparation: fit.diagnostics[step - 1].processSeparation,
      activeProbes: fit.diagnostics[step - 1].activeProbes,
    };
    if (!best || candidate.validationLoss < best.validationLoss - 1e-12) best = candidate;
  }
  const replayed = replayOasisProgram(256, fit.program.slice(0, best.step));
  const replayDelta = Math.max(
    ...replayed.map((value, state) => Math.abs(value - best.probabilities[state])),
  );
  return {
    ...best,
    replayDelta,
    candidateCount: fit.candidateCount,
    program: fit.program.slice(0, best.step),
  };
}

function verifyDerivations() {
  const generators = new Map(
    makeProcessGenerators(8).map((generator) => [generator.name, generator.process]),
  );
  const orbit = generateProbeOrbit(8);
  for (const probe of orbit) {
    let mask = 1 << probe.seedBit;
    for (const name of probe.word) mask = generators.get(name).pullbackMask(mask);
    if (mask !== probe.mask) return false;
  }
  return orbit.length === 255;
}

function runObstructionAblation(seed) {
  const target = TARGET_FAMILIES.find((family) => family.name === "sparse-orbit").make(seed);
  const counts = sampleCategorical(target, 2000, new SeededRng(seed));
  const validationCounts = sampleCategorical(target, 500, new SeededRng(seed ^ 0xa5a5a5a5));
  const without = selectOasis(counts, validationCounts, target, {
    obstructionWeight: 0,
    processWindowSize: 24,
  });
  const withObstruction = selectOasis(counts, validationCounts, target, {
    obstructionWeight: 0.12,
    processWindowSize: 24,
  });
  const earlyTrials = [];
  for (let trial = 1; trial <= 30; trial += 1) {
    const earlyTarget = TARGET_FAMILIES.find(
      (family) => family.name === "sparse-orbit",
    ).make(trial * 997);
    const earlyCounts = sampleCategorical(
      earlyTarget,
      2000,
      new SeededRng(trial * 31337),
    );
    const row = { trial };
    for (const [name, obstructionWeight] of [["without", 0], ["withObstruction", 1]]) {
      const synthesizer = new OasisProbeSynthesizer(8, {
        obstructionWeight,
        complexityWeight: 0.0002,
        processWindowSize: 24,
      });
      const fit = synthesizer.fit(earlyCounts, { maxSteps: 2, snapshotSteps: [2] });
      row[name] = {
        kl: klDivergence(earlyTarget, fit.probabilities),
        processSeparation: fit.finalProcessSeparation,
      };
    }
    earlyTrials.push(row);
  }
  return {
    converged: {
      without: {
        kl: without.trueKl,
        processSeparation: without.processSeparation,
        step: without.step,
      },
      withObstruction: {
        kl: withObstruction.trueKl,
        processSeparation: withObstruction.processSeparation,
        step: withObstruction.step,
      },
    },
    twoProbeBudget: {
      trials: earlyTrials.length,
      meanSeparationWithout: mean(
        earlyTrials.map((trial) => trial.without.processSeparation),
      ),
      meanSeparationWith: mean(
        earlyTrials.map((trial) => trial.withObstruction.processSeparation),
      ),
      improvedTrials: earlyTrials.filter(
        (trial) =>
          trial.withObstruction.processSeparation > trial.without.processSeparation + 1e-12,
      ).length,
      worsenedTrials: earlyTrials.filter(
        (trial) =>
          trial.withObstruction.processSeparation + 1e-12 < trial.without.processSeparation,
      ).length,
      meanKlWithout: mean(earlyTrials.map((trial) => trial.without.kl)),
      meanKlWith: mean(earlyTrials.map((trial) => trial.withObstruction.kl)),
    },
  };
}

export function runOasisBenchmark(options = {}) {
  const sampleSizes = options.sampleSizes ?? [500, 2000, 8000];
  const replicates = options.replicates ?? 2;
  const rootSeed = options.seed ?? 0x0a515202;
  const trials = [];

  for (const family of TARGET_FAMILIES) {
    for (const sampleCount of sampleSizes) {
      for (let replicate = 0; replicate < replicates; replicate += 1) {
        const seed = (
          rootSeed ^
          (sampleCount * 2654435761) ^
          (replicate * 2246822519) ^
          (TARGET_FAMILIES.indexOf(family) * 3266489917)
        ) >>> 0;
        const target = family.make(seed);
        const counts = sampleCategorical(target, sampleCount, new SeededRng(seed));
        const validationCounts = sampleCategorical(
          target,
          Math.max(250, Math.floor(sampleCount * 0.25)),
          new SeededRng(seed ^ 0xa5a5a5a5),
        );
        const independent = fitIndependentBernoulli(counts, 8);
        const cylinder = selectCylinder(counts, validationCounts, target);
        const spectral = selectWalshPolynomial({ counts, validationCounts, target });
        const oasis = selectOasis(counts, validationCounts, target);
        trials.push({
          family: family.name,
          sampleCount,
          replicate,
          seed,
          independentKl: klDivergence(target, independent),
          cylinderKl: cylinder.trueKl,
          cylinderLeaves: cylinder.complexity,
          spectralKl: spectral.trueKl,
          spectralCoefficients: spectral.coefficientCount,
          oasisKl: oasis.trueKl,
          oasisSteps: oasis.step,
          oasisActiveProbes: oasis.activeProbes,
          oasisProcessSeparation: oasis.processSeparation,
          oasisReplayDelta: oasis.replayDelta,
        });
      }
    }
  }

  const byFamily = TARGET_FAMILIES.map((family) => {
    const group = trials.filter((trial) => trial.family === family.name);
    return {
      family: family.name,
      independentKl: mean(group.map((trial) => trial.independentKl)),
      cylinderKl: mean(group.map((trial) => trial.cylinderKl)),
      spectralKl: mean(group.map((trial) => trial.spectralKl)),
      oasisKl: mean(group.map((trial) => trial.oasisKl)),
      oasisWinRateVsIndependent: mean(
        group.map((trial) => trial.oasisKl < trial.independentKl ? 1 : 0),
      ),
      oasisWinRateVsCylinder: mean(
        group.map((trial) => trial.oasisKl < trial.cylinderKl ? 1 : 0),
      ),
      meanProcessSeparation: mean(group.map((trial) => trial.oasisProcessSeparation)),
    };
  });

  return {
    config: { sampleSizes, replicates, rootSeed, families: TARGET_FAMILIES.map((x) => x.name) },
    finiteUniversality: {
      generatedProbeCount: generateProbeOrbit(8).length,
      expectedNonconstantProbeCount: 255,
      derivationsExact: verifyDerivations(),
    },
    trials,
    summary: {
      independentKl: mean(trials.map((trial) => trial.independentKl)),
      cylinderKl: mean(trials.map((trial) => trial.cylinderKl)),
      spectralKl: mean(trials.map((trial) => trial.spectralKl)),
      oasisKl: mean(trials.map((trial) => trial.oasisKl)),
      oasisWinRateVsIndependent: mean(
        trials.map((trial) => trial.oasisKl < trial.independentKl ? 1 : 0),
      ),
      oasisWinRateVsCylinder: mean(
        trials.map((trial) => trial.oasisKl < trial.cylinderKl ? 1 : 0),
      ),
      maximumReplayDelta: Math.max(...trials.map((trial) => trial.oasisReplayDelta)),
      byFamily,
    },
    obstructionAblation: runObstructionAblation(rootSeed ^ 0x51f15e),
  };
}

export function formatOasisReport(report) {
  const lines = [
    "OASIS heterogeneous-family benchmark",
    "",
    `generated probes: ${report.finiteUniversality.generatedProbeCount}/${report.finiteUniversality.expectedNonconstantProbeCount}`,
    `exact derivations: ${report.finiteUniversality.derivationsExact}`,
    `maximum replay delta: ${report.summary.maximumReplayDelta}`,
    "",
    "mean KL across all trials:",
    `  independent ${report.summary.independentKl.toFixed(6)}`,
    `  cylinder    ${report.summary.cylinderKl.toFixed(6)}`,
    `  spectral    ${report.summary.spectralKl.toFixed(6)}`,
    `  OASIS       ${report.summary.oasisKl.toFixed(6)}`,
    `OASIS win rate vs independent: ${(100 * report.summary.oasisWinRateVsIndependent).toFixed(1)}%`,
    `OASIS win rate vs cylinder:    ${(100 * report.summary.oasisWinRateVsCylinder).toFixed(1)}%`,
    "",
    "by family (mean KL):",
  ];
  for (const row of report.summary.byFamily) {
    lines.push(
      `  ${row.family.padEnd(22)} OASIS=${row.oasisKl.toFixed(6)} spectral=${row.spectralKl.toFixed(6)} cylinder=${row.cylinderKl.toFixed(6)} independent=${row.independentKl.toFixed(6)}`,
    );
  }
  lines.push("");
  lines.push("obstruction ablation:");
  lines.push(
    `  converged without: KL=${report.obstructionAblation.converged.without.kl.toFixed(6)} separation=${report.obstructionAblation.converged.without.processSeparation.toFixed(3)}`,
  );
  lines.push(
    `  converged with:    KL=${report.obstructionAblation.converged.withObstruction.kl.toFixed(6)} separation=${report.obstructionAblation.converged.withObstruction.processSeparation.toFixed(3)}`,
  );
  lines.push(
    `  two-probe mean without: KL=${report.obstructionAblation.twoProbeBudget.meanKlWithout.toFixed(6)} separation=${report.obstructionAblation.twoProbeBudget.meanSeparationWithout.toFixed(3)}`,
  );
  lines.push(
    `  two-probe mean with:    KL=${report.obstructionAblation.twoProbeBudget.meanKlWith.toFixed(6)} separation=${report.obstructionAblation.twoProbeBudget.meanSeparationWith.toFixed(3)}`,
  );
  lines.push(
    `  separation improved in ${report.obstructionAblation.twoProbeBudget.improvedTrials}/${report.obstructionAblation.twoProbeBudget.trials} trials and worsened in ${report.obstructionAblation.twoProbeBudget.worsenedTrials}`,
  );
  return lines.join("\n");
}
