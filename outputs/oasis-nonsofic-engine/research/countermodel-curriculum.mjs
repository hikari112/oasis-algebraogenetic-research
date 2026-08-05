import {
  appendFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import { compileExpansionLefCertificate } from "../src/obstruction-certificate.mjs";
import {
  composePermutations,
  identityPermutation,
  inversePermutation,
  normalizedHamming,
} from "../src/emulator-critic.mjs";

function parseArguments(argv) {
  const options = {
    durationSeconds: 3600,
    iterationsPerStage: 1500,
    sizes: [6, 8, 10, 12, 16, 20],
    seed: 20260804,
    output: "research/runs/countermodel-live",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === "--duration-seconds") options.durationSeconds = Number(value);
    else if (key === "--iterations-per-stage") options.iterationsPerStage = Number(value);
    else if (key === "--sizes") options.sizes = value.split(",").map(Number);
    else if (key === "--seed") options.seed = Number(value);
    else if (key === "--output") options.output = value;
    else throw new Error(`Unknown argument: ${key}`);
    index += 1;
  }
  if (!(options.durationSeconds > 0)) throw new Error("duration must be positive");
  if (!Number.isInteger(options.iterationsPerStage) || options.iterationsPerStage < 1) {
    throw new Error("iterations per stage must be a positive integer");
  }
  if (options.sizes.some((size) => !Number.isInteger(size) || size < 3)) {
    throw new Error("all emulator sizes must be integers of at least three");
  }
  return options;
}

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const selected = Math.floor(random() * (index + 1));
    [result[index], result[selected]] = [result[selected], result[index]];
  }
  return result;
}

function randomBoundedOrderPermutation(size, allowedCycleLengths, random) {
  const points = shuffle(identityPermutation(size), random);
  const permutation = identityPermutation(size);
  let cursor = 0;
  while (cursor < size) {
    const remaining = size - cursor;
    const choices = allowedCycleLengths.filter((length) => length <= remaining);
    let length = choices[Math.floor(random() * choices.length)];
    if (cursor === 0 && size > 1 && length === 1) {
      const nontrivial = choices.filter((value) => value > 1);
      if (nontrivial.length) length = nontrivial[Math.floor(random() * nontrivial.length)];
    }
    const cycle = points.slice(cursor, cursor + length);
    for (let index = 0; index < cycle.length; index += 1) {
      permutation[cycle[index]] = cycle[(index + 1) % cycle.length];
    }
    cursor += length;
  }
  return permutation;
}

function conjugateByTransposition(permutation, left, right) {
  const transposition = identityPermutation(permutation.length);
  transposition[left] = right;
  transposition[right] = left;
  return composePermutations(
    transposition,
    composePermutations(permutation, transposition),
  );
}

function evaluatePermutationWord(word, assignment, size) {
  let result = identityPermutation(size);
  for (const token of word) {
    const direct = assignment[token.generator];
    if (!direct) throw new Error(`No permutation assigned to ${token.generator}`);
    result = composePermutations(
      result,
      token.inverse ? inversePermutation(direct) : direct,
    );
  }
  return result;
}

function buildConstraints(groupOracle, obstruction) {
  const byHash = new Map(
    obstruction.finiteSet.map((item, index) => [item.exactHash, index]),
  );
  const pairs = [];
  for (let left = 0; left < obstruction.finiteSet.length; left += 1) {
    for (let right = left + 1; right < obstruction.finiteSet.length; right += 1) {
      pairs.push([left, right]);
    }
  }
  const multiplication = [];
  for (let left = 0; left < obstruction.finiteSet.length; left += 1) {
    for (let right = 0; right < obstruction.finiteSet.length; right += 1) {
      const product = groupOracle.evaluate([
        ...obstruction.finiteSet[left].representativeWord,
        ...obstruction.finiteSet[right].representativeWord,
      ]);
      const productIndex = byHash.get(product.hash);
      if (productIndex !== undefined) multiplication.push([left, right, productIndex]);
    }
  }
  return { pairs, multiplication };
}

function evaluateCandidate({ size, u, v, names, obstruction, constraints }) {
  const assignment = { [names.j[0]]: u, [names.j[1]]: v };
  const chart = obstruction.finiteSet.map((item) =>
    evaluatePermutationWord(item.representativeWord, assignment, size));
  const relatorDefects = obstruction.presentation.relators.map((relator) =>
    normalizedHamming(
      evaluatePermutationWord(relator.operatorWord, assignment, size),
      identityPermutation(size),
    ));
  let maximumCollisionFraction = 0;
  let collisionTotal = 0;
  let closestPair = null;
  for (const [left, right] of constraints.pairs) {
    const collision = 1 - normalizedHamming(chart[left], chart[right]);
    collisionTotal += collision;
    if (collision > maximumCollisionFraction) {
      maximumCollisionFraction = collision;
      closestPair = [left, right];
    }
  }
  let maximumMultiplicationDefect = 0;
  let multiplicationTotal = 0;
  let worstMultiplication = null;
  for (const [left, right, product] of constraints.multiplication) {
    const defect = normalizedHamming(
      composePermutations(chart[left], chart[right]),
      chart[product],
    );
    multiplicationTotal += defect;
    if (defect > maximumMultiplicationDefect) {
      maximumMultiplicationDefect = defect;
      worstMultiplication = [left, right, product];
    }
  }
  const maximumRelatorDefect = Math.max(...relatorDefects);
  const worstLoss = Math.max(
    maximumCollisionFraction,
    maximumMultiplicationDefect,
    maximumRelatorDefect,
  );
  const meanCollision = collisionTotal / constraints.pairs.length;
  const meanMultiplicationDefect = constraints.multiplication.length
    ? multiplicationTotal / constraints.multiplication.length
    : 0;
  const meanRelatorDefect = relatorDefects.reduce((sum, value) => sum + value, 0) /
    relatorDefects.length;
  const meanLoss = (meanCollision + meanMultiplicationDefect + meanRelatorDefect) / 3;
  return {
    worstLoss,
    objective: worstLoss + 0.05 * meanLoss,
    maximumCollisionFraction,
    minimumPairDistance: 1 - maximumCollisionFraction,
    maximumMultiplicationDefect,
    maximumRelatorDefect,
    meanCollision,
    meanMultiplicationDefect,
    meanRelatorDefect,
    relatorDefects,
    closestPair,
    worstMultiplication,
    uMovedFraction: normalizedHamming(u, identityPermutation(size)),
    vMovedFraction: normalizedHamming(v, identityPermutation(size)),
  };
}

