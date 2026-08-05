# NOVA: a non-sofic observable valuation architecture

NOVA is a research prototype for an **externally universal, internally non-sofic approximator**. Its central reversal is simple: the internal process is not represented by a succession of finite approximations. It remains an exact symbolic object. Approximation happens only at the boundary, through finite probes and valuations.

This package contains:

- [research-brief.md](research-brief.md): the candidate mathematical object, what is established, what may be novel, and the open proof obligations.
- [architecture.md](architecture.md): the proposed AI architecture and data flow.
- [experiment-results.md](experiment-results.md): a reproducible finite-shadow experiment and its measured results.
- [multistep-test-plan.md](multistep-test-plan.md): the falsification gates frozen before the larger benchmark.
- [multistep-results.md](multistep-results.md): the five passes, one failure, diagnosis, and polynomial alternative.
- `src/core.mjs`: exact cylinder programs, adaptive distribution model, probes, and observability audit.
- `src/experiment.mjs`: comparison with an independent Bernoulli baseline.
- `src/test.mjs`: correctness and falsification checks.

## Run

Requires a recent Node.js release.

```text
node src/test.mjs
node src/experiment.mjs
node src/multistep-test.mjs
node src/spectral-test.mjs
```

## Current status

The finite architecture is implemented and tested. The cylinder-only version passed five of six frozen gates; it failed the data-efficiency gate. An adaptive Walsh-polynomial readout fixed that failure on the present parity-rich target family and is the recommended next architecture iteration.

This remains **not** a computational realization of a non-sofic group. The non-sofic ingredient is currently theorem-level, inherited from the proposed use of an explicit non-sofic group inside a universal Hilbert-space representation. The central next theorem is an essentiality result: the observable universal behavior must not factor through a sofic process system.
