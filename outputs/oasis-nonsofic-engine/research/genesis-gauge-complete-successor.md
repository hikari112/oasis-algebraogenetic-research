# Genesis Gauge Completion: an empty strict naturality type

## Status: exact 32-state full-orbit successor theorem

The preceding coherence experiment attached a primitive for one chosen
voltage `z`.  That choice was not invariant under the central comparison
gauge `z -> z+1`.  This note performs the repair required by the
locality-closed doctrine: it attaches simultaneous primitives for the entire
gauge orbit

\[
\{z,z+1\}.
\]

The universal repair is a connected 32-state cover.  It does not generate a
nonzero associator, but it reveals substantially more structure than the
gauge-chosen quotient:

- the obstruction space is an indecomposable two-dimensional module for the
  comparison gauge in characteristic two;
- the transition monodromy is \(UT_4(\mathbb F_2)\), generated from three
  elementary continuations;
- the genuine lifted gauge `G` commutes with the third continuation, while the
  route-generated comparison `R=[V,H]` does not;
- their distinction produces a diagonal deck-isotropy defect, fixed under
  gauge conjugation,
  \(T=[W,R]\); and
- the strict type of comparisons that simultaneously realize the `H`-`V`
  route equality and remain `W`-natural is empty.

That final statement is the first exact gauge-equivariant empty strict
naturality constraint in this line of experiments.  The full-orbit state
attachment generates its boundary certificate, but no higher semantic
category or filler has yet been constructed.

The exact executable companion is
[`genesis-gauge-complete-successor.mjs`](genesis-gauge-complete-successor.mjs).

## 1. The declared third grammar

Begin with the eight-state `op` interchange chart

\[
B_0=\{(x,y,z):x,y,z\in\mathbb F_2\}
\]

and transitions

\[
H(x,y,z)=(x+1,y,z),
\qquad
V(x,y,z)=(x,y+1,z+x).
\tag{1}
\]

Its central comparison gauge is

\[
Z_B(x,y,z)=(x,y,z+1).
\tag{2}
\]

Extend the grammar by declaring an identity `W`-loop at every state.  The
resulting directed graph `B` has eight vertices and twenty-four directed
transition `1`-cells.  Its directed-one-complex cycle rank is

\[
24-8+1=17.
\]

The `W` continuation remains declared rather than internally generated.  The
claim below is conditional on this third grammar and the established
locality-closed repair doctrine.

## 2. The complete voltage orbit

Define edge cochains supported only on the `W`-loops by

\[
\alpha_0(W_{x,y,z})=z,
\qquad
\alpha_1(W_{x,y,z})=z+1,
\tag{3}
\]

and set both to zero on all `H`- and `V`-edges.  The gauge (2) exchanges
`alpha_0` and `alpha_1`.

Their sum is the constant `W`-loop class

\[
\alpha_\Sigma=\alpha_0+\alpha_1=\mathbf 1_W.
\tag{4}
\]

Every vertex coboundary vanishes on a loop.  Consequently `alpha_0`,
`alpha_1`, and `alpha_Sigma` are all nonexact: they are nonzero respectively
on the `z=1`, `z=0`, and all `W`-loops.  These checks exhaust every nonzero
linear combination, so

\[
L=\operatorname{span}\{[\alpha_0],[\alpha_1]\}
\cong\mathbb F_2^2.
\tag{5}
\]

In particular, a single binary primitive cannot perform the gauge-complete
repair.  The previous sixteen-state construction exactified one noninvariant
line in (5), not the full locality-obstruction space.

## 3. Universal simultaneous repair

The orbit attachment has states

\[
E=\{(x,y,z,u_0,u_1)\in\mathbb F_2^5\}
\]

and transitions

\[
\boxed{
\begin{aligned}
H(x,y,z,u_0,u_1)
  &=(x+1,y,z,u_0,u_1),\\
V(x,y,z,u_0,u_1)
  &=(x,y+1,z+x,u_0,u_1),\\
W(x,y,z,u_0,u_1)
  &=(x,y,z,u_0+z,u_1+z+1).
\end{aligned}}
\tag{6}
\]

