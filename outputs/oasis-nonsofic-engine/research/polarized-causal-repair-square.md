# Polarized causal repair square: exact finite experiment

## Result

The executable
[`polarized-causal-repair-square.mjs`](polarized-causal-repair-square.mjs)
implements the finite experiment proposed in
[`polarized-resolution-wake-audit.md`](polarized-resolution-wake-audit.md).
It passes with exact rational arithmetic and no numerical tolerance.

Certificate digest:

```text
b386f20ac11e61812a308d53b72a60ec62b4e69091350c2b5f23412ea11eaa9c
```

Tamper audit: **28/28 mutations rejected**.

Run it with:

```powershell
node research/polarized-causal-repair-square.mjs
```

## Finite theorem

Let \(T\) and \(S\) be two repair orders transported to the same polarized
endpoint, let

\[
M=\frac{T+S}{2},
\qquad
\kappa=T-S,
\]

and let \(P\) be the positive-definite polarization matrix. The executable
verifies the exact matrix identities

\[
\frac{T^{\mathsf T}PT+S^{\mathsf T}PS}{2}
=
M^{\mathsf T}PM+\frac14\kappa^{\mathsf T}P\kappa,
\]

\[
T^{\mathsf T}PT-S^{\mathsf T}PS
=
M^{\mathsf T}P\kappa+
\kappa^{\mathsf T}PM.
\]

Each atomic repair also carries independently serialized dissipation and flux
forms satisfying

\[
R^{\mathsf T}PR-P=-D_R+F_R.
\]

After composing along both routes, the program verifies

\[
\Delta F-\Delta D
=
T^{\mathsf T}PT-S^{\mathsf T}PS.
\]

Every declared dissipation form and both composed path-dissipation forms are
positive semidefinite by exact principal-minor tests.

A cellular interchange filler is not inferred from the matrix equation
(T=S). It is attached only when the fixture supplies an explicit witness

\[
\theta=(\text{id},\,U=I,\,\partial\theta),
\]

whose endpoint gauge is the identity and whose oriented boundary is

\[
q+(r|q)-(q|r)-r.
\]

The verifier checks this record and verifies that its gauged routes agree.
Thus a witness implies compatible commuting routes in this finite model, but
commuting routes do not manufacture a witness.

## Fixtures

| Fixture | Repairs | Filler | \(\operatorname{rank}\kappa\) | \(H_1(-;\mathbb F_2)\) | Polarized behavior |
|---|---|---:|---:|---:|---|
| A | commuting coordinate projections | yes | 0 | 0 | equal path action |
| B | noncommuting projections | no | 2 | 1 | nonzero, order-dependent dissipation |
| C | noncommuting orthogonal maps | no | 2 | 1 | zero edge/path dissipation |
| D | the same commuting maps as A | no | 0 | 1 | equal maps without a coherence cell |

For the sample vector \(x=(1,0)^{\mathsf T}\), Fixture B gives

\[
\|Tx\|^2=\frac12,
\qquad
\|Sx\|^2=\frac14,
\qquad
\|\kappa x\|^2=\frac14.
\]

Fixture C has nonzero \(\kappa\), but both route actions equal \(1\), with
zero edge and path dissipation.

The cellular boundary matrices are reconstructed from the serialized cells.
In every fixture, \(\operatorname{rank}\partial_1=3\). Fixture A's serialized
and validated witness attaches one 2-cell with
\(\operatorname{rank}\partial_2=1\) and kills the square class. Fixture D uses
the identical commuting repair maps but has no witness; it remains unfilled
with one-dimensional \(H_1\). This is the control showing that commutation
checks witness compatibility but does not create a filler. Fixtures B and C
retain identical unfilled cellular complexes,
\(\operatorname{rank}\partial_2=0\), and one-dimensional \(H_1\). Thus their
different dissipation behavior is not determined by the unpolarized square
complex alone.

## Controls passed

- exact rational replay with a deterministic SHA-256 certificate;
- reconstruction of both cellular boundary maps and
  \(\partial_1\partial_2=0\);
- serialization and validation of Fixture A's witness identifier, identity
  endpoint gauge, and oriented boundary;
- the matched A/D control: identical commuting maps, but a 2-cell only in the
  witness-bearing fixture;
- exact parallelogram, signed endpoint, edge-balance, and path-balance laws;
- positive-semidefinite dissipation checks;
- covariance under conjugation by the rational orthogonal matrix
  \(\bigl(\begin{smallmatrix}3/5&-4/5\\4/5&3/5\end{smallmatrix}\bigr)\);
- route-swap covariance: \(\kappa\mapsto-\kappa\), midpoint and curvature
  action fixed, signed balance negated;
- semantic deduplication of an aliased repair presentation;
- rejection of the unregistered orthogonal gauge \(-I\), even though it would
  trivialize Fixture C's endpoint comparison; and
- rejection of all 28 certificate mutations, including witness mutations,
  resealed mutations, and attempted theorem-boundary overclaims.

## Interpretation

The experiment separates four finite notions:

1. whether the two repair maps commute;
2. whether a semantic interchange witness is actually present;
3. whether that witness fills the causal square; and
4. whether order dependence carries dissipative cost.

The useful residue of the dream artifact is therefore a **polarized comparison
square**, not a universal phantom-exclusion principle. The next legitimate
question is whether a native semantic repair system generates
\(P,D_R,F_R\) canonically rather than receiving them as fixture data.

## Claim boundary

- This is an elementary finite-dimensional linear-algebra theorem.
- It proves no compactness or infinite-assembly statement.
- It does not lower a high-degree primitive nerve into ordinary transport.
- It supplies no realization in Navier--Stokes, Hodge theory, Collatz, or the
  zeta problem.
- It proves no non-soficity statement.
- It makes no novelty or prior-art claim.
