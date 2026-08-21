# Genesis Bar Primitive Representer: finite-rank semantics and unending witness genealogy

## Status: exact universal-repair theorem relative to normalized-bar module semantics

The crossed-module attachment produced a nonzero class

\[
[\kappa]\in H^3(Q;A).
\]

The relation-policy audit then exposed the next empty question: a chosen
coefficient lift can exist pointwise without assembling into a closed global
2-cochain.  This note represents that question itself.

The result corrects a tempting recursion error.  The earlier filler module
`H=Z[Q]` is not the universal object for primitives of `kappa`; it carries one
particular primitive after the coefficient context is enlarged.  The actual
unrestricted representer is a new rank-13 module in the local `Q=V_4` sector.
It has a canonical infinite free-cell genealogy even though the representer
itself is finite-rank.

That separation is the main theorem:

\[
\boxed{
\text{finite-rank semantic representer}
\quad\ne\quad
\text{finite-length free/projective transparent genealogy}.
}
\]

The executable companion is
[`genesis-bar-primitive-representer.mjs`](genesis-bar-primitive-representer.mjs).

## 1. The declared next semantic category

Let `Q` be a finite group of order `q>1`, put `R=Z[Q]`, and use the normalized
free bar resolution

\[
\cdots\xrightarrow{d_4}B_3
\xrightarrow{d_3}B_2
\xrightarrow{d_2}B_1
\xrightarrow{d_1}B_0
\longrightarrow\mathbb Z\longrightarrow0.
\tag{1}
\]

Here

\[
B_n
=
R\{[g_1|\cdots|g_n]:g_i\ne1\},
\tag{2}
\]

so

\[
\operatorname{rank}_R B_n=(q-1)^n,
\qquad
\operatorname{rank}_{\mathbb Z}B_n=q(q-1)^n.
\tag{3}
\]

Let `A` be a left `R`-module and fix an `R`-linear normalized cocycle

\[
\kappa:B_3\longrightarrow A,
\qquad
\kappa d_4=0.
\tag{4}
\]

In the generated local example, `Q=C_2^2`, `A` is the even-augmentation
sublattice of `Z[Q]`, and (4) is the nonzero Postnikov cocycle obtained from the
failed naturality square.

The new typing choice is the coslice category

\[
A\downarrow R\text{-}\mathbf{Mod}.
\]

An object is an arbitrary `R`-linear context map `i:A->N`; it need not be an
embedding.  Define its primitive type by

\[
\operatorname{Prim}_{\kappa}(N,i)
=
\{U:B_2\to N\text{ `R`-linear}:Ud_3=i\kappa\}.
\tag{5}
\]

For `(A,id_A)`, this type is empty exactly when `[kappa]` is nonzero.  The
question in (5) asks for something stronger than pointwise values: a primitive
compatible with every normalized triple relation at once.

This semantic category is still declared.  It is not forced by the raw
`W,R,T` data.  Once it is declared, however, its universal repair is forced.

## 2. The universal primitive-context representer

Define

\[
\boxed{
M_{\kappa}
=
(A\oplus B_2)
\Big/
\operatorname{im}
\left(
B_3\xrightarrow{(\kappa,-d_3)}A\oplus B_2
\right).
}
\tag{6}
\]

Write

\[
j(a)=[a,0],
\qquad
u(b)=[0,b].
\tag{7}
\]

The defining relation says

\[
ud_3=j\kappa.
\tag{8}
\]

### Theorem 1: unrestricted primitive representability

For every object `(N,i)` of `A downarrow R-Mod`, evaluation at `u` gives a
natural bijection

\[
\boxed{
\operatorname{Hom}_{A\downarrow R\text{-}\mathbf{Mod}}
((M_\kappa,j),(N,i))
\cong
\operatorname{Prim}_{\kappa}(N,i).
}
\tag{9}
\]

Consequently `(M_kappa,j,u)` is initial in the category of coefficient
extensions equipped with a primitive of `kappa`, and is unique up to unique
isomorphism preserving both `A` and the universal primitive.

### Proof

