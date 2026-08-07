# Four-Frontier Compatibility Scaffold

## Status: a typed research interface, not a route to four solutions

This note asks a deliberately limited question:

> What would one algebraogenetic structure have to contain before it could
> even formulate non-metaphorical routes toward three-dimensional
> Navier--Stokes regularity, the Hodge conjecture, Collatz, and the Riemann
> hypothesis?

It supplies a compatibility scaffold only. It proves none of the four
statements, does not assert that they share a hidden proof, and does not treat
similar vocabulary as evidence of a mathematical connection.

The first constraint is already substantive. A **single structure** cannot
mean one untyped chain complex into which velocity fields, algebraic cycles,
integer orbits, and zeta zeros are placed. Those objects live in different
categories and their notions of exactness, completion, size, and spectrum are
not interchangeable. The viable meaning of "single" is one typed
causal-resolution architecture with problem-specific fibers and explicit
realization maps.

## 1. The minimum common architecture

For a problem instance `X`, write a causal-resolution datum schematically as

\[
\mathfrak G(X)=
(\mathcal J_X,C_X,\mathcal Q_X,\Gamma_X,\Theta_X,
 \operatorname{Asm}_X,\widehat{(-)}_X,\Phi_X,
 \mathcal B_X,\Sigma_X,\rho_X).
\tag{1}
\]

Every symbol in (1) is a typed role, not a claim that the same concrete object
works in all four problems.

### 1.1 Finite contexts and generated complexes

`J_X` is a directed refinement category of finite, local, or bounded contexts.
It need not be a linearly ordered sequence. Examples of context parameters
could include spatial scale and time window, an algebraic cover and degree
cutoff, a congruence modulus and height window, or a prime/zero/test-function
window.

`C_X` is a functor

\[
C_X:\mathcal J_X\longrightarrow
\operatorname{Ch}(\mathcal A_X)
\tag{2}
\]

into a declared category of complexes, or into a declared homotopical
replacement when ordinary additive chain complexes are insufficient. The
coefficient category `A_X` is part of the type. It cannot silently change from
Sobolev spaces to rational Hodge structures, from integer modules to Hilbert
spaces, or from algebraic cycles to differential forms.

The word **generated** means that new cells, observables, or relations arise
from the current unresolved datum. It does not mean that an arbitrary future
complex is read from a stage-indexed table.

### 1.2 Typed questions and obstruction objects

`Q_X(j)` is the space, groupoid, or higher groupoid of admissible questions and
their local solutions at context `j`. A question has:

- a solution or primitive type;
- a restriction law to smaller contexts;
- an obstruction type measuring failure of compatible solution;
- a declared equivalence or gauge relation; and
- a semantic interpretation in the original problem.

An obstruction may be a cohomology class, a failure of compactness, a defect
measure, a descent cocycle, a missing well-founded decrease, or a failed
positivity inequality. Calling all of these "cohomology" would erase the
essential typing.

### 1.3 Causal exactification

`Gamma_X` is an autonomous resolver. Given a present context and an unresolved
question, it constructs a refined context and a generic primitive or solution:

\[
(j,q)\longmapsto
(j^+,p_q),
\qquad d p_q=q
\tag{3}
\]

when equation (3) is meaningful in that fiber. More generally, `p_q` is an
initial lift in the declared solution category.

The minimum genesis laws are:

1. **semantic descent:** equivalent presentations produce equivalent
   successors;
2. **resolved stutter:** an already resolved question creates no semantic
   growth;
3. **zero-obstruction stutter:** deleting the causal obstruction deletes the
   proposed innovation;
4. **no hidden clock:** the resolver does not recover a stage invariant merely
   to replay a supplied family;
5. **initiality:** the added primitive is generic rather than a secretly chosen
   basis, origin, branch, or future answer; and
6. **new-question generation:** relations among the new primitives, rather
   than an external schedule, determine the next admissible questions.

Formal exactification alone is not semantic progress. The realization map in
Section 1.10 must show what the new primitive means in the original problem.

### 1.4 Causal 2-cells

`Theta_X` contains specified 2-morphisms comparing different refinement and
resolution paths. A square

\[
\require{AMScd}
\begin{CD}
j @>>> j_1\\
@VVV @VVV\\
j_2 @>>> j_{12}
\end{CD}
\tag{4}
\]

must come with either a coherence 2-cell, a measured holonomy, or an explicit
statement that no comparison exists. These cells distinguish:

