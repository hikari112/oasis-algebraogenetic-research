# Universal Phantom Genesis

## Status: exact computable bridge, not yet endogenous or non-sofic

This note constructs one computable semantic object with two exact properties:

1. externally, its shift orbit approximates every point of Cantor space to
   arbitrary finite precision;
2. internally, it represents a nonzero derived inverse-limit class although
   every finite truncation has an exact primitive.

This is the first rigorous model in the project that simultaneously captures
**universal finite continuation** and **global coherence invisible at every
finite depth**. It uses no probability.

The ingredients are standard. Dense shift orbits, derived inverse limits, and
phantom phenomena are prior mathematics. Their use here is presently a
**shared-witness construction**: the same bitstream has both properties, but
its dense orbit does not generate the independently imposed inverse tower.
This is not a literature novelty or priority claim. It is also not non-sofic:
the underlying symbolic system is the sofic full shift.

The executable companion is
[`universal-phantom-genesis.mjs`](universal-phantom-genesis.mjs).

## 1. A nonnumerical meaning of “irrational”

The intended meaning is not an irrational coefficient. It is a semantic object
that cannot be isolated by any finite observation, while every demanded finite
view remains computable.

Domain theory already models values through directed finite information and
Scott-continuous computation. That is an important precedent, not our endpoint
[1]. The extra hypothesis of algebraogenesis is that continuation does not
merely reveal a point inside a fixed information system. Obstructions generate
new admissible distinctions and therefore alter the information system itself.

The present construction reaches only the first half. Its semantic point is
not finitely isolated, but its query language and refinement tower are fixed in
advance. That failure becomes the next theorem target.

## 2. The externally universal stream

Let `U` be the infinite binary stream obtained by concatenating every finite
binary word, first by increasing length and then in lexicographic order:

```text
0 1 | 00 01 10 11 | 000 001 010 011 100 101 110 111 | ...
```

For a word `w` of length `m`, its aligned occurrence begins at

\[
p(w)=\sum_{\ell=1}^{m-1}\ell 2^\ell
      +m\,\operatorname{bin}(w).
\]

This is an exact compiler, not a search procedure. It follows immediately that
every finite cylinder in Cantor space contains a shift of `U`. Hence

\[
\overline{\{\sigma^n U:n\ge 0\}}=\{0,1\}^{\mathbb N}.
\]

For any target `x` and precision `2^-m`, compile the first `m` bits of `x`.
The resulting shift of `U` agrees with `x` on those bits and is within the
requested Cantor-metric error. The executable checks all `1,022` target words
through length nine.

This is topological external universality. It is not yet universal function
approximation, statistical learning, or an efficiency claim.

## 3. The internal tower

Consider the inverse tower

\[
\mathbb Z
\xleftarrow{\;\times 2\;}
\mathbb Z
\xleftarrow{\;\times 2\;}
\mathbb Z
\xleftarrow{\;\times 2\;}\cdots.
\]

Its first derived inverse limit is the cokernel of

\[
d:\prod_{n\ge0}\mathbb Z\longrightarrow\prod_{n\ge0}\mathbb Z,
\qquad
d(x)_n=x_n-2x_{n+1}.
\]

Regard the universal bits as an integer sequence `U=(U_n)`. For every finite
depth `N`, set `x_(N+1)=0` and solve backward:

\[
x_n=U_n+2x_{n+1}.
\]

Then

\[
x_n-2x_{n+1}=U_n
\qquad(0\le n\le N).
\]

Thus every finite restriction of `U` is exact.

This local fact does not depend on universality: backward substitution makes
every finite restriction of every integer sequence exact for this tower.
Universality matters later only because it supplies a bitstream with a dense
orbit and, in particular, a tail that is not eventually constant.

The executable verifies `8,385` such recurrence equations through depth `128`.
This audit supports the algebraic proof; it does not replace the all-depth
backward-substitution argument.

## 4. Why the global class is nonzero

For this tower there is a standard identification

\[
\lim{}^1(\mathbb Z,\times2)\cong\mathbb Z_2/\mathbb Z.
\]

The map sends a sequence `y` to the 2-adic sum

\[
\Phi(y)=\sum_{n\ge0}2^n y_n.
\]

If `y=d(x)`, its finite sums telescope:

\[
\sum_{n=0}^{N}2^n(x_n-2x_{n+1})
=x_0-2^{N+1}x_{N+1}.
\]

The right side converges 2-adically to the ordinary integer `x_0`. Conversely,
an ordinary-integer value supplies a global integer solution. Quotienting by
ordinary integers therefore gives the displayed `lim^1` group.

An ordinary integer has a 2-adic bit expansion that is eventually all zero
when nonnegative or eventually all one when negative. The universal stream is
neither: after every position it has a later zero and a later one. Consequently

