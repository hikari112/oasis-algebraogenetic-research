import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import { makeGammaGenerators } from "../src/proof-configuration.mjs";
import { buildGammaSosProblem } from "../src/export-sos-problem.mjs";

const BIT_FLIP = Object.freeze({
  "1": "1", s0: "s1", s1: "s0", t0: "t1", t1: "t0",
});
const STAR = Object.freeze({
  "1": "1", s0: "t0", s1: "t1", t0: "s0", t1: "s1",
});

function permutations(values) {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) =>
    permutations(values.filter((_, candidate) => candidate !== index))
      .map((tail) => [value, ...tail]));
}

function parseGeneratorLabel(label) {
  const match = /^gamma:(\d):(\d):(1|s0|s1|t0|t1)$/.exec(label);
  if (!match) throw new Error(`Unexpected Gamma label: ${label}`);
  return { row: Number(match[1]), column: Number(match[2]), coefficient: match[3] };
}

function permutationParity(permutation) {
  let inversions = 0;
  for (let left = 0; left < permutation.length; left += 1) {
    for (let right = left + 1; right < permutation.length; right += 1) {
      if (permutation[left] > permutation[right]) inversions += 1;
    }
  }
  return inversions % 2 === 0 ? 1 : -1;
}

function permutationOrderClass(permutation) {
  if (permutation.every((value, index) => value === index)) return "identity";
  return permutationParity(permutation) === -1 ? "transposition" : "three-cycle";
}

function composeIndexPermutations(left, right) {
  return right.map((value) => left[value]);
}

function buildContext() {
  const units = makeGammaGenerators();
  const names = units.map((_, index) => `sos:gamma:${index}`);
  const oracle = new ExactNonSoficGroupOracle(new Map());
  units.forEach((unit, index) => oracle.registerGenerator(names[index], unit));
  const metadata = units.map((unit, index) => ({
    index,
    name: names[index],
    ...parseGeneratorLabel(unit.label),
  }));
  const indexByDescriptor = new Map(metadata.map((item) => [
    `${item.row}:${item.column}:${item.coefficient}`,
    item.index,
  ]));
  return { units, names, oracle, metadata, indexByDescriptor };
}

function buildTransformations() {
  return permutations([0, 1, 2]).flatMap((indexPermutation) =>
    [false, true].flatMap((bitFlip) =>
      [false, true].map((dagger) => ({ indexPermutation, bitFlip, dagger }))));
}

function transformationId(transformation) {
  return `${transformation.indexPermutation.join("")}|b${Number(transformation.bitFlip)}|d${Number(transformation.dagger)}`;
}

function transformWord(word, transformation, context) {
  const mapped = word.map((token) => {
    const source = context.metadata[Number(token.generator.split(":").at(-1))];
    let row = source.row;
    let column = source.column;
    let coefficient = source.coefficient;
    if (transformation.dagger) {
      [row, column] = [column, row];
      coefficient = STAR[coefficient];
    }
    row = transformation.indexPermutation[row];
    column = transformation.indexPermutation[column];
    if (transformation.bitFlip) coefficient = BIT_FLIP[coefficient];
    const targetIndex = context.indexByDescriptor.get(`${row}:${column}:${coefficient}`);
    if (targetIndex === undefined) throw new Error("Transformation left the Gamma generator set");
    return { generator: context.names[targetIndex], inverse: Boolean(token.inverse) };
  });
  if (!transformation.dagger) return mapped;
  // Matrix dagger is an anti-automorphism T.  Gram/SOS averaging requires a
  // genuine group automorphism, so use g -> T(g)^-1.  This maps xi*xi to
  // phi(xi)*phi(xi), whereas raw T would reverse the square to xi xi* and does
  // not act on Gram coordinates by the naive basis permutation.
  return context.oracle.inverseWord(mapped.reverse());
}

function composeTransformations(left, right) {
  return {
    indexPermutation: composeIndexPermutations(left.indexPermutation, right.indexPermutation),
    bitFlip: left.bitFlip !== right.bitFlip,
    dagger: left.dagger !== right.dagger,
  };
}

