# Endogenous Obstruction-Triggered Transport Atlas

## Status

This note records a corrected architecture, a rigorous non-sofic transport
theorem, and the first equal-input executable benchmark. The theorem is valid;
the currently executable Thompson-`V` experiment is an exact finite-action
obstruction rather than an effective numerical non-sofic witness. No claim of
literature novelty is made here.

## Reflection: what the falsification actually taught us

The earlier contextual-atlas experiment supplied a task address `t`. That
address already identified which transported coordinate mattered. A dynamic
baseline could therefore use `t` as free side information and match the atlas
with one query. The negative result did not reject endogenous semantic
geometry; it showed that the geometry was not endogenous in the experiment.

The corrected comparison gives every system only the same raw generator-token
stream. Each system must construct its own causal state. The object under test
is no longer a lookup table or a bounded list of point probes. It is the
transport law by which histories are identified or kept distinct.

This also reveals a missing duality. Obstruction-driven growth cannot only add
features:

- If a finite model maps exact-distinct paths to the same transport, the atlas
  must **split** them with a separating observable.
- If it maps exact-equal paths to different transports, the atlas must **glue**
  them with a quotient or congruence constraint.

The resulting prototype is a streaming **congruence-and-distinction engine**.
Its finite critic curriculum evolves by alternating refinement and
identification; the exact carrier itself is already fixed and exact.

## Architecture

Call the construction an **Endogenous Obstruction-Triggered Transport Atlas**
(EOTTA). It has five layers:

1. A raw event stream of generator tokens, with no supplied semantic address.
2. An exact intensional carrier that composes the tokens causally.
3. Finite query-local probabilistic or deterministic readout charts.
4. A reversible finite critic evaluated over its entire latent action, not one
   privileged trajectory.
5. A certificate controller that emits either a split probe or a glue
   constraint when the critic violates exact transport, then compiles those
   artifacts into collision or consistency losses for the next critic.

The implementation is in `src/endogenous-transport-atlas.mjs`. The exact
memory update was also changed from whole-history reevaluation to one exact
composition per incoming generator. It still retains raw history and an
open-ended exact carrier; those resources are not hidden or described as
constant memory.

The executable controller is a curriculum/loss interface. It validates every
split and glue relation against the exact oracle, registers the resulting
tasks, and scores candidate transports. It does not yet optimize a critic or
compute a general congruence closure, so “refinement” below refers to this
operational curriculum rather than a completed self-training system.

## Finite reversible transport theorem

Let `G=<S>` be a finitely generated non-sofic group and let

\[
\pi:F(S)\twoheadrightarrow G
\]

be the quotient from the free group. For a finite nonempty latent set `Y`, a
reversible stream encoder assigns each generator a permutation

\[
T_s\in\operatorname{Sym}(Y),\qquad T_{s^{-1}}=T_s^{-1}.
\]

The assignment extends to a homomorphism
`rho_T:F(S)->Sym(Y)`. With normalized Hamming distance `d_Y`, let `W_R` be the
words of length at most `R` over the symmetric generator alphabet and define

\[
\Delta_R(T)=\max_{u,v\in W_R}
\begin{cases}
d_Y(\rho_T(u),\rho_T(v)),&\pi(u)=\pi(v),\\
1-d_Y(\rho_T(u),\rho_T(v)),&\pi(u)\ne\pi(v).
\end{cases}
\]

The first branch penalizes tearing apart paths that the group identifies. The
second penalizes collapsing paths that the group distinguishes.

**Theorem.** There are a finite radius `R_*` and `eta_*>0` such that, for every
finite `Y` and every reversible generator encoder `T`,

\[
\Delta_{R_*}(T)\ge\eta_*.
\]

The size of `Y` is unrestricted. This is therefore not the trivial statement
that one fixed finite state budget eventually runs out.

### Proof

Assume the conclusion is false. Then choose finite encoders `T^(n)` on sets
`Y_n`, with `R_n -> infinity` and `Delta_(R_n)(T^(n)) -> 0`. Choose one
representative word `w_g` for every `g in G`, with `w_e` the empty word, and
define

\[
p_n(g)=\rho_{T^{(n)}}(w_g).
\]

For fixed `g,h`, all of `w_g,w_h,w_(gh),w_gw_h` eventually lie inside the
tested radius. Because `w_(gh)` and `w_gw_h` denote the same group element,

\[
d_{Y_n}(p_n(gh),p_n(g)p_n(h))\longrightarrow0.
\]

For fixed nonidentity `g`, the distinctness branch gives

\[
d_{Y_n}(p_n(g),1)\longrightarrow1.
\]

The maps `p_n` would therefore be a sofic approximation, contradicting
non-soficity. The infinite regular action on point masses is the pointwise
analogue: equal words agree and distinct words disagree at every anchor. No
uniform normalized Hamming measure on that infinite set is being asserted.

The useful scaling profile is

\[
A_G(R,N)=\inf_{1\le |Y|\le N,\,T_s\in\operatorname{Sym}(Y)}\Delta_R(T).
\]