- presentation changes from semantic changes;
- commuting local resolutions from path-dependent ones;
- removable gauge discrepancy from a residual obstruction; and
- a genealogy carried by the path from an invariant of the endpoint fossil.

They are categorical witnesses. They are not automatically physical surfaces,
algebraic 2-cycles, or homotopies of number-theoretic orbits.

### 1.5 Local-to-global assembly

`Asm_X` is a declared comparison from compatible local solution data to a
global target:

\[
\operatorname{Asm}_X:
\varprojlim_{j\in\mathcal J_X}
\operatorname{Sol}_X(j)
\longrightarrow
\operatorname{Sol}^{\mathrm{global}}_X.
\tag{5}
\]

The map may fail to be defined, injective, or surjective. The architecture
must state which failure is at issue. A local-to-global slogan becomes useful
only after all four items are fixed:

1. what counts as local data;
2. what compatibility means;
3. what the global target category is; and
4. which obstruction controls the comparison.

### 1.6 Completion

`widehat{(-)}_X` specifies a topology, norm, uniformity, filtration, or derived
completion and its comparison maps. The datum must distinguish

\[
\operatorname{colim}_j C_X(j),
\qquad
\widehat{\operatorname{colim}_j C_X(j)},
\qquad
C_X^{\mathrm{semantic}}.
\tag{6}
\]

These need not agree. The scaffold must record:

- which finite objects are dense;
- whether the completion introduces non-semantic generalized objects;
- which properties are closed under the chosen convergence;
- whether primitives, bounds, and equations survive the limit; and
- whether a completed solution can be recovered in the original target
  category.

Completion is a carrier of limits, not an explanation of why a global
primitive fails or exists.

### 1.7 Dynamics

`Phi_X` is the actual evolution law: a flow or semigroup, a discrete arithmetic
map, a refinement action, or another declared dynamical object. It acts on the
semantic fiber and must interact coherently with the generated complexes.
Irreversibility is permitted. The architecture requires forward continuation,
not reconstruction of every earlier state.

A chain differential and a time-evolution operator are different maps. If
they interact, the compatibility equation or 2-cell must be supplied.

### 1.8 Quantitative control

`B_X` is a problem-specific, partially ordered family of controls: norms,
energies, degrees, heights, conductors, stopping functions, moduli, or operator
bounds. There is no universal scalar "complexity" suitable for all fibers.

For a refinement law to support a global theorem, one typically needs an
estimate of the form

\[
\mathcal B_X(j^+)
\preceq
F_X\bigl(\mathcal B_X(j),\text{controlled input}\bigr)
\tag{7}
\]

that is uniform in the relevant refinement variables and strong enough to
yield compactness, continuation, descent, properness, or positivity in the
native problem. Finite realizability without a propagation estimate is not a
global result. Conversely, failure of a constant uniform bound may be
irrelevant when the theorem only requires an input-dependent bound.

### 1.9 Spectral package

`Sigma_X` assigns a declared operator or correspondence to relevant contexts,
together with its domain, adjointness or normality properties, spectrum type,
and comparison across refinements. "Spectral" may mean:

- the spectrum of the Stokes or Laplace operator;
- harmonic decomposition for a chosen metric;
- a transfer operator for a discrete map;
- eigenvalues of a geometric or arithmetic correspondence; or
- a hypothetical self-adjoint realization tied to zeta zeros.

Those meanings are not interchangeable. Any bridge from spectrum to the
target statement needs an exact trace, determinant, positivity, or
continuation theorem. A numerically suggestive spectrum is not such a bridge.

### 1.10 Semantic realization

Finally, `rho_X` maps generated and completed resolution data back to the
native problem:

\[
\rho_X:\mathfrak G(X)\longrightarrow
\operatorname{Target}_X.
\tag{8}
\]

This is the anti-metaphor interface. It must prove that:

- a generated PDE object still satisfies the PDE and admissibility conditions;
- a Hodge primitive is an actual rational algebraic cycle when that is the
  target;
- an arithmetic certificate refers to every positive integer orbit, not only
  to an extension or distribution; and
- an RH spectral or positivity certificate is exactly equivalent to the
  location of every nontrivial zero.

Without (8), the architecture may be mathematically interesting but has not
entered the frontier problem.

## 2. The shared mechanism, stated without frontier vocabulary

The maximal common mechanism presently justified as a research schema is:

