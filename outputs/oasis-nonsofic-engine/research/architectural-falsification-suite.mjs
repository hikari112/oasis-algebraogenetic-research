import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import { CertifiedBoundedProgram } from "./presentation-transcendent-algebra.mjs";
import { enumerateExactGroupWindow } from "./query-local-universality.mjs";
import { runBoundedFeatureSeparation } from "./bounded-feature-separation.mjs";

function stableKey(value) {
  return JSON.stringify(value, (_key, item) => (
    typeof item === "bigint" ? `${item}n` : item
  ));
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledSample(values, count, random) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy.slice(0, count);
}

function makePointMassState(support) {
  return Object.freeze({
    support,
    valueAt: (address) => (address === support ? 1 : 0),
  });
}

const ZERO_STATE = Object.freeze({
  support: null,
  valueAt: () => 0,
});

function runExtensionalProgram(program, state, {
  context = undefined,
  allowAggregatePrimitive = false,
  allowSamplePrimitive = false,
} = {}) {
  const queriedAddresses = [];
  let aggregateCalls = 0;
  let sampleCalls = 0;
  const api = Object.freeze({
    context,
    query(address) {
      queriedAddresses.push(address);
      return state.valueAt(address);
    },
    aggregate(addresses, reducer, initialValue) {
      if (!allowAggregatePrimitive) {
        throw new Error("Aggregate primitive is outside the bounded-query feature class");
      }
      aggregateCalls += 1;
      let accumulator = initialValue;
      for (const address of addresses) {
        queriedAddresses.push(address);
        accumulator = reducer(accumulator, state.valueAt(address), address);
      }
      return accumulator;
    },
    sample() {
      if (!allowSamplePrimitive) {
        throw new Error("Sampling is outside the semantic point-evaluation feature class");
      }
      sampleCalls += 1;
      return state.support;
    },
  });
  const output = program(api);
  return {
    output,
    semanticEvaluationCount: queriedAddresses.length,
    aggregateCallCount: aggregateCalls,
    sampleCallCount: sampleCalls,
    queriedAddresses,
  };
}

function bayesClassificationError(rows) {
  const fibers = new Map();
  for (const row of rows) {
    const key = stableKey(row.output);
    const counts = fibers.get(key) ?? [0, 0];
    counts[row.label] += 1;
    fibers.set(key, counts);
  }
  const mistakes = [...fibers.values()].reduce(
    (sum, counts) => sum + Math.min(counts[0], counts[1]),
    0,
  );
  return {
    error: mistakes / rows.length,
    fiberCount: fibers.size,
  };
}

function cyclicDataset(pairCount, commonContinuation = 17) {
  return Array.from({ length: pairCount }, (_unused, index) => {
    const reference = commonContinuation + 3 * index;
    const alternate = reference + 1;
    return {
      pairIndex: index,
      context: reference,
      reference,
      alternate,
      referenceState: makePointMassState(reference),
      alternateState: makePointMassState(alternate),
    };
  });
}

function rowsForProgram(dataset, program, optionsForExample = () => ({})) {
  const rows = [];
  for (const pair of dataset) {
    for (const [branch, state, label] of [
      ["reference", pair.referenceState, 0],
      ["alternate", pair.alternateState, 1],
    ]) {
      const run = runExtensionalProgram(
        program,
        state,
        optionsForExample(pair, branch),
      );
      rows.push({ pairIndex: pair.pairIndex, branch, label, ...run });
    }
  }
  return rows;
}

function runSoficAndContextParityControls(pairCount = 64) {
  const dataset = cyclicDataset(pairCount);
  const referenceAddresses = dataset.map((pair) => pair.reference);
  const scalarGlobalSum = ({ query }) => referenceAddresses.reduce(
    (sum, address) => sum + query(address),
    0,
  );
  const transportedAtlas = ({ query, context }) => query(context);
  const contextAwareOrdinaryBaseline = ({ query, context }) => query(context);

  const globalRows = rowsForProgram(dataset, scalarGlobalSum);
  const atlasRows = rowsForProgram(
    dataset,
    transportedAtlas,
    (pair) => ({ context: pair.context }),
  );
  const parityRows = rowsForProgram(
    dataset,
    contextAwareOrdinaryBaseline,
    (pair) => ({ context: pair.context }),
  );
  const globalError = bayesClassificationError(globalRows);
  const atlasError = bayesClassificationError(atlasRows);
  const parityError = bayesClassificationError(parityRows);
  assert.equal(globalError.error, 0);
  assert.equal(atlasError.error, 0);
  assert.equal(parityError.error, 0);
  assert(globalRows.every((row) => row.semanticEvaluationCount === pairCount));
  assert(atlasRows.every((row) => row.semanticEvaluationCount === 1));
  assert(parityRows.every((row) => row.semanticEvaluationCount === 1));

  const continuationShifts = [-101, -7, 0, 13, 211];
  for (const shift of continuationShifts) {
    for (const pair of dataset) {
      for (const state of [pair.referenceState, pair.alternateState]) {
        const before = runExtensionalProgram(
          transportedAtlas,
          state,
          { context: pair.context },
        ).output;
        const shiftedState = makePointMassState(state.support + shift);
        const after = runExtensionalProgram(
          transportedAtlas,
          shiftedState,
          { context: pair.context + shift },
        ).output;
        assert.equal(after, before);
      }
    }
  }

  return {
    controlGroup: "Z-additive-sofic",
    pairCount,
    scalarGlobalFeature: {
      outputDimension: 1,
      semanticEvaluationsPerExample: pairCount,
      classificationError: globalError.error,
      falsifiesGeneralCoordinateDimensionLowerBound: true,
    },
    transportedAtlas: {
      outputDimension: 1,
      semanticEvaluationsPerExample: 1,
      classificationError: atlasError.error,
    },
    contextAwareOrdinaryBaseline: {
      outputDimension: 1,
      semanticEvaluationsPerExample: 1,
      classificationError: parityError.error,
      matchesAtlasExactly: true,
    },
    exactContinuationShiftCount: continuationShifts.length,
    localSeparationDoesNotRequireNonSoficity: true,
  };
}

