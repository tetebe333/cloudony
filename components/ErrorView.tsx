
"use client";

import { MapPin, RefreshCw, Search } from "lucide-react";

type ErrorViewProps = {
  message: string;
  onTryAgain: () => void;
  onAccessLocation?: () => void;
  onSearchCity?: () => void;
  showAccessLocation?: boolean;
};

export default function ErrorView({
  message,
  onTryAgain,
  onAccessLocation,
  onSearchCity,
  showAccessLocation = false,
}: ErrorViewProps) {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center px-5 py-12 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface">
        <MapPin className="h-10 w-10 text-accent" strokeWidth={1.8} />
      </div>

      <h2 className="text-xl font-bold">
        Something went wrong
      </h2>

      <p role="alert" className="mt-3 max-w-sm text-sm leading-6 text-muted">
        {message}
      </p>

      <div className="mt-7 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onTryAgain}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 font-semibold text-white transition hover:opacity-90"
        >
          <RefreshCw size={18} />
          Try Again
        </button>

        {showAccessLocation && onAccessLocation && (
          <button
            type="button"
            onClick={onAccessLocation}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border px-5 py-3 font-semibold transition hover:bg-surface"
          >
            <MapPin size={18} />
            Access Location
          </button>
        )}

        {onSearchCity && (
          <button
            type="button"
            onClick={onSearchCity}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border px-5 py-3 font-semibold transition hover:bg-surface"
          >
            <Search size={18} />
            Search for a City
          </button>
        )}
      </div>
    </section>
  );
}
