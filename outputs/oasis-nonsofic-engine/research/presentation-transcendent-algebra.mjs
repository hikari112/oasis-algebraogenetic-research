import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { ExactNonSoficGroupOracle } from "../src/group-oracle.mjs";

function simulateCounterMachine(machine, stepBudget) {
  const registers = [0n, 0n];
  let programCounter = 0;
  for (let step = 0; step < stepBudget; step += 1) {
    const instruction = machine.instructions[programCounter];
    if (!instruction) throw new Error("Counter machine jumped outside its program");
    if (instruction.op === "halt") return { halted: true, steps: step };
    if (instruction.op === "jump") {
      programCounter = instruction.next;
    } else if (instruction.op === "increment") {
      registers[instruction.register] += 1n;
      programCounter = instruction.next;
    } else if (instruction.op === "decrement-or-jump") {
      if (registers[instruction.register] === 0n) {
        programCounter = instruction.ifZero;
      } else {
        registers[instruction.register] -= 1n;
        programCounter = instruction.ifNonzero;
      }
    } else {
      throw new Error(`Unknown counter-machine operation: ${instruction.op}`);
    }
  }
  return {
    halted: machine.instructions[programCounter]?.op === "halt",
    steps: stepBudget,
  };
}

export function delayedHaltMachine(delay) {
  return {
    name: `halt-after-${delay}-steps`,
    instructions: [
      ...Array.from({ length: delay }, (_, index) => ({
        op: "jump",
        next: index + 1,
      })),
      { op: "halt" },
    ],
  };
}

const LOOPING_MACHINE = Object.freeze({
  name: "loop-forever",
  instructions: Object.freeze([{ op: "jump", next: 0 }]),
});

export class CertifiedBoundedProgram {
  constructor({ kind, bound, payload = null, left = null, right = null, actionUnit = null }) {
    this.kind = kind;
    this.bound = BigInt(bound);
    this.payload = payload;
    this.left = left;
    this.right = right;
    this.actionUnit = actionUnit;
  }

  static constant(value) {
    const integer = BigInt(value);
    return new CertifiedBoundedProgram({
      kind: "constant",
      bound: integer < 0n ? -integer : integer,
      payload: integer,
    });
  }

  static haltingClock(machine) {
    return new CertifiedBoundedProgram({ kind: "halting-clock", bound: 1n, payload: machine });
  }

  static pointMass(targetUnit) {
    return new CertifiedBoundedProgram({
      kind: "point-mass",
      bound: 1n,
      payload: targetUnit,
    });
  }

  add(other) {
    return new CertifiedBoundedProgram({
      kind: "add",
      bound: this.bound + other.bound,
      left: this,
      right: other,
    });
  }

  multiply(other) {
    return new CertifiedBoundedProgram({
      kind: "multiply",
      bound: this.bound * other.bound,
      left: this,
      right: other,
    });
  }

  translate(actionUnit) {
    return new CertifiedBoundedProgram({
      kind: "translate",
      bound: this.bound,
      left: this,
      actionUnit,
    });
  }

  evaluate(inputUnit) {
    if (this.kind === "constant") return this.payload;
    if (this.kind === "point-mass") return this.payload.equals(inputUnit) ? 1n : 0n;
    if (this.kind === "halting-clock") {
      const budget = inputUnit.hash().length;
      return simulateCounterMachine(this.payload, budget).halted ? 1n : 0n;
    }
    if (this.kind === "add") return this.left.evaluate(inputUnit) + this.right.evaluate(inputUnit);
    if (this.kind === "multiply") {
      return this.left.evaluate(inputUnit) * this.right.evaluate(inputUnit);
    }
    if (this.kind === "translate") {
      return this.left.evaluate(this.actionUnit.inverse().multiply(inputUnit));
    }
    throw new Error(`Unknown bounded-program kind: ${this.kind}`);
  }

