# Genesis Interchange: a torsor-valued attachment square

## Status: exact minimal finite interaction theorem

This note constructs the first project example in which two individually
elementary obstruction-representing attachments generate retained interaction
that is neither a chosen matrix convention nor a mere mismatch of endpoint
sizes.

The base object is the one-vertex bouquet with two typed loops.  Attaching a
primitive for either loop exposes two localized copies of the other
obstruction.  The load-bearing semantic rule is that the next repair must
represent the **entire deck orbit** of those localized obstructions, rather
than only their invariant sum.  Applying that rule in the two possible orders
produces two eight-state charts.  They are coherently isomorphic, but the space
of coherent comparisons is an affine two-element torsor with no
gauge-invariant origin.

More importantly, the common transport is not a product of the two first
repairs.  Its monodromy is the nonabelian group

\[
1\longrightarrow C_2\longrightarrow D_8
\longrightarrow C_2^2\longrightarrow 1,
\]

and this central extension is non-split.  Equivalently, the two quotient
directions have the nonzero commutator pairing

\[
\omega((x,y),(x',y'))=xy'+x'y.
\]

The two orders are gauge-related presentations of this same extension, not
distinct curvature classes.  The bilinear term `xy` in their change of chart
is forced by continuation.  It is not inserted as an external curvature
matrix.  The non-split extension is the interaction certificate; the
two-element comparison torsor is the separate, expected ambiguity in choosing
a central primitive origin.

The result is finite and classical in its ingredients.  It proves neither
non-soficity nor a new Hodge or Stokes theorem.  Its importance for genesis is
structural: a comparison question becomes inhabited only after both repair
histories exist, its answers form a torsor rather than a preferred scalar, and
the retained genealogy carries a non-split interaction erased by the
four-state terminal quotient.

The exact executable companion is
[`genesis-interchange-square.mjs`](genesis-interchange-square.mjs).

## 1. Orbit-representing attachments

Let `X` be a finite connected directed multigraph and work over
\(\mathbb F_2\).  Suppose

\[
\mathcal C=(c_1,\ldots,c_k)\subset C^1(X;\mathbb F_2)
\]

has linearly independent cohomology classes.  Define
\(J_{\mathcal C}X\) by

\[
V(J_{\mathcal C}X)=V(X)\times\mathbb F_2^k
\]

and lift an edge \(e:u\to v\) from a sheet \(h\) as

\[
(e,h):(u,h)\longrightarrow
\bigl(v,h+(c_1(e),\ldots,c_k(e))\bigr).
\tag{1}
\]

The projection \(\pi:J_{\mathcal C}X\to X\) is a regular cover.  In the
displayed chart, its coordinate functions \(q_i(v,h)=h_i\) obey

\[
\delta q_i=\pi^*c_i.
\tag{2}
\]

Independence of the classes means that the period map

\[
H_1(X;\mathbb F_2)\longrightarrow\mathbb F_2^k,
\qquad
[\gamma]\longmapsto
\left(\int_\gamma c_1,\ldots,\int_\gamma c_k\right)
\]

is surjective.  Hence the lifted graph is connected.

### Theorem 1: simultaneous-primitive representability

For every graph map \(p:Y\to X\), there is a natural bijection

\[
\operatorname{Hom}_{\mathbf{Graph}/X}(Y,J_{\mathcal C}X)
\cong
\left\{(r_1,\ldots,r_k):
\delta r_i=p^*c_i\text{ for all }i\right\}.
\tag{3}
\]

#### Proof

A map over `X` has a unique sheet-coordinate function
\(r:V(Y)\to\mathbb F_2^k\).  It preserves a lifted edge precisely when

\[
r(\operatorname{head}f)-r(\operatorname{tail}f)
=(c_1(pf),\ldots,c_k(pf)).
\]

These are exactly the componentwise primitive equations.  Conversely, a
tuple satisfying them maps each vertex to its base vertex and sheet tuple;
Equation (1) then supplies the unique image of each edge.  The constructions
are inverse and natural.  QED.

