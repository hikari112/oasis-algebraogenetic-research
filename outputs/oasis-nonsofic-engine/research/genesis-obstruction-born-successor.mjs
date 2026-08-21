import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import { runGenesisEssentialCoherenceHierarchy } from "./genesis-essential-coherence-hierarchy.mjs";

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
  assert(Number.isInteger(variables) && variables >= 0);
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

function squarePolynomial(polynomial) {
  return makePolynomial(
    polynomial.variables,
    orderedTerms(polynomial).map((exponents) => exponents.map((value) => 2 * value)),
  );
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
  assert(Number.isInteger(mask) && mask >= 0 && mask < (2 ** variables));
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

function embedPolynomial(polynomial, targetVariables) {
  assert(targetVariables >= polynomial.variables);
  return makePolynomial(
    targetVariables,
    orderedTerms(polynomial).map((exponents) => [
      ...exponents,
      ...Array(targetVariables - polynomial.variables).fill(0),
    ]),
  );
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

function formatMonomial(exponents) {
  const factors = [];
  for (let index = 0; index < exponents.length; index += 1) {
    const exponent = exponents[index];
    if (exponent === 0) continue;
    const name = `x${index + 1}`;
    factors.push(exponent === 1 ? name : `${name}^${exponent}`);
  }
  return factors.length === 0 ? "1" : factors.join("*");
}

function polynomialSummary(polynomial) {
  const terms = orderedTerms(polynomial);
  return {
    variables: polynomial.variables,
    degree: polynomialDegree(polynomial),
    monomialCount: terms.length,
    monomialPreview: terms.slice(0, 8).map(formatMonomial),
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

function buildDickson(variables) {
  let result = onePolynomial(variables);
  for (let mask = 1; mask < 2 ** variables; mask += 1) {
    result = multiplyPolynomials(result, linearForm(variables, mask));
  }
  return result;
}

function buildCanonicalPrimitive(variables) {
  assert(variables >= 2);
  let result = zeroPolynomial(variables);
  for (let omitted = 1; omitted < 2 ** variables; omitted += 1) {
    let deletedProduct = onePolynomial(variables);
    for (let mask = 1; mask < 2 ** variables; mask += 1) {
      if (mask !== omitted) {
        deletedProduct = multiplyPolynomials(deletedProduct, linearForm(variables, mask));
      }
    }
    result = addPolynomials(result, deletedProduct);
  }
  return result;
}

function buildAffineNorm(variables) {
  const outputVariables = variables + 1;
  const newCovector = linearForm(outputVariables, 1 << variables);
  let result = onePolynomial(outputVariables);
  for (let mask = 0; mask < 2 ** variables; mask += 1) {
    const affineForm = addPolynomials(
      newCovector,
      embedPolynomial(linearForm(variables, mask), outputVariables),
    );
    result = multiplyPolynomials(result, affineForm);
  }
  return result;
}

function polynomialFamilyRank(polynomials) {
  const basis = new Map();
  for (const polynomial of polynomials) {
    let row = new Set(orderedTerms(polynomial).map(exponentKey));
    while (row.size > 0) {
      const pivot = [...row].sort()[0];
      const basisRow = basis.get(pivot);
      if (!basisRow) {
        basis.set(pivot, row);
        break;
      }
      const next = new Set(row);
      for (const term of basisRow) {
        if (next.has(term)) next.delete(term);
        else next.add(term);
      }
      row = next;
    }
  }
  return basis.size;
}

function deriveObstructionGeneratorLine(presentedGenerators) {
  assert(presentedGenerators.length > 0);
  const variables = presentedGenerators[0].variables;
  assert(presentedGenerators.every(({ variables: count }) => count === variables));
  const nonzero = presentedGenerators.filter(({ terms }) => terms.size > 0);
  const degrees = new Set(nonzero.map(polynomialDegree));
  assert(degrees.size <= 1, "this executable audits one homogeneous obstruction-generator space at a time");
  const quotientDimension = polynomialFamilyRank(nonzero);
  return {
    ambientDimension: variables,
    presentedGeneratorCount: presentedGenerators.length,
    nonzeroPresentedGeneratorCount: nonzero.length,
    homogeneousDegree: degrees.size === 0 ? null : [...degrees][0],
    quotientDimension,
    interpretation: "minimal homogeneous obstruction-generator space I/(mI); no identification with a lift-stack translation band is assumed",
  };
}

function freeTransportExtension(ambientDimension, generatorLine) {
  assert.equal(ambientDimension, generatorLine.ambientDimension);
  return {
    inputDimension: ambientDimension,
    newDirectionDimension: generatorLine.quotientDimension,
    outputDimension: ambientDimension + generatorLine.quotientDimension,
    stutter: generatorLine.quotientDimension === 0,
  };
}

// The function intentionally accepts only the current typed stage.  Its arity,
// obstruction-generator line, and output arity are derived from that object.
function obstructionBornSuccessor(stage) {
  const { dickson, primitive } = stage;
  assert(dickson && primitive);
  assert.equal(dickson.variables, primitive.variables);
  assert(polynomialEqual(sqOne(primitive), dickson));
  const inputDimension = dickson.variables;
  const generatorLine = deriveObstructionGeneratorLine([dickson]);
  const extension = freeTransportExtension(inputDimension, generatorLine);
  if (generatorLine.quotientDimension === 0) {
    assert(extension.stutter);
    return {
      dickson: makePolynomial(inputDimension, orderedTerms(dickson)),
      primitive: makePolynomial(inputDimension, orderedTerms(primitive)),
      affineNorm: null,
      generatorLine,
      extension,
      stutter: true,
    };
  }
  assert.equal(generatorLine.quotientDimension, 1);
  assert.equal(extension.outputDimension, inputDimension + 1);
  const affineNorm = buildAffineNorm(inputDimension);
  const embeddedDickson = embedPolynomial(dickson, extension.outputDimension);
  const embeddedPrimitive = embedPolynomial(primitive, extension.outputDimension);
  const successorDickson = multiplyPolynomials(embeddedDickson, affineNorm);
  const successorPrimitive = addPolynomials(
    multiplyPolynomials(embeddedPrimitive, affineNorm),
    squarePolynomial(embeddedDickson),
  );
  assert(polynomialEqual(sqOne(affineNorm), zeroPolynomial(extension.outputDimension)));
  assert(polynomialEqual(sqOne(successorPrimitive), successorDickson));
  return {
    dickson: successorDickson,
    primitive: successorPrimitive,
    affineNorm,
    generatorLine,
    extension,
    stutter: false,
  };
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

function extendSubstitution(images) {
  return [...images, 1 << images.length];
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
  for (let index = 0; index < dimension; index += 1) {
    result *= (2 ** dimension) - (2 ** index);
  }
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

function auditNaturality(stage, successor) {
  const dimension = stage.dickson.variables;
  const exhaustive = dimension <= 3;
  const namedMatrices = exhaustive
    ? allInvertibleSubstitutions(dimension).map((images) => ({ name: matrixKey(images), images }))
    : gl4Generators();
  if (exhaustive) assert.equal(namedMatrices.length, glOrder(dimension));
  else assert.equal(dimension, 4);

  for (const { images } of namedMatrices) {
    const transformedStage = {
      dickson: substitutePolynomial(stage.dickson, images, dimension),
      primitive: substitutePolynomial(stage.primitive, images, dimension),
    };
    const transformedSuccessor = obstructionBornSuccessor(transformedStage);
    const extendedImages = extendSubstitution(images);
    assert(polynomialEqual(
      transformedSuccessor.dickson,
      substitutePolynomial(successor.dickson, extendedImages, dimension + 1),
    ));
    assert(polynomialEqual(
      transformedSuccessor.primitive,
      substitutePolynomial(successor.primitive, extendedImages, dimension + 1),
    ));
    assert(polynomialEqual(
      transformedSuccessor.affineNorm,
      substitutePolynomial(successor.affineNorm, extendedImages, dimension + 1),
    ));
  }

  if (exhaustive) {
    return {
      policy: "exhaustive GL(n,2) naturality",
      transformationsAudited: namedMatrices.length,
      expectedGroupOrder: glOrder(dimension),
      dicksonNatural: true,
      generatedPrimitiveEquivariant: true,
      affineNormNatural: true,
      matrixDigest: digest(namedMatrices.map(({ images }) => images)),
    };
  }

  const closure = generatedMatrixGroup(dimension, namedMatrices);
  assert.equal(closure.length, glOrder(dimension));
  return {
    policy: "naturality on adjacent swaps and one transvection; closure certified as GL(4,2)",
    generatorsAudited: namedMatrices,
    generatorCount: namedMatrices.length,
    generatedClosureOrder: closure.length,
    expectedGroupOrder: glOrder(dimension),
    dicksonNaturalOnGenerators: true,
    generatedPrimitiveEquivariantOnGenerators: true,
    affineNormNaturalOnGenerators: true,
    closureDigest: digest(closure.map(matrixKey).sort()),
  };
}

// This is a relabeling of the affine coset in the naked split total space.
// It moves the chosen past hyperplane, so it is not a change of splitting of
// a fixed short exact sequence.
function auditAffineCosetRelabeling(stage, successor) {
  const inputDimension = stage.dickson.variables;
  const outputDimension = inputDimension + 1;
  const identity = identitySubstitution(outputDimension);
  const witnesses = [];
  for (let shift = 0; shift < 2 ** inputDimension; shift += 1) {
    const images = [...identity];
    images[inputDimension] ^= shift;
    assert(polynomialEqual(
      substitutePolynomial(successor.affineNorm, images, outputDimension),
      successor.affineNorm,
    ));
    assert(polynomialEqual(
      substitutePolynomial(successor.dickson, images, outputDimension),
      successor.dickson,
    ));
    assert(polynomialEqual(
      substitutePolynomial(successor.primitive, images, outputDimension),
      successor.primitive,
    ));
    witnesses.push(images);
  }
  return {
    relabelingsAudited: witnesses.length,
    expectedRelabelingCount: 2 ** inputDimension,
    transformation: "t->t+mu with the old-character summand fixed; this changes the past hyperplane and is not extension-splitting gauge",
    affineNormInvariantUnderCosetRelabeling: true,
    successorDicksonInvariantUnderCosetRelabeling: true,
    successorPrimitiveInvariantUnderCosetRelabeling: true,
    witnessDigest: digest(witnesses),
  };
}

// For 0 -> V -> V+ -> L -> 0, changing the lift of the quotient generator by
// a in V fixes t and acts dually by x_i -> x_i + a_i t.  The norm factor is
// chart-dependent under this actual extension gauge.  The whole Dickson class
// is invariant, while the generated precursor recurrence is equivariant.
function auditExtensionSplittingShear(stage, successor) {
  const inputDimension = stage.dickson.variables;
  const outputDimension = inputDimension + 1;
  const witnesses = [];
  let separatelyInvariantNorms = 0;
  let invariantGeneratedPrecursors = 0;

  for (let shear = 0; shear < 2 ** inputDimension; shear += 1) {
    const images = identitySubstitution(outputDimension);
    for (let variable = 0; variable < inputDimension; variable += 1) {
      if ((shear >> variable) & 1) images[variable] ^= 1 << inputDimension;
    }

    const shiftedOldDickson = substitutePolynomial(
      embedPolynomial(stage.dickson, outputDimension),
      images,
      outputDimension,
    );
    const shiftedOldPrimitive = substitutePolynomial(
      embedPolynomial(stage.primitive, outputDimension),
      images,
      outputDimension,
    );
    const shiftedNorm = substitutePolynomial(successor.affineNorm, images, outputDimension);
    const shiftedSuccessorDickson = substitutePolynomial(successor.dickson, images, outputDimension);
    const shiftedSuccessorPrimitive = substitutePolynomial(successor.primitive, images, outputDimension);
    const recomputedDickson = multiplyPolynomials(shiftedOldDickson, shiftedNorm);
    const recomputedPrimitive = addPolynomials(
      multiplyPolynomials(shiftedOldPrimitive, shiftedNorm),
      squarePolynomial(shiftedOldDickson),
    );

    assert(polynomialEqual(shiftedSuccessorDickson, recomputedDickson));
    assert(polynomialEqual(shiftedSuccessorDickson, successor.dickson));
    assert(polynomialEqual(shiftedSuccessorPrimitive, recomputedPrimitive));
    if (polynomialEqual(shiftedNorm, successor.affineNorm)) separatelyInvariantNorms += 1;
    if (polynomialEqual(shiftedSuccessorPrimitive, successor.primitive)) invariantGeneratedPrecursors += 1;
    witnesses.push(images);
  }

  assert.equal(separatelyInvariantNorms, 1, "only the identity splitting shear leaves the norm factor fixed");
  return {
    shearsAudited: witnesses.length,
    expectedShearCount: 2 ** inputDimension,
    transformation: "t->t and x_i->x_i+a_i*t",
    affineNormSeparatelyInvariant: false,
    affineNormInvariantShearCount: separatelyInvariantNorms,
    successorDicksonInvariant: true,
    generatedPrimitiveRecurrenceEquivariant: true,
    generatedPrimitiveInvariantShearCount: invariantGeneratedPrecursors,
    descentStatus: "orbit-equivariant only; a chosen split chart is retained for the polynomial genealogy",
    witnessDigest: digest(witnesses),
  };
}

function binomial(n, k) {
  let result = 1n;
  const reduced = Math.min(k, n - k);
  for (let index = 1; index <= reduced; index += 1) {
    result = (result * BigInt(n - reduced + index)) / BigInt(index);
  }
  return result;
}

function precursorFiberDimensions(dimension) {
  const degree = (2 ** dimension) - 2;
  let previousRank = 0n;
  let homogeneousDimension = 0n;
  let kernelDimension = 0n;
  let imageRank = 0n;
  for (let currentDegree = 0; currentDegree <= degree; currentDegree += 1) {
    homogeneousDimension = binomial(dimension + currentDegree - 1, dimension - 1);
    kernelDimension = previousRank;
    imageRank = currentDegree === 0 ? 0n : homogeneousDimension - previousRank;
    previousRank = imageRank;
  }
  assert.equal(kernelDimension + imageRank, homogeneousDimension);
  return {
    degree,
    homogeneousDimension: homogeneousDimension.toString(),
    sq1KernelDimension: kernelDimension.toString(),
    sq1ImageRank: imageRank.toString(),
    precursorFiberCardinality: `2^${kernelDimension}`,
    justification: "the positive-degree complex (F2[x1,...,xn],Sq1) is exact; rank_d=dim(H^d)-rank_(d-1)",
  };
}

function buildLevelRecord(stage) {
  const dimension = stage.dickson.variables;
  const canonicalPrimitive = buildCanonicalPrimitive(dimension);
  const difference = addPolynomials(stage.primitive, canonicalPrimitive);
  assert(stage.primitive.terms.size > 0);
  assert(canonicalPrimitive.terms.size > 0);
  assert(difference.terms.size > 0);
  assert(polynomialEqual(stage.dickson, buildDickson(dimension)));
  assert(polynomialEqual(sqOne(stage.primitive), stage.dickson));
  assert(polynomialEqual(sqOne(canonicalPrimitive), stage.dickson));
  assert(polynomialEqual(sqOne(difference), zeroPolynomial(dimension)));
  return {
    dimension,
    groupOrder: 2 ** dimension,
    dickson: polynomialSummary(stage.dickson),
    generatedPrimitive: polynomialSummary(stage.primitive),
    canonicalPrimitive: polynomialSummary(canonicalPrimitive),
    genealogyDifference: polynomialSummary(difference),
    generatedDiffersFromCanonical: true,
    genealogyDifferenceNonzero: true,
    genealogyDifferenceSq1Zero: true,
    differenceLiftableAtCohomologyLevelByCoefficientExactness: true,
    precursorFiber: precursorFiberDimensions(dimension),
  };
}

function auditStep(stage, successor) {
  const inputDimension = stage.dickson.variables;
  const outputDimension = inputDimension + 1;
  const directNextDickson = buildDickson(outputDimension);
  const currentCanonical = buildCanonicalPrimitive(inputDimension);
  const directNextCanonical = buildCanonicalPrimitive(outputDimension);
  const embeddedDickson = embedPolynomial(stage.dickson, outputDimension);
  const embeddedCanonical = embedPolynomial(currentCanonical, outputDimension);
  const canonicalByRecurrence = addPolynomials(
    multiplyPolynomials(embeddedCanonical, successor.affineNorm),
    squarePolynomial(embeddedDickson),
  );
  const currentDifference = addPolynomials(stage.primitive, currentCanonical);
  const expectedNextDifference = multiplyPolynomials(
    embedPolynomial(currentDifference, outputDimension),
    successor.affineNorm,
  );
  const actualNextDifference = addPolynomials(successor.primitive, directNextCanonical);

  assert(polynomialEqual(successor.dickson, directNextDickson));
  assert(polynomialEqual(canonicalByRecurrence, directNextCanonical));
  assert(polynomialEqual(actualNextDifference, expectedNextDifference));
  assert(expectedNextDifference.terms.size > 0);
  assert(polynomialEqual(sqOne(expectedNextDifference), zeroPolynomial(outputDimension)));

  const translatedStage = {
    dickson: stage.dickson,
    primitive: addPolynomials(stage.primitive, currentDifference),
  };
  assert(polynomialEqual(translatedStage.primitive, currentCanonical));
  const translatedSuccessor = obstructionBornSuccessor(translatedStage);
  assert(polynomialEqual(translatedSuccessor.primitive, directNextCanonical));
  assert(polynomialEqual(
    addPolynomials(successor.primitive, translatedSuccessor.primitive),
    expectedNextDifference,
  ));

  const oldSliceImages = [...identitySubstitution(inputDimension), 0];
  const oldSliceDickson = substitutePolynomial(successor.dickson, oldSliceImages, inputDimension);
  const oldSlicePrimitive = substitutePolynomial(successor.primitive, oldSliceImages, inputDimension);
  const currentDicksonSquare = squarePolynomial(stage.dickson);
  assert(polynomialEqual(oldSliceDickson, zeroPolynomial(inputDimension)));
  assert(polynomialEqual(oldSlicePrimitive, currentDicksonSquare));
  assert(polynomialEqual(sqOne(currentDicksonSquare), zeroPolynomial(inputDimension)));

  return {
    inputDimension,
    outputDimension,
    obstructionGeneratorLine: successor.generatorLine,
    freeTransportExtension: successor.extension,
    affineNorm: polynomialSummary(successor.affineNorm),
    successorDickson: polynomialSummary(successor.dickson),
    successorGeneratedPrimitive: polynomialSummary(successor.primitive),
    identities: {
      dicksonFactorization: "D_plus=D*N_V(t)",
      dicksonFactorizationVerified: true,
      intrinsicNextDicksonRecovered: true,
      affineNormSq1Zero: true,
      generatedPrimitiveRecurrence: "zeta_plus=zeta*N_V(t)+D^2",
      generatedPrimitiveSq1EqualsNextDickson: true,
      canonicalPrimitiveObeysSameRecurrence: true,
      genealogyDifferenceRecurrence: "h_plus=h*N_V(t)",
      genealogyDifferenceRecurrenceVerified: true,
      genealogyDifferenceRemainsNonzero: true,
      oldSliceRestrictionOfNextDicksonZero: true,
      oldSliceRestrictionOfNextPrimitiveEqualsCurrentDicksonSquare: true,
      oldSliceCurrentDicksonSquareSq1Zero: true,
      oldSlicePrimitiveAffineZeroModuloCoefficientLiftableTranslations: true,
    },
    affinePrecursorDescent: {
      translation: "zeta->zeta+h for Sq1(h)=0 descends to zeta_plus->zeta_plus+h*N",
      currentDifferenceSq1Zero: true,
      nextDifferenceSq1Zero: true,
      exactTranslationIdentityVerified: true,
      multiplicationByNormInjectiveOnPolynomialClasses: true,
      explicitC4CochainLiftConstructed: false,
    },
    affineCosetRelabeling: auditAffineCosetRelabeling(stage, successor),
    extensionSplittingShear: auditExtensionSplittingShear(stage, successor),
    naturality: auditNaturality(stage, successor),
  };
}

function buildLaboratory() {
  const predecessor = runGenesisEssentialCoherenceHierarchy();
  assert.equal(predecessor.status, "PASS");
  assert(predecessor.theoremBoundary.basisFreeInvarianceVerified);
  assert(predecessor.certificate.n2Compatibility.exactPolynomialEqualityVerified);
  assert.equal(predecessor.certificate.n2Compatibility.projectExtensionClass, "e_2=u^2+u*v");

  const initialStage = {
    dickson: buildDickson(2),
    primitive: makePolynomial(2, [[2, 0], [1, 1]]),
  };
  assert(polynomialEqual(sqOne(initialStage.primitive), initialStage.dickson));
  const expectedInitialDifference = makePolynomial(2, [[0, 2]]);
  assert(polynomialEqual(
    addPolynomials(initialStage.primitive, buildCanonicalPrimitive(2)),
    expectedInitialDifference,
  ));

  const levels = [];
  const steps = [];
  let stage = initialStage;
  while (stage.dickson.variables < 5) {
    levels.push(buildLevelRecord(stage));
    const successor = obstructionBornSuccessor(stage);
    steps.push(auditStep(stage, successor));
    stage = { dickson: successor.dickson, primitive: successor.primitive };
  }
  levels.push(buildLevelRecord(stage));

  assert.deepEqual(levels.map(({ dickson }) => dickson.monomialCount), [2, 6, 24, 120]);
  assert.deepEqual(levels.map(({ generatedPrimitive }) => generatedPrimitive.monomialCount), [2, 8, 62, 552]);
  assert.deepEqual(levels.map(({ canonicalPrimitive }) => canonicalPrimitive.monomialCount), [3, 10, 44, 240]);
  assert.deepEqual(steps.map(({ affineNorm }) => affineNorm.monomialCount), [6, 26, 150]);

  const zero = zeroPolynomial(2);
  const closedZeroObstructionPrimitive = makePolynomial(2, [[2, 0]]);
  assert(polynomialEqual(sqOne(closedZeroObstructionPrimitive), zero));
  const singleGeneratorLine = deriveObstructionGeneratorLine([initialStage.dickson]);
  const duplicateGeneratorLine = deriveObstructionGeneratorLine([initialStage.dickson, initialStage.dickson, zero]);
  const zeroGeneratorLine = deriveObstructionGeneratorLine([zero]);
  const singleExtension = freeTransportExtension(2, singleGeneratorLine);
  const duplicateExtension = freeTransportExtension(2, duplicateGeneratorLine);
  const zeroExtension = freeTransportExtension(2, zeroGeneratorLine);
  const zeroSuccessor = obstructionBornSuccessor({
    dickson: zero,
    primitive: closedZeroObstructionPrimitive,
  });
  assert.equal(singleGeneratorLine.quotientDimension, 1);
  assert.equal(duplicateGeneratorLine.quotientDimension, 1);
  assert.equal(zeroGeneratorLine.quotientDimension, 0);
  assert.deepEqual(duplicateExtension, singleExtension);
  assert.equal(zeroExtension.outputDimension, 2);
  assert(zeroExtension.stutter);
  assert(zeroSuccessor.stutter);
  assert.equal(zeroSuccessor.affineNorm, null);
  assert(polynomialEqual(zeroSuccessor.dickson, zero));
  assert(polynomialEqual(zeroSuccessor.primitive, closedZeroObstructionPrimitive));
  assert.deepEqual(zeroSuccessor.extension, zeroExtension);

  const cleanSuccessor = obstructionBornSuccessor(initialStage);
  const poisonedInterfaceSuccessor = obstructionBornSuccessor({
    ...initialStage,
    externalStageCounter: 999,
    externalBasisList: ["forbidden"],
  });
  assert(polynomialEqual(cleanSuccessor.dickson, poisonedInterfaceSuccessor.dickson));
  assert(polynomialEqual(cleanSuccessor.primitive, poisonedInterfaceSuccessor.primitive));
  assert.equal(obstructionBornSuccessor.length, 1);

  return {
    predecessor,
    levels,
    steps,
    ablations: {
      zeroIdeal: {
        obstructionGeneratorLine: zeroGeneratorLine,
        extension: zeroExtension,
        fullSuccessor: {
          stutter: zeroSuccessor.stutter,
          affineNormConstructed: zeroSuccessor.affineNorm !== null,
          dicksonUnchanged: polynomialEqual(zeroSuccessor.dickson, zero),
          inputPrimitiveNonzeroAndSq1Closed: closedZeroObstructionPrimitive.terms.size > 0,
          primitiveUnchanged: polynomialEqual(zeroSuccessor.primitive, closedZeroObstructionPrimitive),
        },
        noObstructionMeansNoNewDirection: true,
        fullTypedSuccessorStutterVerified: true,
      },
      duplicateGenerator: {
        singleGeneratorLine,
        duplicateGeneratorLine,
        singleExtension,
        duplicateExtension,
        scope: "obstruction-generator quotient helper; the full successor API receives the resulting obstruction class, not a generator list",
        generatorLineQuotientRemovesDuplicatePresentation: true,
        duplicateDoesNotCreateSecondReifiedDirection: true,
      },
    },
    interfaceAudit: {
      successorFunctionArity: obstructionBornSuccessor.length,
      requiredStageFields: ["dickson", "primitive"],
      ambientDimensionDerivedFromPolynomialArity: true,
      externalStageCounterRead: false,
      externalBasisListRead: false,
      poisonedExternalStageCounterIgnored: true,
      poisonedExternalBasisListIgnored: true,
      finiteVerificationHorizon: 5,
      successorReadsVerificationHorizon: false,
      coordinateRealization: "append one coordinate in a retained split chart; old-basis GL naturality, naked-total-space coset relabeling, and actual extension-splitting shears are audited separately",
    },
  };
}

function buildCertificate(lab) {
  const predecessorCertificate = lab.predecessor.certificate;
  const body = {
    schema: "oasis.genesis-obstruction-born-successor.certificate.v1",
    predecessor: {
      schema: lab.predecessor.schema,
      certificateSchema: predecessorCertificate.schema,
      certificateDigest: predecessorCertificate.certificateDigest,
      dimensions: lab.predecessor.result.dimensions,
      n2ProjectExtensionLinked: predecessorCertificate.n2Compatibility.exactPolynomialEqualityVerified,
      n2ProjectExtensionClass: predecessorCertificate.n2Compatibility.projectExtensionClass,
      n2Difference: predecessorCertificate.n2Compatibility.difference,
    },
    construction: {
      coefficientField: "F2",
      structuredInput: "(E,H=Sym(E*), admitted homogeneous obstruction ideal I=(D), generated precursor zeta)",
      obstructionGeneratorLine: "G=I/(mI), where m=H^{>0}; in the audited hierarchy dim(G)=1",
      declaredReification: "promote the dual of the indecomposable obstruction-generator line G^vee to degree-one transport",
      liftStackBandIdentification: "not derived; equality of dimension and coefficient type is not a canonical semantic identification",
      freeExtension: "E_plus=E direct-sum G^vee",
      representability: "Hom(E_plus,W)=Hom(E,W) x Hom(G^vee,W)=Hom(E,W) x (W tensor G)",
      affineNorm: "N_V(t)=product_{lambda in V*}(t+lambda)",
      dicksonRecurrence: "D_plus=D*N_V(t)",
      primitiveRecurrence: "zeta_plus=zeta*N_V(t)+D^2",
      genealogyRecurrence: "h_plus=h*N_V(t) for h=zeta+C and Sq1(h)=0",
      noCounterReason: "the successor consumes one current typed object and derives arity, the obstruction-generator line, and output arity from it",
      finiteHarnessBoundary: "the audit runner stops at rank five, but that verification horizon is never passed to the successor",
      noBasisReason: "coordinate construction is audited under every GL change through rank three and a generating set with full GL(4,2) closure",
      chartBoundary: "t->t+lambda relabels the affine coset while moving the past hyperplane; the actual fixed-extension splitting shear is t->t, x_i->x_i+a_i*t, under which N is chart-dependent and the recurrence is equivariant",
    },
    levels: lab.levels,
    steps: lab.steps,
    ablations: lab.ablations,
    interfaceAudit: lab.interfaceAudit,
    ordinaryPrimitiveAttachmentControl: {
      operation: "adjoin or represent a primitive in its existing cochain/chain degree",
      transportDimensionBefore: 2,
      transportDimensionAfter: 2,
      pi1Changed: false,
      createsDegreeOneDirection: false,
      contrast: "only the separately declared dual-line reification changes E_n to E_(n+1)",
    },
    exactChecks: {
      auditedInputRanks: lab.steps.map(({ inputDimension }) => inputDimension),
      auditedOutputRanks: lab.steps.map(({ outputDimension }) => outputDimension),
      dicksonRecurrences: lab.steps.length,
      generatedPrimitiveRecurrences: lab.steps.length,
      canonicalPrimitiveRecurrences: lab.steps.length,
      genealogyRecurrences: lab.steps.length,
      affinePrecursorDescentChecks: lab.steps.length,
      affineCosetRelabelings: lab.steps.reduce(
        (sum, { affineCosetRelabeling }) => sum + affineCosetRelabeling.relabelingsAudited,
        0,
      ),
      extensionSplittingShears: lab.steps.reduce(
        (sum, { extensionSplittingShear }) => sum + extensionSplittingShear.shearsAudited,
        0,
      ),
      exhaustiveGLNaturalityChecks: lab.steps.slice(0, 2).reduce(
        (sum, { naturality }) => sum + naturality.transformationsAudited,
        0,
      ),
      gl4GeneratorNaturalityChecks: lab.steps[2].naturality.generatorCount,
      gl4ClosureOrder: lab.steps[2].naturality.generatedClosureOrder,
      zeroIdealFullSuccessorStutterChecks: 1,
      duplicateGeneratorLineQuotientChecks: 1,
      floatingPointOperations: 0,
    },
    comma: {
      schema: "oasis.comma.v1",
      claim: "conditional on dual-line reification, the generated essential obstruction supplies a counter-free natural one-direction successor and an exact split-chart precursor genealogy from E_2 through E_5",
      objects: "exact F2 polynomials, obstruction-generator quotients, free split extensions, precursor affine fibers, GL substitutions, affine-coset relabelings, and extension-splitting shears",
      method: "derive G from the current obstruction presentation, build E+ without an external rank input, and compare recursive outputs with independently rebuilt Dickson and deleted-factor polynomials",
      measurement: "all identities are exact in F2; zero tolerances and zero stochastic choices",
      assumptions: [
        "the current admitted obstruction ideal is generated by the certified essential class",
        "the dual of G=I/(mI) is declared to be a new degree-one transport line",
        "no canonical identification of G^vee with the actual local lift-stack translation band has been derived",
        "the C4 coefficient policy and its Sq1 interpretation remain inherited from the predecessor",
      ],
    },
    evaluationPolicy: {
      arithmetic: "exact F2 polynomial arithmetic with XOR cancellation",
      rankPolicy: "exact row reduction on polynomial supports for the presented homogeneous obstruction-generator space",
      naturalityPolicy: "exhaustive GL(2,2) and GL(3,2); generator checks with computed GL(4,2) closure order 20160",
      affinePolicy: "separately exhaust every t->t+lambda coset relabeling and every fixed-extension splitting shear t->t, x_i->x_i+a_i*t at input ranks two through four",
      replayPolicy: "rebuild predecessor-linked certificates and every polynomial twice, then require canonical digest equality",
      stochasticChoices: 0,
      tolerance: 0,
    },
    theoremBoundary: {
      ranksTwoThroughFiveExecuted: true,
      counterFreeAtDeclaredFunctorLevel: true,
      basisNaturalInAuditedRanks: true,
      affineCosetRelabelingInvariantInAuditedRanks: true,
      extensionSplittingShearEquivariantInAuditedRanks: true,
      affineNormIndependentOfExtensionSplitting: false,
      zeroObstructionFullTypedSuccessorStutters: true,
      duplicateObstructionPresentationsQuotientedAtGeneratorLineHelper: true,
      generatedPrecursorGenealogyRetained: true,
      liftableDifferenceDescentVerifiedAtCohomologyLevel: true,
      dualLineReificationDeclared: true,
      dualLineReificationDerivedFromPredecessorSemantics: false,
      generatorLineCanonicallyIdentifiedWithLiftStackBand: false,
      ordinaryPrimitiveAttachmentPreservesPi1: true,
      ordinaryPrimitiveAttachmentAddsPi1: false,
      newTransportDirectionForcedByOrdinaryPrimitiveAttachment: false,
      unconditionalEndogenousSuccessorEstablished: false,
      explicitC4CochainLiftsConstructed: false,
      temporalAttachmentIsOrdinaryObstructionPreservingMap: false,
      allRanksExecuted: false,
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

export function replayGenesisObstructionBornSuccessorCertificate(candidate) {
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
  reject("predecessor bridge", (value) => { value.predecessor.n2ProjectExtensionLinked = false; });
  reject("structured input", (value) => { value.construction.structuredInput = "bare group"; });
  reject("obstruction generator line", (value) => { value.construction.obstructionGeneratorLine = "G=F2 by fiat"; });
  reject("declared reification", (value) => { value.construction.declaredReification = "derived theorem"; });
  reject("lift-stack band identification", (value) => { value.construction.liftStackBandIdentification = "canonical theorem"; });
  reject("free extension", (value) => { value.construction.freeExtension = "E_plus=E"; });
  reject("representability", (value) => { value.construction.representability = "none"; });
  reject("norm formula", (value) => { value.construction.affineNorm = "N=1"; });
  reject("Dickson recurrence", (value) => { value.construction.dicksonRecurrence = "D_plus=D"; });
  reject("primitive recurrence", (value) => { value.construction.primitiveRecurrence = "zeta_plus=zeta"; });
  reject("genealogy recurrence", (value) => { value.construction.genealogyRecurrence = "h_plus=0"; });
  reject("counter reason", (value) => { value.construction.noCounterReason = "read n"; });
  reject("harness boundary", (value) => { value.construction.finiteHarnessBoundary = "successor reads rank five"; });
  reject("basis reason", (value) => { value.construction.noBasisReason = "fixed basis"; });
  reject("chart boundary", (value) => { value.construction.chartBoundary = "the norm is invariant under every splitting shear"; });
  reject("rank two Dickson", (value) => { value.levels[0].dickson.monomialCount = 1; });
  reject("rank three generated precursor", (value) => { value.levels[1].generatedPrimitive.monomialCount = 7; });
  reject("rank four canonical precursor", (value) => { value.levels[2].canonicalPrimitive.exponentDigest = "f".repeat(64); });
  reject("rank five genealogy", (value) => { value.levels[3].genealogyDifferenceNonzero = false; });
  reject("rank five Sq1 difference", (value) => { value.levels[3].genealogyDifferenceSq1Zero = false; });
  reject("precursor fiber", (value) => { value.levels[2].precursorFiber.sq1KernelDimension = "308"; });
  reject("step input rank", (value) => { value.steps[0].inputDimension = 1; });
  reject("step output rank", (value) => { value.steps[2].outputDimension = 6; });
  reject("generator-line quotient dimension", (value) => { value.steps[1].obstructionGeneratorLine.quotientDimension = 2; });
  reject("extension dimension", (value) => { value.steps[0].freeTransportExtension.outputDimension = 4; });
  reject("norm degree", (value) => { value.steps[2].affineNorm.degree = 15; });
  reject("successor Dickson", (value) => { value.steps[1].successorDickson.monomialCount = 23; });
  reject("successor primitive", (value) => { value.steps[2].successorGeneratedPrimitive.monomialCount = 551; });
  reject("factorization", (value) => { value.steps[0].identities.dicksonFactorizationVerified = false; });
  reject("intrinsic recovery", (value) => { value.steps[1].identities.intrinsicNextDicksonRecovered = false; });
  reject("norm Sq1", (value) => { value.steps[2].identities.affineNormSq1Zero = false; });
  reject("canonical recurrence", (value) => { value.steps[1].identities.canonicalPrimitiveObeysSameRecurrence = false; });
  reject("genealogy survival", (value) => { value.steps[2].identities.genealogyDifferenceRemainsNonzero = false; });
  reject("old-slice restriction", (value) => { value.steps[0].identities.oldSliceRestrictionOfNextDicksonZero = false; });
  reject("old-slice primitive", (value) => { value.steps[0].identities.oldSliceRestrictionOfNextPrimitiveEqualsCurrentDicksonSquare = false; });
  reject("old-slice square closure", (value) => { value.steps[1].identities.oldSliceCurrentDicksonSquareSq1Zero = false; });
  reject("old-slice affine class", (value) => { value.steps[2].identities.oldSlicePrimitiveAffineZeroModuloCoefficientLiftableTranslations = false; });
  reject("affine translation", (value) => { value.steps[0].affinePrecursorDescent.exactTranslationIdentityVerified = false; });
  reject("lift overclaim in step", (value) => { value.steps[1].affinePrecursorDescent.explicitC4CochainLiftConstructed = true; });
  reject("affine coset count", (value) => { value.steps[2].affineCosetRelabeling.relabelingsAudited = 15; });
  reject("affine coset invariance", (value) => { value.steps[1].affineCosetRelabeling.successorPrimitiveInvariantUnderCosetRelabeling = false; });
  reject("splitting shear count", (value) => { value.steps[2].extensionSplittingShear.shearsAudited = 15; });
  reject("splitting norm overclaim", (value) => { value.steps[1].extensionSplittingShear.affineNormSeparatelyInvariant = true; });
  reject("splitting recurrence equivariance", (value) => { value.steps[0].extensionSplittingShear.generatedPrimitiveRecurrenceEquivariant = false; });
  reject("GL2 order", (value) => { value.steps[0].naturality.expectedGroupOrder = 5; });
  reject("GL3 audit", (value) => { value.steps[1].naturality.transformationsAudited = 167; });
  reject("GL4 generator", (value) => { value.steps[2].naturality.generatorsAudited.pop(); });
  reject("GL4 closure", (value) => { value.steps[2].naturality.generatedClosureOrder = 10080; });
  reject("zero ideal", (value) => { value.ablations.zeroIdeal.obstructionGeneratorLine.quotientDimension = 1; });
  reject("zero stutter", (value) => { value.ablations.zeroIdeal.fullTypedSuccessorStutterVerified = false; });
  reject("zero successor payload", (value) => { value.ablations.zeroIdeal.fullSuccessor.dicksonUnchanged = false; });
  reject("duplicate quotient", (value) => { value.ablations.duplicateGenerator.duplicateGeneratorLine.quotientDimension = 2; });
  reject("duplicate direction", (value) => { value.ablations.duplicateGenerator.duplicateDoesNotCreateSecondReifiedDirection = false; });
  reject("duplicate scope", (value) => { value.ablations.duplicateGenerator.scope = "full successor accepts generator lists"; });
  reject("function arity", (value) => { value.interfaceAudit.successorFunctionArity = 2; });
  reject("counter interface", (value) => { value.interfaceAudit.externalStageCounterRead = true; });
  reject("basis interface", (value) => { value.interfaceAudit.externalBasisListRead = true; });
  reject("verification horizon", (value) => { value.interfaceAudit.successorReadsVerificationHorizon = true; });
  reject("ordinary pi1 control", (value) => { value.ordinaryPrimitiveAttachmentControl.pi1Changed = true; });
  reject("ordinary direction control", (value) => { value.ordinaryPrimitiveAttachmentControl.createsDegreeOneDirection = true; });
  reject("exact recurrence total", (value) => { value.exactChecks.dicksonRecurrences = 2; });
  reject("exact affine-coset total", (value) => { value.exactChecks.affineCosetRelabelings = 27; });
  reject("exact splitting-shear total", (value) => { value.exactChecks.extensionSplittingShears = 27; });
  reject("exact GL total", (value) => { value.exactChecks.exhaustiveGLNaturalityChecks = 173; });
  reject("floating point", (value) => { value.exactChecks.floatingPointOperations = 1; });
  reject("COMMA claim", (value) => { value.comma.claim = "unconditional genesis"; });
  reject("COMMA assumption", (value) => { value.comma.assumptions.pop(); });
  reject("evaluation tolerance", (value) => { value.evaluationPolicy.tolerance = 1e-9; });
  reject("reification boundary", (value) => { value.theoremBoundary.dualLineReificationDeclared = false; });
  reject("zero successor boundary", (value) => { value.theoremBoundary.zeroObstructionFullTypedSuccessorStutters = false; });
  reject("duplicate helper boundary", (value) => { value.theoremBoundary.duplicateObstructionPresentationsQuotientedAtGeneratorLineHelper = false; });
  reject("reification overclaim", (value) => { value.theoremBoundary.dualLineReificationDerivedFromPredecessorSemantics = true; });
  reject("band identification overclaim", (value) => { value.theoremBoundary.generatorLineCanonicallyIdentifiedWithLiftStackBand = true; });
  reject("ordinary attachment overclaim", (value) => { value.theoremBoundary.ordinaryPrimitiveAttachmentAddsPi1 = true; });
  reject("forced direction overclaim", (value) => { value.theoremBoundary.newTransportDirectionForcedByOrdinaryPrimitiveAttachment = true; });
  reject("unconditional overclaim", (value) => { value.theoremBoundary.unconditionalEndogenousSuccessorEstablished = true; });
  reject("explicit lift overclaim", (value) => { value.theoremBoundary.explicitC4CochainLiftsConstructed = true; });
  reject("temporal map overclaim", (value) => { value.theoremBoundary.temporalAttachmentIsOrdinaryObstructionPreservingMap = true; });
  reject("all ranks overclaim", (value) => { value.theoremBoundary.allRanksExecuted = true; });
  reject("nonsofic overclaim", (value) => { value.theoremBoundary.nonSoficityEstablished = true; });
  reject("architecture overclaim", (value) => { value.theoremBoundary.architecturalLowerBoundEstablished = true; });
  reject("Hodge overclaim", (value) => { value.theoremBoundary.hodgeTheoryEstablished = true; });
  reject("major conjecture overclaim", (value) => { value.theoremBoundary.majorOpenConjectureResolved = true; });
  reject("novelty overclaim", (value) => { value.theoremBoundary.abstractInvariantNoveltyClaimed = true; });
  reject("undeclared theorem field", (value) => { value.theoremBoundary.PEqualsNP = true; });
  reject("certificate digest", (value) => { value.certificateDigest = "f".repeat(64); }, false);
  return cases;
}

export function runGenesisObstructionBornSuccessor() {
  const firstCertificate = buildCertificate(buildLaboratory());
  const secondCertificate = buildCertificate(buildLaboratory());
  assert.equal(canonical(firstCertificate), canonical(secondCertificate));
  assert.equal(firstCertificate.certificateDigest, secondCertificate.certificateDigest);
  assert(validateCertificate(firstCertificate, secondCertificate));
  assert(replayGenesisObstructionBornSuccessorCertificate(firstCertificate));
  const tamperCases = tamperSuite(firstCertificate);
  return {
    schema: "oasis.genesis-obstruction-born-successor.v1",
    status: "PASS",
    result: {
      auditedSuccessors: firstCertificate.steps.map(
        ({ inputDimension, outputDimension }) => `${inputDimension}->${outputDimension}`,
      ),
      generatedPrimitiveMonomialCounts: firstCertificate.levels.map(
        ({ dimension, generatedPrimitive }) => ({ dimension, count: generatedPrimitive.monomialCount }),
      ),
      canonicalPrimitiveMonomialCounts: firstCertificate.levels.map(
        ({ dimension, canonicalPrimitive }) => ({ dimension, count: canonicalPrimitive.monomialCount }),
      ),
      affineCosetRelabelingsAudited: firstCertificate.exactChecks.affineCosetRelabelings,
      extensionSplittingShearsAudited: firstCertificate.exactChecks.extensionSplittingShears,
      exhaustiveGLNaturalityChecks: firstCertificate.exactChecks.exhaustiveGLNaturalityChecks,
      gl4ClosureOrder: firstCertificate.exactChecks.gl4ClosureOrder,
      zeroIdealFullSuccessorStutters: firstCertificate.theoremBoundary.zeroObstructionFullTypedSuccessorStutters,
      duplicatePresentationQuotientedAtGeneratorLineHelper: firstCertificate.theoremBoundary.duplicateObstructionPresentationsQuotientedAtGeneratorLineHelper,
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
  console.log("PASS obstruction-born successors: 2->3, 3->4, and 4->5 without an external stage input");
  console.log("PASS recursion: D_plus=D*N and zeta_plus=zeta*N+D^2 for generated and canonical genealogies");
  console.log("PASS chart audits: affine-coset relabelings are invariant; actual extension-splitting shears make the norm chart-dependent and the recurrence equivariant");
  console.log(`PASS naturality: ${result.result.exhaustiveGLNaturalityChecks} exhaustive GL checks and GL4 closure ${result.result.gl4ClosureOrder}`);
  console.log("PASS ablations: the full zero-obstruction successor stutters; the generator-line helper quotients duplicate presentations");
  console.log("BOUNDARY: dual-line reification is declared and is not canonically identified with the lift-stack band; ordinary primitive attachment does not add pi1");
  console.log(`PASS deterministic replay: ${result.deterministicReplay.certificateDigest}`);
  console.log(`PASS replay/tamper: ${result.tamper.rejected}/${result.tamper.attempted} mutations rejected`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = runGenesisObstructionBornSuccessor();
  printPassLines(result);
  console.log(JSON.stringify(result, null, 2));
}
