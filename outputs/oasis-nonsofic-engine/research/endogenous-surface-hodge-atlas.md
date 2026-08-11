# Endogenous surface Hodge atlas

## Status and binding boundary

**Research date:** 2026-08-10

**Classification:** two arbitrary-genus theorems built from standard surface
covers, cellular cochains, Fox derivatives, finite-deck character
decomposition, and cellular Hodge theory.

**Orientable executable binding:**
[genesis-surface-hodge-atlas.mjs](./genesis-surface-hodge-atlas.mjs),
certificate
`4ff4a75c0707e1029c0cf1dc454da0914df92838bc28cb94c779bb375e2dc767`,
payload
`c0eededfb65e437ab625abbff254663067d76b19f4a0cd23c7f13b7481350506`,
source SHA-256
`652D34C8709747C6BB045D120DE2C08A7795140A677437E30A7CF31E1BFF4D8F`.
The current rerun is deterministic, rejects all \(16/16\) declared mutations,
and passes eight structural security regressions.

**Affine executable binding:**
[genesis-affine-nonorientable-surface.mjs](./genesis-affine-nonorientable-surface.mjs),
certificate
`dd3216db23ec82ff930f180f8bf0f605a091517763edc5f09701cf26d434faa6`,
payload
`545141b108492d44fb26d16682a7d0fb7949410e15b6fd17f9f1f22d39bf1ae5`,
source SHA-256
`A0D5BF7BA11942DD9A3A75878861E8DC38D7B06F6BC020F02D590FD080DEA014`.
The independently audited rerun is deterministic, rejects all \(17/17\)
declared mutations, and passes eight structural security regressions.

