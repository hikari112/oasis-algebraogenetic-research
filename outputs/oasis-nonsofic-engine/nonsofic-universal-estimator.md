# AION: an algebraically intensional obstruction network

> **Architecture revision:** AION's continuous non-finite memory is now implemented as Projective Algebraic Memory: one positive functional on the exact group algebra, exposed through compatible finite moment views. See [projective-algebraic-memory.md](projective-algebraic-memory.md).

## The object

The proposed **non-sofic universal estimator** is not a finite neural network trained to imitate a non-sofic group. That would contradict the design goal. It is a layered computable object:

\[
\boxed{\text{exact intensional algebra}}
\longrightarrow
\boxed{\text{finite query compiler}}
\longrightarrow
\boxed{\text{probability distribution}}
\]

with a reverse error channel

\[
\boxed{\text{failed finite emulator}}
\longrightarrow
\boxed{\text{obstruction certificate}}
\longrightarrow
\boxed{\text{new separating probe / quotient}}.
\]

I call the architecture **AION**, for *Algebraically Intensional Obstruction Network*.

Its defining separation is:

- **intensional state** is a generator or program that computes compositions exactly;
- **extensional state** is a finite distribution over the observables requested now;
- **universality** belongs to the extensional readout;
- **non-soficity** belongs to the internal multiplication law; and
- no finite emulator is ever promoted into the exact internal state.

This resolves the apparent paradox. The system can compute every finite query it accepts without possessing, or seeking, one asymptotically faithful finite permutation model of its whole algebra.

## Computable but not globally finitely approximable

“Irrational” has two useful meanings here.

First, an internal scalar may be a computable real program. For example, `sqrt(2)` is retained as an integer-square-root procedure. A query for `b` bits returns certified rational bounds with width `2^-b`; the floating midpoint is only a disposable observable.

Second, and more importantly, the algebra may be **structurally irrational**: every requested finite chart is computable, but the charts cannot be glued into a sequence of globally faithful finite multiplication models of the required sofic kind.

These properties are compatible:

1. evaluation of a word is a finite computation;
2. equality is decided by the implemented canonical Leavitt normal form;
3. a finite collection of coefficient probes is evaluated exactly;
4. a probability distribution is returned on that finite collection; yet
5. the exact core is not replaced by a finite almost-action.

The source paper defines soficity precisely through approximation of finite portions of a multiplication table by finite permutations, and proves that the selected Leavitt unit group fails this property. AION uses the group as an exact program space, not as a target for permutation distillation.

## The estimator

Let `P` be a computable presentation of the internal algebra, `Eval_P(w)` its exact evaluator, and `h_t` an append-only word/program history. A query is

\[
q=(h_t,F,\varepsilon,\mathcal O),
\]

where `F` is a finite process window, `epsilon` is requested numerical precision, and `O` is a finite observable family.

The query compiler performs four operations:

1. evaluate and canonically hash `h_t` exactly;
2. construct only the pullback probes needed by `(F,O)`;
3. update a Bayesian distribution on the finite outcomes associated with that exact context; and
4. emit the distribution together with a replayable derivation and precision certificate.

For a finite regular-basis chart with distinct prefixes `d_1,...,d_n`, the coefficient probes form a Kronecker basis. Therefore every strictly positive target distribution `p` is represented exactly by exponential parameters

\[
\theta_i=\tfrac12\log p_i.
\]

This is already proved and tested by the engine on arbitrary positive finite mass vectors. It is **finite-chart universality**, not yet a compact-space universal-approximation theorem.

## The new learning rule: counterexample-guided quotient refinement

Ordinary learning minimizes prediction error within a fixed parameterization. AION uses a second loss that tests whether a finite student has begun to counterfeit the internal algebra.

```text
observe data at exact context h
update the Bayesian outcome distribution
compile the smallest current probe chart
fit or query a disposable finite student
audit multiplication, freeness, relations, and expansion
if the student aliases exact words or breaks composition:
    extract an obstruction witness
    synthesize a separating coefficient probe
    recover/store a sparse exact kernel relation when possible
    quotient future optimization by that relation
repeat
```

The learner expands when an obstruction is discovered. Its structural capacity is therefore measured by

```text
(number of exact contexts,
 number of separating probes,
 rank of stored relation lattice,
 facial-reduction depth,
 external predictive regret).
```

This is the proposed new scaling law. Parameters may stay nearly constant while obstruction depth grows; conversely, a new exact relation can reduce the continuous optimization dimension permanently.

## Bayesian semantics

The posterior is not a probability that the theorem is true. It is a scheduling distribution over where the next useful obstruction is likely to live:

