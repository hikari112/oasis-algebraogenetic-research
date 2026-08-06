# Genesis Primitive-Escape Geometry

## Status: an exact complete boundedness criterion in one binary presentation

The tail-Hodge experiment found a positive certificate but also a sparse
nonzero class it could not see. This note tests a stronger idea:

> Do not ask whether a fixed finite harmonic statistic remains nonzero. Ask how
> much compatible primitive geometry is required as the exact constraints grow.

The resulting **primitive-escape profile** is a nested sequence of exact
minimum-norm problems. In the declared binary tower, it gives a complete
zero-versus-nonzero test for the derived class:

\[
[\alpha]=0\text{ in }\mathbb Z_2/\mathbb Z
\quad\Longleftrightarrow\quad
\sup_N K_N(\alpha)<\infty.
\]

Every finite problem is computable. For a nonzero class the costs diverge, but
no finite prefix alone certifies future escape over all continuations: every
finite binary word has an eventually constant extension. A uniform terminating
zero/nonzero decision procedure for computable digit streams is impossible by
the halting reduction in Section 4. This is a mathematical criterion, not a
finite decision algorithm.

The name is project-local. The Hilbert-space, pseudoinverse, compactness, and
derived-limit ingredients have extensive prior art; no novelty or priority
claim is made for their present packaging. The executable companion is
[`genesis-primitive-escape.mjs`](genesis-primitive-escape.mjs).

## 1. Primitive and completed data spaces

For the binary inverse-limit class, use canonical digits

\[
b(\alpha)=(b_0,b_1,\ldots),\qquad b_n\in\{0,1\}.
\]

Ordinary nonnegative integers have eventually-zero digits. Ordinary negative
integers have eventually-one digits. A primitive geometry that admits only
square-summable sequences would incorrectly reject the latter zero classes,
because the all-one cocycle has the constant primitive `x=-1`.

Define instead

\[
\mathcal H_{\mathrm{gen}}
=
\{x:x_n=c+z_n,\ c\in\mathbb R,\ z\in\ell^2(\mathbb N)\},
\]

with its unique decomposition and norm

\[
\|x\|_{\mathrm{gen}}^2
=
|c|^2+\sum_{n\ge0}|z_n|^2.
\]

The exact derivative is

\[
(Dx)_n=x_n-2x_{n+1}.
\]

The asymptotic constant sector is not cosmetic. It is precisely what makes both
eventually-zero and eventually-one binary tails legitimate zero classes.

The completed data must live in a larger Hilbert space. Define

\[
\mathcal Y
=
\left\{y:\sum_{n\ge0}4^{-n}|y_n|^2<\infty\right\}.
\]

Every bounded binary digit stream belongs to `Y`, and its finite coordinate
projections converge in the `Y` norm. The derivative is a bounded map

\[
D:\mathcal H_{\mathrm{gen}}\longrightarrow\mathcal Y.
\]

Its range is exactly the copy of `H_gen` inside `Y`. Indeed, `D(H_gen)` is
contained in `H_gen`, and the `ell^2` part of `D` is surjective: for
`w in ell^2`, set

\[
(Rw)_0=0,
\qquad
(Rw)_n=-\sum_{k=0}^{n-1}2^{k-n}w_k.
\]

With the convention `(Sz)_n=z_(n+1)`, one has `(I-2S)Rw=w`, and the
convolution kernel is summable, so `R` is bounded.
Constants are obtained by choosing the opposite constant primitive. Therefore

\[
D(\mathcal H_{\mathrm{gen}})=\mathcal H_{\mathrm{gen}}\subset\mathcal Y.
\]

Finite-support sequences lie in this range and are dense in `Y`, while a
non-eventually-constant binary stream is not in `H_gen`. Hence the two-term
Hilbert complex

\[
0\longrightarrow\mathcal H_{\mathrm{gen}}
\xrightarrow{D}\mathcal Y\longrightarrow0
\]

has dense nonclosed range. Its degree-one reduced cohomology and degree-one
harmonic sector vanish,

\[
\mathcal Y/\overline{D(\mathcal H_{\mathrm{gen}})}=0,
\qquad
\ker D^*=0,
\]

but its unreduced degree-one quotient `Y/D(H_gen)` is nonzero and indiscrete:
the quotient of a topological vector space by a dense proper subspace has no
nontrivial open sets. Degree zero is different:

\[
\ker D=\operatorname{span}\{(2^{-n})_{n\ge0}\}.
\]

Thus “zero harmonic sector” below always means the degree-one sector relevant
to the phantom cokernel, not the entire two-term complex.

