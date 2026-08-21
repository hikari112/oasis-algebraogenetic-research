# Four-frontier dream audit protocol

## Status and purpose

This protocol audits a deliberately unconstrained artifact claiming that one
new mathematical structure resolves Navier--Stokes, the Hodge conjecture,
Collatz, and the Riemann hypothesis. It is not a literature review and it does
not assess novelty. Its purpose is to preserve fertile structural coincidences
while rejecting category errors, hidden answer-oracles, and famous-problem fan
fiction.

The governing rule is:

> A common diagram is evidence of shared syntax, not shared semantics. Each
> frontier needs its own typed realization and its own soundness theorem.

No amount of agreement among metaphors can substitute for one of those four
soundness theorems.

## 1. Audit levels

Every assertion extracted from the dream artifact receives exactly one of the
following labels.

1. **Metaphor:** suggests a construction but has no declared source, target,
   or invariant.
2. **Typed analogy:** supplies maps and compatible structures, but no theorem
   transporting the target property.
3. **Finite model:** makes an exact prediction in a bounded fixture.
4. **Domain lemma:** proves a genuine statement in the native mathematics of
   one frontier.
5. **Uniform bridge:** proves the domain lemma for every input in the
   frontier's quantified class, with bounds independent of truncation or
   presentation.
6. **Frontier theorem:** discharges the standard problem with all hypotheses
   and quantifiers stated.

Only level 6 is a solution. Level 3 can raise the posterior that a mechanism
is mathematically fertile; it cannot raise a theorem's status.

## 2. The only admissible meaning of “one structure”

A single causal-resolution construction can have four realizations without
the four target domains being equivalent. The honest shape is a family, not a
single magic object:

\[
\mathsf{CR}(E_i(x))
\xrightarrow{\;R_i\;}
\mathcal C_i,
\qquad
i\in\{\mathrm{NS},\mathrm{Hdg},\mathrm{Col},\mathrm{RH}\}.
\tag{1}
\]

Here:

- \(x\) is native input data for one frontier;
- \(E_i\) is an effective, answer-independent encoding into a common category
  of presentation-bearing resolution problems;
- \(\mathsf{CR}\) is one fixed construction law, invariant under declared
  presentation changes;
- \(R_i\) realizes its cells, boundaries, and certificates in the native
  category \(\mathcal C_i\); and
- \(P_i\) is the exact target predicate in that category.

The minimum shared theorem schema is

\[
\operatorname{Cert}_{\mathsf{CR}}(E_i(x))
\Longrightarrow
P_i(R_i\mathsf{CR}(E_i(x))).
\tag{2}
\]

For a universal claim, one also needs an existence or completeness theorem
saying that the required certificate exists for every admissible \(x\). A
realization need not be full, faithful, or an equivalence of categories. It
must only be **conservative for the theorem-relevant predicate**: it may not
turn a false native statement into a valid source certificate.

Consequently, four realizations are legitimate if they are four separately
proved semantics for common syntax. They do not transfer truth between one
another unless an additional natural transformation or comparison theorem is
proved. A causal loop may realize as a commutator of repair operations in one
domain, a descent obstruction in another, and zero in a third. Calling all
three “curvature” does not identify them.

### Non-circularity gate

Each encoder and certificate verifier must be executable without deciding the
frontier predicate first. The following are forbidden:

- choosing cells using knowledge of whether a solution, cycle, descent, or
  zero exists;
- defining “admissible resolution” as one that eventually succeeds;
- hiding the desired theorem in an infinite lookup table, oracle, stage
  counter, or non-effective choice;
- allowing a target-specific realization to add exactly the missing global
  object without proving that the source construction generated it.

## 3. Minimum obligation: three-dimensional Navier--Stokes

The claim must first choose one exact standard setting, for example the
three-dimensional incompressible equations on \(\mathbb R^3\) or the periodic
three-torus, and state its regularity and decay hypotheses. Switching domains,
boundary conditions, or solution notions during the proof is disallowed.