Changing the origins of the primitives translates the sheet coordinates.
Thus an unbased attachment canonically supplies a deck torsor of primitive
tuples, not a preferred tuple.

For a based connected cover `Y -> X`, Equation (3) is equivalently the usual
terminal factorization statement: the pulled-back classes are all exact if
and only if `Y` has a based map to `J_C X`, and that based map is unique.
Thus `J_C X` is the coarsest based connected simultaneous trivializer of the
declared tuple.  Without normalized primitive values, the factorization maps
form the corresponding deck torsor.

## 2. The smallest two-obstruction seed

Let `A` be the bouquet with one vertex and two semantically typed directed
loops `a` and `b`.  Define scalar obstruction cochains

\[
o=1_a,
\qquad
p=1_b.
\tag{4}
\]

Both are nonexact: a vertex coboundary vanishes on every loop, whereas `o`
and `p` have nonzero periods.

The first `o`-attachment is the two-state cover

\[
J_oA=\{x\in\mathbb F_2\},
\qquad
a:x\mapsto x+1,
\quad
b:x\mapsto x.
\tag{5}
\]

The first `p`-attachment is

\[
J_pA=\{y\in\mathbb F_2\},
\qquad
a:y\mapsto y,
\quad
b:y\mapsto y+1.
\tag{6}
\]

Each first attachment has two vertices, four directed transition `1`-cells,
and directed-one-complex cycle rank three.  All rank counts in the finite
square treat each declared directed transition as its own `1`-cell; they do
not identify opposite involutive darts as one undirected edge.

On `J_oA`, the two lifted `b`-loops give cochains

\[
p_0=1_{\text{the }b\text{-loop at }x=0},
\qquad
p_1=1_{\text{the }b\text{-loop at }x=1}.
\tag{7}
\]

Their classes are independent because each is detected by its own loop.  The
deck involution \(x\mapsto x+1\) swaps them.  Consequently no
deck-invariant rule may select just one localized class.  The intrinsically
visible residual object is the full orbit

\[
\mathcal P_o=\{p_0,p_1\}.
\tag{8}
\]

Symmetrically, on `J_pA` the lifted `a`-loops give a deck-swapped independent
orbit

\[
\mathcal O_p=\{o_0,o_1\}.
\tag{9}
\]

### Whole-localized-orbit doctrine

The whole orbit can be derived from a precise conditional locality axiom.
Equip a directed semantic graph `J` with a declared Boolean algebra

\[
B_J\subseteq C^0(J;\mathbb F_2)
\]

of currently observable vertex predicates.  For an idempotent `e` in `B_J`
and a declared residual edge cochain `c`, define causal tail localization by

\[
(e\mathbin{\triangleright}c)(\gamma)
=e(\operatorname{tail}\gamma)c(\gamma).
\tag{9a}
\]

If `At(B_J)` is the set of atomic idempotents, define the current
locality-obstruction space

\[
L_J(c)=
\operatorname{span}{[e\mathbin{\triangleright}c]:
e\in\operatorname{At}(B_J)}
\subseteq H^1(J;\mathbb F_2).
\tag{9b}
\]

The repair compiler represents this **cohomology span**, not one raw deck
coordinate per atom.  Exact localizations require no attachment, and linearly
dependent ones share a primitive coordinate.  The resulting connected cover
has degree

\[
2^{\dim L_J(c)}
\]

and is terminal among based connected covers on which every class in
`L_J(c)` pulls back to zero.

On `J_oA`, the new primitive `x` generates the full two-atom algebra with
sheet predicates `e_0,e_1`.  The remaining pulled-back residual decomposes as

\[
e_0\mathbin{\triangleright}\pi^*p=p_0,
\qquad
e_1\mathbin{\triangleright}\pi^*p=p_1,
\qquad
\pi^*p=p_0+p_1.
\tag{9c}
\]

Since `[p_0]` and `[p_1]` are independent,

\[
\dim L_{J_oA}(\pi^*p)=2.
\tag{9d}
\]