There is now an exact, though presentation-dependent, comparison:

\[
\iota:\mathbb Z_2/\mathbb Z\longrightarrow
\mathcal Y/D(\mathcal H_{\mathrm{gen}}),
\qquad
\iota([\alpha])=b(\alpha)+D(\mathcal H_{\mathrm{gen}}).
\]

It is well-defined because changing an ordinary representative changes either
finitely many digits or stays within an eventually constant zero class. It is
injective: if two binary digit streams differ by an element of `H_gen`, their
discrete difference converges and is therefore eventually `-1`, `0`, or `1`;
its 2-adic sum is then an ordinary integer.

The comparison is nonlinear and is not a group homomorphism. Binary carries
are the obstruction—for example, doubling `0101...` creates a nonconvergent
infinite carry defect. This is not yet a natural derived-to-Hodge functor. It is
an exact injection of quotient sets relative to the declared dyadic and
Hilbert presentations.

## 2. Finite continuation as a minimum primitive

For a binary prefix `y_0,...,y_N`, define

\[
K_N(y)
=
\min\bigl\{\|x\|_{\mathrm{gen}}:
(Dx)_n=y_n\text{ for }0\le n\le N\bigr\}.
\]

The feasible set is a nonempty closed affine subspace of
`H_gen`, so it has a unique minimum-norm element orthogonal to its homogeneous
kernel. Equivalently, `K_N` is the norm of the Moore-Penrose minimum primitive
for the finite-rank observation map

\[
A_Nx=Q_NDx=((Dx)_0,\ldots,(Dx)_N),
\]

where `Q_N` is the orthogonal coordinate projection in the weighted completed
space `Y`. Thus every finite projected datum is in `ran(A_N)`, even when the
compatible completed datum lies in `Y` but outside `ran(D)`.

Equivalently, every finite two-term complex

\[
0\longrightarrow\mathcal H_{\mathrm{gen}}
\xrightarrow{A_N}Q_N\mathcal Y\longrightarrow0
\]

has zero degree-one cokernel because `A_N` is surjective. The obstruction is
present only in the compatible completed system.

The constraints are nested. Therefore

\[
K_0(y)\le K_1(y)\le K_2(y)\le\cdots.
\]

This monotonicity is semantic: continuation adds an exact compatibility demand
without deleting an earlier one.

## 3. The finite solve is exact and two-dimensional

Let `t=x_(N+1)`. Backward substitution gives

\[
x_n=a_n+2^{N+1-n}t,
\qquad
a_n=\sum_{k=n}^{N}2^{k-n}y_k.
\]

At the minimum, the unconstrained `ell^2` tail after `N+1` is zero. Writing
`x_n=c+z_n`, the cost becomes

\[
|c|^2+
\sum_{n=0}^{N+1}|a_n+2^{N+1-n}t-c|^2,
\qquad a_{N+1}=0.
\]

Thus every apparently infinite finite-stage optimization reduces to a positive
two-variable rational quadratic problem in `c` and `t`. The executable solves
its `2 x 2` normal equations with exact integers, checks both equations, and
returns an exact rational value for `K_N^2`.

This is not a heuristic optimizer. It is the closed-form orthogonal
pseudoinverse primitive required by the declared geometry. Its relation to
Hodge theory is through compatible primitives and Hilbert complexes, not
through a newly defined Laplacian at this stage.

## 4. Primitive-escape theorem

### Theorem

For canonical binary digits `b(alpha)`, the following are equivalent:

1. `[alpha]=0` in `Z_2/Z`;
2. `alpha` is an ordinary integer;
3. `b(alpha)` is eventually all zero or eventually all one;
4. there exists `x in H_gen` with `Dx=b(alpha)`;
5. the nested costs `K_N(b(alpha))` are bounded.

If these conditions fail, then

\[
K_N(b(\alpha))\longrightarrow\infty.
\]

### Proof

The equivalence of the first three statements is the standard binary 2-adic
description of ordinary integers.

If the digits are eventually zero, choose a finite-support primitive by
backward substitution. If they are eventually one, use the constant tail
`x=-1` and alter only finitely many coordinates. Both choices lie in `H_gen`,
proving `3 => 4`. A global primitive is feasible at every finite stage, so
`4 => 5`.

For the converse, let `x^(N)` be the unique minimum primitive. If the norms are
bounded, weak compactness of bounded sets in the Hilbert space supplies a
weakly convergent subsequence. Every fixed coordinate equation is a continuous
linear constraint and is satisfied eventually along that subsequence. Its weak
limit therefore solves all equations, proving `5 => 4`.

