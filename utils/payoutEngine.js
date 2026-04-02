// payoutEngine.js
// Computes insurance payout based on event and user parameters.
export function calculatePayout(event, user) {
  if (!event || !event.type) return 0;

  const baseClaimMap = {
    rain: 500,
    heatwave: 300,
    pollution: 400,
    strike: 600,
    pandemic: 800,
    war: 1000,
  };

  const severityMap = {
    mild: 1.0,
    moderate: 1.3,
    severe: 1.6,
    extreme: 2.0,
  };

  const planMap = {
    BASIC: 1.0,
    PRO: 1.3,
    ELITE: 2.0,
  };

  const income = Number(user.income) || 0;
  const incomeFactor = income > 0 ? income / 20000 : 1.0;
  const durationFactor = Number(event.duration) || 1.0;

  const baseClaim = baseClaimMap[event.type] || 0;
  const eventSeverity = severityMap[event.severity] || 1.0;
  const planMultiplier = planMap[user.plan?.toUpperCase()] || 1.0;

  const payout = baseClaim * eventSeverity * planMultiplier * incomeFactor * durationFactor;
  return Number(payout.toFixed(2));
}
