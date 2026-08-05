# Computable continuous completion: what the non-sofic core is—and is not—suggesting

## Correction: coefficients were an example, not the target object

The transcendental-coefficient and infinite-support experiments below remain
valid examples of computable analytic states, but they are not the main object
now being proposed. The stronger hypothesis places the transcendence at the
level of **presentation**: native program representatives compose computably,
while their extensional semantic equality has no total computable global normal
form. That construction is documented and executed in
[presentation-transcendent-algebra.md](presentation-transcendent-algebra.md).

The analytic completion in this note should now be read as an optional state
layer over that presentation-transcendent algebra, not as the source of its
fundamental opacity.

## Verdict

The intuition is productive, with one essential correction:

> Non-soficity does not imply that the group secretly becomes continuous.
> It says that a particular family of finite permutation models cannot globally
> replace its discrete multiplication. The continuous object enters when we
> represent states, amplitudes, and observables over that exact discrete spine.

This produces a dual-topology architecture:

```text
exact word topology                         analytic state topology
-------------------                         -----------------------
discrete non-sofic group G                  positive states on an operator completion
decidable implemented multiplication        norms, limits, spectra, distributions
proof-carrying equality                      certified rational interval queries
finite word programs                         possibly infinite-support amplitudes
```

The left side is not approximated away. The right side is deliberately
continuous and query-refined.

## The natural mathematical completion

Begin with the algebraic group algebra `Q[G]` or `C[G]`. Its elements are finite
noncommutative polynomials in exact group elements. The left-regular action on
`l2(G)` gives two standard analytic completions:

- the reduced group C-star algebra `C*_r(G)`, obtained by operator-norm closure;
- the group von Neumann algebra `L(G)`, obtained by weak-operator closure.

A normalized positive functional is a state on this noncommutative space. A
vector `B` in `l2(G)` gives the positive state

\[
\omega_B(a)=\frac{\langle B,\lambda(a)B\rangle}{\lVert B\rVert^2}.
\]

The group remains discrete. The state space and its operator topology are
continuous. This completion exists independently of soficity; non-soficity adds
the architectural reason not to replace the exact group spine with a globally
faithful finite permutation simulator.

## Experiment 1: a transcendental probability state

The first executable test uses an exact involution `g` and the Liouville
constant

\[
L=\sum_{k=1}^{\infty}10^{-k!}.
\]

`L` is computable and transcendental. It is not stored as a floating-point
number. Its state is a finite program that returns certified rational intervals
with an explicit tail proof.

Set

\[
B=1+Lg.
\]

Then positivity is automatic and

\[
\omega_B(g)=\frac{2L}{1+L^2},\qquad
p_+=\frac{(1+L)^2}{2(1+L^2)},\qquad p_-=1-p_+.
\]

The moment and probabilities are also transcendental: if
`2L/(1+L^2)` were algebraic, then `L` would satisfy a quadratic equation over
the algebraic numbers.

The implementation refined `p_+` to a certified interval of width about
`1.93e-120`. Exact normalization is retained as a dependency certificate
`p_- := 1-p_+`; it is not reconstructed by adding independently rounded floats.

This answers one part of the hypothesis precisely. An executable state can be
non-algebraic and lack a finite decimal or polynomial normal form. It still has
a finite **intensional** description: a program. A literally non-symbolizable
real would generally be noncomputable and therefore could not serve as an exact
executable model state.

## Experiment 2: a genuinely infinite-support amplitude

The stronger prototype leaves the finite group algebra. It defines

\[
B=\sum_{n=0}^{\infty}2^{-(n+1)}\delta_{h_n},
\]

where `h_n` is a computably enumerated sequence of distinct exact group
elements. This vector has exact norm squared `1/3`, but it is not a finite group
polynomial.

For a finite truncation `B_N`, Cauchy-Schwarz and the geometric tail give

\[
\frac{\left|\langle B,gB\rangle-
\langle B_N,gB_N\rangle\right|}{\lVert B\rVert^2}
\leq \frac{2}{2^N}+\frac{1}{4^N}.
\]

The executable test used `N=4,8,12`. Its exact normalized centers converged

```text
51/64, 13107/16384, 3355443/4194304,
```

toward `0.8`, while the binary probability enclosure narrowed around `0.9`.
At `N=12`, the certified probability width was approximately `4.8834e-4`.
All enclosures were nested.

This is the closest implementation so far to “continuous, non-finite memory”:
the semantic amplitude has infinitely many coordinates, only a finite prefix is
materialized, positivity is global, and every finite query has an effective
error guarantee.

## Equality changes character in the completion

The rational PAM critic had three truth layers: algebraic equality,
state-kernel equivalence, and emulator aliasing. Computable-real completion adds
an unavoidable fourth epistemic state:

1. exact algebraic equality, with a word proof;
2. exact state-kernel equality, with a null-relation proof;
3. interval-certified distinction, when the squared-distance lower bound is positive;
4. analytically unresolved, when every current interval contains zero and no equality proof exists.

The prototype implements this rule. It never infers exact equality merely
because intervals keep shrinking around zero. This is not an inconvenience; it
is a necessary capability type for continuous proof-carrying memory.

