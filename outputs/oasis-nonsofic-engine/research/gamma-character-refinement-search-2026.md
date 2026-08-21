# Gamma character refinements: exact W3 no-go and restricted MQ cross-interface

**Snapshot:** 2026-08-21.  **Status:** exact structural results and exact
finite-dictionary exclusions; the Gamma fixed-gap SOS certificate remains open.

This note is self-contained at the theorem-and-boundary level.  Supporting
files under `work/uniqueness-20260810/` are cited as non-link local-archive
references because that research archive is intentionally not part of the
public tree.  The final hash table binds every such reference to the audited
file used for this snapshot.

## Outcome first

The Gamma search has found a real structural notch, but not yet the required
property-\((T)\) certificate.

The constructive part is now exact:

1. finite-subgroup character projections enter a ball-filtered SOS cone
   exactly when one permitted row chart can hold a complete character coset;
2. in the frozen Gamma fixture, this produces 54,090 distinct V4 character
   rays born at radius three and absent at radius two;
3. four symmetry packets of those rows reconstruct the 30-label Laplacian
   and give an exact Parseval-type label refinement; and
4. their noncentral energy lift proves the auxiliary rational SOS inequality
   \(L-D/15\succeq 0\) with rows of radius at most four.

The obstruction part is equally exact.  Eight nested symmetry-reduced row
dictionaries, ending with a conditional 408-row MP-plus-W3 X/Y dictionary and 3,561
active Gram coordinates, cannot represent

\[
D^2-\lambda D\qquad(\lambda>0)
\]

by a positive-semidefinite Gram matrix.  The final moment map has exact rank
3,169 and exact kernel dimension 392.  Every kernel direction preserves
three explicitly negative Gram diagonals, so the failure is conic rather than
the result of a missed affine degree of freedom.

The staged W3 X/Y gate is therefore closed as an exact no-go.  This is not a
complete-W3 result: the next search must add rows outside this selected
source-closed pair, and no larger dictionary is claimed here.

A separate, narrower MQ continuation is now certified.  On the 432-row action
with only the ordered coordinates `old3561 + X-MQ24 + Y-MQ12`, the 3,597-column,
3,584-row sketch has exact rational rank 3,205 and kernel dimension 392.
Literal zero-extension of the exact W3 `K392` gives the upper bound; the
primary ranks at 65,521, 65,519, and 65,497 and one independent full-rank
\(3{,}205\times3{,}205\) minor modulo 65,521 give the matching lower bound.
Thus this restricted interface realizes the full rank increment 36 and has
no extra restricted mover.  It does not extend the 408-row PSD no-go: 372
current-W2--MQ and 20 MQ--MQ coordinates are omitted, so full MQ432, a 432-row
PSD/no-go, complete W2 or W3, the ambient walk, a positive gap, property
\((T)\), and nonsoficity all remain outside the claim.

## 1. The local character-coset mechanism

Let \(G\) be a discrete group with word ball \(B_R\).  Let \(C_R\) be the
cone of finite sums \(\sum_i f_i^*f_i\), where each row is supported in a
left translate of \(B_R\).  For a finite subgroup \(H\leq G\) and a unitary
one-dimensional character \(\chi\), set

\[
s_\chi=\sum_{h\in H}\overline{\chi(h)}h,
\qquad e_\chi=\frac{s_\chi}{|H|}.
\]

Then \(e_\chi=e_\chi^*=e_\chi^2\).  The exact support criterion is:

> A nonzero positive multiple of \(e_\chi\) lies in \(C_R\) if and only if a
> complete left coset of \(H\) fits inside one allowed translate of \(B_R\).

The forward implication follows from positivity in the faithful regular
representation.  If
\(\alpha e_\chi=\sum_i f_i^*f_i\), every row satisfies
\(f_i=f_i e_\chi\).  A single nonzero coefficient of \(f_i\) therefore
propagates, with the character phase pattern, around a complete coset of
\(H\).  The converse uses the character row on a centered coset.

Consequently the least row radius admitting the ray is the exact
coset-centering quantity

\[
\rho(H)=\min_y\max_{h\in H}|y^{-1}h|.
\]

When every permitted chart meets an \(H\)-coset in at most \(m<|H|\) points,
the canonical trace gives the explicit separator

\[
\mathcal L_{H,\chi}(z)
=\tau(z)-\frac{|H|}{m}\tau(ze_\chi),
\]

which is nonnegative on \(C_R\) and negative on \(e_\chi\).  Its coefficients
are rational when \(\chi\) is rational-valued, in particular for the real V4
fixture below.  Local archive:
`work/uniqueness-20260810/gamma-tangent-cone/FINITE-SUBGROUP-CHARACTER-ESCAPE.md`.

