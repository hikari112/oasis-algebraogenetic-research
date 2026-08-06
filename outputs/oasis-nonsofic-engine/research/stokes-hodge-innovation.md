# Stokes-Hodge Innovation Geometry

## Status: exact Hilbert theorem and executable finite audit

This note isolates the strongest structure found after the primitive-escape
experiment. It does not assume that the carrier is discrete, continuous,
probabilistic, cardinal, or non-sofic. It begins with a more primitive
question:

> When every finite demand has an exact realizer, what additional structure
> determines whether those realizers assemble into one globally admissible
> object?

The first answer is a general compactness principle. The Hilbert-space model
then supplies a sharper quadratic refinement: the cost of each newly imposed
Stokes constraint is an orthogonal innovation, and global nonexactness is
exactly the nonsummability of those innovations.

The companion executable is
[`stokes-hodge-innovation.mjs`](stokes-hodge-innovation.mjs). All numerical
values printed by it are presentations of exact rational identities unless a
field is explicitly labelled approximate.

This is not a novelty or priority claim. Nested projection, Moore-Penrose,
Gram-Schmidt, compactness, and closed-range mechanisms are established
mathematics. The research question is whether their coupling to
obstruction-generated question attachment produces a natural new object.

## 1. Costed finite-to-global realization

Let `R` be a space of admissible realizers with topology `tau`, and let

\[
  c:R\longrightarrow [0,\infty)
\]

be a realization cost. A datum `y` and its first `n` questions determine a
closed feasible set

\[
  F_n(y)\subseteq R,
  \qquad
  F_{n+1}(y)\subseteq F_n(y).
\]

Define

\[
  K_n(y)=\inf\{c(x):x\in F_n(y)\}.
\]

The datum is **finitely realizable** when every `F_n(y)` is nonempty. It is
**globally realizable** when

\[
  F_\infty(y)=\bigcap_{n\geq 0}F_n(y)
\]

is nonempty.

### Costed realization compactness lemma

Assume:

1. every `F_n(y)` is nonempty and `tau`-closed;
2. the sets are nested;
3. every finite-cost sublevel
   \[
     \{x:c(x)\leq M\}
   \]
   is `tau`-compact; and
4. `c` is lower semicontinuous.

Then

\[
\boxed{
F_\infty(y)\neq\varnothing
\quad\Longleftrightarrow\quad
\sup_n K_n(y)<\infty .
}
\]

#### Proof

If `x` lies in every `F_n(y)`, then `K_n(y)<=c(x)` for every `n`.

Conversely, suppose `K_n(y)<=M`. For each `n`, choose a point of `F_n(y)`
with cost at most `M+1`. The closed nested sets

\[
  F_n(y)\cap\{x:c(x)\leq M+1\}
\]

are nonempty subsets of one compact sublevel. Their intersection is nonempty.
Any point in the intersection is a global realizer. QED.

This lemma identifies the real axis exposed by the experiments:

\[
\boxed{
\text{finite realizability}
\quad\text{versus}\quad
\text{uniformly bounded global realizability}.
}
\]

It is not a statement about cardinality. It is relative to a declared
realizer class, topology, question system, and cost. Changing those data can
change the obstruction. Natural comparison maps and invariance theorems are
therefore load-bearing, not cosmetic.

## 2. Hilbert realization and the abstract Stokes identity

Let `H` and `Y` be real Hilbert spaces and let

\[
  D:H\longrightarrow Y
\]

be bounded. Let

\[
  0=Q_{-1}\leq Q_0\leq Q_1\leq\cdots,
  \qquad Q_n\longrightarrow I_Y
\]

be increasing finite-rank orthogonal projections converging strongly to the
identity. For the rank-one theorem, write

\[
  Q_n-Q_{n-1}=q_n\otimes q_n,
  \qquad \|q_n\|=1.
\]

For a completed datum `y in Y`, set

\[
  F_n(y)=\{x\in H:Q_nDx=Q_ny\},
\]

and assume every finite problem is feasible. This is automatic when `D(H)` is
dense in `Y`: a finite-dimensional projection of a dense linear subspace is
the entire projected space.

Let

\[
  x_n=P_{F_n(y)}0,
  \qquad K_n=\|x_n\|,
  \qquad L_n=\ker(Q_nD),
\]

