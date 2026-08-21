# Homology-Cover Algebraogenesis

## Status: exact obstruction-representing attachment theorem

The endogenous Stokes-escape generator produced new target values, but its
query rows were already available in a fixed grammar. This note constructs a
stronger object. A current finite semantic graph computes its own complete
mod-2 obstruction space. That obstruction determines a finite covering graph
on which a previously uninhabited primitive type becomes inhabited.

The attachment is not selected from a list of future coordinates. It is the
principal cover associated to the current graph's entire first homology space

\[
V_G=H_1(G;\mathbb F_2).
\]

It has an exact representability property, is natural under graph
isomorphisms up to deck gauge, and attaches the whole obstruction space rather
than one chosen class. Its non-free content is the old graph's nonzero
monodromy together with a terminal factorization property; the contrast with
the disconnected trivial product is one finite witness, not the definition.

The construction can be iterated with no stage counter. Starting from the
two-loop bouquet, the successive cycle ranks are

\[
2,\quad5,\quad129,\quad
1+128\cdot2^{129},\ldots
\]

even though every individual stage is finite and computable in principle.
This is the first project construction in which the current topology generates
the obstruction instance, representing cover, and new cells of its next
attachment, and in which non-freeness is detected by native transport rather
than by a chosen metric. The type-former itself remains declared in advance.

The claim is **internal semantic creation relative to a declared stage
language**, not absolute ontological creation. A fixed external program can
enumerate the tower. What is proved is that the next primitive has no
inhabitant in the current vertex-observable semantics and is represented only
after the obstruction-derived extension. The ingredients are classical finite
graph, cochain, and covering-space mechanisms; no novelty or priority claim is
made for those ingredients or their standard universal properties.

The exact executable companion is
[`homology-cover-algebraogenesis.mjs`](homology-cover-algebraogenesis.mjs).

## 1. Current semantics and an empty primitive type

Let `G` be a finite connected multigraph. Loops and parallel edges are
allowed. Work over `F_2`. Its chain complex is

\[
C_1(G)\xrightarrow{\partial}C_0(G),
\]

where the boundary of an edge with endpoints `u,v` is `u+v`. A loop has zero
boundary. Because the graph has no two-cells,

\[
H_1(G;\mathbb F_2)=\ker\partial.
\]

For exact bookkeeping, each topological edge has a chosen tail and head.
`Graph` below means the category of finite directed multigraph presentations
and tail/head-preserving edge maps. Connectivity and spanning trees use the
underlying undirected graph. Reversing a chosen edge orientation changes none
of the mod-2 chain or cochain data, but this convention makes the slice-map
statement in Theorem 1 unambiguous and matches the executable.

Write

\[
r(G)=\dim H_1(G;\mathbb F_2)=|E|-|V|+1.
\]

The current scalar observables are vertex functions

\[
C^0(G;\mathbb F_2)=\mathbb F_2^{V(G)}.
\]

For an edge cochain `c in C^1(G;F_2)`, define its primitive type

\[
\operatorname{Prim}_G(c)
=\{q\in C^0(G;\mathbb F_2):\delta q=c\}.
\]

This is a genuine type of admissible current questions: an inhabitant is a
vertex question whose change along every edge is the prescribed semantic
transport. When `[c]` is nonzero in `H^1(G;F_2)`, the type is empty.

Thus “ill-typed before attachment” has a precise relative meaning here. The
old language can state the transport obligation, but it has no vertex
observable satisfying it. The future primitive is not an old observable with
an `inactive` flag.

## 2. The whole obstruction, without choosing a basis

Set

\[
V_G=H_1(G;\mathbb F_2).
\]

There is a canonical cohomology class

\[
[\alpha_G]\in H^1(G;V_G)
\cong\operatorname{Hom}(H_1(G;\mathbb F_2),V_G)
\]

corresponding to the identity map on `V_G`. We call it the **universal
homology obstruction**.

A rooted spanning tree gives one finite presentation of this class. Each
non-tree edge determines a fundamental cycle and hence a basis vector of
`V_G`. Define a `V_G`-valued edge cochain `alpha_T` by

\[
\alpha_T(e)=
\begin{cases}
0,&e\text{ lies in the spanning tree},\\
[\gamma_e],&e\text{ is a non-tree edge}.
\end{cases}
\]

Its integral around a cycle is exactly that cycle's homology class. Therefore
`[alpha_T]=[alpha_G]`.

