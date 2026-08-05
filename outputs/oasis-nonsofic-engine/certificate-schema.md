# Expansion/LEF obstruction certificate

`ExpansionLefObstructionCertificate` is the executable bridge from Proposition 2.3 to OASIS probe generation. It is a proof-obligation compiler, not a fabricated claim that the source proof contains numerical constants it does not state.

## Proof-to-runtime map

| Paper stage | Runtime object | Executable now |
|---|---|---|
| Binary Leavitt configuration | Exact `u`, `v`, all 30 `Gamma` roots, and both Bleak-Quick `J` generators | Yes |
| `Gamma` commutes with `J` | Word-equality relations | Yes |
| Sofic equality and distinctness tests | Normalized Hamming defects on a finite emulator | Yes |
| `Gamma` components | Orbits of the assigned generator permutations | Yes |
| Uniform component expansion | Exhaustive edge-boundary minimization for components up to the configured size | Yes |
| Select and repair a component | Finite audit data and concrete boundary witnesses | Partially; audit is executable, asymptotic selection remains conditional |
| Expanding approximation implies `J` is LEF | Typed certificate obligations plus finite error ledger | Conditional on an effective Kun locality/decomposition modulus |
| Thompson `V` is not LEF | 155-element relator-prefix obstruction | Yes; theorem-backed and finite |

## Serializable shape

Calling `certificate.toJSON()` returns only data:

```json
{
  "schema": "oasis.expansion-lef.v1",
  "claim": "conditional-expansion-to-lef-obstruction-compiler",
  "source": {
    "chapter": 3,
    "proposition": "2.3",
    "proofSteps": []
  },
  "group": {},
  "exactConfiguration": {
    "generators": {},
    "relations": []
  },
  "finiteWords": [],
  "obligations": [],
  "status": {
    "finiteAuditExecutable": true,
    "activeProbeSynthesis": true,
    "globallyEffective": false,
    "openObligations": []
  }
}
```

Every relation contains two exact group words and an `equal` or `distinct` expectation. Every open theorem input has a stable obligation identifier. No JavaScript callback or implicit constant is hidden in the serialized certificate.

## Active probe synthesis

Suppose a finite emulator assigns the same permutation to exact words `a` and `b`, although `a != b` in the Leavitt unit group. For each available regular state `d`, the compiler calculates

```text
(a + b)d
```

over `F2`. A nonzero canonical coefficient `s_alpha t_beta` identifies a coefficient functional that distinguishes the two actions. The compiler then creates the paired pullbacks

```text
a* coeff(alpha,beta)
b* coeff(alpha,beta)
```

and inserts them into the OASIS candidate frontier. Their score bonus applies only until first activation, so the obstruction changes exploration without permanently overwhelming the statistical residual.

Each generated probe stores its exact word, exact unit hash, coefficient key, and probe hash. Normal transactional replay verifies all four pieces.

## Outcomes and claim boundary

`finite-proof-obligation-violated` means a supplied finite emulator failed one of the audited relations. It is concrete evidence against that emulator.

`no-violation-in-audited-finite-tests` means only that the supplied assignments passed the covered finite tests. It is not evidence that the group is sofic.

`certifiedUniversalNonSoficity` is `false` for the default certificate. Universal certification remains behind the separate effective-witness gate until the three remaining obligations are closed.

## Proof-obstruction posterior

In proof-obligation mode, the learner builds a fractional-Dirichlet field over spectral gap, transport, coarea, matching, cut repair, finite words, locality radius, expander decomposition, and finite LEF stages. Open obligations, finite violations, and error-ledger loads update that field. A preferred probe gains information value when its targeted stage has high posterior mass and its current Bernoulli moment has high entropy.

The serialized field declares its semantics as `epistemic-probe-routing-not-theorem-probability`. It prioritizes experiments; it cannot turn numerical confidence into a mathematical proof.
