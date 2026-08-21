import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  ExactNonSoficGroupOracle,
  NONSOFIC_THEOREM_METADATA,
} from "../src/group-oracle.mjs";
import { cylinderSwap } from "../src/unit-group.mjs";
import { compileExpansionLefCertificate } from "../src/obstruction-certificate.mjs";
import { FiniteEmulatorCritic } from "../src/emulator-critic.mjs";

const SCHEMA = "genesis.marked-fox-hodge-bridge.v3";
const GENERATORS = Object.freeze(["a", "b"]);
const TOKENS = Object.freeze([
  Object.freeze({ generator: "a", inverse: false }),
  Object.freeze({ generator: "a", inverse: true }),
  Object.freeze({ generator: "b", inverse: false }),
  Object.freeze({ generator: "b", inverse: true }),
]);

const PRIVATE_MODEL = deepFreeze({
  chainConvention: "column complex C2->C1->C0 with d1=[P_s^T-I] and d2=col(D_s(w)^T); word matrices multiply from left to right",
  boundaryConvention: "d1 d2=(sum_s D_s(w)(P_s-I))^T=(P_w-I)^T",
  fullDegreeOneHodgeConvention: "Delta_1=D_1^T D_1+D_2 D_2^T for the presentation chain complex",
  unmarkedObserver: "the undirected degree-zero Laplacians 2I-P_s-P_s^T and their sum",
  markedObserver: "relator Fox-chain energies together with named word-transport energies",
});

function range(length) {
  return Array.from({ length }, (_, index) => index);
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.freeze(value);
  for (const key of Object.keys(value)) deepFreeze(value[key], seen);
  return value;
}

function isDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return true;
  seen.add(value);
  if (!Object.isFrozen(value)) return false;
  return Object.keys(value).every((key) => isDeepFrozen(value[key], seen));
}

function identityPermutation(size) {
  return range(size);
}

function invertPermutation(permutation) {
  const inverse = Array(permutation.length);
  permutation.forEach((target, source) => {
    inverse[target] = source;
  });
  return inverse;
}

function composePermutations(left, right) {
  return right.map((target) => left[target]);
}

function enumeratePermutations(size) {
  const current = identityPermutation(size);
  const result = [];
  function visit(index) {
    if (index === size) {
      result.push([...current]);
      return;
    }
    for (let swap = index; swap < size; swap += 1) {
      [current[index], current[swap]] = [current[swap], current[index]];
      visit(index + 1);
      [current[index], current[swap]] = [current[swap], current[index]];
    }
  }
  visit(0);
  return result;
}

function permutationMatrix(permutation) {
  const size = permutation.length;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  permutation.forEach((target, source) => {
    matrix[target][source] = 1;
  });
  return matrix;
}

function zeroMatrix(rows, columns = rows) {
  return Array.from({ length: rows }, () => Array(columns).fill(0));
}

function identityMatrix(size) {
  const matrix = zeroMatrix(size);
  for (let index = 0; index < size; index += 1) matrix[index][index] = 1;
  return matrix;
}

function matrixAdd(left, right) {
  return left.map((row, i) => row.map((value, j) => value + right[i][j]));
}

function matrixSubtract(left, right) {
  return left.map((row, i) => row.map((value, j) => value - right[i][j]));
}

function matrixScale(scalar, matrix) {
  return matrix.map((row) => row.map((value) => scalar * value));
}

function matrixMultiply(left, right) {
  const rows = left.length;
  const middle = right.length;
  const columns = right[0].length;
  const result = zeroMatrix(rows, columns);
  for (let i = 0; i < rows; i += 1) {
    for (let k = 0; k < middle; k += 1) {
      if (left[i][k] === 0) continue;
      for (let j = 0; j < columns; j += 1) {
        result[i][j] += left[i][k] * right[k][j];
      }
    }
  }
  return result;
}

