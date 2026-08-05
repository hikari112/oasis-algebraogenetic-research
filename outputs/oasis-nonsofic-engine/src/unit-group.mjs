import {
  LEAVITT_GENERATORS,
  LeavittF2Element,
  sWord,
  tWord,
} from "./leavitt-f2.mjs";

export const NINE_LEAF_CODE_D = Object.freeze([
  "000", "001", "01",
  "1000", "1001", "101",
  "1100", "1101", "111",
]);

function isPrefix(left, right) {
  return right.startsWith(left);
}

export function validatePrefixCode(code) {
  if (!Array.isArray(code) || code.length === 0) throw new Error("Prefix code is empty");
  for (const word of code) {
    if (typeof word !== "string" || /[^01]/.test(word)) throw new Error("Invalid binary prefix");
  }
  for (let i = 0; i < code.length; i += 1) {
    for (let j = i + 1; j < code.length; j += 1) {
      if (isPrefix(code[i], code[j]) || isPrefix(code[j], code[i])) {
        throw new Error("Prefix code is not prefix-incomparable");
      }
    }
  }
  return true;
}

export function validateCompletePrefixCode(code) {
  validatePrefixCode(code);
  const depth = Math.max(...code.map((word) => word.length));
  const kraftNumerator = code.reduce(
    (sum, word) => sum + 2 ** (depth - word.length),
    0,
  );
  if (kraftNumerator !== 2 ** depth) throw new Error("Prefix code is not complete");
  return true;
}

export class LeavittUnit {
  constructor(element, inverseElement, label = "unit", verify = true) {
    this.element = element;
    this.inverseElement = inverseElement;
    this.label = label;
    if (verify) this.assertUnit();
  }

  static identity() {
    return new LeavittUnit(
      LeavittF2Element.one(),
      LeavittF2Element.one(),
      "identity",
      false,
    );
  }

  assertUnit() {
    const one = LeavittF2Element.one();
    if (!this.element.multiply(this.inverseElement).equals(one)) {
      throw new Error(`${this.label} failed right-inverse verification`);
    }
    if (!this.inverseElement.multiply(this.element).equals(one)) {
      throw new Error(`${this.label} failed left-inverse verification`);
    }
    return true;
  }

  multiply(other, label = `(${this.label})*(${other.label})`) {
    return new LeavittUnit(
      this.element.multiply(other.element),
      other.inverseElement.multiply(this.inverseElement),
      label,
      false,
    );
  }

  inverse(label = `(${this.label})^-1`) {
    return new LeavittUnit(this.inverseElement, this.element, label, false);
  }

  equals(other) {
    return this.element.equals(other.element);
  }

  hash() {
    return this.element.hash();
  }
}

export function prefixReplacementUnit(domainCode, rangeCode, label = "prefix-unit") {
  validateCompletePrefixCode(domainCode);
  validateCompletePrefixCode(rangeCode);
  if (domainCode.length !== rangeCode.length) throw new Error("Prefix tables have different sizes");
  const element = LeavittF2Element.fromPairs(
    domainCode.map((source, index) => [rangeCode[index], source]),
  );
  const inverse = LeavittF2Element.fromPairs(
    domainCode.map((source, index) => [source, rangeCode[index]]),
  );
  return new LeavittUnit(element, inverse, label, true);
}

export function elementaryRoot(code, row, column, coefficient, label = null) {
  validatePrefixCode(code);
  if (row === column || !code[row] || !code[column]) {
    throw new Error("Elementary root needs distinct valid row and column indices");
  }
  const nilpotent = sWord(code[row]).multiply(coefficient).multiply(tWord(code[column]));
  const element = LeavittF2Element.one().add(nilpotent);
  return new LeavittUnit(
    element,
    element,
    label ?? `x_${row}_${column}`,
    true,
  );
}

export function cylinderSwap(leftPrefix, rightPrefix, label = null) {
  validatePrefixCode([leftPrefix, rightPrefix]);
  const element = LeavittF2Element.one()
    .add(sWord(leftPrefix).multiply(tWord(leftPrefix)))
    .add(sWord(rightPrefix).multiply(tWord(rightPrefix)))
    .add(sWord(leftPrefix).multiply(tWord(rightPrefix)))
    .add(sWord(rightPrefix).multiply(tWord(leftPrefix)));
  return new LeavittUnit(
    element,
    element,
    label ?? `swap:${leftPrefix}:${rightPrefix}`,
    true,
  );
}

export function supportedPrefixPermutation(domainPrefixes, rangePrefixes, label = null) {
  validatePrefixCode(domainPrefixes);
  validatePrefixCode(rangePrefixes);
  if (domainPrefixes.length !== rangePrefixes.length) {
    throw new Error("Supported prefix permutation has different domain and range sizes");
  }
  const domainSet = [...domainPrefixes].sort().join(",");
  const rangeSet = [...rangePrefixes].sort().join(",");
  if (domainSet !== rangeSet) {
    throw new Error("Supported prefix permutation must permute the same cylinders");
  }
  let element = LeavittF2Element.one();
  let inverse = LeavittF2Element.one();
  for (let index = 0; index < domainPrefixes.length; index += 1) {
    const source = domainPrefixes[index];
    const target = rangePrefixes[index];
    element = element
      .add(sWord(source).multiply(tWord(source)))
      .add(sWord(target).multiply(tWord(source)));
    inverse = inverse
      .add(sWord(target).multiply(tWord(target)))
      .add(sWord(source).multiply(tWord(target)));
  }
  return new LeavittUnit(
    element,
    inverse,
    label ?? `supported-prefix-permutation:${domainPrefixes.join(":")}`,
    true,
  );
}

export function makeNonSoficGenerators() {
  const coefficients = [
    ["1", LEAVITT_GENERATORS.one],
    ["s0", LEAVITT_GENERATORS.s0],
    ["s1", LEAVITT_GENERATORS.s1],
    ["t0", LEAVITT_GENERATORS.t0],
    ["t1", LEAVITT_GENERATORS.t1],
  ];
  const generators = new Map();
  for (let row = 0; row < NINE_LEAF_CODE_D.length; row += 1) {
    for (let column = 0; column < NINE_LEAF_CODE_D.length; column += 1) {
      if (row === column) continue;
      for (const [coefficientName, coefficient] of coefficients) {
        const name = `x:${row}:${column}:${coefficientName}`;
        generators.set(
          name,
          elementaryRoot(NINE_LEAF_CODE_D, row, column, coefficient, name),
        );
      }
    }
  }
  return generators;
}
