import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { makeGammaGenerators } from "../src/proof-configuration.mjs";
import {
  evaluateGammaMatrixWord,
  GammaMatrix3,
  gammaMatrixGeneratorsFromUnits,
} from "../src/gamma-matrix3.mjs";
import {
  actionOnSet,
  buildContext,
  buildTransformations,
  radiusTwoBall,
  setOrbits,
  transformationId,
} from "./analyze-sos-symmetry.mjs";

function cloneWord(word) {
  return word.map((token) => ({ generator: token.generator, inverse: Boolean(token.inverse) }));
}

function addCoefficient(map, hash, coefficient) {
  const next = (map.get(hash) ?? 0) + coefficient;
  if (next === 0) map.delete(hash);
  else map.set(hash, next);
}

function addSupport(supportByHash, matrix, representativeWord) {
  const matrixHash = matrix.hash();
  const existing = supportByHash.get(matrixHash);
  if (existing) return existing.provisionalIndex;
  const item = {
    provisionalIndex: supportByHash.size,
    matrixHash,
    representativeWord: cloneWord(representativeWord),
    matrix,
  };
  supportByHash.set(matrixHash, item);
  return item.provisionalIndex;
}

function matrixActionOnSet(items, transformations, context, names, matrixGenerators) {
  const sorted = [...items].sort((left, right) => left.matrixHash.localeCompare(right.matrixHash));
  const indexByHash = new Map(sorted.map((item, index) => [item.matrixHash, index]));
  // The corrected dagger symmetry is phi(g)=T(g)^-1=T(g^-1).  The support is
  // inverse-closed, so compute each inverse index once and then retain the fast
  // exact entrywise matrix transform for every group action.
  const inverseIndex = sorted.map((item) => {
    const inverseWord = context.oracle.inverseWord(item.representativeWord);
    const inverseHash = evaluateGammaMatrixWord(
      inverseWord, names, matrixGenerators,
    ).hash();
    const index = indexByHash.get(inverseHash);
    if (index === undefined) throw new Error("Exact symmetry support is not inverse-closed");
    return index;
  });
  const actions = transformations.map((transformation) => {
    const permutation = sorted.map((item, itemIndex) => {
      const source = transformation.dagger ? sorted[inverseIndex[itemIndex]] : item;
      const transformedHash = source.matrix.transform(transformation).hash();
      const index = indexByHash.get(transformedHash);
      if (index === undefined) {
        throw new Error(`Matrix transformation ${transformationId(transformation)} left the set`);
      }
      return index;
    });
    if (new Set(permutation).size !== sorted.length) {
      throw new Error("Matrix symmetry action is not bijective");
    }
    return permutation;
  });
  return { sorted, indexByHash, actions };
}

function targetCoefficientMaps(identityMatrix, generators) {
  const delta = new Map([[identityMatrix.hash(), generators.length]]);
  for (const generator of generators) addCoefficient(delta, generator.hash(), -1);
  const terms = [
    { matrix: identityMatrix, coefficient: generators.length },
    ...generators.map((matrix) => ({ matrix, coefficient: -1 })),
  ];
  const deltaSquared = new Map();
  for (const left of terms) {
    for (const right of terms) {
      addCoefficient(
        deltaSquared,
        left.matrix.multiply(right.matrix).hash(),
        left.coefficient * right.coefficient,
      );
    }
  }
  return { delta, deltaSquared };
}

