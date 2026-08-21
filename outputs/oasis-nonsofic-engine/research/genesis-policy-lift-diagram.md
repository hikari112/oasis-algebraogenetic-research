# Genesis policy lift diagram

## Index-two shell, persistent sign branch, and the semantic boundary

This note isolates the strongest theorem currently supported by the concrete
eight-state interchange experiment.  Its subject is a policy-indexed diagram
of cocycle-lift fibers for the marked central extension

\[
1\longrightarrow \mathbf F_2\longrightarrow D_8
 \longrightarrow Q\cong\mathbf F_2^2\longrightarrow 1.
\]

The result is stronger than the earlier claim that one order-four coefficient
policy happens to nullify an obstruction.  The finite invariant is a
seven-point index-two/coarsest-nonthin shell and a natural residue map on that
shell.  The executed \(C_8\to C_4\) component image agrees with concrete
\(D_8\) loop holonomy; standard cyclic-sign cohomology identifies that line as
the all-level persistent direction.

It is also narrower than an algebraogenesis theorem.  The policy diagram is a
fixed mathematical object.  Nothing proved here says that a semantic process
must construct this diagram, admit its persistent direction as a new
observable, or do so autonomously.

### Claim labels

Four labels are used throughout.

- **[E] Executed.** Checked by
  [`genesis-policy-lift-diagram.mjs`](./genesis-policy-lift-diagram.mjs),
  including exact finite enumeration and certificate replay.
- **[T] Theorem-derived.** Proved from the executed finite object using the
  universal relation-policy theorem, elementary module theory, or an explicit
  cochain argument.  The companion executable may serialize the formula or
  check its finite consequences without itself proving the general statement.
- **[S] Standard.** Ordinary group cohomology, inverse-system, or homotopy-fiber
  machinery.  These facts are important, but are not new mathematical
  structures introduced by this project.
- **[D] Declared semantic law.** A proposed interpretation or future type-former
  that is not forced by the algebra proved here.

This separation is part of the result.  In particular, a theorem-derived
general formula is not described as exhaustively executed at every level.

---

## 1. Concrete input and variance

Let

\[
Q=\mathbf F_2^2=\{0,x,y,x+y\},
\qquad
H^*(Q;\mathbf F_2)=\mathbf F_2[u,v],
\]

where \(u(x)=1,u(y)=0\) and \(v(x)=0,v(y)=1\).

**[E]** The companion executable imports
`buildGenesisInterchangeTransductionInput()` rather than constructing an
abstractly isomorphic group.  From the actual OP permutation chart it derives:

- an eight-element nonabelian group with central kernel of order two;
- quotient \(Q\cong\mathbf F_2^2\);
- OP factor set
  \[
  c(g,h)=u(g)v(h);
  \]
- cohomology class \([c]=uv\).

The PO chart gives the equivalent representative \(vu\); the earlier
nullification-fiber certificate gives an explicit equivalence between the OP
and PO lift fibers.  The present certificate uses OP coordinates for all
displayed polynomial labels.

### Policy category and arrow direction

Put

\[
M=\mathbf Z[Q],
\qquad
A=\ker\bigl(\epsilon_2:M\to\mathbf F_2\bigr),
\]

where \(\epsilon_2\) is augmentation modulo two.  An orbit-generated pointed
abelian policy is canonically

\[
B_L=M/L,
\qquad L\leq A
\]

for a \(Q\)-stable relation subgroup \(L\).  The distinguished point is the
class of \([0]\in M\).

