# Query-local universality for a presentation-transcendent algebra

## Result

The Presentation-Transcendent Algebra Machine has a constructive universal
approximation theorem, but it is deliberately not a fixed-representation
theorem.

> **Finite-task PTAM theorem.** For every finite set of native program contexts,
> every finite rational target-distribution task that is well-defined on
> extensional semantics, and every positive epsilon, an adaptive compiler halts
> with a finite observation set and an epsilon-accurate finite readout.

The theorem does not require global semantic equality, a finite emulator of the
internal algebra, or a uniform bound on the necessary observation depth.

## 1. Setup

Let:

- \(P\) be the certified-total native program presentation;
- \(X\) be a computably enumerable exact observation domain;
- \(\operatorname{eval}(p,x)\) be total and computable;
- \(p\sim q\) mean equal evaluation for every \(x\) in \(X\);
- \(C=\{p_1,\ldots,p_n\}\) be a finite context list;
- \(Y\) be a finite output alphabet; and
- \(\mu_i\) be a rational probability distribution on \(Y\).

The task must satisfy the semantic-consistency promise

\[
p_i\sim p_j\quad\Longrightarrow\quad \mu_i=\mu_j.
\]

This is necessary. A genuine function on semantic algebra elements cannot
assign different outputs to two representatives of the same element.

For a finite probe set \(F\subset X\), define

\[
O_F(p)=\big(\operatorname{eval}(p,x)\big)_{x\in F}.
\]

Any readout using only \(F\) factors through the finite observational fibers of
\(O_F\).

## 2. The fixed-window obstruction

Suppose \(O_F(p_i)=O_F(p_j)\). Every readout \(R\) must give those contexts the
same prediction. By the triangle inequality in total variation,

\[
\max\left\{
d_{\mathrm{TV}}(R(O_F(p_i)),\mu_i),
d_{\mathrm{TV}}(R(O_F(p_j)),\mu_j)
\right\}
\geq \frac12 d_{\mathrm{TV}}(\mu_i,\mu_j).
\]

Consequently, if \(D_F\) is the largest target-distribution diameter inside any
observational fiber, every \(F\)-readout has minimax error at least \(D_F/2\).

Exact representation through \(F\) is possible if and only if target
distributions are constant on every fiber. This is an observational quotient
condition, not a neural-network capacity condition.

No fixed finite \(F\) is globally universal for the presentation-transcendent
algebra. Given \(F\), choose a delayed clock whose delay exceeds every native
complexity in \(F\). It agrees exactly with zero on \(F\) but is semantically
nonzero. Assigning the two elements different binary targets creates a positive
error floor for every readout restricted to \(F\).

## 3. Constructive adaptive universality

For each pair \((p_i,p_j)\) with \(\mu_i\neq\mu_j\), semantic consistency
guarantees that \(p_i\) and \(p_j\) are extensionally different. Enumerate \(X\)
and evaluate both programs until an \(x_{ij}\) is found with

\[
\operatorname{eval}(p_i,x_{ij})\neq
\operatorname{eval}(p_j,x_{ij}).
\]

The search halts for every target-conflicting pair. There are finitely many such
pairs, so

\[
F=\{x_{ij}:\mu_i\neq\mu_j\}
\]

is finite and computably obtained under the semantic-consistency promise. Now

\[
O_F(p_i)=O_F(p_j)\quad\Longrightarrow\quad\mu_i=\mu_j.
\]

A lookup readout on the finite signatures represents the rational targets
exactly. The current OASIS finite softmax chart represents every strictly
positive finite target using computable logarithmic parameters; finite numeric
evaluation approximates it to requested epsilon. Targets containing zeros can
be smoothed by less than half epsilon before compiling the positive chart.

This proves the theorem.

### Why the promise is not cheating

The compiler does not decide whether arbitrary programs are equal. It searches
only those pairs whose requested outputs differ. A valid semantic task itself
certifies that such pairs cannot be equal, so witness search is guaranteed to
terminate. Pairs with the same target need never be classified.

The central computational pattern is:

    do not solve global equality
            |
            v
    find only task-demanded distinctions
            |
            v
    compile a finite observational quotient
            |
            v
    apply an ordinary universal readout

## 4. The non-computable semantic-depth scaling law