function matrixTranspose(matrix) {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

function horizontalBlockMatrix(blocks) {
  assert(blocks.length > 0);
  const rows = blocks[0].length;
  const columns = blocks[0][0].length;
  for (const block of blocks) {
    assert.equal(block.length, rows);
    assert(block.every((row) => row.length === columns));
  }
  return range(rows).map((row) => blocks.flatMap((block) => [...block[row]]));
}

function verticalBlockMatrix(blocks) {
  assert(blocks.length > 0);
  const columns = blocks[0][0].length;
  for (const block of blocks) {
    assert(block.every((row) => row.length === columns));
  }
  return blocks.flatMap((block) => block.map((row) => [...row]));
}

function conjugateMatrix(matrix, gaugeMatrix) {
  return matrixMultiply(
    matrixMultiply(gaugeMatrix, matrix),
    matrixTranspose(gaugeMatrix),
  );
}

function matrixTrace(matrix) {
  return matrix.reduce((sum, row, index) => sum + row[index], 0);
}

function frobeniusSquared(matrix) {
  return matrix.reduce(
    (sum, row) => sum + row.reduce((inner, value) => inner + value * value, 0),
    0,
  );
}

function matrixMoments(matrix) {
  const moments = [];
  let power = matrix;
  for (let exponent = 1; exponent <= matrix.length; exponent += 1) {
    moments.push(matrixTrace(power));
    power = matrixMultiply(power, matrix);
  }
  return moments;
}

function matrixKey(matrix) {
  return matrix.map((row) => row.join(",")).join("/");
}

function tokenMatrix(token, generatorMatrices) {
  const matrix = generatorMatrices[token.generator];
  return token.inverse ? matrixTranspose(matrix) : matrix;
}

function evaluateWord(word, generatorMatrices) {
  const size = generatorMatrices[GENERATORS[0]].length;
  return word.reduce(
    (product, token) => matrixMultiply(product, tokenMatrix(token, generatorMatrices)),
    identityMatrix(size),
  );
}

function wordEncoding(word) {
  return word.length === 0
    ? "1"
    : word.map((token) => token.generator + (token.inverse ? "^-1" : "")).join(" ");
}

function addExactGroupRingTerm(groupOracle, ring, word, coefficient) {
  assert(Number.isSafeInteger(coefficient));
  if (coefficient === 0) return;
  const evaluated = groupOracle.evaluate(word);
  const existing = ring.get(evaluated.hash);
  const nextCoefficient = (existing?.coefficient ?? 0) + coefficient;
  if (nextCoefficient === 0) {
    ring.delete(evaluated.hash);
    return;
  }
  ring.set(evaluated.hash, {
    exactHash: evaluated.hash,
    coefficient: nextCoefficient,
    representativeWord: existing
      ? existing.representativeWord.map((token) => ({ ...token }))
      : evaluated.tokens.map((token) => ({ ...token })),
  });
}

function addExactGroupRingInto(groupOracle, target, source, scalar = 1) {
  assert(Number.isSafeInteger(scalar));
  for (const entry of source.values()) {
    const evaluated = groupOracle.evaluate(entry.representativeWord);
    assert.equal(evaluated.hash, entry.exactHash);
    addExactGroupRingTerm(
      groupOracle,
      target,
      entry.representativeWord,
      scalar * entry.coefficient,
    );
  }
  return target;
}

function multiplyExactGroupRings(groupOracle, left, right) {
  const product = new Map();
  for (const leftEntry of left.values()) {
    for (const rightEntry of right.values()) {
      addExactGroupRingTerm(
        groupOracle,
        product,
        [...leftEntry.representativeWord, ...rightEntry.representativeWord],
        leftEntry.coefficient * rightEntry.coefficient,
      );
    }
  }
  return product;
}

function exactGeneratorMinusIdentity(groupOracle, generator) {
  const result = new Map();
  addExactGroupRingTerm(groupOracle, result, [{ generator, inverse: false }], 1);
  addExactGroupRingTerm(groupOracle, result, [], -1);
  return result;
}

function exactFoxColumn(groupOracle, word, generatorNames) {
  const generatorSet = new Set(generatorNames);
  const derivatives = new Map(generatorNames.map((generator) => [generator, new Map()]));
  let prefix = [];
  for (const rawToken of word) {
    const token = { generator: rawToken.generator, inverse: Boolean(rawToken.inverse) };
    assert(generatorSet.has(token.generator));
    if (token.inverse) {
      prefix = [...prefix, token];
      addExactGroupRingTerm(groupOracle, derivatives.get(token.generator), prefix, -1);
    } else {
      addExactGroupRingTerm(groupOracle, derivatives.get(token.generator), prefix, 1);
      prefix = [...prefix, token];
    }
  }

  const leftSide = new Map();
  for (const generator of generatorNames) {
    addExactGroupRingInto(
      groupOracle,
      leftSide,
      multiplyExactGroupRings(
        groupOracle,
        derivatives.get(generator),
        exactGeneratorMinusIdentity(groupOracle, generator),
      ),
    );
  }
  const rightSide = new Map();
  addExactGroupRingTerm(groupOracle, rightSide, prefix, 1);
  addExactGroupRingTerm(groupOracle, rightSide, [], -1);
  const residual = new Map();
  addExactGroupRingInto(groupOracle, residual, leftSide);
  addExactGroupRingInto(groupOracle, residual, rightSide, -1);
  return {
    evaluatedWord: groupOracle.evaluate(prefix),
    derivatives,
    leftSide,
    rightSide,
    fundamentalResidual: residual,
  };
}

function foxColumn(word, generatorMatrices) {
  const size = generatorMatrices[GENERATORS[0]].length;
  const identity = identityMatrix(size);
  let prefix = identity;
  const derivatives = Object.fromEntries(GENERATORS.map((generator) => [generator, zeroMatrix(size)]));
  for (const token of word) {
    const generatorMatrix = generatorMatrices[token.generator];
    const coefficient = token.inverse
      ? matrixScale(-1, matrixMultiply(prefix, matrixTranspose(generatorMatrix)))
      : prefix;
    derivatives[token.generator] = matrixAdd(derivatives[token.generator], coefficient);
    prefix = matrixMultiply(prefix, tokenMatrix(token, generatorMatrices));
  }
  let chainResidual = zeroMatrix(size);
  for (const generator of GENERATORS) {
    chainResidual = matrixAdd(
      chainResidual,
      matrixMultiply(
        derivatives[generator],
        matrixSubtract(generatorMatrices[generator], identity),
      ),
    );
  }
  const d1 = horizontalBlockMatrix(GENERATORS.map((generator) => (
    matrixSubtract(matrixTranspose(generatorMatrices[generator]), identity)
  )));
  const d2 = verticalBlockMatrix(GENERATORS.map((generator) => (
    matrixTranspose(derivatives[generator])
  )));
  const typedChainComposite = matrixMultiply(d1, d2);
  assert.deepEqual(typedChainComposite, matrixTranspose(chainResidual));
  return {
    wordMatrix: prefix,
    derivatives,
    chainResidual,
    columnComplex: {
      d1,
      d2,
      composite: typedChainComposite,
    },
  };
}

function movedPoints(permutationMatrixValue) {
  let moved = 0;
  for (let source = 0; source < permutationMatrixValue.length; source += 1) {
    if (permutationMatrixValue[source][source] !== 1) moved += 1;
  }
  return moved;
}

function normalizedTransportEnergy(matrix) {
  const identity = identityMatrix(matrix.length);
  return frobeniusSquared(matrixSubtract(matrix, identity)) / (2 * matrix.length);
}

function undirectedGeneratorLaplacian(matrix) {
  const identity = identityMatrix(matrix.length);
  return matrixSubtract(
    matrixScale(2, identity),
    matrixAdd(matrix, matrixTranspose(matrix)),
  );
}

function aggregateLaplacian(generatorMatrices) {
  const size = generatorMatrices[GENERATORS[0]].length;
  return GENERATORS.reduce(
    (sum, generator) => matrixAdd(sum, undirectedGeneratorLaplacian(generatorMatrices[generator])),
    zeroMatrix(size),
  );
}

function enumerateWords(maxLength) {
  const words = [[]];
  let frontier = [[]];
  for (let length = 1; length <= maxLength; length += 1) {
    const next = [];
    for (const prefix of frontier) {
      for (const token of TOKENS) next.push([...prefix, token]);
    }
    words.push(...next);
    frontier = next;
  }
  return words;
}

function generatorMatricesFromPair(left, right) {
  return {
    a: permutationMatrix(left),
    b: permutationMatrix(right),
  };
}

function auditTypedColumnFoxConvention() {
  const cycle = [1, 2, 0];
  const transposition = [1, 0, 2];
  const matrices = generatorMatricesFromPair(cycle, transposition);
  const word = [TOKENS[0], TOKENS[2], TOKENS[1], TOKENS[2]];
  const fox = foxColumn(word, matrices);
  const identity = identityMatrix(3);
  const expectedTypedComposite = matrixTranspose(
    matrixSubtract(fox.wordMatrix, identity),
  );
  const ab = matrixMultiply(matrices.a, matrices.b);
  const ba = matrixMultiply(matrices.b, matrices.a);
  assert.notDeepEqual(matrices.a, matrixTranspose(matrices.a));
  assert.notDeepEqual(ab, ba);
  assert.notDeepEqual(fox.wordMatrix, matrixTranspose(fox.wordMatrix));
  assert.deepEqual(fox.columnComplex.composite, expectedTypedComposite);

  const incorrectlyUntransposedD1 = horizontalBlockMatrix(GENERATORS.map((generator) => (
    matrixSubtract(matrices[generator], identity)
  )));
  const incorrectlyUntransposedD2 = verticalBlockMatrix(GENERATORS.map((generator) => (
    fox.derivatives[generator]
  )));
  const incorrectlyUntransposedComposite = matrixMultiply(
    incorrectlyUntransposedD1,
    incorrectlyUntransposedD2,
  );
  assert.notDeepEqual(incorrectlyUntransposedComposite, expectedTypedComposite);

  return {
    word: wordEncoding(word),
    generatorAIsNonsymmetric: true,
    generatorsDoNotCommute: true,
    wordMatrixIsNonsymmetric: true,
    generatorA: matrices.a,
    generatorB: matrices.b,
    productAB: ab,
    productBA: ba,
    wordMatrix: fox.wordMatrix,
    d1Shape: [fox.columnComplex.d1.length, fox.columnComplex.d1[0].length],
    d2Shape: [fox.columnComplex.d2.length, fox.columnComplex.d2[0].length],
    typedComposite: fox.columnComplex.composite,
    expectedTransposeWordResidual: expectedTypedComposite,
    incorrectlyUntransposedComposite,
    incorrectConventionRejectedEntrywise: true,
    exact: true,
  };
}

function auditExhaustiveFoxIdentity() {
  const permutations = enumeratePermutations(3);
  const words = enumerateWords(4);
  const typedColumnConvention = auditTypedColumnFoxConvention();
  let identities = 0;
  let typedColumnIdentities = 0;
  let energyEqualities = 0;
  let inverseTokensVisited = 0;
  for (const left of permutations) {
    for (const right of permutations) {
      const matrices = generatorMatricesFromPair(left, right);
      for (const word of words) {
        const fox = foxColumn(word, matrices);
        const expected = matrixSubtract(fox.wordMatrix, identityMatrix(3));
        assert.deepEqual(fox.chainResidual, expected);
        assert.deepEqual(fox.columnComplex.composite, matrixTranspose(expected));
        identities += 1;
        typedColumnIdentities += 1;
        assert.equal(
          frobeniusSquared(fox.chainResidual) / 6,
          normalizedTransportEnergy(fox.wordMatrix),
        );
        assert.equal(normalizedTransportEnergy(fox.wordMatrix), movedPoints(fox.wordMatrix) / 3);
        energyEqualities += 1;
        inverseTokensVisited += word.filter((token) => token.inverse).length;
      }
    }
  }
  return {
    setSize: 3,
    orderedGeneratorPairs: permutations.length ** 2,
    maximumWordLength: 4,
    wordsPerPair: words.length,
    nonemptyWordsPerPair: words.length - 1,
    foxIdentitiesChecked: identities,
    typedColumnIdentitiesChecked: typedColumnIdentities,
    energyEqualitiesChecked: energyEqualities,
    inverseTokenOccurrencesVisited: inverseTokensVisited,
    typedColumnConvention,
    exact: true,
  };
}

function conjugatePermutation(permutation, gauge) {
  return composePermutations(
    composePermutations(gauge, permutation),
    invertPermutation(gauge),
  );
}

function auditCollision() {
  const cycle = [1, 2, 0];
  const cycleInverse = invertPermutation(cycle);
  const parallel = generatorMatricesFromPair(cycle, cycle);
  const inverse = generatorMatricesFromPair(cycle, cycleInverse);
  const relation = [TOKENS[0], TOKENS[2]];
  const parallelFox = foxColumn(relation, parallel);
  const inverseFox = foxColumn(relation, inverse);
  const parallelLaplacians = Object.fromEntries(
    GENERATORS.map((generator) => [generator, undirectedGeneratorLaplacian(parallel[generator])]),
  );
  const inverseLaplacians = Object.fromEntries(
    GENERATORS.map((generator) => [generator, undirectedGeneratorLaplacian(inverse[generator])]),
  );
  assert.deepEqual(parallelLaplacians, inverseLaplacians);
  const parallelAggregate = aggregateLaplacian(parallel);
  const inverseAggregate = aggregateLaplacian(inverse);
  assert.deepEqual(parallelAggregate, inverseAggregate);
  assert.equal(normalizedTransportEnergy(parallelFox.wordMatrix), 1);
  assert.equal(normalizedTransportEnergy(inverseFox.wordMatrix), 0);
  assert.equal(frobeniusSquared(parallelFox.chainResidual), 6);
  assert.equal(frobeniusSquared(inverseFox.chainResidual), 0);

  const gauges = enumeratePermutations(3);
  const baseModels = {
    parallel: {
      pair: [cycle, cycle],
      matrices: parallel,
      fox: parallelFox,
      laplacians: parallelLaplacians,
      aggregate: parallelAggregate,
    },
    inverse: {
      pair: [cycle, cycleInverse],
      matrices: inverse,
      fox: inverseFox,
      laplacians: inverseLaplacians,
      aggregate: inverseAggregate,
    },
  };
  let gaugeChecks = 0;
  const entrywiseCovarianceChecks = {
    generatorMatrices: 0,
    foxDerivatives: 0,
    foxResiduals: 0,
    wordMatrices: 0,
    typedChainComposites: 0,
    perGeneratorLaplacians: 0,
    aggregateLaplacians: 0,
    collisionPairs: 0,
  };
  for (const gauge of gauges) {
    const gaugeMatrix = permutationMatrix(gauge);
    const gaugedModels = {};
    for (const [name, base] of Object.entries(baseModels)) {
      const gauged = generatorMatricesFromPair(
        conjugatePermutation(base.pair[0], gauge),
        conjugatePermutation(base.pair[1], gauge),
      );
      const fox = foxColumn(relation, gauged);
      const laplacians = Object.fromEntries(
        GENERATORS.map((generator) => [generator, undirectedGeneratorLaplacian(gauged[generator])]),
      );
      const aggregate = aggregateLaplacian(gauged);
      for (const generator of GENERATORS) {
        assert.deepEqual(
          gauged[generator],
          conjugateMatrix(base.matrices[generator], gaugeMatrix),
        );
        entrywiseCovarianceChecks.generatorMatrices += 1;
        assert.deepEqual(
          fox.derivatives[generator],
          conjugateMatrix(base.fox.derivatives[generator], gaugeMatrix),
        );
        entrywiseCovarianceChecks.foxDerivatives += 1;
        assert.deepEqual(
          laplacians[generator],
          conjugateMatrix(base.laplacians[generator], gaugeMatrix),
        );
        entrywiseCovarianceChecks.perGeneratorLaplacians += 1;
      }
      assert.deepEqual(
        fox.chainResidual,
        conjugateMatrix(base.fox.chainResidual, gaugeMatrix),
      );
      entrywiseCovarianceChecks.foxResiduals += 1;
      assert.deepEqual(
        fox.wordMatrix,
        conjugateMatrix(base.fox.wordMatrix, gaugeMatrix),
      );
      entrywiseCovarianceChecks.wordMatrices += 1;
      assert.deepEqual(
        fox.columnComplex.composite,
        conjugateMatrix(base.fox.columnComplex.composite, gaugeMatrix),
      );
      entrywiseCovarianceChecks.typedChainComposites += 1;
      assert.deepEqual(
        aggregate,
        conjugateMatrix(base.aggregate, gaugeMatrix),
      );
      entrywiseCovarianceChecks.aggregateLaplacians += 1;
      assert.equal(
        normalizedTransportEnergy(fox.wordMatrix),
        name === "parallel" ? 1 : 0,
      );
      gaugedModels[name] = { fox, laplacians, aggregate };
      gaugeChecks += 1;
    }
    assert.deepEqual(gaugedModels.parallel.laplacians, gaugedModels.inverse.laplacians);
    assert.deepEqual(gaugedModels.parallel.aggregate, gaugedModels.inverse.aggregate);
    assert.notDeepEqual(
      gaugedModels.parallel.fox.chainResidual,
      gaugedModels.inverse.fox.chainResidual,
    );
    assert.notDeepEqual(
      gaugedModels.parallel.fox.wordMatrix,
      gaugedModels.inverse.fox.wordMatrix,
    );
    entrywiseCovarianceChecks.collisionPairs += 1;
  }
  assert.deepEqual(entrywiseCovarianceChecks, {
    generatorMatrices: 24,
    foxDerivatives: 24,
    foxResiduals: 12,
    wordMatrices: 12,
    typedChainComposites: 12,
    perGeneratorLaplacians: 24,
    aggregateLaplacians: 12,
    collisionPairs: 6,
  });

  return {
    carrierSize: 3,
    cycle: [...cycle],
    cycleInverse: [...cycleInverse],
    models: {
      parallel: { a: [...cycle], b: [...cycle] },
      inverse: { a: [...cycle], b: [...cycleInverse] },
    },
    unmarkedHodgeCollision: {
      perGeneratorLaplaciansEqualEntrywise: true,
      aggregateLaplaciansEqualEntrywise: true,
      generatorLaplacian: parallelLaplacians.a,
      generatorTraceMoments: matrixMoments(parallelLaplacians.a),
      aggregateLaplacian: parallelAggregate,
      aggregateTraceMoments: matrixMoments(parallelAggregate),
      consequence: "All spectral functions of these identical undirected Laplacians agree.",
    },
    markedFace: {
      relation: wordEncoding(relation),
      parallel: {
        movedPoints: movedPoints(parallelFox.wordMatrix),
        normalizedWordEnergy: normalizedTransportEnergy(parallelFox.wordMatrix),
        foxResidualFrobeniusSquared: frobeniusSquared(parallelFox.chainResidual),
        typedChainComposite: parallelFox.columnComplex.composite,
        foxDerivativeA: parallelFox.derivatives.a,
        foxDerivativeB: parallelFox.derivatives.b,
      },
      inverse: {
        movedPoints: movedPoints(inverseFox.wordMatrix),
        normalizedWordEnergy: normalizedTransportEnergy(inverseFox.wordMatrix),
        foxResidualFrobeniusSquared: frobeniusSquared(inverseFox.chainResidual),
        typedChainComposite: inverseFox.columnComplex.composite,
        foxDerivativeA: inverseFox.derivatives.a,
        foxDerivativeB: inverseFox.derivatives.b,
      },
      exactSeparation: true,
    },
    simultaneousConjugationGaugeChecks: gaugeChecks,
    simultaneousConjugationGaugeAudit: {
      gauges: gauges.length,
      modelGaugeChecks: gaugeChecks,
      entrywiseCovarianceChecks,
      allPassed: true,
    },
    conclusion: "Undirected Hodge matrices forget generator orientation. The marked Fox face recovers the named word transport exactly.",
  };
}

function auditFiniteCriterion(collision) {
  const relationTolerance = 0;
  const separationThreshold = 1;
  const accepted = collision.markedFace.inverse.normalizedWordEnergy <= relationTolerance;
  const rejected = collision.markedFace.parallel.normalizedWordEnergy > relationTolerance;
  assert.equal(accepted, true);
  assert.equal(rejected, true);
  return {
    permutationModelDictionary: {
      relationDefect: "For d1=[P_s^T-I] and d2=col(D_s(r)^T), kappa_r=(1/(2|V|))*||d1 d2||_F^2=d_H(P_r,I)",
      namedWordSeparation: "eta_w=(1/(2|V|))*||P_w-I||_F^2=d_H(P_w,I)",
      implication: "On word-evaluated permutation models, marked Fox relation energies and named word energies are exactly the presentation-form sofic tests.",
    },
    controlPortfolio: {
      relators: ["a b"],
      requiredRelationTolerance: relationTolerance,
      namedNontrivialWords: ["a", "b"],
      requiredSeparationThreshold: separationThreshold,
      inverseModelPassesRelation: accepted,
      parallelModelFailsRelation: rejected,
    },
    essentialMarking: "Deleting word labels and orientations leaves identical Laplacians, so spectra alone cannot implement this criterion.",
    theoremBoundary: "The equality is exact for permutation word models. It does not prove that a weaker unmarked, spectral, finite-dimensional, or old-doctrine observer forces a sofic approximation.",
  };
}

function auditThompsonVFoxSupport() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const compiler = compileExpansionLefCertificate(groupOracle);
  const obstruction = compiler.finiteLefObstruction;
  const status = compiler.status();
  const generatorNames = [...obstruction.presentation.generators];
  const expectedDerivativeTermCounts = [
    [6, 0],
    [0, 3],
    [12, 4],
    [47, 22],
    [18, 9],
    [16, 9],
    [24, 11],
  ];

  assert.deepEqual(generatorNames, ["proof:j:u", "proof:j:v"]);
  assert.deepEqual(generatorNames, [...compiler.names.j]);
  assert.equal(
    compiler.relationDirectoryHash,
    "6c3f61e1a69257eded189039ed162366d765f63e849091ed5fe98b39c4490282",
  );
  assert.equal(obstruction.presentation.relators.length, 7);
  assert.equal(obstruction.finiteSetSize, 155);
  assert.equal(obstruction.finiteSet.length, obstruction.finiteSetSize);
  assert.equal(status.globallyEffective, false);
  assert.deepEqual(status.openObligations, [
    "effective-kun-locality-radius",
    "effective-expander-decomposition-bound",
    "universal-finite-word-threshold",
  ]);

  const chartByHash = new Map();
  obstruction.finiteSet.forEach((item, chartIndex) => {
    const evaluated = groupOracle.evaluate(item.representativeWord);
    assert.equal(evaluated.hash, item.exactHash);
    assert(!chartByHash.has(item.exactHash));
    chartByHash.set(item.exactHash, {
      chartIndex,
      representativeWord: item.representativeWord.map((token) => ({ ...token })),
    });
  });

  const firstSupportOccurrence = new Map();
  const relatorAudits = obstruction.presentation.relators.map((relator) => {
    const evaluatedRelator = groupOracle.evaluate(relator.operatorWord);
    assert.equal(evaluatedRelator.isIdentity, true);
    const fox = exactFoxColumn(groupOracle, relator.operatorWord, generatorNames);
    assert.equal(fox.evaluatedWord.hash, evaluatedRelator.hash);
    assert.equal(fox.fundamentalResidual.size, 0);
    assert.equal(fox.leftSide.size, 0);
    assert.equal(fox.rightSide.size, 0);
    const derivativeTermCounts = generatorNames.map((generator) => fox.derivatives.get(generator).size);
    for (const generator of generatorNames) {
      for (const entry of fox.derivatives.get(generator).values()) {
        const evaluatedSupport = groupOracle.evaluate(entry.representativeWord);
        assert.equal(evaluatedSupport.hash, entry.exactHash);
        if (!firstSupportOccurrence.has(entry.exactHash)) {
          firstSupportOccurrence.set(entry.exactHash, {
            relatorId: relator.id,
            generator,
            coefficient: entry.coefficient,
            foxRepresentativeWord: entry.representativeWord.map((token) => ({ ...token })),
          });
        }
      }
    }
    return {
      relatorId: relator.id,
      relatorLength: relator.operatorWord.length,
      exactRelatorHash: evaluatedRelator.hash,
      derivativeTermCounts,
      evaluatedGroupRingLeftTerms: fox.leftSide.size,
      evaluatedGroupRingRightTerms: fox.rightSide.size,
      fundamentalResidualTerms: fox.fundamentalResidual.size,
      fundamentalIdentityExact: true,
    };
  });
  assert.deepEqual(
    relatorAudits.map((item) => item.derivativeTermCounts),
    expectedDerivativeTermCounts,
  );

  const supportHashes = [...firstSupportOccurrence.keys()].sort(compareStrings);
  const missingSupportHashes = supportHashes.filter((exactHash) => !chartByHash.has(exactHash));
  assert.equal(supportHashes.length, 136);
  assert.deepEqual(missingSupportHashes, []);
  const supportMemberships = supportHashes.map((exactHash) => {
    const chart = chartByHash.get(exactHash);
    const occurrence = firstSupportOccurrence.get(exactHash);
    assert(chart);
    assert(occurrence);
    assert.equal(groupOracle.evaluate(chart.representativeWord).hash, exactHash);
    assert.equal(groupOracle.evaluate(occurrence.foxRepresentativeWord).hash, exactHash);
    return {
      exactHash,
      chartIndex: chart.chartIndex,
      chartRepresentativeWord: chart.representativeWord.map((token) => ({ ...token })),
      firstFoxOccurrence: {
        relatorId: occurrence.relatorId,
        generator: occurrence.generator,
        coefficient: occurrence.coefficient,
        representativeWord: occurrence.foxRepresentativeWord.map((token) => ({ ...token })),
      },
    };
  });
  const exactFundamentalIdentities = relatorAudits.filter(
    (item) => item.fundamentalIdentityExact,
  ).length;
  assert.equal(exactFundamentalIdentities, 7);

  return {
    sourceCertificate: {
      certificateId: status.certificateId,
      relationDirectoryHash: compiler.relationDirectoryHash,
      finiteLefObstructionId: obstruction.id,
      finiteLefObstructionStatus: obstruction.status,
      presentationSource: obstruction.presentation.source,
      exactGeneratorNames: [...generatorNames],
      exactGeneratorHashes: generatorNames.map((generator) => (
        groupOracle.evaluate([{ generator, inverse: false }]).hash
      )),
      sameConcreteInstanceBound: true,
    },
    relatorCount: obstruction.presentation.relators.length,
    relatorPrefixChartElementCount: obstruction.finiteSetSize,
    distinctExactFoxSupportElementCount: supportHashes.length,
    missingSupportElementCount: missingSupportHashes.length,
    missingSupportHashes,
    exactFundamentalIdentities,
    relatorAudits,
    supportMemberships,
    chartDigest: digest(obstruction.finiteSet.map((item) => ({
      exactHash: item.exactHash,
      representativeWord: item.representativeWord.map((token) => ({ ...token })),
    }))),
    supportDigest: digest(supportHashes),
    exactClaim: "Every nonzero evaluated integer Fox-derivative support element of all seven relators is one of the exact 155 relator-prefix chart elements, and all seven evaluated Fox fundamental identities hold in Z[V].",
    compilerBoundary: {
      globallyEffective: status.globallyEffective,
      openUniversalObligations: [...status.openObligations],
      statement: "This is an exact finite Thompson-V presentation/LEF support audit. It neither closes the compiler's three universal effectiveness obligations nor by itself certifies the ambient group's nonsoficity.",
    },
  };
}

