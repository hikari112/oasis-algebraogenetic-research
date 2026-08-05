# Exact radius-one SOS obstruction

## Theorem

Let `g_1,...,g_30` be the implemented elementary involutions generating `Gamma = EL_3(L_F2(1,2))`. Put `z_i=g_i-1` and

```text
Delta = 30*1 - sum_i g_i = -sum_i z_i.
```

There is no identity

```text
Delta^2 - lambda*Delta = sum_k xi_k^* xi_k
```

with `lambda>0` and every `xi_k` in the linear span of `{z_1,...,z_30}`.

## Exact separating functional

On the exact radius-one product support define the rational functional `L` by

```text
L(1)       = 0
L(g_i)     = -29/60
L(h)       = -1       for every other exact product hash in the support.
```

The exact group-algebra verifier checks every support collision before applying these values. For `M_ij=L(z_i^*z_j)`, exact arithmetic gives

```text
M_ii = 29/30
M_ij = -1/30, i != j.
```

Therefore `M = I_30 - (1/30) 1 1^T`. For every real coefficient vector `c`,

```text
c^T M c = (1/30) sum_{i<j} (c_i-c_j)^2 >= 0.
```

Thus `L(xi^*xi)>=0` for every `xi` in the radius-one generator-difference span. The matrix has rank 29 and nullspace spanned by the all-ones vector.

Meanwhile, exact coefficient pairing gives

```text
L(Delta)   = 29/2
L(Delta^2) = 0.
```

Consequently, for every `lambda>0`,

```text
L(Delta^2-lambda*Delta) = -(29/2)*lambda < 0,
```

which cannot equal the nonnegative value of a sum of radius-one squares. This proves the theorem.

## How it was found

The floating-point SCS dual had numerical rank 29 and was nearly proportional to the regular-simplex projector. Exact `S3 x C2 x C2` orbit reduction converted 679 support values into 42 variables. The rational linear system had rank 41 and one gauge degree of freedom. Setting that free coordinate to zero produced the three-value functional above.

The original eight rounded SCS value classes were therefore not eight fundamental algebraic constants. They respected the exact 42-orbit symmetry, but reflected a numerical choice inside the dual gauge. The exact proof is substantially simpler than the numerical candidate.

## Claim boundary

This rules out positive gap certificates only in the 30-dimensional span of the radius-one generator-minus-identity basis. It does not rule out a radius-two certificate, another polynomial basis, or another effective proof of the Kun locality modulus.

The radius-two basis has 678 nonidentity elements. The corrected positivity-preserving automorphism symmetry reduces its 230,181 symmetric Gram variables to 9,865 invariant variables and twelve PSD multiplicity blocks, the largest of size 60.

## Executable evidence

- `src/sos-dual-verifier.mjs` constructs and verifies the three-value rational functional independently.
- `research/exact-radius1-dual-certificate.json` contains the orbit-derived exact certificate.
- `research/sos-symmetry-report.json` contains the exact 24-element action, orbit results, and radius-two character decomposition.
- `src/test.mjs` verifies the complete moment matrix, both Delta pairings, rank, and exclusion of every positive lambda.
