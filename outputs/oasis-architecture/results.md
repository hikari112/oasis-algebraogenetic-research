# OASIS finite-shadow results

## Benchmark design

The benchmark used six target families, three training sizes (`500`, `2,000`, and `8,000`), and two independently sampled replicates: 36 trials total.

Families:

1. structured parity and long-range interactions;
2. hierarchical cylinder structure;
3. an independent distribution;
4. a sparse process-orbit interaction model;
5. a Hamming-cluster mixture; and
6. a scale-decay distribution with log-periodic oscillation.

Model complexity was selected using independent validation samples. Comparisons were an independently fitted Bernoulli model, the earlier guided cylinder tree, the static validation-selected Walsh model, and OASIS.

## Result

| Model | Mean KL across 36 trials |
|---|---:|
| Independent | 0.714971 |
| Cylinder tree | 0.126066 |
| Static spectral | 0.068048 |
| **OASIS** | **0.042890** |

OASIS beat the static spectral model in **34/36 trials**, the cylinder tree in **86.1%**, and the independent model in **88.9%**. Its exact replay error was `0` in every trial.

## Data scaling

| Training observations | OASIS KL | Static spectral KL | Cylinder KL | Mean OASIS steps |
|---:|---:|---:|---:|---:|
| 500 | **0.093685** | 0.139535 | 0.171128 | 35.3 |
| 2,000 | **0.025549** | 0.049504 | 0.116894 | 55.3 |
| 8,000 | **0.009437** | 0.015104 | 0.090176 | 66.7 |

The generated method reduced mean KL by approximately **89.9%** between the smallest and largest data regimes.

## By family

| Family | OASIS | Spectral | Cylinder | Independent |
|---|---:|---:|---:|---:|
| Structured parity | **0.021449** | 0.039860 | 0.356148 | 1.119066 |
| Hierarchical cylinder | 0.048368 | 0.076435 | **0.046528** | 0.259469 |
| Independent | 0.008952 | 0.044073 | 0.058140 | **0.003112** |
| Sparse orbit | **0.037383** | 0.061514 | 0.123533 | 2.160061 |
| Hamming mixture | **0.065702** | 0.083260 | 0.113468 | 0.436122 |
| Scale oscillation | 0.075487 | 0.103145 | **0.058577** | 0.311996 |

No single method won every family. The specialized independent and cylinder models retained narrow advantages on their matching targets. OASIS had the best overall result without receiving target-family labels or a menu of basis types.

## Finite universality and replay

- Generated nonconstant probes: **255/255**.
- Supplied primitives: eight singleton probes, cyclic shift, and one shear.
- Exact derivation verification: **passed** for every probe.
- Maximum program replay difference: **0**.
- Mean selected active probes: **35.7**.

## Obstruction ablation

At validation-selected convergence, residual learning already separated every process in the finite 24-process window. Adding the obstruction term did not change KL or separation.

Under a strict two-probe budget across 30 sparse-orbit trials:

| Variant | Mean process separation | Mean KL |
|---|---:|---:|
| Residual only | 0.966 | **1.696** |
| Residual + obstruction | **0.989** | 1.766 |

Obstruction scoring improved separation in **17/30** trials and worsened it in **2/30**. The approximately four-percent short-budget KL cost is real. The result supports treating predictive fit and internal distinguishability as separate objectives.

## What was falsified

- The earlier idea that choosing among known bases was itself the novel method.
- The expectation that obstruction scoring would improve converged finite prediction accuracy.
- The idea that process distinguishability is free under a tight observation budget.

## What survived

- Exact processes can generate a universal finite probe algebra without receiving the basis explicitly.
- Sequential exact moment tilts outperform the earlier one-shot spectral truncation on this benchmark.
- Process-alias pressure changes early probe selection in a measurable way.
- The full prediction remains exactly replayable from generated probe derivations.

## Limitations

- The experiment uses a finite, sofic linear process group.
- The target families are synthetic and low-dimensional.
- The obstruction score uses finite process aliases, not a certified non-sofic witness.
- The comparison is deterministic and controlled, not an independent external evaluation.
- A literature novelty audit was intentionally not performed before freezing this construction.

