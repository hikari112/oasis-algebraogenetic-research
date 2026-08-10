# Genesis nullification-fiber holonomy

## Exact result

The actual eight-state interchange laboratory now supports a second, strictly finite theorem.  Its concrete permutation group is the same \(D_8\) produced by the OP/PO construction; no abstract replacement group is introduced.

Write its marked central extension as

\[
1\longrightarrow \mathbf F_2\longrightarrow P_{\mathrm{int}}
\longrightarrow Q=\mathbf F_2^2\longrightarrow 1,
\]

with quotient coordinates \(u,v\in H^1(Q;\mathbf F_2)\).  The OP chart gives the factor set

\[
c(g,h)=u(g)v(h)=u\smile v(g,h).
\]

Its diagonal is the intrinsic quadratic square

\[
\mathfrak q(g)=c(g,g)=u(g)v(g).
\]

Thus \((1,1)\) is the unique anisotropic quotient direction.  Among the four characters \(Q\to\mathbf F_2\), the unique nonzero character that vanishes on that direction is

\[
\chi=u+v.
\]

Now declare the narrow coefficient-policy class consisting of the four cyclic order-four carriers

\[
B_\psi=\mathbf Z/4_\psi,
\qquad
g\cdot n=(-1)^{\psi(g)}n,
\]

one for each character \(\psi:Q\to\mathbf F_2\), together with reduction modulo two.  Exhaustion proves that \(\chi=u+v\) is also the **unique member of this declared class** for which \(c\) has a normalized \(B_\psi\)-valued two-cocycle lift:

| sign character \(\psi\) | parity-compatible normalized cochains | cocycle lifts |
|---|---:|---:|
| \(0\) | 512 | 0 |
| \(u\) | 512 | 0 |
| \(v\) | 512 | 0 |
| \(u+v\) | 512 | 16 |

For the selected carrier, the lift groupoid has eight \(K\)-gauge components, where \(K=\{0,2\}\cong\mathbf F_2\).  Concrete inner automorphism loops of the same \(D_8\) extension act nontrivially on those components even though the endpoint factor set and its selected connecting residue remain unchanged.  The image of this component holonomy has rank one.

This selection is counter-free and invariant under a change of quotient basis inside the marked \(D_8\) extension.  The declaration of the four-member policy class is a separate assumption; the extension does not yet force that ambient class.

The executable certificate is [genesis-nullification-fiber-holonomy.mjs](./genesis-nullification-fiber-holonomy.mjs).

## 1. The source is the same eight-state semantic instance

The program calls `buildGenesisInterchangeTransductionInput()` and reconstructs all of the following from its eight-state OP and PO action tables:

- the order-eight concrete permutation group \(P_{\mathrm{int}}\cong D_8\);
- its central commutator involution;
- the quotient \(Q\cong\mathbf F_2^2\);
- the OP and PO normalized sections;
- the two factor sets

  \[
  c_{\mathrm{OP}}=u\smile v,
  \qquad
  c_{\mathrm{PO}}=v\smile u.
  \]

The based coherent comparison \(\theta_0\) transports the PO actions and section into the OP permutation group.  Consequently, every later lift, loop, and chart comparison refers to this one executable extension.  The result is stronger than observing that two separately built groups happen to be isomorphic to \(D_8\).

## 2. The nullifying carrier

For \(\chi=u+v\), use the exact sequence of \(Q\)-modules

\[
0\longrightarrow K=\{0,2\}
\longrightarrow B=\mathbf Z/4_\chi
\xrightarrow{\;\bmod 2\;}\mathbf F_2
\longrightarrow 0.
\]

The sign action is invisible on the kernel \(K\), so \(K\cong\mathbf F_2\) has trivial \(Q\)-action.  The selected carrier is also an explicit quotient of the earlier regular free carrier: on the standard basis of \(\mathbf Z[Q]\),

\[
\Phi([q])=(-1)^{\chi(q)}\pmod 4,
\]