function summarizeLocalEmbeddingAudit(audit) {
  return clone({
    obstructionId: audit.obstructionId,
    finiteSetSize: audit.finiteSetSize,
    coveredElementCount: audit.coveredElementCount,
    fullyCovered: audit.fullyCovered,
    uncovered: audit.uncovered,
    collisions: audit.collisions,
    multiplicationDefects: audit.multiplicationDefects,
    locallyEmbedded: audit.locallyEmbedded,
  });
}

function auditC2FullHodgeSpectralImpostor() {
  const groupOracle = new ExactNonSoficGroupOracle(new Map());
  const generatorName = "c2:a";
  groupOracle.registerGenerator(generatorName, cylinderSwap("0", "1", "C2:a"));
  const identity = groupOracle.evaluate([]);
  const generator = groupOracle.evaluate([{ generator: generatorName, inverse: false }]);
  const square = groupOracle.evaluate([
    { generator: generatorName, inverse: false },
    { generator: generatorName, inverse: false },
  ]);
  assert.equal(generator.isIdentity, false);
  assert.equal(square.isIdentity, true);
  assert.equal(square.hash, identity.hash);

  const obstruction = {
    id: "c2-two-element-local-embedding-control-v1",
    finiteSet: [
      { exactHash: identity.hash, representativeWord: [] },
      {
        exactHash: generator.hash,
        representativeWord: [{ generator: generatorName, inverse: false }],
      },
    ],
  };

  function auditModel(label, generatorPermutation) {
    const critic = new FiniteEmulatorCritic(2);
    critic.assign(identity, identityPermutation(2), `${label}:identity`);
    critic.assign(generator, generatorPermutation, `${label}:a`);
    const localEmbedding = critic.auditLocalEmbedding(groupOracle, obstruction);
    const generatorMatrix = permutationMatrix(generatorPermutation);
    const identityValue = identityMatrix(2);
    const evaluatedFoxDerivative = matrixAdd(identityValue, generatorMatrix);
    const d1 = matrixSubtract(matrixTranspose(generatorMatrix), identityValue);
    const d2 = matrixTranspose(evaluatedFoxDerivative);
    const chainComposite = matrixMultiply(d1, d2);
    const fullDegreeOneHodgeLaplacian = matrixAdd(
      matrixMultiply(matrixTranspose(d1), d1),
      matrixMultiply(d2, matrixTranspose(d2)),
    );
    assert.deepEqual(chainComposite, zeroMatrix(2));
    assert.deepEqual(fullDegreeOneHodgeLaplacian, matrixScale(4, identityValue));
    return {
      label,
      generatorPermutation: [...generatorPermutation],
      generatorMatrix,
      evaluatedFoxDerivative,
      d1,
      d2,
      chainComposite,
      fullDegreeOneHodgeLaplacian,
      localEmbedding: summarizeLocalEmbeddingAudit(localEmbedding),
    };
  }

  const faithful = auditModel("faithful-regular-C2-action", [1, 0]);
  const trivial = auditModel("trivial-C2-action", [0, 1]);
  assert.deepEqual(
    faithful.fullDegreeOneHodgeLaplacian,
    trivial.fullDegreeOneHodgeLaplacian,
  );
  assert.equal(faithful.localEmbedding.locallyEmbedded, true);
  assert.equal(faithful.localEmbedding.collisions.length, 0);
  assert.equal(faithful.localEmbedding.multiplicationDefects.length, 0);
  assert.equal(trivial.localEmbedding.locallyEmbedded, false);
  assert.equal(trivial.localEmbedding.collisions.length, 1);
  assert.equal(trivial.localEmbedding.multiplicationDefects.length, 0);
  const trivialCollision = trivial.localEmbedding.collisions[0];
  assert.deepEqual(
    new Set([trivialCollision.leftExactHash, trivialCollision.rightExactHash]),
    new Set([identity.hash, generator.hash]),
  );

  const commonLaplacian = clone(faithful.fullDegreeOneHodgeLaplacian);
  return {
    exactControl: {
      group: "C2=<a | a^2=1> realized by an exact two-cylinder Leavitt unit",
      generatorName,
      identityExactHash: identity.hash,
      generatorExactHash: generator.hash,
      exactGeneratorNonidentity: true,
      exactOrderTwoRelation: true,
      finiteSetSize: obstruction.finiteSet.length,
    },
    chainConvention: {
      d1: "A^T-I",
      d2: "(I+A)^T, the transposed evaluated left-Fox derivative of a^2",
      chainIdentity: "d1 d2=(A^2-I)^T=0",
      degreeOneHodgeLaplacian: "Delta_1=D1^T D1+D2 D2^T",
    },
    faithful,
    trivial,
    spectralCollision: {
      fullDegreeOneLaplaciansEqualEntrywise: true,
      commonLaplacian,
      commonSpectrum: [4, 4],
      commonTraceMoments: matrixMoments(commonLaplacian),
      allSpectralFunctionsAgree: true,
    },
    exactSeparation: {
      faithfulLocallyEmbedded: faithful.localEmbedding.locallyEmbedded,
      trivialLocallyEmbedded: trivial.localEmbedding.locallyEmbedded,
      trivialExactElementCollisionCount: trivial.localEmbedding.collisions.length,
      multiplicationDefectsInEitherModel: (
        faithful.localEmbedding.multiplicationDefects.length +
        trivial.localEmbedding.multiplicationDefects.length
      ),
    },
    conclusion: "The full degree-one Hodge Laplacian 4I, not merely its spectrum, is identical for the faithful and trivial C2 actions, while exact local-embedding faithfulness distinguishes them.",
    theoremBoundary: "This finite C2 impostor proves insufficiency of the isolated full degree-one Laplacian. It does not prove insufficiency of marked chain maps, joint boundary data, arbitrary Hodge observers, or history-generated observers.",
  };
}