Thus the locality-closed repair is forced to have degree four over `J_oA`.
The deck involution permutes the two atoms and their localizations, so the
subspace is intrinsic without a sheet choice.  The reverse order is
identical.  This gives an exact form to the semantic requirement:

> Once a repair has separated a deck orbit of locations, every currently
> distinguishable localized member of the remaining obstruction orbit is an
> obligation.  The next attachment represents simultaneous primitives for
> the whole orbit.

This is stronger than asking only that the pullback of the original base
cochain become exact.  It now follows from current distinguishability plus
locality closure, rather than from a hand-selected orbit member.  Relative to
that axiom, the invariant-sum repair is inadmissible because it leaves both
independent atomic obligations nonexact.

The axiom remains a declared part of the semantic type-former.  It has four
important boundaries here:

- localization is defined on the declared **cochain representative**; it does
  not automatically descend to a cohomology-class operation;
- tail localization is natural for tail/head-preserving directed
  isomorphisms, not arbitrary reorientation;
- the construction is refinement-generative: pulling an old atom into a
  refinement generally produces a sum of new atoms, so naturality is lax
  rather than equality under refinement; and
- using the full vertex algebra commits the semantics to sheet-resolving
  observables.  Keeping only deck-invariant predicates recovers the flat
  invariant-sum policy.

Accordingly, the theorem conditionally forces the whole orbit from a precise
locality-closed obligation doctrine; it does not prove that this doctrine is
the unique possible semantics.  Its recursive growth must also be governed by
an active-residual discipline to avoid meaningless mechanical overgeneration.

## 3. The two attachment orders

Attach the complete orbit (8) after (5).  In raw coordinates the vertices are

\[
(x,u_0,u_1)\in\mathbb F_2^3.
\]

The `a` edge changes `x`, while the `b` edge toggles \(u_x\).  Introduce

\[
y=u_0+u_1,
\qquad
z=u_1.
\]

The resulting `op` chart is

\[
\boxed{
a(x,y,z)=(x+1,y,z),
\qquad
b(x,y,z)=(x,y+1,z+x).
}
\tag{10}
\]

In the reverse order, use raw coordinates \((y,v_0,v_1)\), with `b`
changing `y` and `a` toggling \(v_y\).  Set

\[
x=v_0+v_1,
\qquad
z'=v_1.
\]

The `po` chart is

\[
\boxed{
a(x,y,z')=(x+1,y,z'+y),
\qquad
b(x,y,z')=(x,y+1,z').
}
\tag{11}
\]

Both graphs have eight vertices and sixteen directed transition `1`-cells, so
their directed-one-complex cycle rank is

\[
16-8+1=9.
\]

Both are connected.  They retain canonical side projections to the two
first-order repairs:

\[
(x,y,z)\longmapsto x\in J_oA,
\qquad
(x,y,z)\longmapsto y\in J_pA.
\tag{12}
\]

Write `W` for the common four-state quotient retaining `(x,y)`.  It is the
simultaneous attachment of the two original base classes.  Equations (12)
jointly give both eight-state routes a degree-two map to `W`.

## 4. The comparison is a torsor

A **`W`-coherent comparison** is a label-preserving graph isomorphism from
(10) to (11) over the common quotient `W`, equivalently one that preserves
both coordinates in (12).  This is the declared coherence notion for the
present square; preservation of a richer localized-obstruction ancestry is
not proved.  Such a map must have the form

\[
\theta(x,y,z)=(x,y,z+f(x,y)).
\tag{13}
\]

Intertwining `a` gives

\[
f(x+1,y)+f(x,y)=y,
\tag{14}
\]

and intertwining `b` gives

\[
f(x,y+1)+f(x,y)=x.
\tag{15}
\]

The exact solutions are

\[
f(x,y)=xy+\epsilon,
\qquad
\epsilon\in\mathbb F_2.
\tag{16}
\]

### Theorem 2: torsor-valued interchange

The coherent comparison space is

