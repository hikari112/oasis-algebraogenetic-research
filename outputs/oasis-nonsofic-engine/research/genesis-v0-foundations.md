# Genesis v0: biordered causal atlases and the algebra of availability

## Status: frozen object-first foundation

This note freezes the first coherent version of **genesis** as a mathematical
object. It was constructed from finite examples, counterexamples, and exact
audits before any new literature-classification pass.

The discovery protocol is intentionally inductive:

\[
\text{examples}
\longrightarrow \text{pattern}
\longrightarrow \text{candidate object}
\longrightarrow \text{counterexample}
\longrightarrow \text{revised definition}.
\]

Deduction begins after each revision: definitions are typed, theorem boundaries
are stated, and executable finite claims become assertions.

The principal conclusion is:

> A genesis is not merely a changing state. It is a costed causal atlas of
> observable views, together with the persistent logic of when questions become
> available.

The audit forces this atlas to carry two linked orders on the same contexts:
informational refinement and causal reachability. Causal reachability implies
informational refinement, but not conversely. The distinction is load-bearing:
repair is monotone for the informational order and can fail to be monotone for
the causal order.

The terminal observable algebra is only the colimit of this atlas. It records
what is eventually expressible and generally forgets how expressibility became
available.

Several speculative associations are deliberately held outside v0:

- probability is not the carrier;
- no consequence for `P` versus `NP`, Galois theory, Hodge theory, or the
  algebrization barrier is claimed;
- no AI architecture theorem is claimed;
- no absolute non-flattenability is claimed;
- no canonical nontrivial connection is claimed;
- no novelty or “new field” priority claim is made.

The exact executable companion is
[`genesis-v0-audit.mjs`](genesis-v0-audit.mjs).

## 1. The primitive finite object

### Definition 1: primitive-costed observable dynamics

A finite **Genesis v0 presentation** is

\[
\mathcal G=(\mathcal A,\mathcal B_0,\Sigma,\{U_a\}_{a\in\Sigma},c),
\]

where:

- `A = C(S)` for a finite nonempty carrier `S`;
- `B_0 <= A` is a unital observable subalgebra;
- `Sigma` is a finite declared primitive alphabet;
- `D_a:S -> S` is a deterministic update and `U_a=D_a^*` is pullback,
  `U_a h=h after D_a`;
- `c(a)>0` is the declared cost of a strict primitive repair.

No `D_a` is assumed invertible.

For a current algebra `B <= A`, define

\[
\Phi_a(\mathcal B)=C^*(\mathcal B\cup U_a\mathcal B).
\]

For a word `w=a_1...a_n`, use the operational convention

\[
\mathcal B\cdot w
=\Phi_{a_n}\cdots\Phi_{a_1}(\mathcal B).
\]

A stuttering step `Phi_a(B)=B` is an identity in the **strict-repair ledger**
and has ledger cost zero. A model charging failed attempts is a different
costed object and must say so.

Accordingly, word cost is context-dependent. If `B_i` is the context after the
first `i` symbols of `w=a_1...a_n`, define

\[
c_{\mathcal B}(w)
=\sum_{i=1}^n c(a_i)\mathbf 1_{\mathcal B_i\ne\mathcal B_{i-1}}.
\]

### Proposition 1: elementary repair facts

Every `Phi_a` is monotone and inflationary:

\[
\mathcal B\subseteq\mathcal C
\Longrightarrow
\Phi_a(\mathcal B)\subseteq\Phi_a(\mathcal C),
\qquad
\mathcal B\subseteq\Phi_a(\mathcal B).
\]

It need not be idempotent. On four points, the audit uses

\[
\Pi_0=\{1\}\mid\{2,3,4\},
\qquad
D=(1,1,2,3),
\]

for which

\[
\Pi_0
\xrightarrow{\Phi_D}
\{1\}\mid\{2\}\mid\{3,4\}
\xrightarrow{\Phi_D}
\{1\}\mid\{2\}\mid\{3\}\mid\{4\}.
\]

Every strict repair increases the number of partition atoms. Therefore any
strict path has length at most

\[
|S|-|\Pi_0|.
\]

The saturation

\[
\operatorname{Sat}_U(\mathcal B)
=C^*\!\left(\bigcup_{w\in\Sigma^*}U_w\mathcal B\right)
\]

is reachable in the finite setting, is fixed by every `Phi_a`, and is the least
jointly `U_a`-invariant algebra containing `B`.

### Theorem 2: completion is a reflector

Fix the transport family `U`. Let `Inv_U(A)` be the poset of jointly
`U`-invariant unital subalgebras. Then `Sat_U` is left adjoint to the inclusion

\[
\operatorname{Inv}_U(\mathcal A)
\hookrightarrow
\operatorname{Sub}(\mathcal A).
\]

Equivalently, for invariant `C`,

\[
\operatorname{Sat}_U(\mathcal B)\subseteq\mathcal C
\quad\Longleftrightarrow\quad
\mathcal B\subseteq\mathcal C.
\]

The proof is immediate: an invariant `C` containing `B` contains every
`U_wB`, hence their generated algebra. This universal property explains both
the power and the limitation of completion: reflection remembers the least
stable result, not the route to it.

