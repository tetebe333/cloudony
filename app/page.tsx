
"use client";

import Image from "next/image";
import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { getCurrentLocation, getLocationErrorMessage } from "@/lib/geolocation";
import { useRouter } from "next/navigation";



export default function Home() {
  const [isStarting, setIsStarting] = useState(false);

  const router = useRouter();

  const setWelcomeCompleted = useAppStore(
    (state) => state.setWelcomeCompleted,
  );

  const setLastKnownLocation = useAppStore(
    (state) => state.setLastKnownLocation,
  );
  const theme = useAppStore((state) => state.theme);



  
async function handleStart() {
  setIsStarting(true);

  try {
    const coordinates = await getCurrentLocation();

    console.log("📍 User coordinates:", coordinates);

    setLastKnownLocation(coordinates);
  } catch (error) {
    // Permission denied or location unavailable must not block navigation.
    console.error("Cloudony could not get the location:", error);
    console.log(getLocationErrorMessage(error));
  } finally {
    // Always continue to Home, even if location access was denied.
    setWelcomeCompleted(true);
    router.replace("/home");
    setIsStarting(false);
  }
}


  return (
    <div>
      <div className="min-h-100 shadow-2xl flex justify-center items-center bg-linear-to-b from-blue-300 to-blue-600 rounded-b-4xl w-full">
        <Image
          src="/welcom-icon.png"
          alt="Cloudony welcome cloud"
          width={400}
          height={250}
          priority
        />
      </div>

      <div className="flex flex-col justify-center text-center items-center py-20">
       <h1 className="cloudony-title text-3xl font-bold">
          Cloudony
        </h1>

        <p style={{
                color: theme === "light" ? '#6D7789' : '#b5bdc4'
              }}
             className="text-sm font-medium">
          Weather, at a glance.
        </p>

        <button
         disabled={isStarting}
          className="shadow-2xl bg-blue-500 py-2 mt-5 px-3 text-sm rounded-2xl text-white"
          onClick={handleStart}
        >
          {isStarting ? "SETTING THINGS UP..." : "Get Started"}
        </button>

      </div>
    </div>
  );
}