Changing the tree, root, or displayed basis changes the chart by a vertex
gauge and, when coordinates `F_2^r` are used for `V_G`, a linear coordinate
change. It does not change the obstruction class or the **deck-equivariant
isomorphism class** of the attached cover. An unbased canonical isomorphism is
not asserted: deck translation is precisely the residual ambiguity. The basis
is an executable chart, not semantic structure.

### No old universal primitive

If `r(G)>0`, then

\[
\operatorname{Prim}_G(\alpha_T)=\varnothing.
\]

Indeed, if `alpha_T=delta q`, its integral around every cycle would vanish.
But its integral around a fundamental cycle is the corresponding nonzero
basis vector. Equivalently, `[alpha_G]` is the identity of the nonzero vector
space `V_G` and cannot be zero.

No particular scalar cocycle was selected. The obstruction object is the
entire current homology space and is functorial under current graph
symmetries.

## 3. The obstruction-representing attachment

Choose an executable representative `alpha_T` of the universal class. Define
the graph

\[
\pi_G:E_G\longrightarrow G
\]

by

\[
V(E_G)=V(G)\times V_G.
\]

For every base edge `e:u--v` and every `h in V_G`, attach a lifted edge

\[
(e,h):(u,h)\longrightarrow(v,h+\alpha_T(e)).
\]

The deck group `V_G` acts by translations in the second coordinate. The
cover therefore carries no preferred sheet or zero primitive; its intrinsic
fiber is an affine `V_G`-torsor.

In the chosen chart, define a tautological primitive

\[
Q_G(v,h)=h.
\]

Then every lifted edge satisfies

\[
\boxed{\delta Q_G=\pi_G^*\alpha_T.}
\]

The formerly empty primitive type is now inhabited. A deck translation changes
`Q_G` by an additive constant, exactly the expected primitive gauge. Thus the
canonical datum is the `V_G`-torsor of primitives (equivalently, the diagonal
section of `E_G times_G E_G`), not a preferred vector-valued function.

## 4. Representability theorem

For any graph map `p:Y->G`, let

\[
\operatorname{Triv}_{\alpha_G}(Y,p)
=
\{q:V(Y)\to V_G:\delta q=p^*\alpha_T\}.
\]

### Theorem 1: obstruction-representing cover

There is a natural bijection

\[
\boxed{
\operatorname{Hom}_{\mathbf{Graph}/G}(Y,E_G)
\cong
\operatorname{Triv}_{\alpha_G}(Y,p).
}
\]

Consequently, in the chosen cocycle chart, `E_G` represents the functor of
trivializations of the complete current homology obstruction. Intrinsically,
it represents sections of the pulled-back principal `V_G`-torsor classified by
the identity class `[alpha_G]`.

#### Proof

A map `F:Y->E_G` over `G` has a unique second-coordinate function `q` on
vertices. Because `F` maps every edge of `Y` to a lifted edge of `E_G`, its
endpoint coordinates differ by `alpha_T` of the projected edge. Hence
`delta q=p^*alpha_T`.

Conversely, given such a `q`, send a vertex `y` to `(p(y),q(y))`. An edge of
`Y` over `e` must then map to the unique lifted edge `(e,q(source))`; the
trivialization equation gives the required target. These constructions are
inverse and natural. QED.

Taking `Y=G` and `p=id` shows that a section of `E_G->G` is exactly an old
primitive of `alpha_G`; none exists when `r(G)>0`. Taking `Y=E_G` gives the
torsor of tautological primitives, with a particular member fixed only after a
sheet gauge is chosen.

This is the universal property missing from the fixed-row Stokes generator.
The obstruction is verified before attachment, and the attachment represents
its solutions. No predictor or adversarial target participates.

## 5. Every scalar cocycle becomes exact

### Theorem 2: simultaneous primitive completion

For every `c in C^1(G;F_2)`, the pullback `pi_G^*c` is exact on `E_G`.

#### Proof

The cohomology class of `c` is a linear functional

\[
\lambda_c:V_G\to\mathbb F_2.
\]

Therefore, for some vertex function `f`,

\[
c=\lambda_c\circ\alpha_T+\delta f.
\]

On the cover define

\[
q_c=\lambda_c\circ Q_G+f\circ\pi_G.
\]

Then

\[
\delta q_c
=\lambda_c\circ\pi_G^*\alpha_T+\pi_G^*\delta f
=\pi_G^*c.
\]

QED.