function canonical(value, seen = new WeakSet(), path = "$") {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non-json-number:" + path);
    return JSON.stringify(value);
  }
  if (typeof value !== "object") throw new Error("non-json-value:" + path);
  if (seen.has(value)) throw new Error("aliased-or-cyclic-value:" + path);
  seen.add(value);
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) throw new Error("non-plain-array:" + path);
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key === "symbol")) throw new Error("symbol-key:" + path);
    const permitted = new Set(["length", ...range(value.length).map(String)]);
    if (ownKeys.map(String).some((key) => !permitted.has(key))) throw new Error("unknown-array-key:" + path);
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !("value" in descriptor) || descriptor.enumerable !== true) {
        throw new Error("non-data-property:" + path + "[" + String(index) + "]");
      }
    }
    return "[" + value.map((item, index) => canonical(item, seen, path + "[" + index + "]")).join(",") + "]";
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error("non-plain-object:" + path);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key === "symbol")) throw new Error("symbol-key:" + path);
  const keys = ownKeys.map(String).sort(compareStrings);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor) || descriptor.enumerable !== true) {
      throw new Error("non-data-property:" + path + "." + key);
    }
  }
  return "{" + keys.map((key) => (
    JSON.stringify(key) + ":" + canonical(value[key], seen, path + "." + key)
  )).join(",") + "}";
}

