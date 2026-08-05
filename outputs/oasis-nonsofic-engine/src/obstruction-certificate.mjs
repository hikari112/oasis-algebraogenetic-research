import { ExactCoefficientProbe } from "./regular-probes.mjs";
import {
  proofWord,
  registerProofConfiguration,
} from "./proof-configuration.mjs";
import { buildFiniteLefObstruction } from "./thompson-v-lef-obstruction.mjs";
import { proofSpectralBounds } from "./kazhdan-bounds.mjs";
import {
  optimizeExpansionLefBudget,
  propagateExpansionLefBudget,
} from "./proof-error-ledger.mjs";

export const OBSTRUCTION_CERTIFICATE_VERSION = "oasis.expansion-lef.v1";

function cloneWord(word) {
  return word.map((token) => ({
    generator: token.generator,
    inverse: Boolean(token.inverse),
  }));
}

function uniqueWords(words) {
  const byEncoding = new Map();
  for (const word of words) {
    const cloned = cloneWord(word);
    byEncoding.set(JSON.stringify(cloned), cloned);
  }
  return [...byEncoding.values()];
}

function relation(id, expect, leftWord, rightWord, proofStep) {
  return {
    id,
    expect,
    leftWord: cloneWord(leftWord),
    rightWord: cloneWord(rightWord),
    proofStep,
  };
}

function serializableViolation(violation) {
  if (!violation) return null;
  return Object.fromEntries(
    Object.entries(violation).filter(([key]) => !key.startsWith("_")),
  );
}

function violationCandidates(audit) {
  const candidates = [];
  for (const collision of audit.lefObstructionAudit?.collisions ?? []) {
    candidates.push({
      kind: "finite-lef-chart-collision",
      proofStep: "finite-thompson-v-lef-obstruction",
      expect: "distinct",
      leftWord: cloneWord(collision.leftWord),
      rightWord: cloneWord(collision.rightWord),
      leftExactHash: collision.leftExactHash,
      rightExactHash: collision.rightExactHash,
      severity: collision.collisionFraction,
      measuredFraction: collision.collisionFraction,
    });
  }
  for (const defect of audit.lefObstructionAudit?.multiplicationDefects ?? []) {
    candidates.push({
      kind: "finite-lef-chart-multiplication-defect",
      proofStep: "finite-thompson-v-lef-obstruction",
      expect: "equal",
      leftWord: [...cloneWord(defect.leftWord), ...cloneWord(defect.rightWord)],
      rightWord: cloneWord(defect.productWord),
      severity: defect.defect,
      measuredFraction: defect.defect,
    });
  }
  for (const check of audit.relationChecks ?? []) {
    if (!check.covered) continue;
    if (check.expect === "equal" && check.defect > 0) {
      candidates.push({
        kind: "word-equality-defect",
        proofStep: check.proofStep,
        relationId: check.id,
        expect: "equal",
        leftWord: cloneWord(check.leftWord),
        rightWord: cloneWord(check.rightWord),
        severity: check.defect,
        measuredFraction: check.defect,
      });
    }
    if (check.expect === "distinct" && check.collisionFraction > 0) {
      candidates.push({
        kind: "word-distinctness-collision",
        proofStep: check.proofStep,
        relationId: check.id,
        expect: "distinct",
        leftWord: cloneWord(check.leftWord),
        rightWord: cloneWord(check.rightWord),
        severity: check.collisionFraction,
        measuredFraction: check.collisionFraction,
      });
    }
  }
  for (const alias of audit.aliases ?? []) {
    candidates.push({
      kind: "exact-word-alias",
      proofStep: "step-4-word-distinctness",
      expect: "distinct",
      leftLabel: alias.left.label,
      rightLabel: alias.right.label,
      leftWord: cloneWord(alias.left.word),
      rightWord: cloneWord(alias.right.word),
      leftExactHash: alias.left.exactHash,
      rightExactHash: alias.right.exactHash,
      severity: alias.collisionFraction ?? 1,
      measuredFraction: alias.collisionFraction ?? 1,
    });
  }
  for (const item of audit.multiplication ?? []) {
    if (!(item.defect > 0)) continue;
    candidates.push({
      kind: "multiplication-triangle-defect",
      proofStep: "step-4-word-equality",
      expect: "equal",
      leftLabel: `${item.left}*${item.right}`,
      rightLabel: item.product,
      leftWord: [...cloneWord(item.leftWord), ...cloneWord(item.rightWord)],
      rightWord: cloneWord(item.productWord),
      severity: item.defect,
      measuredFraction: item.defect,
    });
  }
  for (const item of audit.freeness ?? []) {
    const collisionFraction = 1 - item.movedFraction;
    if (!(collisionFraction > 0) || !item.word) continue;
    candidates.push({
      kind: "identity-collision",
      proofStep: "step-4-word-distinctness",
      expect: "distinct",
      leftLabel: item.label,
      rightLabel: "identity",
      leftWord: cloneWord(item.word),
      rightWord: [],
      severity: collisionFraction,
      measuredFraction: collisionFraction,
    });
  }
  return candidates.sort((left, right) =>
    right.severity - left.severity || left.kind.localeCompare(right.kind));
}

