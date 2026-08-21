import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

function support(values = []) {
  const result = new Set();
  for (const value of values) {
    assert(Number.isInteger(value), "Laurent exponents must be integers");
    if (result.has(value)) result.delete(value);
    else result.add(value);
  }
  return result;
}

function sortedExponents(polynomial) {
  return [...polynomial].sort((left, right) => left - right);
}

function polynomialKey(polynomial) {
  return sortedExponents(polynomial).join(",");
}

function polynomialExpression(polynomial) {
  const exponents = sortedExponents(polynomial);
  if (exponents.length === 0) return "0";
  return exponents.map((exponent) => {
    if (exponent === 0) return "1";
    if (exponent === 1) return "z";
    return `z^${exponent}`;
  }).join("+");
}

function xorPolynomial(left, right) {
  return support([...left, ...right]);
}

function shiftPolynomial(polynomial, amount) {
  assert(Number.isInteger(amount));
  return new Set([...polynomial].map((exponent) => exponent + amount));
}

function coefficient(polynomial, exponent) {
  return polynomial.has(exponent) ? 1 : 0;
}

function normalizedStep(polynomial, action) {
  if (action === "a") return shiftPolynomial(polynomial, -1);
  if (action === "aInv") return shiftPolynomial(polynomial, 1);
  if (action === "q") return xorPolynomial(polynomial, support([0]));
  throw new Error(`Unknown Laurent action: ${action}`);
}

function runNormalized(word, initial = support()) {
  let polynomial = new Set(initial);
  for (const action of word) polynomial = normalizedStep(polynomial, action);
  return polynomial;
}

// Q_p A^k = [[z^k,p],[0,1]].  The pair (p,k) is the exact transport
// normal form before normalizing to the current frame r=z^(-k)p.
function transportStep(state, action) {
  if (action === "a") return { p: new Set(state.p), k: state.k + 1 };
  if (action === "aInv") return { p: new Set(state.p), k: state.k - 1 };
  if (action === "q") {
    return {
      p: xorPolynomial(state.p, support([state.k])),
      k: state.k,
    };
  }
  throw new Error(`Unknown transport action: ${action}`);
}

function runTransport(word, initial = { p: support(), k: 0 }) {
  let state = { p: new Set(initial.p), k: initial.k };
  for (const action of word) state = transportStep(state, action);
  return state;
}

function normalizedFromTransport(state) {
  return shiftPolynomial(state.p, -state.k);
}

function multiplyTransport(left, right) {
  return {
    p: xorPolynomial(left.p, shiftPolynomial(right.p, left.k)),
    k: left.k + right.k,
  };
}

function matrixKey(state) {
  return `[[z^${state.k},${polynomialKey(state.p)}],[0,1]]`;
}

function enumerateWords(alphabet, maximumLength, visit) {
  function recurse(prefix, remaining) {
    visit(prefix);
    if (remaining === 0) return;
    for (const action of alphabet) recurse([...prefix, action], remaining - 1);
  }
  recurse([], maximumLength);
}

function conjugateToggleWord(exponent) {
  const forward = exponent >= 0 ? "a" : "aInv";
  const backward = exponent >= 0 ? "aInv" : "a";
  const count = Math.abs(exponent);
  return [
    ...Array(count).fill(forward),
    "q",
    ...Array(count).fill(backward),
  ];
}

function compilePolynomial(polynomial) {
  return sortedExponents(polynomial).flatMap(conjugateToggleWord);
}

function scanWord(mask, bitCount) {
  const word = [];
  for (let index = 0; index < bitCount; index += 1) {
    if ((mask & (2 ** index)) !== 0) word.push("q");
    word.push("aInv");
  }
  return word;
}

function separatingShift(left, right) {
  const difference = xorPolynomial(left, right);
  assert(difference.size > 0);
  const exponent = sortedExponents(difference)[0];
  if (exponent > 0) return Array(exponent).fill("a");
  if (exponent < 0) return Array(-exponent).fill("aInv");
  return [];
}

function output(polynomial) {
  return coefficient(polynomial, 0);
}

