# Frontier literature audit: arithmetic dynamics, spectral number theory, observable growth, and adaptive AI

## Status

**Live literature sweep completed 2026-08-10.** This is a collision audit and
research-direction memo, not a novelty, priority, or open-problem claim.

Thirty-three intent-ranked Bright Data Discover jobs returned `504` raw
results. After removing empty, short, blocked, and obvious error pages and
deduplicating normalized URLs, `361` content-bearing pages remained. Twelve
frontier queries were date-bounded to 2023-01-01 through 2026-08-10; exact-title
and foundational queries were then run without a date bound so that current
claims could be interpreted against the actual theorems they extend. Primary
papers, author manuscripts, proceedings, and official project pages were
preferred. Discover relevance scores are retrieval scores, not evidence of
correctness or importance.

## Executive conclusion

The literature supports a sharper pivot than “grow a state” or “grow a memory”:

> **Keep the semantic carrier fixed and let certified failures generate new
> observables on it. The topology, quotient, and effective state then change
> because the observable algebra changes.**

This is close to several established families, but no retained source supplies
their conjunction:

1. path signatures already give deterministic, exact composition of path
   features and universal approximation of path functionals;
2. Koopman theory already linearizes nonlinear dynamics on an
   infinite-dimensional algebra of observables, with learned dictionaries as
   finite approximations;
3. Myhill--Nerode, Hankel-rank, weighted-automaton, observable-operator, and
   predictive-state constructions already turn future tests into minimal state
   and provide an exact finite-versus-infinite representation boundary;
4. intensional probabilistic-program semantics already retain execution paths
   from which the ordinary probability distribution can be recovered; and
5. the 2026 non-sofic construction gives a genuine global obstruction to
   finite approximate multiplication, while recent work develops sofic actions
   and quantitative approximation profiles [1][2][3].

The surviving candidate is therefore not “infinite memory,” “universal
approximation,” “path dependence,” “adaptive features,” or “non-soficity” by
itself. It is an **obstruction-generated observable algebra** whose attachments
are natural under semantic equivalence, whose path transport is exact, whose
union is externally universal, and whose induced global transport retains a
proved non-sofic obstruction after the observational quotient.

This also resolves the probability question more cleanly. Probability can be a
state (a positive normalized functional) on the observables that currently
exist. Optimization can fit external readouts or choose among certified
representers. Neither needs to be the carrier. The carrier is the evolving
diagram of observable algebras and attachment maps. Probability and
optimization are downstream unless one proves that they themselves force the
next observable by a semantic universal property.

## 1. The concrete pivot

Let `X` be a fixed semantic carrier: histories, programs, lift objects, paths,
or points of a completed space. At stage `n`, let

\[
\mathcal A_n\subseteq \operatorname{Fun}(X)
\]

be the finite or bounded-cost algebra of currently callable observables. It
induces an observational quotient

\[
x\sim_n y
\quad\Longleftrightarrow\quad
a(x)=a(y)\ \text{for every }a\in\mathcal A_n.
\]

The underlying `X` need not change. A certified obstruction `c_n` to prediction,
transport, gluing, multiplicativity, or future separation should determine an
observable module `M(c_n)` and an attachment

\[
\mathcal A_{n+1}
=\operatorname{Alg}^{*}\!\left(
\mathcal A_n, M(c_n), G\cdot M(c_n)
\right).
\]

The attachment is genuine genesis only if all of the following are proved:

- `M(c_n)` is determined by the semantic obstruction, not by a stage counter,
  arbitrary feature search, or a pre-enumerated universal dictionary;
- it vanishes or adds nothing when the obstruction vanishes;
- it is natural under the declared chart, gauge, and history equivalences;
- at least one pair previously equivalent under `~_n` is separated under
  `~_{n+1}`;
- the added observables transport compositionally under the exact process
  action; and
- the cost includes addresses, certificates, algebraic relations, and the
  external program needed to evaluate the observable.

The completion

\[
\overline{\bigcup_n\mathcal A_n}
\]

is then a fossil of the process. In general it does not remember which
obstruction caused which generator to become callable. The attachment diagram,
not only its completed algebra, is the candidate foundational object.

### 1.1 Lift-fiber monodromy as an observable source

The current eight-state project theorem already contains a strictly finite
laboratory for this pivot. In
[`genesis-nullification-fiber-holonomy.md`](genesis-nullification-fiber-holonomy.md),
the lift fiber has

\[
\pi_0\cong\mathbf F_2^3
\]

and concrete loops translate components along the rank-one line
`L = <uv>`. Rather than adding a ninth “state,” one can let the holonomy act on
functions on the existing fiber. If `T_L` is translation by the nonzero element
of `L`, then

\[
P_-={1\over2}(I-T_L)
\]

is the canonical anti-invariant projector. Its image consists precisely of
observables that detect distinctions erased by quotienting the loop as gauge.
Equivalently, one may use matrix coefficients of the monodromy representation
on `ell^2(pi_0)`.

This is a real observable-growth mechanism, but not yet genesis:

- the current group is finite `D_8`, hence sofic;
- the coefficient-policy class is declared rather than derived;
- the split control retains the same rank-one transport when that policy is
  manually held fixed; and
- choosing a particular test vector inside the anti-invariant module is still
  extra structure.