function runCostModelBreakers(pairCount = 64) {
  const dataset = cyclicDataset(pairCount);
  const referenceAddresses = dataset.map((pair) => pair.reference);
  const aggregateProgram = ({ aggregate }) => aggregate(
    referenceAddresses,
    (sum, value) => sum + value,
    0,
  );
  const aggregateRows = rowsForProgram(
    dataset,
    aggregateProgram,
    () => ({ allowAggregatePrimitive: true }),
  );
  const aggregateError = bayesClassificationError(aggregateRows);
  assert.equal(aggregateError.error, 0);
  assert(aggregateRows.every((row) => row.aggregateCallCount === 1));
  assert(aggregateRows.every((row) => row.semanticEvaluationCount === pairCount));

  // This deliberately violates extensional encapsulation by reading the raw
  // representative's support field. It is a negative control, not an allowed
  // feature in the theorem class.
  const intensionalCheatRows = [];
  const referenceSet = new Set(referenceAddresses);
  for (const pair of dataset) {
    intensionalCheatRows.push(
      { label: 0, output: referenceSet.has(pair.referenceState.support) ? 1 : 0 },
      { label: 1, output: referenceSet.has(pair.alternateState.support) ? 1 : 0 },
    );
  }
  const intensionalCheatError = bayesClassificationError(intensionalCheatRows);
  assert.equal(intensionalCheatError.error, 0);

  // A distribution-sampling interface is extensional but strictly stronger
  // than point evaluation on this point-mass family. One sample reveals the
  // support, so the point-query theorem must not be advertised as covering it.
  const oneSampleClassifier = ({ sample }) => (referenceSet.has(sample()) ? 1 : 0);
  const oneSampleRows = rowsForProgram(
    dataset,
    oneSampleClassifier,
    () => ({ allowSamplePrimitive: true }),
  );
  const oneSampleError = bayesClassificationError(oneSampleRows);
  assert.equal(oneSampleError.error, 0);
  assert(oneSampleRows.every((row) => row.sampleCallCount === 1));
  assert(oneSampleRows.every((row) => row.semanticEvaluationCount === 0));

  // One exact scalar can encode every support if infinite precision and a
  // discontinuous lookup decoder are free. The minimum separation decays
  // exponentially, exposing the hidden precision cost.
  const orderedSupports = dataset.flatMap((pair) => [pair.reference, pair.alternate]);
  const exactScalarCodes = new Map(orderedSupports.map((support, index) => (
    [support, index / (orderedSupports.length - 1)]
  )));
  const scalarCodeRows = [];
  for (const pair of dataset) {
    scalarCodeRows.push(
      { label: 0, output: exactScalarCodes.get(pair.reference) },
      { label: 1, output: exactScalarCodes.get(pair.alternate) },
    );
  }
  const scalarCodeError = bayesClassificationError(scalarCodeRows);
  assert.equal(scalarCodeError.error, 0);
  const sortedCodes = [...exactScalarCodes.values()].sort((left, right) => left - right);
  const minimumCodeMargin = Math.min(...sortedCodes.slice(1).map(
    (value, index) => value - sortedCodes[index],
  ));
  assert(minimumCodeMargin > 0);

  return {
    unitCostAggregatePrimitive: {
      classificationError: aggregateError.error,
      chargedAggregateCalls: 1,
      hiddenSemanticEvaluations: pairCount,
      breaksQueryLowerBoundIfTreatedAsOneSemanticOperation: true,
    },
    rawRepresentativeInspection: {
      classificationError: intensionalCheatError.error,
      semanticEvaluations: 0,
      breaksTheoremOutsideExtensionalAccessModel: true,
    },
    distributionSamplingInterface: {
      classificationError: oneSampleError.error,
      sampleCallsPerExample: 1,
      pointEvaluationsPerExample: 0,
      breaksAnyClaimBeyondThePointEvaluationOracleModel: true,
    },
    unlimitedPrecisionScalar: {
      outputDimension: 1,
      encodedStateCount: orderedSupports.length,
      classificationError: scalarCodeError.error,
      minimumPairwiseCodeMarginOnChosenUniformGrid: minimumCodeMargin,
      gridIndexBits: Math.ceil(Math.log2(orderedSupports.length)),
      notAUniversalPrecisionLowerBound: true,
      binaryTaskNeedsOnlyTwoCodesOnceSupportMembershipIsAvailable: true,
      falsifiesDimensionOnlyClaims: true,
    },
  };
}

