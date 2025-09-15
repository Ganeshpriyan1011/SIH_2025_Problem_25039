const axios = require("axios");

const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;

async function getMarineData(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`;
    const response = await axios.get(url);
    const data = response.data;

    return {
      waveHeight: data?.waves ?? 0, // OWM doesn’t provide waveHeight in standard API; if you have Ocean/Marine API, replace
      windSpeed: data?.wind?.speed ?? 0, // wind speed in m/s
    };
  } catch (err) {
    console.error("Error fetching weather data:", err.message);
    return { waveHeight: 0, windSpeed: 0 }; // fallback
  }
}

module.exports = { getMarineData };
