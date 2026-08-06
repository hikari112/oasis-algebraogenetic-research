import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";
import { compileExpansionLefCertificate } from "../src/obstruction-certificate.mjs";
import { EndogenousTransportAtlas } from "../src/endogenous-transport-atlas.mjs";
import { LeavittRegularState } from "../src/regular-probes.mjs";
import { sWord } from "../src/leavitt-f2.mjs";
import { NINE_LEAF_CODE_D } from "../src/unit-group.mjs";
import {
  CertificateXorController,
  instantiateExactReplayContext,
  makeFixtures,
  routeOrientedDefectGerm,
  snapshotExactReplayContext,
} from "./certificate-cantor-controller.mjs";

function bit(index) {
  return 1n << BigInt(index);
}

function parity(value) {
  let result = 0;
  let remaining = value;
  while (remaining !== 0n) {
    result ^= 1;
    remaining &= remaining - 1n;
  }
  return result;
}

function popcount(value) {
  let count = 0;
  let remaining = value;
  while (remaining !== 0n) {
    count += 1;
    remaining &= remaining - 1n;
  }
  return count;
}

function freezePlainTree(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezePlainTree(child);
  return Object.freeze(value);
}

function identityMatrix(dimension) {
  return Array.from({ length: dimension }, (_unused, index) => bit(index));
}

function zeroMatrix(dimension) {
  return Array.from({ length: dimension }, () => 0n);
}

function multiplyMatrices(left, right) {
  assert.equal(left.length, right.length);
  const dimension = left.length;
  return left.map((row) => {
    let result = 0n;
    for (let column = 0; column < dimension; column += 1) {
      if ((row & bit(column)) !== 0n) result ^= right[column];
    }
    return result;
  });
}

function xorMatrices(left, right) {
  assert.equal(left.length, right.length);
  return left.map((row, index) => row ^ right[index]);
}

function applyMatrix(matrix, vector) {
  let result = 0n;
  for (let row = 0; row < matrix.length; row += 1) {
    if (parity(matrix[row] & vector) === 1) result |= bit(row);
  }
  return result;
}

function matrixKey(matrix) {
  return matrix.map((row) => row.toString(16)).join(":");
}

function matrixRank(matrix) {
  const rows = [...matrix];
  const dimension = rows.length;
  let rank = 0;
  for (let column = dimension - 1; column >= 0 && rank < dimension; column -= 1) {
    const pivot = rows.findIndex(
      (row, index) => index >= rank && (row & bit(column)) !== 0n,
    );
    if (pivot < 0) continue;
    [rows[rank], rows[pivot]] = [rows[pivot], rows[rank]];
    for (let row = 0; row < dimension; row += 1) {
      if (row !== rank && (rows[row] & bit(column)) !== 0n) {
        rows[row] ^= rows[rank];
      }
    }
    rank += 1;
  }
  return rank;
}

function generatedMatrixGroup(generators, dimension) {
  const identity = identityMatrix(dimension);
  const known = new Map([[matrixKey(identity), identity]]);
  const frontier = [identity];
  while (frontier.length > 0) {
    const current = frontier.shift();
    for (const generator of generators) {
      const next = multiplyMatrices(generator, current);
      const key = matrixKey(next);
      if (!known.has(key)) {
        known.set(key, next);
        frontier.push(next);
      }
    }
  }
  return [...known.values()];
}

function maskFromKeys(keys, indexByKey) {
  let mask = 0n;
  for (const key of keys) mask |= bit(indexByKey.get(key) + 1);
  return mask;
}

// V = F_2 e_* direct-sum W.  A split germ sends the scalar seed into W.
function splitShear(splitMask, dimension) {
  const matrix = identityMatrix(dimension);
  for (let row = 1; row < dimension; row += 1) {
    if ((splitMask & bit(row)) !== 0n) matrix[row] ^= bit(0);
  }
  return matrix;
}

// A glue germ evaluates W against its indicator and feeds the result to e_*.
function glueShear(glueMask, dimension) {
  const matrix = identityMatrix(dimension);
  matrix[0] ^= glueMask;
  return matrix;
}

function runHistory(actions, dimension) {
  let transport = identityMatrix(dimension);
  for (const action of actions) transport = multiplyMatrices(action, transport);
  return transport;
}

function predictedSquareDiscrepancy(splitMask, glueMask, dimension) {
  const discrepancy = zeroMatrix(dimension);
  if (parity(splitMask & glueMask) === 1) discrepancy[0] |= bit(0);
  for (let row = 1; row < dimension; row += 1) {
    if ((splitMask & bit(row)) !== 0n) discrepancy[row] = glueMask;
  }
  return discrepancy;
}

