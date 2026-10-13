
"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { getCurrentLocation } from "@/lib/geolocation";
import { getWeather, type WeatherData } from "../../lib/weather";
import ThemeBTN  from "@/components/ThemeBTN"
import { Search, Bookmark } from 'lucide-react';
import Link from "next/link";
import WeatherView from "@/components/WeatherView";
import { useRouter } from "next/navigation";
import ErrorView from "@/components/ErrorView";
import { getLocationErrorMessage } from "@/lib/geolocation";



export default function HomePage() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  const lastKnownLocation = useAppStore(
    (state) => state.lastKnownLocation,
  );

  const setLastKnownLocation = useAppStore(
    (state) => state.setLastKnownLocation,
  );

  const theme = useAppStore((state) => state.theme);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("Finding location...");

  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [isLocationError, setIsLocationError] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    async function loadWeather() {
      setIsLoading(true);
      setError(null);

      try {
        const coordinates =
          lastKnownLocation ?? (await getCurrentLocation());

        if (cancelled) return;

        setLastKnownLocation(coordinates);

        const data = await getWeather(coordinates);

        if (cancelled) return;

        setWeather(data);
      } catch (error) {
        if (cancelled) return;

        console.error("Home weather loading failed:", error);
        const locationError =
          error instanceof Error &&
          (error.message === "GEOLOCATION_NOT_SUPPORTED" ||
            (typeof GeolocationPositionError !== "undefined" &&
              error instanceof GeolocationPositionError));

        setIsLocationError(locationError);

        setError(
          locationError
            ? getLocationErrorMessage(error)
            : "We couldn't load your weather. Please try again or search for a city, or check and allow Cloudony to access your location",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadWeather();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, lastKnownLocation, setLastKnownLocation, retryCount]);

  useEffect(() => {
  if (!hasHydrated || !lastKnownLocation) return;

  let cancelled = false;

  async function loadLocationName() {
    try {
      const params = new URLSearchParams({
        lat: String(lastKnownLocation!.latitude),
        lon: String(lastKnownLocation!.longitude),
      });

      const response = await fetch(`/api/location-name?${params}`);

      if (!response.ok) {
        throw new Error("LOCATION_LOOKUP_FAILED");
      }

      const data: { name: string } = await response.json();

      if (!cancelled) {
        setLocationName(data.name);
      }
    } catch (error) {
      console.error("Could not resolve city name:", error);

      if (!cancelled) {
        setLocationName("Location unavailable");
      }
    }
  }

  void loadLocationName();

  return () => {
    cancelled = true;
  };
}, [hasHydrated, lastKnownLocation]);

  return (
    <main className="p-6">
      
      <nav>
        <div className="flex items-center justify-between border-b-2 border-border pb-6">
          <ThemeBTN/>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold">
              Cloudony
            </h1>
           <p style={{
                color: theme === "light" ? '#6D7789' : '#d1d5db'
              }}
            className="font-semibold cloudony-title">
              Weather, at a glance.
            </p>
          </div>
          <Link href="/search">
            <div className="relative p-2">
              {/* Blurred background layer */}
              <div className="absolute inset-0 rounded-full bg-[#DEE4F3] blur-xs" />
              
              {/* Crisp content layer */}
              <Search className="relative text-[#1F2B49]" size={19} strokeWidth={3.5} />
          </div>
          </Link>

        </div>
      </nav>
      {error ? (
        <ErrorView
          message={error}
          onTryAgain={() => setRetryCount((count) => count + 1)}
          showAccessLocation={isLocationError}
          onAccessLocation={() => setRetryCount((count) => count + 1)}
          onSearchCity={() => router.push("/search")}
        />
      ) : (
        <WeatherView
          weather={weather}
          isLoading={isLoading}
          locationName={locationName}
        />
      )}
      <Link href="saved-city">
         <div className="border-2 border-border justify-center p-3 mt-3 shadow-sm rounded-2xl items-center flex gap-1 transform transition-all duration-300 ease-out hover:scale-105 hover:shadow-md cursor-pointer">
            <Bookmark className={`${theme === "light" ? "text-[#6D7789]" : "text-gray-300"}`} size={24} strokeWidth={2} />
            <p className={`font-semibold ${theme === "light" ? "text-[#6D7789]" : "text-gray-300"}`}>Saved Cities</p>
        </div>

      </Link>
    </main>
  );
}
