# Endogenous Stokes-Escape Generator

## Status: exact causal unit-innovation theorem in a fixed Stokes grammar

The preceding Stokes-Hodge calculation started with a completed datum and
measured how its finite constraints accumulate. This note closes one part of
the feedback loop: the datum is no longer supplied as an infinite tape.
Instead, a finite-stage state compiler reads the current minimum primitive,
opens the next frontier coordinate, computes what the current primitive would
predict there, and generates a new target at exact unit residual from that
prediction.

Every finite stage is rational and exactly solvable, and every frontier
innovation has uniformly controlled capacity. Nevertheless, the generated
targets converge as a genuine
element of a weighted Hilbert completion while their compatible minimum
primitives acquire a fresh orthogonal innovation forever. The total innovation
energy diverges linearly, so no global finite-energy primitive realizes the
completed datum.

The central result is therefore:

\[
\boxed{
\begin{gathered}
\text{present-state generation, no future datum input,}\\
\text{exact finite Stokes realization, uniformly controlled capacity,}\\
\text{a genuine completed datum, but no global admissible primitive.}
\end{gathered}}
\]

This is the first theorem here in which the current exact realization
participates in producing the next target. More precisely, it is a
**state/frontier-indexed, transcript-certified causal diagonal construction**.
It is not yet full
algebraogenesis. The derivative grammar, frontier order, and unit-residual
policy are fixed in advance; only the target value is endogenous. It is also
not a novelty or priority claim.
The companion executable is
[`endogenous-stokes-escape.mjs`](endogenous-stokes-escape.mjs).

## 1. The finite frontier tower

Let

\[
H_{-1}=\mathbb R\mathbf c\oplus\mathbb R e_0,
\]

and, for `n>=0`, let

\[
H_n=
\mathbb R\mathbf c\oplus
\operatorname{span}\{e_0,\ldots,e_{n+1}\}
\cong\mathbb R\oplus\mathbb R^{n+2}
\]

with the standard Hilbert norm. The inclusion from `H_(n-1)` to `H_n`
adjoins a zero coefficient in the new direction `e_(n+1)`. Let

\[
Y_n=\mathbb R^{n+1}
\]

be the first `n+1` coordinate observations, with the inner product inherited
from the completed data space

\[
Y=\ell^2(2^{-(n+1)})
=\left\{y:\sum_{n\geq0}2^{-(n+1)}|y_n|^2<\infty\right\}.
\]

This is a smaller, hence stronger, target space than the earlier
`ell^2(4^(-n))` completion. The same argument works for every fixed
exponential weight `rho^n`, `0<rho<1`.

For `x=(c,z_0,...,z_(n+1)) in H_n`, define

\[
(D_nx)_i=-c+z_i-2z_{i+1},
\qquad 0\leq i\leq n.
\]

The new raw frontier functional and its Riesz row are

\[
\ell_n(x)=-c+z_n-2z_{n+1},
\qquad
a_n=-\mathbf c+e_n-2e_{n+1},
\]

so that `ell_n(x)=<x,a_n>` and `||a_n||^2=6`.

### The endogenous residual rule

Fix one orientation seed `omega in {+1,-1}`. Define the equivariant unit
residual controller

\[
\sigma_\omega(t)=
\begin{cases}
-1,&t>0,\\
+1,&t<0,\\
\omega,&t=0.
\end{cases}
\]

Begin with `p_(-1)=0`. Once the exact minimum primitive `p_(n-1)` has been
constructed, embed it in `H_n` and compute

\[
\widehat y_n=\ell_n(p_{n-1}),
\qquad
s_n=\sigma_\omega(\widehat y_n),
\qquad
y_n=\widehat y_n+s_n.
\]

Thus the current primitive predicts `hat(y)_n`, and the compiler chooses the
oppositely oriented unit innovation, using `omega` only to resolve an exact
zero. Now set

\[
F_n=\{x\in H_n:D_nx=(y_0,\ldots,y_n)\},
\qquad
p_n=P_{F_n}0,
\qquad
K_n=\|p_n\|.
\]

The choice of the anti-prediction sign is not needed for escape; any causal
residual of absolute value one gives the same energy theorem. It is used here
because it makes the target genuinely state-dependent and gives an exact
global sign-gauge law.

The quantifiers are load-bearing. Fix the Moore-Penrose minimum-primitive
predictor `P_MP` defined above. The recursion constructs its datum `y^(P_MP)`.
A different predictor or realization geometry may generate a different datum;
no predictor-independent adversarial object is claimed. The result below is
stronger than bare diagonalization only because it separately proves that this
specific `y^(P_MP)` lies in the completed data space and that its primitive
energy must escape. Extending the theorem to a predictor class would require a
declared uniform energy-growth hypothesis and is not done here.

