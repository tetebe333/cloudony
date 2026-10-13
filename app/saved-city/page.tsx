
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Minus, MapPin, CloudSun, LoaderCircle } from "lucide-react";

import { useAppStore } from "@/store/appStore";
import {
  getWeather,
  getWeatherCondition,
  getDailyCondition,
  type WeatherData,
} from "@/lib/weather";
import { getWeatherImage } from "@/lib/weather-image";

type CityWeather = {
  weather: WeatherData | null;
  error: boolean;
};

export default function SavedCityPage() {
  const router = useRouter();

  const savedCities = useAppStore((state) => state.savedCities);
  const removeSavedCity = useAppStore((state) => state.removeSavedCity);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  // const theme = useAppStore((state) => state.theme);

  const [cityWeather, setCityWeather] = useState<
    Record<string, CityWeather>
  >({});
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Load the latest weather for every saved city.
  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    async function loadSavedCitiesWeather() {
      setLoadingWeather(true);

      const results = await Promise.all(
        savedCities.map(async (city) => {
          try {
            const weather = await getWeather({
              latitude: city.latitude,
              longitude: city.longitude,
            });

            return [
              city.id,
              { weather, error: false },
            ] as const;
          } catch (error) {
            console.error(
              `Could not load weather for ${city.name}:`,
              error,
            );

            return [
              city.id,
              { weather: null, error: true },
            ] as const;
          }
        }),
      );

      if (!cancelled) {
        setCityWeather(Object.fromEntries(results));
        setLoadingWeather(false);
      }
    }

    void loadSavedCitiesWeather();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, savedCities]);

  function openCity(city: (typeof savedCities)[number]) {
    const params = new URLSearchParams({
      id: city.id,
      name: city.name,
      latitude: String(city.latitude),
      longitude: String(city.longitude),
    });

    if (city.country) {
      params.set("country", city.country);
    }

    if (city.admin1) {
      params.set("admin1", city.admin1);
    }

    router.push(`/city?${params.toString()}`);
  }

  if (!hasHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <LoaderCircle className="h-7 w-7 animate-spin text-accent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className=" w-full  px-4 pb-12 pt-5 sm:px-6 sm:pt-8">
        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition hover:opacity-75"
          >
            <ArrowLeft size={21} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Saved Cities
            </h1>
            <p className="mt-1 text-sm text-muted">
              Keep an eye on the weather in your favourite places.
            </p>
          </div>

          {savedCities.length > 0 && (
            <Link
              href="/saved-city/add-city"
              aria-label="Add a city"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:opacity-85"
            >
              <Plus size={23} />
            </Link>
          )}
        </header>

        {/* Empty state */}
        {savedCities.length === 0 ? (
          <section className="flex min-h-[55vh] flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-surface">
              <MapPin size={42} strokeWidth={1.5} className="text-muted" />
            </div>

            <h2 className="text-xl font-semibold">
              No saved cities yet
            </h2>

            <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
              Add a city to keep track of its weather whenever you need it.
            </p>

            <Link
              href="/saved-city/add-city"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:opacity-85"
            >
              <Plus size={19} />
              Add a city
            </Link>
          </section>
        ) : (
          <section aria-label="Your saved cities" className="space-y-4">
            <p className="text-sm text-muted">
              {savedCities.length}{" "}
              {savedCities.length === 1 ? "city" : "cities"} saved
            </p>

            {[...savedCities].reverse().map((city) => {
              const result = cityWeather[city.id];
              const weather = result?.weather;
              const current = weather?.current;

              const condition = current
                ? getWeatherCondition(
                    current.weatherCode,
                    current.isDay,
                  )
                : null;

              const today = weather?.daily[0];
              const dailyCondition = today
                ? getDailyCondition(today)
                : null;

              const imagePath = condition
                ? getWeatherImage(condition.kind)
                : null;

              return (
                <article
                  key={city.id}
                  className="overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-accent/50"
                >
                  <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
                    {/* City information opens the City screen */}
                    <button
                      type="button"
                      onClick={() => openCity(city)}
                      aria-label={`View weather for ${city.name}`}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
                    >
                      <div className="flex h-17 w-17 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-background sm:h-20 sm:w-20">
                        {imagePath ? (
                          <Image
                            src={imagePath}
                            alt={condition?.label ?? "Weather"}
                            width={72}
                            height={72}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <CloudSun
                            size={35}
                            strokeWidth={1.5}
                            className="text-muted"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-semibold">
                          {city.name}
                        </h2>

                        <p className="mt-0.5 truncate text-sm text-muted">
                          {[city.admin1, city.country]
                            .filter(Boolean)
                            .join(", ") || "Saved location"}
                        </p>

                        {current ? (
                          <>
                            <p className="mt-2 text-sm font-medium">
                              {condition?.label ?? "Current weather"}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              {today && dailyCondition
                                ? `H: ${Math.round(today.maxTemperature)}°  ·  L: ${Math.round(today.minTemperature)}°`
                                : "Today's forecast unavailable"}
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 text-xs text-muted">
                            {loadingWeather && !result
                              ? "Loading weather..."
                              : result?.error
                                ? "Weather unavailable"
                                : "Getting weather..."}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 self-start pt-1 text-right">
                        {current ? (
                          <span className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            {Math.round(current.temperature)}°
                          </span>
                        ) : loadingWeather && !result ? (
                          <LoaderCircle
                            size={21}
                            className="animate-spin text-muted"
                          />
                        ) : (
                          <span className="text-sm text-muted">--°</span>
                        )}
                      </div>
                    </button>

                    {/* Remove is separate from opening the city */}
                    <button
                      type="button"
                      onClick={() => removeSavedCity(city.id)}
                      aria-label={`Remove ${city.name}`}
                      title="Remove"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Minus size={20} />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="mt-10 text-center text-xs text-muted">
          Cloudony · Weather for the places you care about
        </footer>
      </div>
    </main>
  );
}