## 2. A category of presentations

### Definition 3: primitive capability simulation

A morphism

\[
(\iota,\rho):\mathcal G\longrightarrow\mathcal H
\]

consists of:

- a unital star-embedding `iota:A_G -> A_H`;
- a primitive map `rho:Sigma_G -> Sigma_H`;

such that

\[
\iota(\mathcal B_{0,G})\subseteq\mathcal B_{0,H},
\]

\[
\iota U_a^G=U_{\rho(a)}^H\iota,
\]

and

\[
c_H(\rho(a))\leq c_G(a).
\]

For finite carriers, `iota=f^*` for a surjection `f:S_H -> S_G`, and transport
intertwining is the semiconjugacy

\[
fD_{\rho(a)}^H=D_a^Gf.
\]

Composition is ordinary composition of the embeddings and primitive maps, so
these objects and morphisms form a category `Gen0_sim`.

An exact morphism uses equality for the initial algebra and primitive costs.
An isomorphism is a state bijection and primitive bijection conjugating all
updates, carrying the initial algebra exactly, and preserving costs.

Macro implementations `rho(a) in Sigma_H^*` are deliberately excluded here.
They belong to a compiler-enriched category because they change the primitive
interface and its cost ledger.

### Lemma 4: repair naturality

For every `B <= A_G`,

\[
\iota\bigl(\Phi_a^G(\mathcal B)\bigr)
=
\Phi_{\rho(a)}^H\bigl(\iota\mathcal B\bigr).
\]

Indeed,

\[
\begin{aligned}
\iota C^*(\mathcal B\cup U_a^G\mathcal B)
&=C^*(\iota\mathcal B\cup\iota U_a^G\mathcal B)\\
&=C^*(\iota\mathcal B\cup U_{\rho(a)}^H\iota\mathcal B).
\end{aligned}
\]

Iteration gives capability monotonicity: every transported task of `G` is
available in `H` at no greater strict primitive cost.

## 3. The semantic genesis nucleus

The raw presentation contains carrier points, primitive spellings, and possibly
duplicated actions. The next layer keeps precisely future observable
availability.

### Definition 5: the biordered context atlas

Let `C_G` contain the algebras reachable from `B_0`. The same contexts carry
two orders.

The **causal order** is

\[
\mathcal B\preceq_G\mathcal C
\quad\Longleftrightarrow\quad
\mathcal B\cdot w=\mathcal C
\text{ for some }w\in\Sigma^*.
\]

Because strict repairs enlarge algebras, this is a partial order after equal
algebras are identified. Write

\[
P_G=(C_G,\preceq_G).
\]

The **information order** is ambient algebra inclusion:

\[
\mathcal B\sqsubseteq_G\mathcal C
\quad\Longleftrightarrow\quad
\mathcal B\subseteq\mathcal C,
\qquad
I_G=(C_G,\sqsubseteq_G).
\]

Inflationarity gives

\[
\preceq_G\ \subseteq\ \sqsubseteq_G,
\]

but the converse fails. Each `Phi_a` is an inflationary monotone endomap of
`I_G`. It need not be monotone as a map on `P_G`.

Thus information refinement and causal reachability must not be collapsed into
one order.

### Counterexample 6: inclusion is not reachability

On five points, let

\[
\Pi_0=\{1,2,3\}\mid\{4,5\},
\]

\[
D_a=(1,4,1,1,1),
\qquad
D_b=(2,4,1,4,1).
\]

Then

\[
Q=\Phi_a(\Pi_0)=\{1,3\}\mid\{2\}\mid\{4,5\},
\]

and

\[
P=\Phi_b(\Pi_0)=\{1,3\}\mid\{2\}\mid\{4\}\mid\{5\}.
\]

Thus `B(Q)` is strictly contained in `B(P)`. But from `Q`, action `a`
stutters and action `b` jumps to the discrete partition. Therefore `P` is not
reachable from `Q`. The executable audit checks the transition closure exactly.

The same witness proves failure of causal monotonicity. From the root,

\[
B_0\preceq_G P,
\qquad
\Phi_a(B_0)=Q,
\qquad
\Phi_a(P)=P,
\]

yet `Q` is not causally below `P`. Informational monotonicity still holds: `Q`
is informationally below `P`.

### Definition 7: observable diagram

Define

\[
\operatorname{Obs}_{\mathcal G}:P_{\mathcal G}
\longrightarrow
\mathbf{FinCommCStar}_{\rm mono}
\]

by sending a context to its observable algebra and a causal arrow to the
corresponding inclusion.

The completed algebra `B_infinity` is terminal in `P_G`, and

\[
\operatorname*{colim}\operatorname{Obs}_{\mathcal G}
=\mathcal B_\infty.
\]

The chain and diamond examples have nonisomorphic observable diagrams and the
same colimit. This is the exact categorical form of static-endpoint
forgetfulness.

### Definition 8: path and residual quotients

Start with the action category whose arrows are contextual words. Identify

\[
(\mathcal B,w)\sim(\mathcal B,v)
\quad\Longleftrightarrow\quad
\mathcal B\cdot w=\mathcal B\cdot v.
\]