function synthesizeSeparatingProbes({
  violation,
  groupOracle,
  states,
  maxGeneratedProbes,
}) {
  if (!violation || violation.expect !== "distinct") {
    return { probes: [], evidence: [] };
  }
  const left = groupOracle.evaluate(violation.leftWord);
  const right = groupOracle.evaluate(violation.rightWord);
  if (left.hash === right.hash) {
    throw new Error("A distinctness obstruction contains equal exact words");
  }
  const probes = new Map();
  const evidence = [];
  for (let stateIndex = 0; stateIndex < states.length; stateIndex += 1) {
    const state = states[stateIndex];
    const difference = left.unit.element.add(right.unit.element).multiply(state.element);
    for (const { alpha, beta } of difference.support()) {
      const seed = new ExactCoefficientProbe({
        alpha,
        beta,
        label: `obstruction:${violation.kind}:${state.label}`,
      });
      const leftProbe = seed.pullback(left);
      const rightProbe = seed.pullback(right);
      const leftBit = leftProbe.evaluateBit(state);
      const rightBit = rightProbe.evaluateBit(state);
      if (leftBit === rightBit) continue;
      probes.set(leftProbe.hash(), leftProbe);
      probes.set(rightProbe.hash(), rightProbe);
      evidence.push({
        stateIndex,
        stateLabel: state.label,
        coefficient: { alpha, beta },
        leftBit,
        rightBit,
        leftProbeHash: leftProbe.hash(),
        rightProbeHash: rightProbe.hash(),
      });
      if (probes.size >= maxGeneratedProbes) {
        return { probes: [...probes.values()], evidence };
      }
    }
  }
  return { probes: [...probes.values()], evidence };
}

function synthesizeGluingConstraints(violation, groupOracle) {
  if (!violation || violation.expect !== "equal") return [];
  const left = groupOracle.evaluate(violation.leftWord);
  const right = groupOracle.evaluate(violation.rightWord);
  if (left.hash !== right.hash || !left.unit.equals(right.unit)) {
    throw new Error("Refusing to glue paths that are not exactly equal");
  }
  return [{
    schema: "oasis.path-gluing-constraint.v1",
    kind: "path-gluing",
    proofStep: violation.proofStep,
    relationId: violation.relationId ?? null,
    leftWord: cloneWord(violation.leftWord),
    rightWord: cloneWord(violation.rightWord),
    targetNormalizedHammingDefect: 0,
    measuredNormalizedHammingDefect: violation.measuredFraction,
  }];
}

function refinementAction(violation, probes, gluingConstraints) {
  if (!violation) {
    return {
      kind: "none",
      reason: "no-violation-in-audited-finite-tests",
    };
  }
  if (violation.expect === "distinct") {
    return {
      kind: "split",
      reason: "finite-transport-collapsed-exactly-distinct-paths",
      generatedProbeCount: probes.length,
    };
  }
  return {
    kind: "glue",
    reason: "finite-transport-separated-exactly-equal-paths",
    generatedConstraintCount: gluingConstraints.length,
  };
}

