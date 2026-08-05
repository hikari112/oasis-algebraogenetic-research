# Research brief: discovering NOVA

## Result

The closest established mathematical object already exists: Glasner and Weiss proved that **every countably infinite group** has a faithful bounded linear representation on a separable Hilbert space that is universal for all free ergodic probability-preserving actions of that group. Applying their theorem to the explicit group claimed non-sofic in OpenAI's recent proof gives, immediately, an object that is:

1. internally non-sofic, because the represented group is non-sofic and the representation is faithful; and
2. externally universal, in the precise sense of realizing every free ergodic probability-preserving action of that group.

This is not yet a universal approximator in the neural-network sense. It is stronger along one axis—universal realization of dynamical distributions—and weaker along another—it provides no efficient training algorithm. NOVA is the proposed bridge from that existence theorem to an AI architecture.

## Candidate object

Call a tuple

\[
\mathcal N=(D,P,E,V;\Gamma,\rho,d_\star)
\]

a **Non-Sofic Observable Universal Approximator** when:

- `D` is a space of distributional states, treated as primitive rather than identified with one representation such as a density, vector, or measure;
- `P` is a typed space of processes and `E` a separating family of finite probes;
- `V(e,d)` is the valuation returned by probe `e` on state `d`;
- `Γ` is a countable non-sofic group with a faithful exact action `ρ` on `D`;
- the orbit of `d★`, when viewed through finite probes, is dense in the selected external target class; and
- the observed process action is **essentially non-sofic**: after quotienting process words that no allowed experiment can distinguish, the remaining process group is still non-sofic.

The last condition is crucial. Merely attaching a non-sofic group to an ordinary universal approximator creates a decorative side factor, not a new object.

## The established backbone

Let `N` be a countably infinite non-sofic group. The universal hypercyclic representation theorem supplies a faithful bounded representation

\[
S:N\rightarrow GL(H)
\]

on a separable Hilbert space. For every free ergodic probability-preserving `N`-action, there is a full-support invariant probability measure on `H` under which the linear action is measurably isomorphic to it. This gives the Hilbert component in the user's “Mellin and Hilbert” intuition: an infinite exact carrier on which distributions, observables, and dynamics meet.

The theorem is from [Glasner and Weiss, *A universal hypercyclic representation*](https://arxiv.org/abs/1401.2019). The proposed non-sofic instance uses the explicit group claimed in [OpenAI, *Ten Advances in Mathematical Reasoning*](https://cdn.openai.com/pdf/ten-proofs-oai.pdf); the surrounding mathematical discussion is collected in the linked [MathOverflow thread](https://mathoverflow.net/questions/513866/what-are-the-key-new-ideas-in-the-proof-of-nonsoficity-of-groups-in-openai-s-con/513885#513885).

## Where the new idea may begin

The literature audit found the ingredients separately:

- universal hypercyclic group representations;
- equivariant universal approximation, including non-compact groups ([Yarotsky](https://arxiv.org/abs/1804.10306); [Kumagai and Sannai](https://arxiv.org/abs/2012.13882));
- universal approximation of probability distributions ([Perekrestenko et al.](https://arxiv.org/abs/2004.08867));
- operator learning between infinite-dimensional spaces ([Kovachki et al.](https://arxiv.org/abs/2108.08481)); and
- compositional probability in Markov categories ([Fritz et al.](https://arxiv.org/abs/2010.07416)).

I did not find a primary source combining all of the following: an explicit non-sofic internal process group, universal external realization, lazy finite-probe computation, Bayesian valuation, and a proof that the non-soficity survives observational quotienting. That combination is the plausible novelty boundary. This is a research finding, not a certified novelty claim.

## Connections

**Polynomials.** Cylinder observables form a finite algebra on finite coordinates. Their refinements play the role of basis expansion; in suitable compact settings, separation plus algebraic closure gives Stone–Weierstrass-style density. Ordinary polynomial networks approximate the value directly. NOVA instead builds an exact symbolic process and approximates only its valuations.

**Fractals.** The prototype lives on a finite shadow of Cantor space. Each split refines a cylinder, producing a self-similar tree. The infinite limit is naturally fractal: local finite addresses probe an object whose process structure is never collapsed to one finite graph.

**Optimization.** Training is search over composable symbolic process words plus continuous valuation parameters. This separates discrete structural discovery from probabilistic calibration. The current greedy splitter is deliberately simple; beam search, Bayesian structure learning, or amortized policies can replace it.

**Bayesian distributions.** Each leaf uses a Dirichlet-smoothed posterior predictive distribution. More generally, probes can be characteristic functions, moments, Mellin transforms, likelihood ratios, or posterior predictive queries. A distributional state is the object; a probability measure is one realization of it.

**P versus NP.** The analogy is an asymmetry, not an equivalence: a proposed external fit can be checked on finitely many probes, while proving that an infinite internal multiplication structure has—or lacks—a finite model may be far harder. NOVA deliberately keeps these two forms of verification separate.

## Failure modes and open proof obligations

1. **Fresh theorem risk.** The explicit non-soficity claim must receive independent mathematical verification before it is treated as infrastructure.
2. **Decorative-factor risk.** A dense abelian cylinder algebra can provide universality by itself while the non-sofic factor does no work. The essentiality theorem must exclude this.
3. **Existence versus computation.** The universal Hilbert representation is an existence theorem, not an efficient optimizer. An effective word problem, computable weights, and finite probe compiler are needed.
4. **Finite-shadow limitation.** No finite experiment can demonstrate non-soficity. The prototype tests the architecture's observable layer, exact replay, and audit logic only.
5. **Probe insufficiency.** Finite probes can identify states only relative to their chosen resolution. The system must report collisions instead of silently treating them as equality.

## Falsifiable next theorem

Construct an effective faithful action of the chosen non-sofic group on a computable distributional state space with a recursively enumerable separating probe family, then prove both:

\[
\overline{\{V(e,\rho(g)d_\star):g\in\Gamma\}}

\]

has the desired external density for every finite probe set, and the kernel of the complete observable process representation leaves a non-sofic quotient. Failure of either statement falsifies the strong NOVA object while leaving the finite architecture usable.