\[
\boxed{
\begin{array}{c}
\text{finite typed question}\\
\downarrow\\
\text{intrinsic obstruction or failed compatibility}\\
\downarrow\;\Gamma\\
\text{generic exactification / primitive object}\\
\downarrow\\
\text{relations among primitives become new questions}\\
\downarrow\;\Theta\\
\text{coherent refinement diagram}\\
\downarrow\;\widehat{(-)},\operatorname{Asm},\mathcal B\\
\text{candidate global semantic conclusion}
\end{array}}
\tag{9}
\]

The current algebraogenesis work supplies rigorous finite models for parts of
the upper half of (9): obstruction-sensitive stuttering, exactification,
syzygy generation, higher-versus-ordinary transport typing, and causal
coherence. It does not yet supply the frontier-specific realization,
quantitative propagation, or global assembly maps in the lower half.

## 3. Problem-specific dictionaries

The following entries are compatibility requirements, not proposed proofs.

### 3.1 Three-dimensional Navier--Stokes regularity

**Native target.** A global smooth solution, with the standard uniqueness and
continuation properties, for every admissible smooth divergence-free initial
datum in the stated setting.

**Finite contexts.** Bounded time intervals, spatial/frequency localizations,
Galerkin or cellular models, and scale windows. A context must retain the
divergence constraint, pressure treatment, boundary/domain conditions, and
the nonlinear convection term.

**Generated complex.** A candidate complex could organize local conservation
laws, pressure compatibility, scale-to-scale flux, or defects of compatible
continuation. The velocity evolution itself is nonlinear and is not thereby a
cochain differential.

**Exactification.** It could mean resolving a local compatibility or flux
defect by exposing a finer scale or interaction cell. Adjoining a formal
primitive must not be mistaken for smoothing the velocity field.

**Completion and assembly.** The completion is naturally weak or Sobolev-like
only after the function spaces and convergence are declared. The key assembly
problem is passage from controlled approximants or weak solutions to a global
regular solution while preserving the nonlinear term and excluding
concentration or oscillation loss.

**Causal 2-cells.** These would compare evolution-then-refinement with
refinement-then-evolution, or compare overlapping local continuation charts.
Their residual could encode unresolved multiscale flux or incompatibility.

**Required bounds.** The architecture must produce an a priori estimate in a
continuation-controlling class, uniform over the approximation/refinement and
compatible with Navier--Stokes scaling. The basic energy inequality alone does
not close this interface.

**Spectral role.** The Stokes/Laplacian spectrum and frequency decomposition
may organize dissipation and transfer. Spectral decomposition of the linear
part does not control the nonlinear cascade by itself.

**Minimum success interface.** The realization map must turn the generated
resolution law into a genuine critical or stronger bound that prevents finite
time singularity and justifies continuation. Anything weaker has not reached
regularity.

### 3.2 The Hodge conjecture

**Native target.** For a smooth projective complex variety and a rational
cohomology class of Hodge type `(p,p)`, produce a rational algebraic cycle
whose cycle class is the given class.

**Finite contexts.** Algebraic covers, hypercovers, bounded-degree cycle data,
incidence conditions, and finite pieces of a derived or descent presentation.
The context must retain the field, rational structure, codimension, and
algebraic—not merely analytic—category.

**Generated complex.** Candidate complexes may organize local cycle data,
rational equivalences, intersection constraints, and higher gluing
compatibilities. Differential forms or harmonic representatives can be a
comparison realization, not a replacement for the cycle complex.

**Exactification.** The relevant primitive must eventually be an algebraic
cycle or a certified step in constructing one. Exactness in de Rham,
distributional, current, or completed cochain categories is insufficient.

**Completion and assembly.** Analytic, formal, topological, and degree
completions are distinct. A limit of algebraic cycles need not be an algebraic
cycle in the required sense. The assembly map must descend local algebraic
data through rational equivalence to a global rational cycle.

**Causal 2-cells.** These could encode changes of cover, refinements of local
cycles, and equivalences between gluing paths. They must respect rational
equivalence and the cycle-class map.

**Required bounds.** Degree, height, number of components, or complexity of
gluing may be useful compactness controls. But the Hodge conjecture is an
existence statement and does not itself assert one constant bound uniform over
all varieties and classes. Failure of such a bound would not refute it.

**Spectral role.** A Kähler metric supplies harmonic representatives and a
Hodge Laplacian. Algebraicity is metric-independent. Therefore spectral data
can identify the Hodge-type class but cannot, without a new theorem, certify
that it lies in the image of the algebraic cycle map.

