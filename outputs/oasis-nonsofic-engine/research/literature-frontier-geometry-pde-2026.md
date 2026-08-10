# Geometry/PDE frontier sweep for causal-resolution genesis

## Status: source-backed interface map, not an open-problem claim

**Collected:** 2026-08-10

**Frontier window:** 2023-01-01 through 2026-08-10, with older work admitted only when it is load-bearing

**Method:** Bright Data Discover and exact-page scraping through `@brightdata/cli v0.3.3`; 30 intent-separated discovery calls, 330 raw rows, 321 distinct URLs, 234 content-passing URLs after the null/short/block-page gate, and 124 primary-or-official-looking URLs before manual review

**Project question:** Which current mathematical structures are exact interfaces, falsifiers, or construction hints for *causal-resolution genesis*--especially the hypothesis that an obstruction-selected lift fibration can refine the observable/representation algebra through its monodromy?

Two boundaries are non-negotiable.

1. The Hodge conjecture and the classical three-dimensional Navier--Stokes existence-and-smoothness problem are officially **unsolved** as of the collection date.[1][2]
2. Nothing retrieved proves that genesis advances either problem. The credible outcome of the sweep is a sharper candidate object and a list of theorem obligations that would have to be discharged before either problem became a legitimate target.

The strongest conclusion is this:

> The nearest existing mathematics already provides every *static ingredient*--homotopy fibers, obstruction towers, monodromy, higher holonomy, sheaves of solution spaces, rough-path signatures, equation-generated regularity structures, vanishing cycles, scale induction, and computer-assisted residual bounds. What it does not provide is one endogenous law that uses a current failed lift to enlarge the admissible observable/representation grammar, retains the entire policy-indexed diagram of solution homotopy types, and can iterate without a stage counter or a predeclared global language.

That missing law is narrower, cleaner, and more testable than a claim of a new Hodge theory or a new PDE solver.

---

## 1. The candidate object exposed by the sweep

The current nullification-fiber experiment chooses one coefficient policy from a declared finite class and then studies the selected lift fiber. The literature suggests that choosing one policy too early loses the most informative object. Retain the complete diagram instead.

Let

\[
  \mathsf B_n
\]

be the current semantic path groupoid (presentations, retained causal paths, and declared gauge 2-cells), and let

\[
  \mathsf P_n
\]

be the current relation/coefficient-policy category. Define a diagram of realization spaces

\[
  \mathsf{Lift}_n:
  \mathsf B_n^{\mathrm{op}}\times\mathsf P_n^{\mathrm{op}}
  \longrightarrow \mathcal S,
\]

where `S` is the infinity-category of spaces. For a policy `p`, the homotopy type `Lift_n(b,p)` retains more than an existence bit:

- an empty fiber records incompatibility;
- a contractible fiber records a unique realizer up to the declared gauge;
- a disconnected or higher-homotopical fiber records choices, automorphisms, and coherence that must not be silently quotiented away.

Its Grothendieck construction

\[
  \int \mathsf{Lift}_n
  \longrightarrow
  \mathsf B_n\times\mathsf P_n
\]

is the policy-indexed lift fibration. Automorphism loops in `B_n`, and loops in an action groupoid built from policies and their symmetries, may act on the homotopy groups of its fibers:

\[
  \rho_{n,p}:\Pi_1(\mathsf B_n,b)
  \longrightarrow
  \operatorname{Aut}\bigl(\pi_*\mathsf{Lift}_n(b,p)\bigr).
\]

This is ordinary monodromy, not yet new mathematics. The conjectural genesis step is an **admission endofunctor**

\[
  \mathfrak A:
  (\mathsf B_n,\mathsf P_n,\mathsf{Lift}_n,o_n)
  \longmapsto
  (\mathsf B_{n+1},\mathsf P_{n+1},\mathsf{Lift}_{n+1}),
\]

where the current certified obstruction `o_n` selects a failed-lift locus and the resulting monodromy orbit is admitted as a genuinely new observable or representation object.

The word **genuinely** is load-bearing. If the alleged new direction is already in the thick, tensor, Karoubi, or other declared closure of the old observable category, the step has merely revealed a pre-existing coordinate. A defensible independence certificate must live in a quotient such as

\[
  \frac{\operatorname{Obs}_{n+1}}
       {\langle\operatorname{Obs}_n\rangle_{\mathrm{declared\ closure}}}
\]

or an equivalent relative invariant, and it must be nonzero without referring to `n`.

### Required axioms for the admission law

An endogenous admission theorem would need all of the following.

1. **Current-obstruction locality.** `A` depends on a finite current certificate, not a future tape or hidden depth.
2. **Universal minimality.** The extension is initial, terminal, or otherwise canonically characterized among extensions that represent or nullify the obstruction.
3. **Full-fiber retention.** Empty, contractible, disconnected, and higher fibers remain visible until a separately declared semantic quotient is justified.
4. **Gauge naturality.** Equivalent presentations induce equivalent generated diagrams.
5. **Path coherence.** Sequential and direct continuation satisfy a Chen-type composition law; filled faces satisfy a higher Stokes/coherence law.
6. **Confluence.** Independent obstruction resolutions commute up to a specified coherent equivalence, so a scheduler is not smuggled into the object.
7. **Local finiteness.** Every finite query uses a finite generated subdiagram, even if the completed process does not stabilize.
8. **No preallocated grammar.** The complete future symbol, coefficient, or query language is not supplied at time zero.
9. **Semantic nontriviality.** The relative observable class survives the declared gauge and endpoint quotient.

No retrieved source supplies this package. Several supply exact subsets of it.

---

## 2. Known machinery, reusable interface, incompatibility, missing theorem

### 2.1 Hodge theory and algebraic cycles

