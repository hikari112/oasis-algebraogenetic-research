import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import { runGenesisHigherQuestionQuotients } from "./genesis-higher-question-quotients.mjs";

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

function exponentKey(exponents) {
  return exponents.join(",");
}

function makePolynomial(variables, exponentVectors = []) {
  const terms = new Map();
  for (const exponents of exponentVectors) {
    assert.equal(exponents.length, variables);
    const key = exponentKey(exponents);
    if (terms.has(key)) terms.delete(key);
    else terms.set(key, [...exponents]);
  }
  return { variables, terms };
}

function zeroPolynomial(variables) {
  return makePolynomial(variables);
}

function onePolynomial(variables) {
  return makePolynomial(variables, [Array(variables).fill(0)]);
}

function orderedTerms(polynomial) {
  return [...polynomial.terms.values()].sort((left, right) => {
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return left[index] - right[index];
    }
    return 0;
  });
}

function toggleTerm(terms, exponents) {
  const key = exponentKey(exponents);
  if (terms.has(key)) terms.delete(key);
  else terms.set(key, [...exponents]);
}

function addPolynomials(left, right) {
  assert.equal(left.variables, right.variables);
  const result = makePolynomial(left.variables, orderedTerms(left));
  for (const exponents of orderedTerms(right)) toggleTerm(result.terms, exponents);
  return result;
}

function multiplyPolynomials(left, right) {
  assert.equal(left.variables, right.variables);
  const result = zeroPolynomial(left.variables);
  for (const leftExponents of left.terms.values()) {
    for (const rightExponents of right.terms.values()) {
      toggleTerm(result.terms, leftExponents.map((value, index) => value + rightExponents[index]));
    }
  }
  return result;
}

function powerPolynomial(polynomial, exponent) {
  assert(Number.isInteger(exponent) && exponent >= 0);
  let result = onePolynomial(polynomial.variables);
  let factor = polynomial;
  let remaining = exponent;
  while (remaining > 0) {
    if (remaining & 1) result = multiplyPolynomials(result, factor);
    remaining >>= 1;
    if (remaining > 0) factor = multiplyPolynomials(factor, factor);
  }
  return result;
}

function linearForm(variables, mask) {
  const terms = [];
  for (let variable = 0; variable < variables; variable += 1) {
    if ((mask >> variable) & 1) {
      const exponents = Array(variables).fill(0);
      exponents[variable] = 1;
      terms.push(exponents);
    }
  }
  return makePolynomial(variables, terms);
}

function polynomialEqual(left, right) {
  return left.variables === right.variables
    && canonical(orderedTerms(left)) === canonical(orderedTerms(right));
}

function polynomialDegree(polynomial) {
  if (polynomial.terms.size === 0) return null;
  const degrees = new Set(orderedTerms(polynomial).map(
    (exponents) => exponents.reduce((sum, value) => sum + value, 0),
  ));
  assert.equal(degrees.size, 1, "polynomial is not homogeneous");
  return [...degrees][0];
}

function formatMonomial(exponents, names = exponents.map((_, index) => `x${index + 1}`)) {
  const factors = [];
  for (let index = 0; index < exponents.length; index += 1) {
    const exponent = exponents[index];
    if (exponent === 0) continue;
    factors.push(exponent === 1 ? names[index] : `${names[index]}^${exponent}`);
  }
  return factors.length === 0 ? "1" : factors.join("*");
}

function polynomialSummary(polynomial, names) {
  const terms = orderedTerms(polynomial);
  return {
    degree: polynomialDegree(polynomial),
    monomialCount: terms.length,
    monomials: terms.map((exponents) => formatMonomial(exponents, names)),
    exponentDigest: digest(terms),
  };
}

function sqOne(polynomial) {
  const result = zeroPolynomial(polynomial.variables);
  for (const exponents of polynomial.terms.values()) {
    for (let variable = 0; variable < polynomial.variables; variable += 1) {
      if ((exponents[variable] & 1) === 0) continue;
      const image = [...exponents];
      image[variable] += 1;
      toggleTerm(result.terms, image);
    }
  }
  return result;
}

