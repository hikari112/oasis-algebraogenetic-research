# Genesis Interchange Bockstein Transduction

## Status: exact same-instance theorem, conditional on a declared free-filler doctrine

The eight-state interchange laboratory already contains a concrete marked
central extension

\[
1\longrightarrow \langle T\rangle\cong C_2
\longrightarrow P_{\mathrm{int}}\cong D_8
\longrightarrow Q\cong C_2^2
\longrightarrow 1.
\tag{1}
\]

This note applies the previously declared universal free crossed-module
filler directly to that same permutation instance. It does not replace the
interchange group by a later or merely isomorphic `D8` model. The resulting
coefficient sequence sends the full extension class

\[
[c]\in H^2(Q;\mathbb F_2)
\]

to an explicit Postnikov class

\[
\boxed{
\beta[c]\in H^3(Q;K),
\qquad
K=\left\{m\in\mathbb Z[Q]:
\epsilon(m)\equiv0\pmod2\right\}.
}
\tag{2}
\]

For the interchange extension this class is nonzero and has exact order two.
The two OP/PO charts produce different integral `3`-cocycle tables, but an
explicit `K`-valued `2`-cochain proves that they represent the same class.
All eight normalized section choices in each chart are audited in the same
way.

The executable companion is
[`genesis-interchange-bockstein-transduction.mjs`](genesis-interchange-bockstein-transduction.mjs).
Its certificate digest for the audited run documented here is
`75206bbd72a33931476ccf4a46bd4226238a4f9684292013ee608ea15d41ff21`.

The word *transduction* is deliberately narrow here. It means the connecting
homomorphism for one declared coefficient sequence. It is not an autonomous
law that turns any causal loop, commutator, or repair residue into a new
question.

## 1. Binding to the actual interchange laboratory

The source API exposes only the concrete data needed by this theorem:

- the two eight-point OP and PO coordinate charts;
- their actual `a` and `b` permutations;
- the two coherent OP-to-PO comparisons.

The new executable derives everything else from those arrays. In the OP
chart, the generators are involutions and

\[
T=[a,b],
\qquad
T^2=1,
\qquad
T\ne1.
\tag{3}
\]

They generate an eight-element permutation group, `T` is central in it, and
the quotient coordinates are the two bits `(x,y)`. Thus the derived marked
extension is exactly (1). The kernel of the projection to `Q` is the concrete
pair `{1,T}`.

This establishes a same-permutation-instance result. It does **not** yet
establish that every part of the richer localized-obligation genealogy that
created the charts is preserved by the smaller extension record. The
permutations, center, quotient, sections, factor sets, and chart comparisons
are bound; equivalence of the full causal ancestry remains open.

### Multiplication convention

For normalized sections `s:Q -> P_int`, the executable records `c(g,h)` by

\[
s(h)s(g)=T^{c(g,h)}s(g+h).
\tag{4}
\]

This convention agrees with the action order of the permutation laboratory.
Since `Q=C_2^2` is abelian, it gives the ordinary normalized central-extension
cocycle equations used below.

## 2. The two charts and the based comparison

In each chart, choose the unique normalized lift of `(x,y)` that sends the
coordinate origin to `(x,y,0)`. The derived factor sets are

\[
c_{\mathrm{OP}}((x,y),(x',y'))=xy',
\tag{5}
\]

and

\[
c_{\mathrm{PO}}((x,y),(x',y'))=yx'.
\tag{6}
\]

Both are normalized `2`-cocycles. They are related by

\[
\phi(x,y)=xy,
\qquad
c_{\mathrm{PO}}=c_{\mathrm{OP}}+\delta\phi.
\tag{7}
\]

The based coherent comparison is

\[
\theta_0(x,y,z)=(x,y,z+xy).
\tag{8}
\]

It preserves the identity origin, transports the PO actions to the OP
actions, and identifies the two marked extensions. Equation (7) is the
section-level expression of that chart change.

There is a second coherent comparison

\[
\theta_1=T\theta_0.
\tag{9}
\]

It sends the identity origin to the `T`-origin. Consequently `theta_1` is an
unbased torsor-origin gauge, **not** a pointed chart map and not one of the
normalized section changes audited later. Its raw affine map does not preserve
the chosen identity origin. Because `T` is central, however, `theta_0` and
`theta_1` induce the same normalized extension isomorphism by conjugation and
the same map on the coefficient module.

## 3. The declared free higher filler