The Clay problem asks whether rational Hodge classes on smooth projective complex varieties are rational linear combinations of algebraic-cycle classes.[1] It is not the same statement as the integral Hodge conjecture. Recent work makes that distinction especially important:

- Beckmann and de Gaay Fortman prove the integral Hodge conjecture for one-cycles on a principally polarized complex abelian variety **when its minimal class is algebraic**, including Jacobians of smooth projective curves.[3]
- Engel, de Gaay Fortman, and Schreieder prove that on a very general principally polarized abelian variety of dimension at least four, every curve class is an even multiple of the minimal class; their 2025 preprint concludes that this disproves the integral Hodge conjecture for abelian varieties.[4] This does not disprove the rational Hodge conjecture.

**Reusable interface.** Hodge filtrations, variations of Hodge structure, period maps, Gauss--Manin transport, normal functions, and monodromy already turn a family of varieties into a family of cohomological representations. The 2025 integral-Hodge result itself uses monodromy considerations together with degeneration and matroidal combinatorics.[4] This validates monodromy as a serious *probe* of which cycle classes can occur.

**Incompatibility/no-go.** The frequently suggested story “every finite patch is algebraic, but the required polynomial degree diverges while gluing” is not a theorem about the Hodge conjecture. Algebraicity of a global cycle is not obtained by independently choosing local polynomial approximants and sheaf-gluing them. The sweep found no primary result supporting that reduction. It also conflates the false integral statement with the still-open rational statement.

**Missing theorem.** To connect genesis to Hodge theory, one first needs a functorial family of **cycle-realization homotopy types** over a precisely defined approximation/policy base, together with an obstruction class whose monodromy forces a new admissible cycle representation. Only then could one ask whether the generated diagram detects a rational Hodge class not detected at an earlier stage. No such theorem is present here.

### 2.2 Fixed descent, obstruction towers, and completion

Classical obstruction theory and sheaf/hyperdescent already separate local data, coherent compatibility, and global realization. Recent examples sharpen the interface:

- Meadows' 2025 definable obstruction theory enriches classical cohomological invariants by Polish-cover/descriptive-set-theoretic structure and applies this to the complexity of homotopy relations on mapping spaces.[5]
- Carrick, Davies, and van Nigtevecht give a necessary-and-sufficient condition for a synthetic analogue functor to preserve global sections of a derived stack; when it does not, their synthetic object still implements the descent spectral sequence.[6]
- Constructible hypersheaves can be classified through exit-path data under fixed stratification hypotheses, providing an exact way to retain a whole diagram of local systems rather than collapse it to global sections.[7]

**Reusable interface.** The Postnikov obstruction tower is a direct model for iterative lift tests. Derived limits and descent spectral sequences provide typed locations for “all finite stages work but a global assembly fails.” Exit-path/exodromy formalisms suggest encoding a policy diagram as transport over a stratified base.

**Incompatibility/no-go.** For a fixed hypersheaf on a fixed site, coherent descent data glue by definition. Therefore “local truth but no global truth” is not by itself a new phenomenon. A claimed failure must name the failed hypothesis: non-effectivity, missing higher coherence, a noncompact cost sublevel, nonclosed range, a derived-limit obstruction, or a change of category. Likewise, a completed datum outside the range of a nonclosed operator is functional analysis until the questions themselves are generated endogenously.

**Missing theorem.** Existing obstruction towers assume the target fibration or coefficient objects. Genesis requires the obstruction to select the next fibration/coefficient category in a way that is universal, presentation-independent, and iterable.

### 2.3 Full diagrams of solution homotopy types

The proposal to retain all policies rather than choose one has exact neighbors.

- Moduli stacks retain objects, automorphisms, and families instead of quotienting immediately to isomorphism classes.
- Nearby and vanishing cycles retain the topology change and monodromy of fibers near a degeneration; a 2025 preprint studies Hodge--Grothendieck classes and monodromy invariants of nearby cycles.[8]
- Exit-path infinity-categories encode constructible sheaves over a fixed stratified space.[7]
- Homotopy theories of differentiable sheaves provide a setting in which smooth families and descent are retained homotopically rather than pointwise.[9]

This motivates the concrete status functor

\[
  p\longmapsto\mathsf{Lift}(p)\in\mathcal S
\]

instead of the truncation

\[
  p\longmapsto
  \{\text{empty},\text{nonempty},\text{unique}\}.
\]

The truncation erases precisely the component holonomy seen in the current finite experiment.

**Reusable interface.** Vanishing-cycle support is a good model for an obstruction-selected *locus*: it records where a family ceases to be topologically locally constant. The action groupoid of policy symmetries is a natural base on which lift-fiber monodromy can be computed.

**Incompatibility/no-go.** In all these precedents, the map, moduli problem, coefficient category, parameter space, or stratification is fixed first. Vanishing cycles detect a degeneration; they do not autonomously invent the next moduli problem.

**Missing theorem.** Construct a policy base and adjacency/stratification from the obstruction certificate itself, then prove that enlarging this base preserves the old diagram and gives a canonical new vanishing/monodromy object.

### 2.4 Gauss--Manin, nonabelian Hodge, wild/Stokes local systems, and holonomy groupoids

These are the closest exact precedents for the monodromy hypothesis.

- Riemann--Hilbert and nonabelian Hodge theory relate fixed-rank flat connections/local systems, character varieties, and Higgs-bundle moduli. The representation spaces may be highly nontrivial, but the rank, singularity data, and base problem are prescribed.[10]
- Boalch's wild character varieties are moduli of generalized monodromy/Stokes data of irregular connections.[11]
- In the 2025 “Configuration Spaces, Fission Trees and Complex Braids,” wild character varieties form a local system of Poisson varieties over **admissible deformations** of a wild Riemann surface.[12] Work on irregular isomonodromy similarly studies the topology of the admissible time space while holding the pointed curve/irregular data under control.[13]
- Holonomy groupoids of singular foliations retain path-germ transport generated by a fixed singular foliation; later work develops functoriality and higher resolutions.[14]

