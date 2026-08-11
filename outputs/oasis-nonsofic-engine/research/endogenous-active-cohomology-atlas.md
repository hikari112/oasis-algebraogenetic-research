# Endogenous active cohomology atlas

## Status and theorem boundary

**Research date:** 2026-08-10

**Classification:** exact standard-mathematics family calibration.

**Executable binding:**
[genesis-active-cohomology-atlas.mjs](./genesis-active-cohomology-atlas.mjs),
certificate
`afbe496ac13cc341c15a7433d192e3042b0b4529ec1fc411ebabe1d58a48de5e`,
payload
`e55739cfe683307fa98773472bfb790a05b61280b4e8f5b15774415e45209966`,
source SHA-256
`F3FF31BD4B120156EFF6C482AD9CC499E5F506D1E4309CF1EEAA99DD6BC8DCDD`.
The frozen replay is deterministic and rejects all \(19/19\) declared tamper
cases.

This note constructs an indexed family in which a history-active subspace of
degree-one cohomology determines a presentation-invariant finite cover, exact
parallel sections of pulled-back sign local systems, and a later chain-level
untwisting operation. It also gives an arbitrary-nonlinear capacity lower bound
for a closed encoder that must answer a whole portfolio of period queries.

The established content is deliberately limited:

- the cover and sheaf statements are ordinary finite covering, cohomology, and
  local-system mathematics;
- the encoder theorem is an exact finite factorization/counting result and does
  not assume that the encoder or decoders are linear;
- the construction is not a Level-C change of formation doctrine;
- it is not a novelty or priority claim;
- it supplies no non-soficity, AI-performance, Hodge, Navier--Stokes, Collatz,
  or Riemann-hypothesis consequence; and
- its current two-dimensional cells are an audited but nonessential layer: the
  base collapses to a graph without changing the central cover theorem.

The note is a companion to
[the object-first foundation](./endogenous-expressibility-foundations.md),
[the frontier realization stress test](./endogenous-expressibility-frontier-realizations.md),
and
[the coupled calibration](./endogenous-expressibility-coupled-calibration.md).

The main calibration is

\[
\boxed{
\text{history-active period space }S
\longmapsto
\text{coarsest rooted cover }Y_S
\longmapsto
\text{exact normalized untwisting for precisely }S.
}
\tag{1}
\]

An independent class enlarges the active space by one dimension and doubles
the cover degree. A dependent class leaves the active space and universal
cover unchanged and therefore stutters at this level.

## 1. The finite base family

For every integer \(n\geq1\), define a finite simplicial complex \(K_n\) by
wedging \(n\) identical cells at one distinguished root vertex \(o\). Cell
\(i\) has three additional vertices \(a_i,b_i,c_i\), a filled triangle

\[
\sigma_i=[o,a_i,b_i],
\tag{2}
\]

and an adjacent unfilled triangle with boundary

\[
o\longrightarrow b_i\longrightarrow c_i\longrightarrow o.
\tag{3}
\]

The filled and unfilled triangles share the edge \([o,b_i]\). Distinct cells
share only \(o\). Hence

\[
|K_n^{(0)}|=1+3n,
\qquad
|K_n^{(1)}|=5n,
\qquad
|K_n^{(2)}|=n.
\tag{4}
\]

Every filled face has a free edge and can be collapsed. Performing these
collapses gives

\[
K_n\simeq\bigvee_{i=1}^{n}S^1,
\tag{5}
\]

so

\[
H_1(K_n;\mathbf F_2)\cong\mathbf F_2^n,
\qquad
H^1(K_n;\mathbf F_2)\cong\mathbf F_2^n,
\qquad
H_2(K_n;\mathbf F_2)=0.
\tag{6}
\]

Let \(\lambda_i\) be the homology class of the unfilled loop (3), and let
\(\alpha_i\) be its dual class. One convenient cocycle representative of
\(\alpha_i\) is supported on the oriented edge \(b_i\to c_i\).

### 1.1 The collapse warning