function addRepresentative(map, oracle, word) {
  const evaluated = oracle.evaluate(word);
  if (!map.has(evaluated.hash)) {
    map.set(evaluated.hash, word.map((token) => ({ ...token })));
  }
  return evaluated.hash;
}

function radiusTwoBall(context) {
  const representatives = new Map();
  addRepresentative(representatives, context.oracle, []);
  const generatorWords = context.names.map((generator) => [{ generator, inverse: false }]);
  for (const left of [[], ...generatorWords]) {
    for (const right of generatorWords) {
      if (left.length + right.length > 2) continue;
      addRepresentative(representatives, context.oracle, [...left, ...right]);
    }
  }
  return representatives;
}

function problemRepresentatives(problem, context) {
  const representatives = new Map();
  const identityHash = addRepresentative(representatives, context.oracle, []);
  const basisWords = problem.basis.map((item) => item.word);
  for (const word of basisWords) addRepresentative(representatives, context.oracle, word);
  for (const leftWord of basisWords) {
    const inverseLeft = context.oracle.inverseWord(leftWord);
    addRepresentative(representatives, context.oracle, inverseLeft);
    for (const rightWord of basisWords) {
      addRepresentative(representatives, context.oracle, [...inverseLeft, ...rightWord]);
    }
  }
  if (!representatives.has(identityHash)) throw new Error("Identity was lost");
  return representatives;
}

function actionOnSet(representatives, transformations, context) {
  const hashes = [...representatives.keys()].sort();
  const indexByHash = new Map(hashes.map((hash, index) => [hash, index]));
  const actions = transformations.map((transformation) => {
    const permutation = hashes.map((hash) => {
      const transformed = context.oracle.evaluate(
        transformWord(representatives.get(hash), transformation, context),
      ).hash;
      const target = indexByHash.get(transformed);
      if (target === undefined) {
        throw new Error(`Transformation ${transformationId(transformation)} left the exact set`);
      }
      return target;
    });
    if (new Set(permutation).size !== hashes.length) {
      throw new Error(`Transformation ${transformationId(transformation)} is not bijective`);
    }
    return permutation;
  });
  return { hashes, indexByHash, actions };
}

function setOrbits(actions, size) {
  const unseen = new Set(Array.from({ length: size }, (_, index) => index));
  const orbits = [];
  while (unseen.size) {
    const seed = unseen.values().next().value;
    const orbit = new Set(actions.map((action) => action[seed]));
    let changed = true;
    while (changed) {
      changed = false;
      for (const point of [...orbit]) {
        for (const action of actions) {
          if (!orbit.has(action[point])) {
            orbit.add(action[point]);
            changed = true;
          }
        }
      }
    }
    for (const point of orbit) unseen.delete(point);
    orbits.push([...orbit].sort((left, right) => left - right));
  }
  return orbits.sort((left, right) => right.length - left.length || left[0] - right[0]);
}

function fixedPointCount(action) {
  return action.reduce((count, value, index) => count + Number(value === index), 0);
}

function s3Character(kind, permutation) {
  const orderClass = permutationOrderClass(permutation);
  if (kind === "trivial") return 1;
  if (kind === "sign") return permutationParity(permutation);
  return ({ identity: 2, transposition: 0, "three-cycle": -1 })[orderClass];
}

function representationDecomposition(transformations, actions) {
  const irreducibles = [];
  for (const s3 of ["trivial", "sign", "standard"]) {
    for (const bitCharacter of [1, -1]) {
      for (const daggerCharacter of [1, -1]) {
        const numerator = transformations.reduce((sum, transformation, index) => {
          const character = s3Character(s3, transformation.indexPermutation) *
            (transformation.bitFlip ? bitCharacter : 1) *
            (transformation.dagger ? daggerCharacter : 1);
          return sum + fixedPointCount(actions[index]) * character;
        }, 0);
        const multiplicity = numerator / transformations.length;
        if (!Number.isInteger(multiplicity)) {
          throw new Error(`Nonintegral representation multiplicity: ${multiplicity}`);
        }
        irreducibles.push({
          s3,
          bitCharacter,
          daggerCharacter,
          dimension: s3 === "standard" ? 2 : 1,
          multiplicity,
          psdBlockSize: multiplicity,
        });
      }
    }
  }
  return irreducibles;
}

