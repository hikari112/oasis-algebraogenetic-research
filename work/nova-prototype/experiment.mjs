import {
  CylinderTreeDistribution,
  FiniteProbe,
  FiniteProcess,
  PrimitiveDistributionState,
  SeededRng,
  bitAt,
  crossEntropy,
  fitIndependentBernoulli,
  klDivergence,
  makeStructuredTarget,
  observabilityMatrix,
  rotateStateProbabilities,
  sampleCategorical,
  totalVariation,
} from "./core.mjs";

export function runExperiment(options = {}) {
  const nBits = options.nBits ?? 8;
  const sampleCount = options.sampleCount ?? 12000;
  const seed = options.seed ?? 0x5eed1234;
  const leafBudgets = options.leafBudgets ?? [1, 2, 4, 8, 16, 32, 64, 128, 256];
  const target = makeStructuredTarget(nBits);
  const counts = sampleCategorical(target, sampleCount, new SeededRng(seed));

  const independent = fitIndependentBernoulli(counts, nBits);
  const baseline = {
    model: "independent-bernoulli",
    leaves: null,
    kl: klDivergence(target, independent),
    tv: totalVariation(target, independent),
    crossEntropy: crossEntropy(target, independent),
  };

  const results = [];
  let finalModel = null;
  for (const maxLeaves of leafBudgets) {
    const model = new CylinderTreeDistribution(nBits, 0.25).fit(counts, maxLeaves);
    const predicted = model.probabilities();
    results.push({
      model: "nova-cylinder",
      leaves: model.leaves.length,
      kl: klDivergence(target, predicted),
      tv: totalVariation(target, predicted),
      crossEntropy: crossEntropy(target, predicted),
      operations: model.program.operations.length,
    });
    finalModel = model;
  }

  const replay = new CylinderTreeDistribution(nBits, 0.25).replay(finalModel.program, counts);
  const replayDifference = Math.max(
    ...replay.probabilities().map(
      (value, i) => Math.abs(value - finalModel.probabilities()[i]),
    ),
  );

  const seedState = new PrimitiveDistributionState({
    probabilities: target,
    hiddenTag: 0,
    nBits,
  });
  const processes = [
    new FiniteProcess("identity", (representation) => ({ ...representation })),
    new FiniteProcess("rotate-bits", (representation) => ({
      ...representation,
      probabilities: rotateStateProbabilities(
        representation.probabilities,
        representation.nBits,
        1,
      ),
    })),
    new FiniteProcess("decorative-hidden-tag", (representation) => ({
      ...representation,
      hiddenTag: representation.hiddenTag + 1,
    })),
  ];
  const probes = [0, 1, 3, 7].map(
    (bit) => new FiniteProbe(`P(bit-${bit}=1)`, (representation) =>
      representation.probabilities.reduce(
        (sum, probability, state) =>
          sum + probability * bitAt(state, bit, representation.nBits),
        0,
      )),
  );
  probes.push(new FiniteProbe("P(parity-0,2,5,7=0)", (representation) =>
    representation.probabilities.reduce((sum, probability, state) => {
      const parity =
        bitAt(state, 0, representation.nBits) ^
        bitAt(state, 2, representation.nBits) ^
        bitAt(state, 5, representation.nBits) ^
        bitAt(state, 7, representation.nBits);
      return sum + (parity === 0 ? probability : 0);
    }, 0)));

  return {
    config: { nBits, sampleCount, seed, leafBudgets },
    baseline,
    results,
    replay: {
      maxProbabilityDifference: replayDifference,
      exactWithinTolerance: replayDifference < 1e-15,
    },
    observability: observabilityMatrix(seedState, processes, probes),
    finalStructure: finalModel.structure(),
    program: finalModel.program.toJSON(),
  };
}

function formatNumber(value) {
  return value.toFixed(6);
}

export function formatReport(report) {
  const lines = [];
  lines.push("NOVA finite-probe experiment");
  lines.push(`bits=${report.config.nBits} samples=${report.config.sampleCount} seed=${report.config.seed}`);
  lines.push("");
  lines.push("model                  leaves      KL          TV          cross-entropy");
  lines.push(
    `${report.baseline.model.padEnd(22)} ${"-".padStart(6)}  ${formatNumber(report.baseline.kl)}  ${formatNumber(report.baseline.tv)}  ${formatNumber(report.baseline.crossEntropy)}`,
  );
  for (const row of report.results) {
    lines.push(
      `${row.model.padEnd(22)} ${String(row.leaves).padStart(6)}  ${formatNumber(row.kl)}  ${formatNumber(row.tv)}  ${formatNumber(row.crossEntropy)}`,
    );
  }
  lines.push("");
  lines.push(`exact symbolic replay: ${report.replay.exactWithinTolerance} (max delta ${report.replay.maxProbabilityDifference})`);
  lines.push("probe observability collisions:");
  for (const collision of report.observability.collisions) {
    lines.push(`  ${collision[0]} == ${collision[1]}`);
  }
  return lines.join("\n");
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`
) {
  const report = runExperiment();
  console.log(formatReport(report));
}