For a sofic group, a standard approximation on the finite image of `W_(2R)`
pulls back to an encoder with arbitrarily small `Delta_R`; hence
`A_G(R,N)->0` along sufficiently large action degrees for every fixed `R`.
For the non-sofic group there is an `R_*` for which

\[
\inf_N A_G(R_*,N)\ge\eta_*>0.
\]

This is the defensible different scaling law: a size-independent transport
fidelity floor, not a generic parameter-efficiency claim.

## From global transport to tiny observable tasks

There is an exact bridge from normalized Hamming defect to bounded-cost global
observables. Injectively label a finite `Y` by `m=ceil(log2 |Y|)` bits. For a
uniform parity mask `a in F_2^m`, define the one-bit observable

\[
h_a(y)=\langle a,\operatorname{bin}(y)\rangle\pmod 2.
\]

For any two permutations `P,Q`,

\[
d_Y(P,Q)
=2\Pr_{y\sim\mathrm{Unif}(Y),\,a}
\left[h_a(P(y))\ne h_a(Q(y))\right].
\]

Indeed, equal endpoints never disagree, while two different binary labels are
separated by exactly half of all parity masks. Each hash uses only
`O(log |Y|)` seed and evaluation cost after the `O(R)` word transport for a
radius-`R` task. Sampling independent anchor-mask pairs estimates the Hamming
defect for one fixed path pair with ordinary concentration bounds and a sample
count independent of `|Y|` for fixed additive accuracy. Uniform estimation
over an entire word-pair family additionally pays a logarithmic family-size
factor. The benchmark's exhaustive audit costs approximately
`O(|Y| 2^m m)`; that audit cost is not the cost of one observable.

Consequently, define an equality-task loss as twice the one-bit disagreement
probability and a distinction-task objective as one minus twice that
probability. The latter is a baseline-corrected expected contrastive loss; its
individual Monte Carlo scores may be signed. Their maxima recover `Delta_R`.
The non-sofic transport obstruction therefore has an internal contrastive
transport signature; it is not visible only through point evaluations or a
full permutation dump.

**Observable-complete corollary.** Suppose finite reversible encoders achieve
vanishing transported-parity loss on every equality and distinction pair in
expanding word balls. The identity above makes their maximum parity loss equal
to `Delta_R`; the preceding reduction then makes those encoders a sofic
approximation. Hence a non-sofic group forces a positive parity-task loss on at
least one pair in one fixed finite ball, for every finite reversible encoder.
Because that ball contains finitely many pairs, any fixed distribution with
full support on the ball also inherits a positive expected-risk floor of at
least `mu_min eta_*`, where `mu_min` is its smallest pair mass.

This is a white-box prediction-to-soficity reduction for the reversible
transport class. It is not a reduction for an unrestricted predictor: the
shared finite latent action, reversibility, uniform anchor measure, and common
transport across tasks remain load-bearing assumptions.

It is also currently a white-box diagnostic: the anchor and parity feature are
defined on each encoder's own finite action set `Y`. Turning it into one
model-independent external dataset requires a common observable interface that
does not reveal an answer-bearing state address. That is now the main bridge
still to construct.

This identity is standard finite hashing mathematics. Its role as the
observable interface of EOTTA is new to this construction, but it has not yet
been checked for prior architectural use.

## Executable benchmark

Run:

```text
node research/endogenous-transport-benchmark.mjs
```

Add `--full` to include per-relation rows, probe hashes, every atlas revision,
and nondeterministic wall-clock timing. The default report is compact and
deterministic.

The benchmark has zero supplied semantic-address bits. It streams the same
generator tokens to the exact carrier and finite transports, checks the exact
carrier against an equal-information replay at every prefix, and evaluates
finite transports over every latent anchor. The white-box parity critic also
receives one anchor and one hash mask, totaling `2 ceil(log2 |Y|)` critic-probe
bits; these are reported separately rather than mislabeled as free context.

### Exact causal stream results

| Measurement | Result |
|---|---:|
| Bleak-Quick relation streams | 7 |
| Generator tokens | 185 |
| Prefix exact-replay checks | 185 |
| Incremental exact failures | 0 |
| Equal-information exact replay failures | 0 |
| Syntax-only relation failures | 7 |
| Longest stream | 69 tokens |
| Exact unit state compositions on longest stream | 69 |
| Leavitt products for those state updates plus online unit checks | 276 |
| Leavitt products for one final full replay verification | 140 |
| Maximum retained raw-history serialization | 2,886 bytes |
| Maximum public exact-state serialization | 2,947 bytes |

The exact architecture and the matched exact replay tie, as they should. This
is a semantic correctness result, not evidence that the atlas beats an exact
algorithm in runtime or memory.

### Stored finite adversaries

The benchmark exactly replayed the best models from the previous 925,234-step
countermodel search on the 155-element Thompson-`V` chart.

