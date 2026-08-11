import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SCHEMA = "oasis.genesis-coupled-latin-horn-coequalizer.v1";
const CERTIFICATE_KEYS = deepFreeze([
  "aliasPoisonAudit",
  "certificateDigest",
  "payload",
  "payloadDigest",
  "schema",
  "tamperAudit",
]);

function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((key) => (
      JSON.stringify(key) + ":" + canonical(value[key])
    )).join(",") + "}";
  }
  return JSON.stringify(value);
}

function digest(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) deepFreeze(value[key], seen);
  return Object.freeze(value);
}

function isDeepFrozen(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value)
    && Reflect.ownKeys(value).every((key) => isDeepFrozen(value[key], seen));
}

function range(size) {
  return Array.from({ length: size }, (_, index) => index);
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function arraysEqual(left, right) {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function enumerateVectors(length, alphabetSize) {
  const result = [];
  const current = Array(length).fill(0);
  function visit(index) {
    if (index === length) {
      result.push([...current]);
      return;
    }
    for (let value = 0; value < alphabetSize; value += 1) {
      current[index] = value;
      visit(index + 1);
    }
  }
  visit(0);
  return result;
}

function enumerateFunctions(domainSize, codomainSize) {
  if (domainSize === 0) return [[]];
  if (codomainSize === 0) return [];
  return enumerateVectors(domainSize, codomainSize);
}

function permutations(values) {
  if (values.length === 0) return [[]];
  const result = [];
  values.forEach((head, index) => {
    const tail = values.slice(0, index).concat(values.slice(index + 1));
    for (const suffix of permutations(tail)) result.push([head, ...suffix]);
  });
  return result;
}

function inversePermutation(permutation) {
  const inverse = Array(permutation.length);
  permutation.forEach((image, source) => {
    inverse[image] = source;
  });
  return inverse;
}

function tupleKey(tuple) {
  return tuple.join("");
}

function sortRelation(relation) {
  return relation.map((tuple) => [...tuple]).sort((left, right) => (
    compareStrings(tupleKey(left), tupleKey(right))
  ));
}

function relationProjection(relation, coordinates) {
  const keyed = new Map();
  for (const tuple of relation) {
    const projected = coordinates.map((coordinate) => tuple[coordinate]);
    keyed.set(tupleKey(projected), projected);
  }
  return [...keyed.values()].sort((left, right) => (
    compareStrings(tupleKey(left), tupleKey(right))
  ));
}

function relationKeys(relation) {
  return relation.map(tupleKey).sort(compareStrings);
}

function xor(...values) {
  return values.reduce((accumulator, value) => accumulator ^ value, 0);
}

const BITS = deepFreeze([0, 1]);
const FULL_RELATION = deepFreeze(enumerateVectors(3, 2));
const EVEN_RELATION = deepFreeze(
  FULL_RELATION.filter(([a, b, c]) => xor(a, b, c) === 0),
);
const ADDRESS_TABLE = deepFreeze([
  { answer: 0, address: "q0" },
  { answer: 1, address: "q1" },
]);
const COORDINATE_SUBSETS = deepFreeze([
  [0], [1], [2], [0, 1], [0, 2], [1, 2],
]);
const COORDINATE_PARTITIONS = deepFreeze([
  { left: [0], right: [1, 2] },
  { left: [1], right: [0, 2] },
  { left: [2], right: [0, 1] },
]);
const CATALYST_FIXTURE = deepFreeze({
  generators: ["x0", "y0", "x1", "y1", "k"],
  relations: [
    { address: 0, left: [1, 0, 0, 0, 1], right: [0, 1, 0, 0, 1] },
    { address: 1, left: [0, 0, 1, 0, 1], right: [0, 0, 0, 1, 1] },
  ],
  maxMonoidAssignment: { x0: 0, y0: 1, x1: 0, y1: 1, k: 1 },
});
const FIBER = deepFreeze([0, 1, 2]);
const SWAP = deepFreeze([1, 0, 2]);
const QUOTIENT = deepFreeze([0, 0, 1]);
const LATER_R = deepFreeze([0, 0, 2]);

function buildHigherArityEvidence() {
  assert.deepEqual(relationKeys(EVEN_RELATION), ["000", "011", "101", "110"]);
  assert.equal(EVEN_RELATION.length, 4);
  assert.equal(FULL_RELATION.length, 8);

  const projections = COORDINATE_SUBSETS.map((coordinates) => {
    const evenProjection = relationProjection(EVEN_RELATION, coordinates);
    const fullProjection = relationProjection(FULL_RELATION, coordinates);
    assert.deepEqual(evenProjection, fullProjection);
    return {
      coordinates: [...coordinates],
      evenProjection,
      fullProjection,
      identical: true,
    };
  });

  const binaryRecoding = BITS.flatMap((a) => BITS.map((b) => ({
    a,
    b,
    uniquelyCompletingC: xor(a, b),
  })));
  assert.deepEqual(
    sortRelation(binaryRecoding.map(({ a, b, uniquelyCompletingC }) => (
      [a, b, uniquelyCompletingC]
    ))),
    sortRelation(EVEN_RELATION),
  );

  return {
    carriers: { A: [...BITS], B: [...BITS], C: [...BITS] },
    relation: clone(EVEN_RELATION),
    fullRelation: clone(FULL_RELATION),
    cardinalities: { even: EVEN_RELATION.length, full: FULL_RELATION.length },
    unaryAndPairwiseProjections: projections,
    allDeclaredLowArityProjectionsEqual: projections.every((entry) => entry.identical),
    xorGraphControl: {
      table: binaryRecoding,
      relationIsGraphOfBinaryXor: true,
      consequence: "Outside the fixed projection interface, the ternary relation can be recoded by the binary operation c=a xor b.",
    },
    exactScope: "Nonfaithfulness is proved only for the declared unary/pairwise projection shadow; no claim is made against binary observers allowed to Skolemize or retain the discarded ternary table.",
  };
}

function expectedAddress(answer) {
  return ADDRESS_TABLE.find((entry) => entry.answer === answer).address;
}

function branchKey(branch) {
  return `${branch.a}${branch.b}${branch.c}`;
}

const DEFAULT_MECHANISMS = deepFreeze({
  answerRole: true,
  catalyst: true,
  contextRole: true,
  ternarySupport: true,
  h3Certificate: true,
  phaseToActionPolicy: true,
  coequalizerAdmission: true,
});

function evaluateBranch(tuple, overrides = {}) {
  const [a, b, c] = tuple;
  const mechanisms = { ...DEFAULT_MECHANISMS, ...overrides };
  const effectiveA = overrides.answerValueOverride ?? a;
  const effectiveB = overrides.catalystModeOverride ?? b;
  const effectiveC = overrides.contextValueOverride ?? c;
  const requiredAddress = expectedAddress(effectiveA);
  const selectedAddress = Object.hasOwn(overrides, "hardcodedAddress")
    ? overrides.hardcodedAddress
    : requiredAddress;
  const answerRoleAvailable = mechanisms.answerRole === true;
  const addressMatchesAnswer = answerRoleAvailable && selectedAddress === requiredAddress;
  const catalystCapabilityAvailable = mechanisms.catalyst === true && addressMatchesAnswer;
  const contextRoleAvailable = mechanisms.contextRole === true;
  const latinSupportPresent = mechanisms.ternarySupport === true
    && xor(effectiveA, effectiveB, effectiveC) === 0;
  const declaredActionTransductionPresent = mechanisms.phaseToActionPolicy === true
    && latinSupportPresent;
  const declaredCoequalizerAdmission = answerRoleAvailable
    && catalystCapabilityAvailable
    && contextRoleAvailable
    && latinSupportPresent
    && declaredActionTransductionPresent
    && mechanisms.coequalizerAdmission === true;

  return {
    a,
    b,
    c,
    effectiveValues: { a: effectiveA, b: effectiveB, c: effectiveC },
    requiredAddress,
    selectedAddress,
    answerRoleAvailable,
    addressMatchesAnswer,
    capability: catalystCapabilityAvailable
      ? `kappa_${effectiveA}_${effectiveB}`
      : null,
    catalystCapabilityAvailable,
    contextRoleAvailable,
    ternarySupport: latinSupportPresent,
    pointwiseOmegaABC: omega(effectiveA, effectiveB, effectiveC),
    globalDeclaredH3CertificatePresent: mechanisms.h3Certificate === true,
    pointwiseOmegaDrivesAdmission: false,
    declaredActionTransductionPresent,
    declaredCoequalizerAdmission,
  };
}

function buildBranchFamily(overrides = {}) {
  return FULL_RELATION.map((tuple) => evaluateBranch(tuple, overrides));
}

function birthKeys(branches, predicate = (branch) => branch.declaredCoequalizerAdmission) {
  return branches.filter(predicate).map(branchKey).sort(compareStrings);
}

function symmetricDifference(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return [...new Set([...left, ...right])]
    .filter((value) => leftSet.has(value) !== rightSet.has(value))
    .sort(compareStrings);
}

function buildCausalAndAblationEvidence() {
  const branches = buildBranchFamily();
  const baselineBirths = birthKeys(branches);
  assert.deepEqual(baselineBirths, relationKeys(EVEN_RELATION));
  assert(branches.filter((branch) => branch.ternarySupport)
    .every((branch) => branch.pointwiseOmegaABC === 0));

  const hardcodedAddresses = BITS.map((fixedAddress) => {
    const address = expectedAddress(fixedAddress);
    const evaluated = buildBranchFamily({ hardcodedAddress: address });
    const births = birthKeys(evaluated);
    assert.equal(births.length, 2);
    assert.notDeepEqual(births, baselineBirths);
    return {
      fixedAddress: address,
      births,
      lostBirths: baselineBirths.filter((key) => !births.includes(key)),
      preservesFullBranchingFamily: false,
    };
  });

  const constantValueAblations = [0, 1, 2].flatMap((coordinate) => (
    BITS.map((constant) => {
      const overrideKey = [
        "answerValueOverride",
        "catalystModeOverride",
        "contextValueOverride",
      ][coordinate];
      const evaluated = buildBranchFamily({ [overrideKey]: constant });
      const births = birthKeys(evaluated);
      const difference = symmetricDifference(baselineBirths, births);
      assert.equal(births.length, 4);
      assert.equal(difference.length, 4);
      return {
        mechanism: ["answer", "catalystMode", "context"][coordinate],
        constant,
        births,
        symmetricDifferenceFromBaseline: difference,
        preservesBirthFamily: false,
      };
    })
  ));

  const deletionSpecifications = [
    { mechanism: "answerRole", overrides: { answerRole: false }, expectedBirthCount: 0, reason: "No answer-dependent q_a is formed." },
    { mechanism: "catalyst", overrides: { catalyst: false }, expectedBirthCount: 0, reason: "Cap(q_a) is empty without k." },
    { mechanism: "contextRole", overrides: { contextRole: false }, expectedBirthCount: 0, reason: "No three-role support cell exists." },
    { mechanism: "ternarySupport", overrides: { ternarySupport: false }, expectedBirthCount: 0, reason: "The declared Latin hyperedge is absent." },
    { mechanism: "h3Certificate", overrides: { h3Certificate: false }, expectedBirthCount: 4, reason: "The global H3 certificate is optional and causally independent of the declared coequalizer birth." },
    { mechanism: "phaseToActionPolicy", overrides: { phaseToActionPolicy: false }, expectedBirthCount: 0, reason: "The stipulated support-to-action transduction is unavailable." },
    { mechanism: "coequalizerAdmission", overrides: { coequalizerAdmission: false }, expectedBirthCount: 0, reason: "No universal solution role is admitted." },
  ];
  const deletions = deletionSpecifications.map((specification) => {
    const evaluated = buildBranchFamily(specification.overrides);
    const births = birthKeys(evaluated);
    assert.equal(births.length, specification.expectedBirthCount);
    return {
      mechanism: specification.mechanism,
      evaluatorOverrides: specification.overrides,
      reason: specification.reason,
      births,
      birthCount: births.length,
      expectedBirthCount: specification.expectedBirthCount,
      derivedByBranchEvaluator: true,
    };
  });
  const h3Deletion = deletions.find((entry) => entry.mechanism === "h3Certificate");
  assert.deepEqual(h3Deletion.births, baselineBirths);

  return {
    eventSchema: [
      { event: "answer(a)", support: [], output: "role a and address q_a" },
      { event: "context(c)", support: [], output: "role c" },
      { event: "catalytic(a,b)", support: ["answer(a)", "k"], output: "proof-relevant kappa_(a,b)" },
      { event: "admit(a,b,c)", support: ["answer(a)", "catalytic(a,b)", "context(c)"], output: "declared universal coequalizer role" },
      { event: "use(f)", support: ["admit(a,b,c)", "later invariant f"], output: "unique descent bar(f)" },
    ],
    branches,
    baselineBirths,
    answerDependentAddresses: clone(ADDRESS_TABLE),
    hardcodedAddressAblations: hardcodedAddresses,
    constantValueAblations,
    deletionAblations: deletions,
    optionalH3DeletionPreservesCoreCoequalizerBirths: true,
    supportedCellsHavePointwiseOmegaABCZero: true,
    h3CertificateIndependentFromAdmissionEvaluator: true,
    noSingleConstantPreservesBranchwiseBirths:
      constantValueAblations.every((entry) => !entry.preservesBirthFamily),
  };
}

function dot(word, assignment) {
  return word.reduce((total, multiplicity, index) => (
    total + multiplicity * assignment[index]
  ), 0);
}

function maxMonoidValue(word, assignment) {
  const presentValues = [];
  word.forEach((multiplicity, index) => {
    if (multiplicity > 0) presentValues.push(assignment[index]);
  });
  return presentValues.length === 0 ? 0 : Math.max(...presentValues);
}

function buildCatalystEvidence() {
  const assignment = CATALYST_FIXTURE.generators.map((generator) => (
    CATALYST_FIXTURE.maxMonoidAssignment[generator]
  ));

  const relations = CATALYST_FIXTURE.relations.map((relation) => {
    const address = relation.address;
    const xIndex = address === 0 ? 0 : 2;
    const yIndex = address === 0 ? 1 : 3;
    const leftValue = maxMonoidValue(relation.left, assignment);
    const rightValue = maxMonoidValue(relation.right, assignment);
    assert.equal(leftValue, rightValue);
    assert.notEqual(assignment[xIndex], assignment[yIndex]);
    const groupRelation = relation.left.map((value, index) => value - relation.right[index]);
    assert.equal(groupRelation[4], 0);
    assert.equal(groupRelation[xIndex], 1);
    assert.equal(groupRelation[yIndex], -1);
    return {
      address,
      equation: `x${address}+k=y${address}+k`,
      left: [...relation.left],
      right: [...relation.right],
      maxMonoidWitness: {
        assignment: clone(CATALYST_FIXTURE.maxMonoidAssignment),
        leftValue,
        rightValue,
        xValue: assignment[xIndex],
        yValue: assignment[yIndex],
        relationRespected: true,
        xNotEqualY: true,
      },
      groupCompletionRelation: groupRelation,
      catalystCoordinateCancels: groupRelation[4] === 0,
      groupCompletionForcesXEqualsY: true,
    };
  });

  const capabilities = [];
  for (const address of BITS) {
    for (const mode of BITS) {
      for (const catalystPresent of [false, true]) {
        const inhabitants = catalystPresent ? [`kappa_${address}_${mode}`] : [];
        assert.equal(inhabitants.length, catalystPresent ? 1 : 0);
        capabilities.push({
          question: `q${address}`,
          mode,
          catalystPresent,
          inhabitants,
          endpointCatalystBefore: catalystPresent ? 1 : 0,
          endpointCatalystAfter: catalystPresent ? 1 : 0,
        });
      }
    }
  }
  for (const address of BITS) {
    const presentModes = capabilities.filter((entry) => (
      entry.question === `q${address}` && entry.catalystPresent
    )).flatMap((entry) => entry.inhabitants);
    assert.deepEqual(presentModes, [`kappa_${address}_0`, `kappa_${address}_1`]);
  }
  assert(capabilities.filter((entry) => !entry.catalystPresent)
    .every((entry) => entry.inhabitants.length === 0));
  const presentKappaProofs = capabilities
    .filter((entry) => entry.catalystPresent)
    .flatMap((entry) => entry.inhabitants);
  const absentKappaProofs = capabilities
    .filter((entry) => !entry.catalystPresent)
    .flatMap((entry) => entry.inhabitants);
  assert.equal(presentKappaProofs.length, 4);
  assert.equal(absentKappaProofs.length, 0);

  return {
    presentation: clone(CATALYST_FIXTURE),
    relations,
    proofRelevantCapabilityTable: capabilities,
    modesBoundToCatalystAvailability: true,
    catalystSupportMinimalityAudit: {
      kappaProofsWithK: presentKappaProofs,
      kappaProofCountWithK: presentKappaProofs.length,
      kappaProofsAfterDeletingK: absentKappaProofs,
      kappaProofCountAfterDeletingK: absentKappaProofs.length,
      allKappaProofsDisappearWhenKIsDeleted: true,
    },
    endpointInvariantCatalyst: true,
    groupCompletionErasesCatalystNecessity: true,
    boundary: "This proves a finite catalytic-capability calibration. It does not prove that the H3 phase or the coequalizer admission is forced by the resource presentation.",
  };
}

function omega(i, j, k) {
  return (i * j * k) & 1;
}

function delta3(cochain, a, b, c, d) {
  return xor(
    cochain(b, c, d),
    cochain(xor(a, b), c, d),
    cochain(a, xor(b, c), d),
    cochain(a, b, xor(c, d)),
    cochain(a, b, c),
  );
}

function cochain2FromTable(table) {
  return (a, b) => table[2 * a + b];
}

function delta2(cochain, a, b, c) {
  return xor(
    cochain(b, c),
    cochain(xor(a, b), c),
    cochain(a, xor(b, c)),
    cochain(a, b),
  );
}

function buildH3Evidence() {
  const triples = enumerateVectors(3, 2);
  const quadruples = enumerateVectors(4, 2);
  const omegaTable = triples.map(([i, j, k]) => ({
    input: [i, j, k],
    value: omega(i, j, k),
  }));
  assert.equal(omegaTable.filter((entry) => entry.value === 1).length, 1);
  assert.deepEqual(omegaTable.find((entry) => entry.value === 1).input, [1, 1, 1]);
  assert(omegaTable.every((entry) => (
    entry.input.every((value) => value === 1) || entry.value === 0
  )));

  const cocycleAudit = quadruples.map(([a, b, c, d]) => ({
    input: [a, b, c, d],
    delta: delta3(omega, a, b, c, d),
  }));
  assert(cocycleAudit.every((entry) => entry.delta === 0));

  const allTwoCochains = enumerateVectors(4, 2);
  const normalizedTwoCochains = allTwoCochains.filter((table) => (
    table[0] === 0 && table[1] === 0 && table[2] === 0
  ));
  assert.equal(allTwoCochains.length, 16);
  assert.equal(normalizedTwoCochains.length, 2);

  const coboundaryAudit = normalizedTwoCochains.map((table) => {
    const phi = cochain2FromTable(table);
    const deltaTable = triples.map(([a, b, c]) => delta2(phi, a, b, c));
    const omegaValues = triples.map(([a, b, c]) => omega(a, b, c));
    const equalsOmega = arraysEqual(deltaTable, omegaValues);
    assert.equal(delta2(phi, 1, 1, 1), 0);
    assert.equal(equalsOmega, false);
    return {
      table: [...table],
      phi11: table[3],
      deltaTable,
      deltaAt111: delta2(phi, 1, 1, 1),
      omegaAt111: omega(1, 1, 1),
      equalsOmega,
    };
  });

  return {
    group: "C2",
    coefficients: "F2 with trivial action",
    omegaFormula: "omega(i,j,k)=i*j*k mod 2",
    omegaTable,
    normalized: true,
    exhaustiveCocycleAudit: {
      quadruplesTested: cocycleAudit.length,
      nonzeroDeltas: cocycleAudit.filter((entry) => entry.delta !== 0).length,
      pass: cocycleAudit.every((entry) => entry.delta === 0),
      rows: cocycleAudit,
    },
    exhaustiveNormalizedTwoCochainAudit: {
      allTwoCochainsEnumerated: allTwoCochains.length,
      normalizedTwoCochainsEnumerated: normalizedTwoCochains.length,
      coboundariesEqualToOmega: coboundaryAudit.filter((entry) => entry.equalsOmega).length,
      pass: coboundaryAudit.every((entry) => !entry.equalsOmega),
      rows: coboundaryAudit,
    },
    nontrivialCohomologyCalibration: true,
    boundary: "The nonzero H3 class obstructs a normalized binary-cochain gauge trivialization. It does not force the later involution action or coequalizer policy.",
  };
}

function composeThrough(quotientMap, mediator) {
  return quotientMap.map((value) => mediator[value]);
}

function equalizesSwap(fn, swap = SWAP) {
  return fn.every((value, index) => value === fn[swap[index]]);
}

function factorizationCount(sourceMap, candidateQuotient, quotientSize, targetSize) {
  return enumerateFunctions(quotientSize, targetSize).filter((mediator) => (
    arraysEqual(composeThrough(candidateQuotient, mediator), sourceMap)
  )).length;
}

function auditUniversalFactorization(candidateQuotient, quotientSize, targetSizes) {
  return targetSizes.map((targetSize) => {
    const maps = enumerateFunctions(FIBER.length, targetSize);
    const rows = maps.map((fn) => {
      const invariant = equalizesSwap(fn);
      const factors = factorizationCount(fn, candidateQuotient, quotientSize, targetSize);
      if (invariant) assert.equal(factors, 1);
      else assert.equal(factors, 0);
      return { fn, invariant, factorizationCount: factors };
    });
    return {
      targetSize,
      mapsTested: maps.length,
      invariantMaps: rows.filter((row) => row.invariant).length,
      nonInvariantMaps: rows.filter((row) => !row.invariant).length,
      uniqueInvariantFactorizations: rows.filter((row) => (
        row.invariant && row.factorizationCount === 1
      )).length,
      nonInvariantFactorizations: rows.filter((row) => (
        !row.invariant && row.factorizationCount > 0
      )).length,
      pass: rows.every((row) => (
        row.invariant ? row.factorizationCount === 1 : row.factorizationCount === 0
      )),
    };
  });
}

function auditCandidateAgainstOldTargets(candidateQuotient, quotientSize) {
  for (const targetSize of [1, 3]) {
    for (const fn of enumerateFunctions(FIBER.length, targetSize)
      .filter((candidate) => equalizesSwap(candidate))) {
      const count = factorizationCount(fn, candidateQuotient, quotientSize, targetSize);
      if (count !== 1) {
        return {
          realizesCoequalizer: false,
          firstFailure: { targetSize, fn, factorizationCount: count },
        };
      }
    }
  }
  return { realizesCoequalizer: true, firstFailure: null };
}

function buildCoequalizerEvidence() {
  assert.equal(equalizesSwap(QUOTIENT), true);
  const targetAudits = auditUniversalFactorization(QUOTIENT, 2, [0, 1, 2, 3, 4]);
  assert(targetAudits.every((entry) => entry.pass));
  assert.deepEqual(
    targetAudits.map((entry) => entry.invariantMaps),
    [0, 1, 4, 9, 16],
  );

  const terminalCandidate = [0, 0, 0];
  const terminalAudit = auditCandidateAgainstOldTargets(terminalCandidate, 1);
  assert.equal(terminalAudit.realizesCoequalizer, false);
  assert.equal(new Set(terminalAudit.firstFailure.fn).size > 1, true);
  assert.equal(terminalAudit.firstFailure.factorizationCount, 0);

  const oldFiberCandidates = enumerateFunctions(FIBER.length, FIBER.length)
    .filter((candidate) => equalizesSwap(candidate));
  assert.equal(oldFiberCandidates.length, 9);
  const oldFiberAudits = oldFiberCandidates.map((candidate) => ({
    candidate,
    ...auditCandidateAgainstOldTargets(candidate, 3),
  }));
  assert(oldFiberAudits.every((entry) => !entry.realizesCoequalizer));

  assert.equal(equalizesSwap(LATER_R), true);
  const idempotentE = [...LATER_R];
  const sectionOfQ = [0, 2];
  const identityOnQ = sectionOfQ.map((fiberValue) => QUOTIENT[fiberValue]);
  const splitCompositeOnF = QUOTIENT.map((quotientValue) => sectionOfQ[quotientValue]);
  const idempotentSquare = idempotentE.map((fiberValue) => idempotentE[fiberValue]);
  assert.deepEqual(identityOnQ, [0, 1]);
  assert.deepEqual(splitCompositeOnF, idempotentE);
  assert.deepEqual(idempotentSquare, idempotentE);
  const laterMediators = enumerateFunctions(2, 3).filter((mediator) => (
    arraysEqual(composeThrough(QUOTIENT, mediator), LATER_R)
  ));
  assert.deepEqual(laterMediators, [[0, 2]]);

  return {
    declaredPhaseToActionTransduction: {
      phaseZeroAction: "id_F",
      phaseOneAction: "s=(0 1), s(2)=2",
      policyStatus: "declared, not derived",
    },
    finiteCarrier: [...FIBER],
    swap: [...SWAP],
    orbitClasses: [[0, 1], [2]],
    quotientCarrier: [0, 1],
    quotientMap: [...QUOTIENT],
    equationQEqualsQAfterS: QUOTIENT.map((value, index) => (
      value === QUOTIENT[SWAP[index]]
    )).every(Boolean),
    exhaustiveUniversalFactorization: {
      targetSizes: [0, 1, 2, 3, 4],
      targetAudits,
      totalMapsTested: targetAudits.reduce((sum, entry) => sum + entry.mapsTested, 0),
      pass: true,
    },
    oldDoctrineFailure: {
      oldObjectCardinalities: [1, 3],
      terminalCandidate: { map: terminalCandidate, ...terminalAudit },
      fiberCandidatesTested: oldFiberCandidates.length,
      fiberCandidatesRealizingCoequalizer:
        oldFiberAudits.filter((entry) => entry.realizesCoequalizer).length,
      fiberCandidateAudits: oldFiberAudits,
      noOldObjectRealizesCoequalizer: true,
      cauchyCompletionBoundary: {
        oldIdempotentE: idempotentE,
        idempotentSquare,
        quotientRetractionQ: [...QUOTIENT],
        quotientSectionI: sectionOfQ,
        qAfterI: identityOnQ,
        iAfterQ: splitCompositeOnF,
        qSplitsOldIdempotent: true,
        oldDoctrineExplicitlyLacksSplittingObjectQ: true,
        interpretation: "The admitted two-point quotient also splits the old idempotent e=(0,0,2); the old doctrine is deliberately not Cauchy/Karoubi complete.",
      },
    },
    laterUse: {
      invariantMapR: [...LATER_R],
      uniqueDescent: [...laterMediators[0]],
      descentEquation: composeThrough(QUOTIENT, laterMediators[0]),
      factorizationCount: laterMediators.length,
      essentiallyUsesDeclaredQuotientRoleInThisDoctrine: true,
    },
    universalAdmissionCalibration: true,
    resourceSeparationControl: {
      actsOnFiberFOnly: true,
      actsOnCatalystResourceMonoid: false,
      cancelsCatalystK: false,
    },
    boundary: "Universality is certified only in the declared concrete coequalizer doctrine. This does not certify a formation-monad change, endogenous rule generation, or a Level-C birth.",
  };
}

function mergeProjectedTuple(leftCoordinates, leftValues, rightCoordinates, rightValues) {
  const tuple = Array(3);
  leftCoordinates.forEach((coordinate, index) => {
    tuple[coordinate] = leftValues[index];
  });
  rightCoordinates.forEach((coordinate, index) => {
    tuple[coordinate] = rightValues[index];
  });
  return tuple;
}

function buildRectangleForPartition(relation, partition) {
  const leftProjection = relationProjection(relation, partition.left);
  const rightProjection = relationProjection(relation, partition.right);
  const product = [];
  for (const left of leftProjection) {
    for (const right of rightProjection) {
      product.push(mergeProjectedTuple(partition.left, left, partition.right, right));
    }
  }
  return sortRelation(product);
}

function buildIrreducibilityEvidence(relation = EVEN_RELATION) {
  const relationKeySet = new Set(relationKeys(relation));
  const partitions = COORDINATE_PARTITIONS.map((partition) => {
    const rectangle = buildRectangleForPartition(relation, partition);
    const rectangleKeys = relationKeys(rectangle);
    const extraTuples = rectangleKeys.filter((key) => !relationKeySet.has(key));
    const missingTuples = relationKeys(relation).filter((key) => !rectangleKeys.includes(key));
    assert.equal(rectangle.length, 8);
    assert.equal(extraTuples.length, 4);
    assert.equal(missingTuples.length, 0);
    return {
      partition: clone(partition),
      leftProjectionSize: relationProjection(relation, partition.left).length,
      rightProjectionSize: relationProjection(relation, partition.right).length,
      rectangularProductSize: rectangle.length,
      relationSize: relation.length,
      extraTuples,
      missingTuples,
      relationIsRectangle: false,
    };
  });
  return {
    partitions,
    coordinateRolePreservingRectangleFactorizationExists: false,
    connectedThreeRoleHyperedgeSupport: true,
    boundary: "This excludes coordinate-role-preserving Cartesian products only. It is not a no-go theorem for every product notion up to genetic bisimulation.",
  };
}

function transformRelation(relation, coordinatePermutation, bitFlips) {
  return sortRelation(relation.map((tuple) => {
    const transformed = Array(tuple.length);
    tuple.forEach((value, oldCoordinate) => {
      transformed[coordinatePermutation[oldCoordinate]] = value ^ bitFlips[oldCoordinate];
    });
    return transformed;
  }));
}

function transformMapUnderRelabeling(map, domainPermutation, codomainPermutation) {
  const inverseDomain = inversePermutation(domainPermutation);
  return range(domainPermutation.length).map((newInput) => (
    codomainPermutation[map[inverseDomain[newInput]]]
  ));
}

function buildPresentationControls() {
  let cubeAutomorphismsTested = 0;
  let evenOrbitHits = 0;
  let oddOrbitHits = 0;
  let projectionChecks = 0;
  let rectangleChecks = 0;
  for (const coordinatePermutation of permutations([0, 1, 2])) {
    for (const bitFlips of enumerateVectors(3, 2)) {
      const transformed = transformRelation(EVEN_RELATION, coordinatePermutation, bitFlips);
      assert.equal(transformed.length, 4);
      for (const coordinates of COORDINATE_SUBSETS) {
        assert.deepEqual(
          relationProjection(transformed, coordinates),
          relationProjection(FULL_RELATION, coordinates),
        );
        projectionChecks += 1;
      }
      const parityValues = transformed.map((tuple) => xor(...tuple));
      if (parityValues.every((value) => value === 0)) evenOrbitHits += 1;
      else if (parityValues.every((value) => value === 1)) oddOrbitHits += 1;
      else assert.fail("Latin relation left its parity gauge orbit");
      const irreducibility = buildIrreducibilityEvidence(transformed);
      rectangleChecks += irreducibility.partitions.length;
      cubeAutomorphismsTested += 1;
    }
  }
  assert.equal(cubeAutomorphismsTested, 48);
  assert.equal(evenOrbitHits, 24);
  assert.equal(oddOrbitHits, 24);

  let quotientRelabelingsTested = 0;
  for (const fiberPermutation of permutations([0, 1, 2])) {
    const transformedSwap = transformMapUnderRelabeling(
      SWAP,
      fiberPermutation,
      fiberPermutation,
    );
    for (const quotientPermutation of permutations([0, 1])) {
      const transformedQuotient = transformMapUnderRelabeling(
        QUOTIENT,
        fiberPermutation,
        quotientPermutation,
      );
      assert.equal(equalizesSwap(transformedQuotient, transformedSwap), true);
      const audits = auditUniversalFactorizationWithSwap(
        transformedQuotient,
        transformedSwap,
        2,
        [0, 1, 2, 3, 4],
      );
      assert(audits.every((entry) => entry.pass));
      quotientRelabelingsTested += 1;
    }
  }
  assert.equal(quotientRelabelingsTested, 12);

  let capabilityPresentationRelabelings = 0;
  for (const addressFlip of BITS) {
    for (const modeFlip of BITS) {
      const transformedCapabilities = BITS.flatMap((address) => (
        BITS.map((mode) => `kappa_${address ^ addressFlip}_${mode ^ modeFlip}`)
      ));
      assert.equal(new Set(transformedCapabilities).size, 4);
      capabilityPresentationRelabelings += 1;
    }
  }
  assert.equal(capabilityPresentationRelabelings, 4);

  return {
    ternaryRelation: {
      coordinatePermutations: 6,
      independentBitFlips: 8,
      cubeAutomorphismsTested,
      evenOrbitHits,
      oddOrbitHits,
      unaryAndPairwiseProjectionChecks: projectionChecks,
      rectangleChecks,
      rawEvenVersusOddSpellingTreatedAsGauge: true,
      pass: true,
    },
    coequalizerCarrierRelabeling: {
      fiberPermutations: 6,
      quotientPermutations: 2,
      relabelingsTested: quotientRelabelingsTested,
      universalPropertyTransported: true,
      pass: true,
    },
    catalystCapabilityRelabeling: {
      addressRelabelings: 2,
      modeRelabelings: 2,
      combinationsTested: capabilityPresentationRelabelings,
      availabilityAndModeCardinalityPreserved: true,
      pass: true,
    },
    h3Gauge: {
      groupAutomorphismsOfC2: 1,
      coefficientAutomorphismsOfF2: 1,
      allNormalizedTwoCochainsAlreadyAudited: 2,
      omegaCannotBeRemovedByNormalizedBinaryGauge: true,
      pass: true,
    },
  };
}

function auditUniversalFactorizationWithSwap(
  candidateQuotient,
  swap,
  quotientSize,
  targetSizes,
) {
  return targetSizes.map((targetSize) => {
    const maps = enumerateFunctions(FIBER.length, targetSize);
    const rows = maps.map((fn) => {
      const invariant = equalizesSwap(fn, swap);
      const factors = factorizationCount(
        fn,
        candidateQuotient,
        quotientSize,
        targetSize,
      );
      return { invariant, factors };
    });
    return {
      targetSize,
      pass: rows.every((row) => (
        row.invariant ? row.factors === 1 : row.factors === 0
      )),
    };
  });
}

function privateFixtureDigest() {
  return digest({
    bits: BITS,
    fullRelation: FULL_RELATION,
    evenRelation: EVEN_RELATION,
    addressTable: ADDRESS_TABLE,
    coordinateSubsets: COORDINATE_SUBSETS,
    coordinatePartitions: COORDINATE_PARTITIONS,
    catalystFixture: CATALYST_FIXTURE,
    fiber: FIBER,
    swap: SWAP,
    quotient: QUOTIENT,
    laterR: LATER_R,
  });
}

function buildPrivateFixtureIsolationControl(evidence) {
  const frozen = {
    bits: isDeepFrozen(BITS),
    fullRelation: isDeepFrozen(FULL_RELATION),
    evenRelation: isDeepFrozen(EVEN_RELATION),
    addressTable: isDeepFrozen(ADDRESS_TABLE),
    coordinateSubsets: isDeepFrozen(COORDINATE_SUBSETS),
    coordinatePartitions: isDeepFrozen(COORDINATE_PARTITIONS),
    catalystFixture: isDeepFrozen(CATALYST_FIXTURE),
    fiber: isDeepFrozen(FIBER),
    swap: isDeepFrozen(SWAP),
    quotient: isDeepFrozen(QUOTIENT),
    laterR: isDeepFrozen(LATER_R),
  };
  const detached = {
    relationArray: evidence.higherArity.relation !== EVEN_RELATION,
    relationTuple: evidence.higherArity.relation[0] !== EVEN_RELATION[0],
    catalystPresentation: evidence.catalyst.presentation !== CATALYST_FIXTURE,
    catalystRelations: evidence.catalyst.presentation.relations !== CATALYST_FIXTURE.relations,
    fiberArray: evidence.coequalizer.finiteCarrier !== FIBER,
    quotientArray: evidence.coequalizer.quotientMap !== QUOTIENT,
    branchArray: evidence.causalAblations.branches !== FULL_RELATION,
  };
  assert(Object.values(frozen).every(Boolean));
  assert(Object.values(detached).every(Boolean));
  return {
    recursivelyFrozenPrivateFixtures: frozen,
    returnedPayloadDeeplyDetached: detached,
    replayExpectedModelExposedInPayload: false,
    pass: true,
  };
}

function buildPayload() {
  const evidence = {
    higherArity: buildHigherArityEvidence(),
    causalAblations: buildCausalAndAblationEvidence(),
    catalyst: buildCatalystEvidence(),
    h3: buildH3Evidence(),
    coequalizer: buildCoequalizerEvidence(),
    coordinatePartitionIrreducibility: buildIrreducibilityEvidence(),
  };
  const controls = {
    presentation: buildPresentationControls(),
    privateFixtureIsolation: buildPrivateFixtureIsolationControl(evidence),
  };
  return {
    title: "Genesis coupled Latin-horn coequalizer calibration",
    status: "exact finite coupled calibration with mandatory negative theorem boundaries",
    evidence,
    controls,
    claimBoundary: {
      fullTarget4: false,
      levelC: false,
      genuineLevelB: false,
      geneticProductNoGo: false,
      universalAdmissionCalibration: true,
      phaseToActionPolicyDeclared: true,
      endogenousAdmission: false,
      universalOnlyWithinDeclaredCoequalizerDoctrine: true,
      h3AttachmentDeclaredAndOptional: true,
      h3ForcedByLatinRelation: false,
      h3CertificateCausallyRequired: false,
      pointwiseOmegaOnAdmittedSupportsNontrivial: false,
      coupledTheorem: false,
      parityBinaryRecodingOutsideFixedInterfaceNotExcluded: true,
      fullProcessShadowCollisionProved: false,
      oldDoctrineCauchyComplete: false,
      oldDoctrineExplicitlyExcludesQAndIdempotentSplittings: true,
      coequalizerActsOnResourceMonoid: false,
      coequalizerCancelsCatalystK: false,
      reasons: {
        fullTarget4: "The executable does not prove a formation-monad change, an endogenous generation law, or arbitrary genetic-product primeness.",
        levelC: "A new sort in the declared concrete extension is not yet a proof that the object-language formation doctrine itself changed nonconservatively in the required doctrine category.",
        genuineLevelB: "No asymptotic separation against a natural bounded old-observer class is established.",
        geneticProductNoGo: "Only coordinate-role-preserving rectangular products are excluded.",
        phaseToActionPolicy: "Mapping a supported Latin horn to the chosen involution on F and demanding its coequalizer is stipulated transduction policy; the separately audited H3 certificate is optional and is not an input to admission.",
        higherArityInterface: "R_even is the graph of binary XOR outside the fixed arity-truncation interface, so no representation-independent arity theorem is claimed.",
        processShadow: "No second full process with an isomorphic declared process shadow and inequivalent admission behavior is constructed here.",
        cauchyBoundary: "The old object e=(0,0,2) is an idempotent split by Q; the old doctrine is intentionally not Cauchy/Karoubi complete and the admission may be read as that completion step.",
        resourceBoundary: "The coequalizer is formed only for the declared action on F. It neither acts on the resource monoid nor cancels k.",
      },
    },
    excludedClaims: {
      novelty: false,
      majorConjectureResult: false,
      aiArchitectureResult: false,
      nonSoficityResult: false,
      h3ForcesAdmissionResult: false,
      coupledWitnessTheorem: false,
      statement: "This executable makes no novelty, major-conjecture, AI-architecture, non-soficity, H3-forces-admission, or full coupled-witness claim.",
    },
  };
}

function verifyPayloadEnvelope(envelope, expectedPayload) {
  if (!envelope || typeof envelope !== "object") {
    return { ok: false, reason: "malformed-envelope" };
  }
  if (!envelope.payload || typeof envelope.payload !== "object") {
    return { ok: false, reason: "missing-payload" };
  }
  if (envelope.payloadDigest !== digest(envelope.payload)) {
    return { ok: false, reason: "payload-digest-mismatch" };
  }
  if (canonical(envelope.payload) !== canonical(expectedPayload)) {
    return { ok: false, reason: "semantic-mismatch" };
  }
  return { ok: true, reason: "verified" };
}

function runTamperAudit(payload) {
  const mutations = [
    { name: "change-ternary-tuple", mutate: (value) => { value.evidence.higherArity.relation[0][0] = 1; } },
    { name: "forge-pairwise-projection", mutate: (value) => { value.evidence.higherArity.allDeclaredLowArityProjectionsEqual = false; } },
    { name: "forge-hardcoded-address", mutate: (value) => { value.evidence.causalAblations.hardcodedAddressAblations[0].preservesFullBranchingFamily = true; } },
    { name: "forge-constant-ablation", mutate: (value) => { value.evidence.causalAblations.constantValueAblations[0].preservesBirthFamily = true; } },
    { name: "erase-deletion", mutate: (value) => { value.evidence.causalAblations.deletionAblations[0].birthCount = 1; } },
    { name: "break-max-witness", mutate: (value) => { value.evidence.catalyst.relations[0].maxMonoidWitness.xValue = 1; } },
    { name: "unbind-kappa-mode", mutate: (value) => { value.evidence.catalyst.proofRelevantCapabilityTable[0].inhabitants.push("forged"); } },
    { name: "retain-catalyst-in-group", mutate: (value) => { value.evidence.catalyst.relations[0].groupCompletionRelation[4] = 1; } },
    { name: "break-cocycle", mutate: (value) => { value.evidence.h3.exhaustiveCocycleAudit.rows[0].delta = 1; } },
    { name: "forge-coboundary", mutate: (value) => { value.evidence.h3.exhaustiveNormalizedTwoCochainAudit.rows[0].equalsOmega = true; } },
    { name: "change-quotient-map", mutate: (value) => { value.evidence.coequalizer.quotientMap[1] = 1; } },
    { name: "forge-universal-factorization", mutate: (value) => { value.evidence.coequalizer.exhaustiveUniversalFactorization.targetAudits[4].pass = false; } },
    { name: "forge-old-quotient", mutate: (value) => { value.evidence.coequalizer.oldDoctrineFailure.noOldObjectRealizesCoequalizer = false; } },
    { name: "change-later-descent", mutate: (value) => { value.evidence.coequalizer.laterUse.uniqueDescent[1] = 1; } },
    { name: "forge-rectangle", mutate: (value) => { value.evidence.coordinatePartitionIrreducibility.partitions[0].relationIsRectangle = true; } },
    { name: "alter-relabeling-count", mutate: (value) => { value.controls.presentation.ternaryRelation.cubeAutomorphismsTested = 47; } },
    { name: "promote-full-target4", mutate: (value) => { value.claimBoundary.fullTarget4 = true; }, rehash: true },
    { name: "promote-level-c", mutate: (value) => { value.claimBoundary.levelC = true; }, rehash: true },
    { name: "promote-genuine-level-b", mutate: (value) => { value.claimBoundary.genuineLevelB = true; }, rehash: true },
    { name: "forge-genetic-product-no-go", mutate: (value) => { value.claimBoundary.geneticProductNoGo = true; }, rehash: true },
    { name: "hide-declared-policy", mutate: (value) => { value.claimBoundary.phaseToActionPolicyDeclared = false; }, rehash: true },
    { name: "forge-endogenous-admission", mutate: (value) => { value.claimBoundary.endogenousAdmission = true; }, rehash: true },
    { name: "broaden-universality", mutate: (value) => { value.claimBoundary.universalOnlyWithinDeclaredCoequalizerDoctrine = false; }, rehash: true },
    { name: "forge-novelty", mutate: (value) => { value.excludedClaims.novelty = true; }, rehash: true },
    { name: "forge-major-conjecture", mutate: (value) => { value.excludedClaims.majorConjectureResult = true; }, rehash: true },
    { name: "forge-ai-architecture", mutate: (value) => { value.excludedClaims.aiArchitectureResult = true; }, rehash: true },
    {
      name: "nested-relation-alias-poison",
      mutate: (value) => { value.evidence.higherArity.relation[0][0] = 9; },
      rehash: true,
      expectedReason: "semantic-mismatch",
    },
    {
      name: "nested-catalyst-alias-poison",
      mutate: (value) => { value.evidence.catalyst.presentation.relations[0].left[0] = 9; },
      rehash: true,
      expectedReason: "semantic-mismatch",
    },
    { name: "delete-boundary", mutate: (value) => { delete value.claimBoundary; }, rehash: true },
  ];

  const results = mutations.map((mutation) => {
    const candidatePayload = clone(payload);
    mutation.mutate(candidatePayload);
    const candidate = {
      payload: candidatePayload,
      payloadDigest: mutation.rehash ? digest(candidatePayload) : digest(payload),
    };
    const verification = verifyPayloadEnvelope(candidate, payload);
    assert.equal(verification.ok, false);
    if (mutation.expectedReason) assert.equal(verification.reason, mutation.expectedReason);
    return {
      name: mutation.name,
      adversaryRehashedPayload: mutation.rehash === true,
      rejected: true,
      reason: verification.reason,
    };
  });
  return {
    tested: results.length,
    rejected: results.filter((result) => result.rejected).length,
    staleDigestMutations: results.filter((result) => !result.adversaryRehashedPayload).length,
    rehashedSemanticForgeries: results.filter((result) => result.adversaryRehashedPayload).length,
    pass: results.every((result) => result.rejected),
    results,
  };
}

function runNestedAliasPoisonAudit() {
  const attacks = [
    {
      name: "returned-relation-nested-mutation",
      mutate: (payload) => { payload.evidence.higherArity.relation[0][0] = 9; },
    },
    {
      name: "returned-catalyst-nested-mutation",
      mutate: (payload) => {
        payload.evidence.catalyst.presentation.relations[0].left[0] = 9;
      },
    },
    {
      name: "returned-quotient-nested-mutation",
      mutate: (payload) => { payload.evidence.coequalizer.quotientMap[0] = 9; },
    },
  ];
  const results = attacks.map((attack) => {
    const fixtureDigestBefore = privateFixtureDigest();
    const returnedPayload = buildPayload();
    attack.mutate(returnedPayload);
    const candidate = {
      payload: returnedPayload,
      payloadDigest: digest(returnedPayload),
    };
    const freshExpectedPayload = buildPayload();
    const verification = verifyPayloadEnvelope(candidate, freshExpectedPayload);
    const fixtureDigestAfter = privateFixtureDigest();
    assert.equal(verification.ok, false);
    assert.equal(verification.reason, "semantic-mismatch");
    assert.equal(fixtureDigestAfter, fixtureDigestBefore);
    return {
      name: attack.name,
      adversaryRehashedPayload: true,
      expectedModelFreshlyRebuilt: true,
      privateFixtureUnchanged: true,
      rejected: true,
      requiredReason: "semantic-mismatch",
      reason: verification.reason,
    };
  });
  return {
    tested: results.length,
    rejectedAsSemanticMismatch: results.filter((result) => (
      result.rejected && result.reason === "semantic-mismatch"
    )).length,
    pass: results.every((result) => (
      result.rejected
        && result.reason === "semantic-mismatch"
        && result.privateFixtureUnchanged
    )),
    results,
  };
}

function buildCertificate() {
  const payload = buildPayload();
  const payloadDigest = digest(payload);
  const tamperAudit = runTamperAudit(payload);
  const aliasPoisonAudit = runNestedAliasPoisonAudit();
  const body = {
    schema: SCHEMA,
    payload,
    payloadDigest,
    tamperAudit,
    aliasPoisonAudit,
  };
  return { ...body, certificateDigest: digest(body) };
}

export function replayGenesisCoupledLatinHornCoequalizerCertificate(certificate) {
  try {
    if (!certificate || typeof certificate !== "object") {
      return { ok: false, reason: "malformed-certificate" };
    }
    const actualKeys = Object.keys(certificate).sort(compareStrings);
    if (!arraysEqual(actualKeys, CERTIFICATE_KEYS)) {
      return {
        ok: false,
        reason: "unexpected-certificate-keys",
        expectedKeys: [...CERTIFICATE_KEYS],
        actualKeys,
      };
    }
    if (certificate.schema !== SCHEMA) return { ok: false, reason: "schema-mismatch" };
    const body = clone(certificate);
    delete body.certificateDigest;
    if (certificate.certificateDigest !== digest(body)) {
      return { ok: false, reason: "certificate-digest-mismatch" };
    }
    const expectedPayload = buildPayload();
    const payloadVerification = verifyPayloadEnvelope(certificate, expectedPayload);
    if (!payloadVerification.ok) return payloadVerification;
    const expectedTamperAudit = runTamperAudit(expectedPayload);
    if (canonical(certificate.tamperAudit) !== canonical(expectedTamperAudit)) {
      return { ok: false, reason: "tamper-audit-mismatch" };
    }
    const expectedAliasPoisonAudit = runNestedAliasPoisonAudit();
    if (canonical(certificate.aliasPoisonAudit) !== canonical(expectedAliasPoisonAudit)) {
      return { ok: false, reason: "alias-poison-audit-mismatch" };
    }
    return {
      ok: true,
      reason: "verified",
      schema: certificate.schema,
      certificateDigest: certificate.certificateDigest,
      payloadDigest: certificate.payloadDigest,
      tamperRejected: certificate.tamperAudit.rejected,
      aliasPoisonsRejectedAsSemanticMismatch:
        certificate.aliasPoisonAudit.rejectedAsSemanticMismatch,
    };
  } catch (error) {
    return { ok: false, reason: "exception", message: error.message };
  }
}

function rehashCertificateInPlace(certificate) {
  certificate.payloadDigest = digest(certificate.payload);
  const body = clone(certificate);
  delete body.certificateDigest;
  certificate.certificateDigest = digest(body);
}

function runReturnedCertificateAliasPoisonRegression() {
  const attacks = [
    {
      name: "full-certificate-relation-alias-poison",
      mutate: (certificate) => {
        certificate.payload.evidence.higherArity.relation[0][0] = 9;
      },
    },
    {
      name: "full-certificate-catalyst-alias-poison",
      mutate: (certificate) => {
        certificate.payload.evidence.catalyst.presentation.relations[0].left[0] = 9;
      },
    },
    {
      name: "full-certificate-quotient-alias-poison",
      mutate: (certificate) => {
        certificate.payload.evidence.coequalizer.quotientMap[0] = 9;
      },
    },
    {
      name: "rehashed-extra-theorem-field-forgery",
      mutate: (certificate) => {
        certificate.extraTheorem = {
          fullTarget4: true,
          claim: "forged theorem outside the closed certificate schema",
        };
      },
      expectedReason: "unexpected-certificate-keys",
    },
  ];
  const results = attacks.map((attack) => {
    const fixtureDigestBefore = privateFixtureDigest();
    const returnedCertificate = buildCertificate();
    attack.mutate(returnedCertificate);
    rehashCertificateInPlace(returnedCertificate);
    const verification = replayGenesisCoupledLatinHornCoequalizerCertificate(
      returnedCertificate,
    );
    const fixtureDigestAfter = privateFixtureDigest();
    const expectedReason = attack.expectedReason ?? "semantic-mismatch";
    assert.equal(verification.ok, false);
    assert.equal(verification.reason, expectedReason);
    assert.equal(fixtureDigestAfter, fixtureDigestBefore);
    return {
      name: attack.name,
      payloadAndCertificateDigestsRehashed: true,
      privateFixtureUnchanged: true,
      rejected: true,
      requiredReason: expectedReason,
      reason: verification.reason,
    };
  });
  return {
    tested: results.length,
    rejectedAsExpectedReason: results.filter((result) => (
      result.rejected && result.reason === result.requiredReason
    )).length,
    rejectedAsSemanticMismatch: results.filter((result) => (
      result.rejected && result.reason === "semantic-mismatch"
    )).length,
    rehashedExtraFieldForgeriesRejected: results.filter((result) => (
      result.name === "rehashed-extra-theorem-field-forgery"
        && result.reason === "unexpected-certificate-keys"
    )).length,
    pass: results.every((result) => (
      result.rejected
        && result.reason === result.requiredReason
        && result.privateFixtureUnchanged
    )),
    results,
  };
}

export function runGenesisCoupledLatinHornCoequalizer() {
  const certificate = buildCertificate();
  const replay = replayGenesisCoupledLatinHornCoequalizerCertificate(certificate);
  assert.equal(replay.ok, true);
  const returnedCertificateAliasPoisonRegression =
    runReturnedCertificateAliasPoisonRegression();
  assert.equal(returnedCertificateAliasPoisonRegression.pass, true);
  const rerun = buildCertificate();
  const deterministicReplay = {
    identicalCertificate: canonical(certificate) === canonical(rerun),
    identicalDigest: certificate.certificateDigest === rerun.certificateDigest,
  };
  assert.equal(deterministicReplay.identicalCertificate, true);
  assert.equal(deterministicReplay.identicalDigest, true);
  return {
    ok: true,
    certificate,
    replay,
    returnedCertificateAliasPoisonRegression,
    deterministicReplay,
  };
}

export {
  runGenesisCoupledLatinHornCoequalizer as run,
  replayGenesisCoupledLatinHornCoequalizerCertificate as replay,
};

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  const result = runGenesisCoupledLatinHornCoequalizer();
  const payload = result.certificate.payload;
  console.log(JSON.stringify({
    ok: result.ok,
    schema: result.certificate.schema,
    certificateDigest: result.certificate.certificateDigest,
    payloadDigest: result.certificate.payloadDigest,
    relation: {
      evenCardinality: payload.evidence.higherArity.cardinalities.even,
      fullCardinality: payload.evidence.higherArity.cardinalities.full,
      allLowArityProjectionsEqual:
        payload.evidence.higherArity.allDeclaredLowArityProjectionsEqual,
    },
    causalAblations: {
      baselineBirths: payload.evidence.causalAblations.baselineBirths.length,
      hardcodedAddressBirths:
        payload.evidence.causalAblations.hardcodedAddressAblations
          .map((entry) => entry.births.length),
      deletionBirths:
        payload.evidence.causalAblations.deletionAblations
          .map((entry) => entry.birthCount),
      noConstantPreserves:
        payload.evidence.causalAblations.noSingleConstantPreservesBranchwiseBirths,
    },
    catalyst: {
      relations: payload.evidence.catalyst.relations.length,
      modesBoundToAvailability: payload.evidence.catalyst.modesBoundToCatalystAvailability,
      groupCompletionErasesNecessity:
        payload.evidence.catalyst.groupCompletionErasesCatalystNecessity,
    },
    h3: {
      cocycleQuadruples:
        payload.evidence.h3.exhaustiveCocycleAudit.quadruplesTested,
      normalizedTwoCochains:
        payload.evidence.h3.exhaustiveNormalizedTwoCochainAudit
          .normalizedTwoCochainsEnumerated,
      coboundariesEqualToOmega:
        payload.evidence.h3.exhaustiveNormalizedTwoCochainAudit
          .coboundariesEqualToOmega,
    },
    coequalizer: {
      targetSizes:
        payload.evidence.coequalizer.exhaustiveUniversalFactorization.targetSizes,
      totalMapsTested:
        payload.evidence.coequalizer.exhaustiveUniversalFactorization.totalMapsTested,
      oldObjectsFail:
        payload.evidence.coequalizer.oldDoctrineFailure.noOldObjectRealizesCoequalizer,
      laterDescent: payload.evidence.coequalizer.laterUse.uniqueDescent,
    },
    rectangleIrreducibility:
      !payload.evidence.coordinatePartitionIrreducibility
        .coordinateRolePreservingRectangleFactorizationExists,
    claimBoundary: payload.claimBoundary,
    excludedClaims: payload.excludedClaims,
    deterministicReplay: result.deterministicReplay,
    tamper: {
      tested: result.certificate.tamperAudit.tested,
      rejected: result.certificate.tamperAudit.rejected,
    },
    aliasPoison: {
      payloadAttacksTested: result.certificate.aliasPoisonAudit.tested,
      payloadAttacksRejected:
        result.certificate.aliasPoisonAudit.rejectedAsSemanticMismatch,
      certificateAttacksTested:
        result.returnedCertificateAliasPoisonRegression.tested,
      certificateAttacksRejected:
        result.returnedCertificateAliasPoisonRegression.rejectedAsExpectedReason,
      rehashedExtraFieldForgeriesRejected:
        result.returnedCertificateAliasPoisonRegression
          .rehashedExtraFieldForgeriesRejected,
    },
  }, null, 2));
}