function runContextCorruptionControl(pairCount = 64) {
  const dataset = cyclicDataset(pairCount);
  const transportedAtlas = ({ query, context }) => query(context);
  const corruptionRates = [0, 0.0625, 0.125, 0.25, 0.5, 1];
  const results = [];
  for (const rate of corruptionRates) {
    const corruptedPairCount = Math.round(rate * pairCount);
    const rows = rowsForProgram(dataset, transportedAtlas, (pair) => ({
      context: pair.pairIndex < corruptedPairCount
        ? dataset[(pair.pairIndex + 1) % pairCount].context
        : pair.context,
    }));
    const classification = bayesClassificationError(rows);
    const meanTargetError = rows.reduce((sum, row) => {
      const target = row.label === 0 ? 0.1 : 0.9;
      const prediction = row.output === 1 ? 0.1 : 0.9;
      return sum + Math.abs(target - prediction) / rows.length;
    }, 0);
    assert(Math.abs(classification.error - corruptedPairCount / (2 * pairCount)) < 1e-12);
    assert(Math.abs(meanTargetError - 0.8 * corruptedPairCount / (2 * pairCount)) < 1e-12);
    results.push({
      requestedCorruptionRate: rate,
      realizedCorruptedContextCount: corruptedPairCount,
      classificationError: classification.error,
      meanTotalVariationError: meanTargetError,
    });
  }
  return {
    pairCount,
    results,
    conclusion:
      "for-this-specific-next-pair-substitution-model-the-one-query-coordinate-degrades-linearly-with-corrupted-provenance",
  };
}

function runRandomizedBudgetSweep(pairCount = 64, seedsPerBudget = 100) {
  const dataset = cyclicDataset(pairCount);
  const referenceAddresses = dataset.map((pair) => pair.reference);
  const budgets = [0, 1, 2, 4, 8, 16, 32, 48, 63, 64];
  const results = [];
  for (const budget of budgets) {
    let maximumDeviation = 0;
    for (let seed = 0; seed < seedsPerBudget; seed += 1) {
      const random = mulberry32(1009 * (budget + 1) + seed);
      const queried = shuffledSample(referenceAddresses, budget, random);
      const program = ({ query }) => queried.reduce(
        (sum, address) => sum + query(address),
        0,
      );
      const rows = rowsForProgram(dataset, program);
      const observedError = bayesClassificationError(rows).error;
      const theoremFloor = (pairCount - budget) / (2 * pairCount);
      maximumDeviation = Math.max(maximumDeviation, Math.abs(observedError - theoremFloor));
    }
    assert(maximumDeviation < 1e-12);
    results.push({
      budget,
      seedCount: seedsPerBudget,
      attainingFamilyObservedBayesError: (pairCount - budget) / (2 * pairCount),
      theoremLowerBound: (pairCount - budget) / (2 * pairCount),
      maximumDeviation,
    });
  }
  return { pairCount, results };
}

function runExhaustiveFinitePolicyControl() {
  const addressCount = 7;
  const supports = [0, 1, 2, 3, 4, 5];
  const labels = [0, 1, 0, 1, 0, 1];
  const traceForSupport = (digits, depth, support) => {
    let nodeIndex = 0;
    const transcript = [];
    for (let step = 0; step < depth; step += 1) {
      const address = digits[nodeIndex];
      const value = address === support ? 1 : 0;
      transcript.push(`${address}:${value}`);
      nodeIndex = 2 * nodeIndex + 1 + value;
    }
    return transcript.join("|");
  };
  const results = [];
  for (let depth = 0; depth <= 3; depth += 1) {
    const decisionNodeCount = 2 ** depth - 1;
    const policyCount = addressCount ** decisionNodeCount;
    let maximumDistinguishedPairCount = 0;
    let minimumBayesError = 1;
    for (let policyCode = 0; policyCode < policyCount; policyCode += 1) {
      let remainder = policyCode;
      const digits = Array(decisionNodeCount).fill(0);
      for (let nodeIndex = 0; nodeIndex < decisionNodeCount; nodeIndex += 1) {
        digits[nodeIndex] = remainder % addressCount;
        remainder = Math.floor(remainder / addressCount);
      }
      const outputs = supports.map((support) => traceForSupport(digits, depth, support));
      let distinguishedPairCount = 0;
      for (let pairIndex = 0; pairIndex < 3; pairIndex += 1) {
        if (outputs[2 * pairIndex] !== outputs[2 * pairIndex + 1]) {
          distinguishedPairCount += 1;
        }
      }
      maximumDistinguishedPairCount = Math.max(
        maximumDistinguishedPairCount,
        distinguishedPairCount,
      );
      const rows = outputs.map((output, index) => ({ output, label: labels[index] }));
      minimumBayesError = Math.min(
        minimumBayesError,
        bayesClassificationError(rows).error,
      );
    }
    const expectedMaximum = Math.min(depth, 3);
    const expectedMinimumError = (3 - expectedMaximum) / 6;
    assert.equal(maximumDistinguishedPairCount, expectedMaximum);
    assert(Math.abs(minimumBayesError - expectedMinimumError) < 1e-12);
    results.push({
      hardQueryBudget: depth,
      exhaustivelyEnumeratedPolicyCount: policyCount,
      maximumDistinguishedPairCount,
      minimumBayesError,
      theoremFloor: expectedMinimumError,
    });
  }
  return {
    finiteControlGroup: "Z/7Z",
    disjointResidualPairCount: 3,
    totalExhaustivelyEnumeratedPolicies: results.reduce(
      (sum, result) => sum + result.exhaustivelyEnumeratedPolicyCount,
      0,
    ),
    results,
    noPolicyViolationFound: true,
  };
}