This criterion also calibrates an unbounded family: the standard finite
subgroups \(S_n<V\), equipped with the sign character, have unbounded exact
birth radii for any fixed finite generating set.  This is an elementary
application of established ingredients, not a claim that the embeddings or
ball-filtered SOS problem are new.  Local archive:
`work/uniqueness-20260810/gamma-tangent-cone/UNBOUNDED-CHARACTER-BIRTH-RADIUS-FAMILY.md`
and
`work/uniqueness-20260810/gamma-tangent-cone/UNBOUNDED-CHARACTER-BIRTH-RADIUS-FAMILY-INDEPENDENT-AUDIT.md`.

## 2. The exact Gamma V4 family

For \(H\cong C_2^2\), every nontrivial real character has two positive and
two negative values.  The geometric notch comes from a permitted chart
containing three points of an \(H\)-coset while radius three supplies the
fourth.  In the frozen Gamma radius-two ball, an exact enumeration found:

| object | exact count |
|---|---:|
| accepted V4 subgroups | 18,030 |
| subgroup orbits under the frozen 24 actions | 785 |
| distinct \((H,\chi)\) rays | 54,090 |
| character-notch symmetry orbits | 2,313 |
| radius-three three-of-four coset completions | 38,124 |

Every accepted character square is outside the radius-two cone and has at
least one radius-three row realization.  For \(m=3\), the separator becomes

\[
\mathcal L_{H,\chi}(z)=\tau(z)-\frac43\tau(ze_\chi).
\]

If \(p=as_\chi\) is the completed character row, then
\(p^*p=16e_\chi\) and
\(\mathcal L_{H,\chi}(16e_\chi)=-4/3\).

The 54,090 rays are distinct; they are not asserted to be linearly
independent.  The enumeration is a fixture-specific exact classification,
not a literature-level novelty theorem.  Local archive:
`work/uniqueness-20260810/gamma-tangent-cone/V4-CHARACTER-NOTCH-FAMILY.md`
and
`work/uniqueness-20260810/gamma-tangent-cone/v4-character-notch-family.json`.

## 3. Four packets refine the Laplacian

Let \(S\) be the frozen set of 30 involutive Gamma labels and

\[
D=\sum_{s\in S}(1-s).
\]

Four selected symmetry packets, indexed `676`, `699`, `1433`, and `1468`,
contain 96 exact V4-character rows.  If \(Q_j\) is the sum of the row squares
in packet \(j\), let \(D_6\) be the Laplacian sum over the six
coefficient-one labels and \(D_{24}\) the sum over the remaining 24
nontrivial-root labels, so \(D=D_6+D_{24}\).  Exact coefficient replay gives

\[
Q_{676}+Q_{699}=32D_6,
\qquad
Q_{1433}+Q_{1468}=8D_{24},
\]

and hence

\[
D=\frac{Q_{676}+Q_{699}}{32}
 +\frac{Q_{1433}+Q_{1468}}8.
\]

Equivalently, after normalizing every packet by 96,

\[
\frac D{30}
=\frac1{10}\frac{Q_{676}}{96}
 +\frac1{10}\frac{Q_{699}}{96}
 +\frac25\frac{Q_{1433}}{96}
 +\frac25\frac{Q_{1468}}{96}.
\]

Each normalized packet has label Gram \(I_{30}\), so the identity refines
the Laplacian into its mean label mode plus an exact 29-dimensional
fluctuation Parseval term.  Every constituent ray is born at radius three,
but their positive combination is \(D\) itself, already a radius-one SOS.
This is a presentation and Gram refinement, not a new target-cone direction.
Local archive:
`work/uniqueness-20260810/gamma-tangent-cone/gamma-v4-character-laplacian-refinement-exact.json`.

The noncentrality is essential: \(D\) does not commute with the packet rows,
so \(Dp^*p\) cannot be substituted for \(p^*Dp\).

## 4. The noncentral energy-lift auxiliary theorem

Let

\[
R_j=\sum_{p\in j}p^*Dp,
\qquad
L=R_{676}/960+R_{699}/960+R_{1433}/240+R_{1468}/240.
\]

Every packet row \(p\) has one configured generator \(t(p)\) with
\(t(p)p=-p\).  Splitting off that saturated label gives the exact identity

\[
960L=64D+B,
\]

where

\[
B=\sum_j\alpha_j\sum_{p\in j}\sum_{s\ne t(p)}p^*(1-s)p,
\qquad (\alpha_{676},\alpha_{699},\alpha_{1433},\alpha_{1468})=(1,1,4,4).
\]

