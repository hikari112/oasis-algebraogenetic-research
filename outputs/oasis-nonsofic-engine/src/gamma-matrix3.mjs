import { LEAVITT_GENERATORS, LeavittF2Element } from "./leavitt-f2.mjs";

const COEFFICIENTS = Object.freeze({
  "1": LEAVITT_GENERATORS.one,
  s0: LEAVITT_GENERATORS.s0,
  s1: LEAVITT_GENERATORS.s1,
  t0: LEAVITT_GENERATORS.t0,
  t1: LEAVITT_GENERATORS.t1,
});

function flipBits(word) {
  return [...word].map((bit) => bit === "0" ? "1" : "0").join("");
}

function transformCoefficient(element, { bitFlip = false, star = false } = {}) {
  const pairs = element.support().map(({ alpha, beta }) => {
    let left = alpha;
    let right = beta;
    if (star) [left, right] = [right, left];
    if (bitFlip) {
      left = flipBits(left);
      right = flipBits(right);
    }
    return [left, right];
  });
  return LeavittF2Element.fromPairs(pairs);
}

export function parseGammaGeneratorLabel(label) {
  const match = /^(?:gamma|sos:gamma):(\d+)(?::(\d+):(1|s0|s1|t0|t1))?$/.exec(label);
  if (!match || match[2] === undefined) {
    throw new Error(`Gamma matrix generator needs a structural label: ${label}`);
  }
  return { row: Number(match[1]), column: Number(match[2]), coefficient: match[3] };
}

export class GammaMatrix3 {
  constructor(entries) {
    if (!Array.isArray(entries) || entries.length !== 3 ||
      entries.some((row) => !Array.isArray(row) || row.length !== 3 ||
        row.some((entry) => !(entry instanceof LeavittF2Element)))) {
      throw new Error("GammaMatrix3 requires a 3-by-3 Leavitt matrix");
    }
    this.entries = entries.map((row) => [...row]);
  }

  static identity() {
    return new GammaMatrix3(Array.from({ length: 3 }, (_, row) =>
      Array.from({ length: 3 }, (_, column) =>
        row === column ? LEAVITT_GENERATORS.one : LeavittF2Element.zero())));
  }

  static elementary(row, column, coefficient) {
    if (row === column || !(row >= 0 && row < 3 && column >= 0 && column < 3)) {
      throw new Error("Invalid elementary matrix indices");
    }
    const matrix = GammaMatrix3.identity().entries;
    matrix[row][column] = coefficient;
    return new GammaMatrix3(matrix);
  }

  multiply(other) {
    const entries = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => LeavittF2Element.zero()));
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        let value = LeavittF2Element.zero();
        for (let middle = 0; middle < 3; middle += 1) {
          value = value.add(this.entries[row][middle].multiply(other.entries[middle][column]));
        }
        entries[row][column] = value;
      }
    }
    return new GammaMatrix3(entries);
  }

  transform({ indexPermutation, bitFlip = false, dagger = false }) {
    const entries = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => LeavittF2Element.zero()));
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const targetRow = indexPermutation[dagger ? column : row];
        const targetColumn = indexPermutation[dagger ? row : column];
        entries[targetRow][targetColumn] = transformCoefficient(
          this.entries[row][column],
          { bitFlip, star: dagger },
        );
      }
    }
    return new GammaMatrix3(entries);
  }

  equals(other) {
    return this.entries.every((row, rowIndex) =>
      row.every((entry, columnIndex) => entry.equals(other.entries[rowIndex][columnIndex])));
  }

  hash() {
    return JSON.stringify(this.entries.flat().map((entry) => entry.hash()));
  }
}

export function gammaMatrixGeneratorsFromUnits(units) {
  return units.map((unit) => {
    const { row, column, coefficient } = parseGammaGeneratorLabel(unit.label);
    return GammaMatrix3.elementary(row, column, COEFFICIENTS[coefficient]);
  });
}

export function evaluateGammaMatrixWord(word, names, generators) {
  const indexByName = new Map(names.map((name, index) => [name, index]));
  let result = GammaMatrix3.identity();
  for (const token of word) {
    const index = indexByName.get(token.generator);
    if (index === undefined) throw new Error(`Unknown Gamma matrix generator: ${token.generator}`);
    // Every configured elementary generator is an involution in characteristic two.
    result = result.multiply(generators[index]);
  }
  return result;
}
