import { LeavittUnit } from "./unit-group.mjs";

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function rational(numerator, denominator = 1n) {
  let n = BigInt(numerator);
  let d = BigInt(denominator);
  if (d === 0n) throw new Error("Rational denominator cannot be zero");
  if (d < 0n) [n, d] = [-n, -d];
  const divisor = gcd(n, d);
  return { numerator: n / divisor, denominator: d / divisor };
}

function parseRational(value) {
  if (typeof value === "bigint") return rational(value);
  if (typeof value === "number" && Number.isSafeInteger(value)) return rational(BigInt(value));
  if (typeof value === "string") {
    const pieces = value.split("/");
    if (pieces.length === 1) return rational(BigInt(pieces[0]));
    if (pieces.length === 2) return rational(BigInt(pieces[0]), BigInt(pieces[1]));
  }
  if (value && "numerator" in value && "denominator" in value) {
    return rational(value.numerator, value.denominator);
  }
  throw new Error(`Invalid exact rational: ${value}`);
}

function addRational(left, right) {
  return rational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function subtractRational(left, right) {
  return rational(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function multiplyRational(left, right) {
  return rational(
    left.numerator * right.numerator,
    left.denominator * right.denominator,
  );
}

function divideRational(left, right) {
  if (right.numerator === 0n) throw new Error("Cannot divide by zero");
  return rational(
    left.numerator * right.denominator,
    left.denominator * right.numerator,
  );
}

function equalRational(left, right) {
  return left.numerator === right.numerator && left.denominator === right.denominator;
}

function isZero(value) {
  return value.numerator === 0n;
}

function rationalString(value) {
  return value.denominator === 1n
    ? `${value.numerator}`
    : `${value.numerator}/${value.denominator}`;
}

function rationalNumber(value) {
  return Number(value.numerator) / Number(value.denominator);
}

function exactRank(matrix) {
  const work = matrix.map((row) => row.map((value) => ({ ...value })));
  const rowCount = work.length;
  const columnCount = rowCount ? work[0].length : 0;
  let pivotRow = 0;
  for (let column = 0; column < columnCount && pivotRow < rowCount; column += 1) {
    let selected = pivotRow;
    while (selected < rowCount && isZero(work[selected][column])) selected += 1;
    if (selected === rowCount) continue;
    [work[pivotRow], work[selected]] = [work[selected], work[pivotRow]];
    const pivot = work[pivotRow][column];
    for (let row = pivotRow + 1; row < rowCount; row += 1) {
      if (isZero(work[row][column])) continue;
      const factor = divideRational(work[row][column], pivot);
      for (let index = column; index < columnCount; index += 1) {
        work[row][index] = subtractRational(
          work[row][index],
          multiplyRational(factor, work[pivotRow][index]),
        );
      }
    }
    pivotRow += 1;
  }
  return pivotRow;
}

class ExactRationalGroupAlgebraElement {
  constructor(terms = new Map()) {
    this.terms = new Map();
    for (const { unit, coefficient } of terms.values()) {
      this.insert(unit, coefficient);
    }
  }

  static zero() {
    return new ExactRationalGroupAlgebraElement();
  }

  static singleton(unit, coefficient = rational(1n)) {
    if (!(unit instanceof LeavittUnit)) throw new Error("Group-algebra term needs a Leavitt unit");
    const result = ExactRationalGroupAlgebraElement.zero();
    result.insert(unit, parseRational(coefficient));
    return result;
  }

  static fromWordTerms(groupOracle, wordTerms) {
    const result = ExactRationalGroupAlgebraElement.zero();
    for (const term of wordTerms) {
      const evaluated = groupOracle.evaluate(term.word ?? []);
      result.insert(evaluated.unit, parseRational(term.coefficient ?? 1));
    }
    return result;
  }

  insert(unit, coefficient) {
    const checked = parseRational(coefficient);
    const hash = unit.hash();
    const existing = this.terms.get(hash);
    const combined = existing
      ? addRational(existing.coefficient, checked)
      : checked;
    if (isZero(combined)) this.terms.delete(hash);
    else this.terms.set(hash, { unit, coefficient: combined });
  }

  multiply(other) {
    const result = ExactRationalGroupAlgebraElement.zero();
    for (const left of this.terms.values()) {
      for (const right of other.terms.values()) {
        result.insert(
          left.unit.multiply(right.unit),
          multiplyRational(left.coefficient, right.coefficient),
        );
      }
    }
    return result;
  }

  star() {
    const result = ExactRationalGroupAlgebraElement.zero();
    for (const term of this.terms.values()) {
      result.insert(term.unit.inverse(), term.coefficient);
    }
    return result;
  }

  coefficient(unitOrHash) {
    const hash = typeof unitOrHash === "string" ? unitOrHash : unitOrHash.hash();
    return this.terms.get(hash)?.coefficient ?? rational(0n);
  }

  isZero() {
    return this.terms.size === 0;
  }

  support() {
    return [...this.terms.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([hash, term]) => ({ hash, coefficient: rationalString(term.coefficient) }));
  }
}

function exactMatricesEqual(left, right) {
  return left.length === right.length && left.every((row, rowIndex) =>
    row.length === right[rowIndex].length && row.every(
      (value, columnIndex) => equalRational(value, right[rowIndex][columnIndex]),
    ));
}

export class ProjectiveMomentMemory {
  constructor({ groupOracle }) {
    this.groupOracle = groupOracle;
    this.identity = groupOracle.evaluate([]).unit;
    this.amplitude = ExactRationalGroupAlgebraElement.singleton(this.identity);
    this.version = 0;
    this.committedMoments = new Map();
    this.refinementChecks = 0;
    this.updates = [];
    this.nullRelations = [];
    this.forkCount = 0;
    this.lineage = {
      branch: "root",
      parentBranch: null,
      forkedAtVersion: null,
    };
  }

  normSquared() {
    return this.amplitude.star().multiply(this.amplitude).coefficient(this.identity);
  }

  momentOfUnit(unit) {
    const observable = ExactRationalGroupAlgebraElement.singleton(unit);
    const numerator = this.amplitude.star()
      .multiply(observable)
      .multiply(this.amplitude)
      .coefficient(this.identity);
    return divideRational(numerator, this.normSquared());
  }

  moment(word = []) {
    return rationalString(this.momentOfUnit(this.groupOracle.evaluate(word).unit));
  }

  fork(label = null) {
    const child = new ProjectiveMomentMemory({ groupOracle: this.groupOracle });
    this.forkCount += 1;
    child.amplitude = new ExactRationalGroupAlgebraElement(this.amplitude.terms);
    child.version = this.version;
    child.refinementChecks = this.refinementChecks;
    child.updates = this.updates.map((event) => ({ ...event }));
    child.nullRelations = this.nullRelations.map((relation) => ({
      ...relation,
      support: relation.support.map((term) => ({ ...term })),
      element: new ExactRationalGroupAlgebraElement(relation.element.terms),
    }));
    child.lineage = {
      branch: label ?? `${this.lineage.branch}.${this.forkCount}`,
      parentBranch: this.lineage.branch,
      forkedAtVersion: this.version,
    };
    return child;
  }

  binaryObservation(word) {
    const evaluated = this.groupOracle.evaluate(word);
    if (!evaluated.unit.multiply(evaluated.unit).equals(this.identity)) {
      throw new Error("Binary observation requires an exact involution");
    }
    const observableMoment = this.momentOfUnit(evaluated.unit);
    const plus = divideRational(
      addRational(rational(1n), observableMoment),
      rational(2n),
    );
    const minus = divideRational(
      subtractRational(rational(1n), observableMoment),
      rational(2n),
    );
    return {
      schema: "oasis.binary-moment-observation.v1",
      exactProcessHash: evaluated.hash,
      moment: rationalString(observableMoment),
      plusProbability: rationalString(plus),
      minusProbability: rationalString(minus),
      probabilitySum: rationalString(addRational(plus, minus)),
      decimal: {
        plus: rationalNumber(plus),
        minus: rationalNumber(minus),
      },
    };
  }

  postselectInvolution({ word, outcome, label = null }) {
    if (outcome !== 1 && outcome !== -1) {
      throw new Error("Binary observation outcome must be +1 or -1");
    }
    const forecast = this.binaryObservation(word);
    const probability = outcome === 1
      ? forecast.plusProbability
      : forecast.minusProbability;
    if (probability === "0") throw new Error("Cannot postselect a zero-probability outcome");
    const event = this.update({
      label: label ?? `observe-${outcome === 1 ? "plus" : "minus"}`,
      side: "left",
      terms: [
        { word: [], coefficient: 1 },
        { word, coefficient: outcome },
      ],
    });
    const relation = this.rememberNullRelation({
      label: `${event.label}-eigenrelation`,
      terms: [
        { word: [], coefficient: 1 },
        { word, coefficient: -outcome },
      ],
    });
    return {
      schema: "oasis.postselected-involution-memory.v1",
      outcome,
      priorProbability: probability,
      forecast,
      update: event,
      consolidatedRelation: relation,
      branch: this.lineage.branch,
    };
  }

  branchOnInvolution(word, label = "observation") {
    const forecast = this.binaryObservation(word);
    const plus = forecast.plusProbability === "0"
      ? null
      : this.fork(`${this.lineage.branch}.${label}:+`);
    const minus = forecast.minusProbability === "0"
      ? null
      : this.fork(`${this.lineage.branch}.${label}:-`);
    const plusEvent = plus?.postselectInvolution({
      word,
      outcome: 1,
      label: `${label}-plus`,
    }) ?? null;
    const minusEvent = minus?.postselectInvolution({
      word,
      outcome: -1,
      label: `${label}-minus`,
    }) ?? null;
    return {
      schema: "oasis.counterfactual-memory-branch.v1",
      parentBranch: this.lineage.branch,
      parentVersion: this.version,
      forecast,
      plus: plus ? { probability: forecast.plusProbability, memory: plus, event: plusEvent } : null,
      minus: minus ? { probability: forecast.minusProbability, memory: minus, event: minusEvent } : null,
    };
  }

  materializeCausalTree(observationWords, label = "causal-tree") {
    if (!Array.isArray(observationWords)) {
      throw new Error("Causal tree requires an array of involution words");
    }
    let frontier = [{
      memory: this.fork(`${this.lineage.branch}.${label}:root`),
      probability: rational(1n),
      outcomes: [],
    }];
    for (let depth = 0; depth < observationWords.length; depth += 1) {
      const next = [];
      for (const leaf of frontier) {
        const branches = leaf.memory.branchOnInvolution(
          observationWords[depth],
          `${label}:${depth}`,
        );
        for (const [outcome, branch] of [[1, branches.plus], [-1, branches.minus]]) {
          if (!branch) continue;
          next.push({
            memory: branch.memory,
            probability: multiplyRational(
              leaf.probability,
              parseRational(branch.probability),
            ),
            outcomes: [...leaf.outcomes, outcome],
          });
        }
      }
      frontier = next;
    }
    const totalProbability = frontier.reduce(
      (sum, leaf) => addRational(sum, leaf.probability),
      rational(0n),
    );
    return {
      schema: "oasis.finite-causal-memory-tree.v1",
      parentBranch: this.lineage.branch,
      parentVersion: this.version,
      depth: observationWords.length,
      leafCount: frontier.length,
      totalProbability: rationalString(totalProbability),
      leaves: frontier.map((leaf) => ({
        outcomes: leaf.outcomes,
        probability: rationalString(leaf.probability),
        memory: leaf.memory,
        branch: leaf.memory.lineage.branch,
      })),
    };
  }

  compareWords(leftWord, rightWord) {
    const left = this.groupOracle.evaluate(leftWord);
    const right = this.groupOracle.evaluate(rightWord);
    if (left.hash === right.hash) {
      return {
        schema: "oasis.memory-word-comparison.v1",
        classification: "exact-algebraic-equality",
        algebraicallyEqual: true,
        memoryEquivalent: true,
        exactSquaredDistance: "0",
        leftHash: left.hash,
        rightHash: right.hash,
      };
    }
    const distance = this.relationNormSquared([
      { word: leftWord, coefficient: 1 },
      { word: rightWord, coefficient: -1 },
    ]);
    const memoryEquivalent = isZero(distance);
    return {
      schema: "oasis.memory-word-comparison.v1",
      classification: memoryEquivalent
        ? "state-kernel-equivalence"
        : "state-distinguishable-exact-elements",
      algebraicallyEqual: false,
      memoryEquivalent,
      exactSquaredDistance: rationalString(distance),
      leftHash: left.hash,
      rightHash: right.hash,
    };
  }

  auditEmulatorPair({ leftWord, rightWord, emulatorClaimsEqual }) {
    if (typeof emulatorClaimsEqual !== "boolean") {
      throw new Error("Emulator pair audit requires a Boolean equality claim");
    }
    const comparison = this.compareWords(leftWord, rightWord);
    let verdict;
    if (comparison.algebraicallyEqual) {
      verdict = emulatorClaimsEqual
        ? "emulator-correct-on-exact-equality"
        : "emulator-splits-exact-equality";
    } else if (emulatorClaimsEqual && comparison.memoryEquivalent) {
      verdict = "emulator-alias-agrees-with-current-memory-but-not-algebra";
    } else if (emulatorClaimsEqual) {
      verdict = "emulator-alias-refuted-by-current-memory";
    } else if (comparison.memoryEquivalent) {
      verdict = "emulator-retains-distinction-current-memory-has-forgotten";
    } else {
      verdict = "emulator-faithful-on-this-pair";
    }
    return {
      schema: "oasis.three-way-memory-emulator-audit.v1",
      verdict,
      emulatorClaimsEqual,
      comparison,
      layers: {
        algebraicTruth: comparison.algebraicallyEqual ? "equal" : "distinct",
        memoryTruth: comparison.memoryEquivalent ? "equivalent" : "distinguishable",
        emulatorTruth: emulatorClaimsEqual ? "aliased" : "separated",
      },
    };
  }

  update({ label = `update-${this.version + 1}`, terms, side = "right" }) {
    if (side !== "right" && side !== "left") {
      throw new Error("Amplitude update side must be right or left");
    }
    const filter = ExactRationalGroupAlgebraElement.fromWordTerms(this.groupOracle, terms);
    if (filter.isZero()) throw new Error("Likelihood-amplitude filter cannot be zero");
    // Right multiplication is consolidation in the commutant and preserves
    // left-kernel memories: rB=0 implies r(BK)=0. Left multiplication is an
    // observation/intervention and may revise those state-specific memories.
    const next = side === "right"
      ? this.amplitude.multiply(filter)
      : filter.multiply(this.amplitude);
    const nextNorm = next.star().multiply(next).coefficient(this.identity);
    if (isZero(nextNorm)) throw new Error("Likelihood-amplitude update annihilated the state");
    this.amplitude = next;
    const invalidatedRelationLabels = [];
    for (const relation of this.nullRelations.filter((item) => item.active)) {
      const remainsNull = relation.element.multiply(this.amplitude).isZero();
      if (side === "right" && !remainsNull) {
        throw new Error(`Right update violated persistent null relation: ${relation.label}`);
      }
      if (side === "left" && !remainsNull) {
        relation.active = false;
        relation.invalidatedAtVersion = this.version + 1;
        relation.invalidatedBy = label;
        invalidatedRelationLabels.push(relation.label);
      }
    }
    this.version += 1;
    this.committedMoments.clear();
    const event = {
      version: this.version,
      label,
      side,
      semantics: side === "right"
        ? "kernel-preserving-consolidation"
        : "kernel-revising-observation-or-intervention",
      filterSupportSize: filter.terms.size,
      amplitudeSupportSize: this.amplitude.terms.size,
      normSquared: rationalString(nextNorm),
      invalidatedRelationLabels,
    };
    this.updates.push(event);
    return event;
  }

  relationNormSquared(terms) {
    const relation = ExactRationalGroupAlgebraElement.fromWordTerms(
      this.groupOracle,
      terms,
    );
    const applied = relation.multiply(this.amplitude);
    const numerator = applied.star().multiply(applied).coefficient(this.identity);
    return divideRational(numerator, this.normSquared());
  }

  rememberNullRelation({ label = `null-${this.nullRelations.length}`, terms }) {
    const element = ExactRationalGroupAlgebraElement.fromWordTerms(
      this.groupOracle,
      terms,
    );
    const normSquared = this.relationNormSquared(terms);
    if (!isZero(normSquared)) {
      throw new Error(
        `Proposed memory relation is not null; squared norm ${rationalString(normSquared)}`,
      );
    }
    const record = {
      label,
      bornAtVersion: this.version,
      support: element.support(),
      exactSquaredNorm: rationalString(normSquared),
      persistenceContract: "preserved-by-right-consolidation-updates",
      active: true,
      invalidatedAtVersion: null,
      invalidatedBy: null,
      element,
    };
    this.nullRelations.push(record);
    return {
      label: record.label,
      bornAtVersion: record.bornAtVersion,
      support: record.support,
      exactSquaredNorm: record.exactSquaredNorm,
      persistenceContract: record.persistenceContract,
      active: record.active,
    };
  }

  transport(word, label = `transport-${this.version + 1}`) {
    const process = ExactRationalGroupAlgebraElement.singleton(
      this.groupOracle.evaluate(word).unit,
    );
    this.amplitude = process.multiply(this.amplitude);
    this.version += 1;
    this.committedMoments.clear();
    const event = {
      version: this.version,
      label,
      kind: "exact-left-regular-transport",
      amplitudeSupportSize: this.amplitude.terms.size,
      normSquared: rationalString(this.normSquared()),
    };
    this.updates.push(event);
    return event;
  }

  materialize(words) {
    if (!Array.isArray(words) || words.length === 0) {
      throw new Error("A nonempty finite process window is required");
    }
    const evaluated = words.map((word) => this.groupOracle.evaluate(word));
    const matrix = evaluated.map((left) => evaluated.map((right) =>
      this.momentOfUnit(left.unit.inverse().multiply(right.unit))
    ));
    const symmetric = matrix.every((row, rowIndex) => row.every(
      (value, columnIndex) => equalRational(value, matrix[columnIndex][rowIndex]),
    ));

    const translatedVectors = evaluated.map((item) =>
      ExactRationalGroupAlgebraElement.singleton(item.unit).multiply(this.amplitude)
    );
    const norm = this.normSquared();
    const gram = translatedVectors.map((left) => translatedVectors.map((right) =>
      divideRational(left.star().multiply(right).coefficient(this.identity), norm)
    ));
    if (!exactMatricesEqual(matrix, gram)) {
      throw new Error("Moment matrix failed exact Gram-factorization verification");
    }

    let overlapChecks = 0;
    for (let row = 0; row < evaluated.length; row += 1) {
      for (let column = 0; column < evaluated.length; column += 1) {
        const key = `${evaluated[row].hash}\u0000${evaluated[column].hash}`;
        const prior = this.committedMoments.get(key);
        if (prior) {
          overlapChecks += 1;
          if (!equalRational(prior, matrix[row][column])) {
            throw new Error("Refinement changed a previously materialized moment");
          }
        } else {
          this.committedMoments.set(key, matrix[row][column]);
        }
      }
    }
    this.refinementChecks += overlapChecks;

    const rank = exactRank(matrix);
    return {
      schema: "oasis.projective-moment-view.v1",
      version: this.version,
      windowSize: words.length,
      distinctExactElements: new Set(evaluated.map((item) => item.hash)).size,
      exactHashes: evaluated.map((item) => item.hash),
      normalized: equalRational(this.momentOfUnit(this.identity), rational(1n)),
      symmetric,
      psdByExactGramFactorization: true,
      exactRank: rank,
      overlapConsistencyChecks: overlapChecks,
      matrix: matrix.map((row) => row.map(rationalString)),
      decimalMatrix: matrix.map((row) => row.map(rationalNumber)),
    };
  }

  certifyFiniteLatentDimension(words, maximumLatentDimension) {
    if (!Number.isInteger(maximumLatentDimension) || maximumLatentDimension < 0) {
      throw new Error("Maximum latent dimension must be a nonnegative integer");
    }
    const view = this.materialize(words);
    const identityMomentView = view.matrix.every((row, rowIndex) => row.every(
      (value, columnIndex) => value === (rowIndex === columnIndex ? "1" : "0"),
    ));
    const exactRepresentationImpossible = maximumLatentDimension < view.exactRank;
    const omittedDimensions = identityMomentView
      ? Math.max(0, view.windowSize - maximumLatentDimension)
      : null;
    return {
      schema: "oasis.finite-latent-dimension-obstruction.v1",
      windowSize: view.windowSize,
      distinctExactElements: view.distinctExactElements,
      exactMomentRank: view.exactRank,
      maximumLatentDimension,
      exactRepresentationImpossible,
      rankDeficit: Math.max(0, view.exactRank - maximumLatentDimension),
      identityMomentView,
      quantitativeApproximationBound: identityMomentView ? {
        theorem: "best-rank-d-approximation-of-identity",
        minimumSquaredFrobeniusError: omittedDimensions,
        minimumFrobeniusError: Math.sqrt(omittedDimensions),
        minimumNormalizedFrobeniusError:
          Math.sqrt(omittedDimensions / view.windowSize),
        minimumOperatorNormError:
          maximumLatentDimension < view.windowSize ? 1 : 0,
      } : null,
      interpretation: exactRepresentationImpossible
        ? "no-latent-Gram-model-of-the-requested-dimension-can-reproduce-this-memory-view"
        : "rank-alone-does-not-obstruct-the-requested-latent-dimension",
    };
  }

  certifyDisjointTranslateObstruction(
    candidateWords,
    maximumLatentDimension,
    targetWindowSize = maximumLatentDimension + 1,
  ) {
    if (!Array.isArray(candidateWords)) {
      throw new Error("Disjoint-translate search requires an array of candidate words");
    }
    if (!Number.isInteger(maximumLatentDimension) || maximumLatentDimension < 0) {
      throw new Error("Maximum latent dimension must be a nonnegative integer");
    }
    if (!Number.isInteger(targetWindowSize) || targetWindowSize <= 0) {
      throw new Error("Target window size must be a positive integer");
    }
    const occupiedSupport = new Set();
    const selected = [];
    let inspectedCandidateCount = 0;
    for (const word of candidateWords) {
      inspectedCandidateCount += 1;
      const evaluated = this.groupOracle.evaluate(word);
      const translatedAmplitude = ExactRationalGroupAlgebraElement
        .singleton(evaluated.unit)
        .multiply(this.amplitude);
      const translatedSupport = translatedAmplitude.support().map((term) => term.hash);
      if (translatedSupport.some((hash) => occupiedSupport.has(hash))) continue;
      selected.push({
        word: [...word],
        exactProcessHash: evaluated.hash,
        translatedAmplitudeSupport: translatedSupport,
      });
      for (const hash of translatedSupport) occupiedSupport.add(hash);
      if (selected.length === targetWindowSize) break;
    }

    const foundRequestedWindow = selected.length === targetWindowSize;
    const latentCertificate = selected.length === 0
      ? null
      : this.certifyFiniteLatentDimension(
        selected.map((item) => item.word),
        maximumLatentDimension,
      );
    if (foundRequestedWindow && !latentCertificate.identityMomentView) {
      throw new Error("Disjoint translated amplitude supports did not yield an identity moment view");
    }
    return {
      schema: "oasis.disjoint-translate-latent-obstruction.v1",
      theorem:
        "finite-support-amplitude-over-infinite-group-has-arbitrarily-large-orthogonal-translate-families",
      proofKernel:
        "at each step only the finite set union_i g_i S S^-1 is forbidden, so an infinite group supplies another translate",
      maximumLatentDimension,
      targetWindowSize,
      inspectedCandidateCount,
      foundRequestedWindow,
      pairwiseDisjointTranslatedSupports: true,
      selected,
      latentCertificate,
      interpretation: foundRequestedWindow
        ? "this-current-memory-state-refutes-the-requested-fixed-latent-dimension"
        : "the-finite-candidate-list-did-not-yet-materialize-the-theorem-witness",
    };
  }

  snapshot() {
    return {
      schema: "oasis.projective-moment-memory.v1",
      semantics: "one-positive-functional-many-compatible-finite-views",
      internalAlgebra: `R[${this.groupOracle.theorem.group}]`,
      lineage: { ...this.lineage },
      version: this.version,
      amplitudeSupportSize: this.amplitude.terms.size,
      amplitude: this.amplitude.support(),
      normSquared: rationalString(this.normSquared()),
      committedMomentCount: this.committedMoments.size,
      refinementConsistencyChecks: this.refinementChecks,
      nullRelations: this.nullRelations.map((relation) => ({
        label: relation.label,
        bornAtVersion: relation.bornAtVersion,
        support: relation.support,
        exactSquaredNorm: relation.exactSquaredNorm,
        persistenceContract: relation.persistenceContract,
        active: relation.active,
        invalidatedAtVersion: relation.invalidatedAtVersion,
        invalidatedBy: relation.invalidatedBy,
      })),
      updates: this.updates.map((event) => ({ ...event })),
    };
  }
}

export const exactRational = Object.freeze({
  parse: parseRational,
  toString: rationalString,
});
