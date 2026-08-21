# Genesis Endogenous Transport Successor: obstruction-generator lines, quotient transport, and the degree fork

## Status: exact no-go theorems, a declared dual-line successor, and two unconditional comparison branches

The essential-coherence hierarchy isolated a precise generation question.  A
rank-`n` elementary abelian transport context has a globally nonzero
coherent-lift obstruction that vanishes on every proper subgroup.  Can that
obstruction, rather than an external integer `n`, expose the next independent
binary transport direction?

There are three different answers, and they must not be conflated.

1. Merely deleting an explicit stage counter is insufficient.  The rank of the
   current context can replay any supplied rank-indexed family.
2. The ordinary universal operation of adjoining a primitive for the essential
   class produces higher transport, not a new element of the fundamental
   transport group.
3. A new ordinary direction can be obtained by an explicit additional
   type-former: retain the indecomposable generator line of an admitted
   obstruction ideal and reify its dual as a free quotient transport line.

The third operation is autonomous, basis-free, obstruction-sensitive, and
executable.  It is also declared.  It is not a consequence of the preceding
crossed-module, Bockstein, normalized-bar, or Postnikov constructions.

Two executable companions keep that boundary visible:

- [`genesis-obstruction-born-successor.mjs`](genesis-obstruction-born-successor.mjs)
  audits the dual-line type-former and the split-chart Dickson/precursor
  recurrence; and
- [`genesis-universal-syzygy-successor.mjs`](genesis-universal-syzygy-successor.mjs)
  audits an unconditional universal-homology-cover successor which really
  creates new first homology, but is not caused by the essential obstruction.

The input essential class and affine precursor are those developed in
[`genesis-essential-coherence-hierarchy.md`](genesis-essential-coherence-hierarchy.md).
The ordinary primitive comparison uses the universal construction in
[`genesis-bar-primitive-representer.md`](genesis-bar-primitive-representer.md).

## 1. Why counter erasure is not enough

Let `(X_n)_{n>=0}` be a sequence of semantic states.  Suppose the stage is
recoverable from the state by an invariant

\[
\nu(X_n)=n.
\tag{1}
\]

For any externally supplied family of transition rules `F_n`, define on the
trace

\[
\Phi(X)=F_{\nu(X)}(X).
\tag{2}
\]

Then `Phi` is an autonomous state-only rule even though it merely replays the
supplied family.

### Proposition 1: clock reconstruction

Absence of an explicit stage-counter argument is not an extensional property
of a transition trace.  Whenever (1) holds, every externally indexed trace can
be implemented by the autonomous rule (2).

For

\[
E_n=(\mathbb F_2)^n,
\]

the invariant `nu(E)=dim(E)` is such a clock.  Restricting naturality to the
groupoid of linear isomorphisms does not fix the problem: dimension is
isomorphism-invariant, so a rank-indexed Dickson table can be perfectly
`GL(E)`-equivariant.

There are two distinct counter tests.

1. **Presentation-counter test.** Add a redundant group generator with a
   defining relation, or a contractible direct summand to a chain
   presentation.  A semantic successor must descend through that equivalence.
   Raw generator count, matrix size, and bar-cell count fail this test.
2. **Semantic-rank clock test.** Hold `E` fixed and replace the admitted
   obstruction ideal by zero.  If the same new line is still produced, rank is
   acting as the clock even though it is a genuine invariant.

A third test detects ambient process state.  Clone one semantic state into two
executions with different call counts or histories.  Their next outputs must
be isomorphic.  Conversely, applying the resolver to an already resolved
question must stutter up to the declared semantic equivalence.

### A useful counterexample to an overstrong no-go claim

There is no theorem saying that a counter-free fresh line is impossible in
finite vector spaces.  The functor

\[
S(V)=V\oplus\mathbb F_2,
\qquad
S(f)=f\oplus 1,
\tag{3}
\]

has a natural new element `(0,1)` and uses no rank.  But (3) adds that line
when the pending obstruction is nonzero, zero, solved, or absent.  It is a
constant adjunction, not an obstruction-caused successor.

