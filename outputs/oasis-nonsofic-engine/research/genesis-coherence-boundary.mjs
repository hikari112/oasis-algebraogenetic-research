import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const STATE_COUNT = 16;
const GROUP_SIZE = 8;

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertExactKeys(value, expected) {
  assert(value && typeof value === "object" && !Array.isArray(value));
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort());
}

function bit(value, index) {
  return (value >> index) & 1;
}

function encodeState(x, y, z, t) {
  for (const value of [x, y, z, t]) assert(value === 0 || value === 1);
  return x | (y << 1) | (z << 2) | (t << 3);
}

function decodeState(state) {
  assert(Number.isInteger(state) && state >= 0 && state < STATE_COUNT);
  return {
    x: bit(state, 0),
    y: bit(state, 1),
    z: bit(state, 2),
    t: bit(state, 3),
  };
}

function permutationFromRule(size, rule) {
  const permutation = Array.from({ length: size }, (_unused, state) => rule(state));
  assertPermutation(permutation, size);
  return permutation;
}

function assertPermutation(permutation, size = permutation.length) {
  assert(Array.isArray(permutation));
  assert.equal(permutation.length, size);
  const seen = new Set();
  for (const image of permutation) {
    assert(Number.isInteger(image) && image >= 0 && image < size);
    seen.add(image);
  }
  assert.equal(seen.size, size);
}

function identityPermutation(size) {
  return Array.from({ length: size }, (_unused, state) => state);
}

// compose(left,right) means left after right: left o right.
function compose(left, right) {
  assert.equal(left.length, right.length);
  return right.map((state) => left[state]);
}

function composeWord(actions, names) {
  assert(Array.isArray(names) && names.length > 0);
  let result = actions[names.at(-1)];
  assert(result);
  for (let index = names.length - 2; index >= 0; index -= 1) {
    const next = actions[names[index]];
    assert(next);
    result = compose(next, result);
  }
  return result;
}

function inverse(permutation) {
  assertPermutation(permutation);
  const answer = Array(permutation.length);
  for (let state = 0; state < permutation.length; state += 1) {
    answer[permutation[state]] = state;
  }
  return answer;
}

function commutator(left, right) {
  return compose(
    left,
    compose(right, compose(inverse(left), inverse(right))),
  );
}

function permutationEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function assertPermutationEqual(left, right) {
  assert.deepEqual(left, right);
}

function fixedPointCount(permutation) {
  return permutation.filter((image, state) => image === state).length;
}

function orbit(generators, seed) {
  const visited = new Set([seed]);
  const queue = [seed];
  while (queue.length > 0) {
    const state = queue.shift();
    for (const generator of generators) {
      const image = generator[state];
      if (!visited.has(image)) {
        visited.add(image);
        queue.push(image);
      }
    }
  }
  return visited;
}

function makeStateCoverFixture() {
  const H = permutationFromRule(STATE_COUNT, (state) => {
    const { x, y, z, t } = decodeState(state);
    return encodeState(x ^ 1, y, z, t);
  });
  const V = permutationFromRule(STATE_COUNT, (state) => {
    const { x, y, z, t } = decodeState(state);
    return encodeState(x, y ^ 1, z ^ x, t);
  });
  const W = permutationFromRule(STATE_COUNT, (state) => {
    const { x, y, z, t } = decodeState(state);
    return encodeState(x, y, z, t ^ z);
  });
  const Z = permutationFromRule(STATE_COUNT, (state) => {
    const { x, y, z, t } = decodeState(state);
    return encodeState(x, y, z ^ 1, t);
  });
  const Q = permutationFromRule(STATE_COUNT, (state) => {
    const { x, y, z, t } = decodeState(state);
    return encodeState(x, y, z, t ^ x);
  });
  const T = permutationFromRule(STATE_COUNT, (state) => {
    const { x, y, z, t } = decodeState(state);
    return encodeState(x, y, z, t ^ 1);
  });
  return { H, V, W, Z, Q, T };
}

function projectedPermutation(permutation) {
  const answer = Array(8);
  for (let base = 0; base < 8; base += 1) {
    const imageAtZero = permutation[base] & 7;
    const imageAtOne = permutation[base | 8] & 7;
    assert.equal(imageAtZero, imageAtOne);
    answer[base] = imageAtZero;
  }
  assertPermutation(answer, 8);
  return answer;
}

function auditRewritePath(actions, words) {
  assert(Array.isArray(words) && words.length >= 2);
  const permutations = words.map((names) => composeWord(actions, names));
  for (const permutation of permutations.slice(1)) {
    assertPermutationEqual(permutation, permutations[0]);
  }
  return {
    steps: words.map((names, index) => ({
      index,
      word: names.join(" "),
      permutationDigest: digest(permutations[index]),
    })),
    commonPermutationDigest: digest(permutations[0]),
  };
}

