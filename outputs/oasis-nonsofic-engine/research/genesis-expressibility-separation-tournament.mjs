import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SCHEMA = "oasis.genesis-expressibility-separation-tournament.v1";
const CATALYST_DEGREE_BOUND = 5;

function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((key) => (
      JSON.stringify(key) + ":" + canonical(value[key])
    )).join(",") + "}";
  }
  return JSON.stringify(value);
}

function digest(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) deepFreeze(value[key], seen);
  return Object.freeze(value);
}

function isDeepFrozen(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value)
    && Reflect.ownKeys(value).every((key) => isDeepFrozen(value[key], seen));
}

const BORN_ADDRESS_SIZES = deepFreeze([2, 3, 4]);

function compareNumbers(left, right) {
  return left - right;
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function range(size) {
  return Array.from({ length: size }, (_, index) => index);
}

function permutations(values) {
  if (values.length === 0) return [[]];
  const result = [];
  values.forEach((head, index) => {
    const tail = values.slice(0, index).concat(values.slice(index + 1));
    for (const suffix of permutations(tail)) result.push([head, ...suffix]);
  });
  return result;
}

function enumerateVectors(length, alphabetSize) {
  const result = [];
  const current = Array(length).fill(0);
  function visit(index) {
    if (index === length) {
      result.push([...current]);
      return;
    }
    for (let value = 0; value < alphabetSize; value += 1) {
      current[index] = value;
      visit(index + 1);
    }
  }
  visit(0);
  return result;
}

function supportFromMask(mask, size) {
  return range(size).filter((index) => ((mask >> index) & 1) !== 0);
}

function functionName(fn) {
  return fn.join("");
}

function secondIterate(fn, start) {
  return fn[fn[start]];
}

function adaptiveSecondIterate(fn, start) {
  const bornAddress = fn[start];
  return {
    firstQuery: start,
    firstAnswer: bornAddress,
    secondQuery: bornAddress,
    secondAnswer: fn[bornAddress],
    output: fn[bornAddress],
    oracleCalls: 2,
    distinctAddresses: new Set([start, bornAddress]).size,
  };
}

function transcript(fn, support) {
  return support.map((address) => fn[address]).join(",");
}

function analyzeSupport(functions, support, start) {
  const cells = new Map();
  for (const fn of functions) {
    const key = transcript(fn, support);
    const output = secondIterate(fn, start);
    if (!cells.has(key)) cells.set(key, new Map());
    const outputs = cells.get(key);
    if (!outputs.has(output)) outputs.set(output, []);
    outputs.get(output).push(fn);
  }
  const ambiguous = [...cells.entries()].filter(([, outputs]) => outputs.size > 1);
  let witness = null;
  if (ambiguous.length > 0) {
    const [key, outputs] = ambiguous.sort(([left], [right]) => compareStrings(left, right))[0];
    const outputValues = [...outputs.keys()].sort(compareNumbers);
    witness = {
      transcript: key,
      firstFunction: functionName(outputs.get(outputValues[0])[0]),
      firstOutput: outputValues[0],
      secondFunction: functionName(outputs.get(outputValues[1])[0]),
      secondOutput: outputValues[1],
    };
  }
  return {
    determinesSecondIterate: ambiguous.length === 0,
    transcriptCount: cells.size,
    ambiguousTranscriptCount: ambiguous.length,
    witness,
  };
}

function symbolicSupportWitness(size, support, start = 0) {
  assert(size >= 2);
  const supportSet = new Set(support);
  assert(support.length < size);
  const left = Array(size).fill(0);
  const right = Array(size).fill(0);
  if (!supportSet.has(start)) {
    const other = start === 0 ? 1 : 0;
    left[start] = start;
    right[start] = other;
    left[other] = other;
    right[other] = other;
  } else {
    const omitted = range(size).find((address) => !supportSet.has(address));
    assert.notEqual(omitted, undefined);
    left[start] = omitted;
    right[start] = omitted;
    left[omitted] = 0;
    right[omitted] = 1;
  }
  assert.equal(transcript(left, support), transcript(right, support));
  assert.notEqual(secondIterate(left, start), secondIterate(right, start));
  return {
    firstFunction: functionName(left),
    firstOutput: secondIterate(left, start),
    secondFunction: functionName(right),
    secondOutput: secondIterate(right, start),
  };
}

function invertPermutation(permutation) {
  const inverse = Array(permutation.length);
  permutation.forEach((image, source) => {
    inverse[image] = source;
  });
  return inverse;
}

function conjugateFunction(fn, permutation) {
  const inverse = invertPermutation(permutation);
  return range(fn.length).map((address) => permutation[fn[inverse[address]]]);
}

function transformSupport(support, permutation) {
  return support.map((address) => permutation[address]).sort(compareNumbers);
}

function buildBornAddressEvidence() {
  const calibrations = [];
  for (const size of BORN_ADDRESS_SIZES) {
    const functions = enumerateVectors(size, size);
    let adaptiveCorrectCases = 0;
    let adaptiveCalls = 0;
    let adaptiveDistinctAddressMaximum = 0;
    for (const fn of functions) {
      const run = adaptiveSecondIterate(fn, 0);
      assert.equal(run.output, secondIterate(fn, 0));
      adaptiveCorrectCases += 1;
      adaptiveCalls += run.oracleCalls;
      adaptiveDistinctAddressMaximum = Math.max(adaptiveDistinctAddressMaximum, run.distinctAddresses);
    }
    const supports = [];
    for (let mask = 0; mask < (1 << size); mask += 1) {
      const support = supportFromMask(mask, size);
      const analysis = analyzeSupport(functions, support, 0);
      if (support.length < size) symbolicSupportWitness(size, support, 0);
      supports.push({
        support,
        supportSize: support.length,
        ...analysis,
      });
    }
    const successfulSupports = supports.filter((entry) => entry.determinesSecondIterate);
    assert.deepEqual(successfulSupports.map((entry) => entry.support), [range(size)]);
    calibrations.push({
      domainSize: size,
      functionCount: functions.length,
      adaptiveCorrectCases,
      adaptiveOracleCallsPerFunction: adaptiveCalls / functions.length,
      adaptiveDistinctAddressMaximum,
      nonadaptiveSupportCount: supports.length,
      successfulNonadaptiveSupports: successfulSupports.map((entry) => entry.support),
      minimumUniversalNonadaptiveSupport: successfulSupports[0].supportSize,
      failuresBySupportSize: range(size).map((supportSize) => ({
        supportSize,
        tested: supports.filter((entry) => entry.supportSize === supportSize).length,
        failed: supports.filter((entry) => (
          entry.supportSize === supportSize && !entry.determinesSecondIterate
        )).length,
      })),
      canonicalProperSupportWitness: supports.find((entry) => entry.supportSize === size - 1).witness,
    });
  }

  let symbolicWitnessesChecked = 0;
  for (let size = 2; size <= 8; size += 1) {
    for (let mask = 0; mask < (1 << size) - 1; mask += 1) {
      symbolicSupportWitness(size, supportFromMask(mask, size), 0);
      symbolicWitnessesChecked += 1;
    }
  }

  return {
    exactStatement: "For every finite domain X with |X|=N>=2 and fixed x, two sequential oracle calls compute f(f(x)); a nonadaptive observer whose entire transcript is f restricted to a fixed support S determines f(f(x)) for every f:X->X only if S=X.",
    proofKernel: {
      adaptive: "Query x to obtain y=f(x), then query the answer-born address y to obtain f(y)=f(f(x)).",
      nonadaptive: "If x is omitted, vary f(x) while fixing the support; if x is retained but y is omitted, set f(x)=y and vary f(y). In either case two functions share the maximal support transcript but have different targets.",
      maximalTranscriptBoundary: "Any deterministic bounded-support feature factors through the full restriction transcript f|S, so failure of that maximal transcript implies failure of every feature using only S.",
    },
    exhaustiveCalibrations: calibrations,
    symbolicWitnessesChecked,
    theoremScope: "Fixed nonadaptive support, deterministic exact recovery, arbitrary functions on a finite set. This does not lower-bound adaptive algorithms, randomized approximation, or features allowed to inspect a number of addresses growing to N.",
  };
}

function buildBornAddressRelabelingControl() {
  const size = 4;
  const functions = enumerateVectors(size, size);
  const relabelings = permutations(range(size));
  let adaptiveNaturalityCases = 0;
  let supportNaturalityCases = 0;
  for (const permutation of relabelings) {
    for (const fn of functions) {
      for (const start of range(size)) {
        const transformed = conjugateFunction(fn, permutation);
        const originalOutput = adaptiveSecondIterate(fn, start).output;
        const transformedOutput = adaptiveSecondIterate(transformed, permutation[start]).output;
        assert.equal(transformedOutput, permutation[originalOutput]);
        adaptiveNaturalityCases += 1;
      }
    }
    for (let mask = 0; mask < (1 << size); mask += 1) {
      const support = supportFromMask(mask, size);
      const transformedSupport = transformSupport(support, permutation);
      const original = analyzeSupport(functions, support, 0).determinesSecondIterate;
      const transformedStart = permutation[0];
      const transformed = analyzeSupport(functions, transformedSupport, transformedStart)
        .determinesSecondIterate;
      assert.equal(transformed, original);
      supportNaturalityCases += 1;
    }
  }
  return {
    domainSize: size,
    relabelings: relabelings.length,
    adaptiveNaturalityCases,
    supportNaturalityCases,
    pass: true,
  };
}

const ENABLING_NODES = deepFreeze([
  { id: "root", depth: 0, legalQuestions: ["route"] },
  { id: "left", depth: 1, legalQuestions: ["inspect:left"] },
  { id: "right", depth: 1, legalQuestions: ["inspect:right"] },
  { id: "left:0", depth: 2, legalQuestions: [] },
  { id: "left:1", depth: 2, legalQuestions: [] },
  { id: "right:0", depth: 2, legalQuestions: [] },
  { id: "right:1", depth: 2, legalQuestions: [] },
]);

const ENABLING_EDGES = deepFreeze([
  { from: "root", question: "route", answer: "left", to: "left" },
  { from: "root", question: "route", answer: "right", to: "right" },
  { from: "left", question: "inspect:left", answer: "0", to: "left:0" },
  { from: "left", question: "inspect:left", answer: "1", to: "left:1" },
  { from: "right", question: "inspect:right", answer: "0", to: "right:0" },
  { from: "right", question: "inspect:right", answer: "1", to: "right:1" },
]);

function edgeKey(edge) {
  return canonical([edge.from, edge.question, edge.answer, edge.to]);
}

function enablingInputKey(edge) {
  return canonical([edge.from, edge.question, edge.answer]);
}

function enabledQuestionKey(nodeId, question) {
  return canonical([nodeId, question]);
}

function analyzeEnablingGraph(nodesInput = ENABLING_NODES, edgesInput = ENABLING_EDGES) {
  const nodes = [...nodesInput].sort((left, right) => compareStrings(left.id, right.id));
  const edges = [...edgesInput].sort((left, right) => compareStrings(edgeKey(left), edgeKey(right)));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  assert.equal(byId.size, nodes.length);
  for (const node of nodes) {
    assert.equal(new Set(node.legalQuestions).size, node.legalQuestions.length);
  }
  const edgeKeys = edges.map(edgeKey);
  const inputKeys = edges.map(enablingInputKey);
  assert.equal(new Set(edgeKeys).size, edges.length);
  assert.equal(new Set(inputKeys).size, edges.length);
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    assert(byId.has(edge.from));
    assert(byId.has(edge.to));
    assert(byId.get(edge.from).legalQuestions.includes(edge.question));
    assert(byId.get(edge.to).depth > byId.get(edge.from).depth);
    adjacency.get(edge.from).push(edge.to);
  }
  const declaredQuestionKeys = nodes.flatMap((node) => (
    node.legalQuestions.map((question) => enabledQuestionKey(node.id, question))
  ));
  const coveredQuestionKeys = new Set(edges.map((edge) => enabledQuestionKey(edge.from, edge.question)));
  assert(declaredQuestionKeys.every((key) => coveredQuestionKeys.has(key)));
  assert.equal(coveredQuestionKeys.size, declaredQuestionKeys.length);

  const reachable = new Set(["root"]);
  const queue = ["root"];
  while (queue.length > 0) {
    const source = queue.shift();
    for (const target of adjacency.get(source)) {
      if (!reachable.has(target)) {
        reachable.add(target);
        queue.push(target);
      }
    }
  }
  assert.equal(reachable.size, nodes.length);

  let nonemptyClosedPaths = 0;
  function walk(origin, current, visited) {
    for (const target of adjacency.get(current)) {
      if (target === origin) nonemptyClosedPaths += 1;
      if (!visited.has(target)) walk(origin, target, new Set([...visited, target]));
    }
  }
  for (const node of nodes) walk(node.id, node.id, new Set([node.id]));
  assert.equal(nonemptyClosedPaths, 0);

  const rootQuestions = new Set(byId.get("root").legalQuestions);
  const births = nodes.filter((node) => node.depth > 0).flatMap((node) => (
    node.legalQuestions.filter((question) => !rootQuestions.has(question)).map((question) => ({
      at: node.id,
      depth: node.depth,
      question,
    }))
  ));
  assert.deepEqual(births.map((entry) => entry.question).sort(compareStrings), [
    "inspect:left", "inspect:right",
  ]);

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    maximumDepth: Math.max(...nodes.map((node) => node.depth)),
    reachableNodeCount: reachable.size,
    nonemptyClosedPaths,
    noNonemptyClosedPaths: nonemptyClosedPaths === 0,
    keyAudit: {
      uniqueNodeIds: byId.size,
      uniqueEdgeKeys: new Set(edgeKeys).size,
      uniqueInputKeys: new Set(inputKeys).size,
      declaredLegalQuestionKeys: declaredQuestionKeys.length,
      coveredLegalQuestionKeys: coveredQuestionKeys.size,
      everyLegalQuestionCovered: true,
    },
    bornQuestions: births,
    staticTreeEncoding: {
      predeclaredNodeCount: nodes.length,
      predeclaredEdgeCount: edges.length,
      dynamicTraversalReachesEveryPredeclaredNode: reachable.size === nodes.length,
    },
  };
}