export function compileBitTapeToLaurent(bits) {
  assert(Array.isArray(bits));
  const word = [];
  bits.forEach((bit, exponent) => {
    assert(bit === 0 || bit === 1, "A Laurent obstruction tape must be binary");
    if (bit === 1) word.push(...conjugateToggleWord(exponent));
  });
  const polynomial = runNormalized(word);
  const exponents = sortedExponents(polynomial);
  assert.deepEqual(
    exponents,
    bits.flatMap((bit, exponent) => bit === 1 ? [exponent] : []),
  );
  return {
    exponents,
    localShearActionCount: word.length,
  };
}

export function queryLaurentTapeCoefficient(exponents, exponent) {
  assert(Array.isArray(exponents));
  assert(Number.isInteger(exponent));
  const polynomial = support(exponents);
  const suffix = exponent > 0
    ? Array(exponent).fill("a")
    : Array(-exponent).fill("aInv");
  return output(runNormalized(suffix, polynomial));
}

function supportWindow(halfWidth) {
  return Array.from(
    { length: 2 * halfWidth + 1 },
    (_, index) => index - halfWidth,
  );
}

function enumerateWindowPolynomials(halfWidth) {
  const exponents = supportWindow(halfWidth);
  return Array.from({ length: 2 ** exponents.length }, (_, mask) =>
    support(exponents.filter((_, index) => (mask & (2 ** index)) !== 0)));
}

function auditNormalForms(maximumLength) {
  let wordsChecked = 0;
  const matrixToNormal = new Map();
  enumerateWords(["a", "aInv", "q"], maximumLength, (word) => {
    const transport = runTransport(word);
    const normalized = runNormalized(word);
    assert.equal(
      polynomialKey(normalizedFromTransport(transport)),
      polynomialKey(normalized),
    );
    const key = matrixKey(transport);
    const normalKey = `${transport.k}|${polynomialKey(transport.p)}`;
    if (matrixToNormal.has(key)) {
      assert.equal(matrixToNormal.get(key), normalKey);
    } else {
      matrixToNormal.set(key, normalKey);
    }
    wordsChecked += 1;
  });
  return {
    maximumWordLength: maximumLength,
    wordsChecked,
    distinctMatrixNormalForms: matrixToNormal.size,
  };
}

function auditReachabilityAndResiduals(halfWidth) {
  const polynomials = enumerateWindowPolynomials(halfWidth);
  for (const polynomial of polynomials) {
    const word = compilePolynomial(polynomial);
    assert.equal(polynomialKey(runNormalized(word)), polynomialKey(polynomial));
    assert.equal(runTransport(word).k, 0);
  }

  let pairCertificates = 0;
  let maximumSeparatingSuffixLength = 0;
  for (let left = 0; left < polynomials.length; left += 1) {
    for (let right = left + 1; right < polynomials.length; right += 1) {
      const suffix = separatingShift(polynomials[left], polynomials[right]);
      const leftOutput = output(runNormalized(suffix, polynomials[left]));
      const rightOutput = output(runNormalized(suffix, polynomials[right]));
      assert.notEqual(leftOutput, rightOutput);
      maximumSeparatingSuffixLength = Math.max(
        maximumSeparatingSuffixLength,
        suffix.length,
      );
      pairCertificates += 1;
    }
  }
  return {
    exponentWindow: [-halfWidth, halfWidth],
    reachablePolynomials: polynomials.length,
    pairwiseResidualCertificates: pairCertificates,
    maximumSeparatingSuffixLength,
  };
}

function auditResidualGrowth(maximumBits) {
  const rows = [];
  for (let bitCount = 1; bitCount <= maximumBits; bitCount += 1) {
    const states = new Set();
    let maximumWordLength = 0;
    for (let mask = 0; mask < 2 ** bitCount; mask += 1) {
      const word = scanWord(mask, bitCount);
      maximumWordLength = Math.max(maximumWordLength, word.length);
      states.add(polynomialKey(runNormalized(word)));
    }
    assert.equal(states.size, 2 ** bitCount);
    assert(maximumWordLength <= 2 * bitCount);
    rows.push({
      encodedBits: bitCount,
      distinctResidualStates: states.size,
      maximumActionLength: maximumWordLength,
      unitIncrementOneCounterUpperBoundAtLength2N: 4 * bitCount + 1,
    });
  }
  return rows;
}

