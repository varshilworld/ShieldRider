// weatherService.js
// Simulated weather API
export function getWeatherData() {
  return {
    rain: Number((Math.random() * 100).toFixed(1)),
    temp: Number((30 + Math.random() * 20).toFixed(1)),
    wind: Number((Math.random() * 80).toFixed(1)),
    aqi: Number((100 + Math.random() * 200).toFixed(1)),
  };
}
