# Foundations before optimization: observable completion, harmonic obstruction, and algebrization

## Status and research decision

This note freezes optimizer-level claims and formalizes the mathematical object
that the experiments have exposed. The working program is still called
**algebraogenesis**, but that is project terminology rather than a claim that a
new field has already been established.

The central correction is:

> Probability is not the carrier. A probability distribution is a state on the
> observables that currently exist. The mathematical carrier must first say
> which observable contexts exist and how new questions become available.

The later
[genesis fossil study](genesis-fossil-nonidentifiability.md) sharpens the scope
of this sentence. The completion is the **terminal pointwise task carrier**, but
a static endpoint algebra with its transport presentation omitted does not
determine repair kinetics: two exact finite systems can have the same initial
and completed algebras while differing in causal task availability, reachable-
repair topology, and repair-order discrepancy. This does not show that the
algebra together with its endomorphisms and compiler state is insufficient; it
shows that the bare completion is a lossy projection whenever genesis itself is
in scope.

The subsequent [`Genesis v0` foundation](genesis-v0-foundations.md) sharpens
this again. Its finite core is a biordered context atlas: informational
refinement supports continuous completion, while causal reachability supports
cost and the Heyting algebra of persistent availability propositions. The
observable completion is the causal diagram's colimit—a fossil of genesis, not
genesis itself. Circuit cost and nontrivial connection data remain explicit
enrichments rather than hidden assumptions.

The strongest current object is not “a nonsofic neural network.” It is an
externally complete but internally nonstabilizing observable system. Its finite
coordinate-generated views are executable and task-usable; their transport
closure need not terminate. A finite list of real coordinates can still
generate an infinite-dimensional function algebra, so “finite stage” is not a
resource bound until coordinate cost, precision, and decoder cost are declared.

Three ideas must remain distinct:

1. **Observable completion** is the base mathematics.
2. **Hodge/cohomological obstruction** may organize finite path defects.
3. **Aaronson-Wigderson algebrization** is a specific complexity-theoretic
   proof barrier. We have not crossed it.

## 1. The base object

### Definition 1: forward residual carrier

Let `Sigma` be a finite alphabet, let `S` be a compact Hausdorff space, and let

\[
D_a:S\to S,\qquad a\in\Sigma,
\]

be continuous forward maps. For a residual process, `S` is the closure of the
reachable continuation functions and `D_a r(v)=r(av)`.

Every `D_a` induces a Koopman pullback

\[
U_a:C(S)\to C(S),\qquad U_a h=h\circ D_a.
\]

The maps `D_a` need not be invertible. The `U_a` are unital algebra
endomorphisms, not generally automorphisms.

### Definition 2: observable filtration

An observable filtration is a nested sequence of unital C-star subalgebras

\[
\mathcal B_0\subseteq\mathcal B_1\subseteq\cdots\subseteq C(S).
\]

Equivalently, each `B_n` defines a compact quotient chart

\[
\pi_n:S\twoheadrightarrow X_n=\operatorname{Spec}(\mathcal B_n),
\]

and the inclusions give bonding maps `X_(n+1) -> X_n`. A new observable splits
some fibers of the current chart.

The filtration is:

- **externally complete** when
  \[
  \overline{\bigcup_n\mathcal B_n}=C(S);
  \]
- **transport-stable at stage n** when
  \[
  U_a\mathcal B_n\subseteq\mathcal B_n
  \quad\text{for every }a\in\Sigma;
  \]
- **internally nonstabilizing** when no finite stage is both separating and
  transport-stable.

Transport stability is exactly the condition that every `D_a` descends to a
well-defined map on the finite chart `X_n`.

### Definition 3: transport saturation

For an initial algebra `B_0`, define

\[
\mathcal B^{(m)}=
C^*\!\left(\bigcup_{|w|\le m}U_w\mathcal B_0\right),
\qquad
U_w=U_{a_1}\cdots U_{a_k}.
\]

The transport saturation is

\[
\operatorname{Sat}_U(\mathcal B_0)
=\overline{\bigcup_m\mathcal B^{(m)}}.
\]

Call `(S,D,B_0)` **transport-Noetherian** when this chain stabilizes after a
finite stage, and **transport-non-Noetherian** otherwise. This terminology is
an analogy with ascending-chain conditions; it does not assert that `C(S)` is a
Noetherian ring.

### Definition 4: obstruction-guided algebraogenesis

At stage `n`, two states are observationally equivalent when