Since \(1-s=\tfrac12(1-s)^*(1-s)\), this is an explicit rational
Hermitian-square decomposition.  Therefore

\[
L-\frac D{15}=\frac B{960}\succeq0,
\]

with displayed row radius at most four.  Literal rational rows follow from
\(1/1920=(1/48)^2+(1/120)^2+(1/240)^2\); the weight-four packets double
those row coefficients.

The associated exact label Grams are

\[
G_{\mathrm{full}}=960I_{30}+1024J_{30},
\qquad
G_B=960I_{30}+896J_{30}.
\]

Both restrict to \(960I\) on the 29-dimensional sum-zero label space.  This
is a regular-trace Gram statement, not a group-algebra identity.

To separate the two noncentral defects, write

\[
E_4=\sum_s(1-s)D(1-s),\qquad C=\sum_s sDs,
\]

\[
A=960L-16E_4,\qquad K=C-30D.
\]

Exact replay gives \(E_4=2D^2-30D+C\).  In particular, the hoped scalar
comparison fails exactly: the residual

\[
R=960L-32D^2=A+16K
\]

is nonzero, has 3,753 support terms, and has canonical trace zero.  Neither
\(R\) nor \(-R\) is SOS.  Thus the auxiliary theorem does **not** prove
\(D^2-\lambda D\succeq0\) for any \(\lambda>0\); it identifies the missing
noncentral cancellation.  Local archive:
`work/uniqueness-20260810/gamma-tangent-cone/V4-LAPLACIAN-ENERGY-LIFT-EXACT-REPLAY.md`
and
`work/uniqueness-20260810/gamma-tangent-cone/V4-LAPLACIAN-ENERGY-LIFT-STRICT-BOUNDARY-AUDIT.md`.

## 5. Exact no-go hierarchy for staged Gamma dictionaries

The subsequent search allowed cross-Gram terms and enlarged the row
dictionary only after exact affine support and symmetry audits.  At each
stage, the rational kernel was closed by an exact upper bound from displayed
group-algebra dependencies and a matching modular rank lower bound.

| rows | added family | active invariant coordinates | exact rank | exact kernel | conclusion |
|---:|---|---:|---:|---:|---|
| 198 | `P12` | 811 | 792 | 19 | no PSD Gram for any \(\lambda>0\) |
| 204 | `Q6` | 883 | 849 | 34 | no PSD Gram for any \(\lambda>0\) |
| 228 | `s0sq24` | 1,107 | 1,042 | 65 | no PSD Gram for any \(\lambda>0\) |
| 252 | mixed `s0s1` regular-24 | 1,355 | 1,259 | 96 | no PSD Gram for any \(\lambda>0\) |
| 300 | `SP24+SPstar24` | 1,923 | 1,746 | 177 | no PSD Gram for any \(\lambda>0\) |
| 324 | `SQ24` | 2,243 | 2,016 | 227 | no PSD Gram for any \(\lambda>0\) |
| 372 | `MP24+MPstar24` | 2,955 | 2,615 | 340 | no PSD Gram for any \(\lambda>0\) |
| 408 | `W3-X24+Y12` | 3,561 | 3,169 | 392 | no PSD Gram for any \(\lambda>0\) |

In the 408-row cone, every exact kernel direction has zero projection on the
old obstruction diagonals in symmetry components 5, 8, and 9.  Their affine
values remain

\[
-960\lambda,
\qquad -7680\lambda,
\qquad -5760\lambda.
\]

A positive-semidefinite Gram matrix cannot have a negative diagonal.
Reynolds averaging then extends the invariant no-go to arbitrary Gram
matrices on the same row dictionary.  Local archive:
`work/uniqueness-20260810/cross-gram-repair/W3-XY408-FULL3561-EXACT-NO-GO.md`.

## 6. Corrections that changed the record

Two corrections are part of the theorem history rather than incidental
implementation notes.

First, the initial energy-lift replay used a basis-sized
`inverseSupportIndex` as if it inverted every retained group element.  The
repair re-entered arbitrary support through exact Gamma matrix hashes and
computed inverses by reversing exact representative words.  The proposed
scalar identity was then rejected, not weakened; only the independently
replayed auxiliary inequality above was retained.

Second, the first 300-row kernel floor contained two incorrect coordinate
bindings.  A fail-closed replay against four independent integer streams
rejected both bindings.  Subsequent exact Gamma orbit replay found residual
supports of 2,112 and 3,451 and established the replacements

\[
2c_{1071}-c_{1903}=0,
\qquad
2c_{1729}-c_{1879}=0.
\]