This congruence removes contextual stutters and identifies endpoint-equal
common-refinement paths. The resulting thin category is `P_G`.

At the root, define the observable Moore output

\[
o(w)=\mathcal B_0\cdot w.
\]

Then

\[
u\equiv v
\quad\Longleftrightarrow\quad
o(ux)=o(vx)
\text{ for every suffix }x.
\]

For bare repair semantics, this is equivalent to `o(u)=o(v)`: once the current
algebra agrees, every future repair agrees.

### Theorem 9: minimal future-availability realization

The reachable Moore machine `P_G` is the minimal deterministic realization of
the observable-valued behavior `w -> o(w)`. Every reachable deterministic
machine realizing the same future observable behavior has a unique surjective
machine morphism onto `P_G`.

This is a universal property for future availability. It is not a universal
property for provenance, route multiplicity, or holonomy. Those require a
finer trace object.

The audit begins with a five-state path-split presentation of the parallel
diamond and Moore-minimizes it to four states by merging its two terminal
history copies.

### Definition 10: weighted causal atlas

Endpoint-equivalent paths may have different costs, so exact path cost does not
descend as an additive function on the thin quotient. The canonical descended
quantity is shortest-path cost

\[
d_{\mathcal G}(\mathcal B,\mathcal C)
=\inf\{c_{\mathcal B}(w):\mathcal B\cdot w=\mathcal C\}.
\]

This is a Lawvere-style directed metric: zero on identities, infinity when
unreachable, and subadditive under composition.

If the distribution or multiplicity of path costs matters, the weighted path
category must be retained. A minimum alone is not provenance.

## 4. The algebra of when: an availability locale

The terminal algebra describes which distinctions exist at completion. Genesis
also needs propositions saying **when** a finite family of questions exists.

### Definition 11: task-availability open

For a finitely generated task algebra `A <= B_infinity`, define

\[
O_A=\{\mathcal B\in P_{\mathcal G}:\mathcal A\subseteq\mathcal B\}.
\]

Because repair only adds observables, `O_A` is an upset of the causal context
poset.

Let

\[
\Omega(\mathcal G)=\operatorname{Up}(P_{\mathcal G})
\]

be all causal upsets. For finite `P_G`, this is a complete Heyting algebra with

\[
U\wedge V=U\cap V,
\qquad
U\vee V=U\cup V,
\]

and

\[
U\Rightarrow V
=\{x:\uparrow x\cap U\subseteq V\}.
\]

The audit checks the defining adjunction

\[
W\cap U\subseteq V
\quad\Longleftrightarrow\quad
W\subseteq(U\Rightarrow V)
\]

for every triple of opens in both finite witnesses.

Task generation reverses joins:

\[
O_{A\vee C}=O_A\cap O_C.
\]

An arbitrary union `O_A union O_C` means the operational proposition “`A` or
`C` is available.” It need not be represented by one task algebra.

### Why this logic is not Boolean

The Heyting negation of `O_A` is

\[
\neg O_A=(O_A\Rightarrow\varnothing).
\]

It means “from this context, no future refinement can enter `O_A`.” It does
not mean “`A` is unavailable right now.”

In both four-point examples, `q` is eventually reachable from every context.
Consequently,

\[
\neg O_q=\varnothing,
\qquad
O_q\vee\neg O_q=O_q\ne\top.
\]

Thus “not yet distinguishable” is neither “distinguishable” nor “impossible.”
The terminal observable algebra remains Boolean; the causal logic of
availability is generally intuitionistic.

This is the precise v0 meaning of an **algebra of when distinctions become
meaningful**.

### Definition 12: weak and strict prerequisite

`A` is a **weak persistent prerequisite** for `C` when

\[
O_C\subseteq O_A,
\]

equivalently

\[
O_C\Rightarrow O_A=\top.
\]

This says `C` is never available without `A`. It does not prove that `A` was
available strictly earlier: simultaneous creation also satisfies the
inclusion.

For a strict prerequisite, inspect first-entry edges. Say `A` is a **strict
entry prerequisite** for `C` when at least one first-entry edge exists and
every strict edge

\[
\mathcal B\longrightarrow\mathcal B'
\]

with `B` outside `O_C` and `B'` inside `O_C` begins at a context in `O_A`.

For the four-point systems:

| Quantity | Parallel | Serial |
|---|---:|---:|
| Contexts in `P_G` | `4` | `3` |
| Opens in `Omega(G)` | `6` | `4` |
| `p` weak prerequisite for `q` | no | yes |
| `p` strict entry prerequisite for `q` | no | yes |
| Root repair cost of `p` | `1` | `1` |
| Root repair cost of `q` | `1` | `2` |
| Root repair cost of `p join q` | `2` | `2` |

This table contains more causal information than the individual task-depth
multiset. In the parallel process, `p` and `q` both have depth one but live in
different depth-one contexts; their joint depth is two.

## 5. Cost belongs to a declared layer

### Definition 13: canonical context-relative repair cost

For a current context `B` and a task algebra `C`, define

