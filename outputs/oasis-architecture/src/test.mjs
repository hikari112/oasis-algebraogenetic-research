import assert from "node:assert/strict";
import {
  ExactLinearProcess,
  OasisProbeSynthesizer,
  SeededRng,
  generateProbeOrbit,
  replayOasisProgram,
  sampleCategorical,
} from "./oasis-core.mjs";
import { structuredParityTarget } from "./targets.mjs";
import { runOasisBenchmark } from "./benchmark.mjs";

const orbit = generateProbeOrbit(8);
assert.equal(orbit.length, 255);
assert.equal(new Set(orbit.map((probe) => probe.mask)).size, 255);

const identity = ExactLinearProcess.identity(8);
for (let state = 0; state < 256; state += 1) assert.equal(identity.applyState(state), state);

const target = structuredParityTarget(8);
const counts = sampleCategorical(target, 4000, new SeededRng(73));
const synthesizer = new OasisProbeSynthesizer(8, { processWindowSize: 12 });
const fit = synthesizer.fit(counts, { maxSteps: 32, snapshotSteps: [32] });
const replayed = replayOasisProgram(256, fit.program);
assert(Math.max(...replayed.map((value, state) => Math.abs(value - fit.probabilities[state]))) < 1e-15);
const corrupted = fit.program.map((operation) => ({
  ...operation,
  derivationWord: [...operation.derivationWord],
}));
corrupted[0].derivationWord.push("rotate");
assert.throws(() => replayOasisProgram(256, corrupted), /does not match/);

const report = runOasisBenchmark({ sampleSizes: [500, 2000], replicates: 1 });
assert.equal(report.finiteUniversality.generatedProbeCount, 255);
assert.equal(report.finiteUniversality.derivationsExact, true);
assert(report.summary.maximumReplayDelta < 1e-15);
assert(report.summary.oasisKl < report.summary.independentKl);

console.log("OASIS construction and finite falsifiers passed.");