function substitutePolynomial(polynomial, images, targetVariables) {
  assert.equal(images.length, polynomial.variables);
  const linearImages = images.map((mask) => linearForm(targetVariables, mask));
  let result = zeroPolynomial(targetVariables);
  for (const exponents of polynomial.terms.values()) {
    let image = onePolynomial(targetVariables);
    for (let variable = 0; variable < exponents.length; variable += 1) {
      if (exponents[variable] === 0) continue;
      image = multiplyPolynomials(image, powerPolynomial(linearImages[variable], exponents[variable]));
    }
    result = addPolynomials(result, image);
  }
  return result;
}

function popcount(value) {
  let count = 0;
  let remaining = value;
  while (remaining !== 0) {
    count += remaining & 1;
    remaining >>>= 1;
  }
  return count;
}

function dotParity(left, right) {
  return popcount(left & right) & 1;
}

function rankOfVectors(vectors, dimension) {
  const rows = [...vectors];
  let rank = 0;
  for (let column = 0; column < dimension; column += 1) {
    const pivot = rows.findIndex((row, index) => index >= rank && ((row >> column) & 1));
    if (pivot < 0) continue;
    [rows[rank], rows[pivot]] = [rows[pivot], rows[rank]];
    for (let row = 0; row < rows.length; row += 1) {
      if (row !== rank && ((rows[row] >> column) & 1)) rows[row] ^= rows[rank];
    }
    rank += 1;
  }
  return rank;
}

function basisForSubspace(vectors, ambientDimension) {
  const basis = [];
  let rank = 0;
  for (const vector of vectors.filter((value) => value !== 0).sort((left, right) => left - right)) {
    const nextRank = rankOfVectors([...basis, vector], ambientDimension);
    if (nextRank > rank) {
      basis.push(vector);
      rank = nextRank;
    }
  }
  assert.equal(2 ** rank, vectors.length);
  return basis;
}

function allProperSubspaces(dimension) {
  const vectorCount = 2 ** dimension;
  const fullSubset = (2 ** vectorCount) - 1;
  const subspaces = [];
  for (let subset = 1; subset < fullSubset; subset += 1) {
    if ((subset & 1) === 0) continue;
    const vectors = [];
    for (let vector = 0; vector < vectorCount; vector += 1) {
      if ((subset >> vector) & 1) vectors.push(vector);
    }
    let closed = true;
    for (const left of vectors) {
      for (const right of vectors) {
        if (((subset >> (left ^ right)) & 1) === 0) {
          closed = false;
          break;
        }
      }
      if (!closed) break;
    }
    if (closed) subspaces.push(vectors);
  }
  return subspaces;
}

function auditRestrictions(dimension, dickson) {
  const subspaces = allProperSubspaces(dimension);
  const expectedCounts = {
    2: { 0: 1, 1: 3 },
    3: { 0: 1, 1: 7, 2: 7 },
    4: { 0: 1, 1: 15, 2: 35, 3: 15 },
  }[dimension];
  const dimensionCounts = {};
  const witnesses = [];
  for (const vectors of subspaces) {
    const basis = basisForSubspace(vectors, dimension);
    const subspaceDimension = basis.length;
    dimensionCounts[subspaceDimension] = (dimensionCounts[subspaceDimension] ?? 0) + 1;
    const annihilators = [];
    for (let form = 1; form < 2 ** dimension; form += 1) {
      if (vectors.every((vector) => dotParity(form, vector) === 0)) annihilators.push(form);
    }
    assert(annihilators.length > 0);
    const witness = annihilators[0];
    const images = Array.from({ length: dimension }, (_, coordinate) => (
      basis.reduce((mask, vector, index) => (
        ((vector >> coordinate) & 1) ? mask | (1 << index) : mask
      ), 0)
    ));
    const restriction = substitutePolynomial(dickson, images, subspaceDimension);
    assert.equal(restriction.terms.size, 0);
    witnesses.push({
      vectors,
      dimension: subspaceDimension,
      annihilator: witness,
      annihilatorIsFactor: witness < 2 ** dimension,
      directRestrictionZero: true,
    });
  }
  assert.deepEqual(dimensionCounts, expectedCounts);
  return {
    properSubspacesAudited: subspaces.length,
    dimensionCounts,
    everyProperSubspaceHasNonzeroAnnihilator: true,
    annihilatorFactorPresentInDicksonProduct: true,
    everyDirectPolynomialRestrictionZero: true,
    witnessDigest: digest(witnesses),
    proof: "for W<E_n choose 0!=lambda in Ann(W); lambda is a factor of D_n and restricts to zero",
  };
}

