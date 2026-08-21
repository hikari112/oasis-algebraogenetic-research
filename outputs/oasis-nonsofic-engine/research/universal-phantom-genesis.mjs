import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

function assertBitWord(word) {
  assert(typeof word === "string" && word.length > 0);
  assert(!/[^01]/.test(word));
}

function sectionOffset(length) {
  let offset = 0n;
  for (let width = 1; width < length; width += 1) {
    offset += BigInt(width) * (1n << BigInt(width));
  }
  return offset;
}

// U concatenates every binary word, grouped first by length and then by
// lexicographic order:
//   0 1 | 00 01 10 11 | 000 001 ...
// It is a computable point whose one-sided shift orbit is dense in Cantor
// space, because every finite cylinder word occurs at a computable position.
export function universalCantorBit(position) {
  assert(typeof position === "bigint" && position >= 0n);
  let length = 1;
  let offset = 0n;
  while (true) {
    const sectionWidth = BigInt(length) * (1n << BigInt(length));
    if (position < offset + sectionWidth) {
      const local = position - offset;
      const wordIndex = local / BigInt(length);
      const bitIndex = Number(local % BigInt(length));
      const shift = BigInt(length - bitIndex - 1);
      return Number((wordIndex >> shift) & 1n);
    }
    offset += sectionWidth;
    length += 1;
  }
}

export function compileCantorCylinder(word) {
  assertBitWord(word);
  const value = BigInt(`0b${word}`);
  return sectionOffset(word.length) + BigInt(word.length) * value;
}

export function readUniversalBlock(position, length) {
  assert(Number.isInteger(length) && length >= 0);
  return Array.from(
    { length },
    (_unused, index) => universalCantorBit(position + BigInt(index)),
  ).join("");
}

function finitePrimitive(depth) {
  assert(Number.isInteger(depth) && depth >= 0);
  const potential = Array.from({ length: depth + 2 }, () => 0n);
  for (let index = depth; index >= 0; index -= 1) {
    potential[index] =
      BigInt(universalCantorBit(BigInt(index))) + 2n * potential[index + 1];
  }
  return potential;
}

function weightedCocyclePrefix(depth) {
  let total = 0n;
  for (let index = 0; index <= depth; index += 1) {
    total += BigInt(universalCantorBit(BigInt(index))) << BigInt(index);
  }
  return total;
}

function auditFiniteStokesPrimitives(maxDepth) {
  let recurrenceChecks = 0;
  let telescopingChecks = 0;
  let terminalZeroPrimitiveChanges = 0;
  let previous = null;
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const potential = finitePrimitive(depth);
    for (let index = 0; index <= depth; index += 1) {
      assert.equal(
        potential[index] - 2n * potential[index + 1],
        BigInt(universalCantorBit(BigInt(index))),
      );
      recurrenceChecks += 1;
    }
    assert.equal(potential[0], weightedCocyclePrefix(depth));
    telescopingChecks += 1;
    if (previous && potential[0] !== previous[0]) {
      terminalZeroPrimitiveChanges += 1;
    }
    previous = potential;
  }
  assert(terminalZeroPrimitiveChanges > 0);
  return {
    maxDepth,
    recurrenceChecks,
    telescopingChecks,
    terminalZeroPrimitiveChanges,
  };
}

function auditCylinderUniversality(maxWordLength) {
  let wordsChecked = 0;
  let furthestPosition = 0n;
  for (let length = 1; length <= maxWordLength; length += 1) {
    const count = 1n << BigInt(length);
    for (let value = 0n; value < count; value += 1n) {
      const word = value.toString(2).padStart(length, "0");
      const position = compileCantorCylinder(word);
      assert.equal(readUniversalBlock(position, length), word);
      if (position > furthestPosition) furthestPosition = position;
      wordsChecked += 1;
    }
  }
  return {
    maxWordLength,
    wordsChecked,
    furthestPosition: furthestPosition.toString(),
    cantorMetricErrorBound: `2^-${maxWordLength}`,
  };
}

function laterConstantBitWitness(threshold, bitValue) {
  assert(bitValue === 0 || bitValue === 1);
  for (let length = 1; ; length += 1) {
    const word = String(bitValue).repeat(length);
    const position = compileCantorCylinder(word);
    if (position > BigInt(threshold)) return position;
  }
}

function auditNotEventuallyConstant(maxThreshold) {
  const witnesses = [];
  for (let threshold = 0; threshold <= maxThreshold; threshold += 1) {
    const laterZero = laterConstantBitWitness(threshold, 0);
    const laterOne = laterConstantBitWitness(threshold, 1);
    assert(laterZero > BigInt(threshold));
    assert(laterOne > BigInt(threshold));
    assert.equal(universalCantorBit(laterZero), 0);
    assert.equal(universalCantorBit(laterOne), 1);
    if ([0, 1, 2, 4, 8, 16, 32, 64].includes(threshold)) {
      witnesses.push({
        threshold,
        laterZero: laterZero.toString(),
        laterOne: laterOne.toString(),
      });
    }
  }
  return { maxThreshold, witnesses };
}

