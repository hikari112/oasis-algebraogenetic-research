import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function rational(numerator, denominator = 1n) {
  assert(typeof numerator === "bigint");
  assert(typeof denominator === "bigint" && denominator !== 0n);
  let n = numerator;
  let d = denominator;
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const divisor = gcd(n, d);
  return Object.freeze({ numerator: n / divisor, denominator: d / divisor });
}

const ZERO = rational(0n);
const ONE = rational(1n);
const NEGATIVE_ONE = rational(-1n);
const FOUR = rational(4n);
const SIX = rational(6n);

function asRational(value) {
  if (
    value &&
    typeof value === "object" &&
    typeof value.numerator === "bigint" &&
    typeof value.denominator === "bigint"
  ) {
    return value;
  }
  if (typeof value === "bigint") return rational(value);
  assert(Number.isSafeInteger(value));
  return rational(BigInt(value));
}

function add(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return rational(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

function subtract(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return rational(
    a.numerator * b.denominator - b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

function multiply(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return rational(
    a.numerator * b.numerator,
    a.denominator * b.denominator,
  );
}

function divide(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  assert(b.numerator !== 0n);
  return rational(
    a.numerator * b.denominator,
    a.denominator * b.numerator,
  );
}

function square(value) {
  return multiply(value, value);
}

function equal(left, right) {
  const a = asRational(left);
  const b = asRational(right);
  return a.numerator === b.numerator && a.denominator === b.denominator;
}

function compare(left, right) {
  const difference = subtract(left, right);
  return difference.numerator < 0n
    ? -1
    : difference.numerator > 0n
      ? 1
      : 0;
}

function rationalString(value) {
  const item = asRational(value);
  return `${item.numerator}/${item.denominator}`;
}

function parseRational(text) {
  assert.equal(typeof text, "string");
  const match = /^(-?\d+)\/(\d+)$/.exec(text);
  assert(match);
  return rational(BigInt(match[1]), BigInt(match[2]));
}

function rationalApproximation(value) {
  const item = asRational(value);
  if (item.numerator === 0n) return 0;
  const sign = item.numerator < 0n ? -1 : 1;
  const numerator = (item.numerator < 0n ? -item.numerator : item.numerator)
    .toString();
  const denominator = item.denominator.toString();
  const numeratorHead = numerator.slice(0, 16);
  const denominatorHead = denominator.slice(0, 16);
  const numeratorLog =
    numerator.length - numeratorHead.length + Math.log10(Number(numeratorHead));
  const denominatorLog =
    denominator.length -
    denominatorHead.length +
    Math.log10(Number(denominatorHead));
  return sign * 10 ** (numeratorLog - denominatorLog);
}

function zeroPrimitive() {
  return Object.freeze({ constant: ZERO, z: Object.freeze([]) });
}

function primitiveCoordinate(primitive, index) {
  return add(primitive.constant, primitive.z[index] ?? ZERO);
}

function derivativeCoordinate(primitive, index) {
  return subtract(
    primitiveCoordinate(primitive, index),
    multiply(2n, primitiveCoordinate(primitive, index + 1)),
  );
}

function innerProduct(left, right) {
  let total = multiply(left.constant, right.constant);
  const length = Math.max(left.z.length, right.z.length);
  for (let index = 0; index < length; index += 1) {
    total = add(
      total,
      multiply(left.z[index] ?? ZERO, right.z[index] ?? ZERO),
    );
  }
  return total;
}

function primitiveNormSquared(primitive) {
  return innerProduct(primitive, primitive);
}

function combinePrimitives(left, right, rightScale = ONE) {
  const scale = asRational(rightScale);
  const length = Math.max(left.z.length, right.z.length);
  const z = [];
  for (let index = 0; index < length; index += 1) {
    z.push(
      add(
        left.z[index] ?? ZERO,
        multiply(scale, right.z[index] ?? ZERO),
      ),
    );
  }
  while (z.length > 0 && equal(z.at(-1), ZERO)) z.pop();
  return Object.freeze({
    constant: add(left.constant, multiply(scale, right.constant)),
    z: Object.freeze(z),
  });
}

function scalePrimitive(primitive, scale) {
  return combinePrimitives(zeroPrimitive(), primitive, scale);
}

function subtractPrimitives(left, right) {
  return combinePrimitives(left, right, NEGATIVE_ONE);
}

function primitivesEqual(left, right) {
  if (!equal(left.constant, right.constant)) return false;
  const length = Math.max(left.z.length, right.z.length);
  for (let index = 0; index < length; index += 1) {
    if (!equal(left.z[index] ?? ZERO, right.z[index] ?? ZERO)) return false;
  }
  return true;
}

function rawDerivativeRiesz(queryIndex) {
  assert(Number.isInteger(queryIndex) && queryIndex >= 0);
  const z = Array.from({ length: queryIndex + 2 }, () => ZERO);
  z[queryIndex] = ONE;
  z[queryIndex + 1] = rational(-2n);
  return Object.freeze({ constant: NEGATIVE_ONE, z: Object.freeze(z) });
}

const orthogonalRieszRows = [];
const gramCapacities = [];

function ensureGramFrontier(maxQueryIndex) {
  while (orthogonalRieszRows.length <= maxQueryIndex) {
    const queryIndex = orthogonalRieszRows.length;
    let residual = rawDerivativeRiesz(queryIndex);
    for (let index = 0; index < orthogonalRieszRows.length; index += 1) {
      const row = orthogonalRieszRows[index];
      const coefficient = divide(
        innerProduct(residual, row),
        gramCapacities[index],
      );
      residual = combinePrimitives(residual, row, multiply(-1n, coefficient));
    }
    const capacity = primitiveNormSquared(residual);
    assert(compare(capacity, ZERO) > 0);
    for (const earlier of orthogonalRieszRows) {
      assert(equal(innerProduct(residual, earlier), ZERO));
    }
    orthogonalRieszRows.push(residual);
    gramCapacities.push(capacity);
  }
}

function gramCapacity(queryIndex) {
  ensureGramFrontier(queryIndex);
  return gramCapacities[queryIndex];
}

// This is an independent exact minimum solve for the unit residual word
// (0,...,0,1), used to cross-check the Gram capacity and construct the minimum
// innovation rather than defining capacity by projection alone.
function solveUnitInnovation(queryIndex) {
  const length = queryIndex + 1;
  const values = [...Array(queryIndex).fill(0n), 1n];
  const terminal = Array.from({ length: length + 1 }, () => 0n);
  for (let index = length - 1; index >= 0; index -= 1) {
    terminal[index] = values[index] + 2n * terminal[index + 1];
  }
  const homogeneous = Array.from(
    { length: length + 1 },
    (_unused, index) => 1n << BigInt(length - index),
  );
  const constantCoefficient = BigInt(length + 2);
  let sumA = 0n;
  let sumH = 0n;
  let sumAA = 0n;
  let sumAH = 0n;
  let sumHH = 0n;
  for (let index = 0; index <= length; index += 1) {
    const a = terminal[index];
    const h = homogeneous[index];
    sumA += a;
    sumH += h;
    sumAA += a * a;
    sumAH += a * h;
    sumHH += h * h;
  }
  const determinant = constantCoefficient * sumHH - sumH * sumH;
  const constantNumerator = sumA * sumHH - sumH * sumAH;
  const boundaryNumerator = sumH * sumA - constantCoefficient * sumAH;
  const removedQuadratic =
    sumHH * sumA * sumA -
    2n * sumH * sumA * sumAH +
    constantCoefficient * sumAH * sumAH;
  const costNumerator = sumAA * determinant - removedQuadratic;
  const constant = rational(constantNumerator, determinant);
  const z = [];
  for (let index = 0; index <= length; index += 1) {
    const coordinateNumerator =
      terminal[index] * determinant + homogeneous[index] * boundaryNumerator;
    z.push(subtract(rational(coordinateNumerator, determinant), constant));
  }
  while (z.length > 0 && equal(z.at(-1), ZERO)) z.pop();
  const primitive = Object.freeze({ constant, z: Object.freeze(z) });
  const costSquared = rational(costNumerator, determinant);
  assert(equal(primitiveNormSquared(primitive), costSquared));
  for (let index = 0; index < queryIndex; index += 1) {
    assert(equal(derivativeCoordinate(primitive, index), ZERO));
  }
  assert(equal(derivativeCoordinate(primitive, queryIndex), ONE));
  return Object.freeze({ primitive, costSquared });
}

const unitInnovationCache = new Map();

function unitInnovation(queryIndex) {
  if (!unitInnovationCache.has(queryIndex)) {
    const solution = solveUnitInnovation(queryIndex);
    const capacity = gramCapacity(queryIndex);
    assert(equal(solution.costSquared, divide(ONE, capacity)));
    unitInnovationCache.set(queryIndex, solution);
  }
  return unitInnovationCache.get(queryIndex);
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function primitivePayload(primitive) {
  return {
    constantExact: rationalString(primitive.constant),
    zExact: primitive.z.map(rationalString),
  };
}

function statePayload(primitive, targets, energySquared) {
  return {
    frontier: targets.length,
    primitive: primitivePayload(primitive),
    targetsExact: targets.map(rationalString),
    energySquaredExact: rationalString(energySquared),
  };
}

function createState(primitive, targets) {
  const energySquared = primitiveNormSquared(primitive);
  const payload = statePayload(primitive, targets, energySquared);
  return Object.freeze({
    primitive,
    targets: Object.freeze([...targets]),
    frontier: targets.length,
    energySquared,
    digest: digest(payload),
  });
}

function initialState() {
  return createState(zeroPrimitive(), []);
}

function assertOrientation(orientation) {
  assert(equal(orientation, ONE) || equal(orientation, NEGATIVE_ONE));
}

function orientedUnitResidual(prediction, seedOrientation) {
  assertOrientation(seedOrientation);
  const sign = compare(prediction, ZERO);
  return sign > 0 ? NEGATIVE_ONE : sign < 0 ? ONE : seedOrientation;
}

function deriveBoundaryQuery(state) {
  const index = state.frontier;
  const riesz = rawDerivativeRiesz(index);
  const commitmentPayload = {
    kind: "raw-boundary-derivative",
    index,
    rieszTermsExact: [
      ["constant", "-1/1"],
      [`z_${index}`, "1/1"],
      [`z_${index + 1}`, "-2/1"],
    ],
  };
  return Object.freeze({
    kind: commitmentPayload.kind,
    index,
    riesz,
    commitment: digest(commitmentPayload),
  });
}

function endogenousTransition(state, seedOrientation) {
  const query = deriveBoundaryQuery(state);
  const prediction = derivativeCoordinate(state.primitive, query.index);
  assert(equal(innerProduct(query.riesz, state.primitive), prediction));
  const residual = orientedUnitResidual(prediction, seedOrientation);
  const target = add(prediction, residual);
  assert(equal(subtract(target, prediction), residual));
  assert(equal(square(residual), ONE));

  const capacity = gramCapacity(query.index);
  const unit = unitInnovation(query.index);
  const increment = scalePrimitive(unit.primitive, residual);
  const incrementEnergySquared = primitiveNormSquared(increment);
  assert(equal(incrementEnergySquared, divide(ONE, capacity)));

  for (let index = 0; index < state.frontier; index += 1) {
    assert(equal(derivativeCoordinate(state.primitive, index), state.targets[index]));
    assert(equal(derivativeCoordinate(increment, index), ZERO));
  }
  assert(equal(derivativeCoordinate(increment, query.index), residual));
  assert(equal(innerProduct(state.primitive, increment), ZERO));

  const nextPrimitive = combinePrimitives(state.primitive, increment);
  const nextTargets = [...state.targets, target];
  const nextState = createState(nextPrimitive, nextTargets);
  for (let index = 0; index < nextState.frontier; index += 1) {
    assert(
      equal(derivativeCoordinate(nextPrimitive, index), nextTargets[index]),
    );
  }
  assert(
    equal(
      nextState.energySquared,
      add(state.energySquared, incrementEnergySquared),
    ),
  );

  return Object.freeze({
    query,
    prediction,
    target,
    residual,
    capacity,
    unit,
    increment,
    incrementEnergySquared,
    nextState,
  });
}

function certificatePayload(
  transition,
  stage,
  priorStateDigest,
  priorCertificateDigest,
) {
  return {
    schema: "oasis.endogenous-stokes-step.v1",
    stage,
    priorStateDigest,
    priorCertificateDigest,
    query: {
      kind: transition.query.kind,
      index: transition.query.index,
      commitment: transition.query.commitment,
      rieszTermsExact: [
        ["constant", "-1/1"],
        [`z_${stage}`, "1/1"],
        [`z_${stage + 1}`, "-2/1"],
      ],
    },
    predictionExact: rationalString(transition.prediction),
    residualExact: rationalString(transition.residual),
    targetExact: rationalString(transition.target),
    capacityExact: rationalString(transition.capacity),
    incrementEnergySquaredExact: rationalString(
      transition.incrementEnergySquared,
    ),
    nextStateDigest: transition.nextState.digest,
  };
}

function makeCertificate(transition, state, priorCertificateDigest) {
  const payload = certificatePayload(
    transition,
    state.frontier,
    state.digest,
    priorCertificateDigest,
  );
  return Object.freeze({ ...payload, certificateDigest: digest(payload) });
}

function chainDigest(chain) {
  return digest({
    schema: chain.schema,
    seedOrientationExact: chain.seedOrientationExact,
    genesisStateDigest: chain.genesisStateDigest,
    certificateDigests: chain.certificates.map(
      (certificate) => certificate.certificateDigest,
    ),
    terminalStateDigest: chain.terminalStateDigest,
  });
}

function compileEndogenous(maxDepth, seedOrientation = ONE) {
  assert(Number.isInteger(maxDepth) && maxDepth >= 0);
  assertOrientation(seedOrientation);
  const genesis = initialState();
  let state = genesis;
  let priorCertificateDigest = "GENESIS";
  let weightedYEnergy = ZERO;
  const states = [state];
  const increments = [];
  const transitions = [];
  const certificates = [];
  const selected = [];
  const selectedDepths = new Set([0, 1, 2, 4, 8, 16, 32, maxDepth]);
  const checks = {
    oldConstraints: 0,
    unitResidual: 0,
    gramCapacity: 0,
    pythagoras: 0,
    pairwiseOrthogonality: 0,
    capacityBounds: 0,
    energyBounds: 0,
    weightedYBounds: 0,
    weightedStokesPairing: 0,
  };

  for (let stage = 0; stage <= maxDepth; stage += 1) {
    const previous = state;
    const transition = endogenousTransition(previous, seedOrientation);
    const dataWeight = rational(1n, 1n << BigInt(stage + 1));
    const coordinateDualScale = rational(1n << BigInt(stage + 1));
    const weightedStokesPairing = multiply(
      multiply(dataWeight, transition.prediction),
      coordinateDualScale,
    );
    assert(
      equal(
        weightedStokesPairing,
        innerProduct(previous.primitive, transition.query.riesz),
      ),
    );
    checks.weightedStokesPairing += 1;
    for (let index = 0; index < previous.frontier; index += 1) {
      assert(
        equal(
          derivativeCoordinate(transition.nextState.primitive, index),
          previous.targets[index],
        ),
      );
      checks.oldConstraints += 1;
    }
    assert(equal(square(transition.residual), ONE));
    checks.unitResidual += 1;
    assert(
      equal(
        transition.capacity,
        divide(ONE, transition.unit.costSquared),
      ),
    );
    checks.gramCapacity += 1;
    assert(
      equal(
        transition.nextState.energySquared,
        add(previous.energySquared, transition.incrementEnergySquared),
      ),
    );
    checks.pythagoras += 1;

    for (const earlierIncrement of increments) {
      assert(equal(innerProduct(earlierIncrement, transition.increment), ZERO));
      checks.pairwiseOrthogonality += 1;
    }

    // The raw row has norm squared 6, while its untouched z_(n+1)=-2
    // coordinate gives the stronger lower bound C_n>=4.
    assert(compare(transition.capacity, ONE) >= 0);
    assert(compare(transition.capacity, FOUR) >= 0);
    assert(compare(transition.capacity, SIX) <= 0);
    checks.capacityBounds += 3;
    const stepCount = rational(BigInt(stage + 1));
    assert(
      compare(
        transition.nextState.energySquared,
        divide(stepCount, SIX),
      ) >= 0,
    );
    assert(
      compare(
        transition.nextState.energySquared,
        divide(stepCount, FOUR),
      ) <= 0,
    );
    checks.energyBounds += 2;

    // Cauchy plus ||a_n||^2=6 and E_(n-1)<=n/4 gives
    // y_n^2<=(|prediction|+1)^2<=3n+2.
    const targetMajorant = rational(BigInt(3 * stage + 2));
    assert(compare(square(transition.target), targetMajorant) <= 0);
    const weight = rational(1n, 1n << BigInt(stage + 1));
    weightedYEnergy = add(
      weightedYEnergy,
      multiply(weight, square(transition.target)),
    );
    const tailMajorant = rational(
      BigInt(3 * stage + 8),
      1n << BigInt(stage + 1),
    );
    const partialMajorant = subtract(5n, tailMajorant);
    assert(compare(weightedYEnergy, partialMajorant) <= 0);
    checks.weightedYBounds += 2;

    const certificate = makeCertificate(
      transition,
      previous,
      priorCertificateDigest,
    );
    certificates.push(certificate);
    priorCertificateDigest = certificate.certificateDigest;
    transitions.push(transition);
    increments.push(transition.increment);
    state = transition.nextState;
    states.push(state);

    if (selectedDepths.has(stage)) {
      selected.push({
        stage,
        predictionExact: rationalString(transition.prediction),
        residualExact: rationalString(transition.residual),
        targetExact: rationalString(transition.target),
        capacityExact: rationalString(transition.capacity),
        incrementEnergySquaredExact: rationalString(
          transition.incrementEnergySquared,
        ),
        cumulativePrimitiveEnergySquaredExact: rationalString(
          state.energySquared,
        ),
      });
    }
  }

  const chain = {
    schema: "oasis.endogenous-stokes-chain.v1",
    seedOrientationExact: rationalString(seedOrientation),
    genesisStateDigest: genesis.digest,
    certificates,
    terminalStateDigest: state.digest,
  };
  chain.chainDigest = chainDigest(chain);
  return { chain, state, states, increments, transitions, selected, checks, weightedYEnergy };
}

function assertCertificateField(actual, expected) {
  assert.equal(actual, expected);
}

function assertExactKeys(value, expectedKeys) {
  assert(value && typeof value === "object" && !Array.isArray(value));
  assert.deepEqual(Object.keys(value).sort(), [...expectedKeys].sort());
}

function replayCertificateChain(chain) {
  assertExactKeys(chain, [
    "schema",
    "seedOrientationExact",
    "genesisStateDigest",
    "certificates",
    "terminalStateDigest",
    "chainDigest",
  ]);
  assert.equal(chain.schema, "oasis.endogenous-stokes-chain.v1");
  const seedOrientation = parseRational(chain.seedOrientationExact);
  assertOrientation(seedOrientation);
  let state = initialState();
  assertCertificateField(chain.genesisStateDigest, state.digest);
  let priorCertificateDigest = "GENESIS";
  for (let stage = 0; stage < chain.certificates.length; stage += 1) {
    const certificate = chain.certificates[stage];
    assertExactKeys(certificate, [
      "schema",
      "stage",
      "priorStateDigest",
      "priorCertificateDigest",
      "query",
      "predictionExact",
      "residualExact",
      "targetExact",
      "capacityExact",
      "incrementEnergySquaredExact",
      "nextStateDigest",
      "certificateDigest",
    ]);
    assertExactKeys(certificate.query, [
      "kind",
      "index",
      "commitment",
      "rieszTermsExact",
    ]);
    const transition = endogenousTransition(state, seedOrientation);
    const expectedPayload = certificatePayload(
      transition,
      stage,
      state.digest,
      priorCertificateDigest,
    );
    for (const field of [
      "schema",
      "stage",
      "priorStateDigest",
      "priorCertificateDigest",
      "predictionExact",
      "residualExact",
      "targetExact",
      "capacityExact",
      "incrementEnergySquaredExact",
      "nextStateDigest",
    ]) {
      assertCertificateField(certificate[field], expectedPayload[field]);
    }
    assert.deepEqual(certificate.query, expectedPayload.query);
    assertCertificateField(certificate.certificateDigest, digest(expectedPayload));
    priorCertificateDigest = certificate.certificateDigest;
    state = transition.nextState;
  }
  assertCertificateField(chain.terminalStateDigest, state.digest);
  assertCertificateField(chain.chainDigest, chainDigest(chain));
  return state;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function rejectsReplay(chain) {
  try {
    replayCertificateChain(chain);
    return false;
  } catch (error) {
    assert(error instanceof Error);
    return true;
  }
}

function auditCertificateTampering(chain) {
  assert(chain.certificates.length >= 2);
  const cases = {
    stage: (copy) => { copy.certificates[0].stage = 1; },
    queryKind: (copy) => { copy.certificates[0].query.kind = "tampered"; },
    queryIndex: (copy) => { copy.certificates[0].query.index = 1; },
    queryRow: (copy) => {
      copy.certificates[0].query.rieszTermsExact[1][1] = "2/1";
    },
    queryCommitment: (copy) => {
      copy.certificates[0].query.commitment = "0".repeat(64);
    },
    prediction: (copy) => { copy.certificates[0].predictionExact = "1/1"; },
    residual: (copy) => { copy.certificates[0].residualExact = "-1/1"; },
    target: (copy) => { copy.certificates[0].targetExact = "2/1"; },
    capacity: (copy) => { copy.certificates[0].capacityExact = "5/1"; },
    incrementEnergy: (copy) => {
      copy.certificates[0].incrementEnergySquaredExact = "1/5";
    },
    priorStateLink: (copy) => {
      copy.certificates[0].priorStateDigest = "0".repeat(64);
    },
    priorCertificateLink: (copy) => {
      copy.certificates[1].priorCertificateDigest = "0".repeat(64);
    },
    nextStateLink: (copy) => {
      copy.certificates[0].nextStateDigest = "0".repeat(64);
    },
    certificateDigest: (copy) => {
      copy.certificates[0].certificateDigest = "0".repeat(64);
    },
    recordSwap: (copy) => {
      [copy.certificates[0], copy.certificates[1]] =
        [copy.certificates[1], copy.certificates[0]];
    },
    extraCertificateField: (copy) => {
      copy.certificates[0].undeclared = true;
    },
    extraQueryField: (copy) => {
      copy.certificates[0].query.undeclared = true;
    },
    extraChainField: (copy) => { copy.undeclared = true; },
  };
  const rejected = {};
  for (const [name, mutate] of Object.entries(cases)) {
    const copy = cloneJson(chain);
    mutate(copy);
    rejected[name] = rejectsReplay(copy);
    assert(rejected[name]);
  }
  return {
    attempted: Object.keys(cases).length,
    rejected: Object.values(rejected).filter(Boolean).length,
    allRejected: true,
    cases: rejected,
  };
}

function auditZeroResidualControl(maxDepth) {
  let state = initialState();
  for (let stage = 0; stage <= maxDepth; stage += 1) {
    const query = deriveBoundaryQuery(state);
    const prediction = derivativeCoordinate(state.primitive, query.index);
    const target = prediction;
    const residual = subtract(target, prediction);
    assert(equal(residual, ZERO));
    assert(compare(gramCapacity(query.index), ZERO) > 0);
    state = createState(state.primitive, [...state.targets, target]);
    assert(equal(state.energySquared, ZERO));
  }
  return {
    stages: maxDepth + 1,
    residualExact: "0/1",
    terminalEnergySquaredExact: rationalString(state.energySquared),
    bounded: true,
  };
}

function auditSummableResidualControl(maxDepth) {
  let state = initialState();
  let exactChecks = 0;
  for (let stage = 0; stage <= maxDepth; stage += 1) {
    const query = deriveBoundaryQuery(state);
    const prediction = derivativeCoordinate(state.primitive, query.index);
    const residual = rational(1n, 1n << BigInt(stage));
    const target = add(prediction, residual);
    const unit = unitInnovation(query.index);
    const increment = scalePrimitive(unit.primitive, residual);
    const incrementEnergySquared = primitiveNormSquared(increment);
    assert(
      equal(
        incrementEnergySquared,
        divide(square(residual), gramCapacity(query.index)),
      ),
    );
    const nextPrimitive = combinePrimitives(state.primitive, increment);
    const nextState = createState(nextPrimitive, [...state.targets, target]);
    assert(
      equal(
        nextState.energySquared,
        add(state.energySquared, incrementEnergySquared),
      ),
    );
    assert(compare(nextState.energySquared, rational(1n, 3n)) <= 0);
    state = nextState;
    exactChecks += 3;
  }
  const firstOmittedStage = maxDepth + 1;
  const analyticTailUpperBound = rational(
    1n,
    3n * (1n << BigInt(2 * firstOmittedStage)),
  );
  return {
    stages: maxDepth + 1,
    residualRule: "r_n=2^(-n)",
    exactChecks,
    partialEnergySquaredExact: rationalString(state.energySquared),
    analyticInfiniteEnergyUpperBoundExact: "1/3",
    analyticTailEnergyUpperBoundExact: rationalString(
      analyticTailUpperBound,
    ),
    finiteRunProvesInfiniteConvergence: false,
    theorem:
      "orthogonal increments and the geometric energy majorant prove " +
      "convergence to a global primitive",
  };
}

function externalTapeTransition(state, target) {
  const query = deriveBoundaryQuery(state);
  const prediction = derivativeCoordinate(state.primitive, query.index);
  const residual = subtract(target, prediction);
  const unit = unitInnovation(query.index);
  const increment = scalePrimitive(unit.primitive, residual);
  const nextPrimitive = combinePrimitives(state.primitive, increment);
  const nextState = createState(nextPrimitive, [...state.targets, target]);
  for (let index = 0; index < nextState.frontier; index += 1) {
    assert(
      equal(derivativeCoordinate(nextPrimitive, index), nextState.targets[index]),
    );
  }
  return { prediction, residual, nextState };
}

function auditExternalTapeControl(endogenous) {
  let externalState = initialState();
  let firstDivergence = null;
  for (let stage = 0; stage < endogenous.transitions.length; stage += 1) {
    const target = ONE;
    const transition = externalTapeTransition(externalState, target);
    if (
      firstDivergence === null &&
      !equal(target, endogenous.transitions[stage].target)
    ) {
      firstDivergence = stage;
    }
    externalState = transition.nextState;
  }
  assert(firstDivergence !== null && firstDivergence > 0);

  const mainStageZero = endogenous.states[1];
  const alternateStageZero = externalTapeTransition(initialState(), 2n).nextState;
  const mainNext = endogenousTransition(mainStageZero, ONE);
  const alternateNext = endogenousTransition(alternateStageZero, ONE);
  assert(!equal(mainNext.prediction, alternateNext.prediction));
  assert(!equal(mainNext.target, alternateNext.target));

  return {
    suppliedConstantTapeTargetExact: "1/1",
    firstTargetDivergenceStage: firstDivergence,
    sameFrontierStateDependenceWitness: {
      frontier: 1,
      firstPredictionExact: rationalString(mainNext.prediction),
      secondPredictionExact: rationalString(alternateNext.prediction),
      firstTargetExact: rationalString(mainNext.target),
      secondTargetExact: rationalString(alternateNext.target),
      targetsDiffer: true,
    },
    compilerReceivesFutureTape: false,
    finiteTraceCanBeRecordedAsTapeAfterCompilation: true,
  };
}

function auditSignGauge(positive, maxDepth) {
  const negative = compileEndogenous(maxDepth, NEGATIVE_ONE);
  assert.equal(positive.states.length, negative.states.length);
  for (let index = 0; index < positive.states.length; index += 1) {
    const positiveState = positive.states[index];
    const negativeState = negative.states[index];
    assert(
      primitivesEqual(
        negativeState.primitive,
        scalePrimitive(positiveState.primitive, NEGATIVE_ONE),
      ),
    );
    assert(equal(negativeState.energySquared, positiveState.energySquared));
    assert.equal(negativeState.targets.length, positiveState.targets.length);
    for (let target = 0; target < positiveState.targets.length; target += 1) {
      assert(
        equal(
          negativeState.targets[target],
          multiply(-1n, positiveState.targets[target]),
        ),
      );
    }
  }
  return {
    gauge: "primitive, observations, residuals, and seed orientation all change sign",
    seedOrientationTransforms: "omega -> -omega",
    pathSignCovariant: true,
    energyInvariant: true,
    checkedThroughDepth: maxDepth,
  };
}

function geometricEndpoints(maxDepth) {
  const endpoints = [-1, 0, 1, 2];
  for (let value = 4; value < maxDepth; value *= 2) endpoints.push(value);
  if (!endpoints.includes(maxDepth)) endpoints.push(maxDepth);
  return endpoints.filter(
    (value, index, array) => value <= maxDepth && array.indexOf(value) === index,
  );
}

function auditFiniteGeometricBlocks(compilation, maxDepth) {
  const endpoints = geometricEndpoints(maxDepth);
  const blocks = [];
  let checks = 0;
  const stateAt = (depth) => compilation.states[depth + 1];
  for (let block = 1; block < endpoints.length; block += 1) {
    const from = endpoints[block - 1];
    const to = endpoints[block];
    const difference = subtractPrimitives(
      stateAt(to).primitive,
      stateAt(from).primitive,
    );
    const blockEnergy = primitiveNormSquared(difference);
    let incrementSum = ZERO;
    for (let stage = from + 1; stage <= to; stage += 1) {
      incrementSum = add(
        incrementSum,
        primitiveNormSquared(compilation.increments[stage]),
      );
    }
    const telescoped = subtract(
      stateAt(to).energySquared,
      stateAt(from).energySquared,
    );
    assert(equal(blockEnergy, incrementSum));
    assert(equal(incrementSum, telescoped));
    checks += 2;
    blocks.push({
      fromDepth: from,
      toDepth: to,
      energySquaredExact: rationalString(blockEnergy),
    });
  }
  return { endpoints, exactChecks: checks, blocks };
}

function solveExactLinearSystem(matrix, rightHandSide) {
  const size = rightHandSide.length;
  assert.equal(matrix.length, size);
  const augmented = matrix.map((row, index) => {
    assert.equal(row.length, size);
    return [...row, rightHandSide[index]];
  });
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    while (pivot < size && equal(augmented[pivot][column], ZERO)) pivot += 1;
    assert(pivot < size);
    [augmented[column], augmented[pivot]] = [
      augmented[pivot],
      augmented[column],
    ];
    const pivotValue = augmented[column][column];
    for (let entry = column; entry <= size; entry += 1) {
      augmented[column][entry] = divide(augmented[column][entry], pivotValue);
    }
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const coefficient = augmented[row][column];
      if (equal(coefficient, ZERO)) continue;
      for (let entry = column; entry <= size; entry += 1) {
        augmented[row][entry] = subtract(
          augmented[row][entry],
          multiply(coefficient, augmented[column][entry]),
        );
      }
    }
  }
  return augmented.map((row, index) => {
    for (let column = 0; column < size; column += 1) {
      assert(equal(row[column], column === index ? ONE : ZERO));
    }
    return row[size];
  });
}

function batchPseudoinversePrimitive(targets) {
  assert(Array.isArray(targets) && targets.length > 0);
  const rows = targets.map((_target, index) => rawDerivativeRiesz(index));
  const gram = rows.map((left) => rows.map((right) => innerProduct(left, right)));
  const coefficients = solveExactLinearSystem(gram, targets);
  let primitive = zeroPrimitive();
  for (let index = 0; index < rows.length; index += 1) {
    primitive = combinePrimitives(primitive, rows[index], coefficients[index]);
  }
  for (let index = 0; index < targets.length; index += 1) {
    assert(equal(derivativeCoordinate(primitive, index), targets[index]));
  }
  return primitive;
}

function auditBatchPseudoinverse(compilation, depth) {
  assert(depth >= 0 && depth < compilation.transitions.length);
  const onlineState = compilation.states[depth + 1];
  const batchPrimitive = batchPseudoinversePrimitive(onlineState.targets);
  assert(primitivesEqual(batchPrimitive, onlineState.primitive));
  assert(
    equal(
      primitiveNormSquared(batchPrimitive),
      onlineState.energySquared,
    ),
  );
  return {
    checkedThroughDepth: depth,
    constraints: depth + 1,
    onlineEqualsBatchPseudoinverse: true,
    energySquaredExact: rationalString(onlineState.energySquared),
  };
}

function auditPrefixIdentity(longCompilation, shortDepth) {
  const shortCompilation = compileEndogenous(shortDepth, ONE);
  assert.equal(shortCompilation.chain.certificates.length, shortDepth + 1);
  for (let stage = 0; stage <= shortDepth; stage += 1) {
    assert.deepEqual(
      shortCompilation.chain.certificates[stage],
      longCompilation.chain.certificates[stage],
    );
    assert.equal(
      shortCompilation.states[stage + 1].digest,
      longCompilation.states[stage + 1].digest,
    );
  }
  return {
    shortHorizon: shortDepth,
    longHorizon: longCompilation.transitions.length - 1,
    identicalCertificatePrefixLength: shortDepth + 1,
    identicalStatePrefix: true,
  };
}

function auditControllerFork(compilation, prefixLastStage) {
  const prefixState = compilation.states[prefixLastStage + 1];
  const query = deriveBoundaryQuery(prefixState);
  const prediction = derivativeCoordinate(prefixState.primitive, query.index);
  const positiveTarget = add(prediction, ONE);
  const negativeTarget = subtract(prediction, ONE);
  const positiveFork = externalTapeTransition(prefixState, positiveTarget);
  const negativeFork = externalTapeTransition(prefixState, negativeTarget);
  assert(!equal(positiveTarget, negativeTarget));
  for (let index = 0; index < prefixState.targets.length; index += 1) {
    assert(
      equal(positiveFork.nextState.targets[index], prefixState.targets[index]),
    );
    assert(
      equal(negativeFork.nextState.targets[index], prefixState.targets[index]),
    );
  }
  return {
    commonPrefixThroughStage: prefixLastStage,
    forkQueryIndex: query.index,
    priorStateDigest: prefixState.digest,
    priorTargetPrefixPreservedByBothForks: true,
    positiveForkTargetExact: rationalString(positiveTarget),
    negativeForkTargetExact: rationalString(negativeTarget),
    forkTargetsDiffer: true,
  };
}

function auditFrozenTapeRetrain(compilation, depth) {
  let retrained = initialState();
  for (let stage = 0; stage <= depth; stage += 1) {
    const frozenTarget = compilation.transitions[stage].target;
    retrained = externalTapeTransition(retrained, frozenTarget).nextState;
    assert.equal(retrained.digest, compilation.states[stage + 1].digest);
  }
  return {
    frozenAfterCompilation: true,
    retrainedThroughDepth: depth,
    everyPrefixStateReproduced: true,
    terminalStateDigest: retrained.digest,
  };
}

function causalDependencyLedger(compilation) {
  const selectedStages = new Set([0, 1, 2, 4, 8, 16, 32, 64]);
  return {
    staticDependencies: {
      query: ["current frontier"],
      prediction: ["committed query row", "current exact minimum primitive"],
      residual: ["current prediction", "seed orientation only at zero"],
      target: ["current prediction", "current unit residual"],
      update: ["current state", "Gram capacity", "minimum unit innovation"],
      futureTape: [],
    },
    committedStages: compilation.transitions
      .filter((_transition, stage) => selectedStages.has(stage))
      .map((transition, stageIndex) => {
        const stage = [...selectedStages][stageIndex];
        return {
          stage,
          queryCommitment: transition.query.commitment,
          predictorStateDigest: compilation.states[stage].digest,
          predictionExact: rationalString(transition.prediction),
          targetExact: rationalString(transition.target),
        };
      }),
  };
}

function auditFreeOrthogonalAppendBaseline(compilation) {
  let exactDirectionChecks = 0;
  for (const transition of compilation.transitions) {
    assert(
      primitivesEqual(
        transition.increment,
        scalePrimitive(transition.unit.primitive, transition.residual),
      ),
    );
    exactDirectionChecks += 1;
  }
  return {
    classification:
      "state-dependent signed free-orthogonal append inside a fixed derivative-query grammar",
    queryGrammarFixedInAdvance: true,
    innovationDirectionsFixedByFrontier: true,
    signsAndTargetsStateDependent: true,
    beyondFreeOrthogonalAppendBaseline: false,
    exactDirectionChecks,
  };
}

function auditQueryRescalingBoundary(compilation) {
  const transition = compilation.transitions[1];
  const scale = rational(2n);
  const transportedPrediction = multiply(scale, transition.prediction);
  const transportedTarget = multiply(scale, transition.target);
  const rerunUnitResidualTarget = add(
    transportedPrediction,
    orientedUnitResidual(transportedPrediction, ONE),
  );
  assert(!equal(transportedTarget, rerunUnitResidualTarget));
  return {
    testedScaleExact: "2/1",
    transportedTargetExact: rationalString(transportedTarget),
    rerunUnitResidualTargetExact: rationalString(rerunUnitResidualTarget),
    invariantUnderArbitraryQueryRescaling: false,
    interpretation:
      "the scalar unit and fixed raw-row scale are part of the declared presentation gauge",
  };
}

export function runEndogenousStokesEscape(options = {}) {
  const maxDepth = options.maxDepth ?? 32;
  const includeCertificateChain = options.includeCertificateChain ?? false;
  assert(Number.isInteger(maxDepth) && maxDepth >= 16);
  assert.equal(typeof includeCertificateChain, "boolean");
  const positive = compileEndogenous(maxDepth, ONE);
  const replayed = replayCertificateChain(positive.chain);
  assert.equal(replayed.digest, positive.state.digest);
  const certificateTampering = auditCertificateTampering(positive.chain);
  const finiteGeometricBlocks = auditFiniteGeometricBlocks(positive, maxDepth);
  const zeroResidualControl = auditZeroResidualControl(maxDepth);
  const summableResidualControl = auditSummableResidualControl(
    Math.min(16, maxDepth),
  );
  const externalTapeControl = auditExternalTapeControl(positive);
  const signGauge = auditSignGauge(positive, maxDepth);
  const prefixIdentity = auditPrefixIdentity(
    positive,
    Math.min(16, maxDepth - 1),
  );
  const controllerFork = auditControllerFork(positive, Math.min(8, maxDepth - 1));
  const batchPseudoinverse = auditBatchPseudoinverse(
    positive,
    Math.min(12, maxDepth),
  );
  const frozenTapeRetrain = auditFrozenTapeRetrain(
    positive,
    Math.min(16, maxDepth),
  );
  const dependencyLedger = causalDependencyLedger(positive);
  const freeOrthogonalAppend = auditFreeOrthogonalAppendBaseline(positive);
  const queryRescalingBoundary = auditQueryRescalingBoundary(positive);
  const terminalStepCount = rational(BigInt(maxDepth + 1));

  return {
    schema: "oasis.endogenous-stokes-escape.v1",
    status:
      "exact online boundary-query compiler with state-derived oriented unit residuals",
    compiler: {
      suppliedFutureDatum: false,
      nextQueryRule: "at frontier n, generate the raw boundary functional ell_n",
      predictor: "the current exact Moore-Penrose minimum primitive",
      causalOrder:
        "derive and commit query row, evaluate the current exact minimum " +
        "primitive, derive oriented residual and target, then update",
      queryCommittedBeforePredictionAndTarget: true,
      residualRule:
        "s_n=-sign(prediction) when nonzero, otherwise s_n=omega in {+1,-1}",
      targetRule: "target_n=prediction_n+s_n",
      updateRule: "add the exact minimum innovation with residual s_n",
      maxDepth,
      selectedStages: positive.selected,
    },
    exactChecks: positive.checks,
    bounds: {
      capacityVerifiedStronger: "4 <= C_n <= 6",
      incrementEnergySquared: "1/6 <= ||g_n||^2 <= 1/4",
      terminalEnergySquaredExact: rationalString(positive.state.energySquared),
      terminalEnergySquaredApproximate: rationalApproximation(
        positive.state.energySquared,
      ),
      terminalEnergyLowerExact: rationalString(
        divide(terminalStepCount, SIX),
      ),
      terminalEnergyUpperExact: rationalString(
        divide(terminalStepCount, FOUR),
      ),
    },
    weightedYConvergence: {
      normSquared: "sum_(n>=0) 2^(-(n+1)) |target_n|^2",
      pointwiseMajorant: "|target_n|^2 <= 3n+2",
      infiniteNormSquaredUpperBoundExact: "5/1",
      verifiedPartialNormSquaredExact: rationalString(positive.weightedYEnergy),
      continuationTailNormSquaredUpperBoundExact: rationalString(
        rational(BigInt(3 * maxDepth + 8), 1n << BigInt(maxDepth + 1)),
      ),
    },
    certificate: {
      replayedExactly: true,
      tamperAudit: certificateTampering,
      chainSummary: {
        schema: positive.chain.schema,
        steps: positive.chain.certificates.length,
        genesisStateDigest: positive.chain.genesisStateDigest,
        terminalStateDigest: positive.chain.terminalStateDigest,
        chainDigest: positive.chain.chainDigest,
      },
      ...(includeCertificateChain ? { chain: positive.chain } : {}),
    },
    controls: {
      zeroResidual: zeroResidualControl,
      summableResidual: summableResidualControl,
      externalTape: externalTapeControl,
      frozenTapeRetrain,
      prefixIdentity,
      controllerFork,
      batchPseudoinverse,
      signGauge,
      dependencyLedger,
      freeOrthogonalAppend,
      queryRescalingBoundary,
    },
    finiteGeometricBlocks,
    theoremBoundary: {
      finiteExactExecution: true,
      asymptoticEnergyEscape:
        "follows from the proved per-step lower bound ||g_n||^2>=1/6",
      weightedYMembership:
        "follows from the summable majorant (3n+2)2^(-(n+1))",
      cryptographicSecurityClaim: false,
      finiteTraceNotRecordablePostHoc: false,
      compilerRequiresExternalTargetTape: false,
      matchedExternalTapeCanReproduceTheTrace: true,
      causalProvenanceDiffersFromMatchedTape: true,
      preciseClaim:
        "prefix-computable causal diagonal innovation inside a fixed query grammar",
      adaptiveQueryGrammarEstablished: false,
      beyondFreeOrthogonalAppendEstablished: false,
      datumPredictorRelative: true,
      predictorClassTheoremEstablished: false,
    },
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const fullDepth = process.argv.includes("--full");
  const includeCertificateChain = process.argv.includes("--chain");
  const depthArgument = process.argv.find((argument) =>
    argument.startsWith("--depth="),
  );
  const maxDepth = depthArgument
    ? Number(depthArgument.slice("--depth=".length))
    : fullDepth
      ? 64
      : 32;
  console.log(
    JSON.stringify(
      runEndogenousStokesEscape({ maxDepth, includeCertificateChain }),
      null,
      2,
    ),
  );
}
