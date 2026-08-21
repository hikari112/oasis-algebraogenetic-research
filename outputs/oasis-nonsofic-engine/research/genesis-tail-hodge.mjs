import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { universalCantorBit } from "./universal-phantom-genesis.mjs";

function assertBits(bits) {
  assert(Array.isArray(bits) && bits.length > 0);
  for (const bit of bits) assert(bit === 0 || bit === 1);
}

export function binaryHodgeEnergy(bits) {
  assertBits(bits);
  const length = BigInt(bits.length);
  const ones = BigInt(bits.reduce((total, bit) => total + bit, 0));
  const numerator = ones * (length - ones);
  const denominator = length * length;
  return {
    length: bits.length,
    ones: Number(ones),
    mean: Number(ones) / bits.length,
    energy: Number(numerator) / Number(denominator),
    exact: `${numerator}/${denominator}`,
    numerator,
    denominator,
  };
}

function pathLaplacian(vector) {
  assert(Array.isArray(vector) && vector.length > 0);
  if (vector.length === 1) return [0];
  return vector.map((value, index) => {
    if (index === 0) return value - vector[1];
    if (index === vector.length - 1) return value - vector[index - 1];
    return 2 * value - vector[index - 1] - vector[index + 1];
  });
}

function auditFinitePathHodge(maxLength) {
  let pathLaplaciansChecked = 0;
  let projectionIdentitiesChecked = 0;
  let dirichletIdentitiesChecked = 0;
  for (let length = 1; length <= maxLength; length += 1) {
    const bits = Array.from({ length }, (_unused, index) =>
      universalCantorBit(BigInt(index)),
    );
    const constants = Array.from({ length }, () => 1);
    assert(pathLaplacian(constants).every((entry) => entry === 0));

    const mean = bits.reduce((total, bit) => total + bit, 0) / length;
    const residual = bits.map((bit) => bit - mean);
    const residualSum = residual.reduce((total, value) => total + value, 0);
    const residualEnergy =
      residual.reduce((total, value) => total + value * value, 0) / length;
    const laplacian = pathLaplacian(bits);
    const laplacianEnergy = bits.reduce(
      (total, value, index) => total + value * laplacian[index],
      0,
    );
    const edgeEnergy = bits
      .slice(1)
      .reduce(
        (total, value, index) =>
          total + (value - bits[index]) * (value - bits[index]),
        0,
      );
    const formula = binaryHodgeEnergy(bits);
    assert(Math.abs(residualSum) < 1e-10);
    assert(Math.abs(residualEnergy - formula.energy) < 1e-12);
    assert.equal(laplacianEnergy, edgeEnergy);
    pathLaplaciansChecked += 1;
    projectionIdentitiesChecked += 1;
    dirichletIdentitiesChecked += 1;
  }
  return {
    maxLength,
    pathLaplaciansChecked,
    projectionIdentitiesChecked,
    dirichletIdentitiesChecked,
    proofBoundary:
      "connectedness plus x^T L x=sum_edges(x_i-x_j)^2 proves that the full kernel is the constant line",
  };
}

function sectionEnd(width) {
  assert(Number.isInteger(width) && width >= 1 && width <= 24);
  return 2 + (width - 1) * 2 ** (width + 1);
}

function universalBits(length) {
  assert(Number.isInteger(length) && length > 0);
  return Array.from({ length }, (_unused, index) =>
    universalCantorBit(BigInt(index)),
  );
}

function auditUniversalDensity(maxWidth) {
  const finalLength = sectionEnd(maxWidth);
  const bits = universalBits(finalLength);
  let ones = 0;
  let currentWidth = 1;
  let nextEnd = sectionEnd(currentWidth);
  let sectionStart = 0;
  let sectionDiscrepancy = 0;
  let prefixBoundsChecked = 0;
  const sectionEndpoints = [];

  for (let index = 0; index < bits.length; index += 1) {
    const signedBit = bits[index] === 1 ? 1 : -1;
    ones += bits[index];
    sectionDiscrepancy += signedBit;

    const positionInSection = index - sectionStart + 1;
    const bound = 2 ** (currentWidth + 1) + currentWidth;
    assert(Math.abs(sectionDiscrepancy) <= bound);
    assert(positionInSection <= currentWidth * 2 ** currentWidth);
    prefixBoundsChecked += 1;

    if (index + 1 === nextEnd) {
      const length = index + 1;
      const numerator = BigInt(ones) * BigInt(length - ones);
      const denominator = BigInt(length) * BigInt(length);
      assert.equal(ones * 2, length);
      assert.equal(4n * numerator, denominator);
      sectionEndpoints.push({
        width: currentWidth,
        length,
        ones,
        energy: "1/4",
      });
      currentWidth += 1;
      if (currentWidth <= maxWidth) {
        sectionStart = index + 1;
        sectionDiscrepancy = 0;
        nextEnd = sectionEnd(currentWidth);
      }
    }
  }

  assert.equal(sectionEndpoints.length, maxWidth);
  return {
    maxWidth,
    finalLength,
    prefixBoundsChecked,
    imbalanceBound:
      "inside the width-m section, |ones-zeros| <= 2^(m+1)+m",
    densityTheorem:
      "completed sections are exactly balanced and the partial-section imbalance divided by the preceding length is O(1/m)",
    sectionEndpoints,
  };
}