\[
s\sim_n t
\quad\Longleftrightarrow\quad
h(s)=h(t)\text{ for every }h\in\mathcal B_n.
\]

A transport defect is a tuple `(s,t,a,h)` with `h in B_n` such that

\[
s\sim_n t,
\qquad
(U_a h)(s)\ne(U_a h)(t).
\]

The canonical repair of that witnessed defect is

\[
\mathcal B_{n+1}=C^*(\mathcal B_n\cup\{U_a h\}).
\]

This is mathematically close to complete-shell refinement in abstract
interpretation, CEGAR, active automata learning, and predictive-state core-test
discovery. The proposed research contribution cannot be the split rule alone.
It must come from the nonstabilizing completion, its invariants, and a theorem
about task reuse or resource cost.

## 2. Three exact baseline theorems

### Theorem A: regularity is finite transport stability

For a language `L subseteq Sigma*`, let `S_L` be its Boolean residual space and
let `B_0` contain the acceptance coordinate `e_epsilon`. Then the following are
equivalent:

1. `L` is regular.
2. For some finite `P subseteq Sigma*`, the Boolean continuation-coordinate
   algebra
   \[
   C^*(e_v:v\in P),\qquad e_\epsilon\in C^*(e_v:v\in P),
   \]
   is transport-stable on all reachable residuals.
3. The transport saturation of the acceptance observable is finite-dimensional.

The proof is Myhill-Nerode in observable form. A finite stable signature is a
finite automaton; conversely, finitely many residuals can be separated by
finitely many continuation probes.

Therefore every view generated by finitely many Boolean continuation
coordinates **and containing the acceptance coordinate** for a nonregular
language has a finite transport-defect witness. If language membership is
decidable, exhaustive search makes that witness executable. The repair process
may still run forever.

### Theorem B: external completeness with strict internal growth

Let

\[
H=[0,1]^{\mathbb N},
\qquad
S(x_0,x_1,\ldots)=(x_1,x_2,\ldots),
\]

and let `e_j(x)=x_j`. Starting from `B_0=C^*(e_0)`, transport saturation gives

\[
\mathcal B^{(m)}=C^*(e_0,e_1,\ldots,e_m).
\]

The inclusions are strict. Indeed, two points can agree on coordinates `0`
through `m` and differ at `m+1`, so `e_(m+1)` cannot factor through the earlier
chart. Yet the union of these cylinder algebras is dense in `C(H)` by
Stone-Weierstrass.

A separate dimension argument excludes arbitrary shared finite-dimensional
continuous encoders, not only this coordinate-prefix chain. If a continuous
`E:H -> R^d` admits continuous decoders for every `e_j`, then `E` is injective.
Compact-to-Hausdorff injectivity makes it a topological embedding, contradicting
the fact that the Hilbert cube contains `[0,1]^(d+1)` and cannot embed in
`R^d`.

Thus this carrier is simultaneously:

- externally universal for continuous task readouts;
- instantiated by the explicit computable dyadic dense-orbit sequence in the
  [forward residual study](forward-residual-algebraogenesis.md), which gives
  exact access to every requested finite orbit cylinder; and
- internally transport-non-Noetherian.

This is the cleanest current mathematical meaning of “do not approximate the
approximator; approximate tasks through it.” It is a representation theorem,
not yet an efficiency theorem.

### Theorem C: cycle periods are finite obstruction certificates

Let `G` be a finite connected graph and let `alpha` be a real-valued oriented
edge cochain. Identify edge chains and cochains using the standard Euclidean
edge inner product; with other weights, use the corresponding weighted
identification and orthogonal projection. The following are equivalent:

1. There is a vertex potential `phi` with `alpha=d phi`.
2. The signed integral of `alpha` around every cycle is zero.
3. The projection of `alpha` onto the graph cycle space is zero.

Therefore one nonzero cycle integral is a finite certificate that the proposed
edge increments cannot arise from a single-valued global chart coordinate.
This is the graph-level form of path-dependent holonomy. It proves only
non-exactness of that chosen cochain on that chosen graph—not nonsoficity,
incompleteness of the semantic chart, or existence of a missing observable.

## 3. Where Hodge theory really enters

Hodge theory does not attach directly to the word “nonsofic.” It requires a
chain complex and, for a harmonic representative, an inner product.

At a finite experiment stage, build a finite transition-relation complex `K_n`
from a sampled or cellularized portion of the current chart. A chart generated
by finitely many real observables can still contain a continuum, so `K_n` is an
explicit finite model of the tested portion, not automatically the whole
Gelfand spectrum.

