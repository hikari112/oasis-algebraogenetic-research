import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import { buildGenesisInterchangeTransductionInput } from "./genesis-interchange-square.mjs";
import { runGenesisHigherQuestionQuotients } from "./genesis-higher-question-quotients.mjs";

const Q = Object.freeze([0, 1, 2, 3]);
const NONZERO_Q = Object.freeze([1, 2, 3]);
const NORMALIZED_PAIRS = Object.freeze(
  NONZERO_Q.flatMap((g) => NONZERO_Q.map((h) => Object.freeze([g, h]))),
);

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mod(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

function bits(q) {
  return { u: q & 1, v: (q >> 1) & 1 };
}

function character(mask, q) {
  const { u, v } = bits(q);
  return ((mask & 1) ? u : 0) ^ ((mask & 2) ? v : 0);
}

function identityPermutation(size) {
  return Array.from({ length: size }, (_, index) => index);
}

function compose(left, right) {
  return right.map((image) => left[image]);
}

function inversePermutation(permutation) {
  const inverse = Array(permutation.length);
  permutation.forEach((image, index) => { inverse[image] = index; });
  return inverse;
}

function permutationKey(permutation) {
  return permutation.join(",");
}

function permutationEqual(left, right) {
  return permutationKey(left) === permutationKey(right);
}

function generatedGroup(generators) {
  const identity = identityPermutation(generators[0].length);
  const found = new Map([[permutationKey(identity), identity]]);
  const queue = [identity];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const generator of generators) {
      const product = compose(generator, current);
      const key = permutationKey(product);
      if (!found.has(key)) {
        found.set(key, product);
        queue.push(product);
      }
    }
  }
  return [...found.values()];
}

function coordinateKey({ x, y, z }) {
  return `${x}${y}${z}`;
}

function centralCommutator(left, right) {
  return compose(left, compose(right, compose(inversePermutation(left), inversePermutation(right))));
}

function transport(permutation, sourceToTarget) {
  return compose(inversePermutation(sourceToTarget), compose(permutation, sourceToTarget));
}

function deriveSection(group, chart, center) {
  const origin = chart.findIndex((coordinate) => coordinateKey(coordinate) === "000");
  assert(origin >= 0);
  return Q.map((q) => {
    const expected = bits(q);
    const candidates = group.filter((element) => {
      const image = chart[element[origin]];
      return image.x === expected.u && image.y === expected.v && image.z === 0;
    });
    assert.equal(candidates.length, 1);
    return candidates[0];
  });
}

function factorSet(section, center) {
  return Q.map((left) => Q.map((right) => {
    const product = compose(section[right], section[left]);
    const target = section[left ^ right];
    if (permutationEqual(product, target)) return 0;
    assert(permutationEqual(product, compose(center, target)));
    return 1;
  }));
}

function buildConcreteExtension() {
  const input = buildGenesisInterchangeTransductionInput();
  const op = input.charts.OP;
  const po = input.charts.PO;
  const opGroup = generatedGroup([op.actions.a, op.actions.b]);
  const poGroup = generatedGroup([po.actions.a, po.actions.b]);
  assert.equal(opGroup.length, 8);
  assert.equal(poGroup.length, 8);
  const center = centralCommutator(op.actions.a, op.actions.b);
  const poCenter = centralCommutator(po.actions.a, po.actions.b);
  assert(!permutationEqual(center, identityPermutation(8)));
  assert(opGroup.every((element) => permutationEqual(compose(element, center), compose(center, element))));
  const theta0 = input.coherentComparisonsOPtoPO[0];
  assert.deepEqual(transport(po.actions.a, theta0), op.actions.a);
  assert.deepEqual(transport(po.actions.b, theta0), op.actions.b);
  const opSection = deriveSection(opGroup, op.coordinates, center);
  const poSection = deriveSection(poGroup, po.coordinates, poCenter)
    .map((element) => transport(element, theta0));
  const opFactor = factorSet(opSection, center);
  const poFactor = factorSet(poSection, center);
  for (const g of Q) {
    for (const h of Q) {
      assert.equal(opFactor[g][h], bits(g).u & bits(h).v);
      assert.equal(poFactor[g][h], bits(g).v & bits(h).u);
    }
  }
  return { input, opGroup, center, opSection, poSection, opFactor, poFactor };
}

function determinant(matrix) {
  if (matrix.length === 1) return matrix[0][0];
  return matrix[0].reduce((sum, entry, column) => {
    const minor = matrix.slice(1).map((row) => row.filter((_, index) => index !== column));
    return sum + (column % 2 === 0 ? 1 : -1) * entry * determinant(minor);
  }, 0);
}

function matrixVector(matrix, vector) {
  return matrix.map((row) => row.reduce((sum, entry, index) => sum + entry * vector[index], 0));
}

function scalarMultiple(policy, coefficient, value) {
  let result = policy.zero;
  const summand = coefficient < 0 ? policy.neg(value) : value;
  for (let index = 0; index < Math.abs(coefficient); index += 1) {
    result = policy.add(result, summand);
  }
  return result;
}

function imageOfRegularVector(policy, orbitImages, vector) {
  return vector.reduce((result, coefficient, q) => (
    policy.add(result, scalarMultiple(policy, coefficient, orbitImages[q]))
  ), policy.zero);
}

function subgroupGeneratedBy(policy, generators) {
  const found = new Set([policy.zero]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const left of [...found]) {
      for (const right of generators) {
        const value = policy.add(left, right);
        if (!found.has(value)) {
          found.add(value);
          changed = true;
        }
      }
    }
  }
  return [...found].sort((a, b) => a - b);
}