function bitsToUnsignedBigInt(bits) {
  assertBits(bits);
  let value = 0n;
  for (let index = 0; index < bits.length; index += 1) {
    if (bits[index] === 1) value |= 1n << BigInt(index);
  }
  return value;
}

function unsignedBigIntToBits(value, width) {
  assert(typeof value === "bigint");
  assert(Number.isInteger(width) && width > 0);
  const normalized = BigInt.asUintN(width, value);
  return Array.from({ length: width }, (_unused, index) =>
    Number((normalized >> BigInt(index)) & 1n),
  );
}

function padicAddInteger(bits, integer) {
  assertBits(bits);
  assert(Number.isSafeInteger(integer));
  return unsignedBigIntToBits(
    bitsToUnsignedBigInt(bits) + BigInt(integer),
    bits.length,
  );
}

function differingIndices(left, right) {
  assertBits(left);
  assertBits(right);
  assert.equal(left.length, right.length);
  const differences = [];
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) differences.push(index);
  }
  return differences;
}

function auditIntegerRepresentativeInvariance(width) {
  const bits = universalBits(width);
  const shifts = [-257, -17, -2, -1, 1, 2, 17, 257];
  const results = [];
  for (const shift of shifts) {
    const shifted = padicAddInteger(bits, shift);
    const differences = differingIndices(bits, shifted);
    assert(differences.length > 0);
    const lastChangedIndex = differences.at(-1);
    assert(lastChangedIndex < 128);

    const baseEnergy = binaryHodgeEnergy(bits);
    const shiftedEnergy = binaryHodgeEnergy(shifted);
    const scaledDifference = Math.abs(baseEnergy.energy - shiftedEnergy.energy);
    assert(scaledDifference <= differences.length / width);
    results.push({
      shift,
      changedDigits: differences.length,
      lastChangedIndex,
      finiteStageEnergyDifference: scaledDifference,
    });
  }
  return {
    width,
    shifts: results,
    proofBoundary:
      "the executable samples fixed shifts; finite-tail descent for every integer shift follows from the carry/borrow proof",
  };
}

function integerPadicBits(integer, width) {
  assert(Number.isSafeInteger(integer));
  return unsignedBigIntToBits(BigInt(integer), width);
}

function sparsePowerOfTwoBits(length) {
  return Array.from({ length }, (_unused, index) =>
    index > 0 && (index & (index - 1)) === 0 ? 1 : 0,
  );
}

function auditDetectionControls(width) {
  assert(width % 4 === 0);
  const zeroClass = [0, 1, -1, 17, -17].map((integer) => {
    const shortEnergy = binaryHodgeEnergy(integerPadicBits(integer, width / 2));
    const longEnergy = binaryHodgeEnergy(integerPadicBits(integer, width));
    assert(longEnergy.energy <= 2 * shortEnergy.energy + 1e-15);
    return {
      integer,
      shortEnergy: shortEnergy.energy,
      longEnergy: longEnergy.energy,
      asymptoticEnergy: 0,
    };
  });

  const alternating = Array.from({ length: width }, (_unused, index) =>
    index % 2,
  );
  const alternatingEnergy = binaryHodgeEnergy(alternating);
  assert.equal(4n * alternatingEnergy.numerator, alternatingEnergy.denominator);

  const sparse = sparsePowerOfTwoBits(width);
  const sparseHalf = sparsePowerOfTwoBits(width / 2);
  const sparseEnergy = binaryHodgeEnergy(sparse);
  const sparseHalfEnergy = binaryHodgeEnergy(sparseHalf);
  assert(sparseEnergy.energy < sparseHalfEnergy.energy);
  assert(sparseEnergy.energy < 0.01);

  const complementaryAlternating = alternating.map((bit) => 1 - bit);
  const complementaryEnergy = binaryHodgeEnergy(complementaryAlternating);
  assert.equal(complementaryEnergy.numerator, alternatingEnergy.numerator);
  assert.equal(complementaryEnergy.denominator, alternatingEnergy.denominator);

  return {
    width,
    zeroClass,
    exactPositiveControl: {
      sequence: "alternating 0,1 digits",
      energy: "1/4",
    },
    falseNegativeControl: {
      sequence: "ones exactly at positive powers of two",
      nonintegerPadicClass: true,
      finiteEnergy: sparseEnergy.energy,
      limitingEnergy: 0,
      conclusion: "tail-Hodge energy is a certificate, not a classifier",
    },
    positiveEnergyNoninjectivityControl: {
      classes: [
        "0101... represents -2/3 in Z_2",
        "1010... represents -1/3 in Z_2",
      ],
      distinctModuloZ: true,
      exactEnergyOfBoth: "1/4",
    },
  };
}

