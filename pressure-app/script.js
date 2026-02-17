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
  chips[0].textContent = "Air Quality: --";
  chips[1].textContent = "Pressure: --";
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

// Update chips dynamically
function updateChips(temp, pressure) {
  const chips = document.querySelectorAll(".chip");
  try {
    chips[0].textContent = `Air Quality: Good`; // placeholder -> replace with real API
    chips[1].textContent = `Pressure: ${Math.round(pressure)} hPa`;
    chips[2].textContent = `Humidity: 65%`; // placeholder
    chips[3].textContent = `UV: 3`; //placeholder
    console.log("Chips updated:", chips);
  } catch (err) {
    console.error("Chip update failed:", err);
  }
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
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=pressure_msl`,
        );
        const weatherData = await weatherResponse.json();
        console.log("Weather Data:", weatherData);

        const temp = weatherData.current_weather.temperature;
        const pressure = weatherData.hourly?.pressure_msl?.[0] ?? 1013;
        pressureValueElem.textContent = `${Math.round(pressure)} hPa`;

        pressureValueElem.textContent = `${Math.round(pressure)} hPa`;
        setStrain(pressure);
        setAtmosphere(temp);
        updateChips(temp, pressure);

        if (window.pressureDriftInterval) {
          clearInterval(window.pressureDriftInterval);
        }

        window.pressureDriftInterval = setInterval(() => {
          const microShift = pressure + (Math.random() * 0.6 - 0.3);
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
    () => {
      city.textContent = "Location unavailable";
      getLocationBtn.disabled = false;
      getLocationBtn.textContent = "Get Location";
    },
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

document.addEventListener("DOMContentLoaded", () => {
  setPreUseState();
  document.body.classList.add("preboot");

  setTimeout(() => {
    document.body.classList.remove("preboot");
    document.body.classList.add("booting");

    // Run calibration sweep on first visit
    const hasVisited = localStorage.getItem("pressure_hasVisited");
    if (!hasVisited) {
      runCalibrationSweep();
      localStorage.setItem("pressure_hasVisited", "true");
    }
  }, 300);
});
