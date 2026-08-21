# Quantitative nonsofic obstruction: an exact bridge and a fixed-gap locality compiler

**Status:** exact finite bridge; exact symbolic locality compiler; the fixed
Gamma certificate remains open after an exact character-refinement search,
and the ambient certificate remains unmaterialized; no numerical
\((F,\varepsilon)\) is emitted.

**Date:** 2026-08-21.

**Executable:**
[genesis-quantitative-nonsofic-extraction.mjs](genesis-quantitative-nonsofic-extraction.mjs).

## 1. Outcome

The quantitative route from the OpenAI nonsoficity proof to an executable
finite obstruction is now narrow enough to state without asymptotic
placeholders.

The project has closed four formerly implicit interfaces:

1. the exact binary-Leavitt proof instance;
2. the generator-set transfer actually required by Proposition 2.3;
3. rational property-\((T)\) and lazy-Markov contraction bounds for those
   generators; and
4. a concrete 155-element non-LEF Thompson-\(V\) endpoint.

It has also closed a fifth interface symbolically. For either of the two
fixed lazy Markov operators, one rational SOS certificate for

\[
\mathsf B_\kappa=\Delta^2-\kappa\Delta
\]

at the fixed effective gap \(\kappa=\kappa_0/2\) compiles, by an exact
polynomial identity, every finite-time locality certificate required in
Kun's argument. The same base certificate works for every time \(k\) and
every rational positive additive slack; real slack follows by choosing a
smaller rational value. Its support radius grows linearly with \(k\) and is
independent of the slack.

The first missing objects are therefore concrete rather than existential:

- one verified finite rational row decomposition of \(\mathsf B_\kappa\) for
  the 31-label \(\Gamma\) walk; and
- one for the 35-label ambient \(G\) walk.

Ozawa's strict-gap property-\((T)\) characterization implies that both
searches terminate, but this project has not yet found or verified the rows.
The executable consequently reports an honest blocker and does not turn
qualitative existence into a fabricated number.

For the 31-label Gamma walk, the search has now proved an exact
finite-subgroup character birth criterion, a 54,090-ray V4 fixture family, a
four-packet Laplacian refinement, and the auxiliary radius-at-most-four SOS
inequality \(L-D/15\succeq0\).  It has also proved exact no-go results for
nested partial row dictionaries through 372 rows, including an exact
`MP24+MPstar24` closure with moment rank 2,615 and kernel dimension 340.  None
materializes \(\mathsf B_\kappa\).  The next prepared mover-seeking gate is the
source-closed W3 pair `X24+Y12`, with a frozen 408-row structural architecture
but no moment rank or PSD conclusion.  The complete W2 refinement and the
35-label ambient walk remain open.

## 2. Why this is the surviving conjectural target

The bounded uniqueness audit found that most earlier conjecture rungs were
combinations of established schemas. The strongest immediate residual was
quantitative:

> Extract one actual numerical finite \((F,\varepsilon)\) permutation
> obstruction for the fixed OpenAI group.

This is not a new formulation of nonsoficity. Nonsoficity already implies
that some finite obstruction exists. The unresolved task is to compile the
particular proof into one independently replayable finite question set and
one positive tolerance.

That distinction matters to the larger endogenous-admission program. A
completed theorem is a fossil. An active obstruction mechanism needs a rule
that constructs the finite observations that force failure at a declared
scale.

## 3. The fixed proof instance

Let \(R=L_{\mathbf F_2}(1,2)\). Chapter 3 uses the complete nine-leaf code

\[
D=(000,001,01,1000,1001,101,1100,1101,111)
\]

and the groups

\[
G=\operatorname{EL}_D(R)\cong\operatorname{EL}_9(R),
\qquad
\Gamma=\operatorname{EL}_{(000,001,01)}(R)
\cong\operatorname{EL}_3(R).
\]

The contraction units \(u,v\in G\) and the supported copy
\(J=V_{1000}\cong V\) satisfy

