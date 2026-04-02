// insuranceEngine.js
// Core integration layer for ShieldRider logic
import { getWeatherData } from './weatherService.js';
import { getEnvironmentalFactor } from '../utils/riskEngine.js';
import { calculatePremium } from '../utils/pricingEngine.js';
import { calculatePayout } from '../utils/payoutEngine.js';

export function runInsuranceCycle(user) {
  // Step 1: get weather
  const weather = getWeatherData();

  // Step 2: get environment risk factor
  const environment = getEnvironmentalFactor(weather);

  // Step 3: premium calc
  const { premium } = calculatePremium(user, environment);

  // Step 4: check extreme event conditions
  let event = null;
  if (weather.rain > 60) {
    event = { type: 'rain', severity: 'severe', duration: 1.5 };
  } else if (weather.temp > 45) {
    event = { type: 'heatwave', severity: 'severe', duration: 1.3 };
  } else if (weather.aqi > 250) {
    event = { type: 'pollution', severity: 'moderate', duration: 1.2 };
  }

  // Step 5: optional payout
  const payout = event ? calculatePayout(event, user) : 0;

  // Debug logs for live simulation
  console.log('[ShieldRider] weather:', weather, 'env:', environment, 'premium:', premium, 'event:', event, 'payout:', payout);

  return {
    weather,
    environment,
    premium,
    payout,
    event,
  };
}