function transformEnablingName(value, swapBranch, flipAnswer) {
  let transformed = value;
  if (swapBranch) {
    transformed = transformed.replace("left", "TEMP").replace("right", "left").replace("TEMP", "right");
  }
  if (flipAnswer && /:(0|1)$/.test(transformed)) {
    transformed = transformed.slice(0, -1) + (transformed.endsWith("0") ? "1" : "0");
  }
  return transformed;
}

function transformEnablingQuestion(question, swapBranch) {
  return swapBranch ? transformEnablingName(question, true, false) : question;
}

function buildEnablingRelabelingControl() {
  const originalEdges = [...ENABLING_EDGES].map(edgeKey).sort(compareStrings);
  let tested = 0;
  for (const swapBranch of [false, true]) {
    for (const flipAnswer of [false, true]) {
      const transformedEdges = ENABLING_EDGES.map((edge) => ({
        from: transformEnablingName(edge.from, swapBranch, flipAnswer),
        question: transformEnablingQuestion(edge.question, swapBranch),
        answer: edge.question === "route"
          ? transformEnablingName(edge.answer, swapBranch, false)
          : (flipAnswer ? (edge.answer === "0" ? "1" : "0") : edge.answer),
        to: transformEnablingName(edge.to, swapBranch, flipAnswer),
      })).map(edgeKey).sort(compareStrings);
      assert.deepEqual(transformedEdges, originalEdges);
      tested += 1;
    }
  }
  assert.deepEqual(
    analyzeEnablingGraph(ENABLING_NODES, [...ENABLING_EDGES].reverse()),
    analyzeEnablingGraph(),
  );
  return {
    branchAndAnswerRelabelingsTested: tested,
    edgeOrderPresentationControl: true,
    pass: true,
  };
}

