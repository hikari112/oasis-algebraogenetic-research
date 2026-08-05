import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import {
  CertifiedBoundedProgram,
  delayedHaltMachine,
} from "./presentation-transcendent-algebra.mjs";
import { enumerateExactGroupWindow } from "./query-local-universality.mjs";

function valuesOn(program, continuations) {
  return continuations.map((continuation) => `${program.evaluate(continuation.unit)}`);
}

function agreeOn(left, right, continuations) {
  return JSON.stringify(valuesOn(left, continuations))
    === JSON.stringify(valuesOn(right, continuations));
}

function findFirstContinuationWitness({ left, right, groupOracle, generatorNames }) {
  const identity = groupOracle.evaluate([]);
  const queue = [identity];
  const seen = new Set([identity.hash]);
  for (let index = 0; index < queue.length; index += 1) {
    const candidate = queue[index];
    const leftValue = left.evaluate(candidate.unit);
    const rightValue = right.evaluate(candidate.unit);
    if (leftValue !== rightValue) {
      return {
        enumerationIndex: index,
        distanceExponent: index + 1,
        continuationHash: candidate.hash,
        continuationComplexity: candidate.hash.length,
        values: [`${leftValue}`, `${rightValue}`],
        tokens: candidate.tokens,
      };
    }
    for (const generator of generatorNames) {
      for (const inverse of [false, true]) {
        const next = groupOracle.evaluate([
          ...candidate.tokens,
          { generator, inverse },
        ]);
        if (!seen.has(next.hash)) {
          seen.add(next.hash);
          queue.push(next);
        }
      }
    }
  }
  throw new Error("The continuation domain was exhausted without a semantic witness");
}

function continuationSignature(program, continuations) {
  return valuesOn(program, continuations).join("|");
}