function runAdaptiveObserver(observer, state) {
  const transcript = [];
  for (let step = 0; step < observer.budget; step += 1) {
    const address = observer.nextAddress(step, transcript.map((entry) => ({ ...entry })));
    const value = state.valueAt(address);
    transcript.push({ address, value });
  }
  return {
    transcript,
    output: observer.readout(transcript.map((entry) => ({ ...entry }))),
  };
}

function runAdaptivePropertyStress({
  pairCount = 64,
  specimenCount = 1000,
  maximumBudget = 32,
} = {}) {
  const dataset = cyclicDataset(pairCount);
  const universe = [
    ...dataset.flatMap((pair) => [pair.reference, pair.alternate]),
    ...Array.from({ length: 64 }, (_unused, index) => 10000 + index),
  ];
  let largestCoveredPairCount = 0;
  let largestActuallyDistinguishedPairCount = 0;
  for (let specimen = 0; specimen < specimenCount; specimen += 1) {
    const random = mulberry32(7919 + specimen * 104729);
    const budget = specimen % (maximumBudget + 1);
    const zeroSchedule = Array.from({ length: budget }, () => (
      universe[Math.floor(random() * universe.length)]
    ));
    const branchSchedule = Array.from({ length: budget }, () => (
      universe[Math.floor(random() * universe.length)]
    ));
    const observer = {
      budget,
      nextAddress(step, transcript) {
        const hasHit = transcript.some((entry) => entry.value === 1);
        return (hasHit ? branchSchedule : zeroSchedule)[step];
      },
      readout(transcript) {
        const weighted = transcript.reduce(
          (sum, entry, index) => sum + (index + 1) * entry.value,
          0,
        );
        return {
          nonlinear: weighted ** 3 + 3 * weighted ** 2 - 11 * weighted,
          trace: transcript.map((entry) => `${entry.address}:${entry.value}`).join("|"),
        };
      },
    };
    const zeroRun = runAdaptiveObserver(observer, ZERO_STATE);
    const zeroAddresses = new Set(zeroRun.transcript.map((entry) => entry.address));
    const coveredPairs = dataset.filter((pair) => (
      zeroAddresses.has(pair.reference) || zeroAddresses.has(pair.alternate)
    ));
    assert(coveredPairs.length <= zeroAddresses.size);
    assert(zeroAddresses.size <= budget);
    let actuallyDistinguishedPairCount = 0;
    for (const pair of dataset) {
      const referenceRun = runAdaptiveObserver(observer, pair.referenceState);
      const alternateRun = runAdaptiveObserver(observer, pair.alternateState);
      const differs = stableKey(referenceRun.output) !== stableKey(alternateRun.output);
      if (differs) actuallyDistinguishedPairCount += 1;
      if (!zeroAddresses.has(pair.reference) && !zeroAddresses.has(pair.alternate)) {
        assert.deepEqual(referenceRun, zeroRun);
        assert.deepEqual(alternateRun, zeroRun);
      }
    }
    assert(actuallyDistinguishedPairCount <= coveredPairs.length);
    largestCoveredPairCount = Math.max(largestCoveredPairCount, coveredPairs.length);
    largestActuallyDistinguishedPairCount = Math.max(
      largestActuallyDistinguishedPairCount,
      actuallyDistinguishedPairCount,
    );
  }
  return {
    pairCount,
    specimenCount,
    maximumBudget,
    largestCoveredPairCount,
    largestActuallyDistinguishedPairCount,
    allZeroTranscriptCertificatesPassed: true,
  };
}

function runBackgroundDifferenceStress({
  pairCount = 48,
  specimenCount = 500,
  maximumBudget = 24,
} = {}) {
  const backgroundValue = (address) => ((address * 17 + 11) % 13) - 6;
  const backgroundState = Object.freeze({ valueAt: backgroundValue });
  const dataset = Array.from({ length: pairCount }, (_unused, index) => {
    const reference = 5 * index + 1;
    const alternate = reference + 2;
    return {
      reference,
      alternate,
      referenceState: Object.freeze({
        valueAt: (address) => backgroundValue(address) + (address === reference ? 3 : 0),
      }),
      alternateState: Object.freeze({
        valueAt: (address) => backgroundValue(address) + (address === alternate ? 3 : 0),
      }),
    };
  });
  const universe = [
    ...dataset.flatMap((pair) => [pair.reference, pair.alternate]),
    ...Array.from({ length: 48 }, (_unused, index) => 1000 + index),
  ];

  let maximumCoveredPairCount = 0;
  for (let specimen = 0; specimen < specimenCount; specimen += 1) {
    const random = mulberry32(65537 + specimen * 8191);
    const budget = specimen % (maximumBudget + 1);
    const baseSchedule = Array.from({ length: budget }, () => (
      universe[Math.floor(random() * universe.length)]
    ));
    const deviationSchedule = Array.from({ length: budget }, () => (
      universe[Math.floor(random() * universe.length)]
    ));
    const observer = {
      budget,
      nextAddress(step, transcript) {
        const sawDeviation = transcript.some((entry) => (
          entry.value !== backgroundValue(entry.address)
        ));
        return (sawDeviation ? deviationSchedule : baseSchedule)[step];
      },
      readout(transcript) {
        const residuals = transcript.map((entry) => (
          entry.value - backgroundValue(entry.address)
        ));
        return {
          nonlinearResidual: residuals.reduce(
            (sum, value, index) => sum + (index + 3) * value ** 3,
            0,
          ),
          trace: transcript.map((entry) => `${entry.address}:${entry.value}`).join("|"),
        };
      },
    };
    const baseRun = runAdaptiveObserver(observer, backgroundState);
    const baseAddresses = new Set(baseRun.transcript.map((entry) => entry.address));
    const coveredPairs = dataset.filter((pair) => (
      baseAddresses.has(pair.reference) || baseAddresses.has(pair.alternate)
    ));
    assert(coveredPairs.length <= baseAddresses.size);
    assert(baseAddresses.size <= budget);
    for (const pair of dataset) {
      if (baseAddresses.has(pair.reference) || baseAddresses.has(pair.alternate)) continue;
      assert.deepEqual(runAdaptiveObserver(observer, pair.referenceState), baseRun);
      assert.deepEqual(runAdaptiveObserver(observer, pair.alternateState), baseRun);
    }
    maximumCoveredPairCount = Math.max(maximumCoveredPairCount, coveredPairs.length);
  }

  return {
    pairCount,
    specimenCount,
    maximumBudget,
    maximumCoveredPairCount,
    allCommonBackgroundTranscriptCertificatesPassed: true,
    conclusion:
      "the-adaptive-transcript-obstruction-is-not-specific-to-zero-background-or-bare-point-mass-values",
  };
}