The theorem gate must therefore ask for causal dependence on the current empty
question, not merely autonomy from an external integer.

## 2. Symmetry no-go: no chosen fresh lift

Let `C` be a groupoid of semantic states and let `Dir:C->Set` assign the
admissible concrete next directions.  A natural selector `d_X in Dir(X)` must
satisfy

\[
g\,d_X=d_X
\qquad
\text{for every }g\in\operatorname{Aut}_{C}(X).
\tag{4}
\]

### Proposition 2: fixed-point obstruction

If `Aut_C(X)` has no fixed point in `Dir(X)`, no natural concrete selector
exists at `X`.

This elementary observation rules out several hidden choice mechanisms.

- For `dim(V)>=2`, the only vector fixed by all of `GL(V)` is zero.  Hence
  there is no natural nonzero vector of an unpointed `V`.
- There is no natural ordered basis.
- There is no natural complement.  In `F_2^2`, the shear
  `e_1 |-> e_1`, `e_2 |-> e_1+e_2` fixes the line spanned by `e_1` and swaps
  its two complementary lines.
- There is no equivariant fresh-name function on an infinite atom set.  A
  permutation fixing the finite used-name set and moving the proposed fresh
  atom contradicts equivariance.

The exact successor version uses a codimension-one extension

\[
0\longrightarrow V
\xrightarrow{i}W
\xrightarrow{q}L
\longrightarrow0,
\qquad \dim L=1.
\tag{5}
\]

Over `F_2`, `L` has a unique nonzero vector.  Its inverse image under `q` is an
affine `V`-torsor.  In the chart

\[
W=V\oplus\mathbb F_2,
\]

the automorphisms

\[
s_a(v,t)=(v+ta,t),
\qquad a\in V,
\tag{6}
\]

fix `V` pointwise and induce the identity on `L`, while acting freely and
transitively on the possible lifts of the nonzero quotient vector.

### Corollary 2.1: quotient line versus representative

The following can be canonical:

- the quotient line `L`;
- the affine torsor of its lifts; and
- a generic lift retained under a binder or universal property.

A particular freshly named vector of `W` cannot be canonical under the full
extension gauge.  Selecting one is equivalent to supplying a splitting of
(5).

This is why a true lift-stack construction would need to retain its band and
translation torsor.  The conditional successor below instead detects the
indecomposable obstruction-generator line `G(I)` and explicitly reifies its
dual.  Identifying those two lines is not yet a theorem.

## 3. Ordinary primitive attachment cannot create the required direction

Let `A` be an abelian coefficient group and let

\[
k\in H^m(E;A)
\tag{7}
\]

be represented by a map

\[
BE\longrightarrow K(A,m).
\]

The ordinary universal operation of adjoining a primitive is the homotopy
fiber.  It lies in a fibration

\[
K(A,m-1)
\longrightarrow
\operatorname{hofib}(k)
\longrightarrow
BE.
\tag{8}
\]

For the essential class `D_n`,

\[
m=2^n-1\ge3
\qquad(n\ge2).
\tag{9}
\]

The fiber in (8) is then simply connected.  The long exact homotopy sequence
gives

\[
\boxed{
\pi_1\operatorname{hofib}(D_n)\cong E_n.
}
\tag{10}
\]

### Theorem 3: degree no-go

The ordinary universal primitive or Postnikov attachment for `D_n` does not
produce an ordinary new binary transport generator.  It creates an
`(m-1)`-dimensional homotopy group while leaving `pi_1` unchanged.

The same typing issue appears algebraically.  The normalized-bar primitive
representer freely adjoins a primitive in the cochain degree demanded by the
cocycle.  Its existence does not provide a natural degree-lowering map into
`H^1`.

Consequently any rule converting the band of this higher empty question into
a new first-transport line is an additional semantic type-former.  It must be
declared and tested as such.

## 4. A stronger definition of an autonomous successor

A semantic state for the present purpose contains at least

\[
X=(E,R,I,\mathcal L),
\tag{11}
\]

where