For a global-regularity claim, the minimum obligations are:

1. **Native object.** Construct a velocity \(u\) and pressure \(p\) satisfying
   the incompressible Navier--Stokes equations, \(\nabla\cdot u=0\), and the
   prescribed initial data in a precisely named weak or strong sense.
2. **Faithful realization.** Prove that causal-resolution cells correspond to
   valid operations on the PDE data. A combinatorial boundary is not a spatial
   derivative, vorticity, flux, or distributional boundary without this
   theorem.
3. **Approximation passage.** If finite meshes, modes, or local charts are
   used, prove compactness and convergence to a solution of the nonlinear
   equation. Passing the linear terms while losing the nonlinear convection
   term is failure.
4. **Uniform estimate.** Derive a bound independent of mesh, mode cutoff, and
   resolution depth that controls a norm strong enough to exclude singularity.
   The ordinary energy inequality alone is not such a bound in three
   dimensions.
5. **No concentration defect.** Rule out loss through high-frequency cascade,
   concentration, oscillation, or a defect measure at the limit.
6. **Global continuation.** Prove that the estimate extends the solution for
   every positive time and yields the required smoothness. If uniqueness is
   used to glue local solutions, prove it in the claimed class.

For a singularity claim, replace obligations 4--6 with an explicit admissible
initial datum and a proof that every corresponding smooth solution loses the
required regularity in finite time. A numerical instability is not a PDE
singularity.

### Navier--Stokes analogy cheats

- equating cellular exactness with incompressibility or the divergence theorem;
- calling any unbounded resolution cost “energy blow-up”;
- proving bounds only for each finite Galerkin system;
- assuming weak convergence preserves the quadratic term;
- treating a local smooth solution or an energy-class weak solution as global
  smoothness;
- importing a generated Laplacian without a proved relation to the physical
  Laplacian and pressure projection.

## 4. Minimum obligation: the Hodge conjecture

The native statement concerns every smooth projective complex variety \(X\),
every codimension \(p\), and every rational Hodge class

\[
\alpha\in H^{2p}(X,\mathbb Q)\cap H^{p,p}(X).
\]

For a proof claim, the minimum obligations are:

1. **Native input.** Encode arbitrary \((X,p,\alpha)\) without assuming that
   \(\alpha\) is already represented by an algebraic cycle.
2. **Algebraic output.** Produce a finite rational linear combination of
   codimension-\(p\) algebraic subvarieties, not merely a smooth form, analytic
   current, local polynomial, formal cycle, or limiting sequence.
3. **Exact cycle class.** Prove that the rational cycle-class map sends that
   algebraic cycle exactly to \(\alpha\).
4. **Descent and globalization.** If the construction is local, prove that the
   local algebraic cycles and their rational coefficients glue in the
   algebraic category. Density, approximation, or compatible analytic germs do
   not supply an algebraic global cycle.
5. **Uniform quantifiers.** Prove the construction for every smooth projective
   complex variety and every \(p\), not a generated subclass or fixed degree.
6. **No strengthened substitution.** Keep rational coefficients and the
   precise Hodge type. Proving a real, integral, numerical, or approximate
   variant is a different statement.

For a disproof claim, exhibit a specific \((X,p,\alpha)\), prove that \(\alpha\)
is a rational Hodge class, and prove that it lies outside the rational span of
all algebraic cycle classes. Failure of one construction to find a cycle is
not nonexistence.

### Hodge analogy cheats

- treating sheaf-cohomological local-to-global failure as evidence that the
  Hodge conjecture is false;
- confusing a primitive of a differential form with an algebraic cycle;
- replacing algebraicity by analytic, topological, definable, or dense
  approximability;
- interpreting growth of polynomial degree in one atlas as a coordinate-free
  obstruction;
- assuming a nonzero causal-holonomy class is a Hodge class or a cycle-class
  cokernel;
- proving only that the proposed resolution complex has homology.