function minimumTransversalSize(universeSize, edges) {
  assert(universeSize < 31, "Bit-mask transversal audit requires fewer than 31 coordinates");
  for (let size = 0; size <= universeSize; size += 1) {
    const search = (start, remaining, mask) => {
      if (remaining === 0) {
        return edges.every((edge) => edge.some((coordinate) => (
          (mask & (1 << coordinate)) !== 0
        ))) ? mask : null;
      }
      for (let coordinate = start; coordinate <= universeSize - remaining; coordinate += 1) {
        const found = search(coordinate + 1, remaining - 1, mask | (1 << coordinate));
        if (found !== null) return found;
      }
      return null;
    };
    const witness = search(0, size, 0);
    if (witness !== null) return { size, witness };
  }
  throw new Error("Finite hypergraph unexpectedly had no transversal");
}

function runHypergraphTransversalStress({
  universeSize = 10,
  graphCount = 300,
} = {}) {
  const random = mulberry32(0x0a51a5);
  let minimumObserved = universeSize;
  let maximumObserved = 0;
  let overlappingGraphCount = 0;
  for (let graphIndex = 0; graphIndex < graphCount; graphIndex += 1) {
    const edgeCount = 1 + Math.floor(random() * 12);
    const edges = [];
    for (let edgeIndex = 0; edgeIndex < edgeCount; edgeIndex += 1) {
      const width = 1 + Math.floor(random() * 4);
      const edge = [...new Set(Array.from({ length: width }, () => (
        Math.floor(random() * universeSize)
      )))];
      edges.push(edge);
    }
    const degrees = Array(universeSize).fill(0);
    for (const edge of edges) for (const coordinate of edge) degrees[coordinate] += 1;
    if (degrees.some((degree) => degree > 1)) overlappingGraphCount += 1;

    const exact = minimumTransversalSize(universeSize, edges);
    const allMasks = 1 << universeSize;
    let bruteForceMinimum = universeSize + 1;
    for (let mask = 0; mask < allMasks; mask += 1) {
      const hitsAll = edges.every((edge) => edge.some((coordinate) => (
        (mask & (1 << coordinate)) !== 0
      )));
      if (hitsAll) {
        const size = mask.toString(2).split("1").length - 1;
        bruteForceMinimum = Math.min(bruteForceMinimum, size);
      }
    }
    assert.equal(exact.size, bruteForceMinimum);

    // Realize the set system as semantic conflicts between the all-zero state
    // and each edge indicator. The returned hitting set must distinguish every
    // conflict through its retained coordinate transcript.
    const selectedCoordinates = Array.from({ length: universeSize }, (_unused, coordinate) => (
      coordinate
    )).filter((coordinate) => (exact.witness & (1 << coordinate)) !== 0);
    for (const edge of edges) {
      const zeroTranscript = selectedCoordinates.map(() => 0);
      const edgeTranscript = selectedCoordinates.map((coordinate) => (
        edge.includes(coordinate) ? 1 : 0
      ));
      assert.notDeepEqual(edgeTranscript, zeroTranscript);
    }
    minimumObserved = Math.min(minimumObserved, exact.size);
    maximumObserved = Math.max(maximumObserved, exact.size);
  }

  const disjointEdges = Array.from({ length: 5 }, (_unused, index) => [2 * index, 2 * index + 1]);
  assert.equal(minimumTransversalSize(10, disjointEdges).size, 5);

  return {
    universeSize,
    randomHypergraphCount: graphCount,
    overlappingGraphCount,
    minimumObservedTransversal: minimumObserved,
    maximumObservedTransversal: maximumObserved,
    disjointFiveEdgeTransversal: 5,
    conclusion:
      "for-fixed-nonadaptive-coordinate-support-with-full-transcripts-the-correct-support-complexity-is-the-obstruction-hypergraph-transversal-number-not-the-raw-pair-count-when-difference-supports-overlap",
    doesNotCharacterizeGeneralAdaptiveQueryComplexity: true,
  };
}

