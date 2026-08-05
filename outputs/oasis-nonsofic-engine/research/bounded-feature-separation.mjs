import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import { CertifiedBoundedProgram } from "./presentation-transcendent-algebra.mjs";
import { enumerateExactGroupWindow } from "./query-local-universality.mjs";

function selectDisjointResidualPairs(candidates, residual, requestedCount) {
  const occupied = new Set();
  const pairs = [];
  for (const reference of candidates) {
    const alternateUnit = reference.unit.multiply(residual.unit);
    const referenceHash = reference.hash;
    const alternateHash = alternateUnit.hash();
    if (referenceHash === alternateHash) continue;
    if (occupied.has(referenceHash) || occupied.has(alternateHash)) continue;
    occupied.add(referenceHash);
    occupied.add(alternateHash);
    pairs.push({
      reference,
      alternateUnit,
      referenceHash,
      alternateHash,
    });
    if (pairs.length >= requestedCount) break;
  }
  return pairs;
}

export function runBoundedExtensionalObserver(observer, program) {
  const transcript = [];
  for (let step = 0; step < observer.queryBudget; step += 1) {
    const queryUnit = observer.nextQuery({
      step,
      transcript: transcript.map((entry) => ({ ...entry })),
    });
    if (queryUnit === null || queryUnit === undefined) break;
    const queryHash = queryUnit.hash();
    const value = Number(program.evaluate(queryUnit));
    transcript.push({ queryHash, value });
  }
  const output = observer.readout({
    transcript: transcript.map((entry) => ({ ...entry })),
  });
  return { transcript, output };
}

function fixedQueryObserver(queryUnits, name = "fixed-global-feature-bank") {
  return {
    name,
    queryBudget: queryUnits.length,
    nextQuery: ({ step }) => queryUnits[step],
    readout: ({ transcript }) => ({
      bitSignature: transcript.map((entry) => entry.value).join(""),
      nonlinearScore: transcript.reduce(
        (sum, entry, index) => sum + ((index + 1) * entry.value) ** 3,
        0,
      ),
    }),
  };
}

function adaptiveNonlinearObserver(zeroPathUnits, branchUnits, name) {
  return {
    name,
    queryBudget: zeroPathUnits.length,
    nextQuery: ({ step, transcript }) => {
      const hasObservedOne = transcript.some((entry) => entry.value === 1);
      return (hasObservedOne ? branchUnits : zeroPathUnits)[step];
    },
    readout: ({ transcript }) => {
      const weighted = transcript.reduce(
        (sum, entry, index) => sum + (index + 2) * entry.value,
        0,
      );
      return {
        parity: weighted % 2,
        polynomial: weighted ** 3 - 2 * weighted ** 2 + 7 * weighted,
        transcriptHash: transcript.map((entry) => `${entry.queryHash}:${entry.value}`).join("|"),
      };
    },
  };
}

export function auditObserverAgainstPairs(
  observerFactory,
  zeroProgram,
  statePairs,
  supportPairs,
) {
  const zeroObserver = observerFactory();
  const zeroRun = runBoundedExtensionalObserver(zeroObserver, zeroProgram);
  const zeroPathQueries = new Set(zeroRun.transcript.map((entry) => entry.queryHash));
  const potentiallyDistinguishedPairIndices = [];
  const actuallyDistinguishedPairIndices = [];

  for (let index = 0; index < supportPairs.length; index += 1) {
    const supportPair = supportPairs[index];
    const statePair = statePairs[index];
    const supportIntersectsZeroPath = zeroPathQueries.has(supportPair.referenceHash)
      || zeroPathQueries.has(supportPair.alternateHash);
    if (supportIntersectsZeroPath) potentiallyDistinguishedPairIndices.push(index);

    const referenceRun = runBoundedExtensionalObserver(
      observerFactory(),
      statePair.referenceState,
    );
    const alternateRun = runBoundedExtensionalObserver(
      observerFactory(),
      statePair.alternateState,
    );
    const outputsDiffer = !isDeepStrictEqual(referenceRun.output, alternateRun.output);
    if (outputsDiffer) actuallyDistinguishedPairIndices.push(index);

    if (!supportIntersectsZeroPath) {
      assert.deepEqual(referenceRun.transcript, zeroRun.transcript);
      assert.deepEqual(alternateRun.transcript, zeroRun.transcript);
      assert.equal(outputsDiffer, false);
    }
  }

  assert(potentiallyDistinguishedPairIndices.length <= zeroPathQueries.size);
  assert(zeroPathQueries.size <= zeroObserver.queryBudget);
  assert(
    actuallyDistinguishedPairIndices.every((index) => (
      potentiallyDistinguishedPairIndices.includes(index)
    )),
  );

  return {
    observerName: zeroObserver.name,
    totalQueryBudget: zeroObserver.queryBudget,
    zeroPathQueryCount: zeroPathQueries.size,
    potentiallyDistinguishedPairCount: potentiallyDistinguishedPairIndices.length,
    actuallyDistinguishedPairCount: actuallyDistinguishedPairIndices.length,
    universalCertificate:
      "before-the-first-nonzero-answer-every-point-mass-follows-the-zero-oracle-transcript-so-a-distinguished-pair-must-intersect-the-zero-path-query-set",
  };
}