export class ExpansionLefObstructionCertificate {
  constructor({
    groupOracle,
    sourceUrl = "https://cdn.openai.com/pdf/ten-proofs-oai.pdf",
    gammaExpansion = null,
    ambientExpansion = null,
    globalEpsilon = null,
    finiteLefObstruction = null,
    maxGeneratedProbes = 6,
    challengeWeight = 1,
  }) {
    this.groupOracle = groupOracle;
    this.sourceUrl = sourceUrl;
    this.maxGeneratedProbes = maxGeneratedProbes;
    this.challengeWeight = challengeWeight;
    const { configuration, names } = registerProofConfiguration(groupOracle);
    this.configuration = configuration;
    this.names = names;
    this.gammaWords = names.gamma.map((name) => proofWord(name));
    this.jWords = names.j.map((name) => proofWord(name));
    this.finiteLefObstruction = finiteLefObstruction ?? buildFiniteLefObstruction(
      groupOracle,
      names.j[0],
      names.j[1],
    );
    this.spectralBounds = proofSpectralBounds();
    this.relations = [];
    for (let gammaIndex = 0; gammaIndex < names.gamma.length; gammaIndex += 1) {
      for (let jIndex = 0; jIndex < names.j.length; jIndex += 1) {
        const gamma = proofWord(names.gamma[gammaIndex]);
        const j = proofWord(names.j[jIndex]);
        this.relations.push(relation(
          `gamma-j-commute-${gammaIndex}-${jIndex}`,
          "equal",
          [...gamma, ...j],
          [...j, ...gamma],
          "algebraic-configuration",
        ));
      }
    }
    names.j.forEach((name, index) => {
      const j = proofWord(name);
      this.relations.push(relation(
        `j-nonidentity-${index}`,
        "distinct",
        j,
        [],
        "step-4-word-distinctness",
      ));
    });
    for (const relator of this.finiteLefObstruction.presentation.relators) {
      this.relations.push(relation(
        relator.id,
        "equal",
        relator.operatorWord,
        [],
        "finite-thompson-v-presentation",
      ));
    }
    this.relations.push(
      relation("u-nonidentity", "distinct", proofWord(names.u), [], "algebraic-configuration"),
      relation("v-nonidentity", "distinct", proofWord(names.v), [], "algebraic-configuration"),
    );
    const finiteWords = uniqueWords([
      [],
      ...this.gammaWords,
      ...this.jWords,
      proofWord(names.u),
      proofWord(names.v),
      ...this.relations.flatMap((item) => [item.leftWord, item.rightWord]),
      ...this.finiteLefObstruction.finiteSet.map((item) => item.representativeWord),
    ]);
    this.finiteWords = finiteWords;
    this.parameters = {
      gammaExpansion,
      ambientExpansion,
      globalEpsilon,
      finiteLefObstruction: this.finiteLefObstruction,
      spectralBounds: this.spectralBounds,
    };
    this.obligations = [
      {
        id: "exact-leavitt-configuration",
        proofStep: "section-3-binary-leavitt-configuration",
        status: "verified",
        evidence: {
          uIsUnit: configuration.uIsUnit,
          vIsUnit: configuration.vIsUnit,
          contractionsAgreeOnAlpha: configuration.contractionsAgreeOnAlpha,
          gammaJCommute: configuration.gammaJCommute,
        },
      },
      {
        id: "gamma-kazhdan-spectral-bound",
        proofStep: "ershov-jaikin-to-step-1",
        status: "verified",
        value: this.spectralBounds.gamma,
      },
      {
        id: "ambient-kazhdan-spectral-bound",
        proofStep: "ershov-jaikin-to-step-2",
        status: "verified",
        value: this.spectralBounds.ambientG,
      },
      {
        id: "effective-kun-locality-radius",
        proofStep: "kun-lemma-10-ultraproduct-step",
        status: "open-nonconstructive-proof-step",
        value: null,
      },
      {
        id: "effective-expander-decomposition-bound",
        proofStep: "kun-theorem-3-conditions-1-through-4",
        status: gammaExpansion > 0 && ambientExpansion > 0
          ? "supplied-unverified"
          : "open-symbolic-constant-propagation",
        value: { gammaExpansion, ambientExpansion },
      },
      {
        id: "finite-error-ledger",
        proofStep: "steps-1-through-5-o-of-n",
        status: "verified",
        value: {
          schema: "oasis.expansion-lef-error-ledger.v1",
          propagates: [
            "transport loss",
            "median/coarea exception",
            "matching error",
            "bad-cut removal",
            "word repair",
            "cluster separation",
          ],
        },
      },
      {
        id: "universal-finite-word-threshold",
        proofStep: "replace-slow-asymptotic-schedules-by-one-finite-challenge",
        status: globalEpsilon > 0 ? "supplied-unverified" : "open-depends-on-locality-radius",
        value: globalEpsilon,
      },
      {
        id: "finite-thompson-v-lef-obstruction",
        proofStep: "theorem-1-1-final-contradiction",
        status: this.finiteLefObstruction.status === "verified-theorem-backed"
          ? "verified"
          : "supplied-unverified",
        value: this.finiteLefObstruction,
      },
    ];
  }