Fix the marked pair `(P_int,T)` and declare the unrestricted pointed
crossed-module question: freely adjoin one higher filler whose boundary is
`T`. Put

\[
M=\mathbb Z[Q]
\tag{10}
\]

with its regular `Q`-action, inflated along `P_int -> Q`. If

\[
m=\sum_{q\in Q}n_qe_q,
\]

write `epsilon(m)=sum n_q` and define

\[
\partial m=T^{\epsilon(m)\bmod2}.
\tag{11}
\]

This is the free crossed `P_int`-module on `e_0` with boundary `T`. Its
homotopy groups are

\[
\pi_1=Q,
\qquad
\pi_2=K=\ker\partial
=\{m:\epsilon(m)\text{ is even}\}.
\tag{12}
\]

The coefficient module `K` has rank four and index two in `M`. Reduction by
augmentation parity gives the exact sequence

\[
0\longrightarrow K
\longrightarrow \mathbb Z[Q]
\xrightarrow{\epsilon\bmod2}\mathbb F_2
\longrightarrow0.
\tag{13}
\]

The map used in this experiment is the group-cohomology connecting map

\[
\beta:H^2(Q;\mathbb F_2)\longrightarrow H^3(Q;K)
\tag{14}
\]

associated with (13). It is not the earlier `Z/4` Bockstein, and no
identification with `Sq^1` is being asserted.

The constructor in this section is declared, not forced by the finite
interchange semantics. That distinction is witnessed by the thin-filler
control in Section 8.

## 4. Exact integral lifts and the Postnikov cocycle

Let `c` be either factor set (5) or (6). Lift it integrally by

\[
F(g,h)=c(g,h)e_0\in M.
\tag{15}
\]

Using the regular action of `Q` on `M`, define

\[
\begin{aligned}
\kappa(g,h,k)
&=(\delta F)(g,h,k)\\
&=g\cdot F(h,k)-F(g+h,k)+F(g,h+k)-F(g,h).
\end{aligned}
\tag{16}
\]

Because `c` is an `F_2`-valued cocycle, the augmentation of every value of
`kappa` is even. Hence `kappa` lands in `K`. The identity
`delta squared = 0` then gives

\[
\delta\kappa=0,
\tag{17}
\]

so `kappa` is a normalized `K`-valued `3`-cocycle. It represents both the
connecting image `beta[c]` and the Postnikov class of the declared free
crossed-module filler.

This construction consumes the **full factor cocycle** `c`. The central
element `T`, the bare commutator relation, or a single causal loop does not by
itself determine the input cochain used by (15).

## 5. Chart independence is cohomological, not table equality

Let

\[
H(g)=\phi(g)e_0\in M.
\tag{18}
\]

The executable constructs the integral `2`-cochain

\[
\boxed{
A=F_{\mathrm{PO}}-F_{\mathrm{OP}}-\delta H.
}
\tag{19}
\]

Equation (7) implies that every value of `A` has even augmentation, so in
fact

\[
A\in C^2(Q;K).
\tag{20}
\]

Taking a coboundary gives the explicit comparison

\[
\boxed{
\kappa_{\mathrm{PO}}-\kappa_{\mathrm{OP}}=\delta A.
}
\tag{21}
\]

Therefore the two charts define the same class in `H^3(Q;K)`. Their
representative tables are not identical: the executable records distinct
digests for the OP and PO `kappa` tables. The theorem is chart independence
of the cohomology class, not literal chart independence of a chosen cocycle.

## 6. Exhaustion of normalized section choices

A normalized section change is determined by a function

\[
\eta:Q\longrightarrow\mathbb F_2,
\qquad
\eta(0)=0,
\tag{22}
\]

through

\[
s_\eta(q)=T^{\eta(q)}s(q).
\tag{23}
\]

There are exactly `2^3=8` such functions. For every one of them, in each
chart, the executable derives the changed section and factor table directly
from the concrete permutations and verifies

\[
c_\eta=c+\delta\eta.
\tag{24}
\]

With `H_eta(q)=eta(q)e_0`, it then constructs

\[
A_\eta=F_\eta-F-\delta H_\eta\in C^2(Q;K)
\tag{25}
\]

and checks

\[
\kappa_\eta-\kappa=\delta A_\eta.
\tag{26}
\]

Thus all eight normalized sections in OP and all eight in PO yield the same
cohomology class. This audit is separate from the unbased origin gauge
`theta_1` in (9).

## 7. Nonzero class of exact order two

Let

