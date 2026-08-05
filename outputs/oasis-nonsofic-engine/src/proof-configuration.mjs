import { LEAVITT_GENERATORS, sWord } from "./leavitt-f2.mjs";
import {
  LeavittUnit,
  cylinderSwap,
  elementaryRoot,
  prefixReplacementUnit,
  supportedPrefixPermutation,
} from "./unit-group.mjs";
import { makeThompsonVTwoGeneratorUnits } from "./thompson-v-lef-obstruction.mjs";

export const ALPHA = Object.freeze(["000", "001", "01"]);
export const BETA = Object.freeze(["1000", "1001", "101"]);
export const NU = Object.freeze(["1100", "1101", "111"]);
export const ZETA = Object.freeze(["100", "101", "11"]);
export const D = Object.freeze([...ALPHA, ...BETA, ...NU]);

export function makeContractionUnits() {
  const uRange = [];
  const vRange = [];
  for (let index = 0; index < 3; index += 1) {
    uRange.push(`${ALPHA[index]}0`, `${ALPHA[index]}1`, ZETA[index]);
    vRange.push(`${ALPHA[index]}0`, ZETA[index], `${ALPHA[index]}1`);
  }
  // Reorder from interleaved rows to the source order (alpha block, beta block, nu block).
  const uBySource = [
    uRange[0], uRange[3], uRange[6],
    uRange[1], uRange[4], uRange[7],
    uRange[2], uRange[5], uRange[8],
  ];
  const vBySource = [
    vRange[0], vRange[3], vRange[6],
    vRange[1], vRange[4], vRange[7],
    vRange[2], vRange[5], vRange[8],
  ];
  return {
    u: prefixReplacementUnit(D, uBySource, "u-contraction"),
    v: prefixReplacementUnit(D, vBySource, "v-contraction"),
  };
}

export function makeGammaSampleGenerators() {
  return [
    elementaryRoot(ALPHA, 0, 1, LEAVITT_GENERATORS.one, "gamma:0:1:1"),
    elementaryRoot(ALPHA, 1, 2, LEAVITT_GENERATORS.s0, "gamma:1:2:s0"),
    elementaryRoot(ALPHA, 2, 0, LEAVITT_GENERATORS.t1, "gamma:2:0:t1"),
  ];
}

export function makeGammaGenerators() {
  const coefficients = [
    ["1", LEAVITT_GENERATORS.one],
    ["s0", LEAVITT_GENERATORS.s0],
    ["s1", LEAVITT_GENERATORS.s1],
    ["t0", LEAVITT_GENERATORS.t0],
    ["t1", LEAVITT_GENERATORS.t1],
  ];
  const generators = [];
  for (let row = 0; row < ALPHA.length; row += 1) {
    for (let column = 0; column < ALPHA.length; column += 1) {
      if (row === column) continue;
      for (const [coefficientName, coefficient] of coefficients) {
        generators.push(elementaryRoot(
          ALPHA,
          row,
          column,
          coefficient,
          `gamma:${row}:${column}:${coefficientName}`,
        ));
      }
    }
  }
  return generators;
}

export function makeJSampleGenerators() {
  // These swaps are supported strictly inside beta_1 = 1000.
  return [
    cylinderSwap("10000", "10001", "j:swap-children"),
    cylinderSwap("100000", "100010", "j:swap-grandchildren"),
  ];
}

export function makeThompsonVGenerators(supportPrefix = "1000") {
  const a = cylinderSwap(
    `${supportPrefix}00`,
    `${supportPrefix}01`,
    "j:a=(00 01)",
  );
  const cycleDomain = [
    `${supportPrefix}01`,
    `${supportPrefix}10`,
    `${supportPrefix}11`,
  ];
  const b = supportedPrefixPermutation(
    cycleDomain,
    [cycleDomain[1], cycleDomain[2], cycleDomain[0]],
    "j:b=(01 10 11)",
  );
  const c = cylinderSwap(
    `${supportPrefix}1`,
    `${supportPrefix}00`,
    "j:c=(1 00)",
  );
  return [a, b, c];
}

export function makeThompsonVPresentationGenerators(supportPrefix = "1000") {
  const { u, v } = makeThompsonVTwoGeneratorUnits(supportPrefix);
  return [u, v];
}

function commute(left, right) {
  return left.element.multiply(right.element).equals(
    right.element.multiply(left.element),
  );
}

export function verifyProofConfiguration() {
  const { u, v } = makeContractionUnits();
  const gamma = makeGammaGenerators();
  const j = makeThompsonVPresentationGenerators();
  const commutingPairs = [];
  for (const gammaUnit of gamma) {
    for (const jUnit of j) {
      commutingPairs.push({
        gamma: gammaUnit.label,
        j: jUnit.label,
        commutes: commute(gammaUnit, jUnit),
      });
    }
  }
  const alphaImagesUnderU = ALPHA.map((prefix) =>
    u.element.multiply(sWord(prefix)).hash());
  const alphaImagesUnderV = ALPHA.map((prefix) =>
    v.element.multiply(sWord(prefix)).hash());
  const expected = ALPHA.map((prefix) => sWord(`${prefix}0`).hash());
  return {
    uIsUnit: u.assertUnit(),
    vIsUnit: v.assertUnit(),
    contractionsAgreeOnAlpha:
      alphaImagesUnderU.every((hash, index) => hash === expected[index]) &&
      alphaImagesUnderV.every((hash, index) => hash === expected[index]),
    gammaJCommute: commutingPairs.every((pair) => pair.commutes),
    commutingPairs,
    u,
    v,
    gamma,
    j,
  };
}

export function registerProofConfiguration(groupOracle) {
  const configuration = verifyProofConfiguration();
  if (
    !configuration.uIsUnit ||
    !configuration.vIsUnit ||
    !configuration.contractionsAgreeOnAlpha ||
    !configuration.gammaJCommute
  ) {
    throw new Error("The exact Leavitt proof configuration failed verification");
  }
  const names = {
    u: "proof:contraction:u",
    v: "proof:contraction:v",
    gamma: configuration.gamma.map((_, index) => `proof:gamma:${index}`),
    j: ["proof:j:u", "proof:j:v"],
  };
  groupOracle.registerGenerator(names.u, configuration.u);
  groupOracle.registerGenerator(names.v, configuration.v);
  configuration.gamma.forEach((unit, index) => {
    groupOracle.registerGenerator(names.gamma[index], unit);
  });
  configuration.j.forEach((unit, index) => {
    groupOracle.registerGenerator(names.j[index], unit);
  });
  return { configuration, names };
}

export function proofWord(generator, inverse = false) {
  return [{ generator, inverse }];
}

export function conjugate(unit, by, label = "conjugate") {
  return by.multiply(unit).multiply(by.inverse(), label);
}

export function unitProduct(units, label = "product") {
  return units.reduce(
    (product, unit) => product.multiply(unit),
    new LeavittUnit(
      LEAVITT_GENERATORS.one,
      LEAVITT_GENERATORS.one,
      label,
      false,
    ),
  );
}
