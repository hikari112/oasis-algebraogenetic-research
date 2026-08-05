# Completed countermodel curriculum

The run `countermodel-20260804-live` searched for finite permutation emulators of sizes

```text
6, 8, 10, 12, 16, 20
```

for two hours. It completed 925,234 iterations and 617 stages. It used the exact 155-element Thompson-`V` obstruction chart and evaluated:

- all 11,935 distinct-element pairs;
- every multiplication triangle whose product remains in the finite chart; and
- all seven Bleak-Quick relators.

The primary quantity is

```text
worstLoss = max(
  largest collision fraction,
  largest multiplication defect,
  largest relator defect
)
```

Lower is better for the finite emulator. The secondary mean-loss term breaks plateaus. Generator proposals preserve the known orders `u^6=1` and `v^3=1` through bounded-cycle initialization and conjugation moves.

## Final best envelope

```text
size 6:  worstLoss 1.000
size 8:  worstLoss 0.875
size 10: worstLoss 0.700
size 12: worstLoss 0.750
size 16: worstLoss 0.625
size 20: worstLoss 0.600
```

The curve improves slowly and non-monotonically. At size 20, the best candidate still has maximum collision and multiplication defects of `0.6`, with maximum relator defect `0.4`. These values are curriculum evidence only; they are not certified global optima at each size.

## Claim boundary

This is an empirical adversarial search. A persistent positive defect floor is evidence about useful constraint families and scaling, not a proof of a universal epsilon. Failure to find a good emulator is not proof that none exists.

Conversely, a better emulator is valuable: its worst constraint supplies a harder countermodel and tells the certificate where its present finite challenge is weakest.

## Run files

- `manifest.json`: fixed configuration and constraint counts.
- `status.json`: latest checkpoint and best candidate at each size.
- `events.jsonl`: append-only sequence of new best results.
- `process-id.txt`: background process identifier.
- `stderr.log`: runtime errors; empty at successful startup.

The run checks for a file named `STOP` between proposals and exits cleanly if one appears.
