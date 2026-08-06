# Certificate-Cantor Controller: an exact obstruction bridge with two cost ledgers

## Status: executable bridge, endpoint no-go, bounded claim

This note connects the expansion/LEF proof-obligation certificate to the XOR
geometry of Cantor Defect Genesis. The connection is exact: the certificate's
existing Hamming defects and collision fractions are averages of pointwise XOR
coordinates. Those coordinates causally trigger the existing split/glue atlas
compiler.

The experiment also closes a tempting but incorrect interpretation. The
comparison repair `q` can reduce **transport depth**, but it cannot reduce the
amount of missing information that must be acquired. At the endpoint-algebra
interface it is a state-dependent parallel macro, not a compression theorem.

The executable companion is
[`certificate-cantor-controller.mjs`](certificate-cantor-controller.mjs).

No novelty or architecture-performance claim is made. The purpose is to make
the proof-to-Genesis bridge causal and to identify exactly which part of the
current object survives fair accounting.

## 1. Certificate cells are literal XOR coordinates

Fix a certificate relation `R` covered by a finite emulator on anchors
`a=0,...,N-1`. Let `pi_L` and `pi_R` be the finite permutations assigned to
the exact left and right words. Define

\[
x_{R,a}=\mathbf 1[R\text{ expects distinctness}],
\]

\[
y_{R,a}=\mathbf 1[\pi_L(a)\ne\pi_R(a)],
\]

and

\[
z_{R,a}=x_{R,a}\mathbin{\mathsf{XOR}}y_{R,a}.
\]

The `x` coordinate is the exact certificate expectation. The `y` coordinate
is the emulator's observed behavior. The `z` coordinate is the pointwise
obstruction.

### Proposition 1: XOR equals the existing audit severity

If `R` expects equality, `x_(R,a)=0`, so

\[
\frac1N\sum_a z_{R,a}
=\frac1N\#\{a:\pi_L(a)\ne\pi_R(a)\},
\]

which is exactly the normalized Hamming defect already reported by the
certificate.

If `R` expects distinctness, `x_(R,a)=1`, so

\[
\frac1N\sum_a z_{R,a}
=\frac1N\#\{a:\pi_L(a)=\pi_R(a)\},
\]

which is exactly the existing collision fraction.

Thus the proof certificate already carries the comparison field needed by the
Cantor construction. No posterior probability or guessed theorem confidence
is required.

## 2. Two different defect signals

The bridge has two logically distinct signals.

The strict repair defect is

\[
o_q(\mathcal B_{n,m})=\mathbf1[n>m].
\]

It says that accepted comparison cells have not all been materialized.

The semantic obstruction value on the pending cells is

\[
v_q=\max_{m<i\le n}z_i.
\]

It says that at least one accepted certificate cell actually disagrees with
the emulator.

The controller invokes the comparison transaction only when

\[
o_q=1\quad\text{and}\quad v_q=1.
\]

Strictness alone would waste a comparison on a clean backlog. A mismatch found
only after every observation has already been serially materialized arrives
too late to make `q` strict.

Computing `v_q` is not free. The finite critic inspects every covered anchor.
The executable reports that inspection work separately and charges it equally
to every policy. This controller is intentionally restricted to the
certificate's explicit relation checks. Alias, multiplication, expansion, and
finite-LEF audit families must receive their own typed XOR tapes before they
can drive this gate.

## 3. Causal transaction

For one deterministic relation-anchor tape, the controller performs:

1. `alpha` admits each exact expectation cell;
2. `delta` materializes the initial matching prefix;
3. a nonzero pending XOR cell opens a strict `q` transaction;
4. only inside that transaction does the proof certificate synthesize its
   split probes or glue constraint;
5. `EndogenousTransportAtlas.applyChallenge` validates the whole revision;
6. only after successful validation does the context commit `m <- n`.