export function buildRadiusTwoQuotientProblem() {
  const context = buildContext();
  const transformations = buildTransformations();
  const units = makeGammaGenerators();
  const names = units.map((_, index) => `sos:gamma:${index}`);
  const matrixGenerators = gammaMatrixGeneratorsFromUnits(units);
  const identityMatrix = GammaMatrix3.identity();

  const embeddedBall = radiusTwoBall(context);
  const embeddedIdentityHash = context.oracle.evaluate([]).hash;
  const embeddedBasisRepresentatives = new Map(
    [...embeddedBall.entries()].filter(([hash]) => hash !== embeddedIdentityHash),
  );
  const embeddedBasisAction = actionOnSet(
    embeddedBasisRepresentatives,
    transformations,
    context,
  );
  const basis = embeddedBasisAction.hashes.map((embeddedHash, index) => {
    const representativeWord = embeddedBasisRepresentatives.get(embeddedHash);
    const matrix = evaluateGammaMatrixWord(representativeWord, names, matrixGenerators);
    return {
      index,
      embeddedHash,
      matrixHash: matrix.hash(),
      representativeWord: cloneWord(representativeWord),
      matrix,
    };
  });
  if (basis.length !== 678 || new Set(basis.map((item) => item.matrixHash)).size !== 678) {
    throw new Error("Matrix and embedded radius-two equality classes disagree");
  }

  const basisMatrixAction = matrixActionOnSet(
    basis, transformations, context, names, matrixGenerators,
  );
  const sortedBasisIndexByMatrixHash = basisMatrixAction.indexByHash;
  const oldToSortedBasis = basis.map((item) => sortedBasisIndexByMatrixHash.get(item.matrixHash));
  for (let transformationIndex = 0; transformationIndex < transformations.length; transformationIndex += 1) {
    for (let oldIndex = 0; oldIndex < basis.length; oldIndex += 1) {
      const embeddedTargetOld = embeddedBasisAction.actions[transformationIndex][oldIndex];
      const expectedSorted = oldToSortedBasis[embeddedTargetOld];
      const sourceSorted = oldToSortedBasis[oldIndex];
      if (basisMatrixAction.actions[transformationIndex][sourceSorted] !== expectedSorted) {
        throw new Error("Embedded and matrix symmetry actions disagree");
      }
    }
  }
  const sortedBasis = basisMatrixAction.sorted;

  const supportByHash = new Map();
  addSupport(supportByHash, identityMatrix, []);
  const basisProvisional = [];
  const inverseProvisional = [];
  const inverseWords = [];
  const inverseMatrices = [];
  for (const item of sortedBasis) {
    basisProvisional.push(addSupport(supportByHash, item.matrix, item.representativeWord));
    const inverseWord = context.oracle.inverseWord(item.representativeWord);
    const inverseMatrix = evaluateGammaMatrixWord(inverseWord, names, matrixGenerators);
    inverseWords.push(inverseWord);
    inverseMatrices.push(inverseMatrix);
    inverseProvisional.push(addSupport(supportByHash, inverseMatrix, inverseWord));
  }

  const productProvisional = new Array(sortedBasis.length * sortedBasis.length);
  for (let left = 0; left < sortedBasis.length; left += 1) {
    for (let right = 0; right < sortedBasis.length; right += 1) {
      const productMatrix = inverseMatrices[left].multiply(sortedBasis[right].matrix);
      productProvisional[left * sortedBasis.length + right] = addSupport(
        supportByHash,
        productMatrix,
        [...inverseWords[left], ...sortedBasis[right].representativeWord],
      );
    }
    if ((left + 1) % 50 === 0 || left + 1 === sortedBasis.length) {
      console.log(JSON.stringify({
        phase: "radius4-matrix-support",
        completedRows: left + 1,
        totalRows: sortedBasis.length,
        uniqueSupportHashes: supportByHash.size,
      }));
    }
  }

  const supportAction = matrixActionOnSet(
    [...supportByHash.values()], transformations, context, names, matrixGenerators,
  );
  const supportOrbits = setOrbits(supportAction.actions, supportAction.sorted.length);
  const supportOrbitByIndex = Array(supportAction.sorted.length);
  supportOrbits.forEach((orbit, orbitIndex) => {
    for (const index of orbit) supportOrbitByIndex[index] = orbitIndex;
  });
  const provisionalToSorted = Array(supportByHash.size);
  for (const item of supportByHash.values()) {
    provisionalToSorted[item.provisionalIndex] = supportAction.indexByHash.get(item.matrixHash);
  }

  const { delta, deltaSquared } = targetCoefficientMaps(identityMatrix, matrixGenerators);
  const targetTerms = (terms) => [...terms.entries()].map(([matrixHash, coefficient]) => {
    const supportIndex = supportAction.indexByHash.get(matrixHash);
    if (supportIndex === undefined) throw new Error("Radius-two support does not cover the target");
    return { supportIndex, coefficient };
  });
  const output = {
    schema: "oasis.radius2-symmetry-quotient.v1",
    claimBoundary: "exact-matrix-coefficient-support-and-symmetry-action-not-solved-sdp",
    representationValidation: {
      embeddedRadiusTwoClassCount: embeddedBasisRepresentatives.size + 1,
      matrixRadiusTwoClassCount: new Set([
        identityMatrix.hash(),
        ...basis.map((item) => item.matrixHash),
      ]).size,
      equalityClassBijection: true,
      symmetryActionsAgree: true,
    },
    group: "Gamma = EL_3(L_F2(1,2))",
    generatorCount: matrixGenerators.length,
    basisKind: "all-nonidentity-elements-in-exact-radius2-ball-as-g-minus-identity",
    basisSize: sortedBasis.length,
    symmetryOrder: transformations.length,
    transformations: transformations.map((item, index) => ({
      id: transformationId(item),
      indexPermutation: item.indexPermutation,
      bitFlip: item.bitFlip,
      dagger: item.dagger,
      basisPermutation: basisMatrixAction.actions[index],
      supportPermutation: supportAction.actions[index],
    })),
    basis: sortedBasis.map((item, index) => ({
      index,
      matrixHash: item.matrixHash,
      embeddedHash: item.embeddedHash,
      representativeWord: item.representativeWord,
    })),
    support: supportAction.sorted.map((item, index) => ({
      index,
      matrixHash: item.matrixHash,
      representativeWord: item.representativeWord,
      orbit: supportOrbitByIndex[index],
    })),
    supportOrbitCount: supportOrbits.length,
    supportOrbits,
    identitySupportIndex: supportAction.indexByHash.get(identityMatrix.hash()),
    basisSupportIndex: basisProvisional.map((index) => provisionalToSorted[index]),
    inverseSupportIndex: inverseProvisional.map((index) => provisionalToSorted[index]),
    productSupportIndex: productProvisional.map((index) => provisionalToSorted[index]),
    delta: targetTerms(delta),
    deltaSquared: targetTerms(deltaSquared),
  };

  for (const terms of [output.delta, output.deltaSquared]) {
    const coefficientByIndex = new Map(terms.map((item) => [item.supportIndex, item.coefficient]));
    for (const orbit of supportOrbits) {
      const values = new Set(orbit.map((index) => coefficientByIndex.get(index) ?? 0));
      if (values.size !== 1) throw new Error("Target coefficient is not symmetry-invariant");
    }
  }
  return output;
}

export function writeRadiusTwoQuotientProblem(outputPath) {
  const problem = buildRadiusTwoQuotientProblem();
  writeFileSync(outputPath, `${JSON.stringify(problem)}\n`);
  console.log(JSON.stringify({
    outputPath,
    basisSize: problem.basisSize,
    supportSize: problem.support.length,
    supportOrbitCount: problem.supportOrbitCount,
    productEntryCount: problem.productSupportIndex.length,
    representationValidation: problem.representationValidation,
  }, null, 2));
  return problem;
}

if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const outputPath = process.argv[2];
  if (!outputPath) throw new Error("Usage: node export-radius2-quotient.mjs OUTPUT.json");
  writeRadiusTwoQuotientProblem(outputPath);
}