function buildZeroLoopEvidence() {
  const analysis = analyzeEnablingGraph();
  return {
    exactStatement: "A finite acyclic interaction can make a later question legal even though there is no nonidentity loop on which holonomy could be evaluated.",
    graph: {
      nodes: clone(ENABLING_NODES),
      edges: clone(ENABLING_EDGES),
    },
    analysis,
    exactConclusion: "The questions inspect:left and inspect:right are absent at the root and legal after their respective route answers, while every edge strictly raises depth and the graph has zero nonempty closed paths.",
    boundary: "An external observer can predeclare this entire seven-node decision tree. The certificate proves only a change in locally legal questions relative to the root language, not absolute undefinability by a larger static metalanguage.",
  };
}

function wordKey(word) {
  return word.join(",");
}

function enumerateWords(generatorCount, degreeBound) {
  return enumerateVectors(generatorCount, degreeBound + 1)
    .filter((word) => word.reduce((sum, value) => sum + value, 0) <= degreeBound)
    .sort((left, right) => compareStrings(wordKey(left), wordKey(right)));
}

function canSubtract(word, subtrahend) {
  return word.every((value, index) => value >= subtrahend[index]);
}

function replaceSubword(word, left, right) {
  return word.map((value, index) => value - left[index] + right[index]);
}

class UnionFind {
  constructor(size) {
    this.parent = range(size);
  }

  find(index) {
    let root = index;
    while (this.parent[root] !== root) root = this.parent[root];
    while (this.parent[index] !== index) {
      const next = this.parent[index];
      this.parent[index] = root;
      index = next;
    }
    return root;
  }

  union(left, right) {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot === rightRoot) return;
    this.parent[Math.max(leftRoot, rightRoot)] = Math.min(leftRoot, rightRoot);
  }
}

function analyzeCommutativePresentation(relations, degreeBound) {
  const words = enumerateWords(3, degreeBound);
  const index = new Map(words.map((word, position) => [wordKey(word), position]));
  const unionFind = new UnionFind(words.length);
  let rewriteEdges = 0;
  for (const word of words) {
    for (const relation of relations) {
      for (const [left, right] of [[relation.left, relation.right], [relation.right, relation.left]]) {
        if (!canSubtract(word, left)) continue;
        const target = replaceSubword(word, left, right);
        const targetIndex = index.get(wordKey(target));
        assert.notEqual(targetIndex, undefined);
        unionFind.union(index.get(wordKey(word)), targetIndex);
        rewriteEdges += 1;
      }
    }
  }
  const rootFor = (word) => unionFind.find(index.get(wordKey(word)));
  const reachable = (left, right) => rootFor(left) === rootFor(right);
  const classMembers = new Map();
  words.forEach((word, position) => {
    const root = unionFind.find(position);
    if (!classMembers.has(root)) classMembers.set(root, []);
    classMembers.get(root).push(wordKey(word));
  });
  const classCountsByDegree = range(degreeBound + 1).map((degree) => {
    const roots = new Set(words.filter((word) => (
      word.reduce((sum, value) => sum + value, 0) === degree
    )).map(rootFor));
    return { degree, classes: roots.size };
  });
  return {
    words,
    wordCount: words.length,
    rewriteEdges,
    classCount: classMembers.size,
    classCountsByDegree,
    reachable,
  };
}

function applyGeneratorPermutation(word, permutation) {
  const result = Array(word.length).fill(0);
  word.forEach((multiplicity, oldIndex) => {
    result[permutation[oldIndex]] = multiplicity;
  });
  return result;
}

const CATALYST_RELATION = deepFreeze({ left: [1, 0, 1], right: [0, 1, 1] });
const EQUALITY_RELATION = deepFreeze({ left: [1, 0, 0], right: [0, 1, 0] });