whose four basis images are \(1,3,3,1\).  The program verifies both \(Q\)-equivariance and compatibility with the coefficient maps to \(\mathbf F_2\).

The word *nullification* has a precise, limited meaning here.  The free regular carrier has a nonzero connecting residue for \(c\), whereas the quotient carrier \(B\) admits a genuine cocycle lift and therefore sends that residue to zero.  It does not mean that the original free-filler class was incorrectly computed.

For a normalized two-cochain \(F:Q^2\to B\), the twisted cocycle equation is

\[
(d_\chi F)(g,h,k)
=(-1)^{\chi(g)}F(h,k)-F(g+h,k)
+F(g,h+k)-F(g,h)=0\pmod 4.
\]

There are nine nontrivial normalized entries.  Once \(F\bmod2=c\) is fixed, each entry has two possible lifts, giving \(2^9=512\) candidates.  The exhaustive check finds exactly sixteen solutions for \(\chi\).  One explicit base lift is

\[
F_0(g,h)=\bigl(3+2v(g)\bigr)u(g)v(h)\pmod4.
\]

## 3. The lift fiber has eight components

A normalized \(K\)-valued one-cochain \(\lambda\) acts by

\[
F\longmapsto F+d_\chi(2\lambda).
\]

All eight normalized choices of \(\lambda:Q\to\mathbf F_2\) are checked.  The stabilizer has four elements, so every orbit contains two of the sixteen lifts and the fiber has eight components.

Relative to \(F_0\), put

\[
z_F=\frac{F-F_0}{2}\in Z^2(Q;K).
\]

The program labels the component of \(F\) by

\[
\left(
z_F(10,10),
z_F(10,01)+z_F(01,10),
z_F(01,01)
\right).
\]

These are the coefficients of \(u^2,uv,v^2\), respectively.  Every element of

\[
H^2(Q;K)=\langle u^2,uv,v^2\rangle\cong\mathbf F_2^3
\]

occurs exactly once, so

\[
\pi_0\simeq\mathbf F_2^3,
\qquad
\pi_1\simeq H^1(Q;K)=\mathbf F_2^2,
\qquad
\pi_2\simeq H^0(Q;K)=\mathbf F_2.
\]

These are the ordinary homotopy groups of the corresponding cochain-level lift fiber.  No new homotopy theory is being asserted by this calculation.

The executable also performs the low-degree chain census behind the last two claims: there are two normalized \(K\)-valued zero-cochains, while their images give one distinct normalized one-coboundary (the zero cochain).  Together with the four normalized one-cocycles, this realizes \(H^0(Q;K)\cong\mathbf F_2\) and \(H^1(Q;K)\cong\mathbf F_2^2\) directly rather than recording only their expected dimensions.

## 4. Concrete inner loops and endpoint-invisible transport

Conjugation by concrete section lifts in \(P_{\mathrm{int}}\) fixes the marked quotient and central kernel but changes the chosen section by a normalized \(\mathbf F_2\)-valued one-cocycle.  Direct permutation calculation gives

\[
\begin{aligned}
\operatorname{conj}_{10}&\rightsquigarrow v,\\
\operatorname{conj}_{01}&\rightsquigarrow u,\\
\operatorname{conj}_{11}&\rightsquigarrow u+v.
\end{aligned}
\]

The executable transport is driven directly by these three permutation-derived conjugation cochains.  It does not replace them with independently declared character tables.  After deriving the cochains, it identifies conjugation by quotient element \(10\) with \(v\), conjugation by \(01\) with \(u\), and conjugation by \(11\) with \(u+v\); those concrete records then supply the loops used below.

For a loop \(a\in Z^1(Q;\mathbf F_2)\), choose its standard lift \(\widetilde a:Q\to\{0,1\}\subset\mathbf Z/4\).  Transport in the lift fiber is

\[
F\longmapsto F+d_\chi\widetilde a.
\]

Since \(da=0\pmod2\), the added table is \(K\)-valued and its component class is the degree-one connecting map

