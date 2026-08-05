# The theorem gap, retrospect, and OASIS-2

> **Radius-two correction (2026-08-04).** The original symmetry analysis treated matrix dagger as a naive Gram-basis permutation. Because dagger is an anti-automorphism, the positivity-preserving action is `g -> T(g)^-1`. Corrected metrics are 36 radius-one support orbits, 9,865 radius-two Gram orbits, and largest block size 60. The complete corrected solve found no trustworthy positive gap, but exact radius-two nonexistence remains open. See `research/radius2-corrected-result.md` and `research/radius2-retrospective.md`.

## Outcome

The original idea now has a rigorous finite core:

> an exact non-sofic internal transition algebra, an externally universal finite distribution readout, and an executable obstruction certificate that turns failed finite emulators into new probes.

This is already implemented and tested. It is not yet a universal algorithmic certificate of non-soficity. The remaining gap is much narrower than before: make Kun's ultraproduct locality step effective, propagate that finite modulus through expander decomposition, and obtain one universal finite challenge `(F, epsilon)`.

The most important conceptual correction is that the gap is not “find the missing epsilon.” It is a typed dependency graph:

```text
explicit property-(T) data       finite V presentation
             |                         |
             v                         v
 rational spectral bounds       finite LEF obstruction       CLOSED
             |
             v
 effective locality radius       OPEN: Kun Lemma 10
             |
             v
 finite decomposition modulus    OPEN
             |
             v
 Step 1-5 error ledger            IMPLEMENTED
             |
             v
 universal finite threshold      OPEN
```

## What we initially blurred

We mixed four logically different claims:

1. **Internal exactness.** The Leavitt algebra and its unit multiplication can be executed exactly.
2. **Theorem-backed non-soficity.** The chosen infinite group is non-sofic by the published proof.
3. **Finite refutation of one emulator.** A supplied permutation model can fail a concrete equality, distinctness, multiplication, expansion, or LEF-chart test.
4. **Uniform effective non-soficity.** One deterministic finite procedure defeats every sufficiently accurate finite permutation model.

The first three are now operational. The fourth is still open. Earlier language sometimes made Step 3 sound like Step 4; the certificate schema now prevents that promotion.

We also assumed the source lacked usable numerical property-(T) data. That was too pessimistic. Ershov-Jaikin-Zapirain gives an explicit Kazhdan bound for Steinberg groups; quotient transfer gives conservative bounds for the elementary groups used here. The true nonconstructivity lies later, in Kun's locality/decomposition argument.

## Closed theorem-facing work

### Full proof configuration

The engine now instantiates all 30 elementary generators of `Gamma=EL_3(R)`, both contractions, and the exact two generators of the Thompson subgroup `J=V_1000`. All support-commutation relations are checked exactly. The oracle has 394 registered generators in total: 360 ambient and 34 proof-facing.

### Explicit finite Thompson-V obstruction

The seven Bleak-Quick relators are transcribed into the engine's right-action convention and verified exactly. The compiler collects every relator prefix plus a chosen nonidentity generator, yielding 155 exact group elements.

Why this finite set obstructs LEF:

1. A local embedding preserves each multiplication along every relator prefix.
2. Therefore the two finite images satisfy all seven defining relators.
3. The presentation gives a homomorphism from `V` to a finite group.
4. Injectivity on identity versus the chosen generator makes that homomorphism nontrivial.
5. An infinite simple group has no nontrivial finite quotient.

This closes the final contradiction with an explicit finite object.

### Quantitative spectral inputs

Using rational upper bounds on the radicals in Ershov-Jaikin-Zapirain's formula gives:

```text
Gamma Kazhdan lower bound: 3125 / 2271321  ~= 0.0013758513
G Kazhdan lower bound:     62500 / 47622573 ~= 0.0013124028

Gamma lazy spectral gap: 9765625 / 319851743272542 ~= 3.05317e-8
G lazy spectral gap:     1953125000 / 818715314749658769 ~= 2.3856e-9
```

They are deliberately conservative. They are enough to replace “some positive constant” by exact rational data, but not enough by themselves to compute Kun's locality radius.

### Executable error ledger

The equations in Proposition 2.3 now propagate as finite quantities:

- boundary loss to unmatched transport mass;
- median/coarea variation to exceptional components;
- component-size distortion to matching error;
- edited Gamma edges to bad-cut removal;
- cut removal and word length to repaired-word error; and
- almost-automorphism error to cluster-separation load.

A grid search chooses `eta`, `delta`, and `lambda` to minimize the maximum load. The largest load becomes a probe priority. Once a finite locality/decomposition modulus exists, no informal `o(N)` bookkeeping remains downstream.

## The hard remaining theorem gap

Kun's Lemma 10 has the logical form

```text
for every accuracy epsilon and word radius k,
there exists a local radius r
such that sufficiently good r-local models admit the required decomposition.
```

The published proof assumes no such `r`, builds a sequence of counterexamples, passes to an ultraproduct, and contradicts the limiting property-(T) structure. That proves existence but supplies no computable modulus. This is the load-bearing gap.

There are three credible attacks:

