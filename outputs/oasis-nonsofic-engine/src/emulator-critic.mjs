function assertPermutation(permutation) {
  if (!Array.isArray(permutation)) throw new Error("Permutation must be an array");
  const sorted = [...permutation].sort((a, b) => a - b);
  if (sorted.some((value, index) => value !== index)) throw new Error("Invalid permutation");
}

export function identityPermutation(size) {
  return Array.from({ length: size }, (_, index) => index);
}

export function composePermutations(left, right) {
  assertPermutation(left);
  assertPermutation(right);
  if (left.length !== right.length) throw new Error("Permutation sizes differ");
  return right.map((value) => left[value]);
}

export function inversePermutation(permutation) {
  assertPermutation(permutation);
  const inverse = Array(permutation.length);
  permutation.forEach((value, index) => {
    inverse[value] = index;
  });
  return inverse;
}

export function normalizedHamming(left, right) {
  if (left.length !== right.length) throw new Error("Permutation sizes differ");
  let different = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) different += 1;
  }
  return different / left.length;
}

function entryDescriptor(entry) {
  return {
    label: entry.label,
    exactHash: entry.evaluatedWord.hash,
    word: entry.evaluatedWord.tokens.map((token) => ({ ...token })),
  };
}

function permutationComponents(permutations, size) {
  const adjacency = Array.from({ length: size }, () => new Set());
  for (const permutation of permutations) {
    for (let point = 0; point < size; point += 1) {
      const image = permutation[point];
      adjacency[point].add(image);
      adjacency[image].add(point);
    }
  }
  const unseen = new Set(Array.from({ length: size }, (_, index) => index));
  const components = [];
  while (unseen.size > 0) {
    const start = unseen.values().next().value;
    const queue = [start];
    const component = [];
    unseen.delete(start);
    while (queue.length > 0) {
      const point = queue.shift();
      component.push(point);
      for (const neighbor of adjacency[point]) {
        if (unseen.delete(neighbor)) queue.push(neighbor);
      }
    }
    components.push(component.sort((left, right) => left - right));
  }
  return components;
}

function exactComponentExpansion(permutations, component, maxExactComponentSize) {
  if (component.length <= 1) {
    return { expansion: null, witness: [], exact: true, vacuous: true };
  }
  if (component.length > maxExactComponentSize) {
    return { expansion: null, witness: null, exact: false, vacuous: false };
  }
  const localIndex = new Map(component.map((point, index) => [point, index]));
  const limit = 2 ** component.length;
  let bestExpansion = Infinity;
  let bestWitness = [];
  for (let mask = 1; mask < limit - 1; mask += 1) {
    let cardinality = 0;
    for (let index = 0; index < component.length; index += 1) {
      if ((mask & (2 ** index)) !== 0) cardinality += 1;
    }
    if (cardinality > component.length / 2) continue;
    let boundary = 0;
    for (const permutation of permutations) {
      for (const point of component) {
        const leftInside = (mask & (2 ** localIndex.get(point))) !== 0;
        const rightInside = (mask & (2 ** localIndex.get(permutation[point]))) !== 0;
        if (leftInside !== rightInside) boundary += 1;
      }
    }
    const expansion = boundary / cardinality;
    if (expansion < bestExpansion) {
      bestExpansion = expansion;
      bestWitness = component.filter(
        (point) => (mask & (2 ** localIndex.get(point))) !== 0,
      );
    }
  }
  return {
    expansion: bestExpansion,
    witness: bestWitness,
    exact: true,
    vacuous: false,
  };
}

export class FiniteEmulatorCritic {
  constructor(size) {
    if (!Number.isInteger(size) || size < 1) throw new Error("Invalid emulator size");
    this.size = size;
    this.byExactHash = new Map();
  }

  assign(evaluatedWord, permutation, label = null) {
    assertPermutation(permutation);
    if (permutation.length !== this.size) throw new Error("Permutation has wrong size");
    this.byExactHash.set(evaluatedWord.hash, {
      evaluatedWord,
      permutation: [...permutation],
      label: label ?? evaluatedWord.hash,
    });
  }

  permutationForWord(groupOracle, word) {
    const evaluated = groupOracle.evaluate(word);
    if (evaluated.tokens.length === 0) return identityPermutation(this.size);
    let result = identityPermutation(this.size);
    for (const token of evaluated.tokens) {
      const generator = groupOracle.evaluate([{ generator: token.generator, inverse: false }]);
      const entry = this.byExactHash.get(generator.hash);
      if (!entry) {
        const direct = this.byExactHash.get(evaluated.hash);
        return direct ? [...direct.permutation] : null;
      }
      const permutation = token.inverse
        ? inversePermutation(entry.permutation)
        : entry.permutation;
      result = composePermutations(result, permutation);
    }
    return result;
  }