\[
\boxed{
\operatorname{Cmp}_A(o,p)
=\{\theta_0,\theta_1\},
\qquad
\theta_\epsilon(x,y,z)
=(x,y,z+xy+\epsilon).
}
\tag{17}
\]

Central translation

\[
c(x,y,z)=(x,y,z+1)
\tag{18}
\]

acts freely and transitively on this comparison space.  It preserves `x`,
`y`, and both labeled continuations.  Therefore there is no comparison fixed
by every automorphism of the unbased square.

The unbased answer to the comparison question is the affine torsor (17), not
either value of \(\epsilon\).  Choosing compatible primitive origins selects a
chart and hence one member, just as choosing an integration constant selects a
primitive.  In particular, if the source and target base sheets
`(0,0,0)` are fixed, only \(\theta_0\) remains.  The torsor certainly has
points; the precise no-choice statement is that it has no point natural under
the independent central target gauge.  This generic primitive-origin
ambiguity is not, by itself, interaction curvature.

If compatibility with `W` is dropped, the set of label-preserving graph
isomorphisms over the one-vertex bouquet `A` has eight elements.  It is a
torsor for the full deck group.  The `W`-coherent comparisons form its central
two-element subtorsor.

## 5. The invariant interaction: a non-split extension

In either chart,

\[
a^2=b^2=1,
\]

while the commutator word obeys

\[
abab(x,y,z)=(x,y,z+1)=c(x,y,z).
\tag{19}
\]

Thus

\[
c^2=1,
\qquad
c\text{ is central},
\qquad
ab=bac.
\tag{20}
\]

The generated transport group is the order-eight dihedral group, equivalently
the unitriangular Heisenberg group over \(\mathbb F_2\):

\[
\langle a,b,c\mid
a^2=b^2=c^2=1, c\text{ central}, ab=bac\rangle
\cong D_8.
\tag{21}
\]

It acts regularly on the eight states.  Quotienting by the central coordinate
gives the four-state transport `C_2^2` on `(x,y)`.  Hence (21) gives a central
extension

\[
1\to\langle c\rangle\to D_8\to C_2^2\to1.
\tag{22}
\]

### Theorem 3: the extension does not split

There is no homomorphic section \(C_2^2\to D_8\) of (22).

#### Proof

Any section would lift the two standard commuting involutions of `C_2^2` to
commuting elements in their prescribed cosets.  Every lift of the `x`
direction is `a` or `ac`, and every lift of the `y` direction is `b` or `bc`.
Because `c` is central, all four possible commutators equal

\[
[a,b]=c\ne1.
\]

No such pair commutes.  QED.

The associated alternating commutator pairing on the quotient is

\[
\omega((x,y),(x',y'))=xy'+x'y.
\tag{23}
\]

It is nonzero and invariant under changing lifts by `c`.  This is the robust
interaction certificate.  Merely observing that two endpoint presentations
differ would not suffice: Equation (23) survives removal of coordinate names,
primitive origins, and independent product factors.

The cohomological relation between the order charts is exact.  Write quotient
elements as `u=(x,y)` and `v=(x',y')`.  Right multiplication in the two normal
orders is encoded by the normalized extension cocycles

\[
\kappa_{op}(u,v)=xy',
\qquad
\kappa_{po}(u,v)=yx'.
\tag{23a}
\]

Both satisfy the group `2`-cocycle identity.  For the `1`-cochain

\[
\phi(x,y)=xy,
\]

one has

\[
\boxed{
\kappa_{op}+\kappa_{po}=\delta\phi.
}
\tag{23b}
\]

Thus the two orderings are different representatives of the same nonzero
extension class.  The bilinear chart correction in (16) is precisely the
gauge cochain `phi`; it is forced by (14)-(15), and deleting it makes the
proposed comparison fail on both labeled actions.  The gauge-invariant
alternating part of either cocycle is Equation (23).

Three different statements must remain separate:

1. the connected central cover of `W` has no cover section;
2. the group extension (22) has no homomorphic splitting; and
3. the comparison torsor has no central-gauge-natural preferred point.

Only the second statement is the interaction-specific non-splitting theorem.
The third is ordinary unbased primitive gauge.

