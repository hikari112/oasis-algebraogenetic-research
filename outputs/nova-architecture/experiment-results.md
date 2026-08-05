# NOVA finite-shadow experiment

## Question

Can an exact symbolic cylinder program learn a distribution containing parity and long-range dependencies better than an independent Bernoulli model, while preserving exact replay and exposing an ignored hidden factor?

## Setup

- State space: 8-bit strings, a finite shadow of Cantor space.
- Target: structured Gibbs distribution with parity, prefix, equality, and long-range interaction terms.
- Training samples: 20,000; deterministic seed `20260803`.
- NOVA shadow: greedy cylinder splits with Dirichlet-smoothed leaf probabilities.
- Baseline: independently fitted Bernoulli coordinates.

## Results

| Model | Leaves | KL divergence | Total variation | Cross-entropy |
|---|---:|---:|---:|---:|
| Independent Bernoulli | — | 1.116257 | 0.604477 | 5.469600 |
| NOVA cylinder | 4 | 1.002579 | 0.562718 | 5.355921 |
| NOVA cylinder | 16 | 0.755783 | 0.545611 | 5.109126 |
| NOVA cylinder | 64 | 0.657703 | 0.489326 | 5.011045 |
| NOVA cylinder | 128 | 0.443115 | 0.339576 | 4.796457 |
| NOVA cylinder | 256 | **0.007431** | **0.031691** | **4.360773** |

Exact symbolic replay reproduced all probabilities with maximum difference `0`.

The observability audit reported `identity == decorative-hidden-tag`, correctly showing that the chosen probes could not see the attached hidden factor. It distinguished the bit-rotation process from identity.

## Interpretation

This supports three architectural claims: compositional cylinder refinement can capture dependencies missed by a factorized model; exact symbolic histories can be replayed without drift; and observational equivalence can be reported explicitly. It does **not** establish non-soficity, universality on an infinite space, efficient scaling, or essential use of a non-sofic factor.

## Automated checks

The included test suite verifies normalization, sampling, program composition, exact replay, improvement over the baseline, and both positive and negative observability cases. All checks passed in the supplied run.

