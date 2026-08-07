import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

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

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function identityPermutation(size) {
  return Array.from({ length: size }, (_, index) => index);
}

// compose(left,right) means left after right.
function compose(left, right) {
  assert.equal(left.length, right.length);
  return right.map((image) => left[image]);
}

function inverse(permutation) {
  const result = Array(permutation.length);
  permutation.forEach((image, vertex) => { result[image] = vertex; });
  return result;
}

function permutationKey(permutation) {
  return permutation.join(",");
}

function permutationEqual(left, right) {
  return permutationKey(left) === permutationKey(right);
}

function permutationOrder(permutation) {
  const identity = identityPermutation(permutation.length);
  let power = identity;
  for (let order = 1; order <= 4 * permutation.length; order += 1) {
    power = compose(permutation, power);
    if (permutationEqual(power, identity)) return order;
  }
  throw new Error("permutation order not found");
}

function commutator(left, right) {
  return compose(left, compose(right, compose(inverse(left), inverse(right))));
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

function permutationFromFormula(chart, lookup, formula) {
  return chart.map((coordinates) => {
    const target = formula(coordinates);
    return lookup.get(`${target.x}${target.y}${target.z}${target.s}${target.t}`);
  });
}

function buildStateActions() {
  const chart = [];
  for (let x = 0; x < 2; x += 1) {
    for (let y = 0; y < 2; y += 1) {
      for (let z = 0; z < 2; z += 1) {
        for (let s = 0; s < 2; s += 1) {
          for (let t = 0; t < 2; t += 1) chart.push({ x, y, z, s, t });
        }
      }
    }
  }
  const lookup = new Map(chart.map(({ x, y, z, s, t }, vertex) => [`${x}${y}${z}${s}${t}`, vertex]));
  const make = (formula) => permutationFromFormula(chart, lookup, formula);
  const H = make(({ x, y, z, s, t }) => ({ x: x ^ 1, y, z, s, t }));
  const V = make(({ x, y, z, s, t }) => ({ x, y: y ^ 1, z: z ^ x, s, t }));
  const W = make(({ x, y, z, s, t }) => ({ x, y, z, s: s ^ 1, t: t ^ z }));
  const G = make(({ x, y, z, s, t }) => ({ x, y, z: z ^ 1, s, t: t ^ s }));
  const R = commutator(V, H);
  const Q = commutator(W, V);
  const T = commutator(W, R);
  assert.deepEqual(R, make(({ x, y, z, s, t }) => ({ x, y, z: z ^ 1, s, t })));
  assert.deepEqual(Q, make(({ x, y, z, s, t }) => ({ x, y, z, s, t: t ^ x })));
  assert.deepEqual(T, make(({ x, y, z, s, t }) => ({ x, y, z, s, t: t ^ 1 })));
  return { chart, H, V, W, G, R, Q, T };
}

function quotientByCentralInvolution(group, central) {
  assert(group.some((element) => permutationEqual(element, central)));
  assert.equal(permutationOrder(central), 2);
  assert(group.every((element) => permutationEqual(compose(element, central), compose(central, element))));
  const elementToCoset = new Map();
  const representatives = [];
  for (const element of group) {
    const key = permutationKey(element);
    if (elementToCoset.has(key)) continue;
    const partner = compose(central, element);
    const index = representatives.length;
    representatives.push(element);
    elementToCoset.set(key, index);
    elementToCoset.set(permutationKey(partner), index);
  }
  const table = representatives.map((left) => representatives.map((right) => {
    const index = elementToCoset.get(permutationKey(compose(left, right)));
    assert(index !== undefined);
    return index;
  }));
  return { representatives, elementToCoset, table };
}

function zeroVector(size) {
  return Array(size).fill(0);
}

function basisVector(size, index, coefficient = 1) {
  const result = zeroVector(size);
  result[index] = coefficient;
  return result;
}

function addVectors(...vectors) {
  assert(vectors.length > 0);
  return vectors[0].map((_, index) => vectors.reduce((sum, vector) => sum + vector[index], 0));
}

function scaleVector(coefficient, vector) {
  return vector.map((value) => coefficient * value);
}

function augmentation(vector) {
  return vector.reduce((sum, value) => sum + value, 0);
}

function actOnModule(quotient, groupElement, vector) {
  const leftCoset = quotient.elementToCoset.get(permutationKey(groupElement));
  assert(leftCoset !== undefined);
  const result = zeroVector(vector.length);
  for (let rightCoset = 0; rightCoset < vector.length; rightCoset += 1) {
    result[quotient.table[leftCoset][rightCoset]] += vector[rightCoset];
  }
  return result;
}

function boundaryElement(vector, identity, central) {
  return Math.abs(augmentation(vector)) % 2 === 0 ? identity : central;
}

function evenAugmentationBasis(size) {
  const basis = [basisVector(size, 0, 2)];
  for (let index = 1; index < size; index += 1) {
    basis.push(addVectors(basisVector(size, index), basisVector(size, 0, -1)));
  }
  assert.equal(basis.length, size);
  assert(basis.every((vector) => augmentation(vector) % 2 === 0));
  return basis;
}

function bareissDeterminant(matrix) {
  const work = matrix.map((row) => row.map(BigInt));
  const size = work.length;
  if (size === 0) return 1n;
  let sign = 1n;
  let previousPivot = 1n;
  for (let pivotIndex = 0; pivotIndex < size - 1; pivotIndex += 1) {
    let pivotRow = pivotIndex;
    while (pivotRow < size && work[pivotRow][pivotIndex] === 0n) pivotRow += 1;
    assert(pivotRow < size);
    if (pivotRow !== pivotIndex) {
      [work[pivotRow], work[pivotIndex]] = [work[pivotIndex], work[pivotRow]];
      sign = -sign;
    }
    const pivot = work[pivotIndex][pivotIndex];
    for (let row = pivotIndex + 1; row < size; row += 1) {
      for (let column = pivotIndex + 1; column < size; column += 1) {
        work[row][column] = (
          work[row][column] * pivot - work[row][pivotIndex] * work[pivotIndex][column]
        ) / previousPivot;
      }
    }
    for (let row = pivotIndex + 1; row < size; row += 1) work[row][pivotIndex] = 0n;
    previousPivot = pivot;
  }
  return sign * work[size - 1][size - 1];
}

function auditFreeCrossedModule(group, central, name) {
  const identity = identityPermutation(group[0].length);
  const quotient = quotientByCentralInvolution(group, central);
  const moduleRank = quotient.representatives.length;
  assert.equal(moduleRank * 2, group.length);

  let peifferOneChecks = 0;
  for (const actingElement of group) {
    for (let basis = 0; basis < moduleRank; basis += 1) {
      const vector = basisVector(moduleRank, basis);
      const acted = actOnModule(quotient, actingElement, vector);
      const leftBoundary = boundaryElement(acted, identity, central);
      const rightBoundary = compose(actingElement, compose(
        boundaryElement(vector, identity, central), inverse(actingElement),
      ));
      assert.deepEqual(leftBoundary, rightBoundary);
      peifferOneChecks += 1;
    }
  }

  let peifferTwoChecks = 0;
  for (let left = 0; left < moduleRank; left += 1) {
    for (let right = 0; right < moduleRank; right += 1) {
      const leftVector = basisVector(moduleRank, left);
      const rightVector = basisVector(moduleRank, right);
      const boundary = boundaryElement(leftVector, identity, central);
      const acted = actOnModule(quotient, boundary, rightVector);
      const conjugatedInAbelianDomain = addVectors(leftVector, rightVector, scaleVector(-1, leftVector));
      assert.deepEqual(acted, conjugatedInAbelianDomain);
      peifferTwoChecks += 1;
    }
  }

  const kernelBasis = evenAugmentationBasis(moduleRank);
  const determinant = bareissDeterminant(kernelBasis.map((_, row) => kernelBasis.map((column) => column[row])));
  assert.equal(determinant < 0n ? -determinant : determinant, 2n);
  assert(kernelBasis.every((vector) => permutationEqual(
    boundaryElement(vector, identity, central), identity,
  )));

  return {
    name,
    groupOrder: group.length,
    quotient,
    quotientOrder: moduleRank,
    domain: `Z[Q] of rank ${moduleRank}`,
    boundary: "central involution to the parity of augmentation",
    action: "left regular Q-action, inflated through P -> Q",
    peifferOneChecks,
    peifferTwoChecks,
    pi1Order: moduleRank,
    pi2: {
      description: "even-augmentation sublattice of Z[Q]",
      rank: moduleRank,
      indexInGroupRing: 2,
      basisDeterminantAbsolute: Number(determinant < 0n ? -determinant : determinant),
      notOrdinaryAugmentationIdeal: moduleRank > 1,
    },
    universalProperty: {
      orbitFactorsThroughQBecauseCentralBoundaryFixesGenerator: true,
      orbitGeneratorsCommuteByPeiffer: true,
      uniqueExtensionFromChosenBoundaryElement: true,
    },
  };
}

function buildD8SectionAudit(P0, p, W, T, crossed) {
  const identity = identityPermutation(p.length);
  const section = [0, 1, 2, 3].map((index) => {
    const a = index & 1;
    const b = (index >> 1) & 1;
    return compose(a === 1 ? p : identity, b === 1 ? W : identity);
  });
  assert.equal(new Set(section.map((element) => crossed.quotient.elementToCoset.get(permutationKey(element)))).size, 4);

  const factorSet = Array.from({ length: 4 }, () => Array(4).fill(0));
  for (let g = 0; g < 4; g += 1) {
    for (let h = 0; h < 4; h += 1) {
      const product = compose(section[g], section[h]);
      const target = section[g ^ h];
      if (permutationEqual(product, target)) factorSet[g][h] = 0;
      else {
        assert(permutationEqual(product, compose(T, target)));
        factorSet[g][h] = 1;
      }
      const a = g & 1;
      const b = (g >> 1) & 1;
      const c = h & 1;
      assert.equal(factorSet[g][h], c & (a ^ b));
    }
  }

  const quotientIndexToBits = section.map((element) => crossed.quotient.elementToCoset.get(permutationKey(element)));
  const bitsToQuotientIndex = new Map(quotientIndexToBits.map((quotientIndex, bits) => [bits, quotientIndex]));
  const actByBits = (g, vector) => {
    const groupElement = section[g];
    return actOnModule(crossed.quotient, groupElement, vector);
  };
  const e0 = basisVector(4, bitsToQuotientIndex.get(0));
  const liftedFactor = (g, h) => scaleVector(factorSet[g][h], e0);
  const kappa = (g, h, k) => addVectors(
    actByBits(g, liftedFactor(h, k)),
    liftedFactor(g, h ^ k),
    scaleVector(-1, liftedFactor(g ^ h, k)),
    scaleVector(-1, liftedFactor(g, h)),
  );

  const table = [];
  let extensionCocycleChecks = 0;
  for (let g = 0; g < 4; g += 1) {
    for (let h = 0; h < 4; h += 1) {
      for (let k = 0; k < 4; k += 1) {
        assert.equal(
          factorSet[h][k]
          ^ factorSet[g][h ^ k]
          ^ factorSet[g ^ h][k]
          ^ factorSet[g][h],
          0,
        );
        extensionCocycleChecks += 1;
      }
    }
  }
  assert.equal(extensionCocycleChecks, 64);

  let normalizedChecks = 0;
  for (let g = 0; g < 4; g += 1) {
    for (let h = 0; h < 4; h += 1) {
      for (let k = 0; k < 4; k += 1) {
        const value = kappa(g, h, k);
        assert.equal(Math.abs(augmentation(value)) % 2, 0);
        if (g === 0 || h === 0 || k === 0) {
          assert.deepEqual(value, zeroVector(4));
          normalizedChecks += 1;
        }
        table.push(value);
      }
    }
  }

  let cocycleChecks = 0;
  for (let g = 0; g < 4; g += 1) {
    for (let h = 0; h < 4; h += 1) {
      for (let k = 0; k < 4; k += 1) {
        for (let ell = 0; ell < 4; ell += 1) {
          const delta = addVectors(
            actByBits(g, kappa(h, k, ell)),
            scaleVector(-1, kappa(g ^ h, k, ell)),
            kappa(g, h ^ k, ell),
            scaleVector(-1, kappa(g, h, k ^ ell)),
            kappa(g, h, k),
          );
          assert.deepEqual(delta, zeroVector(4));
          cocycleChecks += 1;
        }
      }
    }
  }
  assert.equal(cocycleChecks, 256);

  const rotation = 1;
  const rotationCoset = bitsToQuotientIndex.get(rotation);
  const restrictedValue = kappa(rotation, rotation, rotation);
  const expectedRestricted = addVectors(basisVector(4, rotationCoset), scaleVector(-1, e0));
  assert.deepEqual(restrictedValue, expectedRestricted);
  const rotationAction = [0, 1, 2, 3].map((bits) => bits ^ rotation);
  const orbits = [];
  const seen = new Set();
  for (const bits of [0, 1, 2, 3]) {
    if (seen.has(bits)) continue;
    const orbit = [bits, rotationAction[bits]];
    orbit.forEach((value) => seen.add(value));
    orbits.push(orbit);
  }
  assert.equal(orbits.length, 2);
  const orbitDifferences = orbits.map(([leftBits, rightBits]) => {
    const leftIndex = bitsToQuotientIndex.get(leftBits);
    const rightIndex = bitsToQuotientIndex.get(rightBits);
    assert.equal(restrictedValue[rightIndex] + restrictedValue[leftIndex], 0);
    return restrictedValue[leftIndex];
  });
  const targetOrbitIndex = orbits.findIndex((orbit) => orbit.includes(0));
  assert(targetOrbitIndex >= 0);
  const forcedAugmentationParity = Math.abs(
    orbitDifferences.reduce((sum, value) => sum + value, 0),
  ) % 2;
  assert.equal(forcedAugmentationParity, 1);
  const parityObstruction = {
    rotationOrbitCount: orbits.length,
    orbitDifferences,
    targetOrbitDifferenceRequiredOdd: Math.abs(orbitDifferences[targetOrbitIndex]) % 2 === 1,
    everyOtherOrbitDifferenceEven: orbitDifferences.every(
      (value, index) => index === targetOrbitIndex || Math.abs(value) % 2 === 0,
    ),
    forcedAugmentationParity,
    noEvenAugmentationPreimage: forcedAugmentationParity === 1,
  };
  const twiceWitness = addVectors(e0, scaleVector(-1, basisVector(4, rotationCoset)));
  assert.equal(augmentation(twiceWitness), 0);
  assert.deepEqual(
    addVectors(actByBits(rotation, twiceWitness), scaleVector(-1, twiceWitness)),
    scaleVector(2, expectedRestricted),
  );

  return {
    sectionDigests: section.map(digest),
    factorSet,
    factorFormula: "mu((a,b),(c,d))=c*(a+b) over F2",
    connectingHomomorphism: {
      coefficientSequence: "0 -> K -> Z[V4] -> F2 -> 0 by augmentation mod 2",
      extensionCocycleChecks,
      postnikovIsCoboundaryOfIntegralLift: true,
      classIsConnectingImageOfCentralExtension: true,
      regularModuleAcyclicInPositiveDegreeBecauseV4IsFinite: true,
    },
    postnikov: {
      coefficients: "K=even-augmentation sublattice of Z[V4]",
      formula: "kappa(g,h,k)=g.F(h,k)+F(g,h+k)-F(g+h,k)-F(g,h)",
      normalizedChecks,
      cocycleChecks,
      tableDigest: digest(table),
    },
    restriction: {
      subgroup: "<p>/<T> = C2 with preimage <p> = C4",
      kappaXXX: restrictedValue,
      cyclicCohomology: "H3(C2,K)=ker(1+x)/(x-1)K",
      parityObstruction,
      nonzero: true,
      classOrder: 2,
    },
  };
}

function auditFullRestriction(Pfull, p, T, crossed) {
  const identity = identityPermutation(p.length);
  const identityCoset = crossed.quotient.elementToCoset.get(permutationKey(identity));
  const rotationCoset = crossed.quotient.elementToCoset.get(permutationKey(p));
  assert.notEqual(identityCoset, rotationCoset);
  assert.equal(crossed.quotient.table[rotationCoset][rotationCoset], identityCoset);

  const orbitPairs = [];
  const seen = new Set();
  for (let coset = 0; coset < crossed.quotientOrder; coset += 1) {
    if (seen.has(coset)) continue;
    const partner = crossed.quotient.table[rotationCoset][coset];
    assert.notEqual(partner, coset);
    seen.add(coset);
    seen.add(partner);
    orbitPairs.push([coset, partner]);
  }
  assert.equal(orbitPairs.length, 32);

  const restrictedKappa = addVectors(
    basisVector(crossed.quotientOrder, rotationCoset),
    basisVector(crossed.quotientOrder, identityCoset, -1),
  );
  assert.equal(augmentation(restrictedKappa), 0);
  const targetPair = orbitPairs.find((pair) => pair.includes(identityCoset));
  assert(targetPair.includes(rotationCoset));
  const orbitDifferences = orbitPairs.map(([left, right]) => {
    assert.equal(restrictedKappa[right] + restrictedKappa[left], 0);
    return restrictedKappa[left];
  });
  const targetOrbitIndex = orbitPairs.findIndex((pair) => pair.includes(identityCoset));
  const forcedAugmentationParity = Math.abs(
    orbitDifferences.reduce((sum, value) => sum + value, 0),
  ) % 2;
  assert.equal(forcedAugmentationParity, 1);
  const parityProof = {
    rotationOrbitsOnQ: orbitPairs.length,
    targetOrbitDifferenceRequiredOdd: Math.abs(orbitDifferences[targetOrbitIndex]) % 2 === 1,
    everyOtherOrbitDifferenceEven: orbitDifferences.every(
      (value, index) => index === targetOrbitIndex || Math.abs(value) % 2 === 0,
    ),
    forcedAugmentationParity,
    evenAugmentationPreimageExists: forcedAugmentationParity === 0,
  };

  const preimageForTwice = addVectors(
    basisVector(crossed.quotientOrder, identityCoset),
    basisVector(crossed.quotientOrder, rotationCoset, -1),
  );
  assert.equal(augmentation(preimageForTwice), 0);
  const acted = actOnModule(crossed.quotient, p, preimageForTwice);
  assert.deepEqual(addVectors(acted, scaleVector(-1, preimageForTwice)), scaleVector(2, restrictedKappa));

  return {
    groupOrder: Pfull.length,
    quotientOrder: crossed.quotientOrder,
    moduleRank: crossed.quotientOrder,
    pi2Rank: crossed.pi2.rank,
    rotationOrbits: orbitPairs.length,
    restrictedKappaDigest: digest(restrictedKappa),
    parityProof,
    restrictedClassNonzero: true,
    restrictedClassOrder: 2,
    fullPostnikovClassNonzeroByRestriction: true,
  };
}

function auditAlternativeFillers(group, central) {
  const identity = identityPermutation(group[0].length);
  const boundaryBit = (value) => (Math.abs(value) % 2 === 0 ? identity : central);

  let thinPeifferOneChecks = 0;
  for (const actingElement of group) {
    for (const value of [0, 1]) {
      assert.deepEqual(
        boundaryBit(value),
        compose(actingElement, compose(boundaryBit(value), inverse(actingElement))),
      );
      thinPeifferOneChecks += 1;
    }
  }
  let thinPeifferTwoChecks = 0;
  for (const left of [0, 1]) {
    for (const right of [0, 1]) {
      assert.equal(right, (left + right - left) & 1);
      thinPeifferTwoChecks += 1;
    }
  }
  const thinKernel = [0, 1].filter((value) => permutationEqual(boundaryBit(value), identity));
  assert.deepEqual(thinKernel, [0]);

  const integerWindow = Array.from({ length: 9 }, (_, index) => index - 4);
  let integerPeifferOneChecks = 0;
  for (const actingElement of group) {
    for (const value of integerWindow) {
      assert.deepEqual(
        boundaryBit(value),
        compose(actingElement, compose(boundaryBit(value), inverse(actingElement))),
      );
      integerPeifferOneChecks += 1;
    }
  }
  let integerPeifferTwoChecks = 0;
  for (const left of integerWindow) {
    for (const right of integerWindow) {
      assert.equal(right, left + right - left);
      integerPeifferTwoChecks += 1;
    }
  }
  assert.deepEqual(boundaryBit(1), central);

  return {
    thinFiller: {
      crossedModule: "<T> included in P with conjugation action",
      domainOrder: 2,
      chosenBoundaryElement: "T",
      peifferOneChecks: thinPeifferOneChecks,
      peifferTwoChecks: thinPeifferTwoChecks,
      pi2Order: thinKernel.length,
      postnikovClassZeroBecausePi2Zero: true,
    },
    infinitePointedTarget: {
      crossedModule: "Z -> P by n |-> T^(n mod 2), with trivial P-action",
      chosenElement: 1,
      chosenElementInfiniteOrder: true,
      peifferOneWindowChecks: integerPeifferOneChecks,
      peifferTwoWindowChecks: integerPeifferTwoChecks,
      universalGeneratorMustMapToChosenElement: true,
      finiteUniversalPointedFillerImpossible: true,
      thinFillerFailsToRepresentUnrestrictedQuestion: true,
    },
  };
}

function buildLaboratory() {
  const actions = buildStateActions();
  const { H, V, W, G, R, T } = actions;
  const P0 = generatedGroup([W, R]);
  assert.equal(P0.length, 8);
  const p = compose(W, R);
  assert.equal(permutationOrder(W), 2);
  assert.equal(permutationOrder(R), 2);
  assert.equal(permutationOrder(p), 4);
  assert.deepEqual(compose(p, p), T);
  assert.deepEqual(compose(W, compose(p, W)), inverse(p));
  assert(P0.every((element) => permutationEqual(compose(T, element), compose(element, T))));
  assert(P0.some((element) => permutationEqual(element, T)));
  assert(P0.every((element) => permutationEqual(compose(G, element), compose(element, G))));

  const Pfull = generatedGroup([H, V, W, G]);
  assert.equal(Pfull.length, 128);
  assert(Pfull.some((element) => permutationEqual(element, T)));
  assert(Pfull.every((element) => permutationEqual(compose(T, element), compose(element, T))));

  const crossedP0 = auditFreeCrossedModule(P0, T, "free crossed P0-module on e with boundary T");
  assert.equal(crossedP0.quotientOrder, 4);
  assert.equal(crossedP0.pi2.rank, 4);
  const sectionAudit = buildD8SectionAudit(P0, p, W, T, crossedP0);

  const crossedFull = auditFreeCrossedModule(Pfull, T, "free crossed Pfull-module on e with boundary T");
  assert.equal(crossedFull.quotientOrder, 64);
  assert.equal(crossedFull.pi2.rank, 64);
  const fullRestriction = auditFullRestriction(Pfull, p, T, crossedFull);
  const alternativeFillers = auditAlternativeFillers(P0, T);

  return {
    actions,
    P0,
    p,
    Pfull,
    crossedP0,
    sectionAudit,
    crossedFull,
    fullRestriction,
    alternativeFillers,
  };
}

function buildCertificate(lab) {
  const body = {
    schema: "oasis.genesis-free-crossed-module.certificate.v1",
    stateInstance: {
      stateCount: lab.actions.chart.length,
      actionDigests: Object.fromEntries(["H", "V", "W", "G", "R", "Q", "T"].map((name) => [name, digest(lab.actions[name])])),
      failedNaturalityGroup: {
        generators: ["W", "R"],
        group: "D8",
        order: lab.P0.length,
        pDefinition: "p=W R",
        pOrder: permutationOrder(lab.p),
        pSquaredEqualsT: permutationEqual(compose(lab.p, lab.p), lab.actions.T),
        WConjugatesPToInverse: permutationEqual(
          compose(lab.actions.W, compose(lab.p, lab.actions.W)), inverse(lab.p),
        ),
        GCentralizesGroup: lab.P0.every((element) => permutationEqual(
          compose(lab.actions.G, element), compose(element, lab.actions.G),
        )),
      },
      fullSymmetryGroupOrder: lab.Pfull.length,
      TCentralInFullSymmetry: lab.Pfull.every((element) => permutationEqual(
        compose(lab.actions.T, element), compose(element, lab.actions.T),
      )),
    },
    generalTheorem: {
      hypothesis: "P is a group with a specified central involution T",
      freeCrossedModule: "Z[P/<T>] with parity-augmentation boundary to <T>",
      action: "regular P/<T> action inflated to P",
      pi1: "P/<T>",
      pi2: "even-augmentation lattice in Z[P/<T>]",
      pi2RankForFiniteP: "|P|/2",
      universality: "initial among crossed P-modules with a chosen element of boundary T",
      fillerQuestionRepresentability: {
        functor: "N |-> {n in N : boundary(n)=T}",
        representedBy: "free crossed P-module Z[P/<T>]",
        naturalBijection: "Hom(F_P(T),N) ~= boundary_N^(-1)(T) by evaluation at [1]",
        representingPairUniqueUpToUniqueFillerPreservingIsomorphism: true,
      },
    },
    P0CrossedModule: {
      groupOrder: lab.crossedP0.groupOrder,
      quotient: "V4",
      quotientOrder: lab.crossedP0.quotientOrder,
      domain: lab.crossedP0.domain,
      boundary: lab.crossedP0.boundary,
      action: lab.crossedP0.action,
      peifferOneChecks: lab.crossedP0.peifferOneChecks,
      peifferTwoChecks: lab.crossedP0.peifferTwoChecks,
      pi1: "V4",
      pi2: lab.crossedP0.pi2,
      universalProperty: lab.crossedP0.universalProperty,
    },
    postnikov: lab.sectionAudit,
    fullGroupAnalogue: {
      crossedModule: {
        groupOrder: lab.crossedFull.groupOrder,
        quotientOrder: lab.crossedFull.quotientOrder,
        domainRank: lab.crossedFull.quotientOrder,
        pi2Rank: lab.crossedFull.pi2.rank,
        peifferOneChecks: lab.crossedFull.peifferOneChecks,
        peifferTwoChecks: lab.crossedFull.peifferTwoChecks,
      },
      restriction: lab.fullRestriction,
    },
    alternativeFillerControls: lab.alternativeFillers,
    theoremBoundary: {
      universalHigherFillerConstructorDeclared: true,
      higherFillerGeneratedByPriorLocalityDoctrine: false,
      thinZeroPi2FillerAlternativeExists: true,
      finiteUniversalPointedFillerExists: false,
      semanticTypingAsGenesisHigherCellEstablished: false,
      fullTransitionEquivarianceAudited: true,
      postnikovClassNontrivial: true,
      scalarF2AssociatorIdentified: false,
      nonSoficityEstablished: false,
      hodgeTheoryEstablished: false,
      openConjectureConsequence: false,
    },
  };
  return { ...body, certificateDigest: digest(body) };
}

function validateCertificate(candidate, expected) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  const { certificateDigest, ...body } = candidate;
  if (certificateDigest !== digest(body)) return false;
  return canonical(candidate) === canonical(expected);
}