The local target is therefore a representer theorem: the native obstruction
must select the observable **module and its semantic test**, not merely reveal
that a nontrivial representation exists.

### 1.2 External universality and internal non-soficity can coexist

There is no logical contradiction between the two properties.

- **External universality** can mean that `union A_n` separates semantic points
  and is dense in a target function algebra, or that external neural readouts
  approximate every continuous observable on compact parts of the current
  spectrum.
- **Internal non-soficity** can mean that the exact transport action on `X` or
  on the completed observable algebra has no finite approximate multiplication
  model for some finite `(F_0, epsilon_0)` obstruction [1]. Turning the proof
  into a numerical, executable pair is a separate certificate-extraction task.

The danger is quotient collapse. A small family of matrix coefficients may see
only a sofic quotient of a non-sofic action. Non-soficity does not imply that
every scalar orbit series has infinite Hankel rank, that every finite task is
hard, or that adaptive feature growth is advantageous. Recent action-soficity
and approximation-profile work reinforces this separation between an action,
its chosen observables, and the quantitative size of its approximants [2][3].

The missing bridge must prove that the obstruction-born observables jointly
retain the non-sofic action after future equivalence, rather than merely living
beside a non-sofic group name.

### 1.3 Test-indexed semantics: a restricted nerve that grows

The observable pivot has an equivalent and potentially cleaner categorical
form. Let `Q_n` be the finite category of tests currently callable, including
their typing, composition, and transport maps. A fixed semantic object `x` is
seen only through its evaluation functor

\[
N_n(x):\mathcal Q_n\longrightarrow\mathcal V,
\qquad
q\longmapsto \operatorname{eval}(q,x),
\]

where `V` is the declared value category. This is a **restricted Yoneda-like
nerve**: identity is not asserted absolutely, but relative to the available
tests. Two objects are currently indistinguishable when their restricted nerves
agree. Genesis adjoins a represented test `q_c` and the morphisms required to
transport it, so the semantic object remains fixed while its restricted nerve
becomes finer.

This makes the “desired future distinction” exact. Given a continuation `u`
and two present germs `x,y` that `Q_n` identifies but whose `u`-continuations
must differ, the obstruction is the failure of the present test category to
represent that future distinction. The attachment theorem should construct the
smallest natural extension

\[
\mathcal Q_n\hookrightarrow\mathcal Q_{n+1}
\]

through which the future evaluation descends. “Smallest” must be a universal
property, not merely minimum loss over a hidden candidate library.

The monodromy/matrix-coefficient version is also **Tannakian-like**: transport
is approached through tensor-compatible coefficient probes, and one hopes to
reconstruct the retained action from them. This is only an analogy until the
project supplies an actual monoidal probe category, a fiber functor, and a
reconstruction theorem. Peter--Weyl provides the compact-group precedent for
coefficient density [37]; it does not give reconstruction for the present
non-sofic groupoid automatically.

This interpretation sharpens the prior-art boundary:

| family | what its tests do | what is fixed in advance |
|---|---|---|
| path signatures | expose tensor-word/iterated-integral coordinates and compose them exactly | coordinate alphabet and full tensor grammar [16][17][18] |
| Koopman/EDMD | acquire observables whose span better approximates an invariant function space | state space, Koopman function space, and dictionary model class [19][20][21] |
| Myhill--Nerode/Hankel/PSR | add suffixes, prefixes, or future tests until residuals are separated | alphabet and all finite test strings [11][12][13][14][15] |
| active feature/query learning | optimize which available question to ask | hypothesis class, feature generator, and acquisition objective |
| Bayesian nonparametrics | instantiate an unbounded number of latent features | prior feature schema and exchangeable random-measure law [30][31] |
| probabilistic programs | dynamically realize a trace of events | program syntax and event constructors [32][33] |

Thus adaptive feature acquisition is a close implementation precedent but not
the claimed carrier. The new claim begins only when the obstruction extends the
**category of legal probes**, rather than selecting another object from a fixed
universal dictionary. Probability is then a state on the test algebra, and
optimization is a procedure on the acquisition/readout layer.

## 2. The closest established mathematical families

### 2.1 Path signatures: exact compositional memory already exists

For a path `x`, its signature is the tensor series of iterated integrals

\[
S(x)=\left(1,\int dx,\int dx\otimes dx,\ldots\right).
\]

Chen's identity gives exact composition under concatenation,

\[
S(x*y)=S(x)\otimes S(y).
\]

Signature uniqueness holds for geometric rough paths modulo the precise
tree-like equivalence, so this is not a metaphorical memory: it is an exact
algebraic path invariant with a known kernel [16]. Linear functionals of
signatures support universal approximation of suitable continuous path
functionals. A 2026 preprint extends this to non-geometric rough paths by
adjoining time and bracket/quadratic-variation channels, uniformly on compact
sets [17]. Neural controlled differential equations inherit a related
universal-approximation result for irregular time series [18].

This family already supplies three desired ingredients:

- exact compositional memory;
- arbitrarily deep finite materialization of one completed path feature; and
- deterministic universal approximation before any probability distribution
  is chosen.

