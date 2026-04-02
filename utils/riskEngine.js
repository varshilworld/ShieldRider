// riskEngine.js
// Transforms weather conditions into an environmental risk factor and risk level.
export function getEnvironmentalFactor(weather) {
  const w = {
    rain: Number(weather.rain) || 0,
    temp: Number(weather.temp) || 0,
    wind: Number(weather.wind) || 0,
    aqi: Number(weather.aqi) || 0,
  };

  let factor = 1.0;
  if (w.aqi > 200) factor += 0.2;
  if (w.temp > 40) factor += 0.15;
  if (w.rain > 50) factor += 0.2;
  if (w.wind > 60) factor += 0.25;

  let level = 'Safe';
  if (factor >= 1.6) {
    level = 'Hazardous';
  } else if (factor > 1.1) {
    level = 'Normal';
  }

  return {
    factor: Number(factor.toFixed(2)),
    level,
  };
}