\[
t=(1,1)\in Q.
\tag{27}
\]

The preimage of the subgroup generated by `t` is `C4`, not `C2 x C2`.
Restricting (16) to this sector gives

\[
\kappa(t,t,t)=e_t-e_0=(-1,0,0,1).
\tag{28}
\]

The action of `t` on the four basis positions has the two orbits

\[
\{0,t\},
\qquad
\{(1,0),(0,1)\}.
\tag{29}
\]

If (28) were `(t-1)u` for some `u in K`, the required coefficient difference
on the first orbit would be odd while the difference on the second would be
even. Every integral preimage satisfying those orbit differences therefore
has odd augmentation. It cannot lie in `K`. Hence the restricted class is
nonzero, and therefore so is the global class.

For the upper bound on its order, `2F` already has even augmentation and is
therefore `K`-valued. Consequently

\[
2\kappa=\delta(2F)
\tag{30}
\]

is a `K`-valued coboundary. The executable also checks the restriction-level
witness `e_0-e_t`. Combining (28)--(30) proves

\[
\boxed{\operatorname{ord}[\kappa]=2.}
\tag{31}
\]

## 8. Decisive controls

### Split extension control

For the split extension over the same quotient `Q`, the homomorphic section
has factor set zero. Its integral lift and `kappa` are identically zero.

The executable also runs all eight normalized section changes. Four produce
nonzero representative factor tables, but every resulting `kappa` remains
explicitly cohomologous to zero. This prevents the test from confusing a
nonzero table with a nonzero class.

### Thin filler control

Keep the actual non-split interchange group and the same marked central
element `T`, but choose the crossed module

\[
\langle T\rangle\hookrightarrow P_{\mathrm{int}}
\tag{32}
\]

instead of the unrestricted free filler. Its kernel is trivial, so
`pi_2=0` and its Postnikov class is zero. The executable checks both Peiffer
laws on this finite model.

Thus the nonzero class in Section 7 is not forced by the marked central
element alone. It depends on the free-filler doctrine that produces the
coefficient module `K` and sequence (13).

## 9. Executable theorem ledger

The passing certificate records the following exact finite checks:

| Audit | Exact result |
|---|---:|
| concrete interchange permutation group | `8` elements |
| quotient | `Q=F_2^2`, `4` elements |
| extension cocycle equations | `64` per chart |
| `kappa` values checked to lie in `K` | `64` per chart |
| normalized `kappa` entries encountered | `37` per chart |
| `3`-cocycle equations | `256` per chart |
| witnesses that `2 kappa` is exact | `64` per chart |
| chart-comparison values checked in `K` | `16` |
| chart coboundary equations | `64` |
| normalized sections exhausted | `8` per chart |
| thin-filler Peiffer checks | `16 + 4` |
| deterministic tamper mutations rejected | `25 / 25` |

Run the complete replay with:

```powershell
node research/genesis-interchange-bockstein-transduction.mjs
```

The replay rebuilds the source laboratory, re-derives the concrete extension,
recomputes every cochain, and compares the full certificate before checking
its digest.

## 10. What this theorem does and does not establish

The exact advance is a typed bridge between two already present levels:

\[
\boxed{
\text{marked horizontal central-extension class}
\xmapsto[\text{declared free filler}]{\text{coefficient connecting map}}
\text{vertical Postnikov class}.
}
\tag{33}
\]

It is useful because the bridge now runs on the actual interchange instance,
survives both chart presentations and every normalized section choice, and
has a decisive nonzero restriction. It is also intentionally conservative:
dimension shifting has not created independent mathematical information.
The class `beta[c]` is an exact re-expression of the same extension
obstruction in the higher coefficient carrier `K`.

In particular, this theorem does not establish any of the following:

- that the earlier CR2 loop or the naked commutator alone canonically maps to
  this Postnikov class;
- that the full localized-obligation ancestry is preserved by the marked
  extension record;
- that a polarization, energy, positivity, or analytic structure has been
  generated;
- that the residue selects a next question or exposes a new independent
  transport direction;
- that an autonomous, counter-free genesis successor law has been found;
- any non-soficity, Hodge, Navier--Stokes, frontier, novelty, or no-prior-art
  result.

The next genuine gap is therefore not another cohomology calculation on the
same class. It is a selection theorem: additional internal structure would
have to make a future distinction or filler question canonical while
retaining the causal ancestry that led to it. Nothing in the present
Bockstein construction supplies that law automatically.