**Reusable interface.** Wild Stokes theory demonstrates that sector-dependent continuation, jumps, braiding, and generalized monodromy can be made exact. It is a strong model for “endpoint-equal but path-distinct” semantics. Holonomy groupoids show how to retain precisely the germinal path information that survives a quotient.

**Incompatibility/no-go.** Monodromy acts on a pre-existing fiber. It does not automatically enlarge the representation algebra. In wild character theory, the irregular type and admissibility walls determine the Stokes alphabet. In a holonomy groupoid, the foliation is supplied. Thus neither is yet algebraogenesis.

**Missing theorem.** A failed lift must canonically construct the next irregular type, coefficient extension, foliation, or representation category--and prove that the monodromy orbit is relatively new rather than merely a coordinate of an already completed moduli object.

### 2.5 Higher gauge theory, nonabelian Stokes, and transgression

Higher gauge theory replaces point-particle parallel transport by transport of extended objects along surfaces and higher-dimensional paths. A 2024/2025 survey reviews connections on higher principal bundles and their applications.[15] A 2024 paper constructs higher holonomies from a flat 2-connection and proves invariance under homotopies relative to the boundary in its integrable model.[16]

**Reusable interface.** A crossed module or higher groupoid supplies the exact data needed to distinguish path composition, face curvature, and coherent fillers. This is the right language for the current direct-versus-sequential carry and for a future discrete Stokes identity. Transgression to loop space is a known way to convert surface data into ordinary bundle/holonomy data.

**Incompatibility/no-go.** Homotopy invariance typically needs flatness or a fake-flatness/coherence condition. The higher group, connection, and boundary conditions are chosen in advance. Merely attaching a real Laplacian or labeling an existing square “Stokes” does not create this structure.

**Missing theorem.** The admission law must output the comparison 2-cell/higher coefficient object required by the present obstruction, and it must prove the pentagon/interchange coherences for iterated attachments. Otherwise the result is a sequence of chosen fillers, not a semantic process.

### 2.6 Rough paths and path signatures

Path signatures are an unusually close match to “exact compositional memory.” For suitable paths, the signature is a group-like series in a completed tensor algebra, and concatenation obeys Chen's identity. Signatures determine paths up to tree-like equivalence in the relevant classes, and linear functionals of signatures support universal-approximation results. A 2026 preprint extends such a theorem to non-geometric rough paths by augmenting paths with time and bracket/quadratic-variation terms.[17] Recent weighted-signature-kernel work develops analytic control of the full signature feature system.[18]

**Reusable interface.** Exact concatenation is already a counter-free compositional transport law. The completed signature is one semantic object whose finite truncations can be materialized at arbitrary depth. This is a rigorous instance of “finite views, unbounded refinement, unchanged semantic object.”

**Incompatibility/no-go.** The tensor-word grammar and its grading are preallocated by the driving space and roughness structure. Requesting the next tensor level is effectively following a fixed degree counter. Adding time or quadratic variation is mathematically meaningful, but the augmentation rule is externally specified. Therefore ordinary signatures are not obstruction-generated observable algebras.

**Missing theorem.** Define an adaptive sub-Hopf/tensor grammar in which a certified failed reconstruction forces the minimal new word/bracket type, and prove Chen composition, shuffle/branched identities, and universal approximation remain valid independently of the order of admissions.

**Navier--Stokes relevance.** Rough paths can regularize or define equations driven by irregular temporal signals. That is not the deterministic three-dimensional smoothness problem, whose main difficulty is the nonlinear spatial cascade and scale-critical control. No retrieved rough-path result bridges that gap.

### 2.7 Regularity structures and renormalization structures

Regularity structures are the closest neighbor to equation-dependent algebra generation. They construct a graded model space of formal symbols, a structure group, models, and a reconstruction operator tailored to a singular SPDE. Algebraic renormalization assigns a regularity structure and renormalization group to locally subcritical equations.[19] A 2024 paper proves well-posedness of a regularity-structure formulation for a quasilinear generalized KPZ equation in the full subcritical regime and gives an explicit renormalized equation, conditional on convergence of the relevant non-translation-invariant BPHZ models.[20]

**Reusable interface.** The equation's rule generates the trees/symbols that can appear; reconstruction turns locally modelled data into a distribution; renormalization changes models while preserving the semantic equation after counterterms. This is much closer to algebraogenesis than probability itself.

**Incompatibility/no-go.** The rule and grammar are derived from the equation before solving it, and local subcriticality guarantees only finitely many negative-homogeneity symbols below each cutoff. The solution does not normally encounter an obstruction and then modify the rule. In a supercritical problem, uncontrolled proliferation of relevant symbols is a failure of the method, not an automatic self-extending cure.

**Missing theorem.** Replace the fixed subcritical rule by an obstruction-adaptive rule whose extensions are locally finite, confluent, renormalizable, and compatible with reconstruction. Proving this even for a toy singular equation would be a substantive theorem. It should precede any Navier--Stokes claim.

**Navier--Stokes relevance.** Regularity structures and adjacent singular-SPDE methods address stochastic or modified equations under their own scaling regimes. Retrieved work on stochastic Navier--Stokes concerns probabilistic solution classes, modified equations, or two-dimensional settings.[21] None proves deterministic 3D global smoothness.

### 2.8 Hodge/sheaf Laplacians and spectral refinement