with `x_{-1}=0` and `L_{-1}=H`. The adjoint identity

\[
\boxed{
  \langle Dx,q\rangle_Y=\langle x,D^*q\rangle_H
}
\]

is the adjoint identity for the bounded operator `D`. It becomes an abstract
Hilbert-complex Stokes/Green formula when `D` is declared as a graded
differential, and it becomes geometrically Stokes-theoretic only after a
cellular, de Rham, or other geometric realization identifies the new query as
a cell, chain, or test form and `D^*q` as its boundary or codifferential datum.

## 3. Rank-one Stokes innovation theorem

For the new query at stage `n`, define

\[
  a_n=D^*q_n,
  \qquad
  w_n=P_{L_{n-1}}a_n,
\]

and its unexplained residual

\[
  r_n=\langle y-Dx_{n-1},q_n\rangle_Y.
\]

The vector `w_n` is the part of the new Stokes boundary direction not already
accounted for by the previous questions.

### Three exact branches

1. If `w_n=0` and `r_n=0`, the query is redundant:
   \[
     F_n=F_{n-1},\qquad x_n=x_{n-1}.
   \]
2. If `w_n=0` and `r_n!=0`, the new constraint is inconsistent and `F_n` is
   empty.
3. If `w_n!=0`, the unique minimum correction is
   \[
     g_n=x_n-x_{n-1}
       =\frac{r_n}{\|w_n\|^2}w_n.
   \]

Consequently,

\[
\boxed{
K_n^2-K_{n-1}^2
=\|g_n\|^2
=\frac{|r_n|^2}{\|w_n\|^2}.
}
\]

We provisionally call this scalar the **Stokes innovation energy**. It
combines a new residual, the capacity of the genuinely new boundary
direction, and the Hilbert-minimum correction required to restore exactness
in the declared two-term complex.
It is not physical fluid energy and `D` is not yet the Navier-Stokes Stokes
operator.

### Proof

Every element of `F_{n-1}` is `x_{n-1}+h` for some `h in L_{n-1}`, and
`x_{n-1}` is orthogonal to `L_{n-1}`. The new scalar equation becomes

\[
  \langle h,w_n\rangle_H=r_n.
\]

If `w_n` vanishes, this equation is either redundant or inconsistent. If it
does not vanish, its minimum-norm solution is the displayed `g_n`.
Pythagoras gives the energy identity.

Moreover,

\[
  L_n=L_{n-1}\cap w_n^\perp.
\]

Every later correction belongs to `L_n`, so it is orthogonal to `g_n`.
Therefore all innovations are pairwise orthogonal and

\[
\boxed{
  K_N^2=\sum_{n=0}^{N}\|g_n\|^2.
}
\]

The path of minimum corrections, rather than only the terminal quotient
class, now carries an exact additive geometry.

## 4. Global range theorem

Under the hypotheses above,

\[
\boxed{
y\in D(H)
\iff
\sup_NK_N<\infty
\iff
\sum_n\frac{|r_n|^2}{\|w_n\|^2}<\infty,
}
\]

where redundant terms contribute zero.

The forward direction is immediate: a global primitive is feasible at every
finite stage. For the converse, finite total innovation energy makes the
orthogonal series

\[
  x_N=\sum_{n\leq N}g_n
\]

converge strongly in `H`. Every fixed finite constraint holds for all
sufficiently late partial sums and therefore for the limit. Strong totality
of the `Q_n` gives `Dx=y`.

If `D(H)` is dense but nonclosed and

\[
  y\in\overline{D(H)}\setminus D(H),
\]

then every finite Stokes problem is exact while the accumulated innovation
energy diverges. Reduced degree-one cohomology and the degree-one harmonic
sector can both vanish even though the unreduced class is nonzero.

## 5. Gauge and refinement laws

Suppose unitaries `U:H->H'` and `V:Y->Y'` satisfy

\[
  D'=VDU^*,\qquad y'=Vy,\qquad Q_n'=VQ_nV^*.
\]

Choose the oriented rank-one generator `q_n'=Vq_n`. Then

Then

\[
  x_n'=Ux_n,
  \quad w_n'=Uw_n,
  \quad r_n'=r_n,
  \quad g_n'=Ug_n.
\]

