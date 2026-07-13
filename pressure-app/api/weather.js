module.exports = async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon required" });
  }

  const apiKey = process.env.WEATHERAPI_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: "WEATHERAPI_KEY is not set" });
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=yes`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "WeatherAPI request failed" });
    }

    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate"); // tells Vercel's edge to serve a cached response for 10 minutes before hitting the real API again
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
};