- `E` is the current finite binary transport space;
- `R=H^*(E;F_2)=Sym(E^*)` is its observable cohomology algebra;
- `I` is the admitted ideal generated by certified globally obstructed,
  proper-view-soluble questions; and
- `L` is the full local lift object, including translations and gauge, not
  only the Boolean fact that its global section type is empty.

An **obstruction-caused autonomous successor** is a state-only construction
`S(X)` satisfying all of the following.

1. **Semantic descent.** Equivalent presentations give equivalent successors.
2. **Gauge naturality.** Isomorphisms of banded question objects transport the
   whole successor diagram.
3. **Zero-ideal stutter.** If `I=0`, the transport component does not grow.
4. **Resolved stutter.** If the admitted question already has a global
   solution, its free resolver is equivalent to the current state.
5. **Initial resolution.** For an unresolved question, the resolver is initial
   among declared extensions carrying a generic solution.
6. **No chosen torsor origin.** Affine local lifts and fresh representatives
   remain generic or gauge-quotiented.
7. **Internal recurrence.** The next admitted question is computed from the
   new universal object; it is not read from a future family table.
8. **Type fidelity.** Any conversion from higher coherence to ordinary
   transport is visible in the signature of the construction.

These conditions reject both the constant successor (3) and a rank-decoded
replay of `D_n`, while permitting a uniform free construction driven by the
current obstruction-generator line.

## 5. The intrinsic indecomposable obstruction-generator line

Let

\[
R=\operatorname{Sym}(V^*),
\qquad
\mathfrak m=R_{>0},
\tag{12}
\]

and let `I` be the admitted homogeneous obstruction ideal.  Define its space
of indecomposable generators by

\[
\boxed{
G(I)=I/\mathfrak m I.
}
\tag{13}
\]

This quotient removes every obstruction obtained merely by multiplying an
older admitted obstruction by a positive-degree observable.  It retains the
new generator directions of the ideal without choosing a polynomial
representative.

In the essential elementary-abelian case,

\[
I=\operatorname{Ess}(V)=(D_V),
\qquad
D_V=\prod_{0\ne\lambda\in V^*}\lambda.
\tag{14}
\]

Therefore

\[
G(I)\cong\mathbb F_2\cdot[D_V]
\quad\text{as a one-dimensional graded vector space},
\tag{15}
\]

where the notation means the line spanned by the indecomposable class of
`D_V`, not a polynomial subalgebra.  Because the ground field is `F_2`, that
line has a unique nonzero element.  No basis of `V`, ordering of its nonzero
characters, or rank counter is required to identify it.

The admission qualifier is load-bearing.  If every abstract essential ideal
were automatically admitted, the constructor would grow from the group alone
and the obstruction question would again be only a side condition.  Here `I`
is part of the certified semantic state.  Under the zero-obstruction ablation,

\[
I=0
\quad\Longrightarrow\quad
G(I)=0,
\tag{16}
\]

so the transport successor stutters.

The global emptiness proposition alone cannot yield (13).  A propositionally
truncated empty type contains no translation data.  The local lift stack or
torsor must retain its coefficient band.  In the present `Z/4 -> F_2`
coefficient policy, that band is binary and agrees with the line detected in
(15) at the level of dimension and coefficient type.  A canonical semantic
identification between the actual lift-stack band and `G(I)^vee` has not yet
been derived; it is part of the next theorem gate.

## 6. The one explicit new type-former: dual-line reification

Let `G=G(I)` be one-dimensional.  Its dual `G^vee` is again a line.  The
obstruction-born successor declares

\[
\boxed{
E^+=E\oplus G^\vee.
}
\tag{17}
\]

This operation does two things that ordinary primitive attachment does not.

1. It forgets the high cohomological degree in which `G` was detected.
2. It reifies the resulting line as a degree-one transport direction.

Call this operation **dual-line reification**.  Equation (17), including its
degree change, is the single additional type-former in this branch.  Calling
it band reification would silently assume the still-unproved identification
between `G(I)^vee` and the actual local lift-stack translation band.

### Theorem 4: free split quotient-line property

For a vector space `E` and line `L`, the diagram