\[
u\Gamma u^{-1},v\Gamma v^{-1}\leq\Gamma,
\qquad
uJu^{-1}\leq\Gamma,
\qquad
G=\langle\Gamma,u,v\rangle.
\]

These are the hypotheses of Proposition 2.3 in
[OpenAI's proof collection](https://cdn.openai.com/pdf/ten-proofs-oai.pdf).

## 4. Two different 35-label alphabets

An exact typing correction is load-bearing here: two alphabets in the proof
both contain 35 labels, but they have different roles.

### 4.1 Ambient decomposition alphabet

The explicit Ershov--Jaikin-Zapirain bound is first stated for the 360
natural elementary roots of \(\operatorname{EL}_9(R)\). Proposition 2.3
instead applies Kun's decomposition to

\[
S_G=S_\Gamma\cup\{u,u^{-1},v,v^{-1}\},
\qquad |S_G|=35,
\]

where \(S_\Gamma\) contains the identity and the 30 natural rank-three
roots. This is the alphabet for the ambient \(G\)-generator graph and its
spectral transfer.

### 4.2 Step-4 finite-test alphabet

After matching components, Step 4 uses

\[
T=T_\Gamma\cup T_J,
\qquad
T_\Gamma=S_\Gamma,
\qquad
T_J=\{j_1,j_1^{-1},j_2,j_2^{-1}\}.
\]

This alphabet also has 35 labels. It defines the formal word sets \(W_\ell\)
and the ball \(B_T(2\ell)\). The contraction labels \(u,v\) do not belong to
this Step-4 word ball; they occur in the separate comparison portfolio that
proves how the \(J\)-actions descend.

The executable binds both alphabets by distinct IDs and digests. Cardinality
alone is no longer accepted as evidence that a module uses the right one.

## 5. Exact generator transfer and spectral constants

The executable constructs a word over the special ambient generators for
every one of the 360 natural rank-nine roots and evaluates both sides in the
exact binary Leavitt algebra. All identities pass.

| Freely reduced length | Root count |
|---:|---:|
| 1 | 30 |
| 6 | 36 |
| 12 | 144 |
| 18 | 12 |
| 24 | 18 |
| 28 | 12 |
| 30 | 36 |
| 36 | 72 |

Hence

\[
\boxed{L_{\Sigma_9\rightarrow S_G}=36.}
\]

The same audit verifies:

- 60 contraction conjugates \(uxu^{-1}\) and \(vxv^{-1}\), each represented
  by a \(\Gamma\)-word of length at most 10; and
- the two required elements \(uj_1u^{-1}\) and \(uj_2u^{-1}\), represented
  by exact \(\Gamma\)-words of lengths 300 and 180.

The first of the latter words factors with lengths \(102+108+90\); the
second with lengths \(90+90\).

Let \(\kappa_{\Sigma_9}\) denote the maximal-displacement Kazhdan constant
for the natural rank-nine roots. The rational Ershov--Jaikin-Zapirain lower
bound used by the executable is

\[
\kappa_{\Sigma_9}\geq\frac{62500}{47622573}.
\]

The exact length-36 dictionary therefore gives

\[
\kappa(G,S_G)
\geq\frac{\kappa_{\Sigma_9}}{36}
\geq\frac{15625}{428603157}.
\]

For the 35-label lazy walk, the conservative energy conversion yields the
absolute Markov contraction gap

\[
\boxed{
\nu_G\geq
\frac{48828125}{2571809326665133086}
\approx1.8985904006855542\times10^{-11}.
}
\]

For the 31-label rank-three lazy walk, the corresponding audited bound is

\[
\nu_\Gamma\geq
\frac{9765625}{319851743272542}.
\]

These are absolute, not merely top-end, contraction bounds. If the lazy
identity mass is \(p\), then
\(A\geq-1+2p\), equivalently
\(A+1-2p\) is a sum of squares. Both displayed positive gaps are at most
\(2p\) for their respective \(31\)- and \(35\)-label walks, so the negative
spectral endpoint cannot dominate. The executable checks both inequalities
exactly.

The fixed SOS searches below use the effective constants
\(\kappa_H=\nu_H/2\).

The symbol \(\nu_H\) is reserved here for spectral contraction. Later
symbols \(\gamma_H\) denote component edge-expansion returned by Kun's
decomposition; the two constants are not interchangeable.

## 6. The finite non-LEF endpoint

The exact Bleak--Quick presentation audit supplies

\[
|E_V|=155,
\qquad
(|r_1|,\ldots,|r_7|)=(6,3,16,69,31,25,35).
\]

After exact-element deduplication, the longest chosen representative has
length 67. The longest formal relator prefix has length 69, so the safe
unreduced product-word length for \(E_VE_V\) is

\[
\boxed{2\cdot69=138.}
\]

The chart is executable. Its non-LEF status also uses theorem input:
Bleak--Quick's presentation, infinite simplicity of \(V\), and the fact that
a finitely presented LEF group is residually finite.

The terminal \(\Gamma\times J\) binding is exact as well. Elements of
\(\Gamma\) differ from the identity in the \([0]\) corner, while elements of
\(J\) differ from it in the disjoint \([1000]\) corner. This supplies both
commutation and trivial intersection.

## 7. Typed finite modules and the Step-1--5 budget

For a requested rational edit scale \(r>0\), a verified Kun module must return

\[
\mathsf{Kun}_{H,S_H}(r)
=(K_H,\sigma_H,\gamma_H,D_H,N_H),
\qquad H\in\{\Gamma,G\},
\]

where \(K_H\) is a complete finite word portfolio, \(\sigma_H>0\) a chart
tolerance, \(\gamma_H>0\) a component-expansion bound, \(D_H\) a degree
bound, and \(N_H\) a size threshold.

The finite Kun--Thom module has the form

\[
\mathsf{KT}(E_V,\gamma_\Gamma/2)
=(P_{\rm KT},r_{\rm KT},\theta_{\rm KT},N_{\rm KT}).
\]

It must certify semantic distinctness of its finite \(\Gamma\)-ball witness,
not merely syntactic uniqueness of formal words.

We freeze the normalized-Hamming convention before compiling any module. For
\(d_N\) the normalized Hamming distance on \(\operatorname{Sym}(N)\), an
\((F,\varepsilon)\)-chart is a map
\(\phi:F\to\operatorname{Sym}(N)\) with normalized identity, with

\[
d_N\!\left(\phi(x)\phi(y),\phi(xy)\right)<\varepsilon
\]

whenever \(x,y,xy\in F\), and with

\[
d_N\!\left(\phi(x),\phi(y)\right)>1-\varepsilon
\]

for distinct \(x,y\in F\). The requested scale \(r\) is a simultaneous
per-declared-test envelope: it bounds each named primitive word-failure
fraction, each per-label reference-edge edit fraction returned by a Kun
module, and each declared normalization-repair fraction. Sums over labels or
paths occur only in the displayed Step-1--5 ledger below.

### 7.1 A finite-budget lemma

The compiler freezes the paired-arc multigraph convention of Proposition
2.3 and uses the following conservative bounds. They are recorded here so
the bridge is not hidden in code assertions.

Let

\[
s=30,
\qquad m=2,
\qquad L_{\rm ctr}=264,
\qquad
A_{\rm cmp}=1+s+2L_{\rm ctr}=559.
\]

For Kun edit fraction \(r\), matching threshold \(0<\eta<1\), and median
threshold \(0<\delta<1/2\), put

\[
c_U=\frac{2A_{\rm cmp}}{\gamma_\Gamma},
\]

\[
V_{\rm ctr}
=2\eta+\frac{2c_Ur}{\eta}+2r,
\]

and

\[
V
=r+8sr+2mV_{\rm ctr}.
\]

The median-exception fraction is bounded by

\[
e_\delta=\frac{V}{\gamma_G\delta}.
\]

The unmatched-complement bound used in the injection step is

\[
M
=\frac{c_Ur}{\eta}
+\frac{2r+2e_\delta}{1-\eta}
+\eta.
\]

With

\[
\rho(\delta)
=\left(\frac{1+2\delta}{1-2\delta}\right)^2,
\]

the exact majority gate is

\[
2(1-\eta)>\rho(\delta).
\]

For the four directed \(J\)-generator words of lengths
\((300,300,180,180)\), the union-bounded generator-exit fraction is

\[
g_J
=2|S_\Gamma|r
+\sum_{L\in\{300,300,180,180\}}(2M+2Lr+r).
\]

Let

\[
W_q=\sum_{i=0}^{q}35^i,
\qquad
\beta_\ell=(4\ell-1)r.
\]

Here 35 is the size of the Step-4 \(\Gamma\times J\) alphabet, not the
ambient \(\Gamma+u,v\) alphabet. The Step-4 bad fraction is bounded by

\[
b_\ell
=2r+W_\ell^2\beta_\ell+W_{\ell-1}g_J.
\]

If \(D_\Gamma\) is the returned reference-graph degree bound, define

\[
C_{\rm gr}=31+D_\Gamma+30,
\qquad
a_{\rm gr}=C_{\rm gr}b_\ell,
\qquad
q_{\rm cut}=\frac{2a_{\rm gr}}{\gamma_\Gamma}.
\]

A sufficient cleanup condition is

\[
a_{\rm gr}
\leq
\frac{\gamma_\Gamma^2}
{8(\gamma_\Gamma+31)},
\qquad
q_{\rm cut}<\frac12.
\]

If the selected pre-cut component has certified size at least \(W\), then

\[
|Z|\geq W-\lfloor q_{\rm cut}W\rfloor.
\]

This is a component-size lower bound; it does not claim that particular
named witness points survive the cut. The compiler requires the right-hand
side to be at least \(N_{\rm KT}\).

Finally, the post-repair portfolio error is bounded by

\[
\theta_{\rm out}
=\frac{b_\ell+2\ell q_{\rm cut}}{1-q_{\rm cut}},
\]

and must satisfy \(\theta_{\rm out}<\theta_{\rm KT}\).

These coefficients follow from the Step-1 component-loss bound, the bounded
median normalization, the Step-3 majority injection, the Step-4 formal-word
union bound, and both Step-5 repairs. They are intentionally conservative.

### 7.2 Conditional finite output

When every module and inequality passes, first form the finite formal
representative family

\[
\boxed{
\widehat F_*=\operatorname{TestCl}_{\rm word}\!\left(
K_\Gamma(r_*)\cup K_G(r_*)
\cup B_T(2\ell)
\cup\operatorname{Pref}(\mathcal R)
\cup P_{\rm KT}
\right),
}
\]

where \(\mathcal R\) contains the contraction, conjugation, identity,
inverse, involution, and endpoint-comparison words. Bleak--Quick relators do
not replace these relations. Here \(\operatorname{TestCl}_{\rm word}\)
retains the identity, every formal representative and its prefixes, and the
prefixes of every declared inverse-product comparison, normalization,
source-level transport comparison, and endpoint-separation word.

The actual finite subset of the group is the semantic image

\[
\boxed{
F_*=\operatorname{ev}_G(\widehat F_*)
=\{[w]_G:w\in\widehat F_*\}\subset G.
}
\]

Duplicate representatives are quotiented by the frozen exact Leavitt
normal-form equality oracle. Thus the shortlex count is an exact count of
formal representatives and only an upper bound on \(|F_*|\). The same oracle
gives a finite algorithm for every equality/distinctness and product test in
\(F_*\); the certificate binds that algorithm rather than materializing its
astronomical pair table.

Put

\[
L_*=\max\{|w|:w\in\widehat F_*\},
\qquad
C_{\rm word}(F_*)=8L_*+8.
\]

The word-telescoping lemma is elementary but load-bearing. If
\(w=s_1\cdots s_q\), \(q\leq L_*\), and every prefix of \(w\) is retained,
then repeated use of multiplicativity and bi-invariance gives

\[
d_N\!\left(
\phi([w]),
\phi([s_1])\cdots\phi([s_q])
\right)
\leq q\varepsilon.
\]

The proof is induction on \(q\): the next prefix multiplication adds one
primitive defect set and translation does not change normalized Hamming
distance. Applying the same induction to two representatives, then to their
retained inverse-product comparison, costs at most
\(L_*+L_*+(2L_*+2)\) primitive events. The source-level inverse/involution
normalization trace may repeat that two-sided comparison and use at most six
identity, inverse, or endpoint events, contributing at most \(4L_*+6\).
This gives the following deliberately padded trace bound:

| Primitive event family | Maximum count |
|---|---:|
| Prefix telescoping for the first representative | \(L_*\) |
| Prefix telescoping for the second representative | \(L_*\) |
| Inverse-product equality/separation comparison | \(2L_*+2\) |
| Source-level inverse/involution normalization and endpoint trace | \(4L_*+6\) |

The four rows sum to \(8L_*+8\). Every intermediate group product used in
these telescopes occurs as the evaluation of a prefix retained by
\(\operatorname{TestCl}_{\rm word}\). Bi-invariance of \(d_N\) and a union
bound therefore make the total affected starting-vertex fraction at most
\(C_{\rm word}(F_*)\varepsilon\).

This charge stops before any graph repair. Kun edge edits, ES vertex changes,
and the two Step-5 repairs are controlled by the common \(r_*\)-envelope and
already appear in \(b_\ell\) and \(q_{\rm cut}\); they are not charged again
as primitive \(\varepsilon\)-events.

A sufficient tolerance is

\[
\boxed{
\varepsilon_*
=\frac12\min\left\{
\sigma_\Gamma(r_*),
\sigma_G(r_*),
\sigma_{\rm ES}(r_*),
\frac{r_*}{C_{\rm word}(F_*)}
\right\}.
}
\]

Under the frozen Hamming convention, the explicit normalization adapter uses

\[
\sigma_{\rm ES}(r)=\frac r2.
\]

The outer factor \(1/2\) is a deliberate split. It gives

\[
C_{\rm word}(F_*)\varepsilon_*\leq\frac{r_*}{2},
\]

while the simultaneous bounds
\(\varepsilon_*\leq\sigma_H(r_*)/2\) reserve the other half of every
normalization and module margin. This is the precise bridge from primitive
Hamming tests to the common \(r_*\)-envelope.

The formal ball is represented by an exact shortlex descriptor rather than
materialized. At the current theorem minimum, it already has 939 decimal
digits worth of formal words. Finiteness is exact; attempting to allocate the
whole set would be an implementation error.

### 7.3 Fail-closed evidence boundary

Every theorem module is locked to a statement digest, source digest,
generator/convention ID, proof-instance digest, compiler digest, and verifier.
The compiler rejects qualitative existence, metastability, a wrong alphabet,
an under-radius portfolio, an insufficient post-cut component, or a failed
finite inequality.

If all theorem modules pass, the compiler returns their complete accepted
bodies together with the semantic finite-subset descriptor and source
bindings. That result is generatively replayable against the frozen source,
fixture, and exact equality oracle; it is not advertised as a standalone
proof object independent of those bound dependencies. The current blocked
run is likewise reproducible only relative to its frozen local executable.
A caller cannot supply or replace the normalization module, poison a private
fixture through an alias, or exploit non-JSON values to collide under
canonical serialization.

## 8. One fixed SOS compiles every Kun locality certificate

Let \(A=A^*\) be either fixed symmetric lazy Markov element, let
\(\Delta=1-A\), and let \(p=\mu(e)\). Write \(\kappa_0>0\) for the proved
absolute contraction gap and freeze once and for all

\[
p_\Gamma=\frac1{31},
\qquad
p_G=\frac1{35},
\]

and

\[
\kappa=\frac{\kappa_0}{2},
\qquad
u=1-\kappa,
\qquad
b=1-2p.
\]

Define

\[
x=u-A,
\qquad
y=A+b,
\qquad
L=u+b,
\qquad
d=u-b=2p-\kappa,
\]

and the one missing base certificate

\[
\mathsf B_\kappa=\Delta^2-\kappa\Delta=\Delta x.
\]

For both frozen measures, \(0<\kappa<\kappa_0\), \(d\geq0\), and \(L>0\).
The elements \(\Delta\) and \(y\) have explicit radius-one SOS
decompositions. If \(\mathsf B_\kappa\) has a finite rational SOS, then the
exact identity

\[
\begin{aligned}
C
&=\Delta^2(u^2-A^2)\\
&=d x^2\Delta+d\kappa\mathsf B_\kappa\\
&\quad+\frac1L\left(
(xy)^2\Delta
+\kappa y^2\mathsf B_\kappa
+(\Delta x)^2y
\right)
\end{aligned}
\]

is itself an SOS. Each term is obtained by right-multiplying rows from an SOS
of \(\Delta\), \(y\), or \(\mathsf B_\kappa\); no invalid
"product of positive elements is positive" step is used.

For \(k\geq1\), set

\[
H_k
=\sum_{j=0}^{k-1}u^{2(k-1-j)}A^{2j}.
\]

Because \(C\) and \(H_k\) are polynomials in \(A\), right-multiplying the
rows of \(C\) by the square roots displayed in \(H_k\) gives

\[
\boxed{
P_k
=\Delta^2(u^{2k}-A^{2k})
=CH_k
\in\Sigma^2.
}
\]

This is Kun's locality inequality with zero additive slack. For any rational
\(\zeta>0\), one also has

\[
Q_{k,\zeta}
=P_k+\left((u^k+\zeta)^2-u^{2k}\right)\Delta^2
\in\Sigma^2.
\]

The slack changes only the coefficient of the existing \(\Delta\) row. It
does not change the support radius.

If \(R_{\mathsf B}\) is the maximum row radius of the base certificate, put

\[
R_C=\max\{R_{\mathsf B}+1,3\}.
\]

Then

\[
R_k\leq R_C+k-1,
\qquad
r_{\leq K}
=2(R_C+K-1)
\]

suffices simultaneously for every \(1\leq k\leq K\) and every positive
slack. Thus one fixed base SOS per generating set supplies a linear locality
modulus in \(K\).

The finite horizon in Kun's Corollary 9 is also explicit once an internal
partition-boundary target \(a_{\rm part}>0\) is fixed. Set

\[
 a=\frac{a_{\rm part}}{d_H+3},
 \qquad
 \mu=\frac1{100},
 \qquad
c=1-\frac9{10}(1+\mu)^2=\frac{8191}{100000},
\qquad
\Theta=\frac{a^2c^2}{432d_H^2},
\]

and define

\[
 n_\kappa=\left\lceil\frac1\kappa\right\rceil,
 \qquad
 m=\min\{j\geq0:2^{-j}\leq\Theta/2\},
 \qquad
 K=\max\{1,mn_\kappa\},
\]

\[
\qquad
\zeta=\min\{\Theta/2,\mu/(\kappa K)\}.
\]

This is an exact dyadic algorithm, not a floating-point logarithm:
\((1-\kappa)^{n_\kappa}<1/2\), hence
\((1-\kappa)^K\leq2^{-m}\leq\Theta/2\). These parameters are downstream
of the base SOS and do not alter its search.

The otherwise omitted step in Proposition 11 is a two-case argument. Put
\(E_T=\|\chi_T-M\chi_T\|_2^2\). If
\(E_T\geq\kappa^2|T|/10\), take the repaired set to be empty. Otherwise
Corollary 9 and the choice of \(\zeta\) give

\[
|U\mathbin\triangle T|<(1-c)|T|,
\qquad
|U|>c|T|,
\qquad
|\partial U|<a|U|.
\]

Thus the displayed choices really imply the finite boundary and edit bounds;
they are not merely parameters that make one decay term small.

The scale is severe. At the merely illustrative choice
\(a_{\rm part}=1/100\), the current conservative gaps give

\[
K_\Gamma=3{,}340{,}787{,}538,
\qquad
K_G=5{,}477{,}748{,}121{,}092.
\]

These are exact safe horizons, not evidence of ineffectivity. They do expose
another implementation boundary: the expressions
\(W_\ell=(35^{\ell+1}-1)/34\), the formal ball, and a dyadic output
tolerance must be stored and compared as symbolic arithmetic circuits. Even
the integer \(W_\ell\) cannot be expanded at this scale. The current
executable handles its 608-radius theorem control compactly, but must fail
closed on theorem modules beyond its expanded-integer arithmetic limit until
that symbolic budget engine is installed.

Closing \(K\) and \(\zeta\) does not yet close the whole Kun module. The
conversion \(a_{\rm part}\mapsto a_{\rm part}/(d_H+3)\) is explicit, while
the later separated-matching step in Kun's Lemma 14 still says only that its
input parameter is "small enough." That finite matching threshold and the
local-chart defect threshold must still be compiled.

### 8.1 Why the two searches terminate

[Ozawa's property-\((T)\) SOS characterization](https://arxiv.org/abs/1312.5431)
at a strict rational gap supplies a finite rational SOS for each
\(\mathsf B_\kappa\). Candidate rational row families can be enumerated and
checked exactly.

The equality oracle is not merely heuristic. The distinguished-edge basis in
Theorem 1 of Alahmadi--Alsulami--Jain--Zelmanov,
[*Leavitt Path Algebras of Finite Gelfand--Kirillov Dimension*](https://arxiv.org/abs/1204.5258),
matches the implementation's terminal-edge convention and makes finite
Leavitt expressions canonically comparable. Finite matrices over that ring
therefore have decidable exact equality.

This proves computability of a support radius for each fixed walk. It does
not provide a practical upper bound, and this project has not yet executed a
terminating search to completion. A bounded source sweep found no published
row support for these two Leavitt elementary groups and no source stating the
exact all-\(k\) compiler above. That is a bounded originality result, not a
global novelty proof.

The next direct target is:

> Materialize and independently verify the two fixed
> \(\mathsf B_\kappa\) row certificates, record their support radii, and feed
> the resulting linear locality moduli into the two typed Kun modules.

## 9. Architectural and major-problem interpretation

The object exposed by this chase is not initially a new group element. It is
a locality compiler:

\[
\text{global spectral rigidity}
\longmapsto
\text{finite observable radius and defect budget}.
\]

This is exactly the kind of bridge the wider project needs. A global theorem
may guarantee that an old realization eventually fails, while an adaptive
architecture needs the finite question that witnesses the failure now.

The four major frontiers are not being quarantined. They remain the native
output tests for the proposed foundations:

- **Hodge:** admission must eventually construct an actual rational
  algebraic cycle, not merely a new cohomological vocabulary;
- **Navier--Stokes:** admission must yield a correctly scaling coercive
  estimate at the critical continuation interface;
- **Collatz:** admission must produce a frozen, well-founded descent
  mechanism rather than repackage the stopping-time truth; and
- **Riemann hypothesis:** admission must yield an all-and-only spectral
  realization or an unconditionally positive Weil-type form.

The present result does not solve any of them. It makes one foundational
mechanism unusually concrete: a proof can be compiled backward into the
finite observables that force its obstruction.

## 10. Executable evidence and boundaries

The executable currently checks:

- all 360 natural-to-special root identities and the maximum length 36;
- all 60 contraction-conjugate identities and maximum length 10;
- the 300- and 180-letter conjugated Thompson-\(V\) identities;
- both distinct 35-label alphabet bindings;
- exact rational spectral transfer;
- the 155-element endpoint and its \(67/69/138\) radii;
- the fixed-gap interval-polynomial identities at \(k=1,2,3,4\) for both
  walks, with and without optional slack;
- the complete conservative Step-1--5 budget on a typed synthetic control;
- compact exact formal-ball accounting without materialization;
- source, theorem, fixture, compiler, and verifier bindings;
- strict-JSON canonicalization, replay, and rehashed semantic tamper
  rejection; and
- hostile-module rejection for qualitative, metastable, wrong-alphabet,
  wrong-convention, under-radius, insufficient-size, and failed-inequality
  substitutions.

It does **not** establish:

- either concrete \(\mathsf B_\kappa\) rational row family or its radius;
- the installed theorem-level Kun modules at a chosen edit scale;
- the finite Kun--Thom tolerance specialized to the 155-element chart;
- a numerical theorem-level \((F,\varepsilon)\);
- a practical bound on the SOS enumeration time;
- a global novelty claim for the all-\(k\) compiler;
- an endogenous architectural lower bound; or
- any theorem about Hodge, Navier--Stokes, Collatz, or RH.

Frozen executable evidence for this note:

| Artifact or audit | Value |
|---|---|
| Executable SHA-256 | `bcd8ae2e3d82b44bb0bd19ee866e5b256966efc56c4cb6b0b679a56e88abcfef` |
| Certificate digest | `775c08780e45f04c81a53d321a14158ef6060d41deeaca64063c3f2c853e4d8c` |
| Payload digest | `c5dde4366f534cae4e26ec92e77ba64d88ade6e8c53837f4df7ecfccd012e79c` |
| Semantic tamper rejection | 24/24 |
| Hostile-module rejection | 17/17 |
| Compilation replay attacks | 4/4 |
| Strict-JSON invalid values | 8/8 |
| Two fresh PowerShell-captured UTF-8 outputs | byte-identical; SHA-256 `74c6bc636bf1040994c737e49f9fad1c26010a484e5e0b804c46bc92aa39193d` |

Syntax, direct execution, internal replay, and fresh-process determinism are
release gates, not inferred from these digests.

## 11. Primary sources

- OpenAI, [*Ten Proofs*](https://cdn.openai.com/pdf/ten-proofs-oai.pdf),
  Chapter 3, especially Proposition 2.3 and Sections 3.1--3.3.
- G. Kun,
  [*On sofic approximations of property (T) groups*](https://arxiv.org/abs/1606.04471),
  especially Corollary 9, Lemma 10, and Proposition 11.
- G. Kun and A. Thom,
  [*Inapproximability of actions and Kazhdan's property (T)*](https://arxiv.org/abs/1901.03963).
- N. Ozawa,
  [*Noncommutative real algebraic geometry of Kazhdan's property (T)*](https://arxiv.org/abs/1312.5431).
- M. Ershov and A. Jaikin-Zapirain,
  [*Property (T) for noncommutative universal lattices*](https://arxiv.org/abs/0809.4095).
- A. Alahmadi, H. Alsulami, S. K. Jain, and E. Zelmanov,
  [*Leavitt Path Algebras of Finite Gelfand--Kirillov Dimension*](https://arxiv.org/abs/1204.5258),
  Theorem 1.
- C. Bleak and M. Quick,
  [*The infinite simple group V of Richard J. Thompson: presentations by permutations*](https://arxiv.org/abs/1511.02123).