  status() {
    const openObligations = this.obligations
      .filter((item) => item.status !== "verified")
      .map((item) => item.id);
    return {
      certificateId: OBSTRUCTION_CERTIFICATE_VERSION,
      finiteAuditExecutable: true,
      activeProbeSynthesis: true,
      globallyEffective: openObligations.length === 0,
      openObligations,
    };
  }

  toJSON() {
    return {
      schema: OBSTRUCTION_CERTIFICATE_VERSION,
      claim: "conditional-expansion-to-lef-obstruction-compiler",
      source: {
        url: this.sourceUrl,
        chapter: 3,
        proposition: "2.3",
        proofSteps: [
          "expander-decomposition",
          "median-coarea-size-control",
          "transported-component-matching",
          "finite-word-tests-and-component-selection",
          "permutation-repair-and-uniform-expansion",
          "expanding-sofic-approximation-implies-LEF",
        ],
      },
      group: this.groupOracle.theorem,
      exactConfiguration: {
        generators: this.names,
        relations: this.relations,
      },
      finiteWords: this.finiteWords,
      obligations: this.obligations,
      status: this.status(),
    };
  }

  audit(critic) {
    return {
      ...critic.audit(this.groupOracle),
      certificateId: OBSTRUCTION_CERTIFICATE_VERSION,
      relationChecks: critic.auditRelations(this.groupOracle, this.relations),
      gammaExpansion: critic.auditExpansion(this.groupOracle, this.gammaWords),
      lefObstructionAudit: critic.auditLocalEmbedding(
        this.groupOracle,
        this.finiteLefObstruction,
      ),
      obligationStatus: this.status(),
    };
  }

  propagateBudget(input) {
    return propagateExpansionLefBudget(input);
  }

  optimizeBudget(input, options = {}) {
    return optimizeExpansionLefBudget(input, options);
  }

  challenge({ emulatorAudit, states = [], groupOracle = this.groupOracle }) {
    if (!emulatorAudit || typeof emulatorAudit !== "object") {
      throw new Error("The proof-obligation challenge requires a finite-emulator audit");
    }
    const violations = violationCandidates(emulatorAudit);
    const violation = violations[0] ?? null;
    const { probes, evidence } = synthesizeSeparatingProbes({
      violation,
      groupOracle,
      states,
      maxGeneratedProbes: this.maxGeneratedProbes,
    });
    const generatedConstraints = synthesizeGluingConstraints(violation, groupOracle);
    return {
      certificateId: OBSTRUCTION_CERTIFICATE_VERSION,
      outcome: violation
        ? "finite-proof-obligation-violated"
        : "no-violation-in-audited-finite-tests",
      certifiedUniversalNonSoficity: false,
      violation: serializableViolation(violation),
      consideredViolationCount: violations.length,
      generatedProbes: probes,
      generatedConstraints,
      refinementAction: refinementAction(violation, probes, generatedConstraints),
      preferredProbeHashes: probes.map((probe) => probe.hash()),
      probeEvidence: evidence,
      weight: violation ? this.challengeWeight * violation.severity : 0,
      openUniversalObligations: this.status().openObligations,
    };
  }
}

export function compileExpansionLefCertificate(groupOracle, options = {}) {
  return new ExpansionLefObstructionCertificate({ groupOracle, ...options });
}
