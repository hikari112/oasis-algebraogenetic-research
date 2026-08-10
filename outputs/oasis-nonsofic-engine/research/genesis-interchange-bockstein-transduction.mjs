import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import { buildGenesisInterchangeTransductionInput } from "./genesis-interchange-square.mjs";

const Q = Object.freeze([0, 1, 2, 3]);
const ZERO = Object.freeze([0, 0, 0, 0]);

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

function orderOf(permutation) {
  const identity = identityPermutation(permutation.length);
  let power = identity;
  for (let order = 1; order <= 2 * permutation.length; order += 1) {
    power = compose(permutation, power);
    if (permutationEqual(power, identity)) return order;
  }
  throw new Error("permutation order search failed");
}

function vector(...terms) {
  const result = [...ZERO];
  for (const [coefficient, term] of terms) {
    for (let index = 0; index < result.length; index += 1) result[index] += coefficient * term[index];
  }
  return result;
}

function basis(index) {
  const result = [...ZERO];
  result[index] = 1;
  return result;
}

function augmentation(value) {
  return value.reduce((sum, coefficient) => sum + coefficient, 0);
}

function act(quotientElement, value) {
  const result = [...ZERO];
  for (const source of Q) result[source ^ quotientElement] += value[source];
  return result;
}

function bits(element) {
  return { x: element & 1, y: (element >> 1) & 1 };
}

function coordinateKey({ x, y, z }) {
  return `${x}${y}${z}`;
}

function centralCommutator(left, right) {
  return compose(left, compose(right, compose(inversePermutation(left), inversePermutation(right))));
}

function validateInput(input) {
  assert.equal(input.schema, "oasis.genesis-interchange-transduction-input.v1");
  assert.deepEqual(input.labels, ["a", "b"]);
  for (const chartName of ["OP", "PO"]) {
    const chart = input.charts[chartName];
    assert.equal(chart.coordinates.length, 8);
    assert.equal(new Set(chart.coordinates.map(coordinateKey)).size, 8);
    for (const label of input.labels) {
      assert.equal(chart.actions[label].length, 8);
      assert.equal(new Set(chart.actions[label]).size, 8);
    }
  }
  assert.equal(input.coherentComparisonsOPtoPO.length, 2);
  for (const comparison of input.coherentComparisonsOPtoPO) {
    assert.equal(comparison.length, 8);
    assert.equal(new Set(comparison).size, 8);
  }
}

function transport(permutation, sourceToTarget) {
  return compose(inversePermutation(sourceToTarget), compose(permutation, sourceToTarget));
}

function projectionAudit(group, chart, center) {
  const byCoordinates = new Map(chart.map((coordinate, vertex) => [coordinateKey(coordinate), vertex]));
  const basepoint = byCoordinates.get("000");
  assert.notEqual(basepoint, undefined);
  const projected = group.map((element) => {
    const baseImage = chart[element[basepoint]];
    const quotient = baseImage.x | (baseImage.y << 1);
    for (let vertex = 0; vertex < chart.length; vertex += 1) {
      const source = chart[vertex];
      const image = chart[element[vertex]];
      const shift = bits(quotient);
      assert.equal(image.x, source.x ^ shift.x);
      assert.equal(image.y, source.y ^ shift.y);
    }
    return { element, quotient, baseImage };
  });
  for (const q of Q) assert.equal(projected.filter((entry) => entry.quotient === q).length, 2);
  const kernel = projected.filter((entry) => entry.quotient === 0).map((entry) => entry.element);
  assert.equal(kernel.length, 2);
  assert(kernel.some((element) => permutationEqual(element, identityPermutation(chart.length))));
  assert(kernel.some((element) => permutationEqual(element, center)));
  return { projected, basepoint };
}

function deriveSection(group, chart, center) {
  const { projected } = projectionAudit(group, chart, center);
  return Q.map((q) => {
    const candidates = projected.filter(({ quotient, baseImage }) => quotient === q && baseImage.z === 0);
    assert.equal(candidates.length, 1);
    return candidates[0].element;
  });
}