function auditSmallRepairSquares(maxCellCount = 6) {
  let squareCount = 0;
  for (let cellCount = 1; cellCount <= maxCellCount; cellCount += 1) {
    const dimension = cellCount + 1;
    const identity = identityMatrix(dimension);
    const maskCount = 2 ** cellCount;
    for (let splitBits = 0; splitBits < maskCount; splitBits += 1) {
      const splitMask = BigInt(splitBits) << 1n;
      const split = splitShear(splitMask, dimension);
      assert.deepEqual(multiplyMatrices(split, split), identity);
      for (let glueBits = 0; glueBits < maskCount; glueBits += 1) {
        const glueMask = BigInt(glueBits) << 1n;
        const glue = glueShear(glueMask, dimension);
        assert.deepEqual(multiplyMatrices(glue, glue), identity);
        const pathA = runHistory([split, glue], dimension);
        const pathB = runHistory([glue, split], dimension);
        const discrepancy = xorMatrices(pathA, pathB);
        assert.deepEqual(
          discrepancy,
          predictedSquareDiscrepancy(splitMask, glueMask, dimension),
        );
        const overlapParity = parity(splitMask & glueMask);
        const expectedRank = splitMask === 0n || glueMask === 0n
          ? 0
          : 1 + overlapParity;
        assert.equal(matrixRank(discrepancy), expectedRank);
        assert.equal(
          discrepancy.reduce((sum, row) => sum + popcount(row), 0),
          popcount(splitMask) * popcount(glueMask) + overlapParity,
        );
        squareCount += 1;
      }
    }
  }
  return { maxCellCount, squareCount };
}

function permutationMatrix(permutation) {
  const dimension = permutation.length;
  const matrix = zeroMatrix(dimension);
  for (let oldIndex = 0; oldIndex < dimension; oldIndex += 1) {
    matrix[permutation[oldIndex]] |= bit(oldIndex);
  }
  return matrix;
}

function inversePermutation(permutation) {
  const inverse = Array(permutation.length);
  permutation.forEach((image, source) => {
    inverse[image] = source;
  });
  return inverse;
}

function permuteMask(mask, permutation) {
  let result = 0n;
  for (let oldIndex = 0; oldIndex < permutation.length; oldIndex += 1) {
    if ((mask & bit(oldIndex)) !== 0n) result |= bit(permutation[oldIndex]);
  }
  return result;
}

function canonicalCurriculum(curriculum) {
  const normalize = (items) => [...items]
    .map((item) => JSON.stringify(item))
    .sort();
  return {
    gluing: normalize(curriculum.gluing),
    separation: normalize(curriculum.separation),
  };
}

function scoreChallenge(atlas, challenge, critic, groupOracle) {
  const { leftWord, rightWord } = challenge.violation;
  return atlas.scoreTransport({
    leftWord,
    rightWord,
    leftPermutation: critic.permutationForWord(groupOracle, leftWord),
    rightPermutation: critic.permutationForWord(groupOracle, rightWord),
  });
}

class ValidatedRepairDiagram {
  #replayContext;

  #committedGerms;

  constructor({ certificate, groupOracle, states, basisKeys }) {
    this.certificate = certificate;
    this.#replayContext = snapshotExactReplayContext(
      groupOracle,
      states,
      certificate,
    );
    this.#committedGerms = Object.freeze([]);
    this.indexByKey = new Map(basisKeys.map((key, index) => [key, index]));
    this.dimension = basisKeys.length + 1;
    const initial = instantiateExactReplayContext(this.#replayContext);
    this.atlas = new EndogenousTransportAtlas(initial.groupOracle);
    this.transport = identityMatrix(this.dimension);
    this.seen = new Set();
    this.log = [];
  }