For finite-dimensional cochain complexes with inner products, the Hodge Laplacian packages exact, coexact, and harmonic sectors. Cellular sheaf Laplacians add local restriction data. Persistent sheaf Laplacians extend this across filtrations; the ordinary sheaf-Laplacian kernel represents sheaf cohomology, while the persistent construction adds nonzero spectral information and can encode geometric and attached non-geometric point data.[22] Spectral coarsening with multiple Hodge Laplacians supplies a practical mechanism for preserving chosen spectral bands under reduction.[23]

**Reusable interface.** Kernels give exact obstruction dimensions; small eigenvalues quantify near-obstructions; Schur complements and spectral coarsening suggest finite certificates that survive controlled refinement. This is useful for an executable obstruction critic.

**Incompatibility/no-go.** The complex, sheaf, filtration, stalk inner products, and restriction maps are fixed. A Laplacian diagnoses the supplied observable diagram; it does not generate the diagram. Metric dependence also means that “innovation energy” is not semantic until its gauge class is declared.

**Missing theorem.** Show that an obstruction-generated attachment induces a functorial update of the sheaf complex and that its new harmonic/near-harmonic sector is invariant under the declared semantic gauge and cofinal regrouping.

### 2.9 Classical Navier--Stokes regularity and critical spaces

The official problem remains unsolved.[2] Recent frontier results make the solution-class boundary more important, not less.

- Coiculescu and Palasek construct critical `BMO^{-1}` initial data admitting two distinct global solutions that are smooth for every positive time; the result is sharp relative to Koch--Tataru small-data well-posedness, but the initial datum is in a critical rough space, not the smooth-data Clay setting.[24]
- A 2025 preprint by Hou, Wang, and Yang reports a computer-assisted construction of two Leray--Hopf solutions for the unforced 3D equation through a self-similar profile and instability of its linearization.[25] It is a frontier preprint result about weak energy solutions, not a proof or disproof of global smoothness for all smooth initial data.
- A 2026 preprint by Fujii classifies uniqueness versus nonuniqueness of mild solutions in critical Besov classes and obtains nonunique global critical solutions in spaces slightly larger than `L^n`.[26] Again, the function space is the theorem.
- Axisymmetric regularity results continue to give conditional criteria under boundary and swirl assumptions rather than general global regularity.[27]

**Reusable interface.** Navier--Stokes already tells us what a useful genesis quantity must do: it must control a scale-critical norm or a recognized continuation criterion, not merely count refinements. A policy-indexed solution diagram could retain distinct weak/strong/mild solution classes and the maps between them instead of calling all of them “solutions.”

**Incompatibility/no-go.** Finite-grid solvability is not “finite exact realizability” of the continuum PDE. Weak existence is not smooth existence; weak nonuniqueness is not smooth-data blow-up; an adaptive architecture is not an a priori estimate. Any argument that crosses these boundaries without a theorem is invalid.

**Missing theorem.** Define a computable genesis certificate `G(u;[0,t])` and prove a scale-uniform implication of the form

\[
  \sup_{t<T}\mathcal G(u;[0,t])<\infty
  \quad\Longrightarrow\quad
  \|u\|_{X([0,T))}<\infty
  \quad\Longrightarrow\quad
  u\text{ continues smoothly},
\]

for a recognized scale-critical space `X`. Without the first implication, genesis is only a diagnostic representation.

### 2.10 Convex integration and flexibility

Convex integration constructs solutions by successive high-frequency corrections. Buckmaster and Vicol proved nonuniqueness of finite-energy weak Navier--Stokes solutions.[28] Albritton, Brue, and Colombo proved nonuniqueness of Leray solutions for a forced equation.[29] Recent work continues to sharpen weak Euler flexibility and anomalous dissipation; for example, Burczak, Székelyhidi, and Wu obtain anomalous scalar dissipation under a `C^{1/3-}` Euler drift.[30]

**Reusable interface.** Convex integration is a genuine stagewise construction in which each residual selects an oscillatory correction. It is therefore an excellent adversarial model for obstruction-driven attachment.

**Incompatibility/no-go.** The frequency ladder, building blocks, and stress decomposition are designed globally. The method often proves flexibility/nonuniqueness precisely below a rigidity threshold. It does not supply regularity or canonical semantics. If two weak limits share every proposed finite genesis trace, the trace is not a complete semantic state.

**Missing theorem.** A genesis architecture must either distinguish the convex-integration branches in its full solution-type diagram or prove that its target regularity class excludes them. Collapsing to one endpoint state would erase the decisive phenomenon.

### 2.11 Blow-up, dynamic rescaling, and computer-assisted proof

This is the strongest executable precedent.

- Chen and Hou's Part II uses rigorous numerical error control, weighted estimates from Part I, and computer-assisted bounds to prove finite-time blow-up for 2D Boussinesq and 3D axisymmetric Euler with smooth finite-energy initial data **and boundary**.[31]
- Their 2025 PNAS article explicitly says the general 3D Euler singularity problem remains unresolved and describes the proof as nonlinear stability of an approximate nearly self-similar profile constructed through dynamic rescaling.[32]
- The Hou--Luo one-dimensional model admits exact self-similar finite-time blow-up profiles by a purely analytic fixed-point method, providing a clean non-computer control.[33]
- A 2026 result proves blow-up for a **forced hypodissipative fractional** Navier--Stokes equation only for `|nabla|^alpha` with `alpha < (22-8 sqrt(7))/9`; this is far from the classical Laplacian and therefore is a mechanism test, not a classical Navier--Stokes result.[34]

**Reusable interface.** Dynamic rescaling converts possible singularity formation into the stability of a profile. A computer-assisted proof then uses a candidate, a rigorously bounded residual, operator decompositions, finite-rank or interval estimates, and a posteriori validation. This is almost exactly an executable obstruction certificate driving refinement.

