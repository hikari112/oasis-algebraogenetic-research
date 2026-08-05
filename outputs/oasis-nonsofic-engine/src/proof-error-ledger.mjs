function probability(value, name) {
  if (!(value >= 0 && value <= 1)) throw new Error(`${name} must lie in [0,1]`);
  return value;
}

function positive(value, name) {
  if (!(value > 0)) throw new Error(`${name} must be positive`);
  return value;
}

export function propagateExpansionLefBudget({
  gammaExpansion,
  ambientExpansion,
  transportBoundaryFractions,
  eta,
  totalVariationFraction,
  delta,
  selectedComponentBadFraction,
  gammaEditFraction,
  lambda,
  maximumWordLength,
  clusterAlmostAutomorphismError,
}) {
  positive(gammaExpansion, "gammaExpansion");
  positive(ambientExpansion, "ambientExpansion");
  positive(eta, "eta");
  positive(delta, "delta");
  if (!(delta < 0.5)) throw new Error("delta must be below 1/2");
  if (!(lambda > 0 && lambda < gammaExpansion)) {
    throw new Error("lambda must lie strictly between zero and gammaExpansion");
  }
  if (!Number.isInteger(maximumWordLength) || maximumWordLength < 0) {
    throw new Error("maximumWordLength must be a nonnegative integer");
  }
  const boundaryTotal = transportBoundaryFractions.reduce(
    (sum, value, index) => sum + probability(value, `transportBoundaryFractions[${index}]`),
    0,
  );
  probability(totalVariationFraction, "totalVariationFraction");
  probability(selectedComponentBadFraction, "selectedComponentBadFraction");
  probability(gammaEditFraction, "gammaEditFraction");
  probability(clusterAlmostAutomorphismError, "clusterAlmostAutomorphismError");

  // Step 1, equation (5): gamma_Gamma * L <= 2 * crossing edges.
  const unmatchedMassFraction = 2 * boundaryTotal / gammaExpansion;
  const badTransportComponentFraction = unmatchedMassFraction / eta;

  // Step 2, coarea inequality and Markov's inequality for E_n.
  const medianL1DeviationFraction = totalVariationFraction / ambientExpansion;
  const medianExceptionalFraction = medianL1DeviationFraction / delta;
  const rho = ((1 + 2 * delta) / (1 - 2 * delta)) ** 2;

  // Step 3, equation following (9).
  const matchingSymmetricDifferenceFraction = rho - 1 + 2 * eta;

  // Step 5, equation (13) and maximal bad-cut removal.
  const removedCutFraction = gammaEditFraction / (gammaExpansion - lambda);
  const repairedWordErrorFraction = selectedComponentBadFraction +
    maximumWordLength * removedCutFraction;

  // Kun-Thom Lemma 4.1/4.2: 2*delta/h < 1/5 leaves the cluster gap.
  const clusterLoad = 10 * clusterAlmostAutomorphismError / lambda;
  const loads = {
    step1Transport: badTransportComponentFraction,
    step2Median: medianExceptionalFraction,
    step3Matching: matchingSymmetricDifferenceFraction,
    step5CutRepair: removedCutFraction,
    wordRepair: repairedWordErrorFraction,
    clusterSeparation: clusterLoad,
  };
  const [bottleneckStep, bottleneckLoad] = Object.entries(loads)
    .sort((left, right) => right[1] - left[1])[0];
  return {
    schema: "oasis.expansion-lef-error-ledger.v1",
    parameters: { eta, delta, lambda, maximumWordLength },
    derived: {
      unmatchedMassFraction,
      badTransportComponentFraction,
      medianL1DeviationFraction,
      medianExceptionalFraction,
      rho,
      matchingSymmetricDifferenceFraction,
      removedCutFraction,
      repairedWordErrorFraction,
      clusterLoad,
    },
    loads,
    bottleneck: { proofStep: bottleneckStep, load: bottleneckLoad },
    admissible: Object.values(loads).every((load) => load < 1),
    probePriority: Object.entries(loads)
      .sort((left, right) => right[1] - left[1])
      .map(([proofStep, load]) => ({ proofStep, weight: load })),
  };
}

export function optimizeExpansionLefBudget(base, {
  etaGrid = [0.001, 0.003, 0.01, 0.03, 0.1],
  deltaGrid = [0.001, 0.003, 0.01, 0.03, 0.1],
  lambdaFractions = [0.1, 0.25, 0.5, 0.75, 0.9],
} = {}) {
  let best = null;
  for (const eta of etaGrid) {
    for (const delta of deltaGrid) {
      for (const lambdaFraction of lambdaFractions) {
        const candidate = propagateExpansionLefBudget({
          ...base,
          eta,
          delta,
          lambda: base.gammaExpansion * lambdaFraction,
        });
        if (!best || candidate.bottleneck.load < best.bottleneck.load) best = candidate;
      }
    }
  }
  return best;
}