function digest(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function buildPayload() {
  assert(isDeepFrozen(PRIVATE_MODEL));
  const model = clone(PRIVATE_MODEL);
  const exhaustive = auditExhaustiveFoxIdentity();
  const collision = auditCollision();
  const criterion = auditFiniteCriterion(collision);
  const thompsonVFoxSupport = auditThompsonVFoxSupport();
  const c2FullHodgeSpectralImpostor = auditC2FullHodgeSpectralImpostor();
  return {
    title: "Genesis marked Fox-Hodge bridge",
    status: "exact marked permutation-chain criterion, Thompson-V Fox-support binding, and full-Hodge spectral no-go controls",
    model,
    isolation: {
      privateModelRecursivelyFrozen: true,
      payloadModelDeepCloned: true,
      expectedPayloadNotExposed: true,
    },
    exactTarget: clone(NONSOFIC_THEOREM_METADATA),
    exhaustive,
    collision,
    criterion,
    thompsonVFoxSupport,
    c2FullHodgeSpectralImpostor,
    conjectureGate: {
      sharpenedTarget: "Compile the specific non-sofic proof into an effective, history-generated sequence of finite marked Fox relation and word-separation portfolios, without preloading the fatal portfolio or a stage counter.",
      requiredReduction: "Any admitted finite Hodge-and-future-role model must yield the marked permutation energies above, with costs and gauge data preserved.",
      decisiveFalsifiers: [
        "The generated observer retains only spectra or unmarked Laplacians.",
        "The fatal finite word portfolio is supplied externally or encoded in a stage counter.",
        "A bounded old-doctrine compiler recovers every generated marked portfolio at the same declared future-role cost.",
        "The reduction works only because generator permutation matrices were included verbatim in the observer definition.",
        "The witness generator changes under presentation, gauge, support thinning, or semantic stutter.",
      ],
    },
    claimLedger: {
      established: [
        "The evaluated left-Fox identity is typed as the column complex d1=[P_s^T-I], d2=col(D_s(w)^T), with d1 d2=(P_w-I)^T; a nonsymmetric noncommuting fixture rejects the untransposed counterfeit convention entrywise.",
        "Normalized Fox residual energy equals the Hamming relation defect for permutation word models.",
        "Normalized named word energy equals the Hamming nontrivial-word separation test.",
        "Identical undirected Hodge matrices can conceal different named multiplication paths.",
        "Across all six simultaneous S3 gauges and both collision models, generator matrices, Fox derivatives, residuals, word matrices, typed composites, per-generator Laplacians, aggregate Laplacians, and the paired collision all transform with exact entrywise covariance.",
        "For the exact seven-relator Thompson-V fixture, all 136 distinct evaluated Fox-support elements lie in the same 155-element exact relator-prefix chart, with all seven fundamental identities verified.",
        "The faithful and trivial two-point C2 actions have the identical full degree-one Hodge Laplacian 4I, while FiniteEmulatorCritic accepts only the faithful action as a local embedding of {1,a}.",
      ],
      classification: "standard Fox calculus, permutation Hamming geometry, and finite cellular-Laplacian mathematics assembled as a boundary theorem",
      explicitlyOpen: [
        "No effective universal (F,epsilon) obstruction compiler for the exact non-sofic group.",
        "The exact Thompson-V Fox-support containment is a finite presentation/LEF audit, not a closure of the compiler's universal effectiveness obligations or a standalone ambient nonsoficity certificate.",
        "The C2 collision is a no-go result for the isolated full degree-one Laplacian, not for marked chain maps, joint boundary data, arbitrary Hodge observers, or endogenous history-generated observers.",
        "No endogenous admission or composite old-closure separation theorem.",
        "No result for unmarked spectra, arbitrary finite-dimensional models, or non-permutation observers.",
        "No Level C, mathematical novelty, AI architecture theorem, Hodge Conjecture, Navier-Stokes, Collatz, or Riemann Hypothesis result.",
      ],
    },
  };
}

let expectedPayloadCache;
let expectedCanonicalCache;

function getExpectedPayload() {
  if (expectedPayloadCache === undefined) {
    const payload = buildPayload();
    expectedCanonicalCache = canonical(payload);
    expectedPayloadCache = deepFreeze(payload);
  }
  return expectedPayloadCache;
}

function semanticPayloadCheck(candidate) {
  try {
    const candidateCanonical = canonical(candidate);
    getExpectedPayload();
    const ok = candidateCanonical === expectedCanonicalCache;
    return { ok, reason: ok ? "verified" : "semantic-mismatch" };
  } catch (error) {
    return { ok: false, reason: String(error.message || error) };
  }
}

function runTamperAudit(payload) {
  const attacks = [
    ["fox-count", (value) => { value.exhaustive.foxIdentitiesChecked -= 1; }],
    ["typed-fox-count", (value) => { value.exhaustive.typedColumnIdentitiesChecked -= 1; }],
    ["typed-counterfeit", (value) => { value.exhaustive.typedColumnConvention.incorrectConventionRejectedEntrywise = false; }],
    ["energy-count", (value) => { value.exhaustive.energyEqualitiesChecked -= 1; }],
    ["laplacian-entry", (value) => { value.collision.unmarkedHodgeCollision.aggregateLaplacian[0][0] = 3; }],
    ["laplacian-equality", (value) => { value.collision.unmarkedHodgeCollision.aggregateLaplaciansEqualEntrywise = false; }],
    ["parallel-energy", (value) => { value.collision.markedFace.parallel.normalizedWordEnergy = 0; }],
    ["inverse-energy", (value) => { value.collision.markedFace.inverse.normalizedWordEnergy = 1; }],
    ["fox-residual", (value) => { value.collision.markedFace.parallel.foxResidualFrobeniusSquared = 0; }],
    ["typed-chain-entry", (value) => { value.collision.markedFace.parallel.typedChainComposite[0][0] = 0; }],
    ["gauge-count", (value) => { value.collision.simultaneousConjugationGaugeChecks = 0; }],
    ["gauge-entrywise-covariance", (value) => { value.collision.simultaneousConjugationGaugeAudit.entrywiseCovarianceChecks.foxDerivatives = 0; }],
    ["criterion", (value) => { value.criterion.controlPortfolio.parallelModelFailsRelation = false; }],
    ["erase-marking", (value) => { value.criterion.essentialMarking = "spectra suffice"; }],
    ["thompson-relator-count", (value) => { value.thompsonVFoxSupport.relatorCount = 6; }],
    ["thompson-chart-size", (value) => { value.thompsonVFoxSupport.relatorPrefixChartElementCount = 154; }],
    ["thompson-support-size", (value) => { value.thompsonVFoxSupport.distinctExactFoxSupportElementCount = 135; }],
    ["thompson-missing-support", (value) => { value.thompsonVFoxSupport.missingSupportHashes.push("forged-missing-hash"); }],
    ["thompson-fox-identity", (value) => { value.thompsonVFoxSupport.exactFundamentalIdentities = 6; }],
    ["thompson-instance-binding", (value) => { value.thompsonVFoxSupport.sourceCertificate.sameConcreteInstanceBound = false; }],
    ["thompson-forge-global", (value) => { value.thompsonVFoxSupport.compilerBoundary.globallyEffective = true; }],
    ["c2-common-laplacian", (value) => { value.c2FullHodgeSpectralImpostor.spectralCollision.commonLaplacian[0][0] = 3; }],
    ["c2-spectral-equality", (value) => { value.c2FullHodgeSpectralImpostor.spectralCollision.fullDegreeOneLaplaciansEqualEntrywise = false; }],
    ["c2-faithful-local-embedding", (value) => { value.c2FullHodgeSpectralImpostor.faithful.localEmbedding.locallyEmbedded = false; }],
    ["c2-trivial-collision", (value) => { value.c2FullHodgeSpectralImpostor.trivial.localEmbedding.collisions = []; }],
    ["c2-chain-map", (value) => { value.c2FullHodgeSpectralImpostor.trivial.d2[0][0] = 1; }],
    ["forge-effective-witness", (value) => { value.claimLedger.explicitlyOpen.shift(); }],
    ["forge-level-c", (value) => { value.claimLedger.classification = "Level C"; }],
    ["change-target", (value) => { value.exactTarget.result = "sofic"; }],
    ["change-model", (value) => { value.model.unmarkedObserver = "marked"; }],
  ];
  let rejected = 0;
  const outcomes = attacks.map(([name, mutate]) => {
    const candidate = clone(payload);
    mutate(candidate);
    const verification = semanticPayloadCheck(candidate);
    if (!verification.ok) rejected += 1;
    return { name, rejected: !verification.ok, reason: verification.reason };
  });
  assert.equal(rejected, attacks.length);
  return { tested: attacks.length, rejected, outcomes };
}

function makeCertificate() {
  const payload = clone(getExpectedPayload());
  const payloadDigest = digest(payload);
  const tamperAudit = runTamperAudit(payload);
  const body = { schema: SCHEMA, payload, payloadDigest, tamperAudit };
  return { ...body, certificateDigest: digest(body) };
}

export function replayGenesisMarkedFoxHodgeBridgeCertificate(certificate) {
  try {
    const suppliedCanonical = canonical(certificate);
    const snapshot = JSON.parse(suppliedCanonical);
    if (canonical(snapshot) !== suppliedCanonical) {
      return { ok: false, reason: "canonical-snapshot-roundtrip-mismatch" };
    }
    const allowed = ["schema", "payload", "payloadDigest", "tamperAudit", "certificateDigest"].sort();
    assert.deepEqual(Object.keys(snapshot).sort(), allowed);
    if (snapshot.schema !== SCHEMA) return { ok: false, reason: "schema-mismatch" };
    if (digest(snapshot.payload) !== snapshot.payloadDigest) return { ok: false, reason: "payload-digest-mismatch" };
    const semantic = semanticPayloadCheck(snapshot.payload);
    if (!semantic.ok) return semantic;
    const expectedTamper = runTamperAudit(clone(getExpectedPayload()));
    if (canonical(snapshot.tamperAudit) !== canonical(expectedTamper)) {
      return { ok: false, reason: "tamper-audit-mismatch" };
    }
    const body = {
      schema: snapshot.schema,
      payload: snapshot.payload,
      payloadDigest: snapshot.payloadDigest,
      tamperAudit: snapshot.tamperAudit,
    };
    if (digest(body) !== snapshot.certificateDigest) return { ok: false, reason: "certificate-digest-mismatch" };
    return { ok: true, reason: "verified" };
  } catch (error) {
    return { ok: false, reason: String(error.message || error) };
  }
}

function securityRegressions(certificate) {
  const nested = clone(certificate);
  nested.payload.collision.markedFace.parallel.normalizedWordEnergy = 0;
  nested.payloadDigest = digest(nested.payload);
  nested.certificateDigest = digest({ schema: nested.schema, payload: nested.payload, payloadDigest: nested.payloadDigest, tamperAudit: nested.tamperAudit });
  const nestedResult = replayGenesisMarkedFoxHodgeBridgeCertificate(nested);
  assert.equal(nestedResult.ok, false);

  const unknown = clone(certificate);
  unknown.payload.unknownClaim = true;
  unknown.payloadDigest = digest(unknown.payload);
  unknown.certificateDigest = digest({ schema: unknown.schema, payload: unknown.payload, payloadDigest: unknown.payloadDigest, tamperAudit: unknown.tamperAudit });
  const unknownResult = replayGenesisMarkedFoxHodgeBridgeCertificate(unknown);
  assert.equal(unknownResult.ok, false);

  const namedArray = clone(certificate);
  namedArray.payload.claimLedger.established.extra = true;
  const namedArrayResult = replayGenesisMarkedFoxHodgeBridgeCertificate(namedArray);
  assert.equal(namedArrayResult.ok, false);

  const inherited = Object.create(certificate);
  const inheritedResult = replayGenesisMarkedFoxHodgeBridgeCertificate(inherited);
  assert.equal(inheritedResult.ok, false);

  const getter = clone(certificate);
  const original = getter.payload.collision.models.parallel;
  Object.defineProperty(getter.payload.collision.models, "parallel", { enumerable: true, configurable: true, get() { return original; } });
  const getterResult = replayGenesisMarkedFoxHodgeBridgeCertificate(getter);
  assert.equal(getterResult.ok, false);

  const hiddenPayload = clone(certificate);
  Object.defineProperty(hiddenPayload.payload, "hiddenPoison", { value: true, enumerable: false });
  const hiddenPayloadResult = replayGenesisMarkedFoxHodgeBridgeCertificate(hiddenPayload);
  assert.equal(hiddenPayloadResult.ok, false);

  const hiddenTop = clone(certificate);
  Object.defineProperty(hiddenTop, "hiddenTop", { value: true, enumerable: false });
  const hiddenTopResult = replayGenesisMarkedFoxHodgeBridgeCertificate(hiddenTop);
  assert.equal(hiddenTopResult.ok, false);

  const symbolArray = clone(certificate);
  symbolArray.payload.claimLedger.established[Symbol("poison")] = true;
  const symbolArrayResult = replayGenesisMarkedFoxHodgeBridgeCertificate(symbolArray);
  assert.equal(symbolArrayResult.ok, false);

  const statefulFirstRead = clone(certificate);
  statefulFirstRead.payload.collision.markedFace.parallel.normalizedWordEnergy = 0;
  statefulFirstRead.payloadDigest = digest(statefulFirstRead.payload);
  statefulFirstRead.certificateDigest = digest({
    schema: statefulFirstRead.schema,
    payload: statefulFirstRead.payload,
    payloadDigest: statefulFirstRead.payloadDigest,
    tamperAudit: statefulFirstRead.tamperAudit,
  });
  const statefulTarget = clone(certificate);
  const statefulReads = new Map();
  const statefulProxy = new Proxy(statefulTarget, {
    get(target, property, receiver) {
      if (typeof property === "string" && Object.hasOwn(statefulFirstRead, property)) {
        const count = (statefulReads.get(property) ?? 0) + 1;
        statefulReads.set(property, count);
        if (count === 1) return statefulFirstRead[property];
      }
      return Reflect.get(target, property, receiver);
    },
  });
  const statefulFirstReadResult = replayGenesisMarkedFoxHodgeBridgeCertificate(statefulFirstRead);
  const statefulFallbackResult = replayGenesisMarkedFoxHodgeBridgeCertificate(statefulTarget);
  assert.equal(statefulFirstReadResult.ok, false);
  assert.equal(statefulFirstReadResult.reason, "semantic-mismatch");
  assert.equal(statefulFallbackResult.ok, true);
  const statefulProxyResult = replayGenesisMarkedFoxHodgeBridgeCertificate(statefulProxy);
  assert.equal(statefulProxyResult.ok, false);
  assert.equal(statefulProxyResult.reason, "semantic-mismatch");
  const statefulTopLevelReadCounts = Object.fromEntries(
    [...statefulReads.entries()].sort(([left], [right]) => compareStrings(left, right)),
  );
  assert.deepEqual(statefulTopLevelReadCounts, {
    certificateDigest: 1,
    payload: 1,
    payloadDigest: 1,
    schema: 1,
    tamperAudit: 1,
  });

  return {
    rehashedNestedMutation: { rejected: true, reason: nestedResult.reason },
    rehashedUnknownKey: { rejected: true, reason: unknownResult.reason },
    namedArrayProperty: { rejected: true, reason: namedArrayResult.reason },
    inheritedPrototype: { rejected: true, reason: inheritedResult.reason },
    enumerableGetter: { rejected: true, reason: getterResult.reason },
    nonEnumerablePayloadProperty: { rejected: true, reason: hiddenPayloadResult.reason },
    nonEnumerableTopLevelProperty: { rejected: true, reason: hiddenTopResult.reason },
    symbolArrayProperty: { rejected: true, reason: symbolArrayResult.reason },
    rehashedStatefulProxy: {
      rejected: true,
      reason: statefulProxyResult.reason,
      firstReadStateIsRehashedButSemanticallyInvalid: true,
      laterFallbackStateWouldVerify: true,
      suppliedTopLevelReadCounts: statefulTopLevelReadCounts,
      snapshotReadsEachSuppliedFieldExactlyOnce: true,
    },
    pass: true,
  };
}

export function runGenesisMarkedFoxHodgeBridge() {
  const first = makeCertificate();
  const second = makeCertificate();
  assert.equal(canonical(first), canonical(second));
  const replay = replayGenesisMarkedFoxHodgeBridgeCertificate(first);
  assert.equal(replay.ok, true);
  return {
    ok: true,
    certificate: first,
    replay,
    deterministicReplay: true,
    securityRegressions: securityRegressions(first),
  };
}

export { runGenesisMarkedFoxHodgeBridge as run, replayGenesisMarkedFoxHodgeBridgeCertificate as replay };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = runGenesisMarkedFoxHodgeBridge();
  console.log(JSON.stringify({
    ok: result.ok,
    certificateDigest: result.certificate.certificateDigest,
    payloadDigest: result.certificate.payloadDigest,
    exhaustive: result.certificate.payload.exhaustive,
    collision: {
      generatorMoments: result.certificate.payload.collision.unmarkedHodgeCollision.generatorTraceMoments,
      aggregateMoments: result.certificate.payload.collision.unmarkedHodgeCollision.aggregateTraceMoments,
      parallelWordEnergy: result.certificate.payload.collision.markedFace.parallel.normalizedWordEnergy,
      inverseWordEnergy: result.certificate.payload.collision.markedFace.inverse.normalizedWordEnergy,
      gaugeChecks: result.certificate.payload.collision.simultaneousConjugationGaugeChecks,
      entrywiseGaugeAudit: result.certificate.payload.collision.simultaneousConjugationGaugeAudit,
    },
    thompsonVFoxSupport: {
      relationDirectoryHash: result.certificate.payload.thompsonVFoxSupport.sourceCertificate.relationDirectoryHash,
      relators: result.certificate.payload.thompsonVFoxSupport.relatorCount,
      chartElements: result.certificate.payload.thompsonVFoxSupport.relatorPrefixChartElementCount,
      distinctSupportElements: result.certificate.payload.thompsonVFoxSupport.distinctExactFoxSupportElementCount,
      missingSupportElements: result.certificate.payload.thompsonVFoxSupport.missingSupportElementCount,
      exactFundamentalIdentities: result.certificate.payload.thompsonVFoxSupport.exactFundamentalIdentities,
      globallyEffective: result.certificate.payload.thompsonVFoxSupport.compilerBoundary.globallyEffective,
      openUniversalObligations: result.certificate.payload.thompsonVFoxSupport.compilerBoundary.openUniversalObligations,
    },
    c2FullHodgeSpectralImpostor: {
      commonLaplacian: result.certificate.payload.c2FullHodgeSpectralImpostor.spectralCollision.commonLaplacian,
      commonSpectrum: result.certificate.payload.c2FullHodgeSpectralImpostor.spectralCollision.commonSpectrum,
      faithfulLocallyEmbedded: result.certificate.payload.c2FullHodgeSpectralImpostor.exactSeparation.faithfulLocallyEmbedded,
      trivialLocallyEmbedded: result.certificate.payload.c2FullHodgeSpectralImpostor.exactSeparation.trivialLocallyEmbedded,
      trivialExactElementCollisionCount: result.certificate.payload.c2FullHodgeSpectralImpostor.exactSeparation.trivialExactElementCollisionCount,
    },
    tamper: {
      tested: result.certificate.tamperAudit.tested,
      rejected: result.certificate.tamperAudit.rejected,
    },
    securityRegressions: result.securityRegressions,
    deterministicReplay: result.deterministicReplay,
  }, null, 2));
}
