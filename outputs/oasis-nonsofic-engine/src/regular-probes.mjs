import {
  LeavittF2Element,
  canonicalBasisKey,
} from "./leavitt-f2.mjs";

export class LeavittRegularState {
  constructor(element, label = "state") {
    this.element = element;
    this.label = label;
  }
}

export class ExactCoefficientProbe {
  constructor({
    alpha,
    beta,
    leftMultiplier = LeavittF2Element.one(),
    derivationWord = [],
    processHash = LeavittF2Element.one().hash(),
    label = null,
  }) {
    this.alpha = alpha;
    this.beta = beta;
    this.basisKey = canonicalBasisKey(alpha, beta);
    this.leftMultiplier = leftMultiplier;
    this.derivationWord = derivationWord.map((token) => ({ ...token }));
    this.processHash = processHash;
    this.label = label ?? `coeff(${alpha || "epsilon"},${beta || "epsilon"})`;
  }

  evaluateBit(state) {
    return this.leftMultiplier.multiply(state.element).coefficientByKey(this.basisKey);
  }

  evaluateSign(state) {
    return this.evaluateBit(state) ? 1 : -1;
  }

  pullback(evaluatedWord) {
    return new ExactCoefficientProbe({
      alpha: this.alpha,
      beta: this.beta,
      leftMultiplier: this.leftMultiplier.multiply(evaluatedWord.unit.element),
      derivationWord: [...this.derivationWord, ...evaluatedWord.tokens],
      processHash: this.leftMultiplier.multiply(evaluatedWord.unit.element).hash(),
      label: `${evaluatedWord.tokens.map((token) => token.generator).join("*") || "id"}^*${this.label}`,
    });
  }

  hash() {
    return `${this.basisKey}@${this.leftMultiplier.hash()}`;
  }

  toProgramAtom() {
    return {
      alpha: this.alpha,
      beta: this.beta,
      derivationWord: this.derivationWord.map((token) => ({ ...token })),
      processHash: this.leftMultiplier.hash(),
      probeHash: this.hash(),
      label: this.label,
    };
  }
}