function auditStateCoverLab(actions) {
  assertExactKeys(actions, ["H", "V", "W", "Z", "Q", "T"]);
  for (const permutation of Object.values(actions)) {
    assertPermutation(permutation, STATE_COUNT);
    assertPermutationEqual(
      compose(permutation, permutation),
      identityPermutation(STATE_COUNT),
    );
  }

  const { H, V, W, Z, Q, T } = actions;
  assertPermutationEqual(compose(V, H), compose(Z, compose(H, V)));
  assertPermutationEqual(compose(W, V), compose(Q, compose(V, W)));
  assertPermutationEqual(compose(W, Z), compose(T, compose(Z, W)));
  assertPermutationEqual(compose(Q, H), compose(T, compose(H, Q)));
  assertPermutationEqual(compose(H, W), compose(W, H));
  assertPermutationEqual(compose(Q, Z), compose(Z, Q));

  for (const generator of [H, V, W, Z, Q]) {
    assertPermutationEqual(compose(T, generator), compose(generator, T));
  }

  const baseH = projectedPermutation(H);
  const baseV = projectedPermutation(V);
  const baseW = projectedPermutation(W);
  assertPermutationEqual(baseW, identityPermutation(8));
  assert.equal(orbit([baseH, baseV], 0).size, 8);
  assert.equal(orbit([H, V, W], 0).size, STATE_COUNT);

  const nestedWZ = commutator(W, Z);
  const nestedQH = commutator(Q, H);
  assertPermutationEqual(nestedWZ, T);
  assertPermutationEqual(nestedQH, T);
  assert.equal(fixedPointCount(T), 0);
  assert(!permutationEqual(T, identityPermutation(STATE_COUNT)));

  const routeA = auditRewritePath(actions, [
    ["W", "V", "H"],
    ["W", "Z", "H", "V"],
    ["T", "Z", "W", "H", "V"],
    ["T", "Z", "H", "W", "V"],
    ["T", "Z", "H", "Q", "V", "W"],
    ["Z", "Q", "H", "V", "W"],
  ]);
  const routeB = auditRewritePath(actions, [
    ["W", "V", "H"],
    ["Q", "V", "W", "H"],
    ["Q", "V", "H", "W"],
    ["Q", "Z", "H", "V", "W"],
    ["Z", "Q", "H", "V", "W"],
  ]);
  assert.equal(routeA.commonPermutationDigest, routeB.commonPermutationDigest);
  const routeAFinal = composeWord(actions, routeA.steps.at(-1).word.split(" "));
  const routeBFinal = composeWord(actions, routeB.steps.at(-1).word.split(" "));
  const reorderMismatch = compose(routeAFinal, inverse(routeBFinal));
  assertPermutationEqual(reorderMismatch, identityPermutation(STATE_COUNT));

  return {
    status:
      "gauge-chosen nested transport defect with exact three-generator reorder coherence",
    stateCount: STATE_COUNT,
    localizedOrbitStateCount: 8,
    newContinuationWDeclared: true,
    zOriginChosenByVoltage: true,
    attachmentGaugeNaturalUnderZTranslation: false,
    actionsTotalAndInvolutive: true,
    localizedHVOrbitTransitive: true,
    fullHVWOrbitTransitive: true,
    exactRelations: {
      VH: "Z H V",
      WV: "Q V W",
      WZ: "T Z W",
      QH: "T H Q",
      HW: "W H",
      TCentral: true,
    },
    nestedTransportDefect: {
      commutatorWZEqualsT: true,
      commutatorQHEqualsT: true,
      tDeckTransformationNonidentity: true,
      tFixedPoints: fixedPointCount(T),
      tPermutationDigest: digest(T),
    },
    reorderAudit: {
      routeA,
      routeB,
      commonNormalForm: "Z Q H V W",
      completePathsEqual: true,
      reorderMismatchIdentity: true,
      literalReorderAssociatorMismatchNonzero: false,
    },
    actionTableDigest: digest(actions),
  };
}

function omegaFormula(g, h, k) {
  return bit(g, 0) & bit(h, 1) & bit(k, 2);
}

function omegaIndex(g, h, k) {
  return (g * GROUP_SIZE + h) * GROUP_SIZE + k;
}

function makeOmegaTable() {
  return Array.from(
    { length: GROUP_SIZE ** 3 },
    (_unused, index) => {
      const g = Math.floor(index / (GROUP_SIZE ** 2));
      const h = Math.floor(index / GROUP_SIZE) % GROUP_SIZE;
      const k = index % GROUP_SIZE;
      return omegaFormula(g, h, k);
    },
  );
}