The groups \(C^2(K_n;- )\) and the operator \(d^1\) are nonzero, so the family
can audit literal triple-overlap equations. Nevertheless, the filled faces are
not load-bearing for the cover, kernel, or parallel-section theorems below.
Deleting them by elementary collapse preserves those results.

Consequently this family is not yet a genuinely two-dimensional
local-to-global obstruction. It is a graph-level period obstruction equipped
with a finite Čech-descent audit. Any claim stronger than that is falsified by
(5).

## 2. History-active cohomology

A valid finite history retains a finite family of checked degree-one period
classes. Define its active space by

\[
S_h
=
\operatorname{span}_{\mathbf F_2}
\{\text{period classes with retained valid birth support in }h\}
\leq H^1(K_n;\mathbf F_2).
\tag{7}
\]

Only the support-thinned cohomology classes enter (7). Printed cocycle names,
the order in which they arrived, redundant certificates, and a scheduler
counter do not. In the remainder, fix one such subspace

\[
S\leq H^1(K_n;\mathbf F_2),
\qquad
r=\dim S.
\tag{8}
\]

The theorem family is externally indexed by \(n\), but the repair law is not
indexed by a stage counter. It consumes the finite rooted complex and the
intrinsically computed subspace \(S_h\).

### 2.1 A basis-free affine Čech cocycle

Let

\[
S^*=\operatorname{Hom}_{\mathbf F_2}(S,\mathbf F_2).
\tag{9}
\]

Choose a linear lift \(\rho:S\to Z^1(K_n;\mathbf F_2)\) of the quotient map
from cocycles to cohomology. Define

\[
B_S\in C^1(K_n;S^*)
\quad\text{by}\quad
B_S(e)(\alpha)=\rho(\alpha)(e).
\tag{10}
\]

Because every \(\rho(\alpha)\) is a cocycle,

\[
d^1B_S=0.
\tag{11}
\]

Another linear lift gives

\[
B'_S=B_S+d^0R
\tag{12}
\]

for an \(S^*\)-valued zero-cochain \(R\). Thus the literal table in (10) is
presentation data, while its gauge class and period map are intrinsic.

Equivalently, put an affine \(S^*\)-torsor on every chart and use translation
by \(B_S(e)\) on every overlap. Equation (11) says that on every filled triple

\[
T_{jk}T_{ij}=T_{ik}.
\tag{13}
\]

This is actual affine Čech descent. A one-entry mutation that violates (11)
prevents the corresponding lifted two-simplex from closing.

## 3. The rooted coarsest repair

Define the basis-free evaluation homomorphism

\[
q_S:\pi_1(K_n,o)\longrightarrow S^*,
\qquad
q_S(\gamma)(\alpha)=\langle\alpha,[\gamma]\rangle.
\tag{14}
\]

The natural evaluation map

\[
H_1(K_n;\mathbf F_2)\longrightarrow S^*
\tag{15}
\]

is surjective, so (14) is surjective. Let

\[
p_S:(Y_S,\widetilde o)\longrightarrow(K_n,o)
\tag{16}
\]

be the rooted connected regular cover corresponding to \(\ker q_S\). It has
deck group \(S^*\) and degree

\[
\deg p_S=|S^*|=2^r.
\tag{17}
\]

Concretely, a vertex of \(Y_S\) is an equivalence class of edge paths starting
at \(o\). Two paths are equivalent when they have the same endpoint and the
same \(B_S\)-period. Edges are extended by path concatenation. Equation (11)
is exactly what makes the lift compatible with the filled two-simplices.

### 3.1 Universal property

Let \(f:(Z,z_0)\to(K_n,o)\) be a rooted connected cover. Suppose every active
class becomes exact:

\[
f^*\alpha=0
\quad\text{for all }\alpha\in S.
\tag{18}
\]

Then

\[
f_*\pi_1(Z,z_0)\subseteq\ker q_S.
\tag{19}
\]

The rooted covering-lift criterion therefore gives a unique rooted map

\[
\widehat f:Z\longrightarrow Y_S
\quad\text{such that}\quad
f=p_S\widehat f.
\tag{20}
\]

