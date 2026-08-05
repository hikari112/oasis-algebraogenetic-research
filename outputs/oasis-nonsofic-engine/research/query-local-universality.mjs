import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { exactFiniteDistributionReadout } from "../src/finite-universal-readout.mjs";
import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import {
  CertifiedBoundedProgram,
  delayedHaltMachine,
} from "./presentation-transcendent-algebra.mjs";

function normalizeDistribution(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!(total > 0) || values.some((value) => !(Number.isFinite(value) && value > 0))) {
    throw new Error("Targets must be finite strictly positive distributions");
  }
  return values.map((value) => value / total);
}

function totalVariation(left, right) {
  return 0.5 * left.reduce((sum, value, index) => sum + Math.abs(value - right[index]), 0);
}

function signature(program, probes) {
  return probes.map((probe) => `${program.evaluate(probe.unit)}`).join("|");
}

export function enumerateExactGroupWindow(groupOracle, generatorNames, maxDepth, maxElements) {
  const identity = groupOracle.evaluate([]);
  const byHash = new Map([[identity.hash, identity]]);
  const queue = [identity];
  while (queue.length > 0 && byHash.size < maxElements) {
    const current = queue.shift();
    if (current.tokens.length >= maxDepth) continue;
    for (const generator of generatorNames) {
      for (const inverse of [false, true]) {
        const next = groupOracle.evaluate([
          ...current.tokens,
          { generator, inverse },
        ]);
        if (!byHash.has(next.hash)) {
          byHash.set(next.hash, next);
          queue.push(next);
          if (byHash.size >= maxElements) break;
        }
      }
      if (byHash.size >= maxElements) break;
    }
  }
  return [...byHash.values()];
}

function auditFibers(contexts, probes) {
  const fibers = new Map();
  for (const context of contexts) {
    const observationSignature = signature(context.program, probes);
    const fiber = fibers.get(observationSignature) ?? [];
    fiber.push(context);
    fibers.set(observationSignature, fiber);
  }

  let maximumWithinFiberDiameter = 0;
  const collisions = [];
  for (const [observationSignature, fiber] of fibers.entries()) {
    let diameter = 0;
    for (let left = 0; left < fiber.length; left += 1) {
      for (let right = left + 1; right < fiber.length; right += 1) {
        diameter = Math.max(
          diameter,
          totalVariation(fiber[left].target, fiber[right].target),
        );
      }
    }
    maximumWithinFiberDiameter = Math.max(maximumWithinFiberDiameter, diameter);
    if (diameter > 0) {
      collisions.push({
        observationSignature,
        contextIds: fiber.map((context) => context.id),
        targetDiameter: diameter,
      });
    }
  }

  return {
    probeCount: probes.length,
    fiberCount: fibers.size,
    exactReadoutCompatible: maximumWithinFiberDiameter === 0,
    maximumWithinFiberDiameter,
    minimaxTotalVariationLowerBound: maximumWithinFiberDiameter / 2,
    collisions,
  };
}