\[
\kappa_{\mathcal G}(C\mid\mathcal B)
=\min\{d_{\mathcal G}(\mathcal B,\mathcal B'):
       C\subseteq\mathcal B'\}.
\]

This is canonical from primitive-costed repair semantics.

Conditioning only on the statement “`A` is available” is ambiguous because
`O_A` may have several minimal contexts. Minimizing over all of `O_A` is wrong:
the terminal context lies in `O_A` and makes every terminal task cost zero.

Let the first-hit frontier be

\[
\operatorname{Fr}(A)=\min O_A.
\]

Without a scheduler or specified context, retain the range

\[
\left[
\min_{B\in\operatorname{Fr}(A)}\kappa(C\mid B),
\max_{B\in\operatorname{Fr}(A)}\kappa(C\mid B)
\right].
\]

### Definition 14: circuit-enriched causal access

The bare data `(S,B_0,D,c)` do not specify a circuit complexity. They provide
no chosen generators for `B_0`, decoder costs, algebraic gate set, sharing
rules, or precision model.

A **v0.1 circuit enrichment** adds those choices. The executable audit studies
one exact model:

- every Boolean observable in the current algebra is a free input;
- Boolean algebra operations and reuse are free;
- one gate transports one currently available Boolean observable through one
  declared primitive;
- each transport gate has its declared primitive cost;
- circuits are compared extensionally by their generated observable algebra.

For this declared model, define

\[
K(C\mid A)
=\text{minimum circuit cost needed to generate }C
\text{ from free algebra }A.
\]

The audit exhausts all fifteen partition algebras on four points and checks

\[
K(A\mid A)=0,
\]

monotonicity under richer free input,

\[
K(C\vee D\mid A)
\leq K(C\mid A)+K(D\mid A),
\]

and sequential composition,

\[
K(C\mid A)
\leq K(B\mid A)+K(C\mid A\vee B).
\]

### Repair/circuit comparison

When `kappa` and `K` use the same primitive alphabet and costs,

\[
\kappa(C\mid A)\leq K(C\mid A).
\]

To simulate a unary circuit gate, apply the corresponding full repair. The
batch repair transports every currently available observable, so its context
contains the circuit context after each simulated gate; a batch stutter can
only reduce strict-ledger cost. The inequality can be strict.

On five points, take

\[
A=\{0,1,2\}\mid\{3\}\mid\{4\},
\qquad
D=(0,3,4,3,4).
\]

One batch repair makes the partition discrete, so `kappa=1`. One transported
Boolean observable can split the three-point block into at most two pieces,
whereas two transports suffice; hence the declared unary-gate model has `K=2`.
The executable audit asserts both values.

For `B_p`, `B_q`, and the discrete terminal algebra `B_*`:

| Circuit quantity | Parallel | Serial |
|---|---:|---:|
| `K(B_p | B_0)` | `1` | `1` |
| `K(B_q | B_0)` | `1` | `2` |
| `K(B_* | B_0)` | `2` | `2` |
| `K(B_q | B_p)` | `1` | `1` |
| leverage of `B_p` on `B_q` | `0` | `1` |
| joint-generation synergy | `0` | `1` |

Here

\[
L(A\to C)=K(C\mid B_0)-K(C\mid B_0\vee A)
\]

measures reusable enabling, and

\[
\operatorname{Syn}(A,C)
=K(A\mid B_0)+K(C\mid B_0)-K(A\vee C\mid B_0)
\]

measures shared generation work in this circuit model.

These are not canonical invariants of bare v0. They become meaningful only
after the circuit interface is part of the object.

### Definition 15: causal distinction geometry

Within a declared cost model, define first-separation depth

\[
\delta(x,y)
=\inf\{K(C^*(B_0,h)\mid B_0):h(x)\ne h(y)\}.
\]

Use `inf emptyset = infinity`, so `delta(x,x)=infinity`. Any observable
separating `x` from `z` separates `x` from `y` or `y` from `z`; hence

\[
\delta(x,z)\geq\min\{\delta(x,y),\delta(y,z)\}.
\]

Before quotienting, behaviorally identical points have infinite separation
depth and zero distance. After those points are identified,

\[
d_{\rm causal}(x,y)=e^{-\delta(x,y)}
\]

is an ultrametric. The audit checks the strong triangle inequality on all point
triples.

Let `N(t)` be the number of equivalence classes under the relation
`delta(x,y)>t`; equivalently, the number of classes distinguishable at cost at
most `t`. The exact profiles are

\[
N_{\rm parallel}(0)=2,
\qquad
N_{\rm parallel}(1)=4,
\]

and

\[
N_{\rm serial}(0)=2,
\qquad
N_{\rm serial}(1)=3,
\qquad
N_{\rm serial}(2)=4.
\]

This avoids overweighting complements and redundant Boolean combinations in a
raw task-count spectrum.

### Cost no-go results

1. **Retokenization.** Adding a composite as a new unit-cost primitive can
   collapse word depth. In the serial witness,

   \[
   D_\gamma
   =D_\alpha^{\rm serial}\circ D_\beta^{\rm serial}
   =D_\beta^{\rm parallel},
   \qquad
   U_\gamma=U_\beta^{\rm serial}U_\alpha^{\rm serial}.
   \]

   The audit adds this composite as `gamma`. Charging `gamma` one makes the
   `B_q` task cost one from `B_0`; charging its inherited expansion cost two
   preserves cost two.

2. **Batch repair.** `Phi_a(B)=C^*(B union U_aB)` transports every observable
   of `B` in one step. At scale it can expose many independent generators for
   one declared repair. A scaling theorem must either declare this a batch
   oracle or charge transported generator/evaluation/representation work.

3. **Finite hardwiring.** Any one fixed finite system can be encoded as a
   finite lookup table. A nontrivial architectural theorem requires a uniform
   family or infinite carrier and uniform interpretation constants.

4. **Residual flattening.** Every deterministic repair process can be flattened
   into future residual behavior. Only bounded-cost lower bounds can be true.

## 6. Biordered completion and information germs

The finite v0 object already explains endpoint forgetfulness, but it does not
yet contain a genuinely non-finitely-isolated state: every ideal in either
finite context order is principal.

The proposed infinite continuation starts from a computable **biordered** basis
of finite reachable contexts

\[
(C_{\rm fin},\sqsubseteq,\preceq,\{\Phi_a\}).
\]

The order used for continuous state completion must be declared. It cannot in
general be causal reachability: Counterexample 6 shows that `Phi_a` need not be
monotone for `preceq`. Use informational refinement `sqsubseteq` instead.

### Definition 16: informational ideal completion

An informational ideal `I` is a nonempty `sqsubseteq`-directed lower set. Define

\[
\mathcal D_G
=\operatorname{Idl}(C_{\rm fin},\sqsubseteq).
\]

Ordered by inclusion, `D_G` is an algebraic directed-complete partial order.
Its compact basis consists of the principal ideals

\[
\eta(B)=\mathord\downarrow_{\sqsubseteq}B.
\]

A nonprincipal ideal is an **information germ**: its identity is the compatible
totality of its finite informational refinements, but no one finite context
isolates it. It is not, merely by being an ideal, a history or causal path.

For an abstract directed observable diagram, let `B_I` be its directed colimit.
Only when all algebras are concretely embedded in one common ambient algebra
may this be written as the closure of their union.

A finitely witnessed task algebra `A` defines the Scott-open proposition

\[
\widehat O_A
=\{I:\exists B\in I,\ A\subseteq\mathcal B_B\}.
\]

Membership is witnessed at a finite stage, and

\[
\eta^{-1}(\widehat O_A)=O_A.
\]

Only these shared finite-task opens are automatically related to the causal
availability locale. An arbitrary causal upset need not be informationally
upward and need not extend to a Scott open.

### Theorem 17: Scott-continuous repair extension

Each `Phi_a` is monotone and inflationary for `sqsubseteq`, so it has the unique
Scott-continuous extension

\[
\overline\Phi_a(I)
=\mathord\downarrow_{\sqsubseteq}
  \{\Phi_a(B):B\in I\},
\qquad
\overline\Phi_a\eta=\eta\Phi_a.
\]

It is inflationary, preserves directed joins, and respects identities and
composition under ideal extension. Thus the primitive action monoid extends to
`D_G`, even though it need not act monotonically on the causal poset `P_G`.

This is the exact current meaning of **continuous genesis**: continuation is
Scott-continuous in informational refinement, while temporal reachability and
prerequisites remain governed by the separate causal order.

### Model 18: the irrational-path analogy

Take finite partial binary observations ordered by extension. A total infinite
bitstream determines the ideal of all its finite restrictions. No finite
restriction is the total point, yet every finite question about it is answered
at some finite stage.

If the stream happens to code a computable irrational, irrationality is only an
example of non-finite isolation. The structural point is the ideal, not the
number. The same construction applies to semantic refinement objects that are
not numerical at all. A separate causal construction is required before such
an ideal may be called a path.

This is the clean current interpretation of a refinement-complete or
“irrational” algebraic process:

> compact views are executable; the semantic point is their nonprincipal
> directed completion; and continuation acts continuously on that completion.

Whether the OASIS/non-sofic process yields the required nonprincipal ideals and
non-finite residual structure is an open theorem, not part of finite v0.

## 7. What bare genesis canonically transports

### Proposition 19: canonical quotient charts are irreversible

For a strict partition refinement `Pi'` of `Pi`, bare genesis canonically
supplies

\[
p_{\Pi,\Pi'}:S/\Pi'\longrightarrow S/\Pi,
\]

which forgets the new distinction. These quotient maps compose along repair
paths.

They form the contravariant irreversible transport

\[
\operatorname{Spec}\circ\operatorname{Obs}_{\mathcal G}:
P_{\mathcal G}^{\rm op}\longrightarrow\mathbf{FinSurj}.
\]

They are generally not bijections, so they are not bijective `G`-valued
connections in the sense used below. Bare genesis also permits the trivial
retained-carrier choice `F_B=S` with identity edge maps, but that connection is
always flat and contains no repair information.

### Theorem 20: no natural deterministic child-section exists in general

Let

\[
S=\{0,1,2,3\},
\qquad
\Pi=\{0,1\}\mid\{2\}\mid\{3\},
\]

and

\[
D=(2,3,2,3).
\]

Then `Phi_D(Pi)` is discrete. The automorphism

\[
\sigma=(0\ 1)(2\ 3)
\]

preserves `Pi` and commutes with `D`. On the coarse quotient it fixes the atom
`{0,1}`, while on the refined quotient it exchanges its two children.

If a deterministic section natural under these automorphisms

\[
s:S/\Pi\longrightarrow S/\Phi_D(\Pi)
\]

existed, equivariance would require

\[
\sigma s(\{0,1\})
=s(\sigma\{0,1\})
=s(\{0,1\}),
\]

but neither child is fixed by `sigma`. Contradiction.

The audit enumerates the two possible set-theoretic sections and finds zero
equivariant sections. Bare repair therefore does not canonically choose one
child, representative, or deterministic inverse lift.

This obstruction is category-dependent. For every finite surjection
`p:F' -> F`:

- its converse is a canonical right inverse in the category of relations,
  because `p after p^dagger = id_F`;
- normalized counting on each nonempty fiber,

  \[
  K(x\mid y)=\frac{1}{|p^{-1}(y)|}\mathbf 1_{p(x)=y},
  \]

  is a right inverse after pushforward in finite stochastic kernels and is
  equivariant under automorphisms of `p`.

Relational converses compose exactly. Uniform fiber kernels do not generally
compose along nested quotients: uniform choice at each level can weight final
children differently from direct uniform choice. If a full-support measure
`mu` on the retained carrier is declared, the conditional kernels

\[
K^\mu(C'\mid C)=\frac{\mu(C')}{\mu(C)}
\]

do compose along nested partition blocks. This construction is natural only
for maps preserving the declared measure; uniform measure is automatically
preserved by carrier bijections, not by arbitrary capability simulations.

None of these constructions chooses a unique child or supplies a bijective
connection: the relational lift retains the whole fiber, while the stochastic
lift averages over it. Probability therefore re-enters here as an optional
symmetry-respecting state on a pre-existing quotient, not as the genesis
carrier.

### Theorem 21: flat connection moduli

Let `K` be a connected finite repair graph or 2-complex, let `F` be a fixed
finite presentation fiber, and let `G <= Sym(F)` be a constant structure group.
A flat `G`-connection labels oriented edges by `T_e in G`, reverses orientation
by inversion, and imposes boundary product one on declared 2-cells. Vertex
gauge acts by

\[
T_e\longmapsto g_{t(e)}T_eg_{s(e)}^{-1}.
\]

Then

\[
\frac{\{\text{flat }G\text{-connections on }K\}}
     {\text{vertex gauge}}
\cong
\frac{\operatorname{Hom}(\pi_1(K),G)}{G},
\]

where `G` acts on representations by conjugation.

Proof: choose a spanning tree and gauge every tree edge to identity. Each
cotree edge records one fundamental-cycle holonomy. The 2-cells impose exactly
the relations of `pi_1(K)`, and the remaining root gauge simultaneously
conjugates all cycle labels. Conversely a representation labels the cotree
edges and reconstructs a connection. `QED`

For an unfilled diamond, a connection class is the conjugacy class of its one
cycle holonomy. The audit enumerates all `6^4=1,296` `S_3` edge labelings:

| Holonomy type | Edge labelings |
|---|---:|
| identity `(1,1,1)` | `216` |
| transposition `(1,2)` | `648` |
| three-cycle `(3)` | `432` |

These are the three conjugacy classes of `S_3`.

If the diamond is filled as a commuting semantic 2-cell, strict descent and
flatness force identity boundary holonomy. A general non-flat edge connection
instead has derived face curvature

\[
\Omega_f=\prod_{e\in\partial f}T_e.
\]

If semantic path equality is retained while its defect is represented in a
higher target, an additional comparison 2-cell and higher coherence data are
required.

This clarifies the earlier four-point connection example:

- as an unfilled repair graph, its transposition is ordinary cycle holonomy;
- as a filled commuting semantic square, the same transposition is curvature;
- either way, it is enrichment, not a consequence of the bare repair atlas.

### Connection descent criterion

For transport valued in any category, descent through the endpoint/Moore
quotient requires and is characterized by equal transport on every
endpoint-equivalent path. Inverses are not needed for that statement.

For a bijective `G`-valued connection—modeled as a functor from the free path
groupoid to finite bijective fibers, modulo vertex-gauge natural
isomorphism—this says

\[
T(p)=T(q)
\]

for every pair of endpoint-equivalent paths. Equivalently, every kernel loop

\[
T(q)^{-1}T(p)
\]

has trivial holonomy.

Thus nontrivial kernel holonomy is an obstruction to descent through bare
future-availability semantics. It is not a reason to treat raw path spelling
as semantic.

### Additional transport data by target category

In the constant-group setting:

- locally, an ordered cleavage or witness can break child-lift symmetry;
- globally, the complete flat datum is a conjugacy class
  `[rho:pi_1(K)->G]`;
- for filled squares with curvature, face labels and higher coherence are
  required.

Context-dependent stabilizer groups require a graph-of-groups or nonabelian
cocycle formulation and remain outside v0.

## 8. A finite-persistent-interface soficity theorem

The first fixed-interface non-sofic candidate fails for a structural reason.
Recording only persistent task availability is too weak.

Fix a finite alphabet `Sigma`, a root-reachable state set `X`, and a finite set
`Q` of typed computable output predicates. Put

\[
\lambda_Q:X\longrightarrow\{0,1\}^Q
\]

and define

\[
x\equiv_Q y
\quad\Longleftrightarrow\quad
\lambda_Q(x\cdot w)=\lambda_Q(y\cdot w)
\text{ for every }w\in\Sigma^*.
\]

This is a right congruence. On the root-reachable part, its quotient is the
minimal deterministic `Sigma`-Moore realization of the rooted output behavior.
It has infinite index exactly when no finite deterministic `Sigma`-Moore
machine realizes that declared behavior. This is the precise fixed-interface
automata meaning of “non-sofic” used here; it is not group non-soficity.

For Genesis v0 availability tests, however, infinite index cannot occur.

### Theorem 22: finite persistent availability is always sofic

Let `Sigma` be finite, let every repair `Phi_a` be inflationary and monotone in
the information order, and let `Q` be a finite family of persistent finite-task
tests

\[
\lambda_A(B)=\mathbf 1_{A\subseteq B}.
\]

Then the future-`Q` congruence on root-reachable contexts has finite index.

For one task `A`, consider the rooted language

\[
L_A=\{w\in\Sigma^*:A\subseteq B_0\cdot w\}.
\]

If `u` is a scattered subword of `v`, then `v` is obtained by inserting
primitive actions into `u`. Each insertion first enlarges the current context,
and every later repair is monotone, so

\[
B_0\cdot u\subseteq B_0\cdot v.
\]

Thus `L_A` is upward closed in the scattered-subword order. By Higman's lemma,
it has a finite basis `w_1,...,w_m`, and therefore

\[
L_A
=\bigcup_{i=1}^m
\Sigma^*a_{i,1}\Sigma^*\cdots a_{i,k_i}\Sigma^*
\]

is regular. A finite family `Q` has a finite product Moore realization, so its
joint residual congruence has finite index. `QED`

The same proof applies on the ideal completion to finitely witnessed Scott
task predicates: they remain persistent under the inflationary extended
actions.

### Candidate successor: the local repair-defect field

Bare genesis canonically supplies a finite output that is not persistent:

\[
o_{\rm def}(B)
=\bigl(\mathbf 1_{\Phi_a(B)\ne B}\bigr)_{a\in\Sigma}.
\]

It records which primitive distinctions are enabled **at the present context**,
not merely which tasks have accumulated. In the serial four-point witness,
along the path `B_0 -> B_p -> B_*`, the `beta` component is

\[
0\longrightarrow1\longrightarrow0.
\]

Thus a repair can stutter, become enabled after another distinction appears,
and stutter again after completing its work. The Higman argument for persistent
availability does not apply to this output. Finite diamond-discrepancy bits can
be added without introducing a circuit model.

The current finite witness still has a finite defect-residual machine. The
companion
[`Cantor Defect Genesis`](cantor-defect-genesis.md) realizes the infinite
target: one fixed comparison-defect bit has pairwise distinct residuals along
an infinite refinement axis.

Therefore an externally universal, internally non-sofic genesis cannot place
its internal non-soficity solely in a fixed finite list of persistent
availability bits. At least one ingredient must change. The narrow live routes
are:

1. retain persistent observable growth, but expose a nonpersistent endogenous
   obstruction, defect, provenance, curvature, or cost-to-go output;
2. use a growing task interface together with a uniform bounded-cost
   interpretation theorem, so infinitude is not a cardinality trick;
3. change the finite-alphabet, inflationary, or informational-monotonicity
   assumptions explicitly.

External finite-task universality remains a separate requirement: every typed
finitely generated external task must be contained in a context reached by a
terminating finite word. Cantor Defect Genesis satisfies this exactly for finite-coordinate
cylinder tasks at the level of context availability and densely represents all
continuous Cantor observables. Target readout synthesis remains external. It
does not yet connect the defect process to the OASIS non-sofic group or prove
any resource advantage.

## 9. Isomorphism hierarchy and exact boundary

Keep four levels separate.

1. **Presentation isomorphism:** state and primitive bijections conjugate the
   raw dynamics and preserve costs.
2. **Weighted-bi-atlas equivalence:** a rooted isomorphism preserving both
   context orders, the shortest-cost directed metric, and the observable
   diagram. Primitive-label multiplicity is not retained at this level.
3. **Future-interface equivalence:** a rooted, output-preserving labeled Moore
   isomorphism after the declared alphabet and test interfaces are identified.
4. **Static-fossil equivalence:** only `(B_0 <= B_infinity)` agrees.

Presentation isomorphism implies atlas equivalence, which implies static-fossil
equivalence. Neither converse holds:

- duplicated primitives with the same contextual effects and costs, or raw
  dynamics invisible to the observable algebra, can change a presentation
  without changing its weighted bi-atlas;
- the parallel/serial witness has the same fossil and different atlases.

Proposition 0 from the finite witness remains decisive. The structured tuple

\[
(\mathcal B_0\subseteq\mathcal B_\infty,
  \Sigma,c,\{U_a|_{\mathcal B_\infty}\})
\]

reconstructs every `Phi_a`, hence both context orders, the causal atlas,
observable diagram, availability locale, shortest repair costs, and task/joint
availability.

Therefore no invariant derived solely from bare repair kinetics can distinguish
two systems with identical structured tuples. Anything further is circuit,
compiler, scheduler, provenance, connection, or curvature data.

## 10. Theorem and conjecture ledger

### Proved in finite v0

- repair monotonicity, inflationarity, finite strict-height bound, and possible
  non-idempotence;
- completion as the least common fixed point and reflector;
- the category of primitive capability simulations and repair naturality;
- the biordered context atlas, with causal reachability strictly contained in
  informational refinement and repair not generally causal-monotone;
- the causal observable diagram and informational Scott completion;
- minimal Moore realization of future observable availability;
- the finite Heyting availability locale;
- weak versus strict-entry prerequisites;
- finite-persistent-interface soficity;
- deterministic connection-lift nonidentifiability, together with its typed
  relational and stochastic escape boundary;
- constant-group flat-connection classification.

### Executably checked

- parallel locale size `6` versus serial locale size `4`;
- failure of excluded middle for “`q` is available”;
- the weak and strict prerequisite separation;
- joint repair depth versus individual depth;
- a five-point inclusion-without-reachability counterexample;
- a four-point non-idempotent repair;
- every law of the declared four-point circuit-cost kernel;
- causal ultrametric profiles;
- macro retokenization collapse and inherited-cost control;
- zero equivariant sections in the lift obstruction;
- all `1,296` `S_3` connections on one diamond.

### Proved in the Cantor defect extension

- exact computable nonstabilizing cylinder refinement;
- exact availability of every finite-coordinate cylinder task;
- uniform-density approximation of all continuous Cantor observables;
- infinite residual index for one fixed nonpersistent repair-defect interface,
  with minimal Moore quotient exactly an integer counter.

### Open

- an endogenous OASIS obstruction process with a proved non-sofic defect
  interface, rather than abstract Cantor comparison axes;
- a task theory that requires a rich family of nonprincipal information germs,
  rather than one distinguished nonprincipal ideal of the Cantor refinement
  grid;
- a natural source of nonzero curvature data;
- a bounded-cost atlas-versus-global separation under one declared circuit
  model;
- refinement persistence for any resulting cohomological class;
- a formal Lean development of the v0 category, reflector, locale, and finite
  counterexamples.

### Falsified or rejected

- the terminal algebra alone determines genesis;
- ambient algebra inclusion is the causal order;
- one context order is sufficient for both causality and continuous
  refinement;
- primitive repair is always monotone for causal reachability;
- repair maps are always idempotent;
- individual task depths determine joint availability;
- raw path words are semantic objects;
- a composite may be assigned unit cost without changing the object;
- bare failed descent selects a natural deterministic inverse lift;
- bare genesis determines a nontrivial connection;
- a fixed finite interface of persistent task-availability bits can be
  non-sofic under finite-alphabet, inflationary, informationally monotone
  repair;
- one finite witness proves absolute non-flattenability;
- circuit complexity is canonical without a gate and cost model.

## 11. Next inductive study

The next research cycle should proceed in this order.

1. **Finite classification.** Enumerate small Genesis v0 presentations up to
   atlas equivalence, not raw state labels, and catalogue their availability
   locales, first-entry prerequisite relations, and automorphism obstructions.
2. **Formal core.** Prove the biorder, reflector, Scott extension,
   availability-locale, finite-persistent-interface soficity, and
   connection-moduli results in a proof assistant.
3. **Endogenous nonpersistent residual.** Realize the proved Cantor comparison
   axes and `q`-defect using executable OASIS obstruction certificates, and
   test whether infinite defect residual index survives.
4. **Uniform cost theorem.** Choose one circuit enrichment and one family
   `G_n`; compare atlas and global realizations under uniform bounded-cost
   bi-interpretations.
5. **Only then classify.** Run a literature pass to identify which pieces are
   standard domain theory, automata, categorical dynamics, nonabelian
   cohomology, or genuinely unusual in combination.
6. **Architecture afterward.** Translate only invariants that survive these
   gates into an adaptive computational architecture.

The proposed foundational package is therefore

\[
\boxed{
(C_{\rm fin},\sqsubseteq,\Sigma,c,\{\Phi_a\},\preceq,d,
 \operatorname{Obs},\Omega_{\rm when},
 \operatorname{Idl}(C_{\rm fin},\sqsubseteq))
}
\]

This full package retains the declared primitive interface. Its weighted
bi-atlas quotient intentionally forgets dominated or duplicated primitive
spellings and keeps shortest contextual cost. Optional circuit and connection
enrichments remain explicitly typed.

The completed algebra is a fossil of this package. It is not the package.

## Run

```text
node research/genesis-v0-audit.mjs
node research/cantor-defect-genesis.mjs
```

Every finite claim reported by the commands is enforced by an assertion.