\[
E\xrightarrow{i_E}E\oplus L\xleftarrow{i_L}L
\tag{18}
\]

is their coproduct.  For every vector space `W` and maps `f:E->W`, `g:L->W`,
there is a unique linear map

\[
[f,g]:E\oplus L\longrightarrow W
\]

extending both.  Equivalently, (17) is initial among **split** extensions of
`E` equipped with a realization of the reified generator line.

If the chosen generator-line injection is forgotten, (17) leaves the short exact
sequence

\[
0\longrightarrow E
\longrightarrow E^+
\longrightarrow G^\vee
\longrightarrow0.
\tag{19}
\]

The possible splittings of (19) form a translation torsor.  Thus the free
construction supplies a useful executable chart.  After forgetting that
chart, the extension retains only the quotient line and the torsor of
splittings; the polynomial factors used below form an equivariant family over
that torsor rather than one separately invariant factorization.
The coproduct universal property must not be misreported as an initial object
in the category of unsplit extensions: the shears (6) prevent that stronger
claim.

The independence assertion is exact and modest:

\[
E^+/E\cong G^\vee\ne0.
\tag{20}
\]

It does not assert non-soficity, analytic escape, or an architecture lower
bound.

## 7. Basis-free, split-chart successor recurrence

Assume `dim(V)=n>=2`, let `L=G(I)^vee`, and work in the free chart

\[
V^+=V\oplus L.
\]

Let `t` be the unique nonzero element of `L^*`.  The inclusion and projection
of the free coproduct identify `V^*` with the old-character summand of
`(V^+)^*`.  Define the orbit norm

\[
\boxed{
N_V(t)=\prod_{\lambda\in V^*}(t+\lambda).
}
\tag{21}
\]

This is a product over the whole affine dual orbit, not over a chosen basis.
The substitution `t -> t+mu`, with the old-character summand held fixed,
merely permutes its factors:

\[
N_V(t+\mu)
=
\prod_{\lambda\in V^*}(t+\mu+\lambda)
=N_V(t).
\]

But this substitution changes the embedded past hyperplane.  It is **not** a
change of splitting of the fixed extension (19).  If the lift of the quotient
generator changes by `a in V`, the correct dual shear is

\[
t\longmapsto t,
\qquad
x_i\longmapsto x_i+a_i t.
\tag{21a}
\]

Under (21a), `N_V(t)` is chart-dependent.  The complete Dickson product
`D_VN_V(t)` is invariant, and the precursor recurrence is equivariant when
`D_V`, `zeta`, and `N_V` are all transported together.  Consequently the
polynomial genealogy requires a retained split chart, or else its entire
shear orbit; it does not descend as one preferred factorization after the
splitting is forgotten.

The nonzero characters of `V^+` partition as

\[
\bigl(V^*\setminus\{0\}\bigr)
\;\sqcup\;
\{t+\lambda:\lambda\in V^*\}.
\tag{22}
\]

Consequently the next essential generator is

\[
\boxed{
D^+=D_VN_V(t).
}
\tag{23}
\]

No `n+1` formula or future Dickson table occurs in (21)--(23).  The current
dual space and the newly reified quotient line determine the complete orbit.

Let `beta=Sq^1` be the coefficient Bockstein.  For a product of linear forms,

\[
\beta\!\left(\prod_j a_j\right)
=
\left(\prod_j a_j\right)\left(\sum_j a_j\right).
\tag{24}
\]

For `n>=2`,

\[
\sum_{\lambda\in V^*}(t+\lambda)=0,
\]

so

\[
\beta N_V(t)=0.
\tag{25}
\]

Suppose the current precursor satisfies

\[
\beta\zeta=D_V.
\tag{26}
\]

Define

\[
\boxed{
\zeta^+=\zeta N_V(t)+D_V^2.
}
\tag{27}
\]

For the canonical deleted-factor precursor `C_V`, the deleted-factor
definition gives this formula with `zeta=C_V`.  Deleting an old character
contributes `C_VN_V(t)`, while deleting one member of the affine orbit
contributes

\[
D_V\,\frac{\partial N_V(t)}{\partial t}=D_V^2,
\tag{28}
\]