function transpose(matrix) {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

function shiftRegular(vector, q) {
  return Q.map((index) => vector[index ^ q]);
}

function aCoordinates(vector) {
  const sum = vector.reduce((total, value) => total + value, 0);
  assert.equal(mod(sum, 2), 0);
  return [sum / 2, vector[1], vector[2], vector[3]];
}

function buildInvariantDualShell() {
  // Columns are a0=2e0 and ai=ei-e0.  They form an integral basis of A.
  const aBasisColumns = [
    [2, 0, 0, 0],
    [-1, 1, 0, 0],
    [-1, 0, 1, 0],
    [-1, 0, 0, 1],
  ];
  const aBasisMatrix = transpose(aBasisColumns);
  assert.equal(Math.abs(determinant(aBasisMatrix)), 2);
  const actionMatrices = Q.map((q) => transpose(aBasisColumns.map((column) => (
    aCoordinates(shiftRegular(column, q)).map((entry) => mod(entry, 2))
  ))));
  const invariantFunctionals = [];
  for (let mask = 0; mask < 16; mask += 1) {
    const values = Q.map((index) => (mask >> index) & 1);
    const invariant = actionMatrices.every((matrix) => (
      Q.every((column) => {
        const transformed = Q.reduce((sum, row) => sum ^ (values[row] & matrix[row][column]), 0);
        return transformed === values[column];
      })
    ));
    if (invariant) invariantFunctionals.push(values);
  }
  const expected = [];
  for (let point = 0; point < 8; point += 1) {
    const eta = point & 1;
    const alpha = (point >> 1) & 1;
    const beta = (point >> 2) & 1;
    expected.push([eta, alpha, beta, alpha ^ beta]);
  }
  assert.deepEqual(invariantFunctionals.sort(), expected.sort());

  const points = [];
  for (let point = 1; point < 8; point += 1) {
    const eta = point & 1;
    const alpha = (point >> 1) & 1;
    const beta = (point >> 2) & 1;
    const functional = [eta, alpha, beta, alpha ^ beta];
    const pivot = functional.findIndex(Boolean);
    const relativeColumns = [];
    for (let column = 0; column < 4; column += 1) {
      const vector = [0, 0, 0, 0];
      if (column === pivot) vector[pivot] = 2;
      else {
        vector[column] = 1;
        vector[pivot] = functional[column];
      }
      relativeColumns.push(vector);
    }
    const kernelColumns = relativeColumns.map((column) => matrixVector(aBasisMatrix, column));
    const kernelMatrix = transpose(kernelColumns);
    assert.equal(Math.abs(determinant(kernelMatrix)), 4);
    const quotientPolicy = makeShellPolicy(point);
    const distinguishedFiller = 1;
    const orbitImages = Q.map((q) => quotientPolicy.action(q, distinguishedFiller));
    const kernelBasisImages = kernelColumns.map((column) => (
      imageOfRegularVector(quotientPolicy, orbitImages, column)
    ));
    assert(kernelBasisImages.every((value) => value === quotientPolicy.zero));
    let equivarianceChecks = 0;
    for (const q of Q) {
      for (const basisElement of Q) {
        assert.equal(
          orbitImages[basisElement ^ q],
          quotientPolicy.action(q, orbitImages[basisElement]),
        );
        equivarianceChecks += 1;
      }
    }
    assert(orbitImages.every((value) => quotientPolicy.boundary(value) === 1));
    const generatedCarrier = subgroupGeneratedBy(quotientPolicy, orbitImages);
    assert.deepEqual(generatedCarrier, quotientPolicy.elements);
    points.push({
      point,
      coordinates: [eta, alpha, beta],
      functionalOnABasis: functional,
      kind: eta === 1 ? "cyclic-sign" : "transvection",
      carrier: eta === 1 ? "C4" : "C2^2",
      characterMask: alpha | (beta << 1),
      relationKernelBasisInRegularCoordinates: kernelColumns,
      relationIndexInZQ: 4,
      quotientModel: {
        distinguishedFiller,
        regularBasisImages: orbitImages,
        kernelBasisImages,
        equivarianceChecks,
        boundaryCompatibleOnRegularBasis: true,
        orbitGeneratedCarrier: generatedCarrier,
        surjectiveMapAndEqualIndexProveDisplayedKernelEquality: true,
      },
    });
  }
  const lineKeys = new Set();
  for (const left of points) {
    for (const right of points) {
      if (left.point === right.point) continue;
      lineKeys.add([left.point, right.point, left.point ^ right.point].sort((a, b) => a - b).join(","));
    }
  }
  const lines = [...lineKeys].sort().map((key) => key.split(",").map(Number));
  assert.equal(points.length, 7);
  assert.equal(lines.length, 7);
  assert(lines.every((line) => line.length === 3));
  assert(points.every(({ point }) => lines.filter((line) => line.includes(point)).length === 3));
  assert.equal(lines.reduce((sum, line) => sum + line.length, 0), 21);
  const pairMultiplicities = new Map();
  for (const line of lines) {
    for (let left = 0; left < line.length; left += 1) {
      for (let right = left + 1; right < line.length; right += 1) {
        const key = `${line[left]},${line[right]}`;
        pairMultiplicities.set(key, (pairMultiplicities.get(key) ?? 0) + 1);
      }
    }
  }
  assert.equal(pairMultiplicities.size, 21);
  assert([...pairMultiplicities.values()].every((count) => count === 1));
  return {
    aBasisColumns,
    actionMatrices,
    invariantDualDimension: 3,
    invariantFunctionalCountIncludingZero: invariantFunctionals.length,
    points,
    lines,
    incidenceCount: 21,
    unorderedPointPairsCoveredExactlyOnce: pairMultiplicities.size,
  };
}

function buildDisplayedPolicyCategory() {
  const nodes = [
    { id: "free", relation: "0", role: "initial displayed policy" },
    ...NONZERO_Q.concat([4, 5, 6, 7]).sort((a, b) => a - b)
      .map((point) => ({ id: `coatom-${point}`, relation: `ker(f_${point})`, role: "index-two coatom below thin" })),
    { id: "thin", relation: "A", role: "terminal displayed policy" },
  ];
  assert.equal(nodes.length, 9);
  const arrows = nodes.map(({ id }) => ({ from: id, to: id, kind: "identity" }));
  for (let point = 1; point < 8; point += 1) {
    arrows.push({ from: "free", to: `coatom-${point}`, kind: "quotient" });
    arrows.push({ from: `coatom-${point}`, to: "thin", kind: "quotient" });
  }
  arrows.push({ from: "free", to: "thin", kind: "composite quotient" });
  assert.equal(arrows.length, 24);
  const arrowKey = ({ from, to }) => `${from}->${to}`;
  assert.equal(new Set(arrows.map(arrowKey)).size, arrows.length);
  let compositionChecks = 0;
  for (let point = 1; point < 8; point += 1) {
    assert(arrows.some(({ from, to }) => from === "free" && to === `coatom-${point}`));
    assert(arrows.some(({ from, to }) => from === `coatom-${point}` && to === "thin"));
    assert(arrows.some(({ from, to }) => from === "free" && to === "thin"));
    compositionChecks += 1;
  }
  for (let left = 1; left < 8; left += 1) {
    for (let right = left + 1; right < 8; right += 1) {
      assert(!arrows.some(({ from, to }) => (
        (from === `coatom-${left}` && to === `coatom-${right}`)
        || (from === `coatom-${right}` && to === `coatom-${left}`)
      )));
    }
  }
  return {
    nodes,
    arrows,
    compositionChecks,
    distinctDisplayedCoatomsIncomparable: true,
    FanoIncidenceIsNotPolicyMorphisms: true,
  };
}

function policyCoordinates(point) {
  return {
    eta: point & 1,
    alpha: (point >> 1) & 1,
    beta: (point >> 2) & 1,
  };
}

function makeThinPolicy() {
  return {
    point: 0,
    name: "thin-F2",
    carrier: "C2",
    elements: [0, 1],
    zero: 0,
    add: (left, right) => left ^ right,
    neg: (value) => value,
    action: (_q, value) => value,
    boundary: (value) => value,
    kernel: [0],
  };
}

function makeCyclicPolicy(point, modulus = 4) {
  const { alpha, beta } = policyCoordinates(point);
  const characterMask = alpha | (beta << 1);
  return {
    point,
    name: `cyclic-${modulus}-chi-${characterMask}`,
    carrier: `Z/${modulus}`,
    elements: Array.from({ length: modulus }, (_, index) => index),
    zero: 0,
    add: (left, right) => mod(left + right, modulus),
    neg: (value) => mod(-value, modulus),
    action: (q, value) => (character(characterMask, q) ? mod(-value, modulus) : value),
    boundary: (value) => value & 1,
    kernel: Array.from({ length: modulus / 2 }, (_, index) => 2 * index),
    characterMask,
  };
}

function makeTransvectionPolicy(point) {
  const { alpha, beta } = policyCoordinates(point);
  const characterMask = alpha | (beta << 1);
  assert.notEqual(characterMask, 0);
  return {
    point,
    name: `vector-C2xC2-chi-${characterMask}`,
    carrier: "C2^2",
    elements: [0, 1, 2, 3],
    zero: 0,
    add: (left, right) => left ^ right,
    neg: (value) => value,
    action: (q, value) => value ^ (2 * ((value & 1) & character(characterMask, q))),
    boundary: (value) => value & 1,
    kernel: [0, 2],
    characterMask,
  };
}

function makeShellPolicy(point) {
  if (point === 0) return makeThinPolicy();
  return (point & 1) ? makeCyclicPolicy(point) : makeTransvectionPolicy(point);
}

function zeroTable() {
  return Q.map(() => Q.map(() => 0));
}

function tableKey(table) {
  return table.map((row) => row.join(",")).join(";");
}

function deltaOne(policy, cochain, g, h) {
  return policy.add(
    policy.add(policy.action(g, cochain[h]), policy.neg(cochain[g ^ h])),
    cochain[g],
  );
}

function deltaTwo(policy, cochain, g, h, k) {
  return policy.add(
    policy.add(
      policy.add(policy.action(g, cochain[h][k]), policy.neg(cochain[g ^ h][k])),
      cochain[g][h ^ k],
    ),
    policy.neg(cochain[g][h]),
  );
}

function isNormalizedCocycle(policy, table) {
  for (const q of Q) if (table[0][q] !== 0 || table[q][0] !== 0) return false;
  for (const g of Q) {
    for (const h of Q) {
      for (const k of Q) if (deltaTwo(policy, table, g, h, k) !== 0) return false;
    }
  }
  return true;
}

function enumerateCompatibleCochains(policy, factor) {
  const choices = NORMALIZED_PAIRS.map(([g, h]) => (
    policy.elements.filter((value) => policy.boundary(value) === factor[g][h])
  ));
  const total = choices.reduce((product, values) => product * values.length, 1);
  const candidates = [];
  for (let code = 0; code < total; code += 1) {
    let cursor = code;
    const table = zeroTable();
    NORMALIZED_PAIRS.forEach(([g, h], index) => {
      const values = choices[index];
      table[g][h] = values[cursor % values.length];
      cursor = Math.floor(cursor / values.length);
    });
    candidates.push(table);
  }
  return candidates;
}

function normalizedKernelCochains(policy) {
  const total = policy.kernel.length ** 3;
  const cochains = [];
  for (let code = 0; code < total; code += 1) {
    let cursor = code;
    const cochain = [policy.zero];
    for (let q = 1; q < 4; q += 1) {
      cochain[q] = policy.kernel[cursor % policy.kernel.length];
      cursor = Math.floor(cursor / policy.kernel.length);
    }
    cochains.push(cochain);
  }
  return cochains;
}

function addTables(policy, left, right) {
  return Q.map((g) => Q.map((h) => policy.add(left[g][h], right[g][h])));
}

function coboundaryTable(policy, cochain) {
  return Q.map((g) => Q.map((h) => deltaOne(policy, cochain, g, h)));
}

function enumerateLiftFiber(policy, factor) {
  const candidates = enumerateCompatibleCochains(policy, factor);
  const lifts = candidates.filter((table) => isNormalizedCocycle(policy, table));
  const liftByKey = new Map(lifts.map((table) => [tableKey(table), table]));
  const gauges = normalizedKernelCochains(policy).map((cochain) => coboundaryTable(policy, cochain));
  const distinctGaugeCount = new Set(gauges.map(tableKey)).size;
  const zeroGaugeKey = tableKey(zeroTable());
  const gaugeStabilizerSize = gauges.filter((gauge) => tableKey(gauge) === zeroGaugeKey).length;
  const components = [];
  const componentByKey = new Map();
  for (const lift of lifts) {
    const key = tableKey(lift);
    if (componentByKey.has(key)) continue;
    const memberKeys = [...new Set(gauges.map((gauge) => {
      const imageKey = tableKey(addTables(policy, lift, gauge));
      assert(liftByKey.has(imageKey));
      return imageKey;
    }))].sort();
    const component = components.length;
    memberKeys.forEach((memberKey) => componentByKey.set(memberKey, component));
    components.push({ component, memberKeys });
  }
  return {
    candidates,
    lifts,
    liftByKey,
    gauges,
    distinctGaugeCount,
    gaugeStabilizerSize,
    components,
    componentByKey,
  };
}

function differenceClassCoordinates(table, base) {
  const z = Q.map((g) => Q.map((h) => {
    const difference = mod(table[g][h] - base[g][h], 4);
    assert(difference === 0 || difference === 2);
    return difference / 2;
  }));
  for (const g of Q) {
    for (const h of Q) {
      for (const k of Q) assert.equal(z[h][k] ^ z[g ^ h][k] ^ z[g][h ^ k] ^ z[g][h], 0);
    }
  }
  return [z[1][1], z[1][2] ^ z[2][1], z[2][2]];
}

function explicitIntegralLift() {
  return Q.map((g) => Q.map((h) => {
    const value = (2 * bits(g).v - 1) * bits(g).u * bits(h).v;
    return value === 0 ? 0 : value;
  }));
}

function explicitC4Lift() {
  return explicitIntegralLift().map((row) => row.map((value) => mod(value, 4)));
}

function labelSelectedFiber(fiber) {
  const base = explicitC4Lift();
  assert(fiber.liftByKey.has(tableKey(base)));
  const labels = new Map(fiber.lifts.map((lift) => [tableKey(lift), differenceClassCoordinates(lift, base)]));
  const componentLabels = fiber.components.map(({ memberKeys }) => {
    const label = labels.get(memberKeys[0]);
    assert(memberKeys.every((key) => canonical(labels.get(key)) === canonical(label)));
    return label;
  });
  assert.equal(new Set(componentLabels.map((label) => label.join(""))).size, 8);
  return { base, labels, componentLabels };
}

function auditShell(extension, invariantShell) {
  const records = [];
  const fibers = new Map();
  for (let point = 0; point < 8; point += 1) {
    const policy = makeShellPolicy(point);
    const fiber = enumerateLiftFiber(policy, extension.opFactor);
    fibers.set(point, { policy, fiber });
    const { eta, alpha, beta } = policyCoordinates(point);
    const residue = [alpha ^ eta, beta ^ eta];
    records.push({
      point,
      coordinates: [eta, alpha, beta],
      policy: policy.name,
      carrier: policy.carrier,
      characterMask: policy.characterMask ?? 0,
      residueCoordinatesInU2V_UV2: residue,
      compatibleCochains: fiber.candidates.length,
      normalizedCocycleLifts: fiber.lifts.length,
      KGaugeComponents: fiber.components.length,
    });
  }
  assert.deepEqual(records.map(({ normalizedCocycleLifts }) => normalizedCocycleLifts), [1, 0, 0, 0, 0, 0, 0, 16]);
  assert.deepEqual(records.filter(({ residueCoordinatesInU2V_UV2 }) => residueCoordinatesInU2V_UV2.every((x) => x === 0)).map(({ point }) => point), [0, 7]);
  assert.deepEqual(records.filter(({ normalizedCocycleLifts }) => normalizedCocycleLifts > 0).map(({ point }) => point), [0, 7]);
  const selected = fibers.get(7);
  assert.equal(selected.fiber.components.length, 8);
  assert(selected.fiber.components.every(({ memberKeys }) => memberKeys.length === 2));
  assert.equal(selected.fiber.gauges.length, 8);
  assert.equal(selected.fiber.distinctGaugeCount, 2);
  assert.equal(selected.fiber.gaugeStabilizerSize, 4);
  const labels = labelSelectedFiber(selected.fiber);
  const fixedBySwapUV = invariantShell.points
    .filter(({ coordinates: [eta, alpha, beta] }) => alpha === beta)
    .map(({ point }) => point);
  assert.deepEqual(fixedBySwapUV, [1, 6, 7]);
  assert.deepEqual(fixedBySwapUV.filter((point) => fibers.get(point).fiber.lifts.length > 0), [7]);
  const thinLiftKey = tableKey(fibers.get(0).fiber.lifts[0]);
  let selectedToThinPushforwardChecks = 0;
  for (const lift of selected.fiber.lifts) {
    const pushed = lift.map((row) => row.map((value) => selected.policy.boundary(value)));
    assert.equal(tableKey(pushed), thinLiftKey);
    selectedToThinPushforwardChecks += 1;
  }
  assert.equal(selectedToThinPushforwardChecks, 16);
  const nonzeroPermutations = [
    [1, 2, 3], [1, 3, 2], [2, 1, 3],
    [2, 3, 1], [3, 1, 2], [3, 2, 1],
  ];
  const basisCovariance = nonzeroPermutations.map((images) => {
    const linearMap = [0, ...images];
    assert(Q.every((left) => Q.every((right) => (
      linearMap[left ^ right] === (linearMap[left] ^ linearMap[right])
    ))));
    const transformedFactor = Q.map((g) => Q.map((h) => extension.opFactor[linearMap[g]][linearMap[h]]));
    const carriesOPFactorToPOFactor = canonical(linearMap) === canonical([0, 2, 1, 3]);
    if (carriesOPFactorToPOFactor) assert.deepEqual(transformedFactor, extension.poFactor);
    const transformedRecords = invariantShell.points.map(({ point }) => {
      const fiber = enumerateLiftFiber(makeShellPolicy(point), transformedFactor);
      return { point, lifts: fiber.lifts.length };
    });
    const inhabited = transformedRecords.filter(({ lifts }) => lifts > 0);
    assert.equal(inhabited.length, 1);
    assert.equal(inhabited[0].lifts, 16);
    assert.equal(inhabited[0].point & 1, 1);
    const anisotropic = NONZERO_Q.filter((q) => transformedFactor[q][q] === 1);
    assert.equal(anisotropic.length, 1);
    const selectedCharacter = policyCoordinates(inhabited[0].point);
    const selectedCharacterMask = selectedCharacter.alpha | (selectedCharacter.beta << 1);
    assert.equal(character(selectedCharacterMask, anisotropic[0]), 0);
    return {
      linearMap,
      anisotropicDirection: anisotropic[0],
      selectedPoint: inhabited[0].point,
      selectedCharacterMask,
      selectedLiftCount: inhabited[0].lifts,
      carriesOPFactorToPOFactor,
    };
  });
  assert.equal(basisCovariance.reduce((sum, record) => sum + record.selectedLiftCount, 0), 96);
  assert.equal(basisCovariance.filter(({ carriesOPFactorToPOFactor }) => carriesOPFactorToPOFactor).length, 1);
  return {
    records,
    fibers,
    selected,
    labels,
    residueKernel: [0, 7],
    nonzeroFixedByCoordinateSwapUV: fixedBySwapUV,
    basisCovariance,
    liftFunctorAudit: {
      quotientArrowOrientation: "L subset L' induces M/L -> M/L'",
      selectedCoatomToThinObjectPushforwards: selectedToThinPushforwardChecks,
      allPushforwardsHitTheUniqueThinLift: true,
      emptySourceArrowsVacuous: true,
    },
  };
}

function auditPredecessorCollapse() {
  const prior = runGenesisHigherQuestionQuotients();
  const candidates = prior.certificate.exhaustiveAudit.candidates;
  assert.equal(candidates.length, 27);
  const thin = candidates.filter(({ target }) => target === "C2");
  const cyclic = candidates.filter(({ target }) => target === "C4");
  const vector = candidates.filter(({ target }) => target === "C2^2");
  assert.deepEqual([thin.length, cyclic.length, vector.length], [1, 8, 18]);
  const actionMask = (candidate) => (
    (candidate.xAction.name === "identity" ? 0 : 1)
    | (candidate.yAction.name === "identity" ? 0 : 2)
  );
  const cyclicClasses = Q.map((mask) => cyclic.filter((candidate) => actionMask(candidate) === mask).length);
  const vectorClasses = NONZERO_Q.map((mask) => vector.filter((candidate) => actionMask(candidate) === mask).length);
  assert.deepEqual(cyclicClasses, [2, 2, 2, 2]);
  assert.deepEqual(vectorClasses, [6, 6, 6]);
  const aBasisColumns = [
    [2, 0, 0, 0],
    [-1, 1, 0, 0],
    [-1, 0, 1, 0],
    [-1, 0, 0, 1],
  ];
  const derivedPoints = candidates.map((candidate) => {
    const order = candidate.targetOrder;
    const add = candidate.target === "C4"
      ? (left, right) => mod(left + right, 4)
      : (left, right) => left ^ right;
    const neg = candidate.target === "C4" ? (value) => mod(-value, 4) : (value) => value;
    const policy = { zero: 0, add, neg };
    const identity = identityPermutation(order);
    const xAction = candidate.xAction.images;
    const yAction = candidate.yAction.images;
    const actions = [identity, xAction, yAction, compose(xAction, yAction)];
    const distinguished = Number(candidate.id.match(/\|b=(\d+)$/)[1]);
    const orbitImages = actions.map((action) => action[distinguished]);
    const boundary = candidate.boundary.split("").map(Number);
    assert(orbitImages.every((value) => boundary[value] === 1));
    const kernelElements = Array.from({ length: order }, (_, value) => value)
      .filter((value) => boundary[value] === 0);
    assert.equal(kernelElements.length, order / 2);
    const kernelGenerator = kernelElements.find((value) => value !== 0);
    const functional = aBasisColumns.map((column) => {
      const image = imageOfRegularVector(policy, orbitImages, column);
      assert(image === 0 || image === kernelGenerator);
      return image === kernelGenerator ? 1 : 0;
    });
    assert.equal(functional[3], functional[1] ^ functional[2]);
    return functional[0] | (functional[1] << 1) | (functional[2] << 2);
  });
  const actualKernelClassMultiplicities = Object.fromEntries(
    Q.concat([4, 5, 6, 7]).sort((a, b) => a - b)
      .map((point) => [point, derivedPoints.filter((candidatePoint) => candidatePoint === point).length]),
  );
  assert.deepEqual(actualKernelClassMultiplicities, {
    0: 1, 1: 2, 2: 6, 3: 2, 4: 6, 5: 2, 6: 6, 7: 2,
  });
  return {
    priorCertificateDigest: prior.certificate.certificateDigest,
    rawPointedCandidates: candidates.length,
    rawByCarrier: { C2: thin.length, C4: cyclic.length, C2xC2: vector.length },
    canonicalKernelClasses: { thin: 1, cyclic: 4, transvection: 3, total: 8 },
    presentationMultiplicities: { cyclic: cyclicClasses, transvection: vectorClasses },
    actualKernelClassMultiplicities,
    candidateOrbitMapsClassifiedByInducedFunctional: true,
    duplicatePointingsDoNotCreatePolicies: true,
  };
}

function auditFreeControl(opFactor) {
  const t = 3;
  const e0 = [1, 0, 0, 0];
  const et = [0, 0, 0, 1];
  const lifted = Q.map((g) => Q.map((h) => e0.map((value) => value * opFactor[g][h])));
  const actRegular = (q, value) => Q.map((index) => value[index ^ q]);
  const kappa = Q.map((index) => (
    actRegular(t, lifted[t][t])[index] - lifted[0][t][index]
    + lifted[t][0][index] - lifted[t][t][index]
  ));
  assert.deepEqual(kappa, et.map((value, index) => value - e0[index]));
  const target = kappa.map((value) => mod(value, 2));
  const solutions = Array.from({ length: 16 }, (_, mask) => Q.map((index) => (mask >> index) & 1))
    .filter((candidate) => Q.every((index) => (candidate[index ^ t] ^ candidate[index]) === target[index]));
  assert.equal(solutions.length, 4);
  assert(solutions.every((candidate) => candidate.reduce((sum, bit) => sum ^ bit, 0) === 1));
  return {
    carrier: "Z[Q] regular",
    parityPatternsChecked: 16,
    unrestrictedMod2ParityEquationSolutions: 4,
    evenAugmentationSolutions: 0,
    normalizedLiftFiberEmpty: true,
  };
}

function integerDeltaTwo(characterMask, table, g, h, k) {
  const action = (q, value) => (character(characterMask, q) ? -value : value);
  return action(g, table[h][k]) - table[g ^ h][k] + table[g][h ^ k] - table[g][h];
}

function auditIntegralBranch(extension, selectedFiber) {
  const integral = explicitIntegralLift();
  let parityChecks = 0;
  let cocycleChecks = 0;
  for (const g of Q) {
    for (const h of Q) {
      assert.equal(mod(integral[g][h], 2), extension.opFactor[g][h]);
      parityChecks += 1;
      for (const k of Q) {
        assert.equal(integerDeltaTwo(3, integral, g, h, k), 0);
        cocycleChecks += 1;
      }
    }
  }
  assert.deepEqual(integral.map((row) => row.map((value) => mod(value, 4))), selectedFiber.labels.base);
  const c6Policy = makeCyclicPolicy(7, 6);
  const c6Fiber = enumerateLiftFiber(c6Policy, extension.opFactor);
  assert.equal(c6Fiber.candidates.length, 19683);
  assert.equal(c6Fiber.lifts.length, 9);
  assert.equal(c6Fiber.components.length, 1);
  assert.equal(c6Fiber.gauges.length, 27);
  assert.equal(c6Fiber.distinctGaugeCount, 9);
  assert.equal(c6Fiber.gaugeStabilizerSize, 3);
  return {
    policy: "Z_chi with chi=u+v",
    formula: "F_inf(g,h)=(2v(g)-1)u(g)v(h)",
    table: integral,
    parityChecks,
    integerCocycleChecks: cocycleChecks,
    reducesToEveryEvenCyclicSignPolicy: true,
    C4IsFirstNullifier: false,
    C6OddPaddingControl: {
      compatibleCochains: c6Fiber.candidates.length,
      normalizedCocycleLifts: c6Fiber.lifts.length,
      normalizedKGaugeCochains: c6Fiber.gauges.length,
      distinctKOneCoboundaries: c6Fiber.distinctGaugeCount,
      normalizedGaugeStabilizerSize: c6Fiber.gaugeStabilizerSize,
      KGaugeComponents: c6Fiber.components.length,
      componentHolonomyRank: 0,
    },
    C4Role: "coarsest noncontractible cyclic-sign quotient before thin collapse",
    C4RoleStatus: "theorem-derived from cyclic sign cohomology; executable controls cover C2, C4, C6, and C8",
  };
}

function auditSplitControl() {
  const splitFactor = zeroTable();
  const records = [1, 3, 5, 7].map((point) => {
    const fiber = enumerateLiftFiber(makeCyclicPolicy(point), splitFactor);
    return {
      point,
      characterMask: makeCyclicPolicy(point).characterMask,
      normalizedCocycleLifts: fiber.lifts.length,
      KGaugeComponents: fiber.components.length,
    };
  });
  assert(records.every(({ normalizedCocycleLifts }) => normalizedCocycleLifts === 16));
  assert(records.every(({ KGaugeComponents }) => KGaugeComponents === 8));
  assert.equal(records.reduce((sum, record) => sum + record.normalizedCocycleLifts, 0), 64);
  return {
    records,
    totalCyclicSignLifts: 64,
    uniquePolicySelectedBySplitClass: false,
    heldPolicyLoopsWouldBeOuterMarkedAutomorphismsNotConcreteInnerD8Loops: true,
  };
}

function factorAutomorphismCochain(section, center, quotientElement) {
  const conjugator = section[quotientElement];
  return Q.map((q) => {
    const conjugated = compose(conjugator, compose(section[q], inversePermutation(conjugator)));
    if (permutationEqual(conjugated, section[q])) return 0;
    assert(permutationEqual(conjugated, compose(center, section[q])));
    return 1;
  });
}

function auditTowerAndHolonomy(extension, selected) {
  const c4 = selected.selected.policy;
  const c4Fiber = selected.selected.fiber;
  const c4Labels = selected.labels.labels;
  const c8 = makeCyclicPolicy(7, 8);
  const c8Fiber = enumerateLiftFiber(c8, extension.opFactor);
  assert.equal(c8Fiber.candidates.length, 262144);
  assert.equal(c8Fiber.lifts.length, 64);
  assert.equal(c8Fiber.components.length, 8);
  assert(c8Fiber.components.every(({ memberKeys }) => memberKeys.length === 8));
  assert.equal(c8Fiber.gauges.length, 64);
  assert.equal(c8Fiber.distinctGaugeCount, 8);
  assert.equal(c8Fiber.gaugeStabilizerSize, 8);
  const reducedCounts = new Map();
  for (const lift of c8Fiber.lifts) {
    const reduced = lift.map((row) => row.map((value) => mod(value, 4)));
    const key = tableKey(reduced);
    assert(c4Fiber.liftByKey.has(key));
    reducedCounts.set(key, (reducedCounts.get(key) ?? 0) + 1);
  }
  assert.equal(reducedCounts.size, 4);
  assert([...reducedCounts.values()].every((count) => count === 16));
  const transitionLabels = [...new Set([...reducedCounts.keys()].map((key) => c4Labels.get(key).join("")))].sort();
  assert.deepEqual(transitionLabels, ["000", "010"]);
  const componentSet = new Set([...reducedCounts.keys()].map((key) => c4Fiber.componentByKey.get(key)));
  assert.equal(componentSet.size, 2);
  for (const component of componentSet) {
    assert(c4Fiber.components[component].memberKeys.every((key) => reducedCounts.has(key)));
  }
  const C8ComponentImageLabels = c8Fiber.components.map(({ memberKeys }) => {
    const imageLabels = new Set(memberKeys.map((key) => {
      const lift = c8Fiber.liftByKey.get(key);
      const reducedKey = tableKey(lift.map((row) => row.map((value) => mod(value, 4))));
      return c4Labels.get(reducedKey).join("");
    }));
    assert.equal(imageLabels.size, 1);
    return [...imageLabels][0];
  });
  assert.deepEqual(
    Object.fromEntries(transitionLabels.map((label) => [label, C8ComponentImageLabels.filter((item) => item === label).length])),
    { "000": 4, "010": 4 },
  );

  const concrete = Q.map((q) => (q === 0
    ? [0, 0, 0, 0]
    : factorAutomorphismCochain(extension.opSection, extension.center, q)));
  assert.deepEqual(concrete[1], Q.map((q) => character(2, q)));
  assert.deepEqual(concrete[2], Q.map((q) => character(1, q)));
  assert.deepEqual(concrete[3], Q.map((q) => character(3, q)));
  const expectedShifts = ["000", "010", "010", "000"];
  const loopRecords = concrete.map((cochain, conjugator) => {
    const lifted = cochain;
    const gauge = coboundaryTable(c4, lifted);
    let commonShift;
    for (const table of c4Fiber.lifts) {
      const image = addTables(c4, table, gauge);
      const left = c4Labels.get(tableKey(table));
      const right = c4Labels.get(tableKey(image));
      const shift = left.map((value, index) => value ^ right[index]).join("");
      if (commonShift === undefined) commonShift = shift;
      else assert.equal(shift, commonShift);
    }
    assert.equal(commonShift, expectedShifts[conjugator]);
    const inducedCharacterMask = Q.find((mask) => (
      Q.every((q) => cochain[q] === character(mask, q))
    ));
    assert.notEqual(inducedCharacterMask, undefined);
    return {
      conjugator,
      quotientCoordinates: bits(conjugator),
      inducedCharacterMask,
      cochain,
      componentShift: commonShift,
    };
  });
  const holonomyLine = [...new Set(loopRecords.map(({ componentShift }) => componentShift))].sort();
  assert.deepEqual(holonomyLine, transitionLabels);
  const componentLabelKeys = selected.labels.componentLabels.map((label) => label.join(""));
  const seenLoopGauge = new Set();
  const loopGaugeOrbits = [];
  for (const key of componentLabelKeys) {
    if (seenLoopGauge.has(key)) continue;
    const label = key.split("").map(Number);
    const mate = label.map((value, index) => value ^ (index === 1 ? 1 : 0)).join("");
    const orbit = [key, mate].sort();
    orbit.forEach((member) => seenLoopGauge.add(member));
    loopGaugeOrbits.push(orbit);
  }
  assert.equal(loopGaugeOrbits.length, 4);

  const parityPreservingOneCochains = [];
  for (const loopMask of Q) {
    for (let kernelMask = 0; kernelMask < 8; kernelMask += 1) {
      parityPreservingOneCochains.push(Q.map((q) => (
        q === 0 ? 0 : character(loopMask, q) + 2 * ((kernelMask >> (q - 1)) & 1)
      )));
    }
  }
  assert.equal(parityPreservingOneCochains.length, 32);
  const enlargedGaugeTables = new Map(parityPreservingOneCochains.map((cochain) => {
    const table = coboundaryTable(c4, cochain);
    return [tableKey(table), table];
  }));
  assert.equal(enlargedGaugeTables.size, 4);
  const enlargedSeen = new Set();
  let enlargedComponents = 0;
  for (const lift of c4Fiber.lifts) {
    const key = tableKey(lift);
    if (enlargedSeen.has(key)) continue;
    for (const gauge of enlargedGaugeTables.values()) {
      const imageKey = tableKey(addTables(c4, lift, gauge));
      assert(c4Fiber.liftByKey.has(imageKey));
      enlargedSeen.add(imageKey);
    }
    enlargedComponents += 1;
  }
  assert.equal(enlargedComponents, 4);

  let inversionShift;
  for (const lift of c4Fiber.lifts) {
    const inverted = lift.map((row) => row.map((value) => c4.neg(value)));
    assert(c4Fiber.liftByKey.has(tableKey(inverted)));
    const left = c4Labels.get(tableKey(lift));
    const right = c4Labels.get(tableKey(inverted));
    const shift = left.map((value, index) => value ^ right[index]).join("");
    if (inversionShift === undefined) inversionShift = shift;
    else assert.equal(shift, inversionShift);
  }
  assert.equal(inversionShift, "010");
  return {
    C8: {
      compatibleCochains: c8Fiber.candidates.length,
      normalizedCocycleLifts: c8Fiber.lifts.length,
      KGaugeComponents: c8Fiber.components.length,
      normalizedKGaugeCochains: c8Fiber.gauges.length,
      distinctKOneCoboundaries: c8Fiber.distinctGaugeCount,
      normalizedGaugeStabilizerSize: c8Fiber.gaugeStabilizerSize,
    },
    reductionC8ToC4: {
      distinctRawImages: reducedCounts.size,
      preimagesPerRawImage: [...reducedCounts.values()].sort((a, b) => a - b),
      imageComponentCount: componentSet.size,
      imageComponentLabels: transitionLabels,
      C8ComponentsPerImageComponent: { "000": 4, "010": 4 },
    },
    concreteD8Loops: loopRecords,
    concreteHolonomyImage: holonomyLine,
    C8ToC4ImageEqualsConcreteHolonomyImage: true,
    gaugeBoundary: {
      standardNormalizedKGaugeCochains: 8,
      componentsBeforeRetainedLoopsAreQuotiented: 8,
      parityPreservingBOneCochains: parityPreservingOneCochains.length,
      distinctEnlargedCoboundaryTables: enlargedGaugeTables.size,
      componentsAfterRetainedLoopsAreTreatedAsGauge: enlargedComponents,
      holonomyDirectionSurvivesEnlargedGauge: false,
      loopGaugeOrbits,
    },
    targetInversion: {
      isPolicyPresentationEquivalence: true,
      componentShift: inversionShift,
      exchangesC8ExtendableAffinePoints: true,
      canonicalOriginSelected: false,
    },
    generalTransition: {
      status: "theorem-derived; executable census here covers C4 and C8",
      componentCoordinates: "(a,b,c) maps to (0,b,0)",
      inverseLimitComponentCore: "affine F2 line in the uv direction",
      pi1Image: "span(u+v)",
      pi2Map: "zero",
    },
  };
}

function buildLaboratory() {
  const extension = buildConcreteExtension();
  const invariantShell = buildInvariantDualShell();
  const displayedPolicyCategory = buildDisplayedPolicyCategory();
  const predecessor = auditPredecessorCollapse();
  const shell = auditShell(extension, invariantShell);
  const free = auditFreeControl(extension.opFactor);
  const integral = auditIntegralBranch(extension, shell);
  const split = auditSplitControl();
  const tower = auditTowerAndHolonomy(extension, shell);
  return {
    extension,
    invariantShell,
    displayedPolicyCategory,
    predecessor,
    shell,
    free,
    integral,
    split,
    tower,
  };
}

function buildCertificate(lab) {
  const body = {
    schema: "oasis.genesis-policy-lift-diagram.certificate.v1",
    sourceInstance: {
      builderSchema: lab.extension.input.schema,
      stateCountPerChart: 8,
      opActionDigests: {
        a: digest(lab.extension.input.charts.OP.actions.a),
        b: digest(lab.extension.input.charts.OP.actions.b),
      },
      concreteGroupOrder: lab.extension.opGroup.length,
      concreteGroup: "D8",
      opFactorSet: lab.extension.opFactor,
      opClass: "c=u cup v",
      derivedDirectlyFromConcretePermutationInstance: true,
    },
    invariantDualShell: {
      universalRelationPair: "A=ker(augmentation mod 2) inside M=Z[Q]",
      intrinsicDual: "Hom_Q(A,F2)",
      aBasisColumns: lab.invariantShell.aBasisColumns,
      qActionMatricesMod2: lab.invariantShell.actionMatrices,
      dimension: lab.invariantShell.invariantDualDimension,
      points: lab.invariantShell.points,
      FanoLines: lab.invariantShell.lines,
      FanoIncidences: lab.invariantShell.incidenceCount,
      unorderedPointPairsCoveredExactlyOnce: lab.invariantShell.unorderedPointPairsCoveredExactlyOnce,
      displayedPolicyCategory: lab.displayedPolicyCategory,
      undisplayedPoliciesBetweenFreeAndCoatomsExist: true,
      variance: "quotient arrows push cocycle lifts covariantly",
    },
    predecessorPresentationCollapse: lab.predecessor,
    liftDiagram: {
      residueFormula: "R_c(eta,alpha,beta)=(alpha+eta)u^2v+(beta+eta)uv^2",
      residueFormulaStatus: "theorem-derived from the connecting-map calculation; this executable audits its zero locus against exhaustive lift existence",
      records: lab.shell.records,
      residueKernelIncludingThin: lab.shell.residueKernel,
      uniqueLiftableNonthinIndexTwoKernelPoint: 7,
      selectedCoordinates: [1, 1, 1],
      selectedPolicy: "C4 with chi=u+v",
      selectedFiber: {
        normalizedCocycleLifts: lab.shell.selected.fiber.lifts.length,
        KGaugeComponents: lab.shell.selected.fiber.components.length,
        normalizedKGaugeCochains: lab.shell.selected.fiber.gauges.length,
        distinctKOneCoboundaries: lab.shell.selected.fiber.distinctGaugeCount,
        normalizedGaugeStabilizerSize: lab.shell.selected.fiber.gaugeStabilizerSize,
        objectsPerComponent: lab.shell.selected.fiber.components.map(({ memberKeys }) => memberKeys.length),
        componentLabels: lab.shell.labels.componentLabels,
        componentLabelSpace: "H^2(Q,F2)=<u^2,uv,v^2>",
      },
      nonzeroPolicyPointsFixedUnderCoordinateSwapUV: lab.shell.nonzeroFixedByCoordinateSwapUV,
      uniqueLiftableNonthinPointAmongThoseFixed: 7,
      coordinateSwapCarriesOPFactorToPOFactor: lab.shell.basisCovariance
        .some(({ carriesOPFactorToPOFactor }) => carriesOPFactorToPOFactor),
      liftFunctorAudit: lab.shell.liftFunctorAudit,
      allSixGL2BasisChanges: lab.shell.basisCovariance,
      totalSelectedLiftsAcrossSixBasisChanges: 96,
    },
    alternativeFamilyAblation: {
      freeRegularPolicy: lab.free,
      integralSignBranch: lab.integral,
      splitExtensionControl: lab.split,
      C4GloballyUniqueNullifier: false,
      arbitraryNoncyclicTwoPrimaryPoliciesClassified: false,
    },
    twoLevelTowerAndDerivedPersistence: lab.tower,
    theoremBoundary: {
      indexTwoKernelShellClassified: true,
      FanoIncidenceConstructed: true,
      actualEightStateSourceUsed: true,
      uniqueLiftableNonthinPolicyInsideIndexTwoKernelShell: true,
      residueFormulaIndependentlyDerivedByThisExecutable: false,
      C8ToC4RankOneImageMatchesConcreteD8Holonomy: true,
      allLevelPersistentCoreExecuted: false,
      allPolicyPresentationsOrFullRelationLatticeClassified: false,
      C4IsFirstOrGloballyUniqueNullifier: false,
      generalTwoAdicTransitionFormulaFullyEnumeratedAtAllLevels: false,
      cyclicSignCohomologyFormulaProofEncodedInThisExecutable: false,
      fixedPolicyDiagramItselfIsNewMathematics: false,
      endogenousSemanticAdmissionLawEstablished: false,
      treatingConcreteLoopsAsGaugeWouldEraseTheDirection: true,
      autonomousNextQuestionLawEstablished: false,
      nonSoficityOrAIArchitectureEstablished: false,
      hodgeNavierStokesCollatzOrRiemannConsequenceEstablished: false,
      noveltyOrNoPriorArtEstablished: false,
    },
  };
  return { ...body, certificateDigest: digest(body) };
}

function buildRun() {
  const lab = buildLaboratory();
  return {
    schema: "oasis.genesis-policy-lift-diagram.v1",
    status: "PASS",
    result: {
      source: "actual eight-state D8 interchange instance",
      invariantDualDimension: 3,
      indexTwoKernelPolicies: 7,
      uniqueLiftableNonthinIndexTwoKernelPolicy: "(eta,chi)=(1,u+v)",
      selectedC4Lifts: 16,
      selectedC4Components: 8,
      C8Lifts: 64,
      C8ToC4ComponentImageRank: 1,
      concreteHolonomyImageRank: 1,
      C8ToC4ImageEqualsConcreteHolonomyImage: true,
      admissionLawStillOpen: true,
    },
    certificate: buildCertificate(lab),
  };
}

export function replayGenesisPolicyLiftDiagramCertificate(candidate) {
  try {
    const expected = referenceCertificateCanonical ??= canonical(buildRun().certificate);
    assert.equal(canonical(candidate), expected);
    const body = Object.fromEntries(Object.entries(candidate).filter(([key]) => key !== "certificateDigest"));
    assert.equal(candidate.certificateDigest, digest(body));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

let referenceCertificateCanonical;

function auditTamper(certificate) {
  const mutations = [
    ["source factor", (value) => { value.sourceInstance.opFactorSet[1][2] ^= 1; }],
    ["source binding", (value) => { value.sourceInstance.derivedDirectlyFromConcretePermutationInstance = false; }],
    ["dual dimension", (value) => { value.invariantDualShell.dimension = 2; }],
    ["kernel basis", (value) => { value.invariantDualShell.points[0].relationKernelBasisInRegularCoordinates[0][0] += 1; }],
    ["Fano line", (value) => { value.invariantDualShell.FanoLines[0][0] = 7; }],
    ["incidence", (value) => { value.invariantDualShell.FanoIncidences = 20; }],
    ["Fano pair coverage", (value) => { value.invariantDualShell.unorderedPointPairsCoveredExactlyOnce = 20; }],
    ["raw census", (value) => { value.predecessorPresentationCollapse.rawPointedCandidates = 26; }],
    ["presentation multiplicity", (value) => { value.predecessorPresentationCollapse.presentationMultiplicities.cyclic[0] = 3; }],
    ["residue", (value) => { value.liftDiagram.records[7].residueCoordinatesInU2V_UV2[0] = 1; }],
    ["shell lift", (value) => { value.liftDiagram.records[6].normalizedCocycleLifts = 1; }],
    ["selected point", (value) => { value.liftDiagram.uniqueLiftableNonthinIndexTwoKernelPoint = 1; }],
    ["component count", (value) => { value.liftDiagram.selectedFiber.KGaugeComponents = 7; }],
    ["fixed point", (value) => { value.liftDiagram.nonzeroPolicyPointsFixedUnderCoordinateSwapUV.pop(); }],
    ["basis covariance", (value) => { value.liftDiagram.allSixGL2BasisChanges[0].selectedLiftCount = 15; }],
    ["free control", (value) => { value.alternativeFamilyAblation.freeRegularPolicy.normalizedLiftFiberEmpty = false; }],
    ["integral cocycle", (value) => { value.alternativeFamilyAblation.integralSignBranch.table[1][2] += 1; }],
    ["C4 overclaim", (value) => { value.alternativeFamilyAblation.C4GloballyUniqueNullifier = true; }],
    ["C8 count", (value) => { value.twoLevelTowerAndDerivedPersistence.C8.normalizedCocycleLifts = 63; }],
    ["raw transition image", (value) => { value.twoLevelTowerAndDerivedPersistence.reductionC8ToC4.distinctRawImages = 2; }],
    ["component transition image", (value) => { value.twoLevelTowerAndDerivedPersistence.reductionC8ToC4.imageComponentLabels = ["000"]; }],
    ["loop cochain", (value) => { value.twoLevelTowerAndDerivedPersistence.concreteD8Loops[1].cochain[1] ^= 1; }],
    ["holonomy collision", (value) => { value.twoLevelTowerAndDerivedPersistence.C8ToC4ImageEqualsConcreteHolonomyImage = false; }],
    ["gauge enlargement", (value) => { value.twoLevelTowerAndDerivedPersistence.gaugeBoundary.componentsAfterRetainedLoopsAreTreatedAsGauge = 8; }],
    ["target inversion origin", (value) => { value.twoLevelTowerAndDerivedPersistence.targetInversion.canonicalOriginSelected = true; }],
    ["full lattice overclaim", (value) => { value.theoremBoundary.allPolicyPresentationsOrFullRelationLatticeClassified = true; }],
    ["admission overclaim", (value) => { value.theoremBoundary.endogenousSemanticAdmissionLawEstablished = true; }],
    ["open problem overclaim", (value) => { value.theoremBoundary.hodgeNavierStokesCollatzOrRiemannConsequenceEstablished = true; }],
    ["digest", (value) => { value.certificateDigest = "0".repeat(64); }],
    ["extra field", (value) => { value.extra = true; }],
  ];
  const cases = mutations.map(([name, mutate]) => {
    const candidate = clone(certificate);
    mutate(candidate);
    return { name, rejected: !replayGenesisPolicyLiftDiagramCertificate(candidate).ok };
  });
  assert(cases.every(({ rejected }) => rejected));
  return { attempted: cases.length, rejected: cases.filter(({ rejected }) => rejected).length, cases };
}

export function runGenesisPolicyLiftDiagram() {
  const run = buildRun();
  referenceCertificateCanonical = canonical(run.certificate);
  return { ...run, tamper: auditTamper(run.certificate) };
}

function printSummary(run) {
  console.log("PASS concrete source: actual eight-state D8 interchange factor c=u cup v");
  console.log("PASS invariant shell: Hom_Q(A,F2)=F2^3 with 7 Fano points and 7 lines");
  console.log("PASS lift diagram: only thin and (eta,chi)=(1,u+v) are inhabited");
  console.log("PASS alternative branch: integral lift exists; C4 is not globally first or unique");
  console.log("PASS two-level collision: C8->C4 image is the same rank-one line as D8 loop holonomy");
  console.log(`PASS replay/tamper: ${run.tamper.rejected}/${run.tamper.attempted} mutations rejected`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = runGenesisPolicyLiftDiagram();
  printSummary(run);
  console.log(JSON.stringify(run, null, 2));
}
