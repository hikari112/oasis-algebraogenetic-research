# Presentation-transcendent algebra: a computable algebra without a computable semantic normal form

## Status and terminology

`Presentation-transcendent algebra` is project terminology, not an established
mathematical name and not a claim of legal novelty. The precise object below is
an **effective quotient algebra** whose native representatives and operations
are computable, but whose extensional equality has no total computable
canonicalizer.

This corrects the earlier hypothesis. The relevant transcendence is not a
transcendental scalar inside an otherwise ordinary algebra. It is a mismatch
between two levels:

- the algebra has a finite, executable **intensional presentation** by programs;
- its complete **extensional semantics** cannot be reduced to a computable
  global normal form.

It is therefore not absolutely inexpressible. Its interpreter is already a
symbolic expression of it. The defensible statement is representation-relative:
it cannot be faithfully and completely flattened into an external language
that requires decidable semantic equality or one fixed finite approximation.

## 1. The native coefficient algebra

Let `G` be the exact infinite non-sofic group already implemented by OASIS. Let
`P` be a program language with the following properties:

1. every program `p` is certified total and bounded;
2. evaluation `eval(p,x)` is computable for every `x` in `G`;
3. program addition, multiplication, and group translation are computable; and
4. `P` contains the bounded halting-clock programs defined below.

Two programs are semantically equivalent when

\[
p\sim q \quad\Longleftrightarrow\quad
\forall x\in G,\;\operatorname{eval}(p,x)=\operatorname{eval}(q,x).
\]

The coefficient algebra is the quotient

\[
\mathcal B_{\mathrm{cert}}(G,\mathbb Z)=P/{\sim}.
\]

The quotient is computationally unusual but perfectly coherent. Algorithms do
not need to decide `p ~ q` before adding or multiplying their representatives.
The native layer computes a new representative; extensional equivalence merely
states which representatives denote the same semantic element.

This separates three operations that ordinary tensor architectures often
collapse:

- **execution:** evaluate a representative on a requested input;
- **composition:** construct a representative of a sum or product;
- **identification:** decide whether two representatives are equal everywhere.

The first two are total and computable here. The third is not.

## 2. The canonicalizer obstruction

Fix a computable native-complexity function `c:G -> N` with unbounded range.
The executable prototype uses the length of the exact canonical group hash.
This is unbounded because `G` is infinite and the hashes are injective finite
strings.

For a two-counter machine `M`, define the bounded clock

\[
\operatorname{clock}_M(x)=
\begin{cases}
1,&\text{if }M\text{ halts within }c(x)\text{ steps},\\
0,&\text{otherwise.}
\end{cases}
\]

Every individual evaluation terminates: it simulates only `c(x)` steps. The
program is bounded by one. Nevertheless,

\[
\operatorname{clock}_M\sim 0
\quad\Longleftrightarrow\quad
M\text{ never halts}.
\]

The reverse implication uses the unbounded range of `c`: if `M` halts after
`T` steps, some exact group element has complexity at least `T`, so its clock
value is one.

### Proposition: no computable complete semantic normal form

There is no total computable map `N:P -> strings` satisfying

\[
N(p)=N(q)\quad\Longleftrightarrow\quad p\sim q.
\]

**Proof.** If such an `N` existed, compare `N(clock_M)` with `N(0)`. This would
decide whether `M` never halts, and therefore decide the counter-machine
halting problem. Contradiction.

The same argument excludes a total decision procedure for extensional equality.
It does **not** exclude incomplete simplifiers, proof-producing equality
procedures, finite observational comparisons, or set-theoretic representatives.
The obstruction is specifically to a total computable and semantically complete
canonicalizer.

## 3. Coupling opacity to the exact non-sofic spine

The prototype's native algebra is the algebraic crossed product

\[
\mathfrak A_{
\mathrm{PT}}=
\mathcal B_{\mathrm{cert}}(G,\mathbb Z)\rtimes G.
\]

An intensional element is a finite sum

\[
a=\sum_{g\in F}p_g U_g,
\]

where each `p_g` is a certified program representative. Multiplication is

\[
(pU_g)(qU_h)=p\,\alpha_g(q)U_{gh},
\qquad
\alpha_g(q)(x)=q(g^{-1}x).
\]

