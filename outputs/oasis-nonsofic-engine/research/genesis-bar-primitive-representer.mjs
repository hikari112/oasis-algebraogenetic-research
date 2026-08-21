import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import { runGenesisHigherQuestionQuotients } from "./genesis-higher-question-quotients.mjs";

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function tupleKey(tuple) {
  return tuple.join("");
}

function tuples(length, alphabet = [1, 2, 3]) {
  if (length === 0) return [[]];
  const tails = tuples(length - 1, alphabet);
  return alphabet.flatMap((head) => tails.map((tail) => [head, ...tail]));
}

function makeBarBasis(degree) {
  const cells = tuples(degree);
  const basis = cells.flatMap((tuple) => [0, 1, 2, 3].map((outer) => ({ outer, tuple })));
  const index = new Map(basis.map((cell, position) => [`${cell.outer}|${tupleKey(cell.tuple)}`, position]));
  return { degree, orbitCount: cells.length, basis, index, rank: basis.length };
}

function addSparseEntry(entries, row, coefficient) {
  if (coefficient === 0) return;
  const next = (entries.get(row) ?? 0) + coefficient;
  if (next === 0) entries.delete(row);
  else entries.set(row, next);
}

function sparseMatrix(rows, cols, columns) {
  assert.equal(columns.length, cols);
  return {
    rows,
    cols,
    columns: columns.map((column) => [...column]
      .filter(([, coefficient]) => coefficient !== 0)
      .sort(([left], [right]) => left - right)),
  };
}

function zeroMatrix(rows, cols) {
  return sparseMatrix(rows, cols, Array.from({ length: cols }, () => []));
}

function identityMatrix(size) {
  return sparseMatrix(size, size, Array.from({ length: size }, (_, column) => [[column, 1]]));
}

function matrixFromColumnMaps(rows, maps) {
  return sparseMatrix(rows, maps.length, maps.map((entries) => [...entries.entries()]));
}

function composeMatrices(left, right) {
  assert.equal(left.cols, right.rows);
  const columns = right.columns.map((rightColumn) => {
    const entries = new Map();
    for (const [middle, rightCoefficient] of rightColumn) {
      for (const [row, leftCoefficient] of left.columns[middle]) {
        addSparseEntry(entries, row, leftCoefficient * rightCoefficient);
      }
    }
    return entries;
  });
  return matrixFromColumnMaps(left.rows, columns);
}

function addMatrices(left, right) {
  assert.equal(left.rows, right.rows);
  assert.equal(left.cols, right.cols);
  const columns = left.columns.map((leftColumn, column) => {
    const entries = new Map(leftColumn);
    for (const [row, coefficient] of right.columns[column]) addSparseEntry(entries, row, coefficient);
    return entries;
  });
  return matrixFromColumnMaps(left.rows, columns);
}

function negateMatrix(matrix) {
  return sparseMatrix(matrix.rows, matrix.cols, matrix.columns.map((column) => (
    column.map(([row, coefficient]) => [row, -coefficient])
  )));
}

function verticalStack(top, bottom) {
  assert.equal(top.cols, bottom.cols);
  return sparseMatrix(top.rows + bottom.rows, top.cols, top.columns.map((topColumn, column) => [
    ...topColumn,
    ...bottom.columns[column].map(([row, coefficient]) => [top.rows + row, coefficient]),
  ]));
}

function horizontalConcat(left, right) {
  assert.equal(left.rows, right.rows);
  return sparseMatrix(left.rows, left.cols + right.cols, [...left.columns, ...right.columns]);
}

function blockDiagonal(topLeft, bottomRight) {
  const topRight = zeroMatrix(topLeft.rows, bottomRight.cols);
  const bottomLeft = zeroMatrix(bottomRight.rows, topLeft.cols);
  return verticalStack(horizontalConcat(topLeft, topRight), horizontalConcat(bottomLeft, bottomRight));
}

function matricesEqual(left, right) {
  return left.rows === right.rows
    && left.cols === right.cols
    && canonical(left.columns) === canonical(right.columns);
}

function matrixIsZero(matrix) {
  return matrix.columns.every((column) => column.length === 0);
}