The coordinate functions `u_0,u_1` satisfy

\[
\delta u_i=\pi^*\alpha_i.
\]

At `z=1`, the `W` transition generates deck translation `(1,0)`; at `z=0`
it generates `(0,1)`.  The action is therefore connected.

### Theorem 1: full-orbit representability

For every based connected cover `q:Y -> B`, there is a unique based map

\[
Y\longrightarrow E
\]

over `B` if and only if both pulled-back orbit classes are exact:

\[
q^*[\alpha_0]=q^*[\alpha_1]=0.
\tag{7}
\]

Without chosen primitive origins, the factorization set is a torsor under

\[
\operatorname{Deck}(E/B)\cong\mathbb F_2^2.
\]

The cover has degree four over `B`, hence

\[
|V(E)|=32,
\qquad
|E_1(E)|=96,
\]

and directed-one-complex cycle rank

\[
1+4(17-1)=65.
\tag{8}
\]

### Redundant-coordinate falsifier

A compiler that separately allocates coordinates for `alpha_0`, `alpha_1`,
and their sum creates 64 raw states.  Since

\[
\alpha_0+\alpha_1+\alpha_\Sigma=0,
\]

that raw cover has exactly two connected 32-state components.  Passing to the
cohomology span (5) removes the redundant coordinate and recovers `E`.  This
is why the locality compiler must quotient exactness and linear dependence
before attaching topology.

## 4. The indecomposable gauge module

Use the coordinates

\[
s=u_0+u_1,
\qquad
t=u_0.
\tag{9}
\]

Then (6) becomes

\[
\boxed{
\begin{aligned}
H(x,y,z,s,t)&=(x+1,y,z,s,t),\\
V(x,y,z,s,t)&=(x,y+1,z+x,s,t),\\
W(x,y,z,s,t)&=(x,y,z,s+1,t+z).
\end{aligned}}
\tag{10}
\]

The base gauge lifts by permuting the two primitive coordinates:

\[
\boxed{
G(x,y,z,u_0,u_1)=(x,y,z+1,u_1,u_0),
}
\tag{11}
\]

or, in the chart (9),

\[
G(x,y,z,s,t)=(x,y,z+1,s,t+s).
\tag{12}
\]

It obeys

\[
[G,H]=[G,V]=[G,W]=1.
\tag{13}
\]

Thus the full attachment is genuinely gauge-equivariant.

The gauge action on the obstruction space and its dual deck group swaps the
two coordinate axes.  In characteristic two the swap matrix has only the
eigenvalue one and has nonzero nilpotent part:

\[
(G-1)^2=0,
\qquad
G-1\ne0.
\]

There is an invariant filtration

\[
0
\subset
\langle(1,1)\rangle
\subset
\mathbb F_2^2,
\tag{14}
\]

but no gauge-stable complementary line.  Hence the gauge module is
indecomposable.  This nonsemisimple filtration—not noncommutation with the
actual gauge lift—is the new gauge-natural algebraic datum.

Deck translations together with `G` form

\[
\mathbb F_2^2\rtimes C_2\cong D_8,
\]

where the `C_2` swaps the deck generators.  There are four lifts of `Z_B`,
differing by deck translation.  Two are involutions; two have order four and
square to the invariant diagonal deck translation.  Thus gauge completion
does not select primitive origins or a preferred lift.

## 5. The three degree-two quotients

The three nonzero linear functionals on the primitive fiber give three
sixteen-state quotients:

1. retain `u_0`, obtaining `W:u_0 -> u_0+z`;
2. retain `u_1`, obtaining `W:u_1 -> u_1+z+1`; or
3. retain `s=u_0+u_1`, obtaining `W:s -> s+1`.

The first two quotients are exchanged by `G`; neither is gauge-natural alone.
The third is the unique nonzero gauge-invariant quotient and has constant
`W`-voltage.  Its lifted gauge commutes strictly with `W` and it carries no
`z`-dependent nested defect.

