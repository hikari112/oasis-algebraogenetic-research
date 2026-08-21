# Endogenous expressibility: an object-first foundation

## Status and claim boundary

This note specifies a minimal mathematical object for the following proposal:

> Interaction can make a question meaningful or executable whose formation
> was not available in the preceding object language, and the certificate of
> that birth can itself become a premise for later formation.

The proposal is not that a finite event becomes absolutely indescribable. A
fixed metalanguage must encode the system, its verifier, and every finite
certificate. The substantive distinctions are relative:

- which judgments are derivable in the current **object language**;
- which meaningful questions have an executable capability;
- which extensions are forced by a retained causal history;
- which information is destroyed by a declared forgetful map; and
- which costs are bounded uniformly in a declared observer model.

No novelty or priority claim is made here. The definitions below are a target
specification. Except for the elementary born-address lemma and the
externalization proposition, all named separation results are theorem targets,
not established facts.

The reset is deliberately broader than a cohomological or group-theoretic
model. Persistent classes, torsors, holonomy, probabilities, algebras, and
continuous completions can be realizations or shadows of the object below;
none is assumed primitive.

## 1. Three levels that must not be conflated

There are three increasingly strong phenomena.

### Level A: answer-dependent address

There is a fixed question type \(Q\), every potential address is already a
well-formed member of \(Q\), and an answer selects which address should be
queried next. This is ordinary causal adaptivity:

\[
q_{i+1}=S(q_0,a_0,\ldots,q_i,a_i).
\tag{1}
\]

The selected address is new to the run, not new to the language. The
born-address lemma in Section 9 calibrates exactly this level and no higher.

### Level B: generated algebra inside a fixed formation doctrine

A fixed metagrammar or formation monad \(F\) can form signatures, predicates,
coordinates, sorts, constructors, or programs. An interaction supplies a
certificate for adjoining new generators or relations to the current
\(F\)-algebra. The active object vocabulary grows, but \(F\) itself does not.
Even a fresh sort or constructor is Level B when it is a free or presented
generator extension under this fixed formation doctrine.

To establish Level B rather than Level A, one needs all of the following:

1. the admitted generator or relation was not already an askable old question
   under a renaming of the fixed query type;
2. its admission is invariant under equivalent presentations of the same
   causal evidence;
3. the admission has a minimal or initial role among the declared
   metagrammar extensions that resolve the certificate; and
4. a stated old-observer or old-definition class cannot recover the admitted
   coordinate at uniformly bounded cost.

The fourth item is always relative to the declared class. Without it, Level B
can collapse to a convenient macro expansion.

### Level C: generated formation doctrine

An interaction changes the active formation monad or metadoctrine itself. It
may introduce a new kind of binder, dependent question former, admissible
context extension, or formation premise that is not obtained by freely
adjoining generators or relations to an algebra for the old \(F\).

To establish Level C rather than Level B, one additionally needs:

1. a universal birth certificate at the level of formation doctrines, not
   just a distinguished algebra or predicate interpretation;
2. proof that the extension is not in the essential image of generator or
   relation adjunction for the old formation doctrine;
3. failure of a declared conservative translation back into the previous
   formation doctrine;
4. preservation of the birth role by genetic equivalence; and
5. a later judgment whose derivation essentially uses the generated former.

The rule code still exists in the metalanguage. “Born” means admitted with a
new object-language role, not created outside all possible descriptions.

## 2. Fixed metalanguage and growing object language

The distinction between levels is meaningful only if the two layers are
typed separately.

Fix once and for all a **formation kernel**

\[
\mathbb K=(\mathsf{QCode},\mathsf{ACode},\mathsf{RuleCode},\mathsf{FormCode},
\mathsf{Check},\mathsf{Gen}).
\tag{2}
\]

Here:

- \(\mathsf{QCode}\), \(\mathsf{ACode}\), \(\mathsf{RuleCode}\), and
  \(\mathsf{FormCode}\) are effective universes of finite codes, the last
  presenting possible object-level formation doctrines;
- \(\mathsf{Check}\) checks finite derivations and birth certificates; and
- \(\mathsf{Gen}\) is a fixed, possibly relational, procedure that maps a
  finite valid interaction record to finitely presented candidate extension
  problems.

This is the metalanguage. It supplies generic structural operations and a
verifier; it does **not** declare every code meaningful in the object
language. A code can exist in \(\mathsf{RuleCode}\) or \(\mathsf{FormCode}\)
while no current judgment permits its use.

At a history \(h\), the object language is a finitely presented doctrine

\[
\mathcal L_h=(\Sigma_h,R_h,\mathsf{Der}_h),
\tag{3}
\]