// Independent matched baseline: encode Laurent coefficients into a fixed
// BigInt window.  On the audited horizon it performs exactly the same shifts
// and toggle as the sparse-set carrier.
function auditMatchedBitTape(maximumLength, offset = 24) {
  const toggle = 1n << BigInt(offset);
  const mask = (1n << BigInt(2 * offset + 1)) - 1n;
  let comparisons = 0;
  enumerateWords(["a", "aInv", "q"], maximumLength, (word) => {
    let tape = 0n;
    for (const action of word) {
      if (action === "a") tape >>= 1n;
      else if (action === "aInv") tape = (tape << 1n) & mask;
      else tape ^= toggle;
    }
    const polynomial = runNormalized(word);
    let decoded = 0n;
    for (const exponent of polynomial) {
      const position = exponent + offset;
      assert(position >= 0 && position <= 2 * offset);
      decoded ^= 1n << BigInt(position);
    }
    assert.equal(tape, decoded);
    comparisons += 1;
  });
  return {
    maximumWordLength: maximumLength,
    exactComparisons: comparisons,
    baseline: "matched finite-window BigInt tape",
  };
}

function contextAlpha(context) {
  return { n: context.n + 1, m: context.m };
}

function contextDelta(context) {
  return { n: context.n, m: context.m + 1 };
}

function contextQ(context) {
  return { n: context.n, m: Math.max(context.m, context.n) };
}

function auditEndpointArrowSeparation() {
  const start = { n: 5, m: 2 };
  const catchUp = start.n - start.m;
  const qEndpoint = contextQ(start);
  let deltaEndpoint = { ...start };
  for (let index = 0; index < catchUp; index += 1) {
    deltaEndpoint = contextDelta(deltaEndpoint);
  }
  assert.deepEqual(qEndpoint, deltaEndpoint);

  // The carried germ starts at x_0. q sends it to x_0 XOR y_0, whereas
  // delta fixes every x coordinate. The Boolean point y_0=1 separates them.
  const qGerm = { x: support([0]), y: support([0]) };
  const deltaGerm = { x: support([0]), y: support() };
  assert.notEqual(polynomialKey(qGerm.y), polynomialKey(deltaGerm.y));
  const separatingAssignment = { x0: 0, y0: 1 };
  const qValue = separatingAssignment.x0 ^ separatingAssignment.y0;
  const deltaValue = separatingAssignment.x0;
  assert.notEqual(qValue, deltaValue);

  return {
    startContext: [start.n, start.m],
    sharedEndpoint: [qEndpoint.n, qEndpoint.m],
    qArrowOnX0: "x_0 XOR y_0",
    deltaCatchUpArrowOnX0: "x_0",
    separatingAssignment,
  };
}

