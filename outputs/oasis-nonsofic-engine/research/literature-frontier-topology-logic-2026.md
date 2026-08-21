# Literature frontier audit: endogenous resolution, path-sensitive observables, and obstruction-selected refinement

**Research date:** 2026-08-10

**Status:** source-grounded frontier audit and theorem-gap map, not a novelty claim

**Live corpus:** Bright Data Discover, 33 targeted search angles / 165 decomposed queries; 419 returned records, 311 records with substantive extracted content, 307 contentful records after normalized-URL deduplication. The cited set below was then restricted mainly to author manuscripts, journal/proceedings pages, institutional notes, and project repositories.

## Executive result

The survey changes the novelty claim in a useful way.

The broad ingredients are not new:

- a family of solution spaces indexed by policies is an ordinary functor into spaces and can be packaged by a Cartesian fibration;
- stacks and hypersheaves already retain local solutions, automorphisms, higher coherences, and local-to-global failure;
- algebraic weak factorization systems turn specified lifting problems into functorial fillers;
- polygraphic and Squier completion turn critical branchings into new higher coherence cells;
- Toda brackets, Massey products, and operadic resolutions turn failed lower coherence into higher operations or obstructions;
- inductive-inductive, inductive-recursive, quotient inductive, and higher inductive-inductive definitions can generate a context together with dependent families and coherences;
- holonomy groupoids, Tannakian reconstruction, and matrix coefficients turn transport into observable algebra;
- coalgebraic rational or locally finite fixpoints assemble all finite behavior for a fixed behavior functor; and
- domain theory already treats infinite semantic objects through directed systems of finite information.

The strongest defensible new kernel is therefore narrower:

> **An endogenous admission law in which the full homotopy type and monodromy of a currently obstructed solution problem canonically enlarge the category of admissible questions and its observable algebra; the enlargement is natively realized by continuation, retains path distinctions, and is iterated without a prelisted future signature or an external stage counter.**

No source in this sweep supplied that complete feedback law. But no theorem in the project supplies it yet either. What exists today is a promising **formal interface** plus exact finite examples. The next research target is not to name a policy-indexed stack; standard theory already packages it. It is to prove that an obstruction-selected admission operator is well-defined, invariant, nontrivial, and strictly more efficient than a declared comparison class of fixed global observers.

The proposed pivot from “adjoin a fresh transport axis” to “use monodromy to grow the topology in which existing paths become distinguishable” is mathematically cleaner. It avoids the degree error already found in the project: a homotopy fiber of an \(m\)-class naturally creates \((m-1)\)-homotopy, not a new element of \(\pi_1\). But for a fixed fibration and fixed representation family, the pivot is already holonomy/Tannaka theory. The potential novelty is exactly the obstruction-driven **selection, admission, realization, and iteration** of those observables.

## Epistemic labels used below

- **Known theorem:** established in a cited source or in an exact project artifact.
- **Formal interface:** a precise candidate definition with no claimed existence or universality theorem.
- **Analogy:** a structural resemblance that does not transfer a theorem.
- **Actual gap:** a statement that must be proved or falsified before the research program can make a stronger claim.

These labels are load-bearing. In particular, “non-sofic,” “continuous,” “non-symbolic,” “uncomputable,” “Hodge,” “Navier–Stokes,” and “non-algebrizing” are not interchangeable properties.

## 1. The closest established machinery

### 1.1 Directed and stratified homotopy already retains path-sensitive semantics

Exit-path \(\infty\)-categories encode directed movement through strata rather than quotienting immediately to endpoints. Haine, Porta, and Teyssier prove finiteness results for exit-path \(\infty\)-categories of compact subanalytic and real-algebraically stratified spaces; their 2024 preprint was revised in June 2026 and is listed as forthcoming in the *Journal of Topology*.[1] Jansen develops stratified homotopy types for topological \(\infty\)-stacks together with tools for constructible sheaves, refinements, localizations, and descent.[2] Mayeda's November 2025 preprint gives a particularly close finite-group-action example: an exit-path functor induced by \(M\to M/G\) is a right fibration, and the resulting structure is classified over an orbit category.[3]

**Known theorem.** A fixed stratification or group action can already produce a path category whose transport and orbit data distinguish routes invisible at the coarse endpoint level.[1–3]

**What it does not provide.** The strata, action, exit condition, and coefficient system are inputs. Exodromy tells us how to recover constructible data from a given directed topology; it does not make an obstruction invent the next stratum or measurement doctrine.

**Concrete lesson.** “Grow the topology in which old paths become distinguishable” should first be formulated as an enlargement or refinement of an exit-path/constructible-sheaf doctrine, not as the creation of a mysterious new continuum.

### 1.2 A full diagram of policy-dependent solution fibers is standard packaging

Let \(\mathsf{Pol}\) be a small category of coefficient or quotient policies and let

\[
\mathcal F:\mathsf{Pol}\longrightarrow \mathcal S
\]

send a policy to the \(\infty\)-groupoid of its coherent solutions, gauges, and higher gauges. This is already an ordinary \(\mathcal S\)-valued diagram. Cartesian-fibration/unstraightening technology packages such varying \(\infty\)-categories over a base; Rasekh develops this machinery in the complete-Segal-space model.[4] If the assignment satisfies descent for a chosen topology, it is a stack; if it satisfies hyperdescent, it is a hypersheaf. Derived moduli theory demonstrates why the full fiber is preferable to a truth value: Porta and Teyssier's 2025 preprint constructs a locally geometric derived stack of Stokes data, preserving derived deformation and obstruction information.[5]

Here “Stokes data” means the Stokes phenomenon for irregular flat connections, **not** the Navier–Stokes equations.[5]

For the project relation-policy lattice, a concrete instance is

