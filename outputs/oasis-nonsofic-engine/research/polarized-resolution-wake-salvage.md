# Constructive Salvage of the Polarized Resolution-Wake

## Status: one typed candidate and one finite test, with no frontier claim

The wild Resolution-Wake suggests three possible cores:

1. positivity on the groupoid of alternative primitives;
2. causal flux or holonomy between repair histories; or
3. a trigraded resolution complex.

The sober survivor is **causal holonomy**, packaged inside a filtered Hilbert
coefficient system over the finite causal resolution complex `CR_2`. Positivity
is placed on relative transport, not on primitive choices. Internal degree and
causal degree form a bicomplex; observational horizon remains a filtration
until a genuine third boundary operator is derived.

Call the candidate a **Polarized Causal Resolution Bundle** (`PCRB_2`). It is
not a proposed solution of Navier--Stokes, Hodge, Collatz, RH, or any other
frontier problem.

## 1. Why primitive-groupoid positivity is not the core

Let `P` be a transitive torsor for a primitive-translation group `G`. If

\[
\Pi(gp)=\Pi(p)
\qquad(g\in G,p\in P),
\]

then `Pi` is constant: any two points of `P` differ by a translation. Thus a
nontrivial gauge-invariant absolute cost cannot live on the objects of the
full primitive torsor.

A meaningful polarization must instead measure one of:

- the difference between primitive choices;
- failure of a primitive section to be parallel; or
- holonomy around a loop of repair histories.

This does not discard the primitive groupoid. It makes it the carrier of gauge
and transport rather than the carrier of an absolute energy.

## 2. The candidate object

For a finite semantic context `X`, define `PCRB_2(X)` from the following typed
data.

### Causal base

The base is `K_X=CR_2(X)`:

- vertices are presentation-bearing contexts reachable by at most two atomic
  non-stuttering repairs;
- edges are certified repairs and serialized gauge comparisons; and
- faces are certified interchange homotopies.

Isomorphic naked endpoints do not create a face.

### Internal fibers

Each vertex `v` carries a finite Hilbert cochain complex

\[
(H_v^\bullet,d_v),
\qquad d_v^2=0.
\tag{1}
\]

For a question `z`, the primitive fiber

\[
\operatorname{Prim}_v(z)=\{p:d_vp=z\}
\tag{2}
\]

is retained as an affine torsor for the relevant kernel, with no selected
origin.

### Edge transport and mixed defect

Each causal edge `e:v -> w` carries a bounded degree-zero map

\[
U_e:H_v^\bullet\longrightarrow H_w^\bullet.
\]

Its typed genesis--Stokes defect is

\[
\Omega_e=d_wU_e-U_ed_v.
\tag{3}
\]

If `Omega_e=0`, the repair transports the old complex by a chain map. If it is
nonzero, it may become the next question only after a semantic compiler proves
that it is a native obstruction rather than a presentation artifact.

For a certified face `f` comparing paths `p,p'`, require a degree-minus-one
chain homotopy

