# NOVA multi-step test results

## Decision

Continue the research, but do not keep the cylinder tree as NOVA's only observable basis. The exact symbolic-process and finite-probe architecture survived its integrity tests. Its first statistical readout did not meet the data-efficiency requirement. An adaptive Walsh-polynomial readout corrected that weakness on the current parity-rich target family.

## Frozen-gate result

The thresholds in [multistep-test-plan.md](multistep-test-plan.md) were written before running the benchmark.

| Gate | Result | Evidence |
|---|---|---|
| Exactness and integrity | **Pass** | Zero replay error; exact program composition; corrupted program rejected |
| External generalization | **Pass** | Guided tree beat the independent baseline in 100% of 24 trials |
| Structural contribution | **Pass** | Guided tree beat random refinement in 87.5% of trials |
| Data efficiency | **Fail** | KL fell 28.0%, below the frozen 35% requirement |
| Bayesian adaptation | **Pass** | Post-shift KL fell 86.1% over four update batches |
| Observability | **Pass** | Hidden collision detected, then resolved by adding a separating probe |

Overall: **5/6 gates passed**.

## Primary benchmark

The test used six rotated/XOR-transformed versions of the structured 8-bit target at four training sizes.

| Training observations | Independent KL | Guided cylinder KL | Random cylinder KL | Selected leaves |
|---:|---:|---:|---:|---:|
| 250 | 1.134082 | 0.444769 | 0.599852 | 128.0 |
| 1,000 | 1.120692 | 0.279987 | 0.471070 | 128.0 |
| 4,000 | 1.117319 | 0.353621 | 0.368113 | 128.0 |
| 16,000 | 1.116329 | 0.320359 | 0.426350 | 128.0 |
| **All trials** | **1.122105** | **0.349684** | **0.466346** | — |

The crucial symptom is that validation selected the maximum 128 leaves in every regime. The restricted tree has useful inductive bias—hence its win over random refinement—but it reaches a structural error floor. Increasing the sample count cannot remove that floor, producing the non-monotonic data curve.

Allowing 256 leaves removes the floor but saturates the state space. At that point guided and random trees become the same empirical model, so the architecture loses the structural contribution it was meant to test. This is a genuine bias–variance conflict.

## Distribution-shift test

| Shifted observations incorporated | KL to new target |
|---:|---:|
| 0 | 2.298123 |
| 2,000 | 0.759419 |
| 4,000 | 0.523099 |
| 6,000 | 0.330083 |
| 8,000 | 0.319200 |

Relative reduction: **86.1%**. The Bayesian count update adapts, although it retains inertia from the original environment as expected.

## Alternative: adaptive Walsh-polynomial probes

The alternative transforms the smoothed log-density into the Walsh basis, ranks non-constant parity characters by magnitude, and chooses the number of retained coefficients using an independent validation sample. It is an exact finite Fourier-polynomial calculation rather than gradient fitting.

| Training observations | Walsh-polynomial KL | Cylinder-tree KL | Mean selected coefficients |
|---:|---:|---:|---:|
| 250 | **0.161259** | 0.444769 | 15.3 |
| 1,000 | **0.045158** | 0.279987 | 9.3 |
| 4,000 | **0.019106** | 0.353621 | 29.3 |
| 16,000 | **0.007846** | 0.320359 | 131.5 |
| **All trials** | **0.058342** | 0.349684 | — |

The polynomial readout beat the cylinder tree and independent baseline in **100% of 24 trials**. Its KL fell **95.1%** from the smallest to largest data regime, comfortably exceeding the failed 35% data-efficiency gate.

## What this changes

NOVA should become a **multi-basis observable architecture**:

1. retain the exact process word and primitive distributional-state interface;
2. compile requested observations into an appropriate finite basis;
3. use cylinder probes for localized/fractal structure;
4. use Walsh/Fourier probes for parity, periodicity, and global interactions;
5. add Mellin probes for scaling and heavy-tail structure; and
6. select or combine bases using held-out predictive evidence.

This is closer to the original idea than a single tree: the internal approximator is unchanged, while observers choose finite coordinate systems appropriate to their questions.

## Limitations

- All benchmark targets are transformations of one structured finite target; this is a controlled test, not broad empirical validation.
- The Walsh alternative is naturally favored by a parity-rich target. Cylinder, spectral, Mellin, and neural-operator probes need comparison across genuinely different distribution families.
- No finite benchmark tests non-soficity or proves observable essentiality.
- The results establish deterministic behavior in the included runtime, not production scale or numerical stability on large state spaces.

## Recommended next experiment

Build a held-out family benchmark containing hierarchical cylinder distributions, sparse polynomial interactions, independent distributions, mixtures, scale families, and operator-valued targets. Train a Bayesian router that chooses among cylinder, Walsh/Fourier, Mellin, and learned neural probes. The next success criterion should be low regret against the best probe family on each unseen target—not victory by one basis everywhere.