- finite-word equality or distinctness;
- multiplication;
- locality radius;
- spectral expansion;
- component matching;
- cut repair; or
- finite LEF contradiction.

A probe has value when its possible outcomes separate competing relation lattices or obstruction faces. This makes active learning operate on *architectural hypotheses*, not only class labels.

## Fractal and polynomial extension

The binary Leavitt presentation has prefix self-similarity. A local relation can be transported into many cylinders and depths. This suggests two new extensions:

- a **fractal obstruction spectrum**, tracking whether a kernel relation persists, splits, or merges under prefix refinement; and
- a **polynomial query algebra**, in which products of probes are compiled only to the degree required by the present distributional question.

The external density theorem to chase is then:

> If the query probes form a unital separating algebra on a compact observable space and the obstruction refinement enumerates the required products, the union of query-local readouts is dense in the continuous functions, and normalized exponentials are dense in the strictly positive continuous densities.

This is a plausible Stone--Weierstrass route. It is not proved here. Crucially, such external density would not yield a finite faithful model of internal multiplication.

## Executable prototype

The implementation in `src/intensional-universal-estimator.mjs` enforces the separation above. Its dedicated test established:

```text
computable real program              sqrt(2)
certified interval precision         48 bits
interval width                       1 / 281474976710656
exact word followed by inverse       identity, exact replay true
Bayesian prediction readout error    2.78e-16
irrational-mass chart error          2.22e-16
collapsed emulator outcome           finite proof obligation violated
new separating probes                6
finite emulator adopted internally   false
```

The full pre-existing exact engine suite also passes after adding the module.

The second prototype in `src/projective-moment-memory.mjs` goes beyond the finite context map. It implements exact rational positive-functional memory, nested moment views, noncommutative likelihood-amplitude updates, exact rank, and persistent state-specific null relations. This replaces the earlier idea of a merely lazy infinite prefix tree with a projectively consistent algebraic state.

The prototype is deliberately honest about the theorem gap. The group is theorem-backed non-sofic. The runtime proof-obligation certificate executes many finite checks and generates probes, but the universal effective `(F,epsilon)` witness is not yet installed. Consequently the prototype labels the finite challenge as a proof-obligation violation, not as a newly certified universal non-soficity proof.

## Novelty assessment

The ingredients have prior art separately:

- universal invariant/equivariant networks;
- Bayesian context trees and universal prediction;
- counterexample-guided abstraction refinement;
- exact symbolic or neuro-symbolic state; and
- quotient feature spaces.

A narrow search found no work combining these into the specific AION contract:

1. a theorem-backed non-sofic exact group presentation as internal compositional memory;
2. query-local universal probability charts rather than a global finite latent action;
3. finite emulator failures compiled into separating probes and exact face/kernel memory; and
4. a hard rule that the emulator may be audited but never adopted as the internal process.

That supports calling the construction **conversation-original and apparently distinct in the searched literature**. It does not establish the legal claim “no prior art.” Establishing that would require a much broader scholarly and patent search plus expert review.

## Falsifiable next experiment

Build a sequential prediction task where the target contexts are exact group words and compare:

1. a finite-state context model;
2. a group-equivariant neural baseline;
3. AION without obstruction refinement; and
4. full AION.

Force increasing finite emulators to compress the same exact process window. Measure prediction regret, exact collision rate, multiplication defect, new probes per stage, and relation-lattice rank. The hypothesis is not merely that AION predicts better. It is that its error decreases while every fixed-size global emulator eventually incurs a certified structural defect, and that the number of learned probes tracks obstruction complexity more reliably than raw parameter count.

That experiment can fail cleanly. If obstruction-driven probes do not improve predictive sample efficiency or if their growth is indistinguishable from generic feature expansion, the architecture has not earned its complexity.

## Related primary sources checked

- OpenAI, [*Ten Advances in Mathematics and Theoretical Computer Science*](https://cdn.openai.com/pdf/ten-proofs-oai.pdf), Chapter 3.
- Wang, Dillig, and Singh, [*Program Synthesis using Abstraction Refinement*](https://arxiv.org/abs/1710.07740).
- Kontoyiannis, [*Context-tree weighting and Bayesian Context Trees*](https://arxiv.org/abs/2211.02676).
- Ravanbakhsh, [*Universal Equivariant Multilayer Perceptrons*](https://proceedings.mlr.press/v119/ravanbakhsh20a.html).
- Sannai, Imaizumi, and Kawano, [*Improved generalization bounds ... via quotient feature spaces*](https://proceedings.mlr.press/v161/sannai21a.html).