This formula is executable because exact group multiplication, inversion,
program translation, and program multiplication are executable. It is
associative at the semantic level because `alpha_g alpha_h = alpha_(gh)`.

The two obstructions now have different jobs:

- **program opacity:** no total computable normal form captures extensional
  equality of coefficient programs;
- **non-soficity:** the group multiplication spine cannot be recovered by a
  globally asymptotically faithful family of finite permutation models.

Neither fact implies the other. Their crossed product deliberately combines
them. A finite external model can fail because it has not queried deeply enough,
because it has collapsed distinct program semantics, because its finite group
emulator has a multiplication/freeness defect, or because several failures
occur together.

## 4. What is and is not “outside expressibility”

Absolute non-expression would conflict with computability: the native program
and interpreter are already a finite description. The useful relative claim is
the following.

Let `C` be an external model class equipped with a computable complete equality
test. There is no total computable compiler

\[
E:P\longrightarrow C
\]

that is both semantics-preserving and semantics-reflecting:

\[
E(p)=E(q)\quad\Longleftrightarrow\quad p\sim q.
\]

Otherwise `E` followed by equality in `C` would decide extensional program
equality. The native algebra can therefore be exported only through one or more
weakenings:

- a finite query window;
- an error tolerance;
- a partial compiler;
- proof-carrying equalities without completeness;
- a student model that may be refuted by later probes; or
- an unresolved relation state.

This is the formal version of an algebra that “exists in its inner workings.”
Its native dynamics are accessible, but every complete external flattening asks
for semantic information that no total computable procedure can supply.

## 5. A transcendence spectrum rather than one magic property

The construction suggests measuring an architecture by several independent
representation obstructions:

| Axis | External representation class | Obstruction |
|---|---|---|
| `T_canon` | computable canonical forms | extensional equality is undecidable |
| `T_perm` | finite permutation processes | non-sofic multiplication/freeness defect |
| `T_rank(d)` | fixed `d`-dimensional latent states | exact moment rank eventually exceeds `d` |
| `T_precision` | fixed finite precision | computable analytic queries require unbounded refinement |
| `T_query(B)` | at most `B` observations | delayed witnesses agree on the entire queried window |

This spectrum is more useful than calling the whole object “continuous.” The
native program space is discrete. Its semantic quotient, observation topology,
positive-state completion, and refinement process can nevertheless exhibit
continuous behavior. Continuity is one completion of the object; presentation
opacity is the deeper computational property.

## 6. Executable falsification test

### The precise source of continuity

Put the finite-observation, or pointwise-product, topology on the semantic
program functions. For each positive integer `n`, let `d_n` be the clock for a
machine that halts after `n` steps. Every `d_n` is semantically nonzero because
native complexity is unbounded. But for each fixed `x`,

\[
d_n(x)=0\quad\text{whenever }n>c(x),
\]

so

\[
d_n\longrightarrow 0
\]

pointwise. More strongly, for every finite probe set `F`, some nonzero `d_n`
agrees exactly with zero throughout `F`. Thus zero is not isolated by any finite
observer.

This is the rigorous bridge to the continuous intuition. The syntax and every
evaluation remain discrete and computable, while the observation topology has
nontrivial convergent sequences and admits completion. The phenomenon does not
come from irrational coefficients.

### Runtime experiment

`presentation-transcendent-algebra.mjs` implements:

- certified constants, addition, multiplication, and translation;
- bounded two-counter-machine clocks;
- exact crossed-product monomials and finite sums;
- finite observation of coefficient programs on exact group elements; and
- an associativity audit on exact finite probes.

The test constructs a delayed-halting clock chosen to be indistinguishable from
zero on eight shallow exact probes. A deeper exact probe separates it. A looping
clock agrees with zero on all thirteen tested probes, while the runtime correctly
refuses to promote this finite agreement into semantic equality.

It also tests four nonzero delayed clocks. All four lie in the same shallow
observation cylinder as zero, and one deeper exact observation separates every
one of them. This is a finite executable shadow of the pointwise-convergence
theorem above.

This demonstration does not prove non-soficity; that comes from the theorem
backing the exact group. It also does not prove the halting theorem by experiment.
What it verifies is that the implemented program language realizes every
computable step of the reduction, that shallow observational aliasing actually
occurs, and that crossed-product composition preserves the tested observations.