function matrixKey(matrix) {
  return matrix.join(",");
}

function identitySubstitution(dimension) {
  return Array.from({ length: dimension }, (_, index) => 1 << index);
}

function composeSubstitutions(left, right) {
  assert.equal(left.length, right.length);
  return left.map((linearImage) => {
    let result = 0;
    for (let variable = 0; variable < right.length; variable += 1) {
      if ((linearImage >> variable) & 1) result ^= right[variable];
    }
    return result;
  });
}

function allInvertibleSubstitutions(dimension) {
  const matrices = [];
  const rowChoices = 2 ** dimension;
  function visit(rows) {
    if (rows.length === dimension) {
      if (rankOfVectors(rows, dimension) === dimension) matrices.push([...rows]);
      return;
    }
    for (let row = 0; row < rowChoices; row += 1) visit([...rows, row]);
  }
  visit([]);
  return matrices.sort((left, right) => matrixKey(left).localeCompare(matrixKey(right)));
}

function glOrder(dimension) {
  let result = 1;
  const size = 2 ** dimension;
  for (let index = 0; index < dimension; index += 1) result *= size - (2 ** index);
  return result;
}

function gl4Generators() {
  const generators = [];
  for (let index = 0; index < 3; index += 1) {
    const images = identitySubstitution(4);
    [images[index], images[index + 1]] = [images[index + 1], images[index]];
    generators.push({ name: `swap-x${index + 1}-x${index + 2}`, images });
  }
  const transvection = identitySubstitution(4);
  transvection[0] ^= 1 << 1;
  generators.push({ name: "transvection-x1-to-x1-plus-x2", images: transvection });
  return generators;
}

function generatedMatrixGroup(dimension, generators) {
  const identity = identitySubstitution(dimension);
  const seen = new Map([[matrixKey(identity), identity]]);
  const queue = [identity];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    for (const { images } of generators) {
      const next = composeSubstitutions(current, images);
      const key = matrixKey(next);
      if (!seen.has(key)) {
        seen.set(key, next);
        queue.push(next);
      }
    }
  }
  return [...seen.values()];
}

function auditInvariance(dimension, dickson, primitive) {
  if (dimension <= 3) {
    const matrices = allInvertibleSubstitutions(dimension);
    assert.equal(matrices.length, glOrder(dimension));
    for (const matrix of matrices) {
      assert(polynomialEqual(substitutePolynomial(dickson, matrix, dimension), dickson));
      assert(polynomialEqual(substitutePolynomial(primitive, matrix, dimension), primitive));
    }
    return {
      policy: "exhaustive GL(n,2)",
      transformationsAudited: matrices.length,
      expectedGroupOrder: glOrder(dimension),
      dicksonInvariant: true,
      primitiveInvariant: true,
      matrixDigest: digest(matrices),
    };
  }
  const generators = gl4Generators();
  for (const { images } of generators) {
    assert(polynomialEqual(substitutePolynomial(dickson, images, dimension), dickson));
    assert(polynomialEqual(substitutePolynomial(primitive, images, dimension), primitive));
  }
  const closure = generatedMatrixGroup(dimension, generators);
  assert.equal(closure.length, glOrder(dimension));
  return {
    policy: "adjacent swaps plus one transvection; computed closure is GL(4,2)",
    generatorsAudited: generators.map(({ name, images }) => ({ name, images })),
    generatorCount: generators.length,
    generatedClosureOrder: closure.length,
    expectedGroupOrder: glOrder(dimension),
    dicksonInvariantOnGenerators: true,
    primitiveInvariantOnGenerators: true,
    generationProof: "adjacent swaps conjugate the transvection to elementary row additions; swaps and row additions generate GL(4,2)",
    closureDigest: digest(closure.map(matrixKey).sort()),
  };
}