What it does **not** supply is endogenous grammar. The path's coordinate
alphabet, the tensor algebra, and every word of iterated integrals are available
from the beginning. Truncating at successively higher tensor degree is
refinement of a fixed universal dictionary. A genesis-signature theorem would
need the obstruction itself to select a new Lie/Lyndon word or bracket channel,
prove that the coordinate is invariantly necessary, and stutter when the
obstruction disappears. If “take the next degree” is the rule, the stage counter
has merely moved into word length.

Probability enters path-signature theory later through expected signatures or
laws on path space. That is strong evidence for the downstream-state view:
the exact path algebra precedes the distribution.

### 2.2 Koopman observables: the fixed-state/growing-feature pivot is established

For dynamics `T:X->X`, the Koopman operator acts by

\[
(Uf)(x)=f(Tx).
\]

It represents nonlinear state dynamics by linear evolution on an ordinarily
infinite-dimensional function space. This is almost exactly the proposed
ontological shift: states need not grow; useful observables do.

Finite exact Koopman models are exceptional. Brunton et al. show, among other
limitations, that a finite-dimensional invariant subspace containing the state
cannot globally represent systems with multiple fixed points or more
complicated attractors in the required way [19]. A 2026 preprint gives necessary
and sufficient structural conditions for exact finite-dimensional controlled
Koopman embeddings and separates intrinsic dynamical obstruction from a bad
choice of lifting functions [20]. Extended DMD with dictionary learning adapts
the finite observable dictionary and can use fewer terms than a fixed
dictionary at a target accuracy [21].

The collision is close but incomplete:

- Koopman theory fixes the full observable space before approximation;
- learned dictionaries are selected by reconstruction or prediction loss;
- closure residuals can drive new features, but no general law makes a new
  **type** of observable semantically inevitable; and
- ordinary Koopman approximation has no built-in path holonomy or non-sofic
  multiplication obstruction.

The project can use Koopman theory as the ambient language while changing the
selection law: replace “optimize a dictionary” with “represent the certified
closure/transport obstruction, then close its orbit under the action.”

### 2.3 Myhill--Nerode, Hankel rank, weighted automata, and predictive states

This family supplies the cleanest finite-versus-global theorem interface.

For a Boolean language `L` over a fixed alphabet, define

\[
H_L(u,v)=1[uv\in L].
\]

Distinct rows are exactly distinct future residuals. Myhill--Nerode says their
number is the size of the minimal deterministic automaton. For a real-valued
series, the Fliess theorem identifies the rank of its Hankel matrix with the
minimal dimension of a weighted finite automaton [14]. Spectral methods learn
finite-rank weighted automata and observable-operator models by factoring
finite Hankel blocks [14][15].

Predictive-state representations make the coordinates explicit predictions of
future action-observation tests rather than latent hidden-state labels [13].
Computational mechanics instead quotients histories by equality of conditional
future distributions and proves minimality and uniqueness of the resulting
causal-state representation [11]. Importantly, even a simple finite hidden
generator can induce an uncountable, fractal set of optimal predictive states;
the statistical-complexity dimension measures the divergence of required
predictive memory [12]. Infinite/continuous predictive state therefore does not
require an infinite physical generator.

If probability is removed, the structural residue remains:

- Boolean future equivalence is a right congruence;
- algebra-valued series have residual modules;
- finite Hankel rank means finite linear realization; and
- infinite rank certifies the failure of every fixed finite weighted-state
  representation.

What remains fixed is the alphabet and the grammar of allowable suffix tests.
Counterexamples can add a new suffix or prefix, but every such string was
already a legal question in `Sigma*`. This is adaptive discovery inside a fixed
question universe, not birth of a new question type.

That gap suggests a precise theorem strategy. For each born observable `q`, form
the orbit series

\[
s_q(w)=q(w\cdot x_0),
\qquad
H_q(u,v)=s_q(uv).
\]

Then prove two statements:

1. every bounded-cost global feature program in a declared comparison class
   induces a bounded-rank factorization of the relevant Hankel family; and
2. obstruction-driven attachments force these ranks beyond every fixed bound.

This would convert “no bounded global representation” into a standard
finite-rank obstruction. Non-soficity still has to be coupled separately:
many observables of a non-sofic action can be constant or finite-rank.

### 2.4 Matrix coefficients and representation functions

For compact groups, Peter--Weyl theory shows that finite-dimensional unitary
matrix coefficients form a dense algebra of continuous functions [37]. This is
an established route from exact transport to external universal features.
However, it cannot simply be transferred to an arbitrary non-sofic group or
groupoid: compactness and the separating representation family do real work.

The useful project formulation is conditional. Given obstruction-born
monodromy

\[
\rho_c:\Pi_1(\mathcal H_c)\to\operatorname{Aut}(V_c),
\]

attach its coefficient module, or a canonically selected cyclic submodule, to
the observable algebra. The theorem must then answer:

- which vector or cyclic module is forced by `c`;
- whether its coefficients separate the semantic holonomy rather than only a
  quotient;
- whether the modules compose under path concatenation; and
- whether their union retains the full non-sofic action.

Without those answers, “use matrix coefficients” is only feature engineering.

### 2.5 Probabilistic programs: path semantics can precede probability