The previous sixteen-state laboratory was quotient 1.  The extra `s` bit in
the full cover is therefore not inert memory: it is the primitive for the
nonexact invariant class `1_W` and is exactly what permits the `z`-gauge to
lift.

## 6. Natural gauge versus route comparison

Gauge completion forces a distinction that the chosen chart had hidden.
The genuine gauge lift is `G` from (11).  The comparison generated by the two
`H`-`V` routes is instead

\[
R=[V,H],
\qquad
R(x,y,z,s,t)=(x,y,z+1,s,t).
\tag{15}
\]

It is characterized by the route equality

\[
VH=RHV.
\tag{16}
\]

Define

\[
Q=[W,V],
\qquad
Q(x,y,z,s,t)=(x,y,z,s,t+x),
\tag{17}
\]

and the diagonal deck translation

\[
T(x,y,z,s,t)=(x,y,z,s,t+1).
\tag{18}
\]

Exact calculation gives

\[
\boxed{
\begin{aligned}
VH&=RHV,\\
WV&=QVW,\\
WR&=TRW,\\
QH&=THQ,\\
HW&=WH.
\end{aligned}}
\tag{19}
\]

Therefore

\[
\boxed{
[W,G]=1,
\qquad
[W,R]=T\ne1.
}
\tag{20}
\]

The nested defect is the diagonal translation

\[
(u_0,u_1)\longmapsto(u_0+1,u_1+1).
\]

It is fixed by gauge conjugation and is central in the transition monodromy:

\[
GTG^{-1}=T.
\tag{21}
\]

Thus the gauge-chosen experiment had detected a real invariant, but described
its source incorrectly.  `W` commutes with the true lifted gauge.  The defect
measures the failure of the route-generated comparison to be `W`-natural.

## 7. Empty strict naturality type

Define the strict coherent comparison type

\[
\begin{aligned}
\operatorname{Coh}_{HV|W}(E)=
\{\Theta:E\to E:\;&
\pi\Theta=Z_B\pi,\\
&VH=\Theta HV,\\
&\Theta W=W\Theta\}.
\end{aligned}
\tag{22}
\]

The second condition uniquely forces

\[
\Theta=VH(HV)^{-1}=R.
\]

But the third condition fails because `[W,R]=T` is nonidentity.  Hence:

### Theorem 2: empty strict naturality constraint

\[
\boxed{
\operatorname{Coh}_{HV|W}(E)=\varnothing.
}
\tag{23}
\]

The obstruction certificate is the diagonal deck transformation `T`, which
is fixed under conjugation by the lifted gauge.

This is stronger than merely lacking a preferred comparison.  Natural lifts
of `Z_B` exist—`G` and its deck translates—but none also realizes the exact
route equality (16).  Conversely, `R` realizes that equality but is not a map
of the `W`-extended transition structure.

Equation (23) is an empty strict type definable from the generated 32-state
object relative to the declared grammar and locality compiler.  The
32-state attachment computes its boundary.  Promoting this set-level fact to
a Level-2 obstruction requires a semantic category that retains deck isotropy
and admits defective route comparisons as typed 1-cells.

This qualification matters.  A coarse quotient that identifies deck-related
maps kills `T` and makes the obstruction disappear.  A stacky or groupoid
quotient can retain `T` as isotropy, but may already regard it as a weak
naturality filler.  The present theorem proves strict permutation-level
emptiness before either quotient is chosen.

## 8. Generated unitriangular transport

The permutation group generated by `H,V,W` is

\[
\boxed{
\langle H,V,W\rangle\cong UT_4(\mathbb F_2),
}
\tag{24}
\]

with the three generators corresponding to the adjacent elementary
transvections

\[
I+E_{12},
\qquad
I+E_{23},
\qquad
I+E_{34}.
\]

It has order `64`, nilpotency class three, and center `{1,T}`.  In the
32-state action its zero-state stabilizer has order two, so the action is
transitive but not regular.  The comparison transformations occupy successive
commutator layers:

