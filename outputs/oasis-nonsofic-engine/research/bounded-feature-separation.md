# Conditional contextual-atlas separation for semantic point queries

## Result

The earlier atlas-scaling result compared transported charts only with banks of
absolute point evaluations. The comparison now extends to one explicit oracle
class: arbitrary deterministic programs that may issue semantic point queries
adaptively anywhere in the group, perform unrestricted nonlinear computation on
the answers, and return any feature value, but have a bounded total number of
such evaluations.

This produces a query-complexity theorem rather than a point-probe counting
observation.

> **Contextual Atlas Point-Query Separation Theorem.** Let $g ≠ e$, and choose
> $n$ residual pairs
>
> \[
> S_i=\{t_i,t_i g\}
> \]
>
> that are mutually disjoint. Let the two semantic states in pair $i$ be
>
> \[
> p_{i,0}=\delta_{t_i},
> \qquad
> p_{i,1}=\delta_{t_i g}.
> \]
>
> Every deterministic, context-blind, extensional observer making at most
> $Q$ adaptive semantic-evaluation queries can distinguish at most $Q$ of
> the $n$ pairs. Consequently, distinguishing every pair requires
> $Q ≥ n$, and $Q=n$ is sufficient. If the observer is a bank of $m$
> point-query feature programs using at most $b$ evaluations each, then
>
> \[
> mb\ge n.
> \]
>
> When the reference path $t_i$ is supplied as context, the single shared
> chart rule
>
> \[
> \Phi_{t_i,e}(p)=p(t_i)
> \]
>
> distinguishes all $n$ pairs with one semantic evaluation, one scalar
> coordinate, and a constant-margin readout.

The theorem allows each point-query feature program to choose queries adaptively,
to query arbitrary elements of the whole group, and to apply arbitrary
arithmetic, polynomials, neural networks, hashes, or control flow after the
answers arrive. Its restriction is observational cost, not linearity.

## Why this feature class is legitimate—but not exhaustive

The native semantic states are equivalence classes of certified programs under
extensional equality. Two different pieces of source code can therefore denote
the same state. A representation-respecting feature cannot depend on incidental
syntax of one representative; its canonical access is through semantic
evaluation

\[
p\longmapsto p(x).
\]

A bounded point-query observer is an oracle program with bounded access to
these evaluations. This is stronger than a fixed cylinder feature: later query
addresses may depend on all earlier answers, and the final readout may be any
function of the complete transcript.

This interface is not the only natural one. The falsification suite shows that
the broader claim fails under several stronger interfaces:

- one sample from a point-mass distribution reveals its support and solves the
  task with one sampling operation;
- a subset-integral or aggregate primitive can compute
  $\sum_i p(t_i)$ in one API call, although it hides $n$ point evaluations;
- a support iterator reveals the sparse representation directly; and
- inspecting the serialized program representative bypasses extensional
  evaluation entirely.

The theorem therefore measures semantic **point-evaluation work**. It is not a
lower bound against every natural bounded-cost global feature, distribution
interface, or hardware primitive.

## Proof

Run a deterministic $Q$-query observer $A$ against the identically zero
state. Let

\[
Z_A=\{z_1,\ldots,z_k\},
\qquad k\le Q,
\]

be the addresses queried along this all-zero transcript.

Suppose $S_i\cap Z_A=\varnothing$. On both $\delta_{t_i}$ and
$\delta_{t_i g}$, the first query returns zero. Inductively, every subsequent
query and answer is exactly the one in the zero-state run, because neither
point-mass support is ever touched. Both states therefore produce the same
transcript and the same output. Pair $i$ is not distinguished.

Thus a necessary condition for distinguishing pair $i$ is

\[
S_i\cap Z_A\neq\varnothing.
\]

The supports $S_i$ are mutually disjoint, so one address in $Z_A$ can touch
at most one pair. At most $k≤Q$ pairs can be distinguished. Querying every
$t_i$ attains the bound, proving necessity and sufficiency.

A bank of $m$ feature programs with budget $b$ can be concatenated into one
observer with total budget at most $mb$, giving $mb≥n$.

### Randomized corollary

Choose the pair index uniformly and choose its branch uniformly. Assume the
observer uses independent internal coins and obeys a hard $Q$-query bound on
every run. For every fixed random seed, its deterministic policy covers at most
$Q$ pairs. On each uncovered pair both branches have the same transcript, so
their balanced Bayes error is $1/2$. Averaging over seeds gives

\[
\operatorname{err}(A)
\ge
\frac{n-Q}{2n},
\qquad 0\le Q\le n.
\]

The Bayes-risk lower bound therefore survives randomization. A randomized
observer can touch every pair with positive probability across different seeds,
so the deterministic phrase “distinguishes at most $Q$ pairs” must not be
applied to its union over seeds.

## Atlas upper bound and exact continuation invariance

The atlas observer receives the live reference path as a context address. It
uses the same rule on every example:

\[
A_{\mathrm{atlas}}(p,t)=p(t).
\]

Then

\[
A_{\mathrm{atlas}}(\delta_t,t)=1,
\qquad
A_{\mathrm{atlas}}(\delta_{tg},t)=0.
\]

If a common left continuation $u$ acts on the state and its reference path,