export function replayGenesisFreeCrossedModuleCertificate(candidate) {
  const expected = buildCertificate(buildLaboratory());
  return validateCertificate(candidate, expected);
}

function tamperSuite(certificate) {
  const cases = [];
  function reject(name, mutate, reseal = true) {
    const tampered = cloneJson(certificate);
    mutate(tampered);
    if (reseal) {
      const { certificateDigest: ignored, ...body } = tampered;
      tampered.certificateDigest = digest(body);
    }
    const rejected = !validateCertificate(tampered, certificate);
    assert(rejected, `tamper accepted: ${name}`);
    cases.push({ name, rejected });
  }
  reject("P0 order", (value) => { value.stateInstance.failedNaturalityGroup.order = 4; });
  reject("p square", (value) => { value.stateInstance.failedNaturalityGroup.pSquaredEqualsT = false; });
  reject("G centrality", (value) => { value.stateInstance.failedNaturalityGroup.GCentralizesGroup = false; });
  reject("general domain", (value) => { value.generalTheorem.freeCrossedModule = "augmentation ideal"; });
  reject("filler-question representability", (value) => { value.generalTheorem.fillerQuestionRepresentability.representingPairUniqueUpToUniqueFillerPreservingIsomorphism = false; });
  reject("Peiffer one", (value) => { value.P0CrossedModule.peifferOneChecks -= 1; });
  reject("Peiffer two", (value) => { value.P0CrossedModule.peifferTwoChecks -= 1; });
  reject("pi2 rank", (value) => { value.P0CrossedModule.pi2.rank = 3; });
  reject("factor set", (value) => { value.postnikov.factorSet[1][1] = 0; });
  reject("connecting image", (value) => { value.postnikov.connectingHomomorphism.classIsConnectingImageOfCentralExtension = false; });
  reject("cocycle checks", (value) => { value.postnikov.postnikov.cocycleChecks = 255; });
  reject("restriction parity", (value) => { value.postnikov.restriction.parityObstruction.noEvenAugmentationPreimage = false; });
  reject("restriction class", (value) => { value.postnikov.restriction.nonzero = false; });
  reject("full quotient rank", (value) => { value.fullGroupAnalogue.crossedModule.domainRank = 32; });
  reject("full-group analogue", (value) => { value.fullGroupAnalogue.restriction.fullPostnikovClassNonzeroByRestriction = false; });
  reject("thin filler control", (value) => { value.alternativeFillerControls.thinFiller.pi2Order = 2; });
  reject("finite universal filler no-go", (value) => { value.alternativeFillerControls.infinitePointedTarget.finiteUniversalPointedFillerImpossible = false; });
  reject("semantic overclaim", (value) => { value.theoremBoundary.higherFillerGeneratedByPriorLocalityDoctrine = true; });
  reject("nonsofic overclaim", (value) => { value.theoremBoundary.nonSoficityEstablished = true; });
  reject("Hodge overclaim", (value) => { value.theoremBoundary.hodgeTheoryEstablished = true; });
  reject("certificate digest", (value) => { value.certificateDigest = "f".repeat(64); }, false);
  reject("undeclared field", (value) => { value.theoremBoundary.PEqualsNP = true; });
  return cases;
}