Intensional semantics for probabilistic programs records sampling and
conditioning events with their dependency order; the usual measure-theoretic
semantics can then be recovered from that event structure [32]. Trace-type
systems similarly track the space of possible execution traces because
inference algorithms act on traces, not only returned values [33].

This is a particularly important collision. It demonstrates in an established
formal setting that the distribution can be an extensional shadow of a richer
path object. The difference from algebraogenesis is again grammar: the program
syntax predeclares how events can be generated, even when an execution creates
a dynamically sized trace.

### 2.6 Bayesian nonparametrics: unbounded features are not endogenous types

The Indian buffet process is a distribution on binary matrices with finitely
many rows and an unbounded number of latent-feature columns; finite data
materialize only finitely many features [30]. Open-universe causal models permit
infinite variable spaces and implicitly represented causal structures [31].
These are close to “only a finite part is materialized, but the object supports
arbitrarily deep refinement.”

They do not settle the present problem. The exchangeability assumptions, base
measure, feature schema, and generative language are supplied before inference.
Posterior inference changes which latent features are occupied and their
weights. It does not ordinarily generate a new observable type from a
path-coherence obstruction. Bayesian nonparametrics is therefore a useful
downstream state-selection layer, not yet the carrier sought here.

## 3. AI frontier: what current adaptive architectures do and do not grow

### 3.1 Universal approximation fixes the semantic space first

Transformer universality is stated for continuous sequence-to-sequence maps on
a fixed compact domain, with positional encoding removing the permutation-
equivariance restriction [22]. Neural operators approximate continuous
operators between supplied function spaces and can be discretization-invariant
across meshes [23]. These are powerful external approximation theorems, but
they assume the domain, topology, observable coordinates, and target class.

Consequently, “universal approximator” should be split into two claims:

1. a neural or operator learner is dense in the current external observable
   fiber; and
2. an exact internal process decides when that fiber must be enlarged.

The first is established in many settings. The second is the research gap.

### 3.2 Test-time learning turns parameters into memory, not new semantics

TTT layers make the recurrent hidden state a model and update it by a
self-supervised gradient step on the test sequence [24]. Titans adds a neural
long-term memory module to attention and reports improved long-context
performance [25]. A 2025 analysis proves benefits for a one-gradient-step TTT
model under explicit alignment and distribution-shift assumptions [26].

These are genuine adaptive architectures, but the parameter tensor, update
loss, and read/write interface are fixed. They change the **value** of a hidden
model. They do not create a new callable observable type, preserve exact group
composition, or certify that a distinction could not be represented before
the update.

The right architectural comparison is therefore not “ours has memory and
Titans does not.” It is:

- TTT/Titans: optimize a fixed memory carrier;
- proposed system: attach an exact observable module, then optimize a readout
  on that enlarged carrier.

### 3.3 World models and causal abstraction still use declared vocabularies

Recent theory shows that agents robust across a sufficiently broad family of
distribution shifts must recover an approximate causal model under the paper's
regret assumptions [27]. Causal Bisimulation Modeling learns task-specific
minimal state abstractions from a reusable causal dynamics model [28]. LEXA
uses a learned world model to discover surprising image states and practice
reaching them as goals [29].

These systems learn better states, abstractions, goals, and predictions, but
their action and observation spaces, goal encoding, and model families remain
declared. They are strong controls for any claim of endogenous question growth.
An algebraogenetic prototype must outperform them structurally, not merely on
return: it must produce a query that was ill-typed before attachment, replay
the exact certificate that made it legal, and remain invariant under equivalent
history presentations.

### 3.4 A concrete architecture suggested by the audit

The literature points to an **obstruction-grown observable network** with five
separable layers:

1. **Exact transport kernel.** A symbolic/groupoid program composes paths and
   retains declared holonomy exactly.
2. **Current observable atlas.** A finite algebra `A_n`, preferably stored by
   generators and relations rather than a dense latent vector.
3. **External universal readout.** A Transformer, neural operator, neural CDE,
   or other approximator fits current observable shadows [18][22][23].
4. **Certificate engine.** Failed multiplication, closure, future-separation,
   or prediction tests produce typed obstruction certificates.
5. **Attachment compiler.** The certificate is represented as a new invariant
   observable module; probability estimates uncertainty on the enlarged
   algebra and optimization trains the readout.

The memory is forward and compositional. It need not reconstruct a previous
snapshot. Earlier structure remains available because new observables are
functions of the accumulated transport relations.

## 4. Reversibility, history, and information

Reversibility is not required for the proposed universal estimator.
Landauer's principle concerns logically irreversible merging or erasure and its
thermodynamic implementation; it does not say that every useful memory must be
run backward [34]. Reversible pebble games make the cost distinction explicit:
simulating an irreversible dependency graph reversibly introduces time/space
tradeoffs, and 2024 bounds show that the reversibility constraint can
asymptotically increase cumulative pebbling cost [35]. Thermodynamic analyses
of Turing machines likewise separate the input-output map, the heat function,
and algorithmic complexity rather than identifying “history” with one stored
tape [36].

There are three distinct notions that should not be conflated:

- **genealogical log:** enough data to replay every past update;
- **predictive sufficient state:** enough data to answer every declared future
  query;
- **exact compositional invariant:** enough algebra to compose future paths
  without reconstructing the past.