\[
A_{\mathrm{atlas}}(\alpha_u p,ut)
=(\alpha_u p)(ut)
=p(t)
=A_{\mathrm{atlas}}(p,t).
\]

The atlas output is one coordinate generated by a shared relative rule. This
does not imply an output-dimension advantage: a context-blind observer can also
sum all $n$ absolute queries into one scalar.

## Exact cost ledger

The theorem makes a side-information/query-bandwidth separation under explicit
accounting. It is not yet an architecture-class separation under equal inputs.

| Quantity | Context-blind global observer | Context-addressed atlas |
|---|---:|---:|
| Semantic point evaluations per example needed to cover all pairs | $Θ(n)$ | $1$ |
| Attaining output dimension | $1$, via a global sum | $1$ |
| Attaining program-rule count | $1$ plus its addresses/generator | $1$ |
| Context address | unavailable by definition | one supplied path $t$ |
| Exact update after continuation $u$ | precompiled absolute probes remain absolute | update $t↦ut$ |
| Obstruction-search cost | not bounded | not bounded |

The $Θ(1)$ claim applies only to per-example semantic point-evaluation
count once the correct address is supplied. It is not a theorem of output
dimension, learned-rule count, constant total storage, or constant bit
complexity.

- If the generating process already carries $t$, the atlas uses no learned
  table of reference paths.
- If $n$ unrelated references must be stored separately, that metadata costs
  $Θ(n)$, and there is no total-memory compression theorem.
- Identifying one of $n$ unrelated contexts requires at least $\log_2 n$
  bits, plus the path-word representation, unless provenance is causally
  carried by the process.
- A single global program can issue $n$ queries and compress their answers
  into one output scalar. The lower bound is on reliable semantic access, not
  by itself on output dimension or source-code length.
- Exact group composition, address length, numerical precision, and obstruction
  discovery should be counted separately in future comparisons.
- If a baseline is given $t$ and the same dynamic evaluation primitive, it
  can implement $p(t)$. The separation is precisely between static
  frame-blind sensing and context-addressed transport.

These qualifications identify the conditional resource being saved:
**precompiled semantic point-evaluation bandwidth**.

## What non-soficity contributes

The finite query lower bound itself does not require a non-sofic group. Any
group containing the required disjoint residual pairs supports it. Exact chart
normalization is the source of the local reuse.

Non-soficity has a different, global role. The point-mass orbit makes the full
semantic action admit no sofic approximation in the countable-set-action sense
of Gao, Kunnawalkam Elayavalli, and Patchell. The present work has not yet
reduced a proposed finite neural encoder to such an approximation, so it does
not yet prove that non-soficity forces chart growth in an ML architecture.

This gives the correct division of labor:

\[
\text{contextual transport}
\Longrightarrow
\text{local query compression},
\]

\[
\text{non-sofic action}
\Longrightarrow
\text{no sofic approximation in that published action sense}.
\]

Combining those clauses is the distinctive architectural hypothesis. It is not
the claim that non-soficity magically improves every finite prediction task.

## Executable audit

`bounded-feature-separation.mjs` constructs 24 exact disjoint residual pairs in
the implemented theorem-backed group. It verifies:

- exact lower-bound attainment at $n=2,4,8,16,24$;
- the all-zero-transcript certificate for 32 adaptive nonlinear program
  specimens with budgets up to 12;
- the randomized error-floor formula;
- one-coordinate separation of all 24 pairs; and
- exact invariance after a common nontrivial continuation.

The universal quantifier is supplied by the zero-transcript proof above; the
runtime verifies the exact algebraic hypotheses and exercises adversarial
programs rather than pretending finite testing proves the theorem by itself.

`architectural-falsification-suite.mjs` then challenges the interpretation with
sofic controls, matched-context baselines, sampling and aggregate interfaces,
unlimited-precision scalar codes, corrupted provenance, randomized budgets,
adaptive programs, overlapping obstruction supports, nonzero backgrounds, and
multiple exact residuals and continuations. Its present verdict is deliberately
mixed: the point-query theorem survived, while general coordinate-count,
total-memory, uniquely non-sofic, and equally informed-baseline advantages were
falsified.

## Architectural consequence and next target

The object is broader than memory. It is a dynamical system of distinctions.
At stage $k$, an observable algebra $\mathcal A_k$ induces an equivalence
relation

\[
p\equiv_k q
\quad\Longleftrightarrow\quad
a(p)=a(q)
\text{ for every }a\in\mathcal A_k.
\]

A target-conflicting pair in one equivalence class is an obstruction. Its
certificate grows the observable algebra and refines the semantic partition:

\[
\mathcal A_0\subset\mathcal A_1\subset\cdots,
\qquad
{\equiv_0}\supset{\equiv_1}\supset\cdots.
\]

Weights optimize predictions after distinctions are available. Algebraogenesis
determines which distinctions are available.

The next theorem should couple this local separation to the global non-sofic
obstruction. A candidate **No-Finite-Closure Atlas Theorem** would state that
every finite task admits a finite context-addressed chart extension, while no
single finite approximately equivariant encoder can close all exact transports.
That requires a precise reduction from a proposed finite encoder and its
transition maps to the published notion of a sofic action; it is not yet
claimed here.