function matrixSummary(matrix) {
  const coefficients = matrix.columns.flatMap((column) => column.map(([, coefficient]) => coefficient));
  return {
    rows: matrix.rows,
    columns: matrix.cols,
    nonzeroEntries: coefficients.length,
    maximumAbsoluteEntry: coefficients.length === 0
      ? 0
      : Math.max(...coefficients.map((coefficient) => Math.abs(coefficient))),
    digest: digest(matrix.columns),
  };
}

function buildBoundary(source, target) {
  assert.equal(source.degree, target.degree + 1);
  const degree = source.degree;
  const columns = source.basis.map(({ outer, tuple }) => {
    const entries = new Map();
    const firstTarget = target.index.get(`${outer ^ tuple[0]}|${tupleKey(tuple.slice(1))}`);
    assert(firstTarget !== undefined);
    addSparseEntry(entries, firstTarget, 1);
    for (let position = 0; position < degree - 1; position += 1) {
      const product = tuple[position] ^ tuple[position + 1];
      if (product === 0) continue;
      const shortened = [
        ...tuple.slice(0, position),
        product,
        ...tuple.slice(position + 2),
      ];
      const row = target.index.get(`${outer}|${tupleKey(shortened)}`);
      assert(row !== undefined);
      addSparseEntry(entries, row, position % 2 === 0 ? -1 : 1);
    }
    const lastTarget = target.index.get(`${outer}|${tupleKey(tuple.slice(0, -1))}`);
    assert(lastTarget !== undefined);
    addSparseEntry(entries, lastTarget, degree % 2 === 0 ? 1 : -1);
    return entries;
  });
  return matrixFromColumnMaps(target.rank, columns);
}

function buildContraction(source, target) {
  assert.equal(target.degree, source.degree + 1);
  const columns = source.basis.map(({ outer, tuple }) => {
    if (outer === 0) return new Map();
    const row = target.index.get(`0|${tupleKey([outer, ...tuple])}`);
    assert(row !== undefined);
    return new Map([[row, 1]]);
  });
  return matrixFromColumnMaps(target.rank, columns);
}

function buildAction(basis, actingElement) {
  const columns = basis.basis.map(({ outer, tuple }) => {
    const row = basis.index.get(`${outer ^ actingElement}|${tupleKey(tuple)}`);
    assert(row !== undefined);
    return [[row, 1]];
  });
  return sparseMatrix(basis.rank, basis.rank, columns);
}

function buildNormalizedBarComplex() {
  const bases = Array.from({ length: 6 }, (_, degree) => makeBarBasis(degree));
  const boundaries = [null];
  for (let degree = 1; degree <= 5; degree += 1) {
    boundaries.push(buildBoundary(bases[degree], bases[degree - 1]));
  }
  const contractions = [];
  for (let degree = 0; degree <= 4; degree += 1) {
    contractions.push(buildContraction(bases[degree], bases[degree + 1]));
  }

  const squareZeroChecks = [];
  for (let degree = 2; degree <= 5; degree += 1) {
    const composite = composeMatrices(boundaries[degree - 1], boundaries[degree]);
    assert(matrixIsZero(composite));
    squareZeroChecks.push({ degree, equations: composite.rows * composite.cols });
  }

  const augmentation = sparseMatrix(1, 4, Array.from({ length: 4 }, () => [[0, 1]]));
  const unit = sparseMatrix(4, 1, [[[0, 1]]]);
  const degreeZeroContraction = addMatrices(
    composeMatrices(boundaries[1], contractions[0]),
    composeMatrices(unit, augmentation),
  );
  assert(matricesEqual(degreeZeroContraction, identityMatrix(4)));

  const contractionChecks = [{ degree: 0, equations: 4 ** 2 }];
  for (let degree = 1; degree <= 4; degree += 1) {
    const identityWitness = addMatrices(
      composeMatrices(boundaries[degree + 1], contractions[degree]),
      composeMatrices(contractions[degree - 1], boundaries[degree]),
    );
    assert(matricesEqual(identityWitness, identityMatrix(bases[degree].rank)));
    contractionChecks.push({ degree, equations: bases[degree].rank ** 2 });
  }

  const boundaryRanks = [1];
  for (let degree = 1; degree <= 5; degree += 1) {
    boundaryRanks[degree] = bases[degree - 1].rank - boundaryRanks[degree - 1];
  }
  assert.deepEqual(boundaryRanks, [1, 3, 9, 27, 81, 243]);

  return {
    bases,
    boundaries,
    contractions,
    augmentation,
    unit,
    squareZeroChecks,
    contractionChecks,
    boundaryRanks,
  };
}