Causal states minimize the second [11]; path signatures exemplify the third
[16]. Algebraogenesis should target the third while allowing the second to
refine. A full reversible log is an optional audit mechanism, not a foundational
axiom.

## 5. Arithmetic dynamics and Collatz

### 5.1 What the rigorous frontier says

Tao's theorem remains the strongest retained analytic result: for any
`f(N)->infinity`, the minimum of the Collatz orbit is at most `f(N)` for almost
all starting values in logarithmic density. The proof uses approximate
transport for a first-passage random variable and harmonic analysis of a skew
random walk on a `3`-adic cyclic group [4]. The arXiv record received minor and
one medium typo correction in July 2026; the underlying theorem was published
in 2022, not newly proved in 2026.

The official Barina computation reports convergence for every integer below
approximately `2^71.02` as of 2026-08-10 and links the source code; its last
completed integer-power milestone was `2^71` in January 2025 [5]. This is a
large finite verification, not a uniform orbit theorem. Statistical studies
find stochastic-like correlations and Brownian-style global features in
collections of Collatz orbits, while explicitly describing the conclusions as
heuristic rather than a proof [6].

The broad 2023--2026 search returned many purported complete proofs in
preprint repositories and social mirrors. None was retained as an accepted
resolution.

### 5.2 Formal interface to observable genesis

Collatz naturally provides a fixed carrier and an expanding family of
arithmetic observables: valuations, residue classes, stopping-time tests,
characters on `2`-adic or `3`-adic quotients, transfer-operator modes, and orbit
languages. Tao's proof demonstrates that probability can be a proof technology
on these observables rather than the ontology of the map [4].

A serious genesis experiment could proceed as follows:

1. begin with a finite residue/valuation observable algebra;
2. ask it to certify descent or exclude a cycle over a declared horizon;
3. turn the exact failed certificate into a new congruence character, cocycle,
   or orbit-series test;
4. track the Hankel rank and transfer closure of the resulting observable
   family; and
5. require naturality under equivalent accelerated presentations of the map.

This would be useful even if it did not solve Collatz: it could expose whether
all finite successful arguments are instances of one bounded rational
representation or require unbounded new tests.

The decisive warning is equivalence concealment. “Every nonterminal holonomy
has inward mean flux” may simply restate Collatz. Enumerating moduli `2^n` is a
stage counter. A probability model that predicts negative drift is not a proof
that exceptional orbits cannot survive. The new framework contributes only if
the attachment law and a coercive global principle are independently proved.

## 6. Riemann hypothesis, trace formulas, and random matrices

### 6.1 The spectral route is a genuine observable bridge

The spectral program is structurally closer than a generic analogy. Trace and
explicit formulas turn prime-side test functions into zero-side spectral
statistics. Connes and Moscovici construct a self-adjoint prolate-spheroidal
operator whose ultraviolet negative spectrum reproduces the asymptotic
behavior of squared zeta zeros and an isospectral family of Dirac operators;
this is not an exact spectral realization of all zeros [7].

A 2025 preprint by Connes and a collaborator constructs self-adjoint rank-one
perturbations from Euler products over primes `p <= x`. Their low spectra
numerically match low zeta zeros, and the paper states the gap precisely: a
rigorous convergence proof as the cutoff grows would establish RH [8]. A 2024
Hamiltonian proposal likewise makes RH follow from the required real-spectrum
or self-adjointness property; the burden is proving that property without
assuming what it must establish [9].

These are finite-observable-to-global-spectrum programs, but their prime cutoff
and operator family are prescribed. They do not yet generate the next test
function from a semantic obstruction.

### 6.2 Random matrices describe distributions, not the missing operator

Keating and Snaith derive exact finite-`N` characteristic-polynomial moments
for the circular unitary ensemble and use the density matching between matrix
eigenvalues and zeta zeros to formulate zeta moment predictions; the comparison
is statistical and partly conditional, not a proof of RH [10]. Random-matrix
universality is therefore excellent evidence about spectral distributions and
a source of candidate functionals. It does not identify one self-adjoint
operator whose spectrum is exactly the zeta zeros.

This is another clean downstream role for probability. The prime/trace
observable algebra and candidate operator come first; probability describes
ensembles or limiting statistics on their spectra.

### 6.3 A disciplined genesis experiment for RH

One may let a failed finite positivity or trace test attach a new prime-side
observable, then transport it through the explicit formula to a spectral
observable. The experiment is meaningful only if:

- the test function is represented by the failure, not selected from a hidden
  pre-enumerated basis;
- the attachment commutes with the prime--zero transform;
- positivity or self-adjointness is obtained from an independent structural
  theorem; and
- the limiting operator exists in a specified topology.

If “no nonunitary completed holonomy” is equivalent to Weil positivity or RH,
the framework has reorganized the conjecture but not advanced it. That is an
acceptable falsification result and should be tested early.

## 7. Probability and optimization: carrier audit