function runInfluenceAndRescalingControl(pairCount = 64) {
  const coefficientScales = [1e-12, 1e-6, 1e-3, 1, 1e3, 1e6, 1e12];
  const results = coefficientScales.map((scale) => {
    const totalAbsoluteInfluence = pairCount * Math.abs(scale);
    const decoderLipschitz = 0.8 / Math.abs(scale);
    const product = totalAbsoluteInfluence * decoderLipschitz;
    const required = 0.8 * pairCount;
    assert(Math.abs(product / required - 1) < 1e-12);
    return {
      featureScale: scale,
      totalAbsoluteInfluence,
      decoderLipschitz,
      influenceLipschitzProduct: product,
      lowerBoundRightHandSideAtZeroError: required,
    };
  });
  return {
    pairCount,
    explicitFeatureFamily: "f_c(p)=c*sum_i p(t_i)",
    explicitDecoderFamily: "R_c(z)=0.9-(0.8/c)*z",
    targetGap: 0.8,
    results,
    rescalingCannotEvadeInfluenceTimesDecoderSensitivityCost: true,
    arithmeticIdentityOnlyNotAGeneralDenseFeatureTest: true,
    scope: "exact-rescaling-sanity-check-for-the-explicit-global-sum-family",
  };
}

function selectExactDisjointPairs(candidates, residualUnit, requestedCount) {
  const occupied = new Set();
  const pairs = [];
  for (const candidate of candidates) {
    const alternateUnit = candidate.unit.multiply(residualUnit);
    const referenceHash = candidate.hash;
    const alternateHash = alternateUnit.hash();
    if (referenceHash === alternateHash) continue;
    if (occupied.has(referenceHash) || occupied.has(alternateHash)) continue;
    occupied.add(referenceHash);
    occupied.add(alternateHash);
    pairs.push({
      referenceUnit: candidate.unit,
      alternateUnit,
      referenceHash,
      alternateHash,
    });
    if (pairs.length === requestedCount) break;
  }
  return pairs;
}

function runExactGroupStress({ pairCount = 32 } = {}) {
  const groupOracle = new ExactNonSoficGroupOracle();
  const generatorNames = [
    "x:0:1:s0",
    "x:1:0:s1",
    "x:2:3:s0",
    "x:3:2:s1",
  ];
  const identity = groupOracle.evaluate([]);
  const candidates = enumerateExactGroupWindow(groupOracle, generatorNames, 6, 16384);
  const residualWords = [
    [generatorNames[0]],
    [generatorNames[1]],
    [generatorNames[0], generatorNames[1]],
    [generatorNames[2], generatorNames[0], generatorNames[3]],
    [generatorNames[3], generatorNames[1], generatorNames[2], generatorNames[0]],
  ];
  const continuationWords = [
    [],
    [generatorNames[2]],
    [generatorNames[3], generatorNames[0]],
    [generatorNames[1], generatorNames[2], generatorNames[3]],
    [generatorNames[0], generatorNames[1], generatorNames[2], generatorNames[3]],
  ];
  const deltaIdentity = CertifiedBoundedProgram.pointMass(identity.unit);
  let checkedPairContinuationCases = 0;
  const residualResults = [];
  for (const residualWord of residualWords) {
    const residual = groupOracle.evaluate(residualWord);
    assert.notEqual(residual.hash, identity.hash);
    const pairs = selectExactDisjointPairs(candidates, residual.unit, pairCount);
    assert.equal(pairs.length, pairCount);
    for (const continuationWord of continuationWords) {
      const continuation = groupOracle.evaluate(continuationWord);
      const continuedHashes = new Set();
      for (const pair of pairs) {
        const continuedReference = continuation.unit.multiply(pair.referenceUnit);
        const continuedAlternate = continuation.unit.multiply(pair.alternateUnit);
        continuedHashes.add(continuedReference.hash());
        continuedHashes.add(continuedAlternate.hash());
        assert.equal(
          continuedReference.inverse().multiply(continuedAlternate).equals(residual.unit),
          true,
        );
        const referenceState = deltaIdentity.translate(continuedReference);
        const alternateState = deltaIdentity.translate(continuedAlternate);
        assert.equal(Number(referenceState.evaluate(continuedReference)), 1);
        assert.equal(Number(alternateState.evaluate(continuedReference)), 0);
        const uncontinuedReferenceState = deltaIdentity.translate(pair.referenceUnit);
        const uncontinuedAlternateState = deltaIdentity.translate(pair.alternateUnit);
        assert.equal(
          Number(referenceState.evaluate(continuedReference)),
          Number(uncontinuedReferenceState.evaluate(pair.referenceUnit)),
        );
        assert.equal(
          Number(alternateState.evaluate(continuedReference)),
          Number(uncontinuedAlternateState.evaluate(pair.referenceUnit)),
        );
        checkedPairContinuationCases += 1;
      }
      assert.equal(continuedHashes.size, 2 * pairCount);
    }
    residualResults.push({
      residualHash: residual.hash,
      disjointPairCount: pairs.length,
      continuationCount: continuationWords.length,
    });
  }
  return {
    exactGroup: groupOracle.theorem.group,
    candidateCount: candidates.length,
    residualCount: residualWords.length,
    continuationCount: continuationWords.length,
    pairCountPerResidual: pairCount,
    checkedPairContinuationCases,
    residualResults,
    exactContextualChecksUseTheContinuedEndpoints: true,
    noAbsoluteGlobalObserverIsRunInsideThisStressFunction: true,
  };
}

