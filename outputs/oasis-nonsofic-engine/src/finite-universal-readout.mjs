import { sWord } from "./leavitt-f2.mjs";
import { ExactCoefficientProbe, LeavittRegularState } from "./regular-probes.mjs";

function normalizePositive(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("A nonempty probability vector is required");
  }
  for (const value of values) {
    if (!(Number.isFinite(value) && value > 0)) {
      throw new Error("Finite universal readout requires strictly positive masses");
    }
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => value / total);
}

function softmax(values) {
  const maximum = Math.max(...values);
  const masses = values.map((value) => Math.exp(value - maximum));
  const total = masses.reduce((sum, value) => sum + value, 0);
  return masses.map((value) => value / total);
}

// For basis states s_d, coeff(d,epsilon) is exactly one on s_d and zero on
// every other basis state. Its sign encoding is therefore +1 on d and -1
// elsewhere. Choosing theta_d = log(p_d)/2 gives logit(d)=log(p_d)-constant,
// so the normalized exponential readout is exactly p.
export function exactFiniteDistributionReadout(prefixes, targetMasses) {
  if (prefixes.length !== targetMasses.length || new Set(prefixes).size !== prefixes.length) {
    throw new Error("Prefixes and target masses must have the same distinct support");
  }
  const target = normalizePositive(targetMasses);
  const states = prefixes.map(
    (prefix) => new LeavittRegularState(sWord(prefix), `s_${prefix}`),
  );
  const probes = prefixes.map(
    (prefix) => new ExactCoefficientProbe({ alpha: prefix, beta: "" }),
  );
  const bitMatrix = probes.map((probe) => states.map((state) => probe.evaluateBit(state)));
  const isKronecker = bitMatrix.every((row, probeIndex) =>
    row.every((value, stateIndex) => value === (probeIndex === stateIndex ? 1 : 0)));
  if (!isKronecker) throw new Error("Coefficient probes did not form a Kronecker basis");

  const parameters = target.map((probability) => 0.5 * Math.log(probability));
  const logits = states.map((state) => probes.reduce(
    (sum, probe, index) => sum + parameters[index] * probe.evaluateSign(state),
    0,
  ));
  const represented = softmax(logits);
  const maximumError = Math.max(
    ...represented.map((value, index) => Math.abs(value - target[index])),
  );
  return {
    schema: "oasis.finite-universal-readout.v1",
    theorem: "exact-positive-distribution-universality-on-finite-regular-basis-window",
    scope: "finite-support-exact-not-yet-compact-space-universality",
    supportSize: prefixes.length,
    isKronecker,
    target,
    parameters,
    represented,
    maximumError,
    probes: probes.map((probe) => probe.toProgramAtom()),
  };
}