\[
[U]\ne0\quad\text{in}\quad\lim{}^1(\mathbb Z,\times2).
\]

Every finite truncation has a primitive, but there is no compatible global
integer primitive. This is the exact sense in which the semantic obstruction
exists only through unbounded continuation.

Derived limits are established machinery for inverse systems [2]. Phantom-map
theory gives the closely related topological phenomenon of globally nontrivial
maps whose restrictions to finite CW subcomplexes are null [3]. Our result is
therefore a precise bridge to known mathematics, not a claim that finite
invisibility itself is new.

## 5. A literal weighted discrete Stokes identity

Introduce a free weighted chain complex with vertices `v_n`, edges `e_n`, and

\[
\partial e_n=v_n-2v_{n+1}.
\]

For the finite chain

\[
c_N=\sum_{n=0}^{N}2^n e_n,
\]

the interior terms cancel and

\[
\partial c_N=v_0-2^{N+1}v_{N+1}.
\]

If `x` is a zero-cochain, then

\[
(\delta x)(e_n)=x_n-2x_{n+1}.
\]

The algebraic Stokes formula

\[
\langle\delta x,c_N\rangle=\langle x,\partial c_N\rangle
\]

is therefore exactly the finite identity

\[
\sum_{n=0}^{N}2^n U_n
=x_0-2^{N+1}x_{N+1}
\]

from the executable. This is a literal Stokes identity for a weighted free
chain complex. It admits a cellular sheaf/cosheaf realization after the stalks
and the restriction maps `1` and `2` are explicitly supplied; that realization
is not being assumed silently here. It is not ordinary constant-coefficient
cellular homology, de Rham theory, or Hodge theory. At every finite depth,
choosing `x_(N+1)=0` expresses the weighted cocycle evaluation as the boundary
value `x_0`.

But those finite primitives cannot be chosen compatibly across all depths. The
surviving derived class measures precisely that failure. We use **derived
Stokes residue** as a local project name for this `lim^1` obstruction; it is not
asserted to be established terminology.

This formulation improves on a naive chain-map defect. A legitimate inclusion
of one cellular complex into a refinement is normally a chain map, so
`boundary-after-refinement` should agree with `refinement-after-boundary` on
old cells. The more interesting obstruction is not a broken chain map. It is
the inability to choose a compatible family of primitives or representatives
over the entire refinement tower.

## 6. The Hodge opening and its no-go theorem

At a fixed finite stage, Hodge theory decomposes a cochain space into exact,
harmonic, and coexact parts. Cellular sheaf theory likewise builds cochain
complexes and Laplacians whose kernels represent cohomology [4]. Persistent
sheaf Laplacians and lattice-valued Tarski Laplacians already extend pieces of
this picture, so “Hodge on changing data” is not by itself a new field [5].

The algebraogenetic question is sharper. Given forward refinement maps
`R_n:C_n^k -> C_(n+1)^k` and finite harmonic projections `P_n`, the operator

\[
\kappa_n=P_{n+1}R_n-R_nP_n.
\]

is well-typed, but it is not intrinsic. It depends on the stage metrics. It is
automatically covariant under compatible unitary gauges; more general gauges
require transporting the metric and projection data as well. A cleaner
one-way measure of transporting a harmonic cochain out of the harmonic
subspace is

\[
D_n=(I-P_{n+1})R_nP_n.
\]

For inverse maps `q_n:C_(n+1)^k -> C_n^k`, the corresponding leakage is

\[
D_n^q=(I-P_n)q_nP_{n+1}.
\]

Even when a cohomology class transports, its chosen harmonic representative
need not. But the current example does **not** force such leakage. Its derived
class is integral:

\[
\lim{}^1(\mathbb Z,\times2)\cong\mathbb Z_2/\mathbb Z.
\]

For the explicit stage system `C_n^k=Z`, `d_n=0`, and `q_n=times 2`, coefficient
change to `R` makes every inverse transition an isomorphism. The realified
inverse system therefore has vanishing `lim^1`. Its harmonic projections are
`P_n=I`, so `D_n^q=0`, while the original integral system still contains the
nonzero class `[U]`. Therefore:

> Nonzero integral derived coherence does not by itself force a finite real or
> complex Hodge-transport defect.

This no-go theorem blocks the naive bridge. The proposed new object would need
to retain:

- the obstruction-generated refinement tower;
- the availability type of each cochain or query;
- the finite Hodge decompositions;
- the harmonic leakage operators `D_n` or `D_n^q`; and
- any derived-limit class preventing globally compatible representatives.

A real theorem must additionally construct a gauge-invariant comparison map
from the integral derived class to an analytic quantity that does not vanish.
This may require arithmetic or `p`-adic Hodge data, an asymptotic geometry that
retains the refinement path, or an infinite-dimensional Hilbert complex with
nonclosed range. The stagewise tensor realification used here supplies no such
comparison automatically. Nothing in the current experiment establishes that
comparison or speaks to the Hodge conjecture. The possible relevance is
methodological: it studies the genesis of representability rather than
starting with a completed cohomology class.