  compileGerm(germ) {
    const replay = instantiateExactReplayContext(this.#replayContext);
    return this.#compileGermWithContext(germ, replay);
  }

  #compileGermWithContext(germ, replay) {
    const routed = routeOrientedDefectGerm({
      germ,
      certificate: replay.certificate,
      groupOracle: replay.groupOracle,
      states: replay.states,
    });
    const { challenge } = routed;
    assert(challenge.violation, "A repair event requires a routed violation");
    const kind = challenge.refinementAction.kind;
    assert(kind === "split" || kind === "glue");
    const polarityKey = kind === "split" ? "splitBit" : "glueBit";
    const germCoordinates = germ.cells
      .filter(
        (cell) => cell.relationId === challenge.violation.relationId &&
          cell[polarityKey] === 1,
      )
      .map((cell) => cell.coordinateKey)
      .sort();
    assert(germCoordinates.length > 0);
    for (const coordinate of germCoordinates) {
      assert(
        this.indexByKey.has(coordinate),
        "A germ coordinate is outside the declared transport module",
      );
    }
    const mask = maskFromKeys(germCoordinates, this.indexByKey);
    const action = kind === "split"
      ? splitShear(mask, this.dimension)
      : glueShear(mask, this.dimension);
    const id = JSON.stringify({
      certificateId: challenge.certificateId,
      relationDirectoryHash: challenge.relationDirectoryHash,
      relationId: challenge.violation.relationId,
      kind,
      germCoordinates,
    });
    return { id, kind, germCoordinates, action, challenge };
  }