function mu(g, h) {
  const a = g & 1;
  const b = (g >> 1) & 1;
  const c = h & 1;
  return c & (a ^ b);
}

function buildMAction(actingElement) {
  return sparseMatrix(4, 4, Array.from({ length: 4 }, (_, basisElement) => (
    [[basisElement ^ actingElement, 1]]
  )));
}

function buildABasisInM() {
  return sparseMatrix(4, 4, [
    [[0, 2]],
    [[0, -1], [1, 1]],
    [[0, -1], [2, 1]],
    [[0, -1], [3, 1]],
  ]);
}

function mVectorToACoordinates(column) {
  const vector = [0, 0, 0, 0];
  for (const [row, coefficient] of column) vector[row] += coefficient;
  const augmentation = vector.reduce((sum, value) => sum + value, 0);
  assert.equal(Math.abs(augmentation) % 2, 0);
  const coordinates = [augmentation / 2, vector[1], vector[2], vector[3]];
  return coordinates.flatMap((coefficient, row) => (coefficient === 0 ? [] : [[row, coefficient]]));
}

function convertMMapToAMap(matrix) {
  assert.equal(matrix.rows, 4);
  return sparseMatrix(4, matrix.cols, matrix.columns.map(mVectorToACoordinates));
}

function buildAAction(actingElement, aToM) {
  const acted = composeMatrices(buildMAction(actingElement), aToM);
  const action = convertMMapToAMap(acted);
  assert(matricesEqual(composeMatrices(aToM, action), acted));
  return action;
}

function buildPrimitiveF(bar2) {
  const columns = bar2.basis.map(({ outer, tuple }) => {
    assert.equal(tuple.length, 2);
    return mu(tuple[0], tuple[1]) === 0 ? [] : [[outer, 1]];
  });
  return sparseMatrix(4, bar2.rank, columns);
}

function buildDirectKappaM(bar3) {
  const columns = bar3.basis.map(({ outer, tuple: [g, h, k] }) => {
    const entries = new Map();
    addSparseEntry(entries, outer ^ g, mu(h, k));
    addSparseEntry(entries, outer, -mu(g ^ h, k));
    addSparseEntry(entries, outer, mu(g, h ^ k));
    addSparseEntry(entries, outer, -mu(g, h));
    return entries;
  });
  return matrixFromColumnMaps(4, columns);
}

function buildRightInverseToRepresenterMap(bar2, codomainRank) {
  const tuple = [1, 1];
  const columns = [0, 1, 2, 3].map((outer) => {
    const barColumn = bar2.index.get(`${outer}|${tupleKey(tuple)}`);
    assert(barColumn !== undefined);
    return [[4 + barColumn, 1]];
  });
  return sparseMatrix(codomainRank, 4, columns);
}

let predecessorCache;
function auditPredecessor() {
  if (predecessorCache !== undefined) return predecessorCache;
  const predecessor = runGenesisHigherQuestionQuotients();
  assert.equal(predecessor.status, "PASS");
  assert.equal(predecessor.result.quotient, "Q=V4");
  assert.equal(predecessor.result.factorFormula, "mu((a,b),(c,d))=c(a+b) mod 2");
  const localFactorTable = [0, 1, 2, 3].map((g) => [0, 1, 2, 3].map((h) => mu(g, h)));
  assert.deepEqual(localFactorTable, predecessor.certificate.derivation.factorTable);
  predecessorCache = {
    schema: predecessor.schema,
    certificateDigest: predecessor.certificate.certificateDigest,
    quotient: predecessor.result.quotient,
    factorFormula: predecessor.result.factorFormula,
    factorTableDigest: digest(localFactorTable),
    minimumFiniteQuestionQuotientOrder: predecessor.result.minimumFiniteTargetOrder,
  };
  return predecessorCache;
}

