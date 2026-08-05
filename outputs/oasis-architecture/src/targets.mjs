import {
  SeededRng,
  normalize,
  parity,
  walshValue,
} from "./oasis-core.mjs";

function bitsOf(state, nBits) {
  return Array.from({ length: nBits }, (_, bit) => (state >>> bit) & 1);
}

function fromEnergies(energies) {
  const maximum = Math.max(...energies);
  return normalize(energies.map((energy) => Math.exp(energy - maximum)));
}

export function structuredParityTarget(nBits = 8) {
  const prefixEnergy = [1.35, -0.55, 0.75, -1.15, -0.35, 0.95, -0.85, 0.45];
  const energies = [];
  for (let state = 0; state < 2 ** nBits; state += 1) {
    const bits = bitsOf(state, nBits);
    const prefix = (bits[0] << 2) | (bits[1] << 1) | bits[2];
    let energy = prefixEnergy[prefix];
    energy += parity(state & 0b10100101) === 0 ? 2.15 : -0.75;
    energy += bits[1] === bits[4] ? 0.95 : -0.25;
    energy += (bits[0] ^ bits[7]) === bits[3] ? 1.25 : -0.4;
    energy += bits[6] ? 0.15 : -0.05;
    energies.push(energy);
  }
  return fromEnergies(energies);
}

export function hierarchicalCylinderTarget(nBits = 8) {
  const energies = [];
  for (let state = 0; state < 2 ** nBits; state += 1) {
    const bits = bitsOf(state, nBits);
    let energy = bits[0] ? 0.9 : -0.2;
    if (bits[0]) energy += bits[1] ? 1.4 : -0.7;
    if (bits[0] && bits[1]) energy += bits[2] ? -1.1 : 0.8;
    if (!bits[0]) energy += bits[4] ? 0.6 : -0.3;
    if (!bits[0] && bits[4]) energy += bits[6] ? 1.0 : -0.5;
    if (bits[3] && bits[5] && !bits[7]) energy += 1.2;
    energies.push(energy);
  }
  return fromEnergies(energies);
}

export function independentTarget(nBits = 8) {
  const probabilitiesOne = [0.12, 0.78, 0.31, 0.64, 0.45, 0.86, 0.22, 0.57];
  const masses = [];
  for (let state = 0; state < 2 ** nBits; state += 1) {
    let mass = 1;
    for (let bit = 0; bit < nBits; bit += 1) {
      const one = (state >>> bit) & 1;
      mass *= one ? probabilitiesOne[bit] : 1 - probabilitiesOne[bit];
    }
    masses.push(mass);
  }
  return normalize(masses);
}

export function sparseOrbitTarget(nBits = 8, seed = 17) {
  const rng = new SeededRng(seed);
  const masks = new Set();
  while (masks.size < 12) masks.add(1 + Math.floor(rng.next() * (2 ** nBits - 1)));
  const terms = [...masks].map((mask) => ({
    mask,
    weight: (rng.next() < 0.5 ? -1 : 1) * (0.35 + 0.9 * rng.next()),
  }));
  const energies = Array.from({ length: 2 ** nBits }, (_, state) =>
    terms.reduce((sum, term) => sum + term.weight * walshValue(state, term.mask), 0),
  );
  return fromEnergies(energies);
}

function hammingDistance(left, right) {
  let x = left ^ right;
  let count = 0;
  while (x !== 0) {
    x &= x - 1;
    count += 1;
  }
  return count;
}

export function hammingMixtureTarget(nBits = 8) {
  const centers = [0b00011011, 0b11100100, 0b10110110];
  const weights = [0.45, 0.35, 0.20];
  const masses = Array.from({ length: 2 ** nBits }, (_, state) =>
    centers.reduce(
      (sum, center, index) =>
        sum + weights[index] * Math.exp(-1.15 * hammingDistance(state, center)),
      0,
    ),
  );
  return normalize(masses);
}

export function scaleOscillationTarget(nBits = 8) {
  const masses = Array.from({ length: 2 ** nBits }, (_, state) => {
    const x = state + 1;
    const logScale = Math.log2(x);
    return x ** -0.72 * Math.exp(0.7 * Math.cos(2 * Math.PI * logScale));
  });
  return normalize(masses);
}

export const TARGET_FAMILIES = [
  { name: "structured-parity", make: () => structuredParityTarget(8) },
  { name: "hierarchical-cylinder", make: () => hierarchicalCylinderTarget(8) },
  { name: "independent", make: () => independentTarget(8) },
  { name: "sparse-orbit", make: (seed) => sparseOrbitTarget(8, seed) },
  { name: "hamming-mixture", make: () => hammingMixtureTarget(8) },
  { name: "scale-oscillation", make: () => scaleOscillationTarget(8) },
];

