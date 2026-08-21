import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import { buildGenesisInterchangeTransductionInput } from "./genesis-interchange-square.mjs";

const Q = Object.freeze([0, 1, 2, 3]);
const NONZERO_Q = Object.freeze([1, 2, 3]);

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

function mod4(value) {
  return ((value % 4) + 4) % 4;
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

function bits(q) {
  return { u: q & 1, v: (q >> 1) & 1 };
}

function character(mask, q) {
  const { u, v } = bits(q);
  return ((mask & 1) ? u : 0) ^ ((mask & 2) ? v : 0);
}

function actionB(characterMask, q, value) {
  return character(characterMask, q) === 0 ? mod4(value) : mod4(-value);
}

function zeroTable() {
  return Q.map(() => Q.map(() => 0));
}

function tableKey(table) {
  return table.flat().join("");
}

function addTables(left, right) {
  return Q.map((g) => Q.map((h) => mod4(left[g][h] + right[g][h])));
}

function deltaOneB(characterMask, cochain, g, h) {
  return mod4(actionB(characterMask, g, cochain[h]) - cochain[g ^ h] + cochain[g]);
}

function deltaTwoB(characterMask, cochain, g, h, k) {
  return mod4(
    actionB(characterMask, g, cochain[h][k])
    - cochain[g ^ h][k]
    + cochain[g][h ^ k]
    - cochain[g][h],
  );
}

function deltaOneTable(characterMask, cochain) {
  return Q.map((g) => Q.map((h) => deltaOneB(characterMask, cochain, g, h)));
}

function isNormalizedCocycle(characterMask, table) {
  for (const q of Q) {
    if (table[0][q] !== 0 || table[q][0] !== 0) return false;
  }
  for (const g of Q) {
    for (const h of Q) {
      for (const k of Q) {
        if (deltaTwoB(characterMask, table, g, h, k) !== 0) return false;
      }
    }
  }
  return true;
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
  const table = zeroTable();
  for (const left of Q) {
    for (const right of Q) {
      const product = compose(section[right], section[left]);
      const target = section[left ^ right];
      if (permutationEqual(product, target)) table[left][right] = 0;
      else {
        assert(permutationEqual(product, compose(center, target)));
        table[left][right] = 1;
      }
    }
  }
  return table;
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
  const poSectionRaw = deriveSection(poGroup, po.coordinates, poCenter);
  const poSection = poSectionRaw.map((element) => transport(element, theta0));
  const opFactor = factorSet(opSection, center);
  const poFactor = factorSet(poSection, center);
  for (const g of Q) {
    for (const h of Q) {
      const left = bits(g);
      const right = bits(h);
      assert.equal(opFactor[g][h], left.u & right.v);
      assert.equal(poFactor[g][h], left.v & right.u);
    }
  }
  return {
    input,
    opGroup,
    center,
    theta0,
    opSection,
    poSection,
    opFactor,
    poFactor,
  };
}

function enumerateParityCompatibleCochains(factor) {
  const pairs = NONZERO_Q.flatMap((g) => NONZERO_Q.map((h) => [g, h]));
  assert.equal(pairs.length, 9);
  const result = [];
  for (let mask = 0; mask < 512; mask += 1) {
    const table = zeroTable();
    pairs.forEach(([g, h], index) => {
      table[g][h] = factor[g][h] + 2 * ((mask >> index) & 1);
    });
    result.push(table);
  }
  return result;
}

function normalizedLambda(mask) {
  return Q.map((q) => (q === 0 ? 0 : ((mask >> (q - 1)) & 1)));
}

function gaugeTable(characterMask, lambda) {
  return deltaOneTable(characterMask, lambda.map((value) => 2 * value));
}

function applyGauge(characterMask, table, lambda) {
  return addTables(table, gaugeTable(characterMask, lambda));
}

function explicitOPLift() {
  return Q.map((g) => Q.map((h) => {
    const left = bits(g);
    const right = bits(h);
    return mod4((3 + 2 * left.v) * left.u * right.v);
  }));
}

function differenceClassCoordinates(table, base) {
  const z = Q.map((g) => Q.map((h) => {
    const difference = mod4(table[g][h] - base[g][h]);
    assert(difference === 0 || difference === 2);
    return difference / 2;
  }));
  for (const g of Q) {
    for (const h of Q) {
      for (const k of Q) {
        assert.equal(z[h][k] ^ z[g ^ h][k] ^ z[g][h ^ k] ^ z[g][h], 0);
      }
    }
  }
  return [z[1][1], z[1][2] ^ z[2][1], z[2][2]];
}

function enumerateLiftFiber(factor, characterMask, specifiedBase = undefined) {
  const candidates = enumerateParityCompatibleCochains(factor);
  const lifts = candidates.filter((table) => isNormalizedCocycle(characterMask, table));
  const liftKeys = new Set(lifts.map(tableKey));
  const base = specifiedBase ?? (lifts.length > 0 ? lifts[0] : undefined);
  if (base !== undefined) assert(liftKeys.has(tableKey(base)));

  const orbitByKey = new Map();
  const components = [];
  if (lifts.length > 0) {
    for (const lift of lifts) {
      const key = tableKey(lift);
      if (orbitByKey.has(key)) continue;
      const orbit = new Map();
      for (let mask = 0; mask < 8; mask += 1) {
        const image = applyGauge(characterMask, lift, normalizedLambda(mask));
        assert(liftKeys.has(tableKey(image)));
        orbit.set(tableKey(image), image);
      }
      const memberKeys = [...orbit.keys()].sort();
      const label = differenceClassCoordinates(lift, base);
      for (const memberKey of memberKeys) {
        assert.deepEqual(differenceClassCoordinates(orbit.get(memberKey), base), label);
        orbitByKey.set(memberKey, components.length);
      }
      components.push({ label, memberKeys });
    }
  }
  const labels = components.map(({ label }) => label.join(""));
  assert.equal(new Set(labels).size, labels.length);

  let stabilizerSize = 0;
  if (lifts.length > 0) {
    const first = lifts[0];
    for (let mask = 0; mask < 8; mask += 1) {
      if (tableKey(applyGauge(characterMask, first, normalizedLambda(mask))) === tableKey(first)) {
        stabilizerSize += 1;
      }
    }
  }
  return {
    candidates,
    lifts,
    liftKeys,
    base,
    components,
    orbitByKey,
    stabilizerSize,
  };
}

function auditPolicySelection(opFactor) {
  const records = Q.map((characterMask) => {
    const fiber = enumerateLiftFiber(opFactor, characterMask, characterMask === 3 ? explicitOPLift() : undefined);
    return {
      characterMask,
      character: [character(characterMask, 1), character(characterMask, 2)],
      candidates: fiber.candidates.length,
      cocycleLifts: fiber.lifts.length,
    };
  });
  assert.deepEqual(records.map(({ cocycleLifts }) => cocycleLifts), [0, 0, 0, 16]);
  const squareForm = Q.map((q) => opFactor[q][q]);
  assert.deepEqual(squareForm, [0, 0, 0, 1]);
  const anisotropic = Q.filter((q) => squareForm[q] === 1);
  assert.deepEqual(anisotropic, [3]);
  const nonzeroCharactersVanishingOnAnisotropic = NONZERO_Q.filter((mask) => character(mask, 3) === 0);
  assert.deepEqual(nonzeroCharactersVanishingOnAnisotropic, [3]);
  return {
    records,
    squareForm,
    uniqueAnisotropicDirection: [1, 1],
    uniqueNonzeroCharacterVanishingThere: [1, 1],
    uniqueLiftableSignPolicyMask: 3,
  };
}

function auditFreeFillerNoLift(opFactor) {
  const t = 3;
  const e0 = [1, 0, 0, 0];
  const et = [0, 0, 0, 1];
  const lifted = Q.map((g) => Q.map((h) => e0.map((value) => value * opFactor[g][h])));
  const actRegular = (q, value) => Q.map((index) => value[index ^ q]);
  const kappaTTT = Q.map((index) => (
    actRegular(t, lifted[t][t])[index]
    - lifted[0][t][index]
    + lifted[t][0][index]
    - lifted[t][t][index]
  ));
  assert.deepEqual(kappaTTT, et.map((value, index) => value - e0[index]));
  const targetMod2 = kappaTTT.map((value) => mod4(value) & 1);
  const parityPatterns = Array.from({ length: 16 }, (_, mask) => (
    Q.map((index) => (mask >> index) & 1)
  ));
  const equationSolutions = parityPatterns.filter((candidate) => (
    Q.every((index) => (candidate[index ^ t] ^ candidate[index]) === targetMod2[index])
  ));
  assert.equal(equationSolutions.length, 4);
  assert(equationSolutions.every((candidate) => (
    candidate.reduce((sum, bit) => sum ^ bit, 0) === 1
  )));
  const evenAugmentationSolutions = equationSolutions.filter((candidate) => (
    candidate.reduce((sum, bit) => sum ^ bit, 0) === 0
  ));
  assert.equal(evenAugmentationSolutions.length, 0);
  return {
    coefficientCarrier: "Z[Q] with regular action",
    restrictedKappa: kappaTTT,
    parityPatternsChecked: parityPatterns.length,
    unrestrictedEquationSolutionsMod2: equationSolutions.length,
    evenAugmentationEquationSolutionsMod2: evenAugmentationSolutions.length,
    everyEquationSolutionHasOddAugmentation: true,
    parityObstructionForEvenAugmentationPrimitive: true,
    connectingClassNonzero: true,
    normalizedCocycleLiftFiberEmpty: true,
  };
}

function auditSelectedFiber(opFactor) {
  const base = explicitOPLift();
  assert(isNormalizedCocycle(3, base));
  for (const g of Q) for (const h of Q) assert.equal(base[g][h] & 1, opFactor[g][h]);
  const fiber = enumerateLiftFiber(opFactor, 3, base);
  assert.equal(fiber.candidates.length, 512);
  assert.equal(fiber.lifts.length, 16);
  assert.equal(fiber.components.length, 8);
  assert(fiber.components.every(({ memberKeys }) => memberKeys.length === 2));
  assert.equal(fiber.stabilizerSize, 4);
  for (const q of Q) assert.equal(actionB(3, q, 2), 2);
  const KZeroCochains = [0, 2];
  const zeroCoboundaries = KZeroCochains.map((value) => (
    Q.map((q) => mod4(actionB(3, q, value) - value))
  ));
  assert(zeroCoboundaries.every((cochain) => cochain.every((value) => value === 0)));
  fiber.KZeroCochainCount = KZeroCochains.length;
  fiber.KZeroCoboundaryCount = new Set(zeroCoboundaries.map((cochain) => cochain.join(""))).size;
  assert.equal(fiber.KZeroCoboundaryCount, 1);
  assert.deepEqual(new Set(fiber.components.map(({ label }) => label.join(""))), new Set([
    "000", "001", "010", "011", "100", "101", "110", "111",
  ]));
  return fiber;
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

function componentLabelMap(fiber) {
  return new Map(fiber.lifts.map((lift) => [
    tableKey(lift),
    differenceClassCoordinates(lift, fiber.base),
  ]));
}

function xorLabels(left, right) {
  return left.map((value, index) => value ^ right[index]);
}

function auditLoopHolonomy(extension, fiber) {
  const concreteLoops = {
    0: [0, 0, 0, 0],
    1: factorAutomorphismCochain(extension.opSection, extension.center, 1),
    2: factorAutomorphismCochain(extension.opSection, extension.center, 2),
    3: factorAutomorphismCochain(extension.opSection, extension.center, 3),
  };
  assert.deepEqual(concreteLoops[1], Q.map((q) => character(2, q)));
  assert.deepEqual(concreteLoops[2], Q.map((q) => character(1, q)));
  assert.deepEqual(concreteLoops[3], Q.map((q) => character(3, q)));
  const concreteLoopByCharacter = {
    0: { conjugator: 0, cochain: concreteLoops[0] },
    1: { conjugator: 2, cochain: concreteLoops[2] },
    2: { conjugator: 1, cochain: concreteLoops[1] },
    3: { conjugator: 3, cochain: concreteLoops[3] },
  };

  const labels = componentLabelMap(fiber);
  const expectedShifts = {
    0: [0, 0, 0],
    1: [0, 1, 0],
    2: [0, 1, 0],
    3: [0, 0, 0],
  };
  const records = [];
  for (const loopMask of Q) {
    const { conjugator, cochain: liftedLoop } = concreteLoopByCharacter[loopMask];
    assert.deepEqual(liftedLoop, Q.map((q) => character(loopMask, q)));
    const loopCoboundary = deltaOneTable(3, liftedLoop);
    assert(loopCoboundary.flat().every((value) => value === 0 || value === 2));
    let commonShift;
    for (const lift of fiber.lifts) {
      const image = addTables(lift, loopCoboundary);
      assert(fiber.liftKeys.has(tableKey(image)));
      const shift = xorLabels(labels.get(tableKey(lift)), labels.get(tableKey(image)));
      if (commonShift === undefined) commonShift = shift;
      else assert.deepEqual(shift, commonShift);
    }
    assert.deepEqual(commonShift, expectedShifts[loopMask]);
    records.push({
      loopMask,
      concreteConjugator: bits(conjugator),
      loop: [character(loopMask, 1), character(loopMask, 2)],
      coboundaryDigest: digest(loopCoboundary),
      componentShift: commonShift,
      endpointFactorTableUnchanged: true,
      selectedResidueRemainsZero: true,
    });
  }

  let compositionChecks = 0;
  for (const leftMask of Q) {
    for (const rightMask of Q) {
      const left = concreteLoopByCharacter[leftMask].cochain;
      const right = concreteLoopByCharacter[rightMask].cochain;
      const direct = concreteLoopByCharacter[leftMask ^ rightMask].cochain;
      const carry = Q.map((q) => 2 * (left[q] & right[q]));
      const sequentialCoboundary = addTables(deltaOneTable(3, left), deltaOneTable(3, right));
      const directWithCarry = addTables(deltaOneTable(3, direct), deltaOneTable(3, carry));
      assert.deepEqual(sequentialCoboundary, directWithCarry);
      for (const lift of fiber.lifts) {
        assert.deepEqual(addTables(lift, sequentialCoboundary), addTables(lift, directWithCarry));
        compositionChecks += 1;
      }
    }
  }

  const componentKeys = fiber.components.map(({ label }) => label.join(""));
  const holonomyOrbits = [];
  const seen = new Set();
  for (const key of componentKeys) {
    if (seen.has(key)) continue;
    const label = key.split("").map(Number);
    const mate = xorLabels(label, [0, 1, 0]).join("");
    const orbit = [key, mate].sort();
    orbit.forEach((member) => seen.add(member));
    holonomyOrbits.push(orbit);
  }
  assert.equal(holonomyOrbits.length, 4);
  return {
    concreteInnerAutomorphismCochains: {
      conjugationBy10: concreteLoops[1],
      conjugationBy01: concreteLoops[2],
      conjugationBy11: concreteLoops[3],
    },
    records,
    compositionChecks,
    carryFormula: "a_tilde+b_tilde-(a+b)_tilde=2ab",
    componentHolonomyImageRank: 1,
    componentsBeforeFullLoopGauge: 8,
    componentsAfterTreatingLoopsAsGauge: holonomyOrbits.length,
    holonomyOrbits,
  };
}

function auditChartTransport(extension, opFiber) {
  const phi = Q.map((q) => {
    const { u, v } = bits(q);
    return u & v;
  });
  const chartCoboundary = deltaOneTable(3, phi);
  for (const g of Q) {
    for (const h of Q) {
      assert.equal((extension.opFactor[g][h] ^ extension.poFactor[g][h]), chartCoboundary[g][h] & 1);
    }
  }
  const poBase = addTables(opFiber.base, chartCoboundary);
  const poFiber = enumerateLiftFiber(extension.poFactor, 3, poBase);
  assert.equal(poFiber.lifts.length, 16);
  assert.equal(poFiber.components.length, 8);
  const poKeys = poFiber.liftKeys;
  let objectChecks = 0;
  let gaugeChecks = 0;
  for (const lift of opFiber.lifts) {
    const image = addTables(lift, chartCoboundary);
    assert(poKeys.has(tableKey(image)));
    assert.deepEqual(
      differenceClassCoordinates(lift, opFiber.base),
      differenceClassCoordinates(image, poFiber.base),
    );
    objectChecks += 1;
    for (let mask = 0; mask < 8; mask += 1) {
      const lambda = normalizedLambda(mask);
      assert.deepEqual(
        addTables(applyGauge(3, lift, lambda), chartCoboundary),
        applyGauge(3, image, lambda),
      );
      gaugeChecks += 1;
    }
  }
  return {
    formula: "F_PO=F_OP+d_chi(phi_tilde)",
    phi,
    chartCoboundaryDigest: digest(chartCoboundary),
    objectChecks,
    gaugeChecks,
    componentLabelsPreserved: true,
    rawLiftTablesIdentical: false,
  };
}

function auditSplitControl() {
  const split = zeroTable();
  const policyRecords = Q.map((mask) => {
    const fiber = enumerateLiftFiber(split, mask, zeroTable());
    assert.equal(fiber.lifts.length, 16);
    assert.equal(fiber.components.length, 8);
    return { characterMask: mask, liftCount: fiber.lifts.length, componentCount: fiber.components.length };
  });
  const heldPolicyFiber = enumerateLiftFiber(split, 3, zeroTable());
  const labels = componentLabelMap(heldPolicyFiber);
  const shifts = Q.map((loopMask) => {
    const liftedLoop = Q.map((q) => character(loopMask, q));
    const coboundary = deltaOneTable(3, liftedLoop);
    const first = heldPolicyFiber.lifts[0];
    const image = addTables(first, coboundary);
    return xorLabels(labels.get(tableKey(first)), labels.get(tableKey(image)));
  });
  assert.deepEqual(shifts, [[0, 0, 0], [0, 1, 0], [0, 1, 0], [0, 0, 0]]);
  return {
    allFourSignPoliciesLiftable: true,
    uniquePolicySelectedBySplitClass: false,
    policyRecords,
    manuallyHeldChiComponentCount: heldPolicyFiber.components.length,
    manuallyHeldChiHolonomyShifts: shifts,
    loopSource: "outer marked-extension H^1 automorphisms of the split abelian extension",
    concreteInnerConjugationLoopsAvailable: false,
    holonomyBelongsToHeldCoefficientPolicy: true,
    nonsplitClassAloneDoesNotCauseHolonomy: true,
  };
}

function auditThinControl(opFactor, concreteLoopCochains) {
  const kernel = [0, 1].filter((value) => value === 0);
  assert.equal(kernel.length, 1);
  let cocycleChecks = 0;
  for (const g of Q) {
    for (const h of Q) {
      for (const k of Q) {
        assert.equal(
          opFactor[h][k]
          ^ opFactor[g ^ h][k]
          ^ opFactor[g][h ^ k]
          ^ opFactor[g][h],
          0,
        );
        cocycleChecks += 1;
      }
    }
  }
  let loopChecks = 0;
  for (const loop of concreteLoopCochains) {
    for (const g of Q) {
      for (const h of Q) {
        const coboundary = loop[h] ^ loop[g ^ h] ^ loop[g];
        assert.equal(coboundary, 0);
        assert.equal(opFactor[g][h] ^ coboundary, opFactor[g][h]);
        loopChecks += 1;
      }
    }
  }
  return {
    carrier: "B=F2 with identity coefficient map",
    kernelOrder: kernel.length,
    parityCompatibleNormalizedCochains: 1,
    normalizedLiftCount: 1,
    cocycleChecks,
    componentCount: 1,
    concreteLoopChecks: loopChecks,
    loopHolonomyRank: 0,
  };
}

function buildLaboratory() {
  const extension = buildConcreteExtension();
  const policy = auditPolicySelection(extension.opFactor);
  const freeControl = auditFreeFillerNoLift(extension.opFactor);
  const selectedFiber = auditSelectedFiber(extension.opFactor);
  const holonomy = auditLoopHolonomy(extension, selectedFiber);
  const chartTransport = auditChartTransport(extension, selectedFiber);
  const splitControl = auditSplitControl();

  const quotientImages = Q.map((q) => (character(3, q) === 0 ? 1 : 3));
  for (const g of Q) {
    for (const q of Q) assert.equal(quotientImages[g ^ q], actionB(3, g, quotientImages[q]));
  }
  assert(quotientImages.every((value) => (value & 1) === 1));
  assert(quotientImages.includes(1));
  const concreteLoopCochains = [
    Q.map(() => 0),
    factorAutomorphismCochain(extension.opSection, extension.center, 1),
    factorAutomorphismCochain(extension.opSection, extension.center, 2),
    factorAutomorphismCochain(extension.opSection, extension.center, 3),
  ];
  const thinControl = auditThinControl(extension.opFactor, concreteLoopCochains);
  return {
    extension,
    policy,
    freeControl,
    selectedFiber,
    holonomy,
    chartTransport,
    splitControl,
    quotientImages,
    thinControl,
  };
}

function buildCertificate(lab) {
  const selected = lab.selectedFiber;
  const body = {
    schema: "oasis.genesis-nullification-fiber-holonomy.certificate.v1",
    sourceInstance: {
      builderSchema: lab.extension.input.schema,
      stateCountPerChart: 8,
      opActionDigests: {
        a: digest(lab.extension.input.charts.OP.actions.a),
        b: digest(lab.extension.input.charts.OP.actions.b),
      },
      concreteGroupOrder: lab.extension.opGroup.length,
      group: "D8",
      centerDigest: digest(lab.extension.center),
      opFactorSet: lab.extension.opFactor,
      poFactorSet: lab.extension.poFactor,
      opClass: "c=u cup v",
      sameConcretePermutationExtension: true,
    },
    policySelection: {
      declaredPolicyClass: "cyclic order-four coefficient quotients with one of four Q sign actions",
      criterion: "choose the unique sign action for which the concrete extension cocycle has a normalized cocycle lift",
      signPolicyCensus: lab.policy.records,
      squareForm: lab.policy.squareForm,
      uniqueAnisotropicDirection: lab.policy.uniqueAnisotropicDirection,
      selectedCharacter: lab.policy.uniqueNonzeroCharacterVanishingThere,
      selectedCharacterFormula: "chi=u+v",
      selectedCharacterMask: lab.policy.uniqueLiftableSignPolicyMask,
      selectionCounterFreeAndBasisIndependentInsideMarkedD8: true,
      policyClassItselfDeclaredNotForced: true,
    },
    selectedCarrier: {
      exactSequence: "0 -> K={0,2} -> B=Z/4_chi -> F2 -> 0",
      action: "g.n=(-1)^chi(g)n",
      freeFillerQuotientBasisImages: lab.quotientImages,
      quotientMap: "Phi([q])=(-1)^chi(q)",
      quotientMapQEquivariant: true,
      quotientMapBoundaryCompatible: true,
      connectingResidueOfC: 0,
      residueVanishingCertifiedByCocycleLiftExistence: true,
    },
    liftFiber: {
      parityCompatibleNormalizedCochains: selected.candidates.length,
      normalizedCocycleLifts: selected.lifts.length,
      liftTableDigest: digest(selected.lifts),
      explicitBaseLift: "F0(g,h)=(3+2v(g))u(g)v(h) mod 4",
      explicitBaseLiftDigest: digest(selected.base),
      KGaugeComponents: selected.components.length,
      objectsPerComponent: selected.components.map(({ memberKeys }) => memberKeys.length),
      componentLabels: selected.components.map(({ label }) => label),
      componentLabelsSpan: "H^2(Q,K)=<u^2,uv,v^2>=F2^3",
      normalizedGaugeStabilizerSize: selected.stabilizerSize,
      normalizedKZeroCochains: selected.KZeroCochainCount,
      distinctKOneCoboundariesFromZeroCochains: selected.KZeroCoboundaryCount,
      homotopyGroups: {
        pi0: "F2^3 (8 components)",
        pi1: "H^1(Q,K)=F2^2",
        pi2: "H^0(Q,K)=F2",
      },
    },
    loopHolonomy: lab.holonomy,
    chartTransport: lab.chartTransport,
    controls: {
      freeRegularCarrier: lab.freeControl,
      unselectedSignPolicies: {
        chi0LiftCount: lab.policy.records[0].cocycleLifts,
        chiULiftCount: lab.policy.records[1].cocycleLifts,
        chiVLiftCount: lab.policy.records[2].cocycleLifts,
      },
      thin: lab.thinControl,
      splitWithHeldPolicy: lab.splitControl,
      fullLoopGauge: {
        componentsBefore: lab.holonomy.componentsBeforeFullLoopGauge,
        componentsAfter: lab.holonomy.componentsAfterTreatingLoopsAsGauge,
        retainedHolonomyDirectionAfterQuotient: false,
      },
    },
    theoremBoundary: {
      knownHomotopyFiberAndConnectingMapAlgebra: true,
      exactEndpointInvisibleComponentHolonomyProved: true,
      obstructionSelectsUniquePolicyWithinDeclaredClass: true,
      obstructionAloneGeneratesHolonomy: false,
      treatingExtensionLoopsAsGaugeErasesDirection: true,
      semanticDoctrineMustRetainLoopsAsPaths: true,
      splitControlLoopsAreOuterMarkedAutomorphismsNotInnerConjugations: true,
      declaredCyclicPolicyClassForcedByPriorSemantics: false,
      fullLocalizedObligationAncestryPreserved: false,
      autonomousNextQuestionLawEstablished: false,
      nonSoficityEstablished: false,
      hodgeNavierStokesOrOpenConjectureConsequence: false,
      noveltyOrNoPriorArtEstablished: false,
    },
  };
  return { ...body, certificateDigest: digest(body) };
}

function buildRun() {
  const lab = buildLaboratory();
  return {
    schema: "oasis.genesis-nullification-fiber-holonomy.v1",
    status: "PASS",
    result: {
      source: "actual eight-state interchange D8 extension",
      selectedPolicy: "unique residue-nullifying cyclic order-four sign carrier chi=u+v",
      parityCompatibleCochains: 512,
      coherentLifts: 16,
      liftComponents: 8,
      componentHolonomyRank: 1,
      endpointExtensionClassUnchangedAlongLoops: true,
      endpointResidueZeroAlongLoops: true,
      semanticPathRetentionStillDeclared: true,
    },
    certificate: buildCertificate(lab),
  };
}

export function replayGenesisNullificationFiberHolonomyCertificate(candidate) {
  try {
    const expected = buildRun().certificate;
    assert.deepEqual(candidate, expected);
    const body = Object.fromEntries(Object.entries(candidate).filter(([key]) => key !== "certificateDigest"));
    assert.equal(candidate.certificateDigest, digest(body));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function auditTamper(certificate) {
  const mutations = [
    ["source action", (value) => { value.sourceInstance.opActionDigests.a = "0".repeat(64); }],
    ["same instance", (value) => { value.sourceInstance.sameConcretePermutationExtension = false; }],
    ["OP factor", (value) => { value.sourceInstance.opFactorSet[1][2] ^= 1; }],
    ["policy census", (value) => { value.policySelection.signPolicyCensus[0].cocycleLifts = 1; }],
    ["anisotropic direction", (value) => { value.policySelection.uniqueAnisotropicDirection = [1, 0]; }],
    ["selected character", (value) => { value.policySelection.selectedCharacterMask = 1; }],
    ["policy overclaim", (value) => { value.policySelection.policyClassItselfDeclaredNotForced = false; }],
    ["quotient map", (value) => { value.selectedCarrier.freeFillerQuotientBasisImages[1] = 1; }],
    ["residue", (value) => { value.selectedCarrier.connectingResidueOfC = 1; }],
    ["candidate count", (value) => { value.liftFiber.parityCompatibleNormalizedCochains = 511; }],
    ["lift count", (value) => { value.liftFiber.normalizedCocycleLifts = 15; }],
    ["component count", (value) => { value.liftFiber.KGaugeComponents = 7; }],
    ["component label", (value) => { value.liftFiber.componentLabels[0][0] ^= 1; }],
    ["pi1", (value) => { value.liftFiber.homotopyGroups.pi1 = "wrong"; }],
    ["concrete loop", (value) => { value.loopHolonomy.concreteInnerAutomorphismCochains.conjugationBy10[1] ^= 1; }],
    ["holonomy shift", (value) => { value.loopHolonomy.records[1].componentShift = [0, 0, 0]; }],
    ["composition carry", (value) => { value.loopHolonomy.compositionChecks -= 1; }],
    ["chart transport", (value) => { value.chartTransport.objectChecks -= 1; }],
    ["free control", (value) => { value.controls.freeRegularCarrier.normalizedCocycleLiftFiberEmpty = false; }],
    ["thin control", (value) => { value.controls.thin.componentCount = 2; }],
    ["split control", (value) => { value.controls.splitWithHeldPolicy.uniquePolicySelectedBySplitClass = true; }],
    ["full gauge", (value) => { value.controls.fullLoopGauge.componentsAfter = 8; }],
    ["semantic overclaim", (value) => { value.theoremBoundary.autonomousNextQuestionLawEstablished = true; }],
    ["nonsofic overclaim", (value) => { value.theoremBoundary.nonSoficityEstablished = true; }],
    ["certificate digest", (value) => { value.certificateDigest = "0".repeat(64); }],
    ["undeclared field", (value) => { value.extra = true; }],
  ];
  const cases = mutations.map(([name, mutate]) => {
    const candidate = clone(certificate);
    mutate(candidate);
    return { name, rejected: !replayGenesisNullificationFiberHolonomyCertificate(candidate).ok };
  });
  assert(cases.every(({ rejected }) => rejected));
  return { attempted: cases.length, rejected: cases.filter(({ rejected }) => rejected).length, cases };
}

export function runGenesisNullificationFiberHolonomy() {
  const run = buildRun();
  return { ...run, tamper: auditTamper(run.certificate) };
}

function printSummary(run) {
  console.log("PASS policy selection: chi=u+v is the unique liftable cyclic order-four sign action");
  console.log("PASS lift fiber: 512 candidates, 16 cocycle lifts, 8 K-gauge components");
  console.log("PASS same-instance loops: concrete D8 conjugations induce rank-one component holonomy");
  console.log("PASS path coherence: loop composition carries the exact K-gauge 2ab witness");
  console.log("PASS controls: free and wrong-sign fibers empty; thin trivial; split-held-policy separates causes");
  console.log(`PASS replay/tamper: ${run.tamper.rejected}/${run.tamper.attempted} mutations rejected`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = runGenesisNullificationFiberHolonomy();
  printSummary(run);
  console.log(JSON.stringify(run, null, 2));
}