## 5. Minimum obligation: Collatz

The claim must state the exact integer map and convention. For the usual
positive-integer conjecture, the minimum obligations are:

1. **Exact domain preservation.** Every resolution step must correspond to an
   exact iterate or a proved block of iterates on positive integers.
2. **Exhaustive coverage.** The certificates must cover every positive integer,
   not a density-one set, all tested integers, or all residue classes below a
   moving cutoff.
3. **Well-founded descent.** Supply a well-founded measure and prove that every
   nonterminal orbit reaches a strictly smaller measure after a finite,
   certified block. The block length may vary only under a rule whose
   termination is independently proved.
4. **No hidden boundedness.** Do not assume that the orbit remains bounded,
   revisits a finite state, or enters the range already verified.
5. **Exclude both alternatives.** The argument must exclude nontrivial cycles
   and divergent trajectories; a valid global descent theorem may discharge
   both at once.
6. **Completion bridge.** If a \(2\)-adic or other completion is used, prove
   that its result restricts to the positive-integer dynamics with the required
   order and termination properties. Topological density in a completion does
   not imply integer termination.

### Collatz analogy cheats

- replacing “every integer terminates” by local computability of every finite
  orbit segment;
- equating absence of a uniform stopping-time bound with a counterexample;
- using average contraction, probability, entropy, or empirical frequency as
  deterministic descent;
- treating a finite residue graph as exhaustive without an inductive closure
  theorem;
- inferring integer behavior from continuity or density in a completion;
- calling an algorithm that simulates the orbit a global primitive.

## 6. Minimum obligation: the Riemann hypothesis

The native target is that every nontrivial zero of \(\zeta(s)\) has real part
\(1/2\). A proof claim based on causal-resolution geometry must satisfy one of
two complete routes, not fragments of both.

### Spectral route

1. Construct a precisely defined operator on a specified Hilbert space with a
   proved dense domain, closure properties, and self-adjointness.
2. Prove an exact correspondence, including multiplicity, between its spectrum
   and the imaginary parts of **all** nontrivial zeta zeros.
3. Prove both directions: every zero gives spectral data and every relevant
   spectral datum gives a zero. A finite-height match is insufficient.
4. Control continuous spectrum, spurious eigenvalues, domain artifacts, and
   limiting spectral pollution.

### Positivity or analytic route

1. State a criterion already proved equivalent to RH for the full required
   class of test objects.
2. Derive the required positivity or zero-free statement uniformly, not on a
   finite basis or bounded-height sample.
3. Handle analytic continuation, the pole, trivial zeros, the functional
   equation, growth, and multiplicity wherever the chosen criterion requires
   them.

A disproof requires a rigorously certified nontrivial zero off the critical
line. Failure of a spectral model to capture a zero proves only that the model
is incomplete.

### Riemann-hypothesis analogy cheats

- treating functional-equation symmetry about the critical line as proof that
  zeros lie on it;
- calling a combinatorial involution self-adjoint without an analytic domain;
- matching finitely many zeros or local statistics;
- assuming every formally real eigenvalue corresponds to a zeta zero;
- using a determinant or trace formula before proving convergence and exact
  equality with the completed zeta function;
- confusing reciprocal polynomial roots on a finite model with the global
  analytic zero set.

## 7. Shared structural cheats

The following patterns are presumptively fatal across all four frontiers.

1. **Local-to-global universal solvent.** The phrase names a shape of problem,
   not a theorem connecting four kinds of globalization.
2. **Bound conflation.** PDE regularity bounds, algebraic degree bounds,
   stopping-time bounds, and operator bounds live in different ordered
   structures and have different quantifiers.
3. **Name transport.** A loop is not automatically vorticity, monodromy, an
   integer cycle, and a zeta zero.
4. **Completion fallacy.** Existence of a limit datum neither supplies nor
   forbids a smooth solution, algebraic cycle, terminating orbit, or critical
   zero.
