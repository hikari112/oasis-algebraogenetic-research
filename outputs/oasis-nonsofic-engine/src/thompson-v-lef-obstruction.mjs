import {
  cylinderSwap,
  supportedPrefixPermutation,
} from "./unit-group.mjs";

function token(generator, inverse = false) {
  return { generator, inverse };
}

function power(word, exponent) {
  if (!Number.isInteger(exponent)) throw new Error("Word exponent must be an integer");
  if (exponent === 0) return [];
  const base = exponent > 0
    ? word.map((item) => ({ ...item }))
    : [...word].reverse().map((item) => ({ ...item, inverse: !item.inverse }));
  return Array.from({ length: Math.abs(exponent) }, () => base)
    .flat()
    .map((item) => ({ ...item }));
}

function concatenate(...words) {
  return words.flat().map((item) => ({ ...item }));
}

function operatorConvention(word) {
  // Bleak-Quick write Cantor maps on the right. Our exact units act on the
  // left, so a published word is represented by the reversed operator word.
  return [...word].reverse().map((item) => ({ ...item }));
}

function wordEncoding(word) {
  return word.map((item) => `${item.generator}${item.inverse ? "^-1" : ""}`).join(" ");
}

export function makeThompsonVTwoGeneratorUnits(supportPrefix = "1000") {
  const a = cylinderSwap(
    `${supportPrefix}00`,
    `${supportPrefix}01`,
    "V:a=(00 01)",
  );
  const cycle = [
    `${supportPrefix}01`,
    `${supportPrefix}10`,
    `${supportPrefix}11`,
  ];
  const b = supportedPrefixPermutation(
    cycle,
    [cycle[1], cycle[2], cycle[0]],
    "V:b=(01 10 11)",
  );
  const swap10110 = cylinderSwap(
    `${supportPrefix}10`,
    `${supportPrefix}110`,
    "V:(10 110)",
  );
  const swap10111 = cylinderSwap(
    `${supportPrefix}10`,
    `${supportPrefix}111`,
    "V:(10 111)",
  );
  // Published right-action word: u = a (10 110) (10 111).
  const u = swap10111.multiply(swap10110).multiply(a, "V:u");
  return { u, v: b };
}

export function bleakQuickRelators(uName, vName) {
  const u = [token(uName)];
  const v = [token(vName)];
  const ui = [token(uName, true)];
  const vi = [token(vName, true)];
  const published = [
    power(u, 6),
    power(v, 3),
    power(concatenate(power(u, 3), v), 4),
    concatenate(
      vi,
      u,
      power(concatenate(power(u, 2), vi), 2),
      power(u, 3),
      v,
      ui,
      vi,
      power(u, 3),
      v,
      u,
      power(concatenate(
        u,
        v,
        power(u, 2),
        power(concatenate(u, vi, power(u, 3), v), 3),
      ), 2),
      u,
      vi,
      power(u, 3),
      vi,
    ),
    concatenate(
      u,
      vi,
      power(u, 3),
      vi,
      power(u, -2),
      vi,
      u,
      v,
      power(u, 2),
      vi,
      ui,
      v,
      power(u, 2),
      vi,
      u,
      v,
      ui,
      power(concatenate(ui, vi), 2),
      power(u, 3),
      v,
      ui,
    ),
    concatenate(
      v,
      power(concatenate(u, vi, power(u, 3), vi), 2),
      ui,
      vi,
      power(u, 3),
      vi,
      ui,
      vi,
      power(u, 3),
      v,
    ),
    concatenate(
      u,
      v,
      power(u, 3),
      v,
      u,
      vi,
      power(u, -2),
      vi,
      u,
      power(concatenate(power(u, 2), v), 2),
      power(concatenate(power(u, 2), vi), 2),
      power(u, 3),
      v,
      power(u, -2),
      vi,
      power(u, 3),
      v,
    ),
  ];
  return published.map((word, index) => ({
    id: `bleak-quick-relator-${index + 1}`,
    source: "Bleak-Quick 2017, Theorem 1.3",
    publishedWord: word,
    operatorWord: operatorConvention(word),
    publishedEncoding: wordEncoding(word),
  }));
}

export function buildFiniteLefObstruction(groupOracle, uName, vName) {
  const relators = bleakQuickRelators(uName, vName);
  for (const relator of relators) {
    if (!groupOracle.evaluate(relator.operatorWord).isIdentity) {
      throw new Error(`Bleak-Quick relator failed exact evaluation: ${relator.id}`);
    }
  }
  const candidateWords = [
    [],
    [token(uName)],
    [token(uName, true)],
    [token(vName)],
    [token(vName, true)],
  ];
  for (const relator of relators) {
    for (let length = 1; length <= relator.operatorWord.length; length += 1) {
      candidateWords.push(relator.operatorWord.slice(0, length));
    }
  }
  const byExactHash = new Map();
  for (const word of candidateWords) {
    const evaluated = groupOracle.evaluate(word);
    if (!byExactHash.has(evaluated.hash)) {
      byExactHash.set(evaluated.hash, {
        exactHash: evaluated.hash,
        representativeWord: word.map((item) => ({ ...item })),
      });
    }
  }
  const chosenNonidentityWord = [token(uName)];
  if (groupOracle.evaluate(chosenNonidentityWord).isIdentity) {
    throw new Error("Chosen Thompson-V separator is unexpectedly the identity");
  }
  return {
    id: "thompson-v-two-generator-relator-prefix-obstruction-v1",
    status: "verified-theorem-backed",
    group: "Thompson's V supported on [1000]",
    presentation: {
      source: "Bleak-Quick 2017, Theorem 1.3",
      generators: [uName, vName],
      relators: relators.map((item) => ({
        id: item.id,
        operatorWord: item.operatorWord,
        publishedEncoding: item.publishedEncoding,
      })),
    },
    chosenNonidentityWord,
    finiteSet: [...byExactHash.values()],
    finiteSetSize: byExactHash.size,
    argument: [
      "An injective partial multiplication map on this relator-prefix set sends the two generators to elements satisfying every finite relator.",
      "The generator images therefore extend to a homomorphism from Thompson's V into a finite group.",
      "The chosen nonidentity generator remains nonidentity, so the homomorphism is nontrivial.",
      "Infinite simplicity makes every nontrivial homomorphism injective, which is impossible into a finite group.",
    ],
    theoremDependencies: [
      "Bleak-Quick finite presentation of V",
      "Thompson V is infinite and simple",
      "universal property of a finite group presentation",
    ],
  };
}