  auditRelations(groupOracle, relations) {
    return relations.map((relation) => {
      const left = groupOracle.evaluate(relation.leftWord);
      const right = groupOracle.evaluate(relation.rightWord);
      const exactEqual = left.hash === right.hash;
      if (relation.expect === "equal" && !exactEqual) {
        throw new Error(`Invalid equality relation in certificate: ${relation.id}`);
      }
      if (relation.expect === "distinct" && exactEqual) {
        throw new Error(`Invalid distinctness relation in certificate: ${relation.id}`);
      }
      const leftPermutation = this.permutationForWord(groupOracle, relation.leftWord);
      const rightPermutation = this.permutationForWord(groupOracle, relation.rightWord);
      if (!leftPermutation || !rightPermutation) {
        return {
          ...relation,
          exactLeftHash: left.hash,
          exactRightHash: right.hash,
          covered: false,
          defect: null,
          collisionFraction: null,
        };
      }
      const defect = normalizedHamming(leftPermutation, rightPermutation);
      return {
        ...relation,
        exactLeftHash: left.hash,
        exactRightHash: right.hash,
        covered: true,
        defect,
        collisionFraction: 1 - defect,
      };
    });
  }

  auditExpansion(groupOracle, generatorWords, { maxExactComponentSize = 18 } = {}) {
    const permutations = generatorWords.map((word) => this.permutationForWord(groupOracle, word));
    if (permutations.some((permutation) => permutation === null)) {
      return {
        covered: false,
        componentCount: null,
        components: [],
        minimumNonvacuousExpansion: null,
      };
    }
    const components = permutationComponents(permutations, this.size).map((points) => ({
      points,
      size: points.length,
      ...exactComponentExpansion(permutations, points, maxExactComponentSize),
    }));
    const measured = components.filter((component) => component.expansion !== null);
    return {
      covered: true,
      componentCount: components.length,
      components,
      minimumNonvacuousExpansion: measured.length
        ? Math.min(...measured.map((component) => component.expansion))
        : null,
    };
  }

  auditLocalEmbedding(groupOracle, obstruction) {
    const finiteSet = obstruction.finiteSet;
    const finiteHashes = new Set(finiteSet.map((item) => item.exactHash));
    const assigned = new Map();
    const uncovered = [];
    for (const item of finiteSet) {
      const entry = this.byExactHash.get(item.exactHash);
      if (entry) assigned.set(item.exactHash, entry);
      else uncovered.push(item.exactHash);
    }
    const coveredItems = finiteSet.filter((item) => assigned.has(item.exactHash));
    const collisions = [];
    for (let left = 0; left < coveredItems.length; left += 1) {
      for (let right = left + 1; right < coveredItems.length; right += 1) {
        const leftEntry = assigned.get(coveredItems[left].exactHash);
        const rightEntry = assigned.get(coveredItems[right].exactHash);
        if (normalizedHamming(leftEntry.permutation, rightEntry.permutation) === 0) {
          collisions.push({
            leftExactHash: coveredItems[left].exactHash,
            rightExactHash: coveredItems[right].exactHash,
            leftWord: coveredItems[left].representativeWord,
            rightWord: coveredItems[right].representativeWord,
            collisionFraction: 1,
          });
        }
      }
    }
    const multiplicationDefects = [];
    for (const left of coveredItems) {
      for (const right of coveredItems) {
        const product = groupOracle.evaluate([
          ...left.representativeWord,
          ...right.representativeWord,
        ]);
        if (!finiteHashes.has(product.hash) || !assigned.has(product.hash)) continue;
        const composed = composePermutations(
          assigned.get(left.exactHash).permutation,
          assigned.get(right.exactHash).permutation,
        );
        const defect = normalizedHamming(
          composed,
          assigned.get(product.hash).permutation,
        );
        if (defect > 0) {
          multiplicationDefects.push({
            leftExactHash: left.exactHash,
            rightExactHash: right.exactHash,
            productExactHash: product.hash,
            leftWord: left.representativeWord,
            rightWord: right.representativeWord,
            productWord: finiteSet.find((item) => item.exactHash === product.hash).representativeWord,
            defect,
          });
        }
      }
    }
    const fullyCovered = uncovered.length === 0;
    const locallyEmbedded = fullyCovered &&
      collisions.length === 0 &&
      multiplicationDefects.length === 0;
    return {
      obstructionId: obstruction.id,
      finiteSetSize: finiteSet.length,
      coveredElementCount: assigned.size,
      fullyCovered,
      uncovered,
      collisions,
      multiplicationDefects,
      locallyEmbedded,
      outcome: locallyEmbedded
        ? "contradicts-theorem-dependencies"
        : "finite-lef-obstruction-not-embedded",
    };
  }