**Minimum success interface.** Starting with a rational `(p,p)` class, the
realization map must output an actual rational algebraic cycle and verify
equality under the cycle-class map. A local primitive or harmonic residue is
not enough.

### 3.3 Collatz

**Native target.** Every positive integer orbit of the specified Collatz map
eventually reaches the `1-2-4` cycle, or the corresponding terminal state for
the chosen accelerated convention.

**Finite contexts.** Finite orbit prefixes, height windows, parity words,
congruence quotients, and compatible families across moduli. The precise map
and convention must be fixed.

**Generated complex.** A candidate complex could organize congruence-compatible
orbit segments, branch relations, return paths, and obstructions to a
well-founded descent certificate. It must not include "run until reaching 1"
as a hidden generator rule.

**Exactification.** It could resolve an ambiguous finite parity/congruence
question or adjoin a certified return relation. Exactifying all finite orbit
prefixes does not imply that an infinite positive-integer orbit terminates.

**Completion and assembly.** Profinite or `p`-adic completions organize all
finite congruence views, but they contain noninteger points and may support
orbits irrelevant to the positive integers. Density of integer data in a
completion is neither termination nor nontermination.

**Causal 2-cells.** These would compare orbit continuation with change of
modulus or refinement of a parity word. A global integer orbit must map to a
coherent path through the diagram, but not every coherent path through the
completion need come from a positive integer orbit.

**Required bounds.** The natural control is an input-dependent proper height,
stopping certificate, or well-founded ranking law. A uniform constant stopping
time over all positive integers is neither required nor plausible. Statistical
negative drift is insufficient unless all exceptional orbits are eliminated.

**Spectral role.** Transfer operators or spectra of congruence graphs may
describe average mixing or parity statistics. They do not yield a pointwise
termination theorem without a bridge from spectral control to every integer
orbit.

**Minimum success interface.** The realization map must provide, for every
positive integer, a finite certified descent/return argument in a well-founded
order, with no measure-zero or density-zero exceptional set.

### 3.4 The Riemann hypothesis

**Native target.** Every nontrivial zero of the Riemann zeta function has real
part `1/2`.

**Finite contexts.** Finite prime sets, bounded zero windows, admissible test
function spaces, Euler-factor truncations, and controlled pieces of an
explicit-formula or trace-like identity.

**Generated complex.** A candidate complex could organize prime-local data,
functional-equation compatibility, test-function relations, and discrepancies
between finite trace data and a global analytic object. The construction must
not assume analytic continuation or the zero set it seeks to explain.

**Exactification.** It might mean resolving finite trace discrepancies or
constructing primitives for prime/zero duality relations. Formal cancellation
in a generated complex does not move or constrain the actual zeros.

**Completion and assembly.** The Euler product initially controls only its
domain of convergence, whereas the completed zeta function and its nontrivial
zeros require analytic continuation and the functional equation. A completion
of finite Euler products is not automatically the completed zeta function.

**Causal 2-cells.** These could compare enlarging the prime window, enlarging
the test-function class, and analytic continuation along compatible domains.
Their coherence would need to reproduce an exact global trace or explicit
formula, not merely numerical agreement.

**Required bounds.** Candidate controls include uniform error in trace
approximations, growth of the completed function, resolvent bounds, or
positivity over a complete test-function class. A finite verification window
cannot control all zeros.

**Spectral role.** A Hilbert--Pólya-type route would require a genuinely
self-adjoint operator with a specified dense domain, whose spectrum is proven
to correspond exactly to the imaginary parts of all nontrivial zeros and whose
determinant or trace formula matches zeta. Self-adjointness cannot be inferred
from real-looking numerical eigenvalues.

**Minimum success interface.** The realization map must establish an exact
equivalence between the generated positivity/spectral statement and the
location of every nontrivial zero. Matching finitely many zeros or finite Euler
factors is not enough.

## 4. The shared roles and the four different dictionaries

