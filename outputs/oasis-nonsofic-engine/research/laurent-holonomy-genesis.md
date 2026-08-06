# Laurent Holonomy-Germ Genesis: retaining the arrow erased by the endpoint algebra

## Status: explicit successor object, exact residual theorem, bounded claim

The endpoint analysis of Cantor Defect Genesis produced a no-go:

\[
\Phi_q(\mathcal B_{n,m})
=\Phi_\delta^{(n-m)_+}(\mathcal B_{n,m}).
\]

If only the resulting observable algebra is retained, `q` is a
state-dependent parallel macro. Fair work accounting removes any compression
claim.

But the two paths do not carry the same observables into their shared endpoint.
The quotient by endpoint algebras erased the transport arrow. This note keeps
one active transported observable—called a **semantic germ** here—and obtains
a strictly richer process object.

A small explicit successor uses two-sided binary streams and a Laurent
polynomial transport module. It has:

1. exact local continuation by shift and one-bit shear actions;
2. one fixed one-bit future-output interface;
3. a minimal residual quotient equal to the entire finite-support Laurent
   module;
4. at least `2^N` future-distinguishable residuals within action radius `2N`;
5. noncommuting transport and nontrivial frame-return loops;
6. finite one-germ commits whose union exposes every cylinder coordinate and
   is dense in the continuous Cantor algebra; and
7. an exact matched tape baseline, preventing a false compression claim.

The executable companion is
[`laurent-holonomy-genesis.mjs`](laurent-holonomy-genesis.mjs).

Here “germ” means a finitely represented observable seed carried by the
process. It is project terminology, not yet a claim that a sheaf-theoretic germ
or étale groupoid has been constructed.

No literature novelty or priority claim is made. The algebraic object was
frozen before naming and then subjected to the classification pass reported in
Section 10.

## 1. The endpoint quotient really loses information

Lift a context algebra to a pointed state

\[
(\mathcal B,g),\qquad g\in\mathcal B,
\]

and define the carried-arrow update

\[
(\mathcal B,g)\cdot a
=\bigl(\Phi_a(\mathcal B),U_ag\bigr).
\]

For `n>m`, let `k=n-m`. The base endpoints agree:

\[
\Phi_q(\mathcal B_{n,m})
=\mathcal B_{n,n}
=\Phi_\delta^k(\mathcal B_{n,m}).
\]

The arrows do not. On every available `x_j`,

\[
U_qx_j=x_j\mathbin{\mathsf{XOR}}y_j,
\]

whereas

\[
U_\delta^kx_j=x_j.
\]

The Boolean assignment `x_j=0,y_j=1` separates the transported functions.
Thus `q` is a `delta` macro only after applying the forgetful projection

\[
(\mathcal B,g)\longmapsto\mathcal B.
\]

This makes the earlier intuition precise:

> The completed algebra is a fossil of the process because it identifies
> parallel paths whose carried observables differ.

The observation alone gives no architectural advantage. An equally informed
global program that implements `U_q` can carry the same germ. Its role is to
locate the correct mathematical carrier.

## 2. Two-sided Cantor carrier and Laurent module

Let

\[
X=(\{0,1\}^{\mathbb Z})^2
\]

and let `x_j,y_j` be the two families of Boolean coordinate projections. The
locally constant cylinder algebra is dense in `C(X)`.

Work over the finite-support Laurent ring

\[
R=\mathbb F_2[z,z^{-1}].
\]

A Laurent polynomial

\[
p=\sum_{j\in S}z^j
\]

is represented by the finite exponent set `S`; addition is symmetric
difference. It specifies the Boolean observable

\[
p(y)=\bigoplus_{j\in S}y_j.
\]

Define the transport generators

\[
A=
\begin{pmatrix}
z&0\\
0&1
\end{pmatrix},
\qquad
Q=
\begin{pmatrix}
1&1\\
0&1
\end{pmatrix}.
\]

`A` changes the active `x` frame by one two-sided shift. `Q` is a single
coordinatewise XOR shear. Unlike the old endpoint repair, it does not expose
an unbounded block in one action.

For `p in R`, write

\[
Q_p=
\begin{pmatrix}
1&p\\
0&1
\end{pmatrix}.
\]

Then

\[
A^kQA^{-k}=Q_{z^k}
\]

and

\[
Q_pQ_r=Q_{p+r}.
\]

The first identity moves a one-bit shear to the current frame. The second
says that repeated shears accumulate a finite XOR support.

## 3. Exact normal form

Words act by right multiplication. Every transport word in

\[
\{a,a^{-1},q\}^*
\]

has a unique normal form

