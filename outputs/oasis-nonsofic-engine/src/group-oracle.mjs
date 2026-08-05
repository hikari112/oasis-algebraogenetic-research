import { LeavittUnit, makeNonSoficGenerators } from "./unit-group.mjs";

export const NONSOFIC_THEOREM_METADATA = Object.freeze({
  group: "G = EL_D(L_F2(1,2)) <= L_F2(1,2)^x",
  ambientGroup: "L_F2(1,2)^x",
  result: "G and the ambient unit group are non-sofic",
  source: "OpenAI, A Counterexample to the Soficity Conjecture, Chapter 3",
  definingCode: "D=(000,001,01,1000,1001,101,1100,1101,111)",
});

function normalizeToken(token) {
  if (typeof token === "string") return { generator: token, inverse: false };
  if (!token || typeof token.generator !== "string") throw new Error("Invalid group-word token");
  return { generator: token.generator, inverse: Boolean(token.inverse) };
}

export class ExactNonSoficGroupOracle {
  constructor(generators = makeNonSoficGenerators()) {
    this.generators = new Map(generators);
    this.theorem = NONSOFIC_THEOREM_METADATA;
  }

  registerGenerator(name, unit) {
    if (typeof name !== "string" || name.length === 0) {
      throw new Error("Generator name must be a nonempty string");
    }
    if (!(unit instanceof LeavittUnit)) {
      throw new Error("Registered generator must be an exact Leavitt unit");
    }
    unit.assertUnit();
    const existing = this.generators.get(name);
    if (existing && !existing.equals(unit)) {
      throw new Error(`Generator name already denotes a different unit: ${name}`);
    }
    this.generators.set(name, unit);
    return name;
  }

  generator(name, inverse = false) {
    const unit = this.generators.get(name);
    if (!unit) throw new Error(`Unknown non-sofic group generator: ${name}`);
    return inverse ? unit.inverse(`${name}^-1`) : unit;
  }

  evaluate(word) {
    const tokens = word.map(normalizeToken);
    let unit = LeavittUnit.identity();
    for (const token of tokens) {
      unit = unit.multiply(this.generator(token.generator, token.inverse));
    }
    unit.assertUnit();
    return {
      tokens,
      unit,
      hash: unit.hash(),
      isIdentity: unit.equals(LeavittUnit.identity()),
    };
  }

  inverseWord(word) {
    return [...word].reverse().map((rawToken) => {
      const token = normalizeToken(rawToken);
      return { generator: token.generator, inverse: !token.inverse };
    });
  }

  equalWords(left, right) {
    return this.evaluate(left).unit.equals(this.evaluate(right).unit);
  }

  enumerateWindow(generatorNames, maxDepth = 2, maxElements = 128) {
    for (const name of generatorNames) this.generator(name);
    const identity = this.evaluate([]);
    const byHash = new Map([[identity.hash, identity]]);
    const queue = [identity];
    while (queue.length > 0 && byHash.size < maxElements) {
      const current = queue.shift();
      if (current.tokens.length >= maxDepth) continue;
      for (const name of generatorNames) {
        const next = this.evaluate([...current.tokens, name]);
        if (!byHash.has(next.hash)) {
          byHash.set(next.hash, next);
          queue.push(next);
          if (byHash.size >= maxElements) break;
        }
      }
    }
    return [...byHash.values()];
  }
}
