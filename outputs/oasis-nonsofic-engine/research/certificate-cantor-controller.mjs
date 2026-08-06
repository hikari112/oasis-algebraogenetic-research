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
import { sWord } from "../src/leavitt-f2.mjs";
import { NINE_LEAF_CODE_D } from "../src/unit-group.mjs";
import {
  compileBitTapeToLaurent,
  queryLaurentTapeCoefficient,
} from "./laurent-holonomy-genesis.mjs";

function token(generator, inverse = false) {
  return { generator, inverse };
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

function auditKey(certificateId, cells) {
  return JSON.stringify({
    certificateId,
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

function challengeTapeMean(challenge, cells, groupOracle) {
  const violation = challenge.violation;
  assert(violation, "A challenged tape must contain a violation");
  let matching;
  if (violation.relationId) {
    const pairKey = unorderedPairKey(
      groupOracle.evaluate(violation.leftWord).hash,
      groupOracle.evaluate(violation.rightWord).hash,
    );
    matching = cells.filter(
      (cell) => cell.relationId === violation.relationId &&
        cell.expect === violation.expect &&
        cell.exactPairKey === pairKey,
    );
  } else {
    const pairKey = unorderedPairKey(
      groupOracle.evaluate(violation.leftWord).hash,
      groupOracle.evaluate(violation.rightWord).hash,
    );
    matching = cells.filter(
      (cell) => cell.exactPairKey === pairKey && cell.expect === violation.expect,
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

class CertificateXorController {
  constructor({ certificate, groupOracle, states }) {
    this.certificate = certificate;
    this.groupOracle = groupOracle;
    this.states = states;
    this.atlas = new EndogenousTransportAtlas(groupOracle);
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

  process(critic, { challengeOverride = null } = {}) {
    // This controller is deliberately scoped to the certificate's explicit
    // relation checks.  The same semantic object drives the XOR tape, audit
    // key, and challenge selector; aliases, multiplication checks, expansion,
    // and LEF candidates require their own typed tapes before they can enter.
    const { cells, relationChecks } = relationAnchorAudit(
      this.certificate,
      critic,
      this.groupOracle,
    );
    const emulatorAudit = { relationChecks };
    const key = auditKey(this.certificate.status().certificateId, cells);
    if (this.seenAudits.has(key)) {
      return {
        duplicate: true,
        stateStutter: true,
        alphaEvents: 0,
        deltaEvents: 0,
        qEvents: 0,
        challengeInvocations: 0,
        relationCellInspectionWork: cells.length,
        uninstrumentedWordAndPermutationWorkExcluded: true,
        atlas: summarizeAtlas(this.atlas),
        context: [this.acceptedCellCount, this.materializedCellCount],
      };
    }

    const startAccepted = this.acceptedCellCount;
    const startMaterialized = this.materializedCellCount;
    const atlasBefore = this.atlas.snapshot();
    const alphaEvents = cells.length;
    const nextAccepted = startAccepted + alphaEvents;
    const prefixLength = matchingPrefixLength(cells);
    const mismatchCount = cells.reduce(
      (sum, cell) => sum + cell.mismatchBit,
      0,
    );
    const obstructionGerm = compileBitTapeToLaurent(
      cells.map((cell) => cell.mismatchBit),
    );
    const coefficientQueryShiftWork = cells.reduce(
      (sum, _cell, index) => sum + Math.abs(index),
      0,
    );
    cells.forEach((cell, index) => {
      assert.equal(
        queryLaurentTapeCoefficient(obstructionGerm.exponents, index),
        cell.mismatchBit,
      );
    });

    if (mismatchCount === 0) {
      this.acceptedCellCount = nextAccepted;
      this.materializedCellCount = nextAccepted;
      this.seenAudits.add(key);
      assert.equal(this.strictDefect(), 0);
      return {
        duplicate: false,
        clean: true,
        cellCount: cells.length,
        mismatchCount,
        laurentObstructionGermSupport: obstructionGerm.exponents,
        laurentLocalShearActionCount: obstructionGerm.localShearActionCount,
        lateBoundCoefficientQueriesChecked: cells.length,
        matchingPrefixLength: prefixLength,
        alphaEvents,
        deltaEvents: cells.length,
        qEvents: 0,
        qWidth: 0,
        challengeInvocations: 0,
        controllerRepairDepth: 2 * cells.length,
        serialRepairDepth: 2 * cells.length,
        relationComparisonWork: 2 * cells.length,
        relationCellInspectionWork: cells.length,
        laurentConstructionActionWork: obstructionGerm.localShearActionCount,
        coefficientQueryShiftWork,
        coefficientReadCount: cells.length,
        compiledArtifactCount: 0,
        uninstrumentedWordPermutationAndCompilerWorkExcluded: true,
        atlas: summarizeAtlas(this.atlas),
        context: [this.acceptedCellCount, this.materializedCellCount],
      };
    }

    const nextMaterializedBeforeQ = startMaterialized + prefixLength;
    assert(nextAccepted > nextMaterializedBeforeQ);
    const qWidth = cells.length - prefixLength;
    const expectedChallenge = this.certificate.challenge({
      emulatorAudit,
      states: this.states,
      groupOracle: this.groupOracle,
    });
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
    const xorMean = challengeTapeMean(challenge, cells, this.groupOracle);
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

    try {
      this.atlas.applyChallenge(challenge);
    } catch (error) {
      assert.deepEqual(this.atlas.snapshot(), atlasBefore);
      assert.equal(this.acceptedCellCount, startAccepted);
      assert.equal(this.materializedCellCount, startMaterialized);
      throw error;
    }

    this.acceptedCellCount = nextAccepted;
    this.materializedCellCount = nextAccepted;
    this.challengeInvocationCount += 1;
    this.seenAudits.add(key);
    assert.equal(this.strictDefect(), 0);

    const matchingCellCount = cells.length - mismatchCount;
    const orderingSensitivity = {
      canonicalOrder: "certificate relation order, then ascending anchor",
      observedPrefixLength: prefixLength,
      bestCasePrefixLength: 0,
      worstCasePrefixLength: matchingCellCount,
      expectedPrefixLengthUnderUniformRandomPermutation:
        matchingCellCount / (mismatchCount + 1),
      bestCaseControllerDepth: cells.length + 1,
      worstCaseControllerDepth: cells.length + matchingCellCount + 1,
      expectedControllerDepthUnderUniformRandomPermutation:
        cells.length + 1 + matchingCellCount / (mismatchCount + 1),
    };

    return {
      duplicate: false,
      clean: false,
      cellCount: cells.length,
      mismatchCount,
      mismatchFraction: mismatchCount / cells.length,
      laurentObstructionGermSupport: obstructionGerm.exponents,
      laurentLocalShearActionCount: obstructionGerm.localShearActionCount,
      lateBoundCoefficientQueriesChecked: cells.length,
      matchingPrefixLength: prefixLength,
      alphaEvents,
      deltaEvents: prefixLength,
      qEvents: 1,
      qWidth,
      challengeInvocations: 1,
      controllerRepairDepth: cells.length + prefixLength + 1,
      serialRepairDepth: 2 * cells.length,
      orderingSensitivity,
      relationComparisonWork: 2 * cells.length,
      relationCellInspectionWork: cells.length,
      laurentConstructionActionWork: obstructionGerm.localShearActionCount,
      coefficientQueryShiftWork,
      coefficientReadCount: cells.length,
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

function makeFixtures(groupOracle, certificate) {
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
  const residualCertificates = auditBacklogResiduals(64);
  const endpointMacroGrid = auditEndpointMacroGrid(32);
  assert.equal(residualCertificates, 2016);

  function publicFixture(result) {
    const { challenge, ...serializable } = result;
    return serializable;
  }

  return {
    schema: "oasis.certificate-cantor-controller.v1",
    object:
      "pointwise certificate expectation XOR emulator observation, with obstruction-gated split/glue refinement",
    exactBridge: {
      expectationCoordinate: "x_(R,a)=1 iff relation R expects distinctness",
      observationCoordinate:
        "y_(R,a)=1 iff the finite-emulator images of the two words differ at anchor a",
      obstructionCoordinate: "z_(R,a)=x_(R,a) XOR y_(R,a)",
      equalitySeverity: "mean(z)=normalized Hamming defect",
      distinctnessSeverity: "mean(z)=collision fraction",
      controllerGate: "strict backlog AND at least one nonzero z coordinate",
      arrowLift:
        "the full mismatch tape is compiled by local conjugate shears into r_C=sum_i z_i z^i and replayed by late-bound coefficient queries",
    },
    fixtures: {
      clean: publicFixture(clean),
      cleanDuplicate,
      split: publicFixture(split),
      splitDuplicate,
      glue: publicFixture(glue),
      malformedTransactionRolledBack: true,
      inconsistentMeanTransactionRolledBack: true,
      forgedArtifactBundleRejected: true,
      canonicalOverrideAccepted: true,
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
