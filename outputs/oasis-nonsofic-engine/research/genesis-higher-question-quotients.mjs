import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import { runGenesisFreeCrossedModule } from "./genesis-free-crossed-module.mjs";

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

function permutations(values) {
  if (values.length === 0) return [[]];
  const result = [];
  for (let index = 0; index < values.length; index += 1) {
    const head = values[index];
    const rest = values.slice(0, index).concat(values.slice(index + 1));
    for (const tail of permutations(rest)) result.push([head, ...tail]);
  }
  return result;
}

function makeTargets() {
  return [
    {
      name: "C2",
      order: 2,
      elements: [0, 1],
      add: (left, right) => (left + right) % 2,
      neg: (value) => value,
      display: (value) => `${value}`,
    },
    {
      name: "C4",
      order: 4,
      elements: [0, 1, 2, 3],
      add: (left, right) => (left + right) % 4,
      neg: (value) => (4 - value) % 4,
      display: (value) => `${value}`,
    },
    {
      name: "C2^2",
      order: 4,
      elements: [0, 1, 2, 3],
      add: (left, right) => left ^ right,
      neg: (value) => value,
      display: (value) => `(${value & 1},${(value >> 1) & 1})`,
    },
  ];
}

function addMany(target, terms) {
  return terms.reduce((sum, value) => target.add(sum, value), 0);
}

function scale(target, coefficient, value) {
  let result = 0;
  for (let count = 0; count < coefficient; count += 1) result = target.add(result, value);
  return result;
}

function allSurjectiveBoundaries(target) {
  const boundaries = [];
  const assignmentCount = 2 ** target.order;
  for (let mask = 0; mask < assignmentCount; mask += 1) {
    const values = target.elements.map((element) => (mask >> element) & 1);
    if (values[0] !== 0 || !values.includes(1)) continue;
    const homomorphism = target.elements.every((left) => target.elements.every((right) => (
      values[target.add(left, right)] === (values[left] ^ values[right])
    )));
    if (homomorphism) boundaries.push(values);
  }
  return boundaries.sort((left, right) => left.join("").localeCompare(right.join("")));
}

function allAutomorphisms(target) {
  const nonzero = target.elements.slice(1);
  return permutations(nonzero)
    .map((tail) => [0, ...tail])
    .filter((map) => target.elements.every((left) => target.elements.every((right) => (
      map[target.add(left, right)] === target.add(map[left], map[right])
    ))))
    .sort((left, right) => left.join(",").localeCompare(right.join(",")));
}

function composeMap(left, right) {
  return right.map((image) => left[image]);
}

function mapsEqual(left, right) {
  return left.every((value, index) => value === right[index]);
}

function preservesBoundary(map, boundary) {
  return map.every((image, element) => boundary[image] === boundary[element]);
}

function mapName(target, map) {
  const identity = target.elements;
  if (mapsEqual(map, identity)) return "identity";
  if (target.name === "C4" && mapsEqual(map, [0, 3, 2, 1])) return "inversion";
  if (target.name === "C2^2" && mapsEqual(map, [0, 2, 1, 3])) return "coordinate-swap";
  return `automorphism[${map.join(",")}]`;
}

const Q = [
  { a: 0, b: 0, name: "1" },
  { a: 1, b: 0, name: "x" },
  { a: 0, b: 1, name: "y" },
  { a: 1, b: 1, name: "xy" },
];

function qIndex({ a, b }) {
  return a + 2 * b;
}

function qAdd(left, right) {
  return Q[qIndex({ a: left.a ^ right.a, b: left.b ^ right.b })];
}

function mu(left, right) {
  return right.a & (left.a ^ left.b);
}

function normalizeF2Polynomial(terms) {
  const coefficients = new Map();
  for (const [uDegree, vDegree] of terms) {
    const key = `${uDegree},${vDegree}`;
    if (coefficients.has(key)) coefficients.delete(key);
    else coefficients.set(key, [uDegree, vDegree]);
  }
  return [...coefficients.values()].sort(([uLeft, vLeft], [uRight, vRight]) => (
    uLeft - uRight || vLeft - vRight
  ));
}

function multiplyF2Polynomials(left, right) {
  return normalizeF2Polynomial(left.flatMap(([uLeft, vLeft]) => right.map(
    ([uRight, vRight]) => [uLeft + uRight, vLeft + vRight],
  )));
}

function restrictF2PolynomialToLine(polynomial, uImage, vImage) {
  const degrees = [];
  for (const [uDegree, vDegree] of polynomial) {
    if ((uDegree > 0 && uImage === 0) || (vDegree > 0 && vImage === 0)) continue;
    degrees.push([uDegree + vDegree, 0]);
  }
  return normalizeF2Polynomial(degrees).map(([degree]) => degree);
}