Hence \(Y_S\) is the coarsest rooted connected cover on which every class in
\(S\) vanishes. In the ordinary category of rooted covers, every other repair
maps uniquely to \(Y_S\). In the doctrine-extension category, whose arrows
follow pullback factorization, the extension

\[
p_S^*:\mathcal L_{K_n}\longrightarrow\mathcal L_{Y_S}
\tag{21}
\]

is initial.

The restriction to connected surjective covers is essential. If arbitrary
maps are admitted, a point mapping to \(o\) pulls every positive-degree class
to zero and trivializes the repair problem without preserving the base
questions.

### 3.2 Exact pullback kernel

For \(\alpha\in H^1(K_n;\mathbf F_2)\),

\[
\begin{aligned}
p_S^*\alpha=0
&\Longleftrightarrow
\alpha|_{\ker q_S}=0\\
&\Longleftrightarrow
\alpha\text{ factors through }S^*\\
&\Longleftrightarrow
\alpha\in S^{**}\cong S.
\end{aligned}
\tag{22}
\]

Therefore

\[
\boxed{\ker p_S^*=S.}
\tag{23}
\]

This gives two exact update laws:

1. If \(\alpha\in S\), then \(\operatorname{span}(S,\alpha)=S\), so the
   universal repair is unchanged. The dependent event stutters at the cover
   level.
2. If \(\alpha\notin S\), then
   \(\dim\operatorname{span}(S,\alpha)=r+1\), so the new universal repair has
   degree \(2^{r+1}\). The new independent class doubles the cover.

## 4. Exact sign local systems and Čech operators

Fix \(\alpha\in H^1(K_n;\mathbf F_2)\) and a cocycle representative
\(a_\alpha\). Let \(L_\alpha\) be the rank-one rational local system with
fiber \(\mathbf Q\) and edge transport

\[
T_{ij}^{\alpha}=(-1)^{a_\alpha(ij)}.
\tag{24}
\]

Store an edge cochain on \(i\to j\) in the terminal fiber over \(j\). Then

\[
(d_\alpha^0f)_{ij}
=f_j-T_{ij}^{\alpha}f_i,
\tag{25}
\]

and on an oriented filled triangle \([i,j,k]\),

\[
(d_\alpha^1\eta)_{ijk}
=
\eta_{jk}-\eta_{ik}+T_{jk}^{\alpha}\eta_{ij}.
\tag{26}
\]

The cocycle equation gives

\[
T_{ik}^{\alpha}=T_{jk}^{\alpha}T_{ij}^{\alpha},
\tag{27}
\]

and direct substitution proves

\[
d_\alpha^1d_\alpha^0=0.
\tag{28}
\]

Thus the fixture has genuine degree-zero and degree-one Čech differentials;
it does not infer cohomology merely from loop labels.

Give the vertex, edge, and face stalks positive rational weights and use the
induced rational inner products. The degree-zero Dirichlet energy is

\[
\mathcal E_\alpha(f)
=
\|d_\alpha^0f\|^2
=
\sum_{i\to j}w_{ij}
|f_j-T_{ij}^{\alpha}f_i|^2.
\tag{29}
\]

The degree-one Hodge operator is

\[
\Delta_{\alpha,1}
=
d_\alpha^0(d_\alpha^0)^*
+
(d_\alpha^1)^*d_\alpha^1.
\tag{30}
\]

All matrices and adjoints are exact over \(\mathbf Q\) once the rational
weights are fixed.

### 4.1 Normalized parallel-section theorem

Pull \(L_\alpha\) back to \(Y_S\). If \(\alpha\in S\), equation (23) gives

\[
p_S^*\alpha=0.
\tag{31}
\]

There is then a unique parallel section normalized by

\[
s_\alpha(\widetilde o)=1.
\tag{32}
\]

In the path presentation it is

\[
s_\alpha([\gamma])
=
(-1)^{\langle\alpha,[\gamma]\rangle}.
\tag{33}
\]

It is well defined because paths representing the same point of \(Y_S\) have
the same evaluation against every \(\alpha\in S\). It satisfies