function buildLaboratory() {
  const predecessor = auditPredecessor();
  const bar = buildNormalizedBarComplex();
  const { bases, boundaries, contractions, boundaryRanks } = bar;
  const aToM = buildABasisInM();
  const F = buildPrimitiveF(bases[2]);
  const kappaM = composeMatrices(F, boundaries[3]);
  const directKappaM = buildDirectKappaM(bases[3]);
  assert(matricesEqual(kappaM, directKappaM));
  const kappaA = convertMMapToAMap(kappaM);
  assert(matricesEqual(composeMatrices(aToM, kappaA), kappaM));
  const kappaD4 = composeMatrices(kappaA, boundaries[4]);
  assert(matrixIsZero(kappaD4));

  const D3 = verticalStack(kappaA, negateMatrix(boundaries[3]));
  const j = verticalStack(identityMatrix(4), zeroMatrix(bases[2].rank, 4));
  const projectionPresentation = horizontalConcat(zeroMatrix(bases[1].rank, 4), boundaries[2]);
  assert(matrixIsZero(composeMatrices(projectionPresentation, D3)));

  const representerMap = horizontalConcat(aToM, F);
  assert(matrixIsZero(composeMatrices(representerMap, D3)));
  const rightInverse = buildRightInverseToRepresenterMap(bases[2], 4 + bases[2].rank);
  assert(matricesEqual(composeMatrices(representerMap, rightInverse), identityMatrix(4)));

  const injectionWitness = addMatrices(
    composeMatrices(boundaries[4], contractions[3]),
    composeMatrices(contractions[2], boundaries[3]),
  );
  assert(matricesEqual(injectionWitness, identityMatrix(bases[3].rank)));
  assert(matrixIsZero(composeMatrices(kappaA, boundaries[4])));

  const exactSequenceKernelWitness = addMatrices(
    composeMatrices(boundaries[3], contractions[2]),
    composeMatrices(contractions[1], boundaries[2]),
  );
  assert(matricesEqual(exactSequenceKernelWitness, identityMatrix(bases[2].rank)));

  const actionAudits = [1, 2].map((actingElement) => {
    const actionA = buildAAction(actingElement, aToM);
    const actionB2 = buildAction(bases[2], actingElement);
    const actionB3 = buildAction(bases[3], actingElement);
    const actionDomain = actionB3;
    const actionCodomain = blockDiagonal(actionA, actionB2);
    assert(matricesEqual(
      composeMatrices(actionCodomain, D3),
      composeMatrices(D3, actionDomain),
    ));
    assert(matricesEqual(
      composeMatrices(buildMAction(actingElement), representerMap),
      composeMatrices(representerMap, actionCodomain),
    ));
    return {
      generator: actingElement === 1 ? "x" : "y",
      D3Equivariant: true,
      canonicalMapEquivariant: true,
      actionADigest: matrixSummary(actionA).digest,
    };
  });

  const relationRank = boundaryRanks[3];
  assert.equal(relationRank, 27);
  const representerRank = 4 + bases[2].rank - relationRank;
  assert.equal(representerRank, 13);
  const projectionImageRank = boundaryRanks[2];
  assert.equal(projectionImageRank, 9);
  assert.equal(representerRank, 4 + projectionImageRank);

  const truncations = [3, 4].map((topDegree) => {
    const topHomologyRank = boundaryRanks[topDegree + 1];
    const expected = 3 ** (topDegree + 1);
    assert.equal(topHomologyRank, expected);
    return {
      topDegree,
      topCellOrbitCount: bases[topDegree].orbitCount,
      topUnderlyingRank: bases[topDegree].rank,
      omittedNextCellOrbitCount: bases[topDegree + 1].orbitCount,
      topHomologyRank,
      formulaVerified: `rank H_${topDegree}=3^${topDegree + 1}=(|Q|-1)^${topDegree + 1}`,
    };
  });

  return {
    predecessor,
    bar,
    aToM,
    F,
    kappaM,
    directKappaM,
    kappaA,
    kappaD4,
    D3,
    j,
    projectionPresentation,
    representerMap,
    rightInverse,
    actionAudits,
    relationRank,
    representerRank,
    projectionImageRank,
    truncations,
  };
}