function auditEssentialPolynomial() {
  const expanded = normalizeF2Polynomial([[2, 1], [1, 2]]);
  const factoredExpansion = multiplyF2Polynomials([[1, 1]], [[1, 0], [0, 1]]);
  assert.deepEqual(expanded, factoredExpansion);
  assert.equal(expanded.length, 2);
  const lineSubstitutions = {
    x: restrictF2PolynomialToLine(expanded, 1, 0),
    y: restrictF2PolynomialToLine(expanded, 0, 1),
    xy: restrictF2PolynomialToLine(expanded, 1, 1),
  };
  assert(Object.values(lineSubstitutions).every((restriction) => restriction.length === 0));
  return {
    cohomologyRing: "H^*(V4,F2)=F2[u,v]",
    extensionClass: "[mu]=(u+v)u=u^2+uv",
    bocksteinClass: "beta[mu]=u^2v+uv^2=uv(u+v)",
    expandedMonomials: expanded.map(([uDegree, vDegree]) => `u^${uDegree}v^${vDegree}`),
    factoredExpansionVerified: canonical(expanded) === canonical(factoredExpansion),
    formalPolynomialNonzero: expanded.length > 0,
    lineSubstitutions: {
      x: { substitution: "u=t,v=0", resultDegrees: lineSubstitutions.x, zero: lineSubstitutions.x.length === 0 },
      y: { substitution: "u=0,v=t", resultDegrees: lineSubstitutions.y, zero: lineSubstitutions.y.length === 0 },
      xy: { substitution: "u=t,v=t", resultDegrees: lineSubstitutions.xy, zero: lineSubstitutions.xy.length === 0 },
    },
    vanishesOnEveryOrder2Subgroup: true,
  };
}

function d8Multiply(left, right) {
  const signedRotation = left[1] === 0 ? right[0] : -right[0];
  return [((left[0] + signedRotation) % 4 + 4) % 4, left[1] ^ right[1]];
}

function d8Inverse(value) {
  return [((-(value[1] === 0 ? 1 : -1) * value[0]) % 4 + 4) % 4, value[1]];
}

function d8Equal(left, right) {
  return left[0] === right[0] && left[1] === right[1];
}

function deriveD8Factor() {
  const elements = [];
  for (let rotation = 0; rotation < 4; rotation += 1) {
    for (let reflection = 0; reflection < 2; reflection += 1) elements.push([rotation, reflection]);
  }
  const identity = [0, 0];
  const p = [1, 0];
  const W = [0, 1];
  const T = [2, 0];
  const associativityChecks = elements.reduce((count, left) => count + elements.reduce(
    (middleCount, middle) => middleCount + elements.filter((right) => d8Equal(
      d8Multiply(d8Multiply(left, middle), right),
      d8Multiply(left, d8Multiply(middle, right)),
    )).length,
    0,
  ), 0);
  assert.equal(associativityChecks, 8 ** 3);
  assert(d8Equal(d8Multiply(p, p), T));
  assert(d8Equal(d8Multiply(W, d8Multiply(p, W)), d8Inverse(p)));
  assert(elements.every((element) => d8Equal(d8Multiply(T, element), d8Multiply(element, T))));

  const quotientProductChecks = elements.reduce((count, left) => count + elements.filter((right) => {
    const quotientLeft = Q[qIndex({ a: left[0] & 1, b: left[1] })];
    const quotientRight = Q[qIndex({ a: right[0] & 1, b: right[1] })];
    const product = d8Multiply(left, right);
    const quotientProduct = Q[qIndex({ a: product[0] & 1, b: product[1] })];
    return quotientProduct === qAdd(quotientLeft, quotientRight);
  }).length, 0);
  assert.equal(quotientProductChecks, 8 ** 2);

  const section = (value) => [value.a, value.b];
  const factorTable = Q.map((left) => Q.map((right) => {
    const product = d8Multiply(section(left), section(right));
    const expected = d8Multiply(scaleD8Central(mu(left, right)), section(qAdd(left, right)));
    assert(d8Equal(product, expected));
    return mu(left, right);
  }));
  const factorCocycleChecks = Q.reduce((count, g) => count + Q.reduce(
    (middleCount, h) => middleCount + Q.filter((k) => (
      (mu(h, k) ^ mu(qAdd(g, h), k) ^ mu(g, qAdd(h, k)) ^ mu(g, h)) === 0
    )).length,
    0,
  ), 0);
  assert.equal(factorCocycleChecks, 4 ** 3);

  return {
    presentation: "D8=<p,W | p^4=W^2=1, WpW=p^-1>",
    centralInvolution: "T=p^2",
    quotient: "Q=D8/<T>=<x,y | x^2=y^2=[x,y]=1>=V4",
    coordinates: "x=p<T>, y=W<T>; (a,b)=x^a y^b",
    section: "sigma(a,b)=p^a W^b",
    factorFormula: "mu((a,b),(c,d))=c(a+b) mod 2",
    groupOrder: elements.length,
    associativityChecks,
    quotientProductChecks,
    sectionFactorChecks: 4 ** 2,
    factorCocycleChecks,
    factorTable,
    identityVerified: d8Equal(identity, d8Multiply(identity, identity)),
  };
}

function scaleD8Central(bit) {
  return bit === 0 ? [0, 0] : [2, 0];
}

function actionAt(q, xAction, yAction, value) {
  let result = value;
  if (q.b === 1) result = yAction[result];
  if (q.a === 1) result = xAction[result];
  return result;
}

function generatedSubgroup(target, generators) {
  const found = new Set([0]);
  const queue = [0];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const generator of generators) {
      for (const next of [target.add(current, generator), target.add(current, target.neg(generator))]) {
        if (!found.has(next)) {
          found.add(next);
          queue.push(next);
        }
      }
    }
  }
  return [...found].sort((left, right) => left - right);
}

