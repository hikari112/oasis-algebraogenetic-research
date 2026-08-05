# Genesis before completion: a static-endpoint forgetfulness witness

## Status

This note constructs and exhaustively checks an explicit finite object in which
a genesis process contains strictly more causal information than its **static
endpoint observable algebra with transport forgotten**. The core theorem is
exact but deliberately narrow. A second,
connection-enriched example has genuine gauge-invariant holonomy, but the
connection is additional structure and is not yet generated canonically by the
bare obstruction-repair rule.

No claim of a new field or of absolute non-flattenability is made. In fact, an
explicit residual-state control proves that both finite examples can be
flattened once their repair context is included in the state.

The executable audit is
[`genesis-fossil-nonidentifiability.mjs`](genesis-fossil-nonidentifiability.mjs).

## 1. The finite genesis object

Let `S` be a finite set. A unital Boolean observable algebra on `S` is
equivalently a partition `Pi` of `S`: the observable idempotents are the unions
of its blocks. Write `B(Pi)` for the corresponding subalgebra of `C(S)`.

Let `Sigma` be a finite alphabet and let

\[
D_a:S\to S,
\qquad
U_a h=h\circ D_a.
\]

For a current observable algebra `B`, define one atomic transport repair by

\[
\Phi_a(B)=C^*(B\cup U_aB).
\]

In partition language,

\[
x\sim_{\Phi_a(\Pi)}y
\quad\Longleftrightarrow\quad
x\sim_\Pi y
\text{ and }
D_ax\sim_\Pi D_ay.
\]

Thus `Phi_a` splits exactly those current fibers on which the `a`-successor
fails to descend. This is the simultaneous version of adjoining all canonical
repairs witnessed for action `a` at the current stage.

### Reachable genesis geometry

For

\[
\mathcal G=(S,\mathcal B_0,\{D_a\}_{a\in\Sigma}),
\]

let `R(G)` be the finite directed graph whose vertices are all algebras
reachable from `B_0` by the operators `Phi_a`, and whose non-stuttering edges
are

\[
B\xrightarrow{a}\Phi_a(B),
\qquad \Phi_a(B)\ne B.
\]

Action names may be forgotten after the graph is constructed. The reachability
order records which distinctions could exist before which others; it is not
the total order chosen by one scheduler.

The completed observable algebra is

\[
\mathcal B_\infty
=C^*\!\left(\bigcup_{w\in\Sigma^*}U_w\mathcal B_0\right).
\]

The **static pointed fossil** is deliberately only

\[
F(\mathcal G)=(\mathcal B_0\subseteq\mathcal B_\infty).
\]

It remembers the initial and completed questions, but discards the transport
endomorphisms, primitive-action interface, compiler state, and causal
availability. Given `B_0`, `B_infinity`, and the completed endomorphisms
`{U_a}`, the reachable repair graph is determined by the displayed definition
of `Phi_a`; the separation below would disappear if all of that structured
transport data were retained. The theorem is therefore about endpoint
forgetfulness, not about two dynamically identical systems.

### Proposition 0: structured transport determines this repair graph

For the repair law used here, the data

\[
(\mathcal B_0\subseteq\mathcal B_\infty,
  \{U_a|_{\mathcal B_\infty}\}_{a\in\Sigma})
\]

together with the primitive-action costs determine `R(G)` and its task-depth
spectrum. Indeed, `Phi_a(B)=C^*(B union U_aB)` is determined at every reachable
vertex, so iteration from `B_0` reconstructs the entire graph. Consequently,
the present examples cannot separate two systems after their full transport
endomorphisms are retained. Any stronger genesis object must add a compiler,
connection, causal-access rule, or other structure not determined by that
tuple.

### Task-depth spectrum

For an idempotent task `e in B_infinity`, define

\[
d_\mathcal G(e)
=\min\{k:e\in B\text{ for a vertex }B\in\mathcal R(\mathcal G)
\text{ reachable in }k\text{ strict repairs}\}.
\]