Ten further exact scalar aliases then raised the kernel floor from 167 to
177.  Three independent exact replays agree on those ten identities.  Local
archive:
`work/uniqueness-20260810/a2-gap-compiler/sp-spstar-floor-coordinate-corrections-exact-orbit-replay.json`
and
`work/uniqueness-20260810/cross-gram-repair/sp-spstar-missing10-exact-orbit-moment-audit.json`.

The SQ rank gate was also interpreted fail-closed.  Its initial exact floor214
did not reach the projected rank ceiling: all three primes exposed 13 further
kernel dimensions.  Vanishing finite-field witness projections were treated
only as guides.  The 13 relations were promoted only after exact Gamma
coefficient replay, which raised the exact floor to 227 and closed the rank
sandwich below.

The MP rank gate repeated the same discipline.  Its conservative exact floor
298 did not close the projected rank: all three primes exposed 42 additional
kernel dimensions.  Their vanishing modular witness projections were not
treated as a theorem.  A primitive scan produced 42 sparse scalar relations,
and only direct coefficientwise Gamma replay promoted them.  The resulting
exact kernel has dimension 340.

The W3 rank gate started from an exact source floor of 391.  All three primes
found rank 3,169 rather than the ceiling 3,170, exposing one further modular
direction with zero witness projection.  It was promoted only after direct
coefficientwise Gamma replay proved

\[
4c_{3237}-c_{3541}=0.
\]

This raised the exact kernel floor to 392 and closed the final rank sandwich.

## 7. Exact closure of the `SQ24` gate

The `SQ24` extension has 324 rows and 2,243 active invariant Gram coordinates.
The inherited source floor was

\[
177+30+7=214.
\]

The final 2,048-row integer projection instead had rank 2,016 modulo each of
65,521, 65,519, and 65,497, leaving 13 additional modular directions beyond
that floor.  A primitive all-four-stream scan decomposed the projected kernel
as 180 zero columns plus 47 scalar-class relations, for total dimension 227.
It selected 13 relations independent of the known214 at all three primes.

Every selected relation is a two-column scalar alias.  Exact 24-orbit Gamma
replay gave coefficientwise residual zero for all 13.  Hence the 227 exact
dependencies give

\[
\operatorname{rank}_{\mathbb Q}M\le2243-227=2016.
\]

The modular rank 2,016 supplies the opposite inequality through a nonzero
integer minor.  Therefore

\[
\operatorname{rank}_{\mathbb Q}M=2016,
\qquad
\dim_{\mathbb Q}\ker M=227.
\]

All 227 exact kernel directions preserve the three obstruction diagonals, so
the negative values displayed in Section 5 prove the SQ no-go.  Local archive:
`work/uniqueness-20260810/cross-gram-repair/SQ24-FULL2243-EXACT-NO-GO.md`.

`SQ24` is not dispensable merely because its moment is linearly related to
older rows.  The corresponding old-row Gram representation is indefinite,
and an exact local Boolean separator rules out a positive congruence
reduction in the aligned corner.  Local archive:
`work/uniqueness-20260810/curvature-module-factor/sq24-congruence-and-local-psd-theorem.json`.
That artifact lists the superseded floor204 file among its provenance, but
the floor is not used by its local Boolean/congruence proof.  The global gate
started from the corrected floor214 and then exactified the additional 13
relations to the final floor227.

## 8. Exact closure of the `MP24+MPstar24` gate

The MP extension has 372 rows and 2,955 active invariant Gram coordinates.
Its restart-safe five-stream export completed all 2,243 inherited and 712 new
coordinates under the post-fix C041 compiler.  Two independent integrity
audits checked every file, report, per-column digest, input binding, and
checkpoint boundary before the rank calculation.

The initial exact dependency floor had dimension 298.  The 2,816-row integer
projection instead had rank 2,615 modulo each of 65,521, 65,519, and 65,497,
revealing 42 additional modular directions.  A primitive scalar scan isolated
42 sparse two-column relations.  Direct Gamma replay gave coefficientwise
residual zero for every relation, and the combined exact kernel basis has rank
340 at all three primes.  Consequently

\[
\operatorname{rank}_{\mathbb Q}M\le2955-340=2615.
\]

The nonzero modular minor supplies the reverse inequality, so

\[
\operatorname{rank}_{\mathbb Q}M=2615,
\qquad
\dim_{\mathbb Q}\ker M=340.
\]

Every exact kernel direction preserves all three obstruction diagonals.  A
compact equivalent component-5 functional on the stored numerator image is

\[
F_0=x_{692}-2x_{693}-x_{695}+2x_{697}.
\]