  audit(groupOracle) {
    const entries = [...this.byExactHash.values()];
    const identity = identityPermutation(this.size);
    const aliases = [];
    const multiplication = [];
    const freeness = [];

    for (let left = 0; left < entries.length; left += 1) {
      const entry = entries[left];
      if (!entry.evaluatedWord.isIdentity) {
        freeness.push({
          label: entry.label,
          exactHash: entry.evaluatedWord.hash,
          word: entry.evaluatedWord.tokens.map((token) => ({ ...token })),
          movedFraction: normalizedHamming(entry.permutation, identity),
        });
      }
      for (let right = left + 1; right < entries.length; right += 1) {
        if (
          entries[left].evaluatedWord.hash !== entries[right].evaluatedWord.hash &&
          normalizedHamming(entries[left].permutation, entries[right].permutation) === 0
        ) {
          aliases.push({
            left: entryDescriptor(entries[left]),
            right: entryDescriptor(entries[right]),
            collisionFraction: 1,
          });
        }
      }
    }

    for (const left of entries) {
      for (const right of entries) {
        const product = groupOracle.evaluate([
          ...left.evaluatedWord.tokens,
          ...right.evaluatedWord.tokens,
        ]);
        const expected = this.byExactHash.get(product.hash);
        if (!expected) continue;
        const composed = composePermutations(left.permutation, right.permutation);
        multiplication.push({
          left: left.label,
          right: right.label,
          product: expected.label,
          leftExactHash: left.evaluatedWord.hash,
          rightExactHash: right.evaluatedWord.hash,
          productExactHash: expected.evaluatedWord.hash,
          leftWord: left.evaluatedWord.tokens.map((token) => ({ ...token })),
          rightWord: right.evaluatedWord.tokens.map((token) => ({ ...token })),
          productWord: expected.evaluatedWord.tokens.map((token) => ({ ...token })),
          defect: normalizedHamming(composed, expected.permutation),
        });
      }
    }

    return {
      size: this.size,
      aliases,
      multiplication,
      freeness,
      maximumMultiplicationDefect: multiplication.length
        ? Math.max(...multiplication.map((item) => item.defect))
        : 0,
      minimumMovedFraction: freeness.length
        ? Math.min(...freeness.map((item) => item.movedFraction))
        : 1,
    };
  }
}

export class NonSoficObstructionGate {
  constructor(theoremMetadata) {
    this.theoremMetadata = theoremMetadata;
    this.effectiveWitness = null;
    this.proofCertificate = null;
  }

  installProofCertificate(certificate) {
    if (
      !certificate ||
      typeof certificate.challenge !== "function" ||
      typeof certificate.toJSON !== "function"
    ) {
      throw new Error("Malformed proof-obligation certificate");
    }
    this.proofCertificate = certificate;
  }

  installEffectiveWitness(witness) {
    if (
      !witness ||
      !(witness.epsilon > 0) ||
      typeof witness.challenge !== "function" ||
      !Array.isArray(witness.finiteWords)
    ) {
      throw new Error("Malformed effective non-sofic obstruction witness");
    }
    this.effectiveWitness = witness;
  }

  status() {
    return {
      theoremBackedGroup: true,
      group: this.theoremMetadata.group,
      effectiveWitnessInstalled: this.effectiveWitness !== null,
      operationalNonSoficChallenge: this.effectiveWitness !== null,
      proofCertificateInstalled: this.proofCertificate !== null,
      operationalProofObligationChallenge: this.proofCertificate !== null,
      proofCertificateStatus: this.proofCertificate?.status() ?? null,
    };
  }

  challenge(context, { requireGlobal = true } = {}) {
    if (requireGlobal && !this.effectiveWitness) {
      throw new Error(
        "The group is theorem-backed non-sofic, but no effective finite obstruction witness is installed",
      );
    }
    if (requireGlobal) return this.effectiveWitness.challenge(context.emulatorAudit ?? context);
    if (!this.proofCertificate) {
      throw new Error("No executable proof-obligation certificate is installed");
    }
    return this.proofCertificate.challenge(context);
  }
}