function buildEssentialLevel(dimension) {
  const nonzeroForms = Array.from({ length: (2 ** dimension) - 1 }, (_, index) => index + 1);
  let dickson = onePolynomial(dimension);
  for (const form of nonzeroForms) dickson = multiplyPolynomials(dickson, linearForm(dimension, form));
  assert(dickson.terms.size > 0);
  assert.equal(polynomialDegree(dickson), (2 ** dimension) - 1);

  const deletedProducts = [];
  let primitive = zeroPolynomial(dimension);
  for (const omitted of nonzeroForms) {
    let deleted = onePolynomial(dimension);
    for (const form of nonzeroForms) {
      if (form !== omitted) deleted = multiplyPolynomials(deleted, linearForm(dimension, form));
    }
    deletedProducts.push({ omitted, polynomial: deleted });
    primitive = addPolynomials(primitive, deleted);
  }
  assert(primitive.terms.size > 0);
  assert.equal(polynomialDegree(primitive), (2 ** dimension) - 2);

  const totalLinearForm = nonzeroForms.reduce((sum, form) => sum ^ form, 0);
  assert.equal(totalLinearForm, 0);
  for (const { omitted, polynomial } of deletedProducts) {
    assert(polynomialEqual(sqOne(polynomial), dickson), `deleted primitive failed for ${omitted}`);
  }
  assert(polynomialEqual(sqOne(primitive), dickson));

  return {
    dimension,
    groupOrder: 2 ** dimension,
    nonzeroLinearFormCount: nonzeroForms.length,
    totalLinearFormSumMask: totalLinearForm,
    dickson,
    primitive,
    certificate: {
      n: dimension,
      group: `E_${dimension}=(C2)^${dimension}`,
      cohomologyRing: `F2[x1,...,x${dimension}]`,
      nonzeroLinearFormCount: nonzeroForms.length,
      dickson: polynomialSummary(dickson),
      canonicalPrimitive: polynomialSummary(primitive),
      degreeChecks: {
        dickson: polynomialDegree(dickson),
        expectedDickson: (2 ** dimension) - 1,
        primitive: polynomialDegree(primitive),
        expectedPrimitive: (2 ** dimension) - 2,
      },
      deletedFactorPrimitiveChecks: deletedProducts.length,
      sumOfAllNonzeroLinearFormsZero: totalLinearForm === 0,
      sq1CanonicalPrimitiveEqualsDickson: true,
      invariance: auditInvariance(dimension, dickson, primitive),
      essentiality: auditRestrictions(dimension, dickson),
    },
  };
}

function auditN2Compatibility(level, predecessor) {
  assert.equal(level.dimension, 2);
  const expectedDickson = makePolynomial(2, [[2, 1], [1, 2]]);
  const expectedPrimitive = makePolynomial(2, [[2, 0], [1, 1], [0, 2]]);
  const projectExtension = makePolynomial(2, [[2, 0], [1, 1]]);
  const squareDifference = makePolynomial(2, [[0, 2]]);
  assert(polynomialEqual(level.dickson, expectedDickson));
  assert(polynomialEqual(level.primitive, expectedPrimitive));
  assert(polynomialEqual(addPolynomials(projectExtension, level.primitive), squareDifference));
  assert(polynomialEqual(sqOne(projectExtension), level.dickson));
  assert(polynomialEqual(sqOne(squareDifference), zeroPolynomial(2)));

  const predecessorControl = predecessor.certificate.controls.trivialActionC4Essentiality;
  assert(predecessorControl.globalClassNonzero);
  assert(predecessorControl.everyProperCyclicRestrictionZero);
  assert(predecessorControl.polynomialAudit.formalPolynomialNonzero);
  assert(predecessorControl.polynomialAudit.vanishesOnEveryOrder2Subgroup);
  assert.deepEqual(
    [...predecessorControl.polynomialAudit.expandedMonomials].sort(),
    ["u^1v^2", "u^2v^1"],
  );

  return {
    variables: ["u", "v"],
    dicksonIdentity: "D_2=u*v*(u+v)=u^2*v+u*v^2",
    exactPolynomialEqualityVerified: true,
    canonicalPrimitive: "c_2=u^2+u*v+v^2",
    projectExtensionClass: "e_2=u^2+u*v",
    difference: "c_2+e_2=v^2",
    differenceSq1Zero: true,
    sq1CanonicalPrimitive: "D_2",
    sq1ProjectExtensionClass: "D_2",
    predecessorEssentialityControl: {
      schema: predecessor.schema,
      certificateDigest: predecessor.certificate.certificateDigest,
      controlId: predecessorControl.controlId,
      globalClassNonzero: predecessorControl.globalClassNonzero,
      everyProperCyclicRestrictionZero: predecessorControl.everyProperCyclicRestrictionZero,
      polynomialDigest: digest(predecessorControl.polynomialAudit),
    },
  };
}