The main result uses the closed nonorientable surface
\(N_g=\#^g\mathbf{RP}^2\), coefficients in \(\mathbf F_3\), and a
history-active subspace of \(H^1(N_g;\mathbf F_3)\). Its unique two-cell is
load-bearing twice:

1. it cuts the admissible degree-one data from \(\mathbf F_3^g\) to the
   cocycle hyperplane \(\sum_i a_i=0\); and
2. after passage to the active cover, deleting the lifted faces creates
   exactly \(3^r\) degree-one graph-shadow modes.

An orientable \(\mathbf F_2\) sign-surface family is retained as a
complementary control. In that family the face is not needed to define the
abelian mod-two active space, but its Fox term supplies an orthogonal
degree-one Hodge direction for every nontrivial active sign character.
Deleting the faces creates exactly \(2^r-1\) modes.

This note follows the exact cover and observer interface of the earlier
[active cohomology atlas](./endogenous-active-cohomology-atlas.md), applies
the classification discipline of the
[collapse-closure note](./endogenous-admission-collapse-closure.md), and
uses the collision boundary recorded by the
[local literature audit](./literature-active-cohomology-admission-2026.md).

Neither family supplies Level C, mathematical novelty, or progress on an open
conjecture.

## Part I. The affine-admission surface

## 1. Nonorientable surface and face-defined active space

Let \(g\geq2\), and let

\[
N_g=\#^g\mathbf{RP}^2
\]

be the closed connected nonorientable surface of genus \(g\). Use its standard
CW presentation with one vertex, oriented one-cells

\[
x_1,\ldots,x_g,
\]

and one two-cell attached along

\[
R_g=x_1^2x_2^2\cdots x_g^2.
\tag{1}
\]

Over \(\mathbf F_3\), the cellular cochain complex begins

\[
\mathbf F_3
\xrightarrow{\,d^0=0\,}
\mathbf F_3^g
\xrightarrow{\,d^1\,}
\mathbf F_3,
\qquad
d^1(a_1,\ldots,a_g)=2\sum_{i=1}^{g}a_i.
\tag{2}
\]

Since \(2\) is invertible in \(\mathbf F_3\),

\[
H^1(N_g;\mathbf F_3)
=
\left\{
(a_1,\ldots,a_g)\in\mathbf F_3^g:
\sum_{i=1}^{g}a_i=0
\right\},
\tag{3}
\]

and therefore

\[
\dim_{\mathbf F_3}H^1(N_g;\mathbf F_3)=g-1.
\tag{4}
\]

Equation (3) is the first face-essential admission fact. If the two-cell is
deleted while the one-skeleton is held fixed, every vector in
\(\mathbf F_3^g\) becomes a cocycle. The missing face has not merely changed
a later energy; it has changed which period data are legally admitted.

Fix an active subspace

\[
S\leq H^1(N_g;\mathbf F_3),
\qquad
\dim S=r.
\tag{5}
\]

Put

\[
A=S^*=\operatorname{Hom}_{\mathbf F_3}(S,\mathbf F_3),
\qquad
d=|A|=3^r.
\tag{6}
\]

Evaluation defines

\[
\rho_S:\pi_1(N_g)\longrightarrow A,
\qquad
\rho_S(\gamma)(\alpha)=\langle\alpha,[\gamma]\rangle.
\tag{7}
\]

The inclusion \(S\hookrightarrow H^1(N_g;\mathbf F_3)\) dualizes to a
surjection \(H_1(N_g;\mathbf F_3)\twoheadrightarrow S^*\), so \(\rho_S\) is
surjective. Let

\[
p_S:Y_S\longrightarrow N_g
\tag{8}
\]

be the connected rooted cover corresponding to \(\ker\rho_S\). It is regular
with deck group \(A\) and degree \(d=3^r\).

## 2. Arbitrary-genus affine-admission theorem

### Theorem 2.1

For every \(g\geq2\) and every rank-\(r\) subspace
\(S\leq H^1(N_g;\mathbf F_3)\), the cover (8) has the following properties.

1. **Exact kernel.**

   \[
   \ker\!\left(
   p_S^*:H^1(N_g;\mathbf F_3)
   \longrightarrow H^1(Y_S;\mathbf F_3)
   \right)=S.
   \tag{9}
   \]

2. **Coarsest rooted property.** Every connected rooted cover of \(N_g\)
   killing all classes in \(S\) maps uniquely over \(N_g\) to \(Y_S\).

3. **Universal affine primitive.** The lifted vertices carry a canonical
   root-normalized function

   \[
   U_S:Y_S^0\longrightarrow A,
   \qquad
   U_S(\lambda)=\lambda,
   \tag{10}
   \]

   whose coboundary is the pulled-back universal evaluation cocycle. For
   every \(\alpha\in S\),

   \[
   u_\alpha=\operatorname{ev}_\alpha U_S
   \quad\text{satisfies}\quad
   du_\alpha=p_S^*\alpha,
   \qquad
   u_\alpha(\widetilde o)=0.
   \tag{11}
   \]

   This primitive is unique after root normalization.

4. **Odd cover remains nonorientable.** The cover \(Y_S\) is the closed
   nonorientable surface of genus

   \[
   G=2+3^r(g-2).
   \tag{12}
   \]

5. **Rational Betti numbers.**

   \[
   (b_0,b_1,b_2)(Y_S;\mathbf Q)
   =
   \bigl(1,\,1+3^r(g-2),\,0\bigr).
   \tag{13}
   \]

6. **Face-rank theorem.** The lifted CW presentation has \(d\) vertices,
   \(gd\) edges, and \(d\) faces, with rational boundary ranks

   \[
   \operatorname{rank}\partial_1=d-1,
   \qquad
   \operatorname{rank}\partial_2=d.
   \tag{14}
   \]

7. **Exact graph-shadow ablation.** Deleting every lifted face while holding
   the lifted one-skeleton fixed raises the first Betti number by

   \[
   b_1(Y_S^{(1)};\mathbf Q)-b_1(Y_S;\mathbf Q)
   =
   d
   =
   3^r.
   \tag{15}
   \]

8. **Character resolution.** After extending scalars to \(\mathbf C\), the
   regular deck representation splits into \(d\) one-dimensional character
   sectors. Every sector contains exactly one nonzero face direction, so
   (15) is one face-controlled Hodge mode per deck character.

All statements are invariant under a change of basis of \(S\) and under a
rooted cellular recoding carrying \(S\) to the corresponding subspace.

## 3. Exact kernel, coarsest cover, and affine primitive

For any \(\alpha\in H^1(N_g;\mathbf F_3)\),

\[
\begin{aligned}
p_S^*\alpha=0
&\Longleftrightarrow
\alpha|_{\ker\rho_S}=0\\
&\Longleftrightarrow
\alpha\text{ factors through }A\\
&\Longleftrightarrow
\alpha\in A^*=S^{**}\cong S.
\end{aligned}
\tag{16}
\]

This proves (9). If \(q:Z\to N_g\) kills \(S\), then

\[
q_*\pi_1(Z)\subseteq\ker\rho_S,
\tag{17}
\]

so the rooted covering-lift criterion gives the unique map \(Z\to Y_S\).
The arrow direction records coarseness: a finer repair maps to \(Y_S\).

For the affine primitive, let

\[
v_i=\rho_S(x_i)\in A.
\tag{18}
\]

Represent a lifted vertex by its sheet \(\lambda\in A\). The oriented lift of
\(x_i\) beginning at \(\lambda\) ends at \(\lambda+v_i\). Hence (10) gives

\[
(dU_S)(\widetilde x_{i,\lambda})
=
U_S(\lambda+v_i)-U_S(\lambda)
=v_i.
\tag{19}
\]

For every \(\alpha\in S\), evaluation of (19) is exactly
\(\alpha(x_i)\). This proves (11).

The face is essential to the construction. The lifted attaching word closes
because

\[
\rho_S(R_g)=2\sum_{i=1}^{g}v_i=0.
\tag{20}
\]

Indeed, evaluating (20) at \(\alpha\in S\) gives
\(2\sum_i\alpha(x_i)=0\), precisely the cocycle condition (3). If one starts
with a vector outside the hyperplane (3), the proposed face lift does not
close. The surface relation therefore controls admission before any Hodge
operator is introduced.

Every scalar primitive \(u_\alpha\) is unique after fixing its root value:
the difference of two primitives is a zero-cocycle on the connected cover and
is therefore constant.

## 4. Nonorientability, rational ranks, and the \(3^r\) face gap

The orientation character of \(N_g\) is a nontrivial homomorphism

\[
w_1:\pi_1(N_g)\longrightarrow\mathbf Z/2.
\tag{21}
\]

The cover \(Y_S\) would be orientable only if
\(\ker\rho_S\subseteq\ker w_1\), equivalently if \(w_1\) factored through the
deck group \(A\). But \(A\) has odd order, so it has no nontrivial quotient of
order two. Thus \(Y_S\) is nonorientable.

Euler characteristic multiplies under the degree-\(d\) cover:

\[
\chi(Y_S)=d(2-g)=2-G.
\tag{22}
\]

This gives (12). A closed connected nonorientable surface has rational
\(b_0=1\), \(b_2=0\), and \(b_1=G-1\), proving (13).

The lifted one-skeleton is connected, so

\[
\operatorname{rank}_{\mathbf Q}\partial_1=d-1.
\tag{23}
\]

Since \(C_2(Y_S;\mathbf Q)\) has dimension \(d\) and
\(H_2(Y_S;\mathbf Q)=0\), \(\partial_2\) is injective and

\[
\operatorname{rank}_{\mathbf Q}\partial_2=d.
\tag{24}
\]

Consequently

\[
\begin{aligned}
b_1(Y_S;\mathbf Q)
&=gd-(d-1)-d
=1+d(g-2),\\
b_1(Y_S^{(1)};\mathbf Q)
&=gd-(d-1)
=1+d(g-1).
\end{aligned}
\tag{25}
\]

Their difference is \(d=3^r\).

An independent birth changes \(r\) to \(r+1\), so the face gap changes from
\(3^r\) to \(3^{r+1}\). It creates

\[
3^{r+1}-3^r=2\cdot3^r
\tag{26}
\]

additional face directions. A dependent class leaves \(S\), the cover, the
primitive, and the face gap unchanged.

## 5. Regular-character decomposition and Hodge directions

Let \(\widehat A=\operatorname{Hom}(A,\mu_3)\) be the complex character group.
The lifted cellular complex is the base complex with coefficients in the
regular representation:

\[
C^\bullet(Y_S;\mathbf C)
\cong
C^\bullet(N_g;\mathbf C[A])
\cong
\bigoplus_{\psi\in\widehat A}
C^\bullet(N_g;L_\psi).
\tag{27}
\]

For a character \(\psi\), put

\[
\zeta_i=\psi(v_i)\in\mu_3.
\tag{28}
\]

The face-closing identity (20) implies

\[
\prod_{i=1}^{g}\zeta_i^2=1.
\tag{29}
\]

The twisted cellular cochain complex is

\[
\mathbf C
\xrightarrow{\,d_\psi^0\,}
\mathbf C^g
\xrightarrow{\,d_\psi^1\,}
\mathbf C,
\tag{30}
\]

where

\[
d_\psi^0
=
\begin{pmatrix}
\zeta_1-1\\
\vdots\\
\zeta_g-1
\end{pmatrix}
\tag{31}
\]

and the Fox derivative of \(R_g=x_1^2\cdots x_g^2\) gives

\[
d_\psi^1
=
\begin{pmatrix}
1+\zeta_1&
\zeta_1^2(1+\zeta_2)&
\cdots&
\left(\prod_{j<g}\zeta_j^2\right)(1+\zeta_g)
\end{pmatrix}.
\tag{32}
\]

Equation (29) is equivalent to \(d_\psi^1d_\psi^0=0\). Since no cubic root of
unity equals \(-1\), the row (32) is nonzero for every \(\psi\). Thus
\(\operatorname{rank}d_\psi^1=1\) in every character sector.

For the trivial character, \(d_\psi^0=0\), so

\[
\dim H^\bullet(N_g;L_1)=(1,g-1,0).
\tag{33}
\]

For every nontrivial \(\psi\), \(d_\psi^0\) also has rank one, hence

\[
\dim H^\bullet(N_g;L_\psi)=(0,g-2,0).
\tag{34}
\]

Summing (33) and (34) over the \(d\) characters gives

\[
b_1=(g-1)+(d-1)(g-2)=1+d(g-2).
\tag{35}
\]

The degree-one Hodge images

\[
\operatorname{im}d_\psi^0
\quad\text{and}\quad
\operatorname{im}(d_\psi^1)^*
\tag{36}
\]

are orthogonal because \(d_\psi^1d_\psi^0=0\). The face image has dimension
one for every \(\psi\), including the trivial character. Deleting the faces
removes exactly these \(d\) mutually character-resolved directions and proves
(15) again.

Over \(\mathbf Q\), the trivial sector remains one-dimensional and the
nontrivial cubic characters assemble into conjugate two-dimensional
cyclotomic sectors. Extending scalars does not change the rational ranks in
(13)--(15); the complex splitting is used only to resolve the face directions
one character at a time.

## 6. Small exact fixtures

The first two nontrivial bases already expose the full pattern.

### \(N_2\)

Here

\[
H^1(N_2;\mathbf F_3)
=
\{(a,-a):a\in\mathbf F_3\}
\]

has rank one. The active ranks are \(r=0,1\), with:

| \(r\) | degree \(3^r\) | filled rational \(b_1\) | graph-shadow \(b_1\) | face gap |
|---:|---:|---:|---:|---:|
| \(0\) | \(1\) | \(1\) | \(2\) | \(1\) |
| \(1\) | \(3\) | \(1\) | \(4\) | \(3\) |

The rank-one cover is the nonorientable surface of genus \(2\).

### \(N_3\)

Here \(H^1(N_3;\mathbf F_3)\) has rank two. The active ranks are
\(r=0,1,2\), with:

| \(r\) | degree \(3^r\) | filled rational \(b_1\) | graph-shadow \(b_1\) | face gap |
|---:|---:|---:|---:|---:|
| \(0\) | \(1\) | \(2\) | \(3\) | \(1\) |
| \(1\) | \(3\) | \(4\) | \(7\) | \(3\) |
| \(2\) | \(9\) | \(10\) | \(19\) | \(9\) |

The rank-zero, rank-one, and rank-two stages make dependent stutter,
independent tripling, and the \(2\cdot3^r\) face-direction increment directly
testable.

## Part II. The orientable sign-Hodge control

## 7. Closed orientable surface and sign cochains

Let \(\Sigma_g\) be a closed connected oriented surface of genus \(g\geq1\),
with one vertex, one-cells

\[
a_1,b_1,\ldots,a_g,b_g,
\]

and one face attached along

\[
W_g=\prod_{i=1}^{g}[a_i,b_i].
\tag{37}
\]

Let

\[
S\leq H^1(\Sigma_g;\mathbf F_2),
\qquad
\dim S=r,
\qquad
D=S^*,
\qquad
n=|D|=2^r.
\tag{38}
\]

The evaluation cover

\[
q_S:Z_S\longrightarrow\Sigma_g
\tag{39}
\]

is the coarsest connected rooted cover killing exactly \(S\), has deck group
\(D\), degree \(n\), and genus

\[
\widetilde g=1+n(g-1).
\tag{40}
\]

Fix \(\chi\in H^1(\Sigma_g;\mathbf F_2)\) and put

\[
A_i=(-1)^{\chi(a_i)},
\qquad
B_i=(-1)^{\chi(b_i)}.
\tag{41}
\]

The rational sign-local-system cochain complex is

\[
\mathbf Q
\xrightarrow{\,d_\chi^0\,}
\mathbf Q^{2g}
\xrightarrow{\,d_\chi^1\,}
\mathbf Q,
\tag{42}
\]

with Fox formulas

\[
d_\chi^0
=
\begin{pmatrix}
A_1-1\\
B_1-1\\
\vdots\\
A_g-1\\
B_g-1
\end{pmatrix},
\qquad
d_\chi^1
=
\begin{pmatrix}
1-B_1&A_1-1&\cdots&1-B_g&A_g-1
\end{pmatrix}.
\tag{43}
\]

For every handle,

\[
(1-B_i)(A_i-1)+(A_i-1)(B_i-1)=0,
\tag{44}
\]

so \(d_\chi^1d_\chi^0=0\).

If \(w(\chi)\) is the number of negative signs among
\(A_1,B_1,\ldots,A_g,B_g\), then in the displayed equal-cell metric

\[
\|d_\chi^0\|^2
=
\|(d_\chi^1)^*\|^2
=4w(\chi),
\qquad
\langle d_\chi^0,(d_\chi^1)^*\rangle=0.
\tag{45}
\]

For nonzero \(\chi\), both maps have rank one and

\[
\dim H^\bullet(\Sigma_g;L_\chi)=(0,2g-2,0).
\tag{46}
\]

For \(\chi=0\), both maps vanish and the dimensions are \((1,2g,1)\).

The degree-one Hodge Laplacian

\[
\Delta_\chi^1
=
d_\chi^0(d_\chi^0)^*
+(d_\chi^1)^*d_\chi^1
\tag{47}
\]

therefore has two orthogonal rank-one positive directions for every nonzero
\(\chi\). In the displayed metric their two eigenvalues are
\(4w(\chi)\). Orthogonality and ranks survive an isometric chain recoding;
the numerical eigenvalue is not invariant under an arbitrary nonisometric
presentation change.

## 8. Regular signs, \(2^r-1\) face modes, and untwisting

The rational regular representation of the elementary abelian two-group
\(D\) splits into its sign characters:

\[
C^\bullet(Z_S;\mathbf Q)
\cong
\bigoplus_{\chi\in S}
C^\bullet(\Sigma_g;L_\chi).
\tag{48}
\]

The trivial character contributes \((1,2g,1)\). Every one of the
\(n-1\) nontrivial characters contributes \((0,2g-2,0)\). Hence

\[
(b_0,b_1,b_2)(Z_S;\mathbf Q)
=
\bigl(1,\,2+2n(g-1),\,1\bigr).
\tag{49}
\]

The lifted one-skeleton has \(n\) vertices and \(2gn\) edges, so

\[
b_1(Z_S^{(1)};\mathbf Q)
=2gn-(n-1).
\tag{50}
\]

Subtracting (49) gives the exact graph-shadow gap

\[
\boxed{
b_1(Z_S^{(1)};\mathbf Q)-b_1(Z_S;\mathbf Q)
=n-1
=2^r-1.
}
\tag{51}
\]

Character by character, the graph ablation removes the
\((d_\chi^1)^*d_\chi^1\) direction for every nontrivial \(\chi\in S\). The
trivial sign character has \(d_{\chi=0}^1=0\) and contributes no lost face
mode.

For every \(\chi\in S\), the pulled-back local system \(q_S^*L_\chi\) has the
unique root-normalized parallel section

\[
s_\chi(\lambda)=(-1)^{\lambda(\chi)},
\qquad
\lambda\in D=S^*.
\tag{52}
\]

Multiplication by \(s_\chi\) gives an exact chain isomorphism

\[
U_{s_\chi}:
C^\bullet(Z_S;\mathbf Q)
\overset{\cong}{\longrightarrow}
C^\bullet(Z_S;q_S^*L_\chi),
\qquad
d_{q_S^*\chi}U_{s_\chi}=U_{s_\chi}d.
\tag{53}
\]

Since \(s_\chi=\pm1\), this is an isometry for the pulled-back equal-cell
metrics and conjugates the corresponding Hodge Laplacians.

The role of the orientable family is precise: its face is essential for the
later sign-Hodge direction, but the mod-two commutator relation contributes
no restriction to the untwisted abelian active space. The nonorientable
\(\mathbf F_3\) family is stronger at the admission layer because its face
already defines which degree-one data exist.

## Part III. Observer theorem, evidence, and boundary

## 9. Closed nonlinear observer theorem

Both families use the same exact information statement. Let
\(\mathbf F_p\) be the relevant field, let \(X\) be the corresponding
first-homology vector space, and let \(S\leq X^*\) have rank \(r\). A closed
encoder is any function

\[
E:X\longrightarrow Z
\tag{54}
\]

formed before the requested \(\alpha\in S\) is revealed. Suppose arbitrary
decoders \(D_\alpha:Z\to\mathbf F_p\) satisfy

\[
D_\alpha(E(x))=\alpha(x)
\qquad
\text{for all }x\in X,\ \alpha\in S.
\tag{55}
\]

The evaluation map \(X\to S^*\) is surjective and realizes \(p^r\) answer
signatures. Exact decoding forces different signatures to occupy different
encoder states. Therefore

\[
|\operatorname{im}E|\geq p^r,
\qquad
\left\lceil\log_2|\operatorname{im}E|\right\rceil
\geq
\left\lceil r\log_2p\right\rceil.
\tag{56}
\]

The bound is tight at the state-count level: the complete evaluation
signature is a \(p^r\)-state encoder. No linearity, continuity, or
computability assumption on \(E\) or its decoders is used.

### Timing and cost ledger

| Experiment | Information order and access | Exact conclusion |
|---|---|---|
| closed portfolio | \(E\) is fixed before \(\alpha\); all \(\alpha\in S\) must be answerable; no later source access | at least \(p^r\) states |
| same-timing active compiler | \(S\) is known before traversal to both methods | the \(S^*\)-syndrome is sufficient for both; no advantage |
| one query known first | \(\alpha\) is supplied before evaluation and the source remains available | one \(\mathbf F_p\)-valued output, excluding other costs |
| late activation | a new independent \(\alpha\) appears after source or path deletion | retain its missing past coordinate, replay, or fail |
| retained active portfolio | \(r\) independent answers have been materialized and the source is discarded | at least \(p^r\) answer states; dependent answers add no rank |

For a query-first active execution, the total cost is

\[
C_{\rm born}(\alpha)
=
C_{\rm source}
+C_{\rm address}(\alpha)
+C_{\rm certificate}
+C_{\rm compile}(\alpha\mid h)
+C_{\rm atlas}
+C_{\rm replay}
+C_{\rm output}.
\tag{57}
\]

Only \(C_{\rm output}\) is the new scalar answer. Calling the entire active
operation constant-cost is invalid unless every other term has already been
paid or is explicitly amortized.

Likewise, a \(p^r\)-sheet cover has an \(r\)-coordinate symbolic address over
\(\mathbf F_p\). Exponential explicit sheet or cell count is not an
exponential program-description, circuit-width, or neural-parameter lower
bound.

## 10. Executable evidence ledger

Both certificates are frozen under the identifiers at the top of this note
and pass independent audit. They check their theorem families separately; one
payload is not used as evidence for the other.

At minimum the affine branch must materialize:

- \(N_2\) at active ranks \(0,1\);
- \(N_3\) at active ranks \(0,1,2\);
- all subspaces, all ordered bases, and every dependent or independent
  one-step update;
- the face closure \(2\sum_i v_i=0\);
- exact pullback kernel \(S\);
- the root-normalized \(A\)-valued primitive \(U_S\) and every scalar
  \(u_\alpha\);
- nonorientability and the genus formula;
- rational boundary ranks \((d-1,d)\);
- filled and graph-shadow Betti numbers with gap \(3^r\);
- the regular-character face-rank decomposition; and
- the closed nonlinear response signatures.

The orientable branch must retain:

- all subspaces in genera one and two;
- the sign Fox formulas and chain identity;
- twisted cohomology dimensions;
- the two orthogonal Hodge directions for every nonzero sign character;
- cover Betti numbers and the regular-character decomposition;
- graph-shadow gap \(2^r-1\); and
- normalized sign sections and exact untwisting.

The certificate must also rebuild the expected semantic payload, reject all
declared tamper mutations, exercise structural security regressions, and prove
deterministic replay. Executable exhaustion of the small fixtures is evidence
for the implementation; the arbitrary-genus statements remain theorem
arguments.

## 11. Collapse into standard mathematics

The two families close two earlier control gaps:

1. the affine family makes the face relation essential to the active
   cohomology space itself; and
2. the sign family makes the face term an exact orthogonal direction in a
   later Hodge operator.

They do not cross the formation gap. If the old doctrine contains the
constructors

\[
(N_g,S)
\longmapsto
(Y_S,U_S,\Delta^1),
\qquad
(\Sigma_g,S)
\longmapsto
(Z_S,\{L_\chi,s_\chi\}_{\chi\in S},\Delta^1),
\tag{58}
\]

then a history merely supplies \(S\). The resulting objects are assembled by
ordinary:

- covering-space classification and evaluation kernels;
- lifted cellular presentations;
- affine \(\mathbf F_3\) primitives;
- rank-one unitary local systems;
- Fox derivatives;
- finite regular-character decomposition; and
- cellular Hodge theory.

The
[collapse-closure note](./endogenous-admission-collapse-closure.md) explains
why a constructor already admitted to the old doctrine makes this Level A,
or at most a conditional Level-B observer calibration under a stricter
bounded interface. The
[literature audit](./literature-active-cohomology-admission-2026.md) records
the collision of the cover, local-system, normalized-section, Hodge, and
response-vector mechanisms. The earlier
[active atlas](./endogenous-active-cohomology-atlas.md) remains the
one-dimensional comparison control.

Nothing here proves:

- mathematical novelty or priority;
- a new cohomology or Hodge theory;
- Level C or an endogenous change of formation doctrine;
- non-soficity or absolute nonrepresentability;
- an AI architecture or performance theorem;
- the Hodge Conjecture;
- Navier--Stokes regularity;
- the Collatz conjecture;
- the Riemann Hypothesis; or
- any implication among those problems.

## 12. Next theorem target

The next target is a **face-forced composite-closure separation theorem**,
not a larger surface or another coefficient field.

Freeze an old effectivity doctrine \(\Xi_0\) that already contains every
standard constructor in (58), together with bounded composition, symbolic
deck coordinates, compilers, replay, and the observer timing interface. Seek
a family of causal histories \(h_n\), generated extension problems
\(\mathcal P_n\), and universal solutions \(B_n\) such that:

1. \(\mathcal P_n\) is selected by a presentation-, support-, gauge-, and
   stutter-invariant face defect, not supplied as the parameter \(S\);
2. the face defect changes which later question is meaningful or executable,
   rather than merely selecting another character in a fixed atlas grammar;
3. the later question family is not enumerated in the birth certificate, but
   its derivation essentially uses the retained universal role of \(B_n\);
4. the graph shadows and declared lower-arity observers of the separating
   histories agree while their face-dependent future roles differ;
5. for every fixed bound \(B\), some \(n\) defeats every
   \(C\in\operatorname{OldSat}_B(\Xi_0)\) under one frozen future-role
   equivalence; and
6. the constructive upper bound pays source, address, certificate, compiler,
   atlas, retained-state, and replay costs.

The exact falsifiers are:

- an old uniform compiler sends the defect to \(S\) and then applies (58);
- the lower bound counts explicit cells while an \(r\)-coordinate symbolic
  state performs the same role;
- the active side receives the future query earlier without that timing
  asymmetry appearing in the theorem statement;
- deleting the faces leaves the future-role invariant unchanged;
- the future question was prewritten into the birth certificate;
- the separating invariant changes under presentation, basis, root-gauge, or
  stutter; or
- the generated extension is conservatively translatable through the frozen
  old closure.

### Conjectural process-group bridge

A direct but open continuation is to replace the finite abelian deck groups
by an exact finitely generated process group \(\Gamma_h\), while letting
history grow a finite presentation two-complex \(X_h\). The cellular complex

\[
C_2(\widetilde X_h)
\xrightarrow{\,\partial_2^{\rm Fox}\,}
C_1(\widetilde X_h)
\xrightarrow{\,\partial_1\,}
C_0(\widetilde X_h)
\tag{59}
\]

is then defined over \(\mathbf Z\Gamma_h\), so the Fox Jacobian puts exact
process transport into a genuinely two-dimensional Hodge complex.

The conjectural hope is that a nonsofic deck action obstructs every globally
faithful finite cover or finite model for a declared Hodge-and-future-role
observer. This does **not** follow automatically from nonsoficity. It requires
a reduction showing that any such finite observer would induce the finite
almost-actions forbidden by the chosen nonsoficity theorem while preserving
the relevant face relations and future role. Finite quotients or
finite-dimensional shadows alone do not supply that reduction. Until it is
proved, this is a target rather than a result; the two finite surface families
above are its positive controls.

The combined surface result is therefore

\[
\boxed{
\begin{gathered}
\text{face-defined affine admission over }\mathbf F_3
\longrightarrow
\text{exact normalized primitive}
\longrightarrow
3^r\text{ face modes},\\
\text{complemented by sign-Hodge orthogonality and }
(2^r-1)\text{ face modes over }\mathbf F_2,\\
\text{with a tight nonlinear closed-observer theorem, but no Level C.}
\end{gathered}
}
\tag{60}
\]
