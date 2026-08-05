# OASIS

**OASIS — Obstruction-Adaptive Synthesis of Interaction Signatures** is an original candidate method constructed from the externally-universal, internally-non-sofic hypothesis.

Its key move is not to choose among known bases. OASIS starts with primitive probes and exact process generators. It synthesizes its own finite coordinates by pulling probes backward through exact process words and composing the resulting effects. Prediction error and unresolved process aliases jointly decide which generated probe becomes observable next.

Approximation occurs only in external valuations. The internal process word is never replaced by a finite graph, matrix approximation, or learned transition table.

## Package

- [construction.md](construction.md): mathematical object, learning rule, finite universality result, and non-sofic extension.
- [architecture.md](architecture.md): components, interfaces, data flow, scaling, and failure handling.
- [results.md](results.md): heterogeneous benchmark, ablations, limitations, and next theorem gates.
- [novelty-claims.md](novelty-claims.md): the minimal claims that distinguish OASIS from a fixed-basis model or decorative non-sofic factor.
- `src/oasis-core.mjs`: exact process algebra, generated probe orbit, obstruction-aware synthesis, and replay.
- `src/targets.mjs`: six heterogeneous target families.
- `src/benchmark.mjs`: comparison with independent, cylinder, and static spectral models.
- `src/test.mjs`: finite universality, derivation, replay, and benchmark falsifiers.

## Run

Requires a recent Node.js release and the sibling `nova-architecture` package for comparison baselines.

```text
node src/test.mjs
```

## Status

The finite shadow is implemented and verified. It generated all 255 nonconstant interactions on the 8-bit cube from eight seed probes and two exact generators, then outperformed the earlier fixed-basis models across a controlled heterogeneous benchmark.

The finite process group is deliberately sofic and proves nothing about non-soficity. The full OASIS claim requires an effective faithful action of the chosen non-sofic group and a computable obstruction oracle extracted from its non-soficity proof.

The faithful exact group engine has now been implemented separately in [the OASIS non-sofic engine](../oasis-nonsofic-engine/README.md). The remaining gap is compilation of the proof into an effective numerical obstruction certificate.