## 2. Causal unit-innovation escape theorem

### Theorem

The recursion above is well-founded and has all of the following properties.

1. **No future datum input.** Stage `n` uses only the fixed finite rule, the
   orientation seed, the current rational state, and one finite rational
   minimum-norm solve. It never reads `y_m` for `m>n`.
2. **Exact finite realizability.** Every `D_n` is surjective, every `F_n` is
   nonempty, and its unique minimum primitive `p_n` is rational and exactly
   computable.
3. **Exact Stokes pairing.** With `eta_n=2^(n+1) f_n`, where `f_n` is the raw
   coordinate vector in `Y`,
   \[
   \langle D_nx,\eta_n\rangle_{Y_n}
   =\langle x,a_n\rangle_{H_n}.
   \]
4. **Uniform nondegenerate capacity.** If
   \[
   L_{n-1}^{(n)}=\bigcap_{i<n}\ker\ell_i\subset H_n,
   \quad
   w_n=P_{L_{n-1}^{(n)}}a_n,
   \quad
   C_n=\|w_n\|^2,
   \]
   then
   \[
   4\leq C_n\leq6.
   \]
5. **Exact innovation decomposition.** Writing `g_n=p_n-p_(n-1)` after the
   zero-coordinate embedding,
   \[
   g_n=\frac{s_n}{C_n}w_n,
   \qquad
   \|g_n\|^2=\frac1{C_n},
   \qquad
   K_n^2=\sum_{i=0}^n\frac1{C_i}.
   \]
   The corrections `g_i` are pairwise orthogonal.
6. **Forced escape at a controlled rate.** For every `n`,
   \[
   \frac{n+1}{6}\leq K_n^2\leq\frac{n+1}{4}.
   \]
7. **Completed existence without a global primitive.** The recursively
   generated sequence is an element `y in Y`, but
   \[
   y\notin D(H_{\rm gen}),
   \qquad
   H_{\rm gen}=\mathbb R\mathbf c\oplus\ell^2(\mathbb N).
   \]

All finite-stage identities hold pathwise for either orientation seed. The
no-global-primitive conclusion is the deterministic infinite consequence of
their uniform energy lower bound; no probabilistic or almost-sure qualifier is
involved.

## 3. Proof

### 3.1 Well-foundedness and finite exactness

Assume the certificate through stage `n-1` has been constructed. Its last
primitive has finitely many rational coordinates. Evaluating `ell_n`, comparing
its exact rational value with zero, and forming `y_n` therefore use only finite
exact operations.

For arbitrary targets `v_0,...,v_n`, surjectivity of `D_n` is constructive.
Set `c=0` and `z_(n+1)=0`, then solve backward:

\[
z_i=v_i+2z_{i+1}.
\]

Thus `D_nx=v`. The feasible set is a nonempty closed affine subspace of the
finite-dimensional Hilbert space `H_n`, so it has a unique closest point to
zero. Its defining matrix and right-hand side are rational; Gaussian
elimination or the rational Gram inverse computes `p_n` exactly. This completes
the induction and proves the operational no-future-tape statement.

The recursion is deterministic, so an external observer can of course run it
and write the resulting infinite sequence onto a tape. “No future tape” means
that no such tape is an input or oracle of the stage transition. It is a causal
provenance claim, not a claim that the resulting computable orbit lacks an
extensional infinite description.

### 3.2 Exact Stokes identity

The weighted coordinate dual of `f_n` is `eta_n=2^(n+1) f_n`. Therefore

\[
\langle D_nx,\eta_n\rangle_{Y_n}
=2^{-(n+1)}(D_nx)_n2^{n+1}
=(D_nx)_n
=\langle x,a_n\rangle_{H_n}.
\]

This is an exact two-term adjoint identity. Calling it geometrically Stokes
would require a separately constructed cellular, de Rham, or other geometric
realization of the rows. Here “Stokes grammar” names the declared two-term
differential presentation.

### 3.3 Capacity cannot collapse

The fresh unit vector `e_(n+1)` lies in `L_(n-1)^(n)` because every older row
ignores that coordinate. Since

\[
|\langle a_n,e_{n+1}\rangle|^2=4,
\]

the projection of `a_n` onto that kernel has squared norm at least four:

\[
C_n\geq4.
\]

Orthogonal projection cannot increase norm, so

