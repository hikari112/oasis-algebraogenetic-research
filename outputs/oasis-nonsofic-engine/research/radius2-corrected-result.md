# Corrected radius-two SOS result

## Outcome

The complete symmetry-reduced radius-two program has now been constructed and solved numerically. It did **not** produce a trustworthy positive identity

\[
\Delta^2-\lambda\Delta=\sum_i \xi_i^*\xi_i,\qquad \lambda>0.
\]

The corrected evidence points strongly to optimum zero, but an exact rational dual for the full radius-two cone has not yet been obtained. Radius two is therefore **numerically negative, theorem open**.

## Exact finite problem

The basis consists of all 678 nonidentity elements in the exact radius-two ball of the 30-generator group `Gamma`, represented by `g-1`. Two independent exact representations agree on all 679 radius-two equality classes, including the identity.

The product expansion contains:

- 249,376 distinct exact group elements at radius at most four;
- 459,684 ordered basis products;
- 10,487 coefficient-support orbits under the corrected 24-element automorphism group;
- 9,865 invariant symmetric Gram variables, down from 230,181; and
- 53,609 nonzero entries in the exact integer coefficient map.

The PSD condition decomposes into twelve blocks of sizes

```text
35, 30, 26, 27, 25, 30, 27, 26, 60, 60, 53, 53.
```

The known `lambda=0` Gram square for `Delta^2` has zero exact coefficient residual. Its block eigenvalues range from numerical roundoff `-1.44e-15` to `30`, and a random invariant full matrix and its twelve blocks reproduce the same spectrum to `3.27e-13`.

## The symmetry correction

The first reduction treated matrix dagger `T` as if it acted on Gram coordinates by an ordinary basis permutation. That is invalid because `T` is an anti-automorphism:

\[
T(ab)=T(b)T(a).
\]

Raw dagger sends a square `xi* xi` to `T(xi) T(xi)*`, not to the square obtained from the naively permuted basis coefficients. The positivity-preserving group action is instead

\[
\phi(g)=T(g)^{-1}=T(g^{-1}),
\]

which is a genuine automorphism. After this repair:

- radius-one support orbits changed from 42 to 36;
- radius-two basis orbits changed from 41 to 35;
- invariant Gram variables changed from 9,962 to 9,865;
- the largest block changed from 65 to 60; and
- radius-four support orbits changed from 10,632 to 10,487.

Most importantly, the directly reconstructed moment form is now invariant under all 24 actions with maximum spread exactly zero. Under the rejected convention the spread was approximately `0.2317656`.

The earlier rational certificate and fraction-free determinant report are retained only as an audit trail. They exactly verified the smaller, incorrectly reduced cone and are explicitly marked superseded.

## Corrected numerical solve

The coarse corrected primal solve returned:

```text
lambda candidate                 6.3939754e-7
maximum coefficient residual     8.7838538e-6
minimum PSD-block eigenvalue     -4.0702564e-6
iterations                       16,250
solve time                       126.1 seconds
```

The candidate gap is smaller than both its equation error and PSD violation, so it is not a certificate.

A facially reduced dual search normalized `L(Delta)=1` and imposed the exact `Delta` kernel. It returned only a `1.35e-8` complement-margin candidate while retaining block violations as large as `1.42e-6`. Thus the valid dual face has additional null directions beyond `Delta`; the one-kernel exactification strategy is insufficient.

A tighter `1e-8` primal run reached the ten-minute bound without convergence. No inference is drawn from the unfinished decimal.

## Claim boundary

Established exactly:

- the 678-element basis and 249,376-element coefficient support;
- the corrected positivity-preserving 24-element automorphism action;
- the 10,487 support orbits and 9,865 Gram-coordinate orbits;
- the twelve-block representation decomposition;
- the exact integer coefficient map; and
- feasibility at `lambda=0`.

Established numerically:

- no stable positive radius-two gap was found;
- the apparent positive value collapses below its own residuals; and
- the dual feasible set lies on a deeper singular face.

Not established:

- an exact theorem excluding every positive `lambda` in the full radius-two cone; or
- a positive radius-two SOS certificate.

## Next theorem target

The correct next step is iterative facial reduction:

1. solve several normalized dual objectives on the corrected cone;
2. intersect their numerical kernels to separate forced from solver-selected null directions;
3. recover those forced directions as exact rational vectors in the radius-two module;
4. quotient the moment problem by the exact kernel lattice;
5. search for a strictly positive dual on the remaining face; and
6. rationalize and verify that final dual with exact character projectors and fraction-free minors.

This target is more informative than immediately increasing the word radius. It asks the current radius-two cone to reveal its exact compositional relations before radius three adds another order of magnitude of support.