- vertices are sampled chart states or chart cells;
- labeled edges are observed forward transitions;
- two-cells encode declared local relations, commuting squares, or verified
  rewrite identities.

With weighted cochain spaces

\[
C^0(K_n)\xrightarrow{d_0}C^1(K_n)\xrightarrow{d_1}C^2(K_n),
\qquad d_1d_0=0,
\]

the first Hodge Laplacian is

\[
\Delta_1=d_0d_0^*+d_1^*d_1.
\]

Finite-dimensional Hodge decomposition gives

\[
C^1(K_n)
=\operatorname{im}d_0
\oplus\ker\Delta_1
\oplus\operatorname{im}d_1^*.
\]

The canonical transport defect presently available is simpler. Let

\[
R_n=S\times_{X_n}S
=\{(s,t):\pi_n(s)=\pi_n(t)\}
\]

be the kernel-pair relation of the chart and define, for `h in B_n`,

\[
\delta_{a,n}h(s,t)=h(D_as)-h(D_at).
\]

Transport descends to `X_n` exactly when every such `delta_(a,n)h` vanishes.
Its support or supremum norm is therefore a genuine chart obstruction. A
positive conditional-variance energy also certifies failure, but that energy is
measure-relative: its vanishing is equivalent to descent only after choosing an
explicitly faithful, full-support measure on the relevant kernel-pair fibers.
Moreover, `delta_(a,n)h` is an exact coboundary on the equivalence-relation
groupoid, so its ordinary first cohomology class is always zero. Raw transport
failure is not automatically a harmonic class.

Hodge theory becomes a possible secondary organizer only after a separate,
canonical compiler assembles transport/path data into a cochain `alpha_n` on
`K_n`. Conditional on that construction:

- the **gradient** part is removable by changing a chart potential or gauge;
- the **coexact/curl** part detects inconsistency around declared local
  relation faces;
- the **harmonic** part represents locally closed but globally cyclic
  inconsistency.

