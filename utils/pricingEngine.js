// pricingEngine.js
// Calculates the monthly premium based on user and environmental conditions.
export function calculatePremium(user, environment) {
  const income = Number(user.income) || 0;

  // Base rate by plan level
  const planMap = {
    BASIC: 0.025,
    PRO: 0.035,
    ELITE: 0.05,
  };
  const baseRate = planMap[user.plan?.toUpperCase()] || planMap.BASIC;

  // Risk zone multiplier defined by geography/traffic safety
  const riskZoneMap = {
    Low: 0.8,
    Medium: 1.2,
    High: 1.5,
  };
  const riskZoneMultiplier = riskZoneMap[user.riskZone] ?? 1.0;

  // Environmental factor from risk engine
  const environmentalFactor = Number(environment?.factor) || 1.0;

  // Behavior modifier
  const behaviorMap = {
    safe: 0.85,
    normal: 1.0,
    risky: 1.2,
  };
  const behaviorScore = behaviorMap[user.behavior] ?? 1.0;

  // Stability modifier
  const stabilityMap = {
    stable: 0.9,
    normal: 1.0,
    unstable: 1.1,
  };
  const stabilityFactor = stabilityMap[user.stability] ?? 1.0;

  const premium = income * baseRate * riskZoneMultiplier * environmentalFactor * behaviorScore * stabilityFactor;
  return {
    premium: Number(premium.toFixed(2)),
    components: {
      income,
      baseRate,
      riskZoneMultiplier,
      environmentalFactor,
      behaviorScore,
      stabilityFactor,
    },
  };
}
