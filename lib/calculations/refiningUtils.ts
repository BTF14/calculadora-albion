export function getReturnRate(focusUsed: boolean, cityBonus: boolean, premium: boolean): number {
  if (premium) {
    if (focusUsed && cityBonus) return 0.539;
    if (focusUsed && !cityBonus) return 0.435;
    if (!focusUsed && cityBonus) return 0.371;
    if (!focusUsed && !cityBonus) return 0.317;
  } else {
    if (focusUsed && cityBonus) return 0.220;
    if (focusUsed && !cityBonus) return 0.155;
    if (!focusUsed && cityBonus) return 0.153;
    if (!focusUsed && !cityBonus) return 0.100;
  }
  return 0;
}

export function getStationTax(premium: boolean): number {
  return premium ? 0.065 : 0.105;
}