function enumeratePointedTargets() {
  const candidates = [];
  const modelCounts = [];
  for (const target of makeTargets()) {
    const boundaries = allSurjectiveBoundaries(target);
    const automorphisms = allAutomorphisms(target);
    let actionPairs = 0;
    let pointedCandidates = 0;
    for (const boundary of boundaries) {
      const allowed = automorphisms.filter((map) => preservesBoundary(map, boundary));
      const involutions = allowed.filter((map) => mapsEqual(composeMap(map, map), target.elements));
      for (const xAction of involutions) {
        for (const yAction of involutions) {
          if (!mapsEqual(composeMap(xAction, yAction), composeMap(yAction, xAction))) continue;
          actionPairs += 1;
          for (const b of target.elements.filter((element) => boundary[element] === 1)) {
            const orbit = Q.map((q) => actionAt(q, xAction, yAction, b));
            if (generatedSubgroup(target, orbit).length !== target.order) continue;
            pointedCandidates += 1;
            candidates.push({ target, boundary, xAction, yAction, b, orbit });
          }
        }
      }
    }
    modelCounts.push({
      target: target.name,
      order: target.order,
      surjectiveBoundaries: boundaries.length,
      automorphisms: automorphisms.length,
      boundaryActionPairs: actionPairs,
      generatedPointedCandidates: pointedCandidates,
    });
  }
  return { candidates, modelCounts };
}

function cochain2Index(g, h) {
  return 4 * qIndex(g) + qIndex(h);
}

function cochain3Index(g, h, k) {
  return 16 * qIndex(g) + 4 * qIndex(h) + qIndex(k);
}

function delta2(target, xAction, yAction, cochain, g, h, k) {
  return addMany(target, [
    actionAt(g, xAction, yAction, cochain[cochain2Index(h, k)]),
    target.neg(cochain[cochain2Index(qAdd(g, h), k)]),
    cochain[cochain2Index(g, qAdd(h, k))],
    target.neg(cochain[cochain2Index(g, h)]),
  ]);
}

function delta3(target, xAction, yAction, cochain, g, h, k, ell) {
  return addMany(target, [
    actionAt(g, xAction, yAction, cochain[cochain3Index(h, k, ell)]),
    target.neg(cochain[cochain3Index(qAdd(g, h), k, ell)]),
    cochain[cochain3Index(g, qAdd(h, k), ell)],
    target.neg(cochain[cochain3Index(g, h, qAdd(k, ell))]),
    cochain[cochain3Index(g, h, k)],
  ]);
}

const NORMALIZED_PAIRS = Q.flatMap((g) => Q.map((h) => [g, h]))
  .filter(([g, h]) => qIndex(g) !== 0 && qIndex(h) !== 0);

function enumerateAssignments(optionsForPosition, visit, position = 0, assignment = []) {
  if (position === optionsForPosition.length) {
    visit(assignment);
    return;
  }
  for (const value of optionsForPosition[position]) {
    assignment.push(value);
    enumerateAssignments(optionsForPosition, visit, position + 1, assignment);
    assignment.pop();
  }
}

function normalizedCochain(assignment) {
  const result = Array(16).fill(0);
  NORMALIZED_PAIRS.forEach(([g, h], index) => { result[cochain2Index(g, h)] = assignment[index]; });
  return result;
}

function countKPrimitives(candidate, kappa, kernel) {
  let count = 0;
  enumerateAssignments(Array(9).fill(kernel), (assignment) => {
    const gamma = normalizedCochain(assignment);
    const matches = Q.every((g) => Q.every((h) => Q.every((k) => (
      delta2(candidate.target, candidate.xAction, candidate.yAction, gamma, g, h, k)
      === kappa[cochain3Index(g, h, k)]
    ))));
    if (matches) count += 1;
  });
  return count;
}

function countMuLifts(candidate) {
  let count = 0;
  const options = NORMALIZED_PAIRS.map(([g, h]) => candidate.target.elements.filter(
    (element) => candidate.boundary[element] === mu(g, h),
  ));
  enumerateAssignments(options, (assignment) => {
    const lift = normalizedCochain(assignment);
    const cocycle = Q.every((g) => Q.every((h) => Q.every((k) => (
      delta2(candidate.target, candidate.xAction, candidate.yAction, lift, g, h, k) === 0
    ))));
    if (cocycle) count += 1;
  });
  return count;
}

function candidateId(candidate) {
  return [
    candidate.target.name,
    `d=${candidate.boundary.join("")}`,
    `x=${candidate.xAction.join("")}`,
    `y=${candidate.yAction.join("")}`,
    `b=${candidate.b}`,
  ].join("|");
}