function auditDenseIntegerTranslations(maxExponent) {
  let finiteResiduesChecked = 0;
  for (let exponent = 1; exponent <= maxExponent; exponent += 1) {
    const modulus = 2 ** exponent;
    const reached = new Set();
    for (let integer = 0; integer < modulus; integer += 1) {
      reached.add(integer % modulus);
      finiteResiduesChecked += 1;
    }
    assert.equal(reached.size, modulus);
  }
  return {
    maxExponent,
    finiteResiduesChecked,
    theorem:
      "Z meets every residue class modulo 2^m, so every nonempty open Z-saturated subset of Z_2 is all of Z_2",
    quotientTopology: "indiscrete",
    hausdorffObservableConsequence:
      "every continuous map from Z_2/Z to a Hausdorff space is constant",
  };
}

export function runGenesisTailHodge() {
  const finitePathHodge = auditFinitePathHodge(128);
  const universalDensity = auditUniversalDensity(13);
  const representativeInvariance = auditIntegerRepresentativeInvariance(8192);
  const detectionControls = auditDetectionControls(8192);
  const quotientNoGo = auditDenseIntegerTranslations(12);

  return {
    schema: "oasis.genesis-tail-hodge.v1",
    status:
      "exact one-sided comparison certificate; presentation-sensitive and not an established Hodge theory",
    sourceClass: "[U] in lim^1(Z,times 2) = Z_2/Z",
    topologicalNoGo: quotientNoGo,
    finiteHodgeProbe: {
      stage: "the path graph on N vertices",
      harmonicSector: "constant real zero-cochains",
      projection: "P_N(b)=mean(b)*1",
      energy: "E_N=||(I-P_N)b||_N^2=mu_N*(1-mu_N)",
      loadBearingBoundary:
        "the arithmetic detection enters through nonlinear canonical 2-adic digitization; the degree-zero Hodge operation itself is only projection away from constants and is the same on every connected graph",
      pathGeometryLoadBearing: false,
      finitePathHodge,
    },
    quotientDescent: {
      theorem:
        "adding an ordinary integer changes only finitely many canonical 2-adic digits unless the tail is already eventually constant; hence limsup E_N descends to Z_2/Z",
      representativeInvariance,
      continuity: false,
      reason:
        "the quotient topology is indiscrete, so a nonconstant Hausdorff-valued detector must retain presentation data and be discontinuous on the fossil quotient",
    },
    universalClassCertificate: {
      universalDensity,
      exactLimit: "lim_N E_N([U]) = 1/4",
      zeroClassLimit: "E([integer]) = 0",
      implication: "E([alpha])>0 implies [alpha] is nonzero",
    },
    controls: detectionControls,
    hypothesisLedger: {
      provedHere: [
        "the quotient-topology no-go",
        "finite path-Hodge energy formula",
        "descent under integer representatives",
        "exact energy 1/4 for the universal class",
        "zero energy for every zero class",
        "a sparse nonzero false negative",
      ],
      conjecturedNext: [
        "a certificate-forced genesis process can emit a positive-energy derived class without preallocating its future digits",
        "a canonical continuation phase can lift the fossil quotient into a Hausdorff solenoidal comparison space",
        "a non-sofic semantic action can preserve the comparison certificate after observational quotienting",
      ],
    },
    claimBoundary: {
      completeDerivedClassInvariant: false,
      independentOfDigitPresentation: false,
      continuousOnZ2ModuloZ: false,
      endogenousTowerEstablished: false,
      internallyNonsoficEstablished: false,
      hodgeConjectureImplication: false,
      priorArtAbsenceEstablished: false,
    },
    nextTheorem:
      "construct an obstruction-generated tower whose derived class has a certificate-forced positive tail-Hodge lower bound invariant under the declared semantic gauges and cofinal refinements",
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runGenesisTailHodge(), null, 2));
}