function omegaAt(table, g, h, k) {
  return table[omegaIndex(g, h, k)];
}

function deltaThree(table, g, h, k, ell) {
  return (
    omegaAt(table, h, k, ell) ^
    omegaAt(table, g ^ h, k, ell) ^
    omegaAt(table, g, h ^ k, ell) ^
    omegaAt(table, g, h, k ^ ell) ^
    omegaAt(table, g, h, k)
  );
}

function pairKey(g, h) {
  return `${g},${h}`;
}

function toggleMapCoefficient(map, key) {
  const next = (map.get(key) ?? 0) ^ 1;
  if (next === 0) map.delete(key);
  else map.set(key, next);
}

function boundaryOfBarTriple(g, h, k) {
  return [
    [h, k],
    [g ^ h, k],
    [g, h ^ k],
    [g, h],
  ];
}

const XI_TERMS = Object.freeze([
  [1, 2, 4],
  [1, 4, 2],
  [2, 1, 4],
  [2, 4, 1],
  [4, 1, 2],
  [4, 2, 1],
]);

function auditXiBoundary() {
  const boundary = new Map();
  for (const [g, h, k] of XI_TERMS) {
    for (const [left, right] of boundaryOfBarTriple(g, h, k)) {
      assert(left !== 0 && right !== 0);
      toggleMapCoefficient(boundary, pairKey(left, right));
    }
  }
  assert.equal(boundary.size, 0);
  return {
    terms: XI_TERMS.map((term) => [...term]),
    termCount: XI_TERMS.length,
    residualBoundaryTerms: boundary.size,
    isCycle: true,
  };
}

function xiPairing(table) {
  let value = 0;
  for (const [g, h, k] of XI_TERMS) value ^= omegaAt(table, g, h, k);
  return value;
}

function normalizedTwoVariableIndex(g, h) {
  if (g === 0 || h === 0) return null;
  return (g - 1) * (GROUP_SIZE - 1) + (h - 1);
}

function toggleRowVariable(row, g, h) {
  const index = normalizedTwoVariableIndex(g, h);
  return index === null ? row : row ^ (1n << BigInt(index));
}

function twoCoboundaryCoefficientRow(g, h, k) {
  let row = 0n;
  row = toggleRowVariable(row, h, k);
  row = toggleRowVariable(row, g ^ h, k);
  row = toggleRowVariable(row, g, h ^ k);
  row = toggleRowVariable(row, g, h);
  return row;
}

function highestSetBit(word) {
  assert(word > 0n);
  return word.toString(2).length - 1;
}

function gf2Rank(rows) {
  const pivots = new Map();
  for (const original of rows) {
    let row = original;
    while (row !== 0n) {
      const pivot = highestSetBit(row);
      if (pivots.has(pivot)) row ^= pivots.get(pivot);
      else {
        pivots.set(pivot, row);
        break;
      }
    }
  }
  return pivots.size;
}

function coboundaryLinearAudit(table) {
  const variableCount = (GROUP_SIZE - 1) ** 2;
  const coefficientRows = [];
  const augmentedRows = [];
  for (let g = 0; g < GROUP_SIZE; g += 1) {
    for (let h = 0; h < GROUP_SIZE; h += 1) {
      for (let k = 0; k < GROUP_SIZE; k += 1) {
        const coefficients = twoCoboundaryCoefficientRow(g, h, k);
        const rightHandSide = omegaAt(table, g, h, k);
        coefficientRows.push(coefficients);
        augmentedRows.push(
          coefficients | (BigInt(rightHandSide) << BigInt(variableCount)),
        );
      }
    }
  }
  const coefficientRank = gf2Rank(coefficientRows);
  const augmentedRank = gf2Rank(augmentedRows);
  return {
    normalizedTwoCochainVariables: variableCount,
    equations: coefficientRows.length,
    coefficientRank,
    augmentedRank,
    consistent: coefficientRank === augmentedRank,
  };
}

function makeNormalizedBetaTable() {
  const table = Array(GROUP_SIZE ** 2).fill(0);
  table[1 * GROUP_SIZE + 2] = 1;
  return table;
}

function betaAt(table, g, h) {
  return table[g * GROUP_SIZE + h];
}