A map `f:M_kappa->N` under `A` determines `U=f u`.  Equation (8) gives

\[
Ud_3=fud_3=fj\kappa=i\kappa.
\]

Conversely, a primitive `U` defines

\[
f[a,b]=i(a)+U(b).
\tag{10}
\]

For `z in B_3`, the relation `(kappa z,-d_3z)` maps to
`i kappa z-Ud_3z=0`, so (10) descends to the quotient.  The images of `j` and
`u` generate `M_kappa`, proving uniqueness.  \(\square\)

This is an exact internal-emptiness/external-universality pattern, but only in
the declared module doctrine: the old context has no primitive, while its
universal extension carries the generic primitive for every future target.

## 3. Exact structure and the obstruction to retraction

There is a natural short exact sequence

\[
\boxed{
0\longrightarrow A
\xrightarrow{j}M_\kappa
\xrightarrow{\pi}\operatorname{im}d_2
\longrightarrow0,
}
\tag{11}
\]

where

\[
\pi[a,b]=d_2b.
\]

### Theorem 2: extension and nonsplitting

Sequence (11) is exact.  Moreover,

\[
\boxed{
j\text{ has an `R`-linear retraction}
\iff
[\kappa]=0.
}
\tag{12}
\]

### Proof

If `[a,0]=0`, then for some `z in B_3`,

\[
(a,0)=(\kappa z,-d_3z).
\]

Thus `d_3z=0`.  Exactness of (1) gives `z=d_4w`, and (4) gives
`a=kappa d_4w=0`; hence `j` is injective.  Surjectivity of `pi` is immediate.
If `d_2b=0`, write `b=d_3z`.  The quotient relation gives

\[
[a,b]=[a+\kappa z,0],
\]

so `ker pi=im j`.

If `r:M_kappa->A` retracts `j`, then `U=ru` satisfies `Ud_3=kappa`, making
`kappa` a coboundary.  Conversely such a primitive defines

\[
r[a,b]=a+U(b),
\]

which is a well-defined retraction.  \(\square\)

Under dimension shifting, (11) is the extension representing `[kappa]` in

\[
\operatorname{Ext}^1_R(\operatorname{im}d_2,A)
\cong
H^3(Q;A).
\tag{13}
\]

This uses the displayed bar and pushout sign convention.

Thus the higher obstruction has a concrete semantic meaning: it is exactly the
failure of the generated context to retract equivariantly into the old
observable module.  Sequence (11) always splits as a sequence of abelian groups
because `im d_2`, being a subgroup of the free abelian group `B_1`, is free and
therefore projective over `Z`.  No freeness assumption on `A` is needed.  The
obstruction is in the `Q`-transport, not in the underlying integer extension.

If `kappa'=kappa+lambda d_3`, then

