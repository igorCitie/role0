"use client";

import { useEffect, useState } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
}

export interface GeolocationState {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ position: null, error: "Geolocalização não suportada.", loading: false });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setState({
          position: { lat: coords.latitude, lng: coords.longitude },
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState({
          position: null,
          error: err.message,
          loading: false,
        });
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