function auditCommitAndCylinderExposure(halfWidth) {
  const exponents = supportWindow(halfWidth);
  const committed = new Set(["x_0"]);
  let active = { p: support(), k: 0 };
  let maximumRankIncrease = 0;
  let transportActions = 0;
  function commit(generator) {
    const before = committed.size;
    committed.add(generator);
    maximumRankIncrease = Math.max(maximumRankIncrease, committed.size - before);
  }
  function transport(word) {
    active = runTransport(word, active);
    transportActions += word.length;
  }
  function assertAtBase() {
    assert.equal(active.k, 0);
    assert.equal(active.p.size, 0);
  }

  for (const exponent of exponents) {
    const outwardShift = Array(Math.abs(exponent)).fill(
      exponent >= 0 ? "a" : "aInv",
    );
    const returnShift = Array(Math.abs(exponent)).fill(
      exponent >= 0 ? "aInv" : "a",
    );
    transport(outwardShift);
    assert.equal(active.k, exponent);
    assert.equal(active.p.size, 0);
    commit(`x_${exponent}`);
    transport(returnShift);
    assertAtBase();

    const loop = conjugateToggleWord(exponent);
    transport(loop);
    assert.equal(active.k, 0);
    assert.equal(polynomialKey(active.p), polynomialKey(support([exponent])));
    commit(`x_0 XOR y_${exponent}`);
    // L_j is an involution over F_2.  Applying it again explicitly clears the
    // active shear before the next sequential commit experiment.
    transport(loop);
    assertAtBase();
  }
  assert(maximumRankIncrease <= 1);

  // Once x_0 and x_0 XOR y_j are present, Boolean XOR recovers y_j. Together
  // with every x_j in the window, these recovered coordinates separate all
  // finite cylinder assignments exactly.
  const coordinateCount = 2 * exponents.length;
  const signatures = new Set();
  for (let assignment = 0; assignment < 2 ** coordinateCount; assignment += 1) {
    const bits = Array.from(
      { length: coordinateCount },
      (_, index) => (assignment & (2 ** index)) === 0 ? 0 : 1,
    );
    const xBits = bits.slice(0, exponents.length);
    const yBits = bits.slice(exponents.length);
    const x0 = xBits[exponents.indexOf(0)];
    const committedShearValues = yBits.map((value) => x0 ^ value);
    const recoveredYBits = committedShearValues.map((value) => x0 ^ value);
    assert.deepEqual(recoveredYBits, yBits);
    const recoveredSignature = [...xBits, ...recoveredYBits].join("");
    signatures.add(recoveredSignature);
  }
  assert.equal(signatures.size, 2 ** coordinateCount);

  return {
    cylinderWindow: [-halfWidth, halfWidth],
    coordinateCount,
    exactCylinderAssignmentsSeparated: signatures.size,
    committedGeneratorCount: committed.size,
    maximumGeneratorsAddedByOneCommit: maximumRankIncrease,
    oneSequentialActiveExecution: true,
    activeStateReturnedToBaseAfterEveryCommitPair: true,
    transportActionsIncludingExplicitUndo: transportActions,
    completion:
      "the directed union over all finite windows is the two-sided cylinder algebra, uniformly dense in the continuous Cantor algebra",
  };
}