Finally, if `x_n=c+z_n` with `z in ell^2`, then `z_n -> 0` and

\[
(Dx)_n\longrightarrow-c.
\]

A convergent sequence taking values only in `{0,1}` must be eventually
constant. Hence `4 => 3`. Monotonicity turns unboundedness into actual
divergence. This completes the proof.

### Uniform stopping no-go

The criterion does not yield a terminating classifier for arbitrary computable
digit programs. Given a Turing machine `M`, define a uniformly computable
binary stream that outputs zero while `M` has not halted within the current
step budget, and alternates forever starting when a halt is first observed. If
`M` never halts, the stream is all zero and its primitive profile is bounded.
If `M` halts, the stream is eventually alternating and its profile escapes.

A total algorithm deciding boundedness from an index promised to compute a
total binary stream would therefore decide the halting problem; every program
constructed in the reduction satisfies that promise. This proves the intended
no-global-stopping claim. It does not prevent a separate proof from settling a
particular explicit stream such as `U`.

## 5. Descent under integer representatives

For a noninteger 2-adic value, adding an ordinary integer changes only finitely
many canonical digits. If two digit cocycles differ by a finite-support
sequence `delta`, backward substitution gives a fixed finite-energy primitive
`h` with `Dh=delta`. The triangle inequality then gives, after the support of
`delta`,

\[
|K_N(y+\delta)-K_N(y)|\le\|h\|_{\mathrm{gen}}.
\]

Thus finite representative changes alter the escape profile by at most an
additive constant. For zero classes, every representative has a bounded
profile by the theorem. Consequently boundedness versus escape, and any growth
notion taken modulo bounded additive distortion, descends to `Z_2/Z` within the
fixed dyadic presentation.

This does not make the precise numerical profile intrinsic to the abstract
quotient group. The binary tower, digit order, prefix filtration, primitive
space, and norm remain declared structure.

## 6. Exact and numerical controls

The executable solves every depth through `128` for five trajectories and
checks `640` monotonicity inequalities with exact rational cross-products.

| canonical digit path | derived class | `K_64` | `K_128` | result |
|---|---:|---:|---:|---|
| universal Cantor stream | nonzero | `2.2295` | `3.3304` | escapes |
| ones at powers of two | nonzero | `1.5027` | `1.6668` | escapes, despite zero tail-Hodge energy |
| alternating `0101...` | nonzero | `1.4378` | `1.9617` | escapes |
| integer `17` | zero | `0.7619` | `0.7729` | bounded |
| integer `-17` | zero | `1.1280` | `1.1414` | bounded |

The finite values do not prove divergence. The theorem does. The samples test
the exact solver, the predicted monotonicity, positive and negative zero
classes, and the sparse false negative of the earlier variance detector.

Representative shifts `-17,-1,1,17` are also tested. Their observed profile
differences remain below the fixed finite-support primitive bounds. That
runtime comparison uses floating square roots with tolerance; the `O(1)` bound
it samples is established exactly by the triangle-inequality proof in Section
5, not by the numerical check.

The weighted completion audit verifies `129` decreasing tail-error bounds for
the universal datum through depth `128`. The all-depth membership, dense-range,
and nonclosed-range statements come from the proofs in Section 1.

## 7. What became load-bearing

The earlier tail-Hodge value was empirical digit variance represented as a
projection off the constant harmonic line. Path geometry itself did no work.

Here the Hilbert geometry is load-bearing in three places:

1. finite continuation selects a canonical minimum primitive rather than an
   arbitrary terminal-boundary solution;
2. nested constraint cost is monotone;
3. weak compactness turns a hypothetical uniform cost bound into a compatible
   global primitive.

The weighted data completion adds a fourth: the full binary datum belongs to a
fixed Hilbert target in which the differential has dense nonclosed range. The
class is nonzero in unreduced degree-one cohomology, while reduced degree-one
cohomology and the degree-one harmonic sector are zero. The informative
observable is the **escape of finite primitive norms**.

This is now a literal nonclosed-range Hilbert complex, but it is still not
classical Hodge theory on a smooth projective variety. The choice of weighted
completion is declared, the comparison is nonlinear, and no sheaf, geometric
Laplacian, or natural arithmetic-Hodge functor has yet been produced.

That suggests a methodological shift:

> When a global class is invisible to every finite cohomology group, measure
> the geometry required to keep choosing compatible finite primitives.

## 8. An escape-rate hypothesis

All nonzero binary derived classes escape. The theorem does not determine their
rates, and the universal, alternating, and sparse controls only suggest from
their finite profiles that different regimes may occur. This motivates a
provisional **escape-rate profile**:

