import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const CERTIFICATE_SCHEMA = "oasis.genesis-phase-gauge-rounding-probe.certificate.v1";
const RUN_SCHEMA = "oasis.genesis-phase-gauge-rounding-probe.run.v1";

const I2 = Object.freeze([
  Object.freeze([1, 0]),
  Object.freeze([0, 1]),
]);

const ZERO2 = Object.freeze([
  Object.freeze([0, 0]),
  Object.freeze([0, 0]),
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

function matrixEqual(left, right) {
  return left.length === right.length
    && left.every((row, i) => (
      row.length === right[i].length
      && row.every((entry, j) => entry === right[i][j])
    ));
}

function transpose(matrix) {
  return matrix[0].map((_, j) => matrix.map((row) => row[j]));
}

function multiply(left, right) {
  const rightTranspose = transpose(right);
  return left.map((row) => rightTranspose.map((column) => (
    row.reduce((sum, entry, index) => sum + entry * column[index], 0)
  )));
}

function add(left, right) {
  return left.map((row, i) => row.map((entry, j) => entry + right[i][j]));
}

function subtract(left, right) {
  return left.map((row, i) => row.map((entry, j) => entry - right[i][j]));
}

function scale(scalar, matrix) {
  return matrix.map((row) => row.map((entry) => scalar * entry));
}

function trace(matrix) {
  return matrix.reduce((sum, row, i) => sum + row[i], 0);
}

function determinant2(matrix) {
  return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

function rank2(matrix) {
  if (matrixEqual(matrix, ZERO2)) return 0;
  return determinant2(matrix) === 0 ? 1 : 2;
}

function frobeniusSquared(matrix) {
  return matrix.flat().reduce((sum, entry) => sum + entry * entry, 0);
}

function diagonal(left, right) {
  return [[left, 0], [0, right]];
}

function atom(index) {
  return index === 0 ? [[1, 0], [0, 0]] : [[0, 0], [0, 1]];
}

function conjugateReal(unitary, matrix) {
  return multiply(multiply(unitary, matrix), transpose(unitary));
}

function deriveMonomialData(unitary) {
  const permutation = [];
  const phases = [];
  for (let source = 0; source < unitary.length; source += 1) {
    const support = [];
    for (let target = 0; target < unitary.length; target += 1) {
      if (unitary[target][source] !== 0) support.push(target);
    }
    assert.equal(support.length, 1);
    const target = support[0];
    assert.equal(Math.abs(unitary[target][source]), 1);
    permutation.push(target);
    phases.push(unitary[target][source]);
  }
  assert.equal(new Set(permutation).size, unitary.length);
  return { permutation, phases };
}

function phaseInsensitiveTransport(unitary) {
  return unitary.map((row) => row.map((entry) => entry * entry));
}

function buildCase(name, unitary) {
  const monomial = deriveMonomialData(unitary);
  const unitaryProduct = multiply(unitary, transpose(unitary));
  const relatorEvaluation = multiply(unitary, unitary);
  const atomImages = [0, 1].map((index) => conjugateReal(unitary, atom(index)));
  const foxDerivative = add(I2, unitary);
  const foxFundamentalIdentity = multiply(foxDerivative, subtract(unitary, I2));

  assert(matrixEqual(unitaryProduct, I2));
  assert(matrixEqual(relatorEvaluation, I2));
  assert(atomImages.every((image, source) => matrixEqual(image, atom(monomial.permutation[source]))));
  assert(matrixEqual(foxFundamentalIdentity, ZERO2));

  return {
    name,
    generatorImage: unitary,
    exactRepresentationAudits: {
      unitaryProduct,
      isExactUnitary: true,
      relator: "s^2",
      relatorEvaluation,
      relatorSatisfiedExactly: true,
    },
    diagonalMASANormalizer: {
      atomPermutation: monomial.permutation,
      atomImages,
      normalizesExactly: true,
    },
    monomialData: monomial,
    frozenObservables: {
      supportPermutation: monomial.permutation,
      phaseInsensitiveAtomTransport: phaseInsensitiveTransport(unitary),
      rawGenerator: {
        matrix: unitary,
        trace: trace(unitary),
        determinant: determinant2(unitary),
        squaredDistanceFromPlusIdentity: frobeniusSquared(subtract(unitary, I2)),
      },
      evaluatedFoxDerivative: {
        groupRingFormula: "(partial s^2)/(partial s)=1+s",
        matrix: foxDerivative,
        rank: rank2(foxDerivative),
        trace: trace(foxDerivative),
        determinant: determinant2(foxDerivative),
        frobeniusSquared: frobeniusSquared(foxDerivative),
        fundamentalIdentity: "(I+U)(U-I)=U^2-I=0",
        fundamentalIdentityEvaluation: foxFundamentalIdentity,
      },
    },
  };
}

function buildLaboratory() {
  const plus = buildCase("plus-identity-trivial-character", clone(I2));
  const minus = buildCase("minus-identity-sign-character", scale(-1, I2));
  const swap = buildCase("swap-permutation-control", [[0, 1], [1, 0]]);

  const plusSupport = plus.frozenObservables.supportPermutation;
  const minusSupport = minus.frozenObservables.supportPermutation;
  const swapSupport = swap.frozenObservables.supportPermutation;
  const plusTransport = plus.frozenObservables.phaseInsensitiveAtomTransport;
  const minusTransport = minus.frozenObservables.phaseInsensitiveAtomTransport;
  const plusRaw = plus.frozenObservables.rawGenerator.matrix;
  const minusRaw = minus.frozenObservables.rawGenerator.matrix;
  const plusFox = plus.frozenObservables.evaluatedFoxDerivative.matrix;
  const minusFox = minus.frozenObservables.evaluatedFoxDerivative.matrix;

  assert.deepEqual(plusSupport, minusSupport);
  assert.deepEqual(plusTransport, minusTransport);
  assert(!matrixEqual(plusRaw, minusRaw));
  assert(!matrixEqual(plusFox, minusFox));
  assert.notDeepEqual(plusSupport, swapSupport);

  const signedDiagonalChecks = [-1, 1].flatMap((left) => [-1, 1].map((right) => {
    const gauge = diagonal(left, right);
    const image = conjugateReal(gauge, minus.generatorImage);
    assert(matrixEqual(image, minus.generatorImage));
    return { gauge, image, preservesMinusIdentity: true, reachesPlusIdentity: false };
  }));

  return {
    cases: [plus, minus, swap],
    supportCollision: {
      pair: [plus.name, minus.name],
      commonSupportPermutation: plusSupport,
      commonPhaseInsensitiveAtomTransport: plusTransport,
      supportObservablesEqual: true,
      rawGeneratorsEqual: false,
      evaluatedFoxDerivativesEqual: false,
      squaredRawGeneratorDistance: frobeniusSquared(subtract(plusRaw, minusRaw)),
      swapControlHasDifferentSupport: true,
      swapControlSupportPermutation: swapSupport,
    },
    diagonalGaugeObstruction: {
      gaugeClass: "all diagonal unitaries D=diag(z_1,z_2)",
      hypotheses: "|z_1|=|z_2|=1",
      scalarCentralityIdentity: "D(-I)D*=-(DD*)=-I",
      minusIdentityIsScalarCentral: true,
      minusIdentityDiffersFromPlusIdentityAtEntry00: true,
      diagonalConjugationCanReachPlusIdentity: false,
      exhaustiveSignedDiagonalSubcheck: {
        checked: signedDiagonalChecks.length,
        allPreserveMinusIdentity: signedDiagonalChecks.every(({ preservesMinusIdentity }) => (
          preservesMinusIdentity
        )),
        cases: signedDiagonalChecks,
      },
      characterTwistRelation: {
        character: "chi:C2->{+1,-1}, chi(s)=-1",
        identity: "U_minus(s)=chi(s) U_plus(s)",
        isConjugation: false,
        isPhaseCocycleTwist: true,
      },
    },
  };
}

function buildCertificate() {
  const lab = buildLaboratory();
  const body = {
    schema: CERTIFICATE_SCHEMA,
    frozenModel: {
      presentation: "C2=<s | s^2>",
      carrier: "C^2",
      diagonalMASA: "D={diag(a,b):a,b in C}",
      gaugeAction: "U |-> D U D* for diagonal unitaries D",
      foxConvention: "left Fox derivative, (partial s^2)/(partial s)=1+s",
      observationContract: [
        "support permutation",
        "phase-insensitive atom transport |U_ij|^2",
        "raw generator matrix",
        "evaluated Fox derivative I+U",
      ],
    },
    exactCases: lab.cases,
    collisionAndControl: lab.supportCollision,
    diagonalGaugeObstruction: lab.diagonalGaugeObstruction,
    provedFiniteStatement: {
      allThreeImagesAreExactUnitaryC2Representations: true,
      allThreeExactlyNormalizeTheDiagonalMASA: true,
      plusAndMinusHaveIdenticalFrozenSupportObservables: true,
      plusAndMinusHaveDifferentRawGeneratorData: true,
      plusAndMinusHaveDifferentEvaluatedFoxDerivativeData: true,
      swapControlShowsSupportObserverIsNotConstant: true,
      diagonalConjugationCannotRemoveTheMinusScalarPhase: true,
      conclusion: "support-level rounding and phase/cocycle descent are separate obligations",
    },
    theoremBoundary: {
      supportPermutationRoundingDisproved: false,
      monomialValuedRoundingDisproved: false,
      scalarOrCharacterGaugeQuotientedRoundingDisproved: false,
      aRawOrFoxObservableCanBeRecoveredFromSupportAlone: false,
      observablesMustBeFrozenBeforeClaimingRoundingFidelity: true,
      finiteGroupNonSoficityEstablished: false,
      ambientNonSoficityEstablished: false,
      universalRoundingTheoremEstablished: false,
      conjectureIVDisprovedAsGaugeQuotientedStatement: false,
      reason: "the fixture isolates a missing phase layer; it neither forbids monomial targets nor a declared phase quotient",
    },
  };
  return { ...body, certificateDigest: digest(body) };
}

function assertPlainJson(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return;
  assert.equal(typeof value, "object");
  assert.equal(Object.getOwnPropertySymbols(value).length, 0);
  if (Array.isArray(value)) {
    for (const entry of value) assertPlainJson(entry);
    return;
  }
  assert.equal(Object.getPrototypeOf(value), Object.prototype);
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    assert(descriptor && Object.hasOwn(descriptor, "value"));
    assertPlainJson(descriptor.value);
  }
}

export function replayGenesisPhaseGaugeRoundingProbeCertificate(candidate) {
  try {
    assertPlainJson(candidate);
    const body = Object.fromEntries(Object.entries(candidate).filter(([key]) => (
      key !== "certificateDigest"
    )));
    assert.equal(candidate.certificateDigest, digest(body));
    assert.equal(canonical(candidate), canonical(buildCertificate()));
    return { ok: true, certificateDigest: candidate.certificateDigest };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function recertify(candidate) {
  const body = Object.fromEntries(Object.entries(candidate).filter(([key]) => (
    key !== "certificateDigest"
  )));
  candidate.certificateDigest = digest(body);
}

function auditTamper(certificate) {
  const mutations = [
    ["generator image", (value) => { value.exactCases[1].generatorImage[0][0] = 1; }],
    ["unitarity audit", (value) => {
      value.exactCases[1].exactRepresentationAudits.isExactUnitary = false;
    }],
    ["relator audit", (value) => {
      value.exactCases[1].exactRepresentationAudits.relatorSatisfiedExactly = false;
    }],
    ["support permutation", (value) => {
      value.exactCases[1].frozenObservables.supportPermutation = [1, 0];
    }],
    ["phase-insensitive transport", (value) => {
      value.exactCases[1].frozenObservables.phaseInsensitiveAtomTransport[0][0] = 0;
    }],
    ["raw trace", (value) => {
      value.exactCases[1].frozenObservables.rawGenerator.trace = 2;
    }],
    ["Fox matrix", (value) => {
      value.exactCases[1].frozenObservables.evaluatedFoxDerivative.matrix[0][0] = 2;
    }],
    ["Fox rank", (value) => {
      value.exactCases[1].frozenObservables.evaluatedFoxDerivative.rank = 2;
    }],
    ["support collision", (value) => {
      value.collisionAndControl.supportObservablesEqual = false;
    }],
    ["raw separation", (value) => {
      value.collisionAndControl.rawGeneratorsEqual = true;
    }],
    ["diagonal gauge", (value) => {
      value.diagonalGaugeObstruction.diagonalConjugationCanReachPlusIdentity = true;
    }],
    ["character twist", (value) => {
      value.diagonalGaugeObstruction.characterTwistRelation.isPhaseCocycleTwist = false;
    }],
    ["monomial overclaim", (value) => {
      value.theoremBoundary.monomialValuedRoundingDisproved = true;
    }],
    ["nonsofic overclaim", (value) => {
      value.theoremBoundary.ambientNonSoficityEstablished = true;
    }],
    ["digest", (value) => { value.certificateDigest = "0".repeat(64); }],
    ["extra field", (value) => { value.unfrozenExtra = true; }],
  ];

  const cases = mutations.map(([name, mutate]) => {
    const candidate = clone(certificate);
    mutate(candidate);
    if (name !== "digest") recertify(candidate);
    return {
      name,
      attackerRecomputedDigest: name !== "digest",
      rejected: !replayGenesisPhaseGaugeRoundingProbeCertificate(candidate).ok,
    };
  });
  assert(cases.every(({ rejected }) => rejected));
  return {
    attempted: cases.length,
    rejected: cases.filter(({ rejected }) => rejected).length,
    allRejected: true,
    cases,
  };
}

export function runGenesisPhaseGaugeRoundingProbe() {
  const certificate = buildCertificate();
  const replay = replayGenesisPhaseGaugeRoundingProbeCertificate(clone(certificate));
  assert.equal(replay.ok, true);
  const tamperAudit = auditTamper(certificate);
  return {
    schema: RUN_SCHEMA,
    status: "PASS",
    result: {
      supportCollisionExact: true,
      rawGeneratorSeparationExact: true,
      evaluatedFoxSeparationExact: true,
      diagonalGaugeObstructionExact: true,
      swapPermutationControlExact: true,
      theoremBoundaryPreserved: true,
    },
    replay,
    tamperAudit,
    certificate,
  };
}

export {
  runGenesisPhaseGaugeRoundingProbe as run,
  replayGenesisPhaseGaugeRoundingProbeCertificate as replay,
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(runGenesisPhaseGaugeRoundingProbe(), null, 2));
}