\[
C_n\leq\|a_n\|^2=6.
\]

The escape mechanism is consequently not a small-denominator artifact and
does not depend on frontier directions becoming nearly redundant.

There is an independent Gram check. The row Gram matrix satisfies

\[
\langle a_i,a_j\rangle=
\begin{cases}
6,&i=j,\\
-1,&|i-j|=1,\\
1,&|i-j|>1.
\end{cases}
\]

At each stage, `C_n` is its exact Schur complement against the preceding row
block. This gives a second rational computation of the same capacity.

### 3.4 Orthogonal innovation energy

After adjoining the fresh zero coordinate, `p_(n-1)` remains the old
minimum-norm solution: the old constraints ignore the fresh coordinate and a
nonzero value there would only increase the norm. The new residual is

\[
y_n-\ell_n(p_{n-1})=s_n,
\qquad |s_n|=1.
\]

The minimum correction inside the old homogeneous kernel is therefore

\[
g_n=\frac{s_n}{\|w_n\|^2}w_n.
\]

It is orthogonal to `p_(n-1)`, and later corrections lie in the kernels of all
earlier observations. More precisely,

\[
g_i\in L_{i-1}^{(i)}\cap(L_i^{(i)})^\perp,
\qquad
g_j\in L_{j-1}^{(j)}\subseteq L_i
\quad(j>i),
\]

after the canonical zero-coordinate embeddings. Hence the corrections are
pairwise orthogonal and

\[
K_n^2-K_{n-1}^2
=\|g_n\|^2
=\frac1{C_n}.
\]

Summing and using `4<=C_n<=6` proves

\[
\frac{n+1}{6}\leq K_n^2\leq\frac{n+1}{4}.
\]

The norm grows as `Theta(sqrt(n))`, while the innovation energy `K_n^2` grows
as `Theta(n)`.

### 3.5 The target exists in the completion

The capacity lower bound gives `K_(n-1)^2<=n/4`. Thus

\[
|\widehat y_n|
=|\langle p_{n-1},a_n\rangle|
\leq\sqrt6 K_{n-1}
\leq\sqrt{\frac{3n}{2}}.
\]

Since `|s_n|=1`,

\[
|y_n|^2\leq2|\widehat y_n|^2+2\leq3n+2.
\]

Consequently,

\[
\|y\|_Y^2
\leq\sum_{n\geq0}2^{-(n+1)}(3n+2)
=5.
\]

So the generator produces a genuine completed datum, not a divergent formal
symbol.

### 3.6 Dense range, but no global primitive

The formula

\[
(Dx)_n=-c+z_n-2z_{n+1}
\]

defines a bounded map from `H_gen` to `Y`. Every finite-support target has a
finite-support primitive by the same backward recursion with `c=0`; hence
`D(H_gen)` contains `c_00` and is dense in `Y`.

For completeness, `(u+v+w)^2<=3(u^2+v^2+w^2)` and the chosen weights give

\[
\|Dx\|_Y^2
\leq 3|c|^2+\frac{15}{2}\|z\|_2^2
\leq\frac{15}{2}\|x\|_{H_{\rm gen}}^2.
\]

Suppose a global `x in H_gen` satisfied `Dx=y`. Truncating it after
`z_(n+1)` would satisfy every equation through stage `n`, so minimum norm would
give

\[
K_n\leq\|x\|_{H_{\rm gen}}
\]

for all `n`. This contradicts `K_n` tending to infinity. Therefore

\[
y\in Y\setminus D(H_{\rm gen}).
\]

The generated target is a nonzero class in the unreduced cokernel
`Y/D(H_gen)`, even though the reduced cokernel and degree-one harmonic sector
vanish because the range is dense. The obstruction is not failure of the datum
to exist in the Hilbert completion. The datum is a limit point of
`D(H_gen)`, but no finite-energy primitive attains it.

## 4. What the certificate actually certifies

A stage first commits the row derived from its declared frontier index. Only
then may it evaluate the previous primitive and generate the target; a mismatch
created by the target is not used circularly to justify the same row. A stage
record serializes:

- the stage, prior-state digest, and parent-record digest;
- the declared frontier row and its commitment;
- the current prediction and oriented residual;
- the generated target;
- the frontier capacity and innovation energy;
- the next-state digest, which commits to the reconstructed target prefix,
  minimum primitive, and cumulative energy; and
- the record digest.

Replay derives the frontier row from the stage number, recomputes every
minimum innovation and primitive, checks all old constraints, and only then
accepts the child digest. The full primitive is reconstructed rather than
duplicated in every record. The digest is an integrity link, not a substitute
for the mathematical checks or a claim of cryptographic security.