## 7. Four collapses that remain

The construction survives its central theorem but not the stronger project
claims:

1. **The tower is fixed.** The questions are not generated by repair
   obstructions.
2. **The stage carrier is infinite.** A finite truncation has finite length and
   finite description, but each group is `Z`, not a finite set. Every
   sequential inverse system of finite abelian groups is Mittag-Leffler and
   therefore has vanishing classical `R^1 lim`, so this particular abelian
   derived-limit mechanism disappears there [8].
3. **The full shift is sofic.** Dense external universality does not imply
   internal non-soficity.
4. **A short program simulates everything.** No memory, compression, runtime,
   learning, or AI advantage follows.

This negative information is valuable. It says that non-finite local carriers
or a different derived mechanism may be structural rather than accidental,
and it cleanly separates phantom coherence from group non-soficity.

## 8. The next object

The next candidate is an **obstruction-generated derived Hodge system**. A
valid instance should provide:

1. a fixed finite action alphabet and honest payload/address cost;
2. a computable tower of finitely presented observable complexes;
3. a typed certificate that identifies a local cycle or compatibility defect;
4. a canonical attachment compiler, preferably characterized by a pushout or
   another universal property;
5. a query that is genuinely ill-typed before attachment and available after;
6. an effective failure of Mittag-Leffler stabilization;
7. a nonzero derived coherence class;
8. finite or non-Archimedean Hodge projections with controlled harmonic
   leakage;
9. a comparison theorem showing the derived class has a nonzero, gauge-
   invariant analytic image, persistent under cofinal refinement; and
10. only then, a semantics-forced action of the exact non-sofic group whose
    non-soficity survives the observational quotient.

For compatible exact cocycles `z_n`, a standard primitive-choice obstruction
can be written explicitly. Choose stage primitives `a_n` and set

\[
\eta_n=q_n a_{n+1}-a_n.
\]

Each `eta_n` is closed. Its derived class is independent of the primitive
choices and vanishes exactly when the primitives can be chosen compatibly.
This is the algebraic input a comparison tool must preserve. The companion
[`genesis-tail-hodge.md`](genesis-tail-hodge.md) tests one deliberately
presentation-sensitive candidate rather than pretending that ordinary
realification already does so. The stronger
[`genesis-primitive-escape.md`](genesis-primitive-escape.md) replaces the
incomplete variance certificate by a nested minimum-primitive geometry whose
boundedness is equivalent to vanishing of the binary derived class.

Counterexample-guided abstraction refinement and active automata learning
already add distinctions or refine abstractions in response to failures [6].
Structured/decorated cospans and compositional rewriting already organize open
systems and universal attachment laws [7]. The potential gap is not any one of
these ingredients; it is their load-bearing coupling to an effective derived
coherence obstruction and a non-sofic transport action.

## 9. Run

```powershell
node research/universal-phantom-genesis.mjs
```

The report checks exact cylinder compilation, finite primitives, telescoping
identities, and samples constructive later-zero/later-one witnesses through
threshold `64`. The cylinder compiler formula, not that finite audit, proves
the all-threshold nonstabilization statement.

## References

1. S. Bukatin and J. Matthews, [Mathematics of
   Domains](https://arxiv.org/abs/1512.03868), retrieved relevance `0.4316`.
2. The Stacks Project, [Derived Limits](https://stacks.math.columbia.edu/tag/08TB),
   retrieved relevance `0.4648`.
3. C. Schochet, [A Pext Primer: Pure Extensions and `lim^1` for Infinite
   Abelian Groups](https://nyjm.albany.edu/m/2003/1p.pdf), retrieved relevance
   `0.5781`.
4. J. Hansen and R. Ghrist, [Toward a Spectral Theory of Cellular
   Sheaves](https://arxiv.org/abs/1808.01513), retrieved relevance `0.6563`.
5. R. Ghrist and R. Riess, [Cellular Sheaves of Lattices and the Tarski
   Laplacian](https://www2.math.upenn.edu/~ghrist/preprints/tarski.pdf),
   retrieved relevance `0.6875`.
6. F. Aarts et al., [Automata Learning Through Counterexample-Guided
   Abstraction Refinement](https://www.mbsd.cs.ru.nl/publications/papers/fvaan/CEGAR12/),
   retrieved relevance `0.6211`.
7. E. Patterson, [Structured and Decorated Cospans from the Viewpoint of
   Double Category Theory](https://arxiv.org/abs/2304.00447), retrieved
   relevance `0.6797`.
8. The Stacks Project, [Mittag-Leffler Systems and Vanishing of
   `R^1 lim`](https://stacks.math.columbia.edu/tag/0CQA).