function unorderedPairOrbitCount(transformations, actions) {
  const actionById = new Map(transformations.map((item, index) => [
    transformationId(item),
    actions[index],
  ]));
  let fixedMultisetTotal = 0;
  for (let index = 0; index < transformations.length; index += 1) {
    const transformation = transformations[index];
    const fixed = fixedPointCount(actions[index]);
    const square = composeTransformations(transformation, transformation);
    const fixedBySquare = fixedPointCount(actionById.get(transformationId(square)));
    const twoCycles = (fixedBySquare - fixed) / 2;
    fixedMultisetTotal += fixed * (fixed + 1) / 2 + twoCycles;
  }
  const result = fixedMultisetTotal / transformations.length;
  if (!Number.isInteger(result)) throw new Error("Nonintegral unordered-pair orbit count");
  return result;
}

function encodeWord(word, context) {
  if (word.length === 0) return "identity";
  return word.map((token) => {
    const index = Number(token.generator.split(":").at(-1));
    const item = context.metadata[index];
    return `x(${item.row},${item.column},${item.coefficient})${token.inverse ? "^-1" : ""}`;
  }).join(" ");
}

function roundedClusters(dual, digits = 6) {
  const clusters = new Map();
  for (const value of Object.values(dual)) {
    const rounded = Number(value).toFixed(digits);
    clusters.set(rounded, (clusters.get(rounded) ?? 0) + 1);
  }
  return [...clusters.entries()]
    .map(([value, count]) => ({ value: Number(value), count }))
    .sort((left, right) => right.count - left.count || left.value - right.value);
}

function markdownReport(report) {
  const blocks = report.radiusTwo.decomposition
    .filter((item) => item.multiplicity > 0)
    .map((item) => `| ${item.s3} | ${item.bitCharacter} | ${item.daggerCharacter} | ${item.dimension} | ${item.multiplicity} |`)
    .join("\n");
  return `# Exact SOS symmetry analysis

## Result

The candidate symmetry group is the exact 24-element action

\`S3(matrix indices) x C2(binary-symbol flip) x C2(transpose-Leavitt involution)\`.

Every transformation maps the ${report.radiusOne.elementCount} exact radius-one product elements bijectively to themselves. The numerical dual varies by at most \`${report.radiusOne.maximumWithinOrbitDualSpread}\` inside an exact symmetry orbit. The eight rounded numerical classes therefore respect the exact symmetry action, although they may merge several distinct exact orbits.

## Radius-one dual

- Exact elements: ${report.radiusOne.elementCount}
- Exact symmetry orbits: ${report.radiusOne.orbitCount}
- Largest orbit: ${report.radiusOne.largestOrbitSize}
- Rounded value classes: ${report.radiusOne.roundedClusters.length}
- Dual moment minimum eigenvalue: ${report.radiusOne.dualMomentMatrixMinimumEigenvalue}
- Maximum within-orbit dual spread: ${report.radiusOne.maximumWithinOrbitDualSpread}

Rounded class counts:

\`\`\`text
${report.radiusOne.roundedClusters.map((item) => `${item.count} @ ${item.value}`).join("\n")}
\`\`\`

## Radius-two PSD compression

- Exact radius-two basis elements excluding identity: ${report.radiusTwo.basisSize}
- Full symmetric Gram variables: ${report.radiusTwo.fullSymmetricVariableCount}
- Symmetry-invariant symmetric variables: ${report.radiusTwo.invariantSymmetricVariableCount}
- Variable compression factor: ${report.radiusTwo.variableCompressionFactor}
- Basis orbits: ${report.radiusTwo.basisOrbitCount}
- Largest PSD multiplicity block: ${report.radiusTwo.largestPsdBlockSize}

The 678-by-678 PSD constraint can be block-diagonalized into multiplicity blocks determined by the following real irreducible sectors:

| S3 irrep | Bit character | Dagger character | Irrep dimension | Multiplicity / PSD block size |
|---|---:|---:|---:|---:|
${blocks}

The dimension identity and the Burnside unordered-pair count both reproduce ${report.radiusTwo.invariantSymmetricVariableCount} invariant symmetric variables. This is an exact internal consistency check of the decomposition.

## Claim boundary

This establishes the exact finite symmetry action and its representation-theoretic compression. It does not establish a positive radius-two SOS gap. The next solver must impose the quotient coefficient equations and verify any candidate with exact rational or interval arithmetic.
`;
}

