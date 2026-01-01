const ddlUnits = document.querySelector("#ddlunits");
const ddlDay = document.querySelector("#ddlDay");
const txtSearch = document.querySelector("#txtSearch");
const btnSearch = document.querySelector("#btnSearch");
const dvCityCountry = document.querySelector("#dvCityCountry");
const dvCurrentDate = document.querySelector("#dvCurrentDate");
const dvCurrentTemp = document.querySelector("#dvCurrentTemp");
const pFeelsLike = document.querySelector("#pFeelsLike");
const phumidity = document.querySelector("#phumidity");
const pWind = document.querySelector("#pWind");
const pPrecipitation = document.querySelector("#pPrecipitation");
let cityName, countryName, weatherData;

// Get user's current location on page load
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log("User location:", lat, lon);

        // Get location name from coordinates
        await getReverseGeoData(lat, lon);
        await getWeatherData(lat, lon);
      },
      (error) => {
        console.error("Geolocation error:", error.message);
        // Fallback to default location if user denies permission
        txtSearch.value = "Berlin";
        getGeoData();
      }
    );
  } else {
    console.log("Geolocation not supported");
    // Fallback to default location
    txtSearch.value = "Berlin";
    getGeoData();
  }
}

// Reverse geocoding to get location name from coordinates
async function getReverseGeoData(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Reverse Location Data:", result);

    loadLocationDataFromReverse(result);
  } catch (error) {
    console.error("Error fetching reverse geo data:", error.message);
  }
}

function loadLocationDataFromReverse(locationData) {
  let location = locationData.address;

  // Handle different location types (city, town, county, etc.)
  cityName =
    location.city ||
    location.town ||
    location.county ||
    location.state ||
    location.village;
  countryName = location.country;

  let dateOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "long",
  };

  let date = new Intl.DateTimeFormat("en-US", dateOptions).format(new Date());

  console.log("City:", cityName, "Country:", countryName);

  dvCityCountry.textContent = `${cityName}, ${countryName}`;
  dvCurrentDate.textContent = date;
}

async function getGeoData() {
  let search = txtSearch.value;
  if (!search || search.trim() === "") {
    console.log("No search term provided");
    return;
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${search}&format=jsonv2&addressdetails=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Location Data:", result);

    if (result.length === 0) {
      throw new Error("No location found");
    }

    let lat = result[0].lat;
    let lon = result[0].lon;

    loadLocationData(result);
    await getWeatherData(lat, lon);
  } catch (error) {
    console.error("Error fetching geo data:", error.message);
  }
}

function loadLocationData(locationData) {
  let location = locationData[0].address;

  // Handle different location types (city, town, county, etc.)
  cityName =
    location.city || location.town || location.county || location.state;
  countryName = location.country;

  let dateOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "long",
  };

  let date = new Intl.DateTimeFormat("en-US", dateOptions).format(new Date());

  console.log("City:", cityName, "Country:", countryName);

  dvCityCountry.textContent = `${cityName}, ${countryName}`;
  dvCurrentDate.textContent = date;
}

async function getWeatherData(lat, lon) {
  let tempUnit = "celsius";
  let windUnit = "kmh";
  let precipUnit = "mm";

  // Check if toggle is set to Fahrenheit
  if (ddlUnits && ddlUnits.value === "F") {
    tempUnit = "fahrenheit";
    windUnit = "mph";
    precipUnit = "inch";
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    weatherData = await response.json();
    console.log("Weather Data:", weatherData);

    // Process weather data here
    displayWeatherData();
    loadDailyForecast();
    loadHourlyForecast();
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
  }
}

function displayWeatherData() {
  dvCurrentTemp.textContent = Math.round(weatherData.current.temperature_2m);

  pFeelsLike.textContent = Math.round(weatherData.current.apparent_temperature);

  phumidity.textContent = weatherData.current.relative_humidity_2m;

  pWind.textContent = `${
    weatherData.current.wind_speed_10m
  } ${weatherData.current_units.wind_speed_10m.replace("mp/h", "mph")}`;

  pPrecipitation.textContent = `${
    weatherData.current.precipitation
  } ${weatherData.current_units.precipitation.replace("inch", "in")}`;

  console.log("Current Temperature:", weatherData.current.temperature_2m);
  console.log("Humidity:", weatherData.current.relative_humidity_2m + "%");
  console.log("Feels Like:", weatherData.current.apparent_temperature);
  console.log("Wind Speed:", weatherData.current.wind_speed_10m);
  console.log("Precipitation:", weatherData.current.precipitation);
}