**[T]** If \(L\subseteq L'\), there is a unique pointed \(Q\)-equivariant
boundary-preserving quotient

\[
B_L=M/L\longrightarrow B_{L'}=M/L'.
\]

Conversely, every morphism between such orbit-generated policies arises this
way.  Cocycle lifts push forward along the quotient, so the lift-fiber
construction is covariant for this arrow convention.  The inhabited locus is
upward-closed in relation-subgroup inclusion.  Noncontractibility and holonomy
are not monotone: both can disappear under a further quotient.

---

## 2. The nine-node index-two shell

For

\[
n=\sum_{q\in Q}n_q[q]\in A,
\]

define

\[
e(n)=\frac{\sum_qn_q}{2}\pmod2,
\qquad
g_u(n)=\sum_qn_qu(q)\pmod2,
\qquad
g_v(n)=\sum_qn_qv(q)\pmod2.
\]

Translation by an element of \(Q\) changes each weighted sum only by a
multiple of the even augmentation.  Hence these are \(Q\)-invariant
functionals on \(A\).

**[E]** Using an explicit integral basis of \(A\), the executable constructs
the mod-two \(Q\)-action matrices and exhausts all sixteen functionals on that
basis.  Exactly eight are invariant.  Thus

\[
V:=\operatorname{Hom}_{\mathbf ZQ}(A,\mathbf F_2)
=\langle e,g_u,g_v\rangle\cong\mathbf F_2^3.
\]

Write a point of \(V\) as

\[
f=(\eta,\alpha,\beta)
=\eta e+\alpha g_u+\beta g_v,
\qquad
\chi_f=\alpha u+\beta v.
\]

For \(f\ne0\), let \(L_f=\ker f\).  Let \(L_0=A\).

**[T]** Every \(Q\)-stable index-two subgroup of \(A\) is the kernel of a
unique nonzero element of \(V\).  Uniqueness uses the fact that
\(\mathbf F_2^\times=\{1\}\).  Therefore the seven nonzero vectors give every
thin-link cover, not merely seven examples.

### The eight finite nodes

The quotient type is determined by \(\eta\).

1. **Thin node** \(f=000\):
   \[
   B_0=M/A\cong\mathbf F_2.
   \]

2. **Four cyclic sign nodes** \(f=(1,\alpha,\beta)\):
   \[
   B_f\cong\mathbf Z/4_{\chi_f},
   \qquad q\cdot z=(-1)^{\chi_f(q)}z.
   \]
   A representing map is
   \[
   \Phi_f([q])=(-1)^{\chi_f(q)}\pmod4.
   \]

3. **Three vector/transvection nodes**
   \(f=(0,\alpha,\beta)\ne0\):
   \[
   B_f\cong\mathbf F_2b\oplus\mathbf F_2k,
   \]
   with
   \[
   q\cdot b=b+\chi_f(q)k,
   \qquad q\cdot k=k,
   \qquad \partial b=1,\quad\partial k=0.
   \]

Together with the free universal policy \(M=M/0\), this is a nine-node
relation shell:

\[
\{0\}\ \cup\ \{L_f:f\in V\setminus\{0\}\}\ \cup\ \{A\}.
\]

Only eight of these quotients are finite; the free root \(M\) is infinite.

### Shell morphisms

**[E/T]** Distinct \(L_f\) have index two in \(A\), hence are incomparable.
The executable materializes nine nodes and all twenty-four arrows, checks the
seven free-to-coatom-to-thin compositions, and checks that distinct coatoms
are incomparable.  The relation-policy theorem proves that this displayed
list is the complete morphism set inside the nine-node full subcategory:

- identities;
- the seven unique arrows \(M\to B_f\);
- the seven unique arrows \(B_f\to\mathbf F_2\);
- the composite \(M\to\mathbf F_2\).

There are no arrows between distinct order-four nodes.

```text
                              free M
             /       /       /   |   \       \       \
          C_0      C_u     C_v  C_u+v V_u    V_v    V_u+v
             \       \       \   |   /       /       /
                              thin F2
```

The diagram shows relation-policy morphisms.  The Fano incidence below is an
additional geometry on the seven middle labels; Fano lines are not morphisms
between the middle nodes.  The arrows from free are not asserted to be Hasse
covers: undisplayed relation policies exist between free and these seven
index-two coatoms.  The seven displayed coatoms are covers only of thin
\(L=A\).

### Raw pointings versus intrinsic policies

**[E]** The executable consumes the prior exhaustive order-at-most-four
certificate, derives the invariant functional from every candidate's orbit
map, and checks the collapse

\[
27\text{ raw pointed presentations}
\longrightarrow
8\text{ finite intrinsic policies}.
\]

The exact multiplicities are:

| Carrier | Raw presentations | Intrinsic kernels | Multiplicity per kernel |
|---|---:|---:|---:|
| thin \(C_2\) | 1 | 1 | 1 |
| cyclic \(C_4\) | 8 | 4 | 2 |
| transvection \(C_2^2\) | 18 | 3 | 6 |

In executable point order \(0,\ldots,7\), the exact candidate multiplicities
are

\[
(1,2,6,2,6,2,6,2).
\]

Target inversion \(1\leftrightarrow-1\) accounts for the two cyclic pointings
without creating a new relation policy.  Coordinate presentations of the
vector targets similarly collapse to their relation kernels.

---

## 3. Fano incidence

The seven nonzero elements of \(V\cong\mathbf F_2^3\) are the seven points of
the projective plane \(PG(2,2)\).  Since the only nonzero scalar is one, the
nonzero vectors themselves are the projective points.

A line is

\[
\ell(f,g)=\{f,g,f+g\},
\qquad f,g\ne0,\quad f\ne g.
\]

**[E]** The executable constructs this incidence rather than applying the name
“Fano” to an unstructured seven-element list.  It checks:

- seven points;
- seven distinct lines;
- three points on every line;
- three lines through every point;
- twenty-one point-line incidences;
- every one of the twenty-one unordered point pairs occurs on exactly one
  line.

**[T]** This incidence is visible in the relation lattice.  If
\(h=f+g\), then

\[
L_f\cap L_g=L_f\cap L_h=L_g\cap L_h,
\]

and the common subgroup has codimension two in \(A\).  Conversely, a triple
of distinct invariant hyperplanes with such a common intersection is a Fano
line.  These intersections produce order-eight relation quotients, but those
quotients are not additional nodes of the declared nine-node index-two shell.

The vector-space structure therefore supplies a real incidence geometry while
the policy morphism category remains the star-shaped quotient diagram above.

---

## 4. The natural residue map

Let

\[
\beta_A[c]\in H^3(Q;A)
\]

be the universal connecting class.  For \(f\in V\), push it forward to the
one-dimensional coefficient quotient:

\[
R_c(f)=H^3(Q;f)\bigl(\beta_A[c]\bigr).
\]

This is a natural linear map

\[
R_c:V\longrightarrow H^3(Q;\mathbf F_2).
\]

### Uniform cyclic/vector formula

**[T]** For \(f=(\eta,\alpha,\beta)\), the coefficient extension has two
possible contributions:

- \(\eta=1\) contributes the ordinary coefficient Bockstein
  \(Sq^1(c)\);
- the action/transvection character contributes \(\chi_f\smile c\).

Thus

\[
R_c(\eta,\alpha,\beta)
=\eta\,Sq^1(c)+\chi_f\smile c.
\]

For \(c=uv\), the Cartan formula gives

\[
Sq^1(uv)=u^2v+uv^2.
\]

Consequently

\[
\boxed{
R_c(\eta,\alpha,\beta)
=(\alpha+\eta)u^2v+(\beta+\eta)uv^2.
}
\]

The executable serializes these two residue coordinates for all eight shell
points and protects them by replay/tamper tests.  The identification of that
coordinate formula with the universal connecting map is the theorem-derived
step, not an exhaustive symbolic derivation performed by the program.

Since \(u^2v\) and \(uv^2\) are linearly independent,

\[
\boxed{\ker R_c=\{000,111\}.}
\]

Here \(000\) is thin and

\[
111=e+g_u+g_v
\]

is the cyclic policy

\[
B_*:=\mathbf Z/4_\chi,
\qquad \chi=u+v.
\]

The selection is therefore not a cost heuristic: it is the unique nonzero
kernel direction of a natural index-two-shell transgression.

### Complete index-two-shell lift table

**[E]** Exact normalized cochain enumeration gives:

| Point | Policy | Residue coordinates \((u^2v,uv^2)\) | Compatible cochains | Cocycle lifts | \(K\)-gauge components |
|---:|---|---:|---:|---:|---:|
| 000 | thin \(\mathbf F_2\) | 00 | 1 | 1 | 1 |
| 001 | \(C_4{}_0\) | 11 | 512 | 0 | 0 |
| 010 | \(V_u\) | 10 | 512 | 0 | 0 |
| 011 | \(C_4{}_u\) | 01 | 512 | 0 | 0 |
| 100 | \(V_v\) | 01 | 512 | 0 | 0 |
| 101 | \(C_4{}_v\) | 10 | 512 | 0 | 0 |
| 110 | \(V_{u+v}\) | 11 | 512 | 0 | 0 |
| 111 | \(C_4{}_{u+v}\) | 00 | 512 | 16 | 8 |

The displayed binary point is ordered as \((\eta,\alpha,\beta)\), while the
executable's integer point identifier is \(\eta+2\alpha+4\beta\).

Thus the residue-zero locus and the inhabited lift locus agree on this shell:

\[
\operatorname{Liftable}_{\rm shell}
=\{\text{thin},\,C_4{}_{u+v}\}.
\]

The free regular policy remains obstructed.  **[E]** Its diagonal restriction
has four unrestricted parity solutions, all of odd augmentation, and no
even-augmentation solution.  Its normalized lift fiber is empty.

### Split-extension control

**[E]** Replacing the extension factor by \(c=0\), while retaining the four
cyclic sign policies, gives sixteen lifts and eight \(K\)-gauge components for
each policy: sixty-four lift objects in total.  No character is selected.
Thus the nonsplit class selects \(\chi=u+v\) inside the cyclic sign family; the
coefficient policy alone supplies the possible connecting-map transport.

If the held-policy split control is supplied with \(H^1\)-loops, those loops
are outer marked-extension automorphisms.  They are not concrete inner loops
of the now-abelian split extension.

### Correct minimality statement

**[T]** A finite nonthin carrier surjecting onto \(C_2\) has a nonzero kernel,
so its cardinality is at least four.  Every abelian pointed carrier of order
four is cyclic or elementary abelian, and the shell census exhausts both
types.  Therefore:

> \(C_4{}_{u+v}\) is the unique intrinsic minimum-cardinality nonthin
> liftable policy in the orbit-generated abelian doctrine.

This is a cardinality statement.  It is not initiality in the full
relation-policy lattice.

### Proper-subgroup-invisible residues

The class

\[
u^2v+uv^2=uv(u+v)
\]

vanishes on all three proper nontrivial subgroups of \(Q\).  Hence the eight
raw presentations previously found to be globally nonzero but invisible on
every proper subgroup collapse to two intrinsic policies:

\[
C_4{}_0\quad(2\text{ raw presentations}),
\qquad
V_{u+v}\quad(6\text{ raw presentations}).
\]

---

## 5. Automorphism covariance

The diagonal square form of the extension is

\[
q(a,b)=ab.
\]

It has the unique anisotropic vector \((1,1)\).  The subgroup of
\(GL(2,2)\) preserving this marked extension class is

\[
O(q)=\{1,\tau\}\cong C_2,
\qquad \tau(u)=v,\quad\tau(v)=u.
\]

**[E]** The companion executable checks the nontrivial swap on the index-two
shell.
Its fixed nonzero points are

\[
001=C_4{}_0,
\qquad
110=V_{u+v},
\qquad
111=C_4{}_{u+v}.
\]

Only \(111\) among these fixed points has a nonempty nonthin lift fiber.
The remaining shell orbits are

\[
\{010,100\}=\{V_u,V_v\},
\qquad
\{011,101\}=\{C_4{}_u,C_4{}_v\}.
\]

**[T]** Naturality of the universal connecting map gives

\[
R_{\gamma^*c}(\gamma^*f)=\gamma^*R_c(f)
\]

for every quotient basis change \(\gamma\).  Therefore the kernel policy is
presentation-covariant even though its coordinate name changes.  For example,
in the alternate coordinates where \([c]=u(u+v)\), the same selected policy is
written with the correspondingly transported character.

**[E]** The executable also enumerates all six elements of \(GL(2,2)\).  For
each transported factor set it exhausts the seven nonthin index-two-shell
policies, finds exactly one selected cyclic policy with sixteen lifts, and
checks that its character annihilates the transported anisotropic direction.
The six runs contain ninety-six selected lifts in total.  One of the six
coordinate changes explicitly carries the OP factor table to the PO factor
table.

This is an executable covariance census for the quotient basis.  Naturality
is still the theorem explaining why the six finite checks fit one invariant
construction; the program does not enumerate every abstract automorphism of
\(D_8\).

**[E]** Target inversion sends every selected lift \(F\) to \(-F\) and shifts
its component label by \(010=uv\).  It exchanges the two \(C_8\)-extendable
affine points while preserving the line as a whole.  Therefore the invariant
object is a line/torsor, not a preferred origin.

---

## 6. The selected lift fiber and concrete holonomy

For

\[
B_*=\mathbf Z/4_\chi,
\qquad \chi=u+v,
\qquad K=\ker(B_*\to\mathbf F_2)=\{0,2\},
\]

the kernel action is trivial.

**[E]** The selected fiber has:

- 512 parity-compatible normalized two-cochains;
- 16 normalized cocycle lifts;
- 8 normalized \(K\)-valued one-cochains;
- 8 \(K\)-gauge components;
- 2 lift objects in every component.

With the executed base lift, the component labels exhaust

\[
H^2(Q;K)=\langle u^2,uv,v^2\rangle\cong\mathbf F_2^3.
\]

**[S]** The corresponding cochain-level lift 2-groupoid has

\[
\pi_0\cong H^2(Q;K)\cong\mathbf F_2^3,
\qquad
\pi_1\cong H^1(Q;K)\cong\mathbf F_2^2,
\qquad
\pi_2\cong H^0(Q;K)\cong\mathbf F_2.
\]

### Concrete inner loops

**[E]** Conjugation by concrete section lifts in the actual eight-state
\(D_8\) instance produces the one-cocycles

\[
x\rightsquigarrow v,
\qquad
y\rightsquigarrow u,
\qquad
x+y\rightsquigarrow u+v.
\]

Their action on component labels is

\[
0\longmapsto0,
\qquad
u\longmapsto uv,
\qquad
v\longmapsto uv,
\qquad
u+v\longmapsto0.
\]

Thus

\[
\boxed{\operatorname{im}\delta_1=\langle uv\rangle.}
\]

The eight components split into four two-element holonomy orbits.

This statement retains two different quotient operations:

1. \(K\)-valued cochains are ordinary gauge arrows inside the lift fiber;
2. concrete marked-extension automorphisms are retained as paths acting on
   that fiber.

Conflating them erases the claimed path/end-point distinction.

---

## 7. The integral and even-modulus sign branch

The order-four node is not isolated.  Define the signed augmentation

\[
\Phi_\chi:M\longrightarrow\mathbf Z_\chi,
\qquad
\Phi_\chi\!\left(\sum_qn_q[q]\right)
=\sum_qn_q(-1)^{\chi(q)},
\qquad \chi=u+v.
\]

Let

\[
L_\infty=\ker\Phi_\chi,
\qquad
L_m=\Phi_\chi^{-1}(m\mathbf Z)
\]

for even \(m\).  Then

\[
M/L_\infty\cong\mathbf Z_\chi,
\qquad
M/L_m\cong\mathbf Z/m_\chi.
\]

If \(d\mid m\), relation inclusion gives the quotient arrow

\[
\mathbf Z/m_\chi\longrightarrow\mathbf Z/d_\chi.
\]

Thus \(\mathbf Z_\chi\) is initial within the cyclic sign-policy family and
the thin policy \(\mathbf Z/2\) is terminal.

### Integral lift

Define

\[
\boxed{
F_\infty(g,h)=\bigl(2v(g)-1\bigr)u(g)v(h).
}
\]

**[E]** The executable checks all sixteen parity equations

\[
F_\infty(g,h)\equiv c(g,h)\pmod2
\]

and all sixty-four integer twisted cocycle equations

\[
d_\chi F_\infty(g,h,k)=0.
\]

It also verifies that reduction modulo four is the selected executed base
lift.  Reducing an integral cocycle proves, rather than separately enumerates,
that every even cyclic sign quotient admits a lift.

Consequently:

- \(\mathbf Z_\chi\) is already a liftable policy;
- every \(\mathbf Z/m_\chi\) for even \(m\) is liftable;
- \(C_4{}_{u+v}\) is neither the first nor the globally unique nullifier.

### Pure 2-power ray

The canonical inverse ray is

\[
\mathbf Z_\chi\longrightarrow\cdots\longrightarrow
\mathbf Z/2^{n+1}_\chi\longrightarrow
\mathbf Z/2^n_\chi\longrightarrow\cdots\longrightarrow
\mathbf Z/8_\chi\longrightarrow
\mathbf Z/4_\chi\longrightarrow
\mathbf F_2.
\]

All nonthin nodes on this ray are liftable.  **[T/S]** The cyclic sign
cohomology calculation gives the order-four node the following extremal role:

> \(\mathbf Z/4_\chi\) is the coarsest, hence terminal, noncontractible cyclic
> sign quotient before the thin collapse.

This replaces the false language “first” or “isolated” nullifier.
The companion executable records this role as theorem-derived; its finite
controls cover \(C_2,C_4,C_6\), and \(C_8\).

### Odd-primary padding control

Let

\[
m=2^nr,
\qquad r\text{ odd},
\]

and let \(K_m=\ker(\mathbf Z/m_\chi\to\mathbf F_2)\).

**[S]** Cohomology of the odd-primary summand vanishes in positive degrees
because \(|Q|=4\) is invertible there.  Since the sign action is nontrivial,
its invariant subgroup also vanishes.  Therefore odd-primary padding changes
raw cochain counts but contributes no component, automorphism, or holonomy
direction.

**[E]** The executable tests the first nontrivial odd-primary padding directly:

\[
B_6=\mathbf Z/6_\chi.
\]

It exhausts \(3^9=19{,}683\) compatible normalized cochains and finds:

- 9 cocycle lifts;
- 27 normalized \(K\)-gauge cochains;
- 9 distinct one-coboundary tables;
- gauge stabilizer size 3;
- 1 gauge component;
- component holonomy rank 0.

This is the expected contractible \(m=2r\) control with \(r=3\).

Combining this with the elementary tensor-resolution calculation gives the
following theorem-derived family formulas.

| 2-adic valuation of \(m\) | Normalized lift objects | Components | \(\pi_1\) | \(\pi_2\) | Holonomy |
|---|---:|---:|---|---|---|
| \(n\ge2\) | \(m^2\) | 8 | \(\mathbf F_2^2\) | \(\mathbf F_2\) | rank one |
| \(n=1\), \(m=2r\) | \(r^2\) | 1 | 0 | 0 | zero |
| \(m=2\) | 1 | 1 | 0 | 0 | zero |

The general odd-primary formulas are **[T/S]**, not fields exhaustively
enumerated at every modulus.  The executable enumerates \(m=4,6,8\); the
integral cocycle supplies existence for all even \(m\).

Arbitrary noncyclic two-primary policies are not classified here.

---

## 8. The persistent component core

For the pure 2-power branch, put

\[
B_n=\mathbf Z/2^n_\chi,
\qquad
K_n=\ker(B_n\to\mathbf F_2)
=2\mathbf Z/2^n
\cong\mathbf Z/2^{n-1}_\chi.
\]

### Standard cohomology calculation

**[S]** A tensor resolution for the two commuting involutions acting by
\(-1\) gives, in the chosen \(u,v\) coordinates,

\[
H^2(Q;K_n)
\cong K_n[2]\oplus K_n/2K_n\oplus K_n[2]
\cong\mathbf F_2^3.
\]

The three summands correspond to

\[
\langle u^2,uv,v^2\rangle.
\]

Reduction \(K_{n+1}\to K_n\) kills the two order-two invariant summands and
preserves the quotient summand:

\[
\boxed{
(a,b,c)\longmapsto(0,b,0).
}
\]

Similarly, its image on \(H^1\) is \(\langle u+v\rangle\), while the map on
\(H^0\) is zero.

The executable records this as `theorem-derived`; its exhaustive tower census
stops at \(C_8\to C_4\).

It follows that for every \(n\ge2\), after choosing the compatible integral
base lift \(F_n\),

\[
\boxed{
\bigcap_{m>n}\operatorname{im}
\left(
\pi_0\operatorname{Lift}(B_m)
\longrightarrow
\pi_0\operatorname{Lift}(B_n)
\right)
=[F_n]+\langle uv\rangle.
}
\]

This is a two-point affine torsor.  The affine language is essential: target
inversion can exchange its two points, so no point is canonically the origin.

### Executed \(C_8\to C_4\) census

**[E]** For \(B_3=\mathbf Z/8_\chi\), the executable exhausts

\[
4^9=262{,}144
\]

parity-compatible normalized cochains and finds:

- 64 normalized cocycle lifts;
- 64 normalized \(K_3\)-valued one-cochains;
- 8 distinct one-coboundary tables;
- normalized gauge stabilizer size 8;
- 8 \(K_3\)-gauge components;
- 8 lift objects in every \(C_8\) component;
- exactly 4 distinct raw images modulo four;
- 16 \(C_8\) preimages for each raw \(C_4\) image;
- exactly 2 image components in the \(C_4\) fiber;
- component labels \(000\) and \(010\), where \(010\) is the \(uv\) direction;
- exactly 4 \(C_8\) components mapping to each of those two \(C_4\)
  components.

Moreover, each of those two \(C_4\) components is present in full.  Thus the
raw image is the gauge saturation of a two-component affine line.

### Equality with concrete holonomy

**[E]** The concrete inner-loop component shifts are

\[
\{000,010\}=\{0,uv\}.
\]

The executable compares the sets and proves

\[
\boxed{
\operatorname{im}
\bigl(\pi_0\operatorname{Lift}(C_8)\to
      \pi_0\operatorname{Lift}(C_4)\bigr)
\text{, translated to the base component,}
=\operatorname{im}\delta_1
=\langle uv\rangle.
}
\]

The equality is an equality of component directions.  It is not a claim that
the raw loop orbit equals the raw reduction image without gauge saturation.

### Post-audit identification: twisted-Bockstein exactness

**[S]** A subsequent naming audit identifies the direction equality with a
standard twisted-Bockstein calculation.  Under

\[
K_3\cong\mathbf Z/4_\chi,
\qquad
K_2\cong\mathbf F_2,
\]

the coefficient transition is part of

\[
0\longrightarrow\mathbf F_2
\longrightarrow\mathbf Z/4_\chi
\longrightarrow\mathbf F_2
\longrightarrow0.
\]

For the sign character \(\chi=u+v\), its connecting map is

\[
d_\chi(x)=Sq^1(x)+\chi\smile x.
\]

Consequently,

\[
\operatorname{im}d_\chi^1
=\langle uv\rangle
=\ker d_\chi^2.
\]

The linear direction of the \(C_8\to C_4\) component image is
\(\ker d_\chi^2\), while the marked-loop translation image is
\(\operatorname{im}d_\chi^1\).  Thus the middle equality is degree-two
acyclicity of this twisted-Bockstein complex, together with the
representation-specific fact that the concrete marked \(D_8\) loops realize
the entire lower image.  It is not a new invariant-cycle theorem, and the
identification is not universal for arbitrary groups, twists, or degrees.
The affine and raw-lift qualifications above remain essential.
In particular, the refinement and holonomy directions are adjacent parts of
the same exact twisted-Bockstein complex in this fixture; their equality does
not yet demonstrate two independent semantic selectors.  A decisive next test
must use a nonexact degree or a path doctrine whose holonomy image is a proper
subgroup of the persistent direction.

See [the naming audit](./naming-audit-foundation-dream-2026.md) and
[Greenblatt, Theorem 2.3](https://projecteuclid.org/journals/homology-homotopy-and-applications/volume-8/issue-2/Homology-with-local-coefficients-and-characteristic-classes/hha/1175791075.pdf).

This supplies the strongest exact interpretation presently available:

> The executed \(C_8\to C_4\) rank-one image is the concrete \(D_8\)
> holonomy direction.  Standard cyclic-sign cohomology promotes that same
> direction to the persistent component core of the full integral/2-adic
> branch; the \(u^2\) and \(v^2\) directions are finite-level artifacts.

At the final quotient

\[
\mathbf Z/4_\chi\longrightarrow\mathbf F_2,
\]

the coefficient kernel becomes zero, the lift fiber becomes a singleton, and
the persistent transport dies.  Thus the final edge is best viewed as a
vanishing-transport map, not as the source of a newly created direction.

---

## 9. Gauge and path-retention kill switch

The persistent line exists as an ordinary inverse-system invariant whether or
not it is declared semantically observable.  The word “transport” requires an
additional path doctrine.

### Standard gauge

**[E]** Under the eight normalized \(K\)-valued one-cochains, the selected
\(C_4\) fiber has eight components and concrete extension loops translate
those components by \(uv\).

### Loop-gauge quotient

**[E]** The executable forms all thirty-two normalized parity-preserving
\(B\)-valued one-cochains.  They produce four distinct coboundary tables.
Enlarging gauge by these tables collapses the eight components to four and
erases the holonomy direction.  Equivalently, the component labels form four
explicit two-element loop-gauge orbits.

This is the decisive kill switch: if every concrete marked-extension loop is
declared gauge, no retained holonomy direction remains in the quotient.

Therefore:

- **[S]** \(\langle uv\rangle\) is a canonical persistent pro-cohomological
  subspace;
- **[D]** treating its concrete loop action as a path-sensitive observable is
  a semantic choice;
- quotienting the loops as gauge kills the proposed path observable without
  invalidating the underlying pro-cohomology calculation.

Any future admission theorem must state its equivalence doctrine before
claiming that the persistent line is a newly available distinction.

---

## 10. The exact theorem package

### Theorem A: index-two-shell transgression

Within the orbit-generated abelian policy doctrine for the concrete marked
\(D_8\) extension:

1. \(V=\operatorname{Hom}_Q(A,\mathbf F_2)\cong\mathbf F_2^3\).
2. Its seven nonzero points classify every \(Q\)-stable index-two relation
   subgroup of \(A\).
3. Those points carry the Fano-plane incidence.
4. The universal residue map is
   \[
   R_c(\eta,\alpha,\beta)
   =(\alpha+\eta)u^2v+(\beta+\eta)uv^2.
   \]
5. Its kernel is \(\{000,111\}\).
6. The point \(111\) is the unique nonthin minimum-cardinality liftable policy
   in the index-two shell.
7. This point and its residue-zero property are covariant under marked
   extension automorphisms.

Items 1 and the finite lift census are directly executed; completeness,
residue naturality, and categorical interpretation are theorem-derived as
marked above.

### Theorem B: persistent sign branch

The selected character \(\chi=u+v\) defines an integral signed-augmentation
policy and compatible even cyclic quotients.  The explicit integral cocycle
\(F_\infty\) lifts \(c\).  Along the pure 2-power ray, the persistent image in
component cohomology is the affine \(uv\) line.  At \(C_4\), that line equals
the component image of the concrete \(D_8\) loop holonomy.

Integral existence and the \(C_8\to C_4\) base case are executed.  The general
transition formula and inverse-limit statement are standard/theorem-derived.

### Corollary: vanishing transport at thin collapse

The selected \(C_4\) policy is the coarsest noncontractible cyclic sign policy.
Its quotient to thin kills the coefficient kernel and hence the persistent
holonomy line.  The order-four object is therefore a minimal finite shadow and
final noncontractible branch node, not an isolated or globally initial
nullifier.

---

## 11. What is not proved

The following boundaries are explicit and load-bearing.

### No global policy uniqueness

The full finite relation-policy category is infinite; the cyclic policies
\(\mathbf Z/2^n_\chi\) already demonstrate this.  Arbitrary noncyclic
two-primary carriers and larger mixed policies remain unclassified.

The theorem does not claim:

- that \(C_4{}_{u+v}\) is the first liftable policy;
- that it is initial in the full nullifier category;
- that the signed cyclic branch is every liftable policy;
- that the full relation lattice has been enumerated.

### No genesis/admission theorem

The fixed policy diagram, its lift fibers, and their inverse system are
ordinary mathematical objects.  Computing a persistent subspace inside this
pre-existing diagram is not by itself endogenous generation.

Still open is a type-former that, from the current semantic failure alone:

1. constructs or selects the necessary policy branch without a hidden stage
   counter or preinstalled completion;
2. proves that the selected branch is least or universal for the unresolved
   test;
3. adjoins the full affine persistent direction—not a coordinate origin—to
   the observable algebra;
4. proves that this observable was absent from the prior observable closure;
5. behaves naturally under presentation, chart, policy, and gauge equivalence;
6. stutters on contractible fibers.

Until such a law is given, “admit the persistent holonomy line as a new probe”
is **[D]**, not a consequence of Theorems A and B.

### No non-sofic theorem

The source group here is finite \(D_8\), hence sofic.  The experiment proves
no implication from non-soficity, no non-sofic universal approximator, and no
failure of finite approximation for the resulting policy diagram.

A future bridge would have to show that finite obstruction certificates from
the non-sofic proof canonically instantiate a family of diagrams of the type
studied here and force unbounded or non-finitely-compressible probe growth.

### No AI architecture theorem

No learning architecture, estimator, optimizer, scaling law, risk advantage,
or bounded-observer lower bound follows from this finite calculation.  The
persistent line is a candidate probe module, not an executed machine-learning
component.

### No consequence for major conjectures

Nothing here proves or materially advances the Hodge conjecture,
Navier--Stokes regularity, Collatz, the Riemann hypothesis, \(P\) versus
\(NP\), or the algebrization barrier.  Analogies involving obstruction,
completion, local-to-global failure, or vanishing transport remain research
motivation until a problem-specific functor and theorem are constructed.

### No novelty or no-prior-art claim

The policy category, mapping/lift fibers, group cohomology, and persistent
inverse-system core all have strong standard precedents.  Any novelty claim
must concern a future endogenous semantic admission law or an architectural
complexity theorem, and must be supported by a separate literature and prior
art audit.

---

## 12. Decisive falsifiers and next open problems

The present theorem package should be rejected or narrowed if any of the
following occurs.

1. **Kernel falsifier.** Canonical relation-kernel reduction does not give
   exactly one thin, four cyclic, and three transvection policies.
2. **Incidence falsifier.** The invariant dual is not three-dimensional or the
   seven nonzero points fail the seven-line/twenty-one-incidence census.
3. **Residue falsifier.** Direct cochain calculation disagrees with
   \(R_c=\eta Sq^1(c)+\chi c\), or another nonzero shell point enters its
   kernel.
4. **Morphism falsifier.** A pointed policy morphism exists between distinct
   order-four kernels, contrary to relation-subgroup inclusion.
5. **Covariance falsifier.** A legitimate marked-extension automorphism carries
   \(111\) to an unliftable policy or changes the residue-zero locus.
6. **Integral falsifier.** The displayed \(F_\infty\) fails a twisted cocycle or
   parity equation.
7. **Transition falsifier.** A finer \(2\)-power quotient contributes a
   persistent \(u^2\) or \(v^2\) direction, or loses \(uv\).
8. **Holonomy falsifier.** The concrete loop image differs from the
   \(C_8\to C_4\) component image.
9. **Equivalence falsifier.** Target inversion or a legitimate presentation
   change destroys the affine line rather than merely changing its origin or
   coordinates.
10. **Genesis collision.** A standard fixed mapping-stack or pro-cohomology
    construction already supplies the entire claimed “admission” operation,
    showing that the proposal only filters a preinstalled diagram.

The most direct mathematical open problems are:

- classify the noncyclic two-primary liftable locus;
- state a universal property for the selected sign branch inside a broader
  policy category;
- formulate the persistent core without a chosen coefficient origin;
- prove full chart and presentation covariance at the executable level;
- construct and falsify an endogenous admission type-former;
- only after that, test whether non-sofic obstruction families force genuinely
  unbounded probe-category growth.

---

## 13. Executed certificate

Run:

```powershell
node outputs/oasis-nonsofic-engine/research/genesis-policy-lift-diagram.mjs
```

The current certificate reports:

- status: `PASS`;
- actual eight-state \(D_8\) source consumed;
- invariant dual dimension: `3`;
- Fano points/lines/incidences: `7 / 7 / 21`;
- unique liftable nonthin index-two-kernel point: `(eta,chi)=(1,u+v)`;
- selected \(C_4\) lifts/components: `16 / 8`;
- \(C_8\) compatible cochains/lifts/components:
  `262144 / 64 / 8`;
- \(C_8\to C_4\) raw images/component images: `4 / 2`;
- executed (C_8	o C_4) component-image rank: `1`;
- concrete holonomy rank: `1`;
- executed (C_8	o C_4) image equals concrete holonomy image: `true`;
- all-level persistent core executed: `false`;
- endogenous admission law established: `false`;
- non-sofic or AI architecture established: `false`;
- replay: `ok`;
- adversarial mutations rejected: `30 / 30`.

Certificate digest:

```text
4f3201476bf0db6d8af016eda9e0978213bf7ac3da373965c9583f84286dc87c
```

Companion executable SHA-256:

```text
53e4b08a9183d914858d17eee774e82ef3e57e1fda4fe122eb426e1641db09fb
```

The digest authenticates the companion certificate fields.  It does not turn
the theorem-derived general tower formulas or the declared admission law into
executed claims.