function buildLaboratory() {
  const predecessor = runGenesisHigherQuestionQuotients();
  const levels = [2, 3, 4].map(buildEssentialLevel);
  const n2Compatibility = auditN2Compatibility(levels[0], predecessor);
  return { predecessor, levels, n2Compatibility };
}

function buildCertificate(lab) {
  const body = {
    schema: "oasis.genesis-essential-coherence-hierarchy.certificate.v1",
    predecessor: lab.n2Compatibility.predecessorEssentialityControl,
    construction: {
      coefficientField: "F2",
      dimensionsAudited: [2, 3, 4],
      dicksonFormula: "D_n=product_{0!=lambda in E_n^*} lambda",
      canonicalPrimitiveFormula: "c_n=sum_{0!=ell in E_n^*} product_{0!=lambda!=ell} lambda",
      sq1Rule: "Sq^1 is the derivation with Sq^1(lambda)=lambda^2",
      characteristicTwoProof: [
        "for n>=2 the sum of all nonzero linear forms is zero because each coordinate occurs 2^(n-1) times",
        "deleting ell leaves linear-form sum ell, so Sq^1(D_n/ell)=ell*(D_n/ell)=D_n",
        "there are 2^n-1 deleted-factor terms, an odd number, hence Sq^1(c_n)=D_n",
      ],
      basisFreeReason: "GL(n,2) permutes the complete set of nonzero linear forms and the complete set of deleted-factor products",
    },
    levels: lab.levels.map(({ certificate }) => certificate),
    n2Compatibility: lab.n2Compatibility,
    essentialCoherentLiftInterpretation: {
      coefficientSequence: "0->C2->C4->C2->0 with trivial E_n action",
      connectingMap: "beta=Sq^1",
      globalLiftType: "CocLift_{c_n}(C4) is empty because beta(c_n)=D_n!=0",
      properSubgroupLiftTypes: "nonempty because every restriction of D_n is zero; fixed representatives are repaired by lifting the lower cochain discrepancy",
      verificationScope: "lift existence follows from the coefficient long exact sequence; explicit C4-valued cocycles are not enumerated here",
      scope: "a canonical cohomological family after E_n, all nonzero linear forms, and the C4 coefficient policy have been declared",
    },
    exactChecks: {
      dimensions: 3,
      nonzeroDicksonPolynomials: lab.levels.filter(({ dickson }) => dickson.terms.size > 0).length,
      sq1Identities: lab.levels.length,
      deletedPrimitiveIdentities: lab.levels.reduce(
        (sum, { certificate }) => sum + certificate.deletedFactorPrimitiveChecks,
        0,
      ),
      properSubspaceRestrictions: lab.levels.reduce(
        (sum, { certificate }) => sum + certificate.essentiality.properSubspacesAudited,
        0,
      ),
      glTransformationsN2N3: lab.levels.slice(0, 2).reduce(
        (sum, { certificate }) => sum + certificate.invariance.transformationsAudited,
        0,
      ),
      gl4GeneratorChecks: lab.levels[2].certificate.invariance.generatorCount,
      gl4GeneratedClosureOrder: lab.levels[2].certificate.invariance.generatedClosureOrder,
    },
    comma: {
      schema: "oasis.comma.v1",
      claim: "D_n is a nonzero essential class and the coefficient Bockstein of the canonical deleted-factor primitive for n=2,3,4",
      objects: "exact F2 polynomials for E_n, all proper subspaces, GL(n,2) substitutions, and the n=2 quotient-certificate control",
      method: "exact polynomial arithmetic, exhaustive subspace restriction, exhaustive GL checks for n<=3, and a closure-certified generating set for GL(4,2)",
      measurement: "zero floating-point operations; every coefficient, substitution, restriction, and Sq^1 identity is evaluated in F2",
      assumptions: [
        "the hierarchy dimensions n=2,3,4 are supplied",
        "all nonzero linear forms are admitted as the relation policy",
        "the coefficient extension C2->C4->C2 is supplied",
      ],
    },
    evaluationPolicy: {
      arithmetic: "exact F2 polynomial arithmetic with XOR coefficient cancellation",
      subspacePolicy: "enumerate every proper vector subspace and directly substitute a canonical basis",
      invariancePolicy: "all GL(n,2) for n<=3; adjacent swaps and one transvection for n=4, with generated closure order 20160",
      replayPolicy: "rebuild every polynomial and finite enumeration twice and require canonical digest equality",
      stochasticChoices: 0,
      tolerance: 0,
    },
    theoremBoundary: {
      dimensionsTwoThroughFourVerified: true,
      formalNonvanishingVerified: true,
      everyProperSubspaceRestrictionZeroVerified: true,
      coefficientBocksteinPrimitiveVerified: true,
      basisFreeInvarianceVerified: true,
      n2PredecessorControlLinked: true,
      allHigherDimensionsProvedByExecutable: false,
      explicitC4ValuedLiftCocyclesConstructed: false,
      higherContextsGeneratedByPriorSemantics: false,
      completeDualPolicyGeneratedByPriorSemantics: false,
      c4CoefficientPolicyGeneratedByPriorSemantics: false,
      universalHigherRepresentersConstructed: false,
      nonSoficityEstablished: false,
      architecturalLowerBoundEstablished: false,
      hodgeTheoryEstablished: false,
      majorOpenConjectureResolved: false,
      abstractInvariantNoveltyClaimed: false,
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

export function replayGenesisEssentialCoherenceHierarchyCertificate(candidate) {
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
  reject("predecessor control", (value) => { value.predecessor.globalClassNonzero = false; });
  reject("dimension list", (value) => { value.construction.dimensionsAudited.pop(); });
  reject("Dickson formula", (value) => { value.construction.dicksonFormula = "D_n=0"; });
  reject("primitive formula", (value) => { value.construction.canonicalPrimitiveFormula = "c_n=0"; });
  reject("Sq1 rule", (value) => { value.construction.sq1Rule = "Sq^1=0"; });
  reject("characteristic-two proof", (value) => { value.construction.characteristicTwoProof.pop(); });
  reject("n2 Dickson degree", (value) => { value.levels[0].dickson.degree = 2; });
  reject("n3 primitive degree", (value) => { value.levels[1].canonicalPrimitive.degree = 5; });
  reject("n4 Dickson monomial", (value) => { value.levels[2].dickson.monomials.pop(); });
  reject("n4 primitive digest", (value) => { value.levels[2].canonicalPrimitive.exponentDigest = "f".repeat(64); });
  reject("nonzero form count", (value) => { value.levels[1].nonzeroLinearFormCount = 6; });
  reject("linear sum", (value) => { value.levels[2].sumOfAllNonzeroLinearFormsZero = false; });
  reject("deleted primitive count", (value) => { value.levels[0].deletedFactorPrimitiveChecks = 2; });
  reject("Sq1 identity", (value) => { value.levels[1].sq1CanonicalPrimitiveEqualsDickson = false; });
  reject("n2 GL order", (value) => { value.levels[0].invariance.expectedGroupOrder = 5; });
  reject("n3 GL audit", (value) => { value.levels[1].invariance.transformationsAudited = 167; });
  reject("n4 generator", (value) => { value.levels[2].invariance.generatorsAudited.pop(); });
  reject("n4 closure", (value) => { value.levels[2].invariance.generatedClosureOrder = 10080; });
  reject("n4 generation proof", (value) => { value.levels[2].invariance.generationProof = "sampled"; });
  reject("n2 subspace count", (value) => { value.levels[0].essentiality.properSubspacesAudited = 3; });
  reject("n3 dimension count", (value) => { value.levels[1].essentiality.dimensionCounts[1] = 6; });
  reject("n4 restriction", (value) => { value.levels[2].essentiality.everyDirectPolynomialRestrictionZero = false; });
  reject("annihilator factor", (value) => { value.levels[2].essentiality.annihilatorFactorPresentInDicksonProduct = false; });
  reject("D2 identity", (value) => { value.n2Compatibility.exactPolynomialEqualityVerified = false; });
  reject("project extension", (value) => { value.n2Compatibility.projectExtensionClass = "e_2=0"; });
  reject("square difference", (value) => { value.n2Compatibility.difference = "0"; });
  reject("project Bockstein", (value) => { value.n2Compatibility.sq1ProjectExtensionClass = "0"; });
  reject("global lift type", (value) => { value.essentialCoherentLiftInterpretation.globalLiftType = "inhabited"; });
  reject("proper lift type", (value) => { value.essentialCoherentLiftInterpretation.properSubgroupLiftTypes = "empty"; });
  reject("explicit lift overclaim", (value) => { value.theoremBoundary.explicitC4ValuedLiftCocyclesConstructed = true; });
  reject("proper restriction total", (value) => { value.exactChecks.properSubspaceRestrictions -= 1; });
  reject("COMMA method", (value) => { value.comma.method = "random sampling"; });
  reject("evaluation tolerance", (value) => { value.evaluationPolicy.tolerance = 1e-9; });
  reject("higher generated overclaim", (value) => { value.theoremBoundary.higherContextsGeneratedByPriorSemantics = true; });
  reject("coefficient generated overclaim", (value) => { value.theoremBoundary.c4CoefficientPolicyGeneratedByPriorSemantics = true; });
  reject("representer overclaim", (value) => { value.theoremBoundary.universalHigherRepresentersConstructed = true; });
  reject("nonsofic overclaim", (value) => { value.theoremBoundary.nonSoficityEstablished = true; });
  reject("architecture overclaim", (value) => { value.theoremBoundary.architecturalLowerBoundEstablished = true; });
  reject("novelty overclaim", (value) => { value.theoremBoundary.abstractInvariantNoveltyClaimed = true; });
  reject("undeclared field", (value) => { value.theoremBoundary.PEqualsNP = true; });
  reject("certificate digest", (value) => { value.certificateDigest = "f".repeat(64); }, false);
  return cases;
}

export function runGenesisEssentialCoherenceHierarchy() {
  const firstCertificate = buildCertificate(buildLaboratory());
  const secondCertificate = buildCertificate(buildLaboratory());
  assert.equal(canonical(firstCertificate), canonical(secondCertificate));
  assert.equal(firstCertificate.certificateDigest, secondCertificate.certificateDigest);
  assert(validateCertificate(firstCertificate, secondCertificate));
  assert(replayGenesisEssentialCoherenceHierarchyCertificate(firstCertificate));
  const tamperCases = tamperSuite(firstCertificate);
  return {
    schema: "oasis.genesis-essential-coherence-hierarchy.v1",
    status: "PASS",
    result: {
      dimensions: firstCertificate.construction.dimensionsAudited,
      dicksonDegrees: firstCertificate.levels.map(({ n, dickson }) => ({ n, degree: dickson.degree })),
      primitiveDegrees: firstCertificate.levels.map(({ n, canonicalPrimitive }) => ({
        n,
        degree: canonicalPrimitive.degree,
      })),
      sq1IdentitiesVerified: firstCertificate.exactChecks.sq1Identities,
      properSubspacesAudited: firstCertificate.exactChecks.properSubspaceRestrictions,
      basisFreeInvarianceVerified: firstCertificate.theoremBoundary.basisFreeInvarianceVerified,
      n2MatchesQuotientEssentialityControl: firstCertificate.n2Compatibility.exactPolynomialEqualityVerified,
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
  console.log("PASS exact hierarchy: D_n and canonical deleted-factor primitives built for n=2,3,4");
  console.log("PASS Bockstein: Sq^1(c_n)=D_n in every audited dimension");
  console.log(`PASS essentiality: ${result.result.properSubspacesAudited} proper subspaces exhaustively restrict to zero`);
  console.log("PASS invariance: all GL(n,2) for n<=3 and a closure-certified generating set for GL(4,2)");
  console.log("PASS n=2 bridge: D_2=u^2v+uv^2 and both canonical/project extension primitives have this Bockstein");
  console.log(`PASS deterministic replay: ${result.deterministicReplay.certificateDigest}`);
  console.log(`PASS replay/tamper: ${result.tamper.rejected}/${result.tamper.attempted} mutations rejected`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = runGenesisEssentialCoherenceHierarchy();
  printPassLines(result);
  console.log(JSON.stringify(result, null, 2));
}