function buildCatalystEvidence() {
  const catalyst = analyzeCommutativePresentation([CATALYST_RELATION], CATALYST_DEGREE_BOUND);
  const equality = analyzeCommutativePresentation([EQUALITY_RELATION], CATALYST_DEGREE_BOUND);
  const a = [1, 0, 0];
  const b = [0, 1, 0];
  const aPlusC = [1, 0, 1];
  const bPlusC = [0, 1, 1];
  assert.equal(catalyst.reachable(a, b), false);
  assert.equal(catalyst.reachable(aPlusC, bPlusC), true);
  assert.equal(equality.reachable(a, b), true);

  const maxMonoidAssignment = { a: 0, b: 1, c: 1 };
  const maxOperation = (...values) => Math.max(...values, 0);
  assert.equal(
    maxOperation(maxMonoidAssignment.a, maxMonoidAssignment.c),
    maxOperation(maxMonoidAssignment.b, maxMonoidAssignment.c),
  );
  assert.notEqual(maxMonoidAssignment.a, maxMonoidAssignment.b);

  const catalystGroupRelation = CATALYST_RELATION.left.map((value, index) => (
    value - CATALYST_RELATION.right[index]
  ));
  const equalityGroupRelation = EQUALITY_RELATION.left.map((value, index) => (
    value - EQUALITY_RELATION.right[index]
  ));
  assert.deepEqual(catalystGroupRelation, equalityGroupRelation);

  return {
    exactStatement: "The commutative monoids <a,b,c | a+c=b+c> and <a,b,c | a=b> have the same Grothendieck-group relation a-b=0, but only the first exhibits a positive catalytic equality with a and b still distinct.",
    groupCompletion: {
      catalystRelationVector: catalystGroupRelation,
      equalityRelationVector: equalityGroupRelation,
      identicalRelationLattices: arraysEqual(catalystGroupRelation, equalityGroupRelation),
      commonGroup: "Z^3/<a-b> is isomorphic to Z^2",
    },
    globalInequalityWitness: {
      targetMonoid: "({0,1}, max, 0)",
      assignment: maxMonoidAssignment,
      relationRespected: true,
      distinguishesAFromB: true,
      proofRole: "A homomorphism respecting a+c=b+c but sending a and b to different elements proves a is not equal to b in the presented monoid.",
    },
    boundedPositiveUniverse: {
      degreeBound: CATALYST_DEGREE_BOUND,
      wordCount: catalyst.wordCount,
      catalystPresentation: {
        relation: "a+c=b+c",
        classCount: catalyst.classCount,
        classCountsByDegree: catalyst.classCountsByDegree,
        aEqualsB: catalyst.reachable(a, b),
        aPlusCEqualsBPlusC: catalyst.reachable(aPlusC, bPlusC),
      },
      cancellativePresentation: {
        relation: "a=b",
        classCount: equality.classCount,
        classCountsByDegree: equality.classCountsByDegree,
        aEqualsB: equality.reachable(a, b),
      },
    },
    theoremScope: "This separates positive monoid reachability from group completion. It does not say every endpoint-invariant component is catalytic, nor that group completion is the only possible static fossil.",
  };
}

function buildCatalystPresentationControl() {
  const presentations = [
    { name: "catalyst", relation: CATALYST_RELATION },
    { name: "equality", relation: EQUALITY_RELATION },
  ];
  const generatorPermutations = permutations([0, 1, 2]);
  let presentationsTested = 0;
  let pairwiseReachabilityChecks = 0;
  for (const presentation of presentations) {
    const original = analyzeCommutativePresentation([presentation.relation], CATALYST_DEGREE_BOUND);
    for (const permutation of generatorPermutations) {
      for (const reverseRelation of [false, true]) {
        const transformedLeft = applyGeneratorPermutation(
          reverseRelation ? presentation.relation.right : presentation.relation.left,
          permutation,
        );
        const transformedRight = applyGeneratorPermutation(
          reverseRelation ? presentation.relation.left : presentation.relation.right,
          permutation,
        );
        const transformed = analyzeCommutativePresentation([
          { left: transformedLeft, right: transformedRight },
        ], CATALYST_DEGREE_BOUND);
        assert.deepEqual(transformed.classCountsByDegree, original.classCountsByDegree);
        for (const left of original.words) {
          for (const right of original.words) {
            assert.equal(
              transformed.reachable(
                applyGeneratorPermutation(left, permutation),
                applyGeneratorPermutation(right, permutation),
              ),
              original.reachable(left, right),
            );
            pairwiseReachabilityChecks += 1;
          }
        }
        presentationsTested += 1;
      }
    }
  }
  return {
    generatorPermutations: generatorPermutations.length,
    relationOrientations: 2,
    presentationsTested,
    pairwiseReachabilityChecks,
    pass: true,
  };
}

function tupleKey(tuple) {
  return tuple.join("");
}

function sortRelation(relation) {
  return relation.map((tuple) => [...tuple]).sort((left, right) => (
    compareStrings(tupleKey(left), tupleKey(right))
  ));
}

function relationProjection(relation, coordinates) {
  return [...new Set(relation.map((tuple) => coordinates.map((coordinate) => tuple[coordinate]).join("")))]
    .sort(compareStrings);
}

function transformRelation(relation, coordinatePermutation, bitFlips) {
  return sortRelation(relation.map((tuple) => {
    const transformed = Array(tuple.length);
    tuple.forEach((value, oldCoordinate) => {
      transformed[coordinatePermutation[oldCoordinate]] = value ^ bitFlips[oldCoordinate];
    });
    return transformed;
  }));
}

function unaryAndPairwiseCoordinateSubsets() {
  return [[0], [1], [2], [0, 1], [0, 2], [1, 2]];
}

function buildHigherArityEvidence() {
  const full = enumerateVectors(3, 2);
  const even = full.filter((tuple) => (tuple[0] ^ tuple[1] ^ tuple[2]) === 0);
  const odd = full.filter((tuple) => (tuple[0] ^ tuple[1] ^ tuple[2]) === 1);
  const projections = unaryAndPairwiseCoordinateSubsets().map((coordinates) => {
    const evenProjection = relationProjection(even, coordinates);
    const fullProjection = relationProjection(full, coordinates);
    assert.deepEqual(evenProjection, fullProjection);
    return {
      coordinates,
      evenProjection,
      fullProjection,
      identical: true,
    };
  });
  assert.notDeepEqual(sortRelation(even), sortRelation(full));
  assert.equal(even.length, 4);
  assert.equal(full.length, 8);
  const flippedEven = transformRelation(even, [0, 1, 2], [1, 0, 0]);
  assert.deepEqual(flippedEven, sortRelation(odd));

  return {
    exactStatement: "The even-parity relation E subset {0,1}^3 and the full relation F={0,1}^3 have identical unary and pairwise relational projections, while E and F are distinguished at arity three.",
    relations: {
      evenParity: sortRelation(even),
      full: sortRelation(full),
      oddParityGaugeControl: sortRelation(odd),
    },
    cardinalities: {
      evenParity: even.length,
      full: full.length,
    },
    unaryAndPairwiseProjections: projections,
    ternaryDistinction: {
      relationsEqual: false,
      cardinalityDifference: full.length - even.length,
      cardinalityDifferencePreservedByEveryTupleBijection: true,
    },
    gaugeControl: "Flipping either one bit coordinate maps even parity to odd parity, so even-versus-odd alone is only a relabeling gauge; even-versus-full is not erased because cardinality is invariant.",
    theoremScope: "This is a relational arity separation. It does not imply that every linear or pairwise statistic fails for every probabilistic model, nor that ternary structure is intrinsically generative.",
  };
}