**Incompatibility/no-go.** The symmetry, domain, rescaling, approximate profile, weights, and operator decomposition are researcher-supplied. The certificate validates a selected semantic chart; it does not generate the chart from the PDE without prior design. Viscosity also prevents transferring an Euler proof to classical Navier--Stokes.

**Missing theorem.** On a model equation first, make the residual itself choose among a finite, typed family of chart/symbol extensions and prove that the resulting validated proof is independent of refinement order. Only after that should the architecture be tested against classical Navier--Stokes continuation criteria.

### 2.12 Kakeya, fractal, and multiscale incidence mechanisms

This is a lateral mechanism check, not a fluid claim. Wang and Zahl's 2025 preprint proves that every Kakeya set in `R^3` has Hausdorff and Minkowski dimension three by establishing almost-maximal volume for tube families satisfying a convex nonconcentration condition.[35]

**Reusable interface.** The work is a model of scale induction in which one isolates how geometric defect can concentrate in tubes, grains, or convex containers and then proves that no concentration pattern survives all scales. Polynomial partitioning and incidence geometry elsewhere provide a similar “broad versus narrow” decision tree.

**Incompatibility/no-go.** Tube incidence is not vorticity transport, and Kakeya dimension estimates do not imply Navier--Stokes regularity. The transferable content is only the proof architecture: classify concentration mechanisms, attach the next scale-specific question, and close an induction with a scale-uniform invariant.

**Missing theorem.** Identify a PDE defect measure with a decomposition theorem as exact as the tube/grain alternative, and show that every branch either dissipates, transports into a controlled chart, or contradicts a critical bound.

---

## 3. What the current finite theorem becomes under the diagrammatic view

The current eight-state `D_8` experiment already has the beginning of the proposed object.

For the declared four cyclic order-four sign policies `B_psi`, three policy fibers are empty and the unique `psi=u+v` fiber has sixteen lift objects and eight gauge components. Concrete extension-automorphism loops act with rank-one image on those components. The thin carrier gives a contractible fiber and no component holonomy; the free regular carrier gives an empty constrained fiber; the split-extension control makes all four sign-policy fibers nonempty and destroys unique selection. Quotienting the retained extension loops as gauge erases the holonomy direction.

The correct next object is therefore not the chosen `B_{u+v}` alone. It is the functor

\[
  \mathsf{PolicyLift}_{D_8}:\mathsf P^{\mathrm{op}}\to\mathcal S
\]

together with the action of the marked-extension automorphism groupoid. This diagram records four logically separate facts:

1. which policies can nullify the factor-set obstruction;
2. the homotopy type of each nullifying lift space;
3. which loops act nontrivially on the retained components;
4. which conclusions disappear under thin, free, split, or loop-gauge controls.

This reformulation does **not** close the theorem gap. The policy universe is still declared. The nonsplit extension selects one policy only inside that declared universe. The loop-retention doctrine is still semantic input. What it does accomplish is to expose the precise place where an endogenous law would act: not by appending a state coordinate, but by enlarging the policy/representation diagram through a relative monodromy class.

### A sharper candidate admission criterion

For a current obstruction `o`, let `Null(o)` be the infinity-category of coefficient extensions and lifts that nullify or represent `o`, with morphisms preserving the old observable diagram. A serious finite target is:

\[
  \boxed{
  \text{prove that }\operatorname{Null}(o)
  \text{ has a canonically characterized minimal object up to equivalence,}
  }
\]

and then admit not a chosen lift but the action groupoid of its full automorphism/monodromy orbit. If `Null(o)` has several incomparable minimal objects, the correct output is their moduli diagram, not an arbitrary tie-break.

This formulation directly answers the “new direction without a stage counter” challenge. The next direction is indexed by the universal property of `Null(o)`, not by `n+1`. Whether such a universal object exists beyond the hand-sized laboratory is the theorem gap.

---

## 4. The exact separation from Hodge and Navier--Stokes

### Hodge pathway

A legitimate first Hodge benchmark would use a known algebraic degeneration--for example, a family with explicit Gauss--Manin monodromy and nearby/vanishing cycles--and build the full policy-indexed diagram of cycle-lift problems over it. The benchmark should prove that the genesis construction recovers the known monodromy and does **not** invent false algebraic cycles. A second benchmark could ask whether the diagram detects the integral obstruction in the very-general abelian-variety examples of Engel--de Gaay Fortman--Schreieder.[4]

Only after those controls pass would it be meaningful to formulate a rational-Hodge target. The missing bridge is not “continuum as completion.” It is a theorem connecting a generated relative observable class to the algebraic cycle class map.

### Navier--Stokes pathway

A legitimate first PDE benchmark should not be the Millennium problem. It should be a model with a known answer and a known rescaling/continuation theory: the Hou--Luo model, a semilinear blow-up equation, 2D Boussinesq under the proved symmetry/boundary assumptions, or another equation for which regular and singular branches can both be certified.

The architecture must then show all of the following:

- the residual chooses the next chart or symbol family without a hidden depth schedule;
- the full solution homotopy diagram distinguishes nonuniqueness rather than collapsing it;
- direct and staged refinement produce coherently equivalent certificates;
- the accumulated certificate controls a recognized scale-critical analytic quantity;
- validated numerics close exact inequalities rather than provide empirical evidence.

Only a successful model theorem of this form would justify defining a classical Navier--Stokes genesis functional. Even then, the essential new step would be an a priori scale-uniform estimate, not the representation alone.

---

## 5. Five concrete next targets

### Target 1 -- Full policy-fiber theorem on the existing `D_8` instance

Replace the four manually listed sign policies by a categorically defined finite universe: for example, all coefficient extensions of the required kernel/quotient type up to a declared presentation cost. Compute the entire functor into finite groupoids/spaces, its automorphism action, nerves, components, and loop quotients. Prove whether the current `Z/4_{u+v}` object is initial/minimal, merely one component of a moduli diagram, or an artifact of the old policy fence.