The full obstruction space is load-bearing. Selecting one cocycle would make
only one class exact. Attaching `V_G` makes every scalar class exact at once
and is transported by every automorphism of `G`, up to the unavoidable deck
gauge.

### Theorem 3: coarsest connected simultaneous attachment

Let `p:(Y,y_0)->(G,g_0)` be a based connected cover on which every
`F_2`-valued edge cocycle from `G` pulls back to an exact cochain. After fixing
a lift `e_0` of `g_0` in `E_G`, there is a unique based cover map

\[
Y\longrightarrow E_G\longrightarrow G.
\]

Thus `E_G` is the coarsest connected cover that simultaneously supplies
primitives for all current scalar cocycles: it is terminal among such based
covers. Without basepoints the map exists, but the set of choices is a torsor
under deck translation.

#### Proof

Choose a basis of `V_G^*`. Exact primitives for the corresponding scalar
components assemble into a `V_G`-valued primitive of `p^*alpha_T`. Normalize
its value at `y_0` to the sheet coordinate of `e_0`. Theorem 1 then gives the
unique based map to `E_G`. Dropping the normalization gives exactly the family
of deck-translated maps. QED.

## 6. Symmetry and the whole-orbit law

Every graph isomorphism

\[
\phi:G\longrightarrow G'
\]

induces

