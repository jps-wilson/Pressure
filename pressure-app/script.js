// DOM elements
const dial = document.querySelector(".dial");
const dialInner = document.querySelector(".dial-inner");
const dialH1 = dialInner.querySelector("h1");
const pressureVal = dialInner.querySelector(".pressure-value");
const dialP = dialInner.querySelector("p");
const strainText = document.querySelector(".dial h1");
const dateTime = document.getElementById("date-time");
const city = document.getElementById("city");
const body = document.body;
const getLocationBtn = document.getElementById("get-location");
const dialValue = document.querySelector(".dial-inner h1");
const pressureValueElem = document.querySelector(".pressure-value");
const insight = document.querySelector(".insight p");

document.body.classList.add("preboot");

function setPreUseState() {
  dialH1.textContent = "--";
  pressureVal.textContent = "-- hPa";
  dialP.textContent = "Atmospheric Pressure";
  dialInner.classList.add("idle");
  // Show dial glow immediately
  setAtmosphere(15);
}

function initChips() {
  const chips = document.querySelectorAll(".chip");
  chips[0].textContent = "Temperature: --";
  chips[1].textContent = "Air Quality: --";
  chips[2].textContent = "Humidity: --";
  chips[3].textContent = "UV: --";
}
initChips();

// Update date and time every second
function updateDateTime() {
  const now = new Date();
  const formatted = now.toLocaleString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  dateTime.textContent = formatted;
}
updateDateTime();
setInterval(updateDateTime, 1000);

// Set atmosphere glow based on temperature
function setAtmosphere(tempC) {
  body.classList.remove("cold", "mild", "warm");
  let glow;
  if (tempC <= 5) {
    body.classList.add("cold");
    glow = "var(--temp-cold-glow)";
  } else if (tempC <= 20) {
    body.classList.add("mild");
    glow = "var(--temp-mild-glow)";
  } else {
    body.classList.add("warm");
    glow = "var(--temp-warm-glow)";
  }
  body.style.transition = "background 2s ease";
  dial.style.boxShadow = `0 0 80px ${glow}, inset 0 0 40px ${glow}`;
}

function fitStrainText(text) {
  dialH1.textContent = text;
  dialH1.style.fontSize = ""; // reset font size

  const parentWidth = dialInner.clientWidth;
  const parentHeight = dialInner.clientHeight;

  let fontSize = 100; // start large
  dialH1.style.fontSize = fontSize + "px";

  // Reduce font size until text fits inside parent container
  while (
    (dialH1.scrollWidth > parentWidth || dialH1.scrollHeight > parentHeight) &&
    fontSize > 10
  ) {
    fontSize -= 1;
    dialH1.style.fontSize = fontSize + "px";
  }
}

function setStrain(pressure) {
  dial.classList.remove("calm", "moderate", "heavy");

  if (pressure > 1018) {
    dial.classList.add("calm");
    fitStrainText("CALM");
    insight.textContent =
      "Atmospheric pressure is high and stable. Expect clarity and comfortable breathing.";
  } else if (pressure >= 1005) {
    dial.classList.add("moderate");
    fitStrainText("MODERATE");
    insight.textContent =
      "Pressure is slightly unsettled. Some may notice mild fatigue.";
  } else {
    dial.classList.add("heavy");
    fitStrainText("HEAVY");
    insight.textContent =
      "Low atmospheric pressure detected. Fatigue and headaches are more likely today.";
  }
}

const AQI_LABELS = [
  "Good",
  "Moderate",
  "Unhealthy for Sensitive Groups",
  "Unhealthy",
  "Very Unhealthy",
  "Hazardous",
];

// Update chips dynamically
function updateChips(temp, humidity, uvIndex, aqiIndex) {
  const chips = document.querySelectorAll(".chip");
  chips[0].textContent = `Temperature: ${Math.round(temp)}°C`;
  chips[1].textContent = `Air Quality: ${AQI_LABELS[aqiIndex - 1] ?? "Unknown"}`;
  chips[2].textContent = `Humidity: ${humidity}%`;
  chips[3].textContent = `UV: ${uvIndex}`;
}