\[
\delta_1(a)=\left[\frac{d_\chi\widetilde a}{2}\right]
\in H^2(Q;K).
\]

The exact values are

\[
\boxed{
\delta_1(u)=uv,
\qquad
\delta_1(v)=uv,
\qquad
\delta_1(u+v)=0.
}
\]

Thus the loop action translates \(\pi_0\cong\mathbf F_2^3\) only in its \(uv\) coordinate.  Its image has rank one and partitions the eight components into four two-element holonomy orbits.

This is the exact endpoint/path separation established by the experiment:

- the marked extension factor table at the endpoint is unchanged;
- the selected degree-two connecting residue remains zero;
- nevertheless, the path through the marked-extension automorphism loop transports a lift to a different \(K\)-gauge component.

Calling this transport *semantic* still requires the declared doctrine that such automorphism loops remain paths rather than being collapsed as gauge.  The algebra alone does not make that doctrine mandatory.

## 5. Sequential and direct paths carry \(2ab\)

The standard lifts of two binary one-cocycles do not add strictly.  Pointwise,

\[
\widetilde a+\widetilde b-\widetilde{a+b}=2ab.
\]

Therefore the sequential and direct transports satisfy

\[
d_\chi\widetilde a+d_\chi\widetilde b
=d_\chi\widetilde{a+b}+d_\chi(2ab).
\]

The final term is an exact \(K\)-gauge carry.  The executable verifies this equality for all sixteen ordered pairs of loops and all sixteen lift objects, for 256 composition checks.  Hence direct and sequential continuation agree on \(\pi_0\), while their cochain representatives retain the explicit binary carry witness \(2ab\).

This carry is useful because it locates the higher coherence rather than merely asserting that cohomology classes compose.  It is still standard connecting-map algebra, not evidence by itself for a new higher-categorical law.

## 6. OP and PO define equivalent lift fibers

The two concrete charts differ by the normalized cochain

\[
\phi(g)=u(g)v(g),
\qquad
c_{\mathrm{OP}}+c_{\mathrm{PO}}=d\phi\pmod2.
\]

Lifting \(\phi\) by its values in \(\{0,1\}\subset B\) gives the exact object map

\[
F_{\mathrm{PO}}=F_{\mathrm{OP}}+d_\chi\widetilde\phi.
\]

The program checks all sixteen lift objects and all 128 object/gauge pairs.  This map is bijective, commutes with every \(K\)-gauge arrow, and preserves the \(H^2(Q;K)\) component labels.  The raw OP and PO lift tables are not falsely identified; the statement is an explicit equivalence of their lift fibers.

## 7. Controls and causal separation

The controls sharply separate three logically different ingredients: the extension class, the coefficient policy, and the decision to retain loops as paths.

### Wrong sign policies

For \(B_0,B_u,B_v\), exhaustive search finds no normalized cocycle lift of the concrete nonsplit factor set.  The uniqueness of \(\chi\) is therefore exact **inside the four-policy class**.

### Free regular carrier

For the regular carrier \(\mathbf Z[Q]\), restriction to the anisotropic subgroup generated by \(11\) gives the nonzero residue

\[
[-1,0,0,1].
\]

The parity obstruction is also exhausted rather than left as a dimension assertion.  The program checks all sixteen mod-two parity patterns for a possible primitive of the restricted equation.  Four patterns solve the unrestricted equation, every one has odd augmentation, and zero even-augmentation patterns solve it.  Hence the required even-augmentation primitive does not exist and the normalized cocycle-lift fiber is empty.  The selected \(\mathbf Z/4_\chi\) carrier truly nullifies a residue that survives in the free carrier.

### Thin carrier

For \(B=\mathbf F_2\) with the identity coefficient map, the kernel is trivial.  The executable enumerates the single parity-compatible normalized cochain, verifies its cocycle equation in all 64 triples, and checks invariance under all concrete loop/table entries in 64 loop checks.  The lift fiber is therefore an executed singleton and its loop holonomy has rank zero.  Merely retaining the extension class does not produce component transport without a nontrivial coefficient fiber.