| mechanism | what it legitimately supplies | why it is not yet the carrier |
|---|---|---|
| probability distribution/state | uncertainty, expectation, expected signatures, spectral statistics, posterior weighting | it acts on a declared measurable/observable algebra |
| Bayesian nonparametrics | unbounded latent feature count with finite materialization [30] | prior, exchangeability, and feature schema are fixed |
| probabilistic-program trace | intensional path/dependency structure from which measures are recovered [32][33] | event grammar is fixed by program syntax |
| optimization | fits readouts, dictionaries, memory weights, and representers | an unconstrained optimizer can hide a predeclared universal search space |
| test-time optimization | data-dependent memory inside inference [24][25][26] | parameter type and update loss remain fixed |
| active/counterexample search | chooses distinguishing tests within a language | the language of legal tests is normally fixed |

The useful doctrine is not “ban probability” or “ban optimization.” It is:

> **First prove the typed observable attachment and exact transport law. Then
> allow probability to be a compatible state on each stage and optimization to
> solve the externally universal approximation problem.**

A compatible family of states

\[
\omega_{n+1}|_{\mathcal A_n}=\omega_n
\]

may or may not extend to the completed algebra; that is a later analytic
question. The genesis law should not be defined merely as whichever feature
maximizes the current loss unless the loss itself represents a canonical
obstruction.

## 8. Five strongest next targets and their falsifiers

### Target 1: obstruction-to-observable representer theorem

Construct a functorial assignment

\[
c\longmapsto M(c)
\]

from the native lift/filler/transport obstruction to a cyclic observable module
of its monodromy representation. Prove chart/gauge naturality, nontrivial
separation, exact composition, and semantic stuttering when `c=0`.

**Falsifiers:** the module depends on the declared `Z/4` policy rather than the
extension; the split held-policy control produces the same birth; a gauge
change changes the callable question; or the observable was already in the old
algebra.

### Target 2: Hankel-rank escape against a bounded global feature class

Map every allowed global program feature of cost at most `B` to a weighted
automaton or rational representation of rank at most `r(B)`. Construct
obstruction-born orbit series whose Hankel ranks exceed `r(B)` while each
finite stage remains exactly realizable [14][15].

**Falsifiers:** a fixed finite rational representation realizes every born
series; the rank growth comes only from address length; or a re-encoding
compresses it after all costs are counted.

### Target 3: signature--Koopman holonomy algebra

Represent exact transport paths by signatures, let the dynamics act by Koopman
pullback, and require a certificate to select the first signature/Lie coordinate
that detects a surviving holonomy class. Prove Chen composition and an external
universality theorem on the resulting generated path space
[16][17][18][19][20][21].

**Falsifiers:** “first coordinate” means merely next tensor degree; tree-like
equivalence kills the supposedly semantic loop; a fixed signature truncation
already solves every declared task; or the selection is not invariant under
path presentation.

### Target 4: matched sofic/non-sofic causal ablation

Run the same certificate and attachment compiler on matched finite, sofic, and
theorem-backed non-sofic transports. Extract a theorem-derived, executable
`(F_0,epsilon_0)` obstruction and couple it to a family of observables that
survives the future quotient [1][2][3]. If the published proof supplies only
existence at this interface, extracting the finite certificate is part of the
target rather than an assumed input.

**Falsifiers:** identical growth occurs on the sofic control; the non-sofic
action becomes sofic after observational quotient; the effect disappears when
information and total cost are matched; or only a finite `D_8` subinstance is
actually used.

### Target 5: probability-free genesis with downstream learning

Define the causal/right-congruence refinement using Boolean or algebra-valued
future tests, not conditional probabilities. Only afterward install compatible
probability states and train an external TTT/Transformer/neural-operator
readout [11][12][13][14][15][22][23][24][25][26]. Compare against fixed dictionaries, learned Koopman
dictionaries, CEGAR/active tests, Bayesian nonparametrics, and random feature
growth.

**Falsifiers:** removing probability makes the attachment undefined; a fixed
full grammar reproduces the same hierarchy; the learned benefit comes entirely
from more parameters or test-time compute; or the new observable cannot be
replayed exactly from its certificate.

## 9. What would count as a real advance

A publishable foundational result does not need to mention Hodge, Collatz, RH,
or AI performance. The clean theorem would establish one finite-to-infinite
separation:

> There exists a computable exact transport system with a semantics-forced
> sequence of observable-algebra attachments such that every finite restriction
> is exactly realizable, the generated algebra is externally universal, no
> bounded-rank rational/global feature representation preserves all generated
> distinctions, and the induced transport retains an effective non-sofic
> obstruction under the observational quotient.

The result must include matched sofic controls and an honest cost model. That
would be genuinely stronger than universal approximation, infinite predictive
state, adaptive dictionary learning, path signatures, Bayesian nonparametrics,
or non-soficity alone.

For AI, the first worthwhile implementation milestone is correspondingly
modest: on a synthetic exact-transport benchmark, show that a certificate-born
observable module achieves a strict cost/rank separation from every member of a
declared bounded global-feature class while retaining exact replay. Accuracy on
ordinary language benchmarks comes later.

For Collatz and RH, the framework should initially be used diagnostically. It
should reveal whether proposed global principles add independent structure or
merely rename the conjecture. A negative answer would still sharpen the new
field by locating its true boundary.

## 10. Failed searches, uncertainty, and coverage boundary

- Broad Collatz queries were dominated by unreviewed “complete proofs,” social
  pages, and repository manuscripts. Exact-author searches recovered Tao and
  Barina. No retained primary source established a 2023--2026 resolution or a
  uniform theorem close to full convergence.
