// claimEngine.js
// Simple claim processing engine for ShieldRider

export function createClaim(user, event, payout) {
  const claimId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: claimId,
    userId: user.uid || user.email || 'anonymous',
    event: event?.type || 'unknown',
    severity: event?.severity || 'unknown',
    payoutAmount: Number(payout) || 0,
    status: 'Pending',
    createdAt: new Date().toLocaleString(),
    createdAtMs: Date.now(),
    riskFactor: user.riskZone || 'Medium',
    behavior: user.behavior || 'normal',
    income: Number(user.income) || 0,
  };
}

export function runFraudCheck(claim, user) {
  const income = Number(user.income) || 1;
  const payoutRatio = claim.payoutAmount / income;
  const severityScore = claim.severity === 'severe' ? 0.35 : claim.severity === 'moderate' ? 0.2 : 0.1;
  const behaviorScore = user.behavior?.toLowerCase() === 'risky' ? 0.3 : user.behavior?.toLowerCase() === 'safe' ? -0.1 : 0.0;

  let fraudScore = 0.3 + payoutRatio + severityScore + behaviorScore;
  fraudScore = Math.min(Math.max(fraudScore, 0), 1);

  return {
    fraudScore: Number(fraudScore.toFixed(3)),
    isFraud: fraudScore >= 0.75,
  };
}

export function processClaim(claim, user) {
  const fraudCheck = runFraudCheck(claim, user);
  claim.fraudScore = fraudCheck.fraudScore;
  claim.isFraud = fraudCheck.isFraud;
  claim.status = fraudCheck.isFraud ? 'Rejected' : 'Approved';
  claim.processedAt = new Date().toLocaleString();
  return claim;
}
