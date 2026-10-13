export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type CurrentWeather = {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  isDay: boolean;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weatherCode: number;
  cloudCover: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
};

export type DailyForecast = {
  date: string;
  weatherCode: number;
  maxTemperature: number;
  minTemperature: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
  precipitationProbabilityMax: number;
  precipitationSum: number;
  windSpeedMax: number;
};

export type HourlyForecast = {
  time: string[];
  temperature: number[];
  humidity: number[];
  precipitationProbability: number[];
  precipitation: number[];
  weatherCode: number[];
  windSpeed: number[];
};


export type WeatherKind =
  | "sunny"
  | "clear-night"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

export type WeatherCondition = {
  label: string;
  kind: WeatherKind;
};


export type WeatherData = {
  coordinates: Coordinates;
  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast[];
  fetchedAt: number;
};


export function getWeatherCondition(
  weatherCode: number,
  isDay = true,
): WeatherCondition {
  switch (weatherCode) {
    case 0:
      return isDay
        ? { label: "Clear sky", kind: "sunny" }
        : { label: "Clear sky", kind: "clear-night" };

    case 1:
      return { label: "Mainly clear", kind: "sunny" };

    case 2:
      return { label: "Partly cloudy", kind: "partly-cloudy" };

    case 3:
      return { label: "Overcast", kind: "cloudy" };

    case 45:
    case 48:
      return { label: "Fog", kind: "fog" };

    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: "Drizzle", kind: "drizzle" };

    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return { label: "Rain", kind: "rain" };

    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: "Snow", kind: "snow" };

    case 95:
    case 96:
    case 97:
    case 99:
      return { label: "Thunderstorm", kind: "thunderstorm" };

    default:
      return { label: "Unknown conditions", kind: "cloudy" };
  }
}


export function getDailyCondition(
  forecast: DailyForecast,
): WeatherCondition {
  return getWeatherCondition(forecast.weatherCode);
}


export function getDailyNoonTemperature(
  forecast: DailyForecast,
  hourly: HourlyForecast,
): number | null {
  const targetTime = `${forecast.date}T12:00`;

  const index = hourly.time.findIndex(
    (time) => time === targetTime,
  );

  if (index === -1) {
    return null;
  }

  return hourly.temperature[index];
}




type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;

  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    is_day: number;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };

  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };

  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
};

export async function getWeather(
  coordinates: Coordinates,
  signal?: AbortSignal,
): Promise<WeatherData> {
  const { latitude, longitude } = coordinates;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("INVALID_COORDINATES");
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "is_day",
      "precipitation",
      "rain",
      "showers",
      "snowfall",
      "weather_code",
      "cloud_cover",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
    ].join(","),

    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
    ].join(","),

    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_speed_10m_max",
    ].join(","),

    timezone: "auto",
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    {
      signal,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "WEATHER_RATE_LIMIT"
        : "WEATHER_API_ERROR",
    );
  }

  const data = (await response.json()) as OpenMeteoResponse;

  if (
    !data.current ||
    !data.hourly ||
    !data.daily ||
    data.daily.time.length !== 7
  ) {
    throw new Error("INVALID_WEATHER_RESPONSE");
  }

  const weather: WeatherData ={
    coordinates: {
      latitude: data.latitude,
      longitude: data.longitude,
    },

    timezone: data.timezone,
    timezoneAbbreviation: data.timezone_abbreviation,
    utcOffsetSeconds: data.utc_offset_seconds,

    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      isDay: data.current.is_day === 1,
      precipitation: data.current.precipitation,
      rain: data.current.rain,
      showers: data.current.showers,
      snowfall: data.current.snowfall,
      weatherCode: data.current.weather_code,
      cloudCover: data.current.cloud_cover,
      pressure: data.current.pressure_msl,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      windGusts: data.current.wind_gusts_10m,
    },

    hourly: {
      time: data.hourly.time,
      temperature: data.hourly.temperature_2m,
      humidity: data.hourly.relative_humidity_2m,
      precipitationProbability: data.hourly.precipitation_probability,
      precipitation: data.hourly.precipitation,
      weatherCode: data.hourly.weather_code,
      windSpeed: data.hourly.wind_speed_10m,
    },

    daily: data.daily.time.map((date, index) => ({
      date,
      weatherCode: data.daily.weather_code[index],
      maxTemperature: data.daily.temperature_2m_max[index],
      minTemperature: data.daily.temperature_2m_min[index],
      sunrise: data.daily.sunrise[index],
      sunset: data.daily.sunset[index],
      uvIndexMax: data.daily.uv_index_max[index],
      precipitationProbabilityMax:
        data.daily.precipitation_probability_max[index],
      precipitationSum: data.daily.precipitation_sum[index],
      windSpeedMax: data.daily.wind_speed_10m_max[index],
    })),

    fetchedAt: Date.now(),
  };

  console.log("Cloudony weather data:", weather);
  console.log(
    "Weather condition:",
    getWeatherCondition(weather.current.weatherCode, weather.current.isDay),
  );


console.log(
  "Today's condition:",
  getDailyCondition(weather.daily[0]),
);

console.log(
  "Today's noon temperature:",
  getDailyNoonTemperature(weather.daily[0], weather.hourly),
);

console.log(
  "Tomorrow's condition:",
  getDailyCondition(weather.daily[1]),
);

console.log(
  "Tomorrow's noon temperature:",
  getDailyNoonTemperature(weather.daily[1], weather.hourly),
);


  return weather;
}