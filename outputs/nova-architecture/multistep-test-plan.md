# NOVA multi-step falsification plan

This plan was frozen before the benchmark results were run. Its purpose is to decide whether the finite NOVA architecture deserves another iteration; it cannot prove that an infinite process group is non-sofic.

## Hypotheses and gates

### Gate 1 — exactness and integrity

- Replaying every learned symbolic program must reproduce its probability vector with maximum error below `1e-15`.
- Re-running the same seeded experiment must return byte-equivalent benchmark data.
- A deliberately corrupted program must be rejected rather than partially interpreted.

**Pass:** all checks succeed in every run.

### Gate 2 — external generalization

Train on sampled data, choose model complexity using a separate validation sample, and evaluate against the known target distribution. Test four sample regimes and six independently generated structured targets.

**Pass:** validation-selected NOVA has lower true KL divergence than the independent Bernoulli baseline in at least 75% of trials and lower mean KL overall.

### Gate 3 — structural contribution

Compare the greedy information-guided cylinder program with a random cylinder-refinement ablation using the same leaf budgets and validation procedure.

**Pass:** guided NOVA beats the random ablation in at least 60% of trials and has lower mean KL. This tests whether learned composition matters rather than merely adding parameters.

### Gate 4 — data efficiency

Measure mean true KL as training data increases through `250`, `1,000`, `4,000`, and `16,000` observations.

**Pass:** the mean KL at 16,000 observations is at least 35% below the mean at 250 observations. Strict monotonicity is not required because validation selection is noisy.

### Gate 5 — Bayesian adaptation

Train on one structured distribution, rotate it to create a shifted environment, then add four sequential batches from the shifted distribution and refit the posterior-predictive cylinder state.

**Pass:** KL to the shifted target after the final batch is at least 30% below its value immediately after the shift.

### Gate 6 — observability

First use only distributional probes, under which a hidden-tag process should collide with identity. Then add a probe for the hidden tag.

**Pass:** the collision is reported with the restricted probe family, disappears with the expanded family, and a genuine bit rotation remains distinguishable in both cases.

## Test layers

- **Unit:** normalization, seeded sampling, program composition, invalid-operation rejection.
- **Integration:** fit → validate → select → replay → probe pipeline.
- **System:** multi-target, multi-seed benchmark; distribution shift; observability expansion.
- **Theorem gate:** faithful effective non-sofic action and observationally non-sofic quotient. This remains outside the finite test suite.

