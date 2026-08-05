import assert from "node:assert/strict";
import {
  evaluateGates,
  runMultiStepBenchmark,
} from "./multistep-benchmark.mjs";

const first = runMultiStepBenchmark();
const second = runMultiStepBenchmark();

assert.deepEqual(second, first, "Seeded benchmark must be exactly reproducible");
assert.deepEqual(evaluateGates(first), first.gates);
assert.equal(first.integrity.compositionExact, true);
assert.equal(first.integrity.corruptRejected, true);
assert(first.integrity.replayDelta < 1e-15);
assert(first.generalization.summary.maxReplayDelta < 1e-15);

console.log("NOVA multi-step benchmark is deterministic and internally consistent.");