function buildHigherArityRelabelingControl() {
  const full = enumerateVectors(3, 2);
  const even = full.filter((tuple) => (tuple[0] ^ tuple[1] ^ tuple[2]) === 0);
  const odd = full.filter((tuple) => (tuple[0] ^ tuple[1] ^ tuple[2]) === 1);
  const coordinatePermutations = permutations([0, 1, 2]);
  const bitFlips = enumerateVectors(3, 2);
  let automorphismsTested = 0;
  let lowerProjectionChecks = 0;
  let evenOrbitHits = 0;
  let oddOrbitHits = 0;
  for (const coordinatePermutation of coordinatePermutations) {
    for (const flips of bitFlips) {
      const transformedEven = transformRelation(even, coordinatePermutation, flips);
      const transformedFull = transformRelation(full, coordinatePermutation, flips);
      assert.equal(transformedEven.length, 4);
      assert.equal(transformedFull.length, 8);
      for (const coordinates of unaryAndPairwiseCoordinateSubsets()) {
        assert.deepEqual(
          relationProjection(transformedEven, coordinates),
          relationProjection(transformedFull, coordinates),
        );
        lowerProjectionChecks += 1;
      }
      if (canonical(transformedEven) === canonical(sortRelation(even))) evenOrbitHits += 1;
      else if (canonical(transformedEven) === canonical(sortRelation(odd))) oddOrbitHits += 1;
      else assert.fail("Parity relation left its two-element gauge orbit");
      automorphismsTested += 1;
    }
  }
  assert.equal(evenOrbitHits, 24);
  assert.equal(oddOrbitHits, 24);
  return {
    coordinatePermutations: coordinatePermutations.length,
    independentBitFlips: bitFlips.length,
    cubeAutomorphismsTested: automorphismsTested,
    lowerProjectionChecks,
    evenOrbitHits,
    oddOrbitHits,
    cardinalitySeparationAlwaysPreserved: true,
    pass: true,
  };
}

const PROCESS_X = deepFreeze({
  name: "X=a.(b+c)",
  root: "x0",
  states: ["x0", "x1", "xb", "xc"],
  transitions: [
    { from: "x0", label: "a", to: "x1" },
    { from: "x1", label: "b", to: "xb" },
    { from: "x1", label: "c", to: "xc" },
  ],
});

const PROCESS_Y = deepFreeze({
  name: "Y=a.b+a.c",
  root: "y0",
  states: ["y0", "yb", "yc", "ybb", "ycc"],
  transitions: [
    { from: "y0", label: "a", to: "yb" },
    { from: "y0", label: "a", to: "yc" },
    { from: "yb", label: "b", to: "ybb" },
    { from: "yc", label: "c", to: "ycc" },
  ],
});

function processTransitionKey(transition) {
  return canonical([transition.from, transition.label, transition.to]);
}

function processAdjacency(process) {
  const stateSet = new Set(process.states);
  assert(stateSet.has(process.root));
  const adjacency = new Map(process.states.map((state) => [state, []]));
  for (const transition of process.transitions) {
    assert(stateSet.has(transition.from));
    assert(stateSet.has(transition.to));
    adjacency.get(transition.from).push(transition);
  }
  for (const transitions of adjacency.values()) {
    transitions.sort((left, right) => compareStrings(
      processTransitionKey(left), processTransitionKey(right),
    ));
  }
  return adjacency;
}

function completedTraceLanguage(process) {
  const adjacency = processAdjacency(process);
  const traces = [];
  function walk(state, trace, path) {
    assert(!path.has(state), "The calibration processes must be acyclic");
    const transitions = adjacency.get(state);
    if (transitions.length === 0) {
      traces.push(trace.join(""));
      return;
    }
    for (const transition of transitions) {
      walk(transition.to, [...trace, transition.label], new Set([...path, state]));
    }
  }
  walk(process.root, [], new Set());
  return [...new Set(traces)].sort(compareStrings);
}

function successorsAfterTrace(process, trace) {
  const adjacency = processAdjacency(process);
  let states = [process.root];
  for (const label of trace) {
    states = [...new Set(states.flatMap((state) => adjacency.get(state)
      .filter((transition) => transition.label === label)
      .map((transition) => transition.to)))];
  }
  return states.sort(compareStrings);
}

function readinessFamilyAfterTrace(process, trace) {
  const adjacency = processAdjacency(process);
  const family = new Map();
  for (const state of successorsAfterTrace(process, trace)) {
    const ready = [...new Set(adjacency.get(state).map((transition) => transition.label))]
      .sort(compareStrings);
    const key = canonical(ready);
    if (!family.has(key)) family.set(key, { states: [], ready });
    family.get(key).states.push(state);
  }
  return [...family.values()].sort((left, right) => compareStrings(
    canonical(left.ready), canonical(right.ready),
  ));
}

function greatestStrongBisimulation(left, right) {
  const leftAdjacency = processAdjacency(left);
  const rightAdjacency = processAdjacency(right);
  const pairKey = (leftState, rightState) => canonical([leftState, rightState]);
  const pairStates = new Map(left.states.flatMap((leftState) => (
    right.states.map((rightState) => [
      pairKey(leftState, rightState), [leftState, rightState],
    ])
  )));
  const relation = new Set(pairStates.keys());
  let changed = true;
  let rounds = 0;
  const hasMatch = (transition, candidates, leftToRight) => candidates.some((candidate) => (
    candidate.label === transition.label
      && relation.has(leftToRight
        ? pairKey(transition.to, candidate.to)
        : pairKey(candidate.to, transition.to))
  ));
  while (changed) {
    changed = false;
    rounds += 1;
    for (const pair of [...relation].sort(compareStrings)) {
      const [leftState, rightState] = pairStates.get(pair);
      const leftTransitions = leftAdjacency.get(leftState);
      const rightTransitions = rightAdjacency.get(rightState);
      const leftTransfer = leftTransitions.every((transition) => (
        hasMatch(transition, rightTransitions, true)
      ));
      const rightTransfer = rightTransitions.every((transition) => (
        hasMatch(transition, leftTransitions, false)
      ));
      if (!leftTransfer || !rightTransfer) {
        relation.delete(pair);
        changed = true;
      }
    }
  }
  return {
    rounds,
    relation: [...relation].sort(compareStrings).map((pair) => pairStates.get(pair)),
    rootsRelated: relation.has(pairKey(left.root, right.root)),
  };
}

function relabelProcessActions(process, actionPermutation) {
  const labels = ["a", "b", "c"];
  const actionMap = new Map(labels.map((label, index) => [label, labels[actionPermutation[index]]]));
  return {
    ...process,
    transitions: process.transitions.map((transition) => ({
      ...transition,
      label: actionMap.get(transition.label),
    })),
  };
}

function buildTraceBranchingEvidence() {
  const tracesX = completedTraceLanguage(PROCESS_X);
  const tracesY = completedTraceLanguage(PROCESS_Y);
  assert.deepEqual(tracesX, ["ab", "ac"]);
  assert.deepEqual(tracesY, tracesX);
  const readinessX = readinessFamilyAfterTrace(PROCESS_X, ["a"]);
  const readinessY = readinessFamilyAfterTrace(PROCESS_Y, ["a"]);
  assert.deepEqual(readinessX.map((entry) => entry.ready), [["b", "c"]]);
  assert.deepEqual(readinessY.map((entry) => entry.ready), [["b"], ["c"]]);
  const bisimulation = greatestStrongBisimulation(PROCESS_X, PROCESS_Y);
  assert.equal(bisimulation.rootsRelated, false);
  return {
    exactStatement: "The finite processes X=a.(b+c) and Y=a.b+a.c have the same completed trace language {ab,ac}, but after a, X retains one state offering both b and c while Y has already committed to one of two states.",
    processes: {
      X: clone(PROCESS_X),
      Y: clone(PROCESS_Y),
    },
    completedTraceLanguages: {
      X: tracesX,
      Y: tracesY,
      identical: true,
    },
    postAReadiness: {
      X: readinessX,
      Y: readinessY,
      identical: false,
    },
    strongBisimulation: bisimulation,
    exactConclusion: "Completed traces erase the counterfactual branching retained after the first event; readiness and strong bisimulation detect it.",
    theoremScope: "This is a standard process-semantics separation between trace and branching observations, not a new semantics and not evidence that every history-sensitive phenomenon requires a growing language.",
  };
}