\[
d_{p_S^*\alpha}^0s_\alpha=0,
\qquad
\mathcal E_{p_S^*\alpha}(s_\alpha)=0.
\tag{34}
\]

Conversely, if \(\alpha\notin S\), (23) gives a loop of \(Y_S\) whose
monodromy in \(p_S^*L_\alpha\) is \(-1\). A nonzero parallel value would have
to satisfy \(v=-v\), so no root-normalized rational parallel section exists.

Therefore

\[
\boxed{
\alpha\in S
\Longleftrightarrow
p_S^*L_\alpha\text{ has a root-normalized rational parallel section}.
}
\tag{35}
\]

The statement concerns a section of a pulled-back sign local system, not a
rational primitive of the mod-two class \(\alpha\).

## 5. Later essential use: normalized untwisting

The admitted cover is not retained merely as a certificate that a class
vanished. Its universal role provides the normalized section \(s_\alpha\),
which defines a chain-level map

\[
U_{s_\alpha}:
C^\bullet(Y_S;\mathbf Q)
\longrightarrow
C^\bullet(Y_S;p_S^*L_\alpha)
\tag{36}
\]

by multiplying each local value by the transported section. Parallelness gives

\[
d_{p_S^*\alpha}U_{s_\alpha}
=
U_{s_\alpha}d.
\tag{37}
\]

Because \(s_\alpha\) is everywhere nonzero, (36) is an exact chain
isomorphism. A later history may therefore take an independently supplied
twisted cochain, untwist it, and ask ordinary descent, exactness, energy, or
degree-one harmonic questions. Root normalization removes the otherwise
global sign ambiguity.

A valid later-essentiality ablation must replay that later question after
removing the universal repair. For \(\alpha\notin S\), the normalized section
and hence (36) do not exist. An arbitrary hardcoded sign table is rejected
unless it carries the same rooted universal factorization role.

This is essential use relative to the declared typed process. It does not yet
prove that an old metaprogram could not recompute the same cover and section
directly from \(S\).

## 6. Arbitrary-nonlinear period-factorization bound

The cover theorem has a separate information-theoretic shadow that does not
depend on linear encoders.

Let

\[
V=H_1(K_n;\mathbf F_2)
\tag{38}
\]

and let \(L\leq V^*\) be a portfolio of exact period queries, with

\[
d=\dim L.
\tag{39}
\]

A **closed encoder** is an arbitrary function

\[
E:V\longrightarrow Z
\tag{40}
\]

formed before the eventual query is revealed. No algebraic, continuity, or
computability restriction is imposed on \(E\). Suppose that for every
\(\ell\in L\) there is an arbitrary decoder

\[
D_\ell:Z\longrightarrow\mathbf F_2
\tag{41}
\]

such that

\[
D_\ell(E(x))=\ell(x)
\quad
\text{for every }x\in V.
\tag{42}
\]

The evaluation map

\[
\varepsilon_L:V\longrightarrow L^*,
\qquad
\varepsilon_L(x)(\ell)=\ell(x),
\tag{43}
\]

is surjective. Hence it has \(2^d\) distinct answer patterns. If
\(E(x)=E(y)\), then (42) forces

\[
\ell(x)=\ell(y)
\quad\text{for every }\ell\in L,
\tag{44}
\]

so \(E\) must separate all fibers of \(\varepsilon_L\). Therefore

\[
|\operatorname{im}E|\geq2^d.
\tag{45}
\]

With finite-state capacity

\[
\operatorname{cap}(E)
=
\left\lceil\log_2|\operatorname{im}E|\right\rceil,
\tag{46}
\]

we obtain

\[
\boxed{\operatorname{cap}(E)\geq\dim L.}
\tag{47}
\]

This is an arbitrary-nonlinear factorization theorem. It is not a rank lower
bound on a linear feature matrix. If the source is restricted to a subset
\(X\subsetneq V\), \(2^d\) in (45) must be replaced by the number of period
patterns actually realized by \(\varepsilon_L(X)\).

### 6.1 The active/global timing boundary

The closed theorem has quantifier order