- Broad RH spectral/random-matrix queries returned seminars, surveys, and
  unsupported proof claims. Exact searches recovered the Connes operator
  program, the 2024 Hamiltonian proposal, and the Keating--Snaith comparison.
  No accepted exact self-adjoint spectral realization of all zeta zeros was
  found.
- The literal “endogenous query generation” search had low retrieval scores and
  mostly returned CEGAR material. No retained source generated a new typed
  observable grammar from a coherence obstruction.
- “Exact compositional memory” drifted toward neuro-symbolic surveys. The much
  closer path-signature literature appeared only after a mathematical
  exact-term search. The phrase is therefore not a reliable prior-art label.
- Matrix-coefficient/non-sofic searches returned mostly representation-theory
  notes. No direct source connected the 2026 explicit non-sofic group to an
  adaptive Koopman/signature/Hankel observable architecture.
- Several 2026 sources are arXiv version-one preprints, including the
  non-geometric signature universality and exact controlled-Koopman embedding
  papers [17][20]. They are frontier signals, not independently validated
  theorems for this project.
- Page update dates are not publication dates. Date-bounded discovery was used
  for coverage, then every theorem-facing date was checked on the retained
  source page.
- This `361`-page quality-gated web corpus is broad but not exhaustive. Missing
  matches are not evidence of no prior art. MathSciNet, zbMATH, citation-graph
  chasing, and expert review remain necessary before any novelty statement.

## Sources retained for theorem-facing synthesis