Existence and uniform resource bounds are radically different here.

Assume there were a computable function \(B(n)\) such that every nonzero
halting-clock program of code length at most \(n\) had a separating observation
of native complexity at most \(B(n)\). Given a counter machine \(M\), compute
this bound for its clock and simulate \(M\) for \(B(n)\) steps. If it has not
halted, the bound implies that it never will. This would decide halting.

Therefore no such computable uniform bound exists.

The PTAM scaling law is consequently not just

\[
\mathrm{error}=f(\mathrm{parameter\ count},\mathrm{data\ count})
\]

for one computable worst-case \(f\). It has a separate semantic-depth
coordinate:

\[
\mathrm{task\ performance}
=f(\mathrm{finite\ parameters},\mathrm{observations},
\mathrm{discovered\ witness\ depth}).
\]

For each valid finite task the adaptive procedure terminates. Across all tasks,
the required witness depth can grow faster than any computable uniform bound
derived only from program size. This is a precise form of open-ended memory.

It does not make individual inference noncomputable. It says there is no
universal computable deadline after which absence of a witness may be promoted
to semantic equality.

## 5. Executable adversarial test

The program query-local-universality.mjs constructs three contexts:

- semantic zero;
- a clock halting after native complexity 78; and
- a clock halting after native complexity 93.

The three contexts receive different binary target distributions. Eight shallow
probes, with maximum complexity 55, collapse all three into the signature
0|0|0|0|0|0|0|0. Their maximum target diameter is 0.8, proving a minimax
total-variation error floor of 0.4 for every fixed shallow readout.

The compiler then:

1. finds a complexity-78 exact witness;
2. finds a complexity-93 exact witness;
3. refines the one observational fiber into three;
4. compiles the existing OASIS finite distribution charts; and
5. reaches maximum total-variation error \(6.245\times10^{-17}\), below the
   requested \(10^{-12}\) tolerance.

No semantic equality oracle is called.

### Trained-student ablation

The follow-up program ptam-student-ablation.mjs replaces the lookup prediction
with a full-batch gradient-trained logistic student.

With only the shallow observational quotient, all three contexts have the same
features. After 20,000 optimization steps the student correctly converges to the
shared mean probability \(0.5667\), but its maximum total-variation error is
\(0.4667\). No optimizer or additional parameter attached to those identical
features can cross the proved \(0.4\) minimax floor.

After the compiler contributes its two exact witnesses, the observation matrix
has three different rows. A three-parameter logistic student then learns the
three requested probabilities with maximum error approximately
\(2.7\times10^{-15}\).

This isolates representation error from optimization error. Gradient descent
did not discover the missing semantic distinction; once the algebraic compiler
made that distinction observable, ordinary convex training was sufficient.

## 6. Bayesian and distributional interpretation

The finite signatures generated by a probe set \(F\) define a partition of the
native contexts, or equivalently a finite observation sigma-algebra. The target
kernel \(p(Y\mid C)\) is exactly representable when it is measurable with respect
to this sigma-algebra: it must be constant on every observational atom.

Give the finite contexts a prior and write \(Z_F=O_F(C)\). Under logarithmic
loss, the best possible readout from the current observations is
\(p(Y\mid Z_F)\). Its excess Bayes risk over a readout that sees the native
context is exactly

\[
I(Y;C\mid Z_F)
=\mathbb E_C\left[
D_{\mathrm{KL}}\bigl(p(Y\mid C)\,\|\,p(Y\mid Z_F)\bigr)
\right].
\]

This gives a probabilistic obstruction certificate complementary to the
worst-case total-variation bound. If a candidate probe \(X\) refines the current
signature, its exact log-loss value is

\[
I(Y;C\mid Z_F)-I(Y;C\mid Z_F,X)=I(Y;X\mid Z_F),
\]

because the probe value is a deterministic observation of the native context.
The correct Bayesian probe score is therefore conditional information released,
not an unconditional proof bonus.

In the trained-student ablation, the shallow quotient leaves
\(0.2638883489\) nats hidden. This equals the optimized shallow student's mean
KL error. The two compiled witnesses refine the three contexts into singleton
atoms, reducing the conditional-information obstruction to zero.

