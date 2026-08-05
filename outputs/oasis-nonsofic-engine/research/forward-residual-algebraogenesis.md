# Forward residual algebraogenesis: topology, not reversal or compression

## Status

This note records a substantial correction to the OASIS research direction, a
new executable benchmark, two proved constructions, and the tightened
prior-art boundary from an independent Bright Data search.

The main conclusion is:

> Reversibility is not required. Compression is not the primitive obstruction.
> The primitive is **continuation distinguishability**: whether a finite
> observable quotient supports the same forward transports as the complete
> semantic object.

The proposed mathematical class is called a **Forward Algebraogenetic Residual
System** (`FARS`) here. This is project terminology, not an established name or
a claim of priority.

## 1. The category error we were making

The previous transport theorem began with a group action. A group is built from
automorphisms, so reversible finite transports were natural. There are two
reasons not to make reversibility an architectural axiom.

First, it is unnecessary even if the semantics remains group-like.
[Ceccherini-Silberstein and Coornaert](https://arxiv.org/abs/1304.4919)
prove that a group is sofic as a group exactly when it is sofic as a monoid.
The finite monoid approximants may be arbitrary functions. Approximate inverse
relations force those functions close to permutations once the controlled
finite set has been enlarged to contain the relevant inverses. Reversibility
emerges from the semantic relations rather than being assumed by the model.
This also warns that ordinary monoid soficity is too weak to classify most
genuinely one-sided processes: the same paper shows that adjoining an identity
to any semigroup produces a sofic monoid.

Second, genuinely forward semantics belongs to a different mathematical
category. Let `A` be an input alphabet and let a bounded observable process be

\[
f:A^*\longrightarrow K.
\]

After history `u`, define its residual future

\[
r_u(v)=f(uv).
\]

The update after symbol `a` is the left derivative

\[
(D_a r)(v)=r(av),
\qquad D_a r_u=r_{ua}.
\]

The state is not the retained **history** address `u`. It is the complete
continuation behavior `r_u`. Nothing asks for `u`, an inverse of `a`, or
backward traversal. The coordinates are still indexed by future probes `v`, so
the construction exchanges past addressing for continuation addressing; it
does not abolish coordinates.

For a language `L`, take `f=chi_L`. The compact residual space is

\[
S_L=\overline{\{r_u:u\in A^*\}}
\subseteq\{0,1\}^{A^*}.
\]

[Steinberg](https://arxiv.org/abs/1306.1468) proves that this orbit closure is
the canonical minimal compact automaton: every trim compact automaton for `L`
maps continuously onto it. Its completed transition monoid is compact and left
semitopological. A crucial rigidity result in the same paper says that
recognition by a compact **jointly continuous** topological monoid through a
clopen decision set would force `L` to be regular. Thus a nonregular residual
process has continuous local derivatives while its canonical completed
syntactic multiplication cannot be jointly continuous under such recognition.
For an effectively presented example, including the controls below, those local
derivatives can additionally be computable; Steinberg's theorem supplies the
topology, not that computability claim.

That is much closer to the conjectured “transcendental algebra” than a
transcendental coefficient. The unusual property lies in the completion of the
transport algebra.

## 2. Observable algebraogenesis

From here, take `K` to be a compact subset of the real or complex numbers (or
resolve a compact vector output into scalar coordinates), so that probe
functions can be added and multiplied.

For every continuation `v`, define the coordinate observable

\[
e_v(r)=r(v).
\]

A finite probe set `P` produces a materialized chart

\[
\pi_P(r)=(e_v(r))_{v\in P}.
\]

Two residuals are presently identified when they agree on `P`. This quotient
supports a well-defined forward transition by `a` precisely when

\[
r|_P=s|_P
\quad\Longrightarrow\quad
D_a r|_P=D_a s|_P.
\]

Because `D_a r(v)=r(av)`, every failure carries its own executable certificate:

\[
r|_P=s|_P,
\qquad
r(av)\ne s(av)
\]

for some `v in P`. The repair is to adjoin the transported observable `av`.
This is not a failure to compress the past. It is a proof that the current
observable topology does not make forward transport well-defined.

This refinement pattern has important prior art. In abstract interpretation,
the same commutation requirement is called **backward completeness** (despite
`D_a` being a forward-time update), and complete-shell constructions compute
minimal refinements that restore completeness. See
[Giacobazzi, Ranzato, and Scozzari](https://doi.org/10.1145/333979.333989) and
[Ranzato and Tapparo](https://arxiv.org/abs/cs/0401016). Counterexample-guided
abstraction refinement likewise splits an abstraction using a failed finite
proof obligation; see
[Giacobazzi and Quintarelli](https://doi.org/10.1007/3-540-47764-0_20) and the
original [CEGAR paper](https://doi.org/10.1007/10722167_15). Thus neither the
commuting quotient condition nor certificate-driven splitting is new by
itself. The research question is what changes when this refinement is coupled
to a deliberately nonstabilizing residual process, a generated observable
algebra, and task-local learned readouts.

The exact bridge is a finite-observable form of Myhill-Nerode:

> **Finite derivative-stability theorem.** A language `L` is regular if and
> only if there is a finite probe set `P` containing `epsilon` such that
> agreement on `P` is preserved by every derivative `D_a` on all reachable
> residuals.

For the reverse direction, the signatures in `{0,1}^P` are the states of a
finite deterministic automaton; derivative stability makes its transitions
well-defined and the `epsilon` coordinate supplies acceptance. For the forward
direction, choose finitely many continuations separating the finitely many
Myhill-Nerode residuals. Consequently, every finite `P` containing `epsilon`
for a nonregular language has a finite transport-defect witness. Adding `av`
repairs that particular witness, but may reveal another one; global
stabilization is exactly what nonregularity forbids.

Let `P_0 subseteq P_1 subseteq ...` be nested finite probe sets and define the
compact chart image

\[
X_n=\pi_{P_n}(S_L).
\]

Forgetting the newly added coordinates gives bonding maps

\[
X_{n+1}\longrightarrow X_n.
\]

A coarse point can split into a fiber when a new observable is added. The full
semantic state is the compatible inverse-limit family of these finite views
**provided that** `union_n P_n` separates the points of `S_L`. Under that
condition, compactness gives

\[
S_L\cong\varprojlim X_n.
\]

A transport-only probe policy is not automatically separating for arbitrary
external tasks; without that condition the limit is only a quotient of `S_L`.

Equivalently, define the closed unital observable algebra

\[
\mathcal B_n=\{h\circ\pi_{P_n}:h\in C(X_n)\}\subseteq C(S_L).
\]

Then `B_n subseteq B_(n+1)`, and a separating probe union makes the uniform
closure of their union equal to `C(S_L)`. This chart-image formulation avoids
treating the spectrum of an unclosed real polynomial algebra as if it were
automatically the semantic space.

In the current formalization, the full product topology is fixed in advance
and progressively revealed by the materialized charts. “Algebraogenesis” is
therefore endogenous growth of the observer's available algebra, not yet a
literal mutation of the ambient semantic topology. Making the carrier or its
observable category itself evolve is a stronger open formalism.

The algebra generated by all coordinate probes contains constants and separates
points of `S_L`. Stone-Weierstrass therefore gives

\[
\overline{\operatorname{alg}\{e_v:v\in A^*\}}=C(S_L).
\]

Consequently, every continuous external task on `S_L` is uniformly
approximable by a finite expression in finitely many continuation probes, even
when no finite follower-state presentation captures the internal process.
This is a generic Stone-Weierstrass consequence for a separating compact
observable family, not by itself a novelty claim.

Adding Koopman pullbacks

\[
U_a h=h\circ D_a
\]

to multiplication observables `M_h` produces a generally noncommutative
operator algebra with covariance relation

\[
U_aM_h=M_{h\circ D_a}U_a.
\]

Thus a commutative residual geometry naturally generates a noncommutative
forward process algebra without introducing inverse transports.

## 3. An explicit real-map control: the nonsofic beta shift

Let `beta` be the positive real root of

\[
x^4-x-1=0,
\qquad
\beta\approx1.2207440846057596,
\]

and define the forward, noninvertible beta transformation

\[
T_\beta(x)=\beta x-\lfloor\beta x\rfloor.
\]

It is immediately noninjective:

\[
T_\beta(0)=T_\beta(1/\beta)=0.
\]

The interval map is piecewise continuous, not globally continuous at all digit
boundaries. Its induced one-sided symbolic shift is continuous. These two
statements must not be conflated.

[Akiyama](https://arxiv.org/abs/1401.6329) proves that the root of
`x^n-x-1` is non-Parry for every `n>=4`; equivalently, its beta shift is
nonsofic. Its reference expansion begins

```text
100000001000000000000100000000100000000001000000000000000001...
```

The coefficient is algebraic. Its fixed critical orbit, its piecewise branches,
and the associated symbolic language can be handled exactly. The
non-finitarity is in the continuation language, not in an exotic scalar.
[Simonsen](https://doi.org/10.1007/s00224-009-9245-z) proves that a beta-shift
language is recursive exactly when beta is computable. The result has an
important nonuniformity caveat: there is no general constructive compiler from
an arbitrary program approximating beta to a language decider. Our fixed
algebraic beta instead permits direct certified sign tests using
`beta^4=beta+1` and a rational isolating interval.

There is a second computability caveat. A discontinuous total real map is not
computable under the ordinary Cauchy representation at its discontinuity
points (see this [computable-analysis survey](https://arxiv.org/abs/cs/0607114)).
Thus `T_beta` is not a uniformly computable real-state transition on the entire
interval. The executable claim here concerns the fixed algebraic critical
orbit, finite-word admissibility, and the continuous one-sided symbolic
shift—not uniform evaluation at every real boundary.

### What this control proves—and falsifies

It proves that a forward, noninvertible one-real-coordinate dynamical
presentation, with an exactly computable critical orbit and symbolic language,
can induce a nonsofic symbolic future. This validates a carefully delimited
“real map bypass”: the native real presentation need not construct or store the
infinite follower automaton it generates.

It also falsifies a stronger claim. Nonsoficity by itself does **not** imply
large topological dimension, large Shannon rate, or growing memory. An exact
real state can bypass a finite symbolic obstruction. Any lower bound for
arbitrary nonlinear latents needs a separate robustness or topology premise.

## 4. The robust continuous construction

The beta shift supplies literal symbolic nonsoficity, but not a
finite-dimensional topological obstruction. A second construction supplies
the missing geometry.

For every `m>=1`, let

\[
D_m=\left\{\frac{j}{2^m}:0\le j\le2^m\right\}.
\]

Let `B_m` concatenate, in lexicographic order, every word in `D_m^m`, and let

\[
q=B_1B_2B_3\cdots.
\]

Every `q_n` is a computable rational. Define the unary observable process

\[
f_q(a^n)=q_n
\]

and its residual tail

\[
r_n(j)=q_{n+j}.
\]

### Theorem: the residual completion is the Hilbert cube

\[
\overline{\{r_n:n\ge0\}}=[0,1]^{\mathbb N}.
\]

**Proof.** A basic neighborhood of any `x in [0,1]^N` constrains finitely many
coordinates to positive accuracy. Choose `m` larger than the greatest
constrained coordinate index and fine enough that `2^-m` is inside the
requested tolerance. Round the constrained coordinates to `D_m`, fill the
remaining positions arbitrarily to obtain an `m`-word, and use its occurrence
in `B_m`. The tail beginning there lies in the neighborhood.

This is a benchmark construction, not a claim of new mathematics.
[Steinberg's Example 2.7](https://arxiv.org/abs/1306.1468) already concatenates
all finite binary words to obtain a computable point with full-shift orbit
closure. The dyadic-grid extension supplies a Hilbert-cube control, and the
planted words below make its linear obstructions especially easy to execute.

The completed update is the one-sided shift

\[
S(x_0,x_1,x_2,\ldots)=(x_1,x_2,\ldots),
\]

which is continuous, surjective, and noninjective. Its observable pullback is a
proper algebra endomorphism

\[
S^*e_j=e_{j+1}.
\]

### Exact obstruction certificates of every order

At stage `m=2k-1`, one listed word is

\[
0^{k-1}1\,0^{k-1}.
\]

Let `N_k` be its computable starting position. The Hankel block

\[
M^{(k)}_{ij}
=f_q(a^{N_k+i+j})
=q_{N_k+i+j},
\qquad0\le i,j<k,
\]

is the anti-identity matrix. Therefore

\[
\det M^{(k)}=(-1)^{k(k-1)/2}\ne0.
\]

Every fixed time-homogeneous `d`-dimensional linear realization is defeated by
the explicit `(d+1)`-minor. This includes weighted-automaton and linear
predictive-state realizations. It does not cover time-varying parameters,
external memory, or nonlinear exact-real machines; affine systems require the
usual homogeneous-coordinate adjustment. The certificate is finite and
exactly verifiable.

### Nonlinear finite-dimensional obstruction

Suppose one continuous exact encoder `E:[0,1]^N -> R^d`, chosen before the
downstream task, admits a continuous readout `g_j` for every continuation
coordinate, so each `e_j` factors through `E`. Those shared-state readouts make `E`
injective. Since the domain is compact and `R^d` is Hausdorff, `E` would be a
topological embedding. This is impossible: the Hilbert cube contains
`[0,1]^(d+1)`, while covering dimension is monotone under embeddings and
`dim R^d=d`.

Thus the completed residual object has no faithful finite-dimensional
continuous carrier. This is a topology theorem, not a bit-counting or
compression theorem.

The shared encoder and order of quantifiers are load-bearing:

\[
\nexists E:H\to\mathbb R^d\quad
\text{such that}\quad
\forall j\ \exists g_j,\ e_j=g_j\circ E.
\]

It does not rule out a task-specific finite representation chosen after a
single `F` is known; for that static task, `F(x)` itself is a scalar
representation. Architecturally, the state must support tasks or adversarial
future probes that arrive after encoding.

The closure requirement is load-bearing. The reachable orbit is countable and
could be encoded pathologically in one exact real. Continuity and validity on
the semantic completion are what turn nearby finite observations into nearby
states and close that loophole.

### A quantitative distinguishability-flux bound

Fix `0<epsilon<1/8`, and hold finite `R`, `G`, and `L` fixed. Let the same
autonomous bounded latent system for every horizon have Euclidean state
`K subset [-R,R]^d`, globally `L`-Lipschitz update `T:K -> K`, and globally
`G`-Lipschitz scalar readout `g`. Its horizon-`n` output is

\[
\Phi_n(z)=(g(z),g(Tz),\ldots,g(T^{n-1}z)).
\]

If `Phi_n(K)` is `epsilon`-dense in `[0,1]^n` for every `n`, a separated-grid
packing argument gives

\[
d\log\max(1,L)
\;\ge\;
\log\left\lfloor\frac1{4\varepsilon}\right\rfloor
\]

up to the immaterial choice of grid endpoints. Indeed, the target cube has
exponentially many `4 epsilon`-separated words, while pulling a required
separation back through `n` Lipschitz updates permits only
`O((C L^n/epsilon)^d)` distinguishable initial latent states. Divide logarithms
by `n` and pass to the limit.

For arbitrarily fine external accuracy, latent dimension or update expansion
must grow, or the bounded autonomous Lipschitz shared-state assumptions must
fail. This finite-scale theorem is
analogous to mean-dimension and rate-distortion-dimension bounds; it is not an
instance of rate-distortion theory until an invariant measure and distortion
functional are specified.
[Lindenstrauss and Tsukamoto](https://arxiv.org/abs/1702.05722) connect rate
distortion to metric mean dimension, which measures continuous parameters per
unit time rather than stored past bits.

## 5. Externally universal, internally open-ended

For the Hilbert cube `H=[0,1]^N`, let

\[
\mathcal P_{\mathrm{cyl}}
=\mathbb R[e_0,e_1,e_2,\ldots]
\]

be the algebra of polynomials in finitely many coordinate probes. It is dense
in `C(H)`. Therefore

\[
\forall F\in C(H),\ \forall\varepsilon>0,\quad
\exists p\in\mathcal P_{\mathrm{cyl}}:
\|F-p\|_\infty<\varepsilon.
\]

The complete carrier is not approximated by one finite state. It is the object
whose finite cylinder algebra approximates every requested continuous readout.
This is the precise quantifier reversal we were seeking:

\[
\text{do not approximate the approximator; approximate tasks through it.}
\]

For example,

\[
F(x)=\sum_{j=0}^\infty2^{-(j+1)}x_j
\]

has an `n`-coordinate truncation with uniform error at most `2^-n`.

The beta residual and Hilbert residual expose independent axes:

| Axis | beta-4 shift | dyadic universal residual |
|---|---|---|
| forward/noninvertible | yes | yes |
| computable local continuation | yes | yes |
| standard finite-alphabet nonsoficity | yes | not the relevant notion |
| unbounded exact Hankel certificates | yes | explicit at every order |
| no finite-dimensional continuous completion | no | yes |
| cylinder-observable universality | yes | yes |

For the Boolean language Hankel matrix, bounded rank `k` over `F_2` would allow
at most `2^k` distinct rows. Nonregularity gives infinitely many distinct
Myhill-Nerode residual rows, so the beta language has unbounded `F_2` Hankel
rank. The executable depth-ten minors are finite lower-bound witnesses; this
short argument supplies the bridge from Akiyama's nonsoficity theorem to
unbounded rank.

A product or skew-product gives a nonempty class satisfying both the symbolic
and topological axes, but that composition is a benchmark envelope, not yet the
most natural final object. Finding a single endogenously coupled example is an
open design target.

## 6. The one-sided-inverse obstruction already hiding inside the Leavitt engine

The implementation already contains a one-sided algebraic obstruction. Its
Leavitt creators and readers satisfy

\[
t_i s_j=\delta_{ij}1,
\qquad
s_0t_0+s_1t_1=1.
\]

They are not group units in the native infinite representation. They describe
two split injections and their retractions, with complementary ranges. The
readers `t_i` are load-bearing: the creator-only monoid is free and does not
carry the obstruction.

No nonzero finite-dimensional square matrices over any field can satisfy these
relations. If `T_i S_i=I`, then finite-dimensional `S_i` is invertible and
`T_i=S_i^-1`, so `S_iT_i=I` for each `i`. The second relation would then say
`2I=I`, a contradiction in every characteristic. This is the classical
direct-infiniteness or module-type obstruction of the Leavitt algebra
`L_K(1,2)`. It is not a creator-only proof: finite dimensionality turns each
one-sided inverse into a two-sided inverse, so reversibility emerges inside the
failed approximant.

An approximate statement needs a declared metric. Over complex matrices with
normalized trace `tau_n` and operator norm, suppose

\[
\|T_iS_i-I\|\le\varepsilon\quad(i=0,1),
\qquad
\|S_0T_0+S_1T_1-I\|\le\varepsilon.
\]

Cyclicity of `tau_n` and `|tau_n(X)|<=||X||` give

\[
1=|2-1|\le 3\varepsilon.
\]

Hence every matrix size has defect at least `1/3` in that metric. An analogous
normalized-rank argument works over the implemented finite field, using
`rank(I-AB)=rank(I-BA)` and subadditivity. These quantitative certificates are
metric-specific; the exact nonrepresentation alone would not imply them.

After changing the base field to the complex numbers, imposing `t_i=s_i*`, and
taking the universal C-star completion, the corresponding analytic object is
the Cuntz algebra `O_2`. The
[Kirchberg-Phillips embedding theorem](https://arxiv.org/abs/funct-an/9712002)
also shows that the Cuntz algebra `O_2` contains every separable exact C-star
algebra. This is an established and striking universality by algebra embedding,
not a universal-approximation or task-universality theorem.

This does not make the architecture novel or prove a coupling to residual
algebraogenesis. It identifies a separate one-sided-inverse axis that was hidden
when the implementation restricted attention to the Leavitt unit group. A
future implementation should test the creator-reader relations, residual
endomorphisms, and their observable algebras directly, with the approximation
metric stated as part of every obstruction.

## 7. Bayesian views belong above the algebra

Probability is not removed; it is repositioned.

A commutative probabilistic state at stage `n` is a probability measure on
`X_n`, equivalently a positive normalized functional on `C(X_n)`. For a
noncommutative extension, first specify nested unital C-star algebras or
operator systems `C_n`; then a state is a complex-valued positive normalized
linear functional

\[
\omega_n:\mathcal C_n\to\mathbb C
\]

compatible under restriction. The family `(omega_n)` is a projectively
compatible view of one state on the growing observable algebra. New probes do
not merely update probabilities on a fixed sample space. They refine the
algebra on which a probability can be stated.

Information theory can handle filtrations and adaptive experiments, so the
claim is not that mutual information requires one permanently fixed
sigma-algebra. The narrower point is that a single mutual-information scalar is
relative to selected random variables and does not characterize
decision-universal informativeness. Blackwell comparison is stronger: one
finite experiment refines another when the coarser one is a garbling of the
finer one. But even Blackwell order is stated after the available experiments
and continuation geometry have been specified.

The conceptual order is therefore

\[
\text{residual continuation}
\rightarrow
\text{observable algebra}
\rightarrow
\text{spectrum/topology}
\rightarrow
\text{optional probability state}
\rightarrow
\text{finite task readout}.
\]

## 8. Candidate architecture

Call the architectural synthesis **Obstruction-Guided Forward Residual
Algebraogenesis** (`OGFRA`).

1. The native carrier answers or estimates continuation functionals.
2. The material state is a finite observable algebra, not a fixed latent
   address.
3. Input acts through forward derivatives or Koopman endomorphisms.
4. A finite readout learns the current task from the current chart.
5. A transport critic finds merged states whose induced forward updates differ.
6. A Hankel or transport certificate supplies a new observable.
7. The observable algebra and its spectrum refine; the native carrier is not
   rewritten.
8. Bayesian weights, if used, update on the refined algebra.

For linear critics, a nonzero Schur complement or Hankel minor is the probe
certificate. For Boolean residuals, a distinguishing continuation is the
certificate. For continuous residuals, a finite-scale separation witness is
the certificate. For the Leavitt layer, a quantified relation defect in a
declared operator or rank metric is a residual certificate, but a canonical
compiler from that defect to a useful new observable has not yet been proved.

## 9. Executable results

Run:

```text
python research/forward_residual_algebraogenesis.py
```

The script uses exact rational and algebraic sign arithmetic; it has no network
or floating-point dependency in its proof-bearing calculations.

### Beta-4 versus a sofic control

The finite Boolean Hankel rank over `F_2` at depths 1 through 10 was

```text
beta-4:      2, 2, 2, 2, 4, 6, 8, 8, 10, 10
golden mean: 2, 2, 2, 2, 2, 2, 2, 2,  2,  2
```

A full-rank minor modulo two has odd integer determinant, so every reported rank
is an exact lower bound on rational and real rank.

On beta prefix histories through depth 18, continuation probes through depth 12
exposed 14 finite-horizon residual classes. The obstruction controller needed
14 probes. The golden-mean control exposed two classes and needed two probes.

The sampled one-step congruence controller, on all binary histories through
depth eight and including the rejecting residual, repaired seven beta transport
defects and generated the exact chain

```text
1, 01, 001, 0001, 00001, 000001, 0000001
```

to obtain nine sampled signature classes, one of which is the rejecting class.
Every immediate target signature had a sampled representative. The golden-mean
control needed one repair and had three classes including rejection. This is a
bounded one-step consistency test, not a globally transition-closed finite
quotient; increasing the history horizon can expose further beta classes.

These finite numbers do not prove Akiyama's theorem; the published theorem
supplies nonsoficity. The experiment verifies the proposed certificate-to-probe
mechanism and a matched sofic control.

### Hilbert residual

- A four-coordinate rational target was compiled to a dyadic word at a
  computable 20-digit offset with maximum error `3/1600`, below the certified
  `1/512` nearest-grid bound.
- A sparse cylinder constraining coordinates 2 and 11 compiled at stage 12 to a
  computable 38-digit offset, with error `3/25600` below `1/8192`. This directly
  tests the maximum-coordinate-index condition in the density proof.
- Exact anti-identity Hankel minors of orders one through eight were generated
  and verified. Their determinants matched `(-1)^(k(k-1)/2)`.
- The order-eight witness begins at a computable 61-digit offset. This is also a
  warning: existence and universality do not imply efficient navigation.
- The explicit cylinder functional above has certified truncation errors
  `1/4`, `1/16`, `1/256`, and `1/65536` at 2, 4, 8, and 16 coordinates.

## 10. Prior-art correction from the independent search

The independent Bright Data pass found six important collisions.

1. [Angluin's `L*`](https://doi.org/10.1016/0890-5401(87)90052-6) already
   learns residual rows with membership/equivalence queries and grows an
   observation table from counterexamples. Our elementary Boolean split rule
   is not novel.
2. Predictive-state-representation work explicitly treats state as predictions
   of future tests and includes
   [online discovery of core tests](https://webdocs.cs.ualberta.ca/~bowling/papers/05nips.pdf).
   Residual state and Hankel basis discovery are not novel.
3. Causal-state reconstruction and
   [fractal predictive-state geometry](https://arxiv.org/abs/2102.10487) already
   show that finite hidden generators may induce infinite or uncountable
   predictive presentations.
4. [EDMD with dictionary learning](https://arxiv.org/abs/1707.00225) and related
   Koopman methods already learn observable dictionaries for nonlinear
   dynamics. Growing a lifted observable basis is not novel.
5. Abstract-interpretation complete shells, strong-preservation refinement,
   and CEGAR already connect failed quotient semantics to counterexample-driven
   refinement. The transported-probe closure rule is not novel in isolation.
6. [Matsumoto's lambda-graph systems](https://doi.org/10.4171/DM/62) are an even
   closer mathematical neighbor: levelled labeled Bratteli diagrams present
   arbitrary nonsofic subshifts. Matsumoto also couples nonsofic subshifts to
   creation operators and purely infinite C-star algebras
   ([explicit example](https://arxiv.org/abs/0805.2767)). Nonstabilizing
   finite-level presentations and this symbolic/operator-algebraic coupling are
   substantial prior art.

The targeted search did not surface one construction combining all of the
following:

- intentional nontermination on a theorem-backed nonsofic or
  infinite-dimensional target;
- obstruction certificates and task loss that jointly select observables, with
  a proved nonstabilization or efficiency law;
- compatible observable algebras and inverse-limit state geometry;
- a robust topological or distinguishability-flux lower bound against nonlinear
  finite latents;
- task-local universal readouts; and
- an end-to-end trainable architecture.

That conjunction is the remaining **integration hypothesis**, not yet evidence
of a new mathematical field. A defensible novelty result now requires a new
non-product coupling plus a theorem or empirical advantage caused by
obstruction-driven growth. This is not an exhaustive priority or patentability
conclusion.

## 11. What is established, derived, and open

### Established mathematics used

- residual/Myhill-Nerode state and active automata learning;
- PSR and Hankel realization theory;
- nonsofic beta shifts;
- compact residual automata and left-semitopological syntactic monoids;
- lambda-graph systems;
- Stone-Weierstrass density;
- Koopman observable dynamics;
- Hilbert-cube infinite covering dimension; and
- mean-dimension/rate-distortion theory.

### Proved in this note's construction

- the computable dyadic sequence has Hilbert-cube residual completion;
- it contains the stated anti-identity Hankel minor at every order;
- its cylinder-polynomial algebra is externally universal on compact tasks;
- its completion has no faithful finite-dimensional continuous carrier;
- the stated Lipschitz dimension/update-expansion bound under its fixed
  autonomous shared-state assumptions; and
- the finite transport-defect rule always supplies a transported new probe.

### Tested

- certified beta-4 digit generation;
- exact finite follower and Hankel growth against a sofic control;
- obstruction-guided residual splitting;
- sampled one-step transport-congruence refinement with an explicit rejecting
  residual;
- dense-block and sparse-cylinder compilation; and
- exact Hankel minors through order eight.

### Open

1. Replace the product-envelope construction by a natural coupled system with
   both finite-alphabet nonsoficity and positive distinguishability dimension.
2. Prove an efficient probe-discovery theorem. The universal sequence's huge
   offsets show that a computable witness may be practically inaccessible.
3. Extend the nonlinear lower bound from a scalar autonomous latent to
   controlled, stochastic, attention, and external-memory architectures under
   matched resource assumptions.
4. Define and estimate residual separation growth

   \[
   G(n,m,\varepsilon)=
   \log N_\varepsilon
   \left(\{r_u:|u|\le n\},
   d_m\right),
   \qquad
   d_m(r,s)=\max_{|v|\le m}|r(v)-s(v)|.
   \]

   This is a candidate information quantity beyond Shannon compression: the
   finite-scale geometry of distinguishable futures.
5. Rework the existing Leavitt architecture around creator-reader relations and
   endomorphisms, rather than only the nonsofic unit group, and solve the open
   compiler step from a relation defect to a task-relevant observable.
6. Run a four-way ablation: finite rational process, Thue-Morse infinite-rank
   low-dimensional process, beta nonsofic process, and Hilbert residual process.
   This separates symbolic nonsoficity, linear rank, topology, and numerical
   instability.

The deepest surviving idea is not that the learner stores an unbounded past.
It is that the learner grows the algebra in which different futures become
expressible, while the native forward process remains one unchanged semantic
object.