\[
\exists E\;
\forall\ell\in L\;
\exists D_\ell\;
\forall x\in V.
\tag{48}
\]

The encoder is frozen before the query address \(\ell\) is known. It must
therefore preserve every distinction in the whole declared portfolio.

An open active carrier uses a different experiment. After a history births
one period address \(\ell\), a still-available exact source capability may
evaluate \(\ell(x)\) and append the one-bit result. The marginal payload is

\[
C_{\mathrm{payload}}(\ell)=1.
\tag{49}
\]

This does not contradict (47), because the active carrier receives the query
before compiling or evaluating the new coordinate and is allowed to consult a
retained source capability. The full cost is

\[
\boxed{
C_{\mathrm{born}}(\ell)
=
C_{\mathrm{source}}
+C_{\mathrm{address}}(\ell)
+C_{\mathrm{compile}}(\ell\mid h)
+1.
}
\tag{50}
\]

Here:

- \(C_{\mathrm{source}}\) charges retention of \(x\), an oracle, or another
  exact evaluation capability;
- \(C_{\mathrm{address}}\) charges the code and causal support identifying the
  cohomology class;
- \(C_{\mathrm{compile}}\) charges cocycle verification, independence testing,
  the local-system constructor, and the cover update; and
- the final \(1\) is only the newly retained answer bit.

Calling the complete active operation constant-cost is justified only when
the first three terms were already paid or are explicitly amortized. If the
source has been discarded, the active carrier must have anticipated enough
global distinctions to recover the answer, and the closed lower bound returns.

After \(r\) independent births, a carrier that discards the source but must
retain all active period answers needs at least \(r\) bits. Dependent queries
can be computed from those independent answers and do not increase the active
answer-space dimension.

## 7. Joint cover, state, and portfolio costs

For \(r=\dim S\), the exact family gives the following simultaneous bounds.

| Quantity | Exact value or bound | Scope |
|---|---:|---|
| active independent period rank | \(r\) | basis invariant |
| distinct active period-answer patterns | \(2^r\) | on the full source \(H_1\) |
| closed encoder capacity for the portfolio \(S\) | at least \(r\) bits | arbitrary nonlinear features |
| deck group | \(S^*\cong\mathbf F_2^r\) | canonical up to isomorphism |
| universal cover degree | \(2^r\) | minimal among connected covers killing \(S\) |
| exact sheet address | \(r\) bits | symbolic deck coordinate |
| materialized cells of the lifted displayed complex | \((1+9n)2^r\) | one lift of every base simplex per sheet |
| first Betti number of \(Y_S\) | \(1+2^r(n-1)\) | since \(K_n\simeq\bigvee^nS^1\) |
| independent-birth payload increment | one bit | source/address/compiler excluded |
| independent-birth cover increment | degree multiplied by \(2\) | geometric repair |
| dependent-birth increment | zero at the universal-cover level | stutter control |

The cover degree and Betti number are presentation-invariant geometric costs.
They imply an exponential lower bound for explicit global materialization.
They do not imply an exponential program-description lower bound.

A symbolic implementation can store a sheet as an \(r\)-bit vector and update
it by adding the local transition in \(S^*\). A raw matrix for the evaluation
map costs at most \(O(nr)\) bits, and structured instances can be still more
succinct. An unrestricted program-feature observer can therefore avoid
materializing \((1+9n)2^r\) cells. The family establishes both an
atlas-versus-explicit-state separation and the stated lower bound against
arbitrary nonlinear **closed global encoders**. It does not establish a lower
bound against unrestricted programs that retain or revisit the source, receive
the query before encoding, or are charged in a different cost model.

## 8. Naturality and invariance

### 8.1 Basis invariance

The active datum is the subspace \(S\), its dual \(S^*\), and the evaluation
map (14). A change of basis conjugates coordinate tables but does not change
the rooted cover, pullback kernel, or normalized-section theorem up to unique
rooted isomorphism.

### 8.2 Base presentation

A rooted simplicial isomorphism, or a declared rooted homotopy equivalence
carrying the active cohomology subspace, transports \(q_S\) and induces the
corresponding rooted cover equivalence. Literal vertex names and loop spellings
cannot carry the birth role.