**Pass condition:** no arbitrary enumeration order, and every equivalence/gauge mutation preserves the result.

### Target 2 -- Endogenous admission theorem in a finite category

Define `Null(o)` for a general finite cocycle/lift obstruction and search for a universal nullifier or a canonical finite moduli diagram of minimal nullifiers. The output must be a function of the typed obstruction and existing semantics, not a stage index.

**Pass condition:** naturality, confluence for two independent obstructions, and a negative example showing when no single canonical nullifier exists.

### Target 3 -- Monodromic Chen--Stokes coherence

Admit the full monodromy action groupoid as the new observable, then prove exact sequential composition, a direct-versus-sequential comparison 2-cell, and coherence on cubes. Compare explicitly with rough-path Chen identities and higher-gauge surface holonomy.

**Pass condition:** the new relative observable class survives the declared endpoint and gauge quotients and is invariant under cofinal regrouping.

### Target 4 -- Fixed-grammar falsifier using rough paths and regularity structures

Construct paired implementations on one toy rough/singular equation: (a) the standard fixed tensor/tree grammar and (b) an obstruction-adaptive grammar. Determine whether the adaptive version creates a relatively new symbol class or merely discovers an element of the completed fixed grammar.

**Pass condition:** reconstruction/universal approximation and composition still hold, with a proof of local finiteness. A result that only changes truncation depth is a failed genesis test.

### Target 5 -- Validated PDE chart-genesis benchmark

Use a model with a proved regular/blow-up dichotomy. Let rigorously bounded residuals select chart, basis, or symbol attachments; use interval or finite-rank validation to close the resulting estimates. Compare the generated certificate with the known continuation/blow-up criterion.

**Pass condition:** the certificate makes no false positive on the regular branch, detects the known singular branch, and yields a theorem independent of the adaptive refinement schedule. Classical 3D Navier--Stokes remains out of scope until this target is proved.

---

## 6. Incompatibility and no-go ledger

These are not philosophical cautions; they are falsifiers for the proposed field.

1. **Fixed-completion collapse.** If every admitted observable is already a coordinate in a fixed completed algebra, the process is adaptive revelation, not algebraogenesis.
2. **Stage-counter leakage.** If a new direction is selected because the algorithm reached depth `n`, the endogenous-law claim fails.
3. **Fixed-base monodromy.** Nontrivial monodromy of a supplied connection/fibration is known mathematics; novelty can only reside in the admission/iteration law.
4. **Policy cherry-picking.** Selecting the one nonempty or interesting fiber while discarding the full policy diagram can manufacture uniqueness.
5. **Gauge erasure.** Treating every loop as gauge can erase the current rank-one transport; retaining every raw word can manufacture path dependence. The semantic quotient must be declared and tested both ways.
6. **Descent tautology.** Coherent data for a fixed hypersheaf glue. A local-to-global failure must state the failed compactness, effectivity, boundedness, or coherence hypothesis.
7. **Hodge variant confusion.** Counterexamples to the integral Hodge conjecture do not refute the rational Hodge conjecture.
8. **PDE class confusion.** Weak, mild, Leray--Hopf, smooth-for-positive-time, axisymmetric, forced, hypodissipative, Euler, and classical Navier--Stokes results are not interchangeable.
9. **Numerics-as-proof confusion.** Adaptive simulation is evidence; computer-assisted proof additionally requires rigorous residual and operator bounds closing exact inequalities.
10. **Non-soficity non sequitur.** None of monodromy, infinite signature depth, nonclosed range, or a nontrivial solution diagram implies non-soficity. A separate infinite-residual theorem under a fixed finite observational interface is required.
11. **Kakeya transfer inflation.** Multiscale incidence methods are proof-architecture hints only until a PDE defect decomposition and critical estimate are proved.

---

## 7. Gaps and uncertainty

- The sweep found no paper that combines endogenous coefficient admission, full policy-indexed lift homotopy types, monodromy-generated observable growth, counter-free iteration, and a non-sofic residual theorem. This is a **coverage result**, not a defensible no-prior-art or priority claim.
- Several 2025--2026 frontier items are recent arXiv preprints. In particular, the unforced Leray--Hopf nonuniqueness result [25], the sharp critical-Besov classification [26], and the integral-Hodge counterexample [4] should be treated according to their current publication/revision status.
- Discover retrieval for recent Gauss--Manin and sheaves-of-PDE-solution queries was noisier than for exact-title Hodge/PDE queries. The report therefore relies on established exact interfaces and explicitly marks the endogenous step as missing.
- The current policy category has no intrinsic topology or adjacency. Applying vanishing-cycle or exit-path language requires first constructing such a stratification or action groupoid; it cannot be assumed.
- The proposed relative-observable quotient is schematic. Choosing the correct closure operation--tensor, thick, derived, Karoubi, renormalization, or another--is part of the object definition.
- “Semantic path” remains a doctrine boundary. The current finite theorem shows what is lost when loops are gauged away, but does not prove that retaining those loops is mandatory.
- No scale-critical genesis functional for classical Navier--Stokes has been defined, much less bounded.
- No algebraic-cycle realization functor linking the generated diagram to the rational Hodge cycle map has been defined.

---

## 8. Query ledger

All frontier queries used `--include-content`; most used the date window `2023-01-01` through `2026-08-10`. Foundational and official-status checks were unbounded. Each broad call was followed by exact-title or exact-URL verification where a claim mattered.

