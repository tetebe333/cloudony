
import type { WeatherKind } from "@/lib/weather";

const weatherImages: Record<WeatherKind, string> = {
  sunny: "/images/weather/sunny.png",
  "clear-night": "/images/weather/clear-night.png",
  "partly-cloudy": "/images/weather/partly-cloudy.png",
  cloudy: "/images/weather/cloudy.png",
  fog: "/images/weather/fog.png",
  drizzle: "/images/weather/drizzle.png",
  rain: "/images/weather/rain.png",
  snow: "/images/weather/snow.png",
  thunderstorm: "/images/weather/thunderstorm.png",
};

export function getWeatherImage(kind: WeatherKind): string {
  return weatherImages[kind];
}