This reframes PTAM as an **adaptive sigma-algebra machine**: posterior predictive
requirements determine which distinctions must become measurable. A later
Bayesian update can make a formerly sufficient quotient insufficient, causing
the native algebra to generate another witness without rebuilding its semantic
object.

## 7. Relationship to non-soficity

The finite-task theorem requires only a computable native presentation and a
computably enumerable separating observation domain. Non-soficity is not needed
for that theorem.

Crossing with the exact non-sofic group adds a second adversary: even after a
finite task quotient has been compiled, a finite permutation emulator may still
violate multiplication or freeness obligations. PTAM can therefore grow probes
for two logically distinct reasons:

- **semantic refinement:** target-conflicting native programs share a finite
  observation signature;
- **process refinement:** a finite emulator violates an exact non-sofic proof
  obligation.

The architecture should preserve that distinction in its critic and training
logs.

## 8. Immediate architecture consequence

The correct universal approximator is a compiler loop, not one frozen network:

\[
\mathrm{native\ algebra}
\rightarrow\mathrm{finite\ fibers}
\rightarrow\mathrm{error\ lower\ bound}
\rightarrow\mathrm{witness\ search}
\rightarrow\mathrm{refined\ fibers}
\rightarrow\mathrm{finite\ readout}.
\]

The trained-student ablation now establishes that an ordinary optimizer benefits
from the compiled quotient. The next experiment should change the Bayesian
target kernel over time and test whether conditional-information scoring adds
the right new probes while retaining exact compositional memory.

## 9. Primary-source boundary check

The adaptive loop has close relatives, but the theorem should not be identified
with any one of them.

- Clarke, Grumberg, Jha, Lu, and Veith's
  [counterexample-guided abstraction refinement](https://web.stanford.edu/class/cs357/cegar.pdf)
  iteratively removes spurious verification counterexamples. PTAM instead
  refines observational fibers only when they contain conflicting
  distributional targets; the underlying semantic quotient need not have a
  decidable complete abstraction.
- Angluin's
  [learning from queries and counterexamples](https://people.eecs.berkeley.edu/~dawnsong/teaching/s10/papers/angluin87.pdf)
  exactly learns a regular language using membership and equivalence queries,
  with complexity tied to a minimum finite automaton and counterexample length.
  PTAM makes no finite-state learnability claim for its native algebra. It
  compiles only the requested finite semantic task.
- Godziszewski and Hamkins study
  [computable quotient presentations](https://arxiv.org/abs/1702.08350) and show
  strong impossibility results for quotient presentations of nonstandard
  arithmetic and set theory. Effective quotients and complicated congruences
  are therefore established mathematics, not a new ingredient.
- Specker-type constructions show that a computable sequence can lack an
  effective convergence modulus; a recent computable-analysis treatment
  summarizes this in
  [effective weak convergence](https://link.springer.com/article/10.1007/s00224-026-10282-x).
  PTAM's no-uniform-witness-depth theorem is a task-refinement analogue of this
  classical phenomenon.
- The
  [Solvability Complexity Index](https://arxiv.org/abs/1508.03280) classifies
  problems by the number of limiting processes required by finite-information
  algorithms. This is a natural framework for classifying stronger PTAM
  completions, especially if a future architecture returns convergent answers
  without an effective error modulus.
- Finite neural interpolation is already well established; for example,
  [Dirksen, Finke, and Genzel](https://www.jmlr.org/papers/v25/23-1376.html)
  construct instance-specific interpolating networks. The finite readout at the
  end of PTAM is not by itself novel.

The candidate contribution is therefore the conjunction:

1. a computably opaque effective quotient used as native memory;
2. a distribution-valued semantic-consistency promise;
3. a computable compiler that searches only target-demanded distinctions;
4. an explicit observational-fiber error lower bound;
5. a no-computable-uniform-semantic-depth theorem;
6. an exact non-sofic crossed-product process spine; and
7. proof and semantic obstructions routed into separate probe generators.

The narrow primary-source search performed on 2026-08-05 did not locate this
exact conjunction. This is a defensible research gap, not an exhaustive novelty
or patentability conclusion. The Bright Data deep-research client was
unavailable in the workspace, so the boundary check used direct primary-source
web retrieval rather than a comprehensive indexed corpus.