| Angle | Representative query | Intent boundary |
|---|---|---|
| Hodge frontier | `Hodge conjecture Hodge loci period maps recent advances 2023 2024 2025 2026 arXiv` | primary theorems, hypotheses, and limits |
| Hodge exact | `Matroids and the integral Hodge conjecture for abelian varieties Engel Schreieder Effective atypical intersections Hodge locus` | distinguish integral from rational Hodge |
| local-to-global | `local-to-global obstruction descent sheaf cohomology derived geometry recent theorem 2023 2024 2025 2026` | fixed descent versus obstruction/failure |
| higher transport | `higher gauge theory nonabelian Stokes transgression differential cohomology higher holonomy 2023 2024 2025 2026` | exact coherence and flatness assumptions |
| harmonic/spectral | `Hodge Laplacian harmonic analysis spectral geometry topology recent theorem 2023 2024 2025 2026` | kernels, persistence, and coarsening |
| NS regularity | `site:arxiv.org Navier-Stokes partial regularity epsilon regularity critical spaces 2023 2024 2025 2026` | solution class and continuation criterion |
| convex integration | `Navier-Stokes Euler convex integration nonuniqueness Leray weak solutions 2023 2024 2025 2026 arXiv` | forcing, energy, and regularity class |
| singularity/CAP | `Euler Navier-Stokes finite time blowup singularity computer assisted proof 2023 2024 2025 2026` | exact equation/domain/symmetry and proof status |
| rough paths | `rough paths path signatures Chen identity universal noncommutative features recent 2023 2024 2025 2026` | composition, universality, fixed grammar |
| regularity structures | `regularity structures renormalisation structures rule generated symbols singular SPDE 2023 2024 2025 2026` | rule-generated symbols and subcriticality |
| stochastic NS relevance | `regularity structures rough paths stochastic Navier-Stokes 3D deterministic Navier-Stokes relevance` | prevent transfer to the Clay problem |
| Kakeya lateral check | `three dimensional Kakeya conjecture Wang Zahl 2025 proof polynomial partitioning multiscale` | scale induction only, no fluid inference |
| Gauss--Manin | `variation of Hodge structure Gauss-Manin monodromy period map recent 2023 2024 2025 2026` | fixed family versus representation growth |
| nonabelian/wild Hodge | `wild nonabelian Hodge Stokes local systems wild character varieties irregular Riemann-Hilbert recent` | prescribed irregular type/admissibility |
| holonomy groupoids | `holonomy groupoid singular foliation germ groupoid transport obstruction recent 2023 2024 2025 2026` | fixed foliation and germ dependence |
| policy diagrams | `perverse sheaves nearby cycles vanishing cycles monodromy moduli stacks recent 2023 2024 2025 2026` | full fiber change and monodromy |
| solution sheaves | `sheaf of PDE solution spaces h-principle derived solution stack formal solutions recent` | genuine/formal solution homotopy types |
| exit paths | `exit path infinity category constructible sheaves stratified homotopy type recent 2023 2024 2025 2026` | fixed stratification and exodromy |

Exact Bright Data scrapes were then run for both Clay problem pages and arXiv abstracts `2509.25116`, `2602.19846`, `2502.17655`, `2602.05898`, `2401.05275`, `2405.18625`, `2308.01528`, and `2405.16670`.

---

## 9. Curated primary and official sources

Relevance scores are Bright Data Discover scores from the query in which the source was selected. “Direct” means an exact page was resolved and scraped after discovery/search, so no relevance score applies.