\[
Q_pA^k
=
\begin{pmatrix}
z^k&p\\
0&1
\end{pmatrix},
\qquad p\in R, k\in\mathbb Z.
\]

### Proposition 1: transition law

In the pair representation `(p,k)`, right multiplication gives

\[
(p,k)\cdot a=(p,k+1),
\]

\[
(p,k)\cdot a^{-1}=(p,k-1),
\]

and

\[
(p,k)\cdot q=(p+z^k,k).
\]

Normalize to the live frame by

\[
r=z^{-k}p.
\]

The carried-germ dynamics become

\[
r\xrightarrow a z^{-1}r,
\qquad
r\xrightarrow {a^{-1}} zr,
\qquad
r\xrightarrow q r+1.
\]

The normal form is unique because the upper-left matrix entry determines `k`
and the upper-right entry then determines `p`.

The process is noncommutative:

\[
AQ=
\begin{pmatrix}
z&z\\
0&1
\end{pmatrix},
\qquad
QA=
\begin{pmatrix}
z&1\\
0&1
\end{pmatrix}.
\]

The executable checks all `9,841` words through length eight against both the
matrix normal form and the normalized transition law.

## 4. Frame-return holonomy

The word

\[
a^jqa^{-j}
\]

returns the integer frame to zero but leaves the nontrivial shear

\[
Q_{z^j}.
\]

Applied to the active `x_0` germ, it produces

\[
x_0\mathbin{\mathsf{XOR}}y_j.
\]

This is a basic holonomy-like phenomenon needed here: the coarse frame
returns to its starting value while the transported observable records the
path. It is a loop in the frame projection, not yet a claim about a canonical
differential-geometric connection.

## 5. Minimal future-output quotient

Fix the one-bit output

\[
o(r)=[z^0]r,
\]

the coefficient of degree zero.

### Theorem 2: every Laurent germ is reachable

Every finite-support `r in R` is reachable from zero.

### Proof

For every exponent `j`, the conjugate word `a^j q a^(-j)` toggles exactly the
monomial `z^j` and returns the frame to zero. Concatenating these loops over
the finite support of `r` constructs `r` exactly. `QED`

### Theorem 3: the exact pre-commit minimal residual quotient is `R`

Two normalized germs have identical future outputs if and only if they are
equal. Hence the minimal Moore quotient at the fixed output `o` is exactly

\[
\mathbb F_2[z,z^{-1}].
\]

### Proof

Equal germs clearly have equal futures. If `r` and `s` differ, choose an
exponent `j` with

\[
[z^j]r\ne[z^j]s.
\]

Apply the common shift suffix that moves degree `j` to degree zero. The fixed
output then differs. Thus every two Laurent polynomials are future
distinguishable. `QED`

The interface in this theorem is precisely the active alphabet
`{a,a^-1,q}` with the fixed coefficient-zero output. It does **not** include
`commit`. The quotient `(p,k) -> r=z^(-k)p` forgets the absolute frame: for
example, `(0,0)` and `(0,1)` both normalize to `r=0`, but committing them
exposes `x_0` and `x_1`. A commit-capable state must therefore retain the full
pair `(p,k)`, or equivalently `(r,k)`.

The executable enumerates all `512` polynomials supported in `[-4,4]` and
replays all

\[
\binom{512}{2}=130{,}816
\]

pairwise coefficient-shift certificates.

## 6. Exponential residual growth

For a bit vector

\[
b=(b_0,\ldots,b_{N-1})\in\{0,1\}^N,
\]

consider the scan word

\[
q^{b_0}a^{-1}
q^{b_1}a^{-1}
\cdots
q^{b_{N-1}}a^{-1}.
\]

Its length is at most `2N`, and different bit vectors produce different
Laurent supports. Therefore the residual growth function satisfies

\[
N_{\rm res}(2N)\ge2^N.
\]

This is qualitatively stronger than the old endpoint counter. Fix a simulator
with finite control set `S`, a fixed initial configuration, `d` counters,
per-microstep counter increment bounded by `B`, and a deterministic online
compiler using at most `C` microsteps per source action. Within source radius
`L`, it has at most the following number of configurations, provided **all**
compiler/transducer state is included in the fixed finite set `S` (there is no
hidden history tape):

\[
|S|(2BCL+1)^d
\]

configurations. This is polynomial in `L` for fixed `S,d,B,C`.

### Corollary 4: bounded-counter obstruction

There is no exact constant-action-distortion simulation of the Laurent
future-output process by any fixed number of bounded-increment counters.

The constant-distortion and bounded-increment qualifications are load-bearing.
An unlimited-precision integer with multiplication, a sparse map, or a bit
tape can encode the Laurent support exactly. The executable includes a separate
BigInt tape implementation and checks exact agreement on all `29,524` words
through length nine.