function findWitness({
  left,
  right,
  groupOracle,
  generatorNames,
}) {
  const identity = groupOracle.evaluate([]);
  const queue = [identity];
  const seen = new Set([identity.hash]);
  for (let inspectedIndex = 0; inspectedIndex < queue.length; inspectedIndex += 1) {
    const candidate = queue[inspectedIndex];
    const leftValue = left.evaluate(candidate.unit);
    const rightValue = right.evaluate(candidate.unit);
    if (leftValue !== rightValue) {
      return {
        ...candidate,
        leftValue,
        rightValue,
        inspectedCount: inspectedIndex + 1,
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
  throw new Error("Unreachable: a finitely generated group enumeration cannot exhaust its queue");
}

export function compileQueryLocalUniversalChart({
  contexts,
  initialProbes,
  groupOracle,
  generatorNames,
  labelPrefixes,
  epsilon = 1e-12,
}) {
  if (!(Number.isFinite(epsilon) && epsilon > 0)) {
    throw new Error("epsilon must be finite and positive");
  }
  const normalizedContexts = contexts.map((context) => ({
    ...context,
    target: normalizeDistribution(context.target),
  }));
  const probes = [...initialProbes];
  const probeHashes = new Set(probes.map((probe) => probe.hash));
  const witnessTrace = [];

  while (true) {
    const audit = auditFibers(normalizedContexts, probes);
    if (audit.exactReadoutCompatible) break;
    const collision = audit.collisions[0];
    const fiber = normalizedContexts.filter(
      (context) => collision.contextIds.includes(context.id)
        && signature(context.program, probes) === collision.observationSignature,
    );
    let separatingPair = null;
    for (let left = 0; left < fiber.length && !separatingPair; left += 1) {
      for (let right = left + 1; right < fiber.length; right += 1) {
        if (totalVariation(fiber[left].target, fiber[right].target) > 0) {
          separatingPair = [fiber[left], fiber[right]];
          break;
        }
      }
    }
    assert(separatingPair);
    const witness = findWitness({
      left: separatingPair[0].program,
      right: separatingPair[1].program,
      groupOracle,
      generatorNames,
    });
    if (!probeHashes.has(witness.hash)) {
      probes.push(witness);
      probeHashes.add(witness.hash);
    }
    witnessTrace.push({
      separatedContexts: separatingPair.map((context) => context.id),
      witnessHash: witness.hash,
      witnessComplexity: witness.hash.length,
      values: [`${witness.leftValue}`, `${witness.rightValue}`],
      inspectedCount: witness.inspectedCount,
    });
  }

  const charts = new Map();
  for (const context of normalizedContexts) {
    const observationSignature = signature(context.program, probes);
    if (!charts.has(observationSignature)) {
      charts.set(
        observationSignature,
        exactFiniteDistributionReadout(labelPrefixes, context.target),
      );
    }
  }
  const predictions = normalizedContexts.map((context) => {
    const observationSignature = signature(context.program, probes);
    const represented = charts.get(observationSignature).represented;
    return {
      contextId: context.id,
      observationSignature,
      target: context.target,
      represented,
      totalVariationError: totalVariation(context.target, represented),
    };
  });

  const maximumTotalVariationError = Math.max(
    ...predictions.map((prediction) => prediction.totalVariationError),
  );
  if (!(maximumTotalVariationError < epsilon)) {
    throw new Error("The compiled finite readout did not meet the requested epsilon");
  }

  return {
    schema: "oasis.query-local-presentation-universality.v1",
    theorem:
      "every finite semantically-consistent rational target task admits a finite target-separating observation set and an epsilon-accurate finite readout",
    promise:
      "different target distributions imply extensionally different native programs",
    initialAudit: auditFibers(normalizedContexts, initialProbes),
    finalAudit: auditFibers(normalizedContexts, probes),
    addedProbeCount: probes.length - initialProbes.length,
    witnessTrace,
    predictions,
    semanticLookupTableExact: true,
    requestedEpsilon: epsilon,
    maximumTotalVariationError,
    epsilonGuaranteePassed: true,
    globalFixedWindowUniversalityClaim: false,
  };
}

export function runQueryLocalUniversalityDemo() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const generatorNames = ["x:0:1:s0", "x:1:0:s1"];
  const window = enumerateExactGroupWindow(groupOracle, generatorNames, 6, 256)
    .sort((left, right) => left.hash.length - right.hash.length);
  const shallowProbes = window.slice(0, 8);
  const shallowMaximumBudget = Math.max(...shallowProbes.map((probe) => probe.hash.length));
  const deeperBudgets = [...new Set(
    window.map((probe) => probe.hash.length).filter((value) => value > shallowMaximumBudget),
  )].sort((left, right) => left - right);
  assert(deeperBudgets.length >= 2);
  const firstDelay = deeperBudgets[0];
  const secondDelay = deeperBudgets.at(-1);
  assert(secondDelay > firstDelay);

  const contexts = [
    {
      id: "semantic-zero",
      program: CertifiedBoundedProgram.constant(0),
      target: [0.9, 0.1],
    },
    {
      id: `clock-${firstDelay}`,
      program: CertifiedBoundedProgram.haltingClock(delayedHaltMachine(firstDelay)),
      target: [0.1, 0.9],
    },
    {
      id: `clock-${secondDelay}`,
      program: CertifiedBoundedProgram.haltingClock(delayedHaltMachine(secondDelay)),
      target: [0.3, 0.7],
    },
  ];

  const result = compileQueryLocalUniversalChart({
    contexts,
    initialProbes: shallowProbes,
    groupOracle,
    generatorNames,
    labelPrefixes: ["000", "001"],
    epsilon: 1e-12,
  });
  assert.equal(result.initialAudit.exactReadoutCompatible, false);
  assert(result.initialAudit.minimaxTotalVariationLowerBound > 0);
  assert.equal(result.finalAudit.exactReadoutCompatible, true);
  assert(result.addedProbeCount > 0);
  assert(result.maximumTotalVariationError < 1e-14);

  return {
    ...result,
    finiteTask: {
      contextCount: contexts.length,
      outcomeCount: 2,
      shallowProbeCount: shallowProbes.length,
      shallowMaximumBudget,
      clockDelays: [firstDelay, secondDelay],
    },
    constructiveMeaning:
      "the compiler never decides global semantic equality; it searches only for witnesses demanded by target-conflicting finite fibers",
  };
}

if (
  typeof process !== "undefined"
  && process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runQueryLocalUniversalityDemo(), null, 2));
}