| Shared role | Navier--Stokes | Hodge | Collatz | RH |
|---|---|---|---|---|
| Native semantic object | Nonlinear velocity evolution | Rational Hodge class and algebraic cycles | Positive-integer orbit | Completed zeta function and all nontrivial zeros |
| Finite context | Scale/time/spatial window | Algebraic cover and bounded cycle data | Orbit/congruence/height window | Prime/zero/test-function window |
| Obstruction | Continuation or compactness defect | Failure to assemble an algebraic cycle | Failure of certified well-founded descent | Failure of global positivity/trace/spectral realization |
| Exactification | Resolve a compatible local defect | Construct algebraic descent data | Certify a return/descent relation | Resolve a trace or positivity relation |
| Completion danger | Weak limits lose nonlinear compactness | Analytic/formal limits leave algebraic category | `p`-adic/profinite points are not positive integers | Euler-product limits do not supply analytic continuation |
| Quantitative control | Critical continuation norm | Degree/height/gluing controls, if relevant | Proper input-dependent height | Global analytic, trace, resolvent, or positivity bounds |
| Spectral data | Stokes/Laplacian/frequency | Hodge Laplacian | Transfer or congruence operator | Exact self-adjoint/trace realization, if one exists |
| Required global output | Smooth global solution | Rational algebraic cycle | Termination for every positive integer | Every nontrivial zero on the critical line |

The table identifies roles, not equivalences. In particular, its four entries
in any row may obey entirely different theorems.

## 5. Hard interfaces that cannot be bypassed by vocabulary

### Interface A: generated complex to native semantics

One must prove that cells, cocycles, and primitives compiled by the genesis
law correspond to actual PDE, cycle, orbit, or zeta data. A beautiful internal
complex with an unspecified realization map is not progress on the frontier.

### Interface B: formal exactness to problem-theoretic resolution

Adjoining `p` with `dp=q` always makes `q` exact in a free extension. The hard
question is whether that extension is admissible in the native category and
whether it resolves the original obstruction rather than changing the
problem.

### Interface C: local compatibility to global existence

Compatible finite pieces need a proved descent or compactness theorem. An
inverse limit can contain generalized, nonalgebraic, noninteger, nonregular, or
otherwise inadmissible points.

### Interface D: nonlinear dynamics to linear complexes

Chain, Hodge, and spectral tools are usually linear. Navier--Stokes convection
and Collatz branching are nonlinear. Their linear encodings require lossless
or quantitatively controlled realization theorems; linearization cannot be
silently treated as equivalence.

### Interface E: causal 2-cells to actual identities

A formal square is useful only when its sides are real refinement/evolution
maps and its 2-cell expresses a genuine homotopy, gauge, descent, or error
identity. Otherwise higher-categorical language is decorative.

### Interface F: completion to target-category recovery

The completion must neither manufacture a solution by enlarging the target
category nor erase the obstruction through a nonfaithful quotient. The
comparison back to native objects is load-bearing.

### Interface G: bounds to compactness, continuation, or properness

The chosen controls must be uniform in exactly the variables taken to a limit,
and they must imply the required native conclusion. "Complexity grows" or
"energy stays finite" is too weak without the relevant coercive theorem.

### Interface H: spectral surrogate to exact target spectrum

Isospectral or nearly isospectral finite surrogates can differ semantically.
RH additionally requires that the operator, spectrum, multiplicities, and
trace/determinant identity match zeta exactly. Hodge algebraicity and Collatz
pointwise termination are not spectral conclusions without separate bridges.

### Interface I: statistical control to universal quantification

Probability-one regularity, density-one termination, average drift, and
finite-window zero verification do not establish statements quantified over
every datum or every zero. Exceptional-set elimination is a distinct theorem.

### Interface J: existence to uniform bounded existence

The four targets ask for different quantifiers. Hodge and Collatz do not ask
for one constant degree or stopping-time bound over all inputs. Navier--Stokes
needs a continuation-controlling estimate for each admissible datum with the
correct uniformity over approximation. RH needs a global statement over an
unbounded zero set. A single phrase such as "bounded global section" cannot
replace these quantifiers.

## 6. Decisive falsification tests

The architecture should be rejected or sharply narrowed if it fails any
applicable test below.

### 6.1 Cross-frontier tests

1. **Typing test.** Write the domain and codomain of every differential,
   dynamics map, completion map, assembly map, and realization map. Any step
   that equates objects from different categories without a functor fails.
2. **Presentation test.** Equivalent finite presentations must give equivalent
   generated successors. Raw cell count, basis order, truncation label, or
   stage number cannot drive semantic growth.
3. **Resolved and zero ablations.** A resolved question and a deleted
   obstruction must stutter. If the same innovation appears, growth is not
   obstruction-caused.
4. **Future-table deletion.** Remove precomputed higher stages. The current
   object must still generate its successor from its universal construction.
5. **Completion-leakage test.** Exhibit the generalized points added by the
   completion and prove that the claimed conclusion returns to the native
   target category. Failure here invalidates the application.