function buildCertificate(lab) {
  const { bases, boundaries, contractions, squareZeroChecks, contractionChecks, boundaryRanks } = lab.bar;
  const body = {
    schema: "oasis.genesis-bar-primitive-representer.certificate.v1",
    predecessor: lab.predecessor,
    normalizedBarResolution: {
      group: "Q=V4",
      groupOrder: 4,
      nonidentityAlphabet: ["x", "y", "xy"],
      freeModule: "B_n=Z[Q]{[g1|...|gn] : every gi is nonidentity}",
      boundaryFormula: "d[g1|...|gn]=g1[g2|...|gn]+sum_i(-1)^i[g1|...|gi gi+1|...|gn]+(-1)^n[g1|...|g(n-1)]",
      normalizedIdentityProductsOmitted: true,
      cellOrbitCounts: {
        B0: bases[0].orbitCount,
        B1: bases[1].orbitCount,
        B2: bases[2].orbitCount,
        B3: bases[3].orbitCount,
        B4: bases[4].orbitCount,
        B5: bases[5].orbitCount,
      },
      requestedTailCellOrbitCounts: {
        degree3: 27,
        degree4: 81,
        degree5: 243,
      },
      underlyingIntegerRanks: Object.fromEntries(bases.map((basis) => [`B${basis.degree}`, basis.rank])),
      boundaryMatrices: Object.fromEntries(boundaries.slice(1).map((boundary, offset) => [
        `B${offset + 1}`,
        matrixSummary(boundary),
      ])),
      boundaryRanks: Object.fromEntries(boundaryRanks.slice(1).map((rank, offset) => [`d${offset + 1}`, rank])),
      squareZeroChecks,
      integralContraction: {
        formula: "s_n(q[g1|...|gn])=[q|g1|...|gn] when q!=1, and 0 when q=1",
        matrices: contractions.map((matrix, degree) => ({ degree, ...matrixSummary(matrix) })),
        identity: "d_(n+1)s_n+s_(n-1)d_n=identity over Z",
        checks: contractionChecks,
        consequence: "ker d_n=im d_(n+1) as integer lattices, so there is no rational-rank or saturation/torsion gap",
      },
    },
    coefficientsAndCocycle: {
      M: "Z[Q] with regular Q-action",
      A: "ker(augmentation mod 2), the even-augmentation rank-4 lattice",
      ABasisInM: ["2e_1", "e_x-e_1", "e_y-e_1", "e_xy-e_1"],
      ABasisMatrix: matrixSummary(lab.aToM),
      primitive: {
        formula: "F(q[g|h])=mu(g,h)e_q",
        matrix: matrixSummary(lab.F),
      },
      kappa: {
        formula: "kappa=F d3",
        independentlyRecomputedFromInhomogeneousCocycleFormula: true,
        MCoordinateMatrix: matrixSummary(lab.kappaM),
        ACoordinateMatrix: matrixSummary(lab.kappaA),
        equalityWithDirectFormula: matricesEqual(lab.kappaM, lab.directKappaM),
        kappaD4Zero: matrixIsZero(lab.kappaD4),
        kappaD4Equations: lab.kappaD4.rows * lab.kappaD4.cols,
      },
    },
    representer: {
      definition: "M_kappa=coker(D3), D3=(kappa,-d3):B3->A direct-sum B2",
      D3: matrixSummary(lab.D3),
      presentationGenerators: lab.D3.rows,
      relationColumns: lab.D3.cols,
      exactRelationRank: lab.relationRank,
      integerRank: lab.representerRank,
      finiteRank: true,
      infiniteObjectClaim: false,
      rankProof: [
        "ker(D3)=ker(d3), because the lower component of D3 is -d3 and kappa=F d3",
        "the integral contraction proves ker(d3)=im(d4) as lattices and rank(d4)=81",
        "therefore rank(D3)=108-81=27 and rank(M_kappa)=4+36-27=13",
      ],
      integerLinearAlgebraDisclosure: {
        smithNormalFormComputed: false,
        replacement: "explicit sparse integer contracting-homotopy identities and integral right inverses",
        strength: "proves lattice equality rather than rational equality, excluding an unmeasured saturation or torsion gap",
        limitation: "the certificate does not print Smith invariant factors; torsion-freeness instead follows from the proved extension of two free abelian groups",
      },
      QEquivariance: lab.actionAudits,
      injection: {
        map: "j:A->M_kappa, a|->[a,0]",
        presentationMatrix: matrixSummary(lab.j),
        proved: true,
        exactIntegerProof: [
          "if j(a)=0 then (a,0)=D3(z), hence d3(z)=0 and a=kappa(z)",
          "the checked integral contraction gives z=d4 s3(z)",
          "the checked equation kappa d4=0 gives a=0",
        ],
        torsionOrSaturationAssumptionUsed: false,
      },
      exactSequence: {
        sequence: "0->A->M_kappa->im(d2)->0",
        projection: "[a,b]|->d2(b)",
        projectionPresentationMatrix: matrixSummary(lab.projectionPresentation),
        projectionKillsD3: matrixIsZero(composeMatrices(lab.projectionPresentation, lab.D3)),
        surjectiveOntoImageByDefinition: true,
        kernelProof: "if d2(b)=0, the integral contraction gives b=d3 s2(b), hence [a,b]=[a+kappa s2(b),0]",
        rankA: 4,
        rankImageD2: lab.projectionImageRank,
        rankMiddle: lab.representerRank,
        ranksAdd: lab.representerRank === 4 + lab.projectionImageRank,
        middleIsTorsionFree: true,
      },
    },
    canonicalMapToFreeCrossedModule: {
      formula: "Phi([a,b])=a+F(b) in M=Z[Q]",
      presentationMatrix: matrixSummary(lab.representerMap),
      killsD3: matrixIsZero(composeMatrices(lab.representerMap, lab.D3)),
      QEquivariant: lab.actionAudits.every((audit) => audit.canonicalMapEquivariant),
      explicitIntegralRightInverse: matrixSummary(lab.rightInverse),
      rightInverseVerified: matricesEqual(
        composeMatrices(lab.representerMap, lab.rightInverse),
        identityMatrix(4),
      ),
      surjective: true,
      targetRank: 4,
      sourceRank: lab.representerRank,
      isomorphism: false,
      kernelRank: lab.representerRank - 4,
    },
    truncationAudit: {
      doctrine: "transparent normalized-free-cell continuation",
      calculations: lab.truncations,
      generalRankRecurrence: "rank(d_(n+1))=4*3^n-rank(d_n)=3^(n+1)",
      conclusion: "truncating after B_N leaves top homology of rank (|Q|-1)^(N+1)",
      scopeWarning: "this is a property of the declared normalized-free-cell doctrine, not a proof that every representer or M_kappa is infinite",
    },
    comma: {
      schema: "oasis.comma.v1",
      claim: "the Postnikov primitive question has a finite rank-13 normalized-bar representer mapping onto Z[V4]",
      objects: "normalized free Z[V4]-bar modules through degree 5, A, M_kappa, and M=Z[V4]",
      method: "exact sparse integer matrices, explicit integral contraction, and deterministic quotient-map witnesses",
      measurement: "all matrix identities are integral with zero tolerance",
      assumptions: [
        "the transparent doctrine uses normalized free bar cells",
        "mu and kappa are the predecessor D8 extension factor and its chosen integral lift",
      ],
    },
    evaluationPolicy: {
      arithmetic: "exact signed integer sparse matrices",
      equality: "canonical sparse-column equality",
      injectivityPolicy: "require an integral contraction identity and kappa d4=0; rational rank alone is insufficient",
      exactnessPolicy: "require presentation maps to compose to zero and integral contraction witnesses for both kernel equalities",
      surjectivityPolicy: "require an explicit integral right inverse",
      replayPolicy: "rebuild every matrix and compare the canonical certificate and SHA-256 digest",
      stochasticChoices: 0,
      tolerance: 0,
    },
    theoremBoundary: {
      normalizedFreeBarThroughDegree5Constructed: true,
      integralExactnessThroughDegree4Certified: true,
      representerRank13Proved: true,
      representerItselfInfinite: false,
      infiniteBarTailRequiredByTransparentDoctrine: true,
      everyPossibleRepresenterRequiresInfiniteTail: false,
      nonSoficityEstablished: false,
      hodgeTheoryEstablished: false,
      universalApproximationArchitectureEstablished: false,
      majorOpenConjectureResolved: false,
    },
  };
  return { ...body, certificateDigest: digest(body) };
}