This interpretation closely follows combinatorial Hodge decompositions of edge
flows, where harmonic flow is locally acyclic but globally cyclic; see
[Jiang, Lim, Yao, and Ye](https://arxiv.org/abs/0811.1067) and
[Lim's graph-Hodge survey](https://doi.org/10.1137/18M1223101).

The basic transport defect and the Hodge defect are therefore not identical. A
single aliased successor pair already proves that a quotient transition is
ill-defined. A Hodge decomposition can distinguish calibration, local relation
failure, and global holonomy only after the complex, coefficient system, and
cochain compiler have been justified.

### Harmonic integrals

For a harmonic representative `h in ker Delta_1` and a cycle `gamma`, the
period

\[
\oint_\gamma h
=\sum_{e\in\gamma}\operatorname{sign}_\gamma(e)h(e)
\]

is the period pairing between cohomology and homology. The value may be
irrational, but irrationality is not the essential fact. The essential fact is
that the period is nonzero and therefore that this chosen cochain cannot be a
globally single-valued potential on `K_n`.

This gives a conditional version of the “irrational path” intuition:
continuous intermediate states can live in chart fibers, while period data can
record path dependence invisible to endpoint potentials. To turn that into an
observable obstruction, one must additionally prove that validity of the chart
would force the compiled cochain to be exact.

### Mellin, Hilbert, and Hodge are different layers

Several nearby harmonic ideas should not be conflated.

- The **Hilbert cube** in the benchmark is a topological state space.
- A **Hilbert space** appears after choosing an inner product, for example from
  a probability state via GNS.
- The **Hilbert transform** is a boundary/singular-integral operator and needs
  additional analytic and measure structure; it is not supplied merely by a
  residual topology.
- The **Mellin transform** diagonalizes dilation after passing to logarithmic
  scale. It becomes relevant if the carrier has a genuine scaling or
  renormalization semigroup, where Mellin spectra may expose self-similar or
  fractal transport rates.
- **Hodge theory** organizes path cochains and their local versus global cycle
  obstructions once a chain complex and metric are chosen.

The plausible synthesis is therefore conditional: Hodge periods can measure a
defined path-complex obstruction, while Mellin/Fourier spectra measure
transport under scale or translation. A future carrier with both a functorial
relation complex and a renormalization action could support both analyses. The
present FARS definition guarantees neither a nontrivial period class nor a
scaling action; it guarantees only the raw descent defects above.

### Refinement and persistence

If `S` is an inverse limit of compact charts, Čech continuity relates its chart
cohomology to the direct system of chart cohomologies under standard
hypotheses; see [Spanier](https://doi.org/10.1007/978-1-4684-9322-1). That fact
does **not** transport classes from the sampled complexes `K_n`. It would first
require explicit compatible cellular maps `K_(n+1) -> K_n` and comparison maps
to the chart spaces.

More decisively, ordinary positive-degree chart cohomology is blind on the
current baseline examples: Boolean residual spaces are zero-dimensional, while
finite cubes and the Hilbert cube are contractible. The missing topology, if it
exists, must therefore live in a transport/path object with coefficients—not
in ordinary cohomology of the state chart alone.

A promising formal target is an observable coefficient sheaf on a functorial
transition/relation complex. Local observable spaces sit on cells, transport
maps act as restrictions, global sections are compatible assignments, and
sheaf Laplacians can organize gluing defects. This has substantial prior art;
see [Hansen and Ghrist](https://arxiv.org/abs/1808.01513). Endomorphism
groupoids and transfer operators are also established frameworks for
irreversible dynamics; see [Deaconu](https://doi.org/10.1090/S0002-9947-1995-1233967-5),
[Exel](https://arxiv.org/abs/math/0012084), and
[Starling](https://arxiv.org/abs/1505.01766). The open work is to derive such a
sheaf or path complex canonically from residual transport defects.

Bratteli and lambda-graph systems are especially relevant finite-level models,
but they also constitute substantial prior art. Harmonic analysis, path-space
measures, and level operators on Bratteli diagrams are already developed by
[Bezuglyi and Jorgensen](https://arxiv.org/abs/2007.15566). Our open question is
not whether these ingredients exist; it is whether obstruction-generated
observable refinements admit a new persistent invariant or resource theorem.

## 4. Probability sits over the filtration

For each commutative observable algebra `B_n`, a probabilistic state is a
positive normalized functional

\[
\omega_n:\mathcal B_n\to\mathbb C.
\]

Compatibility means

\[
\omega_{n+1}|_{\mathcal B_n}=\omega_n.
\]

Equivalently, these are compatible probability measures on the quotient charts
`X_n`. In a noncommutative extension, the same definition applies to nested
unital C-star algebras or operator systems.

### Proposition D: state spaces run backward

Let

\[
\mathcal B_0\subseteq\mathcal B_1\subseteq\cdots,
\qquad
\mathcal B=\overline{\bigcup_n\mathcal B_n}
\]

be nested unital C-star algebras with common unit. Restriction gives an affine
homeomorphism

\[
\operatorname{St}(\mathcal B)
\cong
\varprojlim_n\operatorname{St}(\mathcal B_n).
\]

Indeed, a state on `B` restricts compatibly. Conversely, a compatible family
defines a norm-one positive functional on the algebraic union; boundedness lets
it extend uniquely to the norm closure. The two constructions are inverse, and
weak-star compactness gives the stated homeomorphism.

So observable algebras grow covariantly while their state spaces project
contravariantly. In the commutative chart picture, if the bonding map
`X_(n+1) -> X_n` has two points in one fiber, their two Dirac states are distinct
at stage `n+1` but have the same restriction at stage `n`. Refinement does not
merely adjust an old distribution: it can expose previously nonexistent
directions in which probability may vary.

Probability therefore weights the distinctions expressible at a stage; it does
not define the total space of possible distinctions. Bayesian updating and
algebra refinement are different operations:

\[
\text{update weights on }\mathcal B_n
\quad\ne\quad
\text{replace }\mathcal B_n\text{ by a finer }\mathcal B_{n+1}.
\]

In the current formalization, `S` and `C(S)` remain fixed, so a compatible
family is still the family of marginals of a probability measure on one fixed
underlying state space. The construction goes beyond a fixed **finite
observable algebra**, not yet beyond a fixed Bayesian sample space. A genuinely
evolving carrier would require the stronger categorical formalism left open in
the preceding note.

### Probability as geometry rather than carrier

A faithful state can supply the inner product used by the harmonic theory. In
the commutative case, a full-support measure `mu_n` defines

\[
\langle f,g\rangle_{\mu_n}
=\int_{X_n}\overline f g\,d\mu_n.
\]

An arbitrary measure supplies only a positive semidefinite form; one must
quotient its null directions, as in GNS. Together with strictly positive cell
or edge weights, the resulting inner products define the adjoints in a finite
Hodge Laplacian and select a harmonic representative. In the noncommutative
case, a state likewise produces a GNS Hilbert-space representation only after
quotienting its null space.

This yields a useful separation of roles:

- the observable algebra determines which distinctions and, after a coefficient
  complex is defined, which discrepancy cochains can be expressed;
- the probability state determines their weights and orthogonality; a notion of
  cost requires a separately declared loss or coding functional; and
- any well-defined underlying cohomology class is topological, while its
  harmonic representative depends on the chosen state-induced metric.

A Bayesian update can therefore change the harmonic representative without
changing the observable algebra. An algebraogenetic refinement can change the
cochain complex itself. These operations interact, but they are not the same.

## 5. The algebrization barrier: real connection, strict warning

[Aaronson and Wigderson's algebrization barrier](https://www.scottaaronson.com/papers/alg.pdf)
is a technical statement about complexity-theoretic proof methods. Their
`A-tilde` is not a generic algebraic enlargement: it is an oracle family of
finite-field extensions with uniformly bounded individual degree. Definition
2.3 is asymmetric. For every admissible oracle-extension pair,

\[
\mathcal C\subseteq\mathcal D\text{ algebrizes if }
\mathcal C^A\subseteq\mathcal D^{\widetilde A},
\]

while

\[
\mathcal C\nsubseteq\mathcal D\text{ algebrizes if }
\mathcal C^{\widetilde A}\nsubseteq\mathcal D^A.
\]

They construct oracle-extension reversals showing that algebrizing techniques
cannot resolve many central questions, including the relevant containment and
separation directions around `P` versus `NP`.

Our use of “algebra” does not by itself evade this barrier. We have not:

- specified an Aaronson-Wigderson oracle pair;
- proved a complexity-class separation;
- shown that the present certificates distinguish an oracle from its
  low-degree extension; or
- proved that the reasoning fails to algebrize in their formal sense.

Adaptive probe growth is also insufficient: CEGAR, active learning, and many
oracle algorithms are adaptive and may still fall within a relativizing or
algebrizing analysis.

### What the construction actually proves

The following useful sentence is only a factorization schema, not an independent
complexity theorem:

> A method restricted to a declared class of fixed transport-invariant factors
> fails whenever the carrier has no faithful factor in that class.

Without formal definitions of representation, fidelity, approximation,
precision, and cost, that statement is tautological. The proved content is in
two separately specified instances:

1. A nonregular Boolean language has no transport-stable algebra generated by
   finitely many Boolean continuation coordinates and containing the acceptance
   coordinate.
2. The Hilbert shift has no continuous shared encoder into any fixed `R^d` that
   continuously decodes every continuation coordinate.

These restrictions must not be conflated: a zero-dimensional nonregular
residual space can sometimes be continuously encoded in one exact real, as the
beta control warns. The strict observable filtration changes the representation
algebra rather than merely calculating inside one fixed chart, but no general
resource advantage follows until a costed competitor class is defined.

That is algebrization-like in spirit, but it is not the Aaronson-Wigderson
barrier. A future bridge would require all four steps:

1. define a decision problem and a proof/learner model;
2. define the oracle `A` and its bounded-individual-degree extension
   `A-tilde`;
3. exhibit the appropriate asymmetric containment reversal; and
4. show that the decisive unrelativized lemma fails relative to that pair.

Until then, the responsible statement is:

> Algebraogenesis attacks fixed-algebra semantic factorization. It suggests,
> but does not yet supply, a non-algebrizing complexity technique.

## 6. Research targets and formal conjecture schemas

### Target I (not yet formal): coupled carrier

The structural target is a represented compact metric one-sided dynamical
system with a specified computable presentation and all of the following in one
coupled construction:

- a finite-alphabet nonsofic factor;
- positive mean dimension;
- a designated continuation-coordinate saturation that grows strictly and is
  externally complete; and
- decidable finite obstruction witnesses for every failed finite probe stage.

The construction should not be topologically conjugate to the direct
beta/Hilbert product. It must instead specify coupling maps and prove a
dependence between the symbolic obstruction and the continuous
distinguishability rate. The direct product is only a benchmark envelope, not
the target object.

### Conjecture II: costed atlas separation

Fix a represented metric carrier `(S,d_S)`, a finite action alphabet, metric
output spaces, a task family `T_N`, and admissible classes of encoders,
decoders, and transition realizers. A scale-`N` global competitor is the full
package

\[
P=\bigl(q,\{\rho_F\}_{F\in\mathcal T_N},
          \{\tau_a\}_{a\in\Sigma}\bigr),
\qquad q:S\to\mathbb R^{d(P)}.
\]

Let `G_N` be the class of global packages and `A_N` a declared class of
chart-indexed atlas packages. Define one cost ledger `c_N` on the disjoint union
`G_N disjoint-union A_N`, with the same aggregation rules for representation
dimension and precision, description length, evaluation time, moduli of
continuity, every transition realizer, every routing operation, and every task
decoder. Fix a uniform error `0 < epsilon < epsilon_0`. A global package is
`epsilon`-task adequate when, for every `F in T_N`,

\[
\sup_{s\in S} d_F\bigl(F(s),\rho_F(q(s))\bigr)\leq\epsilon.
\]

It is `epsilon`-transport stable when, for every generator `a`,

\[
\sup_{s\in S}\lVert q(D_as)-\tau_a(q(s))\rVert\leq\epsilon.
\]

Evaluate atlas packages against the same task and transport error criteria,
using their declared chart routing and chart-indexed realizers. The conjectural
separation is that a specified coupled carrier, task family, competitor classes,
and common ledger have a nonempty global feasible set containing at least one
finite-cost package and satisfy

\[
\inf\{c_N(P):P\in\mathcal G_N\text{ is both adequate and stable}\}
\geq g(N),
\]

while some adequate and stable obstruction-guided `P_A in A_N` achieves
`c_N(P_A) <= h(N)=o(g(N))`. The choices of `S`, the two admissible package
classes, `T_N`, `epsilon_0`, `g`, and the exact ledger are still open data;
until they are supplied this is a schema, not a theorem. A Hodge or sheaf
invariant may help prove such a bound, but cohomology rank alone cannot: graphs
with large first Betti number can still embed in fixed low-dimensional
Euclidean space.

### Conjecture III: harmonic certificate compiler

There is a functorial construction of finite relation complexes or observable
coefficient sheaves, compatible refinement maps, and a compiler from transport
witnesses to cochains such that chart validity would force the compiled cochain
to be exact. A nonzero period would then be a legitimate chart obstruction, and
an effective rule would compile it into a continuation observable that either
removes the obstruction or proves persistence at the next stage.

The existing rule `h -> U_a h` handles only a local descent defect. Every part
of the global cohomological compiler remains open.

### Conjecture IV: a genuine non-algebrizing bridge

There are specified classes `C,D` and an unrelativized observable-completion
argument proving `C not-subseteq D` (respectively `C subseteq D`), together with
an oracle `A` and bounded-individual-degree extension `A-tilde` for which

\[
\mathcal C^{\widetilde A}\subseteq\mathcal D^A
\quad\text{(respectively }\mathcal C^A\nsubseteq\mathcal D^{\widetilde A}\text{)},
\]

and the argument's decisive lemma provably fails relative to `(A,A-tilde)`.
Merely observing that an obstruction changes under an extension is insufficient.

This is currently speculative. It should not be advertised until an explicit
oracle construction exists.

## 7. Research gates before returning to optimizers

Optimization should wait until the following gates are met.

1. **Category gate.** Specify carriers, morphisms, endomorphisms, observable
   algebras, and state spaces without switching silently between sets,
   topological spaces, rings, and C-star algebras.
2. **Completion gate.** Prove when a chart inverse limit recovers the carrier
   and when it recovers only a quotient.
3. **Cohomology gate.** Define the transition-relation complex and show exactly
   how a transport witness becomes a cochain and a period certificate.
4. **Quantitative gate.** Choose a metric/resource model and prove a robust
   lower bound; exact nonrepresentation is not enough for numerical systems.
5. **Coupling gate.** Produce an explicitly coupled example joining symbolic
   nonsoficity to positive continuous distinguishability dimension, with a
   proved dependence not supplied by a direct product.
6. **Prior-art gate.** Compare the resulting theorem, not merely its vocabulary,
   against complete shells, CEGAR, PSRs, lambda-graphs, Koopman dictionaries,
   Bratteli harmonic analysis, and operator-algebraic dynamics.

Only after those gates should the project ask which optimizer trains the
finite-stage readouts. The optimizer is downstream of the mathematics.

## 8. The revised direction

The proved core and candidate extension are now:

> A forward dynamical carrier equipped with a nonstabilizing filtration of
> observable algebras, executable local transport-defect certificates in
> decidable examples, and compatible probabilistic states; together with the
> open problem of constructing functorial observable sheaves or path complexes
> in which period classes legitimately organize unresolved transport geometry.

The learner does not merely estimate a hidden state. It refines the algebra in
which states and paths become distinguishable and on which probabilistic
questions can be posed.