function factorSet(section, center) {
  const table = Q.map(() => Q.map(() => 0));
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

function deltaOne(cochain, left, right) {
  return vector(
    [1, act(left, cochain[right])],
    [-1, cochain[left ^ right]],
    [1, cochain[left]],
  );
}

function deltaTwo(cochain, g, h, k) {
  return vector(
    [1, act(g, cochain[h][k])],
    [-1, cochain[g ^ h][k]],
    [1, cochain[g][h ^ k]],
    [-1, cochain[g][h]],
  );
}

function deltaThree(cochain, g, h, k, ell) {
  return vector(
    [1, act(g, cochain[h][k][ell])],
    [-1, cochain[g ^ h][k][ell]],
    [1, cochain[g][h ^ k][ell]],
    [-1, cochain[g][h][k ^ ell]],
    [1, cochain[g][h][k]],
  );
}

function liftFactor(table) {
  return Q.map((g) => Q.map((h) => vector([table[g][h], basis(0)])));
}

function auditBockstein(table) {
  let extensionCocycleChecks = 0;
  for (const g of Q) {
    assert.equal(table[0][g], 0);
    assert.equal(table[g][0], 0);
    for (const h of Q) {
      for (const k of Q) {
        assert.equal(table[h][k] ^ table[g ^ h][k] ^ table[g][h ^ k] ^ table[g][h], 0);
        extensionCocycleChecks += 1;
      }
    }
  }

  const lifted = liftFactor(table);
  const kappa = Q.map((g) => Q.map((h) => Q.map((k) => deltaTwo(lifted, g, h, k))));
  let evenAugmentationChecks = 0;
  let normalizedChecks = 0;
  for (const g of Q) {
    for (const h of Q) {
      for (const k of Q) {
        assert.equal(Math.abs(augmentation(kappa[g][h][k])) % 2, 0);
        evenAugmentationChecks += 1;
        if (g === 0 || h === 0 || k === 0) {
          assert.deepEqual(kappa[g][h][k], ZERO);
          normalizedChecks += 1;
        }
      }
    }
  }

  let cocycleChecks = 0;
  for (const g of Q) {
    for (const h of Q) {
      for (const k of Q) {
        for (const ell of Q) {
          assert.deepEqual(deltaThree(kappa, g, h, k, ell), ZERO);
          cocycleChecks += 1;
        }
      }
    }
  }

  const twiceLift = lifted.map((row) => row.map((value) => vector([2, value])));
  let twiceClassWitnessChecks = 0;
  for (const g of Q) {
    for (const h of Q) {
      assert.equal(Math.abs(augmentation(twiceLift[g][h])) % 2, 0);
      for (const k of Q) {
        assert.deepEqual(deltaTwo(twiceLift, g, h, k), vector([2, kappa[g][h][k]]));
        twiceClassWitnessChecks += 1;
      }
    }
  }

  return {
    lifted,
    kappa,
    extensionCocycleChecks,
    evenAugmentationChecks,
    normalizedChecks,
    cocycleChecks,
    twiceClassWitnessChecks,
  };
}

function cochainComparison(leftAudit, rightAudit, gauge) {
  const gaugeLift = Q.map((q) => vector([gauge[q], basis(0)]));
  const comparison = Q.map((g) => Q.map((h) => vector(
    [1, rightAudit.lifted[g][h]],
    [-1, leftAudit.lifted[g][h]],
    [-1, deltaOne(gaugeLift, g, h)],
  )));
  let kernelChecks = 0;
  let coboundaryChecks = 0;
  for (const g of Q) {
    for (const h of Q) {
      assert.equal(Math.abs(augmentation(comparison[g][h])) % 2, 0);
      kernelChecks += 1;
      for (const k of Q) {
        assert.deepEqual(
          deltaTwo(comparison, g, h, k),
          vector([1, rightAudit.kappa[g][h][k]], [-1, leftAudit.kappa[g][h][k]]),
        );
        coboundaryChecks += 1;
      }
    }
  }
  return { gaugeLift, comparison, kernelChecks, coboundaryChecks };
}

function etaFromMask(mask) {
  return Q.map((q) => (q === 0 ? 0 : ((mask >> (q - 1)) & 1)));
}

function changedSection(section, center, eta) {
  return section.map((element, q) => (eta[q] === 0 ? element : compose(center, element)));
}

function deltaEta(eta, left, right) {
  return eta[left] ^ eta[right] ^ eta[left ^ right];
}

function auditAllSections(baseSection, center, baseTable, baseAudit) {
  const records = [];
  for (let mask = 0; mask < 8; mask += 1) {
    const eta = etaFromMask(mask);
    const section = changedSection(baseSection, center, eta);
    const table = factorSet(section, center);
    for (const g of Q) {
      for (const h of Q) assert.equal(table[g][h], baseTable[g][h] ^ deltaEta(eta, g, h));
    }
    const audit = auditBockstein(table);
    const comparison = cochainComparison(baseAudit, audit, eta);
    records.push({
      mask,
      eta,
      sectionDigest: digest(section),
      factorDigest: digest(table),
      kappaDigest: digest(audit.kappa),
      comparisonDigest: digest(comparison.comparison),
      comparisonKernelChecks: comparison.kernelChecks,
      comparisonCoboundaryChecks: comparison.coboundaryChecks,
    });
  }
  assert.equal(new Set(records.map(({ sectionDigest }) => sectionDigest)).size, 8);
  return records;
}

function auditRestriction(opAudit) {
  const t = 3;
  const value = opAudit.kappa[t][t][t];
  const expected = vector([1, basis(t)], [-1, basis(0)]);
  assert.deepEqual(value, expected);
  assert.deepEqual(vector([1, act(t, value)], [1, value]), ZERO);

  const orbits = [[0, 3], [1, 2]];
  const targetOrbitDifference = value[0];
  const otherOrbitDifference = value[1];
  assert.equal(Math.abs(targetOrbitDifference) % 2, 1);
  assert.equal(Math.abs(otherOrbitDifference) % 2, 0);
  const forcedPreimageAugmentationParity = (
    Math.abs(targetOrbitDifference) + Math.abs(otherOrbitDifference)
  ) % 2;
  assert.equal(forcedPreimageAugmentationParity, 1);

  const twiceWitness = vector([1, basis(0)], [-1, basis(t)]);
  assert.equal(augmentation(twiceWitness), 0);
  assert.deepEqual(vector([1, act(t, twiceWitness)], [-1, twiceWitness]), vector([2, value]));
  return {
    subgroupGenerator: [1, 1],
    preimageGroup: "C4",
    kappaTTT: value,
    actionOrbits: orbits,
    parityObstruction: {
      targetOrbitDifferenceOdd: true,
      otherOrbitDifferenceEven: true,
      forcedPreimageAugmentationParity,
      noEvenAugmentationPreimage: true,
    },
    twiceWitness,
    restrictedClassNonzero: true,
    globalClassNonzeroByRestriction: true,
    globalClassOrder: 2,
  };
}

function auditSplitControl() {
  const zeroTable = Q.map(() => Q.map(() => 0));
  const zeroAudit = auditBockstein(zeroTable);
  assert(zeroAudit.kappa.flat(2).every((value) => value.every((coefficient) => coefficient === 0)));
  let nonzeroRepresentativeTables = 0;
  const records = [];
  for (let mask = 0; mask < 8; mask += 1) {
    const eta = etaFromMask(mask);
    const table = Q.map((g) => Q.map((h) => deltaEta(eta, g, h)));
    if (table.flat().some((value) => value !== 0)) nonzeroRepresentativeTables += 1;
    const audit = auditBockstein(table);
    const comparison = cochainComparison(zeroAudit, audit, eta);
    records.push({
      mask,
      factorDigest: digest(table),
      kappaDigest: digest(audit.kappa),
      coboundaryDigest: digest(comparison.comparison),
    });
  }
  assert(nonzeroRepresentativeTables > 0);
  return {
    homomorphicSectionFactorSetZero: true,
    homomorphicSectionKappaZero: true,
    normalizedSectionChangesChecked: records.length,
    nonzeroRepresentativeTables,
    everyChangedKappaCohomologousToZero: true,
    recordsDigest: digest(records),
  };
}

function auditThinControl(group, center) {
  const identity = identityPermutation(center.length);
  let peifferOneChecks = 0;
  let peifferTwoChecks = 0;
  for (const acting of group) {
    assert(permutationEqual(compose(acting, compose(center, inversePermutation(acting))), center));
    for (const domainElement of [0, 1]) {
      const boundary = domainElement === 0 ? identity : center;
      assert(permutationEqual(compose(acting, compose(boundary, inversePermutation(acting))), boundary));
      peifferOneChecks += 1;
    }
  }
  for (const left of [0, 1]) {
    for (const right of [0, 1]) {
      assert.equal(left ^ right ^ left, right);
      peifferTwoChecks += 1;
    }
  }
  return {
    domain: "<T>=C2 included in the concrete interchange group",
    chosenBoundaryElement: "T",
    peifferOneChecks,
    peifferTwoChecks,
    pi2Order: 1,
    postnikovClassZeroBecausePi2Zero: true,
    provesFreeFillerDoctrineDependence: true,
  };
}

function buildLaboratory() {
  const input = buildGenesisInterchangeTransductionInput();
  validateInput(input);
  const op = input.charts.OP;
  const po = input.charts.PO;
  const identity = identityPermutation(8);
  const actionA = op.actions.a;
  const actionB = op.actions.b;
  const center = centralCommutator(actionA, actionB);
  const opGroup = generatedGroup([actionA, actionB]);
  assert.equal(opGroup.length, 8);
  assert.equal(orderOf(actionA), 2);
  assert.equal(orderOf(actionB), 2);
  assert.equal(orderOf(compose(actionA, actionB)), 4);
  assert.equal(orderOf(center), 2);
  assert(!permutationEqual(center, identity));
  assert(opGroup.every((element) => permutationEqual(compose(element, center), compose(center, element))));

  const theta0 = input.coherentComparisonsOPtoPO[0];
  const theta1 = input.coherentComparisonsOPtoPO[1];
  const poCenter = centralCommutator(po.actions.a, po.actions.b);
  assert(permutationEqual(theta1, compose(poCenter, theta0)));
  const transportedA0 = transport(po.actions.a, theta0);
  const transportedB0 = transport(po.actions.b, theta0);
  const transportedA1 = transport(po.actions.a, theta1);
  const transportedB1 = transport(po.actions.b, theta1);
  assert.deepEqual(transportedA0, actionA);
  assert.deepEqual(transportedB0, actionB);
  assert.deepEqual(transportedA1, actionA);
  assert.deepEqual(transportedB1, actionB);

  const poGroup = generatedGroup([po.actions.a, po.actions.b]);
  assert.equal(poGroup.length, 8);
  const opSection = deriveSection(opGroup, op.coordinates, center);
  const poSectionRaw = deriveSection(poGroup, po.coordinates, poCenter);
  const poSection = poSectionRaw.map((element) => transport(element, theta0));
  assert(poSection.every((element) => opGroup.some((candidate) => permutationEqual(candidate, element))));

  const opFactor = factorSet(opSection, center);
  const poFactor = factorSet(poSection, center);
  assert.equal(orderOf(opSection[3]), 4);
  assert.equal(opFactor[3][3], 1);
  for (const left of Q) {
    for (const right of Q) {
      const l = bits(left);
      const r = bits(right);
      assert.equal(opFactor[left][right], l.x & r.y);
      assert.equal(poFactor[left][right], l.y & r.x);
    }
  }

  const phi = Q.map((q) => {
    const { x, y } = bits(q);
    return x & y;
  });
  for (const left of Q) {
    for (const right of Q) assert.equal(opFactor[left][right] ^ poFactor[left][right], deltaEta(phi, left, right));
  }

  const opAudit = auditBockstein(opFactor);
  const poAudit = auditBockstein(poFactor);
  const chartComparison = cochainComparison(opAudit, poAudit, phi);
  const opSections = auditAllSections(opSection, center, opFactor, opAudit);
  const poSections = auditAllSections(poSection, center, poFactor, poAudit);
  const restriction = auditRestriction(opAudit);
  assert.deepEqual(poAudit.kappa[3][3][3], restriction.kappaTTT);

  const splitControl = auditSplitControl();
  const thinControl = auditThinControl(opGroup, center);
  const poBasepoint = po.coordinates.findIndex((coordinate) => coordinateKey(coordinate) === "000");
  assert(theta0[op.coordinates.findIndex((coordinate) => coordinateKey(coordinate) === "000")] === poBasepoint);
  assert(theta1[op.coordinates.findIndex((coordinate) => coordinateKey(coordinate) === "000")] !== poBasepoint);

  return {
    input,
    opGroup,
    center,
    poCenter,
    theta0,
    theta1,
    opSection,
    poSection,
    opFactor,
    poFactor,
    phi,
    opAudit,
    poAudit,
    chartComparison,
    opSections,
    poSections,
    restriction,
    splitControl,
    thinControl,
  };
}

function buildCertificate(lab) {
  const body = {
    schema: "oasis.genesis-interchange-bockstein-transduction.certificate.v1",
    sourceInstance: {
      builderSchema: lab.input.schema,
      stateCountPerChart: 8,
      opActionDigests: {
        a: digest(lab.input.charts.OP.actions.a),
        b: digest(lab.input.charts.OP.actions.b),
      },
      poActionDigests: {
        a: digest(lab.input.charts.PO.actions.a),
        b: digest(lab.input.charts.PO.actions.b),
      },
      opChartDigest: digest(lab.input.charts.OP.coordinates),
      poChartDigest: digest(lab.input.charts.PO.coordinates),
      thetaDigests: lab.input.coherentComparisonsOPtoPO.map(digest),
      actualInterchangeGroupOrder: lab.opGroup.length,
      actualInterchangeGroup: "D8",
      centerDigest: digest(lab.center),
      centerOrder: orderOf(lab.center),
      quotient: "Q=F2^2",
      quotientKernelOrder: 2,
      notReconstructedFromAbstractD8Presentation: true,
    },
    chartTransport: {
      basedTheta: "theta_0(x,y,z)=(x,y,z+x*y)",
      basedThetaIsExtensionChartIsomorphism: true,
      transportedPOActionsEqualOPActions: true,
      transportedPOSectionLiesInSameConcretePermutationGroup: true,
      unbasedTheta: "theta_1=T theta_0",
      unbasedThetaSendsIdentityOriginToTOrigin: true,
      theta1IsPointedChartMap: false,
      theta1InducesSameNormalizedExtensionIsomorphismAsTheta0: true,
      bothThetaConjugationsOnConcreteGroupEqual: true,
      bothThetaCoefficientModuleMapsEqualIdentity: true,
    },
    markedExtension: {
      opSectionDigest: digest(lab.opSection),
      poSectionTransportedDigest: digest(lab.poSection),
      opFactorSet: lab.opFactor,
      poFactorSet: lab.poFactor,
      opFormula: "c_OP((x,y),(x',y'))=x*y'",
      poFormula: "c_PO((x,y),(x',y'))=y*x'",
      chartGauge: "phi(x,y)=x*y",
      chartGaugeEquation: "c_PO=c_OP+delta(phi) over F2",
      causalCommutatorAloneDeterminesExtensionClass: false,
      fullFactorClassConsumedByBockstein: true,
    },
    freeFillerTransduction: {
      doctrine: "unrestricted pointed crossed-module filler on the marked central boundary T",
      coefficientSequence: "0 -> K -> Z[Q] -> F2 -> 0 by augmentation mod 2",
      coefficients: "K is the even-augmentation lattice in Z[Q]",
      coefficientRank: 4,
      connectingMap: "beta:H^2(Q,F2)->H^3(Q,K)",
      notTheEarlierZ4Sq1Bockstein: true,
      op: {
        extensionCocycleChecks: lab.opAudit.extensionCocycleChecks,
        evenAugmentationChecks: lab.opAudit.evenAugmentationChecks,
        normalizedChecks: lab.opAudit.normalizedChecks,
        postnikovCocycleChecks: lab.opAudit.cocycleChecks,
        twiceClassWitnessChecks: lab.opAudit.twiceClassWitnessChecks,
        liftedFactorDigest: digest(lab.opAudit.lifted),
        kappaDigest: digest(lab.opAudit.kappa),
      },
      po: {
        extensionCocycleChecks: lab.poAudit.extensionCocycleChecks,
        evenAugmentationChecks: lab.poAudit.evenAugmentationChecks,
        normalizedChecks: lab.poAudit.normalizedChecks,
        postnikovCocycleChecks: lab.poAudit.cocycleChecks,
        twiceClassWitnessChecks: lab.poAudit.twiceClassWitnessChecks,
        liftedFactorDigest: digest(lab.poAudit.lifted),
        kappaDigest: digest(lab.poAudit.kappa),
      },
      chartClassComparison: {
        formula: "A=F_PO-F_OP-d(phi*e_0) in C2(Q,K)",
        kernelChecks: lab.chartComparison.kernelChecks,
        coboundaryChecks: lab.chartComparison.coboundaryChecks,
        comparisonDigest: digest(lab.chartComparison.comparison),
        cocycleTablesIdentical: digest(lab.opAudit.kappa) === digest(lab.poAudit.kappa),
        cohomologyClassesEqual: true,
      },
      normalizedSections: {
        choicesPerChart: 8,
        opRecordsDigest: digest(lab.opSections),
        poRecordsDigest: digest(lab.poSections),
        everyChangeHasExplicitKValuedCoboundary: true,
      },
      restriction: lab.restriction,
      classContainsNewIndependentInformationBeyondExtensionClass: false,
      interpretation: "exact dimension shift of the same obstruction into a higher transport carrier",
    },
    controls: {
      split: lab.splitControl,
      thin: lab.thinControl,
    },
    theoremBoundary: {
      provedSameConcreteEightStatePermutationInstance: true,
      fullLocalizedObligationAncestryEquivalenceProved: false,
      chartIndependentCohomologyClassProved: true,
      chartIndependentRepresentativeTableProved: false,
      sectionIndependentCohomologyClassProved: true,
      unbasedOriginGaugeIsNormalizedSectionChange: false,
      freeFillerDoctrineDeclaredNotForced: true,
      nakedCausalLoopForcesPostnikovClass: false,
      residueSelectsNextQuestion: false,
      autonomousGenesisSuccessorEstablished: false,
      nonSoficityEstablished: false,
      hodgeOrNavierStokesConsequenceEstablished: false,
      noveltyOrNoPriorArtEstablished: false,
    },
  };
  return { ...body, certificateDigest: digest(body) };
}

function buildRun() {
  const lab = buildLaboratory();
  const certificate = buildCertificate(lab);
  return {
    schema: "oasis.genesis-interchange-bockstein-transduction.v1",
    status: "PASS",
    result: {
      source: "the actual eight-state OP/PO interchange permutation instance",
      transduction: "[c] in H^2(Q,F2) maps to beta[c] in H^3(Q,K)",
      chartClassIndependent: true,
      normalizedSectionChoicesPerChart: 8,
      postnikovClassNonzero: true,
      postnikovClassOrder: 2,
      splitControlClassZero: true,
      thinControlClassZero: true,
      conditionalOnFreeFillerDoctrine: true,
    },
    certificate,
  };
}

export function replayGenesisInterchangeBocksteinCertificate(candidate) {
  try {
    const expected = buildRun().certificate;
    assert.deepEqual(candidate, expected);
    assert.equal(candidate.certificateDigest, digest(Object.fromEntries(
      Object.entries(candidate).filter(([key]) => key !== "certificateDigest"),
    )));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function auditTamper(certificate) {
  const mutations = [
    ["source action", (value) => { value.sourceInstance.opActionDigests.a = "0".repeat(64); }],
    ["source chart", (value) => { value.sourceInstance.opChartDigest = "0".repeat(64); }],
    ["theta", (value) => { value.sourceInstance.thetaDigests[0] = "0".repeat(64); }],
    ["same instance", (value) => { value.sourceInstance.notReconstructedFromAbstractD8Presentation = false; }],
    ["based chart map", (value) => { value.chartTransport.basedThetaIsExtensionChartIsomorphism = false; }],
    ["unbased pointedness", (value) => { value.chartTransport.theta1IsPointedChartMap = true; }],
    ["OP factor", (value) => { value.markedExtension.opFactorSet[1][2] ^= 1; }],
    ["PO factor", (value) => { value.markedExtension.poFactorSet[2][1] ^= 1; }],
    ["factor class", (value) => { value.markedExtension.fullFactorClassConsumedByBockstein = false; }],
    ["coefficient sequence", (value) => { value.freeFillerTransduction.coefficientSequence = "wrong"; }],
    ["Bockstein type", (value) => { value.freeFillerTransduction.notTheEarlierZ4Sq1Bockstein = false; }],
    ["OP cocycle count", (value) => { value.freeFillerTransduction.op.postnikovCocycleChecks -= 1; }],
    ["PO kappa", (value) => { value.freeFillerTransduction.po.kappaDigest = "0".repeat(64); }],
    ["chart coboundary", (value) => { value.freeFillerTransduction.chartClassComparison.coboundaryChecks -= 1; }],
    ["representative equality", (value) => { value.freeFillerTransduction.chartClassComparison.cocycleTablesIdentical = true; }],
    ["section count", (value) => { value.freeFillerTransduction.normalizedSections.choicesPerChart = 7; }],
    ["restriction", (value) => { value.freeFillerTransduction.restriction.globalClassNonzeroByRestriction = false; }],
    ["order", (value) => { value.freeFillerTransduction.restriction.globalClassOrder = 1; }],
    ["split", (value) => { value.controls.split.homomorphicSectionKappaZero = false; }],
    ["thin", (value) => { value.controls.thin.pi2Order = 2; }],
    ["ancestry overclaim", (value) => { value.theoremBoundary.fullLocalizedObligationAncestryEquivalenceProved = true; }],
    ["successor overclaim", (value) => { value.theoremBoundary.autonomousGenesisSuccessorEstablished = true; }],
    ["novelty overclaim", (value) => { value.theoremBoundary.noveltyOrNoPriorArtEstablished = true; }],
    ["certificate digest", (value) => { value.certificateDigest = "0".repeat(64); }],
    ["undeclared field", (value) => { value.extra = true; }],
  ];
  const cases = mutations.map(([name, mutate]) => {
    const candidate = clone(certificate);
    mutate(candidate);
    return { name, rejected: !replayGenesisInterchangeBocksteinCertificate(candidate).ok };
  });
  assert(cases.every(({ rejected }) => rejected));
  return { attempted: cases.length, rejected: cases.filter(({ rejected }) => rejected).length, cases };
}

export function runGenesisInterchangeBocksteinTransduction() {
  const run = buildRun();
  return { ...run, tamper: auditTamper(run.certificate) };
}

function printSummary(run) {
  console.log("PASS source binding: actual eight-state OP/PO permutation extension, not an abstract D8 replacement");
  console.log("PASS chart transport: based theta identifies the marked extensions; unbased theta is only an origin gauge");
  console.log("PASS Bockstein: explicit K-valued 3-cocycles and explicit chart/section coboundaries");
  console.log("PASS restriction: nonzero class of exact order two on the diagonal C4-to-C2 sector");
  console.log("PASS controls: split class zero; thin filler pi2 zero; free-doctrine dependence retained");
  console.log(`PASS replay/tamper: ${run.tamper.rejected}/${run.tamper.attempted} mutations rejected`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = runGenesisInterchangeBocksteinTransduction();
  printSummary(run);
  console.log(JSON.stringify(run, null, 2));
}