6. **Local-to-global adversary.** Test on a system where every finite question
   is solvable but compatible global assembly is known to fail, and on one
   where assembly succeeds. A useful invariant must distinguish them rather
   than restate finite solvability.
7. **Bound-propagation test.** Force refinement into the most singular,
   high-degree, high-height, or high-frequency regime. If the controlling
   estimate silently depends on the cutoff, it cannot justify the limit.
8. **Circularity test.** Delete any generator that was computed using the
   sought global answer: blow-up time, algebraic cycle, eventual Collatz
   return, analytic continuation, or zero list. The procedure must remain
   defined.
9. **Spectral impostor test.** Replace the finite operator by an isospectral or
   near-isospectral surrogate with different native semantics. If the method
   cannot detect the substitution, the spectrum is insufficient.
10. **Off-family test.** Apply the law to semantically valid inputs outside the
    training/example tower. A rank-decoded or fixture-replaying construction
    will reveal itself here.

### 6.2 Frontier-specific kill tests

**Navier--Stokes.** Subject the method to scale concentration and oscillatory
weakly convergent sequences. If it preserves only energy while losing the
nonlinear term or a continuation-controlling norm, it has not addressed
regularity. Verify the Navier--Stokes scaling of every proposed bound.

**Hodge.** Demand the final object in the rational Chow/cycle domain and check
its cycle class. If the construction returns only a harmonic form, analytic
current, formal cycle, or limit of unbounded degree without algebraic recovery,
it fails the target type. Change the Kähler metric: the algebraicity conclusion
must not depend on that auxiliary choice.

**Collatz.** Test congruence-compatible and `p`-adic paths that do not arise
from the relevant positive-integer initial conditions. If they are counted as
proof objects, the completion is too large. Remove all probabilistic language
and ask for the certificate on an arbitrary individual input; failure exposes
an average-to-universal gap.

**RH.** Test the scaffold on analytic functions engineered to mimic large
finite portions of the Euler/zero/functional-equation data while having an
off-line zero. If the invariant cannot distinguish them, finite compatibility
is inadequate. For a spectral route, demand operator domain, self-adjointness,
complete spectral correspondence, multiplicities, and an exact global trace or
determinant formula.

## 7. A plausible single next object

The smallest object that appears compatible with all roles is not a universal
algebra but a **quantitatively controlled causal resolution fibration**:

\[
\pi:\mathcal R\longrightarrow\mathcal P,
\tag{10}
\]

where `P` is a category of typed problem instances and each fiber `R_X`
contains:

- the directed finite-context category;
- the local primitive higher groupoids;
- a generated resolution complex or nerve;
- causal 2-cells between refinement paths;
- a completion and assembly comparison;
- problem-native bounds and dynamics; and
- a certified semantic realization.

One possible internal organization is a bicomplex or spectral sequence:

- the **vertical** direction resolves an obstruction by primitives and retains
  its higher Postnikov band;
- the **horizontal** direction records relations among those primitives and
  exposes syzygetic transport; and
- a mixed differential or transgression asks whether vertical unresolved
  geometry canonically produces new horizontal questions.

This organization connects directly to the present algebraogenesis results.
It still leaves three major hypotheses open:

1. that the primitive/lift higher groupoid is canonically generated from each
   native semantic object;
2. that its horizontal syzygies admit a faithful native realization; and
3. that the native quantitative controls survive indefinite refinement and
   are strong enough for the desired global conclusion.

Those hypotheses are where the four frontier problems diverge. Any one of them
may fail in any or all fibers.

## 8. Research order

Before specializing this scaffold to a frontier, the next foundational work
should establish the following on controlled examples:

1. construct the local-lift higher groupoid from an actual semantic
   obstruction rather than from a declared degree-lowering type-former;
2. derive its nerve or incidence complex and identify the horizontal syzygy
   module;
3. test whether a canonical transgression connects the vertical band to that
   module;
4. prove resolved-state contractibility and zero-obstruction stuttering;
5. add a quantitative valuation and prove it propagates through exactification;
6. specify a completion and demonstrate both a successful and a failed
   local-to-global assembly; and only then
7. instantiate one frontier dictionary and prove the semantic realization
   map before invoking its headline conjecture.

The sober common insight is therefore narrower than a universal solution and
stronger than analogy:

> All four frontiers can be asked whether an intrinsic failure of compatible
> finite resolution generates a new question complex whose coherences and
> quantitative bounds control global assembly. They cannot share a theorem
> until the generated complex is faithfully realized in each problem's native
> category.