  program() {
    if (this.kind === "constant") {
      return { kind: this.kind, value: `${this.payload}`, certifiedBound: `${this.bound}` };
    }
    if (this.kind === "halting-clock") {
      return {
        kind: this.kind,
        machine: this.payload.name,
        instructionCount: this.payload.instructions.length,
        certifiedBound: `${this.bound}`,
        totalityCertificate: "bounded-simulation-always-terminates",
      };
    }
    if (this.kind === "point-mass") {
      return {
        kind: this.kind,
        targetHash: this.payload.hash(),
        certifiedBound: `${this.bound}`,
        totalityCertificate: "exact-group-equality-is-decidable",
      };
    }
    if (this.kind === "translate") {
      return {
        kind: this.kind,
        actionHash: this.actionUnit.hash(),
        inner: this.left.program(),
        certifiedBound: `${this.bound}`,
      };
    }
    return {
      kind: this.kind,
      left: this.left.program(),
      right: this.right.program(),
      certifiedBound: `${this.bound}`,
    };
  }
}

export class IntensionalCrossedProductElement {
  constructor(groupOracle, terms = []) {
    this.groupOracle = groupOracle;
    this.terms = new Map();
    for (const term of terms) this.insert(term.unit, term.coefficient);
  }

  static monomial(groupOracle, coefficient, word = []) {
    return new IntensionalCrossedProductElement(groupOracle, [{
      unit: groupOracle.evaluate(word).unit,
      coefficient,
    }]);
  }

  insert(unit, coefficient) {
    const hash = unit.hash();
    const existing = this.terms.get(hash);
    this.terms.set(hash, {
      unit,
      coefficient: existing ? existing.coefficient.add(coefficient) : coefficient,
    });
  }

  add(other) {
    return new IntensionalCrossedProductElement(
      this.groupOracle,
      [...this.terms.values(), ...other.terms.values()],
    );
  }

  multiply(other) {
    const product = new IntensionalCrossedProductElement(this.groupOracle);
    for (const left of this.terms.values()) {
      for (const right of other.terms.values()) {
        // (f U_g)(h U_k) = f * alpha_g(h) U_(gk),
        // alpha_g(h)(x)=h(g^-1 x).
        product.insert(
          left.unit.multiply(right.unit),
          left.coefficient.multiply(right.coefficient.translate(left.unit)),
        );
      }
    }
    return product;
  }

  finiteObservation(inputWords) {
    return [...this.terms.entries()].map(([groupHash, term]) => ({
      groupHash,
      values: inputWords.map((word) => ({
        inputHash: this.groupOracle.evaluate(word).hash,
        value: `${term.coefficient.evaluate(this.groupOracle.evaluate(word).unit)}`,
      })),
    }));
  }

  program() {
    return [...this.terms.entries()].map(([groupHash, term]) => ({
      groupHash,
      coefficientProgram: term.coefficient.program(),
    }));
  }
}

function observationsEqual(left, right, inputWords) {
  return JSON.stringify(left.finiteObservation(inputWords))
    === JSON.stringify(right.finiteObservation(inputWords));
}