\[
\phi_*:H_1(G;\mathbb F_2)\longrightarrow H_1(G';\mathbb F_2)
\]

and an isomorphism class of principal-cover lifts

\[
E_G\longrightarrow E_{G'}
\]

intertwining their deck actions through `phi_*`. In spanning-tree coordinates
such a lift may include a vertex gauge; intrinsically its existence is forced
by the canonical Hurewicz kernel, while any two unbased lifts differ by deck
translation.

For automorphisms, the natural symmetry object is therefore the lift extension

\[
1\longrightarrow V_G\longrightarrow
\widetilde{\operatorname{Aut}}(G)\longrightarrow
\operatorname{Aut}(G)\longrightarrow1.
\]

A preferred strict `Aut(G)` action would require a coherent splitting, which
is not assumed. The earned statement is naturality in the groupoid of covers,
or pseudonaturality up to deck gauge.

There is consequently no need—and generally no equivariant way—to choose one
cycle or one scalar primitive. The compiler attaches the complete object
`H_1(G;F_2)`. Any automorphism orbit, stabilizer, and linear relation inside
the obstruction space is transported automatically.

For the bouquet with two loops `a,b`, loop exchange induces coordinate
exchange on `F_2^2`. The four-sheet attachment treats the two obstruction
directions symmetrically and also contains their mixed character. No hidden
lexicographic orientation is semantic.

## 7. Why this is not free append

As a bare vertex set, a spanning-tree chart writes

\[
V(E_G)=V(G)\times V_G.
\]

That does not make the attachment a semantic product. Its edge transport is

\[
h\longmapsto h+\alpha_T(e).
\]

### Theorem 4: transport non-freeness

If `G` is connected and `r(G)>0`, then:

1. `E_G` is connected;
2. the independent product attachment `G times V_G` with identity fiber
   transport has `2^r(G)` connected components; and
3. the true cover has surjective monodromy `pi_1(G)->V_G`, represents a
   nonzero principal-bundle class, and has no global section;
4. the two attachments are not isomorphic as covers or as transported
   semantic systems; and
5. every connected cover killing all old degree-one classes factors through
   `E_G` as in Theorem 3.

#### Proof

The holonomies of the fundamental cycles are a basis of `V_G`, so the
monodromy map is surjective and path lifts from any sheet reach every deck
translate. This proves connectedness and nontrivial coupling to the old graph.
If a section existed, it would be a primitive of `alpha_G`, contradicting
Section 2. In the identity-transport product, no path changes the fiber
coordinate, so each sheet is a separate component. Connectivity is invariant
under cover isomorphism, and the final assertion is Theorem 3. QED.

Connectedness alone is not a definition of non-free attachment: wedging on a
new loop is both connected and free. Here “non-free” is explicitly relative
to the category of principal covers retaining old-edge transport, where
surjective monodromy, no section, and terminal factorization are the
load-bearing witnesses.

The same distinction appears algebraically. The fiber observable algebra has
Walsh characters

\[
\chi_\lambda(h)=(-1)^{\lambda(h)},
\qquad \lambda\in V_G^*,
\]

with multiplication

\[
\chi_\lambda\chi_\mu=\chi_{\lambda+\mu}.
\]

Transport along `e` acts by

\[
T_e\chi_\lambda
=(-1)^{\lambda(\alpha_T(e))}\chi_\lambda.
\]

The whole interaction algebra of dimension `2^r` and its nontrivial transport
are forced by the obstruction. A baseline allowed to copy this exact transport
can reproduce the attachment, but then it has implemented the same
obstruction-derived local system and is no longer an independent free append.

## 8. Native viable continuation

Use the two-loop bouquet as the seed. There are two different continuation
directions, and they should not be conflated.

**Horizontal action continuation.** Compose every later cover back to the
bouquet. Its two oriented loop labels remain total actions: from every lifted
state there is one outgoing lift of `a` and one of `b`. Unique path lifting
therefore sends every infinite word in `{a,b}^N` to a native infinite path.

For any nonzero linear probe `lambda in V_G^*` and either label
`epsilon in F_2`, the fiber

\[
\{(v,h):\lambda(h)=\epsilon\}
\]

contains exactly half the sheets over each base vertex. Every state in either
fiber has the full Cantor space `{a,b}^N` of horizontal future-action
continuations.

**Vertical refinement continuation.** The next attachment is a surjective
finite cover, so every current state has `2^r` refinements. Starting from
`r>=2`, the recurrence keeps every later rank at least two. Hence every finite
compatible refinement path extends one step further, while each individual
stage remains finitely branching. Both character fibers therefore survive to
arbitrarily deep refinements; there is no claim of infinitely many immediate
children at a finite stage.

Hence attachment does not manufacture an inconsistent label merely to defeat
a predictor. Both answers and every finite action continuation are native to
one semantic cover committed before any later observer chooses a probe.

## 9. Iterated attachment genesis

Define a compiler on connected finite graphs:

\[
\Phi(G)=E_G.
\]

It reads only the current incidence data, computes the current cycle space,
and applies the representing-cover construction. It receives no stage number,
future graph, target tape, predictor, or catalogue of future coordinates.

If `G` has `v` vertices, `e` edges, and cycle rank `r`, then `Phi(G)` is a
connected cover of degree `2^r`, so

\[
v'=2^rv,
\qquad
e'=2^re,
\]

and

\[
\boxed{r'=1+2^r(r-1).}
\]

For `r>=2`, this is strictly larger than `r`. The next obstruction object is
computed from the enlarged graph itself and was not supplied as an indexed
member of a fixed coordinate family.

Starting from the rank-two bouquet:

| stage | vertices | edges | cycle rank | next cover degree |
|---:|---:|---:|---:|---:|
| 0 | 1 | 2 | 2 | 4 |
| 1 | 4 | 8 | 5 | 32 |
| 2 | 128 | 256 | 129 | `2^129` |
| 3 | `128*2^129` | `256*2^129` | `1+128*2^129` | enormous |

Every stage is a finite exact object. Materializing stage three is unnecessary:
the covering and Euler-characteristic certificate proves its dimensions
symbolically.

### No uniform finite faithful closure

At stage `n+1`, the fiber over one old vertex has `2^(r_n)` points, separated
by the complete family of deck characters. Any exact persistent interface that
preserves all those questions needs at least `2^(r_n)` distinguishable states,
or at least `r_n` binary coordinates. Since `r_n` is unbounded, no uniform
finite interface faithfully carries every generated primitive question.

This is an exact interface lower bound, not an uncomputability theorem. The
external tower is recursively enumerable, and the displayed recurrence makes
its size growth exceptionally computable.

## 10. Internal creation, not an absolute catalogue claim

A deterministic compiler with a finite seed has an externally enumerable
orbit. It would be false to claim that no infinite catalogue exists from an
omniscient external viewpoint.

The proved internal statement is narrower:

1. the current primitive type of `alpha_G` is empty;
2. the next sheet object and its cardinality are computed from the current
   graph's obstruction space `V_G`;
3. no stage index or future type is an input;
4. the representing attachment is forced up to deck-equivariant isomorphism;
5. the next primitive becomes inhabited only in the extended semantic graph;
   and
6. the reduct is not a constant independent product in the category retaining
   transport.

The constructor—finite graphs, `F_2` homology, and principal homology
covers—is fixed in advance. The theorem therefore creates a canonical
**internal object and its new cells**, not a new type-former. If the stage-zero
language contains `UniversalMod2Cover(G)`, or a universal `Code/Eval` object
interpreting all future graph covers, then this becomes instantiation or
activation inside that richer language. The theorem is explicitly relative to
the finite vertex-observable, cochain, and cover semantics declared above.

## 11. Exact controls and falsifiers

The executable audits the theorem against the following alternatives.

### Zero obstruction

For a tree, `H_1=0`; the deck group is trivial and `E_G=G`. The compiler
stutters rather than inventing a cell.

### Rank-one control

For a single cycle, `r=1` and the cover is nontrivial, but `r'=1`. Thus
unbounded rank growth requires at least two independent current cycles.

### Free-product control

The true cover is connected and has surjective homology holonomy. The
same-size identity-transport product has `2^r` components and zero holonomy.

### Gauge and basis controls

Deck translation changes the tautological primitive by a constant. Invertible
changes of homology coordinates and changes of spanning tree produce
isomorphic covers and preserve every character relation and connectivity
invariant.

### Symmetry and renaming controls

Swapping the two seed loops swaps the two homology directions and transports
the cover equivariantly up to deck translation. Fresh renaming of vertices and
edges changes no canonical invariant by the groupoid naturality theorem; the
executable materializes the loop swap and spanning-tree gauge, not a separate
arbitrary-renaming fixture. A strict automorphism action is claimed only if the
lift extension is explicitly shown to split.

### Based factorization and no-section controls

The theorem covers every connected cover whose pullback kills every scalar
cohomology class. The executable materializes one nontrivial finer-cover
witness—the second homology cover composed down to the bouquet—and checks its
unique factor into `E_G` after base sheets are fixed. Removing the base-sheet
normalization produces exactly a four-element deck torsor of factors in that
witness. For `r>0`, an attempted section `G->E_G` is rejected.

### Probe-order and held-out-character control

The attachment API reads only the graph; it has no predictor parameter.
Evaluating the coordinate characters in opposite orders leaves the already
constructed cover digest unchanged. This is a probe-order audit and an API
fact, not a simulation of two predictor objects.

### Held-out probe control

The compiler constructs the entire deck torsor before a scalar character is
chosen. A character withheld until after attachment still yields an exact
primitive and separates appropriate lifted endpoints.

### Transplant and tamper controls

The certificate binds the current graph payload—including projection and deck
metadata—its induced boundary data, cycle rank, spanning tree, universal
voltage, reconstructed cover digest, and parent links. The 13 executable
mutations alter stage/rank/tree/voltage/deck size/cover size or digest, parent
or certificate links, record order, declared fields, or chain digest; all 13
are rejected. Endpoint substitution and recurrence-formula tampering are not
advertised as separate fixtures.

## 12. Stokes and Hodge boundary

In a chosen cocycle and sheet chart, the identity

\[
\delta Q_G=\pi_G^*\alpha_G
\]

is a genuine graph-cochain primitive equation. The obstruction is a nonzero
first cohomology class, and the attachment changes the semantic space so that
the pulled-back class becomes exact. This is substantially closer to topology
than naming an arbitrary Hilbert adjoint identity “Stokes.”

It is not Hodge theory over a real or complex inner-product complex. Working
over `F_2` supplies no positive Hilbert energy, Laplacian, harmonic
representative, Hodge filtration, polarization, or algebraic cycle. It has no
direct implication for the Hodge Conjecture or Navier-Stokes.

The important methodological clue is different:

> A currently detected obstruction need not be solved by finding a primitive inside a
> fixed space. It can generate the coarsest semantic cover, canonical up to
> deck gauge, in which its primitive type becomes representable.

That is a new move within this project: obstruction does not merely score or
select the next question. It constructs the space in which the question first
has a solution.

## 13. Claim ledger

| Claim | Status |
|---|---|
| the current graph canonically determines the next obstruction space | exact theorem |
| the universal primitive type is empty before attachment when `r>0` | exact theorem |
| the homology cover represents obstruction trivializations | exact theorem |
| every scalar mod-2 cocycle becomes exact after attachment | exact theorem |
| the attachment is coarsest among connected simultaneous trivializers | exact for based covers; unbased uniqueness is modulo deck gauge |
| graph isomorphisms transport the attachment naturally | exact up to deck gauge; no preferred strict lift claimed |
| the true attachment is not the identity-transport free product | exact theorem |
| both values of each nonzero binary character have native continuation | exact for the bouquet tower |
| iteration needs no stage index or future datum | exact API property |
| cycle rank follows `r'=1+2^r(r-1)` | exact theorem |
| no uniform finite interface preserves all deck questions | exact relative counting bound |
| the meta-rule “attach the full homology cover” is itself selected by the current obstruction | not established; the universal constructor is declared in advance |
| absolute creation outside every external formalism | false |
| the tower is not externally enumerable | false |
| no universal decoder can be added to a richer initial language | false |
| non-soficity is used or established | false; every finite stage is sofic |
| a new geometric Hodge theory has been constructed | not yet |
| the construction is prior-art-free | not claimed |

## 14. Next theorem targets

Three continuations are now mathematically live.

1. **Costed inverse-limit geometry.** Put compatible Hilbert metrics on the
   deck-character algebras and determine whether the primitive torsors admit a
   gauge- and basis-independent escape invariant in the inverse tower.
2. **Presheaf attachment genesis.** Generalize from graph cocycles to a finite
   semantic category and adjoin an equivariant representer for a currently
   nonrepresentable repair presheaf.
3. **Non-sofic transport coupling.** Only after the attachment survives the
   full semantic quotient, ask whether a naturally acting non-sofic group
   preserves the tower or forces a stronger failure of finite transport
   closure.

The first target is the direct bridge back to Stokes innovation. The second is
the route from one-dimensional topology to a genuine theory of generated
semantic types. The third remains an independent stress axis, not the
foundation.

### A concrete torsorial-Stokes prototype, not yet an earned extension

The audit suggests a precise next construction. For a nonbridge edge `e` of
`G_n`, let `c_e` be its scalar indicator cochain. Its class is nonzero, while
its pullback to `G_(n+1)` is exact. The solution set

\[
T_{n,e}=\{q:\delta q=\pi_n^*c_e\}
\]

has two elements, `q` and `q+1`, and is therefore an affine `F_2`-torsor. Its
associated real sign line

\[
L_{n,e}=\operatorname{span}\{(-1)^q\}
\]

is independent of that sign choice. With normalized vertex and edge counting
measures,

\[
\|(-1)^q\|^2=1,
\qquad
\|d(-1)^q\|^2=\frac{4}{|E(G_n)|}.
\]

The second identity holds because precisely the lifts of `e` flip the sign.
Since every positive-rank attachment at least doubles the edge count, the
differential singular values `2/sqrt(|E(G_n)|)` tend to zero.

If one now **externally tags** one such line at each stage and takes Hilbert
direct sums, the resulting diagonal differential is injective with dense
nonclosed image. The sum of one differential vector per stage has finite norm,
while its finite primitives have squared norm `N`. This exactly reproduces
finite exact realizability without uniformly bounded global realizability.

That analytic calculation is valid, but it is not promoted to a semantic
theorem here. The stage tags and chosen nonbridge edges may be doing the work;
a free append can imitate an externally declared orthogonal sum. The next
decisive test is to recover the same nonclosed-range effect from a canonical
symmetry-invariant calculus on the filtered inverse system itself, survive
subdivision and cofinal blocking, and fail under a transport-erased
free-product ablation. In higher dimension the corresponding generated
nullhomotopies would be torsors, gerbes, or higher representers rather than
vertex sign lines.

There is a further warning in favor of retaining the genealogy. The geometric
completion has direction

\[
X_\infty=\varprojlim(G_n,\pi_n),
\]

whereas cochains pull forward through the tower. Because every map
`pi_n^*:H^1(G_n;F_2)->H^1(G_(n+1);F_2)` is zero, continuity of Čech cohomology
would make the ordinary inverse-limit space forget these recurring
birth-and-nullhomotopy events in degree one. The filtered pro-object together
with its primitive torsors is therefore a better candidate carrier than the
completed space alone: the completion is again the fossil, not the process.

This gives a sharper working hypothesis:

> Genesis is the creation of nullhomotopy space; primitive escape is the
> failure of those locally created nullhomotopies to remain uniformly bounded
> under a genealogy-preserving completion.

## 15. Executable evidence

The companion program constructs the first two covers exactly, checks their
incidence and connectivity, verifies the primitive-torsor equation and all
scalar pullbacks, audits monodromy, no-section, based factorization, gauge,
symmetry, free-product, rank-boundary, replay, and tamper controls, and derives
the next enormous stage symbolically. Passing finite execution audits the
implementation; the universal statements and infinite rank conclusion follow
from the proofs and recurrence above.