Every innovation energy is exactly invariant. More general bounded gauges can
at best be expected to give controlled distortion unless the metric is
transported as part of the gauge.

Without fixing the orientation, the rank-one generator is determined only up
to sign. In that case `r_n` and `w_n` can both change sign, while `|r_n|`,
`||w_n||`, `g_n`, and the innovation energy remain invariant.

For a cofinal subsequence `n_0<n_1<...`, set `n_{-1}=-1` and `x_{-1}=0`, and
define the block correction for `j>=0`

\[
  G_j=x_{n_j}-x_{n_{j-1}}.
\]

Pairwise orthogonality gives

\[
\boxed{
  \|G_j\|^2
  =\sum_{k=n_{j-1}+1}^{n_j}\|g_k\|^2.
}
\]

Thus accumulated energy and bounded-versus-escaping behavior are invariant
under cofinal grouping. An apparent rate per uncharged stage index is not.

For a higher-rank increment `E_n=ran(Q_n-Q_{n-1})`, let

\[
  B_n=P_{E_n}D|_{L_{n-1}},
  \qquad
  \rho_n=P_{E_n}(y-Dx_{n-1}).
\]

If `rho_n` does not lie in `ran(B_n)`, the new finite problem is
inconsistent; the pseudoinverse supplies only a least-squares correction. If
`rho_n in ran(B_n)`, the exact minimum correction is `B_n^dagger rho_n` and

\[
  \|g_n\|^2
  =\langle \rho_n,(B_nB_n^*)^\dagger\rho_n\rangle.
\]

Feasibility is automatic under the standing assumption that every `F_n` is
nonempty.

A sum of uncorrected scalar residual ratios is generally false. The Gram or
Schur-complement term is essential.

## 6. Exact `H_gen` instance

The current primitive model is

\[
  H_{\mathrm{gen}}
  =\{x_n=c+z_n:c\in\mathbb R,\ z\in\ell^2\},
\]

with

\[
  \|x\|_{\mathrm{gen}}^2
  =|c|^2+\sum_n|z_n|^2,
  \qquad
  (Dx)_n=x_n-2x_{n+1}.
\]

The completed data space is

\[
  Y=\left\{y:\sum_n4^{-n}|y_n|^2<\infty\right\}.
\]

The range `D(H_gen)=H_gen` is dense and nonclosed in `Y`. Coordinate
projections give the finite questions. For a prefix `y_0,...,y_N`, exact
backward substitution followed by a two-variable rational quadratic solve
produces `x_N`.

The executable verifies, through depth 64 on each of five controls:

- every old derivative constraint after every new solve;
- exact Pythagoras at every stage;
- exact residual-over-capacity energy at every stage, with capacity derived
  independently by rational Gram-Schmidt of the raw Riesz query rows;
- every pairwise innovation orthogonality relation;
- exact finite geometric-block additivity;
- the global sign-unitary covariance;
- a duplicated-query redundant branch whose zero capacity is derived by the
  same Gram projection; and
- a duplicated-query inconsistent branch driven by a computed nonzero
  residual.

The total exact checks are:

| Check | Count |
|---|---:|
| derivative constraints | 10,725 |
| Pythagoras identities | 325 |
| residual/capacity identities | 325 |
| pairwise orthogonality identities | 10,400 |
| finite geometric-block identities | 80 |

The terminal squared costs at depth 64 are:

| Datum | Class status | `K_64^2` |
|---|---|---:|
| universal Cantor stream | nonzero | `4.9705342979` |
| alternating period-two stream | nonzero | `2.0671296296` |
| ones at powers of two | nonzero | `2.2580757097` |
| 2-adic integer `17` | zero | `0.5805511475` |
| 2-adic integer `-17` | zero | `1.2724456787` |

These finite values test the solver; they do not prove asymptotic behavior.
The separate primitive-escape theorem proves boundedness exactly for the zero
binary derived classes.

## 7. Primitive escape is independent of non-soficity

The period-two alternating stream is generated by a finite-state, hence sofic,
system. Its canonical binary tail is not eventually constant, so it represents
a nonzero class and its primitive cost escapes. Non-soficity is therefore not
necessary.

It is not sufficient either. Let a countable non-sofic group `G` act by its
faithful left-regular representation on the equivariant closed-range identity
complex