  applyCertifiedGerm(germ) {
    const replay = instantiateExactReplayContext(this.#replayContext);
    const event = this.#compileGermWithContext(germ, replay);
    if (this.seen.has(event.id)) {
      return { duplicate: true, stateStutter: true };
    }
    const nextTransport = multiplyMatrices(event.action, this.transport);
    assert.equal(nextTransport.length, this.dimension);

    // Rebuild on a fresh atlas.  Every fallible validation therefore finishes
    // before the live diagram swaps any state component.
    const stagedAtlas = new EndogenousTransportAtlas(replay.groupOracle);
    for (const committedGerm of this.#committedGerms) {
      stagedAtlas.applyChallenge(
        this.#compileGermWithContext(committedGerm, replay).challenge,
      );
    }
    stagedAtlas.applyChallenge(event.challenge);
    const nextSeen = new Set(this.seen);
    nextSeen.add(event.id);
    const nextLog = [...this.log, event.id];
    const committedGerm = freezePlainTree(structuredClone(germ));
    const nextCommittedGerms = Object.freeze([
      ...this.#committedGerms,
      committedGerm,
    ]);

    this.atlas = stagedAtlas;
    this.transport = nextTransport;
    this.seen = nextSeen;
    this.log = nextLog;
    this.#committedGerms = nextCommittedGerms;
    return { duplicate: false, stateStutter: false };
  }

  query(input, coordinate) {
    return (applyMatrix(this.transport, input) & bit(coordinate)) === 0n ? 0 : 1;
  }

  orderForgottenCurriculum() {
    return canonicalCurriculum(this.atlas.curriculum());
  }

  snapshot() {
    return {
      orderForgottenCurriculum: this.orderForgottenCurriculum(),
      fullAtlas: this.atlas.snapshot(),
      transport: matrixKey(this.transport),
      seen: [...this.seen].sort(),
      log: [...this.log],
    };
  }
}

function orderedLogControl(events, matrices, dimension) {
  return runHistory(events.map((event) => matrices[event]), dimension);
}

function directDualShearCoordinate({
  order,
  input,
  coordinate,
  splitMask,
  glueMask,
}) {
  const seed = Number((input & bit(0)) !== 0n);
  const field = input & ~bit(0);
  const glueEvaluation = parity(glueMask & field);
  if (coordinate === 0) {
    const seedAfterSplit = seed;
    const fieldAfterSplit = seed === 1 ? field ^ splitMask : field;
    const splitThenGlue = seedAfterSplit ^ parity(glueMask & fieldAfterSplit);
    const glueThenSplit = seed ^ glueEvaluation;
    return order === "split-then-glue" ? splitThenGlue : glueThenSplit;
  }
  const inputBit = Number((field & bit(coordinate)) !== 0n);
  const splitIndicator = Number((splitMask & bit(coordinate)) !== 0n);
  const transportedSeed = order === "split-then-glue"
    ? seed
    : seed ^ glueEvaluation;
  return inputBit ^ (transportedSeed & splitIndicator);
}

function auditDirectGlobalControl({
  splitThenGlue,
  glueThenSplit,
  splitMask,
  glueMask,
  dimension,
}) {
  let coordinateQueries = 0;
  for (let inputCoordinate = 0; inputCoordinate < dimension; inputCoordinate += 1) {
    const input = bit(inputCoordinate);
    for (let coordinate = 0; coordinate < dimension; coordinate += 1) {
      assert.equal(
        directDualShearCoordinate({
          order: "split-then-glue",
          input,
          coordinate,
          splitMask,
          glueMask,
        }),
        Number((applyMatrix(splitThenGlue, input) & bit(coordinate)) !== 0n),
      );
      assert.equal(
        directDualShearCoordinate({
          order: "glue-then-split",
          input,
          coordinate,
          splitMask,
          glueMask,
        }),
        Number((applyMatrix(glueThenSplit, input) & bit(coordinate)) !== 0n),
      );
      coordinateQueries += 2;
    }
  }
  return { basisInputs: dimension, coordinateQueries };
}

export function runObstructionCurvatureGenesis() {
  const exhaustiveSmallSquareAudit = auditSmallRepairSquares();
  const groupOracle = new ExactNonSoficGroupOracle();
  const certificate = compileExpansionLefCertificate(groupOracle);
  const states = NINE_LEAF_CODE_D.map(
    (prefix) => new LeavittRegularState(sWord(prefix), `s_${prefix}`),
  );
  const fixtures = makeFixtures(groupOracle, certificate);

  const splitController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  const glueController = new CertificateXorController({
    certificate,
    groupOracle,
    states,
  });
  const split = splitController.process(fixtures.split);
  const glue = glueController.process(fixtures.glue);
  assert.equal(split.refinementKind, "split");
  assert.equal(glue.refinementKind, "glue");
  assert.equal(split.rawAuditChallengeShortcutUsed, false);
  assert.equal(glue.rawAuditChallengeShortcutUsed, false);

  const splitKeys = split.typedGerm.cells
    .filter((cell) => cell.splitBit === 1)
    .map((cell) => cell.coordinateKey);
  const glueKeys = glue.typedGerm.cells
    .filter((cell) => cell.glueBit === 1)
    .map((cell) => cell.coordinateKey);
  assert(splitKeys.length > 0);
  assert(glueKeys.length > 0);
  assert.equal(splitKeys.length, 6);
  assert.equal(glueKeys.length, 4);

  const basisKeys = [...new Set([
    ...split.typedGerm.cells.map((cell) => cell.coordinateKey),
    ...glue.typedGerm.cells.map((cell) => cell.coordinateKey),
  ])].sort();
  const indexByKey = new Map(basisKeys.map((key, index) => [key, index]));
  const dimension = basisKeys.length + 1;
  const splitMask = maskFromKeys(splitKeys, indexByKey);
  const glueMask = maskFromKeys(glueKeys, indexByKey);
  assert.equal(splitMask & glueMask, 0n);

  const splitAction = splitShear(splitMask, dimension);
  const glueAction = glueShear(glueMask, dimension);
  const identity = identityMatrix(dimension);
  assert.deepEqual(multiplyMatrices(splitAction, splitAction), identity);
  assert.deepEqual(multiplyMatrices(glueAction, glueAction), identity);

  const splitThenGlue = runHistory([splitAction, glueAction], dimension);
  const glueThenSplit = runHistory([glueAction, splitAction], dimension);
  const directGlobalControl = auditDirectGlobalControl({
    splitThenGlue,
    glueThenSplit,
    splitMask,
    glueMask,
    dimension,
  });
  const discrepancy = xorMatrices(splitThenGlue, glueThenSplit);
  const predictedDiscrepancy = predictedSquareDiscrepancy(
    splitMask,
    glueMask,
    dimension,
  );
  assert.deepEqual(discrepancy, predictedDiscrepancy);
  assert.notEqual(matrixKey(splitThenGlue), matrixKey(glueThenSplit));

  // If P=G_g S_s and Q=S_s G_g are the two parallel transports, then
  // Q^{-1}P=P^2 because both elementary shears are involutions.  This loop
  // holonomy is more intrinsic than the coordinate-wise difference P+Q: a
  // change of frame at the common source conjugates it.
  const relativeHolonomy = multiplyMatrices(splitThenGlue, splitThenGlue);
  const holonomyDefect = xorMatrices(relativeHolonomy, identity);
  assert.notDeepEqual(relativeHolonomy, identity);
  assert.deepEqual(
    holonomyDefect,
    multiplyMatrices(splitThenGlue, discrepancy),
  );
  assert.equal(matrixRank(holonomyDefect), matrixRank(discrepancy));
  assert.deepEqual(
    multiplyMatrices(relativeHolonomy, relativeHolonomy),
    identity,
  );
  const transportGroup = generatedMatrixGroup(
    [splitAction, glueAction],
    dimension,
  );
  assert.equal(transportGroup.length, 8);
  const oneUseReducerStates = new Set([
    identity,
    splitAction,
    glueAction,
    splitThenGlue,
    glueThenSplit,
  ].map(matrixKey));
  assert.equal(oneUseReducerStates.size, 5);

  const diagramOptions = {
    certificate,
    groupOracle,
    states,
    basisKeys,
  };
  const splitOnlyDiagram = new ValidatedRepairDiagram(diagramOptions);
  const glueOnlyDiagram = new ValidatedRepairDiagram(diagramOptions);
  const splitGlueDiagram = new ValidatedRepairDiagram(diagramOptions);
  const glueSplitDiagram = new ValidatedRepairDiagram(diagramOptions);
  const compiledSplit = splitOnlyDiagram.compileGerm(split.typedGerm);
  const compiledGlue = glueOnlyDiagram.compileGerm(glue.typedGerm);
  assert.equal(compiledSplit.kind, "split");
  assert.equal(compiledGlue.kind, "glue");
  assert.deepEqual(compiledSplit.action, splitAction);
  assert.deepEqual(compiledGlue.action, glueAction);
  assert.deepEqual(compiledSplit.challenge, split.challenge);
  assert.deepEqual(compiledGlue.challenge, glue.challenge);
  splitOnlyDiagram.applyCertifiedGerm(split.typedGerm);
  glueOnlyDiagram.applyCertifiedGerm(glue.typedGerm);
  splitGlueDiagram.applyCertifiedGerm(split.typedGerm);
  splitGlueDiagram.applyCertifiedGerm(glue.typedGerm);
  glueSplitDiagram.applyCertifiedGerm(glue.typedGerm);
  glueSplitDiagram.applyCertifiedGerm(split.typedGerm);
  assert.deepEqual(
    splitGlueDiagram.orderForgottenCurriculum(),
    glueSplitDiagram.orderForgottenCurriculum(),
  );
  assert.notDeepEqual(
    splitGlueDiagram.atlas.snapshot(),
    glueSplitDiagram.atlas.snapshot(),
  );
  assert.equal(matrixKey(splitGlueDiagram.transport), matrixKey(splitThenGlue));
  assert.equal(matrixKey(glueSplitDiagram.transport), matrixKey(glueThenSplit));

  // Select the downstream task only after both validated histories exist.
  // Any nonzero glue source and split target witnesses the outer-product block.
  const sourceKey = glueKeys[0];
  const targetKey = splitKeys[0];
  const sourceCoordinate = indexByKey.get(sourceKey) + 1;
  const targetCoordinate = indexByKey.get(targetKey) + 1;
  const taskInput = bit(sourceCoordinate);
  const splitThenGlueLabel = splitGlueDiagram.query(
    taskInput,
    targetCoordinate,
  );
  const glueThenSplitLabel = glueSplitDiagram.query(
    taskInput,
    targetCoordinate,
  );
  assert.notEqual(splitThenGlueLabel, glueThenSplitLabel);
  assert.equal(splitThenGlueLabel, 0);
  assert.equal(glueThenSplitLabel, 1);
  const splitThenGlueLogLabel =
    splitGlueDiagram.atlas.snapshot().revisions[0].kind === "glue" ? 1 : 0;
  const glueThenSplitLogLabel =
    glueSplitDiagram.atlas.snapshot().revisions[0].kind === "glue" ? 1 : 0;
  assert.equal(splitThenGlueLogLabel, splitThenGlueLabel);
  assert.equal(glueThenSplitLogLabel, glueThenSplitLabel);
  assert.equal(
    (applyMatrix(splitThenGlue, taskInput) & bit(targetCoordinate)) === 0n
      ? 0
      : 1,
    splitThenGlueLabel,
  );
  assert.equal(
    (applyMatrix(glueThenSplit, taskInput) & bit(targetCoordinate)) === 0n
      ? 0
      : 1,
    glueThenSplitLabel,
  );

  const duplicateSnapshot = splitGlueDiagram.snapshot();
  assert.deepEqual(splitGlueDiagram.applyCertifiedGerm(split.typedGerm), {
    duplicate: true,
    stateStutter: true,
  });
  assert.deepEqual(splitGlueDiagram.snapshot(), duplicateSnapshot);

  const forgedDiagram = new ValidatedRepairDiagram(diagramOptions);
  const partialGerm = structuredClone(split.typedGerm);
  partialGerm.cells = [partialGerm.cells.find((cell) => cell.splitBit === 1)];
  partialGerm.cellCount = 1;
  const forgedSnapshot = forgedDiagram.snapshot();
  assert.throws(
    () => forgedDiagram.applyCertifiedGerm(partialGerm),
  );
  assert.deepEqual(forgedDiagram.snapshot(), forgedSnapshot);
  const wrongDirectoryGerm = structuredClone(split.typedGerm);
  wrongDirectoryGerm.relationDirectoryHash = "0".repeat(64);
  assert.throws(
    () => forgedDiagram.applyCertifiedGerm(wrongDirectoryGerm),
  );
  assert.deepEqual(forgedDiagram.snapshot(), forgedSnapshot);

  // Caller-supplied action fields have no authority: compilation consumes
  // only the validated typed germ and derives the shear internally.
  const callerActionGerm = {
    ...split.typedGerm,
    action: identity,
  };
  assert.deepEqual(
    forgedDiagram.compileGerm(callerActionGerm).action,
    splitAction,
  );

  // Mutation of a source germ after commit cannot alter its internally cloned
  // replay record during a later staged transaction.
  const aliasSafeDiagram = new ValidatedRepairDiagram(diagramOptions);
  const mutableSplitGerm = structuredClone(split.typedGerm);
  aliasSafeDiagram.applyCertifiedGerm(mutableSplitGerm);
  mutableSplitGerm.relationDirectoryHash = "0".repeat(64);
  mutableSplitGerm.cells.length = 0;
  aliasSafeDiagram.applyCertifiedGerm(glue.typedGerm);
  assert.equal(
    matrixKey(aliasSafeDiagram.transport),
    matrixKey(splitGlueDiagram.transport),
  );

  const callerReplay = instantiateExactReplayContext(
    snapshotExactReplayContext(groupOracle, states, certificate),
  );
  const historyStableDiagram = new ValidatedRepairDiagram({
    certificate: callerReplay.certificate,
    groupOracle: callerReplay.groupOracle,
    states: callerReplay.states,
    basisKeys,
  });
  historyStableDiagram.applyCertifiedGerm(split.typedGerm);
  const historicalDiagramRevision = structuredClone(
    historyStableDiagram.atlas.snapshot().revisions[0],
  );
  callerReplay.states[0].element.terms.clear();
  callerReplay.groupOracle.generators.clear();
  historyStableDiagram.atlas.groupOracle.generators.clear();
  historyStableDiagram.committedGerms = [structuredClone(glue.typedGerm)];
  historyStableDiagram.applyCertifiedGerm(glue.typedGerm);
  assert.deepEqual(
    historyStableDiagram.atlas.snapshot().revisions[0],
    historicalDiagramRevision,
  );
  assert.equal(
    matrixKey(historyStableDiagram.transport),
    matrixKey(splitGlueDiagram.transport),
  );

  assert.equal(scoreChallenge(splitOnlyDiagram.atlas, split.challenge, fixtures.split, groupOracle).covered, true);
  assert.equal(scoreChallenge(splitOnlyDiagram.atlas, glue.challenge, fixtures.glue, groupOracle).covered, false);
  assert.equal(scoreChallenge(glueOnlyDiagram.atlas, split.challenge, fixtures.split, groupOracle).covered, false);
  assert.equal(scoreChallenge(glueOnlyDiagram.atlas, glue.challenge, fixtures.glue, groupOracle).covered, true);
  const jointSplitScore = scoreChallenge(
    splitGlueDiagram.atlas,
    split.challenge,
    fixtures.split,
    groupOracle,
  );
  const jointGlueScore = scoreChallenge(
    splitGlueDiagram.atlas,
    glue.challenge,
    fixtures.glue,
    groupOracle,
  );
  assert.equal(jointSplitScore.covered, true);
  assert.equal(jointGlueScore.covered, true);

  const matrices = { split: splitAction, glue: glueAction };
  assert.deepEqual(
    orderedLogControl(["split", "glue"], matrices, dimension),
    splitThenGlue,
  );
  assert.deepEqual(
    orderedLogControl(["glue", "split"], matrices, dimension),
    glueThenSplit,
  );
  const orderBlindKeyA = JSON.stringify(["glue", "split"].sort());
  const orderBlindKeyB = JSON.stringify(["split", "glue"].sort());
  assert.equal(orderBlindKeyA, orderBlindKeyB);

  // If repair polarity is erased and both events use the same triangular
  // direction, the square becomes flat.
  const erasedGlueAsSplit = splitShear(glueMask, dimension);
  const erasedPathA = runHistory([splitAction, erasedGlueAsSplit], dimension);
  const erasedPathB = runHistory([erasedGlueAsSplit, splitAction], dimension);
  assert.deepEqual(erasedPathA, erasedPathB);

  // Relabel every semantic cell and verify conjugacy of the whole square.
  const fullPermutation = [0];
  for (let oldIndex = 1; oldIndex < dimension; oldIndex += 1) {
    fullPermutation.push(dimension - oldIndex);
  }
  const permutation = permutationMatrix(fullPermutation);
  const inverse = permutationMatrix(inversePermutation(fullPermutation));
  const permutedSplitMask = permuteMask(splitMask, fullPermutation);
  const permutedGlueMask = permuteMask(glueMask, fullPermutation);
  const permutedSplit = splitShear(permutedSplitMask, dimension);
  const permutedGlue = glueShear(permutedGlueMask, dimension);
  assert.deepEqual(
    permutedSplit,
    multiplyMatrices(permutation, multiplyMatrices(splitAction, inverse)),
  );
  assert.deepEqual(
    permutedGlue,
    multiplyMatrices(permutation, multiplyMatrices(glueAction, inverse)),
  );
  const permutedDiscrepancy = xorMatrices(
    runHistory([permutedSplit, permutedGlue], dimension),
    runHistory([permutedGlue, permutedSplit], dimension),
  );
  assert.deepEqual(
    permutedDiscrepancy,
    multiplyMatrices(permutation, multiplyMatrices(discrepancy, inverse)),
  );

  const discrepancyNonzeroEntries = discrepancy.reduce(
    (sum, row) => sum + popcount(row),
    0,
  );
  const supportOverlapParity = parity(splitMask & glueMask);
  assert(discrepancyNonzeroEntries > 0);
  assert.equal(supportOverlapParity, 0);
  assert.equal(matrixRank(discrepancy), 1);
  assert.equal(discrepancyNonzeroEntries, 24);

  return {
    schema: "oasis.obstruction-curvature-genesis.v3",
    object:
      "a certificate-instantiated finite transport square under a declared dual-shear compiler",
    certificateInputs: {
      splitCells: split.typedGerm.cellCount,
      splitMismatchCells: splitKeys.length,
      glueCells: glue.typedGerm.cellCount,
      glueMismatchCells: glueKeys.length,
      rawAuditChallengeShortcutUsed: false,
      relationDirectoryDigestBound: true,
      completeAnchorBlocksRequired: true,
      separatelyCertifiedReplayableEvents: true,
      singleEvolvingCriticTrajectoryEstablished: false,
    },
    typedTransport: {
      module:
        "V=F_2 e_* direct-sum F_2[C], with C the semantic relation-anchor coordinate set",
      basisCellCount: basisKeys.length,
      matrixDimension: dimension,
      splitShear:
        "S_s(a,w)=(a,w+a s), where s is the split-defect indicator",
      glueShear:
        "G_g(a,w)=(a+<g,w>,w), where g is the glue-defect indicator",
      splitInvolutive: true,
      glueInvolutive: true,
      transportLawStatus:
        "declared by the experiment and compiled deterministically from repair polarity; not forced by the certificate theorem",
      callerSuppliedActionAccepted: false,
      ambientGeneratedTransportGroup: "D_8",
      ambientGeneratedTransportGroupOrder: transportGroup.length,
      oneUseReducerReachableStateCount: oneUseReducerStates.size,
      minimumIntegerBitsForFiveReachableStates: 3,
      basisPreallocatedFromUnionOfBothFutureGerms: true,
      endogenousQuestionAvailabilityGrowthEstablished: false,
    },
    repairSquare: {
      orderForgottenCurriculaEqual: true,
      fullAtlasSnapshotsEqual: false,
      transportedArrowsEqual: false,
      additiveDiscrepancy:
        "Omega(s,g)=G_g S_s + S_s G_g = diag(<g,s>, s g^T) over F_2",
      supportOverlapParity,
      discrepancyRank: matrixRank(discrepancy),
      discrepancyNonzeroEntries,
      predictedFormulaCheckedExactly: true,
      relativeLoopHolonomyNonidentity: true,
      holonomyDefectRank: matrixRank(holonomyDefect),
      holonomyDefectEqualsLeftTranslatedPathDiscrepancy: true,
      exhaustiveSmallSquareAudit,
    },
    downstreamTask: {
      sourceGlueCoordinate: sourceKey,
      queriedSplitCoordinate: targetKey,
      splitThenGlueLabel,
      glueThenSplitLabel,
      differentLabels: true,
      queryStatus:
        "an auxiliary declared transport-coordinate query, not an independently generated atlas or certificate task",
      interpretation:
        "the query is selected after both replay diagrams exist; their order-forgetting curricula agree but the declared transports answer differently",
    },
    persistentEffects: {
      atlasAndTransportCommittedByFreshStateReducer: true,
      duplicateEventIsStateStutter: true,
      partialGermRejectedBeforeMutation: true,
      wrongDirectoryDigestRejectedBeforeMutation: true,
      committedGermAliasMutationIsolated: true,
      replayOracleAndProbeStatesSnapshottedByValue: true,
      committedGermLogPrivateAndDeeplyFrozen: true,
      historicalRevisionStableUnderCallerAliasMutation: true,
      sameOrderForgottenCurriculumDifferentDiagram: true,
      splitOnlyCoversSplitTask: true,
      splitOnlyLeavesGlueTaskUncovered: true,
      glueOnlyCoversGlueTask: true,
      glueOnlyLeavesSplitTaskUncovered: true,
      jointSplitScore,
      jointGlueScore,
      emulatorActuallyRepaired: false,
      installedAttachmentsRemainViolatedBySourceCritics: true,
    },
    controls: {
      matchedOrderedEventLog:
        "replays the same compiled matrices exactly and is not an independent compiler",
      separatelyImplementedClosedFormControl: directGlobalControl,
      terminalOrderBit:
        "one bit distinguishes the two both-committed orders and answers the displayed query exactly",
      fullAtlasLogAdditionalPersistentBitsForDisplayedQuery: 0,
      orderFreeQuotientAdditionalPersistentBitsForDisplayedQuery: 1,
      fullAtlasLogDecoderCheckedExactly: true,
      finiteGroupControl:
        "the one-use reducer reaches five states (minimum integer width three bits); the ambient generated D_8 closure has eight states",
      orderBlindBag:
        "collides on the two histories and therefore cannot answer both late-bound labels",
      polarityErasure:
        "mapping both certificate types to the split shear makes the square commute and deletes the witness",
      arbitraryTapeBoundary:
        "an ordinary ordered tape stores the same events and wins exactly; no memory or runtime advantage is claimed",
    },
    naturality: {
      transportBasisReindexing:
        "simultaneous permutation of the declared vector-space basis conjugates both shears and the discrepancy",
      reversalPermutationChecked: true,
      fullCertificateCompilerNaturalityEstablished: false,
      laurentSerializationNotUsed: true,
    },
    interpretation: {
      earnedStatement:
        "certificate-instantiated nonzero masks, represented by the declared opposed shears, yield a rank-one distinction forgotten by the order-free curriculum quotient",
      tentativeName:
        "finite obstruction-transport square; certificate-forced curvature remains a conjectural successor",
      diagramNerodeDirection:
        "future equivalence should compare validated extension diagrams with transported attachments, not only their terminal colimit algebra",
    },
    claimBoundary: [
      "the chosen transport law engineers noncommutation for any two nonzero split/glue masks",
      "the one-use reducer has five reachable states; D_8 is the eight-state ambient closure, not its reachable state set",
      "the two challenges are replayed from separate critic fixtures, not generated along one evolving learner trajectory",
      "the atlas installs repair obligations but neither source critic is repaired or made satisfying",
      "the late query belongs to the declared auxiliary transport module, not yet to an independent continuation language",
      "only the order-forgetting curriculum quotient agrees; the full atlas revision logs differ",
      "the full atlas log answers the displayed query with zero extra persistent bits; the one-bit separation is only relative to the deliberately order-free quotient",
      "all transport coordinates and queries are preallocated from the union of both future germs, so this experiment grows no question availability or topology",
      "only vector-basis covariance is proved; full certificate/compiler/refinement naturality is open",
      "this fixed-space finite transducer is exactly simulable by an ordered log, a three-bit five-state reducer, or a one-bit terminal control",
      "it proves path-sensitive auxiliary transport, not compression, prediction, or optimization advantage",
      "the matrix carrier is not claimed nonsofic and no group-nonsofic conclusion is drawn",
      "the discrepancy is a finite nonabelian transport witness, not yet a Hodge class, harmonic representative, or refinement-persistent cohomology class",
      "the installed proof certificate is finite; no unbounded certificate-curvature family is established",
      "no literature novelty or priority claim is made",
    ],
    nextTheorem:
      "derive transport from a fixed natural split/glue semantics without future-specific basis preallocation; charge certificate payload, action bits, query addresses, and continuation length in one cost model; then seek a compatible refinement family whose availability observable and holonomy survive every semantics-preserving gauge and whose fixed-interface suffix residuals grow beyond bounded global programs; only afterward connect finite closure to an effective universal (F_0,epsilon_0) witness",
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runObstructionCurvatureGenesis(), null, 2));
}
