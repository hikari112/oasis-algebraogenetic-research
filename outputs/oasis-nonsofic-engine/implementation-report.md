# Implementation report

## Exact algebra representation

The binary Leavitt algebra is

\[
R=\mathbb F_2\langle s_0,s_1,t_0,t_1\mid t_i s_j=\delta_{ij},\ s_0t_0+s_1t_1=1\rangle.
\]

A monomial `s_alpha t_beta` is stored as a pair of binary words `(alpha,beta)`. Multiplication uses prefix cancellation:

- if `gamma = beta r`, then `(alpha,beta)(gamma,delta)=(alpha r,delta)`;
- if `beta = gamma r`, then `(alpha,beta)(gamma,delta)=(alpha,delta r)`; and
- incomparable middle words multiply to zero.

The characteristic-two Cuntz-Leavitt relation gives

\[
s_{a1}t_{b1}=s_at_b+s_{a0}t_{b0}.
\]

Using `1` as the distinguished edge makes this a terminating canonical reduction rule. Addition is symmetric difference of canonical monomials.

## Exact non-sofic generator set

For the complete nine-word code `D`, the implementation constructs

\[
x_{ij}(r)=1+s_{a_i}r t_{a_j}
\]

for every `i != j` and `r` in `{1,s0,s1,t0,t1}`. There are `9*8*5=360` generators. Since `t_aj s_ai=0` for distinct prefix-code leaves, the added term squares to zero. In characteristic two,

\[
x_{ij}(r)^2=1,
\]

so every implemented generator has an exactly verified inverse.

## Proof configuration

The code instantiates the paper's blocks

```text
alpha = (000, 001, 01)
beta  = (1000, 1001, 101)
nu    = (1100, 1101, 111)
zeta  = (100, 101, 11)
```

and its two prefix contractions:

```text
u: alpha_i -> alpha_i0, beta_i -> alpha_i1, nu_i -> zeta_i
v: alpha_i -> alpha_i0, beta_i -> zeta_i,   nu_i -> alpha_i1
```

Both were verified as exact units. Their actions agree on the alpha block. All 30 elementary roots of `Gamma=EL_3(R)` supported on `[0]` commute exactly with both generators of the Bleak-Quick copy of Thompson's `V` supported inside `[1000]`, reproducing the support geometry behind `[Gamma,J]=1`.

## OASIS integration

The distributional state in the executable realization is an element of the left regular `R`-module. A seed probe asks for one canonical coefficient. Pullback by a unit `g` is exact:

\[
(g^\star e_b)(d)=e_b(gd).
\]

Candidate probes are seed probes pulled through exact words in the 360-generator group. The learner scores posterior residual, finite-chart alias separation, and derivation length, then applies an exact binary exponential tilt.

Every program atom stores:

- the seed coefficient probe;
- the full elementary-generator word;
- the canonical hash of the evaluated unit;
- the canonical hash of the pulled probe; and
- the external tilt coefficient.

Replay reevaluates the word from the group generators. It rejects the program if either stored hash disagrees.

## Executable expansion/LEF certificate

The compiler registers 34 exact proof-facing units: `u`, `v`, all 30 `Gamma` roots, and the two Bleak-Quick `J` generators. Together with the 360 ambient elementary generators, the oracle contains 394 named exact units. The certificate emits 71 exact relations and 314 unique finite words.

For a supplied finite permutation emulator it can now:

- derive word permutations from assigned generator permutations;
- measure equality defects and distinctness collisions by normalized Hamming distance;
- audit multiplication triangles and freeness;
- recover `Gamma`-generator orbit components;
- exhaustively minimize the edge-boundary ratio on small components and return a minimizing subset; and
- associate every failure with the corresponding proof stage.

When two distinct exact words collide, the compiler searches the canonical support of `(a+b)d` on the available regular states. Every nonzero coefficient produces a pair of exact pullback probes distinguishing `a` from `b`. The proof certificate preserves every generated witness. The predictive frontier now installs only one representative per exact finite observation signature, and proof priority contributes through information gain rather than an unconditional additive bonus. This change reduced the demo frontier from 70 to 66 candidates and improved 16-step KL from `0.003546` to `0.001101` while retaining zero-error replay.

The certificate serializes all relations, finite words, source metadata, and obligations. Its status is deliberately `globallyEffective: false` while Kun's nonconstructive locality radius, its finite expander-decomposition consequence, and the final universal threshold remain uninstantiated.

The compiler now also contains a deterministic Step-1-through-Step-5 error ledger. It propagates transport boundary, coarea/median exceptions, component matching distortion, bad-cut removal, word repair, and cluster separation, and returns the largest proof load as a probe priority.

## Externally universal readout

On a finite regular-basis window `{s_d}`, the coefficient probes `coeff(d,epsilon)` form an exact Kronecker basis. With sign encoding, choosing

\[
\theta_d=\tfrac12\log p_d
\]

makes the normalized exponential readout equal any requested strictly positive distribution `p` exactly, up to floating-point evaluation. This proves finite-support distribution universality for the external readout. It does not yet prove universal approximation on an arbitrary compact space.

## Bayesian obstruction field

Proof-obligation mode maintains an epistemic distribution over proof-failure stages. Finite violations, open obligations, and ledger loads act as fractional evidence. Candidate probes receive an information term proportional to the posterior mass of their target stage and the entropy of their current predicted bit. This makes the obstruction certificate an active experimental controller rather than a passive rejection report.

## Polynomial/SOS experiment

The exact verifier checks rational identities of the form

\[
\Delta^2-\lambda\Delta=\sum_i \xi_i^*\xi_i
\]