\[
[\alpha]\longmapsto[K_N(\alpha)]_{O(1)},
\]

where profiles differing by bounded additive distortion are identified. This
equivalence is justified for finite changes of the 2-adic representative, but
not yet for the wider semantic equivalences we ultimately need.

It is plausible that nonzero classes realize qualitatively different growth
regimes, perhaps arbitrarily slow ones. That has not been proved. The next
tests should construct increasingly sparse nonzero digit paths, derive upper
and lower bounds on `K_N`, and determine which growth classes survive changes
of cofinal refinement and admissible Hilbert norm.

Equivalent Hilbert norms generally introduce multiplicative distortion, and an
unrestricted cofinal reindexing can arbitrarily change an apparent rate. A
credible invariant should therefore prove cost-controlled inequalities of the
form

\[
aK_N-C\le K'_{\phi(N)}\le bK_N+C
\]

for fixed positive `a,b`, finite `C`, and a refinement map `phi` charged under
the same action/address/certificate cost ledger. Without such control, only the
bounded-versus-unbounded dichotomy survives cofinal reindexing.

If a robust rate space exists, it could become a different kind of complexity
law: not parameter count or approximation error, but the cost of maintaining
exact local solvability without a global compatible primitive. That is a
hypothesis, not a proved computational lower bound.

## 9. Relation to Genesis

The present tower is still fixed and the digits are still supplied in advance.
The theorem does not yet establish algebraogenesis. What it supplies is a much
cleaner target for an endogenous construction:

> A certificate-forced attachment process should generate nested primitive
> constraints whose minimum compatible cost escapes, while every next finite
> primitive remains exactly computable.

That would make “the learner grows the topology in which states become
distinguishable” quantitative. A new question would not merely add a stored
bit. It would increase the least geometry needed to make all generated
distinctions jointly realizable.

The harder invariance target is to prove that semantic gauges and cofinal
refinements change the escape profile by at most bounded distortion. Only after
that should exact non-sofic transport be coupled to the primitive geometry and
tested against the full observational quotient.

## 10. Hypothesis ledger

### Proved here

- Every finite primitive cost is an exact rational two-variable solve.
- The costs are nested and nondecreasing.
- Bounded cost is equivalent to the zero class in the declared binary tower.
- Every nonzero class has divergent primitive cost.
- Finite representative changes alter the norm profile by at most `O(1)`.
- The sparse class missed by tail variance is detected.
- The weighted two-term Hilbert complex has dense nonclosed range, zero reduced
  degree-one cohomology, and a nonzero indiscrete unreduced degree-one quotient.
- Dyadic digitization gives a presentation-dependent nonlinear injection of
  `Z_2/Z` into that unreduced quotient.
- No total computable classifier can decide boundedness for every computable
  digit program.

### Open but testable

- Nonzero classes realize a meaningful space of escape-rate profiles.
- That rate space is invariant under a natural class of semantic gauges, cofinal
  refinements, and equivalent primitive norms.
- Current obstruction certificates can generate an escaping tower without
  reading a preallocated future tape.
- A semantics-forced exact non-sofic action can preserve escape after the full
  future-query quotient.
- Primitive escape has an arithmetic, non-Archimedean, sheaf, or
  geometrically natural Hodge realization outside this toy weighted complex.

These are hypotheses we intend to attack, not conclusions inferred from the
success of the current example.

## 11. Claim boundary

- The construction is not canonical for the abstract group `Z_2/Z`.
- It depends on the declared binary presentation and Hilbert norm.
- The comparison into unreduced Hilbert cohomology is nonlinear and not a group
  homomorphism.
- Its local primitive carrier is infinite-dimensional.
- It does not generate its own question types.
- It is not internally non-sofic.
- It gives no implication for the Hodge conjecture, P versus NP, or Galois
  theory.
- “Escape rate” is not yet an invariant under arbitrary equivalent norms or
  cofinal reindexings.
- Its exact packaging has not received an exhaustive prior-art audit.

## 12. Run

```powershell
node research/genesis-primitive-escape.mjs
```

## References

1. C. Schochet, [A Pext Primer: Pure Extensions and `lim^1` for Infinite
   Abelian Groups](https://nyjm.albany.edu/m/2003/1p.pdf).
2. The Stacks Project, [Derived
   Limits](https://stacks.math.columbia.edu/tag/08TB).
3. J. Brüning and M. Lesch, [Hilbert Complexes](https://doi.org/10.1016/0022-1236(92)90147-B),
   *Journal of Functional Analysis* 108 (1992), 88–132.
