# Architectural falsification report

## Status

This is a provisional adversarial audit, not a novelty or priority claim. The
purpose of the pass was to make the proposed atlas interpretation fail wherever
its resource accounting, inputs, or interfaces were underspecified.

The result is deliberately mixed. One exact oracle-query theorem survived. Four
broader interpretations did not.

## Hypotheses tested

| Hypothesis | Verdict | Evidence |
|---|---|---|
| A context-blind semantic point-query program needs $Q\ge n$ to distinguish $n$ disjoint residual pairs | Survived | Zero-transcript proof, exact-group audit, exhaustive finite-policy control |
| The atlas has a general $n$-versus-one output-coordinate advantage | Falsified | One scalar global sum distinguishes every pair |
| The atlas has constant total memory or description cost | Not established | The reference context carries address information and may cost $\Theta(n)$ to store as a table |
| Non-soficity causes the finite local query reduction | Falsified | The same reduction occurs in the sofic group $\mathbb Z$ |
| The atlas beats an ordinary observer given identical context and point-query access | Falsified | The matched-context baseline computes the identical one-query rule |
| The lower bound covers every natural extensional semantic interface | Falsified | One sample from a point mass reveals its support; an aggregate primitive also bypasses the point-query count |
| One obstruction certificate can causally generate a reusable relative query | Survived in a small additive prototype | Three certificates generated distinct programs; corruption and out-of-family controls failed correctly |
| The full non-sofic proof certificate already compiles chart laws autonomously | Open | The current causal compiler does not consume the full proof-obligation schema |
| Current held-out tests demonstrate learned chart-law discovery | Falsified as an interpretation | The exact normalization law is installed before readout testing |
| The current influence experiment establishes a dense-feature theorem | Falsified as an interpretation | It is only a rescaling identity for one explicit global-sum family |

## Strongest result that survived

Let $g\ne e$, and choose mutually disjoint pairs

$$
\{t_i,t_i g\},\qquad i=1,\ldots,n.
$$

Let the conflicting semantic states be

$$
p_{i,0}=\delta_{t_i},
\qquad
p_{i,1}=\delta_{t_i g}.
$$

A deterministic observer is allowed arbitrary computation and adaptive query
selection, but its only access to the semantic state is a point evaluation
$p(x)$; it receives no pair context $t_i$ and has a hard worst-case budget of
$Q$ evaluations.

Run the observer on the zero state and record its all-zero query set $Z$. If
$Z$ misses both endpoints of pair $i$, then both point masses in that pair
follow the exact zero transcript and return the same output. Since the pair
supports are disjoint, $|Z|\le Q$ can touch at most $Q$ pairs. Therefore

$$
Q\ge n
$$

is necessary to distinguish every pair, and querying all $t_i$ shows it is
tight.

With independent internal randomness and a hard $Q$ bound on every run, the
uniform balanced task has Bayes error at least

$$
\operatorname{err}\ge\frac{n-Q}{2n}.
$$

If the correct reference address is causally supplied, the dynamic rule

$$
H(p,t)=p(t)
$$

uses one point evaluation. Under common continuation,

$$
H(\alpha_u p,ut)=H(p,t).
$$

This is a sharp **side-information and semantic point-query bandwidth theorem**.
It is not yet an architecture-class lower bound under equal inputs.

## Test volume

The persistent falsification suite currently executes:

- exhaustive enumeration of all 823,894 deterministic adaptive policies of
  depths zero through three on three disjoint pairs in $\mathbb Z/7\mathbb Z$;
- 1,000 randomized fixed-budget tightness runs across ten budgets;
- 1,000 adaptive nonlinear decision-tree specimens on 64 pairs;
- 500 adaptive observers over nonzero background functions on 48 conflict
  pairs;
- 300 random obstruction hypergraphs, including 261 with overlapping supports;
- 800 exact checks across five nonidentity residuals, five continuations, and
  32 disjoint pairs in the implemented theorem-backed group;
- 64-pair sofic, matched-context, context-corruption, aggregate, sampling,
  representation-inspection, and scalar-code controls;
- three causally compiled prototype charts, 60 translated holdout pairs, four
  certificate-corruption tests, and an explicit out-of-family failure; and
- the complete 13-script project regression suite.

Finite tests corroborate the hypotheses and catch implementation errors. The
universal deterministic and randomized statements rest on the proofs, not on
sample counts.

## What the negative controls taught us

### Output dimension is the wrong resource

The context-blind feature

