# Radius two, the failed theorem, and the next architecture

## Reflection

The most important result was not the decimal returned by the solver. It was discovering that an exact proof pipeline can verify the wrong cone perfectly when the symmetry compiler has the wrong *type*.

For a few minutes the evidence looked spectacular: rational affine identities, a rank-677 moment matrix, and exact positive leading minors across twelve components. Every arithmetic check passed. The load-bearing premise did not. Matrix dagger was an anti-automorphism, while the Gram reducer treated it as an automorphism. Replacing it by `g -> T(g)^-1` changed every serious radius-two count and erased the false positive margin.

This was not wasted work. It exposed a general rule for theorem-driven AI:

> Exact arithmetic certifies consequences. It does not certify that the compiler translated the intended mathematical category.

The engine therefore needs proof-type checking before proof search: equality-preserving, multiplication-preserving, involution-preserving, positivity-preserving, measure-preserving, and distribution-preserving maps are different types.

## What the corrected experiment says

Radius one has a clean exact obstruction: the regular-simplex moment matrix closes that cone negatively. Radius two is qualitatively different. The corrected cone has 9,865 invariant variables and a deep singular dual face. A one-kernel model cannot enter its relative interior. This is evidence for a new scaling law—not merely parameter count versus radius, but **facial depth versus radius**.

The two-hour countermodel curriculum reinforces the same picture from the finite-emulator side. It completed 925,234 iterations and 617 stages. Its best worst-loss values were:

```text
size 6:  1.000
size 8:  0.875
size 10: 0.700
size 12: 0.750
size 16: 0.625
size 20: 0.600
```

The envelope improves slowly and non-monotonically, while collision, multiplication, and relator defects trade places as the bottleneck. This is empirical obstruction data, not a universal lower bound. But it suggests that increasing finite capacity does not remove the obstruction cleanly; it moves the model onto a different failure face.

## FACE: a face-adaptive exact architecture

The next AI architecture should be a **Facially Adaptive Compositional Engine (FACE)** inside OASIS:

```text
external observations
        |
        v
universal distribution readout <---- Bayesian prediction state
        ^                                  |
        |                                  v
exact non-sofic transitions ----> probe / countermodel game
        |                                  |
        v                                  v
positivity-typed compiler ------> primal-dual obstruction search
                                           |
                                           v
                               exact kernel memory
                                           |
                                           v
                               quotient and recompile
```

The external layer remains the approximator. The internal non-sofic action is not approximated; it routes probes and composes memory exactly. Failed approximation attempts do not merely add training examples. They expose kernel relations, quotient the state space, and change the geometry of the next optimization.

That is the concrete meaning of **exact compositional memory**: remember not only successful programs, but exact directions that every admissible moment distribution must annihilate. A learned kernel becomes a permanent architectural constraint.

## New concepts that emerged

These are research hypotheses, not established theorems.

### 1. Facial scaling law

Measure complexity by the sequence

```text
(support size, symmetry quotient size, forced-kernel dimension, facial-reduction depth)
```

rather than by parameter count alone. A problem may grow mildly in variables but sharply in facial depth. This may explain why some theorem searches and compositional-learning tasks remain hard after aggressive symmetry reduction.

### 2. Proof persistence spectrum

As the word radius grows, exact kernel subspaces map into later moment spaces. Track which obstructions are born, persist, merge, or disappear—analogous to persistent homology, but for null directions of positive polynomial functionals. Long-lived kernel classes would be natural probe targets and reusable memory atoms.

### 3. Bayesian distributions over faces

The Bayesian state should range over candidate exposed faces, not over whether a theorem is true. A probe is valuable when its expected outcome separates competing kernel lattices. Posterior entropy then controls which exact relation, finite emulator, or SOS objective to test next.

### 4. Obstruction-conditioned mixture of experts

Ordinary mixtures route inputs by predictive fit. FACE can route by obstruction signature: collision-dominated, multiplication-dominated, relator-dominated, spectral, or locality-dominated. Each expert proposes external approximations, while the exact core prevents their internal transition laws from silently drifting.

### 5. Categorical safety for mathematical AI

Every transformation should carry a machine-checked capability type. An anti-automorphism may preserve equality and invert products while failing the interface expected by a Gram reducer. The system should refuse to reuse it until a coercion—here, composition with inversion—proves positivity preservation.

### 6. Fractal face replication

Thompson-prefix self-similarity can transport a local kernel relation into many cylinders and scales. Mellin-like depth modes could measure whether these replicated faces are independent or correlated. The useful object may be a renormalization operator on obstruction subspaces, not just a family of duplicated probes.

### 7. Reverse universal approximation

The non-sofic core is not a difficult target function. It is the exact change-of-coordinates engine through which external functions and distributions are represented. Finite students approximate its observable shadows; their systematic failures teach the core how to refine probes. Universality lives outside, non-approximability organizes the inside.

### 8. Proof-complexity analogy

The finite emulator is a candidate witness; the evolving facial-reduction chain is a refutation. The meaningful complexity measure may be the shortest exact kernel chain needed to expose a contradiction. This resembles `NP` witness versus proof-system lower-bound questions, but it is not a claim about `P` versus `NP` without a formal reduction.

## Retrospective judgment

The time was a signal—but not that the project was failing. It signaled that the representation layer needed a semantic audit. The right response was neither blind patience nor abandoning the idea; it was to ask which invariant the slow computation was supposed to preserve.

The corrected result is less dramatic and more valuable:

- no false radius-two theorem;
- a complete, validated radius-two cone;
- strong but properly bounded evidence for zero gap;
- a precise deeper-face theorem target; and
- a new architecture in which audit, rollback, kernel discovery, and exact compositional memory are first-class learning operations.

## Ranked next targets

1. Perform multi-objective facial reduction on the corrected radius-two dual and recover the common kernel exactly.
2. Add positivity-preserving transformation types and direct-moment invariance tests as hard gates in the compiler.
3. Feed countermodel failure signatures into the Bayesian face posterior and test whether it predicts dual kernel blocks.
4. Measure the proof-persistence spectrum from radius one to radius two before attempting radius three.
5. Continue proof mining of the universal `(F, epsilon)` locality/decomposition modulus in parallel; the finite SOS hierarchy is a complementary route, not a substitute for that theorem gap.
