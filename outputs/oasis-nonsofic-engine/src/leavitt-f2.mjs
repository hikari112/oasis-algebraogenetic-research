// Exact arithmetic in R = L_F2(1,2).
// A monomial s_alpha t_beta is represented by the pair (alpha, beta).
// The canonical basis uses edge 1 as the distinguished edge:
// s_{a1} t_{b1} = s_a t_b + s_{a0} t_{b0} in characteristic two.

function assertBinaryWord(word, label) {
  if (typeof word !== "string" || /[^01]/.test(word)) {
    throw new Error(`${label} must be a binary word`);
  }
}

function keyOf(alpha, beta) {
  return `${alpha}|${beta}`;
}

function pairOf(key) {
  const separator = key.indexOf("|");
  return [key.slice(0, separator), key.slice(separator + 1)];
}

function toggle(map, key) {
  if (map.has(key)) map.delete(key);
  else map.set(key, 1);
}

function toggleCanonicalPair(map, alpha, beta) {
  if (alpha.endsWith("1") && beta.endsWith("1")) {
    const shorterAlpha = alpha.slice(0, -1);
    const shorterBeta = beta.slice(0, -1);
    toggleCanonicalPair(map, shorterAlpha, shorterBeta);
    toggleCanonicalPair(map, `${shorterAlpha}0`, `${shorterBeta}0`);
    return;
  }
  toggle(map, keyOf(alpha, beta));
}

function multiplyPairs(alpha, beta, gamma, delta) {
  if (gamma.startsWith(beta)) {
    return [alpha + gamma.slice(beta.length), delta];
  }
  if (beta.startsWith(gamma)) {
    return [alpha, delta + beta.slice(gamma.length)];
  }
  return null;
}

export class LeavittF2Element {
  constructor(canonicalTerms = new Map()) {
    this.terms = new Map(canonicalTerms);
  }

  static zero() {
    return new LeavittF2Element();
  }

  static one() {
    return LeavittF2Element.basis("", "");
  }

  static basis(alpha, beta) {
    assertBinaryWord(alpha, "alpha");
    assertBinaryWord(beta, "beta");
    const terms = new Map();
    toggleCanonicalPair(terms, alpha, beta);
    return new LeavittF2Element(terms);
  }

  static fromPairs(pairs) {
    const terms = new Map();
    for (const [alpha, beta] of pairs) {
      assertBinaryWord(alpha, "alpha");
      assertBinaryWord(beta, "beta");
      toggleCanonicalPair(terms, alpha, beta);
    }
    return new LeavittF2Element(terms);
  }

  static generator(name) {
    const generators = {
      "1": ["", ""],
      s0: ["0", ""],
      s1: ["1", ""],
      t0: ["", "0"],
      t1: ["", "1"],
    };
    if (!(name in generators)) throw new Error(`Unknown Leavitt generator: ${name}`);
    return LeavittF2Element.basis(...generators[name]);
  }

  isZero() {
    return this.terms.size === 0;
  }

  add(other) {
    const terms = new Map(this.terms);
    for (const key of other.terms.keys()) toggle(terms, key);
    return new LeavittF2Element(terms);
  }

  multiply(other) {
    const terms = new Map();
    for (const leftKey of this.terms.keys()) {
      const [alpha, beta] = pairOf(leftKey);
      for (const rightKey of other.terms.keys()) {
        const [gamma, delta] = pairOf(rightKey);
        const product = multiplyPairs(alpha, beta, gamma, delta);
        if (product) toggleCanonicalPair(terms, product[0], product[1]);
      }
    }
    return new LeavittF2Element(terms);
  }

  star() {
    const terms = new Map();
    for (const key of this.terms.keys()) {
      const [alpha, beta] = pairOf(key);
      toggleCanonicalPair(terms, beta, alpha);
    }
    return new LeavittF2Element(terms);
  }

  equals(other) {
    if (this.terms.size !== other.terms.size) return false;
    for (const key of this.terms.keys()) if (!other.terms.has(key)) return false;
    return true;
  }

  coefficientByKey(key) {
    return this.terms.has(key) ? 1 : 0;
  }

  coefficient(alpha, beta) {
    const canonical = LeavittF2Element.basis(alpha, beta);
    if (canonical.terms.size !== 1) {
      throw new Error("Requested pair is not a canonical basis monomial");
    }
    return this.coefficientByKey(canonical.terms.keys().next().value);
  }

  support() {
    return [...this.terms.keys()].sort().map((key) => {
      const [alpha, beta] = pairOf(key);
      return { alpha, beta };
    });
  }

  hash() {
    return [...this.terms.keys()].sort().join("+") || "0";
  }

  toJSON() {
    return this.support();
  }

  toString() {
    if (this.isZero()) return "0";
    return this.support().map(({ alpha, beta }) =>
      `s[${alpha || "epsilon"}]t[${beta || "epsilon"}]`).join(" + ");
  }
}

export const LEAVITT_GENERATORS = Object.freeze({
  one: LeavittF2Element.generator("1"),
  s0: LeavittF2Element.generator("s0"),
  s1: LeavittF2Element.generator("s1"),
  t0: LeavittF2Element.generator("t0"),
  t1: LeavittF2Element.generator("t1"),
});

export function sWord(word) {
  assertBinaryWord(word, "s-word");
  return LeavittF2Element.basis(word, "");
}

export function tWord(word) {
  assertBinaryWord(word, "t-word");
  return LeavittF2Element.basis("", word);
}

export function canonicalBasisKey(alpha, beta) {
  const element = LeavittF2Element.basis(alpha, beta);
  if (element.terms.size !== 1) throw new Error("Pair is not canonical");
  return element.terms.keys().next().value;
}

