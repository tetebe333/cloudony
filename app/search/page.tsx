
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpLeft,
  Clock3,
  LoaderCircle,
  MapPin,
  Search,
  X,
} from "lucide-react";

import { useAppStore } from "@/store/appStore";

// A city returned by Open-Meteo.
type CityOption = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

type GeocodingResponse = {
  results?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    country_code?: string;
    admin1?: string;
  }[];
};

// Popular cities shown before the user starts searching.
const TOP_CITIES: CityOption[] = [
  {
    id: "top-tokyo",
    name: "Tokyo",
    latitude: 35.6762,
    longitude: 139.6503,
    country: "Japan",
  },
  {
    id: "top-london",
    name: "London",
    latitude: 51.5072,
    longitude: -0.1276,
    country: "United Kingdom",
  },
  {
    id: "top-new-york",
    name: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    country: "United States",
  },
  {
    id: "top-paris",
    name: "Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    country: "France",
  },
  {
    id: "top-dubai",
    name: "Dubai",
    latitude: 25.2048,
    longitude: 55.2708,
    country: "United Arab Emirates",
  },
  {
    id: "top-lagos",
    name: "Lagos",
    latitude: 6.5244,
    longitude: 3.3792,
    country: "Nigeria",
  },
  {
    id: "top-singapore",
    name: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
    country: "Singapore",
  },
  {
    id: "top-sydney",
    name: "Sydney",
    latitude: -33.8688,
    longitude: 151.2093,
    country: "Australia",
  },
  {
    id: "top-cape-town",
    name: "Cape Town",
    latitude: -33.9249,
    longitude: 18.4241,
    country: "South Africa",
  },
  {
    id: "top-toronto",
    name: "Toronto",
    latitude: 43.6532,
    longitude: -79.3832,
    country: "Canada",
  },
  {
    id: "top-berlin",
    name: "Berlin",
    latitude: 52.52,
    longitude: 13.405,
    country: "Germany",
  },
  {
    id: "top-mumbai",
    name: "Mumbai",
    latitude: 19.076,
    longitude: 72.8777,
    country: "India",
  },
  {
    id: "top-rome",
    name: "Rome",
    latitude: 41.9028,
    longitude: 12.4964,
    country: "Italy",
  },
  {
    id: "top-seoul",
    name: "Seoul",
    latitude: 37.5665,
    longitude: 126.978,
    country: "South Korea",
  },
  {
    id: "top-amsterdam",
    name: "Amsterdam",
    latitude: 52.3676,
    longitude: 4.9041,
    country: "Netherlands",
  },
  {
    id: "top-abuja",
    name: "Abuja",
    latitude: 9.0765,
    longitude: 7.3986,
    country: "Nigeria",
  },
  {
    id: "top-accra",
    name: "Accra",
    latitude: 5.6037,
    longitude: -0.187,
    country: "Ghana",
  },
  {
    id: "top-nairobi",
    name: "Nairobi",
    latitude: -1.2921,
    longitude: 36.8219,
    country: "Kenya",
  },
  {
    id: "top-madrid",
    name: "Madrid",
    latitude: 40.4168,
    longitude: -3.7038,
    country: "Spain",
  },
  {
    id: "top-doha",
    name: "Doha",
    latitude: 25.2854,
    longitude: 51.531,
    country: "Qatar",
  },
];