1. **Quantitative proof mining.** Replace compactness/ultraproduct passages by explicit stability inequalities and track constants.
2. **Finite SOS/moment hierarchy.** Search for exact noncommutative polynomial identities whose support radius supplies a local certificate.
3. **Countermodel extraction.** Enumerate finite local diagrams, solve a separation problem, and turn the dual solution into a human-readable inequality.

The implementation now supports the second and third attacks.

## Polynomial optimization result

For the group Laplacian `Delta`, a rational identity

```text
Delta^2 - lambda Delta = sum_i xi_i* xi_i,  lambda > 0
```

is a finite noncommutative polynomial/SOS certificate. The verifier evaluates it in the exact group algebra, so a candidate from floating-point optimization cannot pass merely because its residual is small.

The radius-one `Gamma` relaxation used 30 generator-minus-identity basis directions. Both CLARABEL and SCS converged to `lambda=0`. The SCS dual revealed a rank-29 regular-simplex pattern, which has now been reconstructed and independently verified as an exact rational separating functional. It proves that this particular radius-one cone has no positive certificate.

The dual data contains a striking clue: 679 exact product constraints collapse, after rounding, into only eight value classes with multiplicities

```text
270, 144, 144, 72, 24, 18, 6, 1.
```

The corrected positivity-preserving symmetry is `S3 x C2 x C2`. It has 36 orbits on the 679 radius-one product elements, and the numerical dual varies by at most `6.16e-14` within an exact orbit. The apparent eight values were a numerical gauge choice; the exact rational functional uses only three values.

For radius two, the corrected automorphism symmetry reduces 230,181 symmetric Gram variables to 9,865 and block-diagonalizes the 678-dimensional PSD condition into twelve blocks, the largest of size 60. The exact quotient export and numerical solve are complete. They point to optimum zero, but the valid dual has additional null faces, so an exact obstruction requires iterative facial reduction rather than one-shot rationalization.

## Externally universal, internally non-sofic

This phrase now has a precise finite theorem.

Let the external states be distinct regular-basis vectors `s_d`. The coefficient probe `e_d=coeff(d,epsilon)` is one exactly on `s_d` and zero on every other basis state. Its sign version is `+1` on `d` and `-1` elsewhere. For any strictly positive distribution `p` on this finite window, choose

```text
theta_d = (1/2) log p_d.
```

Then the exponential readout

```text
P_theta(x) proportional to exp(sum_d theta_d e_d_sign(x))
```

equals `p` exactly. Thus the external layer is an exact finite distribution approximator, while its transformations are pulled back through an exact non-sofic group action.

This is not yet a universal approximation theorem on arbitrary compact spaces. A plausible extension target is: construct a nested prefix-probe algebra that separates points, contains constants, and is closed under multiplication; then invoke a Stone-Weierstrass-type argument for continuous readouts while retaining exact internal pullbacks.

## OASIS-2: Proof-Obstruction Field architecture

The architecture should not approximate its internal group law. It should approximate external distributions and functions *through* exact internal actions.

```text
observations
    |
    v
Bayesian distributional state ---- prediction residual
    |                                  |
    v                                  v
exact coefficient probes <---- candidate scheduler
    ^                                  ^
    |                                  |
exact non-sofic pullbacks       proof-obstruction field
    |                                  ^
    v                                  |
finite emulator critic -------- obstruction certificate
```

Each program atom carries an exact generator word, exact unit hash, probe hash, and external tilt coefficient. Replay recomputes the exact word and rejects any altered derivation. The new obstruction field maintains fractional-Dirichlet mass over spectral, transport, coarea, matching, repair, finite-word, locality, decomposition, and LEF stages. A probe's proof value is

```text
posterior mass of targeted stage
    x entropy of its current predicted bit
    x relevance to the witnessed obstruction.
```

This is Bayesian experimental design over proof obligations. It is not Bayesian uncertainty about whether a proved theorem is true.

## Radically new concepts worth pursuing

The following are hypotheses or designs, not established theorems.

### 1. Obstruction backpropagation

Ordinary learning backpropagates prediction loss. OASIS-2 can backpropagate *proof slack*: the error ledger maps a final contradiction margin backward into required improvements at transport, coarea, matching, repair, and word-test stages. The largest derivative-like load selects the next emulator challenge or observable. This resembles constrained optimization with a proof as the computational graph.

### 2. Noncommutative Positivstellensatz gate

Treat every theorem obligation as a search for a finite positive polynomial identity. A floating solver proposes an SOS/moment object; exact Leavitt arithmetic verifies it; a failed exact check returns the coefficient with greatest residual as a new cutting plane. The theorem prover and learner become one column-generation loop.

### 3. Fractal obstruction amplification

Thompson's prefix actions are self-similar. Conjugate one local `V` obstruction into many disjoint binary cylinders, creating many exact copies at increasing depth. If their finite-emulator defects can be shown sufficiently independent, a single local collision could amplify into a macroscopic Hamming defect. The danger is correlation: a finite emulator may reuse the same bad set across all copies. A proof would need a packing or decorrelation lemma.