\[
R=[V,H],
\qquad
Q=[W,V],
\qquad
T=[W,R]=[Q,H].
\tag{25}
\]

The lower-central filtration is

\[
UT_4
\supset
[UT_4,UT_4]
\supset
\langle T\rangle
\supset
1.
\tag{26}
\]

The lifted gauge `G` is not in this monodromy group.  It centralizes it, and

\[
\langle H,V,W,G\rangle
\cong UT_4(\mathbb F_2)\times C_2
\]

has order `128`.

This is an exact compositional hierarchy: the first commutators are pairwise
comparison transports, and their commutator produces the central third-order
defect.  It is classical unitriangular algebra generated by the semantic
procedure, not a new group-theoretic family.

## 9. Reorder coherence remains strict

Relative to normal order `HVW`, all six generator orders have exact correction
terms.  In particular, the two reduced reorder paths from `WVH` both end at

\[
RQHVW.
\tag{27}
\]

On one path `T` occurs twice and cancels; the other route supplies the same
correction through the opposite pairwise face.  The complete reorder mismatch
is therefore

\[
\operatorname{id}_E.
\tag{28}
\]

Because `G` commutes with every term, this equality is gauge-equivariant.

The conclusions are simultaneous:

- the strict natural comparison type (23) is empty;
- the nested obstruction `T` is nonzero and gauge invariant; and
- the literal three-generator associator remains zero.

An empty strict naturality type is not automatically a nonzero `H^3` class.
It identifies the boundary a higher representer must fill.

## 10. The higher attachment now demanded

The next object cannot be a permutation `Theta` satisfying (22); Theorem 2
proves that no such permutation exists.  A candidate successor would enlarge
the semantic dimension so that `R` and `G` can be parallel `1`-morphisms with a generated
`2`-comparison

\[
\eta:R\Longrightarrow G.
\tag{29}
\]

Whiskering `eta` by `W` would expose `T` as the boundary discrepancy between
the two naturality composites.  This formulation is not automatic: in the
ordinary category of `W`-extended transition systems `G` is a morphism and
`R` is not, so they are not yet parallel.  A complete filler doctrine must
first define the weaker 1-cells, retain deck transformations as 2-boundaries,
represent the discrepancy, and then test its next coherence.  Freely naming
`eta` without that universal property would merely relocate the gap.

The full gauge group contains additional exact evidence for the next search.
Two lifts of `Z_B` have order four and square to `T`; the involutive gauge
conjugates such a lift to its inverse.  This is precisely the kind of
order-four/inversion pattern from which a nontrivial crossed-module
associator can arise.  The present theorem does not yet prove that the needed
crossed module is generated, but the required ingredients are now observable
inside the gauge-complete object rather than imported as an arbitrary
associator table.

## 11. Honest boundary

The exact result proves:

- full-orbit locality repair and its universal property;
- a 32-state connected cover with indecomposable gauge module;
- exact gauge lifts and all three degree-two quotients;
- a nested deck-isotropy defect fixed under gauge conjugation and
  distinguished from the actual gauge;
- an empty strict `W`-natural route-comparison type at the permutation level;
- `UT_4(F_2)` transition monodromy; and
- strict, gauge-equivariant completion of the reorder diagram.

It does not prove:

- that the `W` continuation or voltage obligation is itself generated;
- a represented higher filler for (23);
- a semantic quotient proved to preserve the strict emptiness;
- a bicategory in which `R` and `G` are parallel 1-morphisms and `T` is a
  typed naturality boundary;
- that the order-four lifts canonically determine a crossed module;
- a nonzero associator, bar `3`-class, or new Stokes theorem;
- non-soficity or an infinite-depth result—the groups here are finite; or
- a consequence for Hodge theory, Navier-Stokes, or any open conjecture.

The next theorem target is now concrete: define the weakest semantic category
that retains `T`, build its smallest gauge-equivariant higher representer,
derive the boundary maps from `R,G,T`, and decide whether its totalization is
contractible or has a nonzero third obstruction.