function loadDailyForecast() {
  for (let i = 0; i < 7; i++) {
    let date = new Date(weatherData.daily.time[i]);
    let dayOfWeek = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
    }).format(date);

    let dvForecastDay = document.querySelector(`#dvForecastDay${i + 1}`);

    // Clear previous content
    if (dvForecastDay) {
      dvForecastDay.innerHTML = "";
    }

    let weatherCodeName = getWeatherCodeName(weatherData.daily.weather_code[i]);
    let dailyHigh = Math.round(weatherData.daily.temperature_2m_max[i]) + "°";
    let dailyLow = Math.round(weatherData.daily.temperature_2m_min[i]) + "°";

    addDailyElement(
      "p",
      "daily_day_title",
      dayOfWeek,
      "",
      dvForecastDay,
      "afterbegin"
    );
    addDailyElement(
      "img",
      "daily_day_icon",
      "",
      weatherCodeName,
      dvForecastDay,
      "beforeend"
    );

    addDailyElement(
      "div",
      "daily_day_temps",
      "",
      "",
      dvForecastDay,
      "beforeend"
    );

    let dvDailyTemps = document.querySelector(
      `#dvForecastDay${i + 1} .daily_day_temps`
    );
    addDailyElement(
      "p",
      "daily_day_high",
      dailyHigh,
      "",
      dvDailyTemps,
      "afterbegin"
    );
    addDailyElement(
      "p",
      "daily_day_low",
      dailyLow,
      "",
      dvDailyTemps,
      "beforeend"
    );
  }
}

function addDailyElement(
  tag,
  className,
  content,
  weatherCodeName,
  parentElement,
  position
) {
  if (!parentElement) return;

  const newElement = document.createElement(tag);
  newElement.setAttribute("class", className);
  if (content !== "") {
    const newContent = document.createTextNode(content);
    newElement.appendChild(newContent);
  }
  if (tag === "img") {
    newElement.setAttribute(
      "src",
      `./assets/images/icon-${weatherCodeName}.webp`
    );
    newElement.setAttribute("alt", weatherCodeName);
    newElement.setAttribute("width", "320");
    newElement.setAttribute("height", "320");
  }
  parentElement.insertAdjacentElement(position, newElement);
}

function loadHourlyForecast() {
  let dayIndex = parseInt(ddlDay.value) || 0;
  console.log(`Day ${dayIndex + 1}`);

  let firstHour = 24 * dayIndex;
  let lastHour = 24 * (dayIndex + 1) - 1;
  let weatherCodes = weatherData.hourly.weather_code;
  let temps = weatherData.hourly.temperature_2m;
  let hours = weatherData.hourly.time;

  // Clear all hourly forecast divs first
  for (let h = 1; h <= 24; h++) {
    let dvForecastHour = document.querySelector(`#dvForecastHour${h}`);
    if (dvForecastHour) {
      dvForecastHour.innerHTML = "";
    }
  }

  let elementIndex = 1;
  for (let h = firstHour; h <= lastHour; h++) {
    let weatherCodeName = getWeatherCodeName(weatherCodes[h]);
    let temp = Math.round(temps[h]) + "°";
    let hour = new Date(hours[h]).toLocaleString("en-US", {
      hour: "numeric",
      hour12: true,
    });

    let dvForecastHour = document.querySelector(
      `#dvForecastHour${elementIndex}`
    );

    if (dvForecastHour) {
      addDailyElement(
        "img",
        "hourly_hour_icon",
        "",
        weatherCodeName,
        dvForecastHour,
        "afterbegin"
      );
      addDailyElement(
        "p",
        "hourly_hour_time",
        hour,
        "",
        dvForecastHour,
        "beforeend"
      );
      addDailyElement(
        "p",
        "hourly_hour_temp",
        temp,
        "",
        dvForecastHour,
        "beforeend"
      );
    }

    elementIndex++;
  }
}

function getWeatherCodeName(code) {
  const weatherCodes = {
    0: "sunny",
    1: "partly-cloudy",
    2: "partly-cloudy",
    3: "overcast",
    45: "fog",
    48: "fog",
    51: "drizzle",
    52: "drizzle",
    53: "drizzle",
    55: "drizzle",
    56: "drizzle",
    57: "drizzle",
    61: "rain",
    63: "rain",
    65: "rain",
    66: "rain",
    67: "rain",
    80: "rain",
    81: "rain",
    82: "rain",
    71: "snow",
    73: "snow",
    75: "snow",
    77: "snow",
    85: "snow",
    86: "snow",
    95: "storm",
    96: "storm",
    99: "storm",
  };

  return weatherCodes[code] || "sunny";
}

function populateDayOfWeek() {
  let currDate = new Date();
  let currDay;

  for (let i = 0; i < 7; i++) {
    currDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
      currDate
    );

    const newOption = document.createElement("option");
    const dayOfWeek = document.createTextNode(currDay);

    newOption.setAttribute("class", "hourly_select");
    newOption.setAttribute("value", i);
    newOption.appendChild(dayOfWeek);

    ddlDay.insertAdjacentElement("beforeend", newOption);

    currDate.setDate(currDate.getDate() + 1);
  }
}

// Initialize the app
populateDayOfWeek();
getUserLocation(); // Get user's location on page load

btnSearch.addEventListener("click", getGeoData);
ddlUnits.addEventListener("change", () => {
  // Refresh weather data with new units
  if (weatherData) {
    const currentCity = cityName;
    const currentCountry = countryName;
    if (currentCity && currentCountry) {
      txtSearch.value = `${currentCity}, ${currentCountry}`;
      getGeoData();
    }
  }
});
ddlDay.addEventListener("change", loadHourlyForecast);