where \(\Sigma_h\) is the admitted signature, \(R_h\) includes an active
formation presentation \(F_h\) and its inference rules, and
\(\mathsf{Der}_h\) is the least derivability relation generated by those rules
and the fixed structural fragment of \(\mathbb K\). A Level-B birth changes the
presented \(F_h\)-algebra while retaining \(F_h\); a Level-C birth changes
\(F_h\) itself. The fixed kernel verifies both kinds without pre-admitting
their codes to the current object language.

The minimal version is well founded:

1. a birth at \(h\) is checked using only \(\mathcal L_h\), the finite causal
   support of the event, and the event's answer;
2. its payload is a finite signature-and-rule block \(\Delta_b\);
3. premises of \(\Delta_b\) can refer to old judgments and positively to
   declarations in the same finite block, subject to the fixed well-founded
   formation check; and
4. no rule in \(\Delta_b\) may justify the admission of \(\Delta_b\) itself.

Thus the enlarged doctrine is the least closure

\[
\mathcal L_{h+b}=\operatorname{Cl}_{\mathbb K}
(\mathcal L_h\cup\Delta_b),
\tag{4}
\]

not the solution of an untyped self-reference equation. Stronger
inductive-recursive variants can be studied later, but they are not smuggled
into the minimal object.

## 3. External-counter-free causal formation systems

### 3.1 Histories

A **finite causal history** is a finite labelled poset \(h=(E_h,\le_h,\ell_h)\).
For an event \(e\in E_h\), its causal past

\[
\partial e=\{d\in E_h:d<e\}
\tag{5}
\]

is required to be down-closed. Its label records a question, a capability, an
answer, and an optional birth certificate. The label must be valid using only
the doctrine generated by \(\partial e\).

