# Genesis Tail-Hodge Comparison

## Status: an exact one-sided comparison tool, not yet a Genesis theory

This note tests a hypothesis suggested by the failure of ordinary
realification in [`universal-phantom-genesis.md`](universal-phantom-genesis.md):

> A phantom integral coherence class may become analytically observable only
> when its refinement presentation is retained.

The test succeeds in a deliberately narrow form. A sequence of genuine finite
path-graph Hodge projections produces an exact positive certificate for the
universal phantom class. The certificate descends under its integer
representatives, but it is necessarily discontinuous on the completed quotient
and it does not detect every nonzero class.

We call it **tail-Hodge energy** locally. This is project terminology, not an
assertion that a new field or invariant has been established in the literature.
The executable companion is
[`genesis-tail-hodge.mjs`](genesis-tail-hodge.mjs).

## 1. The completed quotient has erased its observable topology

The derived class lives in

\[
L=\lim{}^1(\mathbb Z,\times2)\cong\mathbb Z_2/\mathbb Z.
\]

The ordinary integers are dense in the 2-adic integers. More strongly, the
quotient topology on `L` is indiscrete. To see this, let `O` be a nonempty open
`Z`-saturated subset of `Z_2`. It contains a basic ball

\[
a+2^m\mathbb Z_2.
\]

Integer translation supplies every residue class modulo `2^m`, so saturation
of that one ball is all of `Z_2`. Thus `O=Z_2`.

It follows that every continuous map

\[
\mathbb Z_2/\mathbb Z\longrightarrow Y
\]

to a Hausdorff space `Y` is constant. In particular, no nonconstant continuous
norm, scalar energy, or continuous finite-dimensional spectral observable can
be defined from the fossil quotient alone.

This is a no-go theorem. It motivates—but does not logically force—the design
choice that a useful detector should retain a presentation, filtration, lift,
or continuation phase that the quotient forgets. A purely discontinuous
set-theoretic detector is not excluded.

## 2. Retain the canonical digit presentation

For an integer sequence `y=(y_n)`, write its associated 2-adic value as

\[
\alpha(y)=\sum_{n\geq0}2^ny_n\in\mathbb Z_2.
\]

Let

\[
b(\alpha)=(b_0,b_1,\ldots),\qquad b_n\in\{0,1\},
\]

be the canonical binary digits of `alpha` relative to this fixed dyadic tower.
Its first `N` digits are computable
from finite input:

\[
\alpha\bmod 2^N
=
\sum_{n=0}^{N-1}2^ny_n\bmod 2^N.
\]

The ordering of these digits is part of the refinement presentation. We are
not pretending that this presentation can be discarded and reconstructed from
the quotient afterward.

## 3. A genuine finite Hodge probe

At depth `N`, take the connected path graph on `N` vertices. Give its real
zero-cochains the normalized inner product

\[
\langle x,z\rangle_N
=
\frac1N\sum_{j=0}^{N-1}x_jz_j.
\]

The harmonic zero-cochains are exactly the constants. Their orthogonal Hodge
projection is therefore

\[
P_Nx
=
\left(\frac1N\sum_{j<N}x_j\right)\mathbf1.
\]

Apply it to the finite digit cochain

\[
b^{(N)}=(b_0,\ldots,b_{N-1}).
\]

Define

\[
E_N(\alpha)
=
\left\|(I-P_N)b^{(N)}\right\|_N^2.
\]

If `mu_N` is the fraction of one-digits, binary arithmetic gives the exact
identity

\[
E_N(\alpha)=\mu_N(1-\mu_N).
\]

Finally set

\[
\mathcal E([\alpha])=\limsup_{N\to\infty}E_N(\alpha).
\]

The executable checks that constants lie in the path Laplacian kernel, verifies
the Dirichlet identity, and checks the projection formula at every length
through `128`. Connectedness and
`x^T L x=sum_edges (x_i-x_j)^2` prove that the full kernel is the constant line.

The boundary is important: the path geometry is not load-bearing yet. Every
connected graph has the same harmonic zero-sector, and `E_N` is ordinary
binary empirical variance written as a degree-zero Hodge residual. All
arithmetic detection enters through the nonlinear dyadic digitization. No
refinement map or harmonic-transport operator currently connects these finite
Hodge stages.