function auditCyclicRestriction(candidate, kappa, kernel, generator) {
  const { target, boundary, xAction, yAction, b } = candidate;
  const generatorAction = target.elements.map((element) => (
    actionAt(generator, xAction, yAction, element)
  ));
  const extensionResidue = mu(generator, generator);
  const transportedB = generatorAction[b];
  const transportResidue = target.add(transportedB, target.neg(b));
  const postnikovResidue = scale(target, extensionResidue, transportResidue);
  assert(kernel.includes(transportResidue));
  assert(kernel.includes(postnikovResidue));
  assert.equal(kappa[cochain3Index(generator, generator, generator)], postnikovResidue);
  const imageElements = kernel.map((element) => (
    target.add(generatorAction[element], target.neg(element))
  ));
  const transportResidueInImage = imageElements.includes(transportResidue);
  const postnikovResidueInImage = imageElements.includes(postnikovResidue);
  const transportClassNonzero = !transportResidueInImage;
  const classNonzero = !postnikovResidueInImage;
  const fixedOddFillers = target.elements.filter((element) => (
    boundary[element] === 1 && generatorAction[element] === element
  ));
  const noFixedOddFiller = fixedOddFillers.length === 0;
  assert.equal(transportClassNonzero, noFixedOddFiller);
  assert.equal(classNonzero, extensionResidue === 1 && noFixedOddFiller);
  return {
    subgroup: `<${generator.name}>`,
    generator: generator.name,
    extensionResidueMuTT: extensionResidue,
    extensionRestrictsNontrivially: extensionResidue === 1,
    transportResidue: target.display(transportResidue),
    transportResidueRaw: transportResidue,
    postnikovResidue: target.display(postnikovResidue),
    postnikovResidueRaw: postnikovResidue,
    imageElements,
    transportResidueInImage,
    postnikovResidueInImage,
    transportClassNonzero,
    classNonzero,
    fixedOddFillers: fixedOddFillers.map(target.display),
    noFixedOddFiller,
    transportClassNonzeroIffNoFixedOddFiller: transportClassNonzero === noFixedOddFiller,
    restrictionNonzeroIffExtensionAndNoFixedOddFiller: classNonzero === (
      extensionResidue === 1 && noFixedOddFiller
    ),
  };
}

function auditCandidate(candidate) {
  const { target, boundary, xAction, yAction, b } = candidate;
  const kernel = target.elements.filter((element) => boundary[element] === 0);
  assert.equal(kernel.length * 2, target.order);
  assert(Q.every((q) => boundary[actionAt(q, xAction, yAction, b)] === 1));
  assert.equal(generatedSubgroup(target, candidate.orbit).length, target.order);

  const lift = Array(16).fill(0);
  for (const g of Q) {
    for (const h of Q) lift[cochain2Index(g, h)] = scale(target, mu(g, h), b);
  }
  const liftBoundaryChecks = Q.reduce((count, g) => count + Q.filter((h) => (
    boundary[lift[cochain2Index(g, h)]] === mu(g, h)
  )).length, 0);
  assert.equal(liftBoundaryChecks, 16);

  const kappa = Array(64).fill(0);
  let kernelChecks = 0;
  for (const g of Q) {
    for (const h of Q) {
      for (const k of Q) {
        const value = delta2(target, xAction, yAction, lift, g, h, k);
        kappa[cochain3Index(g, h, k)] = value;
        assert.equal(boundary[value], 0);
        kernelChecks += 1;
      }
    }
  }
  assert.equal(kernelChecks, 64);

  let cocycleChecks = 0;
  for (const g of Q) {
    for (const h of Q) {
      for (const k of Q) {
        for (const ell of Q) {
          assert.equal(delta3(target, xAction, yAction, kappa, g, h, k, ell), 0);
          cocycleChecks += 1;
        }
      }
    }
  }
  assert.equal(cocycleChecks, 256);

  const primitiveCount = countKPrimitives(candidate, kappa, kernel);
  const muLiftCount = countMuLifts(candidate);
  const kappaClassZero = primitiveCount > 0;
  const muLifts = muLiftCount > 0;
  assert.equal(kappaClassZero, muLifts);

  const cyclicRestrictions = Object.fromEntries(Q.slice(1).map((generator) => [
    generator.name,
    auditCyclicRestriction(candidate, kappa, kernel, generator),
  ]));
  const anyCyclicRestrictionNonzero = Object.values(cyclicRestrictions).some(
    (restriction) => restriction.classNonzero,
  );
  const cyclicallyInvisibleOnEveryProperSubgroup = !anyCyclicRestrictionNonzero;
  if (anyCyclicRestrictionNonzero) assert(!kappaClassZero);

  return {
    id: candidateId(candidate),
    target: target.name,
    targetOrder: target.order,
    boundary: boundary.join(""),
    xAction: { name: mapName(target, xAction), images: xAction },
    yAction: { name: mapName(target, yAction), images: yAction },
    distinguishedOddFiller: target.display(b),
    orbit: candidate.orbit.map(target.display),
    orbitGeneratesTarget: true,
    canonicalLift: {
      formula: "F(g,h)=mu(g,h)b",
      boundaryChecks: liftBoundaryChecks,
      cochainDigest: digest(lift),
    },
    postnikov: {
      formula: "kappa_B=delta F",
      kernelChecks,
      cocycleChecks,
      cochainDigest: digest(kappa),
      nonzeroEntryCount: kappa.filter((value) => value !== 0).length,
      KValuedPrimitiveCount: primitiveCount,
      classZero: kappaClassZero,
      classNonzero: !kappaClassZero,
    },
    independentLiftSearch: {
      normalizedAssignments: kernel.length ** 9,
      BValuedMuCocycleLiftCount: muLiftCount,
      muLifts,
      agreesWithConnectingCriterion: kappaClassZero === muLifts,
    },
    cyclicRestrictions,
    anyCyclicRestrictionNonzero,
    cyclicallyInvisibleOnEveryProperSubgroup,
    globallyNonzeroYetCyclicallyInvisible: !kappaClassZero && cyclicallyInvisibleOnEveryProperSubgroup,
  };
}

