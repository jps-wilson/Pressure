# Pressure

An interactive atmospheric measurement app. Pressure turns raw weather data into a tactile, instrument-style dial – pulling live pressure, temperature, humidity, UV, and air quality for your exact location and translating it into a "calm / moderate / heavy" atmospheric strain reading.

**Live:** [pressure-app.vercel.app](https://pressure-app.vercel.app/)

## What it does

- Requests browser geolocation and reverse-geocodes it (via Nominatim/OpenStreetMap) to display your city and region
- Fetches live conditions through a Vercel serverless function that proxies WeatherAPI.com, keeping the API key server-side
- Renders pressure on an animated dial with hand-drawn tick marks, classifying atmospheric strain as **Calm** (>1018 hPa), **Moderate** (1005-1018 hPa), or **Heavy** (<1005 hPa), each with its own insight copy
- Shifts the background glow and dial color by temperature band (cold / mild / warm)
- Simulates natural pressure drift with small randomized fluctuations every 4 seconds after the initial reading
- Surfaces temperature, humidity, UV index, and EPA air quality index as chips below the dial

## Stack

- HTML, CSS, JavaScript – no framework
- [Vercel](https://vercel.com/home) serverless function (`/api/weather.js`) for the WeatherAPI proxy
- [WeatherAPI.com](https://www.weatherapi.com/) for current conditions + air quality
- [Nominatim](https://nominatim.org/) (OpenStreetMap) for reverse geocoding
- [Varlock](https://varlock.dev/) for environment variable management

## Project structure

```
pressure-app/
├── api/
│   └── weather.js       # serverless function, proxies WeatherAPI, caches 10 min at the edge
├── index.html
├── script.js            # geolocation, dial state, chip updates, animations
├── style.css
└── vercel.json          # CSP headers
```

## Running locally

You'll need a free [WeatherAPI.com](https://www.weatherapi.com/) key.

```bash
npm install
```

Create a new `.env` file at the project root:

```
WEATHERAPI_KEY=your_key_here
```

Then run with the Vercel CLI so the `/api/weather` serverless function works locally:

```bash
npx vercel dev
```

Opening `index.html` directly wont work – the weather call depends on the serverless function, which only runs through Vercel.

## Notes

- Location access is required: there's no manual location fallback.app- Pressure drift after the initial fetch is simulated client-side for visual effect, not live re-polling

## License

MIT – see [LICENSE](LICENSE)
