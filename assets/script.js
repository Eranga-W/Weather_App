const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const pastWeatherCardsDiv = document.querySelector(".past-weather-cards");
const statusEl = document.querySelector(".status-message");
const appShell = document.querySelector(".app-shell");

const config = window.WEATHER_CONFIG || {};
const API_KEY = config.OPENWEATHER_API_KEY;
const PAST_API_KEY = config.WEATHERAPI_KEY;

const setStatus = (message = "", type = "") => {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status-message${type ? ` is-${type}` : ""}`;
};

const setLoading = (isLoading) => {
  appShell?.classList.toggle("is-loading", isLoading);
  searchButton.disabled = isLoading;
  locationButton.disabled = isLoading;
};

const ensureKeys = () => {
  if (!API_KEY || API_KEY.startsWith("YOUR_") || !PAST_API_KEY || PAST_API_KEY.startsWith("YOUR_")) {
    setStatus("Add your API keys in assets/config.js (copy from config.example.js).", "error");
    return false;
  }
  return true;
};

const getCityCoordinates = () => {
  if (!ensureKeys()) return;

  const cityName = cityInput.value.trim();
  if (!cityName) {
    setStatus("Enter a city name to search.", "error");
    return;
  }

  setLoading(true);
  setStatus("Looking up city…", "loading");

  const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`;

  fetch(API_URL)
    .then((response) => {
      if (!response.ok) throw new Error("Geocoding request failed");
      return response.json();
    })
    .then((data) => {
      if (!data.length) {
        setStatus(`No coordinates found for “${cityName}”.`, "error");
        setLoading(false);
        return;
      }
      const { lat, lon, name } = data[0];
      return Promise.all([
        getWeatherDetails(name, lat, lon),
        getPastWeatherDetails(lat, lon)
      ]).then(() => setStatus(`Showing weather for ${name}.`, "success"));
    })
    .catch(() => {
      setStatus("Could not fetch coordinates. Check your connection and try again.", "error");
    })
    .finally(() => setLoading(false));
};

const getUserCoordinates = () => {
  if (!ensureKeys()) return;

  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported in this browser.", "error");
    return;
  }

  setLoading(true);
  setStatus("Getting your location…", "loading");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

      fetch(API_URL)
        .then((response) => {
          if (!response.ok) throw new Error("Reverse geocoding failed");
          return response.json();
        })
        .then((data) => {
          const name = data[0]?.name || "Your location";
          return Promise.all([
            getWeatherDetails(name, latitude, longitude),
            getPastWeatherDetails(latitude, longitude)
          ]).then(() => setStatus(`Showing weather for ${name}.`, "success"));
        })
        .catch(() => {
          setStatus("Could not resolve your city name.", "error");
        })
        .finally(() => setLoading(false));
    },
    (error) => {
      setLoading(false);
      if (error.code === error.PERMISSION_DENIED) {
        setStatus("Location permission denied. Enable it in browser settings and try again.", "error");
      } else {
        setStatus("Could not get your location. Try searching by city instead.", "error");
      }
    }
  );
};

const getWeatherDetails = (cityName, latitude, longitude) => {
  const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;

  return fetch(WEATHER_API_URL)
    .then((response) => {
      if (!response.ok) throw new Error("Forecast request failed");
      return response.json();
    })
    .then((data) => {
      const uniqueForecastDays = [];
      const fiveDaysForecast = data.list.filter((forecast) => {
        const forecastDate = new Date(forecast.dt_txt).getDate();
        if (!uniqueForecastDays.includes(forecastDate)) {
          uniqueForecastDays.push(forecastDate);
          return true;
        }
        return false;
      });

      cityInput.value = "";
      currentWeatherDiv.innerHTML = "";
      weatherCardsDiv.innerHTML = "";

      fiveDaysForecast.forEach((weatherItem, index) => {
        const html = createWeatherCard(cityName, weatherItem, index);
        if (index === 0) {
          currentWeatherDiv.insertAdjacentHTML("beforeend", html);
        } else {
          weatherCardsDiv.insertAdjacentHTML("beforeend", html);
        }
      });
    })
    .catch(() => {
      setStatus("Could not fetch the weather forecast.", "error");
      throw new Error("forecast-failed");
    });
};

const createWeatherCard = (cityName, weatherItem, index) => {
  const date = weatherItem.dt_txt.split(" ")[0];
  const temp = weatherItem.main.temp.toFixed(1);
  const wind = weatherItem.wind.speed.toFixed(1);
  const humidity = weatherItem.main.humidity;
  const icon = weatherItem.weather[0].icon;
  const description = weatherItem.weather[0].description;

  if (index === 0) {
    return `<div class="details fade-in">
              <h2>${cityName}</h2>
              <p class="date-label">${date}</p>
              <h6>Temperature: ${temp}°C</h6>
              <h6>Wind: ${wind} m/s</h6>
              <h6>Humidity: ${humidity}%</h6>
            </div>
            <div class="icon fade-in">
              <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${description}">
              <h6>${description}</h6>
            </div>`;
  }

  return `<li class="card fade-in" style="--i:${index}">
            <h3>${date}</h3>
            <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${description}">
            <h6>Temp: ${temp}°C</h6>
            <h6>Wind: ${wind} m/s</h6>
            <h6>Humidity: ${humidity}%</h6>
          </li>`;
};

const getPastWeatherDetails = (latitude, longitude) => {
  const today = new Date();
  const requests = [];

  for (let i = 7; i > 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const dayReq = day.toISOString().split("T")[0];
    const WEATHER_API_URL = `https://api.weatherapi.com/v1/history.json?key=${PAST_API_KEY}&q=${latitude},${longitude}&dt=${dayReq}`;

    requests.push(
      fetch(WEATHER_API_URL)
        .then((response) => {
          if (!response.ok) throw new Error(`History HTTP ${response.status}`);
          return response.json();
        })
        .catch(() => null)
    );
  }

  return Promise.all(requests).then((results) => {
    pastWeatherCardsDiv.innerHTML = "";

    const validDays = results.filter((item) => item?.forecast?.forecastday?.[0]);
    if (!validDays.length) {
      pastWeatherCardsDiv.innerHTML = `<li class="empty-state">Historical data unavailable for this location.</li>`;
      return;
    }

    validDays.forEach((weatherItem, index) => {
      pastWeatherCardsDiv.insertAdjacentHTML(
        "beforeend",
        createPastWeatherCard(weatherItem, index)
      );
    });
  });
};

const createPastWeatherCard = (weatherItem, index = 0) => {
  const day = weatherItem.forecast.forecastday[0];
  const windMs = (day.day.maxwind_kph * (5 / 18)).toFixed(1);
  const temp = Number(day.day.avgtemp_c).toFixed(1);
  const icon = day.day.condition.icon.startsWith("//")
    ? `https:${day.day.condition.icon}`
    : day.day.condition.icon;

  return `<li class="pcard fade-in" style="--i:${index}">
            <h3>${day.date}</h3>
            <img src="${icon}" alt="${day.day.condition.text}">
            <h6>Temp: ${temp}°C</h6>
            <h6>Wind: ${windMs} m/s</h6>
            <h6>Humidity: ${day.day.avghumidity}%</h6>
          </li>`;
};

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") getCityCoordinates();
});

ensureKeys();