## 6. Exact flat control

After the first `o`-repair, the pullback of the original base cochain `p` is
the invariant sum

\[
p_0+p_1.
\]

If the second repair attaches a primitive only for this sum, the two orders
both give

\[
(x,y)\in\mathbb F_2^2,
\qquad
a(x,y)=(x+1,y),
\qquad
b(x,y)=(x,y+1).
\tag{24}
\]

This is the ordinary fiber product of the first two covers.  The comparison
preserving both side projections is unique, the transport group is the split
product `C_2^2`, and the commutator pairing vanishes.

Each flat route has four vertices, eight directed transition `1`-cells, and
directed-one-complex cycle rank five.

Thus the distinction is exact:

\[
\begin{array}{c|c|c}
\text{second semantic obligation}&\text{states}&\text{interaction}\\
\hline
\text{invariant pullback only}&4&C_2^2\text{, split}\\
\text{whole localized orbit}&8&D_8\text{, non-split}.
\end{array}
\tag{25}
\]

The extra bit is not arbitrary memory.  It is the central primitive needed to
realize both localized obligations while retaining their ancestry.

## 7. Why order-dependent size is not enough

The universal mod-`p` homology-cover constructor gives a decisive negative
control.  For a connected rank-`r` graph, let \(\Phi_p(G)\) be the cover
representing its complete mod-`p` homology obstruction.  It has degree
\(p^r\), and its cycle rank is

\[
R_p=1+p^r(r-1).
\]

Consequently

\[
\deg(\Phi_q\Phi_pG)=p^r q^{R_p}.
\tag{26}
\]

For the rank-two bouquet and `(p,q)=(2,3)`, the two orders have degrees

\[
4\cdot3^5=972,
\qquad
9\cdot2^{10}=9216.
\tag{27}
\]

Neither based cover maps to the other.  Nevertheless, both over-refine the
degree-36 cover that kills only the original mod-2 and mod-3 classes.  Their
canonical common-refinement diamond has degree

\[
\frac{972\cdot9216}{36}=248832,
\]

and its residual deck object over the degree-36 base splits into independent
factors of orders `27` and `256`.

Therefore (27) proves noncommutation and rank amplification, but not
interaction curvature.  It is a large flat comparison control.  A common
refinement exists for arbitrary finite covers; declaring every such span to be
a higher cell would make existence vacuous unless a non-split interaction or
an obstruction to filling is also retained.

## 8. A three-level comparison taxonomy

The examples force a distinction that was previously blurred.

### Level 0: flat comparison

The coherent comparison type is canonically inhabited, and after semantic
quotient its interaction extension splits.  Equation (24) and the mod-2/mod-3
diamond are controls of this kind, despite the latter's enormous order effect.

### Level 1: torsorial comparison

The comparison type is inhabited but has no gauge-equivariant global choice.
This alone is generic for unbased primitives.  A separate non-split extension,
pairing, or other invariant is required to certify interaction.  Equation
(17) supplies the torsor here; Equations (22)-(23), not the torsor alone,
supply the first exact project interaction certificate.

### Level 2: obstructed comparison

The required coherent comparison type is empty.  If the current semantic
category represents coherent common fillers, genesis may attach the
representing object and thereby make a formerly ill-typed comparison
inhabited.  Formally, for boundary histories `P,Q` over `B`, the desired next
object `K(P,Q)` must satisfy a natural equivalence

\[
\operatorname{Hom}_B(Y,K(P,Q))
\simeq
\operatorname{Fill}_{P,Q}(Y)
\tag{28}
\]

for the explicitly declared filler functor.  Equation (28), not “freely add a
symbol called curvature,” is the universal higher-attachment rule.

No semantically forced finite Level-2 example is claimed here.  Asymmetric
rules can manufacture empty comparison spaces, but that would externalize the
answer.  Finding an endogenous obstruction for (28) is the next frontier.

## 9. Minimality and falsifiers

Relative to the whole-localized-orbit doctrine, the construction is minimal:

