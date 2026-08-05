import assert from "node:assert/strict";
import {
  CylinderProgram,
  CylinderTreeDistribution,
  SeededRng,
  makeStructuredTarget,
  normalize,
  sampleCategorical,
} from "./core.mjs";
import { runExperiment } from "./experiment.mjs";

const target = makeStructuredTarget(8);
assert(Math.abs(target.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);

const counts = sampleCategorical(target, 4000, new SeededRng(123));
assert.equal(counts.reduce((sum, value) => sum + value, 0), 4000);

const model = new CylinderTreeDistribution(8).fit(counts, 32);
const replay = new CylinderTreeDistribution(8).replay(model.program, counts);
assert.deepEqual(replay.structure(), model.structure());
assert.deepEqual(replay.program.toJSON(), model.program.toJSON());

const firstHalf = new CylinderProgram(8, model.program.operations.slice(0, 10));
const secondHalf = new CylinderProgram(8, model.program.operations.slice(10));
assert.deepEqual(firstHalf.compose(secondHalf).toJSON(), model.program.toJSON());

assert.deepEqual(normalize([1, 1, 2]), [0.25, 0.25, 0.5]);

const report = runExperiment({ sampleCount: 16000, seed: 777 });
assert(report.replay.exactWithinTolerance);
assert(report.results.at(-1).kl < report.baseline.kl);
assert(report.results.at(-1).tv < report.baseline.tv);
assert(
  report.observability.collisions.some(
    ([left, right]) =>
      left === "identity" && right === "decorative-hidden-tag",
  ),
);
assert(
  !report.observability.collisions.some(
    ([left, right]) =>
      (left === "identity" && right === "rotate-bits") ||
      (left === "rotate-bits" && right === "identity"),
  ),
);

console.log("All NOVA prototype tests passed.");