// Fetch weather and update UI
function fetchWeather() {
  city.textContent = "Locating atmosphere...";
  getLocationBtn.disabled = true;
  getLocationBtn.textContent = "Locating...";

  if (!("geolocation" in navigator)) {
    city.textContent = "Location unavailable";
    getLocationBtn.disabled = false;
    getLocationBtn.textContent = "Try Again";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      console.log("Coordinates:", latitude, longitude);
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              "Accept-Language": "en",
            },
          },
        );
        const geoData = await geoResponse.json();

        if (geoData.address) {
          const address = geoData.address;

          const cityName =
            address.city ||
            address.town ||
            address.village ||
            address.hamlet ||
            address.county ||
            "Unknown area";

          const region =
            address.state || address.region || address.country || "";

          city.textContent = region ? `${cityName}, ${region}` : cityName;
        } else {
          city.textContent = "Unknown location";
        }
      } catch (geoError) {
        console.error("Geocoding failed:", geoError);
        city.textContent = "Location unavailable";
        getLocationBtn.disabled = true;
        getLocationBtn.textContent = "Try Again";
      }

      try {
        const API_KEY = "3aa5677223204828a9705949262703";
        const weatherResponse = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${latitude},${longitude}&aqi=yes`,
        );
        const weatherData = await weatherResponse.json();
        console.log("Weather Data:", weatherData);

        const current = weatherData.current;
        const temp = current.temp_c;
        const pressure = current.pressure_mb;
        const humidity = current.humidity;
        const uvIndex = current.uv;
        const aqiIndex = current.air_quality?.["us-epa-index"] ?? 1;

        pressureValueElem.textContent = `${Math.round(pressure)} hPa`;
        setStrain(pressure);
        setAtmosphere(temp);
        updateChips(temp, humidity, uvIndex, aqiIndex);

        if (window.pressureDriftInterval) {
          clearInterval(window.pressureDriftInterval);
        }

        window.pressureDriftInterval = setInterval(() => {
          const microShift = pressure + (Math.random() * 0.6 - 0.3);
          pressureValueElem.textContent = `${microShift.toFixed(1)} hPa`;
        }, 4000);

        document.querySelector(".dial-inner").classList.remove("idle");
        getLocationBtn.disabled = false;
        getLocationBtn.textContent = "Refresh Location";
      } catch (err) {
        console.error("Weather fetch failed:", err);
        city.textContent = "Location unavailable";
        getLocationBtn.disabled = false;
        getLocationBtn.textContent = "Try Again";
      }
    },
    (error) => {
      console.error("Geolocation error:", error.code, error.message);
      city.textContent = "Location unavailable";
      getLocationBtn.disabled = false;
      getLocationBtn.textContent = "Get Location";
    },
    { timeout: 10000, maximumAge: 6000, enableHighAccuracy: false },
  );
}

// Attach get location button
getLocationBtn.addEventListener("click", fetchWeather);

// Magnetic dial hover
dial.addEventListener("mousemove", (e) => {
  const rect = dial.getBoundingClientRect();
  const moveX = (e.clientX - rect.width / 2) / 18;
  const moveY = (e.clientY - rect.height / 2) / 18;
  dial.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.03)`;
});
dial.addEventListener("mouseleave", () => {
  dial.style.transform = "translate(0, 0) scale(1)";
});
dial.addEventListener("mousedown", () => {
  dial.style.transform += " scale(0.98)";
});
dial.addEventListener("mouseup", () => {
  dial.style.transform = dial.style.transform.replace(" scale(0.98)", "");
});

// Global error listener
window.addEventListener("error", (event) => {
  console.error(
    "Global Error:",
    event.message,
    "at",
    event.filename,
    ":",
    event.lineno,
  );
});

setPreUseState();

function drawDialTicks() {
  const svg = document.getElementById("dial-tick-svg");
  if (!svg) return;

  const size = dial.offsetWidth;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;

  let html = "";
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const len = isMajor ? 8 : 4;
    const x1 = (cx + (r - len) * Math.cos(angle)).toFixed(1);
    const y1 = (cy + (r - len) * Math.sin(angle)).toFixed(1);
    const x2 = (cx + r * Math.cos(angle)).toFixed(1);
    const y2 = (cy + r * Math.sin(angle)).toFixed(1);
    const opacity = isMajor ? 0.25 : 0.1;
    const width = isMajor ? 1 : 0.5;
    html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(220,210,195,${opacity})" stroke-width="${width}"/>`;
  }
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.innerHTML = html;
}

drawDialTicks();
window.addEventListener("resize", drawDialTicks);

document.addEventListener("DOMContentLoaded", () => {
  setPreUseState();
  document.body.classList.add("preboot");

  setTimeout(() => {
    document.body.classList.remove("preboot");
    document.body.classList.add("booting");
  }, 300);
});