function findAudit(audits, predicate, label) {
  const found = audits.filter(predicate);
  assert.equal(found.length, 1, `expected one ${label}, found ${found.length}`);
  return found[0];
}

let predecessorCache;
function predecessorAudit() {
  if (predecessorCache !== undefined) return predecessorCache;
  const predecessor = runGenesisFreeCrossedModule();
  assert.equal(predecessor.status, "PASS");
  assert.equal(predecessor.result.failedNaturalityGroup.group, "P0=<W,R> is D8");
  assert.equal(predecessor.result.freeCrossedP0Module.domain, "Z[V4]");
  assert.equal(predecessor.result.postnikov.nontrivial, true);
  predecessorCache = {
    schema: predecessor.schema,
    certificateDigest: predecessor.certificate.certificateDigest,
    postnikovNontrivial: predecessor.result.postnikov.nontrivial,
    quotient: predecessor.result.freeCrossedP0Module.pi1,
  };
  return predecessorCache;
}

function buildLaboratory() {
  const predecessor = predecessorAudit();
  const d8 = deriveD8Factor();
  const enumeration = enumeratePointedTargets();
  const audits = enumeration.candidates.map(auditCandidate);
  assert(audits.every((audit) => (
    audit.postnikov.classZero === audit.independentLiftSearch.muLifts
  )));
  assert(audits.every((audit) => Object.values(audit.cyclicRestrictions).every((restriction) => (
    restriction.transportClassNonzeroIffNoFixedOddFiller
    && restriction.restrictionNonzeroIffExtensionAndNoFixedOddFiller
  ))));

  const thinC2 = findAudit(audits, (audit) => audit.target === "C2", "thin C2 control");
  assert(thinC2.postnikov.classZero);

  const vectorSwap = findAudit(audits, (audit) => (
    audit.target === "C2^2"
    && audit.boundary === "0110"
    && audit.xAction.name === "coordinate-swap"
    && audit.yAction.name === "identity"
    && audit.distinguishedOddFiller === "(1,0)"
  ), "C2^2 x-swap control");
  assert(vectorSwap.cyclicRestrictions.x.classNonzero && vectorSwap.postnikov.classNonzero);

  const c4Inversion = findAudit(audits, (audit) => (
    audit.target === "C4"
    && audit.xAction.name === "inversion"
    && audit.yAction.name === "identity"
    && audit.distinguishedOddFiller === "1"
  ), "C4 inversion control");
  assert(c4Inversion.cyclicRestrictions.x.classNonzero && c4Inversion.postnikov.classNonzero);

  const c4Trivial = findAudit(audits, (audit) => (
    audit.target === "C4"
    && audit.xAction.name === "identity"
    && audit.yAction.name === "identity"
    && audit.distinguishedOddFiller === "1"
  ), "trivial-action C4 control");
  assert(c4Trivial.cyclicallyInvisibleOnEveryProperSubgroup && c4Trivial.postnikov.classNonzero);

  const mixedVector = findAudit(audits, (audit) => (
    audit.target === "C2^2"
    && audit.boundary === "0110"
    && audit.xAction.name === "identity"
    && audit.yAction.name === "coordinate-swap"
    && audit.distinguishedOddFiller === "(1,0)"
  ), "mixed-direction C2^2 control");
  assert(mixedVector.cyclicallyInvisibleOnEveryProperSubgroup && mixedVector.postnikov.classNonzero);

  const essentialPolynomial = auditEssentialPolynomial();
  assert(essentialPolynomial.formalPolynomialNonzero);
  assert(essentialPolynomial.vanishesOnEveryOrder2Subgroup);

  const globallyNonzeroYetCyclicallyInvisible = audits.filter(
    (audit) => audit.globallyNonzeroYetCyclicallyInvisible,
  );
  assert.equal(globallyNonzeroYetCyclicallyInvisible.length, 8);

  const globalSurvivors = audits.filter((audit) => audit.postnikov.classNonzero);
  const minimumEnumeratedSurvivorOrder = Math.min(...globalSurvivors.map((audit) => audit.targetOrder));
  assert.equal(minimumEnumeratedSurvivorOrder, 4);
  assert(audits.filter((audit) => audit.targetOrder < 4).every((audit) => audit.postnikov.classZero));

  return {
    predecessor,
    d8,
    modelCounts: enumeration.modelCounts,
    audits,
    controls: { thinC2, vectorSwap, c4Inversion, c4Trivial, mixedVector },
    globalSurvivors,
    globallyNonzeroYetCyclicallyInvisible,
    essentialPolynomial,
    minimumEnumeratedSurvivorOrder,
  };
}