export function runLaurentHolonomyGenesis() {
  const normalFormAudit = auditNormalForms(8);
  const reachabilityAndResiduals = auditReachabilityAndResiduals(4);
  const residualGrowth = auditResidualGrowth(12);
  const matchedBaseline = auditMatchedBitTape(9);
  const endpointArrowSeparation = auditEndpointArrowSeparation();
  const cylinderExposure = auditCommitAndCylinderExposure(2);

  const aq = runTransport(["a", "q"]);
  const qa = runTransport(["q", "a"]);
  assert.notEqual(matrixKey(aq), matrixKey(qa));
  assert.equal(aq.k, 1);
  assert.equal(polynomialKey(aq.p), "1");
  assert.equal(qa.k, 1);
  assert.equal(polynomialKey(qa.p), "0");

  const sampleP = support([-3, 0, 4]);
  const sampleR = support([-1, 0, 7]);
  const shearProduct = multiplyTransport(
    { p: sampleP, k: 0 },
    { p: sampleR, k: 0 },
  );
  assert.equal(
    polynomialKey(shearProduct.p),
    polynomialKey(xorPolynomial(sampleP, sampleR)),
  );
  assert.equal(shearProduct.k, 0);
  for (let exponent = -12; exponent <= 12; exponent += 1) {
    const conjugated = multiplyTransport(
      multiplyTransport(
        { p: support(), k: exponent },
        { p: support([0]), k: 0 },
      ),
      { p: support(), k: -exponent },
    );
    assert.equal(conjugated.k, 0);
    assert.equal(
      polynomialKey(conjugated.p),
      polynomialKey(support([exponent])),
    );
  }

  // Conjugating q by a frame shift toggles exactly one Laurent monomial.
  for (let exponent = -12; exponent <= 12; exponent += 1) {
    const loop = conjugateToggleWord(exponent);
    const state = runTransport(loop);
    assert.equal(state.k, 0);
    assert.equal(polynomialKey(state.p), polynomialKey(support([exponent])));
  }

  return {
    schema: "oasis.laurent-holonomy-genesis.v1",
    object:
      "one active full framed state (p,k) over the finite-support Laurent module, with a separate one-observable commit into persistent knowledge",
    endpointNoGoAndArrowLift: endpointArrowSeparation,
    algebra: {
      coefficientRing: "F_2[z,z^-1]",
      frameShift: "A=[[z,0],[0,1]]",
      shear: "Q=[[1,1],[0,1]]",
      shearPolynomial: "Q_p=[[1,p],[0,1]]",
      conjugationLaw: "A^k Q A^-k = Q_(z^k)",
      additionLaw: "Q_p Q_r = Q_(p+r)",
      normalForm: "every transport word is uniquely Q_p A^k",
      normalizedGerm: "r=z^-k p",
      transitions: {
        a: "r -> z^-1 r",
        aInverse: "r -> z r",
        q: "r -> r+1",
      },
      fixedOutput: "coefficient of z^0 in r",
      noncommutativeControl: {
        aqTopRight: polynomialExpression(aq.p),
        qaTopRight: polynomialExpression(qa.p),
        unequal: true,
      },
    },
    exactMinimalResidual: {
      quotient: "the full finite-support Laurent module F_2[z,z^-1]",
      interface:
        "pre-commit alphabet {a,a^-1,q} with fixed coefficient-zero output; commit does not descend through (p,k)->z^-k p",
      separator:
        "shift any differing coefficient to exponent zero and read the fixed one-bit output",
      finiteAudit: reachabilityAndResiduals,
    },
    residualGrowth: {
      rows: residualGrowth,
      theorem: "N_res(2N) >= 2^N",
      counterControl:
        "with all compiler/transducer state included in fixed finite control S, d counters, increment bound B, fixed initial configuration, no hidden history tape, and at most C simulator microsteps per source action, radius L has at most |S|(2BCL+1)^d configurations",
      consequence:
        "no constant-distortion exact simulation by any fixed number of bounded-increment counters, whose radius growth is polynomial",
    },
    executableAudits: {
      normalForms: normalFormAudit,
      matchedGlobalBaseline: matchedBaseline,
      cylinderExposure,
    },
    architecture: {
      activeChannel:
        "transport the full framed state (p,k) compositionally; its committed observable is g_(p,k)=x_k XOR p(y)",
      persistentChannel:
        "commit adds at most one full framed observable to the algebra; normalized r=z^-k p alone is insufficient because it forgets k",
      lateBoundReadout:
        "a later coefficient query selects which transported distinction matters",
      noBatchClaim:
        "the q generator is a one-shear update, not an operation that materializes an unbounded coordinate block",
    },
    delayedClassification: {
      multiplication: "(p,k)(r,l)=(p+z^k r,k+l)",
      exactGroup:
        "F_2[z,z^-1]_add semidirect Z = (direct sum over Z of C_2) semidirect Z = the binary lamplighter group C_2 wr Z",
      status:
        "classical automaton-realizable amenable sofic group; the Laurent carrier itself is prior art",
      consequence:
        "infinite Moore residuals at this output interface do not imply nonsoficity of the acting group",
      projectSpecificHypothesis:
        "the typed certificate-XOR -> framed transport -> validated split/glue commit compiler, not the lamplighter carrier alone",
    },
    costBoundary: {
      residualInformation: "2^N residuals carry N bits; those bits are really stored",
      sparseEvaluation: "work proportional to Laurent support size",
      pathEvaluation: "work proportional to transport history unless normalized",
      coefficientQuery:
        "the local action implementation uses |j| frame shifts to read coefficient j; constant-time random access is a different declared primitive",
      matchedBaseline:
        "an equally informed sparse polynomial or bit tape implements the same process exactly",
      candidateBenefit:
        "local compositional transport and late-bound querying, not compression",
    },
    claimBoundary: [
      "this is Moore-nonsofic at the fixed coefficient interface while its acting binary lamplighter group is sofic",
      "the Laurent transport group is established prior art; no novelty claim is made for the project-specific typed compiler",
      "exponential residual-state count means linear information bits, not exponential memory bits",
      "the construction does not beat arbitrary tapes, sparse maps, or unlimited-precision integer encodings",
      "external density follows only after finitely many explicit one-germ commits; it is not a target-synthesis or efficiency theorem",
      "no P-versus-NP, Galois, Hodge, or algebrization consequence is claimed",
    ],
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runLaurentHolonomyGenesis(), null, 2));
}