5. **Missing global primitive fallacy.** Failure of a selected ansatz or
   bounded presentation does not prove that no native global object exists.
6. **Degree laundering.** A high-degree obstruction does not become ordinary
   transport merely because a resolution event is drawn as a graph edge.
7. **Epistemic cell structure.** “No filler is currently known” is not a
   nontrivial homology class. The admissible-cell rule must be semantic and
   complete for the finite fixture.
8. **Hidden clock or oracle.** The constructor may not read the iteration
   number, target answer, future table, unbounded proof search outcome, or a
   preclassified list of successful inputs.
9. **Finite-to-uniform leap.** Exact results at every separately tested cutoff
   do not give one cutoff-independent theorem.
10. **Unproved conservativity.** A realization functor may collapse the very
    obstruction claimed to survive or create target artifacts not present in
    the source.
11. **Probability substitution.** High probability, genericity, density, and
    statistical fit do not establish any of the four deterministic universal
    claims.
12. **Symmetry broken by presentation.** A selected basis, gauge, mesh, local
    primitive, or coefficient lift must not be mistaken for canonical output.

## 8. Shared controls before frontier-specific work

Every realization must pass the same audit battery.

### Typing and quantifiers

- Serialize the source and target type of every cell, map, filler, limit, and
  certificate.
- Write the quantifiers in prenex form and test that truncation parameters do
  not appear in the final bound.
- Distinguish existence, construction, verification, and nonexistence.

### Naturality and presentation independence

- Apply basis changes, gauge changes, mesh relabelings, cover refinements,
  duplicate generators, and equivalent coefficient presentations.
- Require equivariant output of the whole module or certificate, never a
  secretly selected vector.
- Compare two independent presentations of the same native object.

### Stutter and negative controls

- A resolved or zero-obstruction input must not generate a new direction.
- A coherently commuting repair square must have zero causal curvature.
- Adding a certified interchange filler must kill exactly its cellular boundary.
- A false nearby statement must be rejected rather than “proved” by the same
  syntax.

### Causality and answer leakage

- Delete stage counters, future tables, expected endpoint labels, and known
  solution data.
- Run off-family states and permuted histories.
- Ensure two naked-equal endpoints with inequivalent certified genealogies are
  not silently merged; also ensure gauge-equivalent genealogies are not counted
  twice.

### Certificate integrity

- Use exact arithmetic where finite exact arithmetic is available.
- Bind certificates to their input, presentation policy, and admitted-cell
  rules.
- Tamper with every field and require rejection.
- Have an independent implementation reconstruct the boundary maps and replay
  the certificate.

### Uniformity stress

- Increase resolution, dimension, degree, orbit depth, or spectral height
  without changing the construction law.
- Track which constants grow with the cutoff.
- Include adversarial families designed to concentrate mass, increase gluing
  complexity, delay descent, or create spectral pollution.

## 9. Small finite toys that could genuinely raise the posterior

Finite toys raise the posterior only when they test a mechanism that can be
stated independently of the famous target and when the same implementation
rejects matched countercontrols.

### 9.1 Shared causal-resolution fixture

Build one finite presentation-bearing repair system with two mutually
executable residual questions. Compute its two-step cellular complex exactly.
Include:

- a commuting fixture whose certified interchange cell kills the square loop;
- an unfilled synthetic square with one binary class;
- the same square after adding the missing filler;
- duplicate-generator, basis-change, and gauge-origin presentations; and
- a counterfeit loop created solely by endpoint identification.

This validates the causal-holonomy detector. It does not validate any frontier
realization.

### 9.2 Navier--Stokes toy

Use exact rational finite-mode systems with a quadratic interaction satisfying
the discrete incompressibility/skew-energy identity. Pair:

- a linear Stokes or dissipative fixture where the resolution cells derive the
  exact energy law;
- a nonlinear energy-preserving transfer fixture where energy remains bounded
  while a higher-mode norm grows; and
- a counterfeit discretization that violates the skew identity.