### Split extension with the policy held fixed

Set \(c=0\).  All four sign policies now admit sixteen lifts and eight components, so the split class selects no unique character.  However, if \(\chi=u+v\) is held manually as coefficient policy, the same shifts remain:

\[
0,\ uv,\ uv,\ 0.
\]

This is the most important negative control.  It shows that the nontrivial holonomy is a feature of the chosen coefficient exact sequence and its degree-one connecting map.  The nonsplit extension class selects that policy within the declared class, but the nonsplit class alone does not generate the holonomy.

The loop source in this split control must be stated differently from the nonsplit experiment.  The split extension is abelian, so it has no nontrivial inner conjugation loops.  Its retained \(u,v,u+v\) loops are **outer marked-extension \(H^1\)-automorphisms** supplied to the held coefficient policy.  Thus the control preserves the connecting-map input without pretending that those loops arise by inner conjugation in the split group.

### Treating every extension loop as gauge

If the concrete automorphism loops are themselves quotiented as gauge, the rank-one \(uv\) direction is erased.  The eight \(K\)-gauge components collapse to four loop-gauge components, and no retained holonomy direction remains in the quotient.

This control does not quotient by every possible translation in \(H^2(Q;K)\); it quotients by the full image of the concrete loop action.  The distinction matters.  It proves that path retention is necessary for the observed direction to remain observable.

## 8. What has actually been proved

For this concrete eight-state marked extension and the declared four-member cyclic sign-policy class, the executable proves:

1. The diagonal square has one anisotropic direction and determines \(\chi=u+v\) internally to the marked \(D_8\) instance.
2. Exactly one sign policy admits cocycle lifts of the extension factor set.
3. Its lift fiber has sixteen objects and eight \(K\)-gauge components.
4. Concrete inner automorphism loops induce the connecting-map action
   \(\delta_1(u)=\delta_1(v)=uv\), \(\delta_1(u+v)=0\).
5. Direct and sequential loop transport differ by the explicit \(K\)-gauge carry \(2ab\).
6. OP and PO charts give explicitly equivalent lift fibers.
7. The split, thin, free, wrong-sign, and loop-gauge controls isolate the cause of each effect.
8. The complete certificate is deterministically replayed, and all 26 adversarial mutations are rejected.

The certificate digest is

```text
b1123c3edff91797d4d15e487a3aeb28364998a1ef77d2aab2e15827df9d4645
```

Run it with:

```powershell
node research/genesis-nullification-fiber-holonomy.mjs
```

## 9. Theorem boundary

This experiment is an exact finite realization of known group-cohomology, homotopy-fiber, and connecting-map algebra.  It does **not** establish any of the following:

- that the cyclic order-four policy class is forced by the earlier genesis semantics;
- that the obstruction itself causes the component holonomy;
- that extension automorphism loops must be retained as semantic paths;
- that the full localized-obligation ancestry has been transported into this fiber;
- that an autonomous next-question law has been constructed;
- that a non-sofic process or group has been obtained;
- that any consequence for Hodge, Navier--Stokes, Collatz, the Riemann hypothesis, or another open problem follows;
- that the construction has no prior art.

The strongest legitimate conclusion is narrower and more useful:

\[
\boxed{
\text{extension data select a residue-nullifying policy;}
\quad
\text{that policy carries endpoint-invisible loop transport.}
}
\]

The split control forces the semicolon in that statement.  Selection and transport are adjacent stages, not one undifferentiated cause.

## 10. Next mathematical gap

The next target is no longer another census.  It is to derive, from the native genesis process, both pieces that remain declared here:

1. why the admissible coefficient carriers should include or prefer the cyclic sign family; and
2. why the concrete inner loops should survive as semantic continuations rather than gauge.

A successful law would have to consume the actual obligation ancestry or refinement history and output the carrier plus its path policy without consulting a stage counter.  Until that derivation exists, this theorem is a rigorous bridge between the interchange extension and a path-sensitive lift fiber, not yet an autonomous genesis law.