The transition uses a fixed finite opcode grammar. Exact rationals and stage
indices require unbounded encodings, as any unbounded exact computation does;
“finite alphabet” does not mean bounded record length or a finite-state
controller.

### Limited universal properties

Two categorical properties and one Hilbert-variational characterization are
present:

1. `H_n=H_(n-1) direct-sum R e_(n+1)` is the Hilbert biproduct extension.
2. `D_n=(D_(n-1) after drop, ell_n)` is the unique product pairing of the old
   observation map and the new frontier functional.
3. Let
   \[
   \widetilde F_{n-1}
   =\operatorname{drop}^{-1}(F_{n-1})
   =F_{n-1}\oplus\mathbb R e_{n+1}.
   \]
   Then `F_n` is the pullback imposing `y_n` on
   `tilde(F)_(n-1)` along `ell_n`, and `p_n` is its unique
   Hilbert-minimum point.

The data spaces form a projective system under coordinate restriction. The
honest completed compatibility is

\[
Q_nD=D_nP_n,
\]

where `P_n` truncates primitive coordinates and `Q_n` retains data coordinates.
The `D_n` do not form a naive direct system under zero-extension of their
outputs, because extending a primitive can create a new nonzero derivative
coordinate.

On the primitive side,

\[
\overline{\bigcup_nH_n}=H_{\rm gen}.
\]

On the data side, the `Y_n` form the finite-coordinate projective observation
system whose weighted completion is `Y`.

No canonical cellular pushout has been proved. The compiler does not yet
derive the frontier type, the coefficients `(-1,1,-2)`, or the linear order of
attachments from the obstruction. Calling that full question genesis would
hide the largest remaining gap.

## 5. Controls and falsifiers

The executable checks the main path and the following controls with exact
rational arithmetic.

### Zero-residual control

Set every new target equal to the current prediction. Starting at zero, every
minimum primitive remains zero, every innovation energy vanishes, and the
completed datum has a global zero primitive. Infinite continuation alone does
not cause escape.

### Summable-residual control

Replace the unit residual by `2^(-n)`. Then

\[
\sum_n\|g_n\|^2
=\sum_n\frac{4^{-n}}{C_n}
\leq\frac14\sum_n4^{-n}<\infty.
\]

The minimum primitives converge in `H_gen`; boundedness and finite-coordinate
compatibility give a global primitive for the generated target. Escape is
exactly tied to nonsummable innovation energy in this Hilbert model.

### Matched external-tape control

A tape prefilled with the outputs of a prior run reproduces the same numerical
targets and primitives. This correctly defeats any claim that the endogenous
and taped paths are extensionally different. What differs is causal
provenance: the real compiler has no target-tape argument and replay derives
each target from its parent state.

### Horizon, fork, and batch controls

Running to horizon `N` and running to a larger horizon `M>N` produces
byte-identical records through `N`; later execution may not revise its causal
past. This horizon control checks the committed transcript prefix. A separate
fork control starts from one common state, applies different next residuals,
and checks that both children preserve its target prefix. Every online minimum
primitive is also reproduced by an independent batch rational solve of the
complete prefix constraints.

### Sign-gauge control

The controller obeys

\[
\sigma_{-\omega}(-t)=-\sigma_\omega(t).
\]

Changing `omega` to `-omega` therefore negates every target, primitive, and
innovation while leaving all capacities and energies fixed. This is a genuine
`U=-I` covariance check, not evidence of quantum mechanics.

### Reindexing, grouping, and tamper controls

Swapping two stage records violates the derived frontier row or its parent
digest. Grouping any finite consecutive set of stages preserves the sum of
their orthogonal innovation energies. Altering a row, prediction, residual,
target, capacity, innovation energy, state commitment, or parent link is
rejected by exact replay.

Arbitrary query rescaling is deliberately not a gauge of this version. If a
row and its old target are multiplied by two, semantic transport multiplies
the residual by two, whereas rerunning a raw “unit residual” rule adds only
one. The normalized row and scalar unit are part of the declared presentation.
Only the simultaneous global sign transformation has been proved covariant.

### Geometry and non-sofic controls

Capacity is checked both by direct nullspace projection and by the independent
Gram Schur complement. The entire construction works without a group action;
non-soficity is neither used nor implied. Coupling a non-sofic action to this
generator is meaningful only after proving that it preserves a natural
semantic attachment rule under the relevant observational quotient.