export function runBoundedFeatureSeparation() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const generatorNames = [
    "x:0:1:s0",
    "x:1:0:s1",
    "x:2:3:s0",
    "x:3:2:s1",
  ];
  const identity = groupOracle.evaluate([]);
  const residual = groupOracle.evaluate([generatorNames[0]]);
  const commonContinuation = groupOracle.evaluate([
    generatorNames[2],
    generatorNames[3],
  ]);
  const candidates = enumerateExactGroupWindow(groupOracle, generatorNames, 5, 4096);
  const supportPairs = selectDisjointResidualPairs(candidates, residual, 24);
  assert.equal(supportPairs.length, 24);
  assert.equal(
    new Set(supportPairs.flatMap((pair) => [pair.referenceHash, pair.alternateHash])).size,
    2 * supportPairs.length,
  );

  const continuedSupportPairs = supportPairs.map((pair) => {
    const referenceUnit = commonContinuation.unit.multiply(pair.reference.unit);
    const alternateUnit = commonContinuation.unit.multiply(pair.alternateUnit);
    return {
      reference: { unit: referenceUnit, hash: referenceUnit.hash() },
      alternateUnit,
      referenceHash: referenceUnit.hash(),
      alternateHash: alternateUnit.hash(),
    };
  });
  assert.equal(
    new Set(continuedSupportPairs.flatMap((pair) => [
      pair.referenceHash,
      pair.alternateHash,
    ])).size,
    2 * continuedSupportPairs.length,
  );

  const zeroProgram = CertifiedBoundedProgram.constant(0);
  const deltaIdentity = CertifiedBoundedProgram.pointMass(identity.unit);
  const statePairs = continuedSupportPairs.map((pair) => ({
    referenceState: deltaIdentity.translate(pair.reference.unit),
    alternateState: deltaIdentity.translate(pair.alternateUnit),
  }));

  const scales = [2, 4, 8, 16, 24].map((pairCount) => {
    const selectedSupports = continuedSupportPairs.slice(0, pairCount);
    const selectedStates = statePairs.slice(0, pairCount);
    const attainingObserverFactory = () => fixedQueryObserver(
      selectedSupports.map((pair) => pair.reference.unit),
      `attaining-${pairCount}-query-global-program`,
    );
    const audit = auditObserverAgainstPairs(
      attainingObserverFactory,
      zeroProgram,
      selectedStates,
      selectedSupports,
    );
    assert.equal(audit.actuallyDistinguishedPairCount, pairCount);

    return {
      pairCount,
      necessaryAndSufficientContextBlindQueryBudget: pairCount,
      attainingProgramAudit: audit,
      contextAddressedAtlasQueryBudgetPerExample: 1,
      sharedAtlasCoordinateCount: 1,
      exactSemanticPointQueryCompressionRatio: pairCount,
      balancedUniformTaskErrorFloorBelowNecessaryBudget: (queryBudget) => (
        Math.max(0, pairCount - queryBudget) / (2 * pairCount)
      ),
    };
  });

  // Stress the structural certificate with adaptive, nonlinear observers. The
  // branch schedule may change after a hit, and the readout may be arbitrary;
  // only the all-zero transcript matters to the lower bound.
  const adaptiveAudits = [];
  for (let specimen = 0; specimen < 32; specimen += 1) {
    const budget = 1 + (specimen % 12);
    const zeroPathUnits = Array.from({ length: budget }, (_unused, index) => (
      candidates[(specimen * 37 + index * 11) % candidates.length].unit
    ));
    const branchUnits = Array.from({ length: budget }, (_unused, index) => (
      candidates[(specimen * 19 + index * 23 + 7) % candidates.length].unit
    ));
    const observerFactory = () => adaptiveNonlinearObserver(
      zeroPathUnits,
      branchUnits,
      `adaptive-nonlinear-${specimen}`,
    );
    adaptiveAudits.push(auditObserverAgainstPairs(
      observerFactory,
      zeroProgram,
      statePairs,
      continuedSupportPairs,
    ));
  }
  assert(adaptiveAudits.every((audit) => (
    audit.actuallyDistinguishedPairCount <= audit.totalQueryBudget
  )));

  const atlasExamples = [];
  for (let index = 0; index < supportPairs.length; index += 1) {
    const pair = supportPairs[index];
    const continuedPair = continuedSupportPairs[index];
    const statePair = statePairs[index];
    const continuedReferenceState = statePair.referenceState;
    const continuedAlternateState = statePair.alternateState;
    const continuedReferencePath = continuedPair.reference.unit;
    const continuedAlternatePath = continuedPair.alternateUnit;
    assert.equal(
      continuedReferencePath.inverse().multiply(continuedAlternatePath).equals(residual.unit),
      true,
    );

    const referenceCoordinate = Number(
      continuedReferenceState.evaluate(continuedReferencePath),
    );
    const alternateCoordinate = Number(
      continuedAlternateState.evaluate(continuedReferencePath),
    );
    assert.equal(referenceCoordinate, 1);
    assert.equal(alternateCoordinate, 0);
    assert.equal(
      referenceCoordinate,
      Number(
        deltaIdentity.translate(pair.reference.unit).evaluate(pair.reference.unit),
      ),
    );
    assert.equal(
      alternateCoordinate,
      Number(
        deltaIdentity.translate(pair.alternateUnit).evaluate(pair.reference.unit),
      ),
    );
    atlasExamples.push({
      referenceHash: pair.referenceHash,
      continuedReferenceHash: continuedReferencePath.hash(),
      referenceCoordinate,
      alternateCoordinate,
    });
  }

  return {
    schema: "oasis.contextual-atlas-point-query-separation.v1",
    exactGroup: groupOracle.theorem.group,
    pairCount: supportPairs.length,
    residualHolonomyHash: residual.hash,
    commonContinuationHash: commonContinuation.hash,
    theorem: {
      name: "contextual-atlas-semantic-point-query-separation",
      boundedSemanticPointQueryClass:
        "deterministic-extensional-context-blind-programs-with-arbitrary-adaptive-group-wide-evaluation-queries-arbitrary-internal-computation-and-total-query-budget-Q",
      deterministicLowerBound:
        "Q-total-semantic-evaluations-can-distinguish-at-most-Q-mutually-disjoint-point-mass-residual-pairs-so-distinguishing-n-pairs-requires-Q-at-least-n",
      featureBankCorollary:
        "m-semantic-point-query-programs-with-at-most-b-evaluations-each-require-m*b-at-least-n",
      randomizedCorollary:
        "with-independent-internal-coins-and-a-hard-Q-bound-on-every-run-on-a-uniform-pair-and-balanced-branch-distribution-every-randomized-point-query-observer-has-error-at-least-(n-Q)/(2n)-for-Q-at-most-n",
      atlasUpperBound:
        "when-the-reference-path-t-is-context-supplied-the-single-rule-Phi_(t,e)(p)=p(t)-uses-one-semantic-evaluation-and-one-shared-coordinate-for-all-n-pairs",
      continuationInvariant:
        "Phi_(u*t,e)(alpha_u(p))=Phi_(t,e)(p)",
    },
    scales: scales.map((scale) => ({
      pairCount: scale.pairCount,
      necessaryAndSufficientContextBlindQueryBudget:
        scale.necessaryAndSufficientContextBlindQueryBudget,
      attainingProgramAudit: scale.attainingProgramAudit,
      contextAddressedAtlasQueryBudgetPerExample:
        scale.contextAddressedAtlasQueryBudgetPerExample,
      sharedAtlasCoordinateCount: scale.sharedAtlasCoordinateCount,
      exactSemanticPointQueryCompressionRatio:
        scale.exactSemanticPointQueryCompressionRatio,
      randomizedErrorFloorAtHalfBudget:
        scale.balancedUniformTaskErrorFloorBelowNecessaryBudget(
          Math.floor(scale.pairCount / 2),
        ),
    })),
    adaptiveNonlinearStressAudit: {
      specimenCount: adaptiveAudits.length,
      maximumQueryBudget: Math.max(...adaptiveAudits.map((audit) => audit.totalQueryBudget)),
      allObservedDistinguishedPairCountsRespectUniversalBound: true,
    },
    atlasAudit: {
      examplePairCount: atlasExamples.length,
      allPairsSeparatedByOneSharedContextAddressedCoordinate: atlasExamples.every(
        (example) => example.referenceCoordinate !== example.alternateCoordinate,
      ),
      exactCommonContinuationInvarianceChecked: true,
    },
    costLedger: {
      compressed:
        "per-example-semantic-point-evaluation-count-under-the-stated-interface",
      notCompressedByThisTheorem:
        "output-coordinate-count-feature-source-length-total-memory-transport-runtime-and-obstruction-search",
      referencePathCost:
        "one-context-address-per-example-assumed-supplied-by-the-generating-path",
      minimumReferenceIdentityInformation:
        "at-least-log2(n)-bits-to-identify-one-of-n-unrelated-contexts-plus-the-path-word-representation-unless-the-address-is-causally-carried",
      ifReferencesAreNotSupplied:
        "storing-n-unrelated-reference-paths-costs-Theta(n)-and-the-result-is-not-a-total-memory-compression-theorem",
      transportCost:
        "exact-group-composition-needed-to-update-the-context-under-continuation",
      obstructionSearchCost:
        "not-bounded-by-this-theorem",
      nonSoficityNeededForFiniteQueryLowerBound: false,
      nonSoficityRole:
        "the-action-admits-no-sofic-approximation-in-the-Gao-Kunnawalkam-Elayavalli-Patchell-countable-set-action-sense-this-does-not-yet-prove-forced-chart-growth",
    },
  };
}

if (
  typeof process !== "undefined"
  && process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runBoundedFeatureSeparation(), null, 2));
}