The numerical cell count in the displayed presentation is not invariant under
subdivision. Cover degree, cohomological rank, the pullback kernel, and Betti
numbers are. Any presentation-invariant description cost must minimize over
the declared recoding class or use these intrinsic quantities.

### 8.3 Čech gauge

Replacing \(B_S\) by \(B_S+dR\) changes affine frames and produces an
isomorphic torsor diagram. Replacing \(a_\alpha\) by a cohomologous cocycle
conjugates the sign local system by vertex signs. Equations (28), (35), and
(37) survive this gauge change.

### 8.4 Metric data

The existence of a zero-energy normalized section is independent of the
choice of positive weights. Numerical energies, adjoints, and spectra are
invariant only under recodings that transport the rational inner products.

### 8.5 Causal support and stutter

The active subspace must be computed from normalized retained supports.
Duplicating a certificate, inserting an idle event, changing arrival order,
or adding a linearly dependent class leaves \(S\) and the cover unchanged.

## 9. Why this is neither the earlier free nor Karoubi repair

### 9.1 Not a fixed-base free primitive

Freely adjoining a formal symbol \(u\) with

\[
du=B_S
\tag{51}
\]

changes a cochain or differential-graded algebra while keeping the base fixed.
When \([B_S]\ne0\), that symbol has no realization as an ordinary zero-cochain
on \(K_n\). Such a cell attachment kills the class syntactically.

The present repair instead preserves \(B_S\), changes the base by a connected
cover, and proves

\[
d\widetilde u=p_S^*B_S
\tag{52}
\]

geometrically. Its universal property classifies rooted base-change
factorizations, not assignments to a new free generator. The distinction is
relative to the declared category of admissible repairs; if arbitrary
differential-graded cell attachments are admitted, (51) is a competing repair
with a different universal problem.

### 9.2 Not an ordinary idempotent splitting

If \(Y_S\) were obtained as a retract of the identity cover of \(K_n\) in the
relevant slice, there would be a section

\[
K_n\longrightarrow Y_S.
\tag{53}
\]

Such a section would split every active monodromy and force \(S=0\), contrary
to (23) when \(r>0\). Merely closing a fixed-base category under retracts does
not make the nonzero periods exact.

### 9.3 But it is ordinary pullback and covering theory

The distinction above does not make the construction a new formation law.
The kernel cover of a finite collection of characters, trivialization of the
associated sign local systems, and normalized parallel sections are standard
operations inside a fixed doctrine of covers and local systems.

If the old object language already contains the formation rule

\[
S\longmapsto(Y_S,p_S,\{s_\alpha\}_{\alpha\in S}),
\tag{54}
\]

then the history selects its parameter. The event is Level A or a definitional
Level-B macro, not a genuine expressibility birth. A genuine Level-B theorem
still needs a natural old-observer class, total cost semantics, and proof that
the universal active role is not available within the declared bound.

Nothing here changes the formation monad, blocks a conservative translation
to ordinary finite covering theory, or establishes Level C.

## 10. Ablation and falsification matrix

| Ablation | Exact outcome | Interpretation |
|---|---|---|
| \(S=0\) | \(Y_S=K_n\), degree one | base-change birth stutters |
| add \(\alpha\in S\) | no change to \(S\), \(q_S\), or \(Y_S\) | dependent-period stutter |
| add \(\alpha\notin S\) | rank increases by one and degree doubles | independent direction |
| replace \(B_S\) by \(B_S+dR\) | rooted-isomorphic affine cover | required gauge control |
| mutate a face so \(d^1B_S\ne0\) | lifted face does not close | destroys Čech descent |
| delete every filled face by collapse | cover and kernel theorems survive | exposes the current one-dimensional core |
| delete the root | lifts differ by deck transformations | strict initiality is lost; a groupoid version is needed |
| admit arbitrary nonsurjective maps | a point kills every class | destroys continuation-complete universality |
| quotient deck paths as gauge | active sheet transport is erased | path retention is necessary for the atlas interpretation |
| replace by a fixed-base formal primitive | obtains a different dg cell attachment | not the geometric repair theorem |
| apply only Karoubi completion | no section of \(p_S\) is created for \(S\ne0\) | cannot trivialize the periods |
| omit the later untwisting question | cover becomes unused bookkeeping | fails later essentiality |
| discard the source before a new query | one-bit active evaluation may be impossible | closed capacity bound returns |
| ignore address/compiler cost | falsely promotes marginal one bit to total constant cost | timing-accounting failure |
| allow succinct program features | exponential cell bound can be bypassed | no general program-complexity theorem |
| pre-admit constructor (54) | history merely chooses \(S\) | collapses the Level-B claim |
| transport weights nonisometrically | zero-energy statement survives, spectrum need not | metric boundary |