function atomicJson(path, value) {
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, path);
}

function better(left, right) {
  return left.objective < right.objective - 1e-12;
}

const options = parseArguments(process.argv.slice(2));
const outputDirectory = resolve(options.output);
mkdirSync(outputDirectory, { recursive: true });
const eventPath = resolve(outputDirectory, "events.jsonl");
const statusPath = resolve(outputDirectory, "status.json");
const stopPath = resolve(outputDirectory, "STOP");
const random = makeRandom(options.seed);
const groupOracle = new ExactNonSoficGroupOracle();
const certificate = compileExpansionLefCertificate(groupOracle);
const obstruction = certificate.finiteLefObstruction;
const constraints = buildConstraints(groupOracle, obstruction);
const startedAt = new Date();
const deadline = Date.now() + options.durationSeconds * 1000;
const bestBySize = {};
let totalIterations = 0;
let stage = 0;

const manifest = {
  schema: "oasis.countermodel-curriculum.v1",
  claimBoundary: "empirical-defect-search-not-universal-epsilon-proof",
  startedAt: startedAt.toISOString(),
  options,
  obstructionId: obstruction.id,
  finiteSetSize: obstruction.finiteSetSize,
  pairConstraintCount: constraints.pairs.length,
  multiplicationConstraintCount: constraints.multiplication.length,
  relatorCount: obstruction.presentation.relators.length,
};
atomicJson(resolve(outputDirectory, "manifest.json"), manifest);
appendFileSync(eventPath, `${JSON.stringify({ type: "start", ...manifest })}\n`);

while (Date.now() < deadline && !existsSync(stopPath)) {
  const size = options.sizes[stage % options.sizes.length];
  stage += 1;
  let u = randomBoundedOrderPermutation(size, [1, 2, 3, 6], random);
  let v = randomBoundedOrderPermutation(size, [1, 3], random);
  let current = evaluateCandidate({
    size, u, v, names: certificate.names, obstruction, constraints,
  });
  let stageBest = { ...current, u: [...u], v: [...v] };

  for (let iteration = 0; iteration < options.iterationsPerStage; iteration += 1) {
    if (Date.now() >= deadline || existsSync(stopPath)) break;
    const mutateU = random() < 0.5;
    let nextU = u;
    let nextV = v;
    if (random() < 0.025) {
      if (mutateU) nextU = randomBoundedOrderPermutation(size, [1, 2, 3, 6], random);
      else nextV = randomBoundedOrderPermutation(size, [1, 3], random);
    } else {
      let left = Math.floor(random() * size);
      let right = Math.floor(random() * size);
      while (right === left) right = Math.floor(random() * size);
      if (mutateU) nextU = conjugateByTransposition(u, left, right);
      else nextV = conjugateByTransposition(v, left, right);
    }
    const candidate = evaluateCandidate({
      size, u: nextU, v: nextV, names: certificate.names, obstruction, constraints,
    });
    const temperature = 0.02 * (1 - iteration / options.iterationsPerStage) + 0.0005;
    const accept = better(candidate, current) ||
      random() < Math.exp((current.objective - candidate.objective) / temperature);
    if (accept) {
      u = nextU;
      v = nextV;
      current = candidate;
    }
    if (better(candidate, stageBest)) {
      stageBest = { ...candidate, u: [...nextU], v: [...nextV] };
    }
    totalIterations += 1;
  }

  if (!bestBySize[size] || better(stageBest, bestBySize[size])) {
    bestBySize[size] = stageBest;
    appendFileSync(eventPath, `${JSON.stringify({
      type: "new-best",
      at: new Date().toISOString(),
      size,
      totalIterations,
      result: stageBest,
    })}\n`);
  }
  atomicJson(statusPath, {
    schema: "oasis.countermodel-curriculum-status.v1",
    state: Date.now() >= deadline ? "finishing" : "running",
    updatedAt: new Date().toISOString(),
    elapsedSeconds: (Date.now() - startedAt.getTime()) / 1000,
    totalIterations,
    completedStages: stage,
    bestBySize,
  });
}

const finalStatus = {
  schema: "oasis.countermodel-curriculum-status.v1",
  state: existsSync(stopPath) ? "stopped" : "completed",
  startedAt: startedAt.toISOString(),
  completedAt: new Date().toISOString(),
  elapsedSeconds: (Date.now() - startedAt.getTime()) / 1000,
  totalIterations,
  completedStages: stage,
  bestBySize,
};
atomicJson(statusPath, finalStatus);
appendFileSync(eventPath, `${JSON.stringify({ type: "finish", ...finalStatus })}\n`);
console.log(JSON.stringify(finalStatus, null, 2));
