// insuranceEngine.js
// Core integration layer for ShieldRider logic

import { getWeatherData } from './weatherService.js';
import { getEnvironmentalFactor } from '../utils/riskEngine.js';
import { calculatePremium } from '../utils/pricingEngine.js';
import { calculatePayout } from '../utils/payoutEngine.js';
import { createClaim, processClaim } from '../utils/claimEngine.js';

/* ---------------------------
   Dynamic Severity Functions
---------------------------- */

function getRainSeverity(rain) {
  if (rain > 80) return 'extreme';
  if (rain > 60) return 'severe';
  if (rain > 40) return 'moderate';
  return 'mild';
}

function getHeatSeverity(temp) {
  if (temp > 47) return 'extreme';
  if (temp > 42) return 'severe';
  if (temp > 38) return 'moderate';
  return 'mild';
}

function getPollutionSeverity(aqi) {
  if (aqi > 300) return 'extreme';
  if (aqi > 250) return 'severe';
  if (aqi > 200) return 'moderate';
  return 'mild';
}

/* ---------------------------
   Core Insurance Cycle
---------------------------- */

export function runInsuranceCycle(user) {
  // Step 1: Get live environmental data
  const weather = getWeatherData();

  // Step 2: Compute environmental risk factor
  const environment = getEnvironmentalFactor(weather);

  // Step 3: Calculate premium (UNCHANGED LOGIC)
  const { premium } = calculatePremium(user, environment);

  // Step 4: Dynamic event detection (UPGRADED)
  let event = null;

  // 🌧 Rain Event
  if (weather.rain > 40) {
    event = {
      type: 'rain',
      severity: getRainSeverity(weather.rain),
      duration: 1 + (weather.rain / 100), // longer disruption if heavier rain
      intensity: weather.rain / 100, // NEW: intensity factor
    };
  }

  // 🔥 Heatwave Event
  else if (weather.temp > 38) {
    event = {
      type: 'heatwave',
      severity: getHeatSeverity(weather.temp),
      duration: 1 + ((weather.temp - 35) / 20),
      intensity: weather.temp / 50,
    };
  }

  // 🌫 Pollution Event
  else if (weather.aqi > 200) {
    event = {
      type: 'pollution',
      severity: getPollutionSeverity(weather.aqi),
      duration: 1 + (weather.aqi / 300),
      intensity: weather.aqi / 300,
    };
  }

  // Step 5: Calculate payout (USES EXISTING FORMULA)
  const payout = event ? calculatePayout(event, user) : 0;

  // Claim creation and processing hook
  let claim = null;
  if (payout > 0 && event) {
    const rawClaim = createClaim(user, event, payout);
    claim = processClaim(rawClaim, user);
  }

  // Debug logs for live simulation
  console.log(
    '[ShieldRider]',
    '\nWeather:', weather,
    '\nEnvironment:', environment,
    '\nPremium:', premium,
    '\nEvent:', event,
    '\nPayout:', payout,
    '\nClaim:', claim
  );

  // Step 6: Return cycle result
  return {
    weather,
    environment,
    premium,
    payout,
    event,
    claim,
  };
}