\[
U_p-U_{p'}=dJ_f+J_fd.
\tag{4}
\]

Before (4) is supplied, the path difference is causal curvature; endpoint
isomorphism does not set it to zero.

### Relative polarization

Presentation gauge acts by cellular isomorphisms and unitary chain maps. For a
causal loop `gamma`, define the finite prototype action

\[
\boxed{
\Pi(\gamma)=w_\gamma\|U_\gamma-I\|_{\mathrm{HS}}^2.
}
\tag{5}
\]

Unitary conjugacy leaves (5) invariant. It vanishes on identity holonomy and
does not choose a primitive origin. A Dirichlet version can measure the
covariant mismatch of a primitive section, but it is coercive only after its
parallel/gauge kernel is quotiented or semantically anchored.

### Horizon filtration

The generated finite bundles form nested horizons

\[
PCRB_{2,0}(X)\subseteq PCRB_{2,1}(X)\subseteq\cdots.
\tag{6}
\]

The successor reads the current obstruction, not the integer label. The label
records the resulting filtration after the fact. There is no third
differential yet, so the object is a filtered curved bicomplex rather than a
tricomplex.

## 3. Minimum axioms

1. **Semantic descent:** equivalent presentations give unitarily equivalent
   bundles and the same relative action.
2. **Defect causality:** zero or resolved obstruction stutters; primitive
   automorphisms alone do not cause growth.
3. **No selected origin:** the full primitive and comparison torsors are
   retained.
4. **Certified faces:** a `2`-cell is attached only from an actual interchange
   witness satisfying (4).
5. **Relative positivity:** action is nonnegative with an explicitly stated
   gauge kernel.
6. **Endogenous continuation:** current holonomy, syzygy, or `Omega` generates
   the next question without a future table.
7. **Finite materialization:** every finite state builds finite cells and
   fibers.
8. **Compactness interface:** finite feasible primitive sets live as nested
   closed sets in one declared realizer completion, with compact cost
   sublevels.
9. **Semantic realization:** a bounded coherent section maps back to an
   admissible object in the native problem category.

The eighth axiom is not inherited automatically from the existing Hilbert
theorem, which assumes a fixed realizer space rather than a growing bundle.

## 4. What is already established and what would be new

### Established inside the project

- The compact-sublevel lemma: for nested nonempty closed feasible sets in one
  realizer space, uniformly bounded minimum cost is equivalent to a global
  realizer.
- In the fixed Hilbert model, minimum primitives split into orthogonal
  innovations with exact Pythagorean energy increments; redundant and
  inconsistent constraints are distinguished.
- `CR_2` gives a typed finite cellular carrier for repair paths, serialized
  comparisons, and certified interchange fillers.
- The two-repair graph experiment generates a non-split `D_8` central
  extension and a comparison torsor with no invariant origin.
- Given its central defect and the declared free crossed-module constructor,
  a higher filler kills that defect in ordinary transport and retains a
  derived nonzero Postnikov class.

These results do not yet supply a functorial Hilbert coefficient system on
`CR_2`, a holonomy polarization, endogenous infinite question generation, or
a native frontier realization.

### Genuinely new relative to those results

1. Compile the Hilbert fibers, edge maps, and face homotopies canonically from
   semantic primitive groupoids.
2. Prove that (5), or a replacement, is gauge-invariant and coercive modulo
   exactly the intended semantic kernel.
3. Construct an exact sequence or transgression in which killing horizontal
   causal holonomy produces a vertical residue that forces the next question.
4. Extend fixed-space compactness to the coherently growing realizer system.

The third item is the strongest sober remnant of the dream's claim that
"unresolvedness migrates in degree." No scalar conservation law is asserted.

## 5. Finite theorem target

### Polarized causal transduction target

For two mutually executable repairs `q,r`, construct `PCRB_2(X)` such that:

1. the two repair orders determine a relative loop `z_X(q,r)` without a
   chosen comparison origin;
2. its holonomy and action descend under full semantic gauge;
3. a strict interchange filler kills the loop exactly when a certified face
   is supplied;
4. if the loop instead carries a central defect `T`, the universal higher
   filler with boundary `T` kills the ordinary class and yields its higher
   Postnikov residue;
5. an exact boundary or transgression map relates those two facts; and
6. the residue, not an external counter, generates the next finite question.

The first five clauses form a finite theorem target. The sixth is the first
genuine genesis extension beyond `CR_2`.

## 6. Minimal exact toy: a polarized abstract `D_8` square

Begin with an abstract copy of the same central-extension type. Let

\[
D_8=\langle W,R\mid W^2=R^2=1,(WR)^4=1\rangle,
\qquad
T=(WR)^2=[W,R].
\tag{7}
\]

Use the faithful orthogonal representation

\[
r=\begin{pmatrix}0&-1\\1&0\end{pmatrix},
\qquad
s=\begin{pmatrix}1&0\\0&-1\end{pmatrix},
\]

\[
\rho(W)=s,
\qquad
\rho(R)=sr.
\tag{8}
\]

Then `rho(WR)=r` and

\[
\rho(T)=r^2=-I.
\]

With

\[
\Pi(g)=\frac18\|\rho(g)-I\|_{\mathrm{HS}}^2,
\tag{9}
\]

exact integer arithmetic gives

\[
\Pi(1)=0,
\qquad
\Pi(T)=1.
\tag{10}
\]

Since `T` is central, changing the comparison origin does not change (10).

Add the internal two-term complex

\[
0\longrightarrow
\mathbb R^2\oplus\mathbb R
\xrightarrow{d}
\mathbb R^2
\longrightarrow0,
\qquad
d(v,t)=v.
\tag{11}
\]

Every `z in R^2` has the origin-free primitive line

\[
\operatorname{Prim}(z)=\{(z,t):t\in\mathbb R\}.
\]

Let `D_8` act by `rho` on `v,z` and trivially on `t`. The differential is
equivariant, so `Omega=0`, while the causal square retains the positive
holonomy (10). This cleanly separates primitive-origin gauge from causal
interaction.

Finally attach the already defined free higher filler `m` with

\[
\partial m=T.
\tag{12}
\]

The project's general free-crossed-module theorem says that, **conditional on
that declared universal filler doctrine**, `T` dies in ordinary transport and
the nonsplit extension class maps under the coefficient connecting
homomorphism to a nonzero higher Postnikov class.  The same central `T` also
admits a thin filler with zero `pi_2`, so the higher residue is not forced by
the central defect alone.

There is a further same-instance gap.  The eight-state interchange experiment
generates one concrete `D_8`, while the existing higher-filler executable uses
a later, 32-state naturality system whose generators produce another concrete
`D_8`.  The two groups are abstractly isomorphic, but their state actions,
central elements, factor sets, and certificates have not been identified or
composed.  The faithful orthogonal representation (8), the Hilbert
primitive-line complex (11), and their coupling to either semantic instance
are also new declared data.  Thus (7)--(12) is a finite theorem target, not an
already integrated executable.

## 7. Decisive controls

1. **Commuting control:** replace `D_8` by split `C_2^2`; holonomy and action
   must vanish.
2. **Zero/resolved control:** retain the primitive torsor but erase or solve
   the admitted defect; the successor must stutter.
3. **Origin shift:** swap the two coherent comparison origins; `T` and (10)
   must be unchanged.
4. **Nonfaithful representation:** force `rho(T)=I`; the action vanishes,
   proving that faithfulness/coercivity must be an axiom rather than inferred
   from positivity.
5. **Nonunitary similarity:** show that (9) changes, so only metric-transporting
   or unitary maps count as polarization gauge.
6. **Certified filler:** attach a face only with its boundary witness; naked
   endpoint equality must not kill the loop.
7. **Higher filler:** instantiate the free constructor on the *same* concrete
   interchange extension, verify separately that `T` dies in `pi_1` and the
   higher residue survives, and retain the thin zero-residue filler control;
   do not claim action conservation.
8. **Duplicate repair:** a redundant presentation must not create a second
   holonomy class.
9. **Mixed-curvature tamper:** alter one degree of an edge map so that (3) is
   nonzero; the system must expose `Omega` or reject the edge.
10. **Future-table deletion:** remove all later fixtures; the residue must
    construct the next question from current data.

For a later compactness test, a predeclared independent-row Hilbert tower can
serve only as a control: unit demands have escaping minimum norm, summable
demands have a global primitive, duplicate rows have zero innovation, and
inconsistent duplicates fail finitely. Such a tower tests the Hilbert ledger;
it is not endogenous genesis.

## 8. Minimal problem-realization interface

Before `PCRB_2` can speak about any external problem, supply four maps or
theorems:

1. a compiler from native local data, repairs, and identities to internal
   cochains, causal edges, and certified faces;
2. a sound comparison between native local solutions and the primitive fibers
   (2);
3. a horizon-uniform inequality relating wake action to the native controlling
   norm, degree, height, or positivity form; and
4. an assembly map taking a bounded coherent wake section back to a valid
   global object in the original native category.

This last map must recover, rather than merely resemble, the demanded object:
a regular PDE solution, an algebraic cycle, an individual integer descent
certificate, or an exact global spectral/zero criterion. None of these maps is
currently constructed.

## 9. Salvaged conclusion

The useful idea in the Polarized Resolution-Wake is not a universal positivity
principle. It is that **relative repair histories can carry semantic data that
neither endpoint nor individual primitive contains**.

The next honest algebraic experiment should first stay metric-free: extract
the concrete interchange extension and both chart factor sets, feed that
exact instance into the generic free-filler constructor, and prove that their
integral lifts yield cohomologous Postnikov cocycles.  The split `C_2^2`
control must send both the extension and Postnikov classes to zero.  That
would establish a same-instance horizontal-extension-to-vertical-Postnikov
transduction.

Only then should the polarization (9) be coupled to that instance.  If its
holonomy action has no canonical relation to the free higher filler, or if
every gauge-invariant higher polarization is degenerate, the dream loses its
central mechanism early and usefully.  If both bridges exist, the remaining
genesis target is precise: the higher residue itself must generate the next
question without an external schedule.