A malformed late challenge—or an otherwise valid challenge carrying an
inconsistent severity—leaves the atlas, both context counters, and duplicate
key set unchanged. Replaying an identical audit is a **state stutter**: it
creates no new cell, probe, constraint, or revision. It is not a work stutter,
because the relation-anchor pass must still be replayed to recognize its key.
The adversarial override hook is authenticated against a freshly synthesized
canonical challenge: relation, word pair, severity, probes, constraints, and
refinement metadata must all agree. A forged extra artifact is rejected before
the atlas can mutate.

This ordering gives an operational meaning to the comparison repair. It is no
longer merely an abstract statement that some probe could be useful; a replayed
proof obligation is what authorizes the atlas mutation.

## 4. Exact fixtures

The final executable fixtures use a six-anchor emulator.

| Fixture | Covered cells | XOR mismatches | matching prefix | controller depth | serial depth | relation comparison work |
|---|---:|---:|---:|---:|---:|---:|
| identity-only clean control | 42 | 0 | 42 | 84 | 84 | 84 |
| identity and `j0` collapsed | 48 | 6 | 0 | 49 | 96 | 96 |
| deranged wrong-order `j0` | 48 | 4 | 8 | 57 | 96 | 96 |

The split fixture selects a covered word-distinctness relation, generates six unique coefficient
probes, and installs one separation relation. Its selected violation has XOR
mean `1`, exactly matching collision fraction `1`.

The isolated glue fixture has no pointwise distinctness collision. It violates
an equality relation on four of six anchors, so both its XOR mean and its
normalized Hamming defect are exactly `2/3`. It generates one gluing constraint
and no separation probe.

The same tapes are also compiled into the arrow-sensitive Laurent carrier. The
clean tape produces the zero germ. The split tape produces support
`{0,1,2,3,4,5}` using `36` explicit local shift/shear actions, and the glue
tape produces support `{8,9,10,11}` using `80`. All `42` or `48` coefficients
are then replayed through late-bound one-bit queries. These action counts are
reported rather than hidden behind the abstract batch `q`.

The report counts successful coefficient queries, not constant-time access.
Under the local Laurent action model, querying exponent `j` costs `|j|` frame
shifts; a random-access map is a stronger matched baseline and is not silently
charged the same latency.

The executable keeps unlike quantities separate. The Laurent construction
costs are `0`, `36`, and `80` local actions; replaying every coefficient costs
`861`, `1,128`, and `1,128` frame-shift actions. The output artifact counts are
`0`, `7`, and `1`; those counts are not mislabeled as compiler runtime. Exact
word evaluation, permutation composition, and challenge synthesis remain
uninstrumented, so no grand total is reported.

Applying the already-selected challenge to a fresh atlas reproduces the same
deduplicated endpoint curriculum. This is a conditional replay control, not an
independently discovering serial controller.

The depth number also depends on the declared tape order: certificate relation
order, then ascending anchor. With `M>0` mismatches among `N` cells, arbitrary
reordering changes the matching-prefix length from `0` to `N-M`; under a
uniform random permutation its expectation is `(N-M)/(M+1)`. The executable
reports observed, best, worst, and random-order expected depth rather than
treating the observed prefix as an invariant of the semantic tape.

## 5. Conditional catch-up theorem

Let `k=n-m>0`. Suppose a deterministic representation/decoder must support every missing coordinate
task

\[
y_{m+1},\ldots,y_n
\]

with uniform pointwise error strictly below `1/2`.

### Theorem 2: unavoidable information work

Every exact feature transcript from which all `k` coordinates can be decoded
has at least `2^k` possible values on each fixed visible-context fiber. Hence
it carries at least `k` bits of conditional Hartley information.

### Proof

Fix every coordinate already visible in `B_(n,m)` and vary only the `k`
missing `y` bits. This produces `2^k` points in one old atom. If two different
assignments had the same transcript, choose a coordinate on which they differ.
Its decoder would have to return one value within distance less than `1/2` of
both zero and one, which is impossible. Therefore every assignment needs a
different transcript. `QED`

Equivalently, a finite feature algebra ready for all missing tasks must split
each visible atom into at least `2^k` cells.

The comparison repair attains the lower bound with