| action degree `|Y|` | max pair collision | max multiplication defect | max relator defect | relators with nonzero defect |
|---:|---:|---:|---:|---:|
| 6 | 1.000 | 1.000 | 0.667 | 1 |
| 8 | 0.625 | 0.875 | 0.625 | 3 |
| 10 | 0.700 | 0.700 | 0.500 | 3 |
| 12 | 0.750 | 0.750 | 0.583 | 3 |
| 16 | 0.625 | 0.625 | 0.375 | 5 |
| 20 | 0.600 | 0.600 | 0.400 | 5 |

Every saved `u` permutation is nonidentity, so it passes binary inequality
against the identity. Its nonzero fixed-point fraction is a quantitative
freeness deficit, not a binary equality-classification mistake. The benchmark
keeps those two notions separate.

For every saved model, the parity-observable calculation recovered the exact
Hamming distance of its worst relator and closest distinct pair. This executes
the bounded-observable identity above.

### Falsifying controls

| Control | Expected | Observed |
|---|---:|---:|
| Exact noncommutative `S_3` left-regular action | zero relation, multiplication, and collapse defect | zero defect; noncommuting words distance 1 |
| Exact finite `C_7` action, radius 10 | zero defect | zero defect |
| Sofic `Z` via a 17-cycle, radius 8 | zero local collapse | zero |
| `Z` via a 16-cycle, radius 8 | deliberate wrap collision | 1.000 |
| One exact real coordinate, histories 8 to 128 | precision must grow | denominator precision 17 to 257 bits |

The `Z` wrap control demonstrates that a finite-capacity collision by itself is
not evidence of non-soficity. The real-coordinate control records both a
general counting bound and one explicit radix encoding. Distinguishing all
`2^L` binary histories requires at least `L` information bits (or a minimum
gap no larger than `1/(2^L-1)` in a unit interval); the tested one-coordinate
encoding used denominator precision growing from 17 to 257 bits. Thus fixed
dimension alone is not a finite-information assumption.

### Bidirectional obstruction response

Two controlled failures were presented to the same atlas:

- A true exact-word alias produced a **split** revision and six separating
  coefficient probes.
- A violated exact relation produced a **glue** revision and one path-congruence
  constraint.

The controller exact-validated and installed both. The resulting curriculum
assigned loss 1 to a collapsed split candidate and loss 0 after separation; it
also assigned positive loss to an inconsistent glue candidate and loss 0 after
identification. This is an operational constraint scorer and artifact
registry, not yet an optimizer or full congruence-closure engine.

## Exact obstruction versus non-sofic obstruction

The seven Thompson-`V` relations plus a nonidentity generator give a rigorous
executable exact obstruction. If all relators close exactly in a finite
permutation action, the presentation induces a finite representation of
infinite simple `V`; it must be trivial and cannot preserve the chosen
nonidentity transport. This is an exact finite-action or LEF-level result.

It is not yet the numerical `(F,epsilon)` witness promised existentially by
non-soficity. The current proof compiler still reports three open universal
obligations:

1. an effective Kun-locality radius;
2. an effective finite expander-decomposition bound at that radius;
3. the resulting universal finite-word threshold.

The code continues to refuse a globally certified non-sofic challenge until
those obligations are closed.

## What this does and does not say about AI

The surviving architectural statement is a trilemma. A globally finite,
finite-precision, reversible causal transport model for a non-sofic process
cannot maintain both uniformly accurate composition and uniformly separating
transport. It must introduce a defect, collapse distinctions, lose robustness,
or grow beyond one finite global closure.

This does not establish a lower bound for arbitrary transformers, stochastic
state models, irreversible predictors, or task-local programs. Those systems
need not implement a faithful reversible action. Nor does it establish a
memory, latency, or downstream accuracy advantage over ordinary exact
algorithms.

The next architectural theorem should use the parity-observable bridge. A
finite robust reversible learner that achieves vanishing risk on an
observable-complete family of transported one-bit tasks would have vanishing
`Delta_R`, and a sequence of such learners would induce a sofic approximation.
The remaining work is to formulate a natural training interface whose risk
really forces a shared reversible transport—without placing the desired group
action in the labels or granting one architecture extra information.

## Next tests

1. Train finite reversible transports only from parity-observable episodes and
   test whether held-out relation and distinction defects are recoverable.
2. Give the same split and glue artifacts, with the same budget, to every
   adaptive baseline.
3. Add the free group `F_2` and growing cyclic models to distinguish
   nonamenability, non-LEF behavior, and non-soficity beyond the existing
   finite noncommutative `S_3` control.
4. Compare an exact carrier, generic external memory, finite-precision
   continuous recurrent state, and unrestricted sequence models with explicit
   bit, precision, update-work, and latency ledgers.
5. Continue the effective `(F,epsilon)` chase independently. Until it closes,
   empirical finite defect floors remain curriculum evidence rather than a
   universal certificate.

The important correction is conceptual: the candidate object is not a finite
model that approximates an exotic target. It is an executable process that
keeps constructing the congruence and observable geometry in which finite
tasks become decidable, while refusing to collapse that evolving transport
into one globally faithful finite surrogate.