in the exact Leavitt-unit group algebra. The radius-one generator-difference SDP for `Gamma` has 30 basis directions and 3,540 exact coefficient contributions. SCS returned `lambda=0` and exposed a rank-29 dual moment matrix. That clue has now been replaced by an exact rational certificate with moment matrix `I_30-(1/30)11^T`, `L(Delta)=29/2`, and `L(Delta^2)=0`. It proves that no positive `lambda` exists in this radius-one cone.

The positivity-preserving symmetry group `S3 x C2 x C2` acts through genuine group automorphisms. The dagger-derived generator is implemented as `g -> T(g)^-1`, not raw anti-automorphism `T`. On radius one, the SCS dual is constant on each of 36 exact orbits to within `6.16e-14`. At radius two, character decomposition reduces the 678-dimensional basis to twelve PSD multiplicity blocks with sizes `35,30,26,27,25,30,27,26,60,60,53,53`. The invariant symmetric variable count is 9,865 rather than 230,181.

The exact radius-four export contains 249,376 group elements and 10,487 coefficient-support orbits. The corrected SDP returned a `6.39e-7` gap candidate, but its `8.78e-6` coefficient residual and `-4.07e-6` minimum block eigenvalue are larger than the candidate. This is evidence for a zero optimum, not a certificate. A one-kernel dual-margin search also collapsed to numerical zero, revealing additional null faces that must be recovered by iterative facial reduction.

An earlier experimental reduction used raw matrix dagger as a naive Gram permutation and was rejected during audit. Its rational certificate and exact determinant report are retained only as explicitly marked superseded artifacts. Direct moment-invariance checking distinguishes the conventions: maximum spread was approximately `0.2317656` before correction and exactly zero after correction.

## Algebraogenetic semantic atlas

Certified point-mass programs make the exact translation action faithful. Their orbit is equivariantly isomorphic to the regular `G`-set. Theorem 2.12 and Proposition 2.15 of Gao--Kunnawalkam Elayavalli--Patchell therefore upgrade the earlier embedding statement: the action on the countable semantic-program set is itself non-sofic under their countable-set-action definition. No claim is made yet about a probability-measure-preserving transformation groupoid, because the construction intentionally selects no measure.

The obstruction-generated semantic-atlas prototype attaches a path-relative coordinate only after a finite observation fiber contains incompatible targets. Pulling the endpoint back through a reference path makes the coordinate invariant under a common left continuation. In the executable ablation, eight endpoint-only features collapse eight examples to one fiber and impose an exact `0.4` minimax total-variation floor. One chart-normalized coordinate reduces trained error to `2.56e-15`.

The scaling audit constructs 24 mutually disjoint path pairs. Absolute point-evaluation features require exactly `n` probes at tested scales `2, 4, 8, 16, 24`; transported charts reuse one coordinate. A two-parameter readout trained on four charts and frozen before evaluation retains `2.56e-15` maximum error on twenty unseen charts. The linear lower bound is restricted to absolute point evaluations and is not a lower bound against arbitrary task-designed global program features.

## Verification performed

- All five defining Leavitt relations.
- Prefix-refinement invariance.
- Associativity across 729 nontrivial canonical triples.
- The paper's `[0] <-> [10]` prefix-replacement example and its refined table.
- Completeness of the nine-leaf code.
- Exact involution check for all 360 elementary generators.
- Exact group-word inverse and equality.
- Functorial composition of regular-action pullbacks.
- Detection of deliberately inconsistent finite emulators.
- Exact contraction and commuting-support checks from the proof configuration.
- All 30 `Gamma` roots and both exact Bleak-Quick `V` generators.
- All seven Bleak-Quick relators in the right-action convention.
- A 155-element finite Thompson-`V` LEF obstruction and local-chart auditor.
- Rational Kazhdan/lazy-Markov bounds for ranks 3 and 9.
- Exact finite error-ledger propagation and bottleneck selection.
- Exact group-algebra SOS identity verification plus radius-one numerical search.
- Exact regular-simplex dual verification excluding a positive radius-one SOS gap.
- Exact positivity-preserving 24-element symmetry action, direct moment-invariance audit, and corrected radius-two representation decomposition.
- Exact radius-four coefficient export and corrected 9,865-variable radius-two SDP solve.
- Exact finite positive-distribution universality on the nine-state basis window.
- Bayesian obstruction-field updates and entropy-sensitive probe value.
- Compilation of the exact proof configuration into a serializable certificate.
- Detection of a deliberately collapsed nonidentity Thompson-`V` generator.
- Synthesis of six exact coefficient probes from that obstruction.
- Exact edge-expansion minimization on a finite cycle component.
- Proof-driven frontier insertion and one-time score steering.
- End-to-end learning with KL below `0.01`.
- Zero-drift replay.
- Rejection of corrupted process derivations.
- Refusal of universal certified mode without an effective witness.
- Computable local continuation and exact action composition on the algebraogenetic path space.
- Constructive non-isolation of the zero semantic state in every finite continuation cylinder.
- Regular point-mass orbit and non-soficity of the complete countable-set action.
- Observer-relative holonomy opened by a refining continuation.
- Endpoint-only aliasing floor and chart-normalized holonomy learner.
- Linear absolute-point-probe versus constant transported-chart scaling through 24 disjoint pairs.
- Frozen-readout transfer from four training charts to twenty unseen exact charts.

All tests pass.

## Source correspondence

The algebra presentation, non-sofic unit-group theorem, nine-leaf code, elementary roots, prefix-replacement units, and contraction configuration are taken directly from Chapter 3 of the [source PDF](https://cdn.openai.com/pdf/ten-proofs-oai.pdf), especially its equations (1), (2), (14), (15), and (16). The certificate stages mirror Proposition 2.3, Steps 1–5: expander decomposition, median/coarea control, transported-component matching, finite word tests, and permutation repair.
