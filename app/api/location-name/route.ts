
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return NextResponse.json(
      { error: "Invalid coordinates" },
      { status: 400 },
    );
  }

  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lon),
      zoom: "10",
      addressdetails: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      {
        headers: {
          "User-Agent": "CloudonyWeatherApp/1.0",
        },
        next: { revalidate: 86400 },
      },
    );

    if (!response.ok) {
      throw new Error("LOCATION_LOOKUP_FAILED");
    }

    const data = await response.json();
    const address = data.address ?? {};

    const city =
      address.city ??
      address.town ??
      address.village ??
      address.municipality ??
      address.county ??
      address.suburb ??
      address.state_district ??
      null;

    const country = address.country ?? null;

    if (!city && !country) {
      return NextResponse.json(
        { error: "Location name not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      city,
      country,
      name: [city, country].filter(Boolean).join(", "),
    });
  } catch (error) {
    console.error("Cloudony location lookup failed:", error);

    return NextResponse.json(
      { error: "Unable to find your location name" },
      { status: 502 },
    );
  }
}
