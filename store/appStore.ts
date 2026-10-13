"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Coordinates } from "../lib/weather";

type Theme = "light" | "dark";


type City = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};



type AppState = {
  hasCompletedWelcome: boolean;
  theme: Theme;
  savedCities: City[];
  recentSearches: City[];
  lastKnownLocation: Coordinates | null;
  hasHydrated: boolean;

  setWelcomeCompleted: (completed: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLastKnownLocation: (coordinates: Coordinates) => void;
  addSavedCity: (city: City) => void;
  removeSavedCity: (id: string) => void;
  addRecentSearch: (city: City) => void;
  clearRecentSearches: () => void;
};


export const useAppStore = create<AppState>()(
  persist(
    
    (set) => ({
    hasCompletedWelcome: false,
    theme: "light",
    savedCities: [],
    recentSearches: [],
    lastKnownLocation: null,
    hasHydrated: false,

    setWelcomeCompleted: (completed) =>
        set({ hasCompletedWelcome: completed }),

    setTheme: (theme) => set({ theme }),

    toggleTheme: () =>
        set((state) => ({
        theme: state.theme === "light" ? "dark" : "light",
        })),

    setLastKnownLocation: (coordinates) =>
        set({ lastKnownLocation: coordinates }),

    addSavedCity: (city) =>
        set((state) => ({
        savedCities: state.savedCities.some(
            (savedCity) => savedCity.id === city.id,
        )
            ? state.savedCities
            : [...state.savedCities, city],
    })),

    clearRecentSearches: () => set({ recentSearches: [] }),

    removeSavedCity: (id) =>
        set((state) => ({
        savedCities: state.savedCities.filter(
            (city) => city.id !== id,
        ),
    })),

    addRecentSearch: (city) =>
        set((state) => ({
        recentSearches: [
            city,
            ...state.recentSearches.filter(
            (recentCity) => recentCity.id !== city.id,
            ),
        ].slice(0, 6),
        })),
    }),

    {
      name: "cloudony-storage",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true
    },
  ),
);