export function runPresentationTranscendentAlgebraDemo() {
  const groupOracle = new ExactNonSoficGroupOracle();
  const generators = ["x:0:1:s0", "x:1:0:s1"];
  const window = groupOracle.enumerateWindow(generators, 6, 128);
  const ordered = [...window].sort((left, right) => left.hash.length - right.hash.length);
  const shallow = ordered.slice(0, 8);
  const deepest = ordered.at(-1);
  const shallowMaximumBudget = Math.max(...shallow.map((item) => item.hash.length));
  const deepBudget = deepest.hash.length;
  assert(deepBudget > shallowMaximumBudget);
  const delay = shallowMaximumBudget + 1;

  const zero = CertifiedBoundedProgram.constant(0);
  const delayedClock = CertifiedBoundedProgram.haltingClock(delayedHaltMachine(delay));
  const loopingClock = CertifiedBoundedProgram.haltingClock(LOOPING_MACHINE);
  const zeroElement = IntensionalCrossedProductElement.monomial(groupOracle, zero);
  const delayedElement = IntensionalCrossedProductElement.monomial(groupOracle, delayedClock);
  const loopingElement = IntensionalCrossedProductElement.monomial(groupOracle, loopingClock);
  const shallowWords = shallow.map((item) => item.tokens);
  assert.equal(observationsEqual(zeroElement, delayedElement, shallowWords), true);
  assert.equal(observationsEqual(zeroElement, delayedElement, [deepest.tokens]), false);
  assert.equal(observationsEqual(zeroElement, loopingElement, window.map((item) => item.tokens)), true);

  const convergenceDelays = [delay, delay + 8, delay + 16, delay + 24];
  assert(convergenceDelays.every((value) => value <= deepBudget));
  const convergenceSequence = convergenceDelays.map((value) => {
    const program = CertifiedBoundedProgram.haltingClock(delayedHaltMachine(value));
    const element = IntensionalCrossedProductElement.monomial(groupOracle, program);
    const agreesWithZeroOnShallowCylinder = observationsEqual(
      zeroElement,
      element,
      shallowWords,
    );
    const separatedFromZeroByDeepProbe = !observationsEqual(
      zeroElement,
      element,
      [deepest.tokens],
    );
    assert.equal(agreesWithZeroOnShallowCylinder, true);
    assert.equal(separatedFromZeroByDeepProbe, true);
    return {
      delay: value,
      agreesWithZeroOnShallowCylinder,
      separatedFromZeroByDeepProbe,
    };
  });

  const g = [generators[0]];
  const h = [generators[1]];
  const a = IntensionalCrossedProductElement.monomial(groupOracle, delayedClock, g);
  const b = IntensionalCrossedProductElement.monomial(
    groupOracle,
    CertifiedBoundedProgram.constant(2),
    h,
  );
  const c = IntensionalCrossedProductElement.monomial(
    groupOracle,
    CertifiedBoundedProgram.constant(3),
    g,
  );
  const leftAssociated = a.multiply(b).multiply(c);
  const rightAssociated = a.multiply(b.multiply(c));
  assert.equal(
    observationsEqual(leftAssociated, rightAssociated, window.slice(0, 24).map((item) => item.tokens)),
    true,
  );

  return {
    schema: "oasis.presentation-transcendent-crossed-product.v1",
    nativeAlgebra: {
      formula: "B_cert(G,Z) crossed-product G",
      coefficientElements: "certified-total-bounded-programs-on-exact-group-elements",
      semanticEquality: "extensional-program-equality",
      internalOperations: "program-addition-program-multiplication-exact-group-crossed-product",
      everyFiniteObservationComputable: true,
    },
    exactNonSoficSpine: groupOracle.theorem.group,
    finiteOpacityWitness: {
      delayedProgram: delayedClock.program(),
      shallowProbeCount: shallow.length,
      shallowMaximumBudget,
      deepBudget,
      agreesWithZeroOnEveryShallowProbe: true,
      separatedByDeepProbe: true,
      deepProbeHash: deepest.hash,
    },
    canonicalizerObstruction: {
      theoremSchema:
        "clock_M(x)=1 iff M halts within native-complexity(x); clock_M equals zero iff M never halts",
      consequence:
        "a-total-computable-semantic-canonicalizer-would-decide-the-counter-machine-halting-problem",
      absoluteUnexpressibilityClaim: false,
      relativeConclusion:
        "the-algebra-is-computable-by-native-programs-but-has-no-computable-global-extensional-normal-form",
    },
    loopingProgramAudit: {
      testedProbeCount: window.length,
      agreesWithZeroOnTestedProbes: true,
      finiteAgreementDoesNotCertifySemanticEquality: true,
    },
    observationalTopologyWitness: {
      topology: "finite-observation-product-topology",
      testedSequence: convergenceSequence,
      theoremSchema:
        "clock_halt_after_n converges pointwise to zero as n grows, although every term is semantically nonzero",
      zeroIsNotIsolatedByAnyFiniteProbeSet: true,
      continuityComesFromObservationAndCompletionNotTranscendentalCoefficients: true,
    },
    crossedProductAudit: {
      finiteAssociativityProbeCount: 24,
      associativityPassed: true,
      exactResultGroupHashes: leftAssociated.program().map((term) => term.groupHash),
    },
    architectureMeaning:
      "external-models-receive-computable-observations-while-native-composition-never-requires-a-global-semantic-canonicalizer",
  };
}

if (
  typeof process !== "undefined"
  && process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runPresentationTranscendentAlgebraDemo(), null, 2));
}