function buildTraceBranchingRelabelingControl() {
  const actionPermutations = permutations([0, 1, 2]);
  let traceChecks = 0;
  let bisimulationChecks = 0;
  for (const permutation of actionPermutations) {
    const transformedX = relabelProcessActions(PROCESS_X, permutation);
    const transformedY = relabelProcessActions(PROCESS_Y, permutation);
    assert.deepEqual(
      completedTraceLanguage(transformedX),
      completedTraceLanguage(transformedY),
    );
    traceChecks += 1;
    assert.equal(greatestStrongBisimulation(transformedX, transformedY).rootsRelated, false);
    bisimulationChecks += 1;
  }
  const reversedX = { ...PROCESS_X, transitions: [...PROCESS_X.transitions].reverse() };
  const reversedY = { ...PROCESS_Y, transitions: [...PROCESS_Y.transitions].reverse() };
  assert.deepEqual(buildTraceBranchingEvidence().completedTraceLanguages, {
    X: completedTraceLanguage(reversedX),
    Y: completedTraceLanguage(reversedY),
    identical: true,
  });
  assert.equal(greatestStrongBisimulation(reversedX, reversedY).rootsRelated, false);
  return {
    actionRelabelingsTested: actionPermutations.length,
    traceChecks,
    bisimulationChecks,
    transitionOrderPresentationControl: true,
    pass: true,
  };
}

function buildPrivateFixtureIsolationControl(evidence) {
  const frozenChecks = {
    enablingNodes: isDeepFrozen(ENABLING_NODES),
    enablingEdges: isDeepFrozen(ENABLING_EDGES),
    catalystRelation: isDeepFrozen(CATALYST_RELATION),
    equalityRelation: isDeepFrozen(EQUALITY_RELATION),
    processX: isDeepFrozen(PROCESS_X),
    processY: isDeepFrozen(PROCESS_Y),
  };
  const cloneChecks = {
    enablingNodeArray: evidence.zeroLoopEnabling.graph.nodes !== ENABLING_NODES,
    enablingNodeObject: evidence.zeroLoopEnabling.graph.nodes[0] !== ENABLING_NODES[0],
    enablingQuestionArray: evidence.zeroLoopEnabling.graph.nodes[0].legalQuestions
      !== ENABLING_NODES[0].legalQuestions,
    enablingEdgeArray: evidence.zeroLoopEnabling.graph.edges !== ENABLING_EDGES,
    enablingEdgeObject: evidence.zeroLoopEnabling.graph.edges[0] !== ENABLING_EDGES[0],
    processXObject: evidence.traceVersusBranching.processes.X !== PROCESS_X,
    processXStates: evidence.traceVersusBranching.processes.X.states !== PROCESS_X.states,
    processXTransitions: evidence.traceVersusBranching.processes.X.transitions !== PROCESS_X.transitions,
    processXTransitionObject: evidence.traceVersusBranching.processes.X.transitions[0]
      !== PROCESS_X.transitions[0],
    processYObject: evidence.traceVersusBranching.processes.Y !== PROCESS_Y,
    processYStates: evidence.traceVersusBranching.processes.Y.states !== PROCESS_Y.states,
    processYTransitions: evidence.traceVersusBranching.processes.Y.transitions !== PROCESS_Y.transitions,
    processYTransitionObject: evidence.traceVersusBranching.processes.Y.transitions[0]
      !== PROCESS_Y.transitions[0],
  };
  assert(Object.values(frozenChecks).every(Boolean));
  assert(Object.values(cloneChecks).every(Boolean));
  return {
    recursivelyFrozenPrivateFixtures: frozenChecks,
    deepClonedPayloadFixtures: cloneChecks,
    replayExpectedModelExposedInPayload: false,
    pass: true,
  };
}

function buildPayload() {
  const evidence = {
    bornAddress: buildBornAddressEvidence(),
    zeroLoopEnabling: buildZeroLoopEvidence(),
    catalyticReachability: buildCatalystEvidence(),
    higherArityRelation: buildHigherArityEvidence(),
    traceVersusBranching: buildTraceBranchingEvidence(),
  };
  const controls = {
    bornAddressRelabeling: buildBornAddressRelabelingControl(),
    zeroLoopRelabeling: buildEnablingRelabelingControl(),
    catalystPresentation: buildCatalystPresentationControl(),
    higherArityRelabeling: buildHigherArityRelabelingControl(),
    traceBranchingRelabeling: buildTraceBranchingRelabelingControl(),
    privateFixtureIsolation: buildPrivateFixtureIsolationControl(evidence),
  };
  return {
    title: "Genesis expressibility separation tournament",
    status: "exact finite calibrations with scoped theorem kernels",
    evidence,
    controls,
    boundaries: [
      "Born-address separation is ordinary exact adaptive-query complexity under a fixed-support nonadaptive comparison class.",
      "Zero-loop question birth is relative to the current local language; one external static decision tree represents the entire finite example.",
      "Catalytic reachability separates a positive commutative monoid from its group completion; it does not establish a universal theory of memory or semantics.",
      "The ternary witness establishes loss under all unary and pairwise relational projections; its force depends on retaining an anchored arity-three question.",
      "Trace-versus-branching is a standard process-semantics calibration; it does not by itself require endogenous signature growth.",
      "These five witnesses are logically independent calibrations. This certificate proves no implication among them and no solution to an open mathematical problem.",
    ],
    declaredDoctrine: {
      status: "declared research doctrine; not certified by the finite evidence",
      statements: [
        "Interaction may create addresses and formation rules required by later continuation.",
        "Loop holonomy may be one detector of retained path information rather than the carrier of genesis.",
        "Endpoint-invariant components should be tested for catalytic capability before being quotiented as spectators.",
        "Unary and pairwise projection fossils may miss higher-arity enabling structure.",
        "Completed traces may be fossils that erase counterfactual continuations available at intermediate histories.",
      ],
    },
    novelty: {
      status: "not claimed and not assessed by this executable",
      statement: "Each tournament fixture has familiar mathematical relatives. Novelty, if any, would require a precise composite definition, comparison class, and independent literature audit.",
    },
  };
}

function verifyPayloadEnvelope(envelope, expectedPayload) {
  if (!envelope || typeof envelope !== "object") return { ok: false, reason: "malformed-envelope" };
  if (!envelope.payload || typeof envelope.payload !== "object") {
    return { ok: false, reason: "missing-payload" };
  }
  if (envelope.payloadDigest !== digest(envelope.payload)) {
    return { ok: false, reason: "payload-digest-mismatch" };
  }
  if (canonical(envelope.payload) !== canonical(expectedPayload)) {
    return { ok: false, reason: "semantic-mismatch" };
  }
  return { ok: true, reason: "verified" };
}