Depth is measured relative to the declared primitive alphabet, with every
non-stuttering atomic repair assigned unit cost. Adding a composite action as a
new cost-one primitive changes the genesis object and its ledger. The multiset
of these depths is the finite **task-depth spectrum**. It is
invariant under state relabeling and endpoint algebra isomorphisms that carry
the whole reachable genesis geometry. It is not determined by the pointed
fossil.

### Repair-square discrepancy

For two atomic actions define

\[
\Omega_B(a,b)
=d_{\rm pair}\bigl(\Phi_b\Phi_a(B),\Phi_a\Phi_b(B)\bigr),
\]

where `d_pair` is the fraction of unordered state pairs separated by exactly
one of the two resulting partitions. This is a nonnegative, relabeling-
invariant measure of order dependence. Because the repair maps need not be
invertible and the square need not close, `Omega` is called a **square
discrepancy**, not a holonomy class.

## 2. The four-point construction

Let

\[
S=\{1,2,3,4\},
\qquad
r=1_{\{3,4\}},
\quad p=1_{\{2\}},
\quad q=1_{\{4\}},
\]

and start from

\[
\mathcal B_0=C^*(r).
\]

The relevant algebras and partitions are

\[
\begin{array}{c|c}
\text{algebra}&\text{atom partition}\\ \hline
\mathcal B_0&\{1,2\}\mid\{3,4\}\\
\mathcal B_p=C^*(r,p)&\{1\}\mid\{2\}\mid\{3,4\}\\
\mathcal B_q=C^*(r,q)&\{1,2\}\mid\{3\}\mid\{4\}\\
\mathcal B_*=C^*(r,p,q)&\{1\}\mid\{2\}\mid\{3\}\mid\{4\}.
\end{array}
\]

The two intermediate algebras are incomparable and their join is `B_* = C(S)`.

### Parallel genesis

Define

\[
\begin{array}{c|cccc}
x&1&2&3&4\\ \hline
D_\alpha(x)&1&3&1&1\\
D_\beta(x)&1&1&1&3.
\end{array}
\]

Then

\[
U_\alpha r=p,
\qquad
U_\beta r=q,
\]

while both actions send `p` and `q` to zero whenever those values are needed
below. Consequently,

\[
\Phi_\alpha(\mathcal B_0)=\mathcal B_p,
\qquad
\Phi_\beta(\mathcal B_0)=\mathcal B_q,
\]

and

\[
\Phi_\beta(\mathcal B_p)
=\Phi_\alpha(\mathcal B_q)
=\mathcal B_*.
\]

The reachable order is the diamond

\[
\mathcal B_0
<\{\mathcal B_p,\mathcal B_q\}
<\mathcal B_*.
\]

The two distinctions are independently available.

### Serial genesis

Keep `D_alpha` and replace `D_beta` by

\[
\begin{array}{c|cccc}
x&1&2&3&4\\ \hline
D_\beta(x)&1&1&1&2.
\end{array}
\]

Now

\[
U_\beta r=0,
\qquad
U_\beta p=q.
\]

Therefore `beta` cannot create a distinction initially:

\[
\Phi_\beta(\mathcal B_0)=\mathcal B_0.
\]

Only after `alpha` has created `p` can `beta` create `q`:

\[
\mathcal B_0
\xrightarrow{\alpha}\mathcal B_p
\xrightarrow{\beta}\mathcal B_*.
\]

The reachable order is a chain. The second distinction genuinely depends on
the first.

## 3. Static-endpoint forgetfulness theorem

### Theorem 1: same static endpoint, different repair kinetics

The parallel and serial processes have identical static pointed fossils and
identical terminal pointwise readout algebras:

\[
F(\mathcal G_{\rm parallel})
=F(\mathcal G_{\rm serial})
=(C^*(r)\subset C(S)).
\]

Thus each eventually expresses every pointwise complex-valued function on `S`.
They do **not** have the same transport semantics: their `D_beta` maps differ.
Nevertheless, this is exactly what the static fossil forgets, and their
reachable genesis orders are not isomorphic.

### Proof

For the parallel process, `p=U_alpha r` and `q=U_beta r`. For the serial
process,

\[
p=U_\alpha r,
\qquad
q=U_\beta U_\alpha r.
\]

