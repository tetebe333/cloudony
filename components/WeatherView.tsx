
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Droplets,
  Thermometer,
  Wind,
  Sun,
  CloudRain,
  Gauge,
} from "lucide-react";

import {
  getWeatherCondition,
  getDailyCondition,
  getDailyNoonTemperature,
  type WeatherData,
} from "@/lib/weather";

import { getWeatherImage } from "@/lib/weather-image";

type WeatherViewProps = {
  weather: WeatherData | null;
  isLoading: boolean;
  locationName?: string;
};

function formatDay(date: string, index: number) {
  if (index === 0) return "Today";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en", {
    weekday: "short",
  });
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function WeatherPlaceholder({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`inline-block h-5 w-16 animate-pulse rounded-md bg-slate-300/60 dark:bg-slate-700/60 ${className}`}
    />
  );
}

export default function WeatherView({
  weather,
  isLoading,
  locationName = "Your location",
}: WeatherViewProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [failedImagePath, setFailedImagePath] = useState<string | null>(
    null,
  );

  // Derive the valid selected day instead of resetting it in an effect.
  const activeSelectedDay = weather
    ? Math.min(selectedDay, Math.max(weather.daily.length - 1, 0))
    : 0;

  const forecast = weather?.daily[activeSelectedDay];

  const condition =
    weather && forecast
      ? activeSelectedDay === 0
        ? getWeatherCondition(
            weather.current.weatherCode,
            weather.current.isDay,
          )
        : getDailyCondition(forecast)
      : null;

  const selectedTemperature =
    weather && forecast
      ? activeSelectedDay === 0
        ? weather.current.temperature
        : getDailyNoonTemperature(forecast, weather.hourly) ??
          Math.round(
            (forecast.maxTemperature + forecast.minTemperature) / 2,
          )
      : null;

  const imagePath = condition
    ? getWeatherImage(condition.kind)
    : null;

  // The failed state belongs to a specific image path.
  // When the path changes, the new image can display without an effect.
  const imageFailed =
    imagePath !== null && failedImagePath === imagePath;

  return (
    <section className=" w-full  space-y-5 py-6">
      {/* Main weather card */}
      <div className="overflow-hidden rounded-4xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <p className="text-2xl font-semibold text-muted">
            {locationName}
          </p>

          <p className="mt-1 text-sm text-muted">
            {forecast ? formatDate(forecast.date) : "Your local weather"}
          </p>

          <div className="my-5 flex min-h-40 items-center justify-center">
            {isLoading ? (
              <div className="h-36 w-36 animate-pulse rounded-full bg-slate-300/40 dark:bg-slate-700/40" />
            ) : imagePath && !imageFailed ? (
              <Image
                src={imagePath}
                alt={condition?.label ?? "Weather condition"}
                width={180}
                height={180}
                priority
                className="h-36 w-36 object-contain sm:h-44 sm:w-44"
                onError={() => setFailedImagePath(imagePath)}
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-full bg-background text-sm text-muted">
                {imageFailed ? "Image unavailable" : "Weather"}
              </div>
            )}
          </div>

          <div className="flex items-start justify-center">
            {isLoading || selectedTemperature === null ? (
              <WeatherPlaceholder className="h-14 w-32" />
            ) : (
              <span className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl">
                {Math.round(selectedTemperature)}°
              </span>
            )}

            <span className="ml-1 mt-2 text-xl text-muted">C</span>
          </div>

          <p className="mt-3 text-lg font-semibold text-foreground">
            {isLoading ? (
              <WeatherPlaceholder />
            ) : (
              condition?.label ?? "Weather unavailable"
            )}
          </p>

          <div className="mt-3 flex justify-center gap-4 text-sm text-muted">
            <span>
              H:{" "}
              {isLoading || !forecast ? (
                <WeatherPlaceholder />
              ) : (
                `${Math.round(forecast.maxTemperature)}°`
              )}
            </span>

            <span>
              L:{" "}
              {isLoading || !forecast ? (
                <WeatherPlaceholder />
              ) : (
                `${Math.round(forecast.minTemperature)}°`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Seven-day forecast */}
      <div className="rounded-4xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-foreground">
          7-Day Forecast
        </h2>

        <div className="flex gap-3 justify-between overflow-x-auto pb-2">
          {weather?.daily.map((day, index) => {
            const dayCondition = getDailyCondition(day);
            const active = activeSelectedDay === index;
            const dayImagePath = getWeatherImage(dayCondition.kind);

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDay(index)}
                aria-pressed={active}
                className={`flex min-w-19 flex-col items-center gap-3 rounded-2xl border p-3 transition-colors ${
                  active
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-background"
                }`}
              >
                <span className="text-sm font-semibold text-foreground">
                  {formatDay(day.date, index)}
                </span>

                <Image
                  src={dayImagePath}
                  alt={dayCondition.label}
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />

                <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                  {Math.round(day.maxTemperature)}°
                </span>

                <span className="text-xs text-muted">
                  {Math.round(day.minTemperature)}°
                </span>
              </button>
            );
          })}

          {isLoading &&
            Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="flex min-w-19 flex-col items-center gap-4 rounded-2xl border border-border p-3"
              >
                <WeatherPlaceholder className="w-10" />
                <WeatherPlaceholder className="h-10 w-10 rounded-full" />
                <WeatherPlaceholder className="w-8" />
              </div>
            ))}
        </div>
      </div>

      {/* Weather details */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-foreground">
          Weather Details
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DetailCard
            icon={<Thermometer size={20} />}
            label="Feels Like"
            value={
              isLoading || !weather
                ? null
                : `${Math.round(
                    activeSelectedDay === 0
                      ? weather.current.apparentTemperature
                      : selectedTemperature ?? weather.current.temperature,
                  )}°C`
            }
          />

          <DetailCard
            icon={<Droplets size={20} />}
            label="Humidity"
            value={
              isLoading || !weather
                ? null
                : activeSelectedDay === 0
                  ? `${weather.current.humidity}%`
                  : "—"
            }
          />

          <DetailCard
            icon={<Wind size={20} />}
            label="Wind Speed"
            value={
              isLoading || !weather || !forecast
                ? null
                : `${Math.round(
                    activeSelectedDay === 0
                      ? weather.current.windSpeed
                      : forecast.windSpeedMax,
                  )} km/h`
            }
          />

          <DetailCard
            icon={<Sun size={20} />}
            label="UV Index"
            value={
              isLoading || !forecast
                ? null
                : forecast.uvIndexMax.toFixed(1)
            }
          />

          <DetailCard
            icon={<CloudRain size={20} />}
            label="Rain Chance"
            value={
              isLoading || !forecast
                ? null
                : `${forecast.precipitationProbabilityMax}%`
            }
          />

          <DetailCard
            icon={<Gauge size={20} />}
            label="Pressure"
            value={
              isLoading || !weather
                ? null
                : activeSelectedDay === 0
                  ? `${Math.round(weather.current.pressure)} hPa`
                  : "—"
            }
          />
        </div>
      </div>
    </section>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-muted">
        {icon}
        <span className="text-sm">{label}</span>
      </div>

      <p className="text-xl font-bold text-foreground">
        {value === null ? <WeatherPlaceholder /> : value}
      </p>
    </div>
  );
}