The result is therefore not compression. The `2^N` residuals contain `N` real
bits, and the Laurent germ stores those bits.

## 7. Persistent knowledge by one-germ commits

Separate active transport from persistent knowledge. The active framed
observable represented by the full normal form is

\[
g_{p,k}=x_k\mathbin{\mathsf{XOR}}p(y).
\]

- The **active channel** carries the full pair `(p,k)` through `a`, `a^-1`, and
  `q`. Its normalized projection `r=z^(-k)p` is sufficient only for the
  pre-commit coefficient-output interface.
- A distinct **commit** operation adds at most that one current germ to the
  persistent observable algebra.

This removes the old batch ambiguity: one `q` toggles one coefficient at the
current frame, and one commit adds at most one generator.

To expose a finite cylinder window in one continuous active execution, let
`L_j=a^j q a^(-j)` and use explicit return paths:

1. run `a^j`, commit `x_j`, then run `a^(-j)`;
2. run `L_j`, commit `x_0 XOR y_j`, then run `L_j` again;
3. recover `y_j` inside the Boolean algebra from

\[
y_j=x_0\mathbin{\mathsf{XOR}}
    (x_0\mathbin{\mathsf{XOR}}y_j).
\]

Every finite two-sided cylinder algebra is therefore generated after finitely
many one-germ commits. Their directed union is the locally constant cylinder
algebra and is uniformly dense in

\[
C((\{0,1\}^{\mathbb Z})^2).
\]

Because `L_j^2=1` over `F_2`, both paths return the active state to `(0,0)`
before the next index. The executable maintains one mutable transport state
through the whole window `[-2,2]`, verifies every return, checks that ten
recovered coordinate bits separate all `1,024` assignments, and confirms that
no commit increases the generator ledger by more than one.

This is external representational universality. It does not synthesize an
arbitrary target readout or establish an efficiency advantage.

## 8. Exact OASIS interpretation

The certificate controller supplies a finite mismatch tape

\[
z_0,\ldots,z_{N-1}.
\]

It can be embedded into a Laurent obstruction germ

\[
r_C=\sum_{j=0}^{N-1}z_jz^j.
\]

The support of `r_C` is exactly the set of certificate cells on which expected
and observed finite-emulator behavior disagree. Its normalized size recovers
the relevant defect or collision fraction within each relation, while a later
frame shift retrieves any particular cell through the fixed coefficient
output.

That retrieval is not declared constant-time. In the local action model,
reading coefficient `j` uses `|j|` frame shifts. A random-access sparse-map
baseline can answer it directly and is therefore a different, explicitly
stronger access primitive.

This suggests a causal compiler:

1. exact certificate replay produces a mismatch cell;
2. its frame index selects the loop `a^j q a^(-j)`;
3. the loop toggles that cell in the active germ;
4. a split or glue transaction commits a derived probe/constraint only after
   validation.

The certificate executable now composes the two layers. Its clean fixture
produces the zero germ; its split fixture produces support `{0,...,5}`; and its
glue fixture produces support `{8,...,11}`. Every coefficient is replayed
exactly through the fixed late-bound query. The implementation charges the
full conjugate shift/shear path—`36` actions for the split support and `80` for
the glue support—and does not call the result compressed.

## 9. Architectural interpretation

The old object had a persistent knowledge algebra and a one-counter frontier.
The lifted object has three typed layers:

1. **base context:** which observables have been committed;
2. **transported germ:** the current path-sensitive observable program;
3. **future query:** the coefficient or task that later determines which part
   of the germ matters.

The significant change is not more memory. It is that two histories can have
the same base context and different future semantics. A learner that stores
only the completed algebra has performed a lossy quotient before the later
question exists.

This is a precise version of the “semantic germ whose identity exists only
through its future separations” intuition. The germ is executable at every
finite stage, while its future distinguishability is not bounded by one depth
counter.

The matched tape control keeps the interpretation honest. A conventional
program can store the same finite support and update it exactly. The candidate
architectural value is:

- local compositional transport;
- exact path-sensitive semantics;
- frame-relative reuse; and
- late-bound querying without prematurely selecting a fixed global readout.

It is not a proof of total work, memory, parameter, or sample compression.

## 10. Delayed classification pass: the transport group is lamplighter

The pair multiplication already verified by the executable is

\[
(p,k)(r,\ell)=(p+z^kr,k+\ell).
\]

The additive group of `R=F_2[z,z^-1]` is the direct sum of one copy of `C_2`
at every integer exponent, and `k in Z` acts by shifting exponents. Therefore

