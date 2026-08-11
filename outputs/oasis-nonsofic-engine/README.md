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
- Genesis v0 foundation: a biordered primitive-costed repair atlas, observable colimit, non-Boolean Heyting logic of question availability, context-relative and circuit cost layers, ideal-completed information germs, deterministic-lift obstruction with relational/stochastic controls, and a theorem that finite persistent availability interfaces are necessarily sofic.
- Cantor Defect Genesis: an exact computable three-action process with two independent Cantor refinement axes and an involutive XOR comparison repair; it exposes every finite cylinder algebra, is dense in all continuous Cantor observables, and is Moore-nonsofic through one fixed nonpersistent comparison-defect bit whose minimal machine is an integer counter.
- Certificate-Cantor Controller v3: a literal XOR severity identity upgraded to an oriented split/glue germ; canonical selection and synthesis factor through that germ, while a frozen directory digest, complete anchor blocks, opaque selection tokens, coherent nonempty revisions, fresh-state transactions, erasure, polarity corruption, reindexing, and fair tape controls are checked adversarially.
- Laurent Holonomy-Germ Genesis: an arrow-sensitive lift over `F2[z,z^-1]` whose pre-commit fixed-output quotient is the full finite-support Laurent module, with exponential residual growth, full-frame commits, cylinder density, and an exact matched bit-tape control; the transport group is classified as the classical sofic binary lamplighter group.
- Obstruction-Transport Genesis: separately certified split/glue masks, represented by a declared dual-shear compiler, produce a rank-one finite transport square after forgetting revision order. Its one-use reducer has five reachable states inside the ambient `D_8` closure, and the full atlas log already answers the displayed order query with no extra persistent bit. Certificate-forced curvature, endogenous query growth, one causal critic trajectory, and full semantic naturality remain open.
- Universal Phantom Genesis: one computable Cantor point has a dense shift orbit while defining a nonzero `lim^1(Z, times 2)` class whose every finite truncation is exact. This gives an executable derived-Stokes bridge from universal continuation to globally incompatible finite primitives, while explicitly remaining a fixed-query sofic system rather than the sought internally non-sofic genesis object.
- Genesis Tail-Hodge Comparison: the fossil quotient `Z_2/Z` is proved topologically incapable of carrying a nonconstant continuous Hausdorff observable, while a retained digit-refinement path yields a genuine finite path-Hodge energy with exact value `1/4` on the universal phantom class. Integer-representative, sparse false-negative, noninjectivity, and presentation-dependence controls keep this a one-sided comparison certificate rather than a new Hodge theory.
- Genesis Primitive-Escape Geometry: a weighted Hilbert completion turns the binary `Z_2/Z` obstruction into a presentation-dependent nonlinear unreduced degree-one cohomology class with dense nonclosed range and zero degree-one harmonic sector. Exact nested Moore-Penrose primitive costs in `R plus l2` are bounded exactly for zero classes and diverge for every nonzero class; universal, alternating, sparse, signed-integer, and representative-shift controls test a candidate escape-rate geometry.
- Stokes-Hodge Innovation Geometry: nested minimum primitives split into pairwise orthogonal corrections whose exact energies are residual squared over new boundary capacity. A compact-sublevel realization lemma separates finite realizability from uniformly bounded global realizability, while exact redundant, inconsistent, unitary-sign, finite-block, sofic, and zero-class controls keep the theorem distinct from Navier-Stokes and the Hodge Conjecture.
- Endogenous Stokes-Escape Generator: a prefix-causal state compiler commits the next fixed-grammar boundary query, predicts it from the current exact minimum primitive, and emits an oriented unit innovation into a chained audit transcript. Every finite rational stage is exact, frontier capacities stay in `[4,6]`, the generated datum lies in a weighted Hilbert completion, and primitive energy escapes linearly; horizon, fork, batch, tape, summable, sign, tamper, rescaling, and free-append controls expose the precise diagonal and fixed-grammar boundary.
- Homology-Cover Algebraogenesis: the current finite graph's complete mod-2 first-homology obstruction determines, relative to a declared universal-cover constructor, the coarsest connected based cover on which every old scalar cocycle becomes exact. The primitive is an affine deck torsor rather than a preferred vector; monodromy, no-section, factorization, gauge, symmetry, rank-boundary, probe-order, replay, and tamper controls certify the exact `2 -> 5 -> 129` rank tower while keeping meta-rule genesis, non-soficity, and Hodge geometry open.
- Genesis Interchange Square: atomic localization by the newly generated sheet algebra forces, relative to a declared locality-closed obligation doctrine, whole-orbit primitive attachment on the minimal two-loop bouquet. Its two eight-state order charts are gauges of one non-split order-eight dihedral extension of `F2^2`; exact cocycle, exhaustive `8!` comparison, invariant-sum, replay, and tamper controls separate interaction curvature from primitive-origin ambiguity and raw order dependence.
- Genesis Coherence Boundary: a declared, gauge-chosen third binary state attachment generates a nontrivial nested comparison defect but its two complete reorder routes agree, so this one-coordinate repair produces no literal state-map associator. A separate abstract eight-object categorical group carries the explicit nonzero cocycle `omega(g,h,k)=g_H h_V k_W`; 4,096 pentagon checks, a six-term bar-cycle pairing, and rank `39 < 40` elimination isolate a possible higher carrier without claiming that genesis generates or embeds it.
- Genesis Gauge Completion: the full `{z,z+1}` locality orbit generates a connected 32-state universal repair with an indecomposable characteristic-two gauge module and exact `UT4(F2)` transition transport. The true gauge commutes with the third continuation, while the route comparison has diagonal deck-isotropy defect `T`; exhaustive comparison proves an empty strict naturality constraint but no state-map associator.
- Genesis Free Higher Attachment: relative to the unrestricted crossed-module filler-question functor, the failed naturality pair generates a raw `D8` sector with `p=W R` and `p^2=T`. Its representing pair, unique up to unique isomorphism preserving the universal filler, has integral orbit module `Z[P/<T>]`; the resulting even-augmentation `pi2` carries a nonzero Postnikov 3-class derived as the connecting image of the non-split central extension. A thin zero-`pi2` control proves that boundary data alone do not select this universal doctrine, while an infinite pointed target proves that no crossed `P`-module with finite domain can represent the unrestricted filler functor; restricted finite quotients may still retain nonzero pushforward classes.
- Genesis Higher Question Quotients: every one-filler-generated relation policy is a canonical quotient `Z[Q]/L`; its higher class survives exactly when the central-extension cocycle has no coherent lift through that quotient. An exhaustive exact census of 27 generated pointed abelian targets proves cardinality four is minimal for nonzero survival and finds eight global mixed-transport obstructions invisible on every proper subgroup.
- Genesis Policy-Lift Diagram: the actual eight-state `D8` instance canonically produces the three-dimensional invariant dual `Hom_Q(A,F2)`, its seven index-two relation coatoms, and their full Fano incidence. Exact lift enumeration leaves one nonthin coatom inhabited, while the four-object raw image of `C8 -> C4` fills two components spanning the same rank-one affine direction as concrete `D8` loop holonomy. Integral, `C6`, split, gauge, inversion, basis, presentation, replay, and tamper controls keep the all-level persistence and endogenous-admission claims explicit rather than assumed.
- Genesis Bar Primitive Representer: the policy-derived empty coherent-lift question has its own universal module `M_kappa`, of rank 13 for `Q=V4`, while the old rank-4 filler algebra is only a particular quotient. A normalized free-cell presentation has exact `27,81,243,...` coherence-orbit growth and no finite projective tail, despite the finite-rank semantic representer; this separates semantic size, question universality, and witness depth without claiming non-soficity or Hodge escape.
- Genesis Essential Coherence Hierarchy: under the selected trivial-action `C4` policy, the generated `D8` precursor yields exactly the rank-two top Dickson obstruction `uv(u+v)`, globally nonzero while every proper subgroup restriction vanishes. Exact polynomial audits through ranks two, three, and four verify the supplied classical higher hierarchy, its canonical-but-nonunique Bockstein precursors, all 85 proper-subspace vanishings, and basis-free invariance while explicitly leaving policy selection and every rank above two ungenerated.
- Genesis Obstruction-Born Successor: a clock-reconstruction and Postnikov-degree no-go isolate dual-line reification as one explicit new type-former. Conditional on that doctrine, the indecomposable obstruction-generator quotient emits a free binary quotient line, and the split-chart recurrences `D+=D*N` and `zeta+=zeta*N+D^2` generate ranks two through five while preserving the noncanonical precursor genealogy. The executable distinguishes affine-coset relabeling from true extension-splitting shear, explicitly leaves identification with the lift-stack band unproved, and makes zero obstruction genuinely stutter.
- Genesis Universal Syzygy Successor: a one-argument universal mod-two homology-cover compiler makes every old scalar first-cohomology class exact and promotes their cycle syzygies to the next transport module. Exact fixtures give ranks `2->5->129`, nontrivial inherited deck action, and coinvariant dimensions `3,6,10,15`, while explicitly keeping the essential obstruction as a sidecar and the enormous dual policy symbolic.
- Algebraogenesis Path Meditation: a deliberately unconstrained ideation artifact is filtered through the degree, symmetry, stutter, and counter-causality gates. The surviving candidate is a causal resolution complex whose cells are universal primitive attachments and their coherences; ordinary interaction transport would be first homology of unresolved resolution-order loops, without regrading a lone high-degree obstruction. This remains a typed theorem target, not an established new object.
- Polarized Causal Repair Square: a second quarantined dream spanning Navier--Stokes, Hodge, Collatz, and RH is reduced to one exact finite mechanism. Four rational two-dimensional fixtures separate commutation, serialized coherence, filled topology, and dissipative path cost; the matched unfilled squares have the same `H_1` and commutator rank but different polarization. The executable rejects 28/28 certificate mutations while explicitly proving no frontier, compactness, non-soficity, or novelty claim.
- Endogenous Expressibility Foundation: a typed, external-counter-free causal formation doctrine separates answer-born addresses, generator admission under a fixed formation monad, and genuine formation-doctrine change. It defines proof-relevant normalized support, universal birth roles, genetic bisimulation, observer collisions, finite-versus-uniform causal support, and mapping-space coherence defects while making every conjecture and novelty implication a theorem target.
- Expressibility Separation Tournament: five exact finite calibrations distinguish adaptive address selection, acyclic question enabling, noncancellative catalysis, fixed-interface ternary projection loss, and completed-trace versus branching semantics. They remain independent controls rather than a composite genesis theorem; replay rejects 20/20 mutations and all four alias-poison attacks.
- Coupled Latin-Horn Coequalizer Calibration: one finite laboratory couples answer routing, catalyst-supported proof modes, a minimal full-pairwise-projection Latin relation, optional standard `H^3(C2,F2)` coherence, and an ordinary finite-set coequalizer with later universal descent. The executable explicitly leaves genuine Level B, Level C, Target 4, endogenous admission, genetic primeness, novelty, AI, non-soficity, and major-conjecture consequences false or open.

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
node research/genesis-v0-audit.mjs
node research/cantor-defect-genesis.mjs
node research/laurent-holonomy-genesis.mjs
node research/certificate-cantor-controller.mjs
node research/obstruction-curvature-genesis.mjs
node research/universal-phantom-genesis.mjs
node research/genesis-tail-hodge.mjs
node research/genesis-primitive-escape.mjs
node research/stokes-hodge-innovation.mjs
node research/endogenous-stokes-escape.mjs
node research/homology-cover-algebraogenesis.mjs
node research/genesis-interchange-square.mjs
node research/genesis-interchange-bockstein-transduction.mjs
node research/genesis-nullification-fiber-holonomy.mjs
node research/genesis-policy-lift-diagram.mjs
node research/genesis-coherence-boundary.mjs
node research/genesis-gauge-complete-successor.mjs
node research/genesis-free-crossed-module.mjs
node research/genesis-higher-question-quotients.mjs
node research/genesis-bar-primitive-representer.mjs
node research/genesis-essential-coherence-hierarchy.mjs
node research/genesis-obstruction-born-successor.mjs
node research/genesis-universal-syzygy-successor.mjs
node research/polarized-causal-repair-square.mjs
node research/genesis-expressibility-separation-tournament.mjs
node research/genesis-coupled-latin-horn-coequalizer.mjs
node src/demo.mjs
node src/certificate-manifest.mjs
```

`endogenous-stokes-escape.mjs` runs a compact exact depth-32 audit by default.
Use `--full` for the depth-64 stress run and add `--chain` only when the full
serialized certificate transcript is needed. A custom audit depth of at least
16 can be selected with `--depth=N`.

The final command prints the complete serializable certificate, including every exact word relation and every open universal obligation.

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

The frozen finite genesis object, information-versus-causal biorder,
availability locale, declared cost layers, information-germ completion,
connection boundary and moduli theorem, and finite-persistent-interface
soficity no-go are documented in
[research/genesis-v0-foundations.md](research/genesis-v0-foundations.md).

This project's first explicit externally universal, internally
defect-non-sofic object,
including its Cantor-cylinder context-exposure theorem, exact XOR
comparison-repair law,
exact one-counter residual classification, continuous approximation theorem,
and strict
claim boundary, is documented in
[research/cantor-defect-genesis.md](research/cantor-defect-genesis.md).

The exact proof-certificate XOR bridge, oriented germ mediation,
clean/split/glue controller fixtures, germ-erasure and reindexing controls,
conditional information lower bound, endpoint macro no-go, and honest
component-by-component depth/work boundaries are documented in
[research/certificate-cantor-controller.md](research/certificate-cantor-controller.md).

The transported-germ lift that retains parallel-arrow information erased by
endpoint algebras, including its Laurent normal form, holonomy loops, exact
pre-commit minimal residual module, exponential residual growth, full-frame
cylinder exposure, matched tape control, and delayed binary-lamplighter
classification, is documented in
[research/laurent-holonomy-genesis.md](research/laurent-holonomy-genesis.md).

The audited finite two-cell successor, including the exact opposite-shear
formula, fresh-state certificate/transport commits, the `D_8` collapse,
order-forgetting late-query separation, basis covariance, ordinary-program
controls, and the repaired fixed-interface research target, is documented in
[research/obstruction-curvature-genesis.md](research/obstruction-curvature-genesis.md).

The probability-free universal/phantom bridge, including exact Cantor-cylinder
compilation, finite discrete-Stokes primitives, the nonzero derived-limit
class, the phantom-map boundary, and the proposed obstruction-generated Hodge
tower, is documented in
[research/universal-phantom-genesis.md](research/universal-phantom-genesis.md).

The quotient-topology no-go, exact finite path-Hodge detector, `1/4` universal
tail certificate, adversarial false negatives, and conjectured phase-retaining
solenoidal lift are documented in
[research/genesis-tail-hodge.md](research/genesis-tail-hodge.md).

The stronger nested minimum-primitive construction, including its exact
two-variable rational solver, bounded-cost iff zero-class theorem, sparse-class
recovery, representative robustness, weak-compactness proof, and proposed
escape-rate hypothesis, is documented in
[research/genesis-primitive-escape.md](research/genesis-primitive-escape.md).

The exact rank-one Stokes innovation theorem, orthogonal energy decomposition,
compact-sublevel finite-to-global realization lemma, gauge and cofinal-grouping
laws, non-sofic independence controls, and strict application bridge ledger are
documented in
[research/stokes-hodge-innovation.md](research/stokes-hodge-innovation.md).

The state/frontier-indexed, transcript-certified causal diagonal theorem that
generates target values relative to the declared Moore-Penrose
minimum-primitive predictor inside a fixed Stokes grammar, including exact
capacity bounds, completed-data membership, global primitive escape, chained
replay, and the controls separating target-value endogeneity from genuine query
genesis, is documented in
[research/endogenous-stokes-escape.md](research/endogenous-stokes-escape.md).

The obstruction-representing homology-cover construction, including its
primitive-torsor semantics, based terminal property, nontrivial monodromy,
deck-gauge naturality, exact rank recurrence, viable continuation controls,
and the boundary between internally generated cells and a declared external
constructor, is documented in
[research/homology-cover-algebraogenesis.md](research/homology-cover-algebraogenesis.md).

The smallest exact attachment-interchange theorem, including its
locality-generated whole-orbit doctrine, two-element coherent comparison
torsor, cohomologous order cocycles, non-split order-eight dihedral extension,
flat invariant-sum control, and higher-comparison boundary, is documented in
[research/genesis-interchange-square.md](research/genesis-interchange-square.md).

The exact gauge-chosen state-map coherence boundary, including its
sixteen-state nested transport defect, reorder cancellation, independent
nontrivial `F2^3` categorical-group associator, bar-complex Stokes certificate,
and gauge-complete next target, is documented in
[research/genesis-coherence-boundary.md](research/genesis-coherence-boundary.md).

The gauge-complete locality repair, including the full two-class voltage
orbit, 32-state universal cover, indecomposable gauge module, generated
`UT4(F2)` transport, route-versus-gauge distinction, exact empty strict
naturality constraint, and quotient-sensitive higher boundary, is documented
in
[research/genesis-gauge-complete-successor.md](research/genesis-gauge-complete-successor.md).

The conditional universal higher attachment, including the raw `D8`
naturality sector, free crossed-module theorem, even-augmentation homotopy
module, derived Postnikov cocycle, connecting-homomorphism interpretation,
nonzero cyclic restriction, separately detected full-symmetry analogue, thin
filler collapse control, and finite-universality no-go, is documented in
[research/genesis-free-crossed-module.md](research/genesis-free-crossed-module.md).

The same-instance horizontal-to-vertical transduction, including the actual
eight-state interchange extension, based OP/PO transport, explicit
cochain-level chart and section comparisons, nonzero order-two Postnikov
class, and split/thin doctrine controls, is documented in
[research/genesis-interchange-bockstein-transduction.md](research/genesis-interchange-bockstein-transduction.md).

The residue-nullifying lift-fiber experiment, including intrinsic selection
of the unique liftable policy within the declared cyclic sign family, the
exact `512 -> 16 -> 8` census, concrete inner-loop holonomy, the `2ab`
path-composition carry, OP/PO fiber
equivalence, and the controls separating extension data, coefficient policy,
and loop retention, is documented in
[research/genesis-nullification-fiber-holonomy.md](research/genesis-nullification-fiber-holonomy.md).

The intrinsic seven-policy relation shell, constructed policy category, exact
lift diagram, integral and odd-padding controls, `C8 -> C4` component image,
concrete-loop collision, gauge-erasure and target-inversion boundaries, and
the remaining semantic-admission theorem are documented in
[research/genesis-policy-lift-diagram.md](research/genesis-policy-lift-diagram.md).

The post-theorem naming audit, twisted-Bockstein identification of the finite
direction equality, closest 2025 arithmetic-persistence collision, remaining
holonomy--persistence admission target, foundational meditation, and
quarantined admission-diamond dream are documented in
[research/naming-audit-foundation-dream-2026.md](research/naming-audit-foundation-dream-2026.md).

The mechanism-level collision audit for obstruction-directed torsorial
signature completion, the Beth--Morita--torsor trilemma, exact
\(0/21/105\) marked-triple selector census, reducible
\(D_8\times C_2\) proper-containment calibration, non-elementary \(D_8\)
nonexact stutter, the fixed-base central-loop no-go theorem, and the first
matrix and outer-path escape controls are
documented in
[research/obstruction-directed-torsorial-signature-completion-2026.md](research/obstruction-directed-torsorial-signature-completion-2026.md).
Its finite certificates are generated by
[research/genesis-selector-separation-search.mjs](research/genesis-selector-separation-search.mjs)
and
[research/genesis-matrix-local-system-escape.mjs](research/genesis-matrix-local-system-escape.mjs).

The exact relation-policy lattice, coherent-cocycle-lift survival criterion,
minimum cardinality-four obstruction carriers, mixed-transport falsifiers, and
semantic-model invariance boundary are documented in
[research/genesis-higher-question-quotients.md](research/genesis-higher-question-quotients.md).

The universal normalized-bar primitive representer, rank-13 versus rank-4
question-universality separation, witness-preserving coherence tower, exact
cell-orbit scaling, narrow no-finite-projective-tail theorem, and real-Hodge
control are documented in
[research/genesis-bar-primitive-representer.md](research/genesis-bar-primitive-representer.md).

The generated all-proper-view obstruction, exact essential-cohomology ideal,
canonical Dickson/Bockstein hierarchy, globally empty but locally inhabited
coherent-lift types, and the boundary between the generated rank-two case and
the supplied higher-rank family are documented in
[research/genesis-essential-coherence-hierarchy.md](research/genesis-essential-coherence-hierarchy.md).

The stage-clock and degree no-go theorems, declared obstruction-generator
dual-line reification law, exact split-chart Dickson/precursor recurrence with
retained genealogy, past-slice invisibility, unconditional
universal-homology-cover syzygy branch, and higher-Postnikov alternative are documented in
[research/genesis-endogenous-transport-successor.md](research/genesis-endogenous-transport-successor.md).

The reflective path reconstruction, raw speculative dream-chamber artifact,
causal resolution-complex candidate, and its finite falsification program are
documented in
[research/algebraogenesis-path-meditation.md](research/algebraogenesis-path-meditation.md)
and
[research/wild-algebraogenesis-dream-artifact.md](research/wild-algebraogenesis-dream-artifact.md).

The quarantined four-frontier dream, its typed compatibility and adversarial
audit scaffolds, the surviving polarized causal-resolution bundle, and the
exact finite comparison-square experiment are documented in
[research/wild-four-frontier-genesis-dream.md](research/wild-four-frontier-genesis-dream.md),
[research/four-frontier-compatibility-scaffold.md](research/four-frontier-compatibility-scaffold.md),
[research/four-frontier-dream-audit-protocol.md](research/four-frontier-dream-audit-protocol.md),
[research/polarized-resolution-wake-audit.md](research/polarized-resolution-wake-audit.md),
[research/polarized-resolution-wake-salvage.md](research/polarized-resolution-wake-salvage.md),
and
[research/polarized-causal-repair-square.md](research/polarized-causal-repair-square.md).

The 2026-08-05 live literature collision audit across future equivalence,
domain theory, CEGAR, compositional rewriting, sheaves/Hodge, holonomy, derived
limits, and sofic actions is documented in
[research/prior-art-classification-20260805.md](research/prior-art-classification-20260805.md).

The 1000-kilometre reset from completed algebras to typed causal formation,
including the strict A/B/C hierarchy, normalized support, universal birth
roles, four observer losses, genetic bisimulation, uniform-support program,
and executable Level-A calibration, is documented in
[research/endogenous-expressibility-foundations.md](research/endogenous-expressibility-foundations.md).
Its native proof obligations for Hodge, three-dimensional Navier--Stokes,
Collatz, the Riemann hypothesis, and AI are separated in
[research/endogenous-expressibility-frontier-realizations.md](research/endogenous-expressibility-frontier-realizations.md),
and its independent exact controls are generated by
[research/genesis-expressibility-separation-tournament.mjs](research/genesis-expressibility-separation-tournament.mjs).

The first coupled follow-up—answer routing, catalyst-dependent proof roles,
fixed-interface Latin support, declared phase-to-action transduction, and a
finite orbit coequalizer with unique later descent—is documented in
[research/endogenous-expressibility-coupled-calibration.md](research/endogenous-expressibility-coupled-calibration.md)
and generated by
[research/genesis-coupled-latin-horn-coequalizer.mjs](research/genesis-coupled-latin-horn-coequalizer.mjs).
It is deliberately classified as a universal-admission calibration, not a
genuine Level-B/Level-C result or the coupled irreducible theorem target.

## Countermodel curriculum

`research/countermodel-curriculum.mjs` performs a checkpointed adversarial search over finite permutation emulators of the 155-element Thompson-`V` chart. It jointly measures pairwise collapse, multiplication defects, and presentation-relator defects. The experiment is designed to reveal an empirical defect-floor scaling law and to return progressively harder countermodels for obstruction-driven learning. Its output is evidence and curriculum data, not a universal-epsilon proof.

The SOS research path is documented in `research/exact-radius1-dual-proof.md`, `research/sos-symmetry-report.md`, and `research/radius2-corrected-result.md`. Radius one is closed negatively by exact rational duality. The full corrected radius-two cone has been solved numerically and points to zero, but its exact dual obstruction remains open because the valid dual lies on a deeper singular face.
