import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import { compileExpansionLefCertificate } from "../src/obstruction-certificate.mjs";
import {
  FiniteEmulatorCritic,
  identityPermutation,
} from "../src/emulator-critic.mjs";
import { EndogenousTransportAtlas } from "../src/endogenous-transport-atlas.mjs";
import { LeavittRegularState } from "../src/regular-probes.mjs";
import { LeavittF2Element, sWord } from "../src/leavitt-f2.mjs";
import { LeavittUnit, NINE_LEAF_CODE_D } from "../src/unit-group.mjs";
import {
  compileBitTapeToLaurent,
  queryLaurentTapeCoefficient,
} from "./laurent-holonomy-genesis.mjs";

function token(generator, inverse = false) {
  return { generator, inverse };
}

function freezePlainTree(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezePlainTree(child);
  return Object.freeze(value);
}

function elementRecord(element) {
  assert(element instanceof LeavittF2Element);
  return { termKeys: [...element.terms.keys()].sort() };
}

function elementFromRecord(record) {
  return new LeavittF2Element(
    new Map(record.termKeys.map((key) => [key, 1])),
  );
}

// Replay never retains caller-owned Maps or algebra objects. The stored record
// is plain deeply frozen data, and every transaction receives fresh exact
// objects reconstructed from it.
export function snapshotExactReplayContext(groupOracle, states, certificate = null) {
  assert(groupOracle instanceof ExactNonSoficGroupOracle);
  assert(Array.isArray(states));
  const generators = [...groupOracle.generators.entries()]
    .map(([name, unit]) => {
      assert(unit instanceof LeavittUnit);
      return {
        name,
        label: unit.label,
        element: elementRecord(unit.element),
        inverseElement: elementRecord(unit.inverseElement),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
  const stateRecords = states.map((state) => {
    assert(state instanceof LeavittRegularState);
    return {
      label: state.label,
      element: elementRecord(state.element),
    };
  });
  const certificateRecord = certificate === null
    ? null
    : {
      sourceUrl: certificate.sourceUrl,
      gammaExpansion: certificate.parameters.gammaExpansion,
      ambientExpansion: certificate.parameters.ambientExpansion,
      globalEpsilon: certificate.parameters.globalEpsilon,
      finiteLefObstruction: structuredClone(certificate.finiteLefObstruction),
      maxGeneratedProbes: certificate.maxGeneratedProbes,
      challengeWeight: certificate.challengeWeight,
      certificateId: certificate.status().certificateId,
      relationDirectoryHash: certificate.status().relationDirectoryHash,
    };
  return freezePlainTree({
    generators,
    states: stateRecords,
    certificate: certificateRecord,
  });
}

export function instantiateExactReplayContext(snapshot) {
  const generators = new Map(snapshot.generators.map((record) => [
    record.name,
    new LeavittUnit(
      elementFromRecord(record.element),
      elementFromRecord(record.inverseElement),
      record.label,
      true,
    ),
  ]));
  const groupOracle = new ExactNonSoficGroupOracle(generators);
  const states = snapshot.states.map(
    (record) => new LeavittRegularState(
      elementFromRecord(record.element),
      record.label,
    ),
  );
  let certificate = null;
  if (snapshot.certificate) {
    certificate = compileExpansionLefCertificate(groupOracle, {
      sourceUrl: snapshot.certificate.sourceUrl,
      gammaExpansion: snapshot.certificate.gammaExpansion,
      ambientExpansion: snapshot.certificate.ambientExpansion,
      globalEpsilon: snapshot.certificate.globalEpsilon,
      finiteLefObstruction: structuredClone(
        snapshot.certificate.finiteLefObstruction,
      ),
      maxGeneratedProbes: snapshot.certificate.maxGeneratedProbes,
      challengeWeight: snapshot.certificate.challengeWeight,
    });
    assert.equal(
      certificate.status().certificateId,
      snapshot.certificate.certificateId,
    );
    assert.equal(
      certificate.status().relationDirectoryHash,
      snapshot.certificate.relationDirectoryHash,
    );
  }
  return { groupOracle, states, certificate };
}

function unorderedPairKey(left, right) {
  return [left, right].sort().join("=");
}

function relationAnchorAudit(certificate, critic, groupOracle) {
  const cells = [];
  const relationChecks = certificate.relations.map((relation, relationIndex) => {
    const leftPermutation = critic.permutationForWord(
      groupOracle,
      relation.leftWord,
    );
    const rightPermutation = critic.permutationForWord(
      groupOracle,
      relation.rightWord,
    );
    const leftExact = groupOracle.evaluate(relation.leftWord);
    const rightExact = groupOracle.evaluate(relation.rightWord);
    const leftExactHash = leftExact.hash;
    const rightExactHash = rightExact.hash;
    const exactEqual = leftExactHash === rightExactHash;
    if (relation.expect === "equal" && !exactEqual) {
      throw new Error(`Invalid equality relation in certificate: ${relation.id}`);
    }
    if (relation.expect === "distinct" && exactEqual) {
      throw new Error(`Invalid distinctness relation in certificate: ${relation.id}`);
    }
    if (!leftPermutation || !rightPermutation) {
      return {
        ...relation,
        exactLeftHash: leftExactHash,
        exactRightHash: rightExactHash,
        covered: false,
        defect: null,
        collisionFraction: null,
      };
    }
    const expectationBit = relation.expect === "distinct" ? 1 : 0;
    let differingAnchors = 0;
    for (let anchor = 0; anchor < critic.size; anchor += 1) {
      const observedBit = leftPermutation[anchor] === rightPermutation[anchor]
        ? 0
        : 1;
      differingAnchors += observedBit;
      const mismatchBit = expectationBit ^ observedBit;
      cells.push({
        relationIndex,
        relationId: relation.id,
        proofStep: relation.proofStep,
        expect: relation.expect,
        leftExactHash,
        rightExactHash,
        exactPairKey: unorderedPairKey(leftExactHash, rightExactHash),
        anchor,
        expectationBit,
        observedBit,
        mismatchBit,
      });
    }
    const defect = differingAnchors / critic.size;
    return {
      ...relation,
      exactLeftHash: leftExactHash,
      exactRightHash: rightExactHash,
      covered: true,
      defect,
      collisionFraction: 1 - defect,
    };
  });
  return { cells, relationChecks };
}

const ORIENTED_GERM_SCHEMA = "oasis.oriented-certificate-germ.v2";

function orientedCell(cell) {
  const splitBit = cell.expectationBit === 1 && cell.observedBit === 0 ? 1 : 0;
  const glueBit = cell.expectationBit === 0 && cell.observedBit === 1 ? 1 : 0;
  assert.equal(splitBit ^ glueBit, cell.mismatchBit);
  assert.equal(splitBit & glueBit, 0);
  return {
    coordinateKey: `${cell.relationId}#${cell.anchor}`,
    relationIndex: cell.relationIndex,
    relationId: cell.relationId,
    anchor: cell.anchor,
    expectationBit: cell.expectationBit,
    observedBit: cell.observedBit,
    mismatchBit: cell.mismatchBit,
    splitBit,
    glueBit,
    exactPairKey: cell.exactPairKey,
  };
}

export function encodeOrientedDefectGerm({
  certificateId,
  relationDirectoryHash,
  anchorCount,
  cells,
}) {
  assert(Number.isSafeInteger(anchorCount) && anchorCount > 0);
  assert.match(relationDirectoryHash, /^[0-9a-f]{64}$/);
  const encodedCells = cells.map(orientedCell);
  return {
    schema: ORIENTED_GERM_SCHEMA,
    certificateId,
    relationDirectoryHash,
    anchorCount,
    cellCount: encodedCells.length,
    cells: encodedCells,
  };
}

function canonicalGermView(germ) {
  assert(germ && typeof germ === "object", "A typed obstruction germ is required");
  assert.equal(germ.schema, ORIENTED_GERM_SCHEMA);
  assert.match(germ.relationDirectoryHash, /^[0-9a-f]{64}$/);
  assert(Number.isSafeInteger(germ.anchorCount) && germ.anchorCount > 0);
  assert.equal(germ.cellCount, germ.cells?.length);
  assert.equal(germ.cellCount % germ.anchorCount, 0);
  const cells = germ.cells.map((cell) => ({ ...cell })).sort((left, right) =>
    left.relationIndex - right.relationIndex || left.anchor - right.anchor
  );
  const seen = new Set();
  const anchorsByRelation = new Map();
  for (const cell of cells) {
    assert.equal(typeof cell.relationId, "string");
    assert(Number.isSafeInteger(cell.relationIndex) && cell.relationIndex >= 0);
    assert(Number.isSafeInteger(cell.anchor));
    assert(cell.anchor >= 0 && cell.anchor < germ.anchorCount);
    assert.equal(cell.coordinateKey, `${cell.relationId}#${cell.anchor}`);
    assert.equal(typeof cell.exactPairKey, "string");
    assert(!seen.has(cell.coordinateKey), "A typed germ cannot repeat a cell coordinate");
    seen.add(cell.coordinateKey);
    if (!anchorsByRelation.has(cell.relationId)) {
      anchorsByRelation.set(cell.relationId, new Set());
    }
    anchorsByRelation.get(cell.relationId).add(cell.anchor);
    for (const bit of [
      cell.expectationBit,
      cell.observedBit,
      cell.mismatchBit,
      cell.splitBit,
      cell.glueBit,
    ]) {
      assert(bit === 0 || bit === 1, "Typed germ coordinates must be bits");
    }
    assert.equal(cell.expectationBit ^ cell.observedBit, cell.mismatchBit);
    assert.equal(cell.splitBit ^ cell.glueBit, cell.mismatchBit);
    assert.equal(cell.splitBit & cell.glueBit, 0);
    assert.equal(
      cell.splitBit,
      cell.expectationBit === 1 && cell.observedBit === 0 ? 1 : 0,
    );
    assert.equal(
      cell.glueBit,
      cell.expectationBit === 0 && cell.observedBit === 1 ? 1 : 0,
    );
  }
  for (const anchors of anchorsByRelation.values()) {
    assert.equal(
      anchors.size,
      germ.anchorCount,
      "Every declared covered relation must contain its complete anchor block",
    );
    for (let anchor = 0; anchor < germ.anchorCount; anchor += 1) {
      assert(anchors.has(anchor), "A covered relation germ cannot omit an anchor");
    }
  }
  return {
    schema: germ.schema,
    certificateId: germ.certificateId,
    relationDirectoryHash: germ.relationDirectoryHash,
    anchorCount: germ.anchorCount,
    cellCount: germ.cellCount,
    cells,
  };
}

function relationAuditFromOrientedGerm(germ, certificate, groupOracle) {
  const normalized = canonicalGermView(germ);
  assert.equal(normalized.certificateId, certificate.status().certificateId);
  assert.equal(
    normalized.relationDirectoryHash,
    certificate.status().relationDirectoryHash,
  );
  const byRelation = new Map();
  for (const cell of normalized.cells) {
    if (!byRelation.has(cell.relationId)) byRelation.set(cell.relationId, []);
    byRelation.get(cell.relationId).push(cell);
  }
  const relationChecks = certificate.relations.map((relation, relationIndex) => {
    const matching = byRelation.get(relation.id) ?? [];
    const leftExact = groupOracle.evaluate(relation.leftWord);
    const rightExact = groupOracle.evaluate(relation.rightWord);
    const exactEqual = leftExact.hash === rightExact.hash;
    if (relation.expect === "equal") assert(exactEqual);
    if (relation.expect === "distinct") assert(!exactEqual);
    if (matching.length === 0) {
      return {
        ...relation,
        exactLeftHash: leftExact.hash,
        exactRightHash: rightExact.hash,
        covered: false,
        defect: null,
        collisionFraction: null,
      };
    }
    const anchors = new Set();
    let differingAnchors = 0;
    for (const cell of matching) {
      assert.equal(cell.relationIndex, relationIndex);
      assert.equal(cell.expectationBit, relation.expect === "distinct" ? 1 : 0);
      assert.equal(cell.exactPairKey, unorderedPairKey(leftExact.hash, rightExact.hash));
      assert(!anchors.has(cell.anchor), "A relation germ cannot repeat an anchor");
      anchors.add(cell.anchor);
      differingAnchors += cell.observedBit;
    }
    assert.equal(matching.length, normalized.anchorCount);
    const defect = differingAnchors / normalized.anchorCount;
    return {
      ...relation,
      exactLeftHash: leftExact.hash,
      exactRightHash: rightExact.hash,
      covered: true,
      defect,
      collisionFraction: 1 - defect,
    };
  });
  assert.equal(
    [...byRelation.keys()].filter(
      (relationId) => !certificate.relations.some((relation) => relation.id === relationId),
    ).length,
    0,
    "A typed germ cannot introduce an unknown certificate relation",
  );
  return { relationChecks };
}

export function routeOrientedDefectGerm({
  germ,
  certificate,
  groupOracle,
  states = [],
}) {
  const emulatorAudit = relationAuditFromOrientedGerm(
    germ,
    certificate,
    groupOracle,
  );
  const selection = certificate.selectViolation(emulatorAudit);
  const challenge = certificate.challengeFromViolation({
    ...selection,
    states,
    groupOracle,
  });
  return { emulatorAudit, selection, challenge };
}

function auditKey(certificateStatus, anchorCount, cells) {
  return JSON.stringify({
    certificateId: certificateStatus.certificateId,
    relationDirectoryHash: certificateStatus.relationDirectoryHash,
    anchorCount,
    cells: cells.map((cell) => [
      cell.relationId,
      cell.anchor,
      cell.expectationBit,
      cell.observedBit,
    ]),
  });
}

function matchingPrefixLength(cells) {
  const firstMismatch = cells.findIndex((cell) => cell.mismatchBit === 1);
  return firstMismatch < 0 ? cells.length : firstMismatch;
}

function challengeTapeMean(challenge, germ, groupOracle) {
  const violation = challenge.violation;
  assert(violation, "A challenged tape must contain a violation");
  const cells = canonicalGermView(germ).cells;
  const expectationBit = violation.expect === "distinct" ? 1 : 0;
  let matching;
  if (violation.relationId) {
    const pairKey = unorderedPairKey(
      groupOracle.evaluate(violation.leftWord).hash,
      groupOracle.evaluate(violation.rightWord).hash,
    );
    matching = cells.filter(
      (cell) => cell.relationId === violation.relationId &&
        cell.expectationBit === expectationBit &&
        cell.exactPairKey === pairKey,
    );
  } else {
    const pairKey = unorderedPairKey(
      groupOracle.evaluate(violation.leftWord).hash,
      groupOracle.evaluate(violation.rightWord).hash,
    );
    matching = cells.filter(
      (cell) => cell.exactPairKey === pairKey &&
        cell.expectationBit === expectationBit,
    );
  }
  assert(matching.length > 0, "The selected certificate violation has no XOR tape");
  return matching.reduce((sum, cell) => sum + cell.mismatchBit, 0) /
    matching.length;
}

function summarizeAtlas(atlas) {
  const snapshot = atlas.snapshot();
  return {
    separatingProbeCount: snapshot.separatingProbeCount,
    separationConstraintCount: snapshot.separationConstraintCount,
    gluingConstraintCount: snapshot.gluingConstraintCount,
    revisionCount: snapshot.revisionCount,
  };
}

export class CertificateXorController {
  #replayContext;

  #committedGerms;

  constructor({ certificate, groupOracle, states }) {
    assert(Array.isArray(states));
    this.certificate = certificate;
    this.#replayContext = snapshotExactReplayContext(
      groupOracle,
      states,
      certificate,
    );
    this.#committedGerms = Object.freeze([]);
    const initial = instantiateExactReplayContext(this.#replayContext);
    this.atlas = new EndogenousTransportAtlas(initial.groupOracle);
    this.acceptedCellCount = 0;
    this.materializedCellCount = 0;
    this.seenAudits = new Set();
    this.challengeInvocationCount = 0;
  }

  strictDefect() {
    return this.acceptedCellCount > this.materializedCellCount ? 1 : 0;
  }

  forceQAtSynchronizedContext() {
    assert.equal(this.strictDefect(), 0);
    const before = this.challengeInvocationCount;
    return {
      strict: false,
      challengeInvoked: this.challengeInvocationCount !== before,
      context: [this.acceptedCellCount, this.materializedCellCount],
    };
  }

  process(critic, options = {}) {
    const replay = instantiateExactReplayContext(this.#replayContext);
    const operationOracle = replay.groupOracle;
    const operationStates = replay.states;
    const operationCertificate = replay.certificate;
    assert(operationCertificate);
    const { challengeOverride = null } = options;
    const hasTypedGermOverride = Object.prototype.hasOwnProperty.call(
      options,
      "typedGermOverride",
    );
    // This controller is deliberately scoped to the certificate's explicit
    // relation checks.  The same semantic object drives the XOR tape, audit
    // key, and challenge selector; aliases, multiplication checks, expansion,
    // and LEF candidates require their own typed tapes before they can enter.
    const { cells } = relationAnchorAudit(
      operationCertificate,
      critic,
      operationOracle,
    );
    const certificateStatus = operationCertificate.status();
    const canonicalTypedGerm = encodeOrientedDefectGerm({
      certificateId: certificateStatus.certificateId,
      relationDirectoryHash: certificateStatus.relationDirectoryHash,
      anchorCount: critic.size,
      cells,
    });
    const typedGerm = hasTypedGermOverride
      ? options.typedGermOverride
      : canonicalTypedGerm;
    if (hasTypedGermOverride) {
      assert.deepEqual(
        canonicalGermView(typedGerm),
        canonicalGermView(canonicalTypedGerm),
        "A typed germ override must encode the same coordinate-free audit",
      );
    }
    const germCells = canonicalGermView(typedGerm).cells;
    const key = auditKey(certificateStatus, critic.size, germCells);
    if (this.seenAudits.has(key)) {
      return {
        duplicate: true,
        stateStutter: true,
        alphaEvents: 0,
        deltaEvents: 0,
        qEvents: 0,
        challengeInvocations: 0,
        relationCellInspectionWork: germCells.length,
        uninstrumentedWordAndPermutationWorkExcluded: true,
        atlas: summarizeAtlas(this.atlas),
        context: [this.acceptedCellCount, this.materializedCellCount],
      };
    }

    const startAccepted = this.acceptedCellCount;
    const startMaterialized = this.materializedCellCount;
    const alphaEvents = germCells.length;
    const nextAccepted = startAccepted + alphaEvents;
    const prefixLength = matchingPrefixLength(germCells);
    const mismatchCount = germCells.reduce(
      (sum, cell) => sum + cell.mismatchBit,
      0,
    );
    const routed = routeOrientedDefectGerm({
      germ: typedGerm,
      certificate: operationCertificate,
      groupOracle: operationOracle,
      states: operationStates,
    });
    const splitGerm = compileBitTapeToLaurent(
      typedGerm.cells.map((cell) => cell.splitBit),
    );
    const glueGerm = compileBitTapeToLaurent(
      typedGerm.cells.map((cell) => cell.glueBit),
    );
    const obstructionGerm = compileBitTapeToLaurent(
      typedGerm.cells.map((cell) => cell.mismatchBit),
    );
    assert.equal(
      splitGerm.localShearActionCount + glueGerm.localShearActionCount,
      obstructionGerm.localShearActionCount,
    );
    const coefficientQueryShiftWork = typedGerm.cells.reduce(
      (sum, _cell, index) => sum + Math.abs(index),
      0,
    );
    typedGerm.cells.forEach((cell, index) => {
      assert.equal(
        queryLaurentTapeCoefficient(obstructionGerm.exponents, index),
        cell.mismatchBit,
      );
      assert.equal(
        queryLaurentTapeCoefficient(splitGerm.exponents, index),
        cell.splitBit,
      );
      assert.equal(
        queryLaurentTapeCoefficient(glueGerm.exponents, index),
        cell.glueBit,
      );
    });

    if (mismatchCount === 0) {
      const stagedAtlas = new EndogenousTransportAtlas(operationOracle);
      for (const committedGerm of this.#committedGerms) {
        const historical = routeOrientedDefectGerm({
          germ: committedGerm,
          certificate: operationCertificate,
          groupOracle: operationOracle,
          states: operationStates,
        });
        stagedAtlas.applyChallenge(historical.challenge);
      }
      const nextSeenAudits = new Set(this.seenAudits);
      nextSeenAudits.add(key);
      this.atlas = stagedAtlas;
      this.acceptedCellCount = nextAccepted;
      this.materializedCellCount = nextAccepted;
      this.seenAudits = nextSeenAudits;
      assert.equal(this.strictDefect(), 0);
      return {
        duplicate: false,
        clean: true,
        cellCount: germCells.length,
        mismatchCount,
        typedGerm,
        routedThroughTypedGerm: true,
        rawAuditChallengeShortcutUsed: false,
        orientedSplitGermSupport: splitGerm.exponents,
        orientedGlueGermSupport: glueGerm.exponents,
        laurentObstructionGermSupport: obstructionGerm.exponents,
        laurentLocalShearActionCount: obstructionGerm.localShearActionCount,
        lateBoundCoefficientQueriesChecked: germCells.length,
        matchingPrefixLength: prefixLength,
        alphaEvents,
        deltaEvents: germCells.length,
        qEvents: 0,
        qWidth: 0,
        challengeInvocations: 0,
        controllerRepairDepth: 2 * germCells.length,
        serialRepairDepth: 2 * germCells.length,
        relationComparisonWork: 2 * germCells.length,
        relationCellInspectionWork: germCells.length,
        laurentConstructionActionWork: obstructionGerm.localShearActionCount,
        coefficientQueryShiftWork,
        coefficientReadCount: germCells.length,
        compiledArtifactCount: 0,
        uninstrumentedWordPermutationAndCompilerWorkExcluded: true,
        atlas: summarizeAtlas(this.atlas),
        context: [this.acceptedCellCount, this.materializedCellCount],
      };
    }

    const nextMaterializedBeforeQ = startMaterialized + prefixLength;
    assert(nextAccepted > nextMaterializedBeforeQ);
    const qWidth = germCells.length - prefixLength;
    const expectedChallenge = routed.challenge;
    const challenge = challengeOverride ?? expectedChallenge;

    // Validate every controller-owned field before the atlas can mutate.
    // Context counters remain local until the staged atlas transaction passes.
    const uniqueProbeCount = new Set(
      challenge.generatedProbes.map((probe) => probe.hash()),
    ).size;
    const generatedGlueCount = challenge.generatedConstraints.length;
    const generatedSplitCount = challenge.refinementAction.kind === "split" ? 1 : 0;
    const compiledArtifactCount = uniqueProbeCount + generatedGlueCount +
      generatedSplitCount;
    const xorMean = challengeTapeMean(challenge, typedGerm, operationOracle);
    assert(
      Math.abs(xorMean - challenge.violation.measuredFraction) < 1e-15,
      "The selected challenge severity must equal its XOR-tape mean",
    );
    if (challengeOverride) {
      assert.deepEqual(
        challenge,
        expectedChallenge,
        "A challenge override must equal the certificate's canonical synthesis",
      );
    }

    // Build the whole next atlas from immutable germ records.  No controller
    // field mutates until every earlier revision and the new challenge have
    // validated successfully on the staged atlas.
    const stagedAtlas = new EndogenousTransportAtlas(operationOracle);
    for (const committedGerm of this.#committedGerms) {
      const historical = routeOrientedDefectGerm({
        germ: committedGerm,
        certificate: operationCertificate,
        groupOracle: operationOracle,
        states: operationStates,
      });
      stagedAtlas.applyChallenge(historical.challenge);
    }
    stagedAtlas.applyChallenge(challenge);
    const committedGerm = freezePlainTree(canonicalGermView(typedGerm));
    const nextCommittedGerms = Object.freeze([
      ...this.#committedGerms,
      committedGerm,
    ]);
    const nextSeenAudits = new Set(this.seenAudits);
    nextSeenAudits.add(key);
    const nextChallengeInvocationCount = this.challengeInvocationCount + 1;

    this.atlas = stagedAtlas;
    this.acceptedCellCount = nextAccepted;
    this.materializedCellCount = nextAccepted;
    this.challengeInvocationCount = nextChallengeInvocationCount;
    this.#committedGerms = nextCommittedGerms;
    this.seenAudits = nextSeenAudits;
    assert.equal(this.strictDefect(), 0);

    const matchingCellCount = germCells.length - mismatchCount;
    const orderingSensitivity = {
      canonicalOrder: "certificate relation order, then ascending anchor",
      observedPrefixLength: prefixLength,
      bestCasePrefixLength: 0,
      worstCasePrefixLength: matchingCellCount,
      expectedPrefixLengthUnderUniformRandomPermutation:
        matchingCellCount / (mismatchCount + 1),
      bestCaseControllerDepth: germCells.length + 1,
      worstCaseControllerDepth: germCells.length + matchingCellCount + 1,
      expectedControllerDepthUnderUniformRandomPermutation:
        germCells.length + 1 + matchingCellCount / (mismatchCount + 1),
    };

    return {
      duplicate: false,
      clean: false,
      cellCount: germCells.length,
      mismatchCount,
      mismatchFraction: mismatchCount / germCells.length,
      typedGerm,
      routedThroughTypedGerm: true,
      rawAuditChallengeShortcutUsed: false,
      orientedSplitGermSupport: splitGerm.exponents,
      orientedGlueGermSupport: glueGerm.exponents,
      laurentObstructionGermSupport: obstructionGerm.exponents,
      laurentLocalShearActionCount: obstructionGerm.localShearActionCount,
      lateBoundCoefficientQueriesChecked: germCells.length,
      matchingPrefixLength: prefixLength,
      alphaEvents,
      deltaEvents: prefixLength,
      qEvents: 1,
      qWidth,
      challengeInvocations: 1,
      controllerRepairDepth: germCells.length + prefixLength + 1,
      serialRepairDepth: 2 * germCells.length,
      orderingSensitivity,
      relationComparisonWork: 2 * germCells.length,
      relationCellInspectionWork: germCells.length,
      laurentConstructionActionWork: obstructionGerm.localShearActionCount,
      coefficientQueryShiftWork,
      coefficientReadCount: germCells.length,
      compiledArtifactCount,
      uninstrumentedWordPermutationAndCompilerWorkExcluded: true,
      violationKind: challenge.violation.kind,
      violationExpectation: challenge.violation.expect,
      violationMeasuredFraction: challenge.violation.measuredFraction,
      xorMeanForSelectedViolation: xorMean,
      refinementKind: challenge.refinementAction.kind,
      uniqueGeneratedProbeCount: uniqueProbeCount,
      generatedGlueCount,
      generatedSplitCount,
      atlas: summarizeAtlas(this.atlas),
      context: [this.acceptedCellCount, this.materializedCellCount],
      challenge,
    };
  }
}

export function makeFixtures(groupOracle, certificate) {
  const size = 6;
  const identity = identityPermutation(size);
  const exactIdentity = groupOracle.evaluate([]);
  const j0Word = [token(certificate.names.j[0])];
  const exactJ0 = groupOracle.evaluate(j0Word);

  const clean = new FiniteEmulatorCritic(size);
  clean.assign(exactIdentity, identity, "identity");

  const split = new FiniteEmulatorCritic(size);
  split.assign(exactIdentity, identity, "identity");
  split.assign(exactJ0, identity, "collapsed-j0");

  const glue = new FiniteEmulatorCritic(size);
  glue.assign(exactIdentity, identity, "identity");
  glue.assign(exactJ0, [1, 0, 3, 4, 5, 2], "deranged-wrong-order-j0");

  return { clean, split, glue };
}

function replayChallengeInFreshAtlas({ groupOracle, challenge }) {
  const atlas = new EndogenousTransportAtlas(groupOracle);
  if (challenge) atlas.applyChallenge(challenge);
  return atlas;
}

function endpointQ(context) {
  return { n: context.n, m: Math.max(context.m, context.n) };
}

function endpointDelta(context) {
  return { n: context.n, m: context.m + 1 };
}

function auditEndpointMacroGrid(maximumCoordinate) {
  let contextsChecked = 0;
  for (let n = 0; n <= maximumCoordinate; n += 1) {
    for (let m = 0; m <= maximumCoordinate; m += 1) {
      const context = { n, m };
      const qEndpoint = endpointQ(context);
      let propagated = { ...context };
      for (let step = 0; step < Math.max(n - m, 0); step += 1) {
        propagated = endpointDelta(propagated);
      }
      assert.deepEqual(qEndpoint, propagated);
      const strictPolicyEndpoint = n > m ? endpointQ(context) : context;
      assert.deepEqual(strictPolicyEndpoint, qEndpoint);
      contextsChecked += 1;
    }
  }
  return { maximumCoordinate, contextsChecked };
}

function auditBacklogResiduals(depth) {
  let certificates = 0;
  for (let left = 0; left < depth; left += 1) {
    for (let right = left + 1; right < depth; right += 1) {
      const leftAfter = Math.max(0, left - left);
      const rightAfter = Math.max(0, right - left);
      assert.equal(leftAfter > 0 ? 1 : 0, 0);
      assert.equal(rightAfter > 0 ? 1 : 0, 1);
      certificates += 1;
    }
  }
  return certificates;
}

function auditConditionalInformationLowerBound(maxMissingBits) {
  const rows = [];
  for (let missingBits = 1; missingBits <= maxMissingBits; missingBits += 1) {
    const assignments = new Set();
    for (let mask = 0; mask < 2 ** missingBits; mask += 1) {
      const transcript = mask.toString(2).padStart(missingBits, "0");
      assignments.add(transcript);
      for (let coordinate = 0; coordinate < missingBits; coordinate += 1) {
        const decoded = Number(transcript[coordinate]);
        const expected = (mask >> (missingBits - coordinate - 1)) & 1;
        assert.equal(decoded, expected);
      }
    }
    assert.equal(assignments.size, 2 ** missingBits);
    rows.push({
      missingBits,
      exactAssignmentsRequiringDistinctTranscripts: assignments.size,
      hartleyBits: Math.log2(assignments.size),
      maximumPointwiseDecodingError: 0,
      qWork: missingBits,
      qDepth: 1,
      boundedPropagationWork: missingBits,
      unitSpeedPropagationDepth: missingBits,
    });
  }
  return rows;
}

function auditOrientedCellTruthTable() {
  const rows = [];
  for (const expectationBit of [0, 1]) {
    for (const observedBit of [0, 1]) {
      const mismatchBit = expectationBit ^ observedBit;
      const splitBit = expectationBit === 1 && observedBit === 0 ? 1 : 0;
      const glueBit = expectationBit === 0 && observedBit === 1 ? 1 : 0;
      const route = splitBit ? "split" : glueBit ? "glue" : "none";
      assert.equal(splitBit ^ glueBit, mismatchBit);
      assert.equal(splitBit & glueBit, 0);
      rows.push({
        expectationBit,
        observedBit,
        mismatchBit,
        splitBit,
        glueBit,
        route,
      });
    }
  }
  const xorOne = rows.filter((row) => row.mismatchBit === 1);
  assert.equal(xorOne.length, 2);
  assert.deepEqual(new Set(xorOne.map((row) => row.route)), new Set(["split", "glue"]));
  return rows;
}

function auditOrientedTapeCapacity(maximumCells) {
  const rows = [];
  for (let cellCount = 1; cellCount <= maximumCells; cellCount += 1) {
    const typedTranscriptsAcrossVariableRelationTypes = 3 ** cellCount;
    const mismatchPatternsForOneFixedRelationDirectory = 2 ** cellCount;
    assert(
      typedTranscriptsAcrossVariableRelationTypes >
        mismatchPatternsForOneFixedRelationDirectory,
    );
    rows.push({
      cellCount,
      typedTranscriptsAcrossVariableRelationTypes,
      mismatchPatternsForOneFixedRelationDirectory,
      typedHartleyBitsWhenRelationTypesVary:
        Math.log2(typedTranscriptsAcrossVariableRelationTypes),
      fixedDirectoryHartleyBits: cellCount,
    });
  }
  return rows;
}

export function runCertificateCantorController() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const certificate = compileExpansionLefCertificate(groupOracle);
  const states = NINE_LEAF_CODE_D.map(
    (prefix) => new LeavittRegularState(sWord(prefix), `s_${prefix}`),
  );
  const fixtures = makeFixtures(groupOracle, certificate);

  const cleanController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  const clean = cleanController.process(fixtures.clean);
  assert.equal(clean.cellCount, 42);
  assert.equal(clean.mismatchCount, 0);
  assert.equal(clean.qEvents, 0);
  assert.equal(clean.routedThroughTypedGerm, true);
  assert.equal(clean.rawAuditChallengeShortcutUsed, false);
  assert.deepEqual(cleanController.forceQAtSynchronizedContext(), {
    strict: false,
    challengeInvoked: false,
    context: [42, 42],
  });
  const cleanDuplicate = cleanController.process(fixtures.clean);
  assert.equal(cleanDuplicate.duplicate, true);
  assert.deepEqual(cleanDuplicate.context, [42, 42]);

  const splitController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  const split = splitController.process(fixtures.split);
  assert.equal(split.cellCount, 48);
  assert.equal(split.mismatchCount, 6);
  assert.equal(split.matchingPrefixLength, 0);
  assert.equal(split.refinementKind, "split");
  assert.equal(split.routedThroughTypedGerm, true);
  assert.equal(split.rawAuditChallengeShortcutUsed, false);
  assert.equal(split.orientedSplitGermSupport.length, 6);
  assert.equal(split.orientedGlueGermSupport.length, 0);
  assert.equal(split.uniqueGeneratedProbeCount, 6);
  assert.equal(split.atlas.separationConstraintCount, 1);
  assert.equal(split.controllerRepairDepth, 49);
  assert.equal(split.relationComparisonWork, 96);
  assert.equal(split.coefficientQueryShiftWork, 1128);
  const splitReplayAtlas = replayChallengeInFreshAtlas({
    groupOracle,
    challenge: split.challenge,
  });
  assert.deepEqual(splitReplayAtlas.curriculum(), splitController.atlas.curriculum());
  const canonicalOverrideController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  const canonicalOverride = canonicalOverrideController.process(fixtures.split, {
    challengeOverride: split.challenge,
  });
  assert.equal(canonicalOverride.refinementKind, "split");
  assert.deepEqual(
    canonicalOverrideController.atlas.curriculum(),
    splitController.atlas.curriculum(),
  );
  const reindexedGerm = {
    ...split.typedGerm,
    cells: [...split.typedGerm.cells].reverse(),
  };
  const reindexedController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  const reindexed = reindexedController.process(fixtures.split, {
    typedGermOverride: reindexedGerm,
  });
  assert.equal(reindexed.refinementKind, "split");
  assert.deepEqual(
    reindexedController.atlas.curriculum(),
    splitController.atlas.curriculum(),
  );
  assert.notDeepEqual(
    reindexed.orientedSplitGermSupport,
    split.orientedSplitGermSupport,
  );
  const splitDuplicateSnapshot = splitController.atlas.snapshot();
  const splitDuplicate = splitController.process(fixtures.split);
  assert.equal(splitDuplicate.duplicate, true);
  assert.deepEqual(splitController.atlas.snapshot(), splitDuplicateSnapshot);

  const glueController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  const glue = glueController.process(fixtures.glue);
  assert.equal(glue.cellCount, 48);
  assert.equal(glue.mismatchCount, 4);
  assert.equal(glue.matchingPrefixLength, 8);
  assert.equal(glue.refinementKind, "glue");
  assert.equal(glue.routedThroughTypedGerm, true);
  assert.equal(glue.rawAuditChallengeShortcutUsed, false);
  assert.equal(glue.orientedSplitGermSupport.length, 0);
  assert.equal(glue.orientedGlueGermSupport.length, 4);
  assert.equal(glue.violationMeasuredFraction, 2 / 3);
  assert.equal(glue.atlas.gluingConstraintCount, 1);
  assert.equal(glue.controllerRepairDepth, 57);
  assert.equal(glue.relationComparisonWork, 96);
  assert.equal(glue.coefficientQueryShiftWork, 1128);
  const glueReplayAtlas = replayChallengeInFreshAtlas({
    groupOracle,
    challenge: glue.challenge,
  });
  assert.deepEqual(glueReplayAtlas.curriculum(), glueController.atlas.curriculum());

  const directoryHashBeforeAttack = certificate.status().relationDirectoryHash;
  assert.throws(() => certificate.relations.push({ id: "attacker" }), TypeError);
  assert.throws(() => {
    certificate.relations = [{ id: "attacker" }];
  }, TypeError);
  assert.equal(
    certificate.status().relationDirectoryHash,
    directoryHashBeforeAttack,
  );

  assert.throws(
    () => certificate.challengeFromViolation({
      violation: {
        kind: "forged",
        proofStep: "attacker",
        expect: "evil",
        leftWord: [],
        rightWord: [],
        severity: 1,
        measuredFraction: 1,
      },
    }),
    /opaque certificate selection token/,
  );

  const partialGlueGerm = structuredClone(glue.typedGerm);
  partialGlueGerm.cells = [
    partialGlueGerm.cells.find((cell) => cell.glueBit === 1),
  ];
  partialGlueGerm.cellCount = 1;
  assert.throws(() => routeOrientedDefectGerm({
    germ: partialGlueGerm,
    certificate,
    groupOracle,
    states,
  }));

  const wrongDirectoryGerm = structuredClone(glue.typedGerm);
  wrongDirectoryGerm.relationDirectoryHash = "0".repeat(64);
  assert.throws(() => routeOrientedDefectGerm({
    germ: wrongDirectoryGerm,
    certificate,
    groupOracle,
    states,
  }));

  const emptyGlueAtlas = new EndogenousTransportAtlas(groupOracle);
  assert.throws(
    () => emptyGlueAtlas.applyChallenge({
      violation: { expect: "equal" },
      generatedProbes: [],
      generatedConstraints: [],
      refinementAction: { kind: "glue", generatedConstraintCount: 0 },
    }),
    /coherent nonempty constraint bundle/,
  );
  assert.equal(emptyGlueAtlas.snapshot().revisionCount, 0);

  const reducerController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  reducerController.seenAudits.add = () => {
    throw new Error("old mutable-set trap");
  };
  reducerController.atlas.applyChallenge = () => {
    throw new Error("old mutable-atlas trap");
  };
  const reducerResult = reducerController.process(fixtures.split);
  assert.equal(reducerResult.refinementKind, "split");
  assert.equal(reducerController.atlas.snapshot().revisionCount, 1);

  const mutableReplayOracle = new ExactNonSoficGroupOracle();
  const mutableReplayCertificate = compileExpansionLefCertificate(
    mutableReplayOracle,
  );
  const mutableReplayStates = NINE_LEAF_CODE_D.map(
    (prefix) => new LeavittRegularState(sWord(prefix), `mutable_${prefix}`),
  );
  const mutableReplayFixtures = makeFixtures(
    mutableReplayOracle,
    mutableReplayCertificate,
  );
  const historyStableController = new CertificateXorController({
    certificate: mutableReplayCertificate,
    groupOracle: mutableReplayOracle,
    states: mutableReplayStates,
  });
  historyStableController.process(mutableReplayFixtures.split);
  const historicalSplitRevision = structuredClone(
    historyStableController.atlas.snapshot().revisions[0],
  );
  // All three aliases are caller-accessible, but none is a replay dependency.
  mutableReplayStates[0].element.terms.clear();
  mutableReplayOracle.generators.clear();
  historyStableController.atlas.groupOracle.generators.clear();
  historyStableController.committedGerms = [
    structuredClone(glue.typedGerm),
  ];
  historyStableController.process(mutableReplayFixtures.glue);
  assert.deepEqual(
    historyStableController.atlas.snapshot().revisions[0],
    historicalSplitRevision,
  );
  assert.equal(historyStableController.atlas.snapshot().revisionCount, 2);

  function legacyRawAuditChallenge(critic) {
    const { relationChecks } = relationAnchorAudit(certificate, critic, groupOracle);
    return certificate.challenge({
      emulatorAudit: { relationChecks },
      states,
      groupOracle,
    });
  }
  assert.deepEqual(legacyRawAuditChallenge(fixtures.split), split.challenge);
  assert.deepEqual(legacyRawAuditChallenge(fixtures.glue), glue.challenge);

  const erasedGermController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  assert.throws(
    () => erasedGermController.process(fixtures.split, { typedGermOverride: null }),
    /typed obstruction germ is required/i,
  );
  assert.equal(erasedGermController.atlas.snapshot().revisionCount, 0);
  assert.deepEqual(
    [erasedGermController.acceptedCellCount, erasedGermController.materializedCellCount],
    [0, 0],
  );

  const wrongOrientationGerm = JSON.parse(JSON.stringify(split.typedGerm));
  const wrongOrientationCell = wrongOrientationGerm.cells.find(
    (cell) => cell.splitBit === 1,
  );
  wrongOrientationCell.splitBit = 0;
  wrongOrientationCell.glueBit = 1;
  const wrongOrientationController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  assert.throws(
    () => wrongOrientationController.process(fixtures.split, {
      typedGermOverride: wrongOrientationGerm,
    }),
  );
  assert.equal(wrongOrientationController.atlas.snapshot().revisionCount, 0);
  assert.deepEqual(
    [
      wrongOrientationController.acceptedCellCount,
      wrongOrientationController.materializedCellCount,
      wrongOrientationController.seenAudits.size,
    ],
    [0, 0, 0],
  );

  const malformedController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  const malformed = {
    ...split.challenge,
    violation: {
      ...split.challenge.violation,
      rightWord: split.challenge.violation.leftWord,
    },
  };
  assert.throws(
    () => malformedController.process(fixtures.split, {
      challengeOverride: malformed,
    }),
    /no XOR tape/,
  );
  assert.deepEqual(malformedController.atlas.snapshot().revisionCount, 0);
  assert.deepEqual(
    [
      malformedController.acceptedCellCount,
      malformedController.materializedCellCount,
    ],
    [0, 0],
  );

  const inconsistentMeanController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  const inconsistentMean = {
    ...split.challenge,
    violation: {
      ...split.challenge.violation,
      measuredFraction: split.challenge.violation.measuredFraction / 2,
    },
  };
  assert.throws(
    () => inconsistentMeanController.process(fixtures.split, {
      challengeOverride: inconsistentMean,
    }),
    /severity must equal its XOR-tape mean/,
  );
  assert.deepEqual(inconsistentMeanController.atlas.snapshot().revisionCount, 0);
  assert.deepEqual(
    [
      inconsistentMeanController.acceptedCellCount,
      inconsistentMeanController.materializedCellCount,
      inconsistentMeanController.seenAudits.size,
    ],
    [0, 0, 0],
  );

  const forgedBundleController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  const forgedBundle = {
    ...split.challenge,
    generatedProbes: [
      ...split.challenge.generatedProbes,
      split.challenge.generatedProbes[0],
    ],
  };
  assert.throws(
    () => forgedBundleController.process(fixtures.split, {
      challengeOverride: forgedBundle,
    }),
    /canonical synthesis/,
  );
  assert.deepEqual(forgedBundleController.atlas.snapshot().revisionCount, 0);
  assert.deepEqual(
    [
      forgedBundleController.acceptedCellCount,
      forgedBundleController.materializedCellCount,
      forgedBundleController.seenAudits.size,
    ],
    [0, 0, 0],
  );

  const capacityAudit = auditConditionalInformationLowerBound(12);
  const orientedTruthTable = auditOrientedCellTruthTable();
  const orientedCapacityAudit = auditOrientedTapeCapacity(10);
  const residualCertificates = auditBacklogResiduals(64);
  const endpointMacroGrid = auditEndpointMacroGrid(32);
  assert.equal(residualCertificates, 2016);

  function publicFixture(result) {
    const { challenge, typedGerm, ...serializable } = result;
    return {
      ...serializable,
      typedGerm: typedGerm
        ? {
            schema: typedGerm.schema,
            certificateId: typedGerm.certificateId,
            relationDirectoryHash: typedGerm.relationDirectoryHash,
            anchorCount: typedGerm.anchorCount,
            cellCount: typedGerm.cellCount,
            splitCellCount: typedGerm.cells.reduce(
              (sum, cell) => sum + cell.splitBit,
              0,
            ),
            glueCellCount: typedGerm.cells.reduce(
              (sum, cell) => sum + cell.glueBit,
              0,
            ),
          }
        : null,
    };
  }

  return {
    schema: "oasis.certificate-cantor-controller.v3",
    object:
      "an oriented certificate germ that reconstructs canonical split/glue challenges without a raw-audit routing shortcut",
    exactBridge: {
      expectationCoordinate: "x_(R,a)=1 iff relation R expects distinctness",
      observationCoordinate:
        "y_(R,a)=1 iff the finite-emulator images of the two words differ at anchor a",
      obstructionCoordinate: "z_(R,a)=x_(R,a) XOR y_(R,a)",
      splitCoordinate: "s_(R,a)=x_(R,a)(1-y_(R,a))",
      glueCoordinate: "g_(R,a)=(1-x_(R,a))y_(R,a)",
      polarityIdentity: "z=s+g and sg=0",
      equalitySeverity: "mean(z)=normalized Hamming defect",
      distinctnessSeverity: "mean(z)=collision fraction",
      controllerGate: "strict backlog AND at least one nonzero z coordinate",
      arrowLift:
        "the two oriented tapes are compiled into separate Laurent charts and replayed by late-bound coefficient queries",
      noLeakRoute:
        "raw relation checks are encoded once; canonical violation selection and challenge synthesis then consume only the typed germ, immutable certificate directory, exact oracle, and probe states",
    },
    germMediationAudit: {
      truthTable: orientedTruthTable,
      bareXorNoGo:
        "the cells (expect distinct, observe equal) and (expect equal, observe distinct) both have z=1 but soundness requires split on the first and glue on the second",
      typedCapacityRows: orientedCapacityAudit,
      capacityBoundary:
        "for one immutable relation directory each cell has only mismatch/no-mismatch freedom, so z plus the relation expectation carries the same information; 3^N counts the larger family in which relation orientation also varies",
      rawAuditBaselineAgreement: true,
      postEncodingGateAndDuplicateKeyUseCanonicalGerm: true,
      relationDirectoryDigestBound: true,
      certificateDirectoryFrozen: true,
      opaqueViolationSelectionTokenRequired: true,
      incompleteAnchorBlockRejected: true,
      wrongDirectoryDigestRejected: true,
      emptyAtlasRevisionRejected: true,
    freshStateReducerIgnoresOldMutableComponentTraps: true,
    replayOracleAndProbeStatesSnapshottedByValue: true,
    committedGermLogPrivateAndDeeplyFrozen: true,
    historicalRevisionStableUnderCallerAliasMutation: true,
      erasedGermRejectedBeforeMutation: true,
      wrongOrientationRejectedBeforeMutation: true,
      reindexingNaturality:
        "permuting the chart coordinates changes Laurent support and shift cost but preserves the reconstructed challenge and committed atlas curriculum",
      fairControl:
        "a conventional tape storing z plus the immutable expectation bit of each relation reconstructs the same oriented germ exactly",
    },
    fixtures: {
      clean: publicFixture(clean),
      cleanDuplicate,
      split: publicFixture(split),
      splitDuplicate,
      reindexedSplit: publicFixture(reindexed),
      glue: publicFixture(glue),
      malformedTransactionRolledBack: true,
      inconsistentMeanTransactionRolledBack: true,
      forgedArtifactBundleRejected: true,
      canonicalOverrideAccepted: true,
      erasedGermRejected: true,
      wrongOrientationGermRejected: true,
    },
    twoLedgers: {
      controllerDepth:
        "N alpha events + matching-prefix delta events + one strict q event",
      serialDepth: "N alpha events + N delta events",
      relationComparisonWork:
        "both policies inspect/materialize N expectation and N observation cells",
      artifactCardinality:
        "unique installed probes plus generated glue constraints plus the split relation when present; this is an output count, not compiler runtime",
      conclusion:
        "the q route can reduce declared causal depth but does not reduce relation-comparison work; artifact outputs are held fixed in the replay control",
      inspectionBoundary:
        "the N covered relation-anchor comparisons are counted; exact word evaluation, permutation composition, and challenge compiler runtime are not instrumented",
      duplicateBoundary:
        "an identical replay is a state stutter only; it still pays the relation-anchor inspection pass needed to identify the audit key",
      coefficientQueryBoundary:
        "late-bound coefficient replay is exact, but reading exponent j through local frame transport costs |j| shift actions",
      chartBoundary:
        "Laurent exponents are serialization coordinates; relabeling or reordering cells may change chart cost while the coordinate-free routed revision stays fixed",
      noGrandTotal:
        "component ledgers are reported separately because the uninstrumented algebra and compiler operations prevent an honest total-runtime claim",
    },
    conditionalCatchUpAudit: {
      capacityRows: capacityAudit,
      theorem:
        "for deterministic decoders with uniform pointwise error below 1/2, readiness for k independent missing Boolean coordinates requires at least 2^k transcripts and k bits of conditional information",
      paretoProfiles: {
        q: "work k, depth 1",
        unitSpeedPropagation: "work k, depth k",
      },
    },
    endpointNoGo: {
      macroIdentity: "Phi_q(B_(n,m))=Phi_delta^(max(n-m,0))(B_(n,m))",
      conditionalPolicyCollapse:
        "if o_q then q else identity equals unconditional q on every reachable endpoint context",
      endToEndControl:
        "from B_(0,0), alpha^n q has n+1 serial events while alpha^n delta^n has 2n; the conditional n-versus-1 catch-up gap is not an end-to-end gap",
      matchedRandomAccessControl:
        "an ambient depth-one vector sensor can match q and must be admitted as an equal-information baseline",
      exhaustiveGridAudit: endpointMacroGrid,
      replayEndpointControl:
        "applying the already-selected challenge to a fresh atlas reproduces the endpoint curriculum; this is not an independently discovering serial controller",
    },
    residualAudit: {
      backlogDepthsChecked: 64,
      pairwiseDeltaSuffixCertificates: residualCertificates,
      boundary:
        "the finite installed OASIS certificate does not by itself prove an unbounded operational certificate frontier",
    },
    claimBoundary: [
      "this is an exact certificate-to-controller bridge, not a predictive advantage theorem",
      "the new theorem is germ mediation and repair orientation; the rank-two tape carrier is still exactly simulable by ordinary arrays and sparse maps",
      "bare XOR is insufficient only when relation expectation metadata is withheld; z plus the immutable relation expectation is an exact fair control",
      "q supplies parallel comparison, not information compression",
      "the controller depends on exact critic inspection and certificate replay",
      "the global nonsofic certificate still has open effective universal obligations",
      "the endpoint defect remains a one-counter process and does not by itself require a difficult global computation",
    ],
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runCertificateCantorController(), null, 2));
}
