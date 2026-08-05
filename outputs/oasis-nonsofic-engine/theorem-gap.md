# Remaining universal-certificate gap

## What is complete

The internal group is not conjectural code anymore. OASIS composes exact words in the subgroup `G=EL_D(R)` used in the non-soficity proof. Its regular action is faithful because distinct units act differently by left multiplication.

The proof-obligation compiler is now also operational. It serializes the paper's exact algebraic relations, audits finite word tests and small-component expansion, identifies a failed proof step, and synthesizes exact separating probes from a collided word pair.

## What remains

The proof of non-soficity is not presented as a small explicit tuple `(F, epsilon)` that software can directly challenge against every finite permutation emulator. We closed two formerly open ends: Ershov-Jaikin-Zapirain gives explicit Kazhdan lower bounds, and the Bleak-Quick presentation gives a finite Thompson-`V` obstruction. Three effective inputs remain:

1. an explicit radius in Kun's locality lemma, whose published proof obtains existence by ultraproduct contradiction;
2. a finite-size expander-decomposition bound at that radius; and
3. a universal finite-word/error threshold combining the locality bound with the executable Step-1-through-Step-5 ledger.

The certificate exposes these with stable identifiers. A user-supplied number is marked `supplied-unverified`, not silently promoted to a proof.

## Newly closed inputs

For the binary Leavitt ring, Theorem 6.2 of Ershov-Jaikin-Zapirain yields conservative rational Kazhdan lower bounds. After quotient transfer to the elementary groups and conversion to lazy Markov operators, the implemented spectral-gap lower bounds are

```text
Gamma = EL_3(R):  9765625 / 319851743272542  ~= 3.05317e-8
G     = EL_9(R):  1953125000 / 818715314749658769 ~= 2.3856e-9
```

For Thompson's `V`, the exact two-generator, seven-relator presentation yields a 155-element relator-prefix set. Any finite local embedding of this set would make the two finite images satisfy every defining relator, hence extend to a nontrivial finite quotient of `V`. That is impossible because `V` is infinite and simple. This is a finite theorem-backed obstruction, not a search result.

The asymptotic `o(N)` bookkeeping has also been converted into a deterministic error ledger. Once a locality/decomposition modulus is supplied, the ledger computes every downstream load and reports the bottleneck.

## Required certificate

The separate `certified-nonsofic` mode still requires a universal witness containing:

- a finite set of exact elementary-generator words;
- a rational `epsilon > 0`;
- multiplication and freeness tests on that set;
- the required property-(T)/expansion constants or a separately verified finite consequence; and
- a deterministic challenge procedure that maps any proposed finite emulator to a violated test of size at least `epsilon`.

The new `proof-obligation` mode does not wait for those three inputs. It can already refute a particular finite emulator on a covered test and convert that concrete failure into preferred exact probes. It labels the outcome as a finite proof-obligation violation, not a universal non-soficity certificate.

## Next mathematical target

Close the remaining fields without changing the runtime interface:

```text
exact or interval SOS / moment data
    -> symmetry-reduced finite locality modulus
    -> effective expander-decomposition threshold
    -> executable finite error ledger
    -> globally effective (finiteWords, epsilon) witness
```

The radius-one generator-difference SOS cone is now closed exactly. A rational functional has moment matrix `I_30-(1/30)11^T`, pairs to `29/2` with `Delta`, and annihilates `Delta^2`. It therefore excludes every positive `lambda` in that cone. This is an exact negative result for the selected radius-one basis, not a locality theorem and not a statement about larger bases.

The corrected positivity-preserving 24-element action `S3 x C2 x C2` has 36 orbits on the 679 radius-one product elements. Its dagger-derived action is the genuine automorphism `g -> T(g)^-1`. On the radius-two basis it reduces 230,181 symmetric Gram variables to 9,865 invariant variables and decomposes the PSD condition into twelve multiplicity blocks, the largest of size 60.

The complete corrected radius-two problem has now been exported and solved. It contains 249,376 exact radius-four support elements and 10,487 support orbits. No trustworthy positive gap was found: the apparent primal gap is smaller than its own coefficient and PSD errors. A dual search shows that the feasible functional lies on a deeper singular face beyond the forced `Delta` kernel. Exact nonexistence at radius two remains open; iterative facial reduction and exact kernel recovery are the next theorem target.

The downstream emulator verifier, LEF chart auditor, error propagator, Bayesian proof-stage router, and probe synthesizer are implemented. This leaves a sharply isolated mathematics/formalization task instead of an architecture gap.