function deltaBetaTable(beta) {
  return Array.from({ length: GROUP_SIZE ** 3 }, (_unused, index) => {
    const g = Math.floor(index / (GROUP_SIZE ** 2));
    const h = Math.floor(index / GROUP_SIZE) % GROUP_SIZE;
    const k = index % GROUP_SIZE;
    return (
      betaAt(beta, h, k) ^
      betaAt(beta, g ^ h, k) ^
      betaAt(beta, g, h ^ k) ^
      betaAt(beta, g, h)
    );
  });
}

function auditCayleyContinuation() {
  const translations = [1, 2, 4].map((direction) =>
    permutationFromRule(GROUP_SIZE, (state) => state ^ direction),
  );
  assert.equal(orbit(translations, 0).size, GROUP_SIZE);
  return {
    generators: ["e_H", "e_V", "e_W"],
    totalInvolutions: true,
    orbitSize: GROUP_SIZE,
    transitive: true,
  };
}

function auditBarLab(table) {
  assert(Array.isArray(table));
  assert.equal(table.length, GROUP_SIZE ** 3);
  for (const value of table) assert(value === 0 || value === 1);

  let normalizedChecks = 0;
  let pentagonChecks = 0;
  for (let g = 0; g < GROUP_SIZE; g += 1) {
    for (let h = 0; h < GROUP_SIZE; h += 1) {
      for (let k = 0; k < GROUP_SIZE; k += 1) {
        if (g === 0 || h === 0 || k === 0) {
          assert.equal(omegaAt(table, g, h, k), 0);
          normalizedChecks += 1;
        }
        for (let ell = 0; ell < GROUP_SIZE; ell += 1) {
          assert.equal(deltaThree(table, g, h, k, ell), 0);
          pentagonChecks += 1;
        }
      }
    }
  }

  const xi = auditXiBoundary();
  const pairing = xiPairing(table);
  assert.equal(pairing, 1);
  const linearAudit = coboundaryLinearAudit(table);
  assert.equal(linearAudit.consistent, false);
  assert.equal(linearAudit.augmentedRank, linearAudit.coefficientRank + 1);

  const beta = makeNormalizedBetaTable();
  const exactControl = deltaBetaTable(beta);
  assert(exactControl.some((value) => value === 1));
  for (let g = 0; g < GROUP_SIZE; g += 1) {
    for (let h = 0; h < GROUP_SIZE; h += 1) {
      for (let k = 0; k < GROUP_SIZE; k += 1) {
        for (let ell = 0; ell < GROUP_SIZE; ell += 1) {
          assert.equal(deltaThree(exactControl, g, h, k, ell), 0);
        }
      }
    }
  }
  assert.equal(xiPairing(exactControl), 0);
  const exactLinearAudit = coboundaryLinearAudit(exactControl);
  assert.equal(exactLinearAudit.consistent, true);

  return {
    status: "independent abstract categorical-group associator with nontrivial normalized F2 class",
    group: {
      objectGroup: "F2^3",
      objectCount: GROUP_SIZE,
      coefficientGroup: "F2 with trivial action",
      continuation: auditCayleyContinuation(),
    },
    cocycle: {
      formula: "omega(g,h,k)=g_H h_V k_W",
      normalizedChecks,
      exhaustivePentagonChecks: pentagonChecks,
      deltaOmegaZero: true,
      omegaAtEH_EV_EW: omegaAt(table, 1, 2, 4),
      tableDigest: digest(table),
    },
    cycleWitness: {
      ...xi,
      pairing,
      pairingNonzero: true,
    },
    normalizedCoboundarySolve: {
      ...linearAudit,
      omegaIsNormalizedTwoCoboundary: false,
    },
    exactCoboundaryControl: {
      nonzeroExactThreeCochain: true,
      deltaSquaredZero: true,
      xiPairing: xiPairing(exactControl),
      solverRecognizesCoboundary: exactLinearAudit.consistent,
      coefficientRank: exactLinearAudit.coefficientRank,
      augmentedRank: exactLinearAudit.augmentedRank,
    },
  };
}

function auditPayload(payload) {
  assertExactKeys(payload, ["stateCoverActions", "omegaTable"]);
  const stateCover = auditStateCoverLab(payload.stateCoverActions);
  const higherAssociator = auditBarLab(payload.omegaTable);
  return {
    stateCover,
    higherAssociator,
    theoremBoundary: {
      declaredStateActionNestedTransportDefect: true,
      stateCoverNestedCommutatorNontrivial: true,
      literalStateMapReorderMismatchNontrivial: false,
      thirdAttachmentGaugeNatural: false,
      derivationOfOmegaFromStateCoverEstablished: false,
      omegaSuppliedIndependently: true,
      categoricalEmbeddingIntoGenesisBuilt: false,
      preciseBoundary:
        "literal composition in this declared gauge-chosen action supplies the compensating reorder face; these laboratories do not derive or embed the abstract skeletal categorical-group associator as a genesis comparison layer",
      nonSoficityEstablished: false,
      hodgeTheoryEstablished: false,
    },
  };
}