\[
  I:\ell^2(G)\longrightarrow\ell^2(G),
\]

for which every datum has a global primitive and every obstruction quotient
vanishes.

Non-sofic transport remains a meaningful later stress test only if it is
forced by the semantics and preserves an independently natural innovation
geometry after observational quotienting.

## 8. Beyond Hilbert norm: realization schemas

The abstract connections suggested by the ideation become useful after one
removes their premature conclusions. Hilbert norm is only the first possible
realization cost.

| Candidate schema | Realizers | Cost | Compactness mechanism | Missing bridge |
|---|---|---|---|---|
| current primitive complex | `H_gen` primitives | Hilbert norm | weak compactness | natural endogenous questions |
| PDE/Galerkin | approximate fields or trajectories | energy or Sobolev norm | weak compactness plus a strong-limit mechanism | nonlinear closure and basis-independent estimates |
| algebraic cycles | effective cycles representing prescribed observations | degree, with positive/negative parts and denominators separately controlled when needed | proper fixed-degree parameter spaces | a natural closed cycle-class observation tower and rational functoriality |
| program synthesis | programs satisfying finite traces | canonical description length, optionally with states or time also charged | finite description-cost sublevels over a finite alphabet | semantic gauge, computable selection, and a substantive global property |
| termination proofs | ranking functions for finite transition sets | canonical grammar size or a declared ordinal-notation cost | finite/compact certificate sublevels must be proved | sound and complete attachment plus global ranking semantics |
| arithmetic dynamics | orbit or parity certificates | stopping, proof, or realization complexity | problem-dependent | equivalence to the actual arithmetic conjecture |

This table is a hypothesis generator, not an equivalence claim.

### A serious algebraic-geometry clue

Effective cycles of a fixed dimension and degree on a fixed projective variety
live in projective Chow parameter spaces; a bounded degree gives a finite
union of those spaces. This makes a costed-compactness question conceivable:
can increasingly strong observations of a target class cut out closed nested
sets of effective cycles with uniformly bounded degree, so that properness
forces a global cycle?

Signed cycles require separate control of their positive and negative parts.
Rational cycles also require denominator control, and neither height nor mass
has compact sublevels without an additional theorem. The Chow group, which is
a quotient by rational equivalence, is not itself the proper parameter space
used in this argument.

No such observation tower has been constructed here. A genuine target starts
with a smooth projective complex variety `X`, a codimension `p`, and a class

\[
  \gamma\in H^{2p}(X,\mathbb Q)\cap H^{p,p}(X),
\]

and must decide whether `gamma` lies in the image of

\[
  \mathrm{CH}^p(X)_\mathbb Q\longrightarrow
  H^{2p}(X,\mathbb Q)\cap H^{p,p}(X).
\]

On a fixed smooth projective variety, cohomology is finite-dimensional and
elliptic Hodge ranges are closed. A tower containing only linear observations
of one cohomology class stabilizes after finitely many independent questions.
An infinite realization obstruction would therefore need genuinely extra
structure - for example a family, degeneration, tower of varieties,
rational-equivalence constraints, or a cycle complex - and must descend back
to the fixed cycle-class question. The present dense-nonclosed Hilbert
pathology cannot simply be renamed a Hodge-Conjecture obstruction. A genuine
bridge must preserve the rational lattice, Hodge filtration, polarization,
functoriality, and the cycle-class map, and must actually produce an algebraic
cycle rather than only a harmonic representative.

### A serious PDE clue

Galerkin approximants plus uniform estimates often feed compactness arguments.
The present theorem is an exact linear prototype of that logical pattern:
finite projected equations are solvable, and a uniform realizer bound forces a
global solution.

Navier-Stokes adds time, pressure, incompressibility, nonlinear convection,
and the need to pass a quadratic term to the limit. Standard energy control
produces weak solutions, not automatically smoothness or uniqueness. A real
bridge needs a genuine divergence-free Gelfand triple, the Stokes operator,
uniform estimates satisfying a known continuation or global-regularity
criterion, enough strong compactness or other structure to pass the nonlinear
term, and basis-independent innovation control across admissible Galerkin
schemes. Nothing here yet identifies innovation energy with kinetic energy,
enstrophy, viscous dissipation, or a Navier-Stokes Sobolev norm.