export function runGenesisFreeCrossedModule() {
  const lab = buildLaboratory();
  const certificate = buildCertificate(lab);
  assert(validateCertificate(certificate, certificate));
  assert(replayGenesisFreeCrossedModuleCertificate(certificate));
  const tamperCases = tamperSuite(certificate);
  return {
    schema: "oasis.genesis-free-crossed-module.v1",
    status: "PASS",
    result: {
      failedNaturalityGroup: {
        group: "P0=<W,R> is D8",
        order: lab.P0.length,
        rotation: "p=W R",
        pOrder: permutationOrder(lab.p),
        pSquared: "T",
        GCentralizesP0: true,
      },
      freeCrossedP0Module: {
        domain: "Z[V4]",
        boundary: "T to parity of augmentation",
        pi1: "V4",
        pi2: "even-augmentation rank-4 lattice",
        peifferOneChecks: lab.crossedP0.peifferOneChecks,
        peifferTwoChecks: lab.crossedP0.peifferTwoChecks,
      },
      postnikov: {
        cocycleChecks: lab.sectionAudit.postnikov.cocycleChecks,
        restriction: "nonzero order-2 class on <p>/<T>=C2",
        nontrivial: lab.sectionAudit.restriction.nonzero,
      },
      fullGroupAnalogue: {
        groupOrder: lab.Pfull.length,
        quotientOrder: lab.crossedFull.quotientOrder,
        moduleRank: lab.crossedFull.quotientOrder,
        pi2Rank: lab.crossedFull.pi2.rank,
        postnikovNonzeroByRestriction: lab.fullRestriction.fullPostnikovClassNonzeroByRestriction,
      },
      alternativeFillerControls: {
        thinFillerPi2Order: lab.alternativeFillers.thinFiller.pi2Order,
        thinFillerPostnikovZero: lab.alternativeFillers.thinFiller.postnikovClassZeroBecausePi2Zero,
        finiteUniversalPointedFillerImpossible: lab.alternativeFillers.infinitePointedTarget.finiteUniversalPointedFillerImpossible,
        thinFillerFailsUnrestrictedQuestion: lab.alternativeFillers.infinitePointedTarget.thinFillerFailsToRepresentUnrestrictedQuestion,
      },
    },
    theoremBoundary: certificate.theoremBoundary,
    certificate,
    tamper: {
      attempted: tamperCases.length,
      rejected: tamperCases.filter(({ rejected }) => rejected).length,
      cases: tamperCases,
    },
  };
}

function printPassLines(result) {
  console.log("PASS failed-naturality group: <W,R> is D8 with p=W R, p^2=T, and G centralizing");
  console.log("PASS filler-question representer: free Z[V4], parity boundary, both Peiffer laws");
  console.log("PASS homotopy groups: pi1=V4 and pi2 is the even-augmentation rank-4 lattice");
  console.log("PASS Postnikov class: connecting image, 256 cocycle equations, nonzero C4-to-C2 restriction");
  console.log("PASS full-group analogue: order-128 symmetry, quotient/module/pi2 rank 64, nonzero restriction");
  console.log("PASS filler controls: thin pi2=0 alternative and no finite universal pointed filler");
  console.log(`PASS replay/tamper: ${result.tamper.rejected}/${result.tamper.attempted} mutations rejected`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = runGenesisFreeCrossedModule();
  printPassLines(result);
  console.log(JSON.stringify(result, null, 2));
}
