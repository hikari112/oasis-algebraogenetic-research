# Genesis phase/gauge rounding probe

## Status

This note records one exact finite obstruction fixture. It does **not** prove or
disprove the full localized Fox--Hodge rounding conjecture. It isolates a type
error that any future statement must avoid:

\[
\boxed{
\text{support/permutation rounding}
\quad\neq\quad
\text{phase or cocycle descent}.
}
\]

The companion executable is
[genesis-phase-gauge-rounding-probe.mjs](./genesis-phase-gauge-rounding-probe.mjs).

## 1. Frozen object and observables

Use the presentation

\[
C_2=\langle s\mid s^2=1\rangle
\]

on \(\mathbf C^2\), with diagonal MASA

\[
\mathcal D=\{\operatorname{diag}(a,b):a,b\in\mathbf C\}.
\]

The fixture freezes four observation maps before comparing representations:

1. the support permutation of a monomial unitary;
2. phase-insensitive atom transport, represented by \((|U_{ij}|^2)\);
3. the raw generator matrix \(U=\rho(s)\);
4. the evaluated left Fox derivative
   \[
   \rho\!\left(\frac{\partial s^2}{\partial s}\right)=I+U.
   \]

This ordering matters. If the conclusion is quotiented by phases after seeing
the example, the theorem has changed its observable contract.

## 2. Three exact representations

The collision pair and permutation control are

\[
U_+=\begin{pmatrix}1&0\\0&1\end{pmatrix},\qquad
U_-=\begin{pmatrix}-1&0\\0&-1\end{pmatrix},\qquad
P=\begin{pmatrix}0&1\\1&0\end{pmatrix}.
\]

All three satisfy, over the integers,

\[
UU^*=I,\qquad U^2=I.
\]

They are therefore exact unitary representations of the displayed
presentation. Each exactly normalizes \(\mathcal D\). The first two fix both
minimal diagonal projections; the swap exchanges them.

The frozen data are:

| image of \(s\) | support permutation | \((|U_{ij}|^2)\) | \(I+U\) | Fox rank | Fox trace | \(\|I+U\|_F^2\) |
|---|---|---|---|---:|---:|---:|
| \(+I\) | identity | \(I\) | \(2I\) | 2 | 4 | 8 |
| \(-I\) | identity | \(I\) | \(0\) | 0 | 0 | 0 |
| swap \(P\) | transposition | \(P\) | \(I+P\) | 1 | 2 | 4 |

Thus \(+I\) and \(-I\) collide under both frozen support observables, while
their raw matrices and evaluated Fox derivatives differ. Their squared raw
Frobenius distance is

\[
\|U_+-U_-\|_F^2=8.
\]

The swap is a nonconstant-observer control: the support detector does see a
genuine permutation change.

The executable also verifies the evaluated Fox fundamental identity exactly:

\[
(I+U)(U-I)=U^2-I=0
\]

for all three cases. The separation is therefore not caused by relator error.

## 3. Why diagonal conjugation does not remove the phase

For every diagonal unitary \(D=\operatorname{diag}(z_1,z_2)\),

\[
D(-I)D^*=-(DD^*)=-I.
\]

Hence diagonal conjugation cannot send \(-I\) to \(+I\). This is not a
numerical sample: it follows from the central scalar identity. The executable
also enumerates all four signed diagonal gauges as a mechanical subcheck.

There is nevertheless a different relation:

\[
U_-(s)=\chi(s)U_+(s),\qquad \chi(s)=-1,
\]

where \(\chi:C_2\to\{\pm1\}\) is the sign character. This is a character, or
phase-cocycle, twist--not diagonal conjugation. A theorem that intentionally
quotients by such twists may identify the pair, but it must say so before its
energy and observables are defined.

## 4. Exact finite conclusion

The fixture proves only the following finite statement.

> Exact unitary relator satisfaction and exact diagonal-MASA normalization do
> not make support permutation or phase-insensitive atom transport sufficient
> to recover the raw generator or evaluated Fox-derivative data. Moreover, the
> missing scalar phase cannot be removed by diagonal conjugation.

Consequently, a rounding theorem must separate at least two obligations:

1. **support/monomial rounding:** recover the permutation or a monomial
   normalizer;
2. **phase/cocycle descent:** control, trivialize, retain, or explicitly quotient
   the phase data needed by the frozen downstream observable.

The observable must be frozen first. Raw matrix energy, support-valued energy,
and phase-quotiented energy are different claims.

## 5. What this does not establish

The probe does not show that:

- support-permutation rounding is impossible;
- monomial-valued rounding is impossible--all three examples are already
  monomial;
- rounding modulo a predeclared scalar/character gauge is impossible;
- every formulation of the localized Fox--Hodge conjecture is false;
- any finite or ambient group is non-sofic;
- a universal rounding theorem, Hodge consequence, or AI architecture follows.

It instead identifies a missing hypothesis or a required quotient in any claim
that tries to transfer support control into raw or Fox-sensitive energy.

## 6. Executable audit contract

The script is standalone and deterministic. Its certificate contains:

- the frozen presentation, MASA, gauge action, Fox convention, and observables;
- exact integer matrix audits for unitarity, the relator, atom transport, and
  the Fox fundamental identity;
- the support collision and swap control;
- the central-scalar diagonal-gauge obstruction;
- explicit theorem boundaries;
- a canonical SHA-256 certificate digest.

Replay reconstructs the reference object and requires both its complete
canonical equality and a valid digest. The tamper suite mutates mathematical
data, audit flags, gauge conclusions, theorem boundaries, the digest, and the
schema surface. Most attacks recompute the digest; replay must still reject
them because the altered object is not the frozen certificate.

Run directly:

```powershell
node outputs/oasis-nonsofic-engine/research/genesis-phase-gauge-rounding-probe.mjs
```

The JSON result reports direct proof status, replay status, tamper totals, and
the certificate digest. Syntax, direct execution, replay, independent-process
determinism, tamper rejection, and whitespace/diff checks are required before
publication.

## 7. Verified run (2026-08-10)

- syntax check: PASS;
- direct execution: PASS;
- genuine certificate replay: PASS;
- two independent Node processes: byte-identical stdout;
- tamper audit: 16/16 rejected, including 15 mutations whose attacker-facing
  digest was recomputed after mutation;
- external Fox-rank mutation: rejected;
- workspace and no-index whitespace/diff checks: PASS;
- certificate SHA-256:
  `d1e96519ae9527a771cfd8a6825e91611f0ca716f10225f9f49d2e82c454c5de`;
- executable SHA-256:
  `2330e892b05929a5e692b53be2f09472ca5b608a6a28fa32dda6796631de91a3`;
- raw Node stdout SHA-256:
  `d38fd1d595fea8daf8fb2657b1393758c2264bb035e7e2aaedf5da994d2272f3`.