1. OpenAI, [Ten Advances in Mathematics and Theoretical Computer Science](https://cdn.openai.com/pdf/ten-proofs-oai.pdf), relevance `0.6172` — primary 2026 source containing the explicit non-sofic-group result that motivates the project.
2. [Soficity for group actions on sets and applications](https://link.springer.com/article/10.1007/s40687-025-00526-6), relevance `0.6484` — primary 2025 action-soficity framework.
3. G. Arzhantseva and P.-A. Cherix, [Quantifying metric approximations of discrete groups](https://www.numdam.org/articles/10.5802/afst.1788/), relevance `0.4883` — primary quantitative profile framework covering sofic, hyperlinear, and other metric approximations.
4. T. Tao, [Almost all orbits of the Collatz map attain almost bounded values](https://arxiv.org/abs/1909.03562), relevance `0.6758` — primary theorem and current arXiv history.
5. D. Barina, [Convergence verification of the Collatz problem](https://pcbarina.fit.vutbr.cz/), relevance `0.3613` — official live verification limit and code link.
6. [Stochastic-like characteristics of arithmetic dynamical systems](https://iopscience.iop.org/article/10.1088/2632-072X/ad271f), relevance `0.6172` — primary heuristic/statistical Collatz analysis.
7. A. Connes and H. Moscovici, [Prolate spheroidal operator and Zeta](https://arxiv.org/abs/2112.05500), relevance `0.4570` — primary spectral/operator result and its stated asymptotic scope.
8. A. Connes et al., [Zeta Spectral Triples](https://arxiv.org/abs/2511.22755), relevance `0.4805` — 2025 primary preprint with explicit finite-prime operators and convergence gap.
9. E. Yakaboylu, [Hamiltonian for the Hilbert--Pólya Conjecture](https://arxiv.org/abs/2309.00405), relevance `0.3496` — primary 2024 publication whose RH implication depends on the real-spectrum/self-adjointness step.
10. J. P. Keating and N. C. Snaith, [Random Matrix Theory and zeta(1/2+it)](https://people.maths.bris.ac.uk/~mancs/papers/RMTzeta.pdf), relevance `0.5742` — primary exact CUE calculation and zeta-moment comparison.
11. C. R. Shalizi and J. P. Crutchfield, [Computational Mechanics: Pattern and Prediction, Structure and Simplicity](https://arxiv.org/abs/cond-mat/9907176), relevance `0.4355` — primary causal-state minimality and uniqueness results.
12. A. M. Jurgens and J. P. Crutchfield, [Divergent Predictive States](https://arxiv.org/abs/2102.10487v2), relevance `0.5938` — primary infinite/fractal predictive-state result from finite hidden generators.
13. M. Littman, R. Sutton, and S. Singh, [Predictive Representations of State](http://papers.neurips.cc/paper/1983-predictive-representations-of-state.pdf), relevance `0.4902` — primary action-conditional future-test representation.
14. B. Balle, [Learning Automata with Hankel Matrices](https://borjaballe.github.io/slides/turing18.pdf), relevance `0.6563` — authoritative theorem tutorial recording the Myhill--Nerode and Fliess Hankel characterizations.
15. [Spectral Learning of Dynamic Systems from Nonequilibrium Data](https://proceedings.neurips.cc/paper/6191-spectral-learning-of-dynamic-systems-from-nonequilibrium-data.pdf), relevance `0.4160` — primary finite-Hankel-rank observable-operator learning result.
16. H. Boedihardjo et al., [The Signature of a Rough Path: Uniqueness](https://www.oxford-man.ox.ac.uk/wp-content/uploads/2020/05/The-Signature-of-a-Rough-Path-Uniqueness.pdf), relevance `0.6289` — primary signature-kernel/tree-like-equivalence theorem.
17. M. Ceylan, A. P. Kwossek, and D. J. Prömel, [Universal approximation with signatures of non-geometric rough paths](https://arxiv.org/abs/2602.05898), relevance `0.4316` — 2026 primary preprint extending signature universality.
18. P. Kidger et al., [Neural Controlled Differential Equations for Irregular Time Series](https://proceedings.neurips.cc/paper/2020/hash/4a5876b450b45371f6cfe5047ac8cd45-Abstract.html), relevance `0.5273` — primary path-model universal approximation result.
19. S. Brunton et al., [Koopman invariant subspaces and finite linear representations of nonlinear dynamical systems for control](https://arxiv.org/abs/1510.03007), relevance `0.5938` — primary finite-subspace limitation and control construction.
20. [On the Existence of Koopman Linear Embeddings for Controlled Nonlinear Systems](https://arxiv.org/html/2602.14537v1), relevance `0.6563` — 2026 primary preprint giving exact structural conditions.
21. [Extended dynamic mode decomposition with dictionary learning](https://ar5iv.labs.arxiv.org/html/1707.00225), relevance `0.5938` — primary adaptive Koopman dictionary method.
22. C. Yun et al., [Are Transformers universal approximators of sequence-to-sequence functions?](https://research.google/pubs/are-transformers-universal-approximators-of-sequence-to-sequence-functions/), relevance `0.7070` — primary fixed-domain Transformer universality theorem.
23. N. Kovachki et al., [Neural Operator: Learning Maps Between Function Spaces](https://jmlr.org/papers/v24/21-1524.html), relevance `0.7266` — primary operator universality and discretization-invariance result.
24. Y. Sun et al., [Learning to (Learn at Test Time): RNNs with Expressive Hidden States](https://arxiv.org/abs/2407.04620), relevance `0.4941` — primary TTT-layer architecture.
25. A. Behrouz et al., [Titans: Learning to Memorize at Test Time](https://proceedings.neurips.cc/paper_files/paper/2025/hash/a4ca07aa108036f80cbb5b82285fd4b1-Abstract-Conference.html), relevance `0.5703` — primary 2025 neural long-term-memory architecture.
26. H. A. Gozeten et al., [Test-Time Training Provably Improves Transformers as In-Context Learners](https://research-explorer.ista.ac.at/download/21325/21336/2025_ICML_Gozeten.pdf), relevance `0.2871` — primary 2025 theorem under explicit linear/alignment assumptions.
27. J. Richens and T. Everitt, [Robust Agents Learn Causal World Models](https://proceedings.iclr.cc/paper_files/paper/2024/file/44a2b9f7bf9aec3f1fa333ad875b0ee0-Paper-Conference.pdf), relevance `0.5039` — primary robust-generalization theorem.
28. Z. Wang et al., [Building Minimal and Reusable Causal State Abstractions for Reinforcement Learning](https://arxiv.org/abs/2401.12497), relevance `0.3965` — primary causal-bisimulation abstraction method.
29. [Discovering and Achieving Goals via World Models](https://proceedings.neurips.cc/paper/2021/file/cc4af25fa9d2d5c953496579b75f6f6c-Paper.pdf), relevance `0.5156` — primary learned-world-model goal discovery system.
30. T. Griffiths and Z. Ghahramani, [Infinite Latent Feature Models and the Indian Buffet Process](https://cocosci.princeton.edu/tom/papers/ibptr.pdf), relevance `0.4961` — primary unbounded-feature Bayesian model.
31. D. Ibeling and T. Icard, [On Open-Universe Causal Reasoning](https://proceedings.mlr.press/v115/ibeling20a.html), relevance `0.4609` — primary infinite-variable causal semantics.
32. S. Castellan and H. Paquet, [Probabilistic Programming Inference via Intensional Semantics](https://iso.mor.phis.me/publis/Probabilistic_Programming_Inference_via_Intensional_Semantics_ESOP19.pdf), relevance `0.4004` — primary event-structure semantics from which measure semantics is recovered.
33. A. Lew et al., [Trace Types and Denotational Semantics for Sound Programmable Inference](https://alexlew.net/papers/trace-types-2020/paper.pdf), relevance `0.4004` — primary execution-trace type system.
34. C. H. Bennett, [Notes on Landauer's principle, reversible computation, and Maxwell's Demon](https://www.cs.princeton.edu/courses/archive/fall06/cos576/papers/bennett03.pdf), relevance `0.4961` — authoritative logical-erasure/reversibility boundary.
35. [The Impact of Reversibility on Parallel Pebbling](https://eprint.iacr.org/2024/334.pdf), relevance `0.4590` — primary 2024 time/space/cumulative-cost bounds.
36. A. Kolchinsky and D. Wolpert, [Thermodynamic costs of Turing machines](https://link.aps.org/doi/10.1103/PhysRevResearch.2.033312), relevance `0.3750` — primary separation of heat, computation, and algorithmic complexity.
37. T. Tao, [The Peter--Weyl theorem, and non-abelian Fourier analysis on compact groups](https://terrytao.wordpress.com/2011/01/23/the-peter-weyl-theorem-and-non-abelian-fourier-analysis-on-compact-groups/), relevance `0.3984` — authoritative exposition of matrix-coefficient density and its compact-group hypotheses.
