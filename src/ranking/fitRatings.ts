export interface Observation {
  winner: number;
  loser: number;
  target: number;
}

interface FitOptions {
  regularization: number;
  maxIterations: number;
  gradientTolerance: number;
}

function dot(a: Float64Array, b: Float64Array): number {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

function objective(values: Float64Array, observations: Observation[], regularization: number): number {
  let loss = regularization * dot(values, values) / 2;
  for (const { winner, loser, target } of observations) {
    const gap = values[winner] - values[loser];
    loss += Math.max(gap, 0) + Math.log1p(Math.exp(-Math.abs(gap))) - target * gap;
  }
  return loss;
}

// Damped Newton fitting with a conjugate-gradient solve of the positive
// definite Hessian. Unlike a fixed number of globally small gradient steps,
// this converges for both dense graphs and histories built around one anchor.
export function fitRatings(size: number, observations: Observation[], options: FitOptions): Float64Array {
  const values = new Float64Array(size);
  if (!observations.length) return values;
  const { regularization, maxIterations, gradientTolerance } = options;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const gradient = Float64Array.from(values, (value) => regularization * value);
    const diagonal = new Float64Array(size).fill(regularization);
    const curvature = new Float64Array(observations.length);
    observations.forEach(({ winner, loser, target }, index) => {
      const probability = 1 / (1 + Math.exp(-(values[winner] - values[loser])));
      const error = probability - target;
      gradient[winner] += error;
      gradient[loser] -= error;
      const weight = probability * (1 - probability);
      curvature[index] = weight;
      diagonal[winner] += weight;
      diagonal[loser] += weight;
    });
    if (gradient.every((value) => Math.abs(value) <= gradientTolerance)) break;

    const step = new Float64Array(size);
    const residual = Float64Array.from(gradient, (value) => -value);
    let preconditioned = Float64Array.from(residual, (value, index) => value / diagonal[index]);
    const direction = preconditioned.slice();
    let product = dot(residual, preconditioned);
    const residualLimit = Math.max(1e-24, dot(residual, residual) * 1e-12);
    for (let pass = 0; pass < size * 2; pass++) {
      const hessianDirection = Float64Array.from(direction, (value) => regularization * value);
      observations.forEach(({ winner, loser }, index) => {
        const change = curvature[index] * (direction[winner] - direction[loser]);
        hessianDirection[winner] += change;
        hessianDirection[loser] -= change;
      });
      const alpha = product / dot(direction, hessianDirection);
      for (let index = 0; index < size; index++) {
        step[index] += alpha * direction[index];
        residual[index] -= alpha * hessianDirection[index];
      }
      if (dot(residual, residual) <= residualLimit) break;
      preconditioned = Float64Array.from(residual, (value, index) => value / diagonal[index]);
      const nextProduct = dot(residual, preconditioned);
      const beta = nextProduct / product;
      for (let index = 0; index < size; index++) direction[index] = preconditioned[index] + beta * direction[index];
      product = nextProduct;
    }

    const previousLoss = objective(values, observations, regularization);
    const roundingAllowance = 8 * Number.EPSILON * Math.max(1, Math.abs(previousLoss));
    const slope = dot(gradient, step);
    let scale = 1;
    let candidate = Float64Array.from(values, (value, index) => value + scale * step[index]);
    while (objective(candidate, observations, regularization) > previousLoss + 1e-4 * scale * slope + roundingAllowance && scale > 1e-8) {
      scale /= 2;
      candidate = Float64Array.from(values, (value, index) => value + scale * step[index]);
    }
    values.set(candidate);
  }
  return values;
}
