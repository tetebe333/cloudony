import type { Coordinates } from "./weather";


export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GEOLOCATION_NOT_SUPPORTED"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        resolve(coordinates);
      },
      (error) => {
        reject(error);
      },
    );
  });
}


export function getLocationErrorMessage(error: unknown): string {
  if (error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location access was denied. Allow location access to see your local weather.";
      case error.POSITION_UNAVAILABLE:
        return "Your location is currently unavailable. Please try again.";
      case error.TIMEOUT:
        return "Finding your location took too long. Please try again.";
    }
  }

  if (error instanceof Error && error.message === "GEOLOCATION_NOT_SUPPORTED") {
    return "Your browser doesn't support location access. You can search for a city instead.";
  }

  return "We couldn't get your location. Please try again or search for a city.";
}
                                                