## Active-probe ablation

The probe experiment compared active policies on the exact nine-state OASIS
task. A query reveals only the chosen target moment.

| Budget | Random mean KL | Entropy KL | Novelty-gated entropy | Naive proof + entropy | Gated proof + entropy |
|---:|---:|---:|---:|---:|---:|
| 2 | 0.2603 | 0.2244 | 0.2244 | 0.1734 | **0.1683** |
| 4 | 0.2274 | 0.1702 | 0.1702 | 0.1734 | **0.1564** |
| 8 | 0.1753 | 0.0949 | **0.0649** | 0.1564 | 0.1289 |
| 12 | 0.1304 | 0.0437 | **0.0424** | 0.1541 | 0.0772 |
| 16 | 0.1012 | 0.0330 | **0.0253** | 0.1020 | 0.0352 |

The naive additive proof bonus failed. Of six algebraically valid generated
probes, several shared the same finite observation signature and three were
effectively constant for this target. Forcing all of them wasted queries.

Exact signature gating repaired the early-budget behavior but did not create a
universal predictive advantage. The proof objective and the task objective are
related but not identical.

The full-information fitting experiment showed a complementary pattern. The
corrected proof-aware learner was slightly worse at budgets two and four, then
better from budget eight onward:

| Steps | Local KL | Corrected proof-aware KL |
|---:|---:|---:|
| 2 | **0.06972** | 0.07330 |
| 4 | **0.02355** | 0.03400 |
| 8 | 0.00961 | **0.00586** |
| 12 | 0.00365 | **0.00248** |
| 16 | 0.00168 | **0.00110** |

The core implementation now:

- retains all six probes in the proof certificate;
- installs only one representative of each exact finite observation signature;
- reduces the predictive candidate set from 70 to 66;
- routes proof priority through information gain rather than an unconditional additive bonus; and
- improves the 16-step demo KL from `0.003546` to `0.001101`, with exact replay error zero.

## Prior-art correction

Greedy moment-rank acquisition is not by itself new. Selecting the largest
remaining Gram residual is pivoted Cholesky, Gaussian-process posterior-variance
selection, or farthest-point sampling in kernel geometry. The nearby literature
explicitly connects these viewpoints.

Likewise, positive-type functions, GNS states, group operator algebras,
computable C-star presentations, and continuous functional calculus are
established mathematics.

The narrower candidate synthesis is:

> **Computable-Completion PAM:** a proof-carrying computable state on the
> analytic completion of an exact non-sofic transition algebra, with finite
> moment enclosures, explicit unresolved equality, and a Pareto scheduler that
> keeps predictive information distinct from theorem-obstruction value.

That complete conjunction appeared distinct in the narrow search performed for
this project. It is not a claim of exhaustive or legal novelty.

## The resulting AI architecture

```text
exact non-sofic word spine
          |
          v
dense proof algebra Q[G] ---------> algebraic equality certificates
          |
          v
computable analytic completion ---> interval moment oracle
          |                              |
          v                              v
positive continuous memory       proof / separated / unresolved critic
          \                              /
           \                            /
            Pareto probe scheduler
       (prediction, obstruction, precision, cost)
                       |
                       v
             finite universal readout
```

The scheduler should not collapse its objectives into one permanent weighted
sum. It should maintain a small Pareto frontier and allocate a proof probe only
when it is nonredundant and either improves a predictive objective or resolves
an explicitly valued theorem uncertainty.

## New research targets

1. Promote the infinite-support vector state into PAM proper, returning PSD
   moment enclosures from a finite Gram factor plus a certified tail operator.
2. Replace exact finite signatures with state-kernel or interval-rank novelty,
   so probe equivalence generalizes beyond the nine-state readout.
3. Implement the four-state continuous relation critic throughout the learner.
4. Test a Pareto scheduler on several targets and emulator failures; do not tune
   a scalar bonus to one demonstration.
5. Apply computable continuous functional calculus `f(H)` to a learned
   self-adjoint obstruction operator `H`. This would create memory states that
   are genuine analytic functions of proof history, not finite polynomials.
6. Measure a two-axis scaling law: predictive loss versus certified semantic
   rank and analytic precision, rather than predictive loss versus parameters alone.

## Primary sources checked

- Aniello, [*Playing with functions of positive type, classical and quantum*](https://arxiv.org/abs/1411.1304).
- Drago and Moretti, [*The notion of observable and the moment problem for star-algebras and their GNS representations*](https://arxiv.org/abs/1903.07496).
- Fox, [*Computable presentations of C-star algebras*](https://arxiv.org/abs/2206.01415).
- Eagle and McNicholl, [*The computable functional calculus*](https://arxiv.org/abs/2606.05456).
- de Roos and Muratore, [*Novel Pivoted Cholesky Decompositions for Efficient Gaussian Process Inference*](https://arxiv.org/abs/2507.20678).
- Shabat, [*The Geometry of the Pivot: A Note on Lazy Pivoted Cholesky and Farthest Point Sampling*](https://arxiv.org/abs/2601.03706).