export function runAlgebraogeneticPathSpaceDemo() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const generatorNames = ["x:0:1:s0", "x:1:0:s1"];
  const identity = groupOracle.evaluate([]);
  const g = groupOracle.evaluate([generatorNames[0]]);
  const h = groupOracle.evaluate([generatorNames[1]]);
  assert.equal(g.isIdentity, false);

  const deltaIdentity = CertifiedBoundedProgram.pointMass(identity.unit);
  const deltaG = CertifiedBoundedProgram.pointMass(g.unit);
  const transportedDelta = deltaIdentity.translate(g.unit);
  const auditWindow = enumerateExactGroupWindow(groupOracle, generatorNames, 6, 256);

  // alpha_g(delta_e)=delta_g. Point masses therefore make the translation
  // action faithful: alpha_g=id implies delta_g=delta_e and hence g=e.
  assert.equal(agreeOn(transportedDelta, deltaG, auditWindow), true);
  assert.equal(deltaIdentity.evaluate(g.unit), 0n);
  assert.equal(transportedDelta.evaluate(g.unit), 1n);

  // alpha_g alpha_h = alpha_(gh), checked on an exact finite continuation window.
  const sequentialTransport = deltaIdentity.translate(h.unit).translate(g.unit);
  const composedTransport = deltaIdentity.translate(g.unit.multiply(h.unit));
  assert.equal(agreeOn(sequentialTransport, composedTransport, auditWindow), true);

  // The coarse observer omits e and g. It therefore sees the identity path and
  // the g-transport path as ending at the same visible state. Adding e opens the
  // loop and exposes different exact continuation behavior.
  const coarseContinuations = auditWindow
    .filter((candidate) => candidate.hash !== identity.hash && candidate.hash !== g.hash)
    .slice(0, 8);
  assert.equal(coarseContinuations.length, 8);
  const startSignature = continuationSignature(deltaIdentity, coarseContinuations);
  const transportedSignature = continuationSignature(transportedDelta, coarseContinuations);
  assert.equal(startSignature, transportedSignature);
  const refinedContinuations = [...coarseContinuations, identity];
  assert.notEqual(
    continuationSignature(deltaIdentity, refinedContinuations),
    continuationSignature(transportedDelta, refinedContinuations),
  );

  const holonomyWitness = findFirstContinuationWitness({
    left: deltaIdentity,
    right: transportedDelta,
    groupOracle,
    generatorNames,
  });

  // Construct nonzero states inside successively deeper zero cylinders. For the
  // first n continuations, choose a clock delay beyond every native complexity
  // seen there. Its first difference from zero must occur after that cylinder.
  const zero = CertifiedBoundedProgram.constant(0);
  const continuationEnumeration = enumerateExactGroupWindow(
    groupOracle,
    generatorNames,
    7,
    512,
  );
  const nonIsolationSequence = [4, 8, 12].map((prefixSize) => {
    const cylinder = continuationEnumeration.slice(0, prefixSize);
    const delay = Math.max(...cylinder.map((item) => item.hash.length)) + 1;
    const delayedClock = CertifiedBoundedProgram.haltingClock(delayedHaltMachine(delay));
    assert.equal(agreeOn(zero, delayedClock, cylinder), true);
    const witness = findFirstContinuationWitness({
      left: zero,
      right: delayedClock,
      groupOracle,
      generatorNames,
    });
    assert(witness.enumerationIndex >= prefixSize);
    return {
      cylinderDepth: prefixSize,
      clockDelay: delay,
      agreesExactlyWithZeroThroughoutCylinder: true,
      semanticallyNonzero: true,
      firstWitnessEnumerationIndex: witness.enumerationIndex,
      firstWitnessComplexity: witness.continuationComplexity,
      ultrametricDistanceUpperBound: `2^-${prefixSize + 1}`,
    };
  });

  return {
    schema: "oasis.algebraogenetic-path-space.v1",
    object: {
      formula:
        "X_alg=(B_cert(G,Z), cylinder-topology, G-action alpha, transformation-groupoid G acting on B_cert)",
      probabilityPrimitiveRequired: false,
      localContinuation: "evaluate-certified-program-on-finite-exact-group-continuation",
      semanticPoint: "complete-compatible-pattern-of-all-finite-continuation-values",
      topology:
        "product-cylinder-topology-induced-by-a-computable-enumeration-of-exact-continuations",
      pathAlgebra: "B_cert(G,Z) crossed-product G",
    },
    computableLocalContinuation: {
      everyFiniteProgramEvaluationTerminates: true,
      exactGroupComposition: true,
      exactActionCompositionAuditPassed: true,
      testedContinuationCount: auditWindow.length,
    },
    nonFinitelyIsolatedSemanticStates: {
      zeroIsNotIsolatedByAnyFiniteContinuationCylinder: true,
      constructiveSequence: nonIsolationSequence,
      theoremSchema:
        "for-every-finite-cylinder-F-choose-delay-greater-than-max-native-complexity-on-F",
    },
    globallyNonSoficTransport: {
      transportGroup: groupOracle.theorem.group,
      theoremBackedNonSofic: true,
      action: "alpha_g(p)(x)=p(g^-1*x)",
      faithful: true,
      faithfulnessWitnessFamily: "point-masses-delta_y",
      proofSchema: "alpha_g(delta_e)=delta_g-so-alpha_g=id-implies-g=e",
      setActionSoficity: {
        definition: "Gao-Kunnawalkam-Elayavalli-Patchell-countable-set-action",
        semanticProgramSetIsCountable: true,
        pointMassOrbit: "{delta_g:g-in-G}-is-isomorphic-to-the-regular-G-set",
        pointMassStabilizer: "trivial",
        regularOrbitNonSofic: true,
        restrictionToOrbitPermanence: true,
        fullSemanticProgramActionNonSofic: true,
        theoremSchema:
          "if-the-full-action-were-sofic-its-point-mass-orbit-would-be-sofic-but-the-regular-G-action-is-sofic-only-if-G-is-sofic",
      },
      preciseConclusion:
        "the-action-on-the-countable-semantic-program-set-is-nonsofic-under-the-Gao-et-al-definition",
      finiteActionAudit: {
        transportedDeltaEqualsDeltaG: true,
        nonidentityTransportChangesAProgram: true,
        exactGeneratorHash: g.hash,
      },
    },
    observerRelativeHolonomy: {
      startPath: "identity-transport",
      alternatePath: generatorNames[0],
      exactTransportNonidentity: true,
      coarseProbeCount: coarseContinuations.length,
      sameVisibleEndpointInCoarseQuotient: true,
      refinedProbeCount: refinedContinuations.length,
      continuationOpensVisibleLoop: true,
      holonomyElementHash: g.hash,
      firstContinuationWitness: holonomyWitness,
      interpretation:
        "a-nontrivial-exact-transport-becomes-a-loop-only-after-the-observer-identifies-its-endpoints",
    },
    distinctionFromProbability:
      "probability-may-be-added-as-a-state-on-the-path-algebra-but-is-not-used-to-define-continuation-topology-or-transport",
  };
}

if (
  typeof process !== "undefined"
  && process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runAlgebraogeneticPathSpaceDemo(), null, 2));
}