A freely appended orthogonal coordinate with a unit contradictory target also
escapes. That baseline is intentionally admitted: the present theorem's new
content is not that diagonal orthogonal escape can occur, but that the fixed
dyadic derivative grammar realizes it with exact finite Stokes constraints, a
uniform native capacity bound, a completed target, and replayable causal
certificates. A future semantic-genesis theorem must prove something the free
append baseline cannot.

## 6. What changed conceptually

The static version asked whether an externally supplied completed datum had a
bounded primitive. This version constructs a process that repeatedly uses its
current best primitive to decide the next exact demand. The learner is not
merely estimating a hidden state. It is extending the finite diagram in which
the next distinction exists, and its own minimum realization becomes the
reference against which that distinction is generated.

That gives a precise first model for the earlier intuition:

> The completed datum is a fossil of the process. Every local continuation
> is exact and rational, but the path as a whole has no finite-energy symbolic
> primitive in the declared realization class.

The “irrationality” here is structural, not numerical. No irrational or
transcendental coefficient is required. What fails is bounded global assembly
of an indefinitely produced sequence of exact local corrections. The process
is computable; the completed target is real; and yet the target is not realized
by any finite-energy primitive in this declared Hilbert geometry.

This is still an engineered adversary. The unit residual policy guarantees a
fresh demand, and the frontier grammar guarantees a fresh direction of
capacity at least four. We have proved a clean existence mechanism, not that a
natural scientific semantics must generate this policy.

Freezing the completed transcript and training a fresh solver on its finite
prefixes does not make the target intrinsically unknowable; it simply recovers
the same minimum primitives. The obstruction is global finite-energy
realizability, not ordinary predictive hardness. Likewise, because the row
language is already available at every stage, this is query activation rather
than the creation of a previously ill-typed semantic question.

## 7. The next foundational gap

The next object should remove the fixed-grammar qualification. A serious
**attachment-genesis theorem** would need:

1. a category of current semantic diagrams and admissible repairs;
2. an obstruction certificate defined invariantly on the current diagram;
3. a universal property selecting a new question type or cell, not merely its
   target value;
4. invariance under semantic equivalence, gauge, and re-presentation;
5. a proof that the selector does not hide an infinite query catalogue;
6. exact finite realizability and a completed-path theorem after those
   endogenous attachments; and
7. a natural example in which persistent escape is forced by semantics rather
   than by an explicitly adversarial residual rule.

That is where algebraogenesis would become a genuinely new foundational
object: not a state moving through a pre-existing space, but a computable rule
that grows the space of meaningful distinctions while preserving exact local
continuation.

A separate later branch can tensor two realization systems and ask whether
there is a nonseparable frontier-capacity term, monotone under completely
positive maps. That is the mathematically honest quantum-information question
suggested by the current geometry; sign gauge alone says nothing quantum.

## 8. Claim ledger

| Claim | Status |
|---|---|
| stage `n` uses no future target input | exact theorem and API audit |
| every finite stage is rational and exactly realizable | exact theorem |
| every new frontier capacity lies in `[4,6]` | exact theorem |
| innovation energy is exactly additive and grows linearly | exact theorem |
| the generated sequence belongs to weighted `Y` | exact theorem |
| the completed sequence has no global `H_gen` primitive | exact theorem |
| global sign covariance | exact theorem and executable control |
| the target values are endogenous | exact within the declared compiler |
| one learner-independent semantic target is constructed | false; the datum is predictor-relative |
| the query type and attachment grammar are endogenous | false in this version |
| the construction is non-sofic | neither used nor established |
| the construction is geometric Hodge theory | not established |
| the construction bears on Navier-Stokes regularity | only a structural clue |
| the construction establishes a quantum mechanism | false |
| full algebraogenesis has been constructed | not yet |

## 9. Executable evidence

The companion program uses exact reduced `BigInt` fractions throughout. It
generates and replays a chained certificate, verifies every old and new
constraint, checks the Stokes pairing, derives capacity by two independent
routes, verifies the Pythagorean and orthogonality identities, and exercises
the zero, summable, taped, sign, grouping, reindexing, and tamper controls.

The default command runs the exact audit through depth 32 and prints a chain
summary. `--full` raises the stress horizon to 64, `--chain` emits the complete
serialized transcript, and `--depth=N` selects any audit horizon `N>=16`.

Passing finite tests do not prove the infinite theorem; Sections 2 and 3 do.
The program instead audits the derivation, its implementation, and the places
where a hidden tape or a numerical approximation could otherwise enter.