function runHandSpecifiedNormalizationControl(pairCount = 64) {
  const dataset = cyclicDataset(pairCount);
  const absoluteQueries = new Set();
  let absoluteAttachmentCount = 0;
  while (true) {
    const unresolved = dataset.find((pair) => (
      !absoluteQueries.has(pair.reference) && !absoluteQueries.has(pair.alternate)
    ));
    if (!unresolved) break;
    // The exact conflicting-pair certificate contributes one address from its
    // difference support.
    absoluteQueries.add(unresolved.reference);
    absoluteAttachmentCount += 1;
  }
  assert.equal(absoluteAttachmentCount, pairCount);

  const firstObstruction = dataset[0];
  // This template is hand specified from the known orbit geometry. No code
  // below derives it from firstObstruction; that synthesis remains open.
  const compiledRelativeTemplate = ({ query, context }) => query(context);
  const atlasRows = rowsForProgram(
    dataset,
    compiledRelativeTemplate,
    (pair) => ({ context: pair.context }),
  );
  assert.equal(bayesClassificationError(atlasRows).error, 0);
  assert(atlasRows.every((row) => row.semanticEvaluationCount === 1));

  const baselineRows = rowsForProgram(
    dataset,
    compiledRelativeTemplate,
    (pair) => ({ context: pair.context }),
  );
  assert.equal(bayesClassificationError(baselineRows).error, 0);

  return {
    pairCount,
    absoluteCollisionCertificatesConsumed: absoluteAttachmentCount,
    handSpecifiedRelativeTemplateCount: 1,
    certificateToTemplateSynthesisTested: false,
    prototypeCertificate: {
      reference: firstObstruction.reference,
      alternate: firstObstruction.alternate,
    },
    allHeldOutTranslatedConflictsResolvedByHandSpecifiedTemplate: true,
    ordinaryContextAwareBaselineAlsoResolvedAllConflicts: true,
    scope:
      "tests-a-hand-specified-normalization-template-not-certificate-to-template-generation-or-autonomous-discovery-of-the-normalization-law",
  };
}

function compileAdditiveChartFromCertificate(certificate) {
  if (!certificate || certificate.witnessAddress === undefined) {
    throw new Error("A witness-bearing obstruction certificate is required");
  }
  const {
    frameContext,
    referenceEndpointPath,
    alternateEndpointPath,
    witnessAddress,
    claimedResidual,
    declaredReferenceValue,
    declaredAlternateValue,
    referenceState,
    alternateState,
  } = certificate;
  const exactResidual = alternateEndpointPath - referenceEndpointPath;
  if (claimedResidual !== exactResidual) {
    throw new Error("Claimed residual does not match the certified endpoints");
  }
  const referenceValue = referenceState.valueAt(witnessAddress);
  const alternateValue = alternateState.valueAt(witnessAddress);
  if (referenceValue !== declaredReferenceValue || alternateValue !== declaredAlternateValue) {
    throw new Error("Declared witness values do not replay on the certified states");
  }
  if (referenceValue === alternateValue) {
    throw new Error("Certificate witness does not separate the conflicting states");
  }
  const localWitness = witnessAddress - frameContext;
  return Object.freeze({
    localWitness,
    claimedResidual,
    referenceValue,
    alternateValue,
    featureProgram: ({ query, context }) => query(context + localWitness),
  });
}

function shiftedPrototypePair(frameContext, referenceOffset, alternateOffset) {
  const referenceEndpointPath = frameContext + referenceOffset;
  const alternateEndpointPath = frameContext + alternateOffset;
  return {
    frameContext,
    referenceEndpointPath,
    alternateEndpointPath,
    referenceState: makePointMassState(referenceEndpointPath),
    alternateState: makePointMassState(alternateEndpointPath),
  };
}

function certificateForShiftedPair(pair) {
  return {
    ...pair,
    witnessAddress: pair.referenceEndpointPath,
    claimedResidual: pair.alternateEndpointPath - pair.referenceEndpointPath,
    declaredReferenceValue: 1,
    declaredAlternateValue: 0,
  };
}

