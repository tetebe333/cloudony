
"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";

export default function StoreHydration() {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    async function hydrateStore() {
      try {
        await useAppStore.persist.rehydrate();
      } catch (error) {
        console.error("Cloudony hydration failed:", error);
      } finally {
        useAppStore.setState({ hasHydrated: true });
      }
    }

    void hydrateStore();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