### 4. Mellin-prefix spectral bank

Interpreting “Mellen” as Mellin: binary prefix depth is a discrete logarithmic scale, contractions shift depth, and Mellin characters diagonalize scaling. Attach scale-frequency phases to prefix probes, then let the non-sofic action mix location while Mellin modes expose scale. This would be a fractal analogue of Fourier features, with exact algebraic routing and Bayesian readout.

### 5. Dual pseudo-state mining

The radius-one SOS dual is now an exact positive moment functional blocking every positive certificate within the chosen cone. Its moment matrix is the regular-simplex projector, while its support functional uses only three rational values. In ML terms, the failed proof search learned a counter-representation whose numerical complexity collapsed into a short proof.

### 6. Countermodel curriculum

Train a finite emulator to satisfy the current finite chart; ask the certificate for its worst defect; synthesize probes from that defect; enlarge the chart; repeat. This is a cutting-plane game between a compressive finite student and a non-sofic exact teacher. Difficulty growth across rounds becomes an empirical proof-complexity curve.

### 7. Anti-distillation reservoir

A finite neural network can approximate external behavior, but the exact internal transition system has no asymptotically faithful finite permutation compression. That makes it a candidate anti-distillation reservoir: readouts are cheap and universal on observed windows, while globally faithful extraction of internal multiplication is obstructed. Non-soficity does not automatically imply cryptographic security, privacy, or hardness; those would require separate reductions.

### 8. P versus NP analogy, carefully

The finite emulator is a candidate witness and the obstruction is a refutation certificate, so the interaction resembles search versus certification and proof complexity. It is not presently a reduction from `P` versus `NP`. A legitimate complexity program would define the finite-chart extension problem, measure the shortest obstruction certificate, and study whether those certificates grow polynomially or superpolynomially with chart radius.

### 9. Hilbert-space and distributional completion

The exact group algebra acts on a regular module; completing suitable coefficient states gives a Hilbert-space viewpoint, while positive moment functionals behave like distributions over noncommutative polynomials. This unifies the user's Hilbert, Bayesian, polynomial, and distribution themes: the internal object is an operator algebra, the external object is a probability law, and the interface is a learned family of coefficient functionals.

## Ranked next experiments

1. Recover the corrected radius-two dual's common kernel by multi-objective facial reduction and exact rational reconstruction.
2. Add positivity-preserving transformation types and direct moment-invariance tests as hard compiler gates.
3. Formalize the 155-element `V` obstruction in Lean or another proof assistant.
4. Derive a quantitative substitute for Kun's Lemma 10 on the specific `Gamma=EL_3(R)` presentation rather than in full generality.
5. Run the countermodel curriculum and chart certificate size, defect floor, probe information gain, and predictive KL together.
6. Extend the finite Kronecker readout to nested prefix partitions and test the Stone-Weierstrass route.
7. Test fractal obstruction amplification while explicitly measuring overlap of defect sets across conjugate cylinders.

## Claim ledger

| Claim | Status |
|---|---|
| Exact Leavitt arithmetic and group words | Implemented and tested |
| Internal group is the theorem's non-sofic group | Theorem-backed configuration |
| Full 30-generator Gamma and two-generator J configuration | Implemented and tested |
| Rational Kazhdan/lazy spectral lower bounds | Derived and exactly serialized |
| 155-element finite `V` LEF obstruction | Theorem-backed and implemented |
| Step-1-through-Step-5 finite error propagation | Implemented and tested |
| Exact universality on finite positive distributions | Proved by Kronecker probes and tested |
| Bayesian proof-stage routing | Implemented; epistemic heuristic |
| Positive SOS certificate absent in radius-one generator-difference cone | Exact rational dual proof |
| Positive SOS certificate absent in corrected radius-two cone | Strong numerical evidence; exact dual open |
| Effective Kun locality radius | Open |
| Universal finite `(F, epsilon)` non-soficity challenge | Open |
| Compact-space external universal approximation | Conjectural extension |
| Fractal amplification and anti-distillation | Speculative research programs |

## Primary sources

- [OpenAI, *Ten Advances in Mathematics and Theoretical Computer Science*, Chapter 3](https://cdn.openai.com/pdf/ten-proofs-oai.pdf)
- [Gabor Kun, *On sofic approximations of property (T) groups*](https://arxiv.org/abs/1606.04471)
- [Gabor Kun and Andreas Thom, *Inapproximability of actions and Kazhdan's property (T)*](https://arxiv.org/abs/1901.03963)
- [Collin Bleak and Martyn Quick, *The infinite simple group V of Richard J. Thompson: presentations by permutations*](https://arxiv.org/abs/1511.02123)
- [Mikhail Ershov and Andrei Jaikin-Zapirain, *Property (T) for noncommutative universal lattices*](https://arxiv.org/abs/0809.4095)
- [Narutaka Ozawa, *Noncommutative real algebraic geometry of Kazhdan's property (T)*](https://arxiv.org/abs/1312.5431)
- [Tim Netzer and Andreas Thom, *Kazhdan's property (T) via semidefinite optimization*](https://arxiv.org/abs/1411.2488)
