import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { ExactNonSoficGroupOracle } from "./group-oracle.mjs";
import { makeGammaGenerators } from "./proof-configuration.mjs";

function addCoefficient(map, hash, value) {
  const next = (map.get(hash) ?? 0) + value;
  if (next === 0) map.delete(hash);
  else map.set(hash, next);
}

export function buildGammaSosProblem() {
  const gammaUnits = makeGammaGenerators();
  const gammaNames = gammaUnits.map((_, index) => `sos:gamma:${index}`);
  const oracle = new ExactNonSoficGroupOracle(new Map());
  gammaUnits.forEach((unit, index) => oracle.registerGenerator(gammaNames[index], unit));
  const identity = oracle.evaluate([]);
  const generatorWords = gammaNames.map((generator) => [{ generator, inverse: false }]);
  const basisWords = [...generatorWords];
  const basis = basisWords.map((word) => {
    const evaluated = oracle.evaluate(word);
    return { word, exactHash: evaluated.hash };
  });
  const gramContributions = [];
  for (let left = 0; left < basisWords.length; left += 1) {
    const inverseLeft = oracle.inverseWord(basisWords[left]);
    for (let right = 0; right < basisWords.length; right += 1) {
      const contributions = [
        [oracle.evaluate([...inverseLeft, ...basisWords[right]]).hash, 1],
        [oracle.evaluate(inverseLeft).hash, -1],
        [oracle.evaluate(basisWords[right]).hash, -1],
        [identity.hash, 1],
      ];
      const combined = new Map();
      for (const [exactHash, coefficient] of contributions) {
        addCoefficient(combined, exactHash, coefficient);
      }
      for (const [exactHash, coefficient] of combined) {
        gramContributions.push({ left, right, exactHash, coefficient });
      }
    }
  }
  const delta = new Map([[identity.hash, gammaNames.length]]);
  for (const word of generatorWords) {
    addCoefficient(delta, oracle.evaluate(word).hash, -1);
  }
  const deltaTerms = [...delta.entries()].map(([exactHash, coefficient]) => {
    const representative = exactHash === identity.hash
      ? []
      : generatorWords.find((word) => oracle.evaluate(word).hash === exactHash);
    return { exactHash, coefficient, representative };
  });
  const deltaSquared = new Map();
  for (const left of deltaTerms) {
    for (const right of deltaTerms) {
      const evaluated = oracle.evaluate([
        ...left.representative,
        ...right.representative,
      ]);
      addCoefficient(
        deltaSquared,
        evaluated.hash,
        left.coefficient * right.coefficient,
      );
    }
  }
  return {
    schema: "oasis.kazhdan-sos-problem.v1",
    group: "Gamma = EL_3(L_F2(1,2))",
    generatorCount: gammaNames.length,
    basisRadius: 1,
    basisKind: "generator-minus-identity",
    basis,
    gramContributions,
    delta: Object.fromEntries(delta),
    deltaSquared: Object.fromEntries(deltaSquared),
  };
}

export async function writeGammaSosProblem(path) {
  const problem = buildGammaSosProblem();
  await writeFile(path, `${JSON.stringify(problem)}\n`, "utf8");
  return problem;
}

if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const outputPath = process.argv[2];
  if (!outputPath) throw new Error("Usage: node src/export-sos-problem.mjs OUTPUT.json");
  const problem = await writeGammaSosProblem(outputPath);
  console.log(JSON.stringify({
    outputPath,
    generatorCount: problem.generatorCount,
    basisSize: problem.basis.length,
    gramContributionCount: problem.gramContributions.length,
  }, null, 2));
}
