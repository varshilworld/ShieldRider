// payoutEngine.js
// Computes insurance payout based on event and user parameters.

export function calculatePayout(event, user) {
  if (!event || !event.type) return 0;

  /* ---------------------------
     Base Claim Mapping
  ---------------------------- */
  const baseClaimMap = {
    rain: 500,
    heatwave: 300,
    pollution: 400,
    strike: 600,
    pandemic: 800,
    war: 1000,
  };

  /* ---------------------------
     Severity Multipliers
  ---------------------------- */
  const severityMap = {
    mild: 1.0,
    moderate: 1.3,
    severe: 1.6,
    extreme: 2.0,
  };

  /* ---------------------------
     Plan Multipliers
  ---------------------------- */
  const planMap = {
    BASIC: 1.0,
    PRO: 1.3,
    ELITE: 2.0,
  };

  /* ---------------------------
     User Factors
  ---------------------------- */
  const income = Number(user.income) || 0;
  const incomeFactor = income > 0 ? income / 20000 : 1.0;

  const planMultiplier = planMap[user.plan?.toUpperCase()] || 1.0;

  /* ---------------------------
     Event Factors
  ---------------------------- */
  const baseClaim = baseClaimMap[event.type] || 0;
  const eventSeverity = severityMap[event.severity] || 1.0;

  const durationFactor = Number(event.duration) || 1.0;

  // 🔥 NEW: Dynamic intensity factor (from insuranceEngine)
  const intensityFactor = Number(event.intensity) || 1.0;

  /* ---------------------------
     Disruption Boost (NEW AI-LIKE LOGIC)
  ---------------------------- */
  let disruptionBoost = 1.0;

  // Example: stronger compounding for extreme real-world scenarios
  if (event.type === 'rain' && intensityFactor > 0.8) {
    disruptionBoost += 0.2; // flood-level bonus
  }

  if (event.type === 'heatwave' && intensityFactor > 0.9) {
    disruptionBoost += 0.15;
  }

  if (event.type === 'pollution' && intensityFactor > 0.85) {
    disruptionBoost += 0.1;
  }

  /* ---------------------------
     Final Payout Calculation
  ---------------------------- */
  const payout =
    baseClaim *
    eventSeverity *
    planMultiplier *
    incomeFactor *
    durationFactor *
    intensityFactor *
    disruptionBoost;

  return Number(payout.toFixed(2));
}