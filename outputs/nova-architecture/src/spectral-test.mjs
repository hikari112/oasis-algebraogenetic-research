import assert from "node:assert/strict";
import {
  fitWalshPolynomial,
  runSpectralAlternativeBenchmark,
} from "./spectral-alternative.mjs";

const uniform = fitWalshPolynomial(Array(256).fill(1), 8);
assert(Math.abs(uniform.probabilities.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
assert(uniform.probabilities.every((value) => Math.abs(value - 1 / 256) < 1e-12));

const report = runSpectralAlternativeBenchmark();
assert(report.summary.winRateVsTree >= 0.90);
assert.equal(report.summary.winRateVsBaseline, 1);
assert(report.summary.dataReduction >= 0.35);

console.log("Sparse Walsh-polynomial alternative passed its comparison tests.");