\[
[a,b]_{\kappa'}\longmapsto[a+\lambda b,b]_{\kappa}
\tag{14}
\]

is an isomorphism of representers under `A`; its inverse uses `-lambda`.
It sends the changed-gauge universal primitive to

\[
u_{\kappa'}(b)\longmapsto u_\kappa(b)+j\lambda(b),
\]

rather than fixing `u` pointwise.  This is precisely the natural identification
between the two gauge-shifted primitive functors.  The object therefore depends
on the cocycle gauge only up to that structured isomorphism.

## 4. An exact question-universality rank tax

Suppose `A` is free abelian of rank `a`.  Since `im d_1` is the augmentation
ideal of rank `q-1` and `B_1` has integer rank `q(q-1)`, exactness gives

\[
\operatorname{rank}_{\mathbb Z}\operatorname{im}d_2
=(q-1)^2.
\tag{15}
\]

Sequence (11) therefore gives:

### Theorem 3: universal primitive rank

\[
\boxed{
\operatorname{rank}_{\mathbb Z}M_\kappa
=a+(q-1)^2.
}
\tag{16}
\]

In the present crossed-module sector, `A` has rank `q`, so

\[
\operatorname{rank}M_\kappa=q+(q-1)^2=q^2-q+1.
\tag{17}
\]

The earlier filler module

\[
H=\mathbb Z[Q],
\qquad
\iota:A\hookrightarrow H
\]

has rank `q`.  Its chosen lift `F:B_2->H`, satisfying `Fd_3=kappa`, induces
the unique map

\[
\Pi_F:M_\kappa\longrightarrow H,
\qquad
\Pi_F[a,b]=\iota(a)+F(b).
\tag{18}
\]

For the generated nonsplit extension, the factor set takes the value one on a
normalized pair.  That pair maps to the basis filler `[1]`, whose `Q`-orbit
spans `H`.  Hence (18) is surjective.

Therefore `H` is a particular quotient selecting the orbit-shaped primitive
`F`; it does not represent arbitrary primitives in (5).  The exact gap is

\[
\boxed{
\operatorname{rank}M_\kappa-\operatorname{rank}H=(q-1)^2,
\qquad
\frac{\operatorname{rank}M_\kappa}{\operatorname{rank}H}
=q-1+\frac1q.
}
\tag{19}
\]

For the local quotient `Q=V_4`,

\[
\boxed{
\operatorname{rank}M_\kappa=13,
\quad
\operatorname{rank}H=4,
\quad
\operatorname{rank}\ker\Pi_F=9.
}
\tag{20}
\]

For the previously certified full quotient of order `64`, formula (17) gives

\[
\operatorname{rank}M_\kappa=64+63^2=4033,
\qquad
\operatorname{rank}H=64.
\tag{21}
\]

This is an exact algebraic rank separation in the declared normalized-bar
encoding, but a narrow one.  It is a lower bound for an exact representing
object of the all-normalized-2-cochain question (5), not for arbitrary programs,
neural features, or equivalent cochain models.  The normalized tuple-bar
language is part of the declared cost model.

## 5. Retaining the witness instead of only its fossil

The cokernel (6) retains the semantic answer while forgetting the cellular
history that made the answer available.  To retain that genealogy, set

\[
E_2=A\oplus B_2,
\qquad
E_n=B_n\quad(n\ge3),
\qquad
E_n=0\quad(n<2),
\tag{22}
\]

with

\[
D_2=0,
\qquad
D_3=(\kappa,-d_3),
\qquad
D_n=d_n\quad(n\ge4).
\tag{23}
\]

The cocycle law is exactly the first chain condition:

\[
D_3D_4=(\kappa d_4,-d_3d_4)=0.
\tag{24}
\]

### Theorem 4: witness-preserving bar tower

For the infinite complex `E_kappa`,

\[
H_2(E_\kappa)=M_\kappa,
\qquad
H_n(E_\kappa)=0\quad(n\ge3).
\tag{25}
\]

For its truncation through degree `N>=3`,

\[
H_n(E_\kappa^{\le N})=0
\quad(3\le n<N),
\]

while

\[
\boxed{
H_N(E_\kappa^{\le N})=\operatorname{im}d_{N+1}.
}
\tag{26}
\]

### Proof

The degree-two statement is the definition of (6).  If `D_3z=0`, then
`d_3z=0`, so `z=d_4w`; conversely (24) gives `im d_4 subset ker D_3`.
Higher exactness follows from (1).  Omitting `B_{N+1}` leaves precisely
`ker d_N=im d_{N+1}` unresolved at the top.  \(\square\)

Let

\[
r_n=\operatorname{rank}_{\mathbb Z}\operatorname{im}d_n.
\]

Exactness and (3) give

\[
r_1=q-1,
\qquad
r_n+r_{n+1}=q(q-1)^n.
\]

Induction yields

\[
\boxed{r_n=(q-1)^n.}
\tag{27}
\]

Hence the unresolved top coherence at depth `N` has integer rank

\[
\boxed{
\operatorname{rank}_{\mathbb Z}H_N(E_\kappa^{\le N})
=(q-1)^{N+1}.
}
\tag{28}
\]

Three counts must not be conflated:

- `B_n` has `(q-1)^n` free `Q`-cell orbit types;
- it has `q(q-1)^n` underlying integer basis cells; and
- the top unresolved homology at depth `N` has integer rank `(q-1)^(N+1)`.

For `Q=V_4`, the pair, triple, quadruple, and quintuple orbit counts are

\[
9,\quad27,\quad81,\quad243.
\tag{29}
\]

The triple layer has `108` underlying integer cells.  Before the quadruple
fillers are attached, top `H_3` has rank `81`; after they are attached, the new
top `H_4` has rank `243`.  Each top question is answered one stage later, but
answering it exposes the next boundary family.

For the full order-64 quotient, the triple and quadruple orbit counts are

\[
63^3=250{,}047,
\qquad
63^4=15{,}752{,}961,
\tag{30}
\]

with respectively `16,003,008` and `1,008,189,504` underlying integer cells.
These exact numbers expose a different scaling axis: proof-transparent global
coherence can grow exponentially in depth even when the semantic carrier is a
finite-rank module.

## 6. No finite transparent projective stop

The infinite tail above is not an artifact that can be replaced by a finite
projective resolution of the same bar syzygy.

### Theorem 5: narrow no-finite-projective-tail theorem

For every nontrivial finite group `Q`, the trivial `Z[Q]`-module `Z` has
infinite projective dimension.  Consequently `im d_2` has infinite projective
dimension, and no finite-length free or projective `Q`-cell tail can resolve
the quotient module `im d_2=M_kappa/j(A)` while retaining this transparent
syzygy witness.  This does not exclude finite nonprojective, periodic, or other
compressed semantic descriptions.

### Proof

Choose a subgroup `C_p` of prime order.  Restriction sends projective
`Z[Q]`-modules to projective `Z[C_p]`-modules because `Z[Q]` is free over
`Z[C_p]`.  A finite projective resolution of `Z` over `Z[Q]` would therefore
restrict to one over `Z[C_p]`.

The periodic resolution of `C_p` alternates multiplication by

\[
g-1
\qquad\text{and}\qquad
1+g+\cdots+g^{p-1}.
\]

After applying `Hom_{Z[C_p]}(-,F_p)` with trivial action, both maps vanish, so

\[
H^n(C_p;\mathbb F_p)\cong\mathbb F_p
\quad\text{for every }n\ge0.
\]

This contradicts finite projective dimension.  If `im d_2` had finite
projective dimension, splicing its resolution with the first two free bar
modules would give a finite projective resolution of `Z`, so it cannot.  \(\square\)

The qualification is load-bearing.  `M_kappa` itself has finite integer rank,
and a strict crossed module packages its coherence in dimension two.  Infinite
depth is forced only after declaring that the normalized free/projective cell
genealogy must remain explicit.  This theorem does not establish non-soficity,
unbounded memory, or the absence of every finite semantic presentation.

## 7. The smallest infinite-depth control and the Hodge warning

Restrict to the order-four square-root sector

\[
\langle p\rangle\cong C_4,
\qquad
p^2=T,
\]

so that `Q=C_2`.  Then `A` has rank two and

\[
\operatorname{rank}M_\kappa=2+1=3.
\]

There is one free `Q`-cell orbit in every positive bar degree.  The bar
boundaries alternate `x-1` and `1+x`.  Thus even the smallest generated core
has an exact infinite transparent genealogy, one orbit type per level.

It is also a decisive falsifier for a premature Hodge claim.  On the real bar
tail with the counting inner product, `x-1` and `1+x` have one nonzero singular
value equal to two and orthogonal images.  In tail degrees away from the
modified `D_3` interface,

\[
\Delta_n=d_n^*d_n+d_{n+1}d_{n+1}^*=4I.
\tag{31}
\]

The tail therefore has a uniform real spectral gap and closed range.  Infinite
transparent coherence depth does not imply dense nonclosed range, primitive
escape, or harmonic pathology.

The current Postnikov class has exact order two.  Its coefficient-change images
vanish in

\[
H^3(Q;A\otimes\mathbb Q)
\qquad\text{and}\qquad
H^3(Q;A\otimes\mathbb R).
\]

More generally, positive-degree cohomology of a finite group with real
coefficients vanishes by averaging.  Ordinary real harmonic cohomology cannot
represent this torsion class.  A real spectrum together with extra
integral-lattice data could still detect torsion indirectly.

What the construction does provide, after the normalized-bar module doctrine
is declared, is a canonical integral chain complex.  After choosing a
finite-stage basis pairing it satisfies the exact adjoint identity

\[
\langle D\xi,\eta\rangle
=
\langle\xi,D^*\eta\rangle,
\tag{32}
\]

which is the algebraic skeleton of discrete Stokes.  The pairing is not yet
generated by the semantic process.  There is no polarization, rational Hodge
class, algebraic-cycle comparison, nonlinear flow, compactness theorem, or
Navier--Stokes consequence.

The Hodge-facing object may therefore be the filtered attachment process and
its connecting maps, not the tail homology of the colimit, which vanishes above
degree two.  A serious next test would seek either a nontorsion generated
residue or a generated metric in which compatible primitive costs lose every
uniform bound.

## 8. What this says about algebraogenesis

The exact operator exposed here is

\[
\boxed{
\Gamma_{\mathrm{bar}}(A,\kappa)
=
(A\oplus B_2)/\operatorname{im}(\kappa,-d_3).
}
\tag{33}
\]

It turns an empty internal primitive type into an externally universal generic
context.  Retaining its presentation then exposes a sequence of new coherence
boundaries canonical within the declared normalized-bar doctrine.

This suggests a useful new distinction:

- **semantic size** is the cost of the completed representer or a quotient of
  it;
- **witness depth** is the cost of retaining how every coherence became
  justified; and
- **question universality** is the cost of answering every target in a declared
  solution functor rather than one current target.

The current example separates all three.  `H` is a rank-`q` particular answer,
`M_kappa` is the rank-`q^2-q+1` universal answer, and the normalized transparent
witness tower has no finite projective stop.

But the infinite tower does not yet contain one persistent higher obstruction.
At every finite truncation a top syzygy is present, and the next layer kills it.
The colimit is exact above degree two.  Nor is the genealogy intrinsically
uncompressible: the finite crossed module is already a compact semantic
package.

So the next non-sofic frontier is sharper than “continue the bar resolution”:

> Generate a sequence of question contexts whose quotient groups, coefficient
> systems, or admissible-observable types themselves evolve, and prove that no
> uniformly bounded family of semantic quotients preserves every generated
> solution functor and its transport.

That would convert witness depth into an architectural complexity theorem.
The present rank tax (19) is a first exact precursor, not that theorem.

## 9. Honest boundary and next gate

This note proves, relative to normalized-bar `Q`-module semantics:

- the exact universal representer (6) of the primitive question (5);
- the short exact sequence (11) and retraction obstruction (12);
- gauge invariance under changing the cocycle representative;
- the exact universal-versus-particular rank gap (19);
- the finite rank-13 local representer and rank-4033 full-group extrapolation;
- the witness-preserving chain tower and its exact truncation homology;
- exponential free-cell orbit counts for fixed finite `Q`; and
- the impossibility of a finite projective tail for the transparent bar
  syzygy.

It does not prove:

- that the semantics must select `R`-modules, crossed complexes, or normalized
  bar cells;
- that the representer is novel as an abstract algebraic construction;
- that the infinite genealogy is non-sofic or incompressible;
- that a top class persists in the infinite tower;
- that the rank tax lower-bounds arbitrary program features;
- a generated metric, Hodge decomposition, Stokes theorem, or fluid estimate;
- a consequence for Hodge, Navier--Stokes, `P` versus `NP`, or another open
  conjecture; or
- a completed AI architecture.

The next exact gate is twofold:

1. derive or falsify a canonical retention rule selecting witness genealogy
   rather than only the finite semantic fossil; and
2. replace fixed finite `Q` by an endogenously growing context tower, then test
   whether every uniformly bounded semantic model eventually loses a generated
   question or transport law.

Only success at the second gate, together with an independent non-soficity
argument, could turn the current exact continuation into the sought globally
non-sofic algebraogenetic process.
