function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function q(numerator, denominator = 1n) {
  if (denominator === 0n) throw new Error("Zero rational denominator");
  let n = BigInt(numerator);
  let d = BigInt(denominator);
  if (d < 0n) [n, d] = [-n, -d];
  const divisor = gcd(n, d);
  return { numerator: n / divisor, denominator: d / divisor };
}

function parseQ(value) {
  if (typeof value === "number" && Number.isInteger(value)) return q(BigInt(value));
  if (typeof value === "string") {
    const [numerator, denominator = "1"] = value.split("/");
    return q(BigInt(numerator), BigInt(denominator));
  }
  if (value && value.numerator !== undefined && value.denominator !== undefined) {
    return q(BigInt(value.numerator), BigInt(value.denominator));
  }
  throw new Error("Invalid rational coefficient");
}

function addQ(left, right) {
  return q(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function multiplyQ(left, right) {
  return q(left.numerator * right.numerator, left.denominator * right.denominator);
}

function negateQ(value) {
  return q(-value.numerator, value.denominator);
}

function isZeroQ(value) {
  return value.numerator === 0n;
}

function publicQ(value) {
  return {
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString(),
  };
}

function addTerm(element, evaluated, coefficient) {
  if (isZeroQ(coefficient)) return;
  const existing = element.get(evaluated.hash);
  const next = existing ? addQ(existing.coefficient, coefficient) : coefficient;
  if (isZeroQ(next)) element.delete(evaluated.hash);
  else element.set(evaluated.hash, {
    coefficient: next,
    word: evaluated.tokens.map((token) => ({ ...token })),
  });
}

function fromTerms(groupOracle, terms) {
  const result = new Map();
  for (const term of terms) {
    addTerm(result, groupOracle.evaluate(term.word), parseQ(term.coefficient));
  }
  return result;
}

function addElements(left, right) {
  const result = new Map(left);
  for (const [hash, term] of right) {
    const existing = result.get(hash);
    const next = existing ? addQ(existing.coefficient, term.coefficient) : term.coefficient;
    if (isZeroQ(next)) result.delete(hash);
    else result.set(hash, { coefficient: next, word: term.word.map((token) => ({ ...token })) });
  }
  return result;
}

function scaleElement(element, scalar) {
  const result = new Map();
  for (const [hash, term] of element) {
    const coefficient = multiplyQ(term.coefficient, scalar);
    if (!isZeroQ(coefficient)) result.set(hash, { coefficient, word: term.word });
  }
  return result;
}

function multiplyElements(groupOracle, left, right) {
  const result = new Map();
  for (const leftTerm of left.values()) {
    for (const rightTerm of right.values()) {
      const evaluated = groupOracle.evaluate([...leftTerm.word, ...rightTerm.word]);
      addTerm(
        result,
        evaluated,
        multiplyQ(leftTerm.coefficient, rightTerm.coefficient),
      );
    }
  }
  return result;
}

function starElement(groupOracle, element) {
  const result = new Map();
  for (const term of element.values()) {
    addTerm(
      result,
      groupOracle.evaluate(groupOracle.inverseWord(term.word)),
      term.coefficient,
    );
  }
  return result;
}

function elementDifference(left, right) {
  return addElements(left, scaleElement(right, q(-1n)));
}

function laplacian(groupOracle, generatorNames) {
  const terms = [{ coefficient: generatorNames.length, word: [] }];
  for (const generator of generatorNames) {
    terms.push({ coefficient: -1, word: [{ generator, inverse: false }] });
  }
  return fromTerms(groupOracle, terms);
}

export function verifySosCertificate(groupOracle, generatorNames, certificate) {
  const lambda = parseQ(certificate.lambda);
  if (lambda.numerator < 0n) throw new Error("SOS spectral parameter must be nonnegative");
  const delta = laplacian(groupOracle, generatorNames);
  const target = addElements(
    multiplyElements(groupOracle, delta, delta),
    scaleElement(delta, negateQ(lambda)),
  );
  let sum = new Map();
  let supportRadius = 0;
  for (const square of certificate.squares ?? []) {
    const xi = fromTerms(groupOracle, square);
    for (const term of square) supportRadius = Math.max(supportRadius, term.word.length);
    sum = addElements(
      sum,
      multiplyElements(groupOracle, starElement(groupOracle, xi), xi),
    );
  }
  const residual = elementDifference(target, sum);
  if (residual.size > 0) {
    const first = residual.entries().next().value;
    throw new Error(
      `SOS identity failed at ${first[0]} with coefficient ${JSON.stringify(publicQ(first[1].coefficient))}`,
    );
  }
  return {
    exactIdentity: true,
    positiveSpectralGap: lambda.numerator > 0n,
    lambda: publicQ(lambda),
    squareCount: certificate.squares?.length ?? 0,
    supportRadius,
    sufficientLocalMultiplicationRadius: 2 * supportRadius + 2,
  };
}

export function trivialLaplacianSquareCertificate(generatorNames) {
  return {
    schema: "oasis.kazhdan-sos-certificate.v1",
    lambda: "0",
    squares: [[
      { coefficient: generatorNames.length, word: [] },
      ...generatorNames.map((generator) => ({
        coefficient: -1,
        word: [{ generator, inverse: false }],
      })),
    ]],
    note: "Verifier smoke certificate only; lambda=0 proves no spectral gap",
  };
}