It descends through the exact quotient and is nonnegative on every square in
the 372-row span, while its unscaled target value is \(-10\lambda\).  Hence the
negative diagonals already prove the MP no-go; no semidefinite solve is needed.
Reynolds averaging extends the result to arbitrary Grams on the same stable
row dictionary.  Local archive:
`work/uniqueness-20260810/cross-gram-repair/MP-PAIR-FULL2955-EXACT-NO-GO.md`.

The next mover-seeking gate appends the source-closed W3 rows `X24+Y12`.
Its 408-row action and 606 touching coordinates supplied the exact gate closed
in the next section.

## 9. Exact closure of the conditional `W3-X24+Y12` gate

The W3 extension has 408 rows and 3,561 active invariant Gram coordinates.
Its restart-safe export added five moment streams for the 606 touching
coordinates and one fresh 768-row salted stream over all 3,561 coordinates.
An independent integrity audit checked every output hash and byte count, all
606 reports, all 3,561 salted column digests, the corrected launch gate, and
all 27 projector inputs before rank computation.

The initial exact dependency floor had dimension 391.  The 3,584-row integer
projection instead had rank 3,169 modulo each of 65,521, 65,519, and 65,497,
leaving one additional modular direction.  A primitive scan isolated

\[
4c_{3237}-c_{3541}=0.
\]

Here column 3,237 is the orbit-12 `current372-Y` coordinate represented by
rows \((30,396)\), while column 3,541 is the orbit-24 `X-Y` coordinate
represented by \((372,396)\).  Direct Gamma replay proved the coefficientwise
identity

\[
48\,\operatorname{sym}(30,396)
-24\,\operatorname{sym}(372,396)=0
\]

both at a representative and over the full invariant orbit.  Adjoining it to
the source floor gives 392 exact directions, independent at all three primes,
and therefore

\[
3169=\operatorname{rank}_{\mathbb F_p}S
\le \operatorname{rank}_{\mathbb Q}S
\le \operatorname{rank}_{\mathbb Q}M
\le3561-392=3169.
\]

Thus the exact moment rank is 3,169 and the exact kernel dimension is 392.
Every kernel direction preserves the inherited component-5, -8, and -9
obstruction diagonals.  Equivalently, the normalized separator

\[
F_0=x_{692}-2x_{693}-x_{695}+2x_{697}
\]

descends through the quotient.  The scaled functional
\(\ell=1024F_0=(1024,-2048,-1024,2048)\) is nonnegative on squares in the
same row span and evaluates the target as \(-10\lambda\).
The negative diagonals rule out an invariant PSD Gram for every
\(\lambda>0\), and exact Reynolds averaging extends this to arbitrary Grams on
the same H-stable 408-row dictionary.  Local archive:
`work/uniqueness-20260810/cross-gram-repair/W3-XY408-FULL3561-EXACT-NO-GO.md`.

This closes only the selected staged X/Y gate.  It is not complete W3 and does
not address a larger Gamma row dictionary or the ambient 35-label walk.

## 10. Certified restricted MQ cross-interface

The restricted interface appends exactly the ordered cross families
`X-MQ24` and `Y-MQ12` to the frozen 3,561 W3 coordinates.  The six exported
integer streams have 3,584 total rows, and the inherited 392 exact directions
are extended by 36 literal zeros.  Hence

\[
\operatorname{rank}_{\mathbb Q}M_{\mathrm{restricted}}
\le 3597-392=3205.
\]

The primary projector found rank 3,205 modulo each of 65,521, 65,519, and
65,497.  Independently, a deterministic row selection produced a
\(3{,}205\times3{,}205\) minor of full rank modulo 65,521 without reusing the
primary echelon or pivot state.  This supplies the reverse inequality and
therefore

\[
\operatorname{rank}_{\mathbb Q}M_{\mathrm{restricted}}=3205,
\qquad
\dim\ker M_{\mathrm{restricted}}=392.
\]

The increment from the 408-row stage is exactly \(3205-3169=36\).  The exact
stack replay, the component-5, -8, and -9 target residuals, the descended
separator residual, and every restricted mover projection are zero.  Thus no
additional mover exists on this selected old-plus-cross36 quotient.

This is a cross-interface rank result, not another entry in the no-go table.
The full 432-row MQ interface also has 372 current-W2--MQ and 20 MQ--MQ
coordinates that were not exported.  Those 392 omitted coordinates are
precisely why the result is **not** full MQ432, **not** a 432-row PSD/no-go,
and **not** complete W2, complete W3, an ambient-walk result, a gap or
property-\((T)\) certificate, or a nonsoficity result.

