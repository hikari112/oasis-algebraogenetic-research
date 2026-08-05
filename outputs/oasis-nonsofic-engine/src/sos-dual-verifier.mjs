function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function q(numerator, denominator = 1n) {
  let n = BigInt(numerator);
  let d = BigInt(denominator);
  if (d === 0n) throw new Error("Zero rational denominator");
  if (d < 0n) [n, d] = [-n, -d];
  const divisor = gcd(n, d);
  return { numerator: n / divisor, denominator: d / divisor };
}

function parseQ(value) {
  if (Number.isInteger(value)) return q(BigInt(value));
  if (typeof value === "string") {
    const [numerator, denominator = "1"] = value.split("/");
    return q(BigInt(numerator), BigInt(denominator));
  }
  throw new Error("Invalid rational value");
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

function equalQ(left, right) {
  return left.numerator === right.numerator && left.denominator === right.denominator;
}

function publicQ(value) {
  return `${value.numerator}/${value.denominator}`;
}

function problemHashes(problem) {
  return new Set([
    ...problem.gramContributions.map((item) => item.exactHash),
    ...Object.keys(problem.delta),
    ...Object.keys(problem.deltaSquared),
  ]);
}

export function regularSimplexRadiusOneDual(problem) {
  if (problem.basisKind !== "generator-minus-identity" || problem.basis.length !== 30) {
    throw new Error("The regular-simplex dual is configured for the 30-direction Gamma radius-one basis");
  }
  const identityEntry = Object.entries(problem.delta)
    .find(([, coefficient]) => coefficient === problem.generatorCount);
  if (!identityEntry) throw new Error("Could not identify the group identity in Delta");
  const identityHash = identityEntry[0];
  const generatorHashes = new Set(problem.basis.map((item) => item.exactHash));
  const dualByExactHash = {};
  for (const exactHash of problemHashes(problem)) {
    dualByExactHash[exactHash] = exactHash === identityHash
      ? "0"
      : generatorHashes.has(exactHash) ? "-29/60" : "-1";
  }
  return {
    schema: "oasis.exact-radius1-sos-dual-certificate.v1",
    status: "exact-rational-certificate",
    claim: "no-positive-lambda-SOS-in-the-generator-minus-identity-radius1-cone",
    construction: "L(e)=0, L(g_i)=-29/60, and L(h)=-1 for every other radius-one product hash",
    dualByExactHash,
  };
}

export function verifyRegularSimplexRadiusOneDual(problem, certificate) {
  const size = problem.basis.length;
  const matrix = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => q(0n)));
  for (const contribution of problem.gramContributions) {
    const dualValue = certificate.dualByExactHash[contribution.exactHash];
    if (dualValue === undefined) throw new Error("Dual certificate does not cover the Gram support");
    const term = multiplyQ(parseQ(dualValue), q(BigInt(contribution.coefficient)));
    matrix[contribution.left][contribution.right] = addQ(
      matrix[contribution.left][contribution.right],
      term,
    );
  }
  for (let left = 0; left < size; left += 1) {
    for (let right = 0; right < size; right += 1) {
      const expected = left === right ? q(29n, 30n) : q(-1n, 30n);
      if (!equalQ(matrix[left][right], expected)) {
        throw new Error(`Dual moment mismatch at (${left},${right})`);
      }
    }
  }
  const pair = (terms) => Object.entries(terms).reduce((sum, [exactHash, coefficient]) => {
    const dualValue = certificate.dualByExactHash[exactHash];
    if (dualValue === undefined) throw new Error("Dual certificate does not cover the target support");
    return addQ(sum, multiplyQ(parseQ(dualValue), q(BigInt(coefficient))));
  }, q(0n));
  const deltaPairing = pair(problem.delta);
  const deltaSquaredPairing = pair(problem.deltaSquared);
  if (!equalQ(deltaPairing, q(29n, 2n))) {
    throw new Error("Dual pairing with Delta is not 29/2");
  }
  if (!equalQ(deltaSquaredPairing, q(0n))) {
    throw new Error("Dual pairing with Delta squared is not zero");
  }
  return {
    exact: true,
    positiveOnRadiusOneSquares: true,
    momentMatrix: "I_30-(1/30)11^T",
    positivityIdentity: "c^T M c=(1/30)sum_{i<j}(c_i-c_j)^2",
    rank: 29,
    deltaPairing: publicQ(deltaPairing),
    deltaSquaredPairing: publicQ(deltaSquaredPairing),
    excludesEveryPositiveLambda: true,
    claimBoundary: "generator-minus-identity-radius1-cone-only",
  };
}