## 4. Why the energy descends to the derived class

Suppose `alpha` is not an ordinary integer. Its binary tail is neither
eventually zero nor eventually one. Adding a positive integer can propagate a
carry only until it reaches a zero; subtracting one can propagate a borrow only
until it reaches a one. Consequently, adding any fixed ordinary integer changes
only finitely many digits.

Finite digit changes do not alter a limiting density, a limsup density
variance, or `mathcal E`. If `alpha` is an ordinary integer, its digits are
eventually zero when nonnegative and eventually one when negative, so its
energy is zero. Therefore

\[
\mathcal E([\alpha+k])=\mathcal E([\alpha])
\qquad(k\in\mathbb Z).
\]

The energy is a well-defined nonlinear function on the quotient set `Z_2/Z`
equipped with this dyadic presentation, digit order, and Cesaro exhaustion. It
is not intrinsic to the abstract group structure. Section 1 proves that it must
be discontinuous in the quotient topology. That discontinuity is not being
hidden; it is the cost paid by this particular tail geometry after the quotient
has topologically erased its continuous observables.

The executable tests positive and negative representative shifts through
`8192` digits. The all-integer statement comes from the carry/borrow proof, not
from generalizing those samples.

## 5. Exact certificate for the universal phantom class

The universal stream `U` concatenates all width-`m` binary words in lexical
order. Every completed width section has exactly as many zeros as ones. Its
total length through width `m` is

\[
L_m=2+(m-1)2^{m+1}.
\]

Inside a partially completed width-`m` section, summing the imbalance of the
binary columns gives

\[
|\#1-\#0|\le 2^{m+1}+m.
\]

The preceding length is `2+(m-2)2^m`, so the fractional imbalance is `O(1/m)`.
It follows that

\[
\mu_N(U)\longrightarrow\frac12
\quad\text{and hence}\quad
\boxed{\mathcal E([U])=\frac14}.
\]

Every zero derived class has energy zero. Therefore

\[
\boxed{\mathcal E([\alpha])>0\Longrightarrow[\alpha]\ne0.}
\]

The executable checks all `196,610` prefixes through width `13`, including the
imbalance bound, and obtains exactly `1/4` at every completed section endpoint.
The formula above proves the limit.

## 6. Adversarial controls

The method's failures are load-bearing.

1. **It is one-sided.** Put ones only at digit positions `1,2,4,8,...`. The
   resulting 2-adic integer is not an ordinary integer, so its derived class is
   nonzero, but its one-density and tail-Hodge energy both tend to zero.
2. **It is not injective.** The periodic tails `0101...` and `1010...`
   represent `-2/3` and `-1/3` in `Z_2`. Their difference is not an integer, so
   their quotient classes are distinct, while both energies equal `1/4`.
3. **It is presentation-sensitive.** The digit order and the Cesaro exhaustion
   are part of the comparison data.
4. **It is not a continuous invariant of the fossil quotient.** Section 1 says
   no nonconstant Hausdorff-valued detector can be.
5. **It is not endogenous.** The universal stream, inverse tower, and path
   exhaustion are still fixed in advance.
6. **It is not non-sofic.** The external shift remains the sofic full shift.
7. **It says nothing about the Hodge conjecture.** No smooth projective variety,
   rational `(p,p)` class, or algebraic cycle has been constructed.

Thus tail-Hodge energy is a certificate, not a classification theorem. Its
value is that it demonstrates one exact way a nonlinear presentation lift
followed by finite harmonic mean-removal can detect a specific integral phantom
class, even though stagewise coefficient realification supplied no comparison.

## 7. A second hypothesis: restore continuity by retaining phase

There is a suggestive continuous enlargement. The dyadic solenoid can be
presented as

\[
\Sigma_2=(\mathbb R\times\mathbb Z_2)/\mathbb Z,
\]

where an integer changes the real and 2-adic coordinates in compensating
directions. Unlike `Z_2/Z`, this space is compact Hausdorff. But a class in
`Z_2/Z` does not canonically determine a solenoid point: choosing another
integer representative requires a compensating real phase.

