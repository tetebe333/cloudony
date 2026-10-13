
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  X,
} from "lucide-react";

import { useAppStore } from "@/store/appStore";

type CityOption = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
};

type GeocodingResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  feature_code?: string;
};

type GeocodingResponse = {
  results?: GeocodingResult[];
};

export default function AddCityPage() {
  const router = useRouter();

  const savedCities = useAppStore((state) => state.savedCities);
  const addSavedCity = useAppStore((state) => state.addSavedCity);
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedCities, setSelectedCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  // Fetch results only when the user searches.
  // Never load the entire worldwide city dataset into the browser.

useEffect(() => {
  const search = query.trim();
  const controller = new AbortController();

  if (search.length < 2) {
    return () => {
      controller.abort();
    };
  }

  const timer = setTimeout(async () => {
    setLoading(true);
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
        throw new Error("City search is temporarily unavailable.");
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
          country: city.country ?? city.country_code ?? "Unknown country",
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
        "We couldn't load cities. Check your internet connection and try again.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, 350);

  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}, [query]);

  const selectedIds = useMemo(
    () => new Set(selectedCities.map((city) => city.id)),
    [selectedCities],
  );

  function isAlreadySaved(city: CityOption) {
    return savedCities.some(
      (saved) =>
        saved.name.trim().toLowerCase() ===
          city.name.trim().toLowerCase() &&
        (saved.country ?? "").trim().toLowerCase() ===
          city.country.trim().toLowerCase(),
    );
  }

  function toggleCity(city: CityOption) {
    if (isAlreadySaved(city)) return;

    setSelectedCities((current) => {
      if (current.some((item) => item.id === city.id)) {
        return current.filter((item) => item.id !== city.id);
      }

      return [...current, city];
    });

    setAdded(false);
  }

  function handleAddCities() {
    if (selectedCities.length === 0) return;

    selectedCities.forEach((city) => {
      if (!isAlreadySaved(city)) {
        addSavedCity({
          id: city.id,
          name: city.name,
          latitude: city.latitude,
          longitude: city.longitude,
          country: city.country,
          admin1: city.admin1,
        });
      }
    });

    setSelectedCities([]);
    setAdded(true);
  }

  if (!hasHydrated) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <LoaderCircle className="h-7 w-7 animate-spin text-accent" />
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-background">
        <div className=" flex w-full  items-center gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition hover:opacity-75"
          >
            <ArrowLeft size={21} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Add City
            </h1>
            <p className="mt-1 text-sm text-muted">
              Choose the places you want to follow.
            </p>
          </div>

          {selectedCities.length > 0 && (
            <span className="rounded-full bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent">
              {selectedCities.length} selected
            </span>
          )}
        </div>
      </header>

      {/* Search */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className=" w-full px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4">
            <Search size={20} className="shrink-0 text-muted" />

            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setAdded(false);
              }}
              placeholder="Search cities or countries..."
              aria-label="Search cities"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-background"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>
              {query.trim().length < 2
                ? "Search to discover cities"
                : `${cities.length} results`}
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      <section
        aria-label="City search results"
        aria-busy={loading}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className=" w-full px-4 py-2 sm:px-6">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted">
              <LoaderCircle
                size={30}
                className="animate-spin text-accent"
              />
              <p className="text-sm">Finding cities...</p>
            </div>
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <p className="font-semibold text-foreground">
                Search failed
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setQuery((value) => value + " ")}
                className="mt-4 rounded-xl bg-accent px-4 py-2.5 font-medium text-white"
              >
                Try again
              </button>
            </div>
          ) : query.trim().length < 2 ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-accent">
                <MapPin size={30} />
              </div>
              <h2 className="mt-4 text-lg font-semibold">
                Find your next city
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
                Enter at least two characters to find cities around the
                world. You can select multiple cities before adding them.
              </p>
            </div>
          ) : cities.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <MapPin size={34} className="text-muted" />
              <h2 className="mt-4 text-lg font-semibold">
                No cities found
              </h2>
              <p className="mt-1 text-sm text-muted">
                Try another spelling or search term.
              </p>
            </div>
          ) : (
            cities.map((city, index) => {
              const saved = isAlreadySaved(city);
              const selected = selectedIds.has(city.id);

              const currentLetter = city.name
                .charAt(0)
                .toLocaleUpperCase();

              const previousLetter =
                index > 0
                  ? cities[index - 1].name.charAt(0).toLocaleUpperCase()
                  : "";

              const showLetter = currentLetter !== previousLetter;

              return (
                <div key={city.id}>
                  {showLetter && (
                    <div className="sticky top-0 z-10 border-b border-border bg-background/95 py-2 text-xs font-bold uppercase tracking-widest text-muted backdrop-blur">
                      {currentLetter}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={saved}
                    onClick={() => toggleCity(city)}
                    className={`flex w-full items-center gap-3 border-b border-border/70 py-3.5 text-left transition ${
                      saved
                        ? "cursor-not-allowed opacity-40"
                        : "hover:bg-surface"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-accent text-white"
                          : "bg-surface text-muted"
                      }`}
                    >
                      {selected ? (
                        <Check size={21} strokeWidth={2.5} />
                      ) : (
                        <MapPin size={20} strokeWidth={1.7} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {city.name}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted">
                        {[city.admin1, city.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>

                    {saved ? (
                      <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-xs text-muted">
                        Saved
                      </span>
                    ) : selected ? (
                      <span className="shrink-0 text-xs font-medium text-accent">
                        Selected
                      </span>
                    ) : (
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-muted"
                      />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Fixed bottom action */}
      <footer className="shrink-0 border-t border-border bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex w-full  items-center gap-3 px-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {selectedCities.length === 0
                ? "Select cities"
                : `${selectedCities.length} ${
                    selectedCities.length === 1 ? "city" : "cities"
                  } selected`}
            </p>
            <p className="mt-1 text-xs text-muted">
              {added
                ? "Your cities have been saved."
                : "You can select multiple cities."}
            </p>
          </div>

          <button
            type="button"
            disabled={selectedCities.length === 0}
            onClick={handleAddCities}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 font-semibold text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
          >
            {added ? <Check size={19} /> : <Plus size={19} />}
            {added ? "Added" : "Add to Saved Cities"}
          </button>
        </div>
      </footer>
    </main>
  );
}