export function analyzeSosSymmetry({
  resultPath = "work/gamma-sos-radius1-difference-scs-result.json",
  jsonOutputPath = "outputs/oasis-nonsofic-engine/research/sos-symmetry-report.json",
  markdownOutputPath = "outputs/oasis-nonsofic-engine/research/sos-symmetry-report.md",
} = {}) {
const numericalResult = JSON.parse(readFileSync(resolve(resultPath), "utf8"));
const problem = buildGammaSosProblem();
const context = buildContext();
const transformations = buildTransformations();

const radiusOneRepresentatives = problemRepresentatives(problem, context);
const radiusOneAction = actionOnSet(radiusOneRepresentatives, transformations, context);
if (radiusOneAction.hashes.length !== Object.keys(numericalResult.dualByExactHash).length) {
  throw new Error("Radius-one exact universe and numerical dual have different sizes");
}
const radiusOneOrbits = setOrbits(radiusOneAction.actions, radiusOneAction.hashes.length);
let maximumWithinOrbitDualSpread = 0;
const radiusOneOrbitData = radiusOneOrbits.map((orbit) => {
  const values = orbit.map((index) =>
    Number(numericalResult.dualByExactHash[radiusOneAction.hashes[index]]));
  const spread = Math.max(...values) - Math.min(...values);
  maximumWithinOrbitDualSpread = Math.max(maximumWithinOrbitDualSpread, spread);
  const representativeIndex = orbit[0];
  const representativeHash = radiusOneAction.hashes[representativeIndex];
  return {
    size: orbit.length,
    dualMean: values.reduce((sum, value) => sum + value, 0) / values.length,
    dualSpread: spread,
    representativeHash,
    representativeWord: encodeWord(radiusOneRepresentatives.get(representativeHash), context),
    memberHashes: orbit.map((index) => radiusOneAction.hashes[index]),
  };
});

const radiusTwoRepresentativesWithIdentity = radiusTwoBall(context);
const identityHash = context.oracle.evaluate([]).hash;
const radiusTwoRepresentatives = new Map(
  [...radiusTwoRepresentativesWithIdentity.entries()].filter(([hash]) => hash !== identityHash),
);
const radiusTwoAction = actionOnSet(radiusTwoRepresentatives, transformations, context);
const radiusTwoOrbits = setOrbits(radiusTwoAction.actions, radiusTwoAction.hashes.length);
const decomposition = representationDecomposition(transformations, radiusTwoAction.actions);
const reconstructedDimension = decomposition.reduce(
  (sum, item) => sum + item.dimension * item.multiplicity,
  0,
);
if (reconstructedDimension !== radiusTwoAction.hashes.length) {
  throw new Error("Representation multiplicities do not reconstruct the basis dimension");
}
const invariantSymmetricVariableCount = decomposition.reduce(
  (sum, item) => sum + item.multiplicity * (item.multiplicity + 1) / 2,
  0,
);
const burnsidePairCount = unorderedPairOrbitCount(transformations, radiusTwoAction.actions);
if (burnsidePairCount !== invariantSymmetricVariableCount) {
  throw new Error("Character and Burnside invariant-matrix dimensions disagree");
}
const fullSymmetricVariableCount = radiusTwoAction.hashes.length *
  (radiusTwoAction.hashes.length + 1) / 2;

const report = {
  schema: "oasis.sos-symmetry-analysis.v1",
  claimBoundary: "exact-symmetry-compression-not-positive-gap-certificate",
  symmetry: {
    groupDescription: "S3 x C2(bit flip) x C2(transpose-Leavitt involution)",
    order: transformations.length,
    transformations: transformations.map((item, index) => ({
      id: transformationId(item),
      indexPermutation: item.indexPermutation,
      bitFlip: item.bitFlip,
      dagger: item.dagger,
      radiusOneFixedPoints: fixedPointCount(radiusOneAction.actions[index]),
      radiusTwoFixedPoints: fixedPointCount(radiusTwoAction.actions[index]),
    })),
  },
  radiusOne: {
    elementCount: radiusOneAction.hashes.length,
    orbitCount: radiusOneOrbits.length,
    orbitSizeDistribution: Object.fromEntries(
      [...new Set(radiusOneOrbits.map((orbit) => orbit.length))]
        .sort((left, right) => left - right)
        .map((size) => [size, radiusOneOrbits.filter((orbit) => orbit.length === size).length]),
    ),
    largestOrbitSize: Math.max(...radiusOneOrbits.map((orbit) => orbit.length)),
    maximumWithinOrbitDualSpread,
    dualMomentMatrixMinimumEigenvalue: numericalResult.dualMomentMatrixMinimumEigenvalue,
    roundedClusters: roundedClusters(numericalResult.dualByExactHash),
    orbits: radiusOneOrbitData,
  },
  radiusTwo: {
    basisSize: radiusTwoAction.hashes.length,
    basisOrbitCount: radiusTwoOrbits.length,
    basisOrbitSizeDistribution: Object.fromEntries(
      [...new Set(radiusTwoOrbits.map((orbit) => orbit.length))]
        .sort((left, right) => left - right)
        .map((size) => [size, radiusTwoOrbits.filter((orbit) => orbit.length === size).length]),
    ),
    fullSymmetricVariableCount,
    invariantSymmetricVariableCount,
    burnsideUnorderedPairOrbitCount: burnsidePairCount,
    variableCompressionFactor: fullSymmetricVariableCount / invariantSymmetricVariableCount,
    largestPsdBlockSize: Math.max(...decomposition.map((item) => item.multiplicity)),
    reconstructedDimension,
    decomposition,
  },
};

writeFileSync(resolve(jsonOutputPath), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(resolve(markdownOutputPath), markdownReport(report));
console.log(JSON.stringify({
  jsonOutputPath,
  markdownOutputPath,
  symmetryOrder: report.symmetry.order,
  radiusOne: {
    elementCount: report.radiusOne.elementCount,
    orbitCount: report.radiusOne.orbitCount,
    maximumWithinOrbitDualSpread: report.radiusOne.maximumWithinOrbitDualSpread,
  },
  radiusTwo: {
    basisSize: report.radiusTwo.basisSize,
    basisOrbitCount: report.radiusTwo.basisOrbitCount,
    fullSymmetricVariableCount: report.radiusTwo.fullSymmetricVariableCount,
    invariantSymmetricVariableCount: report.radiusTwo.invariantSymmetricVariableCount,
    largestPsdBlockSize: report.radiusTwo.largestPsdBlockSize,
  },
}, null, 2));
return report;
}

export {
  actionOnSet,
  buildContext,
  buildTransformations,
  encodeWord,
  radiusTwoBall,
  setOrbits,
  transformWord,
  transformationId,
};

if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  analyzeSosSymmetry({
    resultPath: process.argv[2],
    jsonOutputPath: process.argv[3],
    markdownOutputPath: process.argv[4],
  });
}