because the derivative of the linearized orbit polynomial is `D_V`.

Equations (25)--(27) imply

\[
\beta\zeta^+=D_VN_V(t)=D^+.
\tag{29}
\]

The Bockstein equation alone does not force the summand `D_V^2`: any additional
`Sq^1`-closed class would preserve (29).  The choice in (27) is the affine
recurrence selected because it makes the canonical deleted-factor construction
commute with the successor and propagates an arbitrary generated precursor by
the same norm.  Thus (23) is forced by the complete dual orbit, whereas (27)
is a distinguished compatible lift of that obstruction recurrence.

## 8. Affine precursor descent and exact split-chart genealogy

The precursor is not intrinsically one cohomology class.  It belongs to the
affine Bockstein fiber

\[
\mathcal P_V
=
\{z\in H^*(V;\mathbb F_2):\beta z=D_V\},
\tag{30}
\]

whose translation group is `ker(beta)`, equivalently the image of the
coefficient-lift map in the relevant exact sequence.  At normalized-cochain
level one must also quotient certified coboundary changes separately.

If

\[
\zeta'=\zeta+h,
\qquad \beta h=0,
\tag{31}
\]

then the successor rule gives

\[
(\zeta')^+-\zeta^+=hN_V(t).
\tag{32}
\]

By (25), `beta(hN_V(t))=0`.  Hence (27) is an affine map of precursor torsors
and descends through coefficient-liftable translations.  It never calls a
nonzero element of `ker(beta)` a coboundary.

In the generated rank-two sector, write the canonical deleted-factor precursor
as `C_2`.  Then

\[
c_{\rm gen}=u^2+uv,
\qquad
C_2=u^2+uv+v^2,
\]

so

\[
h_2=c_{\rm gen}+C_2=v^2\ne0,
\qquad \beta h_2=0.
\tag{33}
\]

The noncanonical genealogy is propagated by

\[
\boxed{
h^+=hN_V(t).
}
\tag{34}
\]

This retains the difference between the generated precursor and the canonical
deleted-factor precursor.  The difference is liftable, but not gauge-zero.

There is also a chart-level recovery statement.  The polynomial `N_V(t)` is
monic of degree `|V^*|` in `t`; the term `D_V^2` has no `t`.  Therefore the
coefficient of `t^{|V^*|}` in `zeta^+` is precisely `zeta`, and the same
leading-coefficient operation recovers `h` from `h^+`.  This is an exact
genealogy in the free chart.  It is not a claim that an unsplit quotient-line
object has a preferred coordinate.

## 9. Past-slice invisibility

Restrict the successor along the old-slice inclusion

\[
i:V\hookrightarrow V\oplus L.
\]

In the free chart this sets `t=0`.  Because the product (21) includes the
factor corresponding to `lambda=0`,

\[
N_V(0)=0.
\tag{35}
\]

It follows that

\[
i^*D^+=0,
\qquad
i^*\zeta^+=D_V^2.
\tag{36}
\]

The square `D_V^2` lies in `ker(beta)` and is coefficient-liftable.  Therefore
the new affine obstruction is invisible on the entire old context:

\[
i^*\zeta^+\sim0
\quad
\text{by translation through }D_V^2\in\ker\beta.
\tag{37}
\]

Equation (37) is an affine-orbit statement.  The raw cohomology class
`i^*zeta^+=D_V^2` need not be zero.

This separates two notions that should remain distinct.

- **Past-slice semantics:** the new obstruction vanishes when the new
  direction is unavailable.
- **Genealogical chart:** the old precursor is retained in the leading
  coefficient of the successor polynomial.

The past is not retrieved by restriction as an old address.  It survives as a
coherent factor in the construction that becomes visible only in the enlarged
context.

## 10. Executable obstruction-born audit

`genesis-obstruction-born-successor.mjs` checks the finite polynomial content
of Sections 5--9.  Its theorem surface includes:

- the admitted principal ideal and one-dimensional quotient `I/(mI)`;
- zero-ideal stutter;
- invariance under changes of basis in the old transport context;
- quotient invariance under a duplicated generator presentation in the
  principal obstruction-generator helper;
- the orbit norm (21);
- the recurrences (23) and (27);
- Bockstein closure;
- the exact past-slice identities `i^*D^+=0`, `i^*zeta^+=D_V^2`, and
  `Sq^1(D_V^2)=0`, with affine zero understood at cohomology level;
- the generated rank-two precursor and its nonzero liftable translation;
- propagation `h^+=hN_V(t)`; and
- separate audits of all affine-coset relabelings `t->t+mu` and all actual
  extension-splitting shears (21a); and
- deterministic replay and adversarial mutation rejection.

The executable certifies the declared type-former's algebra.  It cannot prove
that dual-line reification is forced by every acceptable semantics.  In
particular, creating `G(I)^vee` in transport degree one is present in the
script's input grammar.  In this executable the principal quotient `I/(mI)` is
modeled by exact row reduction on same-degree generator presentations; it is
not an implementation of arbitrary polynomial-ideal indecomposables.  The
audit materializes the transitions

\[
2\longrightarrow3\longrightarrow4\longrightarrow5.
\]

The generated precursor has respectively `2, 8, 62, 552` monomials in ranks
two through five, while the independently rebuilt canonical precursor has
`3, 10, 44, 240`.  The script checks `28` affine-coset relabelings, `28`
fixed-extension splitting shears, `174`
exhaustive `GL(2,2)` and `GL(3,2)` transformations, and a rank-four generating
set whose computed closure has order `20160`.  It rejects all `87/87`
certificate mutations.  Its deterministic certificate digest is

```text
c31f6c12da20e60b1617903e37fb790ac4f5e051e94f906c778876bcea1bab5e
```

The affine descent is checked at cohomology level.  The script does not
construct explicit `Z/4`-valued cocycle lifts for every propagated class.

## 11. Unconditional alternative: the universal homology cover

There is a separate way to generate new first homology without the degree
change in Section 6.  It is unconditional relative to a current connected
finite graph.

Let `X` be a connected graph and put

\[
V=H_1(X;\mathbb F_2).
\tag{38}
\]

The universal mod-two homology cover is the regular cover associated to

\[
\ker\!\left(
\pi_1(X)\longrightarrow H_1(X;\mathbb F_2)
\right).
\tag{39}
\]

Its deck group is `V`.  It is canonical up to `V`-equivariant isomorphism.
A spanning tree, voltage coordinates, and a basis of `V` are executable
charts, not additional invariants of the cover.

For any such `X`, the cover has `2^r` times as many vertices and edges as
`X`.  Euler characteristic therefore gives the rank formula (41) below for
every connected input graph of rank `r`.

For the bouquet `B_r` of `r` circles, the identity-voltage chart makes the
construction especially explicit.  It has

\[
|V|=2^r
\]

vertices and `r2^r` edges.  Let

\[
U_r\longrightarrow B_r
\]

be this cover and define

\[
W_r=H_1(U_r;\mathbb F_2).
\tag{40}
\]

Euler characteristic gives

\[
\boxed{
\dim W_r=1+2^r(r-1).
}
\tag{41}
\]

Thus the first two rank transitions are

\[
2\longmapsto5\longmapsto129.
\tag{42}
\]

The construction has a universal primitive.  In the voltage chart, assign to
a cover vertex `h in V` the value

\[
q(h)=h.
\tag{43}
\]

For every character `lambda in V^*`, the pullback of the corresponding base
one-cocycle is the exact cochain

\[
d(\lambda q).
\tag{44}
\]

Hence all `2^r` base binary character questions acquire primitives
simultaneously on one canonical cover.

There is also an exact syzygy description.  In the bouquet chart,

\[
0\longrightarrow W_r
\longrightarrow \mathbb F_2[V]^r
\xrightarrow{\partial}
\mathbb F_2[V]
\xrightarrow{\varepsilon}
\mathbb F_2
\longrightarrow0,
\tag{45}
\]

where the `i`th free generator maps to the augmentation element associated to
the `i`th voltage direction.  Thus `W_r` is the finite first syzygy carried by
the universal homology cover.  Deck translation acts nontrivially on `W_r`.

The finite coinvariant calculation is

\[
\boxed{
\dim (W_r)_V=\frac{r(r+1)}2.
}
\tag{46}
\]

Indeed, for the extension of the free group `F_r` by the cover subgroup,
the homology five-term sequence contains

\[
H_2(F_r;\mathbb F_2)
\longrightarrow H_2(V;\mathbb F_2)
\longrightarrow (W_r)_V
\longrightarrow H_1(F_r;\mathbb F_2)
\longrightarrow H_1(V;\mathbb F_2).
\]

The first term is zero and the final arrow is an isomorphism by the definition
of the universal mod-two homology quotient.  Hence

\[
(W_r)_V\cong H_2(V;\mathbb F_2),
\]

whose dimension is `r(r+1)/2` for `V=(C_2)^r`.

For `r=2,3,4,5`, equations (41) and (46) give respectively

\[
\dim W_r=5,17,49,129,
\qquad
\dim(W_r)_V=3,6,10,15.
\tag{47}
\]

`genesis-universal-syzygy-successor.mjs` checks finite cover fixtures,
primitives, deck actions, syzygy ranks, coinvariant dimensions,
chart-gauge boundaries, deterministic replay, and adversarial mutations.  The
isomorphism with `H_2(V;F_2)` above is theorem-derived; the executable checks
its predicted dimension but does not construct the five-term transgression.
It rejects all `25/25` declared fixture-record mutations.  Its deterministic
fixture-replay digest is

```text
7e48f5592fd2871dc3b3c99f6ba2d5a6524392e3062f0ec2771d495f8ac304a2
```

The current file materializes the ranks `2, 5, 17, 49, 129` and the two-step
orbit `2->5->129`.  Its materialization cap prevents applying the executable
again to the rank-129 graph.  The unrestricted iteration is therefore a
mathematical recursive specification, not a fully materialized executable
tower in this file.  The exported one-argument constructor
`compileGenesisUniversalSyzygySuccessor(currentGraph)` is the actual
state-only step and is used to materialize `2->5->129`; the runner separately
audits fixed fixtures and gauge controls.

The implementation computes chart-level cycle bases and deck translations,
but does not serialize the full `W_r` action matrices or the astronomical
family `W_r^*\setminus\{0\}`.  That dual policy is carried symbolically with
`materialized:false`.  The replay certificate now binds the public compiler
interface, explicit materialization cap, spanning-tree gauge digest, and these
scope flags.  In particular, no conclusion here depends on selecting or
exhaustively exposing a nonzero successor character.

### Boundary of the homology-cover branch

The universal homology cover exists whether or not the essential Bockstein
class is nonzero.  Therefore it genuinely creates new `H_1`, but the essential
obstruction is a sidecar rather than its cause.  No separate bouquet compiler
is needed for iteration: the output cover `U_X` is itself the next connected
graph.  The semantic carrier is the complete graph-cover tower, not the bare
vector space `W_r`.  Replacing that graph by an arbitrary bouquet of the same
rank would be an additional compiler and would discard its retained deck
action and incidence data.

This is a syzygy replacement, not an extension of the form
`V\oplus L`.
Equation (44) says that the induced cohomology map `p^*:V^*->W^*` is zero; by
finite-dimensional duality, the induced homology map `p_*:W->V` is zero as
well.  The old characters survive as explicit exact primitives and through the
deck action, not as an embedded old homology summand.

Finally, the rank of every successor remains recoverable from the graph.  The
state-only cover rule therefore passes the external-argument test but does not
invalidate the clock-reconstruction lemma of Section 1.

This branch is a strong unconditional control.  It prevents the weaker claim
that no natural finite process can generate new first homology, while leaving
the obstruction-causation question untouched.

## 12. The higher-Postnikov branch

The degree no-go in Section 3 also suggests a branch that does not regrade
anything.  Given the current essential class in degree `m`, adjoin its
universal primitive in degree `m-1` and retain the resulting higher
automorphism group.  The next semantic state is then a Postnikov or
omega-groupoid extension rather than a larger elementary abelian fundamental
group.

This branch is autonomous in a direct sense: the type of the current empty
question determines the dimension of the cell that resolves it.  It needs no
rank counter and no higher-to-first-transport converter.  Its successor
direction is nevertheless a higher direction, so the Dickson recurrence of
Section 7 does not apply to it without another comparison functor.

The three branches can now be stated without ambiguity.

| branch | new structure | obstruction-caused | additional declaration |
|---|---|---:|---|
| dual-line reification | one ordinary quotient line | yes, relative to admitted `I` | regrade the obstruction-generator dual `G(I)^vee` into transport degree one; its identification with the lift-stack band is unproved |
| universal homology cover | new ordinary `H_1` and syzygy | no | current graph and the mod-two homology-cover type-former |
| ordinary primitive/Postnikov | higher homotopy direction | yes | no degree lowering, but no new ordinary line |

None of the three rows alone asserts non-soficity or an analytic Stokes/Hodge
escape.

## 13. Generated, derived, and declared

The present research chain has generated or exactly derived the following.

- The rank-two transport context `E_2` and the `D_8` precursor
  `c_gen=u^2+uv`.
- The selected trivial-action `Z/4` policy's essential obstruction
  `D_2=uv(u+v)`.
- Global nonvanishing and genuine cocycle liftability on every proper
  subgroup.
- The principal essential ideal `(D_n)`, its indecomposable line, and the
  basis-free identities (21)--(29), once the higher elementary-abelian context
  is supplied.
- Affine propagation of the generated noncanonical translation.
- The universal homology-cover and syzygy successor relative to a current
  finite graph.
- The Postnikov degree obstruction (10).

The following remain declared inputs or type choices.

- Admission of the obstruction ideal `I` as the causal trigger.
- Endogenous selection of the trivial-action `Z/4` coefficient policy.
- Dual-line reification from the high-degree obstruction-generator quotient to
  ordinary transport degree one.
- The free split chart used to express `t` and the polynomial genealogy; after
  forgetting it, only the quotient line and translation torsor are canonical.
- A rule proving that the newly generated universal element, rather than a
  supplied closure policy, admits the next obstruction ideal.
- For the homology-cover branch, the choice to retain a finite connected graph
  and its universal mod-two homology cover as the semantic carrier.
- A comparison theorem, if desired, between the ordinary-line and
  higher-Postnikov branches.

The higher Dickson classes remain classical algebraic invariants.  The purpose
of the successor construction is to test a generation law around them, not to
rename those invariants as new mathematics.

## 14. Exact next gate

The next theorem should be phrased in the category of banded question objects,
not as another polynomial identity.

> Starting from the generated rank-two universal element and its selected
> relation policy, construct an admitted obstruction ideal `I_X` functorially
> from the full local lift object.  Prove that its indecomposable quotient
> `G_X=I_X/(m_XI_X)` is the translation band of that question.  Then either:
>
> 1. derive the free quotient-line successor from an independently stated
>    semantic universal property, or retain dual-line reification as an explicit
>    axiom; and
> 2. prove that the generic element of the resulting successor constructs the
>    next admitted lift object and its affine precursor, without consulting
>    rank, a future invariant table, or a chosen torsor origin.

The executable falsification suite for that theorem must include:

1. redundant-generator and contractible-presentation invariance;
2. zero-ideal and resolved-question stutter;
3. state cloning across different process histories;
4. removal or poisoning of every serialized stage field;
5. arbitrary old-basis changes and quotient-chart shears;
6. fresh-name permutations;
7. cohomologous normalized representatives;
8. nonzero coefficient-liftable translations that are not coboundaries;
9. replacement of the `Z/4` policy by the split policy;
10. an explicit `pi_1` audit preventing a higher primitive from being
    mislabeled as an ordinary direction; and
11. deletion of all future Dickson and precursor data from the runtime.

Passing those tests would establish a counter-free successor relative to a
fully declared semantic category.  A separate theorem would still be needed
for non-soficity, a bounded-feature architectural separation, or an analytic
escape statement.
