# Exact SOS symmetry analysis

## Result

The candidate symmetry group is the exact 24-element action

`S3(matrix indices) x C2(binary-symbol flip) x C2(transpose-Leavitt involution)`.

Every transformation maps the 679 exact radius-one product elements bijectively to themselves. The numerical dual varies by at most `6.150635556423367e-14` inside an exact symmetry orbit. The eight rounded numerical classes therefore respect the exact symmetry action, although they may merge several distinct exact orbits.

## Radius-one dual

- Exact elements: 679
- Exact symmetry orbits: 36
- Largest orbit: 24
- Rounded value classes: 8
- Dual moment minimum eigenvalue: 4.6351811278100286e-15
- Maximum within-orbit dual spread: 6.150635556423367e-14

Rounded class counts:

```text
270 @ -0.038917
144 @ -0.038927
144 @ -0.038897
72 @ -0.038907
24 @ 0.029499
18 @ -0.038936
6 @ 0.029489
1 @ 0.093491
```

## Radius-two PSD compression

- Exact radius-two basis elements excluding identity: 678
- Full symmetric Gram variables: 230181
- Symmetry-invariant symmetric variables: 9865
- Variable compression factor: 23.333096806893057
- Basis orbits: 35
- Largest PSD multiplicity block: 60

The 678-by-678 PSD constraint can be block-diagonalized into multiplicity blocks determined by the following real irreducible sectors:

| S3 irrep | Bit character | Dagger character | Irrep dimension | Multiplicity / PSD block size |
|---|---:|---:|---:|---:|
| trivial | 1 | 1 | 1 | 35 |
| trivial | 1 | -1 | 1 | 30 |
| trivial | -1 | 1 | 1 | 26 |
| trivial | -1 | -1 | 1 | 27 |
| sign | 1 | 1 | 1 | 25 |
| sign | 1 | -1 | 1 | 30 |
| sign | -1 | 1 | 1 | 27 |
| sign | -1 | -1 | 1 | 26 |
| standard | 1 | 1 | 2 | 60 |
| standard | 1 | -1 | 2 | 60 |
| standard | -1 | 1 | 2 | 53 |
| standard | -1 | -1 | 2 | 53 |

The dimension identity and the Burnside unordered-pair count both reproduce 9865 invariant symmetric variables. This is an exact internal consistency check of the decomposition.

## Claim boundary

This establishes the exact finite symmetry action and its representation-theoretic compression. It does not establish a positive radius-two SOS gap. The next solver must impose the quotient coefficient equations and verify any candidate with exact rational or interval arithmetic.