export default function SearchPage() {
  const router = useRouter();

  // const theme = useAppStore((state) => state.theme);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const recentSearches = useAppStore(
    (state) => state.recentSearches,
  );
  const clearRecentSearches = useAppStore(
    (state) => state.clearRecentSearches,
  );
  const addRecentSearch = useAppStore(
    (state) => state.addRecentSearch,
  );

  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // const isDark = theme === "dark";
  const isSearching = query.trim().length >= 2;

  // Search Open-Meteo after the user pauses typing.
  useEffect(() => {
    const search = query.trim();
    const controller = new AbortController();

    if (search.length < 2) {
      return () => {
        controller.abort();
      };
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          name: search,
          count: "100",
          language: "en",
          format: "json",
        });

        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?${params}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("City search failed.");
        }

        const data: GeocodingResponse = await response.json();

        const results: CityOption[] = (data.results ?? [])
          .filter(
            (city) =>
              Number.isFinite(city.latitude) &&
              Number.isFinite(city.longitude),
          )
          .map((city) => ({
            id: String(city.id),
            name: city.name,
            latitude: city.latitude,
            longitude: city.longitude,
            country:
              city.country ?? city.country_code ?? "Unknown country",
            admin1: city.admin1 || undefined,
          }))
          .sort(
            (a, b) =>
              a.name.localeCompare(b.name) ||
              a.country.localeCompare(b.country),
          );

        setCities(results);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setCities([]);
        setError(
          "We couldn't search for cities. Check your connection and try again.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Open the existing City screen.
  function openCity(city: CityOption) {
    addRecentSearch(city);

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

  const visibleRecentSearches = hasHydrated
    ? recentSearches
    : [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Search header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background px-5 pb-5 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 border-border bg-surface px-4 py-3 transition-colors focus-within:border-accent">
            <Search
              size={21}
              className="shrink-0 text-muted"
            />

            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for a city..."
              aria-label="Search for a city"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted"
            />

            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="shrink-0 rounded-full p-1 text-muted transition hover:bg-background hover:text-foreground"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push("/home")}
            aria-label="Close search and return home"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition hover:scale-105 hover:bg-background"
          >
            <X size={23} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-10 pt-6">
        {/* LIVE SEARCH RESULTS */}
        {isSearching ? (
          <section>
            <h2 className="mb-4 text-lg font-bold">
              Search results
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-muted">
                <LoaderCircle className="h-6 w-6 animate-spin text-accent" />
                <span>Finding cities...</span>
              </div>
            ) : error ? (
              <div className="py-10 text-center">
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => setQuery((current) => `${current} `)}
                  className="mt-4 rounded-xl bg-accent px-4 py-2 font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            ) : cities.length === 0 ? (
              <div className="py-12 text-center">
                <MapPin
                  size={32}
                  className="mx-auto mb-3 text-muted"
                />
                <p className="font-semibold">No cities found</p>
                <p className="mt-1 text-sm text-muted">
                  Try another spelling or city name.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cities.map((city) => (
                  <button
                    type="button"
                    key={city.id}
                    onClick={() => openCity(city)}
                    className="flex w-full items-center gap-4 rounded-xl px-3 py-4 text-left transition hover:bg-surface active:scale-[0.99]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">
                      <MapPin
                        size={21}
                        className="text-muted"
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {city.name}
                      </span>

                      <span className="mt-1 block truncate text-sm text-muted">
                        {[city.admin1, city.country]
                          .filter(Boolean)
                          .filter(
                            (value, index, array) =>
                              array.indexOf(value) === index,
                          )
                          .join(", ")}
                      </span>
                    </span>

                    <ArrowUpLeft
                      size={19}
                      className="shrink-0 text-muted"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* RECENT SEARCHES: hidden when empty */}
            {visibleRecentSearches.length > 0 && (
              <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    Recent searches
                  </h2>

                  <Clock3 size={19} className="text-muted" />
                </div>
                <button onClick={clearRecentSearches}
                  className="text-muted mb-2">
                  Clear
                </button>

                <div className="divide-y divide-border">
                  {visibleRecentSearches.map((city) => (
                    <button
                      type="button"
                      key={city.id}
                      onClick={() => openCity(city)}
                      className="flex w-full items-center gap-4 rounded-xl px-3 py-4 text-left transition hover:bg-surface active:scale-[0.99]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">
                        <Clock3
                          size={20}
                          className="text-muted"
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {city.name}
                        </span>

                        <span className="mt-1 block truncate text-sm text-muted">
                          {[city.admin1, city.country]
                            .filter(Boolean)
                            .filter(
                              (value, index, array) =>
                                array.indexOf(value) === index,
                            )
                            .join(", ")}
                        </span>
                      </span>

                      <ArrowUpLeft
                        size={19}
                        className="shrink-0 text-muted"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* TOP CITIES */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Top cities</h2>

                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Popular destinations
                </span>
              </div>

              <div className="divide-y divide-border">
                {TOP_CITIES.map((city, index) => (
                  <button
                    type="button"
                    key={city.id}
                    onClick={() => openCity(city)}
                    className="flex w-full items-center gap-4 rounded-xl px-3 py-4 text-left transition hover:bg-surface active:scale-[0.99]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface font-bold text-muted">
                      {index + 1}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {city.name}
                      </span>

                      <span className="mt-1 block truncate text-sm text-muted">
                        {city.country}
                      </span>
                    </span>

                    <MapPin
                      size={19}
                      className="shrink-0 text-muted"
                    />
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        <p className="mt-8 text-center text-xs text-muted">
          Find a city. Discover its weather.
        </p>
      </div>
    </main>
  );
}