function validateCertificate(candidate, expected) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  const { certificateDigest, ...body } = candidate;
  if (certificateDigest !== digest(body)) return false;
  return canonical(candidate) === canonical(expected);
}

export function replayGenesisBarPrimitiveRepresenterCertificate(candidate) {
  const expected = buildCertificate(buildLaboratory());
  return validateCertificate(candidate, expected);
}

function tamperSuite(certificate) {
  const cases = [];
  function reject(name, mutate, reseal = true) {
    const tampered = cloneJson(certificate);
    mutate(tampered);
    if (reseal) {
      const { certificateDigest: ignored, ...body } = tampered;
      tampered.certificateDigest = digest(body);
    }
    const rejected = !validateCertificate(tampered, certificate);
    assert(rejected, `tamper accepted: ${name}`);
    cases.push({ name, rejected });
  }
  reject("predecessor digest", (value) => { value.predecessor.certificateDigest = "0".repeat(64); });
  reject("group order", (value) => { value.normalizedBarResolution.groupOrder = 3; });
  reject("alphabet", (value) => { value.normalizedBarResolution.nonidentityAlphabet.pop(); });
  reject("B3 orbit count", (value) => { value.normalizedBarResolution.cellOrbitCounts.B3 = 26; });
  reject("B4 orbit count", (value) => { value.normalizedBarResolution.requestedTailCellOrbitCounts.degree4 = 80; });
  reject("B5 orbit count", (value) => { value.normalizedBarResolution.requestedTailCellOrbitCounts.degree5 = 242; });
  reject("B3 rank", (value) => { value.normalizedBarResolution.underlyingIntegerRanks.B3 = 107; });
  reject("d3 matrix digest", (value) => { value.normalizedBarResolution.boundaryMatrices.B3.digest = "f".repeat(64); });
  reject("d4 rank", (value) => { value.normalizedBarResolution.boundaryRanks.d4 = 80; });
  reject("square zero", (value) => { value.normalizedBarResolution.squareZeroChecks[1].equations -= 1; });
  reject("contraction identity", (value) => { value.normalizedBarResolution.integralContraction.identity = "rationally only"; });
  reject("contraction digest", (value) => { value.normalizedBarResolution.integralContraction.matrices[3].digest = "0".repeat(64); });
  reject("A basis", (value) => { value.coefficientsAndCocycle.ABasisInM[0] = "e_1"; });
  reject("primitive digest", (value) => { value.coefficientsAndCocycle.primitive.matrix.digest = "0".repeat(64); });
  reject("kappa formula", (value) => { value.coefficientsAndCocycle.kappa.formula = "kappa=0"; });
  reject("kappa d4", (value) => { value.coefficientsAndCocycle.kappa.kappaD4Zero = false; });
  reject("D3 digest", (value) => { value.representer.D3.digest = "0".repeat(64); });
  reject("relation rank", (value) => { value.representer.exactRelationRank = 26; });
  reject("representer rank", (value) => { value.representer.integerRank = 12; });
  reject("injection", (value) => { value.representer.injection.proved = false; });
  reject("torsion assumption", (value) => { value.representer.injection.torsionOrSaturationAssumptionUsed = true; });
  reject("exact sequence", (value) => { value.representer.exactSequence.rankImageD2 = 8; });
  reject("equivariance", (value) => { value.representer.QEquivariance[0].D3Equivariant = false; });
  reject("canonical map relation", (value) => { value.canonicalMapToFreeCrossedModule.killsD3 = false; });
  reject("surjectivity", (value) => { value.canonicalMapToFreeCrossedModule.surjective = false; });
  reject("target rank", (value) => { value.canonicalMapToFreeCrossedModule.targetRank = 5; });
  reject("isomorphism", (value) => { value.canonicalMapToFreeCrossedModule.isomorphism = true; });
  reject("truncation rank", (value) => { value.truncationAudit.calculations[0].topHomologyRank = 80; });
  reject("scope warning", (value) => { value.truncationAudit.scopeWarning = "all representers are infinite"; });
  reject("evaluation tolerance", (value) => { value.evaluationPolicy.tolerance = 1e-9; });
  reject("infinite representer overclaim", (value) => { value.theoremBoundary.representerItselfInfinite = true; });
  reject("universal infinite-tail overclaim", (value) => { value.theoremBoundary.everyPossibleRepresenterRequiresInfiniteTail = true; });
  reject("nonsofic overclaim", (value) => { value.theoremBoundary.nonSoficityEstablished = true; });
  reject("Hodge overclaim", (value) => { value.theoremBoundary.hodgeTheoryEstablished = true; });
  reject("undeclared field", (value) => { value.theoremBoundary.PEqualsNP = true; });
  reject("certificate digest", (value) => { value.certificateDigest = "f".repeat(64); }, false);
  return cases;
}