1. One base loop has one-dimensional first cohomology and cannot support two
   independent typed obstruction directions.
2. The two-loop bouquet is the smallest seed.
3. A nontrivial first deck orbit has two members.
4. Simultaneously trivializing two independent mod-2 classes requires a
   degree-four second attachment.
5. The composite therefore needs at least \(2\cdot4=8\) states, attained by
   (10)-(11).

The executable treats each of the following as a falsifier:

- either localized orbit class is exact or the two are dependent;
- the first deck involution fails to swap the localized pair;
- either eight-state route is disconnected;
- a displayed primitive fails its edge equation;
- the coherent comparison count differs from two;
- either comparison differs from (17);
- central gauge has a fixed comparison or fails to act transitively;
- the transport group is not order eight;
- the commutator is trivial or the group extension admits a homomorphic
  section;
- the invariant-sum control fails to commute;
- deleting the bilinear term still intertwines both routes; or
- a mutation of one localized voltage leaves the full certificate unchanged.

## 10. What has and has not been earned

The exact result is:

> Whole-orbit primitive attachment on the minimal two-loop seed produces two
> connected degree-eight order charts of directed-one-complex rank nine.  They
> are two gauges for the
> same interaction object: the non-split central extension given by the
> order-eight dihedral group over `C_2^2`.  Their `W`-coherent isomorphisms are
> exactly `z -> z+xy+epsilon`; this two-element set is a central primitive-origin
> torsor, while the nonzero commutator pairing is the genuine interaction
> invariant forced by the generated continuation laws.

This earns several structural conclusions.

- A later comparison observable can be relational: neither first-order repair
  contains a preferred value for it.
- “Same terminal quotient” does not mean “same generated semantics.”  The
  four-state quotient forgets the central extension.
- Exact compositional memory can be a universal primitive for localized
  obligations, rather than a stored address or replay log.
- Curvature should be tested by non-split interaction or higher nonfillability,
  not by raw noncommutation, endpoint inequality, or state count.
- The natural output of semantic comparison may be a torsor or groupoid, not a
  scalar probability.
- Two attachment orders can be gauge charts of one curved object.  Order
  dependence and inequivalent curvature classes are different claims.

The theorem does **not** yet establish:

- an internally generated attachment modality—the two loop types and the
  whole-orbit type-former are declared;
- a non-sofic or infinite transport object—the monodromy is finite `D_8`;
- noncomputability, unbounded primitive cost, or a new complexity separation;
- a Hodge decomposition, Stokes theorem, Navier-Stokes estimate, or consequence
  for any open problem;
- a comparison-absent higher representer;
- inequivalent curvature classes for the two orders—the routes realize the
  same extension class; or
- mathematical priority over related classical covering, extension, torsor,
  or cohomological mechanisms.

## 11. Successor test: coherence must become a new semantic level

The immediate three-direction state extension has now been constructed and
tested in [`genesis-coherence-boundary.md`](genesis-coherence-boundary.md).  It
generates a nontrivial nested deck commutator, but the two complete cube
reorderings agree: the apparent third phase occurs twice and cancels.  This is
a strictification boundary.  More state and ordinary function composition do
not, by themselves, generate a weak associator.

The next target must therefore promote comparisons to first-class morphisms
and generate morphisms **between** them.  Its certificate must show one of the
following after all gauge and product factors are removed:

\[
\boxed{
\text{a nontrivial associator/3-cocycle}
\quad\text{or}\quad
\text{an empty coherent-filler type represented only after attachment}.}
\]

The companion note exhibits an explicit nontrivial `3`-cocycle on a small
comparison groupoid, together with a bar-cycle Stokes certificate, but keeps
it as an independent higher-carrier control: the state process has not yet
generated that cocycle.  The precise frontier is a representable
comparison-obstruction presheaf deriving the higher cell from the nested
defect.  That would move genesis from primitive torsors to algebraogenesis of
coherence.  Its native boundary law—not a Laplacian installed on a convenient
finite example—is the point where genealogical Stokes begins.