### A serious computation clue

Over a finite alphabet, there are only finitely many canonical programs below
a fixed description-length bound. If every finite behavior constraint had a
compatible program under one uniform bound, a compactness or
infinite-pigeonhole argument could select a global program. State count or
runtime alone need not have finite sublevels because syntactically padded
programs can share those costs; a semantic gauge or description bound is
required. Failure of every valid bound is a legitimate description-cost
escape phenomenon, but existence does not imply computable synthesis.

This does not explain the Halting Problem by Kolmogorov complexity and does not
produce an oracle. The exact result currently available is narrower: no total
algorithm decides boundedness of the primitive-cost profile for all total
computable binary streams.

For termination, one must fix whether the property concerns one execution,
all inputs, or all reachable states; choose a sound certificate language; and
prove that bounded certificate sublevels are compact and complete for that
property. A cycle can cause finite inconsistency rather than escape, and a
terminating system can require unbounded certificates in a restricted
grammar. Ordinal cost also requires an explicit notation system.

Collatz parity orbits may be supplied as experimental data, and finite
termination certificates may be costed. Raw parity is not yet the right
encoding: an orbit reaching `4-2-1` becomes eventually periodic rather than
eventually constant, so the present binary detector still calls it a nonzero
escaping class. A serious experiment must first collapse the terminal cycle
to an absorbing symbol and then prove that global realizability is equivalent
to reachability of that symbol. This would be a reachability encoding, not a
claim about the existing 2-adic digit class or about the known global 2-adic
extensions of Collatz-type maps.

## 9. Endogenous Stokes-escape target

The current coordinate exhaustion is fixed in advance. It therefore proves an
innovation calculus, not question genesis. The next construction should use
finite cellular or finitely presented chain complexes `C_n` and canonical
attachments

\[
  C_{n+1}=C_n\sqcup_{\partial e_n}K(e_n)
\]

generated by current obstruction certificates.

### Endogenous Stokes-Escape Realization Theorem: target statement

Construct a computable finite-alphabet certificate compiler such that:

1. every new question and cell is forced, up to declared semantic gauge, by a
   current obstruction rather than a future tape;
2. the attachment is characterized by a universal property;
3. every finite datum has an exact computable minimum primitive;
4. every attachment satisfies an exact discrete Stokes identity;
5. the completed differential has dense nonclosed range;
6. the generated datum defines a nonzero unreduced class;
7. the accumulated Stokes innovation energy diverges;
8. the energy is invariant under the declared unitary chain gauges and
   additive under cost-controlled cofinal grouping; and
9. no preallocated global query language is smuggled into the compiler.

Only after this theorem should a non-sofic action be coupled to the system and
tested for preservation after the full observational quotient.

## 10. Claim ledger

### Proved generally

- The costed realization compactness lemma under compact-sublevel and closed
  nested-feasibility hypotheses.
- The rank-one innovation correction, redundancy, and inconsistency branches.
- Pairwise innovation orthogonality and exact Pythagoras.
- Bounded primitive cost iff a global Hilbert primitive exists.
- Exact unitary gauge invariance.
- Exact cofinal block additivity.
- The finite-rank Moore-Penrose/Gram extension.

### Proved for the current completed complex

- `D(H_gen)` is dense and nonclosed in `Y`.
- Every finite coordinate problem is exact.
- The full datum is globally exact iff the innovation energy is summable.
- Binary zero classes have bounded cost and binary nonzero classes escape.
- A sofic period-two datum already escapes.

### Executably tested

- The exact identities and controls listed in Section 6 through depth 64.
- Only the global sign unitary, not arbitrary gauges.

### Suggested but not established

- A natural endogenous attachment compiler satisfying the target theorem.
- A presentation-independent spectrum of escape rates.
- A Navier-Stokes realization using genuine PDE energies.
- A Hodge-Conjecture realization using algebraic-cycle complexity.
- A termination or arithmetic realization whose escape is equivalent to a
  substantive open property.
- Any novelty claim for the exact packaging.

## 11. Run

From `outputs/oasis-nonsofic-engine`:

```text
node research/stokes-hodge-innovation.mjs
```

The process exits nonzero on the first failed exact identity.
