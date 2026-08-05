# Causal-memory reflection: what the prototype actually discovered

## The correction

The first PAM implementation had the right mathematical carrier—a normalized
positive functional—but the wrong causal vocabulary. It called right
multiplication by an amplitude an observation. For the implemented left
observable algebra, right multiplication instead lies in the commuting action:
it preserves every exact left-kernel relation. That makes it a particularly
good **consolidation** operation, not a measurement.

A genuine observation or intervention acts from the left. It can create a new
kernel relation and invalidate an old one. Once this distinction is enforced,
memory is no longer a single evolving state. It is an immutable tree of
conditional positive states, plus a ledger explaining which equivalences hold
on which branch.

The second correction is historical. Describing state by predictions of future
observations is established predictive-state-representation territory, and
multi-time intervention-dependent memory is close to process-tensor theory.
The novel candidate must be narrower than either slogan.

## The sharpened object

The implemented candidate is an **obstruction-refining non-sofic predictive
state**:

1. an exact non-sofic group supplies the compositional transition algebra;
2. a positive functional supplies distributional state and exact finite moment views;
3. observations create immutable conditional branches;
4. state kernels are proof-carrying, versioned memories;
5. an audit distinguishes algebraic equality, state-kernel equivalence, and emulator aliasing;
6. a failed finite emulator or rank constraint produces the next discriminating probe; and
7. a finite universal readout answers the current distributional query without replacing the exact internal process.

The phrase “externally universal, internally non-sofic” now has a precise
division of labor. Universality belongs to the finite query-local readout.
Non-soficity belongs to the process algebra. Infinite-rank positivity belongs to
memory. None of the three properties is being used as a synonym for another.

## New exact evidence

The executable tests now establish:

- exact binary forecasts `p_+=(1+omega(g))/2` and `p_-=(1-omega(g))/2` for involutions;
- two counterfactual children with exact outcome memories, leaving the parent unchanged;
- an exact depth-two causal tree with four leaves of probability `1/4` and total probability one;
- order-sensitive amplitudes for two noncommuting sequential observations;
- explicit invalidation of a branch relation after an incompatible later observation;
- a three-way critic that can say “the emulator is wrong,” “the memory currently agrees but the algebra does not,” or “the words are exactly equal”;
- exact finite-latent obstruction certificates from moment-matrix rank; and
- an exact disjoint-translate certificate showing that a twice-observed, four-term amplitude has a six-probe identity moment view of exact rank six.

On canonical-trace windows of sizes `3,5,7,9,11`, the exact ranks are the same
sizes. Against a fixed two-dimensional latent Gram state, the best possible
normalized Frobenius errors are approximately

```text
0.577, 0.775, 0.845, 0.882, 0.905,
```

and the best operator-norm error is at least one in every case. More generally,
for the `n`-element identity moment view and latent dimension `d<n`, the exact
normalized lower bound is `sqrt((n-d)/n)`. It tends to one for every fixed `d`.

The result is stronger than the initial canonical example. For any nonzero
finite-support amplitude `B` over an infinite group, with finite support `S`,
one can choose arbitrarily many `g_i` such that the translates `g_iS` are
pairwise disjoint. At each step, only the finite union `union_i g_i S S^-1`
is forbidden. The translated amplitudes are orthogonal, so their normalized
moment matrix is exactly an identity matrix of arbitrarily large size.

Thus every state reached by finitely many nonzero implemented updates retains
unbounded semantic rank. No fixed finite latent Gram state can preserve all
refinements. This remains separate from non-soficity, which obstructs a
particular kind of finite permutation approximation to multiplication.

## The next theorem gap

The translate argument closes the unbounded-rank question for the implemented
finite-amplitude state class. It does not yet show that materializing its rank
witnesses helps prediction. The next target is:

> Recover a violated moment minor against the current finite student, compile
> it into the next observation probe, and prove or measure an improvement in
> predictive loss, calibration, or regret relative to uncertainty sampling.

This would create a closed adaptive loop:

```text
finite latent student
        -> disjoint-translate or collided-word certificate
        -> exact separating observation probe
        -> conditional PAM branch
        -> measured predictive improvement
        -> harder student challenge
```

The most radical possibility is a new scaling law. Ordinary parameter scaling
asks how loss changes as a fixed architecture grows. This system would measure
how much **certified semantic rank** a task forces into existence per generated
obstruction. Capacity would be created by proof demand, not chosen in advance.

## Falsification conditions

The idea weakens substantially if any of the following occurs:

- learned branch families remain uniformly low rank despite the exact core;
- obstruction-selected probes do not outperform ordinary uncertainty or error sampling;
- exact canonicalization dominates runtime before useful predictive gains appear;
- kernel certificates almost never consolidate reusable relations; or
- a standard PSR/process-tensor construction reproduces the full three-layer audit and non-sofic probe loop without the proposed machinery.

These are useful failure modes. They turn the architecture from a metaphor into
a research program that can be wrong.

## Prior-art boundary

Closest primary sources checked include [Hilbert Space Embeddings of Predictive
State Representations](https://arxiv.org/abs/1309.6819), [Recurrent Predictive
State Policy Networks](https://proceedings.mlr.press/v80/hefny18a.html),
[Operational Markov Condition for Quantum
Processes](https://arxiv.org/abs/1801.09811), and [The Structure of Quantum
Stochastic Processes with Finite Markov
Order](https://arxiv.org/abs/1810.10809). The complete synthesis above appeared
distinct in this narrow search, but that is a research observation—not a legal
or exhaustive no-prior-art conclusion.