export function runGenesisBarPrimitiveRepresenter() {
  const firstCertificate = buildCertificate(buildLaboratory());
  const secondCertificate = buildCertificate(buildLaboratory());
  assert.equal(canonical(firstCertificate), canonical(secondCertificate));
  assert.equal(firstCertificate.certificateDigest, secondCertificate.certificateDigest);
  assert(validateCertificate(firstCertificate, secondCertificate));
  assert(replayGenesisBarPrimitiveRepresenterCertificate(firstCertificate));
  const tamperCases = tamperSuite(firstCertificate);
  return {
    schema: "oasis.genesis-bar-primitive-representer.v1",
    status: "PASS",
    result: {
      quotient: "Q=V4",
      boundaryMatrices: 5,
      squareZeroChecks: firstCertificate.normalizedBarResolution.squareZeroChecks.length,
      integralContractionDegrees: firstCertificate.normalizedBarResolution.integralContraction.checks.length,
      cellOrbitCounts: firstCertificate.normalizedBarResolution.requestedTailCellOrbitCounts,
      kappaD4Zero: firstCertificate.coefficientsAndCocycle.kappa.kappaD4Zero,
      representerRank: firstCertificate.representer.integerRank,
      injectionProved: firstCertificate.representer.injection.proved,
      exactSequence: firstCertificate.representer.exactSequence.sequence,
      canonicalMapSurjective: firstCertificate.canonicalMapToFreeCrossedModule.surjective,
      canonicalMapIsomorphism: firstCertificate.canonicalMapToFreeCrossedModule.isomorphism,
      truncationTopHomologyRanks: firstCertificate.truncationAudit.calculations.map(
        ({ topDegree, topHomologyRank }) => ({ topDegree, topHomologyRank }),
      ),
    },
    deterministicReplay: {
      independentlyRebuiltTwice: true,
      canonicalEquality: true,
      certificateDigest: firstCertificate.certificateDigest,
    },
    theoremBoundary: firstCertificate.theoremBoundary,
    certificate: firstCertificate,
    tamper: {
      attempted: tamperCases.length,
      rejected: tamperCases.filter(({ rejected }) => rejected).length,
      cases: tamperCases,
    },
  };
}

function printPassLines(result) {
  console.log("PASS normalized bar: exact integer boundary matrices B1..B5 and d^2=0");
  console.log("PASS integral exactness: explicit contracting homotopy through degree 4");
  console.log("PASS cocycle: kappa=F d3 in A and kappa d4=0");
  console.log("PASS representer: j injective, rank_Z M_kappa=13, exact 0->A->M_kappa->im d2->0");
  console.log("PASS canonical map: M_kappa->Z[V4] is equivariant, split-surjective as an abelian map, and nonisomorphic");
  console.log("PASS truncations: top ranks 81 and 243 for N=3 and N=4 under the normalized-free-cell doctrine");
  console.log(`PASS deterministic replay: ${result.deterministicReplay.certificateDigest}`);
  console.log(`PASS replay/tamper: ${result.tamper.rejected}/${result.tamper.attempted} mutations rejected`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = runGenesisBarPrimitiveRepresenter();
  printPassLines(result);
  console.log(JSON.stringify(result, null, 2));
}
