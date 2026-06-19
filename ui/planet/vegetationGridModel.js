export function vegGridOrbit(mass) {
  if (mass < 0.3) return 0.05;
  if (mass < 0.5) return 0.15;
  if (mass < 0.7) return 0.5;
  if (mass < 0.9) return 0.8;
  return 1.0;
}

export function vegGridTwilightOrbit(mass) {
  if (mass < 0.3) return 0.03;
  if (mass < 0.5) return 0.08;
  return 0.15;
}
