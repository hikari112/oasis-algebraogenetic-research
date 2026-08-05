import {
  SeededRng,
  fitIndependentBernoulli,
  klDivergence,
  normalize,
  sampleCategorical,
} from "./core.mjs";
import {
  makeTargetVariant,
  runGeneralizationStage,
} from "./multistep-benchmark.mjs";

const DEFAULT_COEFFICIENT_COUNTS = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 255];

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

function hadamard(values) {
  const result = [...values];
  for (let width = 1; width < result.length; width *= 2) {
    for (let start = 0; start < result.length; start += 2 * width) {
      for (let offset = 0; offset < width; offset += 1) {
        const left = result[start + offset];
        const right = result[start + offset + width];
        result[start + offset] = left + right;
        result[start + offset + width] = left - right;
      }
    }
  }
  return result;
}

export function fitWalshPolynomial(counts, coefficientCount, alpha = 0.25) {
  const dimension = counts.length;
  if ((dimension & (dimension - 1)) !== 0) {
    throw new Error("Walsh model requires a power-of-two state space");
  }
  if (coefficientCount < 0 || coefficientCount >= dimension) {
    throw new Error("Coefficient count must be between 0 and dimension - 1");
  }
  const total = counts.reduce((sum, count) => sum + count, 0);
  const logSmoothed = counts.map((count) =>
    Math.log((count + alpha) / (total + alpha * dimension)),
  );
  const coefficients = hadamard(logSmoothed).map((value) => value / dimension);
  const ranked = Array.from({ length: dimension - 1 }, (_, index) => index + 1)
    .sort((left, right) =>
      Math.abs(coefficients[right]) - Math.abs(coefficients[left]) || left - right,
    );
  const selectedMasks = ranked.slice(0, coefficientCount);
  const sparseSpectrum = Array(dimension).fill(0);
  sparseSpectrum[0] = coefficients[0];
  for (const mask of selectedMasks) sparseSpectrum[mask] = coefficients[mask];
  const logits = hadamard(sparseSpectrum);
  const maximum = Math.max(...logits);
  const probabilities = normalize(logits.map((value) => Math.exp(value - maximum)));
  return { probabilities, selectedMasks, coefficients };
}

export function selectWalshPolynomial({
  counts,
  validationCounts,
  target,
  coefficientCounts = DEFAULT_COEFFICIENT_COUNTS,
}) {
  let best = null;
  for (const coefficientCount of coefficientCounts) {
    const model = fitWalshPolynomial(counts, coefficientCount);
    const candidate = {
      coefficientCount,
      validationLoss: validationLoss(validationCounts, model.probabilities),
      trueKl: klDivergence(target, model.probabilities),
      probabilities: model.probabilities,
      selectedMasks: model.selectedMasks,
    };
    if (
      !best ||
      candidate.validationLoss < best.validationLoss - 1e-12 ||
      (Math.abs(candidate.validationLoss - best.validationLoss) < 1e-12 &&
        candidate.coefficientCount < best.coefficientCount)
    ) {
      best = candidate;
    }
  }
  return best;
}

export function runSpectralAlternativeBenchmark(options = {}) {
  const sampleSizes = options.sampleSizes ?? [250, 1000, 4000, 16000];
  const variants = options.variants ?? 6;
  const rootSeed = options.seed ?? 0x20260803;
  const coefficientCounts = options.coefficientCounts ?? DEFAULT_COEFFICIENT_COUNTS;
  const tree = runGeneralizationStage({ sampleSizes, variants, seed: rootSeed });
  const trials = [];

  for (const sampleCount of sampleSizes) {
    for (let variant = 0; variant < variants; variant += 1) {
      const trialSeed = (rootSeed ^ (sampleCount * 2654435761) ^ (variant * 2246822519)) >>> 0;
      const target = makeTargetVariant(variant, 8);
      const counts = sampleCategorical(target, sampleCount, new SeededRng(trialSeed));
      const validationCounts = sampleCategorical(
        target,
        Math.max(200, Math.floor(sampleCount * 0.25)),
        new SeededRng(trialSeed ^ 0xa5a5a5a5),
      );
      const selected = selectWalshPolynomial({
        counts,
        validationCounts,
        target,
        coefficientCounts,
      });
      const baselineKl = klDivergence(target, fitIndependentBernoulli(counts, 8));
      const treeTrial = tree.trials.find(
        (trial) => trial.sampleCount === sampleCount && trial.variant === variant,
      );
      trials.push({
        sampleCount,
        variant,
        seed: trialSeed,
        coefficientCount: selected.coefficientCount,
        spectralKl: selected.trueKl,
        treeKl: treeTrial.guided.trueKl,
        baselineKl,
      });
    }
  }

  const bySampleSize = sampleSizes.map((sampleCount) => {
    const group = trials.filter((trial) => trial.sampleCount === sampleCount);
    return {
      sampleCount,
      meanSpectralKl: mean(group.map((trial) => trial.spectralKl)),
      meanTreeKl: mean(group.map((trial) => trial.treeKl)),
      meanBaselineKl: mean(group.map((trial) => trial.baselineKl)),
      meanCoefficientCount: mean(group.map((trial) => trial.coefficientCount)),
    };
  });
  const first = bySampleSize[0].meanSpectralKl;
  const last = bySampleSize.at(-1).meanSpectralKl;
  return {
    config: { sampleSizes, variants, rootSeed, coefficientCounts },
    trials,
    summary: {
      meanSpectralKl: mean(trials.map((trial) => trial.spectralKl)),
      meanTreeKl: mean(trials.map((trial) => trial.treeKl)),
      meanBaselineKl: mean(trials.map((trial) => trial.baselineKl)),
      winRateVsTree: mean(trials.map((trial) => trial.spectralKl < trial.treeKl ? 1 : 0)),
      winRateVsBaseline: mean(trials.map((trial) => trial.spectralKl < trial.baselineKl ? 1 : 0)),
      dataReduction: (first - last) / first,
      bySampleSize,
    },
  };
}

export function formatSpectralReport(report) {
  const summary = report.summary;
  const lines = [
    "Sparse Walsh-polynomial alternative",
    "",
    `mean KL: spectral=${summary.meanSpectralKl.toFixed(6)} tree=${summary.meanTreeKl.toFixed(6)} baseline=${summary.meanBaselineKl.toFixed(6)}`,
    `win rate vs tree: ${(100 * summary.winRateVsTree).toFixed(1)}%`,
    `win rate vs baseline: ${(100 * summary.winRateVsBaseline).toFixed(1)}%`,
    `data-scaling reduction: ${(100 * summary.dataReduction).toFixed(1)}%`,
    "",
  ];
  for (const row of summary.bySampleSize) {
    lines.push(
      `n=${String(row.sampleCount).padStart(5)} spectral KL=${row.meanSpectralKl.toFixed(6)} tree KL=${row.meanTreeKl.toFixed(6)} coefficients=${row.meanCoefficientCount.toFixed(1)}`,
    );
  }
  return lines.join("\n");
}

