# OASIS non-sofic engine

This package is the theorem-facing implementation of OASIS. Its internal process oracle is the exact group

\[
G=EL_D(L_{\mathbb F_2}(1,2))\le L_{\mathbb F_2}(1,2)^\times,
\]

using the nine-leaf code

```text
D = (000, 001, 01, 1000, 1001, 101, 1100, 1101, 111).
```

This is the non-sofic subgroup used in Chapter 3 of [OpenAI, *Ten Advances in Mathematics and Theoretical Computer Science*](https://cdn.openai.com/pdf/ten-proofs-oai.pdf).

## What is implemented

- Exact canonical arithmetic in the binary Leavitt algebra over `F2`.
- The defining relations `t_i s_j = delta_ij` and `s0 t0 + s1 t1 = 1`.
- All 360 elementary generators `1 + s_ai r t_aj`, where `r` is one of `1,s0,s1,t0,t1` and `i != j`.
- Exact unit multiplication, inversion, equality, and word evaluation.
- Prefix-replacement units and refinement invariance for Thompson's group `V`.
- The paper's contraction units `u` and `v`, all 30 `Gamma=EL_3(R)` elementary roots on `[0]`, and the exact two-generator Bleak-Quick presentation of `J=V_1000`.
- Exact regular-action coefficient probes and process pullbacks.
- OASIS residual/alias-driven learning over the exact group action.
- Finite-emulator multiplication, freeness, and alias audits.
- A serializable expansion/LEF proof-obligation certificate compiled from Proposition 2.3.
- Rational Kazhdan and lazy-Markov spectral lower bounds for `Gamma` and the ambient group.
- A verified 155-element finite LEF obstruction for Thompson's `V`, compiled from its seven-relator presentation.
- A finite error ledger propagating transport, coarea, matching, repair, and cluster-separation losses.
- Exact group-algebra SOS verification plus a numerical radius-one search harness.
- An exact rational dual proof excluding every positive-gap SOS certificate in the radius-one generator-difference cone.
- Exact positivity-preserving `S3 x C2 x C2` automorphism reduction of the radius-two SOS basis into twelve PSD blocks of size at most 60.
- A complete corrected radius-two SDP with 9,865 invariant Gram variables and 10,487 exact coefficient-support orbits; no numerically trustworthy positive gap was found.
- Exact finite word equality/distinctness checks and exact small-component edge-expansion profiles.
- Obstruction-driven synthesis of coefficient probes that separate collided exact group words.
- A hard gate separating executable finite proof obligations from a universal effective non-soficity witness.
- Transactional program replay that rejects altered derivation words.
- Exact universality for every strictly positive distribution on a finite regular-basis window.
- A Bayesian obstruction field that routes probes toward likely proof bottlenecks without treating its posterior as theorem probability.
- AION, an executable intensional estimator with exact compositional contexts, query-local Bayesian universal charts, computable-real interval programs, and obstruction-driven probe growth.
- Projective Algebraic Memory: a positive algebraic predictive state with exact nested moment views, persistent counterfactual branches, auditable kernel revision, and a constructive theorem that every nonzero finite-amplitude state has unbounded exact moment rank.
- Computable-Completion PAM experiments: a transcendental positive state, a genuinely infinite-support Hilbert amplitude with certified tail bounds, and a four-state proof/interval relation critic.
- Presentation-Transcendent Algebra: a computable effective quotient with no computable complete semantic normal form, crossed with the exact non-sofic process spine and exercised through finite observation programs.
- Query-local PTAM universality: an adaptive compiler that measures the fixed-window error floor, searches only for task-demanded semantic witnesses, and compiles an epsilon-accurate finite distribution readout.
- Algebraogenetic Path Space: a probability-optional finite-continuation topology with constructively non-isolated states, a faithful action of the exact non-sofic group, and executable observer-relative holonomy.
- Holonomy Chart Learner: an obstruction-triggered semantic-atlas experiment in which a shared chart coordinate defeats a rigorous fixed-endpoint aliasing lower bound after arbitrary common continuation.
- Atlas probe scaling: an exact disjoint-support construction separating linear absolute point-probe growth from constant transported-chart coordinate growth.
- Conditional point-query separation: a contextual-atlas theorem against adaptive, nonlinear, context-blind programs with bounded semantic point-evaluation cost, accompanied by controls that reject broader coordinate and total-memory claims.
- Architectural falsification suite: sofic, matched-context, sampling, aggregate, precision, corruption, randomized, adaptive, hypergraph, background, and exact-transport controls.
- Endogenous Obstruction-Triggered Transport Atlas: equal-input causal streams, a finite-reversible-transport obstruction theorem, bounded one-bit observable recovery of Hamming defects, and bidirectional split/glue refinement.
- Forward Residual Algebraogenesis: a forward-only residual/observable formulation, certified nonsofic beta-shift control, transport-defect-driven probe generation, computable Hilbert-cube residual completion, and exact unbounded Hankel certificates.
- Foundations before optimization: a formal observable-completion tower, exact transport-saturation baselines, the descent defect, a conditional Hodge/sheaf direction, probability-as-state-and-metric, and a strict separation from the Aaronson-Wigderson algebrization barrier.
- Genesis static-endpoint forgetfulness: a minimal four-point witness showing that identical seed and terminal pointwise algebras can hide different transport-driven repair kinetics, task-depth spectra, and repair-square discrepancy, plus a gauge-audited connection control and an explicit residual-flattening falsifier.

## Run

Requires a recent Node.js release.

```text
node src/test.mjs
node src/intensional-test.mjs
node src/projective-moment-test.mjs
node research/presentation-transcendent-algebra.mjs
node research/query-local-universality.mjs
node research/ptam-student-ablation.mjs
node research/algebraogenetic-path-space.mjs
node research/holonomy-chart-ablation.mjs
node research/atlas-probe-scaling.mjs
node research/bounded-feature-separation.mjs
node research/architectural-falsification-suite.mjs
node research/endogenous-transport-benchmark.mjs
python research/forward_residual_algebraogenesis.py
node research/genesis-fossil-nonidentifiability.mjs
node src/demo.mjs
node src/certificate-manifest.mjs
```

The third command prints the complete serializable certificate, including every exact word relation and every open universal obligation.

## Demonstration result

The supplied demo uses the regular action on the nine Leavitt basis states indexed by `D`.

| Measurement | Result |
|---|---:|
| Exact elementary generators | 360 |
| Registered proof generators | 34 |
| Total registered exact generators | 394 |
| Predictively distinct candidate probes | 66 |
| Exact process-window elements | 64 |
| Obstruction probes synthesized | 6 |
| Learned program steps | 16 |
| KL to target | 0.001101 |
| Replay error | 0 |
| Process-window separation | 1.000 |
| Exact finite universal-readout error | `8.33e-17` |
| Shallow PTAM minimax error floor | `0.4` |
| Semantic witnesses compiled | 2 |
| Maximum tested witness complexity | 93 |
| Refined trained-student error | `2.65e-15` |

## Certificate modes

This now uses an actual theorem-backed non-sofic group internally; it is no longer a sofic stand-in.

The learner has three deliberately different modes:

- `local-alias` learns from empirical process collisions only.
- `proof-obligation` executes the paper's finite equality, distinctness, multiplication, component, and boundary tests. A detected collision is converted into new exact probes and those probes enter the learning frontier with a one-time score bonus.
- `certified-nonsofic` still refuses to run without a fully effective universal witness.

The supplied demo deliberately maps a nonidentity Thompson-`V` swap to the identity. The certificate identifies the failed Step-4 distinctness test, constructs six coefficient probes that distinguish the exact words on the regular state space, and the learner uses them while preserving zero-error replay.

The certificate has closed the formerly vague spectral-constant and Thompson-`V` inputs. Three universal obligations remain: an effective radius for Kun's ultraproduct locality lemma, a finite expander-decomposition bound at that radius, and the resulting universal finite-word threshold. These fields remain explicit and are never silently filled with guessed numbers.

See [certificate-schema.md](certificate-schema.md) for the proof-to-runtime map, [implementation-report.md](implementation-report.md) for test evidence, [theorem-gap.md](theorem-gap.md) for the remaining universal-certification work, [theorem-gap-retrospective.md](theorem-gap-retrospective.md) for the first research retrospective, [research/radius2-face-chase.md](research/radius2-face-chase.md) for the latest facial-reduction experiments, [nonsofic-universal-estimator.md](nonsofic-universal-estimator.md) for the AION architecture, and [projective-algebraic-memory.md](projective-algebraic-memory.md) for its continuous non-finite memory layer.

The continuous-completion hypothesis, transcendental and infinite-support
prototypes, and probe-policy ablation are documented in
[research/computable-continuous-completion.md](research/computable-continuous-completion.md).

The corrected representation-level hypothesis, halting-clock canonicalizer
obstruction, computably opaque crossed product, and resulting PTAM architecture
are documented in
[research/presentation-transcendent-algebra.md](research/presentation-transcendent-algebra.md).

The constructive finite-task universality theorem, fixed-window lower bound, and
non-computable semantic-depth scaling law are documented in
[research/query-local-universality.md](research/query-local-universality.md).

The topology-before-probability construction, non-sofic countable-set action
theorem, continuation ultrametric, observer-relative holonomy certificate, and
obstruction-generated semantic-atlas experiment
are documented in
[research/algebraogenetic-path-space.md](research/algebraogenetic-path-space.md).

The conditional extension from fixed probes to bounded adaptive semantic
point-query programs, including the randomized lower bound, falsifying
interfaces, and the full address/transport cost ledger, is documented in
[research/bounded-feature-separation.md](research/bounded-feature-separation.md).

The adversarial test matrix, rejected interpretations, surviving conditional
claim, test counts, causal-compiler controls, and required next gates are
documented in
[research/architectural-falsification-report.md](research/architectural-falsification-report.md).

The corrected equal-input transport theorem, congruence-and-distinction
architecture, parity-observable bridge, finite/sofic controls, saved-adversary
replay, and exact claim boundary are documented in
[research/endogenous-transport-atlas.md](research/endogenous-transport-atlas.md).

The irreversible residual reformulation, beta-shift control, Hilbert-cube
completion, nonlinear topology obstruction, and tightened active-learning
prior-art boundary are documented in
[research/forward-residual-algebraogenesis.md](research/forward-residual-algebraogenesis.md).

The optimizer-independent mathematical program, including observable
saturation, the audited Hodge/sheaf boundary, probability states, explicit
research gates, and the precise algebrization warning, is documented in
[research/foundations-hodge-algebrization.md](research/foundations-hodge-algebrization.md).

The static-endpoint-versus-repair-kinetics separation, sharp four-point minimality
control, task-depth spectrum, noncommuting repair square, conditional connection
holonomy, and residual-state flattening boundary are documented in
[research/genesis-fossil-nonidentifiability.md](research/genesis-fossil-nonidentifiability.md).

## Countermodel curriculum

`research/countermodel-curriculum.mjs` performs a checkpointed adversarial search over finite permutation emulators of the 155-element Thompson-`V` chart. It jointly measures pairwise collapse, multiplication defects, and presentation-relator defects. The experiment is designed to reveal an empirical defect-floor scaling law and to return progressively harder countermodels for obstruction-driven learning. Its output is evidence and curriculum data, not a universal-epsilon proof.

The SOS research path is documented in `research/exact-radius1-dual-proof.md`, `research/sos-symmetry-report.md`, and `research/radius2-corrected-result.md`. Radius one is closed negatively by exact rational duality. The full corrected radius-two cone has been solved numerically and points to zero, but its exact dual obstruction remains open because the valid dual lies on a deeper singular face.