This leads to a serious conjecture rather than a conclusion:

> A Genesis path may canonically produce the missing phase or lift. Continuous
> analytic observability would then belong to the lifted continuation object,
> not to its completed fossil quotient.

The phase is not an address used to reverse memory. It is coherence data saying
how the executable continuation sits above the quotient that forgets its
genesis. We have not yet constructed a certificate-forced phase law, proved
gauge naturality, or checked a non-sofic action on the lift.

## 8. The hypothesis ledger

### Proved in this prototype

- `Z_2/Z` has indiscrete quotient topology.
- The finite path probe is an ordinary degree-zero Hodge projection.
- Tail energy descends under integer representatives.
- The universal class has exact tail-Hodge energy `1/4`.
- Positive energy certifies a nonzero derived class.
- Sparse nonzero classes show that the certificate is incomplete.

### Open but now falsifiable

- A local obstruction compiler can generate, rather than prewrite, a derived
  class with a uniform positive tail-Hodge lower bound.
- The lower bound can survive the correct semantic gauge category and every
  cofinal refinement.
- The continuation process can generate a canonical solenoidal phase, making a
  comparison observable continuous on the lifted object.
- An exact non-sofic semantic action can preserve this structure after the full
  observational quotient.

These hypotheses are retained because they are concrete enough to attack, not
because present literature or computation has already validated them.

## 9. The next theorem

The immediate target is an **endogenous residue-preserving comparison
theorem**:

> Construct a typed obstruction-generated attachment process whose emitted
> integral cocycle is finitely exact, globally nonexact, and has
> `mathcal E >= c > 0`; prove that the lower bound is invariant under the
> declared semantic gauges and cofinal refinements, and prove that the next
> attachment is forced by a current certificate rather than read from a
> preallocated future tape.

This is smaller than “new Hodge theory.” It is a candidate method target not
matched in the bounded corpus: the detector would be generated together with
the path of distinctions it measures.

## 10. Literature boundary

A bounded collision search used four five-query intent-ranked discovery jobs
and five first-page keyword searches. Together they returned `46` unique
reranked links and `45` unique search-result links. Retrieval quality was
limited: the highest discovery relevance score was `0.4004`, several queries
drifted into generic `p`-adic Hodge or spectral-sequence literature, and the
literal “tail Hodge” search was dominated by nonmathematical uses of “tail.”

Within that corpus, no retrieved title, abstract, or content passage explicitly
combined all of: the standard class `lim^1(Z,times2)=Z_2/Z`, canonical dyadic
digits, Cesaro exhaustion, finite path-graph projection off the harmonic
constant line, and a limsup residual descending modulo `Z` and positive on the
selected universal class.

The individual ingredients have close precedents. The derived-limit class is
standard; the path projection is ordinary graph Hodge theory; the residual is
empirical binary variance; its insensitivity to finite—and more generally
zero-density—changes places it near Besicovitch symbolic geometry; and the
proposed lifted phase belongs to standard dyadic-solenoid topology. The phrase
**tail-Hodge energy** is therefore only a project-local name for this packaging.

This is evidence of no direct match in a small, noisy retrieval, not a novelty,
priority, or independence claim. A serious audit would additionally require
targeted primary-source searches in Besicovitch symbolic dynamics,
normal/Champernowne-type binary sequences, graph-signal mean-removal energies,
dense-subgroup quotients, and natural comparison maps from derived inverse
limits to analytic defect spaces. The broader classification is in
[`prior-art-classification-20260805.md`](prior-art-classification-20260805.md).

## 11. Run

```powershell
node research/genesis-tail-hodge.mjs
```

## References

1. C. Schochet, [A Pext Primer: Pure Extensions and `lim^1` for Infinite
   Abelian Groups](https://nyjm.albany.edu/m/2003/1p.pdf).
2. The Stacks Project, [Derived
   Limits](https://stacks.math.columbia.edu/tag/08TB).
3. J. Hansen and R. Ghrist, [Toward a Spectral Theory of Cellular
   Sheaves](https://arxiv.org/abs/1808.01513).
4. P. Garrett, [Solenoids](https://www-users.cse.umn.edu/~garrett/m/mfms/notes/02_solenoids.pdf).