The mechanism earns interest only if it distinguishes energy control from
regularity control and derives a mode-cutoff-independent estimate in a
nontrivial hierarchy. Global smoothness of each finite ODE is not evidence for
the PDE claim.

### 9.3 Hodge toy

Use exact rational matrices for a finite Cech/double-complex model with an
explicit cycle-class subspace. Include one class that glues to the declared
cycle subspace and one locally compatible class outside it. The realization
must compute the actual cokernel and remain invariant under cover refinement
and basis change. A stronger fixture can use varieties whose relevant cycle
classes are already explicitly known and verify that the construction recovers
them without being given their basis as the answer.

Posterior gain comes from deriving the cycle-class obstruction from primitive
incidence geometry—not from observing that both constructions have cohomology.

### 9.4 Collatz toy

Define a finite family of piecewise-affine integer maps with exact residue
certificates. Include:

- a map with a genuine well-founded block-descent proof;
- a map with strong average descent but a hidden nonterminal cycle;
- a map whose finite residue quotients look descending while one lifted branch
  escapes; and
- presentation-equivalent residue systems.

The engine must synthesize and verify the first certificate while rejecting
the others. For the actual Collatz map, a finite modulus experiment matters
only if it discovers a height-independent inductive closure rule; checking a
larger modulus alone adds computation, not mechanism.

### 9.5 Riemann-hypothesis toy

Use exact self-reciprocal polynomials and finite self-adjoint matrices. Include:

- a characteristic polynomial whose roots are certified by a self-adjoint
  realization;
- a reciprocal polynomial with roots symmetric under the expected involution
  but with an off-circle pair; and
- a truncation sequence exhibiting a spurious eigenvalue that disappears at
  the next size.

The engine must reject “symmetry implies critical-line location” and spectral
pollution. Posterior gain requires an exact, size-compatible determinant or
positivity identity, not a finite zero match.

## 10. Cross-realization audit

After the four toys pass independently, test the proposed common structure
without assuming equivalence.

1. **Same syntax:** verify that all four encodings instantiate the same formal
   cell and filler rules rather than four homonymous constructions.
2. **Different semantics:** print a typing table showing what each source cell,
   boundary, and filler becomes in each target.
3. **Vanishing allowed:** permit a nonzero source invariant to map to zero in a
   target unless target-specific conservativity has been proved.
4. **No proof teleportation:** a certificate in one realization may not be
   transported to another without an explicit comparison map and soundness
   theorem.
5. **Matched ablation:** remove the proposed common causal feature. Each target
   prediction should fail in its own native way; identical rhetoric is not an
   ablation result.
6. **Counterexample separation:** a negative fixture in one target must not
   force false rejection in an unrelated target. This checks that the common
   structure is not merely a universal “failure” label.

The strongest legitimate outcome at this stage would be:

> One autonomous resolution calculus supports four independently sound finite
> realizations, and one invariant predicts a nontrivial native obstruction in
> each matched toy while rejecting its controls.

That would justify further research. It would still establish none of the four
frontier theorems.

## 11. Kill criteria

Stop promoting the unified hypothesis if any of the following persists after
repair:

- the common construction cannot be stated without target-specific answer data;
- its nonzero invariant depends on a basis, gauge, mesh, cutoff, stage counter,
  or missing-but-uncatalogued coherence;
- the source invariant has no proved map to the native target predicate;
- a matched false toy is accepted;
- uniform constants diverge while the narrative calls the divergence
  “transcendence”;
- the realization proves only that finite approximants exist;
- the four applications share vocabulary but no common executable law.

## Claim boundary

- This document is a falsification protocol, not evidence for a unified theory.
- The four realization functors in (1) have not been constructed.
- No soundness, completeness, conservativity, or uniformity theorem in (2) is
  claimed.
- No Navier--Stokes, Hodge, Collatz, or Riemann-hypothesis result is claimed.
- No novelty or prior-art conclusion is claimed.