[1] [Hodge Conjecture -- Clay Mathematics Institute](https://www.claymath.org/millennium/hodge-conjecture/) -- accessed 2026-08-10 -- direct official status and problem summary.

[2] [Navier--Stokes Equation -- Clay Mathematics Institute](https://www.claymath.org/millennium/navier-stokes-equation/) -- accessed 2026-08-10 -- direct official unsolved status.

[3] [Integral Fourier transforms and the integral Hodge conjecture for one-cycles on abelian varieties](https://www.cambridge.org/core/journals/compositio-mathematica/article/integral-fourier-transforms-and-the-integral-hodge-conjecture-for-onecycles-on-abelian-varieties/AC12934E24BDAA5B2CD04372A3090416) -- 2023 -- relevance 0.602/0.625 across Hodge queries.

[4] [Matroids and the integral Hodge conjecture for abelian varieties](https://arxiv.org/abs/2507.15704) -- first posted 2025-07-21, v3 2026-03-27 -- relevance 0.555.

[5] [Definable Obstruction Theory](https://arxiv.org/abs/2501.12888) -- 2025, v2 2025-07-17 -- relevance 0.486.

[6] [Descent spectral sequences through synthetic spectra](https://arxiv.org/html/2407.01507v1) -- 2024 -- relevance 0.404.

[7] [Constructible hypersheaves via exit paths](https://arxiv.org/abs/2102.12325) -- foundational exact interface; retrieved PDF relevance 0.676.

[8] [Hodge--Grothendieck classes and monodromy invariants of nearby cycles](https://arxiv.org/abs/2509.00984) -- 2025 preprint -- relevance 0.617.

[9] [The homotopy theory of differentiable sheaves](https://arxiv.org/abs/2309.01757) -- 2023 -- relevance 0.471.

[10] [Arithmetic and metric aspects of open de Rham spaces](https://londmathsoc.onlinelibrary.wiley.com/doi/full/10.1112/plms.12555) -- 2023 -- relevance 0.586.

[11] [Geometry and braiding of Stokes data; Fission and wild character varieties](https://annals.math.princeton.edu/2014/179-1/p05) -- 2014 foundational primary paper -- relevance 0.613.

[12] [Configuration Spaces, Fission Trees and Complex Braids](https://ems.press/content/serial-article-files/51274) -- 2025 -- relevance 0.566.

[13] [Topology of Irregular Isomonodromy Times on a Fixed Pointed Curve](https://link.springer.com/article/10.1007/s00031-023-09800-9) -- online 2023 / volume 2025 -- relevance 0.559.

[14] [Holonomy Groupoids of Singular Foliations](https://projecteuclid.org/download/pdf_1/euclid.jdg/1090348356) -- foundational primary paper -- relevance 0.570.

[15] [Higher Gauge Theory](https://arxiv.org/abs/2401.05275) -- 2024 preprint, encyclopedia version 2025 -- direct exact scrape; discovery relevance 0.582.

[16] [Higher Gauge Theory and Integrability](https://arxiv.org/abs/2405.18625) -- 2024 -- direct exact scrape; journal discovery relevance 0.633.

[17] [Universal approximation with signatures of non-geometric rough paths](https://arxiv.org/abs/2602.05898) -- 2026 preprint -- direct exact scrape; discovery relevance 0.426.

[18] [Weighted Signature Kernels](https://ora.ox.ac.uk/objects/uuid:33382721-40b3-446a-88d7-8b4143737b3f) -- 2024 -- relevance 0.535.

[19] [Renormalising SPDEs in regularity structures](https://arxiv.org/abs/1711.10239) -- journal version 2021 -- relevance 0.684 in the regularity query / 0.451 in exact foundational retrieval.

[20] [Regularity Structures for Quasilinear Singular SPDEs](https://link.springer.com/article/10.1007/s00205-024-02069-6) -- published online 2024-11-29 -- relevance 0.727.

[21] [Global existence and non-uniqueness for 3D Navier--Stokes equations with space-time white noise](https://bibos.math.uni-bielefeld.de/preprints/23-06-617.pdf) -- 2023 -- relevance 0.520; stochastic solution-class boundary.

[22] [Persistent sheaf Laplacians](https://arxiv.org/html/2112.10906v4) -- v4 2023-12-05 -- relevance 0.668.

[23] [Spectral Coarsening with Hodge Laplacians](https://www.pure.ed.ac.uk/ws/files/362972076/Spectral_coarsening_KEROS_DOA26042023_AFV_CC_BY.pdf) -- 2023 -- relevance 0.664.

[24] [Non-Uniqueness of Smooth Solutions of the Navier--Stokes Equations from Critical Data](https://arxiv.org/abs/2503.14699) -- 2025; linked Inventiones DOI in arXiv record -- relevance 0.531.

[25] [Nonuniqueness of Leray--Hopf solutions to the unforced incompressible 3D Navier--Stokes equation](https://arxiv.org/abs/2509.25116) -- 2025 preprint, v2 2026 -- direct exact scrape; discovery relevance 0.408.

[26] [Sharp non-uniqueness for the Navier--Stokes equations in scaling critical spaces](https://arxiv.org/abs/2602.19846) -- 2026 preprint -- direct exact scrape; discovery relevance up to 0.641.

[27] [On the regularity of axially-symmetric solutions to the Navier--Stokes equations](https://arxiv.org/abs/2405.16670) -- 2024 -- direct exact scrape; discovery relevance 0.418.

[28] [Nonuniqueness of weak solutions to the Navier--Stokes equation](https://arxiv.org/abs/1709.10033) -- foundational convex-integration result -- relevance 0.488.

[29] [Non-uniqueness of Leray solutions of the forced Navier--Stokes equations](https://par.nsf.gov/servlets/purl/10697785) -- Annals 2022 -- relevance 0.555.

[30] [Anomalous dissipation and Euler flows](https://arxiv.org/abs/2310.02934) -- 2023, revised 2024 -- relevance 0.660.

[31] [Stable nearly self-similar blowup of the 2D Boussinesq and 3D Euler equations with smooth data II: rigorous numerics](https://arxiv.org/abs/2305.05660) -- 2023 preprint / 2025 journal result -- relevance 0.547/0.605.

[32] [Singularity formation in 3D Euler equations with smooth initial data and boundary](https://authors.library.caltech.edu/records/40zbk-gep55) -- PNAS 2025 -- relevance 0.609.

[33] [Exact self-similar finite-time blowup of the Hou--Luo model with smooth profiles](https://arxiv.org/abs/2308.01528) -- 2023, revised 2025 -- direct exact scrape; discovery relevance 0.482.

[34] [Finite Time Blow-Up for the Hypodissipative Navier--Stokes Equations](https://link.springer.com/article/10.1007/s00205-026-02198-0) -- 2026 -- relevance 0.586.

[35] [Volume estimates for unions of convex sets, and the Kakeya set conjecture in three dimensions](https://arxiv.org/abs/2502.17655) -- 2025 -- direct exact scrape.

---

## 10. Final research judgment

The sweep does not point to probability as the carrier, and it does not point to a mystical continuous coefficient field. It points to a higher-categorical process object:

\[
\boxed{
\text{a self-extending diagram of realization homotopy types,}
\quad
\text{whose extensions are selected by failed lifts and whose history is transported by monodromy.}
}
\]

Rough paths explain how exact compositional memory can live in one completed semantic object. Regularity structures explain how an equation can generate a tailored symbolic algebra. Vanishing cycles and moduli stacks explain why the full family of fibers must be retained. Wild character varieties and holonomy groupoids explain endpoint-invisible transport. Computer-assisted blow-up proofs explain how a finite executable residual can control a real infinite-dimensional theorem. Kakeya explains how a scale induction can exhaust defect-concentration mechanisms.

But each of these starts with its grammar, base, equation, stratification, or representation category already supplied. The proposed field begins exactly where they stop:

> **Can a certified obstruction canonically grow the category in which its own future resolutions become expressible, while preserving exact transport, local computability, and presentation independence?**

That is now the direct path forward. Hodge and Navier--Stokes are serious long-horizon tests only after Targets 1--5 become theorems.