## 7. The AI architecture it enables

The resulting candidate is a **Presentation-Transcendent Algebra Machine**
(`PTAM`):

```text
native program algebra P/~  <---->  exact non-sofic process spine G
           |                              |
           +--------- crossed product ----+
                          |
                  finite query compiler
                          |
             student distribution / readout
                          |
       proof | separated | aliased | unresolved critic
                          |
        counterexample and obstruction probe generator
                          |
               native memory grows intensionally
```

The architecture does not try to approximate its complete native state. It uses
the native algebra **as the approximator**:

1. A query names a finite task `(F, epsilon)`.
2. Native programs compose exact histories, actions, and counterfactuals.
3. Only the observations needed by that task are materialized.
4. A finite student/readout approximates the requested distribution.
5. The critic distinguishes proved equality, witnessed separation, current
   observational aliasing, and unresolved semantic relation.
6. Failure generates a deeper program or non-sofic obstruction probe rather
   than forcing the entire memory into a fixed latent vector.

“Universal approximation” is consequently external and local:

\[
\forall(F,\varepsilon)\;\exists\text{ finite readout }R_{F,\varepsilon}
\]

while the internal semantic object is not assumed to admit one complete finite
or computably canonical representation. This is not a loophole around
computability. It is a different division of labor between exact composition,
finite observation, approximation, and equality.

## 8. Research claims and open gaps

### Established inside the construction

- every native representative operation used by the prototype terminates;
- every finite observation is computable;
- extensional equality of the program class has no total computable complete
  canonicalizer, by the halting-clock reduction;
- the crossed-product formula is computable on representatives; and
- the chosen exact group supplies the separate theorem-backed non-sofic spine.

### Tested, not promoted to a general theorem by the test alone

- shallow clocks can be observationally identical and later separated;
- the implemented crossed product passed its finite associativity audit;
- current OASIS readouts can learn finite distributions while retaining exact
  replay and proof-generated probes.

### Still open

1. Define the best external universality theorem over arbitrary finite query
   sets `F` and tolerances `epsilon`, rather than the current finite regular
   window.
2. Add a star operation and positive-state completion without accidentally
   making an unsupported C-star-algebra claim.
3. Prove quantitative lower bounds for selected external classes, not merely
   undecidability of a perfect canonicalizer.
4. Turn the transcendence spectrum into measurable scaling laws.
5. Compare PTAM against recurrent, state-space, neural-program, and retrieval
   baselines on tasks requiring delayed semantic witnesses.

The first open target is now partially closed: a constructive theorem for every
finite semantically consistent rational distribution task and positive epsilon
is proved and tested in
[query-local-universality.md](query-local-universality.md). What remains open is
a topology-level theorem for compact or effectively compact infinite task
families.

## 9. Prior-art boundary

The ingredients have substantial prior art: effective quotient structures,
undecidability of extensional properties of total programs, computable but
non-computably-categorical structures, crossed products, non-sofic groups, and
intensional program representations. Computable presentations do not imply a
computable canonical copy; even familiar C-star algebras can have computable
presentations without computable categoricity. Natural properties of total
primitive-recursive functions also remain undecidable.

The project hypothesis is the architectural conjunction: use a computably
opaque effective quotient as the native adaptive memory, cross it with an exact
non-sofic process algebra, expose only query-local distributional readouts, and
make obstruction witnesses drive representation growth. The narrow literature
check did not identify that exact conjunction. That is a research lead, not an
exhaustive novelty or patentability conclusion.

## Primary sources checked

- OpenAI, [*Ten Advances in Mathematics and Theoretical Computer Science*](https://cdn.openai.com/pdf/ten-proofs-oai.pdf), Chapter 3.
- Fox, [*Computable presentations of C-star algebras*](https://arxiv.org/abs/2206.01415).
- Matos, [*Primitive recursive functions versus partial recursive functions: comparing the degree of undecidability*](https://arxiv.org/abs/1607.01686).
- Harrison-Trainor and Melnikov, [*An embedding theorem for the automorphism groups of computable structures*](https://arxiv.org/abs/1905.07850).
- Bose, Purkayastha, and Shallit, [*On the undecidability of problems involving counter machines*](https://arxiv.org/abs/2208.14720).