$$
F_T(p)=\sum_{i=1}^n p(t_i)
$$

is scalar and perfectly separates the two branches. It costs $n$ point
evaluations when expanded in the stated oracle model. Thus output dimension can
be one on both sides; semantic access work is what separates them.

### Context is side information, not free magic

The atlas is given $t_i$. An ordinary point-query program given the same value
also computes $p(t_i)$ in one query. If $t_i$ is not already carried by the
causal path, selecting one of $n$ unrelated contexts costs at least $\log_2 n$
identity bits plus its path representation. If all references must be stored,
the table may cost $\Theta(n)$.

### The interface changes the theorem

For a point-mass distribution, `sample()` returns the support in one operation.
A subset-integral primitive can return the global sum in one call. Direct syntax
inspection can read the target hash with no semantic queries. These do not
contradict the point-query proof; they prove that it must not be advertised as a
lower bound for all bounded-cost semantic programs.

### Disjointness is load-bearing

For fixed nonadaptive coordinate supports, the right complexity is the
transversal number of the obstruction difference-support hypergraph. Disjoint
two-point edges have transversal number $n$. Overlapping conflicts may have a
much smaller hitting set; for example, arbitrarily many edges sharing one point
are all hit by one query.

### Non-soficity is global, not the local cause

The local point-query result survives unchanged in sofic controls. Separately,
the point-mass orbit proves that the full semantic action admits no sofic
approximation in the Gao--Kunnawalkam Elayavalli--Patchell countable-set-action
sense. A missing reduction still separates these facts: no theorem yet shows
that a proposed finite neural encoder would induce the forbidden kind of sofic
action approximation.

## Reflection beyond memory

The larger conceptual object remains promising, but the evidence changes how it
should be described. It is not primarily a memory store. It is a dynamical
system of distinctions.

At stage $k$, an observable algebra $\mathcal A_k$ induces a semantic partition

$$
p\equiv_k q
\quad\Longleftrightarrow\quad
a(p)=a(q)\text{ for every }a\in\mathcal A_k.
$$

A target-conflicting pair inside one cell is an obstruction. A valid compiler
turns its certificate into a new observable, producing

$$
\mathcal A_0\subset\mathcal A_1\subset\cdots,
\qquad
{\equiv_0}\supset{\equiv_1}\supset\cdots.
$$

Weights optimize predictions once distinctions exist. Algebraogenesis concerns
how distinctions are certified and materialized. Probability is then a
valuation on the current observable algebra; memory is one consequence of exact
transported addressability.

The tests do not yet establish that this complete loop is a new AI architecture.
They establish one conditional query theorem, one small causal compiler, and a
clear list of failure modes.

## Required gates before a broader conclusion

1. **Full certificate compiler.** Compile a chart program from the actual
   non-sofic proof-obligation schema. Deleted, shuffled, wrong-residual, and
   replay-invalid certificates must be rejected causally.
2. **Equal-information benchmarks.** Give pointer lookup, key-value memory,
   attention, recurrent state, and the atlas identical causal context. Count
   context production, address length, point queries, parameters, transport
   work, and latency separately.
3. **Out-of-family tasks.** Hold out residual types, longer compositions,
   mixtures, overlapping supports, noisy observations, and cases where context
   is not already the answer address.
4. **Stronger semantic interfaces.** Compare point evaluation, sampling,
   subset integrals, support iteration, moments, and symbolic access under one
   explicit resource ledger.
5. **Adversarial learned features.** Search or train dense, adaptive, and
   randomized feature programs under matched query, precision, influence,
   description-length, and gate budgets.
6. **Matched group families.** Compare finite, amenable sofic, nonamenable
   sofic, and non-sofic transports on matched tasks before attributing an effect
   to non-soficity.
7. **Finite-encoder reduction.** Prove or refute that a specified bounded
   equivariant path compressor would produce a forbidden sofic action
   approximation.
8. **External review and prior-art study.** Only after the object and cost model
   stabilize should novelty, naming, or priority claims be assessed.

## Current verdict

The broad architectural headline is withheld.

The robust kernel is:

> Causally supplied provenance enables dynamic semantic addressing. In the
> point-evaluation oracle model, one transported address can replace linearly
> many context-blind evaluations across an orbit of disjoint conflicts.

That is useful, exact, and much smaller than the original conjecture. The next
research should try to break it under richer interfaces and determine whether
the genuinely non-sofic part contributes anything beyond the already familiar
power of dynamic addressing.
