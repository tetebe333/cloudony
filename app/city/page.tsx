
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bookmark, MapPin, LoaderCircle } from "lucide-react";
import Link from "next/link";

import { useAppStore } from "@/store/appStore";
import { getWeather, type WeatherData } from "@/lib/weather";
import ThemeBTN from "@/components/ThemeBTN";
import WeatherView from "@/components/WeatherView";

function CityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const theme = useAppStore((state) => state.theme);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  // const lastKnownLocation = useAppStore(
  //   (state) => state.lastKnownLocation,
  // );

  const id = searchParams.get("id") ?? "";
  const name = searchParams.get("name") ?? "";
  const latitudeParam = searchParams.get("latitude");
  const longitudeParam = searchParams.get("longitude");
  const country = searchParams.get("country") ?? "";
  const admin1 = searchParams.get("admin1") ?? "";

  const latitude = Number(latitudeParam);
  const longitude = Number(longitudeParam);

  const validCoordinates =
    latitudeParam !== null &&
    longitudeParam !== null &&
    latitudeParam.trim() !== "" &&
    longitudeParam.trim() !== "" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasHydrated) return;

    if (!name || !validCoordinates) {
      return;
    }

    let cancelled = false;

    async function loadCityWeather() {
      setIsLoading(true);
      setError("");
      setWeather(null);

      try {
        const data = await getWeather({
          latitude,
          longitude,
        });

        if (!cancelled) {
          setWeather(data);
        }
      } catch (err) {
        console.error("City weather loading failed:", err);

        if (!cancelled) {
          setError(
            "We couldn't load this city's weather. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCityWeather();

    return () => {
      cancelled = true;
    };
  }, [
    hasHydrated,
    id,
    name,
    latitude,
    longitude,
    validCoordinates,
  ]);

  const locationName = [name, admin1, country]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(", ");

  // function openCurrentCity() {
  //   if (!lastKnownLocation) {
  //     router.push("/home");
  //     return;
  //   }

  //   const params = new URLSearchParams({
  //     id: "current-location",
  //     name: "My Current City",
  //     latitude: String(lastKnownLocation.latitude),
  //     longitude: String(lastKnownLocation.longitude),
  //   });

  //   router.push(`/city?${params.toString()}`);
  // }

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      {/* Header: same branding as Home */}
      <nav>
        <div className="flex items-center justify-between border-b-2 border-border pb-6">
           <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="relative rounded-full p-2"
          >
            <span className="absolute inset-0 rounded-full bg-[#DEE4F3] blur-xs" />
            <ArrowLeft
              className="relative text-[#1F2B49]"
              size={22}
              strokeWidth={3}
            />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold">Cloudony</h1>
            <p
              style={{
                color: theme === "light" ? "#6D7789" : "#d1d5db",
              }}
              className="font-semibold cloudony-title"
            >
              Weather, at a glance.
            </p>
          </div>
          <ThemeBTN />
        </div>
      </nav>
      
      {/* Selected city's weather */}
      {!hasHydrated || (isLoading && !weather) ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted">
          <LoaderCircle className="h-8 w-8 animate-spin text-accent" />
          <p>Loading {name || "city"} weather...</p>
        </div>
      ) : error ? (
        <div className="mt-8 text-center">
          <p role="alert" className="text-red-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-4 rounded-xl bg-accent px-5 py-3 font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : (
        <WeatherView
          weather={weather}
          isLoading={isLoading}
          locationName={locationName || "Selected City"}
        />
      )}
       {/* Navigation buttons */}
      <div className="mt-4 grid grid-cols-1 gap-3">
        <Link href="/saved-city" className="block">
          <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border p-3 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md">
            <Bookmark
              className={
                theme === "light" ? "text-[#6D7789]" : "text-gray-300"
              }
              size={22}
            />
            <span
              className={`font-semibold ${
                theme === "light" ? "text-[#6D7789]" : "text-gray-300"
              }`}
            >
              Saved Cities
            </span>
          </div>
        </Link>

          
        <Link href="/home">
          <div
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border p-3 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md"
          >
            <MapPin
              className={
                theme === "light" ? "text-[#6D7789]" : "text-gray-300"
              }
              size={22}
            />
            <span
              className={`font-semibold ${
                theme === "light" ? "text-[#6D7789]" : "text-gray-300"
              }`}
            >
              My Current City
            </span>
          </div>
        </Link>

      </div>
    </main>
  );
}

export default function CityPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <LoaderCircle className="h-8 w-8 animate-spin text-accent" />
        </main>
      }
    >
      <CityPageContent />
    </Suspense>
  );
}