\[
L\subseteq L' \quad\Longrightarrow\quad
B_L=M/L\longrightarrow B_{L'}=M/L'
\]

and hence a map between coherent-lift fibers. The three coarse responses

\[
\varnothing,\qquad \text{noncontractible},\qquad \text{contractible}
\]

respectively mean no solution, a solution with residual choice/transport/higher symmetry, and a homotopically unique solution. This trichotomy is useful, but the full \(\mathcal F(L)\) must be retained because it contains the monodromy the candidate successor needs.

**Known theorem.** A policy-indexed family of homotopy fibers, its Grothendieck construction, and stack/hyperstack refinements are standard.

**Actual gap.** Standard packaging does not choose \(\mathsf{Pol}\), its topology, the next policy, or the observable extracted from a fiber. Calling the diagram a “policy-indexed resolution spectrum” may be a useful project label, but the packaging alone is not a new mathematical object.

### 1.3 Algebraic weak factorization systems already turn lifting obligations into fillers

Garner's algebraic small-object argument begins with a set or category of generating maps and constructs an algebraic weak factorization system. Its algebraic structure records coherent choices of fillers rather than merely asserting a lifting property.[6] Hilhorst and North's ITP 2024 work formalizes a constructive version of the algebraic small-object argument in UniMath, including the filler-carrying structure.[7]

This is a very strong near-neighbor to “a failed problem causes repair”:

1. a generating map specifies a class of lifting problems;
2. all such problems are attached functorially;
3. transfinite composition closes the repair; and
4. the resulting right maps carry specified lifting operations.[6–7]

**What it already provides.** Functorial, algebraic, potentially transfinite generation of solutions to all admitted lifting problems; a universal property; coherence of chosen fillers; and an executable formalization in a nontrivial case.[6–7]

**What semantic admission would add.** The ambient category, generating maps, and meaning of “problem” are fixed before the construction runs. An endogenous law would have to derive a new generating map or new observation type from the monodromy/obstruction of the current factorization, then prove that this derived generator is invariant under semantic equivalence. Ordinary AWFS theory does not supply that derivation.

### 1.4 Computads, polygraphs, and Squier completion already implement defect-to-coherence generation

This is the closest established mechanism to the project's “defect gives the next question.” In higher-dimensional rewriting, generators and rewriting paths form a polygraph. Critical branchings expose failures of confluence; coherent or homotopical completion adds higher cells witnessing the confluence diagrams. Guiraud, Malbos, and Mimram give a homotopical completion procedure that combines rewriting completion with higher coherence data.[8] Mimram gives algorithms for computing critical pairs in two-dimensional rewriting systems.[9] The modern polygraph monograph treats coherent presentations, Squier completion, polygraphic resolutions, and their relation to strict higher categories and homotopy.[10]

**What it already provides.** A local defect can expose a new higher-dimensional generator without consulting a stage counter. The histories of competing rewrites are retained as parallel cells, and their reconciliation is a new higher cell.[8–10]

**Precise boundary.** A critical pair of \(n\)-cells normally generates an \((n+1)\)-coherence cell. It does not canonically become a new independent 1-transport direction. This mirrors the project's homotopy-fiber degree no-go. Adding a new low-dimensional generator can be a useful Tietze or completion move, but its choice is not forced merely by the existence of the higher defect.

**Actual gap.** The signature, rewrite rules, orientation, and definition of criticality are fixed. The proposed semantic law would need the *native solution fiber*—not just syntactic overlap—to determine which distinction becomes a new observable, and would need to prove invariance under changes of presentation. A direct equivalence with Squier completion would falsify the claim of a new mechanism.

### 1.5 Secondary operations already arise from failed lower coherence

Toda brackets and Massey products are paradigmatic defect-generated operations. Baues, Blanc, and Gondhali give a uniform construction of higher Toda brackets covering higher Massey products. Their brackets depend on coherent nullhomotopy data, carry indeterminacy, and act as obstructions to extending or rectifying a higher chain complex.[11]

**What it already provides.** The failure or chosen nullification of a lower composite creates a higher operation; path choices and their indeterminacy matter; vanishing detects extension in the stated setting.[11]

**What it does not provide.** The higher operation lives in a pre-existing mapping algebra, homotopy theory, or coefficient system. Treating its values as a newly admitted measurement coordinate is an additional move. The same caveat applies to \(A_\infty/L_\infty\) structures and operadic minimal/cofibrant resolutions: higher operations repair strict equations up to coherent homotopy, but the operad and the target notion of algebra are specified in advance.[12–13]

This yields a useful three-step distinction:

1. **obstruction production** is often standard;
2. **observable admission** of a chosen invariant is extra; and
3. **native realization and recursive reuse** of that observable is the unproved genesis step.

### 1.6 Inductive-recursive and higher inductive families are the closest syntax-generation substrates

Inductive-inductive definitions simultaneously generate a type and a family indexed by that type.[14] Inductive-recursive definitions simultaneously generate codes and a recursive interpretation; positive inductive-recursive definitions extend the class of admissible functors.[15] Quotient inductive types can generate objects together with equations, and the “type theory in type theory” construction demonstrates mutually generated contexts, types, terms, and equalities inside type theory.[16] QWI types formalize a broad class of indexed quotient-inductive types as initial algebras for indexed equational theories, including infinitary operators.[17] Higher inductive-inductive signature schemes add higher path constructors and induction principles.[18]

**Known capacity.** These formalisms can express a context growing together with its observable/question family and coherences. They therefore defeat any claim that simultaneous context/question generation is itself unprecedented.[14–18]

**Do they solve the endogenous-signature problem?** Only relative to a fixed meta-signature. One can specify a constructor saying, roughly, “for every certified defect, add an observable,” and then obtain an open-ended object-level signature. But the defect type, certification rule, and constructor are supplied by the meta-theory. The formalisms implement an admission law; they do not discover or justify which admission law is semantically canonical.

The right novelty criterion is therefore not “no fixed schema whatsoever”—every executable definition has some rule—but:

> no prelisted future observables, together with one invariant admission rule whose outputs are forced by the current native solution geometry.

An especially hard falsifier is possible here: if the entire proposed process is the initial algebra of one ordinary accessible endofunctor or one already studied HIIT signature, with no further semantic condition, then the object is an instance of established inductive machinery rather than a new foundational constructor.

### 1.7 Bialgebraic semantics already composes syntax and behavior, but not by feedback from obstruction

Turi and Plotkin's bialgebraic semantics uses distributive laws to connect a syntax monad with a behavior endofunctor/coalgebra and derive compositional operational semantics.[19] Later bialgebraic work on string diagrams makes the same division explicit: a distributive law mediates between a fixed syntax and fixed dynamics.[20] Weak or lax distributive laws relax strict compatibility, but they still require the syntax functor, behavior functor, and mediating law as input.

**Known theorem pattern.** A distributive law can guarantee that behavior respects syntax and can organize simultaneous algebra/coalgebra structure.[19–20]

**Missing feedback.** The candidate needs a map in the reverse direction:

\[
\text{behavioral obstruction or monodromy}
\longmapsto
\text{new syntax/question/observable}.
\]

That transgression is not supplied by the usual bialgebraic setup. Once such a transgression is declared, bialgebraic or inductive-recursive machinery may be the correct implementation language for its fixed point.

### 1.8 Holonomy, groupoid algebras, and Tannaka reconstruction already turn paths into observables

Holonomy and monodromy groupoids have explicit local-to-global universal properties.[21] Groupoid arrows can be turned into functions and convolution products; recent work on double groupoids studies two such convolution structures and their compatibility.[22] Tannakian reconstruction turns a tensor category of finite-dimensional representations plus a fiber functor into an affine/pro-algebraic group object. Deninger constructs a pro-algebraic fundamental group of a topological space from finite-dimensional flat vector bundles and relates it, for suitable spaces, to the pro-algebraic completion of \(\pi_1\).[23]

Therefore, for a fixed obstruction-selected lift fibration

\[
p:E\longrightarrow B,
\]

the following move is established mathematics:

\[
\rho:\pi_1(B,b)\longrightarrow
\operatorname{Aut}(H_*(E_b;k)),
\qquad
A^+=\langle A,\operatorname{matrixcoeff}(\rho)\rangle .
\]

The permutation action on \(\pi_0(E_b)\), its orbit indicators, and linearizations are likewise ordinary representation/groupoid algebra constructions.

**What the project pivot gets right.** This grows the observable algebra so that paths which were endpoint-equivalent can become distinguishable. It does so without pretending that a high-degree obstruction automatically creates a fresh \(\pi_1\) direction.

**What is already known.** Once \(p\), the coefficient field, and representation family are fixed, holonomy and matrix-coefficient reconstruction do the job.[21–23]

**What remains potentially new.** The current obstruction must canonically select the lift problem; its transport must select a minimal new observable family; the new observables must be realized by continuation rather than merely adjoined as symbols; and the result must feed the next selection. Taking *all* finite-dimensional representations avoids a choice, but ordinarily produces only a pro-algebraic shadow. Paths invisible to every chosen representation remain identified, and the construction may be much larger than the proposed adaptive atlas.[23]

### 1.9 Coalgebraic rational fixpoints and domains already model unbounded finite refinement

For a fixed finitary behavior functor \(H\), the rational fixpoint is assembled from finite \(H\)-coalgebras. The locally finite fixpoint broadens this to finitely generated carriers and is final among locally finitely generated coalgebras in the stated hypotheses.[24] This is a precise version of “only a finite part is materialized while the semantic object supports arbitrarily deep continuation.”

Domain and synthetic topology give the other half of the intuition. Escardó develops computational topology in which infinite data and precision are handled through topological/continuous structure.[25] Bauer's 2025 synthetic-computability lectures treat partial oracles as an (omega)-algebraic dcpo with finite compact information and Scott-continuous reductions.[26]

**Known structure.** Continuous computable paths, infinite objects presented by finite information, and least/final fixed points are not consequences of non-soficity; they are established tools.[24–26]

**Actual gap.** In the standard constructions, \(H\), the compact basis, or the information system is fixed. Genesis would need a domain whose basis of questions itself grows under a semantically forced operator—or an inductive-recursive “domain of doctrine plus doctrine-indexed information.”

### 1.10 Sheaf contextuality is a warning against collapsing the full fiber to one obstruction class

Abramsky and Brandenburger identify contextuality/nonlocality with failure of a global section in a fixed measurement scenario.[27] But Carù proves that the associated cohomological obstruction is not complete for strong contextuality, even under additional hypotheses, and gives counterexamples.[28]

**Lesson.** A single cohomology class can be a sound obstruction certificate without being complete. The policy construction should retain the full solution \(\infty\)-groupoid and its transport for as long as possible. Replacing it early by “empty/nonempty” or by one class can destroy the very path distinctions intended to generate new observables.

## 2. The proposed object, stated at the right level

The following is a **formal interface**, not an existence theorem.

### 2.1 State

A genesis state is a tuple

\[
X=(\mathcal C,\mathsf{Pol},\mathcal F,\mathcal O,\mathsf{Real}),
\]

where:

- \(\mathcal C\) is the current semantic/path \(\infty\)-category;
- \(\mathsf{Pol}\) is a small category of currently meaningful relation, coefficient, or resolution policies;
- \(\mathcal F:\mathsf{Pol}\to\mathcal S\) is the full diagram of solution homotopy fibers;
- \(\mathcal O\) is the current observable algebra or observable category; and
- \(\mathsf{Real}\) records which observables are natively realized by executable continuation in \(\mathcal C\).

For the current finite laboratory, \(\mathcal F(L)\) can be the cochain-level groupoid or simplicial set of coherent \(B_L\)-valued lifts of the fixed extension cocycle. The already executed cases exhibit all three coarse fiber types: an empty lift fiber for a free policy, a noncontractible lift fiber with component holonomy for the selected \(\mathbb Z/4_\chi\) policy, and a contractible thin fiber. The exact project evidence is in [Genesis nullification-fiber holonomy](./genesis-nullification-fiber-holonomy.md) and [Genesis higher question quotients](./genesis-higher-question-quotients.md).

### 2.2 Obstruction-to-observable transgression

For every policy \(p\), let \(\operatorname{Aut}_{\mathcal C}(p)\) act by transport on \(\mathcal F(p)\). Define a representation category generated functorially from the untruncated fiber, for example by

\[
\rho_{p,n}:\operatorname{Aut}_{\mathcal C}(p)
\longrightarrow
\operatorname{Aut}(H_n(\mathcal F(p);k)),
\]

together with the permutation action on \(\pi_0\mathcal F(p)\) and, when necessary, higher/nonlinear invariants. The candidate transgression is

\[
\Theta_X:
\{
\text{transport distinctions invisible to }\mathcal O
\}
\longrightarrow
\{
\text{new observable generators}
\}.
\]

One basis-free first approximation is to adjoin all matrix coefficients of the subrepresentation on which current endpoint-equivalent loops act nontrivially:

\[
\mathcal O^+
=
\big\langle
\mathcal O,
\operatorname{Coeff}(\rho_{p,n})
\;\big|\;
p,n\text{ admitted by }\Theta_X
\big\rangle .
\]

This formula is not yet canonical: it depends on the coefficient theory, on which functors of \(\mathcal F(p)\) are allowed, and on the admission predicate. Taking the full representation category replaces a choice with a Tannakian completion, but may be too large and may still fail to separate all paths.[23]

### 2.3 Native realization and iteration

The crucial extra step is a realization functor or universal problem

\[
\mathsf{Realize}_X(\mathcal O^+)
\longrightarrow X^+
\]

which makes every admitted observable computable by actual continuation in the successor semantic object. Then one recomputes the policy diagram and its transport:

\[
X\xmapsto{\Gamma}X^+
=
\operatorname{Recompute}
\bigl(
\mathsf{Realize}_X(\Theta_X(\mathcal F))
\bigr).
\]

The process should be specified as an initial algebra, final coalgebra, least fixed point, or universal completion of a single invariant operator \(\Gamma\), rather than by a table indexed by stage number. Inductive-recursive or bialgebraic machinery may encode \(\Gamma\), but neither supplies its semantic justification.[14–20]

### 2.4 Required laws

At minimum, \(\Gamma\) must satisfy:

1. **presentation descent:** equivalent presentations yield equivalent successors;
2. **gauge and base-change naturality:** transport of policies/fibers commutes with admission;
3. **zero/resolved stutter:** no unresolved transport distinction means no growth;
4. **path retention:** endpoint quotienting cannot erase distinctions used by \(\Theta\);
5. **no chosen torsor origin:** affine choices remain equivariant or are represented universally;
6. **native realization:** new observables are executable continuations, not decorative variables;
7. **internal recurrence:** the next problem is computed from \(X^+\), not a hidden future table;
8. **smallness/accessibility:** the full policy/representation diagram remains a legitimate category and the iteration exists; and
9. **strict gain:** at least one declared observer class provably cannot simulate the iterated atlas at comparable cost.

These are theorem obligations, not desired properties to assume silently.

### 2.5 A sharper synthesis: goal-indexed growth of a finite probe category

There is a cleaner branch in which the semantic object does **not** self-modify. Let

\[
\mathcal P_n\hookrightarrow\mathcal C
\]

be the finite category of probes materialized so far. Its current view of a semantic object \(X\) is the restricted Yoneda profile

\[
Y_{\mathcal P_n}(X)
=
\operatorname{Map}_{\mathcal C}(-,X)|_{\mathcal P_n^{\mathrm{op}}}.
\]

Adding a probe refines the topology of distinguishability without changing \(X\). If the eventual probe category is dense, its full presheaf profile can reconstruct the object; analogously, a sufficiently rich tensor/representation category can reconstruct a Tannakian or derived-geometric shadow. Deninger's pro-algebraic fundamental group[23] and derived Tannaka reconstruction of suitable stacks from symmetric monoidal stable \(\infty\)-categories[39] are exact precedents for the *completed reconstruction* side.

This makes the project's “fossil” intuition precise:

- the full presheaf or representation completion is the completed fossil;
- \(\mathcal P_n\) is the finite materialized view;
- a future goal/test \(q\) exposes an unresolved solution fiber; and
- only the probe needed to separate the relevant monodromy orbit is added.

The candidate law becomes

\[
(\mathcal P_n,q,\mathcal F_n)
\longmapsto
\mathcal P_{n+1}
=
\left\langle
\mathcal P_n,
\operatorname{leastProbe}(q,\operatorname{Mon}(\mathcal F_n))
\right\rangle .
\]

**Known part.** Restricted Yoneda profiles, dense probe categories, representation categories, and their completions are standard reconstruction mechanisms.[23,39]

**Residual gap.** The literature found here does not provide a canonical *goal- and obstruction-indexed generator of the next probe category*. It does not prove that the generator is least, presentation-invariant, finite at every stage, or asymptotically superior to consulting a fixed dense probe family. This dynamic test-category law—not the completed presheaf/Tannakian object—is the sharper candidate for algebraogenesis.

This branch also forces a useful design decision. If \(X\) remains fixed, “native realization” means that each new probe is an already valid map/test on \(X\); the system grows epistemically, not ontically. If \(X\) changes to make the probe executable, the stronger realization theory in §2.3 is still required. Conflating these branches would hide the central theorem obligation.

## 3. What the policy diagram adds—and what it does not

### 3.1 The good move: avoid an arbitrary coefficient policy

The current finite theorem selects \(\chi=u+v\) only inside a declared four-member sign-policy class. Replacing that one choice by the entire quotient-policy category is mathematically sound. It exposes whether obstruction, residual moduli, and contractibility persist under policy change. It also turns policy dependence from an informal caveat into a diagram that can be tested for naturality.

### 3.2 The standard part: the diagram itself

The full diagram is not beyond stacks, derived fibers, or persistence. Persistent sheaf cohomology already constructs persistence modules from sheaf-theoretic data, and correspondence/persistence sheaves unify several one-parameter persistence architectures under tameness assumptions.[29] These methods can summarize a *fixed* filtration or parameter category. They do not choose the parameter category or say which change should become semantic.

There is also no canonical barcode for an arbitrary policy category. A quotient lattice may be non-linear, non-Noetherian, or too large, and persistence invariants can discard higher transport. Any use of persistence must state the index category, tameness, and information loss.

### 3.3 The possible new part: a minimal, iterated admission law

The sharp claim to pursue is:

> There exists a presentation-invariant operator selecting, from the full policy-fiber diagram, the least observable extension that separates every currently endpoint-invisible but solution-relevant transport orbit, and the universal native realization of this extension generates the next policy-fiber diagram.

Even this statement needs choices resolved:

- What is “least”—subalgebra inclusion, reflective localization, initial extension, or an information preorder?
- Which paths count as solution-relevant?
- Are homology representations complete enough, or is the full action on the fiber required?
- Does taking all policies make the process vacuous or intractable?
- Does the operator commute with equivalences, quotients, and descent?
- Does iteration stabilize, diverge, or require transfinite stages?

Until these are answered, “algebraogenesis” is a research direction rather than a constructed foundational object.

## 4. Non-soficity: exact relevance and exact limits

The OpenAI manuscript updated August 6, 2026 claims an explicit non-sofic group. Its proof combines the Kun/Kun–Thom expander strategy with an expander-matching criterion and a binary Leavitt/Thompson-(V) construction.[30] The accompanying public repository contains Lean certificates for finitely encoded components of the ten announced results.[31] The manuscript, rather than a cited journal publication, is the current primary source as of this audit.

The key finite-approximation distinction is:

- **LEF:** every requested finite part of a multiplication table embeds exactly in some finite group, with the target allowed to depend on the finite part;
- **sofic:** finite sets admit increasingly accurate, increasingly free approximate actions in finite symmetric groups; and
- **non-sofic:** no global sequence of such finite permutation approximations exists.

The manuscript's bridge is specifically designed to recover a single-expander/LEF contradiction from many expander components.[30]

**Known consequence.** Non-soficity supplies a powerful local-versus-global obstruction to one particular finite approximation doctrine.[30]

**Not a consequence.** It does not imply that the group is uncomputable, continuously rather than symbolically defined, nonmeasurable, “transcendental” in an algebraic sense, nonreversible, or capable of solving hard complexity problems. It also does not automatically yield a generative observer or a new topology.

**Credible use here.** Turn a finite obstruction certificate extracted from the proof into an input to \(\Theta\): the certificate identifies which finite multiplication/transport patterns a fixed observer failed to preserve, and the admission law proposes the next path-sensitive probe. A theorem must then show that this feedback does more than replay the certificate or enlarge a fixed representation family.

## 5. Proof complexity and the algebrization boundary

Aaronson and Wigderson define algebrization as a barrier encompassing many relativizing algebraic techniques.[32] Chen, Hu, and Ren's ITCS 2026 paper proves new algebrization barriers for additional circuit-lower-bound settings using a missing-string/communication-complexity route.[33] Separately, Forbes and collaborators show that certain algebraic circuit lower bounds can be converted into lower bounds for restricted Ideal Proof System variants.[34]

These results impose a strict discipline on the project:

- Changing from a fixed algebra to a growing observable algebra does not by itself “cross the algebrization barrier.”
- One must define the computational/proof model, oracle extension, and permitted low-degree extensions, then prove the proposed lower-bound argument survives or escapes the relevant simulation.
- A dynamic language may still algebrize; a categorical or topological presentation may still compute only an algebraic invariant.

The direct architectural theorem should therefore precede any P-versus-NP rhetoric:

\[
\boxed{
\text{fixed bounded-cost global observers fail}
\quad\text{but}\quad
\text{the endogenous atlas succeeds with quantified cost}
}
\]

Only after the observer class includes the strongest obvious near-neighbors—matrix coefficients, higher rewriting cells, finite coalgebraic observers, and bounded programs—will this be informative.

## 6. Lateral frontier scan: concrete lessons only

### 6.1 Derived and categorical upgrades

Goerss–Hopkins obstruction theory has been generalized to structured objects in broad stable \(\infty\)-categorical settings; Mazel-Gee's 2024 paper provides a general obstruction-theory framework for \(\infty\)-categories.[35] The lesson is not that every obstruction creates a new coordinate. It is that a tower of moduli problems and derived fibers can retain deformation data and locate exact extension obstructions.

Ben-Zvi, Chen, Helm, and Nadler's 2023 categorical Deligne–Langlands work upgrades an algebra/module-level affine-Hecke picture to coherent sheaves on a derived parameter stack and retains endomorphism/categorical information invisible at the level of points.[36] This supports the project's insistence on keeping solution groupoids and morphisms rather than only endpoint values. The parameter stack and categorical correspondence remain externally specified.

### 6.2 Condensed mathematics

Clausen–Scholze condensed mathematics changes the ambient category so that topological/analytic objects acquire better categorical and abelian behavior; Scholze's lecture notes prove, among other foundational statements, that categories of condensed abelian groups are abelian.[37] Asgeirsson and collaborators' 2024 work isolates categorical foundations suitable for formalization of condensed mathematics.[38]

The concrete lesson is methodological: a successful foundational change should be given by a universal property, comparison functors, and exact closure theorems—not merely by calling an algebra “continuous.” Condensed/pyknotic methods do not themselves supply an endogenous question-admission process.

### 6.3 Formalized and executable mathematics

The UniMath algebraic-small-object formalization[7] and the Lean certificates accompanying the OpenAI manuscript[31] show that serious fragments of the relevant constructions can be made executable. Formalization can certify the finite fiber census, functoriality equations, and a proposed universal property. It cannot decide that a semantic admission rule is the right one; that choice must first be stated and justified mathematically.

## 7. Explicit non-implications for the larger research horizon

The survey supports ambitious construction, but it does not support the following inferences yet:

- **Hodge conjecture:** a Hodge class is not merely a collection of locally polynomial patches whose degrees may grow. A real bridge must define how the genesis object interacts with rational Hodge classes, cycle-class maps, and algebraic cycles. None of the present finite obstruction results does this.
- **Navier–Stokes:** weak-versus-strong solution theory is not equivalent to failure of a generic bounded global section. A bridge must enter the PDE's scaling, energy/enstrophy estimates, and regularity criteria. The cited “Stokes data” derived stack is unrelated to Navier–Stokes.[5]
- **Riemann hypothesis, Collatz, or Galois theory:** no invariant or reduction currently connects the policy-fiber process to these problems.
- **P=NP or algebrization:** no lower bound or simulation theorem has been proved for the proposed observer dynamics.[32–34]
- **A continuous or “irrational” algebra:** non-soficity alone supplies no such conclusion. Domain theory and synthetic topology already explain how discrete computation and continuous semantics coexist.[24–26]

These are not reasons to stop. They identify what a future bridge must actually carry.

## 8. Five actionable constructions and falsifiers

### Test 1 — Build the complete finite policy-fiber diagram

**Construction.** For the exact \(D_8\) interchange instance, enumerate the admissible finite-index \(Q\)-stable relation subgroups \(L\subseteq A\) up to a declared size bound, together with the four sign policies already exhausted. For every policy:

1. construct the simplicial/cochain groupoid \(\mathcal F(L)\) of coherent lifts;
2. compute \(\pi_0,\pi_1,\pi_2\) where finite;
3. classify the fiber as empty, noncontractible, or contractible;
4. compute every policy-induced map of fibers; and
5. compute automorphism-loop monodromy across the entire diagram.

**Success signal.** A transport distinction persists across a natural region of the policy diagram and canonically identifies a minimal separating subfunctor.

**Falsifier.** The diagram is completely equivalent to a fixed derived mapping stack and the proposed “new response” is only its ordinary truncation, with no new admission or realization law.

### Test 2 — Compare monodromy admission with Tannakian and groupoid closure

**Construction.** Starting from the executed eight-component lift fiber, form:

- the permutation representation of the loop group on components;
- its matrix-coefficient algebra over \(\mathbb F_2,\mathbb Q,\mathbb C\);
- the tensor/subquotient closure of generated representations;
- the associated groupoid convolution algebra; and
- the pro-algebraic/Tannakian shadow determined by all finite-dimensional representations.

Iterate the candidate admission rule once: add the least orbit distinction not in the old observable algebra, realize it natively, and recompute the fiber.

**Success signal.** The obstruction-selected minimal algebra is strictly smaller than the full Tannakian closure yet produces a genuinely new next solution problem, functorially and without a policy-specific basis choice.

**Falsifier.** The closure equals the ordinary coordinate/groupoid algebra from the first step, is independent of the obstruction, or stabilizes without changing the next native problem. Then the pivot is standard holonomy reconstruction, not genesis.

### Test 3 — Benchmark directly against polygraphic and AWFS completion

**Construction.** Encode the OP/PO interchange system as a 2-polygraph, enumerate critical branchings, and compute its Squier/homotopical completion through the first nontrivial higher cell. In parallel, encode the repair as a generating lifting problem and run the finite part of the algebraic small-object construction. Compare:

- generators and dimensions of attached cells;
- retained route histories;
- universal properties;
- automorphism/gauge actions; and
- the successor observable algebra.

**Success signal.** Semantic admission produces a presentation-invariant observable or native continuation not recoverable from either completion without adding an extra rule.

**Falsifier.** A computadic equivalence, Tietze equivalence, or AWFS comparison carries the entire project successor—including path distinctions and recurrence—without extra semantic input.

### Test 4 — Attempt capture by one fixed inductive-recursive/HIIT signature

**Construction.** Formalize the pair “current context / currently meaningful questions” as an inductive-inductive or HIIT object. Make the proposed \(\Theta\) constructor explicit. Then construct two executions with isomorphic current finite states but different hidden histories and test whether the next admitted question is determined by the semantic state alone.

Also attempt to encode the entire process as the initial algebra of one accessible endofunctor on pairs ((\mathcal C,\mathcal O)).

**Success signal.** A fixed meta-rule generates unbounded object-level questions, descends through semantic equivalence, and cannot be reduced to a precomputed rank/stage table. The theorem must state the exact restricted class of fixed schemas it separates from; it cannot claim separation from all definitions.

**Falsifier.** The next question depends on hidden run history, or a standard fixed HIIT/inductive-recursive schema captures every stage with no native semantic ingredient. The first means the rule is not state-based; the second means the generative substrate is established prior art.

### Test 5 — Non-sofic obstruction-driven scaling theorem

**Construction.** Convert a finite \((F,\varepsilon)\) obstruction certificate from the non-sofic proof into a probe-generation event. Declare a natural bounded-cost global observer class—initially fixed program features enriched with bounded-dimensional matrix coefficients and bounded polygraphic depth. Measure:

1. observer description/evaluation cost;
2. size of the generated local atlas;
3. number of obstruction-driven admissions;
4. whether admissions are invariant under certificate presentation; and
5. whether the atlas answers the target multiplication/transport queries exactly or within \(\varepsilon\).

**Success signal.** A proved family in which every observer of cost \(b(n)\) fails at some scale while the endogenous atlas succeeds with asymptotically smaller update/query cost. The quantifiers over \(F\) and \(\varepsilon\) must be explicit.

**Falsifier.** A fixed global observer enriched by the obvious Tannakian/polygraphic features simulates the atlas at comparable cost, or the non-sofic certificate never changes the admitted question. Either result would be valuable: it would locate the wrong abstraction before an ML architecture is built around it.

## 9. The direct path forward

The most direct rigorous route is now:

1. **Finish Test 1.** It removes the arbitrary policy choice and makes the current exact finite results into one functorial object.
2. **Run Tests 2 and 3 before naming a new structure.** Tannaka/holonomy and polygraphic completion are the strongest collision risks.
3. **State one admission universal property.** First attempt the epistemic form: the least finite enlargement of a restricted Yoneda/Tannakian probe category separating solution-relevant monodromy, with base-change and presentation invariance.
4. **Prove native realization.** An observable that cannot be computed by the successor continuation is only metadata.
5. **Then prove a restricted complexity separation.** This is the first result that would make the construction architecturally consequential.

The target theorem could have the following shape:

\[
\boxed{
\begin{minipage}{0.86\linewidth}
For a declared category of finite semantic problems satisfying specified smallness and descent hypotheses, there is an initial path-retaining extension that admits the matrix/orbit observables of obstruction-selected solution-fiber monodromy. The construction is presentation-invariant, stutters on contractible solved fibers, and iterates by a single accessible rule. On an explicit family, its local evaluation cost is asymptotically smaller than every observer in a declared bounded-cost fixed-doctrine class.
\end{minipage}
}
\]

Nothing in the surveyed literature proves this theorem as stated. Nearly every noun inside it, however, already has a mature theory. The research contribution will live in the arrows between them and in the separation theorem—not in renaming the components.

## 10. Query coverage and negative search results

The 165 decomposed queries were organized into 33 five-query angles:

1. higher/directed homotopy and exit paths;
2. obstruction fibers and holonomy;
3. sheaves, topoi, derived and condensed settings;
4. domain theory, formal topology, and generated questions;
5. non-sofic groups, LEF, and finite approximation;
6. proof complexity and algebrization;
7. secondary obstruction-to-transport mechanisms;
8. generated syntax/semantics;
9. continuous and synthetic computation;
10. information-theoretic local/global and contextuality patterns;
11. Garner's algebraic small-object argument and AWFS;
12. computads, polygraphs, and Squier completion;
13. Toda brackets and Massey products;
14. fibred categories of problems and solutions;
15. higher-dimensional rewriting;
16. inductive-inductive, quotient, higher, and recursive type formers;
17. bialgebraic semantics and distributive laws;
18. \(A_\infty/L_\infty\), operadic and bar-cobar resolutions;
19. condensed/derived/categorical-Langlands lateral methods;
20. formalized and executable mathematics;
21. Tannakian reconstruction and matrix coefficients;
22. holonomy groupoids and groupoid algebras;
23. rational and locally finite coalgebraic fixpoints;
24–28. exact follow-up searches on Tannaka, holonomy, bialgebraic semantics, inductive-recursive types, and cohomological-obstruction incompleteness;
29. stacks and solution homotopy fibers;
30. hyperdescent;
31. persistent sheaf invariants; and
32. exact primary sources for condensed/formalized mathematics; and
33. restricted Yoneda/Tannakian probe categories and dynamic test generation.

No primary source retrieved under these angles supplied the exact full chain

\[
\text{native obstruction fiber}
\to
\text{monodromy-selected observable}
\to
\text{endogenous question-category enlargement}
\to
\text{native realization}
\to
\text{iteration and strict observer separation}.
\]

That is a negative search result, not proof of no prior art. Searches were English-language, web-index dependent, and strongest in category/homotopy/type-theory terminology. There may be relevant work under institutions, doctrines, dynamic epistemic logic, realizability, categorical cybernetics, or less indexed higher-rewriting terminology. The next literature audit should be driven by the precise universal property produced after Tests 1–3, not by another broad metaphoric search.

## Sources

Relevance scores are the live Bright Data Discover scores from this 2026-08-10 sweep; they rank match to the supplied research intent, not mathematical quality.

[1] P. J. Haine, M. Porta, J.-B. Teyssier, “Exodromy beyond conicality,” arXiv:2401.12825, submitted 2024, revised 2026, forthcoming in *Journal of Topology*. <https://arxiv.org/abs/2401.12825> — relevance 0.671875.

[2] M. Jansen, “Stratified homotopy theory of topological \(\infty\)-stacks: a toolbox,” arXiv:2308.09550v3. <https://arxiv.org/html/2308.09550v3> — relevance 0.558594.

[3] P. Mayeda, “Exit path categories induced by group actions,” arXiv:2511.08907, submitted 2025. <https://arxiv.org/abs/2511.08907> — relevance 0.636719.

[4] N. Rasekh, “Cartesian Fibrations of Complete Segal Spaces,” *Higher Structures* 7 (2023). <https://higher-structures.math.cas.cz/api/files/issues/Vol7Iss1/Rasekh-2> — relevance 0.435547.

[5] M. Porta, J.-B. Teyssier, “The derived moduli of Stokes data,” arXiv:2504.05360, submitted 2025. <https://arxiv.org/abs/2504.05360> — relevance 0.449219.

[6] R. Garner, “Understanding the Small Object Argument,” *Applied Categorical Structures* (2008). <http://web.science.mq.edu.au/~rgarner/Papers/CT07.pdf> — relevance 0.664063.

[7] D. Hilhorst, P. R. North, “Formalizing the Algebraic Small Object Argument in UniMath,” ITP 2024, LIPIcs 309. <https://drops.dagstuhl.de/storage/00lipics/lipics-vol309-itp2024/LIPIcs.ITP.2024.20/LIPIcs.ITP.2024.20.pdf> — relevance 0.667969.

[8] Y. Guiraud, P. Malbos, S. Mimram, “A Homotopical Completion Procedure with Applications to Coherence of Monoids.” <https://webusers.imj-prg.fr/~yves.guiraud/articles/rta13.pdf> — relevance 0.417969.

[9] S. Mimram, “Computing Critical Pairs in 2-Dimensional Rewriting Systems.” <https://www.lix.polytechnique.fr/Labo/Samuel.Mimram/docs/mimram_rta10.pdf> — relevance 0.519531.

[10] D. Ara, A. Burroni, Y. Guiraud, P. Malbos, F. Métayer, S. Mimram, *Polygraphs: From Rewriting to Higher Categories*. <https://www.normalesup.org/%7Eara/files/polybook.pdf> — relevance 0.484375.

[11] H.-J. Baues, D. Blanc, S. Gondhali, “Higher Toda brackets and Massey products,” *Journal of Homotopy and Related Structures* (2016). <https://link.springer.com/article/10.1007/s40062-016-0157-8> — relevance 0.675781.

[12] J. Stasheff, “\(L_\infty\) and \(A_\infty\) structures: then and now,” *Higher Structures*. <https://higher-structures.math.cas.cz/api/files/issues/Vol3Iss1/Stasheff> — relevance 0.628906.

[13] P. Tamaroff et al., “Resolutions of operads via Koszul (bi)algebras,” *Journal of Homotopy and Related Structures* (2022). <https://link.springer.com/article/10.1007/s40062-022-00302-1> — relevance 0.492188.

[14] F. Nordvall Forsberg, A. Setzer, “Inductive-Inductive Definitions,” CSL 2010. <https://link.springer.com/chapter/10.1007/978-3-642-15205-4_35> — relevance 0.486328.

[15] N. Ghani, L. Malatesta, F. Nordvall Forsberg, “Positive Inductive-Recursive Definitions,” arXiv:1502.05561. <https://arxiv.org/abs/1502.05561> — relevance 0.492188.

[16] T. Altenkirch, A. Kaposi, “Type Theory in Type Theory using Quotient Inductive Types.” <https://akaposi.github.io/tt-in-tt.pdf> — relevance 0.574219.

[17] M. Fiore et al., “Quotients, inductive types, and quotient inductive types,” arXiv:2101.02994v4. <https://arxiv.org/html/2101.02994v4> — relevance 0.562500.

[18] A. Kaposi, A. Kovács, “Signatures and Induction Principles for Higher Inductive-Inductive Types,” arXiv:1902.00297. <https://arxiv.org/pdf/1902.00297v1> — relevance 0.546875.

[19] D. Turi, G. Plotkin, “Towards a Mathematical Operational Semantics.” <https://homepages.inf.ed.ac.uk/gdp/publications/Math_Op_Sem.pdf> — relevance 0.609375.

[20] F. Bonchi, R. Piedeleu, P. Sobociński, F. Zanasi, “Bialgebraic foundations for the operational semantics of string diagrams,” *Information and Computation* (2021). <https://www.sciencedirect.com/science/article/pii/S0890540121000821> — relevance 0.644531.

[21] R. Brown, İ. İçen, O. Mucuk, “Holonomy and monodromy groupoids,” arXiv:math/0110064. <https://arxiv.org/pdf/math/0110064> — relevance 0.722656.

[22] A. Román, “Convolution Algebras of Double Groupoids and Strict 2-Groups,” *SIGMA* 20 (2024), 093. <https://sigma-journal.com/2024/093/> — relevance 0.455078.

[23] C. Deninger, “A pro-algebraic fundamental group for topological spaces,” arXiv:2005.13893; *Proceedings of the Steklov Institute of Mathematics* 320 (2023). <https://arxiv.org/abs/2005.13893> — relevance 0.476563.

[24] S. Milius, D. Pattinson, T. Wißmann, “The Locally Finite Fixpoint,” CALCO 2015. <https://coalg.org/calco15/ei/milius.pdf> — relevance 0.507813.

[25] M. Escardó, “Synthetic topology of data types and classical spaces,” *Electronic Notes in Theoretical Computer Science* 87 (2004). <https://martinescardo.github.io/papers/entcs87.pdf> — relevance 0.464844.

[26] A. Bauer, “Turing Degrees in Synthetic Computability,” 2025 lecture slides. <https://d2y7tnbi225lw.cloudfront.net/2025-03/slides-%20Bauer.pdf> — relevance 0.396484.

[27] S. Abramsky, A. Brandenburger, “The Sheaf-Theoretic Structure of Non-Locality and Contextuality,” arXiv:1102.0264. <https://arxiv.org/abs/1102.0264> — relevance 0.507813.

[28] G. Carù, “On the Cohomology of Contextuality,” QPL 2016. <http://qpl2016.cis.strath.ac.uk/pdfs/QPL_2016_paper_25.pdf> — relevance 0.687500.

[29] F. Russold, “Persistent sheaf cohomology,” arXiv:2204.13446. <https://arxiv.org/abs/2204.13446> — relevance 0.488281.

[30] OpenAI, *Ten Advances in Mathematics and Theoretical Computer Science*, updated 2026-08-06. <https://cdn.openai.com/pdf/ten-proofs-oai.pdf> — relevance 0.675781.

[31] OpenAI, “Lean certificates accompanying ten proofs in mathematics and theoretical computer science.” <https://github.com/openai/ten-proofs> — relevance 0.734375.

[32] S. Aaronson, A. Wigderson, “Algebrization: A New Barrier in Complexity Theory.” <https://www.math.ias.edu/~avi/PUBLICATIONS/ABSTRACT/aw08ab.pdf> — relevance 0.667969.

[33] L. Chen, X. Hu, H. Ren, “New Algebrization Barriers to Circuit Lower Bounds via Communication Complexity of Missing-String,” ITCS 2026, LIPIcs 362. <https://drops.dagstuhl.de/storage/00lipics/lipics-vol362-itcs2026/html/LIPIcs.ITCS.2026.37/LIPIcs.ITCS.2026.37.html> — relevance 0.664063.

[34] M. A. Forbes et al., “Proof Complexity Lower Bounds from Algebraic Circuit Complexity,” *Theory of Computing* 17 (2021). <https://theoryofcomputing.org/articles/v017a010/> — relevance 0.628906.

[35] A. Mazel-Gee, “Goerss–Hopkins obstruction theory for \(\infty\)-categories,” *Advances in Mathematics* (2024). <https://www.sas.rochester.edu/mth/sites/doug-ravenel/otherpapers/mazel-gee24.pdf> — relevance 0.406250.

[36] D. Ben-Zvi, H. Chen, D. Helm, D. Nadler, “Coherent Springer theory and the categorical Deligne–Langlands correspondence,” *Inventiones Mathematicae* 235 (2023). <https://link.springer.com/content/pdf/10.1007/s00222-023-01224-2.pdf> — relevance 0.421875.

[37] D. Clausen, P. Scholze, *Lectures on Condensed Mathematics*. <https://www.math.uni-bonn.de/people/scholze/Condensed.pdf> — relevance 0.609375.

[38] D. Asgeirsson et al., “Categorical Foundations of Formalized Condensed Mathematics,” arXiv:2407.12840 (2024). <https://arxiv.org/abs/2407.12840> — relevance 0.484375.

[39] H. Fukuyama, I. Iwanari, “Monoidal Infinity Category of Complexes from Tannakian Viewpoint,” arXiv:1004.3087v2. <https://arxiv.org/pdf/1004.3087.pdf> — relevance 0.361328.