\[
(W,D)_q=(k,1):
\]

the `k` independent XOR transports run in one declared parallel layer.

Unit-speed `delta` propagation attains

\[
(W,D)_\delta=(k,k).
\]

Thus `q` is work-optimal and latency-accelerating in a bounded-propagation
model. It is not information compression. A matched ambient random-access
vector primitive can also achieve depth one and must be admitted as an equal
baseline whenever that primitive is available.

## 6. Endpoint macro theorem

At the unpointed context level, write

\[
A(n,m)=(n+1,m),
\quad
D(n,m)=(n,m+1),
\quad
Q(n,m)=(n,\max\{m,n\}).
\]

For `k=(n-m)_+`,

\[
Q(n,m)=D^k(n,m).
\]

Every `q` in a context word can therefore be expanded online into the required
number of `delta` steps while preserving every endpoint after each macro
boundary. The simulator needs only `(n,m)`, or the single difference counter
`d=n-m` if only future defect outputs matter.

There is an even sharper policy collapse. Define

\[
P(B)=
\begin{cases}
\Phi_q(B),&o_q(B)=1,\\
B,&o_q(B)=0.
\end{cases}
\]

Because `q` already stutters exactly when `o_q=0`,

\[
P(B)=\Phi_q(B)
\]

for every reachable endpoint context. At this interface, “if defective, apply
`q`” is extensionally identical to applying `q` unconditionally. The semantic
XOR obstruction is what adds a real selection condition; strictness alone does
not.

The apparent conditional `n`-versus-`1` catch-up gap also shrinks end to end.
From the actual seed,

\[
\mathcal B_{0,0}\cdot\alpha^nq=\mathcal B_{n,n}
\]

uses `n+1` serial repair events, while `alpha^n delta^n` uses `2n`. If the two
independent local axes can propagate concurrently, the `q`-free depth is
already `n`.

## 7. What survived

The experiment establishes:

- a literal proof-certificate realization of the Cantor XOR comparison;
- causal split/glue compilation after a nonzero mismatch;
- exact rollback and duplicate state-stutter behavior;
- a work lower bound for acquiring missing Boolean distinctions;
- a component-ledger work/depth Pareto separation under bounded propagation; and
- a no-go theorem for endpoint-only compression or routing claims.

It does **not** establish:

- predictive-loss, parameter, memory, sample, or total-work improvement;
- a separation from an equally informed depth-one global sensor;
- an unbounded family of OASIS-derived certificate cells—the installed proof
  certificate is finite;
- a globally effective universal nonsofic witness—the existing locality and
  threshold obligations remain open;
- a difficult endpoint computation—the complete defect quotient is one
  counter; or
- an architecture theorem from nonsoficity alone.

## 8. The object exposed by the no-go

The endpoint macro theorem applies only after forgetting the actual transport
arrow. Although `q` and repeated `delta` can reach the same algebra, they do
not carry the same observable into it:

\[
U_qx_j=x_j\mathbin{\mathsf{XOR}}y_j,
\qquad
U_\delta^kx_j=x_j.
\]

The next object should therefore lift a context `B` to a pointed pair `(B,g)`
and retain the transported germ `g`. This is the precise place where the
completed endpoint algebra becomes a fossil of the process. The companion
Laurent-germ experiment tests that arrow-sensitive lift separately, without
using the endpoint batch as its claimed advantage.

## Run

```text
node research/certificate-cantor-controller.mjs
```

The command checks all XOR/Hamming identities used by the relation-scoped challenges,
the clean/split/glue traces, conditional endpoint-curriculum replay, duplicate
state stuttering, two independent transaction-rollback failures, canonical
override acceptance plus forged-bundle rejection, decoded
`2^k` transcript capacity through `k=12`, the endpoint macro/policy identity on
all `1,089` contexts in `[0,32]^2`, and all `2,016`
pairwise backlog residual certificates among the first `64` depths. It also
compiles every fixture's mismatch tape into a Laurent obstruction germ and
replays every coefficient exactly.