export function runUniversalPhantomGenesis() {
  const cylinderAudit = auditCylinderUniversality(9);
  const finiteStokesAudit = auditFiniteStokesPrimitives(128);
  const nonstabilizationAudit = auditNotEventuallyConstant(64);
  const prefixLength = 96;
  const universalPrefix = readUniversalBlock(0n, prefixLength);
  assert(universalPrefix.includes("0"));
  assert(universalPrefix.includes("1"));

  return {
    schema: "oasis.universal-phantom-genesis.v1",
    object:
      "a computable cylinder-universal Cantor point carrying a nonzero derived inverse-limit class",
    externalUniversality: {
      carrier: "Cantor space {0,1}^N with metric d(x,y)=2^(-first difference)",
      program:
        "concatenate every finite binary word by increasing length and lexicographic order",
      compiler:
        "a finite target word is mapped to its exact aligned occurrence in the universal stream",
      theorem:
        "the one-sided shift orbit meets every cylinder set and is therefore dense in Cantor space",
      cylinderAudit,
      universalPrefix,
      probabilityUsed: false,
    },
    internalDerivedObstruction: {
      tower: "Z <-times-2- Z <-times-2- Z <- ...",
      twoTermComplex:
        "d: product_n Z -> product_n Z, d(x)_n=x_n-2*x_(n+1)",
      cocycle: "the universal stream U_n regarded as an integer sequence",
      finiteExactness:
        "for every N, backward substitution with x_(N+1)=0 gives d(x)_n=U_n for 0<=n<=N",
      finiteStokesIdentity:
        "sum_(n=0)^N 2^n U_n = x_0 - 2^(N+1)x_(N+1) = x_0",
      weightedCellularRealization:
        "with boundary partial(e_n)=v_n-2v_(n+1) and c_N=sum 2^n e_n, partial(c_N)=v_0-2^(N+1)v_(N+1)",
      algebraicStokesTheorem:
        "<delta x,c_N>=<x,partial c_N> is exactly the finite telescoping identity",
      finiteStokesAudit,
      finiteAuditBoundary:
        "the terminal-zero change count is diagnostic only; global nonexactness follows from the Z_2/Z argument",
      standardIdentification: "lim^1(Z,times 2) is isomorphic to Z_2/Z",
      nonzeroClassProof:
        "the 2-adic expansion U is neither eventually 0 nor eventually 1, whereas every embedded ordinary integer has one of those two tails",
      nonstabilizationAudit,
      tentativeLocalName: "universal phantom class; derived Stokes residue",
    },
    continuationInterpretation: {
      locallyExecutable: true,
      arbitrarilyDeepRefinementWithoutSemanticReplacement: true,
      everyFiniteTruncationHasAPrimitive: true,
      compatibleGlobalIntegerPrimitiveExists: false,
      noFiniteStageAloneContainsTheDerivedClass: true,
      exactMeaningOfNonnumericalIrrationality:
        "non-finitely-isolated coherence rather than an irrational scalar coefficient",
    },
    collapseControls: {
      finiteTruncationMeansFiniteTowerLengthNotFiniteCarrier: true,
      stageCarrier: "the infinite but finitely presented group Z",
      finiteGroupTowerWarning:
        "every sequential inverse system of finite abelian groups is Mittag-Leffler and has vanishing classical R^1 lim",
      sharedWitnessNotCausalCoupling:
        "density does not generate the imposed inverse tower; it supplies a non-eventually-constant sequence whose class is nonzero",
      arbitraryIntegerSequencesAreFiniteTruncationExact: true,
      fixedQueryLanguage: true,
      endogenousQuestionGenerationEstablished: false,
      directProgramSimulationExists: true,
      shiftSystemIsTheSoficFullShift: true,
      internallyNonsoficEstablished: false,
      hodgeTheoryEstablished: false,
      realHodgeNoGo:
        "tensoring the tower with R makes times-2 invertible and kills this R^1 lim obstruction",
      harmonicTransportDefectForcedByIntegralClass: false,
      aiAdvantageEstablished: false,
      literatureNoveltyEstablished: false,
    },
    nextTheorem:
      "replace the fixed stream by an obstruction-generated availability tower and prove a gauge-invariant comparison theorem from its nonzero derived primitive obstruction to arithmetic, p-adic, or infinite-dimensional harmonic leakage; only then ask whether semantics-forced exact nonsofic transport preserves that class",
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runUniversalPhantomGenesis(), null, 2));
}