A history extension \(h\hookrightarrow h'\) is a down-closed, label-preserving
embedding. Histories are identified up to causal-poset isomorphism and
certificate equivalence, not by the spelling or order of a chosen
linearization.

There is no stage field \(n\), clock transition \(n\mapsto n+1\), or family of
rules indexed by an externally supplied integer. Cardinality, causal depth,
and height can of course be computed from a finite history; they are intrinsic
properties, not an independent source of new rules. The system is
**external-counter-free** when every formation, enabling, transition, and
birth operation is natural under causal isomorphism, invariant under semantic
stutter as defined in Section 8, and **support-local**: adjoining causally
unrelated events outside the normalized support of an interaction cannot
change its generated problem or universal birth role.

Support is proof-relevant. Every derivation records dependencies for question
formation, answer typing, capability enablement, execution, and birth. After
removing weakening-only citations, \(\mathsf{Supp}(e)\) is their transitive
causal closure. Equivalent proofs related by support thinning must produce
equivalent transitions and birth roles, and independent base change outside
that closure must commute with generation. These requirements prevent a
certificate from padding its support with every earlier event.

This notion eliminates a supplied scheduler counter, not every recoverable
notion of age. A rule may still depend on intrinsic depth of its normalized
support. A stronger **depth-free** claim must separately prove invariance under
all allowed depth-changing refinements; it is not asserted here.

### 3.2 Local questions and answers

For each history \(h\), define two judgments on raw question codes:

\[
h\vdash q\;\mathsf{meaningful},
\qquad
h\vdash q\;\mathsf{askable}.
\tag{6}
\]

The first is an object-language formation judgment in \(\mathcal L_h\). The
second means that the meaningful question currently has an executable
capability. Write

\[
\mathsf Q_h=\{q:h\vdash q\;\mathsf{meaningful}\},
\qquad
\mathsf E_h=\{q\in\mathsf Q_h:
\mathsf{Cap}_h(q)\ne\varnothing\}
\tag{7}
\]

for the meaningful and enabled families. Every \(q\in\mathsf Q_h\) has a
local answer family \(\mathsf A_h(q)\). This family may depend on the current
doctrine and therefore need not be the restriction of one timeless global
answer set.

### 3.3 Capabilities and enabling

A **capability doctrine** assigns a type or groupoid

\[
\mathsf{Cap}_h(q)
\tag{8}
\]

to every meaningful \(q\). A capability is a realizer, handler, experiment,
or strategy that makes \(q\) executable. Then

\[
h\vdash q\;\mathsf{askable}
\quad\Longleftrightarrow\quad
\mathsf{Cap}_h(q)\ne\varnothing.
\tag{9}
\]

Capabilities restrict naturally along causal isomorphisms. A realization must
explicitly declare how they change along history extensions; monotonicity is
not assumed, because an interaction may consume or disable a capability. They
need not be freely copyable, reversible, or cancellative. A resource-sensitive
realization may replace (8) by \(\mathsf{Cap}_h(\rho,q)\), where \(\rho\) lies
in an ordered monoidal resource doctrine.

The distinction in (6) is load-bearing. A question can be meaningful but not
yet executable; conversely, a raw code may fail even to be a question in the
current language.

### 3.4 Interaction events

An event over \(h\) consists of

\[
e=(q,\kappa,a,b),
\quad
q\in\mathsf E_h,
\quad
\kappa\in\mathsf{Cap}_h(q),
\quad
a\in\mathsf A_h(q),
\tag{10}
\]

where \(b\) is either a checked birth certificate or the null certificate.
The extension \(h\rightsquigarrow h+e\) adjoins an event supported by the
normalized transitive dependency closure of the meaningfulness derivation,
answer typing, capability enablement and execution, and birth certificate.
Unused or weakening-only events must not be placed below \(e\).

This makes causal support part of the object. A scheduler may choose a
linearization for execution, but the semantic history is the resulting
dependency poset, not the scheduler's step count.

## 4. Birth certificates and universal birth roles

### 4.1 Weak birth certificate

A weak birth certificate at \(h\) is finite data

\[
b=(S_b,q,\kappa,a,\mathcal P_b,\Delta_b,\pi_b),
\tag{11}
\]

where:

- \(S_b\subseteq h\) is the finite down-closed causal support;
- \((q,\kappa,a)\) is the triggering interaction;
- \(\mathcal P_b\) is a kernel-level extension problem parameterized by finite
  premises derivable in \(\mathcal L_h\) (and, for Level B, may reduce to an
  ordinary algebra-extension problem internal to \(\mathcal L_h\));
- \(\Delta_b\) is a finite proposed object-language extension; and
- \(\pi_b\) is a derivation accepted by \(\mathsf{Check}\) that the extension
  solves \(\mathcal P_b\) and obeys the formation restrictions of Section 2.

A weak certificate proves admissibility. It need not prove that the extension
is canonical, minimal, or semantically forced.

### 4.2 Universal birth certificate

Fix a declared essentially small category of admissible strict or homotopy
doctrine extensions. Let \(\mathsf{Ext}(h,\mathcal P_b)\) be its category of
extensions \(j:\mathcal L_h\to\mathcal M\) equipped with a realization of
\(\mathcal P_b\). Morphisms commute with the map from \(\mathcal L_h\), carry
the identified extension problem to itself, and preserve its realization in
the declared strict or homotopy-coherent sense. A finite certificate of
initiality is meaningful only relative to a sound proof calculus for this
declared category.

A **universal birth certificate** enhances (11) with an extension

\[
i_b:\mathcal L_h\longrightarrow\mathcal L_{h+b}
\tag{12}
\]

and evidence that \((i_b,\eta_b)\) is initial in
\(\mathsf{Ext}(h,\mathcal P_b)\), or homotopy-initial when the target is
groupoid-enriched. Equivalently, every admissible solution factors through
\(i_b\), uniquely or through a contractible space of choices:

\[
\operatorname{Map}_{\mathsf{Ext}(h,\mathcal P_b)}
((i_b,\eta_b),(j,\xi))\simeq *.
\tag{13}
\]

The pair \((\mathcal P_b,i_b)\), not the printed name of a new symbol, is its
**universal birth role**. Each history retains this role in the event label.
Consequently a later rule can require “the universal solution born from this
causal support” without choosing an arbitrary representative or relying on a
global stage number.

Initiality is not automatic. If \(\mathsf{Ext}(h,\mathcal P_b)\) has no initial
object, the event is at most a weak birth. If the initial object is equivalent
to the identity extension, only the **birth component** is trivial; the whole
event is a semantic stutter only when the future-equivalence condition of
Section 8.1 also holds.

### 4.3 Birth can affect later formation

For a genuine Level-C event, there must be a later finite history
\(k\supseteq h+b\) and a judgment \(J\) such that

\[
k\vdash J,
\qquad
k-b\not\vdash J,
\tag{14}
\]

where \(k-b\) is a separately validated ablation obtained by replacing \(b\)
with a null event and replaying exactly those later events that remain well
typed. The target requires such an ablation to exist; deleting an event from
an invalid dependent history is not evidence. Moreover, every derivation of
\(J\) in \(k\) must use the universal formation-doctrine birth role of \(b\),
not merely its answer value or a generator freely adjoined under the old
doctrine. Condition (14) is the operational content of selection-to-formation
feedback.

## 5. The full object and its four shadows

A **causal effectivity doctrine** is the tuple

\[
\mathfrak G=
(\mathsf H,\{\mathcal L_h\},\{\mathsf A_h\},
 \{\mathsf{Cap}_h\},\mathsf{Step},\mathsf{Birth},\mathsf{Supp}),
\tag{15}
\]

with the structures above, transport under causal isomorphisms, specified
update laws under history embeddings, and all declared independence and
coherence data. Capabilities need not vary monotonically.

Write

\[
\mathsf S_h=(h,\mathcal L_h,\mathsf A_h,\mathsf{Cap}_h,
\mathsf{Step}_h,\mathsf{Birth}_h,\mathsf{Supp}_h)
\tag{15a}
\]

for the full process state pointed at \(h\). The observer transformations below
take \(\mathsf S_h\), not merely \(\mathcal L_h\), as input.

Four forgetful maps expose four different ways to lose causal information.

### 5.1 Dependency flattening: the static fossil

Let \(U_{\rm stat}\) be an observer that forgets capabilities, causal supports,
event order, and birth certificates from the full state while retaining only
the extensional object doctrine. The instantaneous fossil is

\[
\operatorname{Fos}_0(h)=U_{\rm stat}(\mathsf S_h).
\tag{16}
\]

When defined on history morphisms, it retains only the induced static doctrine
map. When
the required colimit exists, the completed static fossil is

\[
\operatorname{Fos}_\infty(\mathfrak G)
=
\underset{h\in\mathsf H}{\operatorname{colim}}
U_{\rm stat}(\mathsf S_h),
\tag{17}
\]

with all provenance forgotten. If the colimit does not exist, the fossil is
the corresponding ind-diagram after erasing causal labels. Two processes may
therefore share a fossil while differing in which answer created an address,
which birth was a prerequisite, or which future formation rule became legal.

### 5.2 Group completion of resources

If capabilities use an ordered commutative resource monoid \(M_h\), its group
completion

\[
U_{\rm grp}:M_h\longrightarrow K(M_h)
\tag{18}
\]

forgets noncancellative and reachability information. In particular it may
identify distinct reachability situations and forget that \(k\) enables
\(x\to y\) while returning unchanged. Failure of injectivity or order
reflection in (18) is a catalysis result, not by itself a formation-birth
result.

### 5.3 Arity truncation

Fix a labelled primitive input interface \(I\), including which ports may be
jointly controlled, and allow only recodings preserving that interface and its
declared product structure. Let \(U^I_{\le r}\mathcal L_h\) retain restrictions
to subinterfaces of size at most \(r\). Equivalently, a more invariant
realization may use cross-effects of order at most \(r\). Without this fixed
interface, a ternary relation can be recoded as unary on a product sort and
syntactic arity has no invariant meaning. Relative to \(I\), distinct doctrines
may have identical low-order shadows while differing in an \((r+1)\)-way
enabling or formation condition. This is a contextual-order result, not by
itself evidence of generated syntax.

### 5.4 Denotational evaluation of residual programs

In an operational realization, an answer may include residual code \(p\) with
future scope. The map

\[
U_{\rm den}:(v,p,\Gamma')\longmapsto
\llbracket(v,p,\Gamma')\rrbracket_{\rm now}
\tag{19}
\]

evaluates what is currently executable and discards the residual program,
its scope, and the future contexts in which it can run. Failure to reflect
operational equivalence, or an explicit collision under \(U_{\rm den}\), is an
operational-versus-denotational result, not yet a universal birth theorem.

The first research tournament should state and prove the exact loss for each
observer separately: failure of essential injectivity or equivalence
reflection on process states, loss of a reachability relation, or collision of
declared observations. Calling every such loss “nonfaithfulness” would be
category-theoretically wrong. Four separate collisions calibrate four losses;
they do **not** show that one process unifies them or that a new foundational
law has been found.

## 6. Genetic bisimulation

Static equivalence is intentionally too weak. A **genetic bisimulation**
between causal effectivity doctrines \(\mathfrak G\) and \(\mathfrak G'\) is a
relation \(R\subseteq\mathsf H\times\mathsf H'\), together with equivalences
of local doctrines and capability families, satisfying:

1. **roots:** the empty histories are related;
2. **formation:** if \(hRh'\), the equivalence carries meaningful questions,
   local answer families, and enabled capabilities at \(h\) to those at
   \(h'\);
3. **forth:** every nonstutter event \(e=(q,\kappa,a,b)\) over \(h\) has a
   matching event \(e'\) over \(h'\), with \(h+e\;R\;h'+e'\);
4. **back:** the symmetric condition holds from \(\mathfrak G'\) to
   \(\mathfrak G\);
5. **support:** matching events have isomorphic causal support downsets;
6. **birth role:** null births match null births, weak births match equivalent
   extension problems, and universal births match equivalences of extension
   categories carrying initial objects to initial objects; and
7. **independence:** declared independent events and their coherence cells are
   preserved.

The chosen local equivalences must be pseudonatural along every matched event
and coherent around the declared independence cells. In the birth-role clause,
the equivalence of extension categories must commute with the maps from the
identified base doctrine and carry the identified extension problem and its
initial solution together. Unrelated pointwise equivalences do not define a
genetic bisimulation.

Write \(\mathfrak G\simeq_{\rm gen}\mathfrak G'\) when such a bisimulation
exists. A weak form allows a finite zigzag of semantic stutters before and
after each matched event.

The birth-role clause prevents a process from matching a generated formation
rule with an accidental old symbol having the same current extension. Genetic
bisimulation is presentation invariant by construction, provided the local
equivalences act on roles rather than literal codes.

## 7. Complexity and compactness

### 7.1 Born-address complexity

For a task family \(T_n\), let

- \(C_{\rm causal}(T_n)\) be the least worst-case cost of a strategy whose next
  already meaningful question can depend on earlier answers; and
- \(C_{\rm flat}(T_n)\) be the least worst-case cost of an observer that must
  choose all of its old-language questions before seeing any answer.

The **born-address profile** is the pair

\[
\operatorname{BA}_{T}(n)=
(C_{\rm causal}(T_n),C_{\rm flat}(T_n)).
\tag{20}
\]

It measures Level A. To measure Levels B or C one must additionally declare a
class \(\mathcal C\) of old presentations and, for a family of births \(b_n\),
define

\[
C^{\mathcal C}_{\rm externalize}(b_n)
=
\inf\{\operatorname{cost}(d):d\in\mathcal C
\text{ represents the birth role of }b_n\}.
\tag{21}
\]

A Level B/C advantage requires a uniform theorem comparing (21) with the cost
of the universal births, proving invariance under the allowed changes of
presentation, and specifying the quantifier order over instances and
observers. A single expensive birth, or an unbounded quantity with no declared
\(\mathcal C\) or cost model, has no such content.

### 7.2 Causal compactness

Let \(\mathsf H_{\rm fin}\) be the category of finite histories and specified
down-closed embeddings. An **ind-history** is a filtered diagram
\(H:I\to\mathsf H_{\rm fin}\); retaining the diagram rather than posetifying
isomorphism classes preserves distinct embedding maps. Assume
\(h\mapsto\mathcal L_h\) is a coherent functor on these embeddings and that
the monotone formation-doctrine maps along this diagram admit

\[
\mathcal L_H=\underset{i\in I}{\operatorname{colim}}\mathcal L_{H(i)}.
\tag{22}
\]

A finite judgment code \(J\) is identified along these embeddings, and
\(H\vdash J\) means that its transported representative has a derivation in
\(\mathcal L_H\) using the declared inference semantics. It has **finite causal
support** when

\[
H\vdash J
\quad\Longrightarrow\quad
\exists i\in I\text{ such that }H(i)\vdash J.
\tag{22a}
\]

A finitary proof calculus makes (22a) automatic: a finite derivation uses
finitely many premises, and filteredness places them in one finite
\(H(i)\). The substantive property is **uniform causal compactness** over a
family \(\mathcal F\): one bound \(B\) on the size or cost of a witnessing
support, measured in a declared presentation-invariant cost model.

Finite support does not imply a uniform bound. This is the clean place to state
“every realized finite question has finite causal support, but there is no
global stopping depth.” Nonmonotone capability doctrines do not inherit the
colimit definition above; they require a separately declared stable or
domain-theoretic limit semantics. A genuinely noncompact limit judgment is not
an executable finite birth unless the model explicitly admits infinitary
certificates.

## 8. Stutter, confluence, presentation, and curvature

### 8.1 Semantic stutter

An event is a **stutter** when its birth extension is equivalent to the
identity and there is an equivalence between the entire future transition
doctrines before and after it that is the identity on retained questions,
answers, capabilities, and birth roles. Stutter equivalence is generated by
inserting or deleting such events and by causal-poset isomorphism. An event
whose answer silently changes a later branch is therefore not a stutter.

Every claimed semantic invariant must factor through stutter equivalence. A
construction that changes merely because an idle event was inserted contains
a hidden clock.

### 8.2 Independent confluence

Events \(e\) and \(f\) enabled at \(h\) are **independent** only when their
normalized supports and resource uses are compatible, executing either event
preserves the other's triggering question, answer family, and capability up
to specified transport, and both composite executions exist. Shared
consumable resources violate independence unless a declared copying or
commutation law supplies the comparison. Independent confluence then requires
a completion diamond

\[
\begin{array}{ccc}
&h&\\
{}^{e}\swarrow&&\searrow^{f}\\
h_e&&h_f\\
{}_{f}\searrow&&\swarrow_{e}\\
&h_{ef}&
\end{array}
\tag{23}
\]

up to genetic equivalence, together with coherent comparison on all triple
overlaps. This is a condition to prove for a proposed system, not a license to
identify arbitrary path words.

### 8.3 Presentation invariance

Let \(\mathsf{Pres}\) be the groupoid of admissible recodings of signatures,
questions, answers, resources, and certificate proofs. A construction is
presentation invariant when it descends to the localization of causal
effectivity doctrines by \(\mathsf{Pres}\) and stutter equivalences. Literal
symbol names, matrix bases, event identifiers, and scheduler linearizations
cannot carry an invariant.

### 8.4 Genesis curvature

Curvature requires a nontrivial filler problem; it is not determined by a
static endpoint. Let \(\mathsf{Path}_1(\mathfrak G)\) be the causal execution
path category, and let \(\mathcal B\) be a declared family of parallel path
boundaries \(\beta=(p,q)\) for which semantic coherence is desired. Start with
transport only on the 1-skeleton,

\[
T:\mathsf{Path}_1(\mathfrak G)\longrightarrow\mathcal D,
\tag{24}
\]

into an \((\infty,2)\)-category or another enriched target with mapping spaces
between parallel 1-cells. For \(\beta=(p,q)\), define the admissible filler
space

\[
\mathsf{Fill}_T(\beta)
=
\{\theta:T(p)\Rightarrow T(q):
\theta\text{ satisfies the declared semantic boundary conditions}\}.
\tag{25}
\]

Its homotopy type is the **genesis coherence defect**. An empty filler space is
an obstruction to extending \(T\) across that boundary; multiple
components or nontrivial higher automorphisms retain higher path information.
The transport is flat on \(\mathcal B\) when all these spaces are
contractible and the chosen fillers satisfy the required higher coherences.

In an ordinary \((2,1)\)-category the fillers between fixed parallel 1-cells
form only a set, so one may discuss emptiness or multiplicity but not higher
automorphisms without this enrichment.

If \(T\) is already a 2-functor on a supplied 2-cell
\(\sigma:p\Rightarrow q\), then \(T(\sigma)\) is a filler and the ordinary
equivalence class of \(T(q)^{-1}T(p)\) is trivial. Thus a nontrivial claim must
concern an obstruction to extension or a noncontractible restricted filler
problem, with the semantic boundary conditions and gauge quotient explicitly
declared. It cannot be inferred from unequal raw path spellings.

## 9. Exact Level-A calibration

### Born-address lemma

Let \(X\) be a finite set with \(|X|=N\ge2\), let \(x\in X\), and let an oracle
hold an arbitrary function \(f:X\to X\). The task is to compute \(f^2(x)\).

1. A causal strategy needs exactly two point queries in the worst case.
2. Any deterministic nonadaptive point-query strategy correct for every
   \(f\) must query all \(N\) addresses.

Hence

\[
\operatorname{BA}_{f^2}(N)=(2,N)
\tag{26}
\]

when repeated queries are free to omit and point queries have unit cost.

**Proof.** Query \(x\), receive \(y=f(x)\), then query the answer-dependent
address \(y\) and return \(f(y)\). One query cannot suffice. If its address is
\(x\), choose \(y\ne x\), hold \(f(x)=y\) fixed, and vary the unqueried value
\(f(y)\). If its address is \(s\ne x\), hold the queried value fixed at
\(f(s)=s\), but compare \(f_0(x)=x\) with \(f_1(x)=s\). These pairs have the
same one-query transcript and different second iterates at \(x\), including
when \(N=2\).

Now let \(S\) be the fixed set of addresses queried by a nonadaptive
strategy.

If \(x \notin S\), choose \(u \ne x\). Make two functions agree on every address
other than \(x\), with the common value at \(u\) equal to \(u\). Set \(f_0(x)=x\)
and \(f_1(x)=u\). The query transcripts agree, including when \(N=2\), while
\(f_0^2(x)=x\) and \(f_1^2(x)=u\). Thus correctness requires \(x \in S\).

Now suppose \(z \notin S\). Then \(z \ne x\). Make two functions agree on \(S\),
both with \(f(x)=z\), and set their values at the unqueried address \(z\) to
\(x\) and \(z\), respectively. Their transcripts agree while their second
iterates at \(x\) are \(x\) and \(z\). Hence no address can be omitted, so
\(S=X\). \(\square\)

This lemma proves only that an answer can create the *needed location* of the
next query. Every \(z\in X\) was already an old, meaningful address. It gives
neither a new predicate nor a new formation doctrine. Promoting it to Level B
requires the invariant minimal admission and old-observer separation listed in
Section 1; promoting it to Level C additionally requires (12)--(14) and the
non-generator condition of Section 1.

## 10. Four optional realization lenses

The minimal system (15) does not assume any of the following. Each is an
alternative realization that tests whether the foundation is too narrow.

### 10.1 Catalytic capability

Enrich capabilities by an ordered monoidal resource doctrine and permit

\[
x\otimes k\longrightarrow y\otimes k
\tag{27}
\]

even when \(x\not\to y\). The resource \(k\) is unchanged at the endpoints but
is causally necessary. This model warns that an endpoint-invariant component
or a zero linear residue need not be inert. The relevant invariant is the
change in reachable transformations after deleting \(k\), not a coordinate
assigned to \(k\).

### 10.2 Counterfactual strategy semantics

Replace an actual-run capability by a strategy over all allowed answer
branches. Two histories can share actual answers and static fossils yet differ
in which questions would become enabled after unrealized answers. This model
requires game trees or event structures beyond the actual finite poset. The
counterfactual branches are additional semantic data, not silently present in
(15).

### 10.3 Residual evaluator

Let evaluation return

\[
\mathsf E(\Gamma,t,\kappa)=(\Gamma',v,p),
\tag{28}
\]

where \(p\) is residual executable syntax and \(\Gamma'\) may contain a newly
certified formation rule needed to run \(p\) later. A genuine Level C case
requires future insertion of \(p\) into a context that is not formable in
\(\Gamma\), together with a universal certificate for \(\Gamma\to\Gamma'\).
Returning a closure or continuation of an already fixed language is only
Level A or B unless this stronger condition is met.

### 10.4 Higher-arity contextual formation

Fix a primitive input interface \(I\) and filter doctrines by interaction
order, or use cross-effects relative to \(I\). It is possible in principle for
every unary and binary shadow to agree while a ternary context enables a
birth. Linear, pointwise, or pairwise invariants can then vanish even though
the full process differs. Any such claim must exhibit two exact finite
doctrines with equal \(U^I_{\le2}\) shadows and inequivalent ternary birth
roles; merely writing a ternary term, or recoding it as unary on a product
sort, is not a separation.

## 11. The theorem program

### Target 0: existence and well-foundedness

Construct a nontrivial finite kernel \(\mathbb K\) for which valid histories
form a category under down-closed embeddings, doctrine growth (4) is
well-founded, and all transition operations factor through causal-poset
isomorphism, support thinning and independent base change, and stutter
equivalence.

**Exact falsifier:** a generated rule is needed to validate its own birth; an
idle-event insertion changes a later rule; or composition of valid history
embeddings fails; or padding a proof support changes generation.

### Target 1: the four-shadow tournament

Give four small audited pairs proving the correctly typed collision for
\(U_{\rm stat}\), \(U_{\rm grp}\), \(U^I_{\le r}\), and \(U_{\rm den}\): for
example failure to reflect process equivalence, loss of a reachability
relation, or equality of declared observations.

**Exact falsifier:** the purportedly distinct pair is genetically bisimilar,
the two shadows are not actually isomorphic, or the distinguishing query was
left inside the shadow being claimed to forget it.

This target is calibration only. A direct product of four independent
witnesses is not a genesis theorem.

### Target 2: a genuine Level-B birth

Construct a finite process with a universal coordinate-admission certificate,
presentation invariance, and a proved separation against a natural bounded
old-observer class. Prove that it is not merely the Level-A selection of an
already askable address.

**Exact falsifier:** an old-language term of the declared bound defines the
coordinate; changing raw names changes admission; or the extension problem
has several incomparable “canonical” solutions and no retained universal
role.

### Target 3: a genuine Level-C birth

Construct a finite process satisfying (12)--(14): the interaction changes the
active formation doctrine, the extension is initial in a declared category
and is not induced by generator adjunction for the old doctrine, and a later
judgment essentially consumes the retained birth role.

**Exact falsifier:** the new rule is a macro or definitional extension in the
declared old doctrine; the later derivation can eliminate it; the certificate
depends on a chosen presentation; or the metakernel contains an extensional
lookup table of all future admissions indexed by causal depth.

### Target 4: one coupled irreducible witness

The first genuinely nontrivial synthesis should be one finite process—not a
direct product—in which:

1. an answer supplies the address used by the next interaction;
2. an endpoint-invariant catalyst is necessary to enact that interaction;
3. the answer, catalyst role, and a third contextual input jointly generate a
   Level-C formation problem invisible to every binary shadow relative to the
   fixed primitive input interface;
4. the resulting rule has a universal birth certificate and is essentially
   used later; and
5. deleting **any one** of the three mechanisms destroys the birth.

Its causal dependency hypergraph must be connected, and the process must not
factor, up to genetic bisimulation, as a product containing separate adaptive,
catalytic, and higher-arity components.

**Exact falsifier:** any mechanism can be replaced by a constant without
changing the birth; a nontrivial product factorization exists; a binary
observer recovers the ternary trigger; group completion retains the alleged
catalytic distinction; or the final rule lacks the universal property.

### Target 5: finite but not uniformly bounded support

Build a family in which every admitted finitary judgment has a finite causal
support, while the least support costs are unbounded under a presentation-
invariant metric. Prove that no bounded static fossil observer realizes the
same family.

**Exact falsifier:** a uniform support bound exists after an allowed
recompilation; the cost changes under harmless retokenization; or a claimed
limit birth has no finite executable certificate.

### Target 6: coherence obstruction or higher holonomy

Construct a transport on the causal 1-skeleton whose birth roles force an
empty or noncontractible admissible filler space on a declared boundary, or
a nontrivial higher-coherence obstruction after pairwise fillers have been
chosen. Prove that the filler problem and its equivalence type are forced by
birth roles rather than freely attached decoration.

**Exact falsifier:** one coherent admissible filler exists when emptiness was
claimed; the filler space becomes contractible after the correct confluence
and gauge quotient when noncontractibility was claimed; the defect changes
under basis or event renaming; it comes from unequal raw words; or identical
birth-role data admit arbitrary different defects.

### Target 7: process-to-fossil nonreflection

Exhibit \(\mathfrak G,\mathfrak G'\) with equivalent completed static fossils
and identical old-observer behavior but

\[
\mathfrak G\not\simeq_{\rm gen}\mathfrak G',
\tag{29}
\]

where the failure is witnessed specifically by a universal birth role.

**Exact falsifier:** a functor of the declared static fossil reconstructs the
role, or the processes differ only by scheduler order, stutter, provenance
spelling, or freely chosen transport decoration.

## 12. Externalization boundary

### Finite externalization proposition

Assume the metalanguage universes and the full valid-event relation are
uniformly effective: answer membership, capability witnesses and enablement,
\(\mathsf{Check}\), \(\mathsf{Gen}\), \(\mathsf{Step}\), \(\mathsf{Birth}\), and
normalized \(\mathsf{Supp}\) are computably presented, and every event and
certificate is finite. Then every finite history \(h\), doctrine
\(\mathcal L_h\), transition, and birth certificate has a finite external
code. If validity is decidable, an external interpreter decides the next-event
relation; if it is only computably enumerable, the interpreter enumerates the
valid next events but need not decide their absence.

**Proof.** A finite labelled poset has a finite incidence-and-label encoding.
Every component of a label and every operational witness lies in a computably
presented code universe, and every derivation and certificate is finite.
Encode the poset, labels, doctrine, witnesses, and proofs by finite strings.
The assumed full effective presentation then enumerates or decides the
permitted next-event data as stated. \(\square\)

Therefore an effective finite realization of this framework cannot establish
absolute nonrepresentability or absolute nonsymbolicity for its finite
phenomena. Realizations dropping the effectiveness assumptions fall outside
this proposition. The possible effective content is instead:

- nonrepresentability in an earlier **object language**;
- nondefinability relative to a declared reduct;
- a specified observer collision, failure of equivalence reflection, or
  genuine functor nonfaithfulness with the relevant categorical typing;
- lack of uniform bounded realization in a declared cost class;
- nonexistence of a natural or presentation-invariant selector; or
- non-soficity of a precisely defined finite-alphabet interface.

External simulation also does not collapse the internal distinction. A
universal interpreter can encode a newly admitted binder without making that
binder derivable in the preceding object doctrine, just as a history log can
encode a causal dependency while a static endpoint forgets it. But every
strong claim must name the boundary across which the information is lost.

## 13. Decision rule for the next cycle

The next cycle should not begin by selecting another coefficient system or
large algebraic example. It should proceed in this order:

1. implement the four-shadow tournament as separate finite controls;
2. reject any control that depends on spelling, stutter count, a hidden clock,
   or an undeclared cost model;
3. attempt the coupled irreducible witness of Target 4;
4. test whether its alleged birth is only Level A, then only Level B;
5. formulate and verify its extension category and initiality claim; and
6. only after it survives, choose whichever algebraic, topological,
   operational, or analytic realization best exposes its invariant.

The proposed carrier is consequently not a completed algebra or state space.
It is the typed causal structure

\[
\boxed{
\text{interaction}
\longrightarrow
\text{newly usable address}
\longrightarrow
\text{certified formation extension}
\longrightarrow
\text{changed future capability},
}
\tag{30}
\]

together with the universal roles and causal supports that a static
completion forgets. Whether this carrier supports a genuinely new theorem is
exactly what Targets 1--7 are designed to decide.