The immutable raw rank guide has SHA-256
`1af4d16a4cb75819aa87f74c2b98d19b510521d2f1b3f03cf8664ad90eb7f1a9`.
Its payload is Python-canonical only, with digest
`50ddee79d318facde98408466da595b2729487a0a35b0acbccff6bd290c4cd77`:
28 recorded nanosecond mtimes exceed JavaScript's safe-integer range, so plain
Node canonicalization gives
`a9c0a0def8631e971047205852e8f010a78e8222c5f6032e48fe0af00b238350`.
The normalized final independent audit has SHA-256
`11ad46e1c11a6069536905a0a11b271e37d571583a9fdfe4a4fcfaddbb29ecde`;
it stores the unsafe values as decimal strings, is cross-language safe, and
is the theorem-facing record.  Python and Node both replay its payload as
`72eca33b463bf195e3015d543adc4429e001ece81f70cce05b13aaa69d70a224`.

## 11. Literature and novelty boundary

The local-archive primary-source audit
`work/uniqueness-20260810/v4-notch-prior-art/PRIMARY-SOURCE-AUDIT-2026-08-13.md`
supports the following conservative description.

- Ball-filtered group-algebra SOS searches and minimum-radius questions are
  established.  This project does not claim to introduce them.
- The exact character-coset criterion and its minimum-radius formula are
  proved here.  A bounded search did not locate this exact formulation for
  finite-subgroup character projections, but that does not establish
  priority; it is presented as an elementary synthesis.
- The separator is a direct Cauchy--Schwarz consequence.  For the
  rational-valued V4 characters, the contribution here is its explicit
  rational functional and its use in the frozen Gamma fixture, not a new
  uncertainty principle.
- The copies \(S_n<V\), their sign characters, and the tree/prefix model are
  established ingredients.  Their use as an unbounded-radius calibration is
  an elementary application.
- The count 54,090 is an exact finite enumeration tied to this Gamma fixture,
  not a general classification theorem.

## 12. Precise nonclaims

As of this snapshot, the work does **not** provide:

- a positive \(\lambda\) with an SOS certificate for \(D^2-\lambda D\);
- a complete-W3 no-go theorem;
- a complete degree-two or complete W2 Boolean-refinement no-go theorem;
- a full-MQ432 rank theorem or a 432-row PSD/no-go theorem;
- a conclusion for the ambient 35-label walk;
- a numerical finite \((F,\varepsilon)\) nonsofic obstruction;
- a claim that all 54,090 V4 rays are linearly independent;
- a promotion of the label-Gram coercivity identity to an equality in the
  full group algebra; or
- a literature-priority claim for character support propagation, minimum
  SOS radius, or the Cauchy--Schwarz separator.

## 13. Frozen evidence hashes

All hashes below are SHA-256 and were verified against the referenced files.

