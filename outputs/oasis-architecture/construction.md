# OASIS: constructive research note

## 1. The new method

Let `(D,P,E,V)` be typed primitive data:

- `D` contains distributional states;
- `P` contains exact processes;
- `E` contains effects or probes; and
- `V(e,d)` is the valuation of probe `e` on state `d`.

Suppose a countable group `Γ` acts faithfully by exact processes `ρ(g)` on `D`. For every process word `g` and probe `e`, define the pullback

\[
(g^\star e)(d)=e(\rho(g)d).
\]

OASIS receives only seed probes `E₀`, exact process generators, and a grammar for composing probes. Its coordinate system is the generated algebra

\[
\mathcal A=\operatorname{alg}\{g^\star e:g\in\Gamma,e\in E_0\}.
\]

This reverses the usual architecture. The process system is not embedded into an approximate finite latent state. Exact process words generate whatever finite observational chart the present question requires.

## 2. Obstruction-adaptive probe synthesis

At stage `t`, let `Aₜ` be the finite probes already made observable and let `qₜ` be the current posterior-predictive state. The chart

\[
C_t(g)=\big(V(g^\star a,d):a\in A_t\big)
\]

may identify distinct exact process words. These are **observational aliases**, not equalities.

For a generated candidate `a`, OASIS computes

\[
S_t(a)=
\frac{|\widehat V(a)-V_{q_t}(a)|}
{\sqrt{\operatorname{Var}_{q_t}(a)+\epsilon}}
+\beta\,\Delta_t(a)
-\lambda L(a).
\]

Here:

- the first term is a posterior-standardized predictive residual;
- `Δₜ(a)` measures how strongly `a` separates exact process words currently aliased by `Cₜ`;
- `L(a)` is the description length of the exact derivation word; and
- `β` controls the price paid for preserving internal process information.

The selected probe updates the prediction by exponential tilt. For a binary sign probe with observed moment `m̂` and model moment `m`, the exact one-coordinate update is

\[
\eta=\operatorname{atanh}(\widehat m)-\operatorname{atanh}(m),
\qquad
q_{t+1}(d)=\frac{q_t(d)e^{\eta a(d)}}{Z_t}.
\]

The learned program is an ordered list of seed probes, exact derivation words, and tilt coefficients. Replaying that program reconstructs the external prediction without replaying an approximate process model.

## 3. Where non-soficity enters

A finite emulator of `Γ` proposes a finite permutation model for the currently observed process chart. It is used only as an adversarial critic, never as OASIS's internal process engine.

For a non-sofic `Γ`, there is a finite multiplication/freeness challenge and a positive error threshold that no finite permutation emulator can satisfy. An effective **obstruction oracle** returns the failed multiplication triangles or forced aliases of the current emulator. OASIS then searches the generated probe frontier for an effect that exposes one of those identifications.

Thus the conjectured infinite architecture alternates:

1. evaluate finite external probes;
2. let a finite emulator attempt to close the observed process table;
3. challenge that emulator using exact multiplication and the non-sofic obstruction;
4. synthesize a pullback/composite probe that witnesses the failure;
5. update the external Bayesian valuation; and
6. preserve the exact word and witness in the program log.

The non-sofic component is constitutive because it generates learning coordinates. Removing it changes the sequence of probes, not merely hidden metadata.

## 4. Observable essentiality

Let

\[
K_{\mathcal A}=\{g\in\Gamma:g^\star a=a\text{ for every }a\in\mathcal A\}.
\]

The strong OASIS object requires `Γ/K_A` to be non-sofic. If the generated algebra separates states and the original action is faithful, the desired conclusion is `K_A={1}`. This is the exact theorem that rules out a decorative non-sofic factor.

## 5. Finite universality result

On the binary cube `X={0,1}ⁿ`, take the sign seeds

\[
e_i(x)=(-1)^{x_i}.
\]

Use two exact invertible linear processes: a cyclic coordinate shift and one adjacent transvection. Conjugating the transvection by shifts generates the elementary transvections. Their dual action is transitive on nonzero binary masks, so pullbacks of the seed effects generate every Walsh character

\[
\chi_S(x)=(-1)^{\sum_{i\in S}x_i}.
\]

The Walsh characters form a basis of all real functions on the finite cube. Therefore every strictly positive probability law has an exact representation

\[
p(x)=Z^{-1}\exp\left(\sum_{S\ne\varnothing}\theta_S\chi_S(x)\right).
\]

For `n=8`, the implementation generated all `2⁸−1=255` nonconstant characters from eight seeds and the two processes. Every generated mask retained a verifiable shortest derivation word.

This explains the earlier experiment rather than merely exploiting it. Cylinders and Walsh polynomials are different finite charts inside one process-generated probe algebra. They are not architectural choices supplied in advance.

## 6. Polynomial, fractal, Mellin, and Hilbert consequences

- Products of sign probes produce Boolean/Walsh polynomials.
- Products of idempotent indicator probes produce cylinder algebras and fractal refinements.
- Scale-process eigenprobes produce Mellin coordinates when `g_s★e=s^z e`.
- A faithful universal Hilbert representation supplies an exact infinite carrier; probes become continuous or measurable functionals on its orbit.
- Bayesian inference lives in valuations and uncertainty over probe moments, not in the definition of the primitive distributional state.

These are generated representations of one object, not competing definitions of it.

## 7. Theorem obligations

1. Extract an effective finite obstruction oracle from the explicit non-sofic group proof.
2. Construct a computable faithful action with decidable or auditable exact word operations.
3. Find seed probes whose exact pullback algebra separates the relevant distributional states.
4. Prove external density of the induced Gibbs/valuation family.
5. Prove `Γ/K_A` remains non-sofic.
6. Bound the cost of evaluating a requested finite probe without finitely modeling the full group.

Until these are proved, OASIS is an original conjectural method with a successful finite shadow—not a completed non-sofic AI system.

