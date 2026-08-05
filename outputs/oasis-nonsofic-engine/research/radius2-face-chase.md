# Radius-two face chase: what the next experiment actually learned

## Result

The corrected radius-two cone still has no exact positive or negative certificate. Three new attempts were completed, and two stronger formulations reached the ten-minute limit without a verdict. The theorem remains open at radius two.

That outcome is useful because it localizes the remaining difficulty: the obstacle is not merely finding one more numerical dual point. It is recovering a **sparse exact presentation of the forced kernel face**.

## Multi-objective sampling

Eight bounded random dual objectives were solved after imposing the exact `Delta` kernel. Every run returned `optimal_inaccurate` after roughly 50--55 seconds. Across the samples:

```text
delta normalization                 0.999997 to 0.999998
delta-squared value                 8.5e-5 to 1.59e-4
maximum moment residual             1.4e-6 to 2.1e-6
minimum block eigenvalue           -0.00285 to -0.00373
PSD correction Frobenius distance   0.011 to 0.014
```

These are not feasible duals and cannot support a theorem. PSD-clipping their average made most blocks look interior, but clipping can manufacture an interior point and therefore cannot identify a common face.

## Seed-face spectrum

The more accurate corrected primal dual has minimum block eigenvalue about `-3.10e-7`, while its spectrum has repeatable gaps between near-zero modes and range modes of order `1e-4` to `1e-3`. At a provisional `1e-7` threshold, the twelve numerical kernel dimensions are approximately

```text
12, 12, 11, 12, 13, 14, 15, 14, 27, 27, 27, 27.
```

This is evidence for a large face, not an exact kernel claim.

## Alternating projection

The 9,865 invariant Fourier coordinates form a square invertible map to the twelve block coordinates. A sparse LU solve verified inversion residual `5.55e-16`. Nevertheless, alternating affine and PSD projections worsened:

```text
iteration 0:  minimum affine-block eigenvalue -0.00211
iteration 29: minimum affine-block eigenvalue -0.00759
```

The failure identifies a metric error. The square Fourier coordinate map is bijective but not orthogonal, so Euclidean projection in those coordinates is not projection in the Gram-matrix metric.

## Observed-face optimization

Two formulations then fixed the provisional seed kernels, normalized the dual by `L(Delta)=1`, imposed `L(Delta^2)=0`, and maximized a uniform positive margin:

1. full-block positivity with explicit kernel equations;
2. exact zero action on each proposed kernel and positivity only on its quotient range.

Both reached the 604-second execution limit without emitting a solver result. No feasibility or infeasibility inference is drawn from either timeout.

The quotient formulation was mathematically smaller, but its dense numerical eigenbases destroyed sparsity. This is the decisive diagnosis: numerical eigenspaces are the wrong representation for exact facial reduction.

## Sharpened theorem target

The next target is **sparse exact kernel recovery in the original 678-element rational module**:

1. reconstruct the nearly singular full rational moment matrix from the best corrected dual;
2. search for short `F2`/integer relations in each symmetry type rather than rationalizing dense Fourier eigenvectors;
3. verify each proposed relation by exact multiplication and exact annihilation;
4. transport verified relations through the positivity-preserving automorphism group;
5. quotient by that exact relation lattice; and
6. only then solve for a strictly positive range functional.

This target also changes the architecture lesson. A persistent face should be stored as a sparse relation program, not as a dense latent subspace. Dense embeddings are derived query artifacts; exact relations are compositional memory.

## Claim boundary

Exactly established in this phase:

- exact diagonal-orbit counts are now exported with the corrected reduction;
- the 9,865-coordinate Fourier map is nonsingular to numerical inversion residual `5.55e-16`;
- all experiment programs and their stopping conditions are reproducible; and
- the new quotient formulation implements the correct face semantics.

Numerically observed:

- a large near-null block pattern in the best corrected dual;
- a spectral jump from near-zero modes to modes around `1e-4`--`1e-3`; and
- severe ill-conditioning when those modes are encoded by dense floating eigenvectors.

Not established:

- the exact common kernel;
- a positive relative-interior margin on that kernel face;
- an exact dual obstruction excluding positive radius-two gaps; or
- a positive radius-two SOS identity.