| evidence | SHA-256 |
|---|---|
| primary-source audit | `37908146246dfe7102acdc8bb4469510cc2586c951cad80810ec55081f399590` |
| finite-subgroup character lemma note | `1394f412e800e80fa95c34a8eec58d458d8243f184feaf110c83ac58044a4229` |
| unbounded character-family note | `dbb7392d37d4938e5c7e15c4ed8b378b08e3228ebaf7bdffbb6fa4b7dfa97ca8` |
| independent unbounded-family audit | `19d969162da18290e3bbda75b2f6c09984affa67f967d0274b8b5efc5871cdba` |
| V4 family note | `16c789c1a396e80ca23fc069289740ea5906986dd8302c29abf4cede1706eeda` |
| V4 family JSON | `568e9338a289942b31c86fb17d75c3308f92fd1a270c874eb17ece6b1cc7fcf9` |
| four-packet Laplacian refinement | `ae87dcb27e4f04019ae3c2590536bb32badf2a0252f3e0048b3cb7049f5e7f01` |
| exact energy-lift replay note | `b3cb6cf29de9d2c5613020ac5648b9ba80fb2272fbdc9354653ca0a469617b76` |
| exact energy-lift JSON | `1258dda28bb247b43f4d325008c152dad5302d29f40e4a6ee1d857517f2b8cfd` |
| independent energy-lift audit | `4a0b6702de63855771a9d7ca91cca4a834c0e3c753455ad29bfa25a968041977` |
| strict energy-lift boundary audit | `28a01ed822250bf6d3192a7baf78511f96ce2ce68c8670a88bcfc14f1c681e72` |
| 198-row exact closure | `b34ce53c9e90de9ebd689175e42e1a36fcc156300623e6f92b1fa1a2d0824389` |
| 204-row no-go | `c2456863cf93ee5204ce4c217bebd1b0fe39461494ff9df45809f0865da076ef` |
| 228-row no-go | `08c34db4e33ba91e446cbc54799a234d703da6a6c28e7779522f5e42459892e0` |
| 252-row no-go | `5ad579ca3625385f57dd0b332c182889b14a3082ed19d503d68df73d19cdf2b1` |
| 300-row no-go note | `6b65bdb8f8cf115552ec5c6171435911253b60202cc434adcda99f8b8b89dbb8` |
| 300-row machine theorem | `9f4839d8919a84ba5a2641e1ccd8059366205a351b60b6fdc58b3fe8c951870e` |
| independent 300-row audit | `9ad60fde092cbe705c8f84ddc812e197fbfdbf513ef9b759caa02fe0c330d2f4` |
| final binding correction | `ac657762784823513aa2186e45e1312fd14ed7fd39535b50c883a4d3ba8a85d9` |
| primary extra-ten exact replay | `e48d7a4a8e6f0b9c5d93503e594420030398eb38f2d64b4b87b791826f5ee8f8` |
| independent A2 extra-ten replay | `3a942d6927fdf8a9b09dc005d6c6ed50e2ea58da14c0e1c79c9b9dcd6e406227` |
| independent curvature extra-ten replay | `bf1828cd88665acf0cdcc672b88657e5b805c3479afe4110f0bbfa85e21c380f` |
| exact 177-dimensional kernel | `049e1f0b5ff7ba99b61c52c80504068d7cbef6967530fac26852c4a1ecd7be24` |
| SQ action | `0d7c2f60a8d1d7c35310f1a14e81586d82974a034c56e8c3bd4e09ab0d82be81` |
| SQ block maps JSON | `5379b23c085df96b6f1d7f7f69d54f10f32c1e9b0601781269211708ee301828` |
| corrected SQ kernel floor 214 | `600719452ac695604e2d3f4211d726c8a1c982de4970fd2e94fbbeb6cd7f74ae` |
| SQ dormant interface note | `e5dae140a31a77e4f5ab70eaefe2603466d76e92a76832e123fb4575b535f3cc` |
| SQ local PSD theorem | `27db18160ac52cfcf75ebaafca47bb2b333f0cfde098f30e5e45ad0f033c74d0` |
| SQ final export metadata | `57c1fbd36a9764a2b58088ff902e1e4e00bb891576fbe58c4132884cf46a2815` |
| SQ export integrity audit | `8444f1eb7e7c97d357c41220321dff2464b5d468554a191257f64947c6b763b1` |
| SQ projected rank gate | `4fa839be407cecafe3cb2e3991313a84ddf7749a21e2ca816963e56da32cd695` |
| SQ primitive missing13 mining | `fd889030a2c4d46f1316c35ed98f3685fd883014046f35965316d7a445566aeb` |
| SQ independent A2 missing13 exact replay | `c072f7cac38c13de5aaf3e7caeb31e3ec603fd67d03e45c5c7d5d826e1c10bfc` |
| exact SQ 227-dimensional kernel | `dde7821a097dc79330738ab3ed58def0740c0c0de8fc89e3b53e23126fd8e4b6` |
| independent local missing13 exact replay | `4702393e932edcc4b2ca70e5e3fdd9db57dfcc57ee5f1d996ac1a764bf8ee7fc` |
| 324-row SQ no-go note | `440ae72146d152f7365233f4c87f2fe3d4326648c501496dce61a81bd6c5fa2a` |
| 324-row SQ machine theorem | `f7902330a455d242f1f14655a404b1618d65cc9221bfeec24f637b588a1a519b` |
| independent 324-row theorem audit | `79abe0d2f064bf8db41883962d3df379a752bd9ac82ccaf06b4cdf57679b7cc4` |
| corrected MP298 source floor | `9d44365fdc294880c54e991bdf203064d3e7f2228570f3b0baf826aadc89a5dd` |
| MP372 dormant interface | `9b7ec3ddbe49d0434e775ca395fe43c2b2760ab8693028b1670bc86bf37e36a9` |
| MP post-fix exporter compiler | `c04131a454b83cdfebb1ca48c3830d2248de8d52a8278b2854b90510b72eb6d2` |
| MP checkpoint/compiler contract audit | `c553f1cd86c0baf9d138c3b719d06d0b4cb3e45fc6b00a9d4824a2985808a671` |
| MP final export metadata | `6c4d19ccb91ecf4f8f520b590597a40b98b33448199909db4a5666ea0a3fbc82` |
| MP five-stream export integrity audit | `1eea461dfff68d1951ab024d46ef37d8dbe679a53082fb7bd45eff314b9fb989` |
| second independent MP export audit | `fbe19d71859e95c9c282e89f03b6bb81a985d5dbda11857122daf1540e933b4b` |
| MP projected rank gate | `c898c183701b9e62d3ea74af47f28f5c6f404cec8b2ca4f175aa2e2fa72f1312` |
| MP primitive missing42 mining | `4d1771f680c7d9b6d58729cdbe7e018e1635d4104210047da7e480cff20333ad` |
| independent MP missing42 exact replay | `26ff1204392884c59ca3f33410c1e2f7ed159acce3123645e0957be3c0a1c451` |
| exact MP 340-dimensional kernel | `b737e42141c269bf03eb3ad50613c70f8d005811532fea08710f98077ee44014` |
| independent MP K340 witness audit | `a6e491df51506440f29a8da51bf382e5403b2c6f48acf9285bf6e8f6f55bd51f` |
| MP exact rank closure | `54ffc6a74f6a6f827f3097cdd835eb03abe0abcc1ca804b7edf643905caa17ca` |
| MP truncated transpose descent | `e057eeb3ab375d42154312119480ddcb13644321bfd27b9be53164208cf7b43d` |
| 372-row MP no-go note | `877d4520da5023ac878b8a91018d45a3b0ff66d6c10b0892cce8cd6d8040cf1c` |
| 372-row MP machine theorem | `00ecb20552c965d60eebb3ffe9081443b5234a5c158e22ae83dce7c956527f58` |
| first independent MP theorem audit | `3d4f7687e6e608bdcd8edb09c9f5699ba9dde5d8184fdf026f4de38184d1f6c6` |
| second independent MP theorem audit | `810245455fa734fa6243b6efefa36c6bcf3ec2028617d893cc08cf53ef209689` |
| MP theorem-note notation patch audit | `7de6dd9474f15e47c991a43a19be299d81a37477f136e44748073bb4d3126224` |
| conditional W3 X/Y structural gate | `fc3d784388e524bf402fb9a6435850335e5320fcbe3abfd6ec88f08ff206a646` |
| conditional W3 X/Y map audit | `7568ce8475223d73519e3c3d36a5a387d5e9f20ad39e6f9d5d347ce306da2106` |
| corrected W3 exact kernel floor 391 | `13330aca4324bdb42d96cbde26e2b0f90ed8113cd1e6f04ef0f76cc28db4a5c3` |
| W3 final exporter | `e5a24e960e4c1e766f29de1cfdf671482b297f9b52dc01ac9b695715114bd829` |
| corrected W3 launch-gate audit | `d79ade98eb49e1beee0a8f31fac515beda63487e2b863c5d5b157b704f956028` |
| W3 final six-stream metadata | `698b4361ae8d152fc83e524bdd86e98b31414bfa4187e93a4f3e524ed317ca64` |
| W3 six-stream export integrity audit | `0a682ee5a4de974b0775990bbfffcb5c6c6fac6eef2242ac37f37b5d0b2dfce5` |
| W3 projected rank gate | `6678a4253b93a631062bf4ce1c4146b48f590b6e888396f5f3b18f2eb9721bc6` |
| W3 single-relation exact Gamma replay | `1f376fda30bd26e4752d0aac4c819bf58355801d784a76685de05fa4c06edd3a` |
| exact W3 392-dimensional kernel | `25748e0791a423c704226c912f2d72dc05ea8ae8952c252c12c8db7d8b921c04` |
| independent W3 rank/exact-kernel audit | `d0d142cf2eedc1f6a46b08c690ded041b8f4c1a73b11a0f0f370d477d380b2c9` |
| W3 truncated transpose descent | `f328a2ba016094c36c63fb5d9f72f7033986e9c820984165942d67d55b2f84ac` |
| 408-row W3 machine theorem | `290346f37f30df0f8da8dcf4492d1598534ff59462c3f34a1d83ce48065b0e7c` |
| 408-row W3 no-go note | `26ea1addbb68fac47443362f68bcbb5466cc116d9dac41a75789048edea7ed2e` |
| independent W3 transpose/theorem audit | `b3f205b0ed69af96e68192391bc36e2720cd22fc2435eb3e8362d7db4c8b00a7` |
| restricted MQ exporter-preflight audit | `b4cdf88b40a101ef42d32f47715d999848ff9acaf23ee25b426da1938ad150e8` |
| restricted MQ cross36 export metadata | `e77220b4e78459ae445278b4b9a7ef62a9d4057a56d7c84a1f4fbb9324823fca` |
| restricted MQ export-integrity audit | `d1b2e9a9ca909593bcb382052c636bf6237157bd2e2d90bbd4eb03df0f58bff1` |
| restricted MQ raw rank guide | `1af4d16a4cb75819aa87f74c2b98d19b510521d2f1b3f03cf8664ad90eb7f1a9` |
| restricted MQ final independent rank audit | `11ad46e1c11a6069536905a0a11b271e37d571583a9fdfe4a4fcfaddbb29ecde` |
