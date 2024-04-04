const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const pastweatherCardsDiv = document.querySelector(".past-weather-cards");

const API_KEY = "3eb8046a7baf0f9e78d8b75f81493fec";
const past_API_KEY = "7bf9b13e678e427fa00144032240404";

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;


    fetch(API_URL).then(response => response.json()).then(data => {
        if (!data.length) return alert(`No coordinates found for ${cityName}`);
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
        getPastWeatherDetails(name, lat, lon);
    }).catch(() => {
        alert("An error occurred while fetching the coordinates!");
    });
}

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL).then(response => response.json()).then(data => {
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
                getPastWeatherDetails(name, latitude, longitude);
            }).catch(() => {
                alert("An error occurred while fetching the city name!");
            });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
}

const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL).then(response => response.json()).then(data => {
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
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
    }).catch(() => {
        alert("An error occurred while fetching the weather forecast!");
    });
}

const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) {
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} m/s</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else {
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} m/s</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
}

const getPastWeatherDetails = (latitude, longitude) => {
    // const today = new Date();
    
    // const sevenDaysForecastPromises = [];
    // for (let i = 7; i > 0; i--) {
    //     const day = new Date();
    //     day.setDate(today.getDate() - i);
    //     const dayReq = day.toISOString().split('T')[0];
    //     console.log(dayReq);

    //     const WEATHER_API_URL = `https://api.weatherapi.com/v1/history.json?key=${past_API_KEY}&q=${latitude},${longitude}&dt=${dayReq}`;
    //     sevenDaysForecastPromises.push(
    //         fetch(WEATHER_API_URL)
    //             .then(response => {
    //                 if (!response.ok) {
    //                     throw new Error(`HTTP error! Status: ${response.status}`);
    //                 }
    //                 return response.json();
    //             })
    //             .catch(error => {
    //                 console.error('Error fetching historical weather data:', error);
    //                 return { error: true, message: 'An error occurred while fetching historical weather data.' };
    //             })
    //     );
    // }

    // Promise.all(sevenDaysForecastPromises)
    //     .then(sevenDaysForecast => {
    //         cityInput.value = "";
    //         currentWeatherDiv.innerHTML = "";
    //         weatherCardsDiv.innerHTML = "";

    //         sevenDaysForecast.forEach((weatherItem) => {
    //             if (!weatherItem.error) {
    //                 const html = createPastWeatherCard(weatherItem);
    //                 pastweatherCardsDiv.insertAdjacentHTML("beforeend", html);
    //             } else {
    //                 alert(weatherItem.message); // Display error message to user
    //             }
    //         });
    //     })
    //     .catch(error => {
    //         alert('An error occurred while processing historical weather data.'); // Display generic error message to user
    //     });
}
const createPastWeatherCard = (weatherItem) => {

    // console.log(weatherItem);

    // const html = `<li class="pcard">
    //                 <h3>(${weatherItem.forecast.forecastday.date})</h3>
    //                 <img src=${weatherItem.forecast.forecastday.day.condition.icon} alt="weather-icon">
    //                 <h6>Temp: ${(weatherItem.forecast.forecastday.day.avgtemp_c).toFixed(2)}°C</h6>
    //                 <h6>Wind: ${(weatherItem.forecast.forecastday.day.maxwind_kph * (5 / 18)).toFixed(2)} m/s</h6>
    //                 <h6>Humidity: ${weatherItem.forecast.forecastday.day.avghumidity}%</h6>
    //              </li>`;
    // console.log(html);
    // return html;
}


locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());