In both cases `r,p,q` separate all four points, so both completions are exactly
`C(S)`. Thus both can eventually express every pointwise complex-valued readout
on `S`.

The parallel reachable order has width `2`, while the serial reachable order
has width `1`. Width is invariant under order isomorphism, so no causal genesis
equivalence can identify the two. This conclusion does not depend on state
names, action names, or the schedule chosen along one run. `QED`

### Stronger finite invariants

The executable audit computes three mutually consistent separations.

| Invariant | Parallel | Serial |
|---|---:|---:|
| Reachable-poset width | `2` | `1` |
| `dim H-tilde_0` of the proper repair interval | `1` | `0` |
| Möbius number `mu(B_0,B_*)` | `1` | `0` |

The task-depth spectra of Boolean idempotents also differ:

\[
\begin{array}{c|ccc}
&d=0&d=1&d=2\\ \hline
\text{parallel}&4&8&4\\
\text{serial}&4&4&8.
\end{array}
\]

Thus a static endpoint algebra that omits its transport presentation does not
determine the number of primitive strict repairs required before different
final pointwise tasks become available.

The square discrepancy is

\[
\Omega_{\mathcal B_0}^{\rm parallel}(\alpha,\beta)=0,
\qquad
\Omega_{\mathcal B_0}^{\rm serial}(\alpha,\beta)=\frac16.
\]

In the serial process, the two orders disagree exactly on whether the pair
`{3,4}` has been split after two action attempts.

### Exact categorical boundary

The operation sending a genesis process to its static pointed fossil is not
injective on genesis-isomorphism classes. This is an object-level forgetfulness
statement. We do **not** count the parallel words `alpha beta` and `beta alpha`
as meaningful distinct morphisms merely because a free path category keeps
their spellings: the repair diamond commutes, so a semantic quotient should
identify those paths. Any later path invariant must first quotient identities,
stutters, renamings, and commuting common-refinement diamonds.

## 4. Minimality

Four carrier points are minimal for the chain-versus-diamond and noncommuting-
square phenomena under the preceding fixed-primitive repair rules.

If `B_0` is constant, every pullback of it is constant and genesis cannot
start. On at most three points, every proper nonconstant partition has two
blocks and every strict refinement of it is already discrete. Hence every
atomic repair either stutters or jumps directly to the terminal algebra. Two
atomic repairs therefore commute, and the reachable proper interval has width
at most one.

The executable audit independently enumerates every set partition and every
ordered pair of deterministic actions for carrier sizes one through three:

| `|S|` | Partitions | Actions | Ordered two-action systems | Maximum width | Maximum square pair defect |
|---:|---:|---:|---:|---:|---:|
| 1 | 1 | 1 | 1 | 1 | 0 |
| 2 | 2 | 4 | 32 | 1 | 0 |
| 3 | 5 | 27 | 3,645 | 1 | 0 |

The four-point examples attain width two and a nonzero square discrepancy, so
the bound is sharp.

## 5. Why fixed-observable adjunction cannot create curvature

For a fixed closure operation and fixed globally available observables `c,d`,

\[
R_c(B)=C^*(B\cup\{c\})
\]

satisfies

\[
R_dR_c(B)
=C^*(B,c,d)
=R_cR_d(B).
\]

Thus a theory that begins with one completed ambient algebra and merely reveals
pre-existing coordinates has flat repair squares by construction. This is the
precise content of the warning that beginning with the completion “smuggles in”
all future distinctions.

The serial example escapes that no-go because the generator exposed by `beta`
depends on the current context:

\[
U_\beta r=0,
\qquad
U_\beta p=q.
\]

The second question is not selected from the initial algebra; it becomes
expressible only after the first repair.

## 6. A typed connection enrichment and genuine finite holonomy

The bare serial square is noninvertible and does not close after equal path
length, so calling its discrepancy “holonomy” would be incorrect. A legitimate
finite holonomy requires a fiber and invertible transport.

Use the parallel diamond as a base repair graph. Over every vertex `v`, place a
four-point fiber `F_v=S` and the partition `Pi_v` belonging to that context.
The local structure group is