function compactControl(audit) {
  return {
    id: audit.id,
    target: audit.target,
    xAction: audit.xAction.name,
    yAction: audit.yAction.name,
    postnikovClassNonzero: audit.postnikov.classNonzero,
    cyclicRestrictionsNonzero: Object.fromEntries(Object.entries(audit.cyclicRestrictions).map(
      ([name, restriction]) => [name, restriction.classNonzero],
    )),
    fixedOddFillers: Object.fromEntries(Object.entries(audit.cyclicRestrictions).map(
      ([name, restriction]) => [name, restriction.fixedOddFillers],
    )),
    cyclicallyInvisibleOnEveryProperSubgroup: audit.cyclicallyInvisibleOnEveryProperSubgroup,
    muLiftCount: audit.independentLiftSearch.BValuedMuCocycleLiftCount,
  };
}

function buildCertificate(lab) {
  const body = {
    schema: "oasis.genesis-higher-question-quotients.certificate.v2",
    predecessor: lab.predecessor,
    derivation: lab.d8,
    finiteModelEnumeration: {
      targets: lab.modelCounts,
      totalGeneratedPointedCandidates: lab.audits.length,
      allCandidatesAudited: true,
      canonicalMap: "pi: Z[Q] -> B, [q] |-> q.b",
      surjectivityCriterion: "the additive subgroup generated by the Q-orbit of b equals B",
      actionCriterion: "rho(x),rho(y) are commuting boundary-preserving involutive automorphisms",
    },
    theorem: {
      exactGlobalCriterion: "[kappa_B]=0 iff [mu] lies in image(H^2(Q,B)->H^2(Q,C2))",
      executableGlobalCriterion: "[kappa_B]=0 iff a normalized B-valued 2-cocycle reducing pointwise to mu exists",
      globalCriterionProof: [
        "the canonical cochain F=mu.b satisfies boundary(F)=mu and kappa_B=delta F",
        "if kappa_B=delta gamma for a K_B-valued normalized cochain, then F-gamma is a B-valued cocycle lifting mu",
        "if L is a normalized B-valued cocycle lifting mu, then gamma=F-L is K_B-valued and delta gamma=kappa_B",
        "normalization loses no solutions: degenerate values of a lift lie in K_B and are removed by a K_B-valued normalization coboundary",
      ],
      cyclicRestrictionRepresentative: "for t in {x,y,xy}, r_t=mu(t,t)(t.b-b) in K_B",
      extensionLineResidues: { x: 1, y: 0, xy: 0 },
      exactRestrictionCriterion: "res_<t>[kappa_B] nonzero iff mu(t,t)=1 and t.b-b is not in (t-1)K_B",
      oddFillerCriterion: "the transport class of t.b-b is nonzero iff the odd filler fiber has no t-fixed element; the Postnikov restriction also requires mu(t,t)=1",
      restrictionCriterionProof: [
        "kappa_B(t,t,t)=mu(t,t)(t.b-b) and (1+t)(t.b-b)=0",
        "H^3(<t>,K_B)=ker(1+t)/(t-1)K_B",
        "t.b-b=(t-1)k with k in K_B iff b-k is a t-fixed odd filler",
        "for the chosen D8 section, mu(x,x)=1 while mu(y,y)=mu(xy,xy)=0",
      ],
      allProperCyclicRestrictionsDetectGlobalClassIff: false,
      anyCyclicSurvivalImpliesGlobalSurvival: true,
    },
    exhaustiveAudit: {
      candidates: lab.audits,
      globalEquivalenceChecks: lab.audits.length,
      cyclicSubgroupsPerCandidate: 3,
      cyclicFillerEquivalenceChecks: lab.audits.length * 3,
      globallyNonzeroYetCyclicallyInvisible: {
        count: lab.globallyNonzeroYetCyclicallyInvisible.length,
        candidateIds: lab.globallyNonzeroYetCyclicallyInvisible.map((audit) => audit.id),
      },
      kappaKernelChecks: lab.audits.length * 64,
      kappaCocycleChecks: lab.audits.length * 256,
      normalizedKPrimitiveAssignments: lab.audits.reduce((sum, audit) => (
        sum + audit.independentLiftSearch.normalizedAssignments
      ), 0),
      normalizedBMuLiftAssignments: lab.audits.reduce((sum, audit) => (
        sum + audit.independentLiftSearch.normalizedAssignments
      ), 0),
    },
    controls: {
      thinC2Collapse: compactControl(lab.controls.thinC2),
      vectorXSwapSurvivor: compactControl(lab.controls.vectorSwap),
      c4XInversionSurvivor: compactControl(lab.controls.c4Inversion),
      trivialActionC4MixedGlobalSurvivor: compactControl(lab.controls.c4Trivial),
      xIdentityYSwapMixedGlobalSurvivor: compactControl(lab.controls.mixedVector),
      trivialActionC4Essentiality: {
        controlId: lab.controls.c4Trivial.id,
        globalClassNonzero: lab.controls.c4Trivial.postnikov.classNonzero,
        everyProperCyclicRestrictionZero: lab.controls.c4Trivial.cyclicallyInvisibleOnEveryProperSubgroup,
        polynomialAudit: lab.essentialPolynomial,
      },
    },
    minimumFiniteTarget: {
      value: lab.minimumEnumeratedSurvivorOrder,
      lowerBoundProof: [
        "a surjective boundary B->C2 forces |B| to be even",
        "the only positive even order below 4 is 2",
        "an abelian group of order 2 is C2, its kernel is zero, and H^3(Q,0)=0",
      ],
      upperBoundWitnesses: [lab.controls.vectorSwap.id, lab.controls.c4Inversion.id],
      conclusion: "the minimum finite generated abelian pointed target retaining the global class is order 4",
    },
    comma: {
      schema: "oasis.comma.v1",
      claim: "minimal finite abelian pointed quotients can retain the D8 Postnikov class at order 4",
      objects: "all generated pointed Q-module quotients on C2, C4, and C2^2",
      method: "complete finite enumeration plus two independent exact cohomology decision procedures",
      measurement: "zero floating-point operations; every group, cochain, cocycle, lift, and coboundary equation evaluated exactly",
      assumptions: [
        "targets are finite abelian groups",
        "the boundary is Q-invariant and surjective",
        "the distinguished odd filler generates under the Q-action",
      ],
    },
    evaluationPolicy: {
      arithmetic: "exact finite group arithmetic only",
      candidatePolicy: "enumerate every boundary, compatible Q-action, and generated odd pointing for the declared target list",
      globalDecisionPolicy: "accept a class-zero decision only when both primitive search and independent mu-lift search agree",
      restrictionDecisionPolicy: "for x,y,xy, test mu(t,t)(t.b-b) modulo (t-1)K_B and separately test the transport/fixed-odd-filler equivalence",
      replayPolicy: "rebuild all objects from source and require canonical byte-independent equality and SHA-256 digest equality",
      falsifierPolicy: "retain controls with global nonzero class and zero restriction on every proper subgroup",
      stochasticChoices: 0,
      tolerance: 0,
    },
    theoremBoundary: {
      finiteAbelianPointedQuotientsClassifiedThroughOrder4: true,
      minimumAmongAllFiniteAbelianPointedTargetsProved: true,
      allThreeOrder2SubgroupsAudited: true,
      properSubgroupRestrictionsGloballyComplete: false,
      essentialTrivialActionC4ClassCertified: true,
      nonAbelianTargetsClassified: false,
      nonSoficityEstablished: false,
      universalApproximationArchitectureEstablished: false,
      hodgeTheoryEstablished: false,
      majorOpenConjectureResolved: false,
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

export function replayGenesisHigherQuestionQuotientsCertificate(candidate) {
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
  reject("predecessor digest", (value) => { value.predecessor.certificateDigest = "0".repeat(64); });
  reject("D8 group order", (value) => { value.derivation.groupOrder = 4; });
  reject("central involution", (value) => { value.derivation.centralInvolution = "T=p"; });
  reject("quotient identification", (value) => { value.derivation.quotient = "C4"; });
  reject("factor formula", (value) => { value.derivation.factorFormula = "mu=0"; });
  reject("factor table", (value) => { value.derivation.factorTable[1][1] ^= 1; });
  reject("factor cocycle checks", (value) => { value.derivation.factorCocycleChecks = 63; });
  reject("candidate total", (value) => { value.finiteModelEnumeration.totalGeneratedPointedCandidates -= 1; });
  reject("model boundary count", (value) => { value.finiteModelEnumeration.targets[2].surjectiveBoundaries = 2; });
  reject("candidate boundary", (value) => { value.exhaustiveAudit.candidates[0].boundary = "00"; });
  reject("candidate action", (value) => { value.exhaustiveAudit.candidates[1].xAction.images[1] = 2; });
  reject("orbit generation", (value) => { value.exhaustiveAudit.candidates[1].orbitGeneratesTarget = false; });
  reject("canonical lift digest", (value) => { value.exhaustiveAudit.candidates[1].canonicalLift.cochainDigest = "0".repeat(64); });
  reject("kernel checks", (value) => { value.exhaustiveAudit.candidates[1].postnikov.kernelChecks = 63; });
  reject("cocycle checks", (value) => { value.exhaustiveAudit.candidates[1].postnikov.cocycleChecks = 255; });
  reject("postnikov digest", (value) => { value.exhaustiveAudit.candidates[1].postnikov.cochainDigest = "f".repeat(64); });
  reject("primitive count", (value) => { value.exhaustiveAudit.candidates[1].postnikov.KValuedPrimitiveCount += 1; });
  reject("class decision", (value) => { value.controls.vectorXSwapSurvivor.postnikovClassNonzero = false; });
  reject("mu lift decision", (value) => { value.exhaustiveAudit.candidates[1].independentLiftSearch.muLifts = true; });
  reject("x residue", (value) => { value.controls.c4XInversionSurvivor.cyclicRestrictionsNonzero.x = false; });
  reject("y residue", (value) => { value.exhaustiveAudit.candidates[1].cyclicRestrictions.y.postnikovResidueRaw = 2; });
  reject("xy residue", (value) => { value.exhaustiveAudit.candidates[1].cyclicRestrictions.xy.classNonzero = true; });
  reject("fixed filler", (value) => { value.controls.vectorXSwapSurvivor.fixedOddFillers.x.push("(1,0)"); });
  reject("cyclic global iff overclaim", (value) => { value.theorem.allProperCyclicRestrictionsDetectGlobalClassIff = true; });
  reject("mixed control deletion", (value) => { delete value.controls.xIdentityYSwapMixedGlobalSurvivor; });
  reject("cyclically invisible count", (value) => { value.exhaustiveAudit.globallyNonzeroYetCyclicallyInvisible.count = 7; });
  reject("essential polynomial", (value) => { value.controls.trivialActionC4Essentiality.polynomialAudit.formalPolynomialNonzero = false; });
  reject("diagonal line substitution", (value) => { value.controls.trivialActionC4Essentiality.polynomialAudit.lineSubstitutions.xy.zero = false; });
  reject("minimum order", (value) => { value.minimumFiniteTarget.value = 2; });
  reject("lower-bound proof", (value) => { value.minimumFiniteTarget.lowerBoundProof.pop(); });
  reject("COMMA method", (value) => { value.comma.method = "sampling"; });
  reject("evaluation tolerance", (value) => { value.evaluationPolicy.tolerance = 1e-9; });
  reject("nonabelian overclaim", (value) => { value.theoremBoundary.nonAbelianTargetsClassified = true; });
  reject("nonsofic overclaim", (value) => { value.theoremBoundary.nonSoficityEstablished = true; });
  reject("Hodge overclaim", (value) => { value.theoremBoundary.hodgeTheoryEstablished = true; });
  reject("undeclared field", (value) => { value.theoremBoundary.PEqualsNP = true; });
  reject("certificate digest", (value) => { value.certificateDigest = "f".repeat(64); }, false);
  return cases;
}

export function runGenesisHigherQuestionQuotients() {
  const firstLab = buildLaboratory();
  const firstCertificate = buildCertificate(firstLab);
  const secondCertificate = buildCertificate(buildLaboratory());
  assert.equal(canonical(firstCertificate), canonical(secondCertificate));
  assert.equal(firstCertificate.certificateDigest, secondCertificate.certificateDigest);
  assert(validateCertificate(firstCertificate, secondCertificate));
  assert(replayGenesisHigherQuestionQuotientsCertificate(firstCertificate));
  const tamperCases = tamperSuite(firstCertificate);
  const compactControlNames = [
    "thinC2Collapse",
    "vectorXSwapSurvivor",
    "c4XInversionSurvivor",
    "trivialActionC4MixedGlobalSurvivor",
    "xIdentityYSwapMixedGlobalSurvivor",
  ];
  return {
    schema: "oasis.genesis-higher-question-quotients.v2",
    status: "PASS",
    result: {
      quotient: "Q=V4",
      factorFormula: firstLab.d8.factorFormula,
      generatedPointedCandidates: firstLab.audits.length,
      globalSurvivors: firstLab.globalSurvivors.length,
      globallyNonzeroYetInvisibleOnAllProperSubgroups: firstLab.globallyNonzeroYetCyclicallyInvisible.length,
      minimumFiniteTargetOrder: firstLab.minimumEnumeratedSurvivorOrder,
      controls: Object.fromEntries(compactControlNames.map((name) => {
        const control = firstCertificate.controls[name];
        return [name, {
        target: control.target,
        globalNonzero: control.postnikovClassNonzero,
        cyclicRestrictionsNonzero: control.cyclicRestrictionsNonzero,
        cyclicallyInvisibleOnEveryProperSubgroup: control.cyclicallyInvisibleOnEveryProperSubgroup,
        }];
      })),
      trivialActionC4EssentialPolynomialVerified: firstLab.essentialPolynomial.formalPolynomialNonzero
        && firstLab.essentialPolynomial.vanishesOnEveryOrder2Subgroup,
      globalEquivalenceVerifiedForEveryCandidate: true,
      allThreeCyclicFillerEquivalencesVerifiedForEveryCandidate: true,
    },
    deterministicReplay: {
      independentlyRebuiltTwice: true,
      canonicalEquality: true,
      certificateDigest: firstCertificate.certificateDigest,
    },
    theoremBoundary: firstCertificate.theoremBoundary,
    certificate: firstCertificate,
    tamper: {
      attempted: tamperCases.length,
      rejected: tamperCases.filter(({ rejected }) => rejected).length,
      cases: tamperCases,
    },
  };
}

function printPassLines(result) {
  console.log("PASS D8 quotient derivation: Q=V4 and mu((a,b),(c,d))=c(a+b) mod 2");
  console.log(`PASS exhaustive pointed targets: ${result.result.generatedPointedCandidates} generated quotients audited`);
  console.log("PASS global criterion: K-valued primitive search agrees with independent B-valued mu-lift search");
  console.log("PASS cyclic criteria: x, y, and xy restrictions audited against extension residues and fixed odd fillers");
  console.log(`PASS essentiality: ${result.result.globallyNonzeroYetInvisibleOnAllProperSubgroups} global classes vanish on every proper subgroup`);
  console.log("PASS polynomial control: u^2v+uv^2=uv(u+v) is formal-nonzero and vanishes on all three lines");
  console.log("PASS minimum target: order 4 among all finite abelian generated pointed targets");
  console.log(`PASS deterministic replay: ${result.deterministicReplay.certificateDigest}`);
  console.log(`PASS replay/tamper: ${result.tamper.rejected}/${result.tamper.attempted} mutations rejected`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = runGenesisHigherQuestionQuotients();
  printPassLines(result);
  console.log(JSON.stringify(result, null, 2));
}