\[
R_{\rm add}\rtimes\mathbb Z
\cong
\left(\bigoplus_{j\in\mathbb Z}C_2\right)\rtimes\mathbb Z
=C_2\wr\mathbb Z,
\]

the standard binary **lamplighter group**. This identification is exact, not
an analogy. The lamp configuration is `supp(p)` and the lamplighter position
is `k`.

This core is established prior art. Nekrashevych and Pete explicitly treat
finite-abelian lamplighter groups `F wr Z` as finite-state self-similar groups
in [*Scale-invariant groups*](https://arxiv.org/abs/0811.0220). Skipper and
Steinberg survey and extend automaton realizations of `A wr Z` via affine
transformations of power-series rings in
[*Lamplighter groups, bireversible automata and rational series over finite rings*](https://arxiv.org/abs/1807.00433).
Ahmed and Savchuk give an explicit bireversible affine realization of the
rank-two analogue `(C_2^2) wr Z` in
[*The lamplighter group of rank two generated by a bireversible automaton*](https://arxiv.org/abs/1802.03695).

The group is metabelian, hence amenable, and therefore sofic; the amenable
sofic-representation setting is treated directly by Elek and Szabo in
[*Sofic representations of amenable groups*](https://arxiv.org/abs/1010.3424).
Consequently, the exponential Moore-residual theorem does **not** hint that
this acting group is non-sofic. It shows something more surgical: an
interface can require infinitely many future-distinguishable states even when
the group generating its transports is classical, automaton-realizable, and
sofic. “Moore-nonsofic” and group non-soficity are therefore genuinely
different notions here.

The information-theoretic reading is also a control, not a loophole. After an
`N`-bit lamp pattern is formed and the coordinate query arrives later, the
task contains the one-way `INDEX` problem. The exact deterministic `N`-bit
lower bound is the injectivity proof already given here; bounded-error
one-way INDEX lower bounds are also used to derive memory lower bounds for
associative recall in
[*Zoology: Measuring and Improving Recall in Efficient Language Models*](https://arxiv.org/abs/2312.04927).
Thus late binding preserves optionality, but it does not erase the information
that future coordinate queries may demand.

What remains project-specific is the typed composition:

1. a proof relation becomes an exact XOR mismatch tape;
2. the tape is transported as a framed, path-sensitive active observable;
3. `commit` is distinct from transport and retains the frame erased by the
   coefficient-only quotient; and
4. a validated split/glue transaction determines which persistent distinction
   enters the atlas.

This narrow pass did not establish prior art for that complete compiler, but
absence from a small search is not evidence of novelty. It is now the object
to test, while the lamplighter carrier serves as a known sofic control.

## 11. Claim boundary

The construction does **not** prove:

- nonsoficity of the acting group—the classified transport group is actually
  the sofic binary lamplighter group;
- resistance to arbitrary programs, tapes, sparse maps, or exact integer
  encodings;
- that exponential residual-state count requires exponential memory bits;
- a predictive or learning advantage;
- an efficient arbitrary target decoder;
- a canonical sheaf connection, curvature class, harmonic theory, or Hodge
  decomposition;
- a consequence for `P` versus `NP`, Galois theory, Hodge theory, or the
  algebrization barrier; or
- literature novelty or priority.

“Moore-nonsofic” remains interface-relative: no finite exact Moore machine
preserves all future coefficient outputs. A separate bridge is still required
for any standard group or symbolic-dynamics use of “non-sofic.”

## 12. Next tests

1. **Persistent certificate commit.** Commit the replayed Laurent mismatch
   germ into a typed split/glue curriculum and verify downstream task effects,
   not merely coefficient identity.
2. **Multiple candidate repairs.** Let different obstruction families select
   incomparable shear directions, so the defect genuinely routes an action
   rather than merely deciding whether to apply an idempotent catch-up macro.
3. **Opposite shear.** Add a lower triangular generator and test nested
   nonabelian matrix holonomy, with matched matrix-program controls.
4. **Perturbation.** Replace exact coefficient bits by certified intervals and
   determine which residual distinctions remain robust.
5. **Synthesis-prior-art audit.** Search specifically for the complete typed
   certificate-to-transport-to-commit compiler, while treating the lamplighter
   carrier itself as established prior art.

## Run

```text
node research/laurent-holonomy-genesis.mjs
```

The command verifies endpoint equality with arrow inequality, the Laurent
normal form, all shift/toggle laws, noncommutativity, monomial conjugation,
finite-window reachability, `130,816` residual certificates, exponential scan
growth through `N=12`, one-germ commit accounting, finite cylinder separation,
and exact agreement with the independent matched BigInt tape.