\[
G_v=\{g\in\operatorname{Sym}(F_v):g\text{ maps blocks of }\Pi_v
\text{ to blocks of }\Pi_v\}.
\]

An edge transport is a bijection `T_e:F_v -> F_w`. In the chosen common frame,
the transports used below are conservative: `h after T_e=h` for every
observable `h` already available at the source vertex. A gauge transformation
is a tuple `(g_v)` with `g_v in G_v`, acting by

\[
T_e\longmapsto g_wT_eg_v^{-1}.
\]

Compare two connections:

- **flat:** every edge transport is the identity;
- **twisted:** every edge is the identity except the upper-to-terminal edge,
  which swaps states `3` and `4`.

The swap fixes every observable in the upper context pointwise because it acts
only inside the unresolved block of

\[
\{1\}\mid\{2\}\mid\{3,4\}
\].

The terminal context is discrete in both systems, so both have the same
terminal pointwise algebra `C(S)` and the same sixteen Boolean idempotent
readouts. Their route-dependent transport behavior is not the same.

Let `T_u,T_l` be the two forward route transports and define

\[
H=T_l^{-1}T_u.
\]

Under a change of frame at the vertices, `H` changes by conjugation. Its cycle
type and fixed-point count are therefore gauge invariant.

| Connection | Holonomy cycle type | Forward-route disagreement |
|---|---|---:|
| Flat | `(1,1,1,1)` | `0` |
| Twisted | `(1,1,2)` | `1/2` |

No reverse physical dynamics is required to observe the discrepancy: send the
same state through the two forward repair routes and compare their terminal
outputs. They disagree on states `3` and `4`. The inverse occurs only in the
standard formula used to express relative holonomy.

The executable audit enumerates all `3,072` tuples of vertex gauge
transformations preserving the four context partitions and finds no gauge
equivalence between the flat and twisted connections.

### Exact boundary of the connection result

This proves that static endpoint observable algebras do not determine a
compatible connection after that connection has been added to the structure.
It does **not** yet prove that obstruction-guided genesis
canonically creates the twisted connection. At present the connection is a
separately specified enrichment. The missing theorem must construct its fibers
and edge transports from intrinsic repair certificates rather than insert them
by hand.

## 7. The residual-flattening control

Every deterministic genesis process can be flattened extensionally by taking
its complete future residual behavior as a state. In these finite examples, an
even smaller flattening suffices: the current reachable partition is a state.
The script emits and replay-checks the exact transition tables:

- four states for the parallel repair graph;
- three states for the serial repair graph.

Similarly, the connection example can be flattened by retaining the route or
frame as part of the state. Therefore the present result is **not**:

> No fixed global state representation exists.

What is proved is:

> A static endpoint observable algebra with transport omitted does not determine
> causal task availability, repair-order geometry, or an added connection.
> Recovering those data requires retaining additional process structure.

This shows only that a bare endpoint algebra is insufficient when repair
kinetics are part of the phenomenon. It does not show that an algebra equipped
with its endomorphisms and compiler state is insufficient, and it does not
reject every history-aware static encoding.

## 8. What the first attempt taught us

The original target splits into three increasingly strong questions.

1. **Does a static endpoint completion with transport omitted forget repair
   kinetics?** Yes, exactly, already on four points.
2. **Can genesis carry gauge-invariant path transport beyond its completion?**
   Yes after adding a connection; deriving that connection intrinsically is
   open.
3. **Can no bounded-cost or finite-static representation preserve that process
   structure?** Not proved. Finite residual flattening is an explicit control,
   and any future separation must declare causal access and resource cost.

The next theorem target is therefore not another endpoint-algebra example. It
is a **canonical connection compiler**:

\[
\text{intrinsic failed-descent data}
\longmapsto
\text{fiber transport, defined up to gauge},
\]

followed by a proof that some resulting holonomy persists under conservative
common refinement. Only then should Hodge classes, Galois-style symmetry, or
architectural scaling laws be attached.

## Run

```text
node research/genesis-fossil-nonidentifiability.mjs
```

The command uses exact finite partitions and permutations. Any failed theorem
claim or regression raises an assertion instead of printing a successful
report.
