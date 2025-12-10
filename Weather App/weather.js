const form = document.getElementById('weather-form');
const input = document.getElementById('location-input');
const statusEl = document.getElementById('status');
const card = document.getElementById('weather-card');
const placeEl = document.getElementById('place');
const metaEl = document.getElementById('meta');
const tempEl = document.getElementById('temp');
const condEl = document.getElementById('condition');
const windEl = document.getElementById('wind');
const seasonChip = document.getElementById('season-chip');
const body = document.body;

const seasonMap = {
  spring: { label: 'Spring', className: 'season-spring', image: 'Assets/Spring.webp' },
  summer: { label: 'Summer', className: 'season-summer', image: 'Assets/Summer.webp' },
  autumn: { label: 'Autumn', className: 'season-autumn', image: 'Assets/Autumn.webp' },
  winter: { label: 'Winter', className: 'season-winter', image: 'Assets/Winter.webp' },
};

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

const pickSeason = (monthIndex, latitude) => {
  const northSeasons = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
  const southSeasons = ['summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter', 'winter', 'winter', 'spring', 'spring', 'spring', 'summer'];
  const useNorth = latitude >= 0;
  return (useNorth ? northSeasons : southSeasons)[monthIndex] || 'spring';
};

const setSeasonBackground = (seasonKey) => {
  Object.values(seasonMap).forEach(({ className }) => body.classList.remove(className));
  const season = seasonMap[seasonKey] || seasonMap.spring;
  body.classList.add(season.className);
};

const formatMeta = (city, country, tz) => {
  const parts = [];
  if (city) parts.push(city);
  if (country) parts.push(country);
  const place = parts.join(', ');
  const tzLabel = tz ? `Time zone: ${tz}` : '';
  return { place, tzLabel };
};

const showStatus = (message, type = '') => {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
};

const toMps = (kmh) => (kmh / 3.6).toFixed(1);

const fetchWeather = async (query) => {
  showStatus('Looking up location...');
  card.classList.add('hidden');

  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) {
    throw new Error('Could not reach the geocoding service.');
  }
  const geoData = await geoRes.json();
  if (!geoData.results || !geoData.results.length) {
    throw new Error('Place not found. Try another city or spelling.');
  }

  const place = geoData.results[0];
  const { latitude, longitude, name, country, timezone } = place;

  showStatus('Fetching current weather...');
  const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=${encodeURIComponent(timezone)}`;
  const wxRes = await fetch(wxUrl);
  if (!wxRes.ok) {
    throw new Error('Could not reach the weather service.');
  }
  const wxData = await wxRes.json();
  if (!wxData.current_weather) {
    throw new Error('No weather data available for this location right now.');
  }

  const { temperature, windspeed, weathercode, time } = wxData.current_weather;
  const monthIndex = new Date(time).getUTCMonth();
  const seasonKey = pickSeason(monthIndex, latitude);
  const season = seasonMap[seasonKey];

  const condition = weatherCodeMap[weathercode] || 'Current weather';
  const { place: placeLabel, tzLabel } = formatMeta(name, country, timezone);

  placeEl.textContent = placeLabel || 'Unknown place';
  metaEl.textContent = tzLabel;
  tempEl.textContent = `${Math.round(temperature)}°C`;
  condEl.textContent = condition;
  windEl.textContent = `${windspeed.toFixed(1)} km/h (${toMps(windspeed)} m/s)`;

  seasonChip.innerHTML = `<span class="season-dot"></span>${season.label}`;
  setSeasonBackground(seasonKey);

  card.classList.remove('hidden');
  showStatus(`Updated ${new Date(time).toLocaleString()}`, 'success');
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) {
    showStatus('Enter a place to search.', 'error');
    return;
  }
  const submitBtn = form.querySelector('button');
  submitBtn.disabled = true;
  try {
    await fetchWeather(query);
  } catch (err) {
    showStatus(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

// Prefill with a friendly default search
fetchWeather('London').catch(() => {
  showStatus('Enter a place to see its weather.', '');
});