function certificateDigest(certificate) {
  return digest({
    schema: certificate.schema,
    payloadDigest: certificate.payloadDigest,
    auditDigest: certificate.auditDigest,
  });
}

function makeCertificate() {
  const payload = {
    stateCoverActions: makeStateCoverFixture(),
    omegaTable: makeOmegaTable(),
  };
  const audit = auditPayload(payload);
  const certificate = {
    schema: "oasis.genesis-coherence-boundary.certificate.v1",
    payload,
    payloadDigest: digest(payload),
    auditDigest: digest(audit),
    certificateDigest: "",
  };
  certificate.certificateDigest = certificateDigest(certificate);
  return certificate;
}

function replayCertificate(certificate) {
  assertExactKeys(certificate, [
    "schema",
    "payload",
    "payloadDigest",
    "auditDigest",
    "certificateDigest",
  ]);
  assert.equal(certificate.schema, "oasis.genesis-coherence-boundary.certificate.v1");
  assert.equal(certificate.payloadDigest, digest(certificate.payload));
  assert.equal(certificate.certificateDigest, certificateDigest(certificate));
  const audit = auditPayload(certificate.payload);
  assert.equal(certificate.auditDigest, digest(audit));
  return {
    audit,
    replayDigest: digest({
      payloadDigest: certificate.payloadDigest,
      auditDigest: certificate.auditDigest,
      certificateDigest: certificate.certificateDigest,
    }),
  };
}

function resealWithoutReauditing(certificate) {
  certificate.payloadDigest = digest(certificate.payload);
  certificate.certificateDigest = certificateDigest(certificate);
}

function expectReplayRejection(certificate) {
  let rejected = false;
  try {
    replayCertificate(certificate);
  } catch {
    rejected = true;
  }
  assert(rejected);
  return rejected;
}

function auditTampering(certificate) {
  const digestTamper = cloneJson(certificate);
  digestTamper.payload.stateCoverActions.W[0] ^= 8;

  const semanticStateTamper = cloneJson(certificate);
  semanticStateTamper.payload.stateCoverActions.W = identityPermutation(STATE_COUNT);
  resealWithoutReauditing(semanticStateTamper);

  const semanticCocycleTamper = cloneJson(certificate);
  semanticCocycleTamper.payload.omegaTable[omegaIndex(1, 2, 4)] ^= 1;
  resealWithoutReauditing(semanticCocycleTamper);

  const cases = {
    digestTamperRejected: expectReplayRejection(digestTamper),
    checksumAwareStateTamperRejected: expectReplayRejection(semanticStateTamper),
    checksumAwareCocycleTamperRejected: expectReplayRejection(semanticCocycleTamper),
  };
  return {
    attempted: Object.keys(cases).length,
    rejected: Object.values(cases).filter(Boolean).length,
    allRejected: Object.values(cases).every(Boolean),
    cases,
  };
}

export function runGenesisCoherenceBoundary(options = {}) {
  const includeCertificate = options.includeCertificate ?? false;
  assert.equal(typeof includeCertificate, "boolean");
  const certificate = makeCertificate();
  const firstReplay = replayCertificate(certificate);
  const secondReplay = replayCertificate(certificate);
  assert.equal(firstReplay.replayDigest, secondReplay.replayDigest);
  assert.equal(digest(firstReplay.audit), digest(secondReplay.audit));
  const rebuilt = makeCertificate();
  assert.equal(rebuilt.certificateDigest, certificate.certificateDigest);
  const tamper = auditTampering(certificate);

  return {
    schema: "oasis.genesis-coherence-boundary.v1",
    status:
      "gauge-chosen state-map coherence boundary separated from an independent categorical-group associator",
    labs: {
      A_stateCover: firstReplay.audit.stateCover,
      B_higherAssociator: firstReplay.audit.higherAssociator,
    },
    deterministicReplay: {
      replayedExactlyTwice: true,
      independentlyRebuiltCertificateMatches: true,
      payloadDigest: certificate.payloadDigest,
      auditDigest: certificate.auditDigest,
      certificateDigest: certificate.certificateDigest,
      replayDigest: firstReplay.replayDigest,
    },
    tamper,
    theoremBoundary: firstReplay.audit.theoremBoundary,
    ...(includeCertificate ? { certificate } : {}),
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const includeCertificate = process.argv.includes("--certificate");
  console.log(
    JSON.stringify(runGenesisCoherenceBoundary({ includeCertificate }), null, 2),
  );
}
