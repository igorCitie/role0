/// <reference types="@types/google.maps" />
"use client";

import { useEffect, useRef, useState } from "react";
import { Box } from "@chakra-ui/react";
import type { NearbyEvent } from "@/lib/api/events";
import type { GeoPosition } from "@/hooks/useGeolocation";

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  // Base geometry
  { elementType: "geometry", stylers: [{ color: "#0b0b0f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0b0f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b80" }] },
  // Roads
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a24" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#12121a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1f1f2e" }] },
  // Water & parks (geometry only, no labels)
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#06060a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#12121a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0e1a0e" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1a1a24" }] },
  // --- Hide ALL POI labels/icons by default ---
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  // --- Show only bars / nightlife / restaurants / attractions ---
  { featureType: "poi.business", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
  { featureType: "poi.business", elementType: "labels.text", stylers: [{ visibility: "on" }, { color: "#9999bb" }] },
  { featureType: "poi.attraction", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
  { featureType: "poi.attraction", elementType: "labels.text", stylers: [{ visibility: "on" }, { color: "#9999bb" }] },
  // Hide transit clutter entirely
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#12121a" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
];

/** SVG pin for event markers — color driven by vacancy ratio */
function makeEventPin(vagasRestantes: number, capacidadeMaxima: number, titulo: string): string {
  const ratio = capacidadeMaxima > 0 ? vagasRestantes / capacidadeMaxima : 0;
  const color = ratio > 0.4 ? "#e03800" : ratio > 0.1 ? "#e07800" : "#555566";
  const letter = (titulo?.[0] ?? "R").toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <ellipse cx="20" cy="44" rx="6" ry="3" fill="rgba(0,0,0,0.35)"/>
      <path d="M20 2C11.2 2 4 9.2 4 18c0 10.5 16 28 16 28S36 28.5 36 18C36 9.2 28.8 2 20 2z" fill="${color}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
      <circle cx="20" cy="18" r="7" fill="rgba(0,0,0,0.3)"/>
      <text x="20" y="22" text-anchor="middle" font-size="10" fill="white" font-family="sans-serif" font-weight="bold">${letter}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Blue dot for user position */
const USER_PIN = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="9" fill="#4285F4" stroke="white" stroke-width="2"/>
    <circle cx="10" cy="10" r="4" fill="white"/>
  </svg>`)}`;

interface MapViewProps {
  events?: NearbyEvent[];
  userPosition?: GeoPosition | null;
  onEventClick?: (eventId: string) => void;
}

export default function MapView({ events = [], userPosition, onEventClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const geocodeCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const [positioned, setPositioned] = useState<Array<NearbyEvent & { lat: number; lng: number }>>([]);

  /** Geocode events that lack coordinates using the Google Maps Geocoder. Results are cached by address. */
  async function geocodeEvents(evts: NearbyEvent[]) {
    if (!evts.length || typeof google === "undefined") return;
    const geocoder = new google.maps.Geocoder();
    const results = await Promise.all(
      evts.map(async (ev): Promise<(NearbyEvent & { lat: number; lng: number }) | null> => {
        // Prefer explicit coordinates if the API ever returns them
        if (ev.latitude != null && ev.longitude != null) {
          return { ...ev, lat: ev.latitude, lng: ev.longitude };
        }
        const key = ev.enderecoLegivel;
        if (geocodeCache.current.has(key)) {
          return { ...ev, ...geocodeCache.current.get(key)! };
        }
        try {
          const { results: geo } = await geocoder.geocode({ address: key });
          if (geo[0]) {
            const loc = geo[0].geometry.location;
            const pos = { lat: loc.lat(), lng: loc.lng() };
            geocodeCache.current.set(key, pos);
            return { ...ev, ...pos };
          }
        } catch { /* geocoding failed for this event */ }
        return null;
      }),
    );
    setPositioned(
      results.filter((r): r is NearbyEvent & { lat: number; lng: number } => r !== null),
    );
  }

  function initMap() {
    if (!containerRef.current || mapRef.current) return;
    const center = userPosition ?? { lat: -23.5505, lng: -46.6333 };
    mapRef.current = new google.maps.Map(containerRef.current, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      styles: DARK_STYLE,
      backgroundColor: "#0b0b0f",
    });
    // Geocode whatever events are already available; useEffect([events]) handles later arrivals
    geocodeEvents(events);
  }

  function renderOverlays() {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers and heatmap
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    heatmapRef.current?.setMap(null);

    // Heatmap — weight by inverse of remaining vacancies (fuller = hotter)
    if (positioned.length > 0 && google.maps.visualization) {
      const heatData = positioned.map((ev) => ({
        location: new google.maps.LatLng(ev.lat, ev.lng),
        weight: Math.max(1, 10 - ev.vagasRestantes),
      }));
      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatData,
        map,
        radius: 60,
        opacity: 0.55,
        gradient: [
          "rgba(0,0,0,0)",
          "rgba(224,56,0,0.4)",
          "rgba(224,56,0,0.7)",
          "rgba(224,56,0,1)",
        ],
      });
    }

    // Event pin markers
    positioned.forEach((ev, i) => {
      const capacidade = parseInt(ev.ocupacao.split("/")[1] ?? "1");
      // Tiny jitter so stacked markers (same address) don't perfectly overlap
      const jitter = 0.00005;
      const lat = ev.lat + (i % 3 - 1) * jitter;
      const lng = ev.lng + (Math.floor(i / 3) % 3 - 1) * jitter;
      const marker = new google.maps.Marker({
        map,
        position: { lat, lng },
        icon: {
          url: makeEventPin(ev.vagasRestantes, capacidade, ev.titulo),
          scaledSize: new google.maps.Size(40, 48),
          anchor: new google.maps.Point(20, 48),
        },
        title: ev.titulo,
      });
      marker.addListener("click", () => onEventClick?.(ev.id));
      markersRef.current.push(marker);
    });

    // User position dot
    if (userPosition) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setPosition(userPosition);
      } else {
        userMarkerRef.current = new google.maps.Marker({
          map,
          position: userPosition,
          icon: {
            url: USER_PIN,
            scaledSize: new google.maps.Size(20, 20),
            anchor: new google.maps.Point(10, 10),
          },
          zIndex: 999,
        });
      }
      map.panTo(userPosition);
    }
  }

  // Geocode whenever the events list changes (google may or may not be ready yet)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { geocodeEvents(events); }, [events]);

  // Re-render markers whenever geocoded positions or user position change
  useEffect(() => {
    if (mapRef.current) renderOverlays();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positioned, userPosition]);

  // Wait for the globally loaded Google Maps script (layout.tsx)
  useEffect(() => {
    if (typeof google !== "undefined") { initMap(); return; }
    const id = setInterval(() => {
      if (typeof google !== "undefined") { clearInterval(id); initMap(); }
    }, 100);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Box ref={containerRef} w="full" h="full" />;
}
