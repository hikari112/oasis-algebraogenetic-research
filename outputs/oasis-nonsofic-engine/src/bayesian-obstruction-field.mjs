const DEFAULT_PRIORS = Object.freeze({
  spectralGap: 1,
  transport: 1,
  coarea: 1,
  componentMatching: 1,
  cutRepair: 1,
  finiteWords: 1,
  localityRadius: 1,
  expanderDecomposition: 1,
  finiteLef: 1,
});

function finiteNonnegative(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be finite and nonnegative`);
  }
  return value;
}

function stageForProofStep(proofStep = "") {
  const text = proofStep.toLowerCase();
  if (text.includes("thompson") || text.includes("lef")) return "finiteLef";
  if (text.includes("locality") || text.includes("ultraproduct")) return "localityRadius";
  if (text.includes("decomposition") || text.includes("conditions-1-through-4")) {
    return "expanderDecomposition";
  }
  if (text.includes("distinctness") || text.includes("equality") || text.includes("finite-word")) {
    return "finiteWords";
  }
  if (text.includes("kazhdan") || text.includes("ershov") || text.includes("spectral")) {
    return "spectralGap";
  }
  if (text.includes("median") || text.includes("coarea") || text.includes("step-2")) {
    return "coarea";
  }
  if (text.includes("matching") || text.includes("step-3")) return "componentMatching";
  if (text.includes("repair") || text.includes("step-5")) return "cutRepair";
  return "transport";
}

function stageForLedgerLoad(loadName) {
  return ({
    step1Transport: "transport",
    step2Median: "coarea",
    step3Matching: "componentMatching",
    step5CutRepair: "cutRepair",
    wordRepair: "finiteWords",
    clusterSeparation: "expanderDecomposition",
  })[loadName] ?? "transport";
}

function stageForObligation(obligationId) {
  return ({
    "effective-kun-locality-radius": "localityRadius",
    "effective-expander-decomposition-bound": "expanderDecomposition",
    "universal-finite-word-threshold": "finiteWords",
  })[obligationId] ?? stageForProofStep(obligationId);
}

function binaryEntropyBits(probability) {
  const p = Math.max(1e-12, Math.min(1 - 1e-12, probability));
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

// A fractional-Dirichlet evidence router over proof-failure loci. Its posterior
// is an epistemic scheduling distribution, never a probability that the source
// theorem is true or false.
export class BayesianObstructionField {
  constructor({ priors = DEFAULT_PRIORS } = {}) {
    this.concentration = {};
    for (const [stage, value] of Object.entries(priors)) {
      const checked = finiteNonnegative(value, `prior ${stage}`);
      if (!(checked > 0)) throw new Error(`prior ${stage} must be positive`);
      this.concentration[stage] = checked;
    }
    this.events = [];
  }

  observeOpenObligations(obligationIds, strength = 0.25) {
    finiteNonnegative(strength, "obligation strength");
    for (const obligationId of obligationIds ?? []) {
      const stage = stageForObligation(obligationId);
      if (!(stage in this.concentration)) continue;
      this.concentration[stage] += strength;
      this.events.push({ kind: "open-obligation", obligationId, stage, evidence: strength });
    }
    return this;
  }

  observeViolation(violation, strength = 4) {
    if (!violation) return this;
    finiteNonnegative(strength, "violation strength");
    const severity = Math.max(0, Math.min(1, violation.severity ?? violation.measuredFraction ?? 1));
    const stage = stageForProofStep(violation.proofStep ?? violation.kind);
    const evidence = strength * severity;
    if (stage in this.concentration) this.concentration[stage] += evidence;
    this.events.push({
      kind: "finite-violation",
      proofStep: violation.proofStep ?? null,
      stage,
      severity,
      evidence,
    });
    return this;
  }

  observeLedger(ledger, strength = 2) {
    if (!ledger) return this;
    finiteNonnegative(strength, "ledger strength");
    for (const [loadName, rawLoad] of Object.entries(ledger.loads ?? {})) {
      const load = finiteNonnegative(rawLoad, `ledger load ${loadName}`);
      const stage = stageForLedgerLoad(loadName);
      const evidence = strength * load / (1 + load);
      if (stage in this.concentration) this.concentration[stage] += evidence;
      this.events.push({ kind: "proof-ledger", loadName, stage, load, evidence });
    }
    return this;
  }

  posterior() {
    const total = Object.values(this.concentration).reduce((sum, value) => sum + value, 0);
    return Object.fromEntries(
      Object.entries(this.concentration).map(([stage, value]) => [stage, value / total]),
    );
  }

  expectedInformationGain({ proofStep, modelMoment = 0, relevance = 1 }) {
    finiteNonnegative(relevance, "probe relevance");
    const stage = stageForProofStep(proofStep);
    const stageMass = this.posterior()[stage] ?? 0;
    const positiveProbability = (1 + Math.max(-1, Math.min(1, modelMoment))) / 2;
    return stageMass * binaryEntropyBits(positiveProbability) * relevance;
  }

  snapshot() {
    const posterior = this.posterior();
    return {
      schema: "oasis.bayesian-obstruction-field.v1",
      semantics: "epistemic-probe-routing-not-theorem-probability",
      concentration: { ...this.concentration },
      posterior,
      ranking: Object.entries(posterior)
        .sort((left, right) => right[1] - left[1])
        .map(([stage, probability]) => ({ stage, probability })),
      events: this.events.map((event) => ({ ...event })),
    };
  }
}

export { stageForProofStep };
