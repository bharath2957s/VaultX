/**
 * Server-side Suspicious Access & Heuristic Risk Engine
 * Section 36 & 37 of VaultX Specification
 */

export interface RiskEvaluationInput {
  failedAttempts: number;
  isNewDevice: boolean;
  requestFrequencyMs: number;
  isRevokedTokenAttempt: boolean;
  clientIp: string;
  userAgent: string;
}

export interface RiskEvaluationResult {
  riskScore: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
  actionRequired: 'NONE' | 'REQUIRE_PASSWORD' | 'REQUIRE_OTP' | 'BLOCK_TEMPORARY';
}

export function evaluateRisk(input: RiskEvaluationInput): RiskEvaluationResult {
  let riskScore = 0;
  const factors: string[] = [];

  if (input.failedAttempts > 0) {
    const penalty = Math.min(input.failedAttempts * 15, 60);
    riskScore += penalty;
    factors.push(`${input.failedAttempts} failed password attempt(s) detected (+${penalty})`);
  }

  if (input.isRevokedTokenAttempt) {
    riskScore += 45;
    factors.push('Attempt to use a revoked access credential (+45)');
  }

  if (input.requestFrequencyMs < 200) {
    riskScore += 25;
    factors.push('Rapid automated request frequency detected (+25)');
  }

  if (input.isNewDevice) {
    riskScore += 15;
    factors.push('Unrecognized client session fingerprint / user-agent (+15)');
  }

  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let actionRequired: 'NONE' | 'REQUIRE_PASSWORD' | 'REQUIRE_OTP' | 'BLOCK_TEMPORARY' = 'NONE';

  if (riskScore >= 75) {
    level = 'CRITICAL';
    actionRequired = 'BLOCK_TEMPORARY';
  } else if (riskScore >= 50) {
    level = 'HIGH';
    actionRequired = 'REQUIRE_OTP';
  } else if (riskScore >= 25) {
    level = 'MEDIUM';
    actionRequired = 'REQUIRE_PASSWORD';
  }

  return {
    riskScore: Math.min(riskScore, 100),
    level,
    factors,
    actionRequired
  };
}