function runCausalCertificateCompilerControl() {
  const prototypeFamilies = [
    { referenceOffset: 0, alternateOffset: 1 },
    { referenceOffset: 3, alternateOffset: 8 },
    { referenceOffset: -4, alternateOffset: 2 },
  ];
  const compiled = [];
  let heldOutPairCount = 0;
  for (let familyIndex = 0; familyIndex < prototypeFamilies.length; familyIndex += 1) {
    const prototype = prototypeFamilies[familyIndex];
    const trainingPair = shiftedPrototypePair(
      10000 + familyIndex * 1000,
      prototype.referenceOffset,
      prototype.alternateOffset,
    );
    const certificate = certificateForShiftedPair(trainingPair);
    const chart = compileAdditiveChartFromCertificate(certificate);
    assert.equal(chart.localWitness, prototype.referenceOffset);
    assert.equal(chart.claimedResidual, prototype.alternateOffset - prototype.referenceOffset);

    for (let heldOutIndex = 0; heldOutIndex < 20; heldOutIndex += 1) {
      const heldOutPair = shiftedPrototypePair(
        familyIndex * 100000 + heldOutIndex * 97,
        prototype.referenceOffset,
        prototype.alternateOffset,
      );
      const referenceRun = runExtensionalProgram(
        chart.featureProgram,
        heldOutPair.referenceState,
        { context: heldOutPair.frameContext },
      );
      const alternateRun = runExtensionalProgram(
        chart.featureProgram,
        heldOutPair.alternateState,
        { context: heldOutPair.frameContext },
      );
      assert.equal(referenceRun.output, chart.referenceValue);
      assert.equal(alternateRun.output, chart.alternateValue);
      assert.equal(referenceRun.semanticEvaluationCount, 1);
      assert.equal(alternateRun.semanticEvaluationCount, 1);
      heldOutPairCount += 1;
    }
    compiled.push({ certificate, chart });
  }
  assert.deepEqual(
    compiled.map((entry) => entry.chart.localWitness),
    prototypeFamilies.map((prototype) => prototype.referenceOffset),
  );

  const firstCertificate = compiled[0].certificate;
  assert.throws(() => compileAdditiveChartFromCertificate({
    ...firstCertificate,
    witnessAddress: undefined,
  }), /witness-bearing/);
  assert.throws(() => compileAdditiveChartFromCertificate({
    ...firstCertificate,
    claimedResidual: firstCertificate.claimedResidual + 1,
  }), /residual/);
  assert.throws(() => compileAdditiveChartFromCertificate({
    ...firstCertificate,
    witnessAddress: firstCertificate.frameContext + 17,
    declaredReferenceValue: 0,
    declaredAlternateValue: 0,
  }), /does not separate/);
  assert.throws(() => compileAdditiveChartFromCertificate({
    ...firstCertificate,
    referenceState: compiled[1].certificate.referenceState,
  }), /replay/);

  // A chart compiled from one prototype must not be reported as out-of-family
  // universal. Its local witness intentionally aliases the second family.
  const firstChart = compiled[0].chart;
  const secondFamilyPair = shiftedPrototypePair(
    777777,
    prototypeFamilies[1].referenceOffset,
    prototypeFamilies[1].alternateOffset,
  );
  const wrongFamilyReference = runExtensionalProgram(
    firstChart.featureProgram,
    secondFamilyPair.referenceState,
    { context: secondFamilyPair.frameContext },
  ).output;
  const wrongFamilyAlternate = runExtensionalProgram(
    firstChart.featureProgram,
    secondFamilyPair.alternateState,
    { context: secondFamilyPair.frameContext },
  ).output;
  assert.equal(wrongFamilyReference, wrongFamilyAlternate);

  return {
    prototypeFamilyCount: prototypeFamilies.length,
    heldOutTranslatedPairCount: heldOutPairCount,
    compiledLocalWitnesses: compiled.map((entry) => entry.chart.localWitness),
    certificateDeletionRejected: true,
    residualCorruptionRejected: true,
    nonseparatingWitnessRejected: true,
    crossFamilyStateShuffleRejected: true,
    outOfFamilyTemplateFailureObserved: true,
    compilerOutputCausallyDependsOnCertificate: true,
    scope:
      "compiles-relative-point-query-programs-from-additive-group-certificates-not-yet-from-the-full-nonsofic-proof-obligation-schema",
  };
}

export function runArchitecturalFalsificationSuite() {
  const originalSeparation = runBoundedFeatureSeparation();
  assert.equal(
    originalSeparation.atlasAudit.allPairsSeparatedByOneSharedContextAddressedCoordinate,
    true,
  );
  const suite = {
    schema: "oasis.architectural-falsification-suite.v1",
    posture: "adversarial-controls-before-broad-architectural-or-novelty-claims",
    originalSeparationRegression: {
      pairCount: originalSeparation.pairCount,
      passed: true,
    },
    soficAndContextParity: runSoficAndContextParityControls(),
    costModelBreakers: runCostModelBreakers(),
    contextCorruption: runContextCorruptionControl(),
    randomizedBudgetSweep: runRandomizedBudgetSweep(),
    exhaustiveFinitePolicyControl: runExhaustiveFinitePolicyControl(),
    adaptivePropertyStress: runAdaptivePropertyStress(),
    backgroundDifferenceStress: runBackgroundDifferenceStress(),
    hypergraphTransversalStress: runHypergraphTransversalStress(),
    influenceAndRescaling: runInfluenceAndRescalingControl(),
    exactGroupStress: runExactGroupStress(),
    handSpecifiedNormalization: runHandSpecifiedNormalizationControl(),
    causalCertificateCompiler: runCausalCertificateCompilerControl(),
  };
  return {
    ...suite,
    verdict: {
      survived:
        "under-the-semantic-point-evaluation-oracle-model-and-causally-supplied-context-one-dynamic-address-replaces-Theta(n)-context-blind-point-evaluations-on-the-tested-orbit-family",
      falsified:
        "a-general-Theta(n)-versus-Theta(1)-output-coordinate-or-total-memory-separation",
      controlsConfirm:
        "local-gain-is-side-information-enabled-dynamic-addressing-not-nonsoficity-and-an-ordinary-point-query-baseline-given-the-same-context-matches-it",
      stillOpen:
        "natural-task-generalization-autonomous-chart-law-discovery-stronger-semantic-interfaces-dense-feature-complexity-and-a-reduction-from-finite-encoders-to-forbidden-sofic-action-models",
      noveltyStatus:
        "provisional-no-priority-claim",
    },
  };
}

if (
  typeof process !== "undefined"
  && process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runArchitecturalFalsificationSuite(), null, 2));
}