## 11. The next genuinely two-dimensional base target

The next base must make the degree-one face operator essential rather than
decorative. A suitable family \(Z_n\) should satisfy all of the following:

1. its relevant two-simplices cannot all be removed by elementary collapses
   while preserving the active period problem;
2. the history-derived overlap data have a nonvacuous \(d^1\)-closure condition
   whose failure changes whether the affine object exists;
3. the same faces enter the later operator through the
   \((d^1)^*d^1\) term, so deleting them changes a proved degree-one kernel,
   coercivity bound, or descent space;
4. at least one active relation among overlap transports is forced by the
   two-dimensional incidence data rather than by a removable gauge choice;
5. the universal repair remains natural under base recoding and Čech gauge;
6. an independent history event changes both the repair and a later
   two-dimensional judgment; and
7. the old-observer cost model charges source, address, compiler, atlas, and
   retained state separately.

A triangulated two-complex with no free two-faces and with face restrictions
that participate in the active local-system differential is the immediate
construction target. The decisive positive control is not merely
\(H^1(Z_n)\ne0\). It is an exact pair showing that removing or changing the
two-dimensional descent data changes the universal repair or the later
degree-one theorem while the declared lower-dimensional shadow is held fixed.

Until such a family exists, the present result should be described as an
**active cohomology atlas calibration**:

\[
\boxed{
\begin{gathered}
\text{finite history-active period space}
\to
\text{minimal rooted trivializing cover}
\to
\text{normalized exact untwisting},\\
\text{with a nonlinear closed-portfolio bound and an explicit timing ledger},
\end{gathered}
}
\tag{55}
\]

not as a new cohomology theory, generated formation doctrine, or solved
frontier problem.

## 12. Executable binding and evidence boundary

The bound executable exhausts \(n=1,2,3,4\). Across all \(2,5,16,67\)
cohomology subspaces respectively, it verifies the displayed cell and boundary
matrices, collapse and cohomology ranks, connected principal deck actions,
degree \(2^{\dim S}\), coherent face lifts, and

\[
\ker p_S^*=S.
\tag{56}
\]

It also exhausts every one-step history extension in that range: independent
classes double the cover, while dependent classes stutter. Ordered generating
bases are checked to recover the same subspace repair. The local-system audit
checks the twisted differentials, face identities, normalized primitive and
parallel-section equivalence, zero energy, and chain-level untwisting.

For the observer theorem, every exact answer signature is counted for every
subspace in the frozen range. Every set partition of the \(2^d\) signature
space is additionally enumerated for \(d=0,1,2,3\): \(1,2,15,4140\)
partitions. Exactly one partition at each rank supports every period decoder,
so the minimum code-state counts are \(1,2,4,8\). This is an exhaustive
nonlinear finite calibration, not merely a matrix-rank test.

Replay rebuilds the expected semantic payload independently and rejects all
\(19/19\) declared tamper mutations. Four separate security regressions reject
rehashed nested-alias, unknown-top-level-key, named-array-property, and
inherited-prototype attacks. The general formulas for arbitrary \(n\) remain
theorem arguments in this note; only \(n\leq4\) and nonlinear partition ranks
\(d\leq3\) are exhaustively materialized. The executable does not certify
mathematical novelty, Level C, non-soficity, an AI architecture, or any
consequence for an open conjecture.