function runTamperAudit(payload) {
  const mutations = [
    { name: "adaptive-call-count", mutate: (value) => { value.evidence.bornAddress.exhaustiveCalibrations[0].adaptiveOracleCallsPerFunction = 1; } },
    { name: "nonadaptive-lower-bound", mutate: (value) => { value.evidence.bornAddress.exhaustiveCalibrations[2].minimumUniversalNonadaptiveSupport = 3; } },
    { name: "symbolic-witness-count", mutate: (value) => { value.evidence.bornAddress.symbolicWitnessesChecked += 1; } },
    { name: "insert-fake-loop", mutate: (value) => { value.evidence.zeroLoopEnabling.analysis.nonemptyClosedPaths = 1; } },
    { name: "erase-question-birth", mutate: (value) => { value.evidence.zeroLoopEnabling.analysis.bornQuestions = []; } },
    { name: "catalyst-a-equals-b", mutate: (value) => { value.evidence.catalyticReachability.boundedPositiveUniverse.catalystPresentation.aEqualsB = true; } },
    { name: "change-group-relation", mutate: (value) => { value.evidence.catalyticReachability.groupCompletion.catalystRelationVector[2] = 1; } },
    { name: "break-max-model", mutate: (value) => { value.evidence.catalyticReachability.globalInequalityWitness.assignment.c = 0; } },
    { name: "change-ternary-cardinality", mutate: (value) => { value.evidence.higherArityRelation.cardinalities.evenParity = 5; } },
    { name: "remove-ternary-tuple", mutate: (value) => { value.evidence.higherArityRelation.relations.evenParity.pop(); } },
    { name: "alter-relabeling-count", mutate: (value) => { value.controls.higherArityRelabeling.cubeAutomorphismsTested = 47; } },
    { name: "erase-branching-distinction", mutate: (value) => { value.evidence.traceVersusBranching.postAReadiness.identical = true; } },
    { name: "forge-bisimulation", mutate: (value) => { value.evidence.traceVersusBranching.strongBisimulation.rootsRelated = true; }, rehash: true },
    {
      name: "nested-enabling-alias-poison",
      mutate: (value) => { value.evidence.zeroLoopEnabling.graph.nodes[0].legalQuestions[0] = "poison:route"; },
      rehash: true,
      expectedReason: "semantic-mismatch",
    },
    {
      name: "nested-process-alias-poison",
      mutate: (value) => { value.evidence.traceVersusBranching.processes.X.transitions[0].label = "poison:a"; },
      rehash: true,
      expectedReason: "semantic-mismatch",
    },
    { name: "weaken-boundary", mutate: (value) => { value.boundaries.pop(); } },
    { name: "promote-doctrine-to-theorem", mutate: (value) => { value.declaredDoctrine.status = "proved"; }, rehash: true },
    { name: "forge-novelty-claim", mutate: (value) => { value.novelty.status = "novel"; }, rehash: true },
    { name: "rehash-false-evidence", mutate: (value) => { value.evidence.zeroLoopEnabling.analysis.noNonemptyClosedPaths = false; }, rehash: true },
    { name: "delete-evidence-section", mutate: (value) => { delete value.evidence.catalyticReachability; }, rehash: true },
  ];
  const results = mutations.map((mutation) => {
    const candidatePayload = clone(payload);
    mutation.mutate(candidatePayload);
    const candidate = {
      payload: candidatePayload,
      payloadDigest: mutation.rehash ? digest(candidatePayload) : digest(payload),
    };
    const verification = verifyPayloadEnvelope(candidate, payload);
    assert.equal(verification.ok, false);
    if (mutation.expectedReason) assert.equal(verification.reason, mutation.expectedReason);
    return {
      name: mutation.name,
      adversaryRehashedPayload: mutation.rehash === true,
      rejected: true,
      reason: verification.reason,
    };
  });
  return {
    tested: results.length,
    rejected: results.filter((result) => result.rejected).length,
    staleDigestMutations: results.filter((result) => !result.adversaryRehashedPayload).length,
    rehashedSemanticForgeries: results.filter((result) => result.adversaryRehashedPayload).length,
    pass: results.every((result) => result.rejected),
    results,
  };
}

function privateFixtureDigest() {
  return digest({
    enablingNodes: ENABLING_NODES,
    enablingEdges: ENABLING_EDGES,
    processX: PROCESS_X,
    processY: PROCESS_Y,
  });
}

function runNestedAliasPoisonAudit() {
  const attacks = [
    {
      name: "returned-enabling-node-nested-mutation",
      mutate: (payload) => {
        payload.evidence.zeroLoopEnabling.graph.nodes[0].legalQuestions[0] = "poison:route";
      },
    },
    {
      name: "returned-process-transition-nested-mutation",
      mutate: (payload) => {
        payload.evidence.traceVersusBranching.processes.X.transitions[0].label = "poison:a";
      },
    },
  ];
  const results = attacks.map((attack) => {
    const fixtureDigestBefore = privateFixtureDigest();
    const returnedPayload = buildPayload();
    attack.mutate(returnedPayload);
    const candidate = {
      payload: returnedPayload,
      payloadDigest: digest(returnedPayload),
    };
    const freshExpectedPayload = buildPayload();
    const verification = verifyPayloadEnvelope(candidate, freshExpectedPayload);
    const fixtureDigestAfter = privateFixtureDigest();
    assert.equal(verification.ok, false);
    assert.equal(verification.reason, "semantic-mismatch");
    assert.equal(fixtureDigestAfter, fixtureDigestBefore);
    assert.equal(ENABLING_NODES[0].legalQuestions[0], "route");
    assert.equal(PROCESS_X.transitions[0].label, "a");
    return {
      name: attack.name,
      adversaryRehashedPayload: true,
      expectedModelFreshlyRebuilt: true,
      privateFixtureUnchanged: fixtureDigestAfter === fixtureDigestBefore,
      rejected: true,
      requiredReason: "semantic-mismatch",
      reason: verification.reason,
    };
  });
  return {
    tested: results.length,
    rejectedAsSemanticMismatch: results.filter((result) => (
      result.rejected && result.reason === "semantic-mismatch"
    )).length,
    pass: results.every((result) => (
      result.rejected
        && result.reason === "semantic-mismatch"
        && result.privateFixtureUnchanged
    )),
    results,
  };
}

function buildCertificate() {
  const payload = buildPayload();
  const payloadDigest = digest(payload);
  const tamperAudit = runTamperAudit(payload);
  const aliasPoisonAudit = runNestedAliasPoisonAudit();
  const body = {
    schema: SCHEMA,
    payload,
    payloadDigest,
    tamperAudit,
    aliasPoisonAudit,
  };
  return {
    ...body,
    certificateDigest: digest(body),
  };
}

export function replayGenesisExpressibilitySeparationTournamentCertificate(certificate) {
  try {
    if (!certificate || typeof certificate !== "object") {
      return { ok: false, reason: "malformed-certificate" };
    }
    const body = clone(certificate);
    delete body.certificateDigest;
    if (certificate.schema !== SCHEMA) return { ok: false, reason: "schema-mismatch" };
    if (certificate.certificateDigest !== digest(body)) {
      return { ok: false, reason: "certificate-digest-mismatch" };
    }
    const expectedPayload = buildPayload();
    const payloadVerification = verifyPayloadEnvelope(certificate, expectedPayload);
    if (!payloadVerification.ok) return payloadVerification;
    const expectedTamperAudit = runTamperAudit(expectedPayload);
    if (canonical(certificate.tamperAudit) !== canonical(expectedTamperAudit)) {
      return { ok: false, reason: "tamper-audit-mismatch" };
    }
    const expectedAliasPoisonAudit = runNestedAliasPoisonAudit();
    if (canonical(certificate.aliasPoisonAudit) !== canonical(expectedAliasPoisonAudit)) {
      return { ok: false, reason: "alias-poison-audit-mismatch" };
    }
    return {
      ok: true,
      reason: "verified",
      schema: certificate.schema,
      certificateDigest: certificate.certificateDigest,
      payloadDigest: certificate.payloadDigest,
      tamperRejected: certificate.tamperAudit.rejected,
      aliasPoisonsRejectedAsSemanticMismatch:
        certificate.aliasPoisonAudit.rejectedAsSemanticMismatch,
    };
  } catch (error) {
    return { ok: false, reason: "exception", message: error.message };
  }
}

function rehashCertificateInPlace(certificate) {
  certificate.payloadDigest = digest(certificate.payload);
  const body = clone(certificate);
  delete body.certificateDigest;
  certificate.certificateDigest = digest(body);
}

function runReturnedCertificateAliasPoisonRegression() {
  const attacks = [
    {
      name: "full-certificate-enabling-alias-poison",
      mutate: (certificate) => {
        certificate.payload.evidence.zeroLoopEnabling.graph.nodes[0]
          .legalQuestions[0] = "poison:route";
      },
    },
    {
      name: "full-certificate-process-alias-poison",
      mutate: (certificate) => {
        certificate.payload.evidence.traceVersusBranching.processes.X
          .transitions[0].label = "poison:a";
      },
    },
  ];
  const results = attacks.map((attack) => {
    const fixtureDigestBefore = privateFixtureDigest();
    const returnedCertificate = buildCertificate();
    attack.mutate(returnedCertificate);
    rehashCertificateInPlace(returnedCertificate);
    const verification = replayGenesisExpressibilitySeparationTournamentCertificate(
      returnedCertificate,
    );
    const fixtureDigestAfter = privateFixtureDigest();
    assert.equal(verification.ok, false);
    assert.equal(verification.reason, "semantic-mismatch");
    assert.equal(fixtureDigestAfter, fixtureDigestBefore);
    return {
      name: attack.name,
      payloadAndCertificateDigestsRehashed: true,
      privateFixtureUnchanged: true,
      rejected: true,
      requiredReason: "semantic-mismatch",
      reason: verification.reason,
    };
  });
  return {
    tested: results.length,
    rejectedAsSemanticMismatch: results.filter((result) => (
      result.rejected && result.reason === "semantic-mismatch"
    )).length,
    pass: results.every((result) => (
      result.rejected
        && result.reason === "semantic-mismatch"
        && result.privateFixtureUnchanged
    )),
    results,
  };
}

export function runGenesisExpressibilitySeparationTournament() {
  const certificate = buildCertificate();
  const replay = replayGenesisExpressibilitySeparationTournamentCertificate(certificate);
  assert.equal(replay.ok, true);
  const returnedCertificateAliasPoisonRegression =
    runReturnedCertificateAliasPoisonRegression();
  assert.equal(returnedCertificateAliasPoisonRegression.pass, true);
  const rerun = buildCertificate();
  const deterministicReplay = {
    identicalCertificate: canonical(certificate) === canonical(rerun),
    identicalDigest: certificate.certificateDigest === rerun.certificateDigest,
  };
  assert.equal(deterministicReplay.identicalCertificate, true);
  assert.equal(deterministicReplay.identicalDigest, true);
  return {
    ok: true,
    certificate,
    replay,
    returnedCertificateAliasPoisonRegression,
    deterministicReplay,
  };
}

export {
  runGenesisExpressibilitySeparationTournament as run,
  replayGenesisExpressibilitySeparationTournamentCertificate as replay,
};

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  const result = runGenesisExpressibilitySeparationTournament();
  const payload = result.certificate.payload;
  console.log(JSON.stringify({
    ok: result.ok,
    certificateDigest: result.certificate.certificateDigest,
    payloadDigest: result.certificate.payloadDigest,
    bornAddress: payload.evidence.bornAddress.exhaustiveCalibrations.map((entry) => ({
      N: entry.domainSize,
      functions: entry.functionCount,
      adaptiveCalls: entry.adaptiveOracleCallsPerFunction,
      nonadaptiveMinimumSupport: entry.minimumUniversalNonadaptiveSupport,
    })),
    zeroLoop: {
      bornQuestions: payload.evidence.zeroLoopEnabling.analysis.bornQuestions.length,
      nonemptyClosedPaths: payload.evidence.zeroLoopEnabling.analysis.nonemptyClosedPaths,
    },
    catalyst: {
      sameGroupRelation: payload.evidence.catalyticReachability.groupCompletion.identicalRelationLattices,
      aEqualsB: payload.evidence.catalyticReachability.boundedPositiveUniverse.catalystPresentation.aEqualsB,
      aPlusCEqualsBPlusC: payload.evidence.catalyticReachability.boundedPositiveUniverse.catalystPresentation.aPlusCEqualsBPlusC,
    },
    higherArity: payload.evidence.higherArityRelation.cardinalities,
    traceVersusBranching: {
      completedTracesEqual: payload.evidence.traceVersusBranching.completedTraceLanguages.identical,
      postAReadinessEqual: payload.evidence.traceVersusBranching.postAReadiness.identical,
      stronglyBisimilar: payload.evidence.traceVersusBranching.strongBisimulation.rootsRelated,
    },
    relabelingAndPresentationControlsPass: Object.values(payload.controls).every((control) => control.pass),
    deterministicReplay: result.deterministicReplay,
    tamper: {
      tested: result.certificate.tamperAudit.tested,
      rejected: result.certificate.tamperAudit.rejected,
    },
    aliasPoison: {
      tested: result.certificate.aliasPoisonAudit.tested,
      rejectedAsSemanticMismatch:
        result.certificate.aliasPoisonAudit.rejectedAsSemanticMismatch,
      fullCertificateAttacksTested:
        result.returnedCertificateAliasPoisonRegression.tested,
      fullCertificateAttacksRejectedAsSemanticMismatch:
        result.returnedCertificateAliasPoisonRegression.rejectedAsSemanticMismatch,
    },
  }, null, 2));
